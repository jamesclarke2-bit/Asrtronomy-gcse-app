/**
 * Solar position calculator
 * -------------------------
 * Given a date/time, latitude and longitude, returns the sun's
 * altitude (degrees above horizon) and azimuth (degrees clockwise
 * from true north).
 *
 * Based on the standard NOAA/Meeus low-precision solar position
 * algorithm. Accuracy: ~0.01° for dates roughly 1900-2100 — more
 * than enough for GCSE-level teaching, and it's the same core
 * maths behind most solar calculators and planetarium software.
 *
 * All trig functions here work in degrees via the helpers below,
 * to keep the formulas readable against reference material.
 */

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;
const sinD = (deg) => Math.sin(toRad(deg));
const cosD = (deg) => Math.cos(toRad(deg));
const tanD = (deg) => Math.tan(toRad(deg));
const asinD = (x) => toDeg(Math.asin(x));
const acosD = (x) => toDeg(Math.acos(Math.max(-1, Math.min(1, x))));

// Julian Day Number from a JS Date (UTC-based)
function toJulianDay(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Core calculation.
 * @param {Date} date - JS Date object (any local time; converted to UTC internally)
 * @param {number} lat - latitude in degrees, north positive
 * @param {number} lon - longitude in degrees, east positive
 * @returns {{ altitude: number, azimuth: number, declination: number }}
 */
function getSunPosition(date, lat, lon) {
  const jd = toJulianDay(date);
  const T = (jd - 2451545.0) / 36525; // Julian centuries since J2000.0

  // Geometric mean longitude and anomaly of the sun
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);

  // Eccentricity of Earth's orbit
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);

  // Equation of center
  const C =
    sinD(M) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    sinD(2 * M) * (0.019993 - 0.000101 * T) +
    sinD(3 * M) * 0.000289;

  const trueLong = L0 + C;

  // Apparent longitude (corrects for nutation + aberration)
  const omega = 125.04 - 1934.136 * T;
  const appLong = trueLong - 0.00569 - 0.00478 * sinD(omega);

  // Obliquity of the ecliptic, corrected
  const eps0 =
    23 +
    (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * cosD(omega);

  // Sun's declination
  const decl = asinD(sinD(eps) * sinD(appLong));

  // Equation of time, in minutes
  const y = Math.pow(tanD(eps / 2), 2);
  const eqTime =
    4 *
    toDeg(
      y * sinD(2 * L0) -
        2 * e * sinD(M) +
        4 * e * y * sinD(M) * cosD(2 * L0) -
        0.5 * y * y * sinD(4 * L0) -
        1.25 * e * e * sinD(2 * M)
    );

  // True solar time (minutes from midnight UTC), then hour angle
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  const trueSolarTime = (utcMinutes + eqTime + 4 * lon) % 1440;
  let hourAngle = trueSolarTime / 4 - 180;
  if (hourAngle < -180) hourAngle += 360;

  // Altitude and azimuth
  const zenith = acosD(sinD(lat) * sinD(decl) + cosD(lat) * cosD(decl) * cosD(hourAngle));
  const altitude = 90 - zenith;

  let azimuth = acosD(
    (sinD(decl) - sinD(lat) * cosD(zenith)) / (cosD(lat) * sinD(zenith))
  );
  if (hourAngle > 0) azimuth = 360 - azimuth;

  return { altitude, azimuth, declination: decl };
}

// Curriculum subtopics this simulation teaches towards — see src/curriculum.js.
// u1.4 coordinate systems (altitude/azimuth), u1.6 observational terminology
// (meridian, zenith, horizon, culmination), u2.9 seasons, u2.10 time
// (Equation of Time).
const CURRICULUM_UNITS = ['u1.4', 'u1.6', 'u2.9', 'u2.10'];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getSunPosition, CURRICULUM_UNITS };
} else if (typeof window !== 'undefined') {
  window.SolarPosition = { getSunPosition, CURRICULUM_UNITS };
}
