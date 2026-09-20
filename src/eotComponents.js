/**
 * Approximate decomposition of the equation of time into its two
 * physical causes, using the same ~1-minute-accurate formula stated on
 * sims/equation-of-time.html:
 *
 *   EoT (minutes) ~= 9.87 sin(2B) - 7.53 cos(B) - 1.5 sin(B)
 *   where B = (360/365) x (d - 81), d = day of year (1 to 365)
 *
 * Axial tilt contributes the 9.87 sin(2B) term (period of half a year,
 * zero at every solstice and equinox); orbital eccentricity contributes
 * the remaining -7.53 cos(B) - 1.5 sin(B) (period of a full year, peaking
 * near perihelion/aphelion in early January/July).
 *
 * This is a separate, simpler model from solarPosition.js's precise
 * NOAA-style calculation used for the main graph and most questions on
 * that page — the two nearly agree (within about a minute) but aren't
 * identical, which the page says explicitly.
 *
 * Wrapped in an IIFE (unlike solarPosition.js) so its internal helpers
 * — toRad in particular — don't collide with same-named top-level
 * bindings from other classic <script> tags sharing this page's global
 * scope.
 */
(function () {
  function angleForDay(dayIndex) {
    const dayOfYear = dayIndex + 1;
    return (360 / 365) * (dayOfYear - 81);
  }

  function toRad(deg) {
    return (deg * Math.PI) / 180;
  }

  function obliquityComponent(dayIndex) {
    const B = angleForDay(dayIndex);
    return 9.87 * Math.sin(2 * toRad(B));
  }

  function eccentricityComponent(dayIndex) {
    const B = angleForDay(dayIndex);
    return -7.53 * Math.cos(toRad(B)) - 1.5 * Math.sin(toRad(B));
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { obliquityComponent, eccentricityComponent };
  } else if (typeof window !== 'undefined') {
    window.EotComponents = { obliquityComponent, eccentricityComponent };
  }
})();
