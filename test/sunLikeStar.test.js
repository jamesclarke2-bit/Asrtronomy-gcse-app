const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../src/sunLikeStar');
const SpecData = require('../src/specData');
const { getSpecPoint } = require('../src/specPoints');

test('the seven stages the spec names, in life order (the red giant before the planetary nebula)', () => {
  assert.match(getSpecPoint('14.9').text, /emission\/absorption nebula, main sequence star, planetary nebula, red giant, white dwarf, black dwarf/);
  assert.deepEqual(L.STAGES.map((s) => s.id), ['nebula', 'protostar', 'main-sequence', 'red-giant', 'planetary-nebula', 'white-dwarf', 'black-dwarf']);
  L.STAGES.forEach((s) => {
    assert.ok(s.time.length > 5 && s.core.length > 20, s.id);
    assert.ok(s.balance.verdict.length > 20, s.id);
  });
  assert.equal(L.nextStage('red-giant').id, 'planetary-nebula');
  assert.equal(L.nextStage('black-dwarf'), null);
  assert.throws(() => L.stage('supernova'));
});

test('the balance at each stage: steady on the main sequence by radiation pressure, a white dwarf by electron pressure', () => {
  assert.equal(L.trend('main-sequence'), 'steady');
  assert.equal(L.stage('main-sequence').balance.outName, 'radiation pressure');
  assert.equal(L.trend('protostar'), 'shrinking', 'gravity wins');
  assert.equal(L.trend('red-giant'), 'swelling');
  assert.equal(L.trend('white-dwarf'), 'steady');
  assert.equal(L.stage('white-dwarf').balance.outName, 'electron pressure');
  assert.match(L.stage('white-dwarf').core, /No fusion/);
});

test('timescales: the main sequence is the longest stage, a planetary nebula the shortest, and no black dwarf exists yet', () => {
  assert.equal(L.longestStage().id, 'main-sequence');
  const timed = L.STAGES.filter((s) => s.years);
  assert.equal(timed.reduce((a, b) => (b.years < a.years ? b : a)).id, 'planetary-nebula');
  assert.equal(L.stage('black-dwarf').years, null);
});

test('the Sun-like track starts its main sequence at the data sheet Sun, and is laid out for a second (massive) track', () => {
  const t = L.TRACKS.sunLike;
  assert.deepEqual(t.points['main-sequence'], [SpecData.CONSTANTS.photosphereTemperatureK, 1]);
  assert.ok(t.points['red-giant'][1] > 100 && t.points['red-giant'][0] < SpecData.CONSTANTS.photosphereTemperatureK, 'up and to the right');
  assert.ok(t.points['white-dwarf'][1] < 0.1 && t.points['white-dwarf'][0] > 10000, 'down and to the left');
  assert.equal(t.points.nebula, undefined, 'a nebula is not on the diagram');
  assert.deepEqual(Object.keys(L.TRACKS), ['sunLike']);
});
