const test = require('node:test');
const assert = require('node:assert/strict');
const OrbitalMechanics = require('../src/orbitalMechanics');
const { makeQuestions } = require('../src/keplerQuestions');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('period-from-radius: a 4 AU orbit has an 8-year period', () => {
  const questions = makeQuestions(OrbitalMechanics);
  const q = findQuestion(questions, 'period-from-radius');
  assert.ok(q.check(8).correct);
  assert.ok(q.check(7.9).correct);
  assert.equal(q.check(4).correct, false);
});

test('radius-from-period: a 125-year period has a 25 AU semi-major axis', () => {
  const questions = makeQuestions(OrbitalMechanics);
  const q = findQuestion(questions, 'radius-from-period');
  assert.ok(q.check(25).correct);
  assert.equal(q.check(125).correct, false);
});

test('identify-aphelion-perihelion: accepts the correct perihelion/aphelion <-> perigee/apogee pairing', () => {
  const questions = makeQuestions(OrbitalMechanics);
  const q = findQuestion(questions, 'identify-aphelion-perihelion');
  assert.ok(q.check('Perihelion (closest) and aphelion (farthest); perigee (closest) and apogee (farthest) around Earth').correct);
  assert.equal(q.check('Perihelion (closest) and aphelion (farthest); apogee (closest) and perigee (farthest) around Earth').correct, false);
  assert.equal(q.check('Aphelion (closest) and perihelion (farthest); perigee (closest) and apogee (farthest) around Earth').correct, false);
});

test('speed-around-orbit: fastest at perihelion, slowest at aphelion is the only correct option', () => {
  const questions = makeQuestions(OrbitalMechanics);
  const q = findQuestion(questions, 'speed-around-orbit');
  assert.ok(q.check('Fastest at perihelion, slowest at aphelion').correct);
  assert.equal(q.check('Fastest at aphelion, slowest at perihelion').correct, false);
  assert.equal(q.check("It's constant — speed doesn't depend on distance from the Sun").correct, false);
});

test('equal-areas: perihelion and aphelion wedges of equal time are exactly equal in area', () => {
  const questions = makeQuestions(OrbitalMechanics);
  const q = findQuestion(questions, 'equal-areas');
  assert.ok(q.check('They have exactly the same area').correct);
  assert.equal(q.check('The perihelion wedge has the greater area').correct, false);
});

test('every question only tags u3.x ids that actually exist in curriculum.js', () => {
  const { getSubtopic } = require('../src/curriculum');
  const questions = makeQuestions(OrbitalMechanics);
  questions.forEach((q) => {
    q.units.forEach((id) => assert.ok(getSubtopic(id), `${q.id} references missing subtopic "${id}"`));
  });
});
