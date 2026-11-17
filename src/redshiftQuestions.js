/**
 * Exam-style practice questions for notes/redshift.html (spec 16.1-16.3),
 * each with `marks` and a full mark scheme in its feedback. Every
 * constant a calculation needs is stated in its own prompt, numeric
 * answers are accepted within 2%, and the mark scheme shows the full
 * working.
 */
(function () {
  function makeQuestions(R) {
    const UNITS = ['u6.1'];

    function markScheme(points) {
      return `Mark scheme: ${points.map((p) => `${p} (1)`).join('; ')}.`;
    }

    function fmt(n, digits = 0) {
      return n.toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits });
    }

    const C_KM = R.C_KM_PER_S;
    const exp = Math.floor(Math.log10(R.C_M_PER_S));
    const sup = String(exp).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]).join('');
    const C_TEXT = `c = ${(R.C_M_PER_S / 10 ** exp).toFixed(1)} × 10${sup} m/s (${fmt(C_KM)} km/s)`;

    function single(id, spec, prompt, options, right, point) {
      return {
        id,
        units: UNITS,
        spec,
        marks: 1,
        prompt,
        type: 'choice',
        options,
        check(value) {
          return { correct: value === right, message: markScheme([point]) };
        },
      };
    }

    // --- Calculation 1: find v from a shifted line ---------------------
    const V_EMITTED = 486.1;
    const V_OBSERVED = 500.7;
    const vShift = V_OBSERVED - V_EMITTED;
    const vRatio = vShift / V_EMITTED;
    const vAnswer = R.velocityFromWavelengths(V_EMITTED, V_OBSERVED);

    // --- Calculation 2: find the observed wavelength --------------------
    const O_EMITTED = 656.3;
    const O_SPEED = 12000;
    const oShift = R.wavelengthShift(O_EMITTED, O_SPEED);
    const oObserved = R.observedWavelength(O_EMITTED, O_SPEED);

    const LONGER = 'Its absorption lines are at longer wavelengths than in a laboratory';
    const OUTSIDE = 'Galaxies outside the Local Group';
    const RECEDING = 'The galaxy is moving away from us';
    const Y_FASTER = 'Galaxy Y';
    const REARRANGED = 'v = c × (wavelength shift) ÷ (emitted wavelength)';
    const KM = 'km/s, because c was used in km/s';

    return [
      single('rs-what', '16.1', 'What does it mean to say that a galaxy\'s light shows redshift?', [LONGER, 'The galaxy looks red in colour', 'Its absorption lines are at shorter wavelengths than in a laboratory', 'Its light has lost some of its lines'], LONGER, 'the same pattern of lines is shifted to longer wavelengths, towards the red end of the spectrum'),
      single('rs-which', '16.1', 'Which galaxies show redshift in their spectra?', [OUTSIDE, 'Only the galaxies in the Local Group', 'Only the Milky Way', 'No galaxies: only stars show redshift'], OUTSIDE, 'galaxies outside the Local Group show redshift; inside it, gravity holds the galaxies together'),
      single('rs-cause', '16.2', 'What causes the redshift of a distant galaxy?', [RECEDING, 'The galaxy is moving towards us', 'Dust in the galaxy makes its light redder', 'The galaxy is made of cooler, redder stars'], RECEDING, 'redshift is caused by the galaxy receding: moving away from us stretches the waves we receive'),
      single('rs-faster', '16.2', 'The same hydrogen line is shifted by 10 nm in galaxy X and by 20 nm in galaxy Y. Which galaxy is moving away faster?', [Y_FASTER, 'Galaxy X', 'Both at the same speed', 'Neither: a bigger shift means it is coming towards us'], Y_FASTER, 'a bigger redshift means a faster speed away from us, so galaxy Y'),
      single('rs-rearrange', '16.3', '(wavelength shift) ÷ (emitted wavelength) = v ÷ c. Which rearrangement gives v?', [REARRANGED, 'v = c ÷ (wavelength shift) × (emitted wavelength)', 'v = (wavelength shift) ÷ (emitted wavelength × c)', 'v = c × (emitted wavelength) ÷ (observed wavelength)'], REARRANGED, 'multiply both sides by c: v = c × (wavelength shift) ÷ (emitted wavelength)'),
      {
        id: 'rs-find-v',
        units: UNITS,
        spec: '16.3',
        marks: 3,
        prompt: `A hydrogen line emitted at ${V_EMITTED.toFixed(1)} nm is observed in a galaxy's spectrum at ${V_OBSERVED.toFixed(1)} nm. Use (wavelength shift) ÷ (emitted wavelength) = v ÷ c, with ${C_TEXT}, to find the galaxy's recession velocity in km/s.`,
        type: 'number',
        unitLabel: 'km/s',
        check(value) {
          const correct = R.withinTwoPercent(value, vAnswer);
          const scheme = markScheme([
            `wavelength shift = ${V_OBSERVED.toFixed(1)} − ${V_EMITTED.toFixed(1)} = ${vShift.toFixed(1)} nm`,
            `${vShift.toFixed(1)} ÷ ${V_EMITTED.toFixed(1)} = ${vRatio.toFixed(4)}`,
            `v = ${fmt(C_KM)} km/s × ${vRatio.toFixed(4)} = ${fmt(Math.round(vAnswer))} km/s, about ${fmt(Math.round(vAnswer / 100) * 100)} km/s (accept ${fmt(Math.round(0.98 * vAnswer))} to ${fmt(Math.round(1.02 * vAnswer))})`,
          ]);
          return { correct, message: `${correct ? 'Correct.' : 'Not quite.'} ${scheme}` };
        },
        answer: { kmPerS: vAnswer },
      },
      {
        id: 'rs-find-observed',
        units: UNITS,
        spec: '16.3',
        marks: 2,
        prompt: `A galaxy is moving away from us at ${fmt(O_SPEED)} km/s. Hydrogen emits a line at ${O_EMITTED.toFixed(1)} nm. Use (wavelength shift) ÷ (emitted wavelength) = v ÷ c, with ${C_TEXT}. (a) Find the wavelength shift. (b) Find the wavelength at which we observe the line.`,
        fields: [
          { key: 'shift', type: 'number', label: '(a) Wavelength shift', unitLabel: 'nm' },
          { key: 'observed', type: 'number', label: '(b) Observed wavelength', unitLabel: 'nm' },
        ],
        check(value) {
          const a = R.withinTwoPercent(value.shift, oShift);
          const b = R.withinTwoPercent(value.observed, oObserved);
          const got = [a, b].filter(Boolean).length;
          const scheme = markScheme([
            `(a) multiply both sides by the emitted wavelength: wavelength shift = ${O_EMITTED.toFixed(1)} × ${fmt(O_SPEED)} ÷ ${fmt(C_KM)} = ${oShift.toFixed(1)} nm (accept ${(0.98 * oShift).toFixed(1)} to ${(1.02 * oShift).toFixed(1)})`,
            `(b) observed = ${O_EMITTED.toFixed(1)} + ${oShift.toFixed(1)} = ${oObserved.toFixed(1)} nm (accept within 2%)`,
          ]);
          return { correct: a && b, message: `${got} out of 2 marks. ${scheme}` };
        },
        answer: { shift: oShift, observed: oObserved },
      },
      single('rs-units', '16.3', `A student works out v = c × (wavelength shift) ÷ (emitted wavelength) with both wavelengths in nm and ${C_TEXT.replace(/^c = .* \((.*)\)$/, 'c = $1')}. What unit is the answer in?`, [KM, 'nm, because the wavelengths were in nm', 'm/s, because c is always in m/s', 'It has no unit'], KM, 'the nm cancel in shift ÷ emitted wavelength, so v has the units of c: km/s'),
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.RedshiftQuestions = api;
  }
})();
