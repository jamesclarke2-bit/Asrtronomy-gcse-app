/**
 * Star trails and the sidereal day, for notes/star-trails.html.
 *
 * In a long exposure the Earth turns, so each star draws an arc round the
 * celestial pole. In a time t the Earth turns through an angle θ, so a full
 * turn (360°), one sidereal day, takes
 *
 *   sidereal day = (360 ÷ θ) × t
 *
 * The true sidereal day is the data sheet's 23 h 56 min (src/specData.js),
 * which sets how far the simulated trails turn. Simulated readings of an
 * arc have a small random spread, as real students' readings would; the
 * uncertainty is half the range. Repeating the reading shows that spread,
 * exposes anomalies and gives a mean; a longer exposure gives a bigger
 * angle for the same spread, so a smaller percentage uncertainty.
 */
(function () {
  const isNode = typeof require !== 'undefined' && typeof module !== 'undefined';
  const SpecData = isNode ? require('./specData') : window.SpecData;

  const { siderealDay, synodicDay } = SpecData.CONSTANTS;
  const SIDEREAL_DAY_MIN = siderealDay.hours * 60 + siderealDay.minutes;
  const SOLAR_DAY_MIN = synodicDay.hours * 60 + synodicDay.minutes;

  /** The angle (degrees) a star trail turns through in an exposure of t minutes. */
  function arcAngleDeg(exposureMin) {
    return (360 * exposureMin) / SIDEREAL_DAY_MIN;
  }

  /** sidereal day = (360 ÷ θ) × t, in the same units as t. */
  function siderealDayFrom(thetaDeg, exposureTime) {
    return (360 / thetaDeg) * exposureTime;
  }

  function seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  /**
   * `count` students' readings of the same arc, each within ±spread of the
   * true angle and read to the nearest 0.5°. If `anomaly` is given, that
   * student's reading is off by `anomaly.offsetDeg` (a slip, such as
   * lining up with the wrong end of the arc).
   */
  function readings(exposureMin, { count = 5, spreadDeg = 1, seed = 1, anomaly = null } = {}) {
    const rand = seeded(seed);
    const truth = arcAngleDeg(exposureMin);
    const out = [];
    for (let k = 0; k < count; k += 1) {
      let r = truth + (2 * rand() - 1) * spreadDeg;
      if (anomaly && anomaly.index === k) r += anomaly.offsetDeg;
      out.push(Math.round(r * 2) / 2);
    }
    // Real readings never agree perfectly: if every ordinary reading has
    // rounded to the same value, move the last one by one 0.5° step.
    const ordinary = out.filter((_, k) => !(anomaly && anomaly.index === k));
    if (Math.max(...ordinary) === Math.min(...ordinary)) {
      const last = anomaly && anomaly.index === count - 1 ? count - 2 : count - 1;
      out[last] += 0.5;
    }
    return out;
  }

  /**
   * Readings that sit far from the others: further from the median than
   * three times the spread of the rest. These are left out of the mean.
   */
  function anomalies(values, spreadDeg = 1) {
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    return values.map((v, k) => (Math.abs(v - median) > 3 * spreadDeg ? k : -1)).filter((k) => k >= 0);
  }

  /** Mean, range and uncertainty (half the range) of the readings, anomalies left out. */
  function stats(values, spreadDeg = 1) {
    const out = anomalies(values, spreadDeg);
    const kept = values.filter((_, k) => !out.includes(k));
    const min = Math.min(...kept);
    const max = Math.max(...kept);
    const mean = kept.reduce((a, b) => a + b, 0) / kept.length;
    const uncertainty = (max - min) / 2;
    return { kept, anomalies: out, mean, min, max, range: max - min, uncertainty, percent: (100 * uncertainty) / mean };
  }

  /**
   * The sidereal day from a set of readings over t minutes: from the mean,
   * with the uncertainty as half the range of the days the smallest and
   * largest kept angles give.
   */
  function result(values, exposureMin, spreadDeg = 1) {
    const s = stats(values, spreadDeg);
    const day = siderealDayFrom(s.mean, exposureMin);
    const longest = siderealDayFrom(s.min, exposureMin);
    const shortest = siderealDayFrom(s.max, exposureMin);
    const uncertainty = (longest - shortest) / 2;
    return { ...s, dayMin: day, shortestMin: shortest, longestMin: longest, dayUncertaintyMin: uncertainty, dayPercent: (100 * uncertainty) / day };
  }

  /** Minutes as "23 h 56 min". */
  function hoursAndMinutes(totalMin) {
    const m = Math.round(totalMin);
    return `${Math.floor(m / 60)} h ${m % 60} min`;
  }

  const api = {
    SIDEREAL_DAY_MIN,
    SOLAR_DAY_MIN,
    arcAngleDeg,
    siderealDayFrom,
    readings,
    anomalies,
    stats,
    result,
    hoursAndMinutes,
  };
  if (isNode && module.exports) {
    module.exports = api;
  } else {
    window.StarTrails = api;
  }
})();
