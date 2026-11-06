/**
 * notes/ecliptic-zodiac.html's "which constellation is the Sun in?"
 * engine — the real, unequal-width IAU/astronomy boundaries (thirteen
 * constellations, including Ophiuchus), built directly on
 * src/solarPosition.js's own apparent ecliptic longitude rather than a
 * second longitude model. Both sunConstellation and
 * midnightConstellation read the SAME longitude for a given date, so
 * the midnight constellation is always exactly 180 degrees from the
 * Sun's own — opposite by construction, not by coincidence.
 *
 * Boundary CALENDAR dates are the commonly-published approximate dates
 * the Sun crosses each IAU constellation boundary along the ecliptic —
 * first draft, to be checked by the teacher, since the real boundaries
 * are irregular polygons on the sky, not single days, and the dates
 * themselves slowly drift with precession (src/curriculum.js's u2.29).
 * Each calendar date is converted into an ecliptic-longitude boundary
 * by asking SolarPosition itself where the Sun actually is on that
 * date in a fixed reference year, so the lookup stays self-consistent
 * with whatever longitude a caller later passes in, rather than a
 * second, independently-estimated set of degree values.
 *
 * This is deliberately a separate, parallel convention from the
 * traditional, equal-30-degree ASTROLOGY signs (twelve signs, no
 * Ophiuchus, popularly fixed calendar dates) — already built as
 * src/planetaryMotion.js's ZODIAC_SIGNS/zodiacSignForLongitude and
 * reused as-is here, not reimplemented. See
 * notes/ecliptic-zodiac.html for both, shown side by side.
 */
(function () {
  const REFERENCE_YEAR = 2025;

  // The constellation the Sun ENTERS on each date, continuing until the
  // next entry's date (wrapping from Sagittarius back to Capricornus).
  const IAU_BOUNDARY_DATES = [
    { name: 'Capricornus', month: 0, day: 20 },
    { name: 'Aquarius', month: 1, day: 16 },
    { name: 'Pisces', month: 2, day: 11 },
    { name: 'Aries', month: 3, day: 18 },
    { name: 'Taurus', month: 4, day: 13 },
    { name: 'Gemini', month: 5, day: 21 },
    { name: 'Cancer', month: 6, day: 20 },
    { name: 'Leo', month: 7, day: 10 },
    { name: 'Virgo', month: 8, day: 16 },
    { name: 'Libra', month: 9, day: 30 },
    { name: 'Scorpius', month: 10, day: 23 },
    { name: 'Ophiuchus', month: 10, day: 29 },
    { name: 'Sagittarius', month: 11, day: 17 },
  ];

  let cachedBoundaries = null;

  // {name, longitudeDeg} for each entry above, sorted ascending by the
  // longitude SolarPosition itself reports for that calendar date —
  // memoized, since SolarPosition's output for a fixed date never
  // changes within a session.
  function boundariesByLongitude(deps) {
    if (!cachedBoundaries) {
      cachedBoundaries = IAU_BOUNDARY_DATES.map(({ name, month, day }) => {
        const date = new Date(Date.UTC(REFERENCE_YEAR, month, day, 12, 0, 0));
        const longitudeDeg = deps.SolarPosition.getSunPosition(date, 0, 0).apparentLongitude;
        return { name, longitudeDeg };
      }).sort((a, b) => a.longitudeDeg - b.longitudeDeg);
    }
    return cachedBoundaries;
  }

  /** Which IAU constellation the ecliptic is "in" at a given longitude (degrees). */
  function constellationForLongitude(longitudeDeg, deps) {
    const boundaries = boundariesByLongitude(deps);
    const normalized = ((longitudeDeg % 360) + 360) % 360;
    // Sorted ascending: the last boundary at or before `normalized` is
    // the constellation we're currently in; wraps to the final
    // (highest-longitude) entry if normalized sits before the first.
    let result = boundaries[boundaries.length - 1];
    for (let i = 0; i < boundaries.length; i += 1) {
      if (boundaries[i].longitudeDeg <= normalized) result = boundaries[i];
      else break;
    }
    return result.name;
  }

  /** The Sun's own IAU constellation on the given date. */
  function sunConstellation(date, deps) {
    const longitude = deps.SolarPosition.getSunPosition(date, 0, 0).apparentLongitude;
    return constellationForLongitude(longitude, deps);
  }

  /** The IAU constellation directly opposite the Sun's — overhead at local midnight. */
  function midnightConstellation(date, deps) {
    const longitude = deps.SolarPosition.getSunPosition(date, 0, 0).apparentLongitude;
    return constellationForLongitude(longitude + 180, deps);
  }

  const api = {
    REFERENCE_YEAR,
    IAU_BOUNDARY_DATES,
    boundariesByLongitude,
    constellationForLongitude,
    sunConstellation,
    midnightConstellation,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.EclipticZodiac = api;
  }
})();
