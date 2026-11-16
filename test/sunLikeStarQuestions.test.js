const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../src/sunLikeStar');
const { makeQuestions } = require('../src/sunLikeStarQuestions');
const { getSubtopic } = require('../src/curriculum');

const questions = makeQuestions(L);

function fieldCombos(fields) {
  return fields.reduce((combos, field) => combos.flatMap((combo) => field.options.map((option) => ({ ...combo, [field.key]: option }))), [{}]);
}

function correctAnswers(q) {
  if (q.fields) return fieldCombos(q.fields).filter((value) => q.check(value).correct);
  return q.options.filter((value) => q.check(value).correct);
}

test('unique ids, all tagged u4.14, with questions for each of 14.3, 14.4, 14.5 and 14.9, and none for 13.8', () => {
  assert.deepEqual(getSubtopic('u4.14').spec, ['14.3', '14.4', '14.5', '14.9']);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  questions.forEach((q) => assert.deepEqual(q.units, ['u4.14'], q.id));
  ['14.3', '14.4', '14.5', '14.9'].forEach((spec) => assert.ok(questions.filter((q) => q.spec === spec).length >= 2, spec));
  assert.equal(questions.filter((q) => q.spec === '13.8').length, 0);
});

test('every question has exactly one fully-correct answer and shows the mark scheme', () => {
  questions.forEach((q) => {
    assert.equal(correctAnswers(q).length, 1, q.id);
    if (q.fields) assert.equal(q.fields.length, q.marks, q.id);
    const samples = q.fields ? fieldCombos(q.fields).slice(0, 2) : q.options;
    samples.forEach((value) => assert.match(q.check(value).message, /Mark scheme:/, q.id));
  });
});

test('putting the stages in order, and what happens to the core at each stage', () => {
  const order = questions.find((q) => q.id === 'sl-order');
  assert.equal(correctAnswers(order)[0], 'Nebula → Protostar → Main sequence → Red giant → Planetary nebula → White dwarf → Black dwarf');
  assert.ok(order.options.some((o) => /Planetary nebula → Red giant/.test(o)), 'the spec-list order is offered as a wrong answer');
  const core = questions.find((q) => q.id === 'sl-core');
  const [right] = correctAnswers(core);
  assert.match(right.main, /Hydrogen fuses into helium/);
  assert.match(right.giant, /shrinks and heats up/);
  assert.match(right.dwarf, /No fusion/);
  assert.match(right.protostar, /not yet hot enough for fusion/);
});

test('the white dwarf is held up by electron pressure, not radiation pressure', () => {
  const q = questions.find((x) => x.id === 'sl-white-dwarf');
  assert.match(correctAnswers(q)[0], /^Electron pressure/);
  assert.ok(q.options.some((o) => /Radiation pressure/.test(o)));
});
