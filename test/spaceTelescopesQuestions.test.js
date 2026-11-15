const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../src/spaceTelescopes');
const { makeQuestions } = require('../src/spaceTelescopesQuestions');
const { getSubtopic } = require('../src/curriculum');
const { getSpecPoint } = require('../src/specPoints');

const questions = makeQuestions(T);
const SPEC = ['13.31', '13.32', '13.33'];

function fieldCombos(fields) {
  return fields.reduce((combos, field) => combos.flatMap((combo) => field.options.map((option) => ({ ...combo, [field.key]: option }))), [{}]);
}

function correctAnswers(q) {
  if (q.fields) return fieldCombos(q.fields).filter((value) => q.check(value).correct);
  return q.options.filter((value) => q.check(value).correct);
}

test('at least 10 questions, unique ids, tagged u5.7 and one of 13.31 to 13.33, three or more per point', () => {
  assert.ok(questions.length >= 10);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  assert.ok(getSubtopic('u5.7'));
  questions.forEach((q) => {
    assert.deepEqual(q.units, ['u5.7'], q.id);
    assert.ok(SPEC.includes(q.spec), q.id);
    assert.ok(getSpecPoint(q.spec), q.spec);
    assert.ok(Number.isInteger(q.marks) && q.marks > 0, q.id);
  });
  SPEC.forEach((tag) => assert.ok(questions.filter((q) => q.spec === tag).length >= 3, tag));
});

test('the weigh-up question compares a space telescope with a mountain-top one for a given wavelength, both sides earning marks', () => {
  const q = questions.find((x) => x.id === 'sp-weigh-infrared');
  assert.equal(q.spec, '13.32');
  assert.match(q.prompt, /infrared/);
  assert.match(q.prompt, /high, dry mountain/);
  assert.match(q.prompt, /space telescope/);
  assert.equal(q.marks, 3);
  const [right] = correctAnswers(q);
  assert.match(right.space, /all of the infrared/);
  assert.match(right.mountain, /bigger .* repaired/);
  assert.match(right.xray, /Only the space telescope/);
  // A one-sided answer loses marks.
  const oneSided = { ...right, mountain: q.fields[1].options.find((o) => o !== right.mountain) };
  assert.match(q.check(oneSided).message, /^2 out of 3 marks/);
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

test('the three 13.33 discoveries are all asked about', () => {
  const text = questions.filter((q) => q.spec === '13.33').map((q) => JSON.stringify([q.prompt, q.options])).join(' ').toLowerCase();
  for (const word of ['gamma-ray bursts', 'accretion discs', 'young stars', 'coronae']) assert.ok(text.includes(word), word);
});

test('total marks', () => {
  assert.equal(questions.reduce((sum, q) => sum + q.marks, 0), 14);
});
