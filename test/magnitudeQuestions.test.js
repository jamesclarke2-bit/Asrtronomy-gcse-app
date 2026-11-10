const test = require('node:test');
const assert = require('node:assert/strict');
const { makeQuestions } = require('../src/magnitudeQuestions');
const Magnitude = require('../src/magnitude');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('makeQuestions returns 10 questions, each tagged u4.2 only, with unique ids', () => {
  const questions = makeQuestions(Magnitude);
  assert.equal(questions.length, 10);
  const ids = questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
  questions.forEach((q) => {
    assert.ok(Array.isArray(q.units) && q.units.length > 0, `${q.id} has no units`);
    q.units.forEach((id) => assert.equal(id, 'u4.2', `${q.id} tags unexpected unit "${id}"`));
  });
});

test('which-brighter-sign-convention: the magnitude -1 option is the only correct one', () => {
  const q = findQuestion(makeQuestions(Magnitude), 'which-brighter-sign-convention');
  const correctOption = q.options.find((o) => o.startsWith('The magnitude -1 star'));
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => assert.equal(q.check(o).correct, false));
});

test('apparent-vs-absolute-words: "farther away" is the only correct option', () => {
  const q = findQuestion(makeQuestions(Magnitude), 'apparent-vs-absolute-words');
  const correctOption = q.options.find((o) => o.includes('farther away'));
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => assert.equal(q.check(o).correct, false));
});

test('which-brighter-and-by-what-factor: Star A and factor 100 (within tolerance) is correct', () => {
  const q = findQuestion(makeQuestions(Magnitude), 'which-brighter-and-by-what-factor');
  assert.ok(q.check({ brighter: 'Star A', factor: 100 }).correct);
  assert.equal(q.check({ brighter: 'Star B', factor: 100 }).correct, false);
  assert.equal(q.check({ brighter: 'Star A', factor: 10 }).correct, false);
});

test('ratio-from-difference: accepts the engine value for a 4-magnitude difference within 2%', () => {
  const q = findQuestion(makeQuestions(Magnitude), 'ratio-from-difference');
  const expected = Magnitude.brightnessRatio(4);
  assert.ok(q.check(expected).correct);
  assert.equal(q.check(expected * 2).correct, false);
});

test('magnitude-difference-from-ratio: accepts the engine value for a ratio of 630 within 0.1', () => {
  const q = findQuestion(makeQuestions(Magnitude), 'magnitude-difference-from-ratio');
  const expected = Magnitude.magnitudeDifference(630);
  assert.ok(q.check(expected).correct);
  assert.equal(q.check(expected + 1).correct, false);
});

test('mental-maths-shortcut: accepts the exact engine ratio for 1.5 magnitudes within tolerance', () => {
  const q = findQuestion(makeQuestions(Magnitude), 'mental-maths-shortcut');
  const expected = Magnitude.brightnessRatio(1.5);
  assert.ok(q.check(expected).correct);
  assert.equal(q.check(expected * 3).correct, false);
});

test('fading-star-factor: accepts a factor of 100 (5-magnitude difference) within 2%', () => {
  const q = findQuestion(makeQuestions(Magnitude), 'fading-star-factor');
  assert.ok(q.check(100).correct);
  assert.equal(q.check(10).correct, false);
});

test('distance-from-modulus: accepts 100 pc within 2%', () => {
  const q = findQuestion(makeQuestions(Magnitude), 'distance-from-modulus');
  assert.ok(q.check(100).correct);
  assert.equal(q.check(50).correct, false);
});

test('absolute-from-modulus: accepts the engine value within 0.1', () => {
  const q = findQuestion(makeQuestions(Magnitude), 'absolute-from-modulus');
  const expected = Magnitude.absoluteFromApparent(7.0, 50);
  assert.ok(q.check(expected).correct);
  assert.equal(q.check(expected + 1).correct, false);
});

test('explain-distance-modulus: the inverse-square-law explanation is the only correct option', () => {
  const q = findQuestion(makeQuestions(Magnitude), 'explain-distance-modulus');
  const correctOption = q.options.find((o) => o.startsWith('Brightness falls with the inverse-square law'));
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => assert.equal(q.check(o).correct, false));
});
