/**
 * src/allQuestions.js: the flattened list of every practice question
 * sitewide, checked against each individual question file's own real
 * count (so dropping one from the aggregator's wiring, by accident,
 * fails loudly here rather than just quietly under-counting on
 * notes/syllabus-map.html) and against curriculum.js's own ids.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { getAllQuestionsNode } = require('../src/allQuestions');
const { getSubtopic } = require('../src/curriculum');

const SolarPosition = require('../src/solarPosition');
const Coordinates = require('../src/coordinates');
const ShadowGeometry = require('../src/shadowGeometry');
const OrbitalMechanics = require('../src/orbitalMechanics');
const SpecData = require('../src/specData');
const GravityField = require('../src/gravityField');
const Tides = require('../src/tides');
const PlanetaryMotion = require('../src/planetaryMotion');
const MoonPhase = require('../src/moonPhase');
const ButterflyDiagram = require('../src/butterflyDiagram');
const TelescopeModel = require('../src/telescopeModel');
const RayOptics = require('../src/rayOptics');
const StarPatterns = require('../src/starPatterns');

test('getAllQuestionsNode returns a non-empty array, every question carrying a non-empty units array', () => {
  const questions = getAllQuestionsNode();
  assert.ok(questions.length > 50, `expected several dozen questions, found ${questions.length}`);
  questions.forEach((q) => {
    assert.ok(Array.isArray(q.units) && q.units.length > 0, `${q.id || '(no id)'} has no units`);
  });
});

test('getAllQuestionsNode: every question id is unique across the whole site', () => {
  const questions = getAllQuestionsNode();
  const ids = questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length, 'a question id is reused across two different pages');
});

test('getAllQuestionsNode: every tagged unit id resolves to a real curriculum subtopic', () => {
  const questions = getAllQuestionsNode();
  questions.forEach((q) => {
    q.units.forEach((id) => {
      assert.ok(getSubtopic(id), `${q.id} tags unknown curriculum id "${id}"`);
    });
  });
});

test("getAllQuestionsNode's total is exactly the sum of every individual question file's own count — nothing silently dropped", () => {
  const { QUESTIONS: sunPath } = require('../src/questions');
  const { QUESTIONS: eot } = require('../src/eotQuestions');
  const { makeQuestions: makeArchaeoastronomy } = require('../src/archaeoastronomyQuestions');
  const { makeQuestions: makeCoordinates } = require('../src/coordinatesQuestions');
  const { makeQuestions: makeEarthStructure } = require('../src/earthStructureQuestions');
  const { makeQuestions: makeGeocentricHeliocentric } = require('../src/geocentricHeliocentricQuestions');
  const { makeQuestions: makeGravitationalPotential } = require('../src/gravitationalPotentialQuestions');
  const { makeQuestions: makeGravityFieldMap } = require('../src/gravityFieldMapQuestions');
  const { makeQuestions: makeKepler } = require('../src/keplerQuestions');
  const { makeQuestions: makeMeasuringTheSky } = require('../src/measuringTheSkyQuestions');
  const { makeQuestions: makeMoonStructure } = require('../src/moonStructureQuestions');
  const { makeQuestions: makeNakedEyeSky } = require('../src/nakedEyeSkyQuestions');
  const { makeQuestions: makeOrbitsGravity } = require('../src/orbitsGravityQuestions');
  const { makeQuestions: makePlanetaryMotion } = require('../src/planetaryMotionQuestions');
  const { makeQuestions: makeScaleOfSolarSystem } = require('../src/scaleOfSolarSystemQuestions');
  const { makeQuestions: makeShadowsAndSundials } = require('../src/shadowsAndSundialsQuestions');
  const { makeQuestions: makeSiderealSynodic } = require('../src/siderealSynodicQuestions');
  const { makeQuestions: makeSolarActivity } = require('../src/solarActivityQuestions');
  const { makeQuestions: makeSolarSystemBodies } = require('../src/solarSystemBodiesQuestions');
  const { makeQuestions: makeSunDeclination } = require('../src/sunDeclinationQuestions');
  const { makeQuestions: makeTelescope } = require('../src/telescopeQuestions');
  const { makeQuestions: makeTides } = require('../src/tidesQuestions');

  const expectedTotal =
    sunPath.length +
    eot.length +
    makeArchaeoastronomy(MoonPhase).length +
    makeCoordinates(Coordinates, null, null, SpecData).length +
    makeEarthStructure(SpecData).length +
    makeGeocentricHeliocentric().length +
    makeGravitationalPotential(GravityField, OrbitalMechanics).length +
    makeGravityFieldMap(GravityField, OrbitalMechanics, Tides).length +
    makeKepler(OrbitalMechanics, SpecData).length +
    makeMeasuringTheSky(SpecData).length +
    makeMoonStructure(SpecData, MoonPhase).length +
    makeNakedEyeSky(StarPatterns).length +
    makeOrbitsGravity(OrbitalMechanics).length +
    makePlanetaryMotion(PlanetaryMotion).length +
    makeScaleOfSolarSystem(SpecData).length +
    makeShadowsAndSundials(ShadowGeometry, SolarPosition).length +
    makeSiderealSynodic(MoonPhase).length +
    makeSolarActivity(ButterflyDiagram).length +
    makeSolarSystemBodies(SpecData).length +
    makeSunDeclination({ getSunPosition: SolarPosition.getSunPosition }, Coordinates).length +
    makeTelescope(TelescopeModel, RayOptics).length +
    makeTides(Tides).length;

  assert.equal(getAllQuestionsNode().length, expectedTotal);
});
