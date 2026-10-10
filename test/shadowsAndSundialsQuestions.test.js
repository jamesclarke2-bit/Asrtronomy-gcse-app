const test = require('node:test');
const assert = require('node:assert/strict');
const ShadowGeometry = require('../src/shadowGeometry');
const SolarPosition = require('../src/solarPosition');
const { makeQuestions } = require('../src/shadowsAndSundialsQuestions');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('shadow-length-calculation: accepts the live-computed shadow length, rejects a wrong guess', () => {
  const questions = makeQuestions(ShadowGeometry, SolarPosition);
  const q = findQuestion(questions, 'shadow-length-calculation');
  const expected = ShadowGeometry.shadowLengthM(1.2, 35);
  assert.ok(q.check(expected).correct);
  assert.equal(q.check(expected * 1.5).correct, false);
});

test('shortest-shadow-direction: "due north, at local apparent noon" is the only correct option', () => {
  const questions = makeQuestions(ShadowGeometry, SolarPosition);
  const q = findQuestion(questions, 'shortest-shadow-direction');
  assert.ok(q.check('Due north, at local apparent noon').correct);
  assert.equal(q.check('Due east, at sunrise').correct, false);
});

test('equal-shadow-method: bisecting two equal-length tips either side of noon is the only correct option', () => {
  const questions = makeQuestions(ShadowGeometry, SolarPosition);
  const q = findQuestion(questions, 'equal-shadow-method');
  assert.ok(q.check('Mark two shadow tips of equal length, one before and one after noon, and bisect the line between them').correct);
  assert.equal(q.check('Mark where the shadow tip falls at sunrise and at sunset, and bisect the line between them').correct, false);
});

test('hour-line-angle-calculation: accepts the live-computed hour-line angle, rejects a wrong guess', () => {
  const questions = makeQuestions(ShadowGeometry, SolarPosition);
  const q = findQuestion(questions, 'hour-line-angle-calculation');
  const expected = ShadowGeometry.sundialHourLineAngleDeg(51.5, 3);
  assert.ok(q.check(expected).correct);
  assert.equal(q.check(expected + 10).correct, false);
});

test('unequal-hour-lines: 90° (a pole) is the only correct option', () => {
  const questions = makeQuestions(ShadowGeometry, SolarPosition);
  const q = findQuestion(questions, 'unequal-hour-lines');
  assert.ok(q.check('90° (a pole)').correct);
  assert.equal(q.check('0° (the equator)').correct, false);
});

test('sundial-vs-clock-offset: the three-component option is the only correct one', () => {
  const questions = makeQuestions(ShadowGeometry, SolarPosition);
  const q = findQuestion(questions, 'sundial-vs-clock-offset');
  const correctOption = q.options.find((o) => o.startsWith('The longitude correction'));
  assert.ok(q.check(correctOption).correct);
  assert.equal(q.check('Only the equation of time').correct, false);
});

test('longitude-from-shadow-stick: accepts the live-computed longitude, rejects a wrong guess, and states which hemisphere', () => {
  const questions = makeQuestions(ShadowGeometry, SolarPosition);
  const q = findQuestion(questions, 'longitude-from-shadow-stick');
  const date = new Date(Date.UTC(2026, 1, 12, 12, 0));
  const eot = SolarPosition.getSunPosition(date, 51.5, 0).equationOfTime;
  const expected = ShadowGeometry.longitudeFromNoonUTDeg(eot, 12 * 60 + 30);
  assert.ok(expected < 0, 'sanity check: this example should land west');
  const result = q.check(expected);
  assert.ok(result.correct);
  assert.match(result.message, /west/);
  assert.equal(q.check(expected + 5).correct, false);
});

test('every question states the constants it needs in its own prompt text', () => {
  const questions = makeQuestions(ShadowGeometry, SolarPosition);
  const numberQuestions = questions.filter((q) => q.type === 'number');
  assert.ok(numberQuestions.length >= 3, 'expected at least 3 calculation questions');
  numberQuestions.forEach((q) => {
    assert.ok(/\d/.test(q.prompt), `${q.id}: prompt should state a numeric given, got "${q.prompt}"`);
  });
});

test('every question only tags u2.x ids that actually exist in curriculum.js', () => {
  const Curriculum = require('../src/curriculum');
  const questions = makeQuestions(ShadowGeometry, SolarPosition);
  questions.forEach((q) => {
    q.units.forEach((id) => {
      assert.ok(Curriculum.getSubtopic(id), `${q.id} references missing subtopic "${id}"`);
    });
  });
});
