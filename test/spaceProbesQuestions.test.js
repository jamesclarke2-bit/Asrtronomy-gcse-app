const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../src/spaceProbes');
const { makeQuestions } = require('../src/spaceProbesQuestions');
const { getSubtopic } = require('../src/curriculum');
const { getSpecPoint } = require('../src/specPoints');

const questions = makeQuestions(P);

function fieldCombos(fields) {
  return fields.reduce((combos, field) => combos.flatMap((combo) => field.options.map((option) => ({ ...combo, [field.key]: option }))), [{}]);
}

function correctAnswers(q) {
  if (q.fields) return fieldCombos(q.fields).filter((value) => q.check(value).correct);
  return q.options.filter((value) => q.check(value).correct);
}

test('unique ids, all tagged u5.3, and every one of 11.26, 11.27 and 11.28 has questions', () => {
  assert.ok(questions.length >= 12);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  assert.deepEqual(getSubtopic('u5.3').spec, ['11.26', '11.27', '11.28']);
  questions.forEach((q) => {
    assert.deepEqual(q.units, ['u5.3'], q.id);
    assert.ok(getSpecPoint(q.spec), q.id);
    assert.ok(Number.isInteger(q.marks) && q.marks > 0, q.id);
  });
  ['11.26', '11.27', '11.28'].forEach((spec) => assert.ok(questions.filter((q) => q.spec === spec).length >= 4, spec));
});

test('every choice or multi-field question has exactly one fully-correct answer; every answer shows the mark scheme', () => {
  questions.forEach((q) => {
    if (q.type !== 'number') {
      assert.equal(correctAnswers(q).length, 1, q.id);
      if (q.fields) assert.equal(q.fields.length, q.marks, q.id);
    }
    const samples = q.type === 'number' ? ['1', 'abc'] : q.fields ? fieldCombos(q.fields).slice(0, 2) : q.options;
    samples.forEach((value) => assert.match(q.check(value).message, /Mark scheme:/, q.id));
  });
});

test('matching each mission to its kind follows the engine', () => {
  const q = questions.find((x) => x.id === 'pr-match');
  const [right] = correctAnswers(q);
  assert.deepEqual(right, { 'new-horizons': 'Fly-by', juno: 'Orbiter', 'deep-impact': 'Impactor', philae: 'Lander' });
});

test('the km/h conversion states both constants, accepts 2% either side and shows the working', () => {
  const q = questions.find((x) => x.id === 'pr-escape-kmh');
  assert.match(q.prompt, /11\.2 km\/s/);
  assert.match(q.prompt, /3,600 seconds in an hour/);
  const v = q.answer.value;
  assert.ok(Math.abs(v - 40320) < 1e-6);
  assert.equal(q.check(String(v * 1.02)).correct, true);
  assert.equal(q.check(String(v * 0.98)).correct, true);
  assert.equal(q.check(String(v * 1.05)).correct, false);
  assert.match(q.check('0').message, /= 11\.2 × 3,600 = 40,320 km\/h/);
});

test('a rocket works by throwing exhaust backwards and carrying its own oxidiser, not by pushing on air', () => {
  const q = questions.find((x) => x.id === 'pr-rocket');
  const [right] = correctAnswers(q);
  assert.match(right.rocket, /own oxidiser/);
  assert.match(right.rocket, /exhaust out backwards/);
  assert.ok(q.fields[1].options.some((o) => /pushes against the air/.test(o)), 'the misconception is a wrong answer');
  const below = questions.find((x) => x.id === 'pr-below-escape');
  assert.match(below.check('x').message, /6,700 km, then falls back/);
});
