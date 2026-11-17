const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../src/redshift');
const { makeQuestions } = require('../src/redshiftQuestions');
const { getSubtopic } = require('../src/curriculum');

const questions = makeQuestions(R);
const q = (id) => questions.find((x) => x.id === id);
const right = (id) => q(id).options.filter((o) => q(id).check(o).correct);

test('unique ids, all on u6.1, tagged 16.1-16.3, with every spec point asked', () => {
  assert.deepEqual(getSubtopic('u6.1').spec, ['16.1', '16.2', '16.3']);
  assert.equal(new Set(questions.map((x) => x.id)).size, questions.length);
  questions.forEach((x) => {
    assert.deepEqual(x.units, ['u6.1'], x.id);
    assert.ok(['16.1', '16.2', '16.3'].includes(x.spec), x.id);
    assert.ok(x.marks >= 1, x.id);
  });
  for (const spec of ['16.1', '16.2', '16.3']) assert.ok(questions.some((x) => x.spec === spec), spec);
});

test('every choice question has exactly one right answer and shows the mark scheme', () => {
  questions.filter((x) => x.type === 'choice').forEach((x) => {
    assert.equal(right(x.id).length, 1, x.id);
    x.options.forEach((o) => assert.match(x.check(o).message, /Mark scheme:/, x.id));
  });
  assert.match(right('rs-what')[0], /longer wavelengths/);
  assert.match(right('rs-which')[0], /outside the Local Group/);
  assert.match(right('rs-cause')[0], /moving away/);
  assert.equal(right('rs-faster')[0], 'Galaxy Y');
  assert.equal(right('rs-rearrange')[0], 'v = c × (wavelength shift) ÷ (emitted wavelength)');
  assert.match(right('rs-units')[0], /^km\/s/);
});

test('rs-find-v: states c, accepts 2% either side, and shows the full working', () => {
  const x = q('rs-find-v');
  assert.match(x.prompt, /486\.1 nm/);
  assert.match(x.prompt, /500\.7 nm/);
  assert.match(x.prompt, /c = 3\.0 × 10⁸ m\/s \(300,000 km\/s\)/);
  const v = x.answer.kmPerS;
  assert.ok(Math.abs(v - 9010.49) < 0.01);
  assert.ok(x.check(v * 1.02).correct && x.check(v * 0.98).correct);
  assert.ok(!x.check(v * 1.025).correct && !x.check(v * 0.975).correct);
  const m = x.check(0).message;
  assert.match(m, /500\.7 − 486\.1 = 14\.6 nm/);
  assert.match(m, /14\.6 ÷ 486\.1/);
  assert.match(m, /300,000 km\/s ×/);
  assert.equal(x.marks, 3);
});

test('rs-find-observed: shift then observed wavelength, each within 2%, with working', () => {
  const x = q('rs-find-observed');
  assert.match(x.prompt, /12,000 km\/s/);
  assert.match(x.prompt, /656\.3 nm/);
  assert.match(x.prompt, /c = 3\.0 × 10⁸ m\/s/);
  assert.ok(Math.abs(x.answer.shift - 26.252) < 1e-9);
  assert.ok(Math.abs(x.answer.observed - 682.552) < 1e-9);
  assert.ok(x.check({ shift: 26.3, observed: 682.6 }).correct);
  assert.ok(!x.check({ shift: 682.6, observed: 682.6 }).correct, 'the observed wavelength is not the shift');
  const m = x.check({ shift: 0, observed: 0 }).message;
  assert.match(m, /0 out of 2 marks/);
  assert.match(m, /656\.3 × 12,000 ÷ 300,000 = 26\.3 nm/);
  assert.match(m, /656\.3 \+ 26\.3 = 682\.6 nm/);
});

test('no question teaches a formula triangle', () => {
  questions.forEach((x) => assert.doesNotMatch(`${x.prompt} ${x.check(x.options ? x.options[0] : 0).message}`, /triangle/i, x.id));
});
