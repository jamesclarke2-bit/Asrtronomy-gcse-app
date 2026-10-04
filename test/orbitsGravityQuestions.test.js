const test = require('node:test');
const assert = require('node:assert/strict');
const OrbitalMechanics = require('../src/orbitalMechanics');
const { makeQuestions } = require('../src/orbitsGravityQuestions');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('force-distance: tripling the distance is the only correct F/9 option', () => {
  const questions = makeQuestions(OrbitalMechanics);
  const q = findQuestion(questions, 'force-distance');
  assert.ok(q.check('F/9').correct);
  assert.equal(q.check('3F').correct, false);
  assert.equal(q.check('F/3').correct, false);
  assert.equal(q.check('9F').correct, false);
});

test('force-mass: doubling one mass doubles the force', () => {
  const questions = makeQuestions(OrbitalMechanics);
  const q = findQuestion(questions, 'force-mass');
  assert.ok(q.check('It doubles').correct);
  assert.equal(q.check('It quadruples').correct, false);
});

test('stable-orbit: continuous free fall with enough sideways speed is the only correct option', () => {
  const questions = makeQuestions(OrbitalMechanics);
  const q = findQuestion(questions, 'stable-orbit');
  assert.ok(q.check("It's moving sideways so fast that the curve of the ground falls away beneath it exactly as fast as it falls").correct);
  assert.equal(q.check('Its engines constantly fire to hold it up against gravity').correct, false);
});

test('why-ellipse: a push above circular speed makes that point perigee of a new ellipse', () => {
  const questions = makeQuestions(OrbitalMechanics);
  const q = findQuestion(questions, 'why-ellipse');
  assert.ok(q.check('An ellipse, with the push point as its closest approach (perigee)').correct);
  assert.equal(q.check('A perfect circle at a higher altitude').correct, false);
});

test('newton-explains-kepler: the inverse-square unification is the only correct option', () => {
  const questions = makeQuestions(OrbitalMechanics);
  const q = findQuestion(questions, 'newton-explains-kepler');
  assert.ok(q.check('They all follow mathematically from one underlying cause: gravity obeying an inverse-square law').correct);
  assert.equal(q.check("They're three separate, unrelated rules that each needed their own explanation").correct, false);
});

test('every question only tags u3.x ids that actually exist in curriculum.js', () => {
  const { getSubtopic } = require('../src/curriculum');
  const questions = makeQuestions(OrbitalMechanics);
  questions.forEach((q) => {
    q.units.forEach((id) => assert.ok(getSubtopic(id), `${q.id} references missing subtopic "${id}"`));
  });
});

test('every question is tagged with at least one of 8.3, 8.8 or 8.9 (u3.8, u3.13, u3.14)', () => {
  const targetUnits = ['u3.8', 'u3.13', 'u3.14'];
  const questions = makeQuestions(OrbitalMechanics);
  questions.forEach((q) => {
    assert.ok(q.units.some((id) => targetUnits.includes(id)), `${q.id} doesn't tag any of u3.8/u3.13/u3.14`);
  });
});
