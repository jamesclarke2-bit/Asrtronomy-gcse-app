const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../src/bigBang');

test('four steps, expanding, ending today', () => {
  assert.equal(B.STEPS.length, 4);
  for (let k = 1; k < 4; k += 1) assert.ok(B.STEPS[k].a > B.STEPS[k - 1].a);
  assert.equal(B.STEPS[3].a, 1);
  assert.equal(B.STEPS[3].label, 'today');
});

test('Big Bang: hot gas with no galaxies at step 1, then galaxies that thin out as it expands', () => {
  assert.equal(B.FIRST_GALAXY_STEP, 1);
  assert.deepEqual(B.bigBang(0), [], 'no galaxies at the start');
  const counts = B.STEPS.map((_, k) => B.bigBang(k).length);
  for (let k = 2; k < 4; k += 1) assert.ok(counts[k] < counts[k - 1], counts.join(','));
  assert.ok(counts[1] > 3 * counts[3]);
  B.STEPS.forEach((_, k) => B.bigBang(k).forEach((g) => assert.ok(B.inPatch(g))));
});

test('Steady State: the same number in the patch at every step, topped up by new galaxies', () => {
  B.STEPS.forEach((_, k) => {
    const gals = B.steadyState(k);
    assert.equal(gals.length, B.TODAY_COUNT, `step ${k}`);
    gals.forEach((g) => assert.ok(B.inPatch(g)));
    if (k > 0) assert.ok(gals.some((g) => g.created === k), `step ${k} has new galaxies`);
  });
  // Today the two models hold about the same number: they differ about the past.
  assert.ok(Math.abs(B.bigBang(3).length - B.TODAY_COUNT) <= 3);
});

test('the marked pair appears from step 2 and moves apart in step with the expansion in both models', () => {
  assert.equal(B.markedPair(0), null);
  assert.equal(B.pairGap(0), null);
  for (let k = 2; k < 4; k += 1) {
    assert.ok(Math.abs(B.pairGap(k) / B.pairGap(1) - B.STEPS[k].a / B.STEPS[1].a) < 1e-9);
  }
  for (let k = 1; k < 4; k += 1) B.markedPair(k).forEach((p) => assert.ok(B.inPatch(p)));
});
