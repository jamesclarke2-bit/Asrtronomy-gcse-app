const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('../src/hrDiagram');
const { makeQuestions } = require('../src/hrDiagramQuestions');
const { getSubtopic } = require('../src/curriculum');
const { getSpecPoint } = require('../src/specPoints');

const questions = makeQuestions(H);
const SPEC_TAGS = ['13.7a', '13.7b', '13.7c', '13.7d', '13.7e', '13.13'];

function fieldCombos(fields) {
  return fields.reduce((combos, field) => combos.flatMap((combo) => field.options.map((option) => ({ ...combo, [field.key]: option }))), [{}]);
}

function correctAnswers(q) {
  if (q.fields) return fieldCombos(q.fields).filter((value) => q.check(value).correct);
  return q.options.filter((value) => q.check(value).correct);
}

test('at least 10 questions, unique ids, tagged u4.9 and a 13.7 sub-part or 13.13, every sub-part used', () => {
  assert.ok(questions.length >= 10);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  assert.ok(getSubtopic('u4.9'));
  questions.forEach((q) => {
    assert.deepEqual(q.units, ['u4.9'], q.id);
    assert.ok(SPEC_TAGS.includes(q.spec), q.id);
    assert.ok(getSpecPoint(q.spec), q.spec);
    assert.ok(Number.isInteger(q.marks) && q.marks > 0, q.id);
  });
  SPEC_TAGS.forEach((tag) => assert.ok(questions.some((q) => q.spec === tag), tag));
});

test('every choice or multi-field question has exactly one fully-correct answer and one field per mark', () => {
  questions.filter((q) => q.type !== 'number').forEach((q) => {
    assert.equal(correctAnswers(q).length, 1, q.id);
    if (q.fields) assert.equal(q.fields.length, q.marks, q.id);
  });
});

test('every answer, right or wrong, shows the mark scheme', () => {
  questions.forEach((q) => {
    const samples = q.type === 'number' ? ['1', '100', 'abc'] : q.fields ? fieldCombos(q.fields).slice(0, 3) : q.options;
    samples.forEach((value) => assert.match(q.check(value).message, /Mark scheme:/, q.id));
  });
});

test('at least two distance calculations need a value read from a diagram the question draws itself', () => {
  const readOff = questions.filter((q) => q.spec === '13.13' && typeof q.render === 'function' && q.type === 'number');
  assert.ok(readOff.length >= 2);
  readOff.forEach((q) => {
    // The absolute magnitude is not given in the prompt: it must be read off.
    assert.ok(!q.prompt.includes(H.signed(q.answer.M)), `${q.id} gives M away`);
    assert.match(q.prompt, /M = m \+ 5 − 5 log d/);
    assert.equal(q.check(String(q.answer.distancePc)).correct, true, q.id);
    // A reading anywhere within half a magnitude of the band's middle is accepted ...
    assert.equal(q.check(String(q.answer.lowPc)).correct, true, `${q.id} low`);
    assert.equal(q.check(String(q.answer.highPc)).correct, true, `${q.id} high`);
    // ... but not one a whole magnitude out, or the distance modulus misused.
    assert.equal(q.check(String(q.answer.distancePc * Math.pow(10, 0.2))).correct, false, `${q.id} 1 mag out`);
    assert.equal(q.check(String(q.answer.distancePc / 10)).correct, false, `${q.id} factor of 10`);
    // Tolerance is at least 2% around the best estimate.
    assert.equal(q.check(String(q.answer.distancePc * 1.02)).correct, true, `${q.id} +2%`);
  });
  const f5 = questions.find((q) => q.id === 'distance-read-off-f5');
  assert.equal(f5.answer.M, 3.4);
  assert.ok(Math.abs(f5.answer.distancePc - 100) < 1e-6);
  const k5 = questions.find((q) => q.id === 'distance-read-off-k5');
  assert.equal(k5.answer.M, 7.4);
  assert.ok(Math.abs(k5.answer.distancePc - 31.62) < 0.01);
});

test('the uncertainty question: half the range from the G2 band, accepted within 2%', () => {
  const q = questions.find((x) => x.id === 'distance-uncertainty');
  const ex = H.distanceFromMainSequence(5800, 9.8);
  assert.equal(q.check(String(ex.uncertaintyPc)).correct, true);
  assert.equal(q.check('48').correct, true);
  assert.equal(q.check(String(ex.rangePc)).correct, false, 'the whole range is not the uncertainty');
  assert.match(q.prompt, /\+3\.8/);
  assert.match(q.prompt, /\+5\.8/);
});

test('every star value a question quotes comes from the engine', () => {
  const wd = questions.find((q) => q.id === 'identify-white-dwarf');
  const siriusB = H.STARS.find((s) => s.name === 'Sirius B');
  assert.ok(wd.prompt.includes(siriusB.temperatureK.toLocaleString('en-GB')));
  assert.ok(wd.prompt.includes(H.signed(siriusB.absoluteMagnitude)));
  assert.equal(H.inRegion('white-dwarfs', siriusB.temperatureK, siriusB.absoluteMagnitude), true);
  const sg = questions.find((q) => q.id === 'identify-supergiant');
  const betelgeuse = H.STARS.find((s) => s.name === 'Betelgeuse');
  assert.ok(sg.prompt.includes(H.signed(betelgeuse.absoluteMagnitude)));
});

test('the page\'s worked example quotes exactly the numbers the engine gives', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'notes', 'hr-diagram.html'), 'utf8');
  const ex = H.distanceFromMainSequence(5800, 9.8);
  const text = html.replace(/&asymp;/g, '≈').replace(/&minus;/g, '−').replace(/&plusmn;/g, '±').replace(/\s+/g, ' ');
  assert.match(text, /G2 main-sequence star has m = \+9\.8/);
  assert.ok(text.includes(`M ≈ ${H.signed(ex.M)}`));
  assert.ok(text.includes(`M = ${H.signed(ex.bright)} to ${H.signed(ex.faint)}`));
  assert.ok(text.includes(`${Math.round(ex.nearPc)} pc to ${Math.round(ex.farPc)} pc`));
  assert.ok(text.includes(`a range of ${Math.round(ex.rangePc)} pc`));
  assert.ok(text.includes(`about ±${Math.round(ex.uncertaintyPc)} pc`));
  assert.ok(text.includes(`d = ${Math.round(ex.distancePc)} pc`));
});

test('total marks', () => {
  assert.equal(questions.reduce((sum, q) => sum + q.marks, 0), 23);
});
