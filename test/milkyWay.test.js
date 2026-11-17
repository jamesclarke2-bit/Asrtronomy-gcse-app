const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/milkyWay');

test('sizes: a flat disc about 100,000 light-years across and 1,000 thick, the Sun about 26,000 from the centre', () => {
  assert.equal(G.DISC_DIAMETER_KLY, 100);
  assert.equal(G.DISC_THICKNESS_KLY, 1);
  assert.equal(G.SUN_FROM_CENTRE_KLY, 26);
  assert.ok(G.SUN_FROM_CENTRE_KLY < G.DISC_RADIUS_KLY);
  assert.equal(G.HUBBLE_TYPE, 'SBb');
  assert.equal(Math.hypot(G.sun().x, G.sun().y), G.SUN_FROM_CENTRE_KLY);
});

test('the Sun sits between arms, not inside one', () => {
  const s = G.sun();
  const nearest = Math.min(...G.ARMS.flatMap((a) => a.points.map((p) => Math.hypot(p.x - s.x, p.y - s.y))));
  assert.ok(nearest > 2 * G.ARM_HALF_WIDTH_KLY, String(nearest));
});

test('the arms trail the rotation: they wind anticlockwise outwards while the Galaxy turns clockwise', () => {
  // The Sun moves towards l = 90 degrees; clockwise means negative angular momentum.
  const s = G.sun();
  const v = G.direction(90);
  assert.ok(s.x * v.y - s.y * v.x < 0, 'clockwise');
  G.ARMS.forEach((arm) => {
    const a0 = Math.atan2(arm.points[0].y, arm.points[0].x);
    const a1 = Math.atan2(arm.points[10].y, arm.points[10].x);
    const turn = ((a1 - a0 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
    assert.ok(turn > 0, `${arm.id} winds anticlockwise outwards`);
  });
});

test('line-of-sight speed: zero at the Sun’s own distance, positive (away) inside it, negative (towards) outside', () => {
  assert.equal(G.radialVelocity(50, G.SUN_FROM_CENTRE_KLY), 0);
  assert.ok(G.radialVelocity(50, 15) > 0);
  assert.ok(G.radialVelocity(50, 40) < 0);
  assert.equal(G.radialVelocity(0, 15), 0, 'looking straight at the centre, no speed along the line');
});

test('a redshift (moving away) lengthens the 21 cm line, a blueshift shortens it', () => {
  assert.ok(G.shiftedWavelengthCm(100, 3e8) > G.H21_CM);
  assert.ok(G.shiftedWavelengthCm(-100, 3e8) < G.H21_CM);
  assert.ok(Math.abs(G.shiftedWavelengthCm(100, 3e8) - 21.1 * (1 + 1 / 3000)) < 1e-12);
});

test('every slider direction crosses at least one arm, each crossing lettered in order, with the right sign', () => {
  for (let l = 40; l <= 160; l += 10) {
    const cs = G.crossings(l);
    assert.ok(cs.length >= 1 && cs.length <= 5, `${l}: ${cs.length}`);
    cs.forEach((c, k) => {
      assert.equal(c.letter, String.fromCharCode(65 + k));
      if (k) assert.ok(c.d > cs[k - 1].d, 'nearest first');
      assert.ok(Math.abs(c.v - G.radialVelocity(l, c.R)) < 1e-9);
      assert.ok(c.R <= G.DISC_RADIUS_KLY);
    });
  }
  // Beyond 90 degrees every arm crossed is outside the Sun's orbit, so all move towards us.
  for (let l = 100; l <= 160; l += 10) G.crossings(l).forEach((c) => assert.ok(c.v < 0, `${l} ${c.letter}`));
  // At 50 degrees the line crosses arms inside and outside the Sun's orbit: both signs.
  const vs = G.crossings(50).map((c) => c.v);
  assert.ok(vs.some((v) => v > 0) && vs.some((v) => v < 0));
});
