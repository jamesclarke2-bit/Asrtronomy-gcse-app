/**
 * Models for notes/finding-longitude.html (spec 4.20, 4.21).
 *
 * Longitude as a time difference: the Earth turns 360° in 24 hours, so
 * 15° per hour, 1° per 4 minutes. Local noon at a ship, timed by a clock
 * keeping Greenwich time, gives the ship's longitude: later than 12:00 at
 * Greenwich means the ship is west, earlier means east.
 *
 * Lunar distance: the Moon moves against the stars at about half a degree
 * an hour, so its measured angle to a star, looked up in tables, gives the
 * Greenwich time. Chronometer: a clock that gains or loses time gives a
 * longitude error of 1° for every 4 minutes it is out.
 *
 * Degrees of longitude to km at the equator use the data sheet's Earth
 * diameter (src/specData.js). The Moon's rate, the example clock drifts and
 * every name and date are general knowledge, labelled first draft on the page.
 */
(function () {
  const SpecData = typeof require !== 'undefined' ? require('./specData') : window.SpecData;

  const DEG_PER_HOUR = 15;
  const MIN_PER_DEG = 4;
  const NOON_MIN = 12 * 60;

  /**
   * Longitude from the Greenwich time (minutes after midnight) at which
   * the Sun is highest at the ship. Returns { degrees, direction } with
   * direction 'W' (Greenwich later), 'E' (earlier) or '' (on Greenwich).
   */
  function longitudeFromNoon(greenwichMinutes) {
    const diff = greenwichMinutes - NOON_MIN;
    const degrees = Math.abs(diff) / MIN_PER_DEG;
    return { degrees, direction: diff > 0 ? 'W' : diff < 0 ? 'E' : '', diffMinutes: diff };
  }

  /** The Greenwich time of local noon at a longitude (degrees, east positive). */
  function noonGreenwichMinutes(longitudeEastDeg) {
    return NOON_MIN - longitudeEastDeg * MIN_PER_DEG;
  }

  function formatClock(minutes) {
    const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  }

  // Km per degree of longitude at the equator, from the data sheet's diameter.
  const EARTH_DIAMETER_KM = SpecData.CONSTANTS.meanDiameterKm.earth;
  const KM_PER_DEG_EQUATOR = (Math.PI * EARTH_DIAMETER_KM) / 360;

  // --- 4.20 Lunar distance --------------------------------------------------
  const MOON_DEG_PER_HOUR = 0.5;
  const LUNAR_START_DEG = 40; // the Moon's distance from the star at 00:00 Greenwich
  const TABLE_HOURS = [0, 3, 6, 9, 12];

  /** The Moon-star angle (degrees) at a Greenwich time in hours. */
  function lunarDistance(greenwichHours) {
    return LUNAR_START_DEG - MOON_DEG_PER_HOUR * greenwichHours;
  }

  /** The Greenwich time (hours) a measured Moon-star angle gives, from the table. */
  function greenwichFromLunarDistance(distanceDeg) {
    return (LUNAR_START_DEG - distanceDeg) / MOON_DEG_PER_HOUR;
  }

  function lunarTable() {
    return TABLE_HOURS.map((h) => ({ hours: h, distanceDeg: lunarDistance(h) }));
  }

  /**
   * The longitude error (degrees) from an error in the measured angle
   * (arcminutes): the Moon moves 30 arcminutes an hour, so 1 arcminute is
   * 2 minutes of time, and 2 minutes is half a degree of longitude.
   */
  function longitudeErrorFromAngleError(arcminutes) {
    const timeMinutes = (arcminutes / (MOON_DEG_PER_HOUR * 60)) * 60;
    return timeMinutes / MIN_PER_DEG;
  }

  // --- 4.21 Clocks at sea ---------------------------------------------------
  const CLOCKS = [
    { key: 'ordinary', name: 'Ordinary clock at sea', secondsPerDay: 60 },
    { key: 'h4', name: "Harrison's H4", secondsPerDay: 5 / 81 },
  ];
  const PRIZE_DEGREES = 0.5;

  /** Minutes a clock is out after a number of days at sea. */
  function clockErrorMinutes(clockKey, days) {
    const c = CLOCKS.find((x) => x.key === clockKey);
    return (c.secondsPerDay * days) / 60;
  }

  function longitudeErrorDeg(errorMinutes) {
    return errorMinutes / MIN_PER_DEG;
  }

  const api = {
    DEG_PER_HOUR,
    MIN_PER_DEG,
    NOON_MIN,
    longitudeFromNoon,
    noonGreenwichMinutes,
    formatClock,
    EARTH_DIAMETER_KM,
    KM_PER_DEG_EQUATOR,
    MOON_DEG_PER_HOUR,
    LUNAR_START_DEG,
    TABLE_HOURS,
    lunarDistance,
    greenwichFromLunarDistance,
    lunarTable,
    longitudeErrorFromAngleError,
    CLOCKS,
    PRIZE_DEGREES,
    clockErrorMinutes,
    longitudeErrorDeg,
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.Longitude = api;
  }
})();
