const test = require('node:test');
const assert = require('node:assert/strict');
const I = require('../src/infraredSites');
const { makeQuestions } = require('../src/infraredTelescopesQuestions');
const { getSubtopic } = require('../src/curriculum');
const { getSpecPoint } = require('../src/specPoints');

const questions = makeQuestions(I);
const SPEC = ['13.23', '13.28', '13.29', '13.30'];

function fieldCombos(fields) {
  return fields.reduce((combos, field) => combos.flatMap((combo) => field.options.map((option) => ({ ...combo, [field.key]: option }))), [{}]);
}

function correctAnswers(q) {
  if (q.fields) return fieldCombos(q.fields).filter((value) => q.check(value).correct);
  return q.options.filter((value) => q.check(value).correct);
}

test('at least 10 questions, unique ids, tagged u5.6 and one of 13.23, 13.28, 13.29, 13.30, three per point', () => {
  assert.ok(questions.length >= 10);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  assert.ok(getSubtopic('u5.6'));
  questions.forEach((q) => {
    assert.deepEqual(q.units, ['u5.6'], q.id);
    assert.ok(SPEC.includes(q.spec), q.id);
    assert.ok(getSpecPoint(q.spec), q.spec);
    assert.ok(Number.isInteger(q.marks) && q.marks > 0, q.id);
  });
  SPEC.forEach((tag) => assert.ok(questions.filter((q) => q.spec === tag).length >= 3, tag));
});

test("the two required questions: why an X-ray telescope can't work on a mountain top, and why a high, dry site is better for infrared", () => {
  const xray = questions.find((q) => q.id === 'ir-xray-mountain');
  assert.match(xray.prompt, /Why can't an X-ray telescope work on a mountain top\?/);
  assert.equal(xray.spec, '13.23');
  const [x] = correctAnswers(xray);
  assert.match(x.absorbed, /absorbed high in the atmosphere/);
  assert.match(x.where, /In space/);
  const dry = questions.find((q) => q.id === 'ir-high-dry');
  assert.match(dry.prompt, /Why is a high, dry site better for infrared\?/);
  assert.equal(dry.spec, '13.28');
  const [d] = correctAnswers(dry);
  assert.equal(d.absorber, 'Water vapour');
  assert.match(d.helps, /above most of the water vapour/);
});

test('every choice or multi-field question has exactly one fully-correct answer, one field per mark', () => {
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

test('the three 13.29 discoveries are all asked about', () => {
  const text = questions.filter((q) => q.spec === '13.29').map((q) => JSON.stringify([q.prompt, q.options])).join(' ').toLowerCase();
  for (const word of ['protostars', 'molecular clouds', 'moons']) assert.ok(text.includes(word), word);
});

test('total marks', () => {
  assert.equal(questions.reduce((sum, q) => sum + q.marks, 0), 15);
});
