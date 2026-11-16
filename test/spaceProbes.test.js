const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../src/spaceProbes');
const SpecData = require('../src/specData');
const { getSpecPoint } = require('../src/specPoints');

test('the four kinds of probe the spec names, each with advantages and disadvantages', () => {
  assert.match(getSpecPoint('11.26').text, /fly-by, orbiter, impactor and lander/);
  assert.deepEqual(P.TYPES.map((t) => t.name), ['Fly-by', 'Orbiter', 'Impactor', 'Lander']);
  P.TYPES.forEach((t) => {
    assert.ok(t.pros.length >= 2 && t.cons.length >= 2, t.id);
    assert.ok(t.does.length > 20, t.id);
  });
  assert.throws(() => P.type('rover'));
});

test('one mission of each kind, as the spec names them (Juno or Dawn for the orbiter), each with a target, dates and discoveries', () => {
  assert.match(getSpecPoint('11.27').text, /New Horizons; Juno or Dawn; Deep Impact; Philae/);
  assert.deepEqual(P.missionsOfType('flyby').map((m) => m.name), ['New Horizons']);
  assert.deepEqual(P.missionsOfType('orbiter').map((m) => m.name), ['Juno', 'Dawn']);
  assert.deepEqual(P.missionsOfType('impactor').map((m) => m.name), ['Deep Impact']);
  assert.deepEqual(P.missionsOfType('lander').map((m) => m.name), ['Philae']);
  P.MISSIONS.forEach((m) => {
    assert.ok(m.target && m.dates && m.finds.length >= 2, m.id);
  });
});

test('escape velocity from the model is about 11.2 km/s; below it a probe falls back, at or above it it escapes', () => {
  assert.ok(Math.abs(P.ESCAPE_KMS - 11.19) < 0.01);
  assert.equal(P.outcome(8), 'falls back');
  assert.equal(P.outcome(11.1), 'falls back');
  assert.equal(P.outcome(11.2), 'escapes');
  assert.equal(P.maxHeightKm(12), Infinity);
  // Faster launches go higher, without limit as the speed nears escape velocity.
  let last = 0;
  for (let v = 4; v < 11.15; v += 0.5) {
    const h = P.maxHeightKm(v);
    assert.ok(h > last, `${v} km/s`);
    last = h;
  }
  assert.ok(Math.abs(P.maxHeightKm(8) - 6670) < 10);
});

test("reaching the Moon's distance (data sheet) needs nearly the escape velocity", () => {
  assert.equal(P.MOON_DISTANCE_KM, SpecData.CONSTANTS.meanEarthMoonDistanceKm);
  const v = P.speedToReachKm(P.MOON_DISTANCE_KM);
  assert.ok(v > 11 && v < P.ESCAPE_KMS);
  assert.ok(Math.abs(P.maxHeightKm(v) - P.MOON_DISTANCE_KM) < 1);
});
