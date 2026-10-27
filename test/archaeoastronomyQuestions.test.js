const test = require('node:test');
const assert = require('node:assert/strict');
const { makeQuestions } = require('../src/archaeoastronomyQuestions');
const MoonPhase = require('../src/moonPhase');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('makeQuestions returns 6 questions, each tagged u3.5 and/or u2.29 only', () => {
  const questions = makeQuestions(MoonPhase);
  assert.equal(questions.length, 6);
  questions.forEach((q) => {
    assert.ok(Array.isArray(q.units) && q.units.length > 0, `${q.id} has no units`);
    q.units.forEach((id) => assert.ok(['u3.5', 'u2.29'].includes(id), `${q.id} tags unexpected unit "${id}"`));
  });
});

test('every question id is unique', () => {
  const ids = makeQuestions(MoonPhase).map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('the two calendar/seasons questions tag only u3.5', () => {
  const questions = makeQuestions(MoonPhase);
  ['lunar-month-not-whole-number-of-year', 'sun-not-moon-for-seasons'].forEach((id) => {
    assert.deepEqual(findQuestion(questions, id).units, ['u3.5']);
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

test('precession-quarter-and-half-cycle: states the 26,000-year cycle, accepts 6,500/13,000 within 2%, rejects one wrong field', () => {
  const q = findQuestion(makeQuestions(MoonPhase), 'precession-quarter-and-half-cycle');
  assert.ok(q.prompt.includes('26,000'));
  assert.ok(q.check({ quarterYears: 6500, halfYears: 13000 }).correct);
  assert.equal(q.check({ quarterYears: 6500, halfYears: 20000 }).correct, false);
  assert.equal(q.check({ quarterYears: 2000, halfYears: 13000 }).correct, false);
});

test('precession-years-per-degree: states the 50 arcsecond/year rate, accepts ~72 within 2%', () => {
  const q = findQuestion(makeQuestions(MoonPhase), 'precession-years-per-degree');
  assert.ok(q.prompt.includes('50 arcseconds'));
  assert.ok(q.check(72).correct);
  assert.equal(q.check(26000).correct, false);
});

test('why-polaris-not-forever: the axis-direction-swings explanation is the only correct option', () => {
  const questions = makeQuestions(MoonPhase);
  const q = findQuestion(questions, 'why-polaris-not-forever');
  const correctOption = q.options.find((o) => o.startsWith('Because precession slowly swings'));
  assert.ok(correctOption);
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});

test('great-pyramid-thuban-alignment: tags both u2.29 and u3.5, and the "nearest the pole at the time" option is the only correct one', () => {
  const questions = makeQuestions(MoonPhase);
  const q = findQuestion(questions, 'great-pyramid-thuban-alignment');
  assert.deepEqual(q.units, ['u2.29', 'u3.5']);
  const correctOption = q.options.find((o) => o.startsWith('Because at the time the pyramid was built'));
  assert.ok(correctOption);
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});
