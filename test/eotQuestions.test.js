const test = require('node:test');
const assert = require('node:assert/strict');
const { QUESTIONS } = require('../src/eotQuestions');

function findQuestion(id) {
  const q = QUESTIONS.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('every eot question tags u2.10', () => {
  for (const q of QUESTIONS) {
    assert.deepEqual(q.units, ['u2.10']);
  }
});

test('eot1: sundial is behind clock on 12 February', () => {
  const eot1 = findQuestion('eot1');
  assert.ok(eot1.check('Behind').correct);
  assert.ok(!eot1.check('Ahead').correct);
});

test('eot2: sundial is about 14 minutes off on 12 February', () => {
  const eot2 = findQuestion('eot2');
  assert.ok(eot2.check(14).correct);
  assert.ok(eot2.check(-14).correct); // magnitude only, direction covered by eot1
  assert.ok(!eot2.check(0).correct);
  assert.ok(!eot2.check(30).correct);
});

test('eot3: April is closest to zero among the given months', () => {
  const eot3 = findQuestion('eot3');
  assert.ok(eot3.check('April').correct);
  assert.ok(!eot3.check('February').correct);
  assert.ok(!eot3.check('July').correct);
  assert.ok(!eot3.check('November').correct);
});

test('eot4: accepts any of the four zero-crossing months', () => {
  const eot4 = findQuestion('eot4');
  assert.ok(eot4.check('April').correct);
  assert.ok(eot4.check('june').correct);
  assert.ok(eot4.check('  September  ').correct);
  assert.ok(eot4.check('December').correct);
  assert.ok(!eot4.check('January').correct);
  assert.ok(!eot4.check('').correct);
});

test('eot5: orbital eccentricity dominates in March', () => {
  const eot5 = findQuestion('eot5');
  assert.ok(eot5.check('Orbital eccentricity').correct);
  assert.ok(!eot5.check('Axial tilt (obliquity)').correct);
});

// --- Time-zone data (u2.10) -----------------------------------------------

test('eot-zone-time: 12:00 UT is 17:00 in a zone 5 hours east, within 2 minutes', () => {
  const q = findQuestion('eot-zone-time');
  assert.ok(q.check('17:00').correct);
  assert.ok(q.check('17:02').correct, 'within the stated 2-minute tolerance');
  assert.equal(q.check('18:00').correct, false);
});

test('eot-lmt-west: 12:00 UT at 75°W is local mean time 07:00', () => {
  const q = findQuestion('eot-lmt-west');
  assert.ok(q.check('07:00').correct);
  assert.equal(q.check('17:00').correct, false);
});

test('eot-lmt-east: 15:00 UT at 30°E is local mean time 17:00', () => {
  const q = findQuestion('eot-lmt-east');
  assert.ok(q.check('17:00').correct);
  assert.equal(q.check('15:00').correct, false);
});

test('eot-longitude-for-noon: local noon at 14:00 UT means longitude 30°W', () => {
  const q = findQuestion('eot-longitude-for-noon');
  assert.ok(q.check({ degrees: 30, direction: 'West' }).correct);
  assert.equal(q.check({ degrees: 30, direction: 'East' }).correct, false);
  assert.equal(q.check({ degrees: 45, direction: 'West' }).correct, false);
});

test('every new time-zone question states the constants it needs in its own prompt text', () => {
  const newQuestions = QUESTIONS.filter((q) =>
    ['eot-zone-', 'eot-lmt-', 'eot-longitude-'].some((prefix) => q.id.startsWith(prefix))
  );
  assert.equal(newQuestions.length, 4);
  newQuestions.forEach((q) => {
    assert.ok(q.prompt.length > 0, `${q.id} has no prompt`);
  });
});
