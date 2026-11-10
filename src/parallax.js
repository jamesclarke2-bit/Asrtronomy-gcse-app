/**
 * Trigonometric parallax: the angle p (in arcseconds) a star's nearby
 * position appears to shift against the distant background as Earth
 * moves from one side of its orbit to the other, and the distance that
 * angle implies.
 *
 * A parsec is, by definition, the distance at which 1 AU subtends an
 * angle of exactly 1 arcsecond — so d (pc) = 1 / p (arcsec) falls
 * straight out of that definition (opposite/adjacent = tan(p), and at
 * these tiny angles tan(p) ≈ p in radians, so d = 1 AU / p(radians) =
 * (1 / p(arcsec)) parsecs once AU_PER_PARSEC itself is defined the same
 * way). See notes/parallax.html's own opening diagram for p itself:
 * HALF the total apparent shift between the two observing positions,
 * measured from the Sun to Earth, not Earth-to-Earth.
 */
const SpecData = typeof require !== 'undefined' ? require('./specData') : window.SpecData;

const ARCSECONDS_PER_DEGREE = 3600;
const ARCMINUTES_PER_DEGREE = 60;
const ARCSECONDS_PER_ARCMINUTE = 60;

function arcsecondsToRadians(arcsec) {
  return (arcsec / ARCSECONDS_PER_DEGREE) * (Math.PI / 180);
}

// 1 AU, in AU, subtends exactly 1 arcsecond at this many AU — the
// precise geometric definition of the parsec, computed rather than
// hand-typed so "206,265" is always derivable, never just asserted.
// tan, not the small-angle approximation, since this is the one place
// the exact definition matters; everywhere else (d = 1/p) the
// small-angle approximation this value itself justifies is used directly.
const AU_PER_PARSEC = 1 / Math.tan(arcsecondsToRadians(1));

// The exam data sheet's own figures (src/specData.js) — reused here
// rather than re-declared, so a pc-to-ly conversion can never disagree
// with what the rest of the site already states.
const PARSEC_LIGHT_YEARS = SpecData.CONSTANTS.parsecLightYears;
const METRES_PER_AU = SpecData.CONSTANTS.auKm * 1000;
const METRES_PER_PARSEC = AU_PER_PARSEC * METRES_PER_AU;

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

const parallaxApi = {
  ARCSECONDS_PER_DEGREE,
  ARCMINUTES_PER_DEGREE,
  ARCSECONDS_PER_ARCMINUTE,
  AU_PER_PARSEC,
  PARSEC_LIGHT_YEARS,
  METRES_PER_PARSEC,
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
