/**
 * Every practice question on the site, across every page, flattened
 * into one array. Built the exact same way each page's own script
 * builds its own questions — the same makeQuestions(...) factories,
 * wired to the same real engine modules each page and its own test
 * file already use — never a second, hand-maintained list of what
 * each page covers, so it can't drift from what a page actually
 * renders.
 *
 * Used by src/syllabusMap.js to answer "does a 'be able to' spec
 * point have practice questions anywhere on the site" (via each
 * question's own `units` tags), not to render or grade anything
 * itself — nothing here depends on a DOM.
 */
(function () {
  function getAllQuestions(deps) {
    const {
      SolarPosition,
      Coordinates,
      ShadowGeometry,
      OrbitalMechanics,
      SpecData,
      GravityField,
      Tides,
      PlanetaryMotion,
      MoonPhase,
      ButterflyDiagram,
      TelescopeModel,
      RayOptics,
      Questions,
      EotQuestions,
      ArchaeoastronomyQuestions,
      CoordinatesQuestions,
      EarthStructureQuestions,
      GeocentricHeliocentricQuestions,
      GravitationalPotentialQuestions,
      GravityFieldMapQuestions,
      KeplerQuestions,
      MeasuringTheSkyQuestions,
      MoonStructureQuestions,
      OrbitsGravityQuestions,
      PlanetaryMotionQuestions,
      ScaleOfSolarSystemQuestions,
      ShadowsAndSundialsQuestions,
      SiderealSynodicQuestions,
      SolarActivityQuestions,
      SolarSystemBodiesQuestions,
      SunDeclinationQuestions,
      TelescopeQuestions,
      TidesQuestions,
    } = deps;

    return [
      ...Questions.QUESTIONS,
      ...EotQuestions.QUESTIONS,
      ...ArchaeoastronomyQuestions.makeQuestions(MoonPhase),
      ...CoordinatesQuestions.makeQuestions(Coordinates, null),
      ...EarthStructureQuestions.makeQuestions(SpecData),
      ...GeocentricHeliocentricQuestions.makeQuestions(),
      ...GravitationalPotentialQuestions.makeQuestions(GravityField, OrbitalMechanics),
      ...GravityFieldMapQuestions.makeQuestions(GravityField, OrbitalMechanics, Tides),
      ...KeplerQuestions.makeQuestions(OrbitalMechanics, SpecData),
      ...MeasuringTheSkyQuestions.makeQuestions(SpecData),
      ...MoonStructureQuestions.makeQuestions(SpecData, MoonPhase),
      ...OrbitsGravityQuestions.makeQuestions(OrbitalMechanics),
      ...PlanetaryMotionQuestions.makeQuestions(PlanetaryMotion),
      ...ScaleOfSolarSystemQuestions.makeQuestions(SpecData),
      ...ShadowsAndSundialsQuestions.makeQuestions(ShadowGeometry, SolarPosition),
      ...SiderealSynodicQuestions.makeQuestions(MoonPhase),
      ...SolarActivityQuestions.makeQuestions(ButterflyDiagram),
      ...SolarSystemBodiesQuestions.makeQuestions(SpecData),
      ...SunDeclinationQuestions.makeQuestions({ getSunPosition: SolarPosition.getSunPosition }, Coordinates),
      ...TelescopeQuestions.makeQuestions(TelescopeModel, RayOptics),
      ...TidesQuestions.makeQuestions(Tides),
    ];
  }

  // Node-only: gathers every real dependency via require() (mirroring
  // each question file's own test file) and returns the flattened list
  // directly, so a caller doesn't have to wire 25 modules by hand.
  function getAllQuestionsNode() {
    return getAllQuestions({
      SolarPosition: require('./solarPosition'),
      Coordinates: require('./coordinates'),
      ShadowGeometry: require('./shadowGeometry'),
      OrbitalMechanics: require('./orbitalMechanics'),
      SpecData: require('./specData'),
      GravityField: require('./gravityField'),
      Tides: require('./tides'),
      PlanetaryMotion: require('./planetaryMotion'),
      MoonPhase: require('./moonPhase'),
      ButterflyDiagram: require('./butterflyDiagram'),
      TelescopeModel: require('./telescopeModel'),
      RayOptics: require('./rayOptics'),
      Questions: require('./questions'),
      EotQuestions: require('./eotQuestions'),
      ArchaeoastronomyQuestions: require('./archaeoastronomyQuestions'),
      CoordinatesQuestions: require('./coordinatesQuestions'),
      EarthStructureQuestions: require('./earthStructureQuestions'),
      GeocentricHeliocentricQuestions: require('./geocentricHeliocentricQuestions'),
      GravitationalPotentialQuestions: require('./gravitationalPotentialQuestions'),
      GravityFieldMapQuestions: require('./gravityFieldMapQuestions'),
      KeplerQuestions: require('./keplerQuestions'),
      MeasuringTheSkyQuestions: require('./measuringTheSkyQuestions'),
      MoonStructureQuestions: require('./moonStructureQuestions'),
      OrbitsGravityQuestions: require('./orbitsGravityQuestions'),
      PlanetaryMotionQuestions: require('./planetaryMotionQuestions'),
      ScaleOfSolarSystemQuestions: require('./scaleOfSolarSystemQuestions'),
      ShadowsAndSundialsQuestions: require('./shadowsAndSundialsQuestions'),
      SiderealSynodicQuestions: require('./siderealSynodicQuestions'),
      SolarActivityQuestions: require('./solarActivityQuestions'),
      SolarSystemBodiesQuestions: require('./solarSystemBodiesQuestions'),
      SunDeclinationQuestions: require('./sunDeclinationQuestions'),
      TelescopeQuestions: require('./telescopeQuestions'),
      TidesQuestions: require('./tidesQuestions'),
    });
  }

  // Browser-only: same idea, reading every dependency off window
  // instead — requires every module below to already be loaded as a
  // <script> on the page before this one.
  function getAllQuestionsBrowser() {
    return getAllQuestions({
      SolarPosition: window.SolarPosition,
      Coordinates: window.Coordinates,
      ShadowGeometry: window.ShadowGeometry,
      OrbitalMechanics: window.OrbitalMechanics,
      SpecData: window.SpecData,
      GravityField: window.GravityField,
      Tides: window.Tides,
      PlanetaryMotion: window.PlanetaryMotion,
      MoonPhase: window.MoonPhase,
      ButterflyDiagram: window.ButterflyDiagram,
      TelescopeModel: window.TelescopeModel,
      RayOptics: window.RayOptics,
      Questions: window.Questions,
      EotQuestions: window.EotQuestions,
      ArchaeoastronomyQuestions: window.ArchaeoastronomyQuestions,
      CoordinatesQuestions: window.CoordinatesQuestions,
      EarthStructureQuestions: window.EarthStructureQuestions,
      GeocentricHeliocentricQuestions: window.GeocentricHeliocentricQuestions,
      GravitationalPotentialQuestions: window.GravitationalPotentialQuestions,
      GravityFieldMapQuestions: window.GravityFieldMapQuestions,
      KeplerQuestions: window.KeplerQuestions,
      MeasuringTheSkyQuestions: window.MeasuringTheSkyQuestions,
      MoonStructureQuestions: window.MoonStructureQuestions,
      OrbitsGravityQuestions: window.OrbitsGravityQuestions,
      PlanetaryMotionQuestions: window.PlanetaryMotionQuestions,
      ScaleOfSolarSystemQuestions: window.ScaleOfSolarSystemQuestions,
      ShadowsAndSundialsQuestions: window.ShadowsAndSundialsQuestions,
      SiderealSynodicQuestions: window.SiderealSynodicQuestions,
      SolarActivityQuestions: window.SolarActivityQuestions,
      SolarSystemBodiesQuestions: window.SolarSystemBodiesQuestions,
      SunDeclinationQuestions: window.SunDeclinationQuestions,
      TelescopeQuestions: window.TelescopeQuestions,
      TidesQuestions: window.TidesQuestions,
    });
  }

  const api = { getAllQuestions, getAllQuestionsNode, getAllQuestionsBrowser };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.AllQuestions = api;
  }
})();
