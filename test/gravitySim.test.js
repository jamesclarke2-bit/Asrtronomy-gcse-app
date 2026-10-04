const test = require('node:test');
const assert = require('node:assert/strict');
const GS = require('../src/gravitySim');
const OM = require('../src/orbitalMechanics');

const GM = OM.G * OM.EARTH_MASS_KG;
const R = OM.EARTH_RADIUS_M;

function maxRelativeDrift(points, GM_, invariant) {
  const reference = invariant(points[0], GM_);
  let max = 0;
  points.forEach((p) => {
    const value = invariant(p, GM_);
    max = Math.max(max, Math.abs((value - reference) / reference));
  });
  return max;
}

test('rk4Step: a circular orbit stays at a constant radius', () => {
  const r = R + 400000;
  const v = OM.circularOrbitSpeed(r, OM.EARTH_MASS_KG);
  let state = { x: r, y: 0, vx: 0, vy: v };
  const period = OM.periodFromSemiMajorAxis(r, OM.EARTH_MASS_KG);
  const dt = period / 500;
  for (let i = 0; i < 500; i += 1) {
    state = GS.rk4Step(state, dt, GM);
    const radius = Math.hypot(state.x, state.y);
    assert.ok(Math.abs(radius - r) / r < 1e-4, `step ${i}: radius drifted to ${radius}`);
  }
});

test('simulateTrajectory: energy and angular momentum stay conserved over 30 orbits (circular)', () => {
  const r = R + 400000;
  const v = OM.circularOrbitSpeed(r, OM.EARTH_MASS_KG);
  const period = OM.periodFromSemiMajorAxis(r, OM.EARTH_MASS_KG);
  const dt = period / 500;
  const { points, outcome } = GS.simulateTrajectory({
    x0: r, y0: 0, vx0: 0, vy0: v, GM, dt,
    maxSteps: Math.round((period * 30) / dt),
    groundRadius: R,
    maxRadius: r * 100,
  });
  assert.equal(outcome, 'orbiting', 'a circular orbit should neither hit the ground nor escape');
  const energyDrift = maxRelativeDrift(points, GM, GS.specificEnergy);
  const momentumDrift = maxRelativeDrift(points, GM, (p) => GS.specificAngularMomentum(p));
  assert.ok(energyDrift < 1e-5, `energy drifted by ${energyDrift}`);
  assert.ok(momentumDrift < 1e-5, `angular momentum drifted by ${momentumDrift}`);
});

test('simulateTrajectory: energy and angular momentum stay conserved over 30 orbits (eccentric)', () => {
  const a = 3 * R;
  const e = 0.3;
  const peri = a * (1 - e);
  assert.ok(peri > R, 'perihelion must clear the ground for this to be a real orbit');
  const vPeri = OM.orbitalSpeed(peri, a, OM.EARTH_MASS_KG);
  const period = OM.periodFromSemiMajorAxis(a, OM.EARTH_MASS_KG);
  const dt = period / 500;
  const { points, outcome } = GS.simulateTrajectory({
    x0: peri, y0: 0, vx0: 0, vy0: vPeri, GM, dt,
    maxSteps: Math.round((period * 30) / dt),
    groundRadius: R,
    maxRadius: a * 10,
  });
  assert.equal(outcome, 'orbiting');
  const energyDrift = maxRelativeDrift(points, GM, GS.specificEnergy);
  const momentumDrift = maxRelativeDrift(points, GM, (p) => GS.specificAngularMomentum(p));
  assert.ok(energyDrift < 1e-5, `energy drifted by ${energyDrift}`);
  assert.ok(momentumDrift < 1e-5, `angular momentum drifted by ${momentumDrift}`);
});

test('simulateTrajectory: too slow a launch falls back to the ground', () => {
  const r = R + 100000; // a 100 km tower
  const v = 3000; // well under circular speed at this height
  const period = OM.periodFromSemiMajorAxis(r, OM.EARTH_MASS_KG);
  const { outcome, points } = GS.simulateTrajectory({
    x0: r, y0: 0, vx0: 0, vy0: v, GM, dt: period / 2000,
    maxSteps: 20000,
    groundRadius: R,
    maxRadius: r * 50,
  });
  assert.equal(outcome, 'impact');
  const last = points[points.length - 1];
  assert.ok(Math.hypot(last.x, last.y) <= R + 1, 'trajectory should end at or below the ground radius');
});

test('simulateTrajectory: launching at the escape speed never falls back or loops round', () => {
  const r = R;
  const v = OM.escapeSpeed(r, OM.EARTH_MASS_KG);
  const { outcome } = GS.simulateTrajectory({
    x0: r, y0: 0, vx0: 0, vy0: v, GM, dt: 10,
    maxSteps: 200000,
    groundRadius: R,
    maxRadius: r * 50,
  });
  assert.equal(outcome, 'escaped');
});

test('simulateTrajectory: just below escape speed is still a bound (if very elongated) ellipse, not an escape', () => {
  const r = R;
  const v = OM.escapeSpeed(r, OM.EARTH_MASS_KG) * 0.9;
  const { outcome } = GS.simulateTrajectory({
    x0: r, y0: 0, vx0: 0, vy0: v, GM, dt: 5,
    maxSteps: 400000,
    groundRadius: R,
    maxRadius: r * 60,
  });
  assert.notEqual(outcome, 'escaped');
});

test('sweptArea: the shoelace triangle area from the origin matches a known right triangle', () => {
  // Origin, (1,0) and (0,1): area of that triangle is 0.5.
  assert.ok(Math.abs(GS.sweptArea({ x: 1, y: 0 }, { x: 0, y: 1 }) - 0.5) < 1e-12);
  // Origin, (2,0) and (2,2): area is 0.5*base*height = 0.5*2*2 = 2.
  assert.ok(Math.abs(GS.sweptArea({ x: 2, y: 0 }, { x: 2, y: 2 }) - 2) < 1e-12);
});

test('sweptArea: equal time steps around a circular orbit sweep equal areas (Kepler’s 2nd law, from integration alone)', () => {
  const r = R + 400000;
  const v = OM.circularOrbitSpeed(r, OM.EARTH_MASS_KG);
  const period = OM.periodFromSemiMajorAxis(r, OM.EARTH_MASS_KG);
  const dt = period / 360;
  const { points } = GS.simulateTrajectory({
    x0: r, y0: 0, vx0: 0, vy0: v, GM, dt,
    maxSteps: 360,
    groundRadius: R,
    maxRadius: r * 10,
  });
  const areas = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    areas.push(GS.sweptArea(points[i], points[i + 1]));
  }
  const first = areas[0];
  areas.forEach((area, i) => {
    assert.ok(Math.abs(area - first) / first < 1e-3, `wedge ${i}: area ${area} vs first wedge ${first}`);
  });
});
