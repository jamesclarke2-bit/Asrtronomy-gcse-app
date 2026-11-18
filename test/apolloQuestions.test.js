const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../src/apollo');
const { makeQuestions } = require('../src/apolloQuestions');

const questions = makeQuestions(A);
const q = (id) => questions.find((x) => x.id === id);

function combos(fields) {
  return fields.reduce((acc, f) => acc.flatMap((c) => f.options.map((o) => ({ ...c, [f.key]: o }))), [{}]);
}
const right = (x) => (x.fields ? combos(x.fields) : x.options).filter((v) => x.check(v).correct);

test('unique ids, all on u5.8 only, tagged 11.29 or 11.30, three or more per point', () => {
  assert.equal(new Set(questions.map((x) => x.id)).size, questions.length);
  questions.forEach((x) => {
    assert.deepEqual(x.units, ['u5.8'], x.id);
    assert.ok(['11.29', '11.30'].includes(x.spec), x.id);
    assert.ok(x.marks >= 1, x.id);
  });
  ['11.29', '11.30'].forEach((s) => assert.ok(questions.filter((x) => x.spec === s).length >= 3, s));
});

test('every all-choice question has exactly one right answer and shows the mark scheme', () => {
  questions.filter((x) => x.options || (x.fields && x.fields.every((f) => f.options))).forEach((x) => {
    assert.equal(right(x).length, 1, x.id);
    (x.fields ? combos(x.fields) : x.options).forEach((v) => assert.match(x.check(v).message, /Mark scheme:/, x.id));
  });
});

test('weighing a crew against a probe for a stated task: Neptune for 10 years is a probe; a repair is a crew', () => {
  const w = q('am-weigh-task');
  assert.match(w.prompt, /Neptune.*10 years/);
  assert.match(right(w)[0], /^A probe:.*radiation/);
  assert.match(w.check(right(w)[0]).message, /life support.*radiation.*risk/);
  assert.match(right(q('am-weigh-repair'))[0], /^A crew:/);
  assert.match(right(q('am-disadvantage'))[0], /life support/);
});

test("the three modules' jobs: one mark each", () => {
  const m = q('am-modules');
  assert.deepEqual(right(m), [{ land: 'Lunar Module', home: 'Command Module', engine: 'Service Module' }]);
  assert.match(m.check({ land: 'Lunar Module', home: 'Service Module', engine: 'Command Module' }).message, /^1 out of 3 marks/);
});

test('ordering the mission profile: one mark for the first two, two for all four', () => {
  const o = q('am-order');
  assert.deepEqual(right(o), [{ first: 'Earth orbit', second: 'Lunar orbit', third: 'Landing', fourth: 'Splashdown' }]);
  assert.match(o.check({ first: 'Earth orbit', second: 'Lunar orbit', third: 'Splashdown', fourth: 'Landing' }).message, /^1 out of 2 marks/);
  assert.match(o.check({ first: 'Lunar orbit', second: 'Earth orbit', third: 'Landing', fourth: 'Splashdown' }).message, /^0 out of 2 marks/);
});

test('Apollo programme features: Gagarin, Apollo 13, Saturn V stages', () => {
  assert.match(right(q('am-why-apollo'))[0], /Gagarin, in 1961/);
  assert.match(right(q('am-apollo-13'))[0], /oxygen tank exploded/);
  assert.match(right(q('am-saturn-v'))[0], /less mass/);
});

test('laser round trip: both data-sheet constants stated, 2% tolerance, full worked answer', () => {
  const l = q('am-laser');
  assert.match(l.prompt, /380,000 km.*3\.0 × 10⁸ m\/s/);
  assert.equal(l.answer, 2.53);
  assert.ok(l.check(2.53).correct && l.check(2.48).correct && l.check(2.58).correct);
  assert.ok(!l.check(1.27).correct, 'one way only is wrong');
  assert.ok(!l.check(2.45).correct);
  assert.match(l.check(2.53).message, /2 × 380,000 km = 7\.6 × 10⁸ m.*7\.6 × 10⁸ ÷ 3\.0 × 10⁸ ≈ 2\.53 s/);
});
