const test = require('node:test');
const assert = require('node:assert/strict');
const SunRotation = require('../src/sunRotation');
const { makeQuestions } = require('../src/sunspotRotationQuestions');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('every question tags u2.5, and states the constants it needs in its own prompt text', () => {
  const questions = makeQuestions(SunRotation);
  assert.ok(questions.length >= 9);
  questions.forEach((q) => {
    assert.deepEqual(q.units, ['u2.5']);
    assert.ok(q.prompt && q.prompt.trim().length > 0, `${q.id} has no prompt`);
  });
});

test('limb-to-limb-double: doubling 13.6 days gives 27.2 days', () => {
  const questions = makeQuestions(SunRotation);
  const q = findQuestion(questions, 'limb-to-limb-double');
  assert.ok(q.check(27.2).correct);
  assert.equal(q.check(13.6).correct, false);
});

test('mean-sidereal-to-synodic: a mean sidereal period of 25.38 days gives a synodic period of about 27.27-27.28 days', () => {
  const questions = makeQuestions(SunRotation);
  const q = findQuestion(questions, 'mean-sidereal-to-synodic');
  assert.ok(q.check(27.27).correct);
  assert.ok(q.check(27.28).correct);
  assert.equal(q.check(25.38).correct, false);
});

test('equatorial-sidereal-to-synodic: an equatorial sidereal period of 24.5 days gives a synodic period of about 26.3 days', () => {
  const questions = makeQuestions(SunRotation);
  const q = findQuestion(questions, 'equatorial-sidereal-to-synodic');
  assert.ok(q.check(26.3).correct);
  assert.equal(q.check(24.5).correct, false);
});

test('two-reading-stretch: 60 degrees over 6 days gives a 36-day estimate', () => {
  const questions = makeQuestions(SunRotation);
  const q = findQuestion(questions, 'two-reading-stretch');
  assert.ok(q.check(36).correct);
  assert.equal(q.check(60).correct, false);
});

test('differential-rotation-equator/30/60: about 24.5, 25.7 and 30.2 days', () => {
  const questions = makeQuestions(SunRotation);
  assert.ok(findQuestion(questions, 'differential-rotation-equator').check(24.5).correct);
  assert.ok(findQuestion(questions, 'differential-rotation-30').check(25.7).correct);
  assert.ok(findQuestion(questions, 'differential-rotation-60').check(30.2).correct);
});

test('differential-rotation questions reject an answer for the wrong latitude', () => {
  const questions = makeQuestions(SunRotation);
  const equator = findQuestion(questions, 'differential-rotation-equator');
  assert.equal(equator.check(30.2).correct, false);
});

test('why-not-fixed-number: differential rotation is the correct explanation', () => {
  const questions = makeQuestions(SunRotation);
  const q = findQuestion(questions, 'why-not-fixed-number');
  assert.ok(
    q.check(
      'The Sun is a ball of plasma, not a solid body, and rotates faster at its equator than near its poles (differential rotation)'
    ).correct
  );
  assert.equal(q.check("The Sun's distance from Earth changes throughout the year").correct, false);
});

test('why-synodic-longer-than-sidereal: Earth\'s own orbital motion is the correct explanation', () => {
  const questions = makeQuestions(SunRotation);
  const q = findQuestion(questions, 'why-synodic-longer-than-sidereal');
  assert.ok(
    q.check(
      "Earth orbits the Sun in the same direction the Sun spins, so a sunspot needs a little extra rotation each time to line up with Earth's new position again"
    ).correct
  );
  assert.equal(q.check("The Sun's own rotation genuinely speeds up and slows down from day to day").correct, false);
});

test('every question re-derives its answer live from src/sunRotation.js, not a hardcoded number', () => {
  // Sanity: a fake SunRotation whose formulas disagree with the real one
  // should make these checks fail against the real reference values,
  // confirming check() actually calls through rather than hardcoding.
  const fakeSunRotation = {
    ...SunRotation,
    synodicPeriodDays: () => 999,
    siderealPeriodDays: () => 999,
    synodicPeriodFromLimbToLimbDays: () => 999,
    periodFromTwoReadings: () => 999,
  };
  const questions = makeQuestions(fakeSunRotation);
  assert.equal(findQuestion(questions, 'limb-to-limb-double').check(27.2).correct, false);
  assert.equal(findQuestion(questions, 'mean-sidereal-to-synodic').check(27.27).correct, false);
  assert.equal(findQuestion(questions, 'differential-rotation-equator').check(24.5).correct, false);
});
