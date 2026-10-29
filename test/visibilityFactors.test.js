const test = require('node:test');
const assert = require('node:assert/strict');
const VisibilityFactors = require('../src/visibilityFactors');

test('pathLengthMultiplier: 1 at the zenith (90 degrees altitude)', () => {
  assert.ok(Math.abs(VisibilityFactors.pathLengthMultiplier(90) - 1) < 1e-9);
});

test('pathLengthMultiplier: 2 at 30 degrees altitude', () => {
  assert.ok(Math.abs(VisibilityFactors.pathLengthMultiplier(30) - 2) < 1e-9);
});

test('pathLengthMultiplier: about 5.8 at 10 degrees altitude', () => {
  assert.ok(Math.abs(VisibilityFactors.pathLengthMultiplier(10) - 5.8) < 0.05);
});

test('pathLengthMultiplier: increases monotonically as altitude falls toward the horizon', () => {
  const altitudes = [90, 60, 30, 20, 10, 5];
  const multipliers = altitudes.map(VisibilityFactors.pathLengthMultiplier);
  for (let i = 1; i < multipliers.length; i += 1) {
    assert.ok(multipliers[i] > multipliers[i - 1], `multiplier at altitude ${altitudes[i]} should exceed that at ${altitudes[i - 1]}`);
  }
});
