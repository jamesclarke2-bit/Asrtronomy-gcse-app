const test = require('node:test');
const assert = require('node:assert/strict');
const GravityField = require('../src/gravityField');
const OrbitalMechanics = require('../src/orbitalMechanics');
const GravitySim = require('../src/gravitySim');
const Tides = require('../src/tides');
const SpecData = require('../src/specData');

const { G, EARTH_MASS_KG, EARTH_RADIUS_M } = OrbitalMechanics;

// --- Layer 1: a single point mass ------------------------------------------

test('integrating g(r) from infinity in to Earth\'s radius numerically gives GM/R, to 1e-4 relative', () => {
  const exact = (G * EARTH_MASS_KG) / EARTH_RADIUS_M;
  const numeric = GravityField.integrateFieldToInfinity(EARTH_MASS_KG, EARTH_RADIUS_M);
  const relativeError = Math.abs(numeric - exact) / exact;
  assert.ok(relativeError < 1e-4, `relative error ${relativeError} should be under 1e-4`);
});

test('the potential at Earth\'s surface is about -62.6 MJ/kg', () => {
  const potential = GravityField.potential(EARTH_MASS_KG, EARTH_RADIUS_M);
  assert.ok(Math.abs(potential / 1e6 - -62.6) < 0.1, `expected ~-62.6 MJ/kg, got ${potential / 1e6}`);
});

test('the numerically integrated ΔU agrees with mgh to ~0.02% at 1 km and differs by ~1.5% at 100 km', () => {
  const g0 = GravityField.fieldMagnitude(EARTH_MASS_KG, EARTH_RADIUS_M);

  const deltaU1km = GravityField.potentialEnergyDifferenceNumerical(EARTH_MASS_KG, 1, EARTH_RADIUS_M, EARTH_RADIUS_M + 1000);
  const approx1km = g0 * 1000;
  const pctDiff1km = (100 * Math.abs(deltaU1km - approx1km)) / deltaU1km;
  assert.ok(pctDiff1km < 0.05, `expected ~0.02% difference at 1 km, got ${pctDiff1km}%`);

  const deltaU100km = GravityField.potentialEnergyDifferenceNumerical(EARTH_MASS_KG, 1, EARTH_RADIUS_M, EARTH_RADIUS_M + 100000);
  const approx100km = g0 * 100000;
  const pctDiff100km = (100 * Math.abs(deltaU100km - approx100km)) / deltaU100km;
  assert.ok(Math.abs(pctDiff100km - 1.5) < 0.3, `expected ~1.5% difference at 100 km, got ${pctDiff100km}%`);
});

test('workByField and workByExternalAgent, for a move inward from far away to Earth\'s radius', () => {
  const exact = (G * EARTH_MASS_KG) / EARTH_RADIUS_M;
  const far = EARTH_RADIUS_M * 1e8;

  const workIn = GravityField.workByField(EARTH_MASS_KG, far, EARTH_RADIUS_M);
  assert.ok(workIn > 0, `expected positive (inward) work, got ${workIn}`);
  const relativeError = Math.abs(workIn - exact) / exact;
  assert.ok(relativeError < 1e-4, `relative error ${relativeError} should be under 1e-4`);

  const workExtIn = GravityField.workByExternalAgent(EARTH_MASS_KG, far, EARTH_RADIUS_M);
  assert.ok(workExtIn < 0, `expected negative external-agent work, got ${workExtIn}`);
  assert.equal(Math.abs(workExtIn), workIn);
  assert.equal(workIn + workExtIn, 0);

  // V(R) = -GM/R, found here as the work an external agent does
  // bringing a unit mass in from a very large radius, not by
  // evaluating -GM/r directly.
  const potentialAtR = GravityField.potentialEnergyPerMass(EARTH_MASS_KG, EARTH_RADIUS_M);
  const relativeErrorVsPotential = Math.abs(potentialAtR - workExtIn) / Math.abs(potentialAtR);
  assert.ok(relativeErrorVsPotential < 1e-4, `expected workByExternalAgent ≈ V(R) = ${potentialAtR}, got ${workExtIn}`);
});

test('workByField and workByExternalAgent reverse sign for the equivalent outward move', () => {
  const far = EARTH_RADIUS_M * 1e8;

  const workOut = GravityField.workByField(EARTH_MASS_KG, EARTH_RADIUS_M, far);
  const workExtOut = GravityField.workByExternalAgent(EARTH_MASS_KG, EARTH_RADIUS_M, far);
  assert.ok(workOut < 0, `expected negative (outward) field work, got ${workOut}`);
  assert.ok(workExtOut > 0, `expected positive external-agent work, got ${workExtOut}`);
  assert.equal(workOut + workExtOut, 0);

  const workIn = GravityField.workByField(EARTH_MASS_KG, far, EARTH_RADIUS_M);
  assert.equal(workOut, -workIn);
});

test('workByField and workByExternalAgent default to enough steps that a far-away start needs no help from the caller', () => {
  // No steps argument at all — this is exactly the "a caller who
  // doesn't know to ask for more steps" case workByField's own default
  // (2000, not potentialDifferenceNumerical's 1000) exists for.
  const exact = (G * EARTH_MASS_KG) / EARTH_RADIUS_M;
  const far = EARTH_RADIUS_M * 1e8;

  const workIn = GravityField.workByField(EARTH_MASS_KG, far, EARTH_RADIUS_M);
  const relativeErrorField = Math.abs(workIn - exact) / exact;
  assert.ok(relativeErrorField < 1e-4, `workByField with no steps argument: relative error ${relativeErrorField} should be under 1e-4`);

  const workExtIn = GravityField.workByExternalAgent(EARTH_MASS_KG, far, EARTH_RADIUS_M);
  const relativeErrorAgent = Math.abs(Math.abs(workExtIn) - exact) / exact;
  assert.ok(relativeErrorAgent < 1e-4, `workByExternalAgent with no steps argument: relative error ${relativeErrorAgent} should be under 1e-4`);
});

// --- Signed radial quantities (radialField, radialForce, equipotentialRadii, workAlongPath) --

test('F, g, V and U are negative for every r > 0, and V and U approach zero from below as r grows', () => {
  const radii = [EARTH_RADIUS_M, EARTH_RADIUS_M * 2, EARTH_RADIUS_M * 10, EARTH_RADIUS_M * 1000];
  radii.forEach((r) => {
    assert.ok(GravityField.radialField(EARTH_MASS_KG, r) < 0, `g(${r}) should be negative`);
    assert.ok(GravityField.radialForce(EARTH_MASS_KG, 1, r) < 0, `F(${r}) should be negative`);
    assert.ok(GravityField.potential(EARTH_MASS_KG, r) < 0, `V(${r}) should be negative`);
    assert.ok(GravityField.potentialEnergy(EARTH_MASS_KG, 1, r) < 0, `U(${r}) should be negative`);
  });

  // Approaching zero from below: each further-out V (and U) is less
  // negative than the last, never crossing to positive.
  for (let i = 1; i < radii.length; i += 1) {
    const vPrev = GravityField.potential(EARTH_MASS_KG, radii[i - 1]);
    const vNext = GravityField.potential(EARTH_MASS_KG, radii[i]);
    assert.ok(vNext > vPrev && vNext < 0, `V should rise towards zero but stay negative: ${vPrev} -> ${vNext}`);
  }
});

test('the numerical derivative of V equals minus the signed g', () => {
  const r = EARTH_RADIUS_M * 2;
  const h = 1;
  const dV = (GravityField.potential(EARTH_MASS_KG, r + h) - GravityField.potential(EARTH_MASS_KG, r - h)) / (2 * h);
  const g = GravityField.radialField(EARTH_MASS_KG, r);
  assert.ok(Math.abs(dV - -g) / Math.abs(g) < 1e-6, `expected dV/dr ≈ ${-g}, got ${dV}`);
});

test('V(r2) - V(r1) equals minus the integral of the signed g from r1 to r2', () => {
  const r1 = EARTH_RADIUS_M;
  const r2 = EARTH_RADIUS_M * 5;
  const steps = 5000;
  let integral = 0;
  let prevR = r1;
  let prevG = GravityField.radialField(EARTH_MASS_KG, r1);
  for (let i = 1; i <= steps; i += 1) {
    const r = r1 + ((r2 - r1) * i) / steps;
    const g = GravityField.radialField(EARTH_MASS_KG, r);
    integral += (0.5 * (g + prevG) * (r - prevR));
    prevR = r;
    prevG = g;
  }
  const deltaV = GravityField.potential(EARTH_MASS_KG, r2) - GravityField.potential(EARTH_MASS_KG, r1);
  assert.ok(Math.abs(deltaV - -integral) / Math.abs(deltaV) < 1e-4, `expected ΔV ≈ ${-integral}, got ${deltaV}`);
});

test('equipotentialRadii: equal steps of V (V_i = -i*deltaV), with the matching radii', () => {
  const steps = GravityField.equipotentialRadii(EARTH_MASS_KG, 10e6, 4);
  assert.equal(steps.length, 4);
  steps.forEach((s, i) => {
    assert.equal(s.potential, -(i + 1) * 10e6);
    const expectedRadius = (OrbitalMechanics.G * EARTH_MASS_KG) / ((i + 1) * 10e6);
    assert.ok(Math.abs(s.radius - expectedRadius) / expectedRadius < 1e-9);
    assert.ok(Math.abs(GravityField.potential(EARTH_MASS_KG, s.radius) - s.potential) / Math.abs(s.potential) < 1e-9);
  });
  // Deeper (more negative) steps sit at smaller radii.
  assert.ok(steps[0].radius > steps[3].radius);
});

test('workAlongPath: moving outward costs positive work, moving inward releases it, matching workByExternalAgent', () => {
  const r1 = EARTH_RADIUS_M * 2;
  const r2 = EARTH_RADIUS_M * 6;

  const outward = GravityField.workAlongPath(EARTH_MASS_KG, 1, [{ x: r1, y: 0 }, { x: r2, y: 0 }]);
  assert.ok(outward > 0, `expected positive (outward) work, got ${outward}`);
  const expectedOutward = GravityField.workByExternalAgent(EARTH_MASS_KG, r1, r2);
  assert.ok(Math.abs(outward - expectedOutward) / expectedOutward < 1e-3, `expected ≈${expectedOutward}, got ${outward}`);

  const inward = GravityField.workAlongPath(EARTH_MASS_KG, 1, [{ x: r2, y: 0 }, { x: r1, y: 0 }]);
  assert.ok(inward < 0, `expected negative (inward) work, got ${inward}`);
  assert.ok(Math.abs(inward - -outward) / Math.abs(outward) < 1e-3);
});

test('workAlongPath: work along an equipotential arc is zero', () => {
  const r = EARTH_RADIUS_M * 3;
  const arcPoints = [];
  for (let i = 0; i <= 8; i += 1) {
    const theta = (i / 8) * (Math.PI / 2);
    arcPoints.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
  }
  const work = GravityField.workAlongPath(EARTH_MASS_KG, 1, arcPoints);
  const scale = Math.abs(GravityField.potential(EARTH_MASS_KG, r));
  assert.ok(Math.abs(work) / scale < 1e-3, `expected ~0, got ${work}`);
});

test('workAlongPath: a radial path and a zigzag path between the same two radii cost the same (path independence, within 1e-3)', () => {
  const r1 = EARTH_RADIUS_M * 2;
  const r2 = EARTH_RADIUS_M * 8;

  const radial = GravityField.workAlongPath(EARTH_MASS_KG, 1, [{ x: r1, y: 0 }, { x: r2, y: 0 }]);

  const zigzag = GravityField.workAlongPath(EARTH_MASS_KG, 1, [
    { x: r1, y: 0 },
    { x: r1 * 1.5, y: r1 * 1.2 },
    { x: r2 * 0.8, y: -r1 * 0.6 },
    { x: r2, y: 0 },
  ]);

  assert.ok(Math.abs(zigzag - radial) / Math.abs(radial) < 1e-3, `expected ≈${radial}, got ${zigzag}`);
});

// --- Layer 2: superposition --------------------------------------------------

test('two equal masses give zero field at the midpoint, and a potential of -4GM/d there', () => {
  const mass = 1e24;
  const separation = 1e9;
  const bodyA = { mass, x: 0, y: 0 };
  const bodyB = { mass, x: separation, y: 0 };

  const zero = GravityField.zeroFieldPointBetween(bodyA, bodyB);
  assert.ok(Math.abs(zero.x - separation / 2) < 1, `expected midpoint, got x=${zero.x}`);
  const fieldAtMidpoint = GravityField.fieldVectorAt([bodyA, bodyB], { x: separation / 2, y: 0 });
  assert.ok(fieldAtMidpoint.magnitude < 1e-20, `expected ~zero field, got ${fieldAtMidpoint.magnitude}`);

  const potentialAtMidpoint = GravityField.potentialAt([bodyA, bodyB], { x: separation / 2, y: 0 });
  const expected = (-4 * G * mass) / separation;
  assert.ok(Math.abs((potentialAtMidpoint - expected) / expected) < 1e-9, `expected ${expected}, got ${potentialAtMidpoint}`);
});

test('a general Newton-Raphson field-zero search agrees with the exact two-body point', () => {
  const bodyA = { mass: EARTH_MASS_KG, x: 0, y: 0 };
  const bodyB = { mass: Tides.MOON_MASS_KG, x: Tides.MOON_DISTANCE_KM * 1000, y: 0 };
  const exact = GravityField.zeroFieldPointBetween(bodyA, bodyB);
  const numeric = GravityField.findFieldZero([bodyA, bodyB], { x: exact.x * 0.9, y: 0 });
  assert.ok(Math.abs(numeric.x - exact.x) / exact.x < 1e-4, `expected ~${exact.x}, got ${numeric.x}`);
});

test('the Earth-Moon zero-field point is about 346,000 km from Earth, which is NOT the L1 point (about 326,000 km from Earth)', () => {
  const earth = { mass: EARTH_MASS_KG, x: 0, y: 0 };
  const moon = { mass: Tides.MOON_MASS_KG, x: Tides.MOON_DISTANCE_KM * 1000, y: 0 };

  const zeroField = GravityField.zeroFieldPointBetween(earth, moon);
  const zeroFieldKm = zeroField.distanceFromA / 1000;
  assert.ok(Math.abs(zeroFieldKm - 346000) < 3000, `expected ~346,000 km, got ${zeroFieldKm}`);

  const lagrange = GravityField.collinearLagrangePoints(EARTH_MASS_KG, Tides.MOON_MASS_KG, Tides.MOON_DISTANCE_KM * 1000);
  const l1Km = lagrange.L1.distanceFromLarger / 1000;
  assert.ok(Math.abs(l1Km - 326000) < 3000, `expected L1 ~326,000 km, got ${l1Km}`);

  // The two points are genuinely different: the pure zero-gravity point
  // ignores the rotating frame's centrifugal term that L1 (the
  // zero-net-force point for a body co-rotating with the Earth-Moon
  // system) includes — so they should differ by several thousand km,
  // not agree to rounding.
  assert.ok(Math.abs(zeroFieldKm - l1Km) > 10000, `zero-field point (${zeroFieldKm} km) should clearly differ from L1 (${l1Km} km)`);
});

// --- Layer 3: orbital energetics ---------------------------------------------

test('for a circular orbit, KE = -1/2 PE and total energy = -GMm/2r (per unit mass, -GM/2r)', () => {
  const r = EARTH_RADIUS_M + 400000;
  const { kinetic, potential, total } = GravityField.circularOrbitEnergetics(EARTH_MASS_KG, r);
  assert.ok(Math.abs(kinetic - -0.5 * potential) / kinetic < 1e-9, `KE should be -1/2 PE: KE=${kinetic}, PE=${potential}`);
  const expectedTotal = (-G * EARTH_MASS_KG) / (2 * r);
  assert.ok(Math.abs((total - expectedTotal) / expectedTotal) < 1e-9, `expected total ${expectedTotal}, got ${total}`);
});

test('moving from a 400 km orbit to geostationary (r ~42,164 km) changes the total orbital energy by about 24.7 MJ/kg', () => {
  const r1 = EARTH_RADIUS_M + 400000;
  const r2 = 42164000;
  const deltaE = GravityField.orbitalEnergyChange(EARTH_MASS_KG, r1, r2);
  assert.ok(Math.abs(deltaE / 1e6 - 24.7) < 0.3, `expected ~24.7 MJ/kg, got ${deltaE / 1e6}`);
});

test('escape speed from the energy balance matches OrbitalMechanics.escapeSpeed(), and total energy is zero at escape speed', () => {
  const r = EARTH_RADIUS_M + 400000;
  const fromEnergy = GravityField.escapeSpeedFromEnergy(EARTH_MASS_KG, r);
  const fromOrbitalMechanics = OrbitalMechanics.escapeSpeed(r, EARTH_MASS_KG);
  assert.ok(Math.abs(fromEnergy - fromOrbitalMechanics) / fromOrbitalMechanics < 1e-9, `expected ${fromOrbitalMechanics}, got ${fromEnergy}`);

  const totalEnergy = GravityField.totalEnergyPerMass(EARTH_MASS_KG, r, fromEnergy);
  // Floating-point, not exactly 0 (it's ~7e-9 here). classifyOrbit's
  // zero check only widens into a tolerance window when it's given a
  // potential-energy reference to scale that window against (see the
  // next test) — called with just one argument, as here, it's still
  // the same exact check it always was, so the sentinel values below
  // still classify cleanly either side of zero.
  assert.ok(Math.abs(totalEnergy) < 1e-6, `expected ~0, got ${totalEnergy}`);
  assert.equal(GravityField.classifyOrbit(-1), 'bound');
  assert.equal(GravityField.classifyOrbit(0), 'parabolic');
  assert.equal(GravityField.classifyOrbit(1), 'hyperbolic');
});

test('classifyOrbit, given a potential-energy reference, classifies a real escape-speed energy as parabolic (and 1% either side correctly)', () => {
  const r = EARTH_RADIUS_M + 400000;
  const potentialEnergy = GravityField.potentialEnergyPerMass(EARTH_MASS_KG, r);
  const escapeSpeed = OrbitalMechanics.escapeSpeed(r, EARTH_MASS_KG);

  const atEscape = GravityField.totalEnergyPerMass(EARTH_MASS_KG, r, escapeSpeed);
  assert.equal(GravityField.classifyOrbit(atEscape, potentialEnergy), 'parabolic');

  const belowEscape = GravityField.totalEnergyPerMass(EARTH_MASS_KG, r, escapeSpeed * 0.99);
  assert.equal(GravityField.classifyOrbit(belowEscape, potentialEnergy), 'bound');

  const aboveEscape = GravityField.totalEnergyPerMass(EARTH_MASS_KG, r, escapeSpeed * 1.01);
  assert.equal(GravityField.classifyOrbit(aboveEscape, potentialEnergy), 'hyperbolic');
});

test('energy is conserved along an RK4 path, for both a circular and an eccentric orbit', () => {
  const r0 = EARTH_RADIUS_M + 400000;
  const vCircular = OrbitalMechanics.circularOrbitSpeed(r0, EARTH_MASS_KG);

  const circularResult = GravityField.simulateRK4EnergyDrift(EARTH_MASS_KG, { x: r0, y: 0, vx: 0, vy: vCircular }, 2, 20000);
  assert.ok(circularResult.maxRelativeDrift < 1e-8, `circular orbit energy drift too large: ${circularResult.maxRelativeDrift}`);

  const eccentricResult = GravityField.simulateRK4EnergyDrift(EARTH_MASS_KG, { x: r0, y: 0, vx: 0, vy: vCircular * 1.3 }, 2, 20000);
  assert.ok(eccentricResult.maxRelativeDrift < 1e-8, `eccentric orbit energy drift too large: ${eccentricResult.maxRelativeDrift}`);

  // Genuinely reuses GravitySim's own stepper/energy function, not a
  // second copy of them: the initial energy simulateRK4EnergyDrift
  // reports should match calling GravitySim.specificEnergy directly.
  const state0 = { x: r0, y: 0, vx: 0, vy: vCircular };
  const directEnergy = GravitySim.specificEnergy(state0, G * EARTH_MASS_KG);
  assert.ok(Math.abs(directEnergy - circularResult.initialEnergy) < 1e-6, 'initial energy should match GravitySim.specificEnergy directly');
});

// --- Layer 4: extended bodies (A-level extension) -----------------------------

test('for a uniform sphere, g at R/2 is half the surface value, and the field is continuous at the surface', () => {
  const radius = EARTH_RADIUS_M;
  const surfaceG = GravityField.shellTheoremField(EARTH_MASS_KG, radius, radius);
  const halfRadiusG = GravityField.shellTheoremField(EARTH_MASS_KG, radius, radius / 2);
  assert.ok(Math.abs(halfRadiusG - surfaceG / 2) / (surfaceG / 2) < 1e-9, `expected half of ${surfaceG}, got ${halfRadiusG}`);

  const justInside = GravityField.fieldInsideUniformSphere(EARTH_MASS_KG, radius, radius);
  const justOutside = GravityField.fieldOutsideUniformSphere(EARTH_MASS_KG, radius, radius);
  assert.ok(Math.abs(justInside - justOutside) / justOutside < 1e-9, 'field should be continuous at the surface');
});

test('from the data-sheet masses and diameters, escape speeds are about 5 km/s (Mars), 0.5 km/s (Ceres) and 60 km/s (Jupiter)', () => {
  const earthMassKg = SpecData.CONSTANTS.earthMassKg;
  const expected = { Mars: 5, Ceres: 0.5, Jupiter: 60 };
  Object.entries(expected).forEach(([name, expectedKmS]) => {
    const body = SpecData.PLANETARY_DATA.find((b) => b.name === name);
    const massKg = body.massEarthMasses * earthMassKg;
    const radiusM = (body.diameterThousandKm * 1000 * 1000) / 2;
    const escapeSpeedKmS = GravityField.escapeSpeedFromEnergy(massKg, radiusM) / 1000;
    const tolerance = expectedKmS * 0.1; // the data sheet's own figures are rounded to 2-3 sig figs
    assert.ok(Math.abs(escapeSpeedKmS - expectedKmS) < tolerance, `${name}: expected ~${expectedKmS} km/s, got ${escapeSpeedKmS}`);
  });
});

// --- Layer 5: the rotating frame (A-level extension) --------------------------

test('Sun-Earth L1 and L2 are each about 1.5 million km from Earth, within 2%', () => {
  const lagrange = GravityField.collinearLagrangePoints(Tides.SUN_MASS_KG, EARTH_MASS_KG, Tides.SUN_DISTANCE_KM * 1000);
  const l1Km = lagrange.L1.distanceFromSmaller / 1000;
  const l2Km = lagrange.L2.distanceFromSmaller / 1000;
  assert.ok(Math.abs(l1Km - 1500000) / 1500000 < 0.02, `L1: expected within 2% of 1.5M km, got ${l1Km}`);
  assert.ok(Math.abs(l2Km - 1500000) / 1500000 < 0.02, `L2: expected within 2% of 1.5M km, got ${l2Km}`);
});

test('L4 and L5 are equilateral (equal distance from both bodies), stable only when the mass ratio exceeds about 25', () => {
  const largerMass = Tides.SUN_MASS_KG;
  const smallerMass = EARTH_MASS_KG;
  const separation = Tides.SUN_DISTANCE_KM * 1000;
  const { xLarger, xSmaller } = GravityField.restrictedThreeBodyPositions(largerMass, smallerMass, separation);
  const { L4, L5 } = GravityField.equilateralLagrangePoints(largerMass, smallerMass, separation);

  [L4, L5].forEach((point) => {
    const distFromLarger = Math.hypot(point.x - xLarger, point.y);
    const distFromSmaller = Math.hypot(point.x - xSmaller, point.y);
    assert.ok(Math.abs(distFromLarger - separation) / separation < 1e-9, `expected ${separation}, got ${distFromLarger}`);
    assert.ok(Math.abs(distFromSmaller - separation) / separation < 1e-9, `expected ${separation}, got ${distFromSmaller}`);
  });

  const threshold = GravityField.lagrangeStabilityMassRatioThreshold();
  assert.ok(Math.abs(threshold - 25) < 1, `expected the stability threshold ~25, got ${threshold}`);
  assert.equal(GravityField.isEquilateralPointStable(largerMass, smallerMass), true); // Sun/Earth, ratio ~333,000
  assert.equal(GravityField.isEquilateralPointStable(20 * EARTH_MASS_KG, EARTH_MASS_KG), false); // ratio 20, below threshold
  assert.equal(GravityField.isEquilateralPointStable(30 * EARTH_MASS_KG, EARTH_MASS_KG), true); // ratio 30, above threshold
});

test('the Earth-Moon fluid Roche limit (densities 5,514 and 3,344 kg/m^3) is about 18,000 km', () => {
  const rocheLimitM = GravityField.fluidRocheLimit(EARTH_RADIUS_M, 5514, 3344);
  const rocheLimitKm = rocheLimitM / 1000;
  assert.ok(Math.abs(rocheLimitKm - 18000) < 1000, `expected ~18,000 km, got ${rocheLimitKm}`);
});

test('the thermal speed at 300 K is about 1.9 km/s for H2 and about 0.52 km/s for N2', () => {
  const massH2 = GravityField.molarMassToMoleculeMass(2.016e-3);
  const massN2 = GravityField.molarMassToMoleculeMass(28.014e-3);
  const speedH2 = GravityField.thermalSpeed(300, massH2) / 1000;
  const speedN2 = GravityField.thermalSpeed(300, massN2) / 1000;
  assert.ok(Math.abs(speedH2 - 1.9) < 0.1, `expected ~1.9 km/s, got ${speedH2}`);
  assert.ok(Math.abs(speedN2 - 0.52) < 0.05, `expected ~0.52 km/s, got ${speedN2}`);
});

test('tidalEffectRatio, generalised from tides.js, reproduces Tides.sunToMoonTideRatio() exactly for the Sun and Moon', () => {
  const generalised = GravityField.tidalEffectRatio(Tides.SUN_MASS_KG, Tides.SUN_DISTANCE_KM, Tides.MOON_MASS_KG, Tides.MOON_DISTANCE_KM);
  assert.equal(generalised, Tides.sunToMoonTideRatio());
  assert.equal(GravityField.sunMoonTidalRatio(), Tides.sunToMoonTideRatio());
});
