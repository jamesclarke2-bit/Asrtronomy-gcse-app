/**
 * Simplified schematic model of the sunspot "butterfly diagram":
 * sunspots begin each ~11-year solar cycle at high latitude (around
 * 35 degrees, in both hemispheres) and drift toward the equator as
 * the cycle progresses. Real migration is somewhat front-loaded; this
 * uses a linear approximation, which is enough to teach the shape and
 * the two headline numbers (cycle length, starting latitude) at
 * GCSE level.
 *
 * Shared between sims/sun-declination.js (drawing the diagram) and
 * src/solarActivityQuestions.js (grading questions about it), so both
 * always agree with each other rather than keeping two independent
 * copies of the same two numbers in sync by hand.
 */

const CYCLE_LENGTH_YEARS = 11;
const LATITUDE_AT_CYCLE_START_DEG = 35;

/**
 * The typical |latitude| (degrees) of sunspots a given number of
 * years into a cycle: LATITUDE_AT_CYCLE_START_DEG at yearsIntoCycle
 * 0, falling in a straight line to 0 at CYCLE_LENGTH_YEARS. Clamped
 * at both ends, so it's safe to call with any value.
 */
function latitudeEnvelopeDeg(yearsIntoCycle) {
  const clamped = Math.max(0, Math.min(CYCLE_LENGTH_YEARS, yearsIntoCycle));
  return LATITUDE_AT_CYCLE_START_DEG * (1 - clamped / CYCLE_LENGTH_YEARS);
}

const butterflyDiagramApi = { CYCLE_LENGTH_YEARS, LATITUDE_AT_CYCLE_START_DEG, latitudeEnvelopeDeg };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = butterflyDiagramApi;
} else if (typeof window !== 'undefined') {
  window.ButterflyDiagram = butterflyDiagramApi;
}
