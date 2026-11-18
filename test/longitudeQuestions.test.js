const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../src/longitude');
const { makeQuestions } = require('../src/longitudeQuestions');
const { getSubtopic } = require('../src/curriculum');

const questions = makeQuestions(L);
const q = (id) => questions.find((x) => x.id === id);

function combos(fields) {
  return fields.reduce((acc, f) => acc.flatMap((c) => f.options.map((o) => ({ ...c, [f.key]: o }))), [{}]);
}
const right = (x) => (x.fields ? combos(x.fields) : x.options).filter((v) => x.check(v).correct);

test('unique ids, all on u2.35, tagged 4.20 or 4.21, both asked', () => {
  assert.deepEqual(getSubtopic('u2.35').spec, ['4.20', '4.21']);
  assert.equal(new Set(questions.map((x) => x.id)).size, questions.length);
  questions.forEach((x) => {
    assert.deepEqual(x.units, ['u2.35'], x.id);
    assert.ok(['4.20', '4.21'].includes(x.spec), x.id);
    assert.ok(x.marks >= 1, x.id);
  });
  ['4.20', '4.21'].forEach((s) => assert.ok(questions.filter((x) => x.spec === s).length >= 3, s));
});

test('every all-choice question has exactly one right answer and shows the mark scheme', () => {
  questions.filter((x) => x.options || (x.fields && x.fields.every((f) => f.options))).forEach((x) => {
    assert.equal(right(x).length, 1, x.id);
    (x.fields ? combos(x.fields) : x.options).forEach((v) => assert.match(x.check(v).message, /Mark scheme:/, x.id));
  });
});

test('longitude calculations: west and east stated, 15° an hour given, worked answer, partial marks', () => {
  const w = q('lg-calc-west');
  assert.match(w.prompt, /15:20/);
  assert.match(w.prompt, /15° every hour/);
  assert.deepEqual(w.answer, { degrees: 50, direction: 'West' });
  assert.ok(w.check({ degrees: 50, direction: 'West' }).correct);
  assert.ok(w.check({ degrees: 49.2, direction: 'West' }).correct, 'within 2%');
  const half = w.check({ degrees: 50, direction: 'East' });
  assert.ok(!half.correct);
  assert.match(half.message, /^2 out of 3 marks.*200 minutes.*200 ÷ 4 = 50°.*later than local noon, so west: 50° W/);
  const e = q('lg-calc-east');
  assert.deepEqual(e.answer, { degrees: 51, direction: 'East' });
  assert.match(e.check(e.answer).message, /earlier than local noon, so east: 51° E/);
});

test('lunar distance: why tables are needed, reading the table, and the size of an angle error', () => {
  assert.match(right(q('lg-why-tables'))[0], /worked out in advance/);
  const r = q('lg-lunar-read');
  assert.equal(typeof r.render, 'function');
  assert.match(r.prompt, /37\.5°.*00:00: 40°, 03:00: 38\.5°, 06:00: 37°, 09:00: 35\.5°.*0\.5° an hour/);
  assert.equal(r.answer, 5);
  assert.ok(r.check(5).correct && !r.check(6).correct);
  assert.match(r.check(5).message, /05:00 Greenwich time/);
  assert.equal(right(q('lg-angle-error'))[0], 'Half a degree');
});

test('why an accurate clock solved it, and a clock drift worked out', () => {
  assert.match(right(q('lg-why-clock'))[0], /carries Greenwich time/);
  const d = q('lg-drift');
  assert.equal(d.answer, 1);
  assert.ok(d.check(1).correct && !d.check(4).correct);
  assert.match(d.check(1).message, /240 s = 4 minutes.*4 ÷ 4 = 1° out/);
  assert.deepEqual(right(q('lg-match-methods'))[0], { a: 'Lunar distance', b: 'Marine chronometer' });
});
