const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('../src/hubbleLaw');
const SpecData = require('../src/specData');

test('H0, c and the parsec come from the data sheet', () => {
  assert.equal(H.H0, SpecData.CONSTANTS.hubbleConstantKmPerSPerMpc);
  assert.equal(H.H0, 68);
  assert.equal(H.C_KM_PER_S, SpecData.CONSTANTS.speedOfLightMPerS / 1000);
  assert.equal(H.MPC_KM, SpecData.CONSTANTS.parsecKm * 1e6);
});

test('v = H0 × d and d = v ÷ H0', () => {
  assert.equal(H.velocity(120), 8160);
  assert.equal(H.distance(10200), 150);
  assert.equal(H.velocity(100, 70), 7000);
});

test('the practice data scatter round H0, every best-fit line passes through every error bar', () => {
  for (const key of ['near', 'wide']) {
    const set = H.DATA_SETS[key];
    const best = H.bestGradient(set.galaxies);
    assert.ok(Math.abs(best - H.H0) / H.H0 < 0.05, `${key}: ${best}`);
    assert.ok(H.passesAllBars(set.galaxies, best), key);
    const r = H.gradientRange(set.galaxies);
    assert.ok(r.steepest > best && best > r.shallowest, key);
    assert.ok(H.passesAllBars(set.galaxies, r.steepest) && H.passesAllBars(set.galaxies, r.shallowest), key);
    assert.ok(!H.passesAllBars(set.galaxies, r.steepest + 0.5) && !H.passesAllBars(set.galaxies, r.shallowest - 0.5), key);
    // Every point (with its error bar) fits on the drawn axes.
    set.galaxies.forEach((g) => {
      assert.ok(g.distanceMpc <= set.axis.maxDistanceMpc);
      assert.ok(g.velocityKmS + g.errorKmS <= set.axis.maxVelocityKmS);
    });
  }
});

test('a wider range of distances gives a smaller percentage uncertainty in H0', () => {
  const u = (key) => {
    const g = H.DATA_SETS[key].galaxies;
    const r = H.gradientRange(g);
    return H.uncertainty(r.steepest, r.shallowest, H.bestGradient(g));
  };
  const near = u('near');
  const wide = u('wide');
  assert.ok(near.percent > 2 * wide.percent, `${near.percent} vs ${wide.percent}`);
  assert.ok(H.DATA_SETS.near.galaxies.every((g) => g.distanceMpc <= 40));
  assert.ok(Math.max(...H.DATA_SETS.wide.galaxies.map((g) => g.distanceMpc)) >= 150);
});

test('uncertainty is half the range', () => {
  const u = H.uncertainty(74, 62, 68);
  assert.equal(u.half, 6);
  assert.ok(Math.abs(u.percent - 8.8235) < 1e-3);
});

test('age ≈ 1 ÷ H0 in steps, and size ≈ c × age', () => {
  const a = H.ageSteps();
  assert.equal(a.mpcKm, 3.1e19);
  assert.ok(Math.abs(a.perSecond - 68 / 3.1e19) < 1e-30);
  assert.ok(Math.abs(a.seconds - 3.1e19 / 68) / a.seconds < 1e-12);
  assert.equal(a.secondsPerYear, 31536000);
  assert.ok(Math.abs(a.billionYears - 14.456) < 0.01);
  const s = H.sizeEstimate();
  assert.ok(Math.abs(s.billionLightYears - a.billionYears) < 1e-12);
  assert.ok(Math.abs(s.km - 3e5 * a.seconds) / s.km < 1e-12);
  // A bigger H0 means a younger Universe.
  assert.ok(H.ageSteps(80).years < H.ageSteps(60).years);
});
