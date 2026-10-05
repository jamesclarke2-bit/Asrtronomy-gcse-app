const test = require('node:test');
const assert = require('node:assert/strict');
const TelescopeModel = require('../src/telescopeModel');
const { makeQuestions } = require('../src/telescopeQuestions');
const { getSubtopic } = require('../src/curriculum');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('magnification-calculation: 1200 mm objective / 20 mm eyepiece is 60x', () => {
  const q = findQuestion(makeQuestions(TelescopeModel), 'magnification-calculation');
  assert.ok(q.check(60).correct);
  assert.equal(q.check(20).correct, false);
});

test('light-grasp-ratio: a 150 mm telescope collects 9x a 50 mm telescope\'s light', () => {
  const q = findQuestion(makeQuestions(TelescopeModel), 'light-grasp-ratio');
  assert.ok(q.check(9).correct);
  assert.equal(q.check(3).correct, false);
});

test('light-grasp-vs-eye: a 70 mm telescope collects 100x a 7 mm pupil\'s light', () => {
  const q = findQuestion(makeQuestions(TelescopeModel), 'light-grasp-vs-eye');
  assert.ok(q.check(100).correct);
  assert.equal(q.check(10).correct, false);
});

test('resolution-calculation: a 60 mm aperture at 500 nm resolves about 2.1 arcseconds', () => {
  const q = findQuestion(makeQuestions(TelescopeModel), 'resolution-calculation');
  assert.ok(q.check(2.1).correct);
  assert.equal(q.check(10).correct, false);
});

test('what-changes-resolution: larger diameter / shorter wavelength is the only correct option', () => {
  const q = findQuestion(makeQuestions(TelescopeModel), 'what-changes-resolution');
  assert.ok(q.check('Using a larger objective diameter, or observing at a shorter wavelength').correct);
  assert.equal(q.check('Using a shorter eyepiece focal length, to get more magnification').correct, false);
});

test('chromatic-aberration: reflecting telescopes is the only correct option', () => {
  const q = findQuestion(makeQuestions(TelescopeModel), 'chromatic-aberration');
  assert.ok(
    q.check(
      'A reflecting telescope (Newtonian or Cassegrain) — mirrors reflect every wavelength of light at the same angle, so there is no colour-dependent focusing error'
    ).correct
  );
  assert.equal(q.check('A Keplerian refractor — its inverted image cancels out the colour fringing').correct, false);
});

test('choose-design-short-tube: Cassegrain is the only correct option', () => {
  const q = findQuestion(makeQuestions(TelescopeModel), 'choose-design-short-tube');
  assert.ok(
    q.check(
      'A Cassegrain reflector — light reflects off the primary, then back off a secondary mirror through a hole in the primary, folding a long focal length into a short tube'
    ).correct
  );
  assert.equal(
    q.check('A Keplerian refractor — a long focal length simply needs a long tube, which is fine here').correct,
    false
  );
});

test('every question only tags u5.x ids that actually exist in curriculum.js', () => {
  const questions = makeQuestions(TelescopeModel);
  questions.forEach((q) => {
    q.units.forEach((id) => assert.ok(getSubtopic(id), `${q.id} references missing subtopic "${id}"`));
  });
});
