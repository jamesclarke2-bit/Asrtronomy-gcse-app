const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../src/galaxyTypes');

test('the four Hubble classes the spec names', () => {
  assert.deepEqual(T.CLASSES.map((c) => c.name), ['Spiral', 'Barred spiral', 'Elliptical', 'Irregular']);
});

test('the sorting set has two of each class, drawn as that class', () => {
  const kindFor = { spiral: 'spiral', barred: 'barred', elliptical: 'elliptical', irregular: 'irregular' };
  T.CLASSES.forEach((c) => assert.equal(T.SORT_SET.filter((s) => s.answer === c.id).length, 2, c.id));
  T.SORT_SET.forEach((s) => assert.equal(s.draw.kind, kindFor[s.answer], s.id));
});

test('feedback says right or wrong in words and symbols, and gives the clue', () => {
  const item = T.sortItem('g3');
  const right = T.feedback(item, 'barred');
  assert.equal(right.correct, true);
  assert.match(right.text, /^✓ Correct: barred spiral, a straight bar/);
  const wrong = T.feedback(item, 'spiral');
  assert.equal(wrong.correct, false);
  assert.match(wrong.text, /^✗ Not spiral\. Look again: it is barred spiral/);
});

test('the tuning fork: ellipticals E0 to E7 along the handle, S0 at the fork, spirals and barred spirals on the two prongs, a to c', () => {
  const at = (l) => T.forkSpot(l);
  ['E0', 'E3', 'E7', 'S0'].forEach((l) => assert.equal(at(l).y, at('E0').y, l));
  assert.ok(at('E0').x < at('E3').x && at('E3').x < at('E7').x && at('E7').x < at('S0').x);
  assert.deepEqual(['E0', 'E3', 'E7'].map((l) => at(l).draw.e), [0, 3, 7]);
  ['Sa', 'Sb', 'Sc'].forEach((l) => { assert.ok(at(l).y < at('S0').y, l); assert.equal(at(l).draw.kind, 'spiral'); });
  ['SBa', 'SBb', 'SBc'].forEach((l) => { assert.ok(at(l).y > at('S0').y, l); assert.equal(at(l).draw.kind, 'barred'); });
  assert.ok(at('Sa').x < at('Sb').x && at('Sb').x < at('Sc').x);
  assert.equal(at('S0').draw.kind, 'lenticular');
  assert.equal(T.MILKY_WAY_TYPE, 'SBb');
  assert.ok(at('SBb'));
  // Irregulars are off the fork: below the handle, left of the fork point.
  assert.equal(at('Irr').draw.kind, 'irregular');
  assert.ok(at('Irr').y > at('S0').y + 100);
});
