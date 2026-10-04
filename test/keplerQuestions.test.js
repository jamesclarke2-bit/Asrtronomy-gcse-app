const test = require('node:test');
const assert = require('node:assert/strict');
const OrbitalMechanics = require('../src/orbitalMechanics');
const SpecData = require('../src/specData');
const { makeQuestions } = require('../src/keplerQuestions');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('period-from-radius: accepts both the formula result and the data sheet’s own period for Mars', () => {
  const questions = makeQuestions(OrbitalMechanics, SpecData);
  const q = findQuestion(questions, 'period-from-radius');
  assert.ok(q.check(1.84).correct, 'formula result (1.5^1.5 ≈ 1.84) should be accepted');
  assert.ok(q.check(1.9).correct, 'data sheet’s own period column (1.9) should be accepted');
  assert.equal(q.check(4).correct, false);
});

test('radius-from-period: accepts both the formula result and the data sheet’s own distance for Ceres', () => {
  const questions = makeQuestions(OrbitalMechanics, SpecData);
  const q = findQuestion(questions, 'radius-from-period');
  assert.ok(q.check(2.77).correct, 'formula result (4.6^(2/3) ≈ 2.77) should be accepted');
  assert.ok(q.check(2.8).correct, 'data sheet’s own distance column (2.8) should be accepted');
  assert.equal(q.check(125).correct, false);
});

test('identify-aphelion-perihelion: accepts the correct perihelion/aphelion <-> perigee/apogee pairing', () => {
  const questions = makeQuestions(OrbitalMechanics, SpecData);
  const q = findQuestion(questions, 'identify-aphelion-perihelion');
  assert.ok(q.check('Perihelion (closest) and aphelion (farthest); perigee (closest) and apogee (farthest) around Earth').correct);
  assert.equal(q.check('Perihelion (closest) and aphelion (farthest); apogee (closest) and perigee (farthest) around Earth').correct, false);
  assert.equal(q.check('Aphelion (closest) and perihelion (farthest); perigee (closest) and apogee (farthest) around Earth').correct, false);
});

test('speed-around-orbit: fastest at perihelion, slowest at aphelion is the only correct option', () => {
  const questions = makeQuestions(OrbitalMechanics, SpecData);
  const q = findQuestion(questions, 'speed-around-orbit');
  assert.ok(q.check('Fastest at perihelion, slowest at aphelion').correct);
  assert.equal(q.check('Fastest at aphelion, slowest at perihelion').correct, false);
  assert.equal(q.check("It's constant — speed doesn't depend on distance from the Sun").correct, false);
});

test('equal-areas: perihelion and aphelion wedges of equal time are exactly equal in area', () => {
  const questions = makeQuestions(OrbitalMechanics, SpecData);
  const q = findQuestion(questions, 'equal-areas');
  assert.ok(q.check('They have exactly the same area').correct);
  assert.equal(q.check('The perihelion wedge has the greater area').correct, false);
});

test('constant-depends-on-mass: the constant being inversely proportional to mass is the only correct option', () => {
  const questions = makeQuestions(OrbitalMechanics, SpecData);
  const q = findQuestion(questions, 'constant-depends-on-mass');
  assert.ok(q.check("It's half as big — the constant is inversely proportional to the central mass").correct);
  assert.equal(q.check("It's twice as big — the constant is directly proportional to the central mass").correct, false);
  assert.equal(q.check("It's exactly the same — T²/r³ only depends on r, not on the central mass").correct, false);
});

test('every question only tags u3.x ids that actually exist in curriculum.js', () => {
  const { getSubtopic } = require('../src/curriculum');
  const questions = makeQuestions(OrbitalMechanics, SpecData);
  questions.forEach((q) => {
    q.units.forEach((id) => assert.ok(getSubtopic(id), `${q.id} references missing subtopic "${id}"`));
  });
});
