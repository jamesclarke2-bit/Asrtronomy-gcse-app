const test = require('node:test');
const assert = require('node:assert/strict');
const { makeQuestions } = require('../src/measuringTheSkyQuestions');
const SpecData = require('../src/specData');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('makeQuestions returns 8 questions, all tagged u2.28', () => {
  const questions = makeQuestions(SpecData);
  assert.equal(questions.length, 8);
  questions.forEach((q) => {
    assert.deepEqual(q.units, ['u2.28']);
  });
});

test('every question id is unique', () => {
  const questions = makeQuestions(SpecData);
  const ids = questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('sun-earth-diameter-ratio: states both data-sheet diameters, accepts ~108 within 2%', () => {
  const q = findQuestion(makeQuestions(SpecData), 'sun-earth-diameter-ratio');
  assert.ok(q.prompt.includes('1,400,000'));
  assert.ok(q.prompt.includes('13,000'));
  assert.ok(q.check(108).correct);
  assert.equal(q.check(150).correct, false);
});

test('earth-moon-diameter-ratio: accepts ~3.7 within 2%', () => {
  const q = findQuestion(makeQuestions(SpecData), 'earth-moon-diameter-ratio');
  assert.ok(q.check(3.71).correct);
  assert.equal(q.check(5).correct, false);
});

test('sun-moon-distance-ratio: states both data-sheet distances, accepts ~395 within 2%', () => {
  const q = findQuestion(makeQuestions(SpecData), 'sun-moon-distance-ratio');
  assert.ok(q.prompt.includes('380,000'));
  assert.ok(q.prompt.includes('150,000,000'));
  assert.ok(q.check(395).correct);
  assert.equal(q.check(300).correct, false);
});

test('eclipse-coincidence-explanation: the cancelling-ratios option is the only correct one', () => {
  const q = findQuestion(makeQuestions(SpecData), 'eclipse-coincidence-explanation');
  const correctOption = q.options.find((o) => o.startsWith('Because the Sun is about'));
  assert.ok(correctOption);
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});

test('sun-angular-size and moon-angular-size: both accept ~0.53° within 2%', () => {
  const questions = makeQuestions(SpecData);
  const sunQ = findQuestion(questions, 'sun-angular-size');
  const moonQ = findQuestion(questions, 'moon-angular-size');
  assert.ok(sunQ.check(0.53).correct);
  assert.ok(moonQ.check(0.53).correct);
  assert.equal(sunQ.check(5).correct, false);
  assert.equal(moonQ.check(5).correct, false);
});

test('light-travel-time-moon-and-sun: accepts ~1.3s / ~500s, rejects a single wrong field', () => {
  const q = findQuestion(makeQuestions(SpecData), 'light-travel-time-moon-and-sun');
  assert.ok(q.check({ moonSeconds: 1.27, sunSeconds: 500 }).correct);
  assert.equal(q.check({ moonSeconds: 1.27, sunSeconds: 50 }).correct, false);
  assert.equal(q.check({ moonSeconds: 10, sunSeconds: 500 }).correct, false);
});

test('earths-across-sun: accepts ~108 within 2%', () => {
  const q = findQuestion(makeQuestions(SpecData), 'earths-across-sun');
  assert.ok(q.check(108).correct);
  assert.equal(q.check(50).correct, false);
});
