const test = require('node:test');
const assert = require('node:assert/strict');
const Tides = require('../src/tides');
const { makeQuestions } = require('../src/tidesQuestions');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('pull-vs-stretch-falloff: the inverse-cube option is the only correct one', () => {
  const questions = makeQuestions(Tides);
  const q = findQuestion(questions, 'pull-vs-stretch-falloff');
  const correctOption = q.options.find((o) => o.startsWith('The cube of distance'));
  assert.ok(q.check(correctOption).correct);
  assert.equal(q.check('The square of distance, the same as the pull itself, so distance makes no difference to which body wins').correct, false);
});

test('sun-moon-pull-ratio-calculation: accepts the live-computed pull ratio, rejects a wrong guess', () => {
  const questions = makeQuestions(Tides);
  const q = findQuestion(questions, 'sun-moon-pull-ratio-calculation');
  const expected = Tides.sunToMoonPullRatio();
  assert.ok(q.check(expected).correct);
  assert.equal(q.check(expected * 2).correct, false);
});

test('sun-moon-stretch-ratio-calculation: accepts the live-computed stretch ratio, rejects a wrong guess', () => {
  const questions = makeQuestions(Tides);
  const q = findQuestion(questions, 'sun-moon-stretch-ratio-calculation');
  const expected = Tides.sunToMoonTideRatio();
  assert.ok(q.check(expected).correct);
  assert.equal(q.check(expected * 2).correct, false);
});

test('the page\'s rounded pull ratio (180) and stretch ratio (0.46) match the engine', () => {
  assert.equal(Math.round(Tides.sunToMoonPullRatio() / 10) * 10, 180);
  assert.equal(Tides.TIDE_RATIO.toFixed(2), '0.46');
  assert.ok(Math.abs(Tides.sunToMoonTideRatio() - Tides.TIDE_RATIO) < 1e-12, 'TIDE_RATIO is sunToMoonTideRatio()');
});

test('every question states the constants it needs in its own prompt text', () => {
  const questions = makeQuestions(Tides);
  const numberQuestions = questions.filter((q) => q.type === 'number');
  assert.ok(numberQuestions.length >= 2, 'expected at least 2 calculation questions');
  numberQuestions.forEach((q) => {
    assert.ok(/\d/.test(q.prompt), `${q.id}: prompt should state a numeric given, got "${q.prompt}"`);
  });
});

test('every question only tags u2.x ids that actually exist in curriculum.js', () => {
  const Curriculum = require('../src/curriculum');
  const questions = makeQuestions(Tides);
  questions.forEach((q) => {
    q.units.forEach((id) => {
      assert.ok(Curriculum.getSubtopic(id), `${q.id} references missing subtopic "${id}"`);
    });
  });
});
