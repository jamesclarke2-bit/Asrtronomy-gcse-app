/**
 * Tides
 * -----
 * The simple "equilibrium tide" model behind notes/tides.html: the
 * Moon's and Sun's tidal effects each raise two bulges, on the sides of
 * Earth facing towards and away from them, and the two add up. Real
 * tides also depend on coastlines and ocean depth, so this explains the
 * pattern (two highs and two lows a day, spring and neap tides) rather
 * than predicting heights or times at any real port.
 *
 * Tidal effect scales with mass / distance cubed, because it comes from
 * the *difference* in pull across Earth; gravitational pull scales with
 * mass / distance squared. Masses are the standard values (Sun
 * 1.989e30 kg, Moon 7.342e22 kg); distances match src/measuringTheSky.js.
 *
 * Wrapped in a function so its helpers don't leak into the shared
 * global scope of the page's other plain <script> tags.
 */
(function () {
  const RAD = Math.PI / 180;

  const SUN_MASS_KG = 1.989e30;
  const MOON_MASS_KG = 7.342e22;
  const MOON_DISTANCE_KM = 384400;
  const SUN_DISTANCE_KM = 149597870.7;

  // Mean time between the Moon crossing the meridian on successive days:
  // 24 h 50 min, because the Moon moves on along its orbit while Earth turns.
  const LUNAR_DAY_HOURS = 24 + 50 / 60;

  // How strongly the Sun and Moon pull on Earth as a whole (Sun / Moon).
  function sunToMoonPullRatio() {
    return (SUN_MASS_KG / MOON_MASS_KG) * (MOON_DISTANCE_KM / SUN_DISTANCE_KM) ** 2;
  }

  // How strong the Sun's tidal effect is compared with the Moon's.
  function sunToMoonTideRatio() {
    return (SUN_MASS_KG / MOON_MASS_KG) * (MOON_DISTANCE_KM / SUN_DISTANCE_KM) ** 3;
  }

  const TIDE_RATIO = sunToMoonTideRatio();

  // Tidal height raised by one body at a point `angleDeg` from the line
  // to it, in units of that body's maximum: +1 under it and opposite it
  // (the two bulges), -0.5 at right angles (the low water in between).
  function bulge(angleDeg) {
    const c = Math.cos(angleDeg * RAD);
    return (3 * c * c - 1) / 2;
  }

  // Combined height at a point on Earth's equator, `angleFromSunDeg` round
  // from the direction of the Sun, when the Moon is `elongationDeg` from
  // the Sun (0 = new Moon, 90 = first quarter, 180 = full). In units of
  // the Moon's own maximum.
  function waterHeight(angleFromSunDeg, elongationDeg) {
    return bulge(angleFromSunDeg - elongationDeg) + TIDE_RATIO * bulge(angleFromSunDeg);
  }

  // Tidal range (high water minus low water over a day), as a fraction of
  // the range at spring tides. The Moon's and Sun's twice-daily rises
  // combine like two waves: in step at new and full Moon, and half a
  // cycle out of step at the quarters.
  function rangeFraction(elongationDeg) {
    const r = TIDE_RATIO;
    const combined = Math.sqrt(1 + r * r + 2 * r * Math.cos(2 * elongationDeg * RAD));
    return combined / (1 + r);
  }

  // Spring range divided by neap range.
  function springToNeapRatio() {
    return (1 + TIDE_RATIO) / (1 - TIDE_RATIO);
  }

  // Which kind of tides a given Moon phase brings: within 22.5° (about
  // 1.8 days) of new or full Moon counts as spring tides, the same
  // either side of a quarter as neap tides.
  const WINDOW_DEG = 22.5;
  function tideType(elongationDeg) {
    const e = ((elongationDeg % 180) + 180) % 180;
    if (e <= WINDOW_DEG || e >= 180 - WINDOW_DEG) return 'spring';
    if (Math.abs(e - 90) <= WINDOW_DEG) return 'neap';
    return e < 90 ? 'towards-neap' : 'towards-spring';
  }

  // The next spring and neap tides after a point in the lunar cycle,
  // given as days from now, from the Moon's age in days: spring at new
  // (age 0) and full Moon, neap at the two quarters.
  function nextSpringAndNeap(ageDays, synodicMonthDays) {
    const quarter = synodicMonthDays / 4;
    const next = (offset) => {
      let t = offset;
      while (t <= ageDays + 1e-9) t += 2 * quarter;
      return t - ageDays;
    };
    return { springInDays: next(0), neapInDays: next(quarter) };
  }

  const api = {
    SUN_MASS_KG,
    MOON_MASS_KG,
    MOON_DISTANCE_KM,
    SUN_DISTANCE_KM,
    LUNAR_DAY_HOURS,
    TIDE_RATIO,
    sunToMoonPullRatio,
    sunToMoonTideRatio,
    bulge,
    waterHeight,
    rangeFraction,
    springToNeapRatio,
    tideType,
    nextSpringAndNeap,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.Tides = api;
  }
})();
