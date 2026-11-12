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
      StarPatterns,
      TunnelAlignment,
      Parallax,
      Questions,
      EotQuestions,
      ArchaeoastronomyQuestions,
      CoordinatesQuestions,
      EarthStructureQuestions,
      EclipticZodiac,
      EclipticZodiacQuestions,
      GeocentricHeliocentricQuestions,
      GravitationalPotentialQuestions,
      GravityFieldMapQuestions,
      HRDiagram,
      HRDiagramQuestions,
      KeplerQuestions,
      Magnitude,
      MagnitudeQuestions,
      MeasuringTheSkyQuestions,
      MoonPhasesQuestions,
      MoonStructureQuestions,
      NakedEyeSkyQuestions,
      ParallaxQuestions,
      ObservingTechniquesQuestions,
      OrbitsGravityQuestions,
      PlanetaryMotionQuestions,
      ScaleOfSolarSystemQuestions,
      ShadowsAndSundialsQuestions,
      SiderealSynodicQuestions,
      SunFeaturesQuestions,
      SolarSystemBodiesQuestions,
      Spectra,
      SpectraQuestions,
      SpectralTypesQuestions,
      SunDeclinationQuestions,
      SunRotation,
      SunspotRotationQuestions,
      TelescopeQuestions,
      TidesQuestions,
      VisibilityFactors,
    } = deps;

    return [
      ...Questions.QUESTIONS,
      ...EotQuestions.QUESTIONS,
      ...ArchaeoastronomyQuestions.makeQuestions(MoonPhase, TunnelAlignment),
      ...CoordinatesQuestions.makeQuestions(Coordinates, null, null, SpecData),
      ...EarthStructureQuestions.makeQuestions(SpecData),
      ...EclipticZodiacQuestions.makeQuestions(EclipticZodiac, SolarPosition, PlanetaryMotion),
      ...GeocentricHeliocentricQuestions.makeQuestions(),
      ...GravitationalPotentialQuestions.makeQuestions(GravityField, OrbitalMechanics),
      ...GravityFieldMapQuestions.makeQuestions(GravityField, OrbitalMechanics, Tides),
      ...HRDiagramQuestions.makeQuestions(HRDiagram),
      ...KeplerQuestions.makeQuestions(OrbitalMechanics, SpecData),
      ...MagnitudeQuestions.makeQuestions(Magnitude),
      ...MeasuringTheSkyQuestions.makeQuestions(SpecData),
      ...MoonPhasesQuestions.makeQuestions(MoonPhase),
      ...MoonStructureQuestions.makeQuestions(SpecData, MoonPhase),
      ...NakedEyeSkyQuestions.makeQuestions(StarPatterns),
      ...ParallaxQuestions.makeQuestions(Parallax),
      ...ObservingTechniquesQuestions.makeQuestions(VisibilityFactors),
      ...OrbitsGravityQuestions.makeQuestions(OrbitalMechanics),
      ...PlanetaryMotionQuestions.makeQuestions(PlanetaryMotion),
      ...ScaleOfSolarSystemQuestions.makeQuestions(SpecData),
      ...ShadowsAndSundialsQuestions.makeQuestions(ShadowGeometry, SolarPosition),
      ...SiderealSynodicQuestions.makeQuestions(MoonPhase),
      ...SunFeaturesQuestions.makeQuestions(ButterflyDiagram),
      ...SolarSystemBodiesQuestions.makeQuestions(SpecData),
      ...SpectraQuestions.makeQuestions(Spectra),
      ...SpectralTypesQuestions.makeQuestions(Spectra),
      ...SunDeclinationQuestions.makeQuestions({ getSunPosition: SolarPosition.getSunPosition }, Coordinates),
      ...SunspotRotationQuestions.makeQuestions(SunRotation),
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
      StarPatterns: require('./starPatterns'),
      TunnelAlignment: require('./tunnelAlignment'),
      Parallax: require('./parallax'),
      Questions: require('./questions'),
      EotQuestions: require('./eotQuestions'),
      ArchaeoastronomyQuestions: require('./archaeoastronomyQuestions'),
      CoordinatesQuestions: require('./coordinatesQuestions'),
      EarthStructureQuestions: require('./earthStructureQuestions'),
      EclipticZodiac: require('./eclipticZodiac'),
      EclipticZodiacQuestions: require('./eclipticZodiacQuestions'),
      GeocentricHeliocentricQuestions: require('./geocentricHeliocentricQuestions'),
      GravitationalPotentialQuestions: require('./gravitationalPotentialQuestions'),
      GravityFieldMapQuestions: require('./gravityFieldMapQuestions'),
      KeplerQuestions: require('./keplerQuestions'),
      Magnitude: require('./magnitude'),
      MagnitudeQuestions: require('./magnitudeQuestions'),
      MeasuringTheSkyQuestions: require('./measuringTheSkyQuestions'),
      MoonPhasesQuestions: require('./moonPhasesQuestions'),
      MoonStructureQuestions: require('./moonStructureQuestions'),
      NakedEyeSkyQuestions: require('./nakedEyeSkyQuestions'),
      ParallaxQuestions: require('./parallaxQuestions'),
      ObservingTechniquesQuestions: require('./observingTechniquesQuestions'),
      OrbitsGravityQuestions: require('./orbitsGravityQuestions'),
      PlanetaryMotionQuestions: require('./planetaryMotionQuestions'),
      ScaleOfSolarSystemQuestions: require('./scaleOfSolarSystemQuestions'),
      ShadowsAndSundialsQuestions: require('./shadowsAndSundialsQuestions'),
      SiderealSynodicQuestions: require('./siderealSynodicQuestions'),
      SunFeaturesQuestions: require('./sunFeaturesQuestions'),
      SolarSystemBodiesQuestions: require('./solarSystemBodiesQuestions'),
      Spectra: require('./spectra'),
      SpectraQuestions: require('./spectraQuestions'),
      SpectralTypesQuestions: require('./spectralTypesQuestions'),
      HRDiagram: require('./hrDiagram'),
      HRDiagramQuestions: require('./hrDiagramQuestions'),
      SunDeclinationQuestions: require('./sunDeclinationQuestions'),
      SunRotation: require('./sunRotation'),
      SunspotRotationQuestions: require('./sunspotRotationQuestions'),
      TelescopeQuestions: require('./telescopeQuestions'),
      TidesQuestions: require('./tidesQuestions'),
      VisibilityFactors: require('./visibilityFactors'),
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
      StarPatterns: window.StarPatterns,
      TunnelAlignment: window.TunnelAlignment,
      Parallax: window.Parallax,
      Questions: window.Questions,
      EotQuestions: window.EotQuestions,
      ArchaeoastronomyQuestions: window.ArchaeoastronomyQuestions,
      CoordinatesQuestions: window.CoordinatesQuestions,
      EarthStructureQuestions: window.EarthStructureQuestions,
      EclipticZodiac: window.EclipticZodiac,
      EclipticZodiacQuestions: window.EclipticZodiacQuestions,
      GeocentricHeliocentricQuestions: window.GeocentricHeliocentricQuestions,
      GravitationalPotentialQuestions: window.GravitationalPotentialQuestions,
      GravityFieldMapQuestions: window.GravityFieldMapQuestions,
      KeplerQuestions: window.KeplerQuestions,
      Magnitude: window.Magnitude,
      MagnitudeQuestions: window.MagnitudeQuestions,
      MeasuringTheSkyQuestions: window.MeasuringTheSkyQuestions,
      MoonPhasesQuestions: window.MoonPhasesQuestions,
      MoonStructureQuestions: window.MoonStructureQuestions,
      NakedEyeSkyQuestions: window.NakedEyeSkyQuestions,
      ParallaxQuestions: window.ParallaxQuestions,
      ObservingTechniquesQuestions: window.ObservingTechniquesQuestions,
      OrbitsGravityQuestions: window.OrbitsGravityQuestions,
      PlanetaryMotionQuestions: window.PlanetaryMotionQuestions,
      ScaleOfSolarSystemQuestions: window.ScaleOfSolarSystemQuestions,
      ShadowsAndSundialsQuestions: window.ShadowsAndSundialsQuestions,
      SiderealSynodicQuestions: window.SiderealSynodicQuestions,
      SunFeaturesQuestions: window.SunFeaturesQuestions,
      SolarSystemBodiesQuestions: window.SolarSystemBodiesQuestions,
      Spectra: window.Spectra,
      SpectraQuestions: window.SpectraQuestions,
      SpectralTypesQuestions: window.SpectralTypesQuestions,
      HRDiagram: window.HRDiagram,
      HRDiagramQuestions: window.HRDiagramQuestions,
      SunDeclinationQuestions: window.SunDeclinationQuestions,
      SunRotation: window.SunRotation,
      SunspotRotationQuestions: window.SunspotRotationQuestions,
      TelescopeQuestions: window.TelescopeQuestions,
      TidesQuestions: window.TidesQuestions,
      VisibilityFactors: window.VisibilityFactors,
    });
  }

  const api = { getAllQuestions, getAllQuestionsNode, getAllQuestionsBrowser };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.AllQuestions = api;
  }
})();
