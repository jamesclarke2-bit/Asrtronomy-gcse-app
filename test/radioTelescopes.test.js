const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../src/radioTelescopes');
const TelescopeModel = require('../src/telescopeModel');

test('resolution reuses the Telescopes page model: 1.22 x wavelength / diameter', () => {
  assert.equal(R.resolutionArcsec(0.21, 76), TelescopeModel.resolutionArcsec(0.21e9, 76000));
  const expected = ((1.22 * 0.21) / 76) * (180 / Math.PI) * 3600;
  assert.ok(Math.abs(R.resolutionArcsec(0.21, 76) - expected) < 1e-6);
});

test('a bigger dish sees finer detail; a longer wavelength coarser detail', () => {
  assert.ok(R.resolutionArcsec(0.21, 100) < R.resolutionArcsec(0.21, 50));
  assert.ok(R.resolutionArcsec(0.5, 100) > R.resolutionArcsec(0.21, 100));
  assert.equal(R.detailRatio(0.2, 100), 0.002);
});

test('the same wavelength / diameter gives the same detail, so a radio dish must be far bigger than an optical lens', () => {
  const lens = 0.1;
  const dish = R.dishNeededM(0.21, lens);
  assert.ok(Math.abs(R.resolutionArcsec(0.21, dish) - TelescopeModel.resolutionArcsec(R.OPTICAL_NM, lens * 1000)) < 1e-9);
  assert.ok(Math.abs(dish - 38182) < 1, `${dish}`);
  assert.ok(Math.abs(R.equivalentOpticalDiameterM(0.21, dish) - lens) < 1e-12);
  // A 76 m dish at 21 cm sees no finer than a 0.2 mm lens in light.
  assert.ok(Math.abs(R.equivalentOpticalDiameterM(0.21, 76) * 1000 - 0.199) < 0.001);
});

test('two sources 10 arcminutes apart: merged for a 76 m dish at 21 cm, separate for a 500 m dish', () => {
  assert.equal(R.SOURCE_SEPARATION_ARCSEC, 600);
  assert.equal(R.separates(0.21, 76), false);
  assert.equal(R.separates(0.21, 500), true);
  assert.equal(R.separates(0.01, 10), true);
  assert.equal(R.separates(1, 100), false);
});

test('log sliders: 0 and 100 hit the ends, and positions round-trip to whole steps', () => {
  const { min, max } = R.DIAMETER_RANGE_M;
  assert.equal(R.logSlider(0, min, max), 10);
  assert.ok(Math.abs(R.logSlider(100, min, max) - 1000) < 1e-9);
  assert.ok(Math.abs(R.logSlider(50, min, max) - 100) < 1e-9);
  for (let p = 0; p <= 100; p += 1) assert.equal(R.logSliderPosition(R.logSlider(p, min, max), min, max), p);
  const w = R.WAVELENGTH_RANGE_M;
  assert.ok(Math.abs(R.logSlider(R.logSliderPosition(0.21, w.min, w.max), w.min, w.max) - 0.21) < 0.01);
});

test('scanning reads one point at a time, row by row, and the centre of the patch is brightest', () => {
  const s = R.scan(16, 10, 20);
  assert.equal(s.length, 20);
  assert.deepEqual([s[0].col, s[0].row, s[15].col, s[15].row, s[16].col, s[16].row], [0, 0, 15, 0, 0, 1]);
  assert.equal(R.scan(16, 10, 500).length, 160);
  assert.ok(R.skySignal(0.5, 0.5) > R.skySignal(0.2, 0.36));
  assert.ok(R.skySignal(0.2, 0.36) > R.skySignal(0.05, 0.95));
  for (const p of R.scan(16, 10, 160)) assert.ok(p.signal >= 0 && p.signal <= 1);
});

test('an array acts like one dish as wide as its farthest-apart pair', () => {
  const b = R.baselines(R.DEMO_ARRAY_KM);
  assert.equal(b.length, 10, 'five dishes make ten pairs');
  const longest = R.longestBaselineKm(R.DEMO_ARRAY_KM);
  assert.ok(Math.abs(longest - Math.hypot(23, 2)) < 1e-9);
  // Its detail beats a single 25 m dish by the ratio of their sizes.
  const ratio = R.resolutionArcsec(0.21, R.DEMO_DISH_M) / R.resolutionArcsec(0.21, longest * 1000);
  assert.ok(Math.abs(ratio - (longest * 1000) / 25) < 1e-6);
});

test('as the Earth turns, each pair sweeps round and fills in more of the giant dish', () => {
  const t0 = R.tracks(R.DEMO_ARRAY_KM, 0);
  assert.equal(t0.length, 10);
  t0.forEach((t) => assert.equal(t.points.length, 1));
  const t6 = R.tracks(R.DEMO_ARRAY_KM, 6);
  t6.forEach((t) => {
    assert.equal(t.points.length, 31, '90 degrees in 3-degree steps');
    // A pair's separation keeps its length as it swings round.
    t.points.forEach((p) => assert.ok(Math.abs(Math.hypot(p.x, p.y) - t.length) < 1e-9));
    t.mirror.forEach((p, k) => assert.ok(Math.abs(p.x + t.points[k].x) < 1e-12));
  });
  const f = [0, 1, 3, 6, 12].map((h) => R.coverageFraction(R.DEMO_ARRAY_KM, h));
  for (let i = 1; i < f.length; i += 1) assert.ok(f[i] > f[i - 1], `${f}`);
  assert.ok(f[4] > 0.5 && f[4] <= 1);
  assert.equal(R.DEGREES_PER_HOUR, 15);
});
