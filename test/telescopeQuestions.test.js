const test = require('node:test');
const assert = require('node:assert/strict');
const TelescopeModel = require('../src/telescopeModel');
const RayOptics = require('../src/rayOptics');
const { makeQuestions } = require('../src/telescopeQuestions');
const { getSubtopic } = require('../src/curriculum');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('magnification-calculation: 1200 mm objective / 20 mm eyepiece is 60x', () => {
  const q = findQuestion(makeQuestions(TelescopeModel, RayOptics), 'magnification-calculation');
  assert.ok(q.check(60).correct);
  assert.equal(q.check(20).correct, false);
});

test('light-grasp-ratio: a 150 mm telescope collects 9x a 50 mm telescope\'s light', () => {
  const q = findQuestion(makeQuestions(TelescopeModel, RayOptics), 'light-grasp-ratio');
  assert.ok(q.check(9).correct);
  assert.equal(q.check(3).correct, false);
});

test('light-grasp-vs-eye: a 70 mm telescope collects 100x a 7 mm pupil\'s light', () => {
  const q = findQuestion(makeQuestions(TelescopeModel, RayOptics), 'light-grasp-vs-eye');
  assert.ok(q.check(100).correct);
  assert.equal(q.check(10).correct, false);
});

test('resolution-calculation: a 60 mm aperture at 500 nm resolves about 2.1 arcseconds', () => {
  const q = findQuestion(makeQuestions(TelescopeModel, RayOptics), 'resolution-calculation');
  assert.ok(q.check(2.1).correct);
  assert.equal(q.check(10).correct, false);
});

test('what-changes-resolution: larger diameter / shorter wavelength is the only correct option', () => {
  const q = findQuestion(makeQuestions(TelescopeModel, RayOptics), 'what-changes-resolution');
  assert.ok(q.check('Using a larger objective diameter, or observing at a shorter wavelength').correct);
  assert.equal(q.check('Using a shorter eyepiece focal length, to get more magnification').correct, false);
});

test('chromatic-aberration: reflecting telescopes is the only correct option', () => {
  const q = findQuestion(makeQuestions(TelescopeModel, RayOptics), 'chromatic-aberration');
  assert.ok(
    q.check(
      'A reflecting telescope (Newtonian or Cassegrain) — mirrors reflect every wavelength of light at the same angle, so there is no colour-dependent focusing error'
    ).correct
  );
  assert.equal(q.check('A Keplerian refractor — its inverted image cancels out the colour fringing').correct, false);
});

test('choose-design-short-tube: Cassegrain is the only correct option', () => {
  const q = findQuestion(makeQuestions(TelescopeModel, RayOptics), 'choose-design-short-tube');
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

test('why-galilean-upright: the single-crossing explanation is the only correct option', () => {
  const q = findQuestion(makeQuestions(TelescopeModel, RayOptics), 'why-galilean-upright');
  assert.ok(
    q.check(
      "The diverging Galilean eyepiece catches the rays while they're still travelling the same way up as the object and bends them back out parallel before they'd have crossed, so nothing ever flips; the Keplerian's rays do cross, flipping the image once — but a star or planet has no agreed \"right way up\" to compare it against, so an inverted view loses nothing an astronomer needs"
    ).correct
  );
  assert.equal(
    q.check('The Galilean lens flips the image twice, which cancels out, while the Keplerian only flips it once').correct,
    false
  );
});

test('compare-tube-length-magnification: the Keplerian tube length (500 + 50 mm) is 550 mm', () => {
  const q = findQuestion(makeQuestions(TelescopeModel, RayOptics), 'compare-tube-length-magnification');
  assert.ok(q.check(550).correct);
  assert.equal(q.check(450).correct, false);
});

test('every question only tags u5.x ids that actually exist in curriculum.js', () => {
  const questions = makeQuestions(TelescopeModel, RayOptics);
  questions.forEach((q) => {
    q.units.forEach((id) => assert.ok(getSubtopic(id), `${q.id} references missing subtopic "${id}"`));
  });
});
