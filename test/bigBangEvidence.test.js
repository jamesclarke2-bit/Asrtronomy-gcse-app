const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../src/bigBangEvidence');

test('the CMB curve: one smooth hump, peaking near 1 mm at 2.7 K', () => {
  assert.equal(E.CMB_TEMPERATURE_K, 2.7);
  assert.ok(Math.abs(E.peakWavelengthMm() - 1.073) < 0.001);
  const pts = E.cmbCurve(0.15, 5, 400);
  const max = pts.reduce((m, p) => (p.value > m.value ? p : m));
  assert.ok(Math.abs(max.value - 1) < 0.01);
  assert.ok(Math.abs(max.mm - E.peakWavelengthMm()) < 0.05);
  let rising = true;
  for (let i = 1; i < pts.length; i += 1) {
    if (pts[i].value < pts[i - 1].value) rising = false;
    else assert.ok(rising, 'only one peak');
  }
  assert.ok(pts[0].value < 0.01 && pts[pts.length - 1].value < 0.1);
});

test('quasars: none nearby, and the count peaks billions of light-years away', () => {
  assert.equal(E.QUASAR_BINS[0].from, 0);
  assert.equal(E.QUASAR_BINS[0].count, 0);
  const peak = E.QUASAR_BINS.reduce((m, b) => (b.count > m.count ? b : m));
  assert.ok(peak.from >= 6);
});

test('the deep field: a few near galaxies, many faint distant ones, none overlapping', () => {
  const { near, far } = E.DEEP_FIELD;
  assert.ok(near.length <= 5 && far.length >= 40);
  assert.ok(far.every((g) => g.distant && g.r < Math.min(...near.map((n) => n.r))));
  assert.ok(far.filter((g) => g.kind === 'irregular').length > far.length / 2, 'mostly irregular');
  const all = [...near, ...far];
  for (let i = 0; i < all.length; i += 1) {
    for (let j = i + 1; j < all.length; j += 1) assert.ok(Math.hypot(all[i].x - all[j].x, all[i].y - all[j].y) > all[i].r + all[j].r);
  }
});

test('the map gets finer at each level, keeping the same big patches', () => {
  const levels = E.MAP_LEVELS.map((_, k) => E.mapCells(k));
  assert.deepEqual(E.MAP_LEVELS.map((l) => l.id), ['early', 'wmap', 'planck']);
  for (let k = 1; k < levels.length; k += 1) assert.ok(levels[k].nx > levels[k - 1].nx);
  levels.forEach((l) => l.cells.forEach((c) => assert.ok(c.value >= -1 && c.value <= 1)));
  // The coarse map's warmest cell is still warm, on average, in the finest map.
  const coarse = levels[0];
  const fine = levels[2];
  const hot = coarse.cells.reduce((m, c) => (c.value > m.value ? c : m));
  const inside = fine.cells.filter((c) => Math.abs(c.u - hot.u) < 0.5 / coarse.nx && Math.abs(c.v - hot.v) < 0.5 / coarse.ny);
  const mean = inside.reduce((s, c) => s + c.value, 0) / inside.length;
  assert.ok(mean > 0.3, `mean ${mean}`);
  // The finest map holds both warmer and cooler cells.
  assert.ok(fine.cells.some((c) => c.value > 0.45) && fine.cells.some((c) => c.value < -0.45));
});
