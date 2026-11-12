const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../src/binariesClusters');
const { makeQuestions } = require('../src/binariesClustersQuestions');
const { getSubtopic } = require('../src/curriculum');
const { getSpecPoint } = require('../src/specPoints');

const questions = makeQuestions(B);
const TAGS = ['13.17', '13.34a', '13.34b', '13.34c', '13.34d', '13.34e', '13.34f', '13.34g'];

function fieldCombos(fields) {
  return fields.reduce((combos, field) => combos.flatMap((combo) => field.options.map((option) => ({ ...combo, [field.key]: option }))), [{}]);
}

function correctAnswers(q) {
  if (q.fields) return fieldCombos(q.fields).filter((value) => q.check(value).correct);
  return q.options.filter((value) => q.check(value).correct);
}

test('at least 10 questions, unique ids, tagged u4.10 and 13.17 or a 13.34 sub-part, at least one per sub-part', () => {
  assert.ok(questions.length >= 10);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  assert.ok(getSubtopic('u4.10'));
  questions.forEach((q) => {
    assert.deepEqual(q.units, ['u4.10'], q.id);
    assert.ok(TAGS.includes(q.spec), q.id);
    assert.ok(getSpecPoint(q.spec), q.spec);
    assert.ok(Number.isInteger(q.marks) && q.marks > 0, q.id);
  });
  TAGS.forEach((tag) => assert.ok(questions.some((q) => q.spec === tag), tag));
});

test('every question has exactly one fully-correct answer, and a multi-field one has one field per mark', () => {
  questions.forEach((q) => {
    assert.equal(correctAnswers(q).length, 1, q.id);
    if (q.fields) assert.equal(q.fields.length, q.marks, q.id);
  });
});

test('every answer, right or wrong, shows the mark scheme', () => {
  questions.forEach((q) => {
    const samples = q.fields ? fieldCombos(q.fields).slice(0, 3) : q.options;
    samples.forEach((value) => assert.match(q.check(value).message, /Mark scheme:/, q.id));
  });
});

test('the resolution question states every figure it needs and agrees with the engine', () => {
  const q = questions.find((x) => x.id === 'double-star-split');
  [50, 80, 150].forEach((d) => assert.ok(q.prompt.includes(`${d} mm: ${B.resolutionArcsec(d).toFixed(1)} arcseconds`), d));
  assert.deepEqual(correctAnswers(q), ['80 mm']);
  assert.ok(q.prompt.includes(`${B.objectById('binary').separationArcsec.toFixed(1)} arcseconds apart`));
});

test('cluster answers come from the cluster table', () => {
  const q = questions.find((x) => x.id === 'open-vs-globular');
  const [right] = correctAnswers(q);
  const row = B.CLUSTER_TABLE.find((r) => r.feature === 'Number of stars');
  assert.ok(right.number.includes(row.open) && right.number.includes(row.globular));
  assert.equal(right.where, 'Open: in the disc; globular: in the halo');
});

test('total marks', () => {
  assert.equal(questions.reduce((sum, q) => sum + q.marks, 0), 22);
});
