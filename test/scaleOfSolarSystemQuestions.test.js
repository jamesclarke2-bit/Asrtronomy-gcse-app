const test = require('node:test');
const assert = require('node:assert/strict');
const SpecData = require('../src/specData');
const { makeQuestions } = require('../src/scaleOfSolarSystemQuestions');
const { getSubtopic } = require('../src/curriculum');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('convert-km-to-au: accepts the data-sheet figure Neptune\'s km distance converts to, and nothing far off it', () => {
  const q = findQuestion(makeQuestions(SpecData), 'convert-km-to-au');
  const neptune = SpecData.PLANETARY_DATA.find((b) => b.name === 'Neptune');
  assert.ok(q.check(neptune.distanceAU).correct);
  assert.equal(q.check(10).correct, false);
});

test('convert-au-to-km: accepts Jupiter\'s AU distance converted to km, within a relative tolerance', () => {
  const q = findQuestion(makeQuestions(SpecData), 'convert-au-to-km');
  const jupiter = SpecData.PLANETARY_DATA.find((b) => b.name === 'Jupiter');
  const expectedKm = jupiter.distanceAU * SpecData.CONSTANTS.auKm;
  assert.ok(q.check(expectedKm).correct);
  assert.equal(q.check(1e8).correct, false);
});

test('convert-ly-to-km: accepts 4.25 light years converted using the data sheet\'s km-per-light-year figure', () => {
  const q = findQuestion(makeQuestions(SpecData), 'convert-ly-to-km');
  const expectedKm = 4.25 * SpecData.CONSTANTS.lightYearKm;
  assert.ok(q.check(expectedKm).correct);
  assert.equal(q.check(1e10).correct, false);
});

test('convert-parsec-to-ly: accepts 2.5 parsecs converted using the data sheet\'s parsec-to-light-year figure', () => {
  const q = findQuestion(makeQuestions(SpecData), 'convert-parsec-to-ly');
  const expected = 2.5 * SpecData.CONSTANTS.parsecLightYears;
  assert.ok(q.check(expected).correct);
  assert.equal(q.check(2).correct, false);
});

test('light-travel-time-mars: accepts the light travel time computed from Mars\'s data-sheet distance and the data-sheet speed of light', () => {
  const q = findQuestion(makeQuestions(SpecData), 'light-travel-time-mars');
  const mars = SpecData.PLANETARY_DATA.find((b) => b.name === 'Mars');
  const km = mars.distanceAU * SpecData.CONSTANTS.auKm;
  const expectedMinutes = (km * 1000) / SpecData.CONSTANTS.speedOfLightMPerS / 60;
  assert.ok(Math.abs(expectedMinutes - 12.5) < 0.1, 'sanity check: Mars light time should be ~12.5 minutes');
  assert.ok(q.check(expectedMinutes).correct);
  assert.equal(q.check(8.3).correct, false);
});

test('why-different-units: the "sensible numbers at each scale" option is the only correct one', () => {
  const q = findQuestion(makeQuestions(SpecData), 'why-different-units');
  assert.ok(
    q.check(
      'Because the AU, light year and parsec are each chosen to keep the numbers in a sensible range at their own scale — interstellar distances in AU, or Solar System distances in light years, would be awkwardly large or tiny'
    ).correct
  );
  assert.equal(q.check('Because distances in km stop being accurate once they get very large').correct, false);
});

test('every question only tags u3.x ids that actually exist in curriculum.js', () => {
  const questions = makeQuestions(SpecData);
  questions.forEach((q) => {
    q.units.forEach((id) => assert.ok(getSubtopic(id), `${q.id} references missing subtopic "${id}"`));
  });
});
