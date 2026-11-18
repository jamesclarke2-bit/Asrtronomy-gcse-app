const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/gravityBodies');
const { makeQuestions } = require('../src/gravityBodiesQuestions');
const { getSubtopic } = require('../src/curriculum');

const questions = makeQuestions(G);
const q = (id) => questions.find((x) => x.id === id);
const SPEC = ['12.1a', '12.1c', '12.2a', '12.2b', '12.2c'];

function combos(fields) {
  return fields.reduce((acc, f) => acc.flatMap((c) => f.options.map((o) => ({ ...c, [f.key]: o }))), [{}]);
}
const right = (x) => (x.fields ? combos(x.fields) : x.options).filter((v) => x.check(v).correct);

test('unique ids, all on u3.32, at least one question per spec point', () => {
  assert.deepEqual(getSubtopic('u3.32').spec, SPEC);
  assert.equal(getSubtopic('u3.32').depth, 'be able to');
  assert.equal(new Set(questions.map((x) => x.id)).size, questions.length);
  questions.forEach((x) => {
    assert.deepEqual(x.units, ['u3.32'], x.id);
    assert.ok(SPEC.includes(x.spec), x.id);
    assert.ok(x.marks >= 1, x.id);
  });
  SPEC.forEach((s) => assert.ok(questions.filter((x) => x.spec === s).length >= 2, `${s} has at least two questions`));
});

test('every choice question has exactly one fully right answer and shows the mark scheme', () => {
  questions.filter((x) => x.options || x.fields).forEach((x) => {
    assert.equal(right(x).length, 1, x.id);
    (x.fields ? combos(x.fields).slice(0, 3) : x.options).forEach((v) => assert.match(x.check(v).message, /Mark scheme:/, x.id));
  });
});

test('identification questions: picture questions draw, and the right answers name the effect', () => {
  ['gb-lagrange-picture', 'gb-roche-picture', 'gb-shape-pick'].forEach((id) => assert.equal(typeof q(id).render, 'function', id));
  assert.equal(right(q('gb-eclipse-predict'))[0], 'Regular, predictable motion');
  assert.equal(right(q('gb-resonance-identify'))[0], 'A resonance');
  assert.equal(right(q('gb-roche-picture'))[0], 'The Roche limit');
  assert.match(right(q('gb-lagrange-picture'))[0], /Lagrange point \(L2\)/);
  assert.match(right(q('gb-roche-inside'))[0], /pulled apart/);
  assert.equal(right(q('gb-lightest-lost'))[0], 'Hydrogen');
  const m = right(q('gb-match-effects'))[0];
  assert.deepEqual(m, { trojans: 'A Lagrange point', titan: 'Gravity holding an atmosphere', vesta: 'Gravity pulling a body round' });
  assert.match(q('gb-match-effects').check({ trojans: 'A Lagrange point', titan: 'A resonance', vesta: 'A resonance' }).message, /^1 out of 3 marks/);
});

test('the numeric resonance question states its ratio and accepts 2% either side of 12', () => {
  const x = q('gb-resonance-count');
  assert.match(x.prompt, /1 : 2 : 4/);
  assert.ok(x.check(12).correct && x.check(11.8).correct && x.check(12.2).correct);
  assert.ok(!x.check(11).correct && !x.check(13).correct);
  assert.match(x.check(12).message, /3 × 4 = 12/);
});
