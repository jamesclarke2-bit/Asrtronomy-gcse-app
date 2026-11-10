const test = require('node:test');
const assert = require('node:assert/strict');
const { makeQuestions } = require('../src/parallaxQuestions');
const Parallax = require('../src/parallax');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('makeQuestions returns 8 questions, each tagged u4.5 and/or u3.4 only, with unique ids', () => {
  const questions = makeQuestions(Parallax);
  assert.equal(questions.length, 8);
  const ids = questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
  questions.forEach((q) => {
    assert.ok(Array.isArray(q.units) && q.units.length > 0, `${q.id} has no units`);
    q.units.forEach((id) => assert.ok(['u4.5', 'u3.4'].includes(id), `${q.id} tags unexpected unit "${id}"`));
  });
});

test('distance-from-parallax: accepts 4.0 pc within 2%, rejects a wrong answer', () => {
  const q = findQuestion(makeQuestions(Parallax), 'distance-from-parallax');
  assert.ok(q.check(4.0).correct);
  assert.equal(q.check(2.5).correct, false);
});

test('parallax-from-distance: accepts 0.05 arcsec within 2%, rejects a wrong answer', () => {
  const q = findQuestion(makeQuestions(Parallax), 'parallax-from-distance');
  assert.ok(q.check(0.05).correct);
  assert.equal(q.check(20).correct, false);
});

test('parsecs-to-light-years: states the live PARSEC_LIGHT_YEARS figure, accepts the correct conversion within 2%', () => {
  const q = findQuestion(makeQuestions(Parallax), 'parsecs-to-light-years');
  assert.ok(q.prompt.includes(Parallax.PARSEC_LIGHT_YEARS.toFixed(2)));
  assert.ok(q.check(5 * Parallax.PARSEC_LIGHT_YEARS).correct);
  assert.equal(q.check(5).correct, false);
});

test('comparing-two-stars: "Star A" (the bigger parallax, so the closer star) is the only correct option', () => {
  const q = findQuestion(makeQuestions(Parallax), 'comparing-two-stars');
  assert.ok(q.check('Star A').correct);
  q.options.filter((o) => o !== 'Star A').forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});

test('why-six-months-apart: the longest-baseline explanation is the only correct option', () => {
  const q = findQuestion(makeQuestions(Parallax), 'why-six-months-apart');
  const correctOption = q.options.find((o) => o.startsWith("Because that's when Earth is at opposite ends"));
  assert.ok(correctOption);
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});

test('why-only-nearby-stars: the angle-too-small explanation is the only correct option', () => {
  const q = findQuestion(makeQuestions(Parallax), 'why-only-nearby-stars');
  const correctOption = q.options.find((o) => o.startsWith('Because at larger distances'));
  assert.ok(correctOption);
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});

test('explain-the-geometry: the known-baseline/triangulation explanation is the only correct option', () => {
  const q = findQuestion(makeQuestions(Parallax), 'explain-the-geometry');
  const correctOption = q.options.find((o) => o.startsWith('Because the baseline (1 AU'));
  assert.ok(correctOption);
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});

test('degrees-to-arcseconds: states the live ARCSECONDS_PER_DEGREE figure, accepts 180 within 2%', () => {
  const q = findQuestion(makeQuestions(Parallax), 'degrees-to-arcseconds');
  assert.ok(q.prompt.includes(String(Parallax.ARCSECONDS_PER_DEGREE)));
  assert.ok(q.check(180).correct);
  assert.equal(q.check(18).correct, false);
});
