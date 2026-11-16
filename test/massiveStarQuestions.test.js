const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../src/massiveStar');
const L = require('../src/sunLikeStar');
const { makeQuestions } = require('../src/massiveStarQuestions');
const { getSubtopic } = require('../src/curriculum');

const questions = makeQuestions(M, L);

function fieldCombos(fields) {
  return fields.reduce((combos, field) => combos.flatMap((combo) => field.options.map((option) => ({ ...combo, [field.key]: option }))), [{}]);
}

function correctAnswers(q) {
  if (q.fields) return fieldCombos(q.fields).filter((value) => q.check(value).correct);
  return q.options.filter((value) => q.check(value).correct);
}

test('unique ids, all tagged u4.15, with questions for 13.8, 14.6, 14.7, 14.8 and 14.10', () => {
  assert.deepEqual(getSubtopic('u4.15').spec, ['13.8', '14.6', '14.7', '14.8', '14.10']);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  questions.forEach((q) => assert.deepEqual(q.units, ['u4.15'], q.id));
  ['13.8', '14.6', '14.7', '14.8', '14.10'].forEach((spec) => assert.ok(questions.filter((q) => q.spec === spec).length >= 2, spec));
});

test('every question has exactly one fully-correct answer and shows the mark scheme', () => {
  questions.forEach((q) => {
    assert.equal(correctAnswers(q).length, 1, q.id);
    if (q.fields) assert.equal(q.fields.length, q.marks, q.id);
    const samples = q.fields ? fieldCombos(q.fields).slice(0, 2) : q.options;
    samples.forEach((value) => assert.match(q.check(value).message, /Mark scheme:/, q.id));
  });
});

test('the five questions asked for: the stage order, the short main sequence, the Chandrasekhar limit, neutron pressure and the two HR tracks', () => {
  assert.match(correctAnswers(questions.find((q) => q.id === 'mv-order'))[0], /Main sequence → Red supergiant → Supernova → Neutron star or black hole/);
  assert.match(correctAnswers(questions.find((q) => q.id === 'mv-ms-shorter'))[0], /uses its fuel up much faster/);
  assert.match(questions.find((q) => q.id === 'mv-ms-shorter').check('x').message, /about 1,000 times shorter/);
  assert.match(correctAnswers(questions.find((q) => q.id === 'mv-limit-decides'))[0], /electron pressure/);
  assert.match(correctAnswers(questions.find((q) => q.id === 'mv-neutron-pressure'))[0], /^Neutron pressure/);
  const which = correctAnswers(questions.find((q) => q.id === 'mv-which-end'))[0];
  assert.match(which.a, /white dwarf/);
  assert.match(which.b, /neutron star/);
  assert.match(which.c, /black hole/);
  const tracks = correctAnswers(questions.find((q) => q.id === 'mv-compare-tracks'))[0];
  assert.match(tracks.start, /hotter and much more luminous/);
  assert.match(tracks.next, /red supergiants/);
  assert.match(tracks.end, /white dwarfs/);
});
