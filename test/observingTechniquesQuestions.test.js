const test = require('node:test');
const assert = require('node:assert/strict');
const VisibilityFactors = require('../src/visibilityFactors');
const { makeQuestions } = require('../src/observingTechniquesQuestions');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('every question tags u1.25 or u1.26, and states the constants it needs in its own prompt text', () => {
  const questions = makeQuestions(VisibilityFactors);
  assert.ok(questions.length >= 6);
  questions.forEach((q) => {
    assert.ok(
      (q.units.length === 1 && (q.units[0] === 'u1.25' || q.units[0] === 'u1.26')),
      `${q.id} should tag exactly one of u1.25/u1.26, got ${JSON.stringify(q.units)}`
    );
    assert.ok(q.prompt && q.prompt.trim().length > 0, `${q.id} has no prompt`);
    assert.equal(q.type, 'choice');
    assert.ok(Array.isArray(q.options) && q.options.length >= 3, `${q.id} should offer at least three options`);
  });
});

test('the u1.25 visibility-factors questions each offer exactly three options', () => {
  const questions = makeQuestions(VisibilityFactors).filter((q) => q.units[0] === 'u1.25');
  assert.ok(questions.length >= 5);
  questions.forEach((q) => {
    assert.equal(q.options.length, 3, `${q.id} should offer three options`);
  });
});

test('best-altitude-atmosphere: the highest, unobstructed altitude (70°) is correct', () => {
  const questions = makeQuestions(VisibilityFactors);
  const q = findQuestion(questions, 'best-altitude-atmosphere');
  assert.ok(q.check('Option C: 70° altitude, clear sky, flat unobstructed horizon').correct);
  assert.equal(q.check('Option A: 15° altitude, clear sky, flat unobstructed horizon').correct, false);
  assert.equal(q.check('Option B: 45° altitude, clear sky, flat unobstructed horizon').correct, false);
});

test('best-altitude-atmosphere: re-derives its ranking live from the path-length formula, not a hardcoded letter', () => {
  const invertedVisibilityFactors = {
    // A fake engine where a *lower* altitude gives a *shorter* path —
    // the opposite of reality — should flip which option is "correct".
    pathLengthMultiplier: (altitudeDeg) => altitudeDeg,
  };
  const questions = makeQuestions(invertedVisibilityFactors);
  const q = findQuestion(questions, 'best-altitude-atmosphere');
  assert.equal(q.check('Option C: 70° altitude, clear sky, flat unobstructed horizon').correct, false);
  assert.ok(q.check('Option A: 15° altitude, clear sky, flat unobstructed horizon').correct);
});

test('rising-and-setting-timing: the well-risen 11pm option is correct; an already-set target is not', () => {
  const questions = makeQuestions(VisibilityFactors);
  const q = findQuestion(questions, 'rising-and-setting-timing');
  assert.ok(q.check('11pm (40° altitude)').correct);
  assert.equal(q.check('1:30am (already set)').correct, false);
  assert.equal(q.check('9pm (5° altitude, only just risen)').correct, false);
});

test('landscape-blocks-view: only the altitude clearing the stated obstruction (20°) is correct', () => {
  const questions = makeQuestions(VisibilityFactors);
  const q = findQuestion(questions, 'landscape-blocks-view');
  assert.ok(q.check('Time B (25° altitude)').correct);
  assert.equal(q.check('Time A (12° altitude)').correct, false);
  assert.equal(q.check('Time C (8° altitude)').correct, false);
});

test('weather-blocks-view: only the cloud-free window is correct', () => {
  const questions = makeQuestions(VisibilityFactors);
  const q = findQuestion(questions, 'weather-blocks-view');
  assert.ok(q.check('Window B').correct);
  assert.equal(q.check('Window A').correct, false);
  assert.equal(q.check('Window C').correct, false);
});

test('star-opposite-sun-daytime: a star sharing the Sun\'s direction is correctly explained as up only by day', () => {
  const questions = makeQuestions(VisibilityFactors);
  const q = findQuestion(questions, 'star-opposite-sun-daytime');
  assert.deepEqual(q.units, ['u1.26']);
  assert.equal(q.options.length, 4);
  const correctOption = "It rises and sets together with the Sun, so it's only ever above the horizon during the day, when it's lost in the Sun's glare.";
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((wrongOption) => {
    assert.equal(q.check(wrongOption).correct, false, `"${wrongOption}" should be marked wrong`);
  });
});

test('combined-trade-off: the plan with no weak point (Plan C) beats the clouded-out and barely-clearing plans', () => {
  const questions = makeQuestions(VisibilityFactors);
  const q = findQuestion(questions, 'combined-trade-off');
  assert.ok(q.check('Plan C').correct);
  assert.equal(q.check('Plan A').correct, false);
  assert.equal(q.check('Plan B').correct, false);
});

test('every check() returns a non-empty explanatory message, correct or not', () => {
  const questions = makeQuestions(VisibilityFactors);
  questions.forEach((q) => {
    q.options.forEach((option) => {
      const result = q.check(option);
      assert.ok(typeof result.correct === 'boolean', `${q.id}: check() should return a boolean correct flag`);
      assert.ok(result.message && result.message.trim().length > 0, `${q.id}: check() should return an explanatory message`);
    });
  });
});
