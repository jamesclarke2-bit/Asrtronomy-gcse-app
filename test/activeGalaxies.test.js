const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../src/activeGalaxies');

test('the three types the spec names', () => {
  assert.deepEqual(A.TYPES.map((t) => t.name), ['Seyfert galaxy', 'Quasar', 'Blazar']);
});

test('one model, different views: a blazar near the jet, otherwise a quasar if hugely powerful and a Seyfert if less so', () => {
  for (let a = 0; a <= A.BLAZAR_MAX_DEG; a += 5) {
    assert.equal(A.classify(a, 'modest'), 'blazar', String(a));
    assert.equal(A.classify(a, 'huge'), 'blazar', String(a));
  }
  for (let a = A.BLAZAR_MAX_DEG + 5; a <= 90; a += 5) {
    assert.equal(A.classify(a, 'huge'), 'quasar', String(a));
    assert.equal(A.classify(a, 'modest'), 'seyfert', String(a));
  }
});

test('the spectrum strip runs from radio to gamma rays, each band showing a different part', () => {
  assert.deepEqual(A.BANDS.map((b) => b.id), ['radio', 'infrared', 'visible', 'ultraviolet', 'xray', 'gamma']);
  assert.match(A.band('radio').shows, /jets/);
  assert.match(A.band('infrared').shows, /dusty ring/);
  assert.match(A.band('xray').shows, /hottest gas/);
  assert.equal(new Set(A.BANDS.map((b) => b.shows)).size, A.BANDS.length);
  ['xray', 'gamma', 'ultraviolet'].forEach((id) => assert.match(A.band(id).telescope, /space/));
});
