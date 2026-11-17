const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../src/bigBang');
const { makeQuestions } = require('../src/bigBangQuestions');
const { getSubtopic } = require('../src/curriculum');

const questions = makeQuestions(B);
const q = (id) => questions.find((x) => x.id === id);

function combos(fields) {
  return fields.reduce((acc, f) => acc.flatMap((c) => f.options.map((o) => ({ ...c, [f.key]: o }))), [{}]);
}
const right = (x) => (x.fields ? combos(x.fields) : x.options).filter((v) => x.check(v).correct);

test('unique ids, all on u6.9 and 16.7', () => {
  assert.deepEqual(getSubtopic('u6.9').spec, ['16.7']);
  assert.equal(new Set(questions.map((x) => x.id)).size, questions.length);
  questions.forEach((x) => {
    assert.deepEqual(x.units, ['u6.9'], x.id);
    assert.equal(x.spec, '16.7', x.id);
  });
});

test('every question has exactly one fully right answer and shows the mark scheme', () => {
  questions.forEach((x) => {
    assert.equal(right(x).length, 1, x.id);
    (x.fields ? combos(x.fields).slice(0, 3) : x.options).forEach((v) => assert.match(x.check(v).message, /Mark scheme:/, x.id));
  });
});

test('the key question: expansion alone fits both theories', () => {
  const x = q('bb-expansion-alone');
  assert.match(x.prompt, /expansion of the Universe, on its own/);
  assert.match(right(x)[0], /Both theories predict galaxies moving apart/);
  assert.match(right(q('bb-new-matter'))[0], /New matter is created/);
  assert.match(right(q('bb-start'))[0], /hot, dense state/);
  assert.match(right(q('bb-density'))[0], /goes down/);
  assert.match(q('bb-density').prompt, /89 galaxies at step 2, when galaxies have first formed, and 25 today/);
  assert.doesNotMatch(q('bb-density').prompt, /step 1/);
  assert.equal(right(q('bb-past'))[0], 'Just the same as it looks today');
  assert.deepEqual(right(q('bb-match'))[0], { beginning: 'Big Bang', created: 'Steady State', apart: 'Both theories' });
  assert.equal(q('bb-match').marks, 3);
});
