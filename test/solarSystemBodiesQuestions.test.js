const test = require('node:test');
const assert = require('node:assert/strict');
const SpecData = require('../src/specData');
const { makeQuestions } = require('../src/solarSystemBodiesQuestions');
const { getSubtopic } = require('../src/curriculum');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('relative-size-calculation: Jupiter is about 11.2x Earth\'s diameter, from the data sheet', () => {
  const q = findQuestion(makeQuestions(SpecData), 'relative-size-calculation');
  assert.ok(q.check(11.2).correct);
  assert.equal(q.check(3).correct, false);
});

test('relative-mass-comparison: Saturn is about 6.3x Uranus\'s mass, from the data sheet', () => {
  const q = findQuestion(makeQuestions(SpecData), 'relative-mass-comparison');
  assert.ok(q.check(6.3).correct);
  assert.equal(q.check(1).correct, false);
});

test('comet-tail-direction: away from the Sun is the only correct option', () => {
  const q = findQuestion(makeQuestions(SpecData), 'comet-tail-direction');
  assert.ok(q.check('Away from the Sun').correct);
  assert.equal(q.check("Directly behind the comet's direction of travel, like the wake of a boat").correct, false);
});

test('comet-origin: the Kuiper Belt is the only correct option for a short-period comet', () => {
  const q = findQuestion(makeQuestions(SpecData), 'comet-origin');
  assert.ok(q.check('The Kuiper Belt, beyond Neptune').correct);
  assert.equal(q.check('The Oort Cloud, far beyond the Kuiper Belt').correct, false);
});

test('meteoroid-meteor-meteorite: the meteoroid/meteor/meteorite order is the only correct option', () => {
  const q = findQuestion(makeQuestions(SpecData), 'meteoroid-meteor-meteorite');
  assert.ok(q.check('Meteoroid, then meteor, then meteorite').correct);
  assert.equal(q.check('Meteor, then meteoroid, then meteorite').correct, false);
});

test('ecliptic-oort-cloud: the Oort Cloud\'s spherical shape is the only correct option', () => {
  const q = findQuestion(makeQuestions(SpecData), 'ecliptic-oort-cloud');
  assert.ok(
    q.check(
      'The Oort Cloud is roughly spherical, surrounding the whole Solar System, unlike the flattened, disc-shaped Kuiper Belt and asteroid belt that formed in the same plane as the planets'
    ).correct
  );
  assert.equal(q.check('Long-period comets travel much faster, so they are flung out of the ecliptic plane').correct, false);
});

test('transit-of-venus-parallax: the parallax explanation is the only correct option', () => {
  const q = findQuestion(makeQuestions(SpecData), 'transit-of-venus-parallax');
  assert.ok(
    q.check(
      'Because parallax means the two observers, separated on Earth’s surface, see Venus trace slightly different paths across the Sun’s disc; combining that small measured difference with the known separation between the observers lets the Sun-Earth distance be triangulated'
    ).correct
  );
  assert.equal(
    q.check('Because the Sun looks a different size from different latitudes, and that size difference gives the distance directly').correct,
    false
  );
});

test('earths-water-origin: water-rich asteroids is the only correct option', () => {
  const q = findQuestion(makeQuestions(SpecData), 'earths-water-origin');
  assert.ok(q.check('Water-rich asteroids colliding with the early Earth').correct);
  assert.equal(q.check('Comets delivering icy material').correct, false);
});

test('every question only tags u3.x ids that actually exist in curriculum.js', () => {
  const questions = makeQuestions(SpecData);
  questions.forEach((q) => {
    q.units.forEach((id) => assert.ok(getSubtopic(id), `${q.id} references missing subtopic "${id}"`));
  });
});
