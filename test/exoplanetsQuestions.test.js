const test = require('node:test');
const assert = require('node:assert/strict');
const X = require('../src/exoplanets');
const { makeQuestions } = require('../src/exoplanetsQuestions');
const { getSubtopic } = require('../src/curriculum');

const questions = makeQuestions(X);
const q = (id) => questions.find((x) => x.id === id);
const SPEC = ['12.4', '12.6', '12.7', '12.8'];

function combos(fields) {
  return fields.reduce((acc, f) => acc.flatMap((c) => f.options.map((o) => ({ ...c, [f.key]: o }))), [{}]);
}
const right = (x) => (x.fields ? combos(x.fields) : x.options).filter((v) => x.check(v).correct);

test('unique ids, all on u3.33, at least two questions per spec point', () => {
  assert.deepEqual(getSubtopic('u3.33').spec, SPEC);
  assert.equal(new Set(questions.map((x) => x.id)).size, questions.length);
  questions.forEach((x) => {
    assert.deepEqual(x.units, ['u3.33'], x.id);
    assert.ok(SPEC.includes(x.spec), x.id);
    assert.ok(x.marks >= 1, x.id);
  });
  SPEC.forEach((s) => assert.ok(questions.filter((x) => x.spec === s).length >= 2, s));
});

test('every choice question has exactly one fully right answer and shows the mark scheme', () => {
  questions.filter((x) => x.options || (x.fields && x.fields.every((f) => f.options))).forEach((x) => {
    assert.equal(right(x).length, 1, x.id);
    (x.fields ? combos(x.fields) : x.options).forEach((v) => assert.match(x.check(v).message, /Mark scheme:/, x.id));
  });
});

test('identifying the method from the clue', () => {
  assert.equal(right(q('ex-method-dip'))[0], 'Transit');
  assert.equal(right(q('ex-method-lines'))[0], 'Radial velocity');
  assert.equal(right(q('ex-method-wobble'))[0], 'Astrometry');
  assert.equal(right(q('ex-zone-hotter'))[0], 'Further from the star');
  assert.equal(right(q('ex-zone-picture'))[0], 'The planet at 1 AU');
  assert.equal(X.zoneVerdict(1, X.SUN_T), 'in the zone');
  ['ex-transit-read', 'ex-zone-picture'].forEach((id) => assert.equal(typeof q(id).render, 'function', id));
});

test('numeric questions: stated values, tolerances of at least 2%, and worked answers', () => {
  const t = q('ex-transit-read');
  assert.deepEqual(t.answer, { lowest: 99, dip: 1 });
  assert.ok(t.check({ lowest: 99, dip: 1 }).correct);
  assert.ok(t.check({ lowest: 99.05, dip: 0.95 }).correct);
  assert.match(t.check({ lowest: 99, dip: 2 }).message, /^1 out of 2 marks.*100 − 99\.0 = 1\.0%/);
  const d = q('ex-drake-calc');
  assert.match(d.prompt, /R\* = 2.*fp = 0\.5.*ne = 1.*fl = 0\.1.*fi = 0\.1.*fc = 0\.1.*L = 10,000/);
  assert.equal(d.answer, 10);
  assert.ok(d.check(10).correct && d.check(10.2).correct && !d.check(11).correct);
  assert.match(d.check(10).message, /N = 10 \(1\)/);
  const s = q('ex-seti-delay');
  assert.match(s.prompt, /one light-year in one year/);
  assert.equal(s.answer, 100);
  assert.ok(s.check(100).correct && s.check(98).correct && !s.check(50).correct);
  assert.match(s.check(100).message, /50 years there \+ 50 years back = 100 years/);
});
