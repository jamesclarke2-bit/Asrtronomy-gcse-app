const test = require('node:test');
const assert = require('node:assert/strict');
const { layoutRingLabel } = require('../src/ringDiagramLabels');

const BASE = { cx: 250, cy: 250, outerRadius: 135, width: 500, height: 500, margin: 85 };

test('top (90°): dot sits directly above centre at its own ring radius, leader end further up', () => {
  const r = layoutRingLabel({ ...BASE, radius: 20, angleDeg: 90 });
  assert.ok(Math.abs(r.dotX - 250) < 1e-9);
  assert.equal(r.dotY, 250 - 20);
  assert.ok(Math.abs(r.leaderEndX - 250) < 1e-9);
  assert.equal(r.leaderEndY, 250 - (135 + 85));
  assert.equal(r.side, 'top');
});

test('bottom (270°): dot and leader end sit below centre', () => {
  const r = layoutRingLabel({ ...BASE, radius: 90, angleDeg: 270 });
  assert.ok(Math.abs(r.dotX - 250) < 1e-9);
  assert.equal(r.dotY, 250 + 90);
  assert.equal(r.leaderEndY, 250 + (135 + 85));
  assert.equal(r.side, 'bottom');
});

test('left (180°) and right (0°): dot and leader end sit purely horizontal', () => {
  const left = layoutRingLabel({ ...BASE, radius: 110, angleDeg: 180 });
  assert.equal(left.dotX, 250 - 110);
  assert.ok(Math.abs(left.dotY - 250) < 1e-9);
  assert.equal(left.leaderEndX, 250 - 220);
  assert.equal(left.side, 'left');

  const right = layoutRingLabel({ ...BASE, radius: 110, angleDeg: 0 });
  assert.equal(right.dotX, 250 + 110);
  assert.equal(right.leaderEndX, 250 + 220);
  assert.equal(right.side, 'right');
});

test('every label in a diagram sits the same distance from the centre, regardless of its own ring radius', () => {
  const distanceFromCentre = (r) => Math.hypot(r.leaderEndX - 250, r.leaderEndY - 250);
  const inner = layoutRingLabel({ ...BASE, radius: 20, angleDeg: 90 });
  const outer = layoutRingLabel({ ...BASE, radius: 98, angleDeg: 150 });
  assert.ok(Math.abs(distanceFromCentre(inner) - distanceFromCentre(outer)) < 1e-9);
  assert.ok(Math.abs(distanceFromCentre(inner) - (BASE.outerRadius + BASE.margin)) < 1e-9);
});

test('the dot always sits closer to the centre than the leader end (the label is always outside every ring)', () => {
  [0, 45, 90, 135, 180, 225, 270, 315].forEach((angleDeg) => {
    const r = layoutRingLabel({ ...BASE, radius: 135, angleDeg });
    const dotDist = Math.hypot(r.dotX - 250, r.dotY - 250);
    const endDist = Math.hypot(r.leaderEndX - 250, r.leaderEndY - 250);
    assert.ok(endDist > dotDist, `leader end (${endDist}) should be further out than the dot (${dotDist}) at ${angleDeg}°`);
  });
});

test('diagonal angles (Sun\'s upper-left/lower-right style) split between two sides, never both axes at once', () => {
  const upperLeft = layoutRingLabel({ ...BASE, radius: 45, angleDeg: 150 });
  assert.equal(upperLeft.side, 'left');
  const lowerRight = layoutRingLabel({ ...BASE, radius: 98, angleDeg: 330 });
  assert.equal(lowerRight.side, 'right');
});

test('leftPercent/topPercent are leaderEnd expressed as a percentage of width/height', () => {
  const r = layoutRingLabel({ ...BASE, radius: 20, angleDeg: 90 });
  assert.equal(r.leftPercent, (r.leaderEndX / BASE.width) * 100);
  assert.equal(r.topPercent, (r.leaderEndY / BASE.height) * 100);
});

test('margin defaults to 70 when not given', () => {
  const withDefault = layoutRingLabel({ cx: 0, cy: 0, radius: 10, angleDeg: 90, outerRadius: 100, width: 500, height: 500 });
  assert.equal(withDefault.leaderEndY, -(100 + 70));
});

test('a 4-ring diagram (Earth/Moon convention: innermost = top, then clockwise) reproduces the existing inner-core/outer-core/mantle/crust layout', () => {
  const layers = [
    { name: 'inner-core', radius: 45, angleDeg: 90 },
    { name: 'outer-core', radius: 110, angleDeg: 0 },
    { name: 'mantle', radius: 195, angleDeg: 270 },
    { name: 'crust', radius: 208, angleDeg: 180 },
  ];
  const expectedSides = { 'inner-core': 'top', 'outer-core': 'right', mantle: 'bottom', crust: 'left' };
  layers.forEach((layer) => {
    const r = layoutRingLabel({ cx: 250, cy: 250, outerRadius: 208, width: 900, height: 900, margin: 70, radius: layer.radius, angleDeg: layer.angleDeg });
    assert.equal(r.side, expectedSides[layer.name]);
  });
});
