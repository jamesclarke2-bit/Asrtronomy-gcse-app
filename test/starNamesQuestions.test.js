const test = require('node:test');
const assert = require('node:assert/strict');
const N = require('../src/starNames');
const { makeQuestions } = require('../src/starNamesQuestions');
const { getSubtopic } = require('../src/curriculum');

const questions = makeQuestions(N);

function fieldCombos(fields) {
  return fields.reduce((combos, field) => combos.flatMap((combo) => field.options.map((option) => ({ ...combo, [field.key]: option }))), [{}]);
}

function correctAnswers(q) {
  if (q.fields) return fieldCombos(q.fields).filter((value) => q.check(value).correct);
  return q.options.filter((value) => q.check(value).correct);
}

test('unique ids, all tagged u4.13, with questions for both 14.1 and 14.2', () => {
  assert.deepEqual(getSubtopic('u4.13').spec, ['14.1', '14.2']);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  questions.forEach((q) => {
    assert.deepEqual(q.units, ['u4.13'], q.id);
    assert.ok(['14.1', '14.2'].includes(q.spec), q.id);
  });
  ['14.1', '14.2'].forEach((spec) => assert.ok(questions.filter((q) => q.spec === spec).length >= 5, spec));
});

test('every choice or multi-field question has exactly one fully-correct answer; every answer shows the mark scheme', () => {
  questions.forEach((q) => {
    assert.equal(correctAnswers(q).length, 1, q.id);
    if (q.fields) assert.equal(q.fields.length, q.marks, q.id);
    const samples = q.fields ? fieldCombos(q.fields).slice(0, 2) : q.options;
    samples.forEach((value) => assert.match(q.check(value).message, /Mark scheme:/, q.id));
  });
});

test('decoding a Bayer name: the constellation, and roughly how bright', () => {
  const q = questions.find((x) => x.id === 'cn-decode-beta-per');
  assert.deepEqual(correctAnswers(q), [{ where: 'Perseus', bright: 'Probably the second-brightest star in Perseus' }]);
  assert.match(q.check({}).message, /usually, not always/);
  assert.equal(correctAnswers(questions.find((x) => x.id === 'cn-name-sirius'))[0], 'Alpha Canis Majoris');
});

test('catalogue questions quote the extract they need, and their answers agree with it', () => {
  ['cn-find-globular', 'cn-ngc-of-m42', 'cn-use-extract'].forEach((id) => {
    const q = questions.find((x) => x.id === id);
    assert.match(q.prompt, /M42 = NGC 1976: Orion Nebula, nebula, in Orion, magnitude 4\.0/, id);
  });
  assert.equal(correctAnswers(questions.find((x) => x.id === 'cn-find-globular'))[0], 'M13');
  assert.equal(correctAnswers(questions.find((x) => x.id === 'cn-ngc-of-m42'))[0], 'NGC 1976');
  assert.deepEqual(correctAnswers(questions.find((x) => x.id === 'cn-use-extract'))[0], { faint: 'M57', galaxy: 'M31' });
});
