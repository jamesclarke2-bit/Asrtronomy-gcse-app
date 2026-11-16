const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../src/massiveStar');
const L = require('../src/sunLikeStar');
const { getSpecPoint } = require('../src/specPoints');

test('the stages the spec names for a much more massive star, in order, with the two possible ends last', () => {
  assert.match(getSpecPoint('14.10').text, /emission\/absorption nebula, main sequence star, red supergiant, supernova, neutron star, black hole/);
  assert.deepEqual(M.STAGES.map((s) => s.id), ['nebula', 'main-sequence', 'red-supergiant', 'supernova', 'neutron-star', 'black-hole']);
  M.STAGES.forEach((s) => assert.ok(s.time && s.core.length > 20 && s.balance.verdict.length > 20, s.id));
  assert.equal(M.MASSIVE_MIN_MSUN, 8);
  assert.throws(() => M.stage('planetary-nebula'));
});

test('the balance: steady on the main sequence, swelling as a supergiant, collapsing in a supernova, and a neutron star held up by neutron pressure', () => {
  assert.equal(M.trend('main-sequence'), 'steady');
  assert.equal(M.trend('red-supergiant'), 'swelling');
  assert.equal(M.trend('supernova'), 'collapsing');
  assert.equal(M.trend('neutron-star'), 'steady');
  assert.equal(M.stage('neutron-star').balance.outName, 'neutron pressure');
  assert.equal(M.trend('black-hole'), 'collapsing');
  assert.equal(M.stage('black-hole').balance.out, 0);
  assert.match(M.stage('supernova').core, /iron releases no energy/);
});

test('the Chandrasekhar limit decides the end: white dwarf below about 1.4, neutron star up to about 3, black hole above', () => {
  assert.equal(M.CHANDRASEKHAR_MSUN, 1.4);
  assert.equal(M.coreEnd(1.0).id, 'white-dwarf');
  assert.equal(M.coreEnd(1.0).heldBy, 'electron pressure');
  assert.equal(M.coreEnd(1.39).id, 'white-dwarf');
  assert.equal(M.coreEnd(1.4).id, 'neutron-star');
  assert.equal(M.coreEnd(2.0).heldBy, 'neutron pressure');
  assert.equal(M.coreEnd(3.0).id, 'black-hole');
  assert.equal(M.coreEnd(5).id, 'black-hole');
});

test("the massive star's main sequence is about a thousand times shorter than a Sun-like star's", () => {
  assert.equal(M.mainSequenceRatio(), L.stage('main-sequence').years / M.stage('main-sequence').years);
  assert.equal(M.mainSequenceRatio(), 1000);
});
