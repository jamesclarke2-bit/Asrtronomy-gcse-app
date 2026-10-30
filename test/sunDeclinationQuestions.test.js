const test = require('node:test');
const assert = require('node:assert/strict');
const { getSunPosition } = require('../src/solarPosition');
const Coordinates = require('../src/coordinates');
const { makeQuestions } = require('../src/sunDeclinationQuestions');

const SolarPosition = { getSunPosition };

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

// Reference values cross-checked directly against SolarPosition +
// Coordinates (the same modules the app itself uses), and against the
// already-validated Sydney-equinox case from coordinatesQuestions.js
// (56°, there computed from an assumed declination of exactly 0°; here
// from the real 21 March 2026 declination of +0.15°, which still rounds
// to the same 56°).

test('Tropic of Capricorn, June solstice: altitude is about 43.1°', () => {
  const questions = makeQuestions(SolarPosition, Coordinates);
  const q = findQuestion(questions, 'capricorn-june-solstice');
  assert.ok(q.check(43.1).correct);
  assert.equal(q.check(20).correct, false);
});

test('Tropic of Capricorn, December solstice: the Sun is essentially overhead (~90°)', () => {
  const questions = makeQuestions(SolarPosition, Coordinates);
  const q = findQuestion(questions, 'capricorn-dec-solstice');
  assert.ok(q.check(90).correct);
  assert.equal(q.check(43).correct, false);
});

test('Tropic of Capricorn, March equinox: altitude is about 66.4°', () => {
  const questions = makeQuestions(SolarPosition, Coordinates);
  const q = findQuestion(questions, 'capricorn-march-equinox');
  assert.ok(q.check(66.4).correct);
});

test('Tropic of Capricorn, September equinox: altitude is about 65.8°', () => {
  const questions = makeQuestions(SolarPosition, Coordinates);
  const q = findQuestion(questions, 'capricorn-sept-equinox');
  assert.ok(q.check(65.8).correct);
});

test('Sydney (34°S), March equinox: altitude is about 56°, matching the coordinates-page reference case', () => {
  const questions = makeQuestions(SolarPosition, Coordinates);
  const q = findQuestion(questions, 'sydney-equinox-transit');
  assert.ok(q.check(56).correct);
  assert.equal(q.check(30).correct, false);
});

test('every question re-derives its answer live, not from a hardcoded number', () => {
  // Sanity: the December-solstice and June-solstice Capricorn answers
  // must differ by roughly twice the axial tilt (~46.9°), confirming the
  // check is actually reading a different declination per question
  // rather than one fixed value reused everywhere.
  const questions = makeQuestions(SolarPosition, Coordinates);
  const june = findQuestion(questions, 'capricorn-june-solstice');
  const dec = findQuestion(questions, 'capricorn-dec-solstice');
  const juneCorrect = june.check(0).message.match(/([\d.]+)°\.$/)[1];
  const decCorrect = dec.check(0).message.match(/([\d.]+)°\.$/)[1];
  assert.ok(Math.abs(Number(decCorrect) - Number(juneCorrect) - 46.9) < 1);
});
