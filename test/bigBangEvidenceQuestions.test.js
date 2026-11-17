const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../src/bigBangEvidence');
const { makeQuestions } = require('../src/bigBangEvidenceQuestions');
const { getSubtopic } = require('../src/curriculum');

const questions = makeQuestions(E);
const q = (id) => questions.find((x) => x.id === id);

function combos(fields) {
  return fields.reduce((acc, f) => acc.flatMap((c) => f.options.map((o) => ({ ...c, [f.key]: o }))), [{}]);
}
const right = (x) => (x.fields ? combos(x.fields) : x.options).filter((v) => x.check(v).correct);

test('unique ids, all on u6.3, tagged 16.8 or 16.9, both asked', () => {
  assert.deepEqual(getSubtopic('u6.3').spec, ['16.8', '16.9']);
  assert.equal(new Set(questions.map((x) => x.id)).size, questions.length);
  questions.forEach((x) => {
    assert.deepEqual(x.units, ['u6.3'], x.id);
    assert.ok(['16.8', '16.9'].includes(x.spec), x.id);
  });
  assert.ok(questions.filter((x) => x.spec === '16.9').length >= 3);
});

test('every question has exactly one fully right answer and shows the mark scheme', () => {
  questions.forEach((x) => {
    assert.equal(right(x).length, 1, x.id);
    (x.fields ? combos(x.fields).slice(0, 3) : x.options).forEach((v) => assert.match(x.check(v).message, /Mark scheme:/, x.id));
  });
});

test('one question per piece of evidence, and one on why the fluctuations matter', () => {
  assert.match(right(q('ev-quasars'))[0], /only far away/);
  assert.match(right(q('ev-cmb'))[0], /cooled glow of the hot, dense early Universe/);
  assert.match(right(q('ev-cmb-steady'))[0], /never hot and dense/);
  assert.match(right(q('ev-deep-field'))[0], /smaller and more irregular/);
  assert.match(right(q('ev-seeds'))[0], /galaxies and clusters/);
  assert.match(right(q('ev-why-matter'))[0], /what each theory predicts/);
  assert.match(right(q('ev-wmap-planck'))[0], /finer and finer detail/);
  const m = right(q('ev-match'))[0];
  assert.match(m.cmb, /hot and dense/);
  assert.match(m.quasars, /gone today/);
  assert.match(m.deep, /looked different/);
});
