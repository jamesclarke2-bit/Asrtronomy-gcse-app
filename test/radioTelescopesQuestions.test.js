const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../src/radioTelescopes');
const { makeQuestions } = require('../src/radioTelescopesQuestions');
const { getSubtopic } = require('../src/curriculum');
const { getSpecPoint } = require('../src/specPoints');

const questions = makeQuestions(R);
const SPEC = ['13.24', '13.25', '13.26', '13.27'];

function fieldCombos(fields) {
  return fields.reduce((combos, field) => combos.flatMap((combo) => field.options.map((option) => ({ ...combo, [field.key]: option }))), [{}]);
}

function correctAnswers(q) {
  if (q.fields) return fieldCombos(q.fields).filter((value) => q.check(value).correct);
  return q.options.filter((value) => q.check(value).correct);
}

test('at least 10 questions, unique ids, tagged u5.5 and one of 13.24 to 13.27, three or more per point', () => {
  assert.ok(questions.length >= 10);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  assert.ok(getSubtopic('u5.5'));
  questions.forEach((q) => {
    assert.deepEqual(q.units, ['u5.5'], q.id);
    assert.ok(SPEC.includes(q.spec), q.id);
    assert.ok(getSpecPoint(q.spec), q.spec);
    assert.ok(Number.isInteger(q.marks) && q.marks > 0, q.id);
  });
  SPEC.forEach((tag) => assert.ok(questions.filter((q) => q.spec === tag).length >= 3, tag));
});

test('there is a question on why a radio dish must be bigger than an optical one for the same detail', () => {
  const q = questions.find((x) => x.id === 'rt-bigger-than-optical');
  assert.equal(q.spec, '13.25');
  const [right] = correctAnswers(q);
  assert.match(right.depends, /wavelength divided by the diameter/);
  assert.match(right.why, /Radio wavelengths are far longer than light/);
});

test('every choice or multi-field question has exactly one fully-correct answer, one field per mark', () => {
  questions.filter((q) => q.type !== 'number').forEach((q) => {
    assert.equal(correctAnswers(q).length, 1, q.id);
    if (q.fields) assert.equal(q.fields.length, q.marks, q.id);
  });
});

test('every answer, right or wrong, shows the mark scheme', () => {
  questions.forEach((q) => {
    const samples = q.type === 'number' ? ['1', '42', 'abc'] : q.fields ? fieldCombos(q.fields).slice(0, 3) : q.options;
    samples.forEach((value) => assert.match(q.check(value).message, /Mark scheme:/, q.id));
  });
});

test('the dish-size calculation states every value it needs, accepts 2% either side and shows the full working', () => {
  const q = questions.find((x) => x.id === 'rt-dish-size-calc');
  for (const given of ['0.10 m', '500 nm', '0.000 000 5 m', '21 cm', '0.21 m', 'wavelength ÷ diameter']) assert.ok(q.prompt.includes(given), given);
  const km = q.answer.km;
  assert.ok(Math.abs(km - 42) < 1e-9, `${km}`);
  assert.equal(q.check('42').correct, true);
  assert.equal(q.check(String(km * 1.02)).correct, true, '+2%');
  assert.equal(q.check(String(km * 0.98)).correct, true, '-2%');
  assert.equal(q.check('42000').correct, false, 'metres, not km');
  assert.equal(q.check('38').correct, false);
  const message = q.check('1').message;
  assert.match(message, /0\.21 × 0\.10 ÷ 0\.000 000 5 = 42,000 m ≈ 42 km/);
});

test('the four 13.27 discoveries are all asked about', () => {
  const text = questions.filter((q) => q.spec === '13.27').map((q) => JSON.stringify([q.prompt, q.options, q.fields])).join(' ');
  for (const word of ['quasars', 'spiral', 'black holes', 'young stars']) assert.ok(text.toLowerCase().includes(word), word);
});

test('total marks', () => {
  assert.equal(questions.reduce((sum, q) => sum + q.marks, 0), 16);
});
