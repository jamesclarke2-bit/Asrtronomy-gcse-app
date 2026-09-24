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
    equatorialToEcliptic,
    celestialPoleAt,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.MeasuringTheSky = api;
  }
})();
