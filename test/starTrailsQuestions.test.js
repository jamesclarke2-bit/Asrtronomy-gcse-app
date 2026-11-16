const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../src/starTrails');
const { makeQuestions } = require('../src/starTrailsQuestions');
const { getSubtopic } = require('../src/curriculum');
const { getSpecPoint } = require('../src/specPoints');

const questions = makeQuestions(S);

function fieldCombos(fields) {
  return fields.reduce((combos, field) => combos.flatMap((combo) => field.options.map((option) => ({ ...combo, [field.key]: option }))), [{}]);
}

function correctAnswers(q) {
  if (q.fields) return fieldCombos(q.fields).filter((value) => q.check(value).correct);
  return q.options.filter((value) => q.check(value).correct);
}

test('at least 10 questions, unique ids, all tagged u2.34 and 13.19', () => {
  assert.ok(questions.length >= 10);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  assert.ok(getSubtopic('u2.34'));
  assert.ok(getSpecPoint('13.19'));
  questions.forEach((q) => {
    assert.deepEqual(q.units, ['u2.34'], q.id);
    assert.equal(q.spec, '13.19', q.id);
    assert.ok(Number.isInteger(q.marks) && q.marks > 0, q.id);
  });
});

test('the calculations give every value they need, accept 2% either side and show the full working', () => {
  for (const id of ['st-calc-minutes', 'st-calc-hours']) {
    const q = questions.find((x) => x.id === id);
    assert.match(q.prompt, /sidereal day = \(360 ÷ θ\) × t/, id);
    const v = q.answer.value;
    assert.equal(q.check(String(v)).correct, true, id);
    assert.equal(q.check(String(v * 1.02)).correct, true, `${id} +2%`);
    assert.equal(q.check(String(v * 0.98)).correct, true, `${id} -2%`);
    assert.equal(q.check(String(v * 1.05)).correct, false, `${id} +5%`);
    assert.match(q.check('0').message, /Mark scheme: sidereal day = \(360 ÷ θ\) × t = \(360 ÷ /, id);
  }
  assert.ok(Math.abs(questions.find((x) => x.id === 'st-calc-minutes').answer.value - 1435.2) < 0.1);
  assert.ok(Math.abs(questions.find((x) => x.id === 'st-calc-hours').answer.value - 23.92) < 0.005);
});

test('why a longer exposure is better: a bigger angle, so a smaller percentage uncertainty, never "repeating makes it more accurate"', () => {
  const q = questions.find((x) => x.id === 'st-longer-exposure');
  const [right] = correctAnswers(q);
  assert.match(right.arcs, /bigger angle/);
  assert.match(right.why, /percentage uncertainty is smaller/);
  assert.ok(q.fields[1].options.some((o) => /Repeating/.test(o)), 'the repeats misconception is offered as a wrong answer');
  assert.ok(!/Repeating/.test(right.why));
  const repeats = questions.find((x) => x.id === 'st-repeats');
  assert.match(correctAnswers(repeats)[0], /spread.*anomalies.*mean/);
  assert.match(repeats.check('x').message, /do not make the method itself more accurate/);
});

test('the anomaly question picks the outlier, and the half-range question leaves it out', () => {
  const a = questions.find((x) => x.id === 'st-anomaly');
  assert.deepEqual(correctAnswers(a), ['Student 4 (34.0°)']);
  const h = questions.find((x) => x.id === 'st-half-range');
  assert.equal(h.answer.value, 0.5);
  assert.equal(h.check('0.5').correct, true);
  assert.equal(h.check('2.25').correct, false, 'including the anomaly is wrong');
  assert.equal(h.check('1').correct, false, 'the whole range is not the uncertainty');
});

test('why the result is not exactly 24 hours: the Earth moves along its orbit, so the solar day is a little longer', () => {
  const q = questions.find((x) => x.id === 'st-not-24');
  assert.match(q.prompt, /23 h 56 min/);
  const [right] = correctAnswers(q);
  assert.match(right.doing, /orbit/);
  assert.match(right.means, /turn a little further to face the Sun/);
  assert.match(q.check({}).message, /24 h 0 min\) is about 4 minutes longer/);
});

test('every choice or multi-field question has exactly one fully-correct answer; every answer shows the mark scheme', () => {
  questions.forEach((q) => {
    if (q.type !== 'number') {
      assert.equal(correctAnswers(q).length, 1, q.id);
      if (q.fields) assert.equal(q.fields.length, q.marks, q.id);
    }
    const samples = q.type === 'number' ? ['1', 'abc'] : q.fields ? fieldCombos(q.fields).slice(0, 2) : q.options;
    samples.forEach((value) => assert.match(q.check(value).message, /Mark scheme:/, q.id));
  });
  assert.equal(questions.reduce((sum, q) => sum + q.marks, 0), 17);
});

test('why a 240-minute result cannot tell the sidereal and solar days apart, and the longer measurement that can: meridian timing over 30 nights', () => {
  const q = questions.find((x) => x.id === 'st-cant-separate');
  assert.match(q.prompt, /1,442 ± 12 min/);
  assert.match(q.prompt, /1,436 min and the solar day is 1,440 min/);
  const [right] = correctAnswers(q);
  assert.match(right.why, /includes both days/);
  assert.match(right.fix, /crosses the meridian for 30 nights/);
  assert.ok(q.fields[1].options.some((o) => /^A whole-night star trail/.test(o)), 'the whole-night trail is a wrong answer');
  assert.ok(q.fields[1].options.some((o) => /^Repeating/.test(o)), 'repeats are a wrong answer');
  const scheme = q.check({}).message;
  assert.match(scheme, /1,430 to 1,454 min, holds both 1,436 and 1,440 min/);
  assert.match(scheme, /about 4 min earlier each night, so about 120 min \(2 hours\) earlier in all/);
  assert.match(scheme, /120 ± 2 min/);
  assert.match(scheme, /1,432 to 1,440 min, only just reaches the gap/);
});
