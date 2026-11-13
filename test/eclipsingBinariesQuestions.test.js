const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../src/eclipsingBinaries');
const { makeQuestions } = require('../src/eclipsingBinariesQuestions');
const { getSubtopic } = require('../src/curriculum');
const { getSpecPoint } = require('../src/specPoints');

const questions = makeQuestions(E);

function fieldCombos(fields) {
  return fields.reduce((combos, field) => combos.flatMap((combo) => field.options.map((option) => ({ ...combo, [field.key]: option }))), [{}]);
}

function correctAnswers(q) {
  if (q.fields) return fieldCombos(q.fields).filter((value) => q.check(value).correct);
  return q.options.filter((value) => q.check(value).correct);
}

test('at least 10 questions, unique ids, tagged u4.12 and 13.15 or 13.18', () => {
  assert.ok(questions.length >= 10);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  assert.ok(getSubtopic('u4.12'));
  questions.forEach((q) => {
    assert.deepEqual(q.units, ['u4.12'], q.id);
    assert.ok(['13.15', '13.18'].includes(q.spec), q.id);
    assert.ok(getSpecPoint(q.spec), q.spec);
    assert.ok(Number.isInteger(q.marks) && q.marks > 0, q.id);
  });
  ['13.15', '13.18'].forEach((tag) => assert.ok(questions.filter((q) => q.spec === tag).length >= 3, tag));
});

test('the required questions are all there', () => {
  ['deep-dip-hidden-star', 'most-binaries-no-eclipse', 'flat-bottomed-dip', 'read-period', 'read-period-trap'].forEach((id) => assert.ok(questions.find((q) => q.id === id), id));
  const deep = questions.find((q) => q.id === 'deep-dip-hidden-star');
  assert.deepEqual(correctAnswers(deep)[0].which, 'The hotter star');
});

test('every choice or multi-field question has exactly one fully-correct answer, one field per mark', () => {
  questions.filter((q) => q.type !== 'number').forEach((q) => {
    assert.equal(correctAnswers(q).length, 1, q.id);
    if (q.fields) assert.equal(q.fields.length, q.marks, q.id);
  });
});

test('every answer, right or wrong, shows the mark scheme', () => {
  questions.forEach((q) => {
    const samples = q.type === 'number' ? ['1', '3.6', 'abc'] : q.fields ? fieldCombos(q.fields).slice(0, 3) : q.options;
    samples.forEach((value) => assert.match(q.check(value).message, /Mark scheme:/, q.id));
  });
});

test('two periods read off drawn light curves, at least 2% tolerance; the trap answer (deep dip to shallow dip) is wrong', () => {
  ['read-period', 'read-period-trap'].forEach((id) => {
    const q = questions.find((x) => x.id === id);
    assert.equal(typeof q.render, 'function', id);
    const { period, tolerance, half } = q.answer;
    assert.ok(tolerance >= 0.02 * period, id);
    assert.equal(q.check(String(period)).correct, true, id);
    assert.equal(q.check(String(period * 1.02)).correct, true, `${id} +2%`);
    assert.equal(q.check(String(half)).correct, false, `${id}: half the period is wrong`);
  });
  const trap = questions.find((x) => x.id === 'read-period-trap');
  assert.match(trap.check('2.5').message, /only half the period/);
});

test('the uncertainty question: half the range of the period', () => {
  const q = questions.find((x) => x.id === 'period-uncertainty');
  assert.equal(q.check(String(q.answer.uncertaintyDays)).correct, true);
  assert.equal(q.check('0.25').correct, false, 'the whole range is not the uncertainty');
  assert.equal(q.check('0.5').correct, false, 'the span uncertainty is not the period uncertainty');
});

test('total marks', () => {
  assert.equal(questions.reduce((sum, q) => sum + q.marks, 0), 16);
});
