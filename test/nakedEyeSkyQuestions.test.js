const test = require('node:test');
const assert = require('node:assert/strict');
const { makeQuestions, PHENOMENA, PATTERN_IDS_AND_NAMES, PHENOMENA_GRID_ORDER } = require('../src/nakedEyeSkyQuestions');
const StarPatterns = require('../src/starPatterns');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('makeQuestions returns 39 questions, each tagged u1.1, u1.2 or u1.3', () => {
  const questions = makeQuestions(StarPatterns);
  assert.equal(questions.length, 39);
  questions.forEach((q) => {
    assert.ok(Array.isArray(q.units) && q.units.length > 0, `${q.id} has no units`);
    q.units.forEach((id) => assert.ok(['u1.1', 'u1.2', 'u1.3'].includes(id), `${q.id} tags unexpected unit "${id}"`));
  });
});

test('every question id is unique', () => {
  const ids = makeQuestions(StarPatterns).map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('PHENOMENA has exactly the 13 phenomena, each with a distinct name', () => {
  assert.equal(PHENOMENA.length, 13);
  const names = PHENOMENA.map((p) => p.name);
  assert.equal(new Set(names).size, 13);
});

test('every phenomenon question: its own phenomenon is correct, and every other phenomenon name is wrong', () => {
  const questions = makeQuestions(StarPatterns);
  PHENOMENA.forEach((phenomenon) => {
    const q = findQuestion(questions, `phenomenon-${phenomenon.id}`);
    assert.equal(q.options.length, 13);
    assert.ok(q.prompt.includes(phenomenon.clue));
    assert.ok(q.check(phenomenon.name).correct);
    q.options.filter((name) => name !== phenomenon.name).forEach((name) => {
      assert.equal(q.check(name).correct, false, `"${name}" should not be marked correct for ${phenomenon.id}`);
    });
  });
});

test('every one of the 13 phenomena is the correct answer to exactly one phenomenon question', () => {
  const questions = makeQuestions(StarPatterns);
  const phenomenonQuestions = questions.filter((q) => q.id.startsWith('phenomenon-'));
  assert.equal(phenomenonQuestions.length, 13);
  const correctAnswers = phenomenonQuestions.map((q) => q.options.find((o) => q.check(o).correct));
  assert.equal(new Set(correctAnswers).size, 13, 'every phenomenon should be the correct answer to its own question only');
  PHENOMENA.forEach((p) => assert.ok(correctAnswers.includes(p.name), `${p.name} is never a correct answer`));
});

test('PATTERN_IDS_AND_NAMES has exactly the 7 patterns, matching real StarPatterns.PATTERNS ids', () => {
  assert.equal(PATTERN_IDS_AND_NAMES.length, 7);
  PATTERN_IDS_AND_NAMES.forEach(([id, name]) => {
    const pattern = StarPatterns.PATTERNS.find((p) => p.id === id);
    assert.ok(pattern, `"${id}" is not a real StarPatterns pattern id`);
    assert.equal(pattern.name, name, `"${id}"'s name should match StarPatterns' own name`);
  });
});

test('"name that pattern": exactly 7 picture-based questions, each with a render function', () => {
  const questions = makeQuestions(StarPatterns);
  const patternQuestions = questions.filter((q) => q.id.startsWith('name-that-pattern-'));
  assert.equal(patternQuestions.length, 7);
  patternQuestions.forEach((q) => {
    assert.equal(typeof q.render, 'function', `${q.id} should have a render function`);
    assert.equal(q.options.length, 7);
  });
});

test('"name that pattern": every one of the 7 patterns is the correct answer to exactly one question, and every wrong option is rejected', () => {
  const questions = makeQuestions(StarPatterns);
  PATTERN_IDS_AND_NAMES.forEach(([id, name]) => {
    const q = findQuestion(questions, `name-that-pattern-${id}`);
    assert.ok(q.check(name).correct);
    q.options.filter((o) => o !== name).forEach((o) => {
      assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct for ${id}`);
    });
  });
});

test('"name that pattern": render() calls the passed-in NakedEyeSkyDiagram with this question\'s own pattern id, and never throws when no diagram API is given', () => {
  const calls = [];
  const stubDiagram = { renderPatternQuizDiagram: (container, id) => calls.push({ container, id }) };
  const questions = makeQuestions(StarPatterns, stubDiagram);
  const q = findQuestion(questions, 'name-that-pattern-orion');
  const fakeContainer = {};
  q.render(fakeContainer);
  assert.deepEqual(calls, [{ container: fakeContainer, id: 'orion' }]);

  const questionsWithoutDiagram = makeQuestions(StarPatterns);
  assert.doesNotThrow(() => findQuestion(questionsWithoutDiagram, 'name-that-pattern-orion').render({}));
});

test('constellation-or-asterism: the fully-correct mapping (derived from StarPatterns.PATTERNS.kind) is accepted, and any single wrong field fails it', () => {
  const q = findQuestion(makeQuestions(StarPatterns), 'constellation-or-asterism');
  const correctValue = {};
  PATTERN_IDS_AND_NAMES.forEach(([id]) => {
    const pattern = StarPatterns.PATTERNS.find((p) => p.id === id);
    correctValue[id] = pattern.kind === 'asterism' ? 'Asterism' : 'Constellation';
  });
  assert.ok(q.check(correctValue).correct);
  assert.deepEqual(correctValue, {
    cassiopeia: 'Constellation',
    cygnus: 'Constellation',
    orion: 'Constellation',
    plough: 'Asterism',
    southernCross: 'Constellation',
    summerTriangle: 'Asterism',
    squareOfPegasus: 'Asterism',
  });
  const wrongValue = { ...correctValue, plough: 'Constellation' };
  assert.equal(q.check(wrongValue).correct, false);
});

test('plough-pointers-to-polaris: accepts the live-computed ratio (about 5) within tolerance, rejects a wrong guess', () => {
  const q = findQuestion(makeQuestions(StarPatterns), 'plough-pointers-to-polaris');
  const ratio = StarPatterns.angularSeparation(StarPatterns.STARS.dubhe, StarPatterns.STARS.polaris) /
    StarPatterns.angularSeparation(StarPatterns.STARS.merak, StarPatterns.STARS.dubhe);
  assert.ok(q.check(ratio).correct);
  assert.ok(q.check(5).correct);
  assert.equal(q.check(50).correct, false);
});

test('plough-handle-to-arcturus: Arcturus is the only correct option, and the message flags it as a first draft', () => {
  const q = findQuestion(makeQuestions(StarPatterns), 'plough-handle-to-arcturus');
  assert.ok(q.check('Arcturus').correct);
  q.options.filter((o) => o !== 'Arcturus').forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
  assert.match(q.check('Arcturus').message, /first draft/i);
});

test('orion-belt-pointers: accepts the one fully-correct mapping, rejects a single wrong field', () => {
  const q = findQuestion(makeQuestions(StarPatterns), 'orion-belt-pointers');
  const correctValue = { awayFromMintaka: 'Sirius', awayFromAlnilam: 'Aldebaran', beyondThatStar: 'The Pleiades' };
  assert.ok(q.check(correctValue).correct);
  assert.equal(q.check({ ...correctValue, awayFromMintaka: 'Aldebaran' }).correct, false);
});

test('square-of-pegasus-pointers: accepts the one fully-correct mapping, rejects a single wrong field', () => {
  const q = findQuestion(makeQuestions(StarPatterns), 'square-of-pegasus-pointers');
  const correctValue = { westernSide: 'Fomalhaut', diagonal: 'The Andromeda Galaxy' };
  assert.ok(q.check(correctValue).correct);
  assert.equal(q.check({ ...correctValue, diagonal: 'Fomalhaut' }).correct, false);
});

// --- "Which is it?" picture-tap game --------------------------------------

test('PHENOMENA_GRID_ORDER has exactly the 14 tappable grid pictures, each key unique', () => {
  assert.equal(PHENOMENA_GRID_ORDER.length, 14);
  assert.equal(new Set(PHENOMENA_GRID_ORDER).size, 14);
});

test('there is exactly one which-is-it-* question per grid picture, in the same order as PHENOMENA_GRID_ORDER', () => {
  const questions = makeQuestions(StarPatterns);
  const whichIsIt = questions.filter((q) => q.id.startsWith('which-is-it-'));
  assert.equal(whichIsIt.length, 14);
  assert.deepEqual(whichIsIt.map((q) => q.id), PHENOMENA_GRID_ORDER.map((key) => `which-is-it-${key}`));
});

test('every picture is the correct answer to exactly one which-is-it-* question across a full round', () => {
  const questions = makeQuestions(StarPatterns);
  const whichIsIt = questions.filter((q) => q.id.startsWith('which-is-it-'));
  const correctKeys = whichIsIt.map((q) => q.correctKey);
  assert.equal(new Set(correctKeys).size, 14, 'every correctKey should be distinct');
  PHENOMENA_GRID_ORDER.forEach((key) => assert.ok(correctKeys.includes(key), `${key} is never a correct answer`));
});

test('each which-is-it-* question only accepts its own grid key, tagged u1.1', () => {
  const questions = makeQuestions(StarPatterns);
  const whichIsIt = questions.filter((q) => q.id.startsWith('which-is-it-'));
  whichIsIt.forEach((q) => {
    assert.deepEqual(q.units, ['u1.1']);
    assert.ok(q.check(q.correctKey).correct);
    PHENOMENA_GRID_ORDER.filter((key) => key !== q.correctKey).forEach((key) => {
      assert.equal(q.check(key).correct, false, `${q.id} should reject "${key}"`);
    });
  });
});

test('every which-is-it-* question has a non-empty clue, and the 13 with a matching practice question reuse its exact clue text', () => {
  const questions = makeQuestions(StarPatterns);
  const whichIsIt = questions.filter((q) => q.id.startsWith('which-is-it-'));
  const GRID_KEY_TO_PHENOMENON_ID = {
    sun: 'sun', moon: 'moon', stars: 'star', satellites: 'satellite',
    aircraft: 'aircraft', planets: 'planet', meteors: 'meteor', comets: 'comet',
    aurorae: 'aurora', supernovae: 'supernova', doubleStar: 'doubleStar',
    starClusters: 'starCluster', milkyWay: 'milkyWay',
  };
  whichIsIt.forEach((q) => {
    assert.ok(q.prompt && q.prompt.length > 0, `${q.id} has no clue`);
    const phenomenonId = GRID_KEY_TO_PHENOMENON_ID[q.correctKey];
    if (!phenomenonId) return; // galaxiesNebulae: no phenomenon-* counterpart, see src/nakedEyeSkyQuestions.js
    const phenomenon = PHENOMENA.find((p) => p.id === phenomenonId);
    assert.equal(q.prompt, phenomenon.clue, `${q.id} should reuse the practice question's own clue text`);
  });
});
