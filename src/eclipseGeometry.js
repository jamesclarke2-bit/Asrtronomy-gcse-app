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
 * actually happens also depends on the Sun's and Moon's distances.
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
  const MEAN_ELONGATION_DEG_PER_DAY = 360 / moonPhase.SYNODIC_MONTH_DAYS;

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
