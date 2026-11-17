/**
 * Redshift of galaxies for notes/redshift.html (spec 16.1-16.3).
 *
 * The relation is the exam's own, from the data sheet:
 *   (wavelength shift) ÷ (emitted wavelength) = v ÷ c
 * with c from src/specData.js (3.0 × 10⁸ m/s, used here as 300,000 km/s).
 *
 * The absorption lines are hydrogen's four visible lines, the same
 * values src/spectra.js gives notes/reading-a-spectrum.html, so both
 * pages agree.
 *
 * PRACTICE_GALAXIES are made-up example galaxies for the page's own
 * practice calculator: each shows one line at an observed wavelength
 * rounded to 0.1 nm, and its answer is worked out from that rounded
 * reading, exactly as a student would.
 */
(function () {
  const SpecData = typeof require !== 'undefined' ? require('./specData') : window.SpecData;
  const Spectra = typeof require !== 'undefined' ? require('./spectra') : window.Spectra;

  const C_M_PER_S = SpecData.CONSTANTS.speedOfLightMPerS;
  const C_KM_PER_S = C_M_PER_S / 1000;

  const LINE_NAMES = { 656.3: 'Hα', 486.1: 'Hβ', 434.0: 'Hγ', 410.2: 'Hδ' };
  const LINES = Spectra.ELEMENTS.hydrogen.lines.map((nm) => ({ nm, name: LINE_NAMES[nm] }));

  // Slider range for the page's main diagram: 0 to 20,000 km/s, so the
  // 656.3 nm line stays inside the drawn range (it reaches about 700 nm).
  const SLIDER = { min: 0, max: 20000, step: 500, start: 6000 };
  const DRAW_RANGE_NM = { min: 380, max: 720 };

  function wavelengthShift(emittedNm, vKmPerS) {
    return (emittedNm * vKmPerS) / C_KM_PER_S;
  }

  function observedWavelength(emittedNm, vKmPerS) {
    return emittedNm + wavelengthShift(emittedNm, vKmPerS);
  }

  /** v = c × (wavelength shift) ÷ (emitted wavelength), in km/s. */
  function velocityFromWavelengths(emittedNm, observedNm) {
    return (C_KM_PER_S * (observedNm - emittedNm)) / emittedNm;
  }

  function round1(x) {
    return Math.round(x * 10) / 10;
  }

  const PRACTICE_GALAXIES = [
    { id: 'A', lineNm: 656.3, trueVKmPerS: 6000 },
    { id: 'B', lineNm: 486.1, trueVKmPerS: 12000 },
    { id: 'C', lineNm: 434.0, trueVKmPerS: 15000 },
  ].map((g) => {
    const observedNm = round1(observedWavelength(g.lineNm, g.trueVKmPerS));
    const shiftNm = round1(observedNm - g.lineNm);
    return { ...g, name: LINE_NAMES[g.lineNm], observedNm, shiftNm, answerKmPerS: velocityFromWavelengths(g.lineNm, observedNm) };
  });

  /** True when `value` is within 2% of `target` (inclusive). */
  function withinTwoPercent(value, target) {
    const v = Number(value);
    return Number.isFinite(v) && Math.abs(v - target) <= 0.02 * Math.abs(target) * (1 + 1e-9);
  }

  const api = {
    C_M_PER_S,
    C_KM_PER_S,
    LINES,
    SLIDER,
    DRAW_RANGE_NM,
    PRACTICE_GALAXIES,
    wavelengthShift,
    observedWavelength,
    velocityFromWavelengths,
    withinTwoPercent,
    round1,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.Redshift = api;
  }
})();
