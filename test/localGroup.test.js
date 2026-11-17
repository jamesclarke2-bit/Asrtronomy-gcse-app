const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../src/localGroup');
const V = require('../src/variableStars');
const SpecData = require('../src/specData');

test('the LMC distance agrees with the Cepheid worked example on Variable stars: about 50,000 pc', () => {
  const c = V.cepheidById('lmc');
  const d = V.cepheidDistance(c.periodDays, (c.brightest + c.faintest) / 2).distancePc;
  assert.equal(L.LMC_PC, 50000);
  assert.ok(Math.abs(d - L.LMC_PC) / L.LMC_PC < 0.05);
  assert.equal(L.member('lmc').pc, L.LMC_PC);
});

test('the Andromeda distance comes from the Variable stars Cepheid too, about 760,000 pc (2.5 million light-years)', () => {
  const c = V.cepheidById('andromeda');
  const d = V.cepheidDistance(c.periodDays, (c.brightest + c.faintest) / 2).distancePc;
  assert.equal(L.M31_PC, L.roundSig(d, 2));
  assert.equal(L.distanceText(L.M31_PC), 'about 760,000 pc (about 2.5 million light-years)');
});

test('light-years use the data sheet’s 1 pc = 3.26 ly', () => {
  assert.equal(L.PC_TO_LY, SpecData.CONSTANTS.parsecLightYears);
  assert.equal(L.lightYears(1000), 3260);
  assert.equal(L.distanceText(L.LMC_PC), 'about 50,000 pc (about 160,000 light-years)');
});

test('the members the spec names are all on the map, each with a shape', () => {
  ['mw', 'm31', 'm33', 'lmc', 'smc'].forEach((id) => assert.ok(L.member(id), id));
  assert.equal(L.member('m31').shape, 'spiral');
  assert.equal(L.member('m33').shape, 'spiral');
  assert.equal(L.member('lmc').shape, 'irregular');
  assert.equal(L.member('smc').shape, 'irregular');
  assert.equal(L.member('mw').shape, 'barred-spiral');
  // The Magellanic Clouds are close neighbours; M31 and M33 far off, and near each other.
  assert.ok(L.member('lmc').pc < L.member('smc').pc && L.member('smc').pc < 100000);
  const a = L.position(L.member('m31'));
  const b = L.position(L.member('m33'));
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 300000);
  // Every member sits inside the group's rough size.
  L.MEMBERS.forEach((m) => assert.ok(m.pc < L.GROUP.acrossPc / 2, m.id));
});

test('the Local Group holds more than 50 galaxies, most of them dwarfs', () => {
  assert.ok(L.GROUP.galaxies > 50);
  assert.equal(L.LEVELS[0].holds, 'more than 50 galaxies, most of them dwarfs');
});

test('the zoom-out levels get bigger at every step', () => {
  assert.deepEqual(L.LEVELS.map((l) => l.id), ['group', 'cluster', 'supercluster', 'web']);
  for (let k = 1; k < L.LEVELS.length; k += 1) assert.ok(L.LEVELS[k].acrossLy > L.LEVELS[k - 1].acrossLy);
  assert.equal(L.LEVELS[0].acrossLy, L.roundSig(L.lightYears(L.GROUP.acrossPc), 1));
});
