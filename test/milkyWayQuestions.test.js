const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/milkyWay');
const { makeQuestions } = require('../src/milkyWayQuestions');
const { getSubtopic } = require('../src/curriculum');

const questions = makeQuestions(G);

function fieldCombos(fields) {
  return fields.reduce((combos, field) => combos.flatMap((combo) => field.options.map((option) => ({ ...combo, [field.key]: option }))), [{}]);
}

function correctAnswers(q) {
  if (q.fields) return fieldCombos(q.fields).filter((value) => q.check(value).correct);
  return q.options.filter((value) => q.check(value).correct);
}

const ans = (id) => correctAnswers(questions.find((q) => q.id === id))[0];

test('unique ids, all tagged u4.4, with questions for 15.1, 15.2, 15.3 and 15.8', () => {
  assert.deepEqual(getSubtopic('u4.4').spec, ['15.1', '15.2', '15.3', '15.8']);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  questions.forEach((q) => assert.deepEqual(q.units, ['u4.4'], q.id));
  ['15.1', '15.2', '15.3', '15.8'].forEach((spec) => assert.ok(questions.some((q) => q.spec === spec), spec));
});

test('every question has exactly one fully-correct answer and shows the mark scheme', () => {
  questions.forEach((q) => {
    assert.equal(correctAnswers(q).length, 1, q.id);
    if (q.fields) assert.equal(q.fields.length, q.marks, q.id);
    const samples = q.fields ? fieldCombos(q.fields).slice(0, 2) : q.options;
    samples.forEach((value) => assert.match(q.check(value).message, /Mark scheme:/, q.id));
  });
});

test('asks why visible light can’t map the Galaxy', () => {
  const q = questions.find((x) => x.id === 'gx-why-not-light');
  assert.match(q.prompt, /visible light/);
  assert.match(ans('gx-why-not-light'), /Dust in the disc absorbs and scatters visible light/);
  assert.match(ans('gx-why-21cm'), /21 cm radio waves, which pass through the dust/);
});

test('places the Sun, a globular cluster and a dust lane on a lettered drawing', () => {
  const q = questions.find((x) => x.id === 'gx-place');
  assert.equal(typeof q.render, 'function');
  assert.equal(q.marks, 3);
  assert.deepEqual(ans('gx-place'), { sun: G.QUIZ_LETTERS.sun, cluster: G.QUIZ_LETTERS.cluster, dust: G.QUIZ_LETTERS.dust });
  const msg = q.check({}).message;
  assert.match(msg, /the Sun is in the thin disc, about halfway from the centre to the edge \(about 26,000 light-years from the centre\)/);
  assert.match(msg, /globular clusters are in the halo/);
  assert.match(msg, /dust lies in the disc itself/);
});

test('the view from Earth, the type, the size, and the Doppler shifts', () => {
  assert.match(ans('gx-binoculars'), /Many separate faint stars/);
  assert.match(ans('gx-band'), /inside a flat disc/);
  assert.match(ans('gx-dark-lanes'), /dust/);
  assert.equal(ans('gx-type'), 'A barred spiral galaxy (SBb)');
  assert.equal(ans('gx-size'), 'About 100,000 light-years');
  assert.deepEqual(ans('gx-shift'), { a: 'Moving away from us (redshift)', b: 'Moving towards us (blueshift)', c: 'Not moving along our line of sight' });
  assert.match(ans('gx-rotation'), /Doppler shift of the 21 cm line/);
  assert.match(ans('gx-star-forming'), /spiral arms/);
});
