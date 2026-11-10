const test = require('node:test');
const assert = require('node:assert/strict');
const { makeQuestions } = require('../src/moonPhasesQuestions');
const MoonPhase = require('../src/moonPhase');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('makeQuestions returns 3 questions, each tagged u2.19 and/or u3.5 only, with unique ids', () => {
  const questions = makeQuestions(MoonPhase);
  assert.equal(questions.length, 3);
  const ids = questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
  questions.forEach((q) => {
    assert.ok(Array.isArray(q.units) && q.units.length > 0, `${q.id} has no units`);
    q.units.forEach((id) => assert.ok(['u2.19', 'u3.5'].includes(id), `${q.id} tags unexpected unit "${id}"`));
  });
});

test('why-not-eclipse-every-month: the tilted-orbit/nodes explanation is the only correct option', () => {
  const q = findQuestion(makeQuestions(MoonPhase), 'why-not-eclipse-every-month');
  assert.deepEqual(q.units, ['u2.19']);
  const correctOption = q.options.find((o) => o.startsWith("Because the Moon's orbit is tilted about 5 degrees"));
  assert.ok(correctOption);
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});

test('why-calendar-starts-at-first-crescent: the "changes little near full, brief near crescent" explanation is the only correct option', () => {
  const q = findQuestion(makeQuestions(MoonPhase), 'why-calendar-starts-at-first-crescent');
  assert.deepEqual(q.units, ['u3.5']);
  const correctOption = q.options.find((o) => o.startsWith('The Moon looks close to full for several days'));
  assert.ok(correctOption);
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});

test('why-lunar-calendar-drifts: states the live synodic-month figure, accepts the ~354-day year and ~11-day shortfall within 2%, rejects a wrong field', () => {
  const q = findQuestion(makeQuestions(MoonPhase), 'why-lunar-calendar-drifts');
  assert.deepEqual(q.units, ['u3.5']);
  assert.ok(q.prompt.includes(MoonPhase.SYNODIC_MONTH_DAYS.toFixed(2)));
  const lunarYearDays = 12 * MoonPhase.SYNODIC_MONTH_DAYS;
  const shortfallDays = 365.25 - lunarYearDays;
  assert.ok(Math.abs(lunarYearDays - 354.4) < 1, `sanity: expected ~354.4 days, got ${lunarYearDays.toFixed(1)}`);
  assert.ok(q.check({ lunarYearDays, shortfallDays }).correct);
  assert.equal(q.check({ lunarYearDays, shortfallDays: 100 }).correct, false);
  assert.equal(q.check({ lunarYearDays: 300, shortfallDays }).correct, false);
});
