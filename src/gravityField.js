/**
 * Gravitational fields, potentials and the energetics that follow from
 * them — a general-purpose physics engine, not tied to any one page.
 * An A-level-reaching extension of the GCSE orbital mechanics already
 * covered by src/orbitalMechanics.js (Kepler's laws, vis-viva, escape
 * speed) and src/gravitySim.js (the RK4 trajectory integrator): this
 * module is where "why" those formulas work — the field they come
 * from, and what you can build out of it — lives.
 *
 * Reuses rather than re-derives wherever another src/ module already
 * has the thing: G, Earth's mass/radius and escapeSpeed() come from
 * OrbitalMechanics; the RK4 stepper and specific-energy function
 * (simulateRK4EnergyDrift below) come from GravitySim, rather than
 * this module integrating a trajectory a second way; and
 * tidalEffectRatio's Sun/Moon worked case is checked directly against
 * Tides.sunToMoonTideRatio() rather than quietly recomputing its own,
 * possibly-drifted, copy (see test/gravityField.test.js).
 *
 * Units throughout: metres, seconds, kilograms, joules per kilogram for
 * specific (per-unit-mass) energy and potential — plain SI, like
 * GravitySim and OrbitalMechanics' own general functions. A "body" is
 * always { mass, x, y }; a "point" is always { x, y }.
 *
 * Built in five layers, in the order the file is written:
 *   1. A single point mass: field, potential, potential energy, and
 *      the potential difference between two radii found by actually
 *      numerically integrating g(r) — "area under the g-r graph" — not
 *      just quoting the closed form.
 *   2. Superposition: any number of bodies' combined field and
 *      potential, field-line tracing, zero-field points, and an
 *      equipotential contour sampler.
 *   3. Orbital energetics: kinetic/potential/total specific energy,
 *      the bound/parabolic/hyperbolic classifier, escape speed derived
 *      independently from the energy balance (then checked against
 *      OrbitalMechanics.escapeSpeed), and the energy cost of moving
 *      between circular orbits.
 *   4. Extended bodies (A-level extension, beyond the GCSE spec): the
 *      field inside and outside a uniform sphere — the shell theorem.
 *   5. The rotating frame (also A-level extension): the effective
 *      potential, the collinear Lagrange points (found numerically,
 *      not by quoting their approximate formulas) and the equilateral
 *      L4/L5 points with their stability condition, the Hill radius,
 *      the fluid Roche limit, and a gas's RMS-related thermal speed.
 */
function makeGravityField(OrbitalMechanics, GravitySim, Tides) {
  const { G } = OrbitalMechanics;

  // --- Layer 1: a single point mass ---------------------------------------

  // g(r) = GM/r², the field's magnitude at distance r from a point mass.
  function fieldMagnitude(mass, r) {
    return (G * mass) / (r * r);
  }

  // The field vector at (x, y) due to a point mass sitting at the
  // origin — gravity always attracts, so it points back towards the
  // origin, with magnitude fieldMagnitude(mass, r).
  function fieldVector(mass, x, y) {
    const r = Math.hypot(x, y);
    const mag = fieldMagnitude(mass, r);
    return { x: r === 0 ? 0 : (-mag * x) / r, y: r === 0 ? 0 : (-mag * y) / r, magnitude: mag };
  }

  // V(r) = -GM/r. Zero at infinity, negative everywhere else (gravity is
  // always attractive, so a free mass's potential energy is always lower
  // than it would be arbitrarily far away).
  function potential(mass, r) {
    return -(G * mass) / r;
  }

  function potentialEnergy(mass, testMass, r) {
    return testMass * potential(mass, r);
  }

  // The potential difference V(r2) - V(r1), found the way the exam-level
  // "area under the g-r graph" idea actually means: numerically
  // integrating g(r) dr from r1 to r2 (trapezoidal rule, log-spaced
  // sample points, since g varies over orders of magnitude when r1 and
  // r2 are very different) — not just evaluating -GM/r at each end and
  // subtracting. Works for r2 > r1 or r2 < r1; the sign comes out right
  // either way.
  function potentialDifferenceNumerical(mass, r1, r2, steps) {
    const n = steps || 1000;
    const lo = Math.min(r1, r2);
    const hi = Math.max(r1, r2);
    const logLo = Math.log(lo);
    const logHi = Math.log(hi);
    const dLog = (logHi - logLo) / n;
    let integral = 0;
    let prevR = lo;
    let prevG = fieldMagnitude(mass, lo);
    for (let i = 1; i <= n; i += 1) {
      const r = Math.exp(logLo + i * dLog);
      const g = fieldMagnitude(mass, r);
      integral += 0.5 * (g + prevG) * (r - prevR);
      prevR = r;
      prevG = g;
    }
    return r2 >= r1 ? integral : -integral;
  }

  function potentialEnergyDifferenceNumerical(mass, testMass, r1, r2, steps) {
    return testMass * potentialDifferenceNumerical(mass, r1, r2, steps);
  }

  // The field's own signed radial value: negative everywhere, since r is
  // measured outward and gravity always pulls inward. Same magnitude as
  // fieldMagnitude above — this is that number with its sign restored,
  // for anywhere a page needs to show (and a student needs to read) the
  // minus sign explicitly, rather than a magnitude plus a word like
  // "inward".
  function radialField(mass, r) {
    return -(G * mass) / (r * r);
  }

  // Same idea for force: negative (inward), and proportional to the
  // test mass like any force is.
  function radialForce(mass, testMass, r) {
    return testMass * radialField(mass, r);
  }

  // Radii at n equally-spaced steps of potential, starting one step
  // below zero (the convention: V = 0 only at infinity) and getting
  // deeper by exactly deltaV each step: V_i = -i * deltaV, so
  // r_i = GM / (i * deltaV), from V = -GM/r. Used for drawing
  // concentric equipotential circles at equal energy cost between any
  // two neighbours, rather than equal steps in r (where the energy
  // cost between neighbours shrinks the further out you go).
  function equipotentialRadii(mass, deltaV, n) {
    const steps = [];
    for (let i = 1; i <= n; i += 1) {
      const potentialValue = -i * deltaV;
      steps.push({ step: i, potential: potentialValue, radius: (G * mass) / (i * deltaV) });
    }
    return steps;
  }

  // The work gravity itself does on a unit mass moving from r1 to r2 —
  // built from the same numerical integration of g(r) as
  // potentialDifferenceNumerical above, since work done by the field =
  // -ΔV for a unit mass. Positive when the move is inward (r2 < r1, the
  // field pulling the same way the mass moves), negative when it's
  // outward.
  //
  // Defaults to 2000 steps, not potentialDifferenceNumerical's own 1000,
  // when the caller doesn't say — a "from very far away" move (r1 or r2
  // many orders of magnitude from the other) is exactly this function's
  // own use case (see workByExternalAgent's doc comment and
  // test/gravityField.test.js), and 1000 steps isn't quite enough to
  // hold the trapezoidal rule's error under 1e-4 relative across that
  // wide a range. A caller integrating over a "nearby" range can still
  // pass an explicit, smaller steps if it wants to.
  function workByField(mass, r1, r2, steps) {
    return -potentialDifferenceNumerical(mass, r1, r2, steps || 2000);
  }

  // The work an external agent must do moving a unit mass from r1 to r2
  // at constant speed — holding it back against the field on the way
  // in, or hauling it up against the field on the way out — exactly the
  // field's own work, reversed, since together they leave kinetic
  // energy unchanged (that's what "constant speed" means here).
  // Inherits workByField's own 2000-step default for the same reason.
  function workByExternalAgent(mass, r1, r2, steps) {
    return -workByField(mass, r1, r2, steps);
  }

  // The work an external agent does moving a mass of testMass along an
  // arbitrary 2D polyline (points, each {x, y}, relative to a mass
  // sitting at the origin), at constant speed throughout — the general,
  // non-radial version of workByExternalAgent above, found the direct
  // way: numerically walking each segment and summing (agent force) ·
  // (displacement) along it, rather than taking a shortcut through the
  // closed-form potential. Confirms, rather than assumes, that gravity
  // is conservative: a straight path and a zigzag one between the same
  // two endpoints come out equal (see test/gravityField.test.js), and
  // a path that stays on one equipotential (constant distance from the
  // origin) comes out at zero.
  //
  // At each sampled point, the field pulls the mass inward (fieldVector
  // above); the external agent, holding it at constant speed, supplies
  // exactly the opposite force. Positive work means the agent is
  // pushing the mass further from the origin than it would otherwise
  // go (net outward motion); negative means gravity is doing the work
  // instead, and the agent is only holding it back.
  function workAlongPath(mass, testMass, points, stepsPerSegment) {
    const steps = stepsPerSegment || 200;
    let work = 0;
    for (let seg = 1; seg < points.length; seg += 1) {
      const a = points[seg - 1];
      const b = points[seg];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      if (dx === 0 && dy === 0) continue;
      for (let s = 0; s < steps; s += 1) {
        const t0 = s / steps;
        const t1 = (s + 1) / steps;
        const midX = a.x + dx * (t0 + t1) / 2;
        const midY = a.y + dy * (t0 + t1) / 2;
        const field = fieldVector(mass, midX, midY);
        const agentForceX = -testMass * field.x;
        const agentForceY = -testMass * field.y;
        work += agentForceX * (dx / steps) + agentForceY * (dy / steps);
      }
    }
    return work;
  }

  // ∫[r0, ∞) g(r) dr = GM/r0 exactly, for a true inverse-square field —
  // but found here by actually integrating: log-spaced steps out to a
  // very large but finite rMax (numerically, same trapezoidal rule as
  // potentialDifferenceNumerical), plus the analytic tail beyond rMax
  // (∫[rMax, ∞) g dr = GM/rMax, exact because the field stays exactly
  // inverse-square out there too — only the *finite* part below rMax is
  // where truncation/step error could creep in, and log-spaced steps
  // keep that negligible without needing an absurd step count).
  function integrateFieldToInfinity(mass, r0, options) {
    const steps = (options && options.steps) || 2000;
    const rMaxFactor = (options && options.rMaxFactor) || 1e8;
    const rMax = r0 * rMaxFactor;
    const analyticTail = fieldMagnitude(mass, rMax) * rMax;
    return potentialDifferenceNumerical(mass, r0, rMax, steps) + analyticTail;
  }

  // --- Layer 2: superposition of any number of bodies ---------------------

  function fieldVectorAt(bodies, point) {
    let gx = 0;
    let gy = 0;
    bodies.forEach((body) => {
      const dx = body.x - point.x;
      const dy = body.y - point.y;
      const r = Math.hypot(dx, dy);
      if (r === 0) return;
      const mag = fieldMagnitude(body.mass, r);
      gx += (mag * dx) / r;
      gy += (mag * dy) / r;
    });
    return { x: gx, y: gy, magnitude: Math.hypot(gx, gy) };
  }

  function potentialAt(bodies, point) {
    return bodies.reduce((sum, body) => {
      const dx = body.x - point.x;
      const dy = body.y - point.y;
      const r = Math.hypot(dx, dy);
      return r === 0 ? sum : sum + potential(body.mass, r);
    }, 0);
  }

  // Follows the field's own direction from a starting point — the path
  // a free particle's *acceleration* points along at each point, not a
  // simulated trajectory (no velocity/momentum here, see
  // simulateRK4EnergyDrift below for that) — step by step, renormalising
  // the direction each step, until it's captured by a body or runs out
  // of steps. A midpoint (RK2) step, not GravitySim's full RK4: this is
  // tracing a different kind of curve (direction field, not an orbit
  // under momentum) for a diagram, where that's plenty accurate.
  // direction: 1 follows the field (the way a dropped mass falls), -1
  // traces back against it.
  function traceFieldLine(bodies, start, options) {
    const stepSize = (options && options.stepSize) || 1e5;
    const maxSteps = (options && options.maxSteps) || 1000;
    const captureRadius = (options && options.captureRadius) || stepSize;
    const direction = (options && options.direction) === -1 ? -1 : 1;

    function unitField(p) {
      const f = fieldVectorAt(bodies, p);
      if (f.magnitude === 0) return null;
      return { x: (direction * f.x) / f.magnitude, y: (direction * f.y) / f.magnitude };
    }

    let point = { x: start.x, y: start.y };
    const points = [point];
    for (let i = 0; i < maxSteps; i += 1) {
      const u1 = unitField(point);
      if (!u1) break;
      const mid = { x: point.x + (u1.x * stepSize) / 2, y: point.y + (u1.y * stepSize) / 2 };
      const u2 = unitField(mid) || u1;
      point = { x: point.x + u2.x * stepSize, y: point.y + u2.y * stepSize };
      points.push(point);
      if (bodies.some((b) => Math.hypot(point.x - b.x, point.y - b.y) < captureRadius)) break;
    }
    return points;
  }

  // Exact for exactly two bodies: the point between them (on the side
  // nearer the lighter one) where their fields cancel, from
  // GM_A/r1² = GM_B/r2² and r1 + r2 = separation.
  function zeroFieldPointBetween(bodyA, bodyB) {
    const dx = bodyB.x - bodyA.x;
    const dy = bodyB.y - bodyA.y;
    const d = Math.hypot(dx, dy);
    const k = Math.sqrt(bodyA.mass / bodyB.mass); // r1/r2, from A's side
    const r1 = (k * d) / (1 + k);
    const t = r1 / d;
    return { x: bodyA.x + t * dx, y: bodyA.y + t * dy, distanceFromA: r1, distanceFromB: d - r1 };
  }

  // General N-body zero-field finder: 2D Newton-Raphson on the field
  // vector, with a numerically estimated Jacobian (central enough for a
  // smooth field away from the bodies themselves) — for configurations
  // zeroFieldPointBetween's two-body shortcut doesn't cover, or as a
  // numerical cross-check of it (see test/gravityField.test.js).
  function findFieldZero(bodies, initialGuess, options) {
    const maxIter = (options && options.maxIter) || 100;
    const tol = (options && options.tol) || 1e-6;
    const h = (options && options.h) || 1;
    let p = { x: initialGuess.x, y: initialGuess.y };
    for (let iter = 0; iter < maxIter; iter += 1) {
      const f = fieldVectorAt(bodies, p);
      if (f.magnitude < tol) break;
      const fx1 = fieldVectorAt(bodies, { x: p.x + h, y: p.y });
      const fy1 = fieldVectorAt(bodies, { x: p.x, y: p.y + h });
      const j11 = (fx1.x - f.x) / h;
      const j12 = (fy1.x - f.x) / h;
      const j21 = (fx1.y - f.y) / h;
      const j22 = (fy1.y - f.y) / h;
      const det = j11 * j22 - j12 * j21;
      if (Math.abs(det) < 1e-30) break;
      const dx = (j22 * f.x - j12 * f.y) / det;
      const dy = (j11 * f.y - j21 * f.x) / det;
      p = { x: p.x - dx, y: p.y - dy };
    }
    return p;
  }

  // Samples points on the equipotential through potential value
  // targetPotential: for each of angleSteps directions from center,
  // bisects along that ray for the radius where potentialAt() hits the
  // target. A sampler, not a certified-robust contourer — assumes the
  // potential increases monotonically with distance from center along
  // each ray, true for any sensible center near/between the bodies.
  function equipotentialContour(bodies, center, targetPotential, angleSteps, options) {
    const steps = angleSteps || 72;
    const minR = (options && options.minR) || 1;
    const maxR = (options && options.maxR) || 1e13;
    const iterations = (options && options.iterations) || 60;

    const points = [];
    for (let i = 0; i < steps; i += 1) {
      const theta = (2 * Math.PI * i) / steps;
      const dirX = Math.cos(theta);
      const dirY = Math.sin(theta);
      let rLo = minR;
      let rHi = maxR;
      for (let iter = 0; iter < iterations; iter += 1) {
        const rMid = (rLo + rHi) / 2;
        const v = potentialAt(bodies, { x: center.x + rMid * dirX, y: center.y + rMid * dirY });
        if (v < targetPotential) rLo = rMid;
        else rHi = rMid;
      }
      const r = (rLo + rHi) / 2;
      points.push({ x: center.x + r * dirX, y: center.y + r * dirY });
    }
    return points;
  }

  // --- Layer 3: orbital energetics ----------------------------------------

  function kineticEnergyPerMass(speed) {
    return 0.5 * speed * speed;
  }

  // Same quantity as potential() above — named for this layer's own
  // "kinetic / potential / total" grouping rather than introduced twice.
  function potentialEnergyPerMass(mass, r) {
    return potential(mass, r);
  }

  function totalEnergyPerMass(mass, r, speed) {
    return kineticEnergyPerMass(speed) + potentialEnergyPerMass(mass, r);
  }

  // Negative total energy: bound (circular/elliptical — can't reach
  // infinity). Around zero (within tolerance): parabolic, the marginal
  // escape case. Positive: hyperbolic, unbound with speed to spare at
  // infinity.
  //
  // A "zero" total energy computed from a real speed (e.g. at
  // escapeSpeed()) essentially never lands on exactly 0 in floating
  // point, so the parabolic case is a window around zero, not an exact
  // match. tolerance is optional and, left out, defaults to a relative
  // 1e-6 of the magnitude of the potential energy at that point
  // (potentialEnergyPerMassValue) — the natural scale total energy is
  // being compared against zero on. Leaving out potentialEnergyPerMassValue
  // too (as the plain sentinel values -1/0/1 do) falls back to an exact
  // zero check, same as before.
  function classifyOrbit(totalEnergyPerMassValue, potentialEnergyPerMassValue, tolerance) {
    const parabolicTolerance =
      tolerance !== undefined ? tolerance : potentialEnergyPerMassValue !== undefined ? 1e-6 * Math.abs(potentialEnergyPerMassValue) : 0;
    if (totalEnergyPerMassValue < -parabolicTolerance) return 'bound';
    if (totalEnergyPerMassValue > parabolicTolerance) return 'hyperbolic';
    return 'parabolic';
  }

  // Derived independently from the energy balance (set totalEnergyPerMass
  // to zero and solve for speed), not by calling OrbitalMechanics at all
  // — test/gravityField.test.js checks the two agree, which is the point:
  // the same physical escape speed, arrived at two different ways.
  function escapeSpeedFromEnergy(mass, r) {
    return Math.sqrt((2 * G * mass) / r);
  }

  // A circular orbit's own kinetic/potential/total specific energy,
  // reusing OrbitalMechanics.circularOrbitSpeed for v rather than
  // re-deriving v = √(GM/r) a second time.
  function circularOrbitEnergetics(mass, r) {
    const speed = OrbitalMechanics.circularOrbitSpeed(r, mass);
    const kinetic = kineticEnergyPerMass(speed);
    const potentialValue = potentialEnergyPerMass(mass, r);
    return { speed, kinetic, potential: potentialValue, total: kinetic + potentialValue };
  }

  // The (specific) energy cost of moving a body from one circular orbit
  // to another — positive if r2 is the higher, less-bound orbit.
  function orbitalEnergyChange(mass, r1, r2) {
    return circularOrbitEnergetics(mass, r2).total - circularOrbitEnergetics(mass, r1).total;
  }

  // Reuses GravitySim's own RK4 stepper and specific-energy function
  // directly — rather than this module integrating a second orbital
  // trajectory its own way — to check how much the integrator's
  // conserved total energy actually drifts over a run, around a single
  // central mass at the origin (GravitySim's own convention).
  function simulateRK4EnergyDrift(mass, initialState, dt, steps) {
    let state = { x: initialState.x, y: initialState.y, vx: initialState.vx, vy: initialState.vy };
    const GM = G * mass;
    const initialEnergy = GravitySim.specificEnergy(state, GM);
    let maxRelativeDrift = 0;
    for (let i = 0; i < steps; i += 1) {
      state = GravitySim.rk4Step(state, dt, GM);
      const energy = GravitySim.specificEnergy(state, GM);
      const relativeDrift = Math.abs((energy - initialEnergy) / initialEnergy);
      if (relativeDrift > maxRelativeDrift) maxRelativeDrift = relativeDrift;
    }
    return { finalState: state, initialEnergy, maxRelativeDrift };
  }

  // --- Layer 4: extended bodies (A-level extension, beyond the GCSE spec) -

  // Outside a uniform sphere, gravity behaves exactly as if all its mass
  // were a point at the centre — the shell theorem's first half.
  function fieldOutsideUniformSphere(mass, radius, r) {
    return fieldMagnitude(mass, Math.max(r, radius));
  }

  // Inside a uniform sphere, only the mass *within* radius r pulls on
  // you (the shells outside contribute exactly zero net field — the
  // shell theorem's second half), and since that enclosed mass itself
  // grows as r³ for uniform density, the field inside ends up simply
  // proportional to r, reaching the surface value exactly at r = radius.
  function fieldInsideUniformSphere(mass, radius, r) {
    return (G * mass * r) / (radius * radius * radius);
  }

  // The shell theorem in one function: point-mass-equivalent outside,
  // linear-in-r inside, continuous (not just close) at the surface.
  function shellTheoremField(mass, radius, r) {
    return r >= radius ? fieldOutsideUniformSphere(mass, radius, r) : fieldInsideUniformSphere(mass, radius, r);
  }

  // --- Layer 5: the rotating frame (A-level extension, beyond the GCSE spec) -

  // The angular speed of two bodies mutually orbiting their common
  // barycentre — Kepler's third law in its general, any-central-mass
  // form (see OrbitalMechanics.periodFromSemiMajorAxis), restated as ω.
  function restrictedThreeBodyOmega(largerMass, smallerMass, separation) {
    return Math.sqrt((G * (largerMass + smallerMass)) / Math.pow(separation, 3));
  }

  // Barycentre-centred positions of the two bodies along the x-axis —
  // the standard reduced coordinates the rest of this layer builds on.
  function restrictedThreeBodyPositions(largerMass, smallerMass, separation) {
    const totalMass = largerMass + smallerMass;
    return {
      xLarger: -(smallerMass / totalMass) * separation,
      xSmaller: (largerMass / totalMass) * separation,
    };
  }

  // The effective potential in a frame rotating with the two bodies:
  // the ordinary (superposed) gravitational potential, minus the
  // centrifugal term ½ω²ρ² (ρ = distance from the rotation axis, taken
  // through the origin — so bodies/points here should already be in
  // barycentre-centred coordinates, as restrictedThreeBodyPositions
  // gives). A free particle at rest in the rotating frame feels no net
  // force exactly where this potential's gradient is zero — the
  // Lagrange points below are found as exactly that.
  function effectivePotential(bodies, omega, point) {
    const rho2 = point.x * point.x + point.y * point.y;
    return potentialAt(bodies, point) - 0.5 * omega * omega * rho2;
  }

  // The Hill radius: the approximate distance from the smaller body
  // within which its own gravity (plus the rotating frame) dominates
  // the larger body's — also a good initial guess for L1/L2 below,
  // since both sit close to it.
  function hillRadius(largerMass, smallerMass, separation) {
    return separation * Math.cbrt(smallerMass / (3 * largerMass));
  }

  // L1, L2 and L3: found numerically, not by quoting their approximate
  // formulas. Along the line through both bodies, in the rotating
  // frame, the net acceleration (gravity from both bodies plus the
  // centrifugal term) is a well-behaved function of position with a
  // singularity at each body and a sign change either side of each
  // Lagrange point — solved here by Newton-Raphson, using the analytic
  // derivative of that same acceleration, starting from the Hill-radius
  // approximation for L1/L2 and one separation beyond the larger body
  // for L3.
  function collinearLagrangePoints(largerMass, smallerMass, separation) {
    const { xLarger, xSmaller } = restrictedThreeBodyPositions(largerMass, smallerMass, separation);
    const omega = restrictedThreeBodyOmega(largerMass, smallerMass, separation);
    const omega2 = omega * omega;

    function acceleration(x) {
      const d1 = x - xLarger;
      const d2 = x - xSmaller;
      const s1 = d1 === 0 ? 1 : Math.sign(d1);
      const s2 = d2 === 0 ? 1 : Math.sign(d2);
      return (-G * largerMass * s1) / (d1 * d1) - (G * smallerMass * s2) / (d2 * d2) + omega2 * x;
    }
    function accelerationDerivative(x) {
      const d1 = x - xLarger;
      const d2 = x - xSmaller;
      return (2 * G * largerMass) / Math.pow(Math.abs(d1), 3) + (2 * G * smallerMass) / Math.pow(Math.abs(d2), 3) + omega2;
    }
    function solve(x0) {
      let x = x0;
      for (let i = 0; i < 60; i += 1) {
        x -= acceleration(x) / accelerationDerivative(x);
      }
      return x;
    }

    const hill = hillRadius(largerMass, smallerMass, separation);
    const describe = (x) => ({ x, distanceFromLarger: Math.abs(x - xLarger), distanceFromSmaller: Math.abs(x - xSmaller) });

    return {
      L1: describe(solve(xSmaller - hill)),
      L2: describe(solve(xSmaller + hill)),
      L3: describe(solve(xLarger - separation)),
      xLarger,
      xSmaller,
      omega,
    };
  }

  // L4 and L5: the two points forming an equilateral triangle with the
  // two bodies — pure geometry (side length = separation), independent
  // of the mass ratio. The mass ratio decides only whether they're
  // *stable*, not where they are.
  function equilateralLagrangePoints(largerMass, smallerMass, separation) {
    const { xLarger, xSmaller } = restrictedThreeBodyPositions(largerMass, smallerMass, separation);
    const midX = (xLarger + xSmaller) / 2;
    const height = (separation * Math.sqrt(3)) / 2;
    return { L4: { x: midX, y: height }, L5: { x: midX, y: -height } };
  }

  // Routh's criterion for L4/L5's linear stability: writing μ = (smaller
  // mass) / (total mass), they're stable iff μ < ½(1 - √(23/27)). Returned
  // here as the equivalent larger-mass/smaller-mass ratio threshold
  // (≈24.96, "about 25") since that's the more usual way this is quoted.
  function lagrangeStabilityMassRatioThreshold() {
    const muCrit = (1 - Math.sqrt(23 / 27)) / 2;
    return (1 - muCrit) / muCrit;
  }

  function isEquilateralPointStable(largerMass, smallerMass) {
    return largerMass / smallerMass > lagrangeStabilityMassRatioThreshold();
  }

  // The fluid Roche limit: how close a self-gravitating, fluid satellite
  // can orbit a primary of radius primaryRadius before the primary's
  // tidal effect (stretching the satellite faster than the satellite's
  // own gravity can hold it together) pulls it apart.
  function fluidRocheLimit(primaryRadius, primaryDensity, satelliteDensity) {
    return 2.44 * primaryRadius * Math.cbrt(primaryDensity / satelliteDensity);
  }

  // Generalises tides.js's Sun/Moon-specific ratio to any two bodies at
  // any distances from a shared third body — (mass/distance³) is
  // exactly the scaling tides.js's own sunToMoonTideRatio uses, just
  // not exposed there as a reusable, parameterised function. See
  // test/gravityField.test.js for the check that this, evaluated at
  // the Sun and Moon's own figures, reproduces Tides.sunToMoonTideRatio()
  // exactly, rather than silently drifting from it.
  function tidalEffectRatio(mass1, distance1, mass2, distance2) {
    return (mass1 / mass2) * Math.pow(distance2 / distance1, 3);
  }

  // Re-exported directly from tides.js, not recomputed — the one number
  // that module already is the source of truth for.
  function sunMoonTidalRatio() {
    return Tides.sunToMoonTideRatio();
  }

  // Standard SI values (2019 redefinition), not on the exam data sheet —
  // only used by thermalSpeed below, an A-level-reaching extension.
  const BOLTZMANN_CONSTANT = 1.380649e-23; // J/K
  const AVOGADRO_CONSTANT = 6.02214076e23; // per mol

  function molarMassToMoleculeMass(molarMassKgPerMol) {
    return molarMassKgPerMol / AVOGADRO_CONSTANT;
  }

  // The RMS-derived thermal speed of a gas: √(3kT/m). Used (elsewhere,
  // not in this module) to compare against a planet's escape speed —
  // whether a gas can hold onto that planet's atmosphere at all.
  function thermalSpeed(temperatureK, molecularMassKg) {
    return Math.sqrt((3 * BOLTZMANN_CONSTANT * temperatureK) / molecularMassKg);
  }

  return {
    // Layer 1
    fieldMagnitude,
    fieldVector,
    radialField,
    radialForce,
    potential,
    potentialEnergy,
    equipotentialRadii,
    potentialDifferenceNumerical,
    potentialEnergyDifferenceNumerical,
    workByField,
    workByExternalAgent,
    workAlongPath,
    integrateFieldToInfinity,
    // Layer 2
    fieldVectorAt,
    potentialAt,
    traceFieldLine,
    zeroFieldPointBetween,
    findFieldZero,
    equipotentialContour,
    // Layer 3
    kineticEnergyPerMass,
    potentialEnergyPerMass,
    totalEnergyPerMass,
    classifyOrbit,
    escapeSpeedFromEnergy,
    circularOrbitEnergetics,
    orbitalEnergyChange,
    simulateRK4EnergyDrift,
    // Layer 4
    fieldOutsideUniformSphere,
    fieldInsideUniformSphere,
    shellTheoremField,
    // Layer 5
    restrictedThreeBodyOmega,
    restrictedThreeBodyPositions,
    effectivePotential,
    hillRadius,
    collinearLagrangePoints,
    equilateralLagrangePoints,
    lagrangeStabilityMassRatioThreshold,
    isEquilateralPointStable,
    fluidRocheLimit,
    tidalEffectRatio,
    sunMoonTidalRatio,
    molarMassToMoleculeMass,
    thermalSpeed,
    BOLTZMANN_CONSTANT,
    AVOGADRO_CONSTANT,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ...makeGravityField(require('./orbitalMechanics'), require('./gravitySim'), require('./tides')), makeGravityField };
} else if (typeof window !== 'undefined') {
  window.GravityField = { ...makeGravityField(window.OrbitalMechanics, window.GravitySim, window.Tides), makeGravityField };
}
