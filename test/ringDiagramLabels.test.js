const test = require('node:test');
const assert = require('node:assert/strict');
const { layoutRingColumn } = require('../src/ringDiagramLabels');

// A 4-layer diagram (Earth/Moon convention), outer to inner.
const EARTH_LAYERS = [
  { name: 'Crust', radius: 200 },
  { name: 'Mantle', radius: 188 },
  { name: 'Outer core', radius: 106 },
  { name: 'Inner core', radius: 43 },
];
const BASE = { cx: 198, cy: 260, outerRadius: 200, width: 600, height: 520, labelX: 396 };

test('labels are evenly spaced, outer layer first (top) through to the innermost layer last (bottom)', () => {
  const rows = layoutRingColumn({ ...BASE, layers: EARTH_LAYERS });
  assert.equal(rows.length, 4);
  assert.deepEqual(rows.map((r) => r.name), ['Crust', 'Mantle', 'Outer core', 'Inner core']);
  for (let i = 1; i < rows.length; i += 1) {
    assert.ok(rows[i].labelY > rows[i - 1].labelY, 'each label sits below the previous one');
  }
  const gaps = rows.slice(1).map((r, i) => r.labelY - rows[i].labelY);
  gaps.forEach((gap) => assert.ok(Math.abs(gap - gaps[0]) < 1e-9, 'every gap between consecutive labels is identical'));
});

test('every label shares the same x', () => {
  const rows = layoutRingColumn({ ...BASE, layers: EARTH_LAYERS });
  rows.forEach((r) => assert.equal(r.labelX, BASE.labelX));
});

test("each layer's dot sits at the midpoint radius of its own band (between its own radius and the next layer in)", () => {
  const rows = layoutRingColumn({ ...BASE, layers: EARTH_LAYERS });
  assert.equal(rows[0].bandRadius, (200 + 188) / 2);
  assert.equal(rows[1].bandRadius, (188 + 106) / 2);
  assert.equal(rows[2].bandRadius, (106 + 43) / 2);
  assert.equal(rows[3].bandRadius, (43 + 0) / 2); // innermost layer's band runs down to the centre
  rows.forEach((r) => {
    const dist = Math.hypot(r.dotX - BASE.cx, r.dotY - BASE.cy);
    assert.ok(Math.abs(dist - r.bandRadius) < 1e-9, `dot for ${r.name} should sit exactly at its band radius`);
  });
});

test('a leader line never has to cross another: every dot sits on the straight line from the centre to its own label, so each leader is just the outer part of its own ray', () => {
  const rows = layoutRingColumn({ ...BASE, layers: EARTH_LAYERS });
  rows.forEach((r) => {
    // Collinearity: (dot - centre) and (label - centre) point the same way.
    const dotAngle = Math.atan2(r.dotY - BASE.cy, r.dotX - BASE.cx);
    const labelAngle = Math.atan2(r.labelY - BASE.cy, r.labelX - BASE.cx);
    assert.ok(Math.abs(dotAngle - labelAngle) < 1e-9, `${r.name}'s dot should lie on the ray toward its own label`);
  });
  // Rays to monotonically-ordered (top to bottom) labels sweep through a
  // monotonically-ordered sequence of angles, so no two rays ever cross
  // except at the shared centre, which is below every dot's own radius.
  const angles = rows.map((r) => Math.atan2(r.labelY - BASE.cy, r.labelX - BASE.cx));
  for (let i = 1; i < angles.length; i += 1) {
    assert.ok(angles[i] > angles[i - 1], 'label angle (from centre) moves steadily in one direction, top to bottom');
  }
});

test('a 6-layer diagram (the Sun) spaces its labels across the same span, just more tightly', () => {
  const sunLayers = [
    { name: 'Corona', radius: 200 },
    { name: 'Chromosphere', radius: 145 },
    { name: 'Photosphere', radius: 133 },
    { name: 'Convective zone', radius: 104 },
    { name: 'Radiative zone', radius: 67 },
    { name: 'Core', radius: 30 },
  ];
  const rows = layoutRingColumn({ ...BASE, layers: sunLayers });
  assert.equal(rows.length, 6);
  const firstGap = rows[1].labelY - rows[0].labelY;
  assert.ok(Math.abs(firstGap - (BASE.outerRadius * 2) / 6) < 1e-9);
});

test('percentages are the raw coordinates expressed as a share of width/height', () => {
  const rows = layoutRingColumn({ ...BASE, layers: EARTH_LAYERS });
  rows.forEach((r) => {
    assert.equal(r.leftPercent, (r.labelX / BASE.width) * 100);
    assert.equal(r.topPercent, (r.labelY / BASE.height) * 100);
    assert.equal(r.dotLeftPercent, (r.dotX / BASE.width) * 100);
    assert.equal(r.dotTopPercent, (r.dotY / BASE.height) * 100);
  });
});

test('the outermost layer (first in the array) is always the top label, however many layers there are', () => {
  [1, 2, 3, 4, 5, 6, 7].forEach((n) => {
    const layers = Array.from({ length: n }, (_, i) => ({ name: `layer-${i}`, radius: 200 - i * 20 }));
    const rows = layoutRingColumn({ ...BASE, layers });
    assert.equal(rows[0].name, 'layer-0');
    assert.ok(rows[0].labelY < rows[rows.length - 1].labelY || n === 1);
  });
});
