const test = require('node:test');
const assert = require('node:assert/strict');
const ButterflyDiagram = require('../src/butterflyDiagram');
const { makeQuestions } = require('../src/solarActivityQuestions');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('butterfly-cycle-length: accepts ~11 years, rejects a wrong guess', () => {
  const questions = makeQuestions(ButterflyDiagram);
  const q = findQuestion(questions, 'butterfly-cycle-length');
  assert.ok(q.check(11).correct);
  assert.ok(q.check(10).correct);
  assert.ok(q.check(12).correct);
  assert.equal(q.check(1).correct, false);
  assert.equal(q.check(100).correct, false);
});

test('butterfly-start-latitude: accepts ~35 degrees, rejects a wrong guess', () => {
  const questions = makeQuestions(ButterflyDiagram);
  const q = findQuestion(questions, 'butterfly-start-latitude');
  assert.ok(q.check(35).correct);
  assert.ok(q.check(32).correct);
  assert.equal(q.check(0).correct, false);
  assert.equal(q.check(90).correct, false);
});

test('solar-wind-particle: accepts electrons, protons or alpha particles (and synonyms), rejects an unrelated answer', () => {
  const questions = makeQuestions(ButterflyDiagram);
  const q = findQuestion(questions, 'solar-wind-particle');
  assert.ok(q.check('proton').correct);
  assert.ok(q.check('Protons').correct);
  assert.ok(q.check('electron').correct);
  assert.ok(q.check('alpha particle').correct);
  assert.ok(q.check('helium nucleus').correct);
  assert.equal(q.check('neutron').correct, false);
  assert.equal(q.check('photon').correct, false);
});

test('solar-wind-aurorae: requires mentioning both the magnetic field/poles and a collision with the atmosphere', () => {
  const questions = makeQuestions(ButterflyDiagram);
  const q = findQuestion(questions, 'solar-wind-aurorae');
  assert.ok(q.check("Earth's magnetic field guides particles to the poles where they collide with gas in the atmosphere and glow").correct);
  assert.equal(q.check('It is caused by the Sun').correct, false);
  assert.equal(q.check('Charged particles hit the atmosphere').correct, false, 'missing any mention of the magnetic field/poles');
  assert.equal(q.check('The magnetic field pulls particles to the poles').correct, false, 'missing any mention of a collision with the atmosphere');
});

test('butterfly questions stay consistent with whatever ButterflyDiagram itself defines', () => {
  // If the shared constants ever change, these questions should track
  // them automatically rather than needing a second, hand-edited copy.
  const questions = makeQuestions(ButterflyDiagram);
  const cycleQ = findQuestion(questions, 'butterfly-cycle-length');
  const latQ = findQuestion(questions, 'butterfly-start-latitude');
  assert.ok(cycleQ.check(ButterflyDiagram.CYCLE_LENGTH_YEARS).correct);
  assert.ok(latQ.check(ButterflyDiagram.LATITUDE_AT_CYCLE_START_DEG).correct);
});
