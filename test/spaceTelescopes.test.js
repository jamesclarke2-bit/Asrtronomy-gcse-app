const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../src/spaceTelescopes');
const W = require('../src/atmosphereWindows');
const SpecData = require('../src/specData');

test('the bands that never reach the ground are exactly the ones the shared chart marks blocked', () => {
  assert.deepEqual(T.spaceOnlyBands(), ['Gamma ray', 'X-ray', 'Ultraviolet']);
  T.spaceOnlyBands().forEach((name) => assert.equal(W.BANDS.find((b) => b.name === name).category, 'blocked'));
});

test('every band of the chart has a verdict, and the balance tips the right way', () => {
  W.BANDS.forEach((b) => {
    const v = T.verdict(b.name);
    assert.ok(v.tilt >= -1 && v.tilt <= 1, b.name);
    assert.ok(v.reason.length > 20, b.name);
  });
  T.spaceOnlyBands().forEach((name) => assert.equal(T.verdict(name).tilt, 1, `${name} needs space`));
  assert.equal(T.verdict('Radio').tilt, -1);
  assert.equal(T.verdict('Optical').tilt, 0, 'visible light: both have a case');
  assert.ok(T.verdict('Infrared').tilt > 0 && T.verdict('Infrared').tilt < 1, 'infrared: mostly space');
  assert.throws(() => T.verdict('Microwave'));
});

test('a band that reaches the ground never comes out as space only', () => {
  W.BANDS.filter((b) => b.category === 'open').forEach((b) => assert.ok(T.verdict(b.name).tilt < 1, b.name));
});

test('the far orbit, compared with the data sheet Moon distance, is about four times as far', () => {
  assert.equal(SpecData.CONSTANTS.meanEarthMoonDistanceKm, 380000);
  assert.ok(Math.abs(T.farOrbitInMoonDistances() - 1.5e6 / 380000) < 1e-12);
  assert.equal(Math.round(T.farOrbitInMoonDistances()), 4);
  assert.ok(T.ORBITS.low.heightKm < 1000, 'a low orbit is a few hundred km up');
});
