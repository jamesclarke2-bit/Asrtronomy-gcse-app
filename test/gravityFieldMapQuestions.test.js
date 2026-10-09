const test = require('node:test');
const assert = require('node:assert/strict');
const GravityField = require('../src/gravityField');
const OrbitalMechanics = require('../src/orbitalMechanics');
const Tides = require('../src/tides');
const { makeQuestions } = require('../src/gravityFieldMapQuestions');
const { getSubtopic } = require('../src/curriculum');

function findQuestion(questions, id) {
  const q = questions.find((question) => question.id === id);
  assert.ok(q, `question ${id} not found`);
  return q;
}

test('em-zero-field-distance: accepts the engine\'s own distance, in km', () => {
  const q = findQuestion(makeQuestions(GravityField, OrbitalMechanics, Tides), 'em-zero-field-distance');
  const earth = { mass: OrbitalMechanics.EARTH_MASS_KG, x: 0, y: 0 };
  const moon = { mass: Tides.MOON_MASS_KG, x: Tides.MOON_DISTANCE_KM * 1000, y: 0 };
  const zero = GravityField.zeroFieldPointBetween(earth, moon);
  assert.ok(q.check(zero.distanceFromA / 1000).correct);
  assert.equal(q.check(zero.distanceFromA / 1000 / 2).correct, false, 'the midpoint should not be accepted');
});

// --- "two reasonable sets of constants" ------------------------------------
//
// Set A is this module's own figures (OrbitalMechanics.EARTH_MASS_KG,
// Tides.MOON_MASS_KG/MOON_DISTANCE_KM, OrbitalMechanics.SOLAR_MASS_KG/AU_M —
// exactly what gravityFieldMapQuestions.js uses). Set B is a second,
// independently-reasonable textbook rounding of the same bodies — not
// cherry-picked to agree, just a different plausible set a student
// might have memorised. Both should land inside each question's stated
// tolerance, confirming that tolerance isn't just wide enough for one
// specific set of constants to happen to pass.
const SET_B = {
  earthMassKg: 5.97e24,
  moonMassKg: 7.35e22,
  earthMoonDistanceM: 384400000,
  sunMassKg: 1.989e30,
  sunEarthDistanceM: 149600000000,
};

test('em-zero-field-distance: accepts the answer computed with a second reasonable set of constants', () => {
  const q = findQuestion(makeQuestions(GravityField, OrbitalMechanics, Tides), 'em-zero-field-distance');
  const earthB = { mass: SET_B.earthMassKg, x: 0, y: 0 };
  const moonB = { mass: SET_B.moonMassKg, x: SET_B.earthMoonDistanceM, y: 0 };
  const zeroB = GravityField.zeroFieldPointBetween(earthB, moonB);
  assert.ok(q.check(zeroB.distanceFromA / 1000).correct);
});

test('zero-field-vs-l1: the rotating-frame explanation is the only correct option', () => {
  const q = findQuestion(makeQuestions(GravityField, OrbitalMechanics, Tides), 'zero-field-vs-l1');
  assert.ok(
    q.check(
      "L1 is defined in the frame rotating with the Moon: there, the Moon's pull only needs to partly cancel Earth's (not fully) for the remaining net pull to supply exactly the centripetal force needed to orbit in step with the Moon once a lunar month — and that balance happens a little nearer Earth than where the two pulls cancel completely"
    ).correct
  );
  assert.equal(q.check('They are the same point really — the ~20,000 km gap is just rounding error in the calculation').correct, false);
});

test('em-l1-distance: accepts the engine\'s own L1 distance, and the same answer from a second set of constants', () => {
  const q = findQuestion(makeQuestions(GravityField, OrbitalMechanics, Tides), 'em-l1-distance');
  const lp = GravityField.collinearLagrangePoints(OrbitalMechanics.EARTH_MASS_KG, Tides.MOON_MASS_KG, Tides.MOON_DISTANCE_KM * 1000);
  assert.ok(q.check(lp.L1.distanceFromLarger / 1000).correct);

  const lpB = GravityField.collinearLagrangePoints(SET_B.earthMassKg, SET_B.moonMassKg, SET_B.earthMoonDistanceM);
  assert.ok(q.check(lpB.L1.distanceFromLarger / 1000).correct, 'should still be accepted with a second reasonable set of constants');

  assert.equal(q.check(EARTH_MOON_ZERO_FIELD_KM_FOR_REJECTION_TEST()).correct, false, 'the zero-field point distance should not be accepted as L1');

  function EARTH_MOON_ZERO_FIELD_KM_FOR_REJECTION_TEST() {
    const earth = { mass: OrbitalMechanics.EARTH_MASS_KG, x: 0, y: 0 };
    const moon = { mass: Tides.MOON_MASS_KG, x: Tides.MOON_DISTANCE_KM * 1000, y: 0 };
    return GravityField.zeroFieldPointBetween(earth, moon).distanceFromA / 1000;
  }
});

test('se-l1-fraction: accepts ~1% from both sets of constants', () => {
  const q = findQuestion(makeQuestions(GravityField, OrbitalMechanics, Tides), 'se-l1-fraction');
  const lp = GravityField.collinearLagrangePoints(OrbitalMechanics.SOLAR_MASS_KG, OrbitalMechanics.EARTH_MASS_KG, OrbitalMechanics.AU_M);
  const fraction = (100 * lp.L1.distanceFromSmaller) / OrbitalMechanics.AU_M;
  assert.ok(q.check(fraction).correct);
  assert.ok(fraction > 0.5 && fraction < 2, 'sanity: this should be "about 1%", not some other order of magnitude');

  const lpB = GravityField.collinearLagrangePoints(SET_B.sunMassKg, SET_B.earthMassKg, SET_B.sunEarthDistanceM);
  const fractionB = (100 * lpB.L1.distanceFromSmaller) / SET_B.sunEarthDistanceM;
  assert.ok(q.check(fractionB).correct, 'should still be accepted with a second reasonable set of constants');

  assert.equal(q.check(10).correct, false);
});

test('lagrange-stability-threshold: "about 25" is the only correct option', () => {
  const q = findQuestion(makeQuestions(GravityField, OrbitalMechanics, Tides), 'lagrange-stability-threshold');
  assert.ok(q.check('About 25').correct);
  assert.equal(q.check('About 2.5').correct, false);
  assert.equal(q.check('About 250').correct, false);
});

test('em-l4l5-stability: "stable, 81 clears the threshold" is the only correct option', () => {
  const q = findQuestion(makeQuestions(GravityField, OrbitalMechanics, Tides), 'em-l4l5-stability');
  assert.ok(q.check('Yes — 81 is comfortably above the ≈25 threshold, so L4 and L5 are stable').correct);
  assert.equal(q.check('No — 81 is below the threshold, so they are unstable').correct, false);
  // Cross-check against the engine directly, not just the question's own option text.
  assert.equal(GravityField.isEquilateralPointStable(OrbitalMechanics.EARTH_MASS_KG, Tides.MOON_MASS_KG), true);
});

test('coriolis-role: the Coriolis-force explanation is the only correct option', () => {
  const q = findQuestion(makeQuestions(GravityField, OrbitalMechanics, Tides), 'coriolis-role');
  assert.ok(
    q.check(
      "The Coriolis force — present only because the frame is rotating, it acts on any velocity the mass picks up as it starts to slide, curving its path back around rather than letting it coast straight away down the slope"
    ).correct
  );
  assert.equal(q.check('Friction with the thin interplanetary medium slows it down before it can slide far').correct, false);
});

test('zero-field-bound-or-escaping: "bound, since total energy is negative" is the only correct option, and matches the engine', () => {
  const q = findQuestion(makeQuestions(GravityField, OrbitalMechanics, Tides), 'zero-field-bound-or-escaping');
  assert.ok(
    q.check(
      "Bound — the net force happens to be zero there, but its total specific energy (zero kinetic energy, plus negative potential energy from both Earth and the Moon) is still negative, which counts as bound even though it won't stay at that unstable balance point for long"
    ).correct
  );
  assert.equal(
    q.check('Escaping — zero net force means zero net energy too, so it is exactly on the boundary between bound and unbound').correct,
    false
  );

  const earth = { mass: OrbitalMechanics.EARTH_MASS_KG, x: 0, y: 0 };
  const moon = { mass: Tides.MOON_MASS_KG, x: Tides.MOON_DISTANCE_KM * 1000, y: 0 };
  const zero = GravityField.zeroFieldPointBetween(earth, moon);
  const potential = GravityField.potentialAt([earth, moon], { x: zero.x, y: zero.y });
  const total = GravityField.kineticEnergyPerMass(0) + potential;
  assert.equal(GravityField.classifyOrbit(total, potential), 'bound');
});

test('every question only tags u3.x extension ids that actually exist in curriculum.js, and none claim a real spec point', () => {
  const questions = makeQuestions(GravityField, OrbitalMechanics, Tides);
  questions.forEach((q) => {
    q.units.forEach((id) => {
      const subtopic = getSubtopic(id);
      assert.ok(subtopic, `${q.id} references missing subtopic "${id}"`);
      assert.equal(subtopic.level, 'extension', `${q.id}'s unit "${id}" should be level:'extension'`);
      assert.equal(subtopic.spec, undefined, `${q.id}'s unit "${id}" is extension content and should not carry a spec tag`);
    });
  });
});
