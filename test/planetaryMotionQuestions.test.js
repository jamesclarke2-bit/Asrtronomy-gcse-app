const test = require('node:test');
const assert = require('node:assert/strict');
const PlanetaryMotion = require('../src/planetaryMotion');
const { makeQuestions } = require('../src/planetaryMotionQuestions');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('retrograde-cause: correctly identifies Earth and the planet changing places as the cause', () => {
  const questions = makeQuestions(PlanetaryMotion);
  const q = findQuestion(questions, 'retrograde-cause');
  assert.ok(q.check('Earth and the planet changing places relative to each other, as the faster inner orbit overtakes (or is overtaken by) the slower outer one').correct);
  assert.equal(q.check('The planet briefly reversing its real direction of travel around the Sun').correct, false);
});

test('retrograde-timing: retrograde motion happens around opposition, not conjunction or greatest elongation', () => {
  const questions = makeQuestions(PlanetaryMotion);
  const q = findQuestion(questions, 'retrograde-timing');
  assert.ok(q.check('Opposition').correct);
  assert.equal(q.check('Conjunction').correct, false);
  assert.equal(q.check('Greatest elongation').correct, false);
});

test('synodic-period: accepts the real ~780-day Mars synodic period, rejects a wrong guess', () => {
  const questions = makeQuestions(PlanetaryMotion);
  const q = findQuestion(questions, 'synodic-period');
  assert.ok(q.check(780).correct);
  assert.ok(q.check(770).correct);
  assert.equal(q.check(365).correct, false);
});

test('which-planets-can-oppose: only superior planets is the correct option', () => {
  const questions = makeQuestions(PlanetaryMotion);
  const q = findQuestion(questions, 'which-planets-can-oppose');
  assert.ok(q.check('Only the superior planets — Mars and anything farther from the Sun than Earth').correct);
  assert.equal(q.check('Any planet — Mercury, Venus, Mars and beyond').correct, false);
  assert.equal(q.check('Only the inferior planets — Mercury and Venus').correct, false);
});

test("venus-never-midnight: the greatest-elongation-cap option is correct, and states Venus's own figure", () => {
  const questions = makeQuestions(PlanetaryMotion);
  const q = findQuestion(questions, 'venus-never-midnight');
  const venusMax = PlanetaryMotion.greatestElongationDeg('venus');
  const correctOption = q.options.find((o) => o.startsWith("Venus's elongation from the Sun can never exceed"));
  assert.ok(correctOption, 'expected an option starting with the greatest-elongation explanation');
  assert.ok(correctOption.includes(venusMax.toFixed(0)), 'option should state the live greatest-elongation figure');
  assert.ok(q.check(correctOption).correct);
  assert.equal(q.check("Venus is too faint to see at midnight, even though it's in the sky then").correct, false);
});

test('greatest-elongation-meaning: the widest-angle definition is correct', () => {
  const questions = makeQuestions(PlanetaryMotion);
  const q = findQuestion(questions, 'greatest-elongation-meaning');
  const correctOption = q.options.find((o) => o.startsWith('The widest angle from the Sun'));
  assert.ok(q.check(correctOption).correct);
  assert.equal(q.check('The date it is closest to Earth').correct, false);
});

test('mars-brightest-at-opposition: the closest-and-fully-lit explanation is correct', () => {
  const questions = makeQuestions(PlanetaryMotion);
  const q = findQuestion(questions, 'mars-brightest-at-opposition');
  const correctOption = q.options.find((o) => o.startsWith('Mars is at its closest to Earth then'));
  assert.ok(q.check(correctOption).correct);
  assert.equal(q.check("Mars's own surface changes colour and reflectivity at that time").correct, false);
});

test('every question only tags u1.x ids that actually exist in curriculum.js', () => {
  const Curriculum = require('../src/curriculum');
  const questions = makeQuestions(PlanetaryMotion);
  questions.forEach((q) => {
    q.units.forEach((id) => {
      assert.ok(Curriculum.getSubtopic(id), `${q.id} references missing subtopic "${id}"`);
    });
  });
});
