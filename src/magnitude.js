/**
 * Stellar magnitude: how bright a star looks (apparent magnitude, m) versus
 * how bright it actually is (absolute magnitude, M — the apparent magnitude
 * it would have at the standard distance of 10 parsecs), and the maths that
 * connects them.
 *
 * The magnitude scale is logarithmic and runs backwards: Pogson (1856) fixed
 * a difference of exactly 5 magnitudes as exactly a factor of 100 in
 * brightness (flux), so one magnitude step is the fifth root of 100,
 * 100^(1/5) = 10^(2/5) = 10^0.4 ≈ 2.512 — MAGNITUDE_RATIO_PER_STEP below.
 * A magnitude difference of (m1 - m2) then corresponds to a flux ratio
 * I2 / I1 = 10^(0.4 (m1 - m2)); brightnessRatio takes that difference
 * directly (not m1 and m2 separately — the subtraction is trivial and left
 * to the caller) so it mirrors magnitudeDifference, its own exact inverse.
 *
 * Distance modulus (m - M) follows from the inverse-square law: flux falls
 * as 1 / d^2, so a distance ratio of 10 is a flux ratio of 100, i.e. exactly
 * 5 magnitudes — giving m - M = 5 log10(d / 10 pc). This formula is one of
 * the six the exam's own data sheet gives directly (see
 * notes/data-sheet.html's equations table), so despite reaching the
 * trickiest tier on this page, it is core 1AS0 content, not stretch beyond
 * it — see notes/magnitude.html's own coverage note for the full picture of
 * what is and isn't in the specification.
 */

const APPROX_RATIO_PER_STEP = 2.5;
const MAGNITUDE_RATIO_PER_STEP = Math.pow(10, 0.4); // exact: 10^0.4 ≈ 2.512

/**
 * The flux ratio I2 / I1 implied by a magnitude difference m1 - m2 (the
 * brighter object, lower or more negative m, is object 2 when the
 * difference is positive). Exact: 10^(0.4 * magnitudeDiff).
 */
function brightnessRatio(magnitudeDiff) {
  return Math.pow(10, 0.4 * magnitudeDiff);
}

// The common classroom shortcut (2.5, not the exact 2.512) for quick
// mental-maths estimates — never used for the "exact" readout.
function approxBrightnessRatio(magnitudeDiff) {
  return Math.pow(APPROX_RATIO_PER_STEP, magnitudeDiff);
}

/**
 * The reverse of brightnessRatio: the magnitude difference m1 - m2 implied
 * by a flux ratio I2 / I1. Exact: 2.5 * log10(ratio).
 */
function magnitudeDifference(fluxRatio) {
  return 2.5 * Math.log10(fluxRatio);
}

/**
 * The distance modulus itself, m - M, at a given distance in parsecs —
 * from the inverse-square law (see header): 5 * log10(d / 10 pc).
 */
function distanceModulus(distancePc) {
  return 5 * Math.log10(distancePc / 10);
}

/** Absolute magnitude M from an apparent magnitude m seen at distancePc. */
function absoluteFromApparent(apparentMagnitude, distancePc) {
  return apparentMagnitude - distanceModulus(distancePc);
}

/** Apparent magnitude m an object of absolute magnitude M would show at distancePc. */
function apparentFromAbsolute(absoluteMagnitude, distancePc) {
  return absoluteMagnitude + distanceModulus(distancePc);
}

/** Distance in parsecs implied by an apparent magnitude m and absolute magnitude M. */
function distanceFromModulus(apparentMagnitude, absoluteMagnitude) {
  return 10 * Math.pow(10, (apparentMagnitude - absoluteMagnitude) / 5);
}

const magnitudeApi = {
  APPROX_RATIO_PER_STEP,
  MAGNITUDE_RATIO_PER_STEP,
  brightnessRatio,
  approxBrightnessRatio,
  magnitudeDifference,
  distanceModulus,
  absoluteFromApparent,
  apparentFromAbsolute,
  distanceFromModulus,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = magnitudeApi;
} else if (typeof window !== 'undefined') {
  window.Magnitude = magnitudeApi;
}
