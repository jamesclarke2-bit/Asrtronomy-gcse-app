/**
 * notes/observing-techniques.html's "Day and night" diagrams (u1.26):
 * which direction a midnight observer faces, and which zodiac
 * constellation sits in that direction through the year.
 *
 * At midnight, an observer faces directly away from the Sun — so the
 * part of the sky overhead at midnight is the point on the ecliptic
 * opposite the Sun's own apparent position. With the Sun at the
 * origin and Earth at heliocentric longitude L (src/planetaryMotion.js's
 * own heliocentricLongitude), the Sun's apparent geocentric longitude
 * as seen from Earth is L + 180 (the reverse direction); the point
 * opposite THAT is (L + 180) + 180 = L. So the midnight-visible
 * ecliptic longitude is simply Earth's own heliocentric longitude —
 * no separate calculation, reusing PlanetaryMotion's existing engine
 * rather than a second approximation of the same orbit. Takes
 * PlanetaryMotion as an injected dependency (deps.PlanetaryMotion), the
 * same pattern src/fullMoonNames.js uses, so this stays testable
 * without a real DOM.
 */
(function () {
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  /** A representative date (the 15th, noon UTC) for a given month index (0 = January), in the given year. */
  function dateForMonth(monthIndex, year) {
    return new Date(Date.UTC(year, monthIndex, 15, 12, 0, 0));
  }

  /** The ecliptic longitude (degrees) of the point directly overhead at local midnight on the given date. */
  function midnightEclipticLongitudeDeg(date, deps) {
    return deps.PlanetaryMotion.heliocentricLongitude('earth', date);
  }

  /** Which traditional zodiac constellation is visible at midnight on the given date. */
  function zodiacVisibleAtMidnight(date, deps) {
    return deps.PlanetaryMotion.zodiacSignForLongitude(midnightEclipticLongitudeDeg(date, deps));
  }

  const api = {
    MONTH_NAMES,
    dateForMonth,
    midnightEclipticLongitudeDeg,
    zodiacVisibleAtMidnight,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.DayAndNight = api;
  }
})();
