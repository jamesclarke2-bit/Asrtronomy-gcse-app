const test = require('node:test');
const assert = require('node:assert/strict');
const Coordinates = require('../src/coordinates');
const { makeQuestions, generateChainedQuestion, CHAINED_PARAM_PRESETS } = require('../src/coordinatesQuestions');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

// --- Misconception 1: hour angle sign -----------------------------------

test('ha-sign-1: RA 10h at LST 8h30m, correct 1h 30m magnitude and transited choice is correct', () => {
  const questions = makeQuestions(Coordinates, null);
  const q = findQuestion(questions, 'ha-sign-1');
  const good = q.check({ transited: 'No, not yet transited', haHours: 1, haMinutes: 30 });
  assert.ok(good.correct);
});

test('ha-sign-1: correct magnitude but wrong transited choice is marked wrong', () => {
  const questions = makeQuestions(Coordinates, null);
  const q = findQuestion(questions, 'ha-sign-1');
  const wrongTransited = q.check({ transited: 'Yes, already transited', haHours: 1, haMinutes: 30 });
  assert.equal(wrongTransited.correct, false);
});

test('ha-sign-1: correct transited choice but wrong magnitude is marked wrong', () => {
  const questions = makeQuestions(Coordinates, null);
  const q = findQuestion(questions, 'ha-sign-1');
  const wrongMagnitude = q.check({ transited: 'No, not yet transited', haHours: 5, haMinutes: 0 });
  assert.equal(wrongMagnitude.correct, false);
});

test('ha-sign-1: a negative h/m entry is read as a magnitude, not double-penalised', () => {
  const questions = makeQuestions(Coordinates, null);
  const q = findQuestion(questions, 'ha-sign-1');
  const negativeEntry = q.check({ transited: 'No, not yet transited', haHours: -1, haMinutes: -30 });
  assert.ok(negativeEntry.correct);
});

test('ha-sign-2: RA 14h at LST 17h15m has transited, HA is 3h 15m', () => {
  const questions = makeQuestions(Coordinates, null);
  const q = findQuestion(questions, 'ha-sign-2');
  const good = q.check({ transited: 'Yes, already transited', haHours: 3, haMinutes: 15 });
  assert.ok(good.correct);
  const wrongTransited = q.check({ transited: 'No, not yet transited', haHours: 3, haMinutes: 15 });
  assert.equal(wrongTransited.correct, false);
});

// --- Misconception 2: equinox + southern hemisphere ----------------------

test('sydney-equinox: correct pair is 56deg / due north', () => {
  const questions = makeQuestions(Coordinates, null);
  const q = findQuestion(questions, 'sydney-equinox');
  const correct = q.check({ altitude: '56°', azimuth: 'Due north (0°)' });
  assert.ok(correct.correct);
});

test('sydney-equinox: the two targeted misconceptions are both marked wrong', () => {
  const questions = makeQuestions(Coordinates, null);
  const q = findQuestion(questions, 'sydney-equinox');
  const overheadMisconception = q.check({ altitude: '90°', azimuth: 'Due north (0°)' });
  assert.equal(overheadMisconception.correct, false);
  const southMisconception = q.check({ altitude: '56°', azimuth: 'Due south (180°)' });
  assert.equal(southMisconception.correct, false);
});

// --- Misconception 3: circumpolarity at the equator -----------------------

test('circumpolarity at the equator is "rises and sets normally" across a range of declinations', () => {
  const questions = makeQuestions(Coordinates, null);
  ['circumpolar-equator-1', 'circumpolar-equator-2', 'circumpolar-equator-3'].forEach((id) => {
    const q = findQuestion(questions, id);
    const correct = q.check('Rises and sets normally');
    assert.ok(correct.correct, `${id} should accept "Rises and sets normally"`);
    const wrong = q.check('Circumpolar (never sets)');
    assert.equal(wrong.correct, false, `${id} should reject "Circumpolar"`);
  });
});

// --- Misconception 4: diagram reading (live state) -------------------------

test('diagram-reading question grades against live state, not a fixed scenario', () => {
  let state = { dec: 38.8, lat: 56, haDegrees: 0 };
  const questions = makeQuestions(Coordinates, () => state);
  const q = findQuestion(questions, 'diagram-reading');
  assert.ok(q.check(72.8).correct);

  // Change the live state (as if the user dragged the diagram) and
  // confirm the question now grades against the NEW state.
  state = { dec: 38.8, lat: 56, haDegrees: 90 };
  const { altitude } = Coordinates.getAltAz(38.8, 90, 56);
  assert.ok(q.check(altitude).correct);
  assert.equal(q.check(72.8).correct, false);
});

test('diagram-reading question is omitted when no live-state getter is supplied', () => {
  const questions = makeQuestions(Coordinates, null);
  assert.equal(questions.some((q) => q.id === 'diagram-reading'), false);
});

test('diagram-reading question calls the highlight hook when supplied', () => {
  const state = { dec: 38.8, lat: 56, haDegrees: 0 };
  let highlightCalls = 0;
  const questions = makeQuestions(Coordinates, () => state, () => {
    highlightCalls += 1;
  });
  const q = findQuestion(questions, 'diagram-reading');
  assert.equal(typeof q.onAnswered, 'function');
  q.onAnswered();
  assert.equal(highlightCalls, 1);
});

test('diagram-reading question tolerates a missing highlight hook', () => {
  const state = { dec: 38.8, lat: 56, haDegrees: 0 };
  const questions = makeQuestions(Coordinates, () => state);
  const q = findQuestion(questions, 'diagram-reading');
  assert.doesNotThrow(() => q.onAnswered());
});

// --- Chained multi-part question: the 4 reference exam cases ---------------

test('reference case 1: Aldebaran (Rome -> Oxford) max altitude 54d45m', () => {
  const q = generateChainedQuestion(Coordinates, { starLabel: 'Aldebaran', dec: 16.5, lat: 51.75, haDegrees: 91.5 });
  const p2 = q.parts.find((p) => p.id === 'p2');
  const p5 = q.parts.find((p) => p.id === 'p5');

  const p2Result = p2.check(73.5);
  assert.ok(p2Result.correct);

  const p5Result = p5.check(54.75, { p2: 73.5 });
  assert.ok(p5Result.correct);
});

test('reference case 2: Polaris/Vega at Edinburgh', () => {
  // Polaris treated as exactly at the NCP: altitude = latitude, azimuth 0.
  const polaris = Coordinates.getAltAz(90, 0, 56);
  assert.ok(Math.abs(polaris.altitude - 56) < 0.01);
  assert.ok(Math.abs(polaris.azimuth - 0) < 0.01);

  const q = generateChainedQuestion(Coordinates, { starLabel: 'Vega', dec: 38.8, lat: 56, haDegrees: 0 });
  const p4 = q.parts.find((p) => p.id === 'p4');
  // Vega's declination (38.8) is less than Edinburgh's latitude (56), so
  // it transits south of the zenith: azimuth 180, not 0.
  const result = p4.check({ altitude: 72.8, azimuth: 180 });
  assert.ok(result.correct);
});

test('reference case 3: circumpolar upper transit, NCP altitude 68, dec +70 -> 88deg', () => {
  const q = generateChainedQuestion(Coordinates, { starLabel: 'a circumpolar star', dec: 70, lat: 68, haDegrees: 0 });
  const p2 = q.parts.find((p) => p.id === 'p2');
  const p3 = q.parts.find((p) => p.id === 'p3');
  const p5 = q.parts.find((p) => p.id === 'p5');

  const p2Result = p2.check(20);
  assert.ok(p2Result.correct);

  const p3Result = p3.check('Circumpolar (never sets)', { p2: 20 });
  assert.ok(p3Result.correct);

  const p5Result = p5.check(88, { p2: 20 });
  assert.ok(p5Result.correct);
});

test('reference case 4: Sydney equinox noon, altitude 56deg azimuth 0', () => {
  const q = generateChainedQuestion(Coordinates, { starLabel: 'the Sun', dec: 0, lat: -34, haDegrees: 0 });
  const p4 = q.parts.find((p) => p.id === 'p4');
  const result = p4.check({ altitude: 56, azimuth: 0 });
  assert.ok(result.correct);
});

// --- Error-carried-forward mechanics ---------------------------------------

test('part 3 follows the student\'s own (wrong) part-2 answer, not the true one', () => {
  // True polar distance for dec=70 is 20, which is circumpolar at lat=68.
  // A student who miscalculates polar distance as 100 (e.g. adding
  // instead of subtracting from 90, or a sign slip) should be marked
  // correct in part 3 for correctly applying the rule to THEIR OWN wrong
  // figure (100 is neither <=68 nor >=112, so "rises and sets normally"
  // is the right method-consistent call), even though the true star is
  // actually circumpolar.
  const q = generateChainedQuestion(Coordinates, { starLabel: 'a circumpolar star', dec: 70, lat: 68, haDegrees: 0 });
  const p3 = q.parts.find((p) => p.id === 'p3');

  const consistentWithOwnWrongWorking = p3.check('Rises and sets normally', { p2: 100 });
  assert.ok(consistentWithOwnWrongWorking.correct, 'should follow the student\'s own wrong polar distance');

  const consistentWithTrueAnswerButNotOwnWorking = p3.check('Circumpolar (never sets)', { p2: 100 });
  assert.equal(consistentWithTrueAnswerButNotOwnWorking.correct, false, 'true classification does not match their own (wrong) working');
});

test('part 5 follows the student\'s own (wrong) part-2 answer, not the true one', () => {
  const q = generateChainedQuestion(Coordinates, { starLabel: 'Aldebaran', dec: 16.5, lat: 51.75, haDegrees: 91.5 });
  const p5 = q.parts.find((p) => p.id === 'p5');

  // Student got polar distance wrong (used 70 instead of 73.5), but
  // applies the correct formula to their own figure:
  // 90 - |70 - 38.25| = 58.25
  const followThrough = p5.check(58.25, { p2: 70 });
  assert.ok(followThrough.correct);

  // The TRUE answer (54.75) should NOT be accepted when it's
  // inconsistent with their own part-2 working.
  const trueAnswerButInconsistent = p5.check(54.75, { p2: 70 });
  assert.equal(trueAnswerButInconsistent.correct, false);
});

test('parts 3 and 5 refuse to grade when part 2 has not been answered', () => {
  const q = generateChainedQuestion(Coordinates, { starLabel: 'Aldebaran', dec: 16.5, lat: 51.75, haDegrees: 91.5 });
  const p3 = q.parts.find((p) => p.id === 'p3');
  const p5 = q.parts.find((p) => p.id === 'p5');
  assert.equal(p3.check('Rises and sets normally', {}).correct, false);
  assert.equal(p5.check(54.75, {}).correct, false);
});

// --- Chained question is genuinely parametrised, not hard-coded -----------

test('the chained question regenerates different scenarios from different presets', () => {
  assert.ok(CHAINED_PARAM_PRESETS.length >= 3);
  const generated = CHAINED_PARAM_PRESETS.map((params) => generateChainedQuestion(Coordinates, params));
  const prompts = generated.map((q) => q.parts.find((p) => p.id === 'p2').prompt);
  assert.equal(new Set(prompts).size, prompts.length, 'each preset should produce a distinct part-2 prompt');
});

test('part 1 accepts right ascension and declination in either order or case', () => {
  const q = generateChainedQuestion(Coordinates, CHAINED_PARAM_PRESETS[0]);
  const p1 = q.parts.find((p) => p.id === 'p1');
  assert.ok(p1.check('Right ascension and declination').correct);
  assert.ok(p1.check('declination and RA').correct);
  assert.equal(p1.check('altitude and azimuth').correct, false);
});
