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
