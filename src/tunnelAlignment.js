/**
 * Monument-alignment engine: when does a straight tunnel/passage at a
 * given compass bearing let sunlight shine all the way through?
 *
 * Shared by notes/archaeoastronomy.html's "Alignments: when does the Sun
 * line up?" case study (plan-view diagram, year graph, worked example)
 * and its practice questions.
 *
 * A straight passage has two opposite mouths, at bearings B and B+180.
 * At sunrise the Sun's azimuth runs through roughly 50-130° at mid
 * latitudes, so only the B-facing mouth is ever lit at sunrise (B is
 * restricted to the 60-120° range here, so B+180 never falls in that
 * band). Sunset azimuth = 360 - sunrise azimuth (same east-west symmetry
 * SolarPosition.getSunPosition's hour-angle sign-flip relies on), so the
 * far mouth (bearing B+180) is lit at sunset exactly when the day's
 * sunrise azimuth is 180-B: 360 - sunriseAz = B+180 rearranges to
 * sunriseAz = 180-B. Both conditions are thresholds on the same
 * sunrise-azimuth-vs-date curve, just two different target values - which
 * is why plotting that curve against both B and 180-B (as two horizontal
 * lines) shows each line crossing the curve twice a year (around spring
 * and around autumn).
 */
const SolarPosition = typeof require !== 'undefined' ? require('./solarPosition') : window.SolarPosition;

// The standard sunrise/sunset correction (apparent solar radius lifting
// the first visible sliver above the ideal flat horizon, plus
// atmospheric refraction) - the same -0.833° SolarPosition.getSunriseSunset
// already uses for rise/set *times*.
const SUNRISE_CROSSING_ALTITUDE_DEG = -0.833;

/**
 * Converts an angle given as whole degrees plus minutes of arc (1
 * degree = 60 minutes) into decimal degrees.
 * @param {number} degrees
 * @param {number} minutes
 * @returns {number} decimal degrees
 */
function decimalDegrees(degrees, minutes) {
  return degrees + minutes / 60;
}

/**
 * Linear interpolation: given two known points (x1, y1) and (x2, y2),
 * estimates y at an x between them.
 * @returns {number} interpolated y
 */
function interpolate(x1, y1, x2, y2, x) {
  return y1 + ((y2 - y1) * (x - x1)) / (x2 - x1);
}

// Noon UTC on the given zero-based day-of-year in `year` - matches the
// convention notes/archaeoastronomy.js's own Stonehenge diagram already
// uses for dayOfYearToUTCDate, so both diagrams read the same date off
// the same slider value.
function dayOfYearToUTCDate(dayIndex, year) {
  const d = new Date(Date.UTC(year, 0, 1, 12));
  d.setUTCDate(d.getUTCDate() + dayIndex);
  return d;
}

function daysInYear(year) {
  return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
}

/**
 * The Sun's rising azimuth on a given day of the year, including the
 * standard sunrise correction (so this is the *direction* a sunrise
 * alignment is judged against, not the simplified altitude-0 case
 * notes/archaeoastronomy.js's own Stonehenge diagram uses).
 * @returns {number} azimuth, degrees clockwise from north, 0-180
 */
function sunriseAzimuthOnDay(dayIndex, latDeg, year) {
  const declination = SolarPosition.getSunPosition(dayOfYearToUTCDate(dayIndex, year), latDeg, 0).declination;
  return SolarPosition.sunriseAzimuthDeg(declination, latDeg, SUNRISE_CROSSING_ALTITUDE_DEG);
}

/**
 * The Sun's setting azimuth on a given day - 360 minus the sunrise
 * azimuth, by the same east-west symmetry quoted above.
 * @returns {number} azimuth, degrees clockwise from north, 180-360
 */
function sunsetAzimuthOnDay(dayIndex, latDeg, year) {
  return 360 - sunriseAzimuthOnDay(dayIndex, latDeg, year);
}

/**
 * The sunrise azimuth for every day of the year, for the year graph.
 * @returns {{dayIndex: number, date: Date, azimuth: number}[]}
 */
function yearSunriseAzimuths(latDeg, year) {
  const total = daysInYear(year);
  const points = [];
  for (let dayIndex = 0; dayIndex < total; dayIndex += 1) {
    points.push({ dayIndex, date: dayOfYearToUTCDate(dayIndex, year), azimuth: sunriseAzimuthOnDay(dayIndex, latDeg, year) });
  }
  return points;
}

function angleDifferenceDeg(a, b) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

// Groups a sorted list of day-indices into runs of consecutive days (a
// single "it shines through" spell), wrapping the last run into the
// first if the year's last day and day 0 are both included (so a run
// spanning New Year's Day isn't miscounted as two separate windows).
function groupConsecutiveDays(dayIndices, totalDays) {
  if (dayIndices.length === 0) return [];
  const runs = [];
  let runStart = dayIndices[0];
  let runEnd = dayIndices[0];
  for (let i = 1; i < dayIndices.length; i += 1) {
    if (dayIndices[i] === runEnd + 1) {
      runEnd = dayIndices[i];
    } else {
      runs.push({ startDay: runStart, endDay: runEnd, dayCount: runEnd - runStart + 1 });
      runStart = dayIndices[i];
      runEnd = dayIndices[i];
    }
  }
  runs.push({ startDay: runStart, endDay: runEnd, dayCount: runEnd - runStart + 1 });
  if (runs.length > 1 && runs[0].startDay === 0 && runs[runs.length - 1].endDay === totalDays - 1) {
    const first = runs.shift();
    const last = runs.pop();
    runs.push({ startDay: last.startDay, endDay: first.endDay, dayCount: last.dayCount + first.dayCount });
  }
  return runs;
}

/**
 * Which days of the year the sunrise azimuth sits within toleranceDeg of
 * targetAzimuthDeg, grouped into separate "it shines through" windows
 * (typically one around spring, one around autumn).
 * @returns {{startDay: number, endDay: number, dayCount: number}[]}
 */
function daysWithinTolerance(latDeg, targetAzimuthDeg, toleranceDeg, year) {
  const total = daysInYear(year);
  const matchingDays = [];
  for (let dayIndex = 0; dayIndex < total; dayIndex += 1) {
    if (angleDifferenceDeg(sunriseAzimuthOnDay(dayIndex, latDeg, year), targetAzimuthDeg) <= toleranceDeg) {
      matchingDays.push(dayIndex);
    }
  }
  return groupConsecutiveDays(matchingDays, total);
}

/**
 * Full picture for a tunnel at bearingDeg: the windows (spring/autumn)
 * when sunrise shines through the near mouth, and the windows when
 * sunset shines through the far mouth (bearing+180).
 * @returns {{sunrise: Array, sunset: Array}}
 */
function alignmentWindows(bearingDeg, latDeg, toleranceDeg, year) {
  return {
    sunrise: daysWithinTolerance(latDeg, bearingDeg, toleranceDeg, year),
    sunset: daysWithinTolerance(latDeg, 180 - bearingDeg, toleranceDeg, year),
  };
}

const api = {
  SUNRISE_CROSSING_ALTITUDE_DEG,
  decimalDegrees,
  interpolate,
  dayOfYearToUTCDate,
  daysInYear,
  sunriseAzimuthOnDay,
  sunsetAzimuthOnDay,
  yearSunriseAzimuths,
  angleDifferenceDeg,
  alignmentWindows,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
} else if (typeof window !== 'undefined') {
  window.TunnelAlignment = api;
}
