const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../src/activeGalaxies');
const { makeQuestions } = require('../src/activeGalaxiesQuestions');
const { getSubtopic } = require('../src/curriculum');

const questions = makeQuestions(A);

function fieldCombos(fields) {
  return fields.reduce((combos, field) => combos.flatMap((combo) => field.options.map((option) => ({ ...combo, [field.key]: option }))), [{}]);
}

function correctAnswers(q) {
  if (q.fields) return fieldCombos(q.fields).filter((value) => q.check(value).correct);
  return q.options.filter((value) => q.check(value).correct);
}

const ans = (id) => correctAnswers(questions.find((q) => q.id === id))[0];

test('unique ids, all tagged u6.7, with a question for each of 15.9-15.12', () => {
  assert.deepEqual(getSubtopic('u6.7').spec, ['15.9', '15.10', '15.11', '15.12']);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  questions.forEach((q) => assert.deepEqual(q.units, ['u6.7'], q.id));
  ['15.9', '15.10', '15.11', '15.12'].forEach((spec) => assert.ok(questions.some((q) => q.spec === spec), spec));
});

test('every question has exactly one fully-correct answer and shows the mark scheme', () => {
  questions.forEach((q) => {
    assert.equal(correctAnswers(q).length, 1, q.id);
    if (q.fields) assert.equal(q.fields.length, q.marks, q.id);
    const samples = q.fields ? fieldCombos(q.fields).slice(0, 2) : q.options;
    samples.forEach((value) => assert.match(q.check(value).message, /Mark scheme:/, q.id));
  });
});

test('asks what powers an AGN', () => {
  const q = questions.find((x) => x.id === 'ag-power');
  assert.match(q.prompt, /What powers an Active Galactic Nucleus/);
  assert.match(ans('ag-power'), /^Matter falling onto a supermassive black hole/);
});

test('a matching question on the three types', () => {
  const q = questions.find((x) => x.id === 'ag-match');
  assert.equal(q.marks, 3);
  assert.deepEqual(q.fields.map((f) => f.label), ['(a) Seyfert galaxy', '(b) Quasar', '(c) Blazar']);
  const a = ans('ag-match');
  assert.match(a.seyfert, /spiral galaxy/);
  assert.match(a.quasar, /Looks like a star/);
  assert.match(a.blazar, /jet points almost straight at us/);
});

test('the parts on the drawing, the bands, and why many bands are needed', () => {
  assert.equal(typeof questions.find((x) => x.id === 'ag-parts').render, 'function');
  assert.deepEqual(ans('ag-parts'), { A: 'Supermassive black hole', B: 'Accretion disc', C: 'Dusty ring (torus)', D: 'Jet' });
  assert.deepEqual(ans('ag-bands'), { radio: 'The jets and the lobes at their ends', ir: 'The warm dusty ring', xray: 'The hottest gas, close to the black hole' });
  assert.match(ans('ag-why-many'), /different part of the AGN/);
  assert.match(ans('ag-beyond'), /beyond visible light/);
});
