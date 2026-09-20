const test = require('node:test');
const assert = require('node:assert/strict');
const { QUESTIONS } = require('../src/questions');
const { getSunPosition } = require('../src/solarPosition');

function findQuestion(id) {
  const q = QUESTIONS.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('every question tags a curriculum subtopic id', () => {
  for (const q of QUESTIONS) {
    assert.ok(Array.isArray(q.units) && q.units.length > 0, `${q.id} has no units`);
  }
});

test('q1: winter solstice max altitude at 52N (u2.9)', () => {
  const q1 = findQuestion('q1');
  assert.deepEqual(q1.units, ['u2.9']);
  const winterNoon = new Date(Date.UTC(2026, 11, 21, 12, 0));
  const expected = getSunPosition(winterNoon, 52, 0).altitude;
  assert.ok(q1.check(expected).correct);
  assert.ok(q1.check(expected + 0.9).correct);
  assert.ok(!q1.check(expected + 5).correct);
});

test('q2: latitude for 90deg altitude on summer solstice (u1.4)', () => {
  const q2 = findQuestion('q2');
  assert.deepEqual(q2.units, ['u1.4']);
  assert.ok(q2.check(23.44).correct);
  assert.ok(!q2.check(0).correct);
  assert.ok(!q2.check(52).correct);
});

test('q3: calculate-then-verify altitude at 52N summer solstice (u2.9, u3.2)', () => {
  const q3 = findQuestion('q3');
  assert.deepEqual(q3.units, ['u2.9', 'u3.2']);
  const summerNoon = new Date(Date.UTC(2026, 5, 21, 12, 0));
  const decl = getSunPosition(summerNoon, 0, 0).declination;
  const calculated = 90 - Math.abs(52 - decl);
  assert.ok(q3.check(calculated).correct);
  assert.ok(!q3.check(calculated + 5).correct);
});

test('q4: sunrise direction on the equinox is East (u1.4)', () => {
  const q4 = findQuestion('q4');
  assert.deepEqual(q4.units, ['u1.4']);
  assert.ok(q4.check('East').correct);
  assert.ok(!q4.check('North').correct);
  assert.ok(!q4.check('South').correct);
  assert.ok(!q4.check('West').correct);
});

test('q5: UTC time of solar noon on the summer solstice at lon 0 (u2.10)', () => {
  const q5 = findQuestion('q5');
  assert.deepEqual(q5.units, ['u2.10']);
  assert.ok(q5.check('12:02').correct);
  assert.ok(!q5.check('09:00').correct);
  assert.ok(!q5.check('').correct);
});

test('q6: the sun\'s highest-point moment is culmination (u1.6)', () => {
  const q6 = findQuestion('q6');
  assert.deepEqual(q6.units, ['u1.6']);
  assert.ok(q6.check('culmination').correct);
  assert.ok(q6.check('Culmination').correct);
  assert.ok(q6.check('  CULMINATION  ').correct);
  assert.ok(!q6.check('zenith').correct);
  assert.ok(!q6.check('').correct);
});

test('q7: the N-S line through the diagram is the meridian (u1.6)', () => {
  const q7 = findQuestion('q7');
  assert.deepEqual(q7.units, ['u1.6']);
  assert.ok(q7.check('meridian').correct);
  assert.ok(q7.check('Meridian').correct);
  assert.ok(!q7.check('horizon').correct);
});

test('q8: the centre point of the diagram is the zenith (u1.6)', () => {
  const q8 = findQuestion('q8');
  assert.deepEqual(q8.units, ['u1.6']);
  assert.ok(q8.check('Zenith').correct);
  assert.ok(!q8.check('Nadir').correct);
  assert.ok(!q8.check('Meridian').correct);
  assert.ok(!q8.check('Horizon').correct);
});

test('q9: latitude for 90deg altitude on the equinox is the equator (u2.9)', () => {
  const q9 = findQuestion('q9');
  assert.deepEqual(q9.units, ['u2.9']);
  assert.ok(q9.check(0).correct);
  assert.ok(!q9.check(23.44).correct);
  assert.ok(!q9.check(52).correct);
});
