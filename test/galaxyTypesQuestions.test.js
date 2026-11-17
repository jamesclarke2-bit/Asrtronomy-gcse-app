const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../src/galaxyTypes');
const { makeQuestions } = require('../src/galaxyTypesQuestions');
const { getSubtopic } = require('../src/curriculum');

const questions = makeQuestions(T);

function fieldCombos(fields) {
  return fields.reduce((combos, field) => combos.flatMap((combo) => field.options.map((option) => ({ ...combo, [field.key]: option }))), [{}]);
}

function correctAnswers(q) {
  if (q.fields) return fieldCombos(q.fields).filter((value) => q.check(value).correct);
  return q.options.filter((value) => q.check(value).correct);
}

const ans = (id) => correctAnswers(questions.find((q) => q.id === id))[0];

test('unique ids, all tagged u6.6, with questions for 15.6 and 15.7', () => {
  assert.deepEqual(getSubtopic('u6.6').spec, ['15.6', '15.7']);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  questions.forEach((q) => assert.deepEqual(q.units, ['u6.6'], q.id));
  ['15.6', '15.7'].forEach((spec) => assert.ok(questions.filter((q) => q.spec === spec).length >= 2, spec));
});

test('every question has exactly one fully-correct answer and shows the mark scheme', () => {
  questions.forEach((q) => {
    assert.equal(correctAnswers(q).length, 1, q.id);
    if (q.fields) assert.equal(q.fields.length, q.marks, q.id);
    const samples = q.fields ? fieldCombos(q.fields).slice(0, 2) : q.options;
    samples.forEach((value) => assert.match(q.check(value).message, /Mark scheme:/, q.id));
  });
});

test('at least two "classify this drawn galaxy" questions, one per class here, each drawing its galaxy', () => {
  const classify = questions.filter((q) => q.id.startsWith('gt-classify-'));
  assert.ok(classify.length >= 2);
  assert.deepEqual(classify.map((q) => ans(q.id)).sort(), ['Barred spiral', 'Elliptical', 'Irregular', 'Spiral']);
  classify.forEach((q) => {
    assert.equal(typeof q.render, 'function', q.id);
    assert.deepEqual(q.options, T.CLASSES.map((c) => c.name));
  });
});

test('the tuning fork questions, including that it does not show evolution', () => {
  assert.deepEqual(ans('gt-fork-parts'), { handle: 'Ellipticals (E0 to E7)', upper: 'Spirals (Sa, Sb, Sc)', lower: 'Barred spirals (SBa, SBb, SBc)' });
  assert.match(ans('gt-e-number'), /E0 is round, E7 the flattest/);
  assert.match(ans('gt-a-to-c'), /bulge gets smaller and the arms more loosely wound/);
  assert.match(ans('gt-irregular-place'), /not on the fork/);
  assert.match(ans('gt-evolution'), /^No: .*no longer thought true/);
  assert.match(ans('gt-milky-way'), /barred-spiral prong, in the middle/);
});
