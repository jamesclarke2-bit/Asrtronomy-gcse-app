const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../src/localGroup');
const { makeQuestions } = require('../src/localGroupQuestions');
const { getSubtopic } = require('../src/curriculum');

const questions = makeQuestions(L);

function fieldCombos(fields) {
  return fields.reduce((combos, field) => combos.flatMap((combo) => field.options.map((option) => ({ ...combo, [field.key]: option }))), [{}]);
}

function correctAnswers(q) {
  if (q.fields) return fieldCombos(q.fields).filter((value) => q.check(value).correct);
  return q.options.filter((value) => q.check(value).correct);
}

const ans = (id) => correctAnswers(questions.find((q) => q.id === id))[0];

test('unique ids, all tagged u6.5, with questions for 15.4, 15.5 and 15.13', () => {
  assert.deepEqual(getSubtopic('u6.5').spec, ['15.4', '15.5', '15.13']);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  questions.forEach((q) => assert.deepEqual(q.units, ['u6.5'], q.id));
  ['15.4', '15.5', '15.13'].forEach((spec) => assert.ok(questions.filter((q) => q.spec === spec).length >= 2, spec));
});

test('every choice question has exactly one fully-correct answer and shows the mark scheme', () => {
  questions.filter((q) => q.type !== 'number').forEach((q) => {
    assert.equal(correctAnswers(q).length, 1, q.id);
    if (q.fields) assert.equal(q.fields.length, q.marks, q.id);
    const samples = q.fields ? fieldCombos(q.fields).slice(0, 2) : q.options;
    samples.forEach((value) => assert.match(q.check(value).message, /Mark scheme:/, q.id));
  });
});

test('the Local Group, its members, and why galaxies are grouped', () => {
  assert.match(ans('lg-what'), /held together by their gravity/);
  assert.match(ans('lg-what'), /^A group of more than 50 galaxies/);
  assert.match(questions.find((q) => q.id === 'lg-what').check('x').message, /more than 50 galaxies \(about 80 known\), most of them dwarfs/);
  assert.doesNotMatch(JSON.stringify(questions.map((q) => [q.prompt, q.options, q.check({}).message])), /about 50 galaxies/);
  assert.equal(ans('lg-held'), 'Their gravity');
  assert.equal(ans('lg-largest'), 'The Andromeda Galaxy (M31)');
  assert.equal(ans('lg-satellites'), 'The Large and Small Magellanic Clouds');
  assert.deepEqual(ans('lg-types'), { a: 'Spiral', b: 'Spiral', c: 'Irregular' });
  assert.equal(ans('lg-m31-distance'), 'About 2.5 million light-years');
  assert.match(ans('lg-why-clusters'), /^Gravity pulls galaxies towards each other/);
  assert.deepEqual(ans('lg-ladder'), { a: '3rd', b: '1st (smallest)', c: '4th', d: '2nd' });
  assert.match(ans('lg-voids'), /filaments.*voids/);
});

test('the light-year conversion states its constant, accepts 2% either side and shows the working', () => {
  const q = questions.find((x) => x.id === 'lg-lmc-ly');
  assert.match(q.prompt, /50,000 pc/);
  assert.match(q.prompt, /1 pc = 3\.26 light-years/);
  assert.equal(q.check('163000').correct, true);
  assert.equal(q.check('163,000').correct, true);
  assert.equal(q.check(String(163000 * 1.0199)).correct, true);
  assert.equal(q.check(String(163000 * 0.9801)).correct, true);
  assert.equal(q.check(String(163000 * 1.021)).correct, false);
  assert.equal(q.check('15337').correct, false, 'dividing instead of multiplying');
  assert.match(q.check('1').message, /distance = 50,000 × 3\.26.*= 163,000 light-years/);
});
