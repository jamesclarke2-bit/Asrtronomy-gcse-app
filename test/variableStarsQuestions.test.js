const test = require('node:test');
const assert = require('node:assert/strict');
const V = require('../src/variableStars');
const { makeQuestions } = require('../src/variableStarsQuestions');
const { getSubtopic } = require('../src/curriculum');
const { getSpecPoint } = require('../src/specPoints');

const questions = makeQuestions(V);
const TAGS = ['13.14a', '13.14b', '13.14c', '13.14d', '13.16'];

function fieldCombos(fields) {
  return fields.reduce((combos, field) => combos.flatMap((combo) => field.options.map((option) => ({ ...combo, [field.key]: option }))), [{}]);
}

function correctAnswers(q) {
  if (q.fields) return fieldCombos(q.fields).filter((value) => q.check(value).correct);
  return q.options.filter((value) => q.check(value).correct);
}

test('at least 10 questions, unique ids, tagged u4.11 and a 13.14 sub-part or 13.16, every tag used', () => {
  assert.ok(questions.length >= 10);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  assert.ok(getSubtopic('u4.11'));
  questions.forEach((q) => {
    assert.deepEqual(q.units, ['u4.11'], q.id);
    assert.ok(TAGS.includes(q.spec), q.id);
    assert.ok(getSpecPoint(q.spec), q.spec);
    assert.ok(Number.isInteger(q.marks) && q.marks > 0, q.id);
  });
  TAGS.forEach((tag) => assert.ok(questions.some((q) => q.spec === tag), tag));
});

test('every choice or multi-field question has exactly one fully-correct answer, one field per mark', () => {
  questions.filter((q) => q.type !== 'number').forEach((q) => {
    assert.equal(correctAnswers(q).length, 1, q.id);
    if (q.fields) assert.equal(q.fields.length, q.marks, q.id);
  });
});

test('every answer, right or wrong, shows the mark scheme', () => {
  questions.forEach((q) => {
    const samples = q.type === 'number' ? ['1', '100', 'abc'] : q.fields ? fieldCombos(q.fields).slice(0, 3) : q.options;
    samples.forEach((value) => assert.match(q.check(value).message, /Mark scheme:/, q.id));
  });
});

test('reading a period off a drawn light curve: the right period, within at least 2%, never the time for one wrong cycle count', () => {
  const reads = questions.filter((q) => q.type === 'number' && q.render && q.unitLabel === 'days');
  assert.ok(reads.length >= 1);
  reads.forEach((q) => {
    const { period, tolerance } = q.answer;
    assert.ok(tolerance >= 0.02 * period, q.id);
    assert.equal(q.check(String(period)).correct, true, q.id);
    assert.equal(q.check(String(period * 1.02)).correct, true, `${q.id} +2%`);
    assert.equal(q.check(String(period * 2)).correct, false, `${q.id} two cycles`);
    assert.equal(q.check(String(period / 2)).correct, false, `${q.id} half a cycle`);
  });
});

test('at least two Cepheid distances need M read off a drawn period-luminosity graph', () => {
  const dist = questions.filter((q) => q.spec === '13.16' && q.type === 'number' && typeof q.render === 'function');
  assert.ok(dist.length >= 2);
  dist.forEach((q) => {
    assert.ok(!q.prompt.includes(V.signed(q.answer.M)), `${q.id} gives M away`);
    assert.match(q.prompt, /M = m \+ 5 − 5 log d/);
    assert.equal(q.check(String(q.answer.distancePc)).correct, true, q.id);
    assert.equal(q.check(String(q.answer.lowPc)).correct, true, `${q.id} low`);
    assert.equal(q.check(String(q.answer.highPc)).correct, true, `${q.id} high`);
    assert.equal(q.check(String(q.answer.distancePc * Math.pow(10, 0.2))).correct, false, `${q.id} a magnitude out`);
  });
  const q20 = questions.find((q) => q.id === 'cepheid-distance-20');
  assert.equal(q20.answer.M, -4.8);
  assert.ok(Math.abs(q20.answer.distancePc - 50119) < 1);
  const q3 = questions.find((q) => q.id === 'cepheid-distance-3');
  assert.equal(q3.answer.M, -2.8);
  assert.ok(Math.abs(q3.answer.distancePc - 2512) < 1);
});

test('total marks', () => {
  assert.equal(questions.reduce((sum, q) => sum + q.marks, 0), 23);
});
