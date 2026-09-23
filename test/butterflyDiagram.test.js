const test = require('node:test');
const assert = require('node:assert/strict');
const ButterflyDiagram = require('../src/butterflyDiagram');

test('latitude starts at LATITUDE_AT_CYCLE_START_DEG at the beginning of a cycle', () => {
  assert.equal(ButterflyDiagram.latitudeEnvelopeDeg(0), ButterflyDiagram.LATITUDE_AT_CYCLE_START_DEG);
});

test('latitude reaches 0 at the end of a cycle', () => {
  assert.equal(ButterflyDiagram.latitudeEnvelopeDeg(ButterflyDiagram.CYCLE_LENGTH_YEARS), 0);
});

test('latitude decreases monotonically across a cycle', () => {
  let previous = ButterflyDiagram.latitudeEnvelopeDeg(0);
  for (let t = 0.5; t <= ButterflyDiagram.CYCLE_LENGTH_YEARS; t += 0.5) {
    const current = ButterflyDiagram.latitudeEnvelopeDeg(t);
    assert.ok(current <= previous, `expected latitude to decrease or stay level at t=${t}`);
    previous = current;
  }
});

test('latitude is clamped for out-of-range inputs', () => {
  assert.equal(ButterflyDiagram.latitudeEnvelopeDeg(-5), ButterflyDiagram.LATITUDE_AT_CYCLE_START_DEG);
  assert.equal(ButterflyDiagram.latitudeEnvelopeDeg(ButterflyDiagram.CYCLE_LENGTH_YEARS + 5), 0);
});

test('halfway through the cycle, latitude is halfway between start and 0', () => {
  const half = ButterflyDiagram.CYCLE_LENGTH_YEARS / 2;
  const expected = ButterflyDiagram.LATITUDE_AT_CYCLE_START_DEG / 2;
  assert.ok(Math.abs(ButterflyDiagram.latitudeEnvelopeDeg(half) - expected) < 1e-9);
});
