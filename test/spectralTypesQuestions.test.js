const test = require('node:test');
const assert = require('node:assert/strict');
const Spectra = require('../src/spectra');
const { makeQuestions } = require('../src/spectralTypesQuestions');
const { getSubtopic } = require('../src/curriculum');

const questions = makeQuestions(Spectra);

function fieldCombos(fields) {
  return fields.reduce(
    (combos, field) => combos.flatMap((combo) => field.options.map((option) => ({ ...combo, [field.key]: option }))),
    [{}]
  );
}

function correctAnswers(q) {
  if (q.fields) return fieldCombos(q.fields).filter((value) => q.check(value).correct);
  return q.options.filter((value) => q.check(value).correct);
}

test('at least 8 questions, every id unique, every one tagged u4.8 and 13.5 or 13.6 with whole-number marks', () => {
  assert.ok(questions.length >= 8);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  questions.forEach((q) => {
    assert.deepEqual(q.units, ['u4.8'], q.id);
    assert.ok(getSubtopic('u4.8'));
    assert.ok(['13.5', '13.6'].includes(q.spec), q.id);
    assert.ok(Number.isInteger(q.marks) && q.marks > 0, q.id);
  });
  ['13.5', '13.6'].forEach((tag) => assert.ok(questions.filter((q) => q.spec === tag).length >= 3, tag));
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

test('answers follow the class data: hydrogen A, helium B, molecules M, Spica B and Betelgeuse M', () => {
  const answer = (id) => correctAnswers(questions.find((q) => q.id === id))[0];
  assert.equal(answer('hydrogen-strongest-class'), 'A');
  assert.equal(answer('helium-strongest-class'), 'B');
  assert.equal(answer('molecular-bands-class'), 'M');
  assert.deepEqual(answer('classify-two-stars-by-lines'), { spica: 'B', betelgeuse: 'M' });
  assert.deepEqual(answer('sun-is-g2').letter, 'G');
  assert.equal(answer('class-order-hottest-first'), 'O, B, A, F, G, K, M');
});

test('temperature questions state every range they need and match classForTemperature', () => {
  const q1 = questions.find((q) => q.id === 'class-and-colour-from-temperature');
  const q2 = questions.find((q) => q.id === 'two-stars-from-temperature');
  [q1, q2].forEach((q) => {
    Spectra.SPECTRAL_CLASSES.forEach((c) => assert.ok(q.prompt.includes(c.minK.toLocaleString('en-GB')), `${q.id} ${c.letter}`));
  });
  assert.deepEqual(correctAnswers(q1), [{ letter: 'A', colour: 'white' }]);
  assert.deepEqual(correctAnswers(q2), [{ p: 'K', q: 'B' }]);
});

test('total marks', () => {
  assert.equal(questions.reduce((sum, q) => sum + q.marks, 0), 16);
});
