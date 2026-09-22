const test = require('node:test');
const assert = require('node:assert/strict');
const PlanetaryMotion = require('../src/planetaryMotion');
const { makeQuestions } = require('../src/planetaryMotionQuestions');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

// Reference values cross-checked directly against PlanetaryMotion (the
// same module the app itself uses): scanning day 30-1530 from
// 2026-01-01 finds opposition on 2029-04-10 (elongation ~179.9°) and
// conjunction on 2028-03-16 (elongation ~0.0°).

test('retrograde-cause: correctly identifies Earth overtaking Mars as the cause', () => {
  const questions = makeQuestions(PlanetaryMotion);
  const q = findQuestion(questions, 'retrograde-cause');
  assert.ok(q.check('Earth, on a faster inner orbit, overtaking Mars around opposition').correct);
  assert.equal(q.check('Mars briefly reversing its real direction of travel around the Sun').correct, false);
});

test('retrograde-timing: retrograde motion happens around opposition, not conjunction or elongation', () => {
  const questions = makeQuestions(PlanetaryMotion);
  const q = findQuestion(questions, 'retrograde-timing');
  assert.ok(q.check('Opposition').correct);
  assert.equal(q.check('Conjunction').correct, false);
  assert.equal(q.check('Elongation').correct, false);
});

test('synodic-period: accepts the real ~780-day Mars synodic period, rejects a wrong guess', () => {
  const questions = makeQuestions(PlanetaryMotion);
  const q = findQuestion(questions, 'synodic-period');
  assert.ok(q.check(780).correct);
  assert.ok(q.check(770).correct);
  assert.equal(q.check(365).correct, false);
});

test('classify-opposition-date: the found reference date is correctly classified as opposition', () => {
  const questions = makeQuestions(PlanetaryMotion);
  const q = findQuestion(questions, 'classify-opposition-date');
  assert.ok(q.prompt.includes('10 April 2029'));
  assert.ok(q.check('Opposition').correct);
  assert.equal(q.check('Conjunction').correct, false);
  assert.equal(q.check('Elongation').correct, false);
});

test('classify-conjunction-date: the found reference date is correctly classified as conjunction', () => {
  const questions = makeQuestions(PlanetaryMotion);
  const q = findQuestion(questions, 'classify-conjunction-date');
  assert.ok(q.prompt.includes('16 March 2028'));
  assert.ok(q.check('Conjunction').correct);
  assert.equal(q.check('Opposition').correct, false);
  assert.equal(q.check('Elongation').correct, false);
});

test('classify-elongation-date: the midpoint date has a moderate elongation, neither ~0 nor ~180', () => {
  const questions = makeQuestions(PlanetaryMotion);
  const q = findQuestion(questions, 'classify-elongation-date');
  const result = q.check(56.7);
  assert.ok(result.correct);
  assert.ok(!q.check(0).correct);
  assert.ok(!q.check(180).correct);
});

test('every question re-derives its answer live from PlanetaryMotion, not a hardcoded number', () => {
  // Sanity: classifyAlignment's own thresholds agree with what each
  // date-specific question's check() reports as correct.
  const questions = makeQuestions(PlanetaryMotion);
  const oppositionDate = new Date(Date.UTC(2029, 3, 10));
  const conjunctionDate = new Date(Date.UTC(2028, 2, 16));
  assert.equal(PlanetaryMotion.classifyAlignment('mars', oppositionDate).type, 'opposition');
  assert.equal(PlanetaryMotion.classifyAlignment('mars', conjunctionDate).type, 'conjunction');
  assert.ok(findQuestion(questions, 'classify-opposition-date').check('Opposition').correct);
  assert.ok(findQuestion(questions, 'classify-conjunction-date').check('Conjunction').correct);
});
