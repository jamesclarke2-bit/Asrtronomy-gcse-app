const test = require('node:test');
const assert = require('node:assert/strict');
const SpecData = require('../src/specData');
const OrbitalMechanics = require('../src/orbitalMechanics');

// Exam-sheet values are rounded to ~2 significant figures; the engine's
// PLANETARY_DATA is precise to 3-4. 3% comfortably covers every real gap
// between the two (the worst, Mars's distance, is ~1.6%) while still
// catching an actual typo or drift.
const TOLERANCE = 0.03;

function relativeDifference(a, b) {
  return Math.abs(a - b) / b;
}

test('every body in specData.js has a matching name in OrbitalMechanics.PLANETARY_DATA', () => {
  SpecData.PLANETARY_DATA.forEach((specBody) => {
    const engineBody = OrbitalMechanics.PLANETARY_DATA.find((b) => b.name === specBody.name);
    assert.ok(engineBody, `${specBody.name} is in specData.js but not in OrbitalMechanics.PLANETARY_DATA`);
  });
});

test("each body's exam-sheet distance and period agree with the engine's precise value within normal rounding", () => {
  SpecData.PLANETARY_DATA.forEach((specBody) => {
    const engineBody = OrbitalMechanics.PLANETARY_DATA.find((b) => b.name === specBody.name);
    const distanceDiff = relativeDifference(specBody.distanceAU, engineBody.semiMajorAxisAU);
    const periodDiff = relativeDifference(specBody.periodYears, engineBody.periodYears);
    assert.ok(
      distanceDiff <= TOLERANCE,
      `${specBody.name}: spec distance ${specBody.distanceAU} AU vs engine ${engineBody.semiMajorAxisAU} AU differ by ${(distanceDiff * 100).toFixed(1)}%`
    );
    assert.ok(
      periodDiff <= TOLERANCE,
      `${specBody.name}: spec period ${specBody.periodYears} yr vs engine ${engineBody.periodYears} yr differ by ${(periodDiff * 100).toFixed(1)}%`
    );
  });
});

test('every body also satisfies the exam-sheet form of Kepler’s third law, T²/r³ = constant ≈ 1, within rounding', () => {
  SpecData.PLANETARY_DATA.forEach((body) => {
    const constant = OrbitalMechanics.tSquaredOverRCubed(body.periodYears, body.distanceAU);
    assert.ok(
      Math.abs(constant - 1) <= 0.1,
      `${body.name}: T²/r³ = ${constant.toFixed(3)}, expected close to 1`
    );
  });
});

test('Makemake is in the engine data but has no exam-sheet entry, and is excluded from specData.js', () => {
  assert.ok(OrbitalMechanics.PLANETARY_DATA.some((b) => b.name === 'Makemake'));
  assert.ok(!SpecData.PLANETARY_DATA.some((b) => b.name === 'Makemake'));
});

test('specData.js lists exactly the engine’s planets and dwarf planets minus Makemake', () => {
  assert.equal(SpecData.PLANETARY_DATA.length, OrbitalMechanics.PLANETARY_DATA.length - 1);
});

test('derived decimal-hour values match their stated hours/minutes', () => {
  assert.equal(SpecData.CONSTANTS.siderealDayHours, 23 + 56 / 60);
  assert.equal(SpecData.CONSTANTS.synodicDayHours, 24);
});

test('the parsec-in-light-years constant is consistent with the parsec and light year distances, within rounding', () => {
  const derived = SpecData.CONSTANTS.parsecKm / SpecData.CONSTANTS.lightYearKm;
  assert.ok(relativeDifference(derived, SpecData.CONSTANTS.parsecLightYears) <= TOLERANCE);
});
