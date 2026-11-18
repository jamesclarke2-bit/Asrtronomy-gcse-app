const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../src/apollo');
const SpecData = require('../src/specData');
const { getSubtopic } = require('../src/curriculum');

test('u5.8 covers 11.29 and 11.30 at "understand"', () => {
  const s = getSubtopic('u5.8');
  assert.equal(s.title, 'Crewed missions and Apollo');
  assert.deepEqual(s.spec, ['11.29', '11.30']);
  assert.equal(s.depth, 'understand');
});

test('advantages and disadvantages: four each, unique keys, short labels that fit a phone column', () => {
  for (const list of [A.ADVANTAGES, A.DISADVANTAGES]) {
    assert.equal(list.length, 4);
    list.forEach((x) => {
      assert.ok(x.main.length <= 20, x.main);
      assert.ok(x.detail.length <= 27, x.detail);
    });
  }
  const keys = [...A.ADVANTAGES, ...A.DISADVANTAGES].map((x) => x.key);
  assert.equal(new Set(keys).size, keys.length);
  ['decide', 'repair', 'return'].forEach((k) => assert.ok(keys.includes(k), k));
  ['life-support', 'risk', 'radiation', 'range'].forEach((k) => assert.ok(keys.includes(k), k));
});

test('each task picks a crew or a probe and highlights only real points on the matching side', () => {
  const adv = new Set(A.ADVANTAGES.map((x) => x.key));
  const dis = new Set(A.DISADVANTAGES.map((x) => x.key));
  assert.deepEqual(A.TASKS.map((t) => t.verdict).sort(), ['crewed', 'crewed', 'probe', 'probe']);
  A.TASKS.forEach((t) => {
    assert.ok(t.highlight.length >= 1, t.key);
    // A crewed verdict is made by a crew's advantages; a probe verdict by a crew's disadvantages.
    t.highlight.forEach((k) => assert.ok((t.verdict === 'crewed' ? adv : dis).has(k), `${t.key}: ${k}`));
  });
});

test('three modules with their jobs; only the Command Module comes home', () => {
  assert.deepEqual(A.MODULES.map((m) => m.name), ['Command Module', 'Service Module', 'Lunar Module']);
  assert.match(A.MODULES[0].job, /only part that came home.*heat shield/);
  assert.match(A.MODULES[1].job, /engine/);
  assert.match(A.MODULES[2].job, /two astronauts.*top half flew back up.*bottom half stayed/);
});

test('the mission profile runs in order: launch, Earth orbit, about 3 days out, lunar orbit, landing, ascent and docking, home, splashdown', () => {
  assert.deepEqual(A.PROFILE.map((p) => p.name), ['Launch', 'Earth orbit', 'Coast to the Moon', 'Lunar orbit', 'Landing', 'Ascent and docking', 'Coast home', 'Splashdown']);
  assert.match(A.PROFILE[2].text, /About 3 days/);
  assert.match(A.PROFILE[6].text, /about 3 days/);
});

test('exactly four key missions: Apollo 8, 11, 13 and 17, in date order', () => {
  assert.deepEqual(A.MISSIONS.map((m) => m.name), ['Apollo 8', 'Apollo 11', 'Apollo 13', 'Apollo 17']);
  assert.deepEqual(A.MISSIONS.map((m) => m.year), [1968, 1969, 1970, 1972]);
});

test('the laser round trip uses the data sheet distance and speed of light: about 2.53 s', () => {
  assert.equal(A.EARTH_MOON_KM, SpecData.CONSTANTS.meanEarthMoonDistanceKm);
  assert.equal(A.C_M_PER_S, SpecData.CONSTANTS.speedOfLightMPerS);
  assert.ok(Math.abs(A.laserRoundTripSeconds() - (2 * A.EARTH_MOON_KM * 1000) / A.C_M_PER_S) < 1e-12);
  assert.equal(A.laserRoundTripSeconds().toFixed(2), '2.53');
  assert.equal(A.laserRoundTripSeconds(150000).toFixed(1), '1.0');
});

test('the one-line figures the page states: about 110 m, about $25 billion, about 382 kg', () => {
  assert.equal(A.SATURN_V_HEIGHT_M, 110);
  assert.equal(A.COST_BILLION_DOLLARS, 25);
  assert.equal(A.SAMPLES_KG, 382);
});
