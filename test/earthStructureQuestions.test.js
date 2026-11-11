const test = require('node:test');
const assert = require('node:assert/strict');
const { makeQuestions } = require('../src/earthStructureQuestions');
const SpecData = require('../src/specData');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('makeQuestions returns 20 questions, each tagged u2.1, u2.9, u2.16, u2.28 or u2.33', () => {
  const questions = makeQuestions(SpecData);
  assert.equal(questions.length, 20);
  questions.forEach((q) => {
    assert.ok(Array.isArray(q.units) && q.units.length > 0, `${q.id} has no units`);
    q.units.forEach((id) => assert.ok(['u2.1', 'u2.9', 'u2.16', 'u2.28', 'u2.33'].includes(id), `${q.id} tags unexpected unit "${id}"`));
  });
});

test('every question id is unique', () => {
  const questions = makeQuestions(SpecData);
  const ids = questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('earth-radius-circumference: states the mean diameter in its own prompt, and accepts the correct radius/circumference within 2%', () => {
  const q = findQuestion(makeQuestions(SpecData), 'earth-radius-circumference');
  assert.ok(q.prompt.includes('13,000'));
  assert.ok(q.check({ radius: 6500, circumference: 40841 }).correct);
  assert.ok(q.check({ radius: 6500 * 1.019, circumference: 40841 }).correct, 'just within 2% tolerance');
  assert.equal(q.check({ radius: 6500 * 1.05, circumference: 40841 }).correct, false, 'radius too far off');
  assert.equal(q.check({ radius: 6500, circumference: 50000 }).correct, false, 'circumference too far off');
});

test('equator-meets-prime-meridian: accepts 0,0 and rejects a wrong point', () => {
  const q = findQuestion(makeQuestions(SpecData), 'equator-meets-prime-meridian');
  assert.ok(q.check({ lat: 0, long: 0 }).correct);
  assert.equal(q.check({ lat: 23.5, long: 0 }).correct, false);
  assert.equal(q.check({ lat: 0, long: 151.2 }).correct, false);
});

test('sydney-hemisphere-directions: "South and East" is the only correct option', () => {
  const q = findQuestion(makeQuestions(SpecData), 'sydney-hemisphere-directions');
  assert.ok(q.check('South and East').correct);
  q.options.filter((o) => o !== 'South and East').forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});

test('greenwich-hemisphere-directions: the "on the Prime Meridian, no E/W" option is the only correct one', () => {
  const q = findQuestion(makeQuestions(SpecData), 'greenwich-hemisphere-directions');
  const correctOption = q.options.find((o) => o.startsWith('North, and right on the Prime Meridian'));
  assert.ok(correctOption);
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});

test('furthest-north-overhead-sun: Tropic of Cancer is the only correct option, among all 8 named features', () => {
  const q = findQuestion(makeQuestions(SpecData), 'furthest-north-overhead-sun');
  assert.equal(q.options.length, 8);
  assert.ok(q.check('Tropic of Cancer').correct);
  q.options.filter((o) => o !== 'Tropic of Cancer').forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});

test('midnight-sun-boundary: Arctic Circle is the only correct option', () => {
  const q = findQuestion(makeQuestions(SpecData), 'midnight-sun-boundary');
  assert.ok(q.check('Arctic Circle').correct);
  q.options.filter((o) => o !== 'Arctic Circle').forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});

test('tilt-not-distance-misconception: the tilt explanation is the only correct option, and the prompt states the distance figures the misconception needs', () => {
  const q = findQuestion(makeQuestions(SpecData), 'tilt-not-distance-misconception');
  assert.ok(q.prompt.includes('152 million km'));
  assert.ok(q.prompt.includes('147 million km'));
  const correctOption = q.options.find((o) => o.startsWith('Because the UK is tilted towards the Sun'));
  assert.ok(correctOption);
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});

test('relative-intensity-from-altitude: accepts sin(40°) within tolerance, rejects a wrong guess', () => {
  const q = findQuestion(makeQuestions(SpecData), 'relative-intensity-from-altitude');
  assert.ok(q.check(0.64).correct);
  assert.equal(q.check(1).correct, false);
  assert.equal(q.check(0).correct, false);
});

test('noon-altitude-december-guildford: accepts 15.5° within 2° tolerance, states the formula and declination it needs', () => {
  const q = findQuestion(makeQuestions(SpecData), 'noon-altitude-december-guildford');
  assert.ok(q.prompt.includes('-23.5'));
  assert.ok(q.prompt.includes('51'));
  assert.ok(q.check(15.5).correct);
  assert.ok(q.check(14).correct, 'within 2 degrees');
  assert.equal(q.check(30).correct, false);
});

test('equator-latitude-value: accepts 0, rejects a non-zero value', () => {
  const q = findQuestion(makeQuestions(SpecData), 'equator-latitude-value');
  assert.ok(q.check(0).correct);
  assert.equal(q.check(23.5).correct, false);
});

const EIGHT_FEATURE_TERMS_AND_NAMES = [
  ['northPole', 'North Pole'],
  ['arcticCircle', 'Arctic Circle'],
  ['tropicOfCancer', 'Tropic of Cancer'],
  ['equator', 'Equator'],
  ['tropicOfCapricorn', 'Tropic of Capricorn'],
  ['antarcticCircle', 'Antarctic Circle'],
  ['southPole', 'South Pole'],
  ['primeMeridian', 'Prime Meridian'],
];

test('"name that line": exactly 8 picture-based questions, one per reference feature, each with a render function', () => {
  const questions = makeQuestions(SpecData);
  const lineQuestions = questions.filter((q) => q.id.startsWith('name-that-line-'));
  assert.equal(lineQuestions.length, 8);
  lineQuestions.forEach((q) => {
    assert.equal(typeof q.render, 'function', `${q.id} should have a render function`);
    assert.equal(q.options.length, 8);
  });
});

test('"name that line": every one of the 8 reference features is the correct answer to exactly one question, and every wrong option is rejected', () => {
  const questions = makeQuestions(SpecData);
  EIGHT_FEATURE_TERMS_AND_NAMES.forEach(([term, name]) => {
    const q = findQuestion(questions, `name-that-line-${term}`);
    assert.ok(q.check(name).correct);
    q.options.filter((o) => o !== name).forEach((o) => {
      assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct for ${term}`);
    });
  });
});

test('"name that line": render() calls the passed-in EarthStructureDiagram with this question\'s own term, and never throws when no diagram API is given', () => {
  const calls = [];
  const stubDiagram = { renderLineQuizDiagram: (container, term) => calls.push({ container, term }) };
  const questions = makeQuestions(SpecData, stubDiagram);
  const q = findQuestion(questions, 'name-that-line-tropicOfCapricorn');
  const fakeContainer = {};
  q.render(fakeContainer);
  assert.deepEqual(calls, [{ container: fakeContainer, term: 'tropicOfCapricorn' }]);

  const questionsWithoutDiagram = makeQuestions(SpecData);
  assert.doesNotThrow(() => findQuestion(questionsWithoutDiagram, 'name-that-line-equator').render({}));
});
