/**
 * Earth's angular position around the Sun, for the orbit diagram.
 *
 * Derived purely from getSunPosition's declination output — never a
 * separate day-of-year calculation — so the orbit diagram always
 * agrees with whatever the sky diagram (sharing the same date) shows.
 *
 * Declination alone doesn't uniquely determine orbital position: any
 * non-extreme declination occurs on two dates a year (e.g. a month
 * before and a month after a solstice), so this also checks whether
 * declination is increasing or decreasing day-to-day to tell them apart.
 */

function makeEarthOrbit(getSunPosition) {
  const YEAR = 2026;
  const OBLIQUITY = 23.44;

  function dateForDayIndex(dayIndex) {
    const d = new Date(Date.UTC(YEAR, 0, 1, 12, 0));
    d.setUTCDate(d.getUTCDate() + dayIndex);
    return d;
  }

  // Degrees: 0 = March equinox, 90 = June solstice, 180 = September
  // equinox, 270 = December solstice.
  function computeEarthOrbitAngle(dayIndex) {
    const todayDecl = getSunPosition(dateForDayIndex(dayIndex), 0, 0).declination;
    const tomorrowDecl = getSunPosition(dateForDayIndex(dayIndex + 1), 0, 0).declination;
    const increasing = tomorrowDecl >= todayDecl;
    const ratio = Math.max(-1, Math.min(1, todayDecl / OBLIQUITY));
    const principal = (Math.asin(ratio) * 180) / Math.PI; // in [-90, 90]

    const theta = increasing ? (todayDecl >= 0 ? principal : 360 + principal) : 180 - principal;
    return ((theta % 360) + 360) % 360;
  }

  return { computeEarthOrbitAngle };
}

if (typeof module !== 'undefined' && module.exports) {
  const { getSunPosition } = require('./solarPosition');
  module.exports = { ...makeEarthOrbit(getSunPosition), makeEarthOrbit };
} else if (typeof window !== 'undefined') {
  window.EarthOrbit = { ...makeEarthOrbit(window.SolarPosition.getSunPosition), makeEarthOrbit };
}
