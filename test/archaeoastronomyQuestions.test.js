const test = require('node:test');
const assert = require('node:assert/strict');
const { makeQuestions } = require('../src/archaeoastronomyQuestions');
const MoonPhase = require('../src/moonPhase');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('every question tags u3.5', () => {
  makeQuestions(MoonPhase).forEach((q) => {
    assert.deepEqual(q.units, ['u3.5']);
  });
});

test('lunar-month-not-whole-number-of-year: states the month and year lengths it needs in its own prompt text', () => {
  const q = findQuestion(makeQuestions(MoonPhase), 'lunar-month-not-whole-number-of-year');
  assert.match(q.prompt, /\d/);
});

test('lunar-month-not-whole-number-of-year: the ~12.37-months, not-a-whole-number option is the only correct one', () => {
  const questions = makeQuestions(MoonPhase);
  const q = findQuestion(questions, 'lunar-month-not-whole-number-of-year');
  const correctOption = q.options.find((o) => o.startsWith('About 12.37 lunar months'));
  assert.ok(correctOption);
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});

test('lunar-month-not-whole-number-of-year: quotes the live SYNODIC_MONTH_DAYS figure, not a hand-typed one', () => {
  const questions = makeQuestions(MoonPhase);
  const q = findQuestion(questions, 'lunar-month-not-whole-number-of-year');
  assert.ok(q.prompt.includes(MoonPhase.SYNODIC_MONTH_DAYS.toFixed(1)));
});

test('sun-not-moon-for-seasons: the axial-tilt explanation is the only correct option', () => {
  const questions = makeQuestions(MoonPhase);
  const q = findQuestion(questions, 'sun-not-moon-for-seasons');
  const correctOption = q.options.find((o) => o.startsWith("The seasons are caused by Earth's axial tilt"));
  assert.ok(correctOption);
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});
