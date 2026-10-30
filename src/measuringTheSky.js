/**
 * Measuring the sky
 * -----------------
 * The numbers behind notes/measuring-the-sky.html: Eratosthenes' and
 * Aristarchus' methods, the sizes and distances of the Earth, Moon and
 * Sun, and precession of Earth's axis. Kept here, not in the page
 * script, so test/measuringTheSky.test.js can check every claim the
 * page makes against them.
 *
 * Sizes use the same values as src/eclipseGeometry.js's shadow model:
 * IAU nominal solar radius 695,700 km, lunar radius 1,737.4 km, Earth's
 * mean radius 6,371 km, and 1 AU = 149,597,870.7 km. The Moon's mean
 * distance is src/moonOrbitPanel.js's 384,400 km.
 *
 * Wrapped in a function so its helpers don't leak into the shared
 * global scope of the page's other plain <script> tags.
 */
(function () {
  const RAD = Math.PI / 180;

  const SUN_RADIUS_KM = 695700;
  const MOON_RADIUS_KM = 1737.4;
  const EARTH_RADIUS_KM = 6371;
  const MOON_DISTANCE_KM = 384400;
  const SUN_DISTANCE_KM = 149597870.7;

  const SUN_DIAMETER_KM = 2 * SUN_RADIUS_KM;
  const MOON_DIAMETER_KM = 2 * MOON_RADIUS_KM;
  const EARTH_DIAMETER_KM = 2 * EARTH_RADIUS_KM;

  // Precession: one full circle of the celestial pole around the
  // ecliptic pole, and the tilt that sets that circle's radius (the
  // J2000 obliquity). Both treated as constant, which is good to a few
  // centuries over the span the page shows.
  const PRECESSION_PERIOD_YEARS = 25772;
  const OBLIQUITY_DEG = 23.4393;

  // --- Eratosthenes -------------------------------------------------------

  // The Sun's rays are parallel, so the difference in its noon shadow
  // angle between two places due north-south of each other equals the
  // angle between them at Earth's centre: angle / 360° = distance /
  // circumference.
  function eratosthenesCircumference(shadowAngleDeg, distanceKm) {
    return (360 / shadowAngleDeg) * distanceKm;
  }

  // --- Aristarchus --------------------------------------------------------

  // At first (or last) quarter the Moon is exactly half lit, so the
  // angle Sun-Moon-Earth is 90°. With the angle Moon-Earth-Sun measured
  // as theta, cos(theta) = Earth-Moon / Earth-Sun.
  function sunDistanceInMoonDistances(quarterAngleDeg) {
    return 1 / Math.cos(quarterAngleDeg * RAD);
  }

  function trueQuarterAngleDeg() {
    return Math.acos(MOON_DISTANCE_KM / SUN_DISTANCE_KM) / RAD;
  }

  // Earth's umbra (full shadow) at the Moon's mean distance, by similar
  // triangles: the shadow narrows from Earth's width because the Sun is
  // bigger than Earth. Returned in km and in Moon diameters, with how
  // much it has narrowed by the time it reaches the Moon.
  function earthShadowAtMoon() {
    const narrowingKm = 2 * MOON_DISTANCE_KM * (SUN_RADIUS_KM - EARTH_RADIUS_KM) / SUN_DISTANCE_KM;
    const widthKm = EARTH_DIAMETER_KM - narrowingKm;
    return {
      widthKm,
      widthInMoons: widthKm / MOON_DIAMETER_KM,
      narrowingKm,
      narrowingInMoons: narrowingKm / MOON_DIAMETER_KM,
    };
  }

  // Angular diameter, in degrees, of a body of a given size and distance.
  function angularDiameterDeg(diameterKm, distanceKm) {
    return 2 * Math.atan(diameterKm / 2 / distanceKm) / RAD;
  }

  // The small-angle rearrangement the other way round: given how big
  // something looks (its angular diameter) and its real diameter, how
  // far away it must be. The same relationship angularDiameterDeg() uses,
  // solved for distance instead of angle.
  function distanceFromAngularSizeKm(diameterKm, angleRad) {
    return diameterKm / angleRad;
  }

  // The Moon's own angular diameter, fixed regardless of how far an arm
  // is held out — about 0.52°.
  const MOON_ANGULAR_DIAMETER_DEG = angularDiameterDeg(MOON_DIAMETER_KM, MOON_DISTANCE_KM);

  // A typical small coin's diameter, for the "it looks bigger than it
  // is" comparison below — general knowledge, not a data-sheet figure.
  const REFERENCE_COIN_DIAMETER_M = 0.02;

  // The width of an object that, held at armLengthM, exactly covers the
  // Moon: the small-angle size-at-distance relationship, object size =
  // distance × angle in radians. At the usual ~0.70 m arm's length this
  // comes out to about 6 mm — roughly a pea, not a coin.
  function armsLengthObjectDiameterM(armLengthM) {
    return armLengthM * MOON_ANGULAR_DIAMETER_DEG * RAD;
  }

  // How many Moon-widths a coin of coinDiameterM covers, held at
  // armLengthM — both angles taken via the same small-angle
  // approximation, so the ratio is exact even though each angle alone is
  // only approximate. A standard small coin (about 20 mm) at a typical
  // 0.70 m arm's length covers about 3 Moons, not 1.
  function coinAngularSizeInMoons(armLengthM, coinDiameterM = REFERENCE_COIN_DIAMETER_M) {
    const coinAngularRad = coinDiameterM / armLengthM;
    const moonAngularRad = MOON_ANGULAR_DIAMETER_DEG * RAD;
    return coinAngularRad / moonAngularRad;
  }

  // --- Precession ---------------------------------------------------------

  // Ecliptic longitude and latitude (degrees) of a J2000 RA/Dec.
  function equatorialToEcliptic({ ra, dec }) {
    const a = ra * 15 * RAD;
    const d = dec * RAD;
    const e = OBLIQUITY_DEG * RAD;
    const x = Math.cos(d) * Math.cos(a);
    const y = Math.cos(d) * Math.sin(a) * Math.cos(e) + Math.sin(d) * Math.sin(e);
    const z = -Math.cos(d) * Math.sin(a) * Math.sin(e) + Math.sin(d) * Math.cos(e);
    return {
      lon: ((Math.atan2(y, x) / RAD) + 360) % 360,
      lat: Math.asin(Math.max(-1, Math.min(1, z))) / RAD,
    };
  }

  // Where the north celestial pole points in a given year (negative for
  // BCE, astronomical numbering), as RA/Dec on the J2000 sky. It circles
  // the ecliptic pole at a fixed radius equal to the tilt, moving
  // westward (decreasing ecliptic longitude), and sits at ecliptic
  // longitude 90° in J2000.
  function celestialPoleAt(year) {
    const lon = (90 - (360 * (year - 2000)) / PRECESSION_PERIOD_YEARS) * RAD;
    const lat = (90 - OBLIQUITY_DEG) * RAD;
    const e = OBLIQUITY_DEG * RAD;
    const x = Math.cos(lat) * Math.cos(lon);
    const yEc = Math.cos(lat) * Math.sin(lon);
    const zEc = Math.sin(lat);
    const y = yEc * Math.cos(e) - zEc * Math.sin(e);
    const z = yEc * Math.sin(e) + zEc * Math.cos(e);
    return {
      ra: ((((Math.atan2(y, x) / RAD) + 360) % 360) / 15),
      dec: Math.asin(Math.max(-1, Math.min(1, z))) / RAD,
    };
  }

  const api = {
    SUN_DIAMETER_KM,
    MOON_DIAMETER_KM,
    EARTH_DIAMETER_KM,
    SUN_RADIUS_KM,
    MOON_RADIUS_KM,
    EARTH_RADIUS_KM,
    MOON_DISTANCE_KM,
    SUN_DISTANCE_KM,
    PRECESSION_PERIOD_YEARS,
    OBLIQUITY_DEG,
    eratosthenesCircumference,
    sunDistanceInMoonDistances,
    trueQuarterAngleDeg,
    earthShadowAtMoon,
    angularDiameterDeg,
    distanceFromAngularSizeKm,
    MOON_ANGULAR_DIAMETER_DEG,
    REFERENCE_COIN_DIAMETER_M,
    armsLengthObjectDiameterM,
    coinAngularSizeInMoons,
    equatorialToEcliptic,
    celestialPoleAt,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.MeasuringTheSky = api;
  }
})();
