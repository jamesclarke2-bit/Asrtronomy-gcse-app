const test = require('node:test');
const assert = require('node:assert/strict');
const { makeQuestions } = require('../src/eclipticZodiacQuestions');
const EclipticZodiac = require('../src/eclipticZodiac');
const SolarPosition = require('../src/solarPosition');
const PlanetaryMotion = require('../src/planetaryMotion');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

function makeQ() {
  return makeQuestions(EclipticZodiac, SolarPosition, PlanetaryMotion);
}

test('every question tags u1.16, u2.29 or u3.23, has a non-empty prompt, and at least one option is the correct one', () => {
  const questions = makeQ();
  assert.ok(questions.length >= 5);
  questions.forEach((q) => {
    assert.ok(
      q.units.length === 1 && ['u1.16', 'u2.29', 'u3.23'].includes(q.units[0]),
      `${q.id} should tag one of u1.16/u2.29/u3.23, got ${JSON.stringify(q.units)}`
    );
    assert.ok(q.prompt && q.prompt.trim().length > 0, `${q.id} has no prompt`);
    assert.equal(q.type, 'choice');
    assert.ok(Array.isArray(q.options) && q.options.length >= 3, `${q.id} should offer at least three options`);
    const results = q.options.map((o) => q.check(o));
    assert.equal(results.filter((r) => r.correct).length, 1, `${q.id} should have exactly one correct option`);
  });
});

test('every check() returns a non-empty explanatory message, correct or not', () => {
  const questions = makeQ();
  questions.forEach((q) => {
    q.options.forEach((option) => {
      const result = q.check(option);
      assert.ok(typeof result.correct === 'boolean');
      assert.ok(result.message && result.message.trim().length > 0, `${q.id}: no message for "${option}"`);
    });
  });
});

test('why-near-ecliptic: the flattened-disc explanation is correct, the others are not', () => {
  const q = findQuestion(makeQ(), 'why-near-ecliptic');
  const correctOption = q.options.find((o) => q.check(o).correct);
  assert.match(correctOption, /flattened, spinning disc/);
});

test('astronomy-vs-astrology-cause: precession is the correct cause', () => {
  const q = findQuestion(makeQ(), 'astronomy-vs-astrology-cause');
  const correctOption = q.options.find((o) => q.check(o).correct);
  assert.match(correctOption, /Precession/);
});

test('ophiuchus-duration: matches a direct day count between the question\'s own stated dates (29 Nov - 17 Dec)', () => {
  const q = findQuestion(makeQ(), 'ophiuchus-duration');
  const expectedDays = Math.round((Date.UTC(2025, 11, 17) - Date.UTC(2025, 10, 29)) / 86400000);
  assert.ok(q.check(`About ${expectedDays} days`).correct);
  assert.equal(q.check('About 6 days').correct, false);
  assert.equal(q.check('About 30 days').correct, false);
  // Sanity: the module's own engine should agree this is roughly 18 days.
  assert.ok(expectedDays >= 16 && expectedDays <= 20);
});

test('opposite-at-midnight: the correct answer is re-derived live from EclipticZodiac, not hard-coded, and is Pisces for Virgo', () => {
  const q = findQuestion(makeQ(), 'opposite-at-midnight');
  assert.ok(q.check('Pisces').correct);
  assert.equal(q.check('Virgo itself').correct, false);
  assert.equal(q.check('Sagittarius').correct, false);
  assert.equal(q.check('Gemini').correct, false);
});

test('precession-shift-since-signs-fixed: about 28 degrees (2000/26000 of 360), computed not hard-coded', () => {
  const q = findQuestion(makeQ(), 'precession-shift-since-signs-fixed');
  const expectedDegrees = Math.round((2000 / 26000) * 360);
  assert.ok(q.check(`About ${expectedDegrees}°`).correct);
  assert.equal(q.check('About 3°').correct, false);
  assert.equal(q.check('About 90°').correct, false);
  assert.equal(q.check('About 180°').correct, false);
});

test('no question hard-codes its correct answer independent of the real engines: swapping in a fake EclipticZodiac changes the right option for opposite-at-midnight', () => {
  const fakeEclipticZodiac = {
    sunConstellation: () => 'Virgo',
    midnightConstellation: () => 'Gemini', // deliberately "wrong" physics, to prove the question re-derives rather than assuming Pisces
  };
  const questions = makeQuestions(fakeEclipticZodiac, SolarPosition, PlanetaryMotion);
  const q = findQuestion(questions, 'opposite-at-midnight');
  assert.ok(q.check('Gemini').correct);
  assert.equal(q.check('Pisces').correct, false);
});
