const test = require('node:test');
const assert = require('node:assert/strict');
const { makeQuestions } = require('../src/archaeoastronomyQuestions');
const MoonPhase = require('../src/moonPhase');
const TunnelAlignment = require('../src/tunnelAlignment');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('makeQuestions returns 11 questions, each tagged u3.5 and/or u2.29 only', () => {
  const questions = makeQuestions(MoonPhase, TunnelAlignment);
  assert.equal(questions.length, 11);
  questions.forEach((q) => {
    assert.ok(Array.isArray(q.units) && q.units.length > 0, `${q.id} has no units`);
    q.units.forEach((id) => assert.ok(['u3.5', 'u2.29'].includes(id), `${q.id} tags unexpected unit "${id}"`));
  });
});

test('every question id is unique', () => {
  const ids = makeQuestions(MoonPhase, TunnelAlignment).map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('the two calendar/seasons questions tag only u3.5', () => {
  const questions = makeQuestions(MoonPhase, TunnelAlignment);
  ['lunar-month-not-whole-number-of-year', 'sun-not-moon-for-seasons'].forEach((id) => {
    assert.deepEqual(findQuestion(questions, id).units, ['u3.5']);
  });
});

test('lunar-month-not-whole-number-of-year: states the month and year lengths it needs in its own prompt text', () => {
  const q = findQuestion(makeQuestions(MoonPhase, TunnelAlignment), 'lunar-month-not-whole-number-of-year');
  assert.match(q.prompt, /\d/);
});

test('lunar-month-not-whole-number-of-year: the ~12.37-months, not-a-whole-number option is the only correct one', () => {
  const questions = makeQuestions(MoonPhase, TunnelAlignment);
  const q = findQuestion(questions, 'lunar-month-not-whole-number-of-year');
  const correctOption = q.options.find((o) => o.startsWith('About 12.37 lunar months'));
  assert.ok(correctOption);
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});

test('lunar-month-not-whole-number-of-year: quotes the live SYNODIC_MONTH_DAYS figure, not a hand-typed one', () => {
  const questions = makeQuestions(MoonPhase, TunnelAlignment);
  const q = findQuestion(questions, 'lunar-month-not-whole-number-of-year');
  assert.ok(q.prompt.includes(MoonPhase.SYNODIC_MONTH_DAYS.toFixed(1)));
});

test('sun-not-moon-for-seasons: the axial-tilt explanation is the only correct option', () => {
  const questions = makeQuestions(MoonPhase, TunnelAlignment);
  const q = findQuestion(questions, 'sun-not-moon-for-seasons');
  const correctOption = q.options.find((o) => o.startsWith("The seasons are caused by Earth's axial tilt"));
  assert.ok(correctOption);
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});

test('precession-quarter-and-half-cycle: states the 26,000-year cycle, accepts 6,500/13,000 within 2%, rejects one wrong field', () => {
  const q = findQuestion(makeQuestions(MoonPhase, TunnelAlignment), 'precession-quarter-and-half-cycle');
  assert.ok(q.prompt.includes('26,000'));
  assert.ok(q.check({ quarterYears: 6500, halfYears: 13000 }).correct);
  assert.equal(q.check({ quarterYears: 6500, halfYears: 20000 }).correct, false);
  assert.equal(q.check({ quarterYears: 2000, halfYears: 13000 }).correct, false);
});

test('precession-years-per-degree: states the 50 arcsecond/year rate, accepts ~72 within 2%', () => {
  const q = findQuestion(makeQuestions(MoonPhase, TunnelAlignment), 'precession-years-per-degree');
  assert.ok(q.prompt.includes('50 arcseconds'));
  assert.ok(q.check(72).correct);
  assert.equal(q.check(26000).correct, false);
});

test('why-polaris-not-forever: the axis-direction-swings explanation is the only correct option', () => {
  const questions = makeQuestions(MoonPhase, TunnelAlignment);
  const q = findQuestion(questions, 'why-polaris-not-forever');
  const correctOption = q.options.find((o) => o.startsWith('Because precession slowly swings'));
  assert.ok(correctOption);
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});

test('great-pyramid-thuban-alignment: tags both u2.29 and u3.5, and the "nearest the pole at the time" option is the only correct one', () => {
  const questions = makeQuestions(MoonPhase, TunnelAlignment);
  const q = findQuestion(questions, 'great-pyramid-thuban-alignment');
  assert.deepEqual(q.units, ['u2.29', 'u3.5']);
  const correctOption = q.options.find((o) => o.startsWith('Because at the time the pyramid was built'));
  assert.ok(correctOption);
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});

test('alignment-degrees-and-minutes: 77°30′ converts to 77.5°, accepted within 2%', () => {
  const q = findQuestion(makeQuestions(MoonPhase, TunnelAlignment), 'alignment-degrees-and-minutes');
  assert.ok(q.prompt.includes('77 degrees 30 minutes'));
  assert.ok(q.check(77.5).correct);
  assert.equal(q.check(80).correct, false);
});

test('alignment-bearing-from-a-grid: run 8, rise 2 gives a bearing of about 76°, accepted within tolerance', () => {
  const q = findQuestion(makeQuestions(MoonPhase, TunnelAlignment), 'alignment-bearing-from-a-grid');
  const expected = Math.round((Math.atan2(8, 2) * 180) / Math.PI);
  assert.ok(q.check(expected).correct);
  assert.equal(q.check(expected + 10).correct, false);
});

test('alignment-interpolate-azimuth: interpolates halfway between 102.2° and 100.4°, using TunnelAlignment.interpolate', () => {
  const q = findQuestion(makeQuestions(MoonPhase, TunnelAlignment), 'alignment-interpolate-azimuth');
  const expected = TunnelAlignment.interpolate(0, 102.2, 3, 100.4, 1.5);
  assert.ok(Math.abs(expected - 101.3) < 0.05);
  assert.ok(q.check(expected).correct);
  assert.equal(q.check(90).correct, false);
});

test('alignment-evaluate-once-a-year-claim: the "wrong, crosses twice" option is the only correct one, backed by the live engine', () => {
  const questions = makeQuestions(MoonPhase, TunnelAlignment);
  const q = findQuestion(questions, 'alignment-evaluate-once-a-year-claim');
  const windows = TunnelAlignment.alignmentWindows(77, 51.4, 0.5, 2026).sunrise;
  assert.equal(windows.length, 2, 'the engine itself should show two sunrise windows for this scenario');
  const correctOption = q.options.find((o) => o.startsWith('The claim is wrong: the graph crosses'));
  assert.ok(correctOption);
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});

test('alignment-why-sunset-matters: the "setting Sun\'s azimuth" explanation is the only correct option', () => {
  const questions = makeQuestions(MoonPhase, TunnelAlignment);
  const q = findQuestion(questions, 'alignment-why-sunset-matters');
  const correctOption = q.options.find((o) => o.startsWith("Because the setting Sun's azimuth"));
  assert.ok(correctOption);
  assert.ok(q.check(correctOption).correct);
  q.options.filter((o) => o !== correctOption).forEach((o) => {
    assert.equal(q.check(o).correct, false, `"${o}" should not be marked correct`);
  });
});
