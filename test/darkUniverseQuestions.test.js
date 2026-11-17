const test = require('node:test');
const assert = require('node:assert/strict');
const U = require('../src/darkUniverse');
const { makeQuestions } = require('../src/darkUniverseQuestions');
const { getSubtopic } = require('../src/curriculum');

const questions = makeQuestions(U);
const q = (id) => questions.find((x) => x.id === id);

function combos(fields) {
  return fields.reduce((acc, f) => acc.flatMap((c) => f.options.map((o) => ({ ...c, [f.key]: o }))), [{}]);
}
const right = (x) => (x.fields ? combos(x.fields) : x.options).filter((v) => x.check(v).correct);

test('unique ids, all on u6.4, at least one per spec point 16.10, 16.11 and 16.12', () => {
  assert.deepEqual(getSubtopic('u6.4').spec, ['16.10', '16.11', '16.12']);
  assert.equal(new Set(questions.map((x) => x.id)).size, questions.length);
  questions.forEach((x) => {
    assert.deepEqual(x.units, ['u6.4'], x.id);
    assert.ok(['16.10', '16.11', '16.12'].includes(x.spec), x.id);
    assert.ok(x.marks >= 1, x.id);
  });
  for (const s of ['16.10', '16.11', '16.12']) assert.ok(questions.some((x) => x.spec === s), s);
});

test('every choice question has exactly one fully right answer and shows the mark scheme', () => {
  questions.filter((x) => x.options || (x.fields && x.fields.every((f) => f.options))).forEach((x) => {
    assert.equal(right(x).length, 1, x.id);
    (x.fields ? combos(x.fields).slice(0, 3) : x.options).forEach((v) => assert.match(x.check(v).message, /Mark scheme:/, x.id));
  });
});

test('the rotation-curve reading has a drawn graph, a ±10 km/s tolerance and partial marks', () => {
  const x = q('du-read-curve');
  assert.equal(typeof x.render, 'function');
  assert.equal(x.spec, '16.10');
  assert.deepEqual(x.answer, { measured: 220, visible: 150 });
  assert.ok(x.check({ measured: 220, visible: 150 }).correct);
  assert.ok(x.check({ measured: 212, visible: 142 }).correct, 'within 10 km/s');
  const half = x.check({ measured: 220, visible: 220 });
  assert.ok(!half.correct);
  assert.match(half.message, /^1 out of 2 marks/);
  assert.match(half.message, /Mark scheme:.*solid line.*dashed line/);
  assert.ok(!x.check({ measured: 235, visible: 150 }).correct);
});

test('the right answers say what the spec asks', () => {
  assert.match(right(q('du-flat-means'))[0], /far more mass than we can see/);
  assert.match(right(q('du-nature'))[0], /Unknown particles/);
  assert.match(right(q('du-supernovae'))[0], /speeding up/);
  assert.equal(right(q('du-biggest-share'))[0], 'Dark energy');
  assert.match(right(q('du-hard-to-detect'))[0], /give out and absorb no light/);
  assert.match(right(q('du-searches'))[0], /Nothing yet/);
  assert.match(right(q('du-lots-of-matter'))[0], /collapses/);
  assert.match(right(q('du-favoured'))[0], /faster and faster/);
  const m = right(q('du-match-futures'))[0];
  assert.match(m.lots, /Big Crunch/);
  assert.match(m.dark, /Speeding up/);
});
