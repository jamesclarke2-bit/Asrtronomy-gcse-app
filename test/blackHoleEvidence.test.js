const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../src/blackHoleEvidence');
const M = require('../src/massiveStar');

test('Kepler’s third law in Solar System units gives S2’s central mass as about 3.9 million Suns', () => {
  assert.equal(B.massFromOrbit(1, 1), 1, 'the Earth round the Sun gives one Sun mass');
  assert.equal(B.massFromOrbit(B.S2.aAU, B.S2.periodYears), 3906250);
});

test('an unseen partner is a black hole only above the neutron-star limit', () => {
  assert.equal(B.mustBeBlackHole(M.NEUTRON_STAR_MAX_MSUN), false);
  assert.equal(B.mustBeBlackHole(2), false);
  assert.equal(B.mustBeBlackHole(B.CYGNUS_X1.companionMsun), true);
});

test('S2 is closest (about 120 AU) and fastest at its closest years, and slow far out', () => {
  assert.ok(Math.abs(B.closestApproachAU() - 120) < 1e-9);
  [2002, 2018].forEach((y) => {
    const p = B.s2At(y);
    assert.ok(Math.abs(p.r - 120) < 1e-6, `${y}: ${p.r}`);
    assert.ok(Math.abs(p.speedKms - 7368) < 20, `${y}: ${p.speedKms}`);
  });
  const far = B.s2At(2010);
  assert.ok(Math.abs(far.r - 1880) < 1e-6);
  assert.ok(far.speedKms < 500 && far.speedKms > 400, String(far.speedKms));
  // Speed falls steadily from the closest point out to the furthest.
  let last = Infinity;
  for (let y = 2018; y <= 2026; y += 1) {
    const v = B.s2At(y).speedKms;
    assert.ok(v < last + 1e-9, `${y}`);
    last = v;
  }
});

test('the orbit repeats every period and stays on the ellipse', () => {
  const a = B.s2At(2005.3);
  const b = B.s2At(2005.3 + B.S2.periodYears);
  assert.ok(Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6);
  const { aAU, e } = B.S2;
  const bAU = aAU * Math.sqrt(1 - e * e);
  for (let y = 2002; y <= 2018; y += 0.5) {
    const p = B.s2At(y);
    const u = (p.x + aAU * e) / aAU;
    const v = p.y / bAU;
    assert.ok(Math.abs(u * u + v * v - 1) < 1e-9, String(y));
  }
});
