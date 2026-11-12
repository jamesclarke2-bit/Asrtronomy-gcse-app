/**
 * Stellar spectra for notes/reading-a-spectrum.html: reference line
 * patterns, the Doppler shift, element matching, which kind of
 * spectrum a set-up produces, and simple intensity curves for drawing.
 *
 * Wavelengths are in nanometres (nm), in air, to 0.1 nm. Hydrogen's
 * four visible Balmer lines and sodium's D lines are the values given
 * for this page; helium (neutral He I) and calcium (ionised Ca II H and
 * K, plus neutral Ca I at 422.7 nm) are standard laboratory values.
 *
 * Wien's constant and the Planck curve below are internal engine maths
 * only — neither is on the exam data sheet, and the page keeps the
 * temperature link qualitative.
 */
(function () {
  const SpecData = typeof require !== 'undefined' ? require('./specData') : window.SpecData;

  const RANGE_NM = { min: 380, max: 700 };

  const ELEMENTS = {
    hydrogen: { name: 'Hydrogen', symbol: 'H', lines: [656.3, 486.1, 434.0, 410.2] },
    helium: { name: 'Helium', symbol: 'He', lines: [447.1, 501.6, 587.6, 667.8] },
    sodium: { name: 'Sodium', symbol: 'Na', lines: [589.0, 589.6] },
    calcium: { name: 'Calcium', symbol: 'Ca', lines: [393.4, 396.8, 422.7] },
  };
  const ELEMENT_KEYS = ['hydrogen', 'helium', 'sodium', 'calcium'];

  // Tighter than the closest pair of different elements' lines (helium
  // 587.6 against sodium 589.0, 1.4 nm apart), so a helium line can never
  // be mistaken for a sodium one or the other way round.
  const MATCH_TOLERANCE_NM = 0.3;

  const SPEED_OF_LIGHT_M_PER_S = SpecData.CONSTANTS.speedOfLightMPerS;
  const WIEN_CONSTANT_NM_K = 2.898e6;

  function linesFor(elementKeys) {
    return elementKeys.flatMap((key) => ELEMENTS[key].lines).sort((a, b) => a - b);
  }

  /**
   * Observed wavelength of a line from a source moving along the line of
   * sight: positive velocity = receding (longer wavelength, redshift),
   * negative = approaching (shorter, blueshift). Non-relativistic, which
   * is all GCSE needs and accurate for any real star.
   */
  function dopplerShift(restNm, radialVelocityMPerS) {
    return restNm * (1 + radialVelocityMPerS / SPEED_OF_LIGHT_M_PER_S);
  }

  function radialVelocityFromShift(restNm, observedNm) {
    return ((observedNm - restNm) / restNm) * SPEED_OF_LIGHT_M_PER_S;
  }

  function shiftDirection(radialVelocityMPerS) {
    if (radialVelocityMPerS > 0) return 'redshift';
    if (radialVelocityMPerS < 0) return 'blueshift';
    return 'none';
  }

  /**
   * Which elements' complete line patterns appear among `observedNm`. An
   * element counts as present only if every one of its reference lines
   * has an observed line within the tolerance — one coincidental match
   * is not enough.
   */
  function matchElements(observedNm, toleranceNm = MATCH_TOLERANCE_NM) {
    return ELEMENT_KEYS.map((key) => {
      const matched = [];
      const missing = [];
      ELEMENTS[key].lines.forEach((line) => {
        if (observedNm.some((obs) => Math.abs(obs - line) <= toleranceNm)) matched.push(line);
        else missing.push(line);
      });
      return { key, present: missing.length === 0, matched, missing };
    });
  }

  function elementsPresent(observedNm, toleranceNm) {
    return matchElements(observedNm, toleranceNm).filter((r) => r.present).map((r) => r.key);
  }

  /**
   * Kirchhoff's three spectra. `view` is 'through' (looking at the hot
   * source, through the cloud if there is one) or 'side' (looking at the
   * cloud from one side, with nothing bright behind it).
   */
  function spectrumType({ sourceOn, cloudInFront, view }) {
    if (!sourceOn) return 'none';
    if (view === 'side') return cloudInFront ? 'emission' : 'none';
    return cloudInFront ? 'absorption' : 'continuous';
  }

  function peakWavelengthNm(temperatureK) {
    return WIEN_CONSTANT_NM_K / temperatureK;
  }

  // Planck's law, relative units only (constants folded together).
  function planck(nm, temperatureK) {
    const metres = nm * 1e-9;
    const c2 = 1.4388e-2; // m K
    return 1 / (Math.pow(metres, 5) * (Math.exp(c2 / (metres * temperatureK)) - 1));
  }

  /** Planck curve sampled across [minNm, maxNm], scaled so its own peak in that range is 1. */
  function blackbodyCurve(temperatureK, minNm, maxNm, steps) {
    const points = [];
    for (let i = 0; i <= steps; i += 1) {
      const nm = minNm + ((maxNm - minNm) * i) / steps;
      points.push({ nm, value: planck(nm, temperatureK) });
    }
    const max = Math.max(...points.map((p) => p.value));
    return points.map((p) => ({ nm: p.nm, value: p.value / max }));
  }

  function lineProfile(nm, centreNm, widthNm) {
    const x = (nm - centreNm) / widthNm;
    return Math.exp(-0.5 * x * x);
  }

  /**
   * Relative intensity (0-1) at one wavelength. `lines` is
   * [{nm, depth}]; continuous ignores them, absorption cuts dips into
   * the continuum, emission draws bright peaks on a dark background.
   */
  function intensityAt(nm, { type, lines = [], continuum = () => 1, widthNm = 1.2 }) {
    if (type === 'none') return 0;
    if (type === 'emission') {
      return Math.min(1, lines.reduce((sum, line) => sum + line.depth * lineProfile(nm, line.nm, widthNm), 0));
    }
    const base = continuum(nm);
    if (type === 'continuous') return base;
    return lines.reduce((value, line) => value * (1 - line.depth * lineProfile(nm, line.nm, widthNm)), base);
  }

  /** Approximate visible colour of a wavelength, as [r, g, b] 0-255 (Bruton's approximation). */
  function wavelengthToRgb(nm) {
    if (nm < 380 || nm > 780) return [0, 0, 0];
    let r = 0;
    let g = 0;
    let b = 0;
    if (nm >= 380 && nm < 440) { r = (440 - nm) / 60; b = 1; }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = (645 - nm) / 65; }
    else if (nm <= 780) { r = 1; }
    let factor = 1;
    if (nm < 420) factor = 0.3 + (0.7 * (nm - 380)) / 40;
    else if (nm > 700) factor = 0.3 + (0.7 * (780 - nm)) / 80;
    return [r, g, b].map((c) => Math.round(255 * Math.pow(c * factor, 0.8)));
  }

  /** Approximate apparent colour of a star of this temperature, [r, g, b] 0-255 (Helland's fit), for drawing only. */
  function starRgb(temperatureK) {
    const t = temperatureK / 100;
    const clamp = (v) => Math.round(Math.min(255, Math.max(0, v)));
    const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
    const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    let b;
    if (t >= 66) b = 255;
    else if (t <= 19) b = 0;
    else b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
    return [clamp(r), clamp(g), clamp(b)];
  }

  // First draft, to be checked by the teacher: a qualitative colour name
  // for a star of this surface temperature.
  function starColourName(temperatureK) {
    if (temperatureK < 3700) return 'red';
    if (temperatureK < 5200) return 'orange';
    if (temperatureK < 6000) return 'yellow';
    if (temperatureK < 7500) return 'yellow-white';
    if (temperatureK < 10500) return 'white';
    return 'blue-white';
  }

  const STRENGTH_DEPTH = { strong: 0.85, moderate: 0.55, weak: 0.25 };

  // First draft, to be checked by the teacher: which lines show up, and
  // roughly how strongly, in four example stars. Qualitative only.
  const EXAMPLE_STARS = [
    { id: 'cool', label: 'Cool red star', temperatureK: 3500, strengths: { hydrogen: 'weak', sodium: 'strong', calcium: 'strong' } },
    { id: 'sun', label: 'Sun-like star', temperatureK: SpecData.CONSTANTS.photosphereTemperatureK, strengths: { hydrogen: 'moderate', sodium: 'strong', calcium: 'strong' } },
    { id: 'white', label: 'White star', temperatureK: 10000, strengths: { hydrogen: 'strong', calcium: 'weak' } },
    { id: 'hot', label: 'Hot blue-white star', temperatureK: 20000, strengths: { hydrogen: 'moderate', helium: 'strong' } },
  ];

  function linesForStrengths(strengths) {
    return ELEMENT_KEYS.filter((key) => strengths[key]).flatMap((key) =>
      ELEMENTS[key].lines.map((nm) => ({ nm, depth: STRENGTH_DEPTH[strengths[key]], element: key }))
    );
  }

  // The composition puzzle's two unknown stars, built from the element
  // patterns themselves rather than typed separately.
  const PUZZLE_STARS = [
    { id: 'x', label: 'Star X', elements: ['hydrogen', 'sodium', 'calcium'] },
    { id: 'y', label: 'Star Y', elements: ['hydrogen', 'helium'] },
  ];

  /** Digital sensor: charge counts after an exposure, capped at a full well. */
  function pixelCounts(photonsPerSecond, exposureSeconds, fullWell = 65535) {
    return photonsPerSecond.map((rate) => Math.min(fullWell, Math.round(rate * exposureSeconds)));
  }

  const api = {
    RANGE_NM,
    ELEMENTS,
    ELEMENT_KEYS,
    MATCH_TOLERANCE_NM,
    SPEED_OF_LIGHT_M_PER_S,
    EXAMPLE_STARS,
    PUZZLE_STARS,
    STRENGTH_DEPTH,
    linesFor,
    linesForStrengths,
    dopplerShift,
    radialVelocityFromShift,
    shiftDirection,
    matchElements,
    elementsPresent,
    spectrumType,
    peakWavelengthNm,
    blackbodyCurve,
    intensityAt,
    wavelengthToRgb,
    starColourName,
    starRgb,
    pixelCounts,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.Spectra = api;
  }
})();
