const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { makeQuestions, NAMED_FEATURES } = require('../src/moonStructureQuestions');
const SpecData = require('../src/specData');
const MoonPhase = require('../src/moonPhase');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('makeQuestions returns 11 questions (1 + 1 + 7 named features + 2), each tagged a real curriculum unit', () => {
  const questions = makeQuestions(SpecData, MoonPhase);
  assert.equal(questions.length, 11);
  questions.forEach((q) => {
    assert.ok(Array.isArray(q.units) && q.units.length > 0, `${q.id} has no units`);
    q.units.forEach((id) => assert.ok(['u2.2', 'u2.20', 'u2.21'].includes(id), `${q.id} tags unexpected unit "${id}"`));
  });
});

test('every question id is unique', () => {
  const questions = makeQuestions(SpecData, MoonPhase);
  const ids = questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('moon-diameters-across-earth: states both data-sheet diameters, accepts ~3.7 within 2%', () => {
  const q = findQuestion(makeQuestions(SpecData, MoonPhase), 'moon-diameters-across-earth');
  assert.ok(q.prompt.includes('3,500'));
  assert.ok(q.prompt.includes('13,000'));
  assert.ok(q.check(3.71).correct);
  assert.equal(q.check(4.5).correct, false);
});

test('terrain-type-identification: the one fully-correct mapping is accepted, and any single wrong field fails it', () => {
  const q = findQuestion(makeQuestions(SpecData, MoonPhase), 'terrain-type-identification');
  const correctValue = { maria: 'Maria', terrae: 'Terrae (highlands)', crater: 'Crater', rille: 'Valley or rille', mountains: 'Mountains' };
  assert.ok(q.check(correctValue).correct);
  assert.equal(q.check({ ...correctValue, crater: 'Maria' }).correct, false);
});

test('NAMED_FEATURES has exactly the 7 named features, each with a distinct name', () => {
  assert.equal(NAMED_FEATURES.length, 7);
  const names = NAMED_FEATURES.map((f) => f.name);
  assert.equal(new Set(names).size, 7);
  assert.deepEqual(
    [...names].sort(),
    ['Apennine Mountains', 'Copernicus', 'Kepler', 'Ocean of Storms', 'Sea of Crises', 'Sea of Tranquility', 'Tycho'].sort()
  );
});

test('every named-feature clue is copied verbatim from moon-structure.js\'s own GLOSSARY text, so it can\'t silently drift', () => {
  const pageSource = fs.readFileSync(path.join(__dirname, '..', 'notes', 'moon-structure.js'), 'utf8');
  NAMED_FEATURES.forEach(({ term, clue }) => {
    assert.ok(pageSource.includes(clue), `clue for "${term}" is not found verbatim in moon-structure.js's GLOSSARY`);
  });
});

test('a generated named-feature question for every feature: its own clue is correct, and every other feature name is wrong', () => {
  const questions = makeQuestions(SpecData, MoonPhase);
  NAMED_FEATURES.forEach((feature) => {
    const q = findQuestion(questions, `named-feature-${feature.term}`);
    assert.equal(q.options.length, 7);
    assert.ok(q.check(feature.name).correct);
    q.options.filter((name) => name !== feature.name).forEach((name) => {
      assert.equal(q.check(name).correct, false, `"${name}" should not be marked correct for ${feature.term}`);
    });
  });
});

test('every one of the 7 named features is the correct answer to at least one generated question', () => {
  const questions = makeQuestions(SpecData, MoonPhase);
  const namedFeatureQuestions = questions.filter((q) => q.id.startsWith('named-feature-'));
  assert.equal(namedFeatureQuestions.length, 7);
  const correctAnswers = new Set(
    namedFeatureQuestions.map((q) => q.options.find((o) => q.check(o).correct))
  );
  NAMED_FEATURES.forEach((feature) => {
    assert.ok(correctAnswers.has(feature.name), `${feature.name} is never the correct answer to any generated question`);
  });
});

test('rotation-and-orbit: accepts the correct 27.3 days / 1 rotation / matching-periods answer, rejects a wrong "why"', () => {
  const q = findQuestion(makeQuestions(SpecData, MoonPhase), 'rotation-and-orbit');
  const correctWhy = 'Because its rotation period exactly matches its orbital period, so it turns at just the rate needed to keep the same side facing Earth throughout the orbit';
  assert.ok(q.check({ rotationDays: 27.3, rotationsPerOrbit: 1, why: correctWhy }).correct);
  assert.equal(q.check({ rotationDays: 27.3, rotationsPerOrbit: 1, why: "Because the Moon doesn't rotate on its axis at all" }).correct, false);
  assert.equal(q.check({ rotationDays: 10, rotationsPerOrbit: 1, why: correctWhy }).correct, false);
});

test('phase-cycle-misconception: quotes the live SYNODIC_MONTH_DAYS figure, and only the sidereal-vs-synodic option is correct', () => {
  const q = findQuestion(makeQuestions(SpecData, MoonPhase), 'phase-cycle-misconception');
  assert.ok(q.prompt.includes('27.3'));
  const correctOption = q.options.find((o) => o.startsWith('27.3 days is the'));
  assert.ok(correctOption);
  assert.ok(correctOption.includes(MoonPhase.SYNODIC_MONTH_DAYS.toFixed(1)));
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});
