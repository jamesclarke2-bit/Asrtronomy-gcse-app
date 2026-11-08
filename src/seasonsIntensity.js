/**
 * Pure data/geometry for notes/earth-structure.html's "Why does the tilt
 * cause the seasons?" scaffolded section — no DOM, unit-testable here,
 * drawn by notes/earth-structure.js. Three small pieces of physics, each
 * backing one step of that section:
 *
 *  1. Earth-Sun distance through the year (the "it's not distance"
 *     myth-buster) — straight from SolarPosition.getSunPosition's own
 *     distanceAu, the same Earth-Sun distance the rest of the site
 *     already derives from (e.g. src/eclipseGeometry.js). The exam data
 *     sheet rounds 1 AU to 1.5 x 10^8 km (src/specData.js's own
 *     CONSTANTS.auKm, spec point 7.6); this module uses the precise
 *     value instead, because the whole point of the chart is the small
 *     (~3%) real variation across the year, which the rounded figure
 *     would blur.
 *  2. Relative intensity (energy per square metre) from the Sun's
 *     altitude — the "torch beam" step. A beam of fixed width landing on
 *     flat ground spreads over an area inversely proportional to
 *     sin(altitude): high Sun (near 90 degrees) concentrates it onto a
 *     small patch, low Sun spreads the same beam thin. Energy per square
 *     metre is the reciprocal of that spread, so it's proportional to
 *     sin(altitude) directly, normalised to 1 at 90 degrees (the Sun
 *     overhead) where this already matches src/visibilityFactors.js's
 *     pathLengthMultiplier(altitude) = 1/sin(alt) for the same reason —
 *     one sine relationship, two names for its two uses (atmosphere
 *     path length there, ground-patch area here).
 *  3. Day length and noon altitude at a given latitude/date — thin
 *     wrappers over SeasonsDiagram's own noonAltitudeDeg/dayLengthMinutes
 *     (themselves over SolarPosition), so the "putting it together" step
 *     never recomputes anything the rest of the site doesn't already
 *     compute the same way.
 */
function makeSeasonsIntensity(SeasonsDiagram, SolarPosition) {
  // Precise mean Earth-Sun distance in km (1 AU) — see this file's own
  // header for why the rounded exam figure (src/specData.js's
  // CONSTANTS.auKm = 1.5e8) isn't used here. Same literal value as
  // src/eclipseGeometry.js's and src/orbitalMechanics.js's own AU_KM.
  const AU_KM = 149597870.7;

  /** Earth-Sun distance in km on a given date, from the live orbit engine. */
  function earthSunDistanceKm(date) {
    return SolarPosition.getSunPosition(date, 0, 0).distanceAu * AU_KM;
  }

  /**
   * Earth-Sun distance in km for every day of the reference year (see
   * SeasonsDiagram.dateForDayIndex) — the series the Step 1 chart plots.
   */
  function yearlyDistanceSeriesKm() {
    const series = [];
    for (let dayIndex = 0; dayIndex < 365; dayIndex += 1) {
      series.push({ dayIndex, distanceKm: earthSunDistanceKm(SeasonsDiagram.dateForDayIndex(dayIndex)) });
    }
    return series;
  }

  /**
   * Energy landing on each square metre of flat ground, for a beam of
   * sunlight at the given altitude above the horizon, relative to the
   * same beam with the Sun directly overhead (altitude 90 degrees) — see
   * this file's header. 1 at 90 degrees, falling to 0 at the horizon.
   */
  function relativeIntensity(altitudeDeg) {
    return Math.sin((altitudeDeg * Math.PI) / 180);
  }

  /**
   * How many times wider the lit patch is than the overhead-Sun case,
   * for the same beam — the reciprocal of relativeIntensity, and the
   * figure the Step 2 "torch beam" diagram actually draws (the patch
   * grows, intensity falls, from the same one sine relationship).
   */
  function patchWidthMultiplier(altitudeDeg) {
    return 1 / relativeIntensity(altitudeDeg);
  }

  return {
    AU_KM,
    earthSunDistanceKm,
    yearlyDistanceSeriesKm,
    relativeIntensity,
    patchWidthMultiplier,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  const SeasonsDiagram = require('./seasonsDiagram');
  const SolarPosition = require('./solarPosition');
  module.exports = { ...makeSeasonsIntensity(SeasonsDiagram, SolarPosition), makeSeasonsIntensity };
} else if (typeof window !== 'undefined') {
  window.SeasonsIntensity = { ...makeSeasonsIntensity(window.SeasonsDiagram, window.SolarPosition), makeSeasonsIntensity };
}
