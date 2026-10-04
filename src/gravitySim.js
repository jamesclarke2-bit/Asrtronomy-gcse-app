/**
 * A general 2D numerical gravity simulator: given a starting position and
 * velocity around a fixed central mass, integrates the actual equation of
 * motion (F = -GMm/r², so a = -GM·r̂/r²) step by step with 4th-order
 * Runge-Kutta — rather than assuming the path is an ellipse and solving
 * Kepler's equation for where the body is on it, the way
 * src/orbitalMechanics.js does for Kepler's-laws pages. That's the point
 * of sims/orbits-gravity.html's Newton's cannon diagram: the ellipse (or
 * parabola, or straight fall) isn't assumed, it falls out of integrating
 * gravity alone, and so does Kepler's second law — see sweptArea below.
 *
 * Units throughout: metres, seconds, kg, m/s — plain SI, like
 * orbitalMechanics.js's own general (non-AU/year) functions. State is
 * always { x, y, vx, vy }, with the central mass fixed at the origin.
 *
 * test/gravitySim.test.js checks the integrator itself conserves energy
 * and angular momentum over many orbits, for both a circular and an
 * eccentric path — the two conserved quantities a real orbit has, and so
 * the two a buggy integrator is likely to leak.
 */
(function () {
  function acceleration(x, y, GM) {
    const r2 = x * x + y * y;
    const r = Math.sqrt(r2);
    const factor = -GM / (r2 * r); // -GM/r^3, so factor*{x,y} = -GM*r̂/r²
    return { ax: factor * x, ay: factor * y };
  }

  function derivatives(state, GM) {
    const { ax, ay } = acceleration(state.x, state.y, GM);
    return { dx: state.vx, dy: state.vy, dvx: ax, dvy: ay };
  }

  function addScaled(state, d, h) {
    return {
      x: state.x + h * d.dx,
      y: state.y + h * d.dy,
      vx: state.vx + h * d.dvx,
      vy: state.vy + h * d.dvy,
    };
  }

  // One 4th-order Runge-Kutta step: samples the derivative at the start,
  // twice at the midpoint, and once at the end of the interval, and
  // combines them in the classic 1:2:2:1 weighting. Far more accurate
  // per step than simply stepping along the start-of-interval velocity
  // and acceleration (Euler's method), which is why an orbit integrated
  // this way stays closed instead of visibly spiralling in or out.
  function rk4Step(state, dt, GM) {
    const k1 = derivatives(state, GM);
    const k2 = derivatives(addScaled(state, k1, dt / 2), GM);
    const k3 = derivatives(addScaled(state, k2, dt / 2), GM);
    const k4 = derivatives(addScaled(state, k3, dt), GM);
    return {
      x: state.x + (dt / 6) * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx),
      y: state.y + (dt / 6) * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy),
      vx: state.vx + (dt / 6) * (k1.dvx + 2 * k2.dvx + 2 * k3.dvx + k4.dvx),
      vy: state.vy + (dt / 6) * (k1.dvy + 2 * k2.dvy + 2 * k3.dvy + k4.dvy),
    };
  }

  // Specific (per-unit-mass) orbital energy, v²/2 - GM/r: negative for a
  // bound (circular/elliptical) orbit, zero exactly at escape speed,
  // positive once unbound (hyperbolic).
  function specificEnergy(state, GM) {
    const r = Math.hypot(state.x, state.y);
    return 0.5 * (state.vx * state.vx + state.vy * state.vy) - GM / r;
  }

  // Specific angular momentum, x·vy - y·vx — Kepler's second law restated:
  // this staying constant *is* "equal areas in equal times", since the
  // area swept per unit time is exactly half this value.
  function specificAngularMomentum(state) {
    return state.x * state.vy - state.y * state.vx;
  }

  // Integrates forward from an initial state until it either hits the
  // ground (r <= groundRadius: "falls back to Earth"), flies out past
  // maxRadius ("has escaped"), or runs out of steps (still orbiting, or
  // this step budget wasn't enough to tell). Returns every intermediate
  // state too, not just the outcome, so a caller can draw the path and
  // its swept-area wedges.
  function simulateTrajectory({ x0, y0, vx0, vy0, GM, dt, maxSteps, groundRadius, maxRadius }) {
    let state = { x: x0, y: y0, vx: vx0, vy: vy0 };
    const points = [state];
    for (let i = 0; i < maxSteps; i += 1) {
      state = rk4Step(state, dt, GM);
      points.push(state);
      const r = Math.hypot(state.x, state.y);
      if (r <= groundRadius) return { points, outcome: 'impact' };
      if (maxRadius && r > maxRadius) return { points, outcome: 'escaped' };
    }
    return { points, outcome: 'orbiting' };
  }

  // The area swept between two trajectory points, as seen from the
  // central mass at the origin — the shoelace formula for the triangle
  // (origin, a, b). Summing this over every step in an equal time
  // interval, and comparing between intervals, is exactly how the
  // "equal areas in equal times" wedges on the page are drawn and
  // checked: both from the *simulated* path, not assumed in advance.
  function sweptArea(a, b) {
    return 0.5 * Math.abs(a.x * b.y - b.x * a.y);
  }

  const api = {
    rk4Step,
    specificEnergy,
    specificAngularMomentum,
    simulateTrajectory,
    sweptArea,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.GravitySim = api;
  }
})();
