const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../src/blackHoleEvidence');
const M = require('../src/massiveStar');
const { makeQuestions } = require('../src/blackHoleEvidenceQuestions');
const { getSubtopic } = require('../src/curriculum');

const questions = makeQuestions(B, M);

function fieldCombos(fields) {
  return fields.reduce((combos, field) => combos.flatMap((combo) => field.options.map((option) => ({ ...combo, [field.key]: option }))), [{}]);
}

function correctAnswers(q) {
  if (q.fields) return fieldCombos(q.fields).filter((value) => q.check(value).correct);
  return q.options.filter((value) => q.check(value).correct);
}

test('unique ids, all tagged u4.16 and spec 14.11', () => {
  assert.deepEqual(getSubtopic('u4.16').spec, ['14.11']);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  questions.forEach((q) => {
    assert.deepEqual(q.units, ['u4.16'], q.id);
    assert.equal(q.spec, '14.11', q.id);
  });
});

test('every choice question has exactly one fully-correct answer and shows the mark scheme', () => {
  questions.filter((q) => q.type !== 'number').forEach((q) => {
    assert.equal(correctAnswers(q).length, 1, q.id);
    if (q.fields) assert.equal(q.fields.length, q.marks, q.id);
    const samples = q.fields ? fieldCombos(q.fields).slice(0, 2) : q.options;
    samples.forEach((value) => assert.match(q.check(value).message, /Mark scheme:/, q.id));
  });
});

test('asks how we can know a black hole is there if it gives out no light', () => {
  const q = questions.find((x) => x.id === 'bh-how-know');
  assert.match(q.prompt, /gives out no light/);
  assert.match(correctAnswers(q)[0], /effects on things nearby/);
  assert.match(q.check('x').message, /X-rays/);
  assert.match(q.check('x').message, /orbit a mass that gives out no light/);
});

test('the X-ray, mass, orbit, infrared and speed questions have the right answers', () => {
  const ans = (id) => correctAnswers(questions.find((q) => q.id === id))[0];
  assert.match(ans('bh-xray-why'), /heated to millions of degrees/);
  assert.match(ans('bh-too-heavy'), /too heavy to be a neutron star/);
  assert.deepEqual(ans('bh-orbits'), { orbit: 'The partner’s orbit is the smaller one', mass: 'So the partner is the heavier' });
  assert.match(ans('bh-infrared'), /infrared passes through/);
  assert.match(ans('bh-s2-fast'), /closest/);
  assert.match(ans('bh-supermassive'), /supermassive black hole/);
});

test('bh-cygnus tests the reasoning (above about 3 Sun masses must be a black hole), not recall of the name', () => {
  const q = questions.find((x) => x.id === 'bh-cygnus');
  assert.equal(q.marks, 2);
  assert.match(q.prompt, /at most about 3 times the Sun’s mass/);
  assert.deepEqual(correctAnswers(q)[0], { a: 'It must be a black hole: too heavy for a neutron star', b: 'It could be a neutron star: not too heavy for one' });
  q.fields.forEach((f) => f.options.forEach((o) => assert.doesNotMatch(o, /Cygnus/)));
  const msg = q.check({}).message;
  assert.match(msg, /about 20 is above about 3, the most a neutron star can have, so an unseen object that heavy must be a black hole/);
  assert.match(msg, /about 2 is below about 3, so it could be a neutron star/);
});

test('the mass calculation states its formula and values, accepts 2% either side and shows the working', () => {
  const q = questions.find((x) => x.id === 'bh-mass-calc');
  assert.match(q.prompt, /M = a³ ÷ T²/);
  assert.match(q.prompt, /a = 1,000 AU/);
  assert.match(q.prompt, /T = 16 years/);
  const exact = 3.90625;
  assert.equal(q.check(String(exact)).correct, true);
  assert.equal(q.check(String(exact * 1.0199)).correct, true);
  assert.equal(q.check(String(exact * 0.9801)).correct, true);
  assert.equal(q.check(String(exact * 1.021)).correct, false);
  assert.equal(q.check('4.5').correct, false);
  const msg = q.check('1').message;
  assert.match(msg, /1,000³ ÷ 16² = 1,000,000,000 ÷ 256/);
  assert.match(msg, /3,906,250 Sun masses/);
});
