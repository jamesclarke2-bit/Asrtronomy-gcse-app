const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('../src/galaxyFormation');
const { makeQuestions } = require('../src/galaxyFormationQuestions');
const { getSubtopic } = require('../src/curriculum');

const questions = makeQuestions(F);

function fieldCombos(fields) {
  return fields.reduce((combos, field) => combos.flatMap((combo) => field.options.map((option) => ({ ...combo, [field.key]: option }))), [{}]);
}

function correctAnswers(q) {
  if (q.fields) return fieldCombos(q.fields).filter((value) => q.check(value).correct);
  return q.options.filter((value) => q.check(value).correct);
}

const ans = (id) => correctAnswers(questions.find((q) => q.id === id))[0];

test('unique ids, all tagged u6.8 and 15.14', () => {
  assert.deepEqual(getSubtopic('u6.8').spec, ['15.14']);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  questions.forEach((q) => {
    assert.deepEqual(q.units, ['u6.8'], q.id);
    assert.equal(q.spec, '15.14', q.id);
  });
});

test('every question has exactly one fully-correct answer and shows the mark scheme', () => {
  questions.forEach((q) => {
    assert.equal(correctAnswers(q).length, 1, q.id);
    if (q.fields) assert.equal(q.fields.length, q.marks, q.id);
    const samples = q.fields ? fieldCombos(q.fields).slice(0, 2) : q.options;
    samples.forEach((value) => assert.match(q.check(value).message, /Mark scheme:/, q.id));
  });
});

test('the two theories, the evidence, and what mergers do', () => {
  const t = ans('gf-theories');
  assert.match(t.top, /One huge cloud of gas collapses/);
  assert.match(t.bottom, /Small clumps form first and merge/);
  assert.equal(ans('gf-gravity'), 'Gravity');
  assert.match(ans('gf-disc'), /spins faster/);
  assert.match(ans('gf-evidence'), /Very distant galaxies/);
  assert.equal(ans('gf-merger-result'), 'One elliptical galaxy');
  assert.match(ans('gf-collision'), /tails of stars/);
  assert.match(ans('gf-milky-way'), /may merge in the next few billion years/);
  const mwScheme = questions.find((q) => q.id === 'gf-milky-way').check('x').message;
  assert.match(mwScheme, /about one in two within 10 billion years/);
  assert.doesNotMatch(mwScheme, /4 to 5 billion|expected to merge/);
});
