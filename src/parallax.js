/**
 * Trigonometric parallax: p is the angle at the star, in the right-angled
 * triangle Sun-Earth-star, between the direction to the Sun and the
 * direction to the Earth (the right angle sits at the Sun, with the 1 AU
 * Sun-Earth distance as one side). The distance that angle implies
 * follows from the triangle's geometry.
 *
 * A parsec is, by definition, the distance at which 1 AU subtends an
 * angle of exactly 1 arcsecond — so d (pc) = 1 / p (arcsec) falls
 * straight out of that definition (opposite/adjacent = tan(p), and at
 * these tiny angles tan(p) ≈ p in radians, so d = 1 AU / p(radians) =
 * (1 / p(arcsec)) parsecs once AU_PER_PARSEC itself is defined the same
 * way). See notes/parallax.html's own geometry diagram for p marked at
 * the star; two photographs six months apart (Earth at opposite sides of
 * its orbit) show the star having moved by 2p, so p is HALF of that
 * measured movement — a consequence of the geometry, not its definition.
 */
const SpecData = typeof require !== 'undefined' ? require('./specData') : window.SpecData;

const ARCSECONDS_PER_DEGREE = 3600;
const ARCMINUTES_PER_DEGREE = 60;
const ARCSECONDS_PER_ARCMINUTE = 60;

function arcsecondsToRadians(arcsec) {
  return (arcsec / ARCSECONDS_PER_DEGREE) * (Math.PI / 180);
}

// The precise geometric definition of the parsec: 1 AU, in AU, subtends
// exactly 1 arcsecond at this many AU. tan, not the small-angle
// approximation, since this is the one place the exact definition
// matters; everywhere else (d = 1/p) the small-angle approximation
// this value itself justifies is used directly. Kept only as a
// reference check (see the test asserting it's close to the data
// sheet's own figure below) — not exported, since nothing on the page
// uses it; see AU_PER_PARSEC just below for what actually is.
const AU_PER_PARSEC_PRECISE = 1 / Math.tan(arcsecondsToRadians(1));

// The exam data sheet's own figures (src/specData.js) — reused here
// rather than re-declared, so a pc-to-ly conversion can never disagree
// with what the rest of the site already states. AU_PER_PARSEC and
// METRES_PER_PARSEC are likewise derived from the data sheet's own
// rounded parsecKm (3.1 x 10^13 km), not from AU_PER_PARSEC_PRECISE
// above — about 206,667 AU, not the geometrically precise ~206,265 —
// so that notes/parallax.html's own worked figures always match what
// the data sheet gives students, the same convention PARSEC_LIGHT_YEARS
// already follows. The ~0.2% gap between the two is explained on the
// page itself, next to where this figure is shown.
const PARSEC_LIGHT_YEARS = SpecData.CONSTANTS.parsecLightYears;
const METRES_PER_AU = SpecData.CONSTANTS.auKm * 1000;
const AU_PER_PARSEC = SpecData.CONSTANTS.parsecKm / SpecData.CONSTANTS.auKm;
const METRES_PER_PARSEC = SpecData.CONSTANTS.parsecKm * 1000;

/**
 * d (pc) = 1 / p (arcsec) — the defining relationship of the parsec.
 * @param {number} parallaxArcsec
 * @returns {number} distance in parsecs
 */
function distanceFromParallax(parallaxArcsec) {
  return 1 / parallaxArcsec;
}

/**
 * The inverse: p (arcsec) = 1 / d (pc).
 * @param {number} distancePc
 * @returns {number} parallax angle in arcseconds
 */
function parallaxFromDistance(distancePc) {
  return 1 / distancePc;
}

function parsecToLightYears(distancePc) {
  return distancePc * PARSEC_LIGHT_YEARS;
}

function lightYearsToParsecs(distanceLy) {
  return distanceLy / PARSEC_LIGHT_YEARS;
}

/**
 * The range of distances a parallax measurement with a given
 * uncertainty could actually mean — a larger parallax reading gives a
 * nearer (smaller) distance, so the uncertainty's two ends swap places:
 * the "+" on p gives the near end of the distance range, the "-" gives
 * the far end (or no upper bound at all, once the "-" reaches zero).
 * @param {number} parallaxArcsec
 * @param {number} uncertaintyArcsec
 * @returns {{nearPc: number, farPc: number|null}}
 */
function parallaxUncertaintyToDistanceRange(parallaxArcsec, uncertaintyArcsec) {
  const lowerParallax = parallaxArcsec - uncertaintyArcsec;
  return {
    nearPc: distanceFromParallax(parallaxArcsec + uncertaintyArcsec),
    farPc: lowerParallax > 0 ? distanceFromParallax(lowerParallax) : null,
  };
}

// Five real stars' measured parallax angles (first draft, to be checked by
// the teacher — see notes/parallax.html's own star-list section) — the
// distance (pc and ly) is always computed from this, never a second,
// separately-typed figure. Kept here, rather than in notes/parallax.js's
// own page script, so notes/magnitude.html's distance-modulus tier can
// reuse the exact same distances (e.g. Sirius at ~2.64 pc) instead of
// re-typing a figure that could drift out of step between the two pages.
const STARS = [
  { name: 'Proxima Centauri', parallaxArcsec: 0.768 },
  { name: 'Alpha Centauri', parallaxArcsec: 0.747 },
  { name: "Barnard's Star", parallaxArcsec: 0.547 },
  { name: 'Sirius', parallaxArcsec: 0.379 },
  { name: 'Vega', parallaxArcsec: 0.130 },
];

const parallaxApi = {
  ARCSECONDS_PER_DEGREE,
  ARCMINUTES_PER_DEGREE,
  ARCSECONDS_PER_ARCMINUTE,
  AU_PER_PARSEC,
  PARSEC_LIGHT_YEARS,
  METRES_PER_PARSEC,
  STARS,
  arcsecondsToRadians,
  distanceFromParallax,
  parallaxFromDistance,
  parsecToLightYears,
  lightYearsToParsecs,
  parallaxUncertaintyToDistanceRange,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = parallaxApi;
} else if (typeof window !== 'undefined') {
  window.Parallax = parallaxApi;
}
