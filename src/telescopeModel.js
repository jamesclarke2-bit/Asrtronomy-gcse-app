/**
 * The three telescope formulas on the exam data sheet (src/specData.js
 * doesn't hold these — they're equations, not given constants — but
 * every number this module needs that *is* given, like the speed of
 * light, comes from there):
 *
 *   magnification = f(objective) / f(eyepiece)
 *   light grasp (relative) = (D1 / D2)^2 — proportional to aperture squared
 *   angular resolution (Rayleigh criterion) = 1.22 * wavelength / D, in radians
 *
 * The spec states resolution qualitatively (better with a larger
 * objective diameter, worse at longer wavelengths); the Rayleigh
 * criterion is the actual formula behind that statement, used here for
 * real numbers.
 */
(function () {
  function magnification(objectiveFocalLengthMm, eyepieceFocalLengthMm) {
    return objectiveFocalLengthMm / eyepieceFocalLengthMm;
  }

  // Relative light grasp of one aperture over another — how many times
  // more light a telescope of diameterMm collects than one of
  // referenceDiameterMm (or the human eye's pupil, see
  // DARK_ADAPTED_EYE_PUPIL_MM below).
  function lightGraspRatio(diameterMm, referenceDiameterMm) {
    return Math.pow(diameterMm / referenceDiameterMm, 2);
  }

  const RADIANS_TO_ARCSEC = (180 * 3600) / Math.PI;

  // Rayleigh criterion: the smallest angular separation a telescope of
  // aperture diameterMm can resolve, at wavelengthNm, in arcseconds.
  function resolutionArcsec(wavelengthNm, diameterMm) {
    const wavelengthM = wavelengthNm * 1e-9;
    const diameterM = diameterMm * 1e-3;
    const radians = (1.22 * wavelengthM) / diameterM;
    return radians * RADIANS_TO_ARCSEC;
  }

  // A typical fully dark-adapted human pupil — a standard physiology
  // figure, not on the exam data sheet, used as the "human eye" baseline
  // for light-grasp comparisons.
  const DARK_ADAPTED_EYE_PUPIL_MM = 7;

  const api = { magnification, lightGraspRatio, resolutionArcsec, RADIANS_TO_ARCSEC, DARK_ADAPTED_EYE_PUPIL_MM };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.TelescopeModel = api;
  }
})();
