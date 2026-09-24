/**
 * Eclipse geometry
 * ----------------
 * The Moon's orbit is tilted ~5.145° to the ecliptic (the plane of
 * Earth's orbit), crossing it at two nodes joined by the line of nodes.
 * Most months the new and full Moons pass above or below the Sun-Earth
 * line, so there's no eclipse. An eclipse is only possible when a new or
 * full Moon happens close enough to a node — within the "ecliptic limit".
 *
 * Ecliptic limits used (the maximum values, i.e. "at least a partial
 * eclipse is possible"), as given by Oxford Reference's definition of
 * ecliptic limits and consistent with the eclipse literature:
 *   solar: 18.4° (a total solar eclipse needs 11.8° or less)
 *   lunar: 12.2° (a total lunar eclipse needs 5.9° or less)
 * Inside the limit an eclipse is possible, not guaranteed — whether it
 * actually happens, and what kind, depends on the Sun's and Moon's
 * distances. So a second stage builds the shadow cones from the real
 * distances on the day: for a solar eclipse, whether the Moon's umbra
 * reaches Earth's surface (total), falls short (annular) or its axis
 * misses Earth (partial); for a lunar eclipse, how far the Moon passes
 * into Earth's umbra (total, partial) or only its penumbra (penumbral).
 *
 * Built from the existing models rather than new copies of them:
 *   - src/moonPhase.js: the starting guess for the nearest new/full Moon,
 *     and phase names;
 *   - src/moonOrbitPanel.js: the Moon's equation of centre (true minus
 *     mean anomaly), which shifts a real new/full Moon by up to ~half a
 *     day from the mean cycle;
 *   - src/solarPosition.js: the Sun's ecliptic longitude.
 * Added here: the Moon's mean longitude and the longitude of its
 * ascending node (standard Meeus formulas). test/eclipseGeometry.test.js
 * checks the result against real eclipses and non-eclipses.
 */
function makeEclipseGeometry({ getSunPosition, moonPhase, getMoonOrbit }) {
  const INCLINATION_DEG = 5.145;
  const SOLAR_LIMIT_DEG = 18.4;
  const SOLAR_TOTAL_LIMIT_DEG = 11.8;
  const LUNAR_LIMIT_DEG = 12.2;
  const LUNAR_TOTAL_LIMIT_DEG = 5.9;
  const DAY_MS = 86400000;
  const RAD_PER_DEG = Math.PI / 180;
  const MEAN_ELONGATION_DEG_PER_DAY = 360 / moonPhase.SYNODIC_MONTH_DAYS;

  const SUN_RADIUS_KM = 695700;
  const MOON_RADIUS_KM = 1737.4;
  const EARTH_RADIUS_KM = 6371;
  const AU_KM = 149597870.7;
  // Earth's atmosphere makes its shadow on the Moon about 2% larger than
  // pure geometry predicts; eclipse predictions conventionally add this.
  const ATMOSPHERE_SHADOW_ENLARGEMENT = 1.02;
  // Below this, a total/annular call is "only just" — close to a hybrid.
  const NEAR_HYBRID_MARGIN_KM = 3000;

  function normalizeDeg(deg) {
    return ((deg % 360) + 360) % 360;
  }

  function signedDeg(deg) {
    const n = normalizeDeg(deg);
    return n > 180 ? n - 360 : n;
  }

  function julianCenturies(date) {
    return (date.getTime() / DAY_MS + 2440587.5 - 2451545.0) / 36525;
  }

  // Mean longitude of the Moon's ascending node (Meeus). The node slides
  // backwards round the ecliptic once every ~18.6 years.
  function nodeLongitude(date) {
    const T = julianCenturies(date);
    return normalizeDeg(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T);
  }

  function sunLongitude(date) {
    return getSunPosition(date, 0, 0).apparentLongitude;
  }

  // Mean longitude (Meeus) plus the equation of centre from the elliptical
  // orbit model — the Moon runs ahead of its mean position after perigee
  // and behind it after apogee.
  function moonLongitude(date) {
    const T = julianCenturies(date);
    const meanLongitude = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
    const orbit = getMoonOrbit(date);
    return normalizeDeg(meanLongitude + signedDeg(orbit.trueAnomalyDeg - orbit.meanAnomalyDeg));
  }

  // Moon's angle from the Sun as seen from Earth: 0 = new, 180 = full.
  function elongation(date) {
    return normalizeDeg(moonLongitude(date) - sunLongitude(date));
  }

  // How far round its tilted orbit the Moon is from the ascending node.
  // (Strictly this is measured along the ecliptic, not the tilted orbit —
  // at a 5° tilt the two differ by well under 0.1°.)
  function argumentOfLatitude(date) {
    return normalizeDeg(moonLongitude(date) - nodeLongitude(date));
  }

  function distanceFromNearestNode(argumentOfLatitudeDeg) {
    const u = normalizeDeg(argumentOfLatitudeDeg);
    const fromAscending = Math.abs(signedDeg(u));
    const fromDescending = Math.abs(signedDeg(u - 180));
    return fromAscending <= fromDescending
      ? { degrees: fromAscending, node: 'ascending' }
      : { degrees: fromDescending, node: 'descending' };
  }

  // Degrees above (+) or below (-) the ecliptic.
  function eclipticLatitude(argumentOfLatitudeDeg) {
    const rad = Math.PI / 180;
    return Math.asin(Math.sin(INCLINATION_DEG * rad) * Math.sin(argumentOfLatitudeDeg * rad)) / rad;
  }

  // The new or full Moon nearest to `date`: a first guess from
  // moonPhase.js's mean cycle, refined until the true elongation is
  // exactly 0 (new) or 180 (full). Accurate to within ~3 hours of the
  // real, published times — the remaining error is smaller lunar
  // perturbations (evection, variation) this model leaves out.
  function nearestNewOrFullMoon(date) {
    const age = moonPhase.getMoonPhase(date).ageDays;
    const synodic = moonPhase.SYNODIC_MONTH_DAYS;
    const toNew = age < synodic / 2 ? -age : synodic - age;
    const toFull = synodic / 2 - age;
    const isNew = Math.abs(toNew) <= Math.abs(toFull);
    const targetDeg = isNew ? 0 : 180;

    let ms = date.getTime() + (isNew ? toNew : toFull) * DAY_MS;
    for (let i = 0; i < 6; i++) {
      ms -= (signedDeg(elongation(new Date(ms)) - targetDeg) / MEAN_ELONGATION_DEG_PER_DAY) * DAY_MS;
    }
    return { type: isNew ? 'new' : 'full', date: new Date(ms) };
  }

  // --- Shadow cones ----------------------------------------------------
  // Inputs are plain distances and the Moon's latitude, so the same maths
  // can be fed hypothetical values (e.g. "what if the Moon were at
  // apogee?") as well as a real date's.

  // Solar: the Moon's shadow falling on Earth. Its umbra is a cone that
  // narrows to a point; whether that point reaches Earth's surface decides
  // total (it does) versus annular (it falls short, leaving a ring of Sun).
  function solarShadowFrom({ moonDistanceKm, sunDistanceKm, moonLatitudeDeg }) {
    const sunToMoonKm = sunDistanceKm - moonDistanceKm;
    const umbraHalfAngle = (SUN_RADIUS_KM - MOON_RADIUS_KM) / sunToMoonKm;
    const penumbraHalfAngle = (SUN_RADIUS_KM + MOON_RADIUS_KM) / sunToMoonKm;
    const umbraLengthKm = MOON_RADIUS_KM / umbraHalfAngle;

    // How far the shadow's axis passes from Earth's centre; as a fraction
    // of Earth's radius this is the eclipse's "gamma".
    const axisOffsetKm = moonDistanceKm * Math.sin(moonLatitudeDeg * RAD_PER_DEG);
    const central = Math.abs(axisOffsetKm) < EARTH_RADIUS_KM;
    // Where the axis first meets Earth's surface (or, if it misses, the
    // point level with Earth's centre).
    const surfaceDistanceKm = central
      ? moonDistanceKm - Math.sqrt(EARTH_RADIUS_KM ** 2 - axisOffsetKm ** 2)
      : moonDistanceKm;

    const umbraRadiusAtSurfaceKm = MOON_RADIUS_KM - surfaceDistanceKm * umbraHalfAngle;
    const penumbraRadiusKm = MOON_RADIUS_KM + surfaceDistanceKm * penumbraHalfAngle;
    const umbraMarginKm = umbraLengthKm - surfaceDistanceKm;

    let type;
    if (Math.abs(axisOffsetKm) > EARTH_RADIUS_KM + penumbraRadiusKm) type = 'none';
    else if (!central) type = 'partial';
    else type = umbraMarginKm >= 0 ? 'total' : 'annular';

    return {
      kind: 'solar',
      type,
      gamma: axisOffsetKm / EARTH_RADIUS_KM,
      central,
      moonDistanceKm,
      umbraLengthKm,
      surfaceDistanceKm,
      umbraMarginKm,
      nearHybrid: central && Math.abs(umbraMarginKm) < NEAR_HYBRID_MARGIN_KM,
      // Width of the umbra (total) or antumbra (annular) where it meets Earth.
      umbraDiameterKm: 2 * Math.abs(umbraRadiusAtSurfaceKm),
      penumbraDiameterKm: 2 * penumbraRadiusKm,
    };
  }

  // Lunar: Earth's shadow at the Moon's distance. How far into it the Moon
  // reaches decides total (wholly in the umbra), partial (partly in it)
  // or penumbral (only the faint outer shadow).
  function lunarShadowFrom({ moonDistanceKm, sunDistanceKm, moonLatitudeDeg }) {
    const umbraRadiusKm =
      (EARTH_RADIUS_KM - (moonDistanceKm * (SUN_RADIUS_KM - EARTH_RADIUS_KM)) / sunDistanceKm) *
      ATMOSPHERE_SHADOW_ENLARGEMENT;
    const penumbraRadiusKm =
      (EARTH_RADIUS_KM + (moonDistanceKm * (SUN_RADIUS_KM + EARTH_RADIUS_KM)) / sunDistanceKm) *
      ATMOSPHERE_SHADOW_ENLARGEMENT;

    // How far the Moon's centre passes from the centre of Earth's shadow.
    const offsetKm = moonDistanceKm * Math.sin(moonLatitudeDeg * RAD_PER_DEG);
    // Fraction of the Moon's diameter inside each shadow (>= 1: all of it).
    const umbralMagnitude = (umbraRadiusKm + MOON_RADIUS_KM - Math.abs(offsetKm)) / (2 * MOON_RADIUS_KM);
    const penumbralMagnitude = (penumbraRadiusKm + MOON_RADIUS_KM - Math.abs(offsetKm)) / (2 * MOON_RADIUS_KM);

    let type;
    if (umbralMagnitude >= 1) type = 'total';
    else if (umbralMagnitude > 0) type = 'partial';
    else if (penumbralMagnitude > 0) type = 'penumbral';
    else type = 'none';

    return {
      kind: 'lunar',
      type,
      gamma: offsetKm / EARTH_RADIUS_KM,
      moonDistanceKm,
      offsetKm,
      umbraDiameterKm: 2 * umbraRadiusKm,
      penumbraDiameterKm: 2 * penumbraRadiusKm,
      umbralMagnitude,
      penumbralMagnitude,
    };
  }

  // Shadow geometry at a real new/full Moon: the Moon's distance from the
  // elliptical-orbit model, the Sun's from solarPosition.js, and the
  // Moon's latitude from its distance to the node.
  function shadowAt(syzygy) {
    const inputs = {
      moonDistanceKm: getMoonOrbit(syzygy.date).distanceKm,
      sunDistanceKm: getSunPosition(syzygy.date, 0, 0).distanceAu * AU_KM,
      moonLatitudeDeg: eclipticLatitude(argumentOfLatitude(syzygy.date)),
    };
    return syzygy.type === 'new' ? solarShadowFrom(inputs) : lunarShadowFrom(inputs);
  }

  function sameUtcDay(a, b) {
    return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
  }

  // Everything the eclipse page shows for one date.
  function getEclipseState(date) {
    const u = argumentOfLatitude(date);
    const elongationDeg = elongation(date);
    const syzygy = nearestNewOrFullMoon(date);
    const onThisDate = sameUtcDay(syzygy.date, date);

    // At the new/full Moon itself, the Moon sits at the Sun's longitude
    // (new) or opposite it (full), so its distance from a node there is
    // exactly the "ecliptic limit" quantity.
    const atSyzygy = distanceFromNearestNode(argumentOfLatitude(syzygy.date));
    const kind = syzygy.type === 'new' ? 'solar' : 'lunar';
    const limitDeg = kind === 'solar' ? SOLAR_LIMIT_DEG : LUNAR_LIMIT_DEG;
    const withinLimit = atSyzygy.degrees <= limitDeg;
    // The ecliptic limit says an eclipse *could* happen; the shadow cones,
    // with the real distances on the day, say which kind actually does.
    const shadow = onThisDate && withinLimit ? shadowAt(syzygy) : null;

    return {
      phaseName: moonPhase.phaseName(elongationDeg),
      elongationDeg,
      argumentOfLatitudeDeg: u,
      nearestNode: distanceFromNearestNode(u),
      eclipticLatitudeDeg: eclipticLatitude(u),
      // Where the ascending node points, measured from the Sun's direction
      // — lets a diagram keep the Sun fixed while the nodes swing round.
      nodeAngleFromSunDeg: signedDeg(nodeLongitude(date) - sunLongitude(date)),
      syzygy,
      onThisDate,
      kind,
      limitDeg,
      nodeDistanceAtSyzygyDeg: atSyzygy.degrees,
      withinLimit,
      eclipsePossible: onThisDate && withinLimit,
      shadow,
      eclipseType: shadow ? shadow.type : 'none',
    };
  }

  return {
    INCLINATION_DEG,
    SOLAR_LIMIT_DEG,
    SOLAR_TOTAL_LIMIT_DEG,
    LUNAR_LIMIT_DEG,
    LUNAR_TOTAL_LIMIT_DEG,
    nodeLongitude,
    elongation,
    argumentOfLatitude,
    distanceFromNearestNode,
    eclipticLatitude,
    nearestNewOrFullMoon,
    solarShadowFrom,
    lunarShadowFrom,
    shadowAt,
    getEclipseState,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  const { getSunPosition } = require('./solarPosition');
  const moonPhase = require('./moonPhase');
  const { getMoonOrbit } = require('./moonOrbitPanel');
  module.exports = makeEclipseGeometry({ getSunPosition, moonPhase, getMoonOrbit });
} else if (typeof window !== 'undefined') {
  window.EclipseGeometry = makeEclipseGeometry({
    getSunPosition: window.SolarPosition.getSunPosition,
    moonPhase: window.MoonPhase,
    getMoonOrbit: window.MoonOrbitPanel.getMoonOrbit,
  });
}
