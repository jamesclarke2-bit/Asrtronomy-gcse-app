const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('../src/hubbleLaw');
const { makeQuestions } = require('../src/hubbleLawQuestions');
const { getSubtopic } = require('../src/curriculum');

const questions = makeQuestions(H);
const q = (id) => questions.find((x) => x.id === id);
const right = (id) => q(id).options.filter((o) => q(id).check(o).correct);

test('unique ids, all on u6.2, tagged 16.4-16.6, with every spec point asked', () => {
  assert.deepEqual(getSubtopic('u6.2').spec, ['16.4', '16.5', '16.6']);
  assert.equal(new Set(questions.map((x) => x.id)).size, questions.length);
  questions.forEach((x) => {
    assert.deepEqual(x.units, ['u6.2'], x.id);
    assert.ok(['16.4', '16.5', '16.6'].includes(x.spec), x.id);
  });
  for (const spec of ['16.4', '16.5', '16.6']) assert.ok(questions.some((x) => x.spec === spec), spec);
});

test('every choice question has exactly one right answer and shows the mark scheme', () => {
  questions.filter((x) => x.type === 'choice').forEach((x) => {
    assert.equal(right(x.id).length, 1, x.id);
    x.options.forEach((o) => assert.match(x.check(o).message, /Mark scheme:/, x.id));
  });
  assert.match(right('hb-evidence')[0], /Cepheid.*redshift/);
  assert.match(right('hb-graph')[0], /straight line through the origin/);
  assert.match(right('hb-wider')[0], /wider range of distances/);
  assert.match(right('hb-size')[0], /c × age/);
  assert.match(right('hb-estimate')[0], /same rate/);
});

function numericWithin2(x, target) {
  assert.ok(x.check(target).correct, `${x.id} exact`);
  assert.ok(x.check(target * 1.02).correct && x.check(target * 0.98).correct, `${x.id} 2%`);
  assert.ok(!x.check(target * 1.03).correct && !x.check(target * 0.97).correct, `${x.id} not 3%`);
}

test('hb-find-v and hb-find-d: H0 stated from the data sheet, 2% tolerance, full working', () => {
  const v = q('hb-find-v');
  assert.match(v.prompt, /H₀ = 68 km\/s per Mpc/);
  assert.equal(v.answer.value, 8160);
  numericWithin2(v, 8160);
  assert.match(v.check(0).message, /68 × 120.*8,160 km\/s/);
  const d = q('hb-find-d');
  assert.match(d.prompt, /H₀ = 68 km\/s per Mpc/);
  assert.equal(d.answer.value, 150);
  numericWithin2(d, 150);
  assert.match(d.check(0).message, /divide both sides by H₀: d = v ÷ H₀ = 10,200 ÷ 68.*150 Mpc/);
});

test('hb-gradient: read from a drawn graph, gradient = rise ÷ run', () => {
  const x = q('hb-gradient');
  assert.equal(typeof x.render, 'function');
  assert.equal(x.answer.value, 70);
  numericWithin2(x, 70);
  assert.match(x.check(0).message, /rise ÷ run = 10,500 km\/s ÷ 150 Mpc/);
});

test('hb-uncertainty: half the range, then a percentage', () => {
  const x = q('hb-uncertainty');
  assert.equal(x.marks, 2);
  assert.equal(x.answer.half, 6);
  assert.ok(x.check({ half: 6, percent: 8.8 }).correct);
  assert.ok(!x.check({ half: 12, percent: 17.6 }).correct, 'the full range is not the uncertainty');
  assert.match(x.check({ half: 0, percent: 0 }).message, /\(74 − 62\) ÷ 2 = ±6.*6 ÷ 68 × 100 = 8\.8%/);
});

test('hb-age: every conversion stated in the prompt and shown in the mark scheme', () => {
  const x = q('hb-age');
  assert.match(x.prompt, /H₀ = 70 km\/s per Mpc/);
  assert.match(x.prompt, /1 Mpc = 3\.1 × 10¹⁹ km/);
  assert.match(x.prompt, /1 year = 3\.15 × 10⁷ s/);
  assert.ok(Math.abs(x.answer.value - 14.06) < 0.01);
  numericWithin2(x, x.answer.value);
  const m = x.check(0).message;
  assert.match(m, /70 ÷ \(3\.1 × 10¹⁹\) = 2\.26 × 10⁻¹⁸ per second/);
  assert.match(m, /1 ÷ \(2\.26 × 10⁻¹⁸\) = 4\.43 × 10¹⁷ s/);
  assert.match(m, /1\.41 × 10¹⁰ years, about 14\.1 billion years/);
});

test('nothing teaches that repeating a measurement improves accuracy, or a formula triangle', () => {
  questions.forEach((x) => {
    const text = `${x.prompt} ${(x.options || []).join(' ')} ${x.check(x.options ? x.options[0] : 0).message}`;
    assert.doesNotMatch(text, /repeat/i, x.id);
    assert.doesNotMatch(text, /triangle/i, x.id);
  });
});
