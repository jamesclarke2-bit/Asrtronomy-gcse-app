const test = require('node:test');
const assert = require('node:assert/strict');
const { makeQuestions } = require('../src/geocentricHeliocentricQuestions');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('retrograde-motion-definition: "moves backwards against the stars" is the only correct option', () => {
  const questions = makeQuestions();
  const q = findQuestion(questions, 'retrograde-motion-definition');
  assert.ok(q.check('A planet appears to move backwards (westward) against the stars for a few weeks').correct);
  assert.equal(q.check('A planet is unusually bright for a few weeks').correct, false);
});

test('why-epicycles: explaining retrograde motion and brightness changes is the only correct option', () => {
  const questions = makeQuestions();
  const q = findQuestion(questions, 'why-epicycles');
  assert.ok(q.check("To explain the planets' observed retrograde motion and changing brightness, which a single circle around Earth couldn't produce").correct);
  assert.equal(q.check('To make the model simpler and easier to calculate with').correct, false);
});

test('epicycle-period-coincidence: "Earth\'s own orbit" is the only correct option', () => {
  const questions = makeQuestions();
  const q = findQuestion(questions, 'epicycle-period-coincidence');
  assert.ok(
    q.check(
      "In Ptolemy's model, nothing requires an outer planet's epicycle period to match the Sun's — it has to be assumed separately, planet by planet, purely to fit the observations. In Copernicus's model, that 'epicycle' turns out to just be a reflection of Earth's own one-year orbit, shared by every outer planet because the same orbiting Earth is doing the observing"
    ).correct
  );
  assert.equal(
    q.check("It isn't really a coincidence — Ptolemy deliberately copied the Sun's own period into every planet's epicycle by design").correct,
    false
  );
});

test("brahe-contribution: precise naked-eye observations of Mars is the only correct option", () => {
  const questions = makeQuestions();
  const q = findQuestion(questions, 'brahe-contribution');
  assert.ok(
    q.check(
      'He made extremely accurate naked-eye observations of planetary positions, especially Mars, which gave Kepler the precise data needed to find that orbits are ellipses'
    ).correct
  );
  assert.equal(q.check('He invented the telescope, letting astronomers see the planets in detail for the first time').correct, false);
});

test('kepler-ellipses: Mars’s elliptical orbit is the only correct option', () => {
  const questions = makeQuestions();
  const q = findQuestion(questions, 'kepler-ellipses');
  assert.ok(q.check("That Mars's orbit (and by extension, planetary orbits generally) is an ellipse, not a circle").correct);
  assert.equal(q.check('That Mars has two small moons').correct, false);
});

test('venus-phases: the full-phase-range argument is the only correct option', () => {
  const questions = makeQuestions();
  const q = findQuestion(questions, 'venus-phases');
  assert.ok(
    q.check(
      'In a strict Earth-centred model, with Venus always between Earth and the Sun, Venus could only ever show crescent phases — never gibbous or full. Seeing the full range meant Venus must orbit the Sun, not Earth'
    ).correct
  );
  assert.equal(q.check("It didn't — Venus's phases are consistent with either model").correct, false);
});

test('jupiter-moons: "not everything orbits Earth" is the only correct option', () => {
  const questions = makeQuestions();
  const q = findQuestion(questions, 'jupiter-moons');
  assert.ok(q.check('That not everything in the universe orbits Earth — undermining a key assumption of the geocentric model').correct);
  assert.equal(q.check('That Jupiter must be the true centre of the Solar System').correct, false);
});

test('every question only tags u3.x ids that actually exist in curriculum.js', () => {
  const { getSubtopic } = require('../src/curriculum');
  const questions = makeQuestions();
  questions.forEach((q) => {
    q.units.forEach((id) => assert.ok(getSubtopic(id), `${q.id} references missing subtopic "${id}"`));
  });
});
