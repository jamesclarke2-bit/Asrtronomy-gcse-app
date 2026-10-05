const test = require('node:test');
const assert = require('node:assert/strict');
const EpicycleModel = require('../src/epicycleModel');

// Independent brute-force check: sample the geocentric angle across one
// full "beat" of the combined motion and see if it ever runs backwards,
// with proper wrap-around handling at the +-pi seam.
function numericallyShowsRetrograde(A, alpha, B, beta) {
  const steps = 5000;
  const span = beta === alpha ? (2 * Math.PI) / Math.abs(alpha || 1) : (2 * Math.PI) / Math.abs(beta - alpha);
  let prevAngle = null;
  let sawNegative = false;
  for (let i = 0; i <= steps; i += 1) {
    const t = (i / steps) * span * 1.01;
    const p = EpicycleModel.position(t, A, alpha, B, beta);
    const angle = Math.atan2(p.y, p.x);
    if (prevAngle !== null) {
      let delta = angle - prevAngle;
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;
      if (delta < 0) sawNegative = true;
    }
    prevAngle = angle;
  }
  return sawNegative;
}

test('showsRetrograde matches brute-force simulation across a wide sweep of radii and speed ratios', () => {
  const A = 1;
  const alpha = 1;
  let checked = 0;
  for (let B = 0.05; B < 1; B += 0.05) {
    for (let betaRatio = 0.1; betaRatio <= 15; betaRatio *= 1.4) {
      const beta = betaRatio;
      const predicted = EpicycleModel.showsRetrograde(A, alpha, B, beta);
      const numeric = numericallyShowsRetrograde(A, alpha, B, beta);
      assert.equal(predicted, numeric, `A=${A} alpha=${alpha} B=${B.toFixed(2)} beta=${beta.toFixed(3)}`);
      checked += 1;
    }
  }
  assert.ok(checked > 200, 'the sweep actually covered a wide range of cases');
});

test('the loop appears only when epicycle radius x epicycle angular speed exceeds deferent radius x deferent angular speed', () => {
  const A = 1;
  const alpha = 1;
  const beta = 3;
  // Threshold: B*beta = A*alpha, i.e. B = A*alpha/beta.
  const threshold = EpicycleModel.retrogradeThreshold(A, alpha, beta);
  assert.ok(Math.abs(threshold - A * alpha / beta) < 1e-12);

  const justBelow = threshold - 0.01;
  const justAbove = threshold + 0.01;
  assert.equal(EpicycleModel.showsRetrograde(A, alpha, justBelow, beta), false, 'below threshold: no loop');
  assert.equal(EpicycleModel.showsRetrograde(A, alpha, justAbove, beta), true, 'above threshold: loop appears');
});

test('exactly at the threshold, the loop has not switched on ("and not otherwise")', () => {
  const A = 1;
  const alpha = 1;
  const beta = 3;
  const B = EpicycleModel.retrogradeThreshold(A, alpha, beta);
  assert.equal(EpicycleModel.showsRetrograde(A, alpha, B, beta), false);
  // The angular velocity numerator's minimum (at the worst-case phase)
  // should be exactly zero at the threshold: momentarily stationary,
  // never actually negative.
  const worstPhaseT = Math.PI / Math.abs(beta - alpha);
  const numerator = EpicycleModel.angularVelocityNumerator(worstPhaseT, A, alpha, B, beta);
  assert.ok(Math.abs(numerator) < 1e-9, `numerator at the threshold's worst phase should be ~0, got ${numerator}`);
});

test('outer-planet preset: epicycle = 1 year (matching the Sun), deferent = the planet\'s own period', () => {
  const A = 1; // deferent radius, normalised
  const EARTH_YEAR = 1;
  const MARS_YEAR = 1.881; // Mars's real sidereal orbital period, in years
  const alpha = (2 * Math.PI) / MARS_YEAR; // deferent angular speed
  const beta = (2 * Math.PI) / EARTH_YEAR; // epicycle angular speed, matching the Sun's apparent 1-year motion

  const threshold = EpicycleModel.retrogradeThreshold(A, alpha, beta);
  assert.ok(Math.abs(threshold - EARTH_YEAR / MARS_YEAR) < 1e-12);
  assert.ok(threshold > 0.5 && threshold < 0.55, `threshold should sit a little above 0.5, got ${threshold}`);

  // A small, sub-threshold epicycle: no retrograde loop.
  assert.equal(EpicycleModel.showsRetrograde(A, alpha, 0.3, beta), false);
  // The realistic epicycle/deferent radius ratio for Mars is roughly
  // (Earth's orbital radius)/(Mars's orbital radius) ~ 1/1.524 ~ 0.656,
  // comfortably above the threshold: Mars does show real retrograde loops.
  assert.equal(EpicycleModel.showsRetrograde(A, alpha, 0.656, beta), true);
  assert.equal(numericallyShowsRetrograde(A, alpha, 0.656, beta), true);
});
