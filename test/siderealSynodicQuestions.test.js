const test = require('node:test');
const assert = require('node:assert/strict');
const MoonPhase = require('../src/moonPhase');
const { makeQuestions } = require('../src/siderealSynodicQuestions');

// Cross-checked directly against MoonPhase.SYNODIC_MONTH_DAYS (29.53058867)
// and the same 1/sidereal = 1/synodic + 1/year relation sidereal-vs-synodic.js
// itself uses: sidereal ≈ 27.32 days, gap ≈ 2.21 days, lap ≈ 365.25 days.

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('catch-up-gap: accepts the real ~2.2-day gap, rejects a wrong guess', () => {
  const questions = makeQuestions(MoonPhase);
  const q = findQuestion(questions, 'catch-up-gap');
  assert.ok(q.check(2.2).correct);
  assert.ok(q.check(2.0).correct);
  assert.equal(q.check(0).correct, false);
  assert.equal(q.check(29.5).correct, false);
});

test('identify-cycle-neither: at 15 days neither counter has completed a cycle', () => {
  const questions = makeQuestions(MoonPhase);
  const q = findQuestion(questions, 'identify-cycle-neither');
  assert.ok(q.prompt.includes('15.0'));
  assert.ok(q.check('Neither counter has completed a full cycle yet').correct);
  assert.equal(q.check('Only the sidereal counter has completed a full cycle').correct, false);
  assert.equal(q.check('Both counters have completed a full cycle').correct, false);
});

test('identify-cycle-sidereal-only: at 28 days only the sidereal counter has completed a cycle', () => {
  const questions = makeQuestions(MoonPhase);
  const q = findQuestion(questions, 'identify-cycle-sidereal-only');
  assert.ok(q.prompt.includes('28.0'));
  assert.ok(q.check('Only the sidereal counter has completed a full cycle').correct);
  assert.equal(q.check('Neither counter has completed a full cycle yet').correct, false);
  assert.equal(q.check('Only the synodic counter has completed a full cycle').correct, false);
  assert.equal(q.check('Both counters have completed a full cycle').correct, false);
});

test('identify-cycle-both: at 40 days both counters have completed a cycle', () => {
  const questions = makeQuestions(MoonPhase);
  const q = findQuestion(questions, 'identify-cycle-both');
  assert.ok(q.prompt.includes('40.0'));
  assert.ok(q.check('Both counters have completed a full cycle').correct);
  assert.equal(q.check('Only the sidereal counter has completed a full cycle').correct, false);
});

test('next-lap: accepts an answer near the real ~365-day lap time, rejects a wildly wrong guess', () => {
  const questions = makeQuestions(MoonPhase);
  const q = findQuestion(questions, 'next-lap');
  assert.ok(q.check(365).correct);
  assert.ok(q.check(350).correct);
  assert.equal(q.check(30).correct, false);
  assert.equal(q.check(780).correct, false);
});

test('every question re-derives its numbers live from MoonPhase, not a hardcoded copy', () => {
  const questions = makeQuestions(MoonPhase);
  const synodic = MoonPhase.SYNODIC_MONTH_DAYS;
  const sidereal = 1 / (1 / synodic + 1 / 365.25);
  assert.ok(findQuestion(questions, 'catch-up-gap').check(synodic - sidereal).correct);
  assert.ok(findQuestion(questions, 'next-lap').check(1 / (1 / sidereal - 1 / synodic)).correct);
});
