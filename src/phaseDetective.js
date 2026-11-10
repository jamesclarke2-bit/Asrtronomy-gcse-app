/**
 * "Phase detective" — reading the Moon's phase off a table of sunrise,
 * sunset, moonrise and moonset times, for sims/moon-phases.html's
 * "Phase detective" section.
 *
 * The model: the Moon rises and sets later each day than the day
 * before, catching up with the Sun once a synodic month. Expressed as
 * an angle, that's exactly the same theta MoonPhase already tracks (0 =
 * New Moon, 180 = Full Moon) — so the lag of moonrise behind sunrise,
 * in hours, is simply theta converted from degrees to hours of a 24-hour
 * day: lagHours = theta / 15 (since 360 degrees / 24 hours = 15
 * degrees per hour). That one relationship is what makes New Moon rise
 * with the Sun (theta=0, lag=0h), First Quarter rise ~6h after it
 * (theta=90, lag=6h), Full Moon rise at sunset (theta=180, lag=12h,
 * and so moonset — the same lag added to sunset — falls at the next
 * sunrise), and Last Quarter rise ~18h after sunrise, or around
 * midnight (theta=270, lag=18h).
 *
 * A real moonrise/moonset also depends on the Moon's actual declination
 * (not modelled here) and the real horizon/latitude geometry — so this
 * is the same mean-rate approximation "the Moon rises about 50 minutes
 * later each day" already is, not a full lunar ephemeris. Real times
 * vary with season and latitude; see sims/moon-phases.html's own note.
 */
const SolarPosition = typeof require !== 'undefined' ? require('./solarPosition') : window.SolarPosition;
const MoonPhase = typeof require !== 'undefined' ? require('./moonPhase') : window.MoonPhase;

// The six phases the "Phase detective" slider steps through — a subset
// of MoonPhase's own eight (no waning crescent/gibbous stop), matching
// what this page's task spec asks for.
const PHASE_PRESETS = [
  { key: 'new', label: 'New', theta: 0 },
  { key: 'crescent', label: 'Crescent', theta: 45 },
  { key: 'firstQuarter', label: 'First Quarter', theta: 90 },
  { key: 'gibbous', label: 'Gibbous', theta: 135 },
  { key: 'full', label: 'Full', theta: 180 },
  { key: 'lastQuarter', label: 'Last Quarter', theta: 270 },
];

// Degrees of theta per hour of moonrise lag (360 degrees / 24 hours).
const DEG_PER_HOUR = 15;

// The rounded teaching figure ("the Moon rises about 50 minutes later
// each day") used to estimate age back from an observed lag — not the
// more precise ~48.76 min/day (24*60 / MoonPhase.SYNODIC_MONTH_DAYS)
// the forward model actually uses, which is why the estimate is only
// ever approximate (see test/phaseDetective.test.js's own tolerance).
const MINUTES_LATER_PER_DAY = 50;

function lagHoursFromTheta(theta) {
  return theta / DEG_PER_HOUR;
}

function estimatedAgeDaysFromLagHours(lagHours) {
  return (lagHours * 60) / MINUTES_LATER_PER_DAY;
}

// Wraps a minutes-after-midnight value into [0, 1440).
function wrapMinutes(minutes) {
  return ((minutes % 1440) + 1440) % 1440;
}

function addLagHours(baseMinutes, lagHours) {
  return wrapMinutes(baseMinutes + lagHours * 60);
}

// Minutes after midnight the Moon rises behind the Sun that day, purely
// from the two clock times — the same thing a student reads off a
// table, not from any hidden theta value.
function lagHoursFromTimes(sunriseMinutes, moonriseMinutes) {
  return wrapMinutes(moonriseMinutes - sunriseMinutes) / 60;
}

// The 8-name phase a moonrise-behind-sunrise lag corresponds to, via
// the same lagHours = theta/15 relationship this whole model rests on
// — so reading a table and reading MoonPhase.phaseName(theta) directly
// always agree (see test/phaseDetective.test.js's round-trip check).
function phaseNameFromLagHours(lagHours) {
  const theta = (((lagHours * DEG_PER_HOUR) % 360) + 360) % 360;
  return MoonPhase.phaseName(theta);
}

// How far (in degrees, 0-180) a phase sits from New Moon — the
// precondition for a solar eclipse (see u2.19's own explanation of why
// most new Moons still miss, via the nodes).
function distanceFromNewMoonDeg(theta) {
  const wrapped = ((theta % 360) + 360) % 360;
  return Math.min(wrapped, 360 - wrapped);
}

/**
 * Sunrise, sunset, moonrise and moonset (all minutes after midnight UT)
 * for a real calendar date, latitude and longitude — moonrise/moonset
 * from the lag model above, applied to that day's real sunrise/sunset.
 * @returns {{sunriseMinutes, sunsetMinutes, moonriseMinutes, moonsetMinutes, theta, ageDays, lagHours}}
 */
function riseSetTimesForDate(date, latDeg, lonDeg) {
  const { sunriseUT, sunsetUT } = SolarPosition.getSunriseSunset(date, latDeg, lonDeg);
  const { theta, ageDays } = MoonPhase.getMoonPhase(date);
  const lagHours = lagHoursFromTheta(theta);
  return {
    sunriseMinutes: wrapMinutes(sunriseUT),
    sunsetMinutes: wrapMinutes(sunsetUT),
    moonriseMinutes: addLagHours(sunriseUT, lagHours),
    moonsetMinutes: addLagHours(sunsetUT, lagHours),
    theta,
    ageDays,
    lagHours,
  };
}

function formatClock(minutes) {
  const wrapped = Math.round(wrapMinutes(minutes));
  const h = Math.floor(wrapped / 60) % 24;
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const api = {
  PHASE_PRESETS,
  DEG_PER_HOUR,
  MINUTES_LATER_PER_DAY,
  lagHoursFromTheta,
  estimatedAgeDaysFromLagHours,
  wrapMinutes,
  addLagHours,
  lagHoursFromTimes,
  phaseNameFromLagHours,
  distanceFromNewMoonDeg,
  riseSetTimesForDate,
  formatClock,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
} else if (typeof window !== 'undefined') {
  window.PhaseDetective = api;
}
