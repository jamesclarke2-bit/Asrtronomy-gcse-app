/**
 * Exam-style practice questions for notes/reading-a-spectrum.html. Each
 * carries `marks` and a `spec` sub-part tag (13.4a/b/c, 13.20, 13.21),
 * and its feedback always ends with the full mark scheme. Answers are
 * worked out with Spectra (src/spectra.js), never typed separately.
 */
(function () {
  function makeQuestions(Spectra) {
    const E = Spectra.ELEMENTS;

    function markScheme(points) {
      return `Mark scheme: ${points.map((p) => `${p} (1)`).join('; ')}.`;
    }

    // Multi-field questions score one mark per correct field.
    function scored(results, total, points) {
      const got = results.filter(Boolean).length;
      return {
        correct: got === total,
        message: `${got} out of ${total} mark${total === 1 ? '' : 's'}. ${markScheme(points)}`,
      };
    }

    const SLIT = 'Lets in only a thin strip of light, so each wavelength makes a sharp line';
    const SPREAD = 'Spreads the light out by wavelength';
    const RECORD = 'Records how much light arrives at each wavelength';
    const BRIGHTEN = 'Makes the star look brighter';

    const TYPE_NAMES = { continuous: 'Continuous', absorption: 'Absorption', emission: 'Emission' };
    const TYPE_OPTIONS = ['Continuous', 'Absorption', 'Emission'];

    const unknown = { elements: ['hydrogen', 'calcium'] };
    unknown.lines = Spectra.linesFor(unknown.elements);
    const unknownPresent = new Set(Spectra.elementsPresent(unknown.lines));
    const referenceText = Spectra.ELEMENT_KEYS.map((key) => `${E[key].name}: ${E[key].lines.map((nm) => nm.toFixed(1)).join(', ')} nm`).join('; ');

    const REST = 656.3;
    const P_OBSERVED = 657.1;
    const Q_OBSERVED = 656.7;
    const vP = Spectra.radialVelocityFromShift(REST, P_OBSERVED);
    const vQ = Spectra.radialVelocityFromShift(REST, Q_OBSERVED);

    const EXPOSURE_1 = 3;
    const COUNT_1 = 1200;
    const EXPOSURE_2 = 6;
    const [expectedCount] = Spectra.pixelCounts([COUNT_1 / EXPOSURE_1], EXPOSURE_2);

    return [
      {
        id: 'spectrograph-slit-and-grating',
        units: ['u4.6'],
        spec: '13.21',
        marks: 2,
        prompt: 'A spectrograph has a narrow slit, then a prism or diffraction grating, then a detector. State what (a) the slit and (b) the prism or grating does.',
        fields: [
          { key: 'slit', type: 'choice', label: '(a) The slit', options: [SLIT, SPREAD, RECORD, BRIGHTEN] },
          { key: 'grating', type: 'choice', label: '(b) The prism or grating', options: [SPREAD, SLIT, RECORD, BRIGHTEN] },
        ],
        check(value) {
          return scored([value.slit === SLIT, value.grating === SPREAD], 2, [
            '(a) the slit lets in a thin strip of light so each wavelength forms a sharp line',
            '(b) the prism or grating spreads (disperses) the light out by wavelength',
          ]);
        },
      },
      {
        id: 'star-spectrum-appearance',
        units: ['u4.6'],
        spec: '13.21',
        marks: 1,
        prompt: "Which description matches the spectrum of a typical star's light?",
        type: 'choice',
        options: [
          'A continuous band of colours crossed by dark lines',
          'Bright coloured lines on a dark background',
          'A smooth band of colours with no lines at all',
          'A single bright line at one wavelength',
        ],
        check(value) {
          return {
            correct: value === 'A continuous band of colours crossed by dark lines',
            message: markScheme(['an absorption spectrum: a continuous band of colours crossed by dark lines']),
          };
        },
      },
      {
        id: 'which-spectrum-from-setup',
        units: ['u4.6'],
        spec: '13.21',
        marks: 2,
        prompt:
          'Light from a hot, dense source passes through a cooler cloud of hydrogen gas and into a spectrograph. (a) Which kind of spectrum is recorded? (b) The spectrograph is moved to look at the same cloud from one side, with nothing bright behind it. Which kind of spectrum is recorded now?',
        fields: [
          { key: 'through', type: 'choice', label: '(a) Looking through the cloud at the source', options: TYPE_OPTIONS },
          { key: 'side', type: 'choice', label: '(b) Looking at the cloud from one side', options: TYPE_OPTIONS },
        ],
        check(value) {
          const through = TYPE_NAMES[Spectra.spectrumType({ sourceOn: true, cloudInFront: true, view: 'through' })];
          const side = TYPE_NAMES[Spectra.spectrumType({ sourceOn: true, cloudInFront: true, view: 'side' })];
          return scored([value.through === through, value.side === side], 2, [
            `(a) ${through.toLowerCase()}: the cool gas removes particular wavelengths from the continuous spectrum, leaving dark lines`,
            `(b) ${side.toLowerCase()}: the gas gives out light at those same wavelengths, as bright lines on a dark background`,
          ]);
        },
      },
      {
        id: 'where-absorption-lines-form',
        units: ['u4.6'],
        spec: '13.21',
        marks: 1,
        prompt: "Where is the gas that produces the dark absorption lines in a star's spectrum?",
        type: 'choice',
        options: [
          "In the star's cooler outer layers, between its hot interior and us",
          "At the star's very hot centre",
          "Inside the telescope's own lenses",
          "In the detector, after the light has been recorded",
        ],
        check(value) {
          return {
            correct: value === "In the star's cooler outer layers, between its hot interior and us",
            message: markScheme(["cooler gas in the star's outer layers absorbs particular wavelengths from the light coming from the hotter interior"]),
          };
        },
      },
      {
        id: 'unknown-star-elements',
        units: ['u4.6'],
        spec: '13.4a',
        marks: 4,
        prompt:
          `A star's spectrum has dark lines at ${unknown.lines.map((nm) => nm.toFixed(1)).join(', ')} nm. ` +
          `Laboratory line patterns: ${referenceText}. ` +
          'In this question, count an element as present when all its reference lines appear. For each element, say whether it is present.',
        fields: Spectra.ELEMENT_KEYS.map((key) => ({ key, type: 'choice', label: E[key].name, options: ['Present', 'Not present'] })),
        check(value) {
          const results = Spectra.ELEMENT_KEYS.map((key) => (value[key] === 'Present') === unknownPresent.has(key));
          const points = Spectra.matchElements(unknown.lines).map((r) =>
            r.present
              ? `${E[r.key].name.toLowerCase()} present: all of ${E[r.key].lines.map((nm) => nm.toFixed(1)).join(', ')} nm appear`
              : `${E[r.key].name.toLowerCase()} not present: ${r.missing.map((nm) => nm.toFixed(1)).join(', ')} nm missing`
          );
          return scored(results, 4, points);
        },
      },
      {
        id: 'how-sodium-identified',
        units: ['u4.6'],
        spec: '13.4a',
        marks: 2,
        prompt: `Explain how astronomers can tell that a distant star contains sodium. (In a laboratory, sodium's lines are at ${E.sodium.lines.map((nm) => nm.toFixed(1)).join(' and ')} nm.)`,
        type: 'choice',
        options: [
          `The star's spectrum has dark lines at ${E.sodium.lines.map((nm) => nm.toFixed(1)).join(' and ')} nm, matching sodium's laboratory lines; each element has its own unique pattern of lines`,
          'The star looks yellow, the colour of a sodium street lamp',
          'The star is about the same temperature as a sodium lamp',
          "The star's light is brightest at 589 nm",
        ],
        check(value) {
          return {
            correct: value.startsWith("The star's spectrum has dark lines at"),
            message: markScheme([
              `dark (absorption) lines in the star's spectrum at ${E.sodium.lines.map((nm) => nm.toFixed(1)).join(' and ')} nm match sodium's laboratory wavelengths`,
              "each element has a unique pattern of lines, so the match identifies sodium; colour alone can't",
            ]),
          };
        },
      },
      {
        id: 'hotter-star-from-peak',
        units: ['u4.6'],
        spec: '13.4b',
        marks: 2,
        prompt: "Star A's continuous spectrum peaks at 450 nm. Star B's peaks at 650 nm. (a) Which star is hotter? (b) Which star looks bluer?",
        fields: [
          { key: 'hotter', type: 'choice', label: '(a) Hotter star', options: ['Star A', 'Star B'] },
          { key: 'bluer', type: 'choice', label: '(b) Bluer-looking star', options: ['Star A', 'Star B'] },
        ],
        check(value) {
          return scored([value.hotter === 'Star A', value.bluer === 'Star A'], 2, [
            '(a) Star A: a hotter star peaks at a shorter wavelength',
            '(b) Star A: a peak at a shorter wavelength makes it look bluer',
          ]);
        },
      },
      {
        id: 'helium-lines-temperature',
        units: ['u4.6'],
        spec: '13.4b',
        marks: 1,
        prompt: "A star's spectrum shows strong helium lines, but no sodium or calcium lines. What does this suggest about the star?",
        type: 'choice',
        options: ['It is very hot', 'It is very cool', 'It is moving away from us', 'It contains no hydrogen'],
        check(value) {
          return {
            correct: value === 'It is very hot',
            message: markScheme(['very hot: which lines appear, and how strong they are, depends on temperature, and strong helium lines appear only in very hot stars']),
          };
        },
      },
      {
        id: 'redshift-direction-and-speed',
        units: ['u4.6'],
        spec: '13.4c',
        marks: 2,
        prompt:
          `In a laboratory, a hydrogen line has a wavelength of ${REST.toFixed(1)} nm. In star P's spectrum it is at ${P_OBSERVED.toFixed(1)} nm; in star Q's it is at ${Q_OBSERVED.toFixed(1)} nm. ` +
          '(a) Is star P moving towards us or away from us? (b) Which star has the greater speed along our line of sight?',
        fields: [
          { key: 'direction', type: 'choice', label: '(a) Star P is moving', options: ['Away from us', 'Towards us'] },
          { key: 'faster', type: 'choice', label: '(b) Greater speed', options: ['Star P', 'Star Q'] },
        ],
        check(value) {
          const direction = Spectra.shiftDirection(vP) === 'redshift' ? 'Away from us' : 'Towards us';
          const faster = Math.abs(vP) > Math.abs(vQ) ? 'Star P' : 'Star Q';
          return scored([value.direction === direction, value.faster === faster], 2, [
            `(a) away from us: the line has moved to a longer wavelength (+${(P_OBSERVED - REST).toFixed(1)} nm), a redshift`,
            `(b) star P: its shift (+${(P_OBSERVED - REST).toFixed(1)} nm) is bigger than star Q's (+${(Q_OBSERVED - REST).toFixed(1)} nm), and a bigger shift means a faster speed`,
          ]);
        },
      },
      {
        id: 'blueshift-meaning',
        units: ['u4.6'],
        spec: '13.4c',
        marks: 1,
        prompt: "Every line in a star's spectrum is at a shorter wavelength than the same line measured in a laboratory. What does this tell you?",
        type: 'choice',
        options: [
          'The star is moving towards us (blueshift)',
          'The star is moving away from us (redshift)',
          'The star is hotter than the Sun',
          'The star contains no hydrogen',
        ],
        check(value) {
          return {
            correct: value === 'The star is moving towards us (blueshift)',
            message: markScheme(['moving towards us: lines shifted to shorter wavelengths are a blueshift']),
          };
        },
      },
      {
        id: 'digital-sensor-stages',
        units: ['u4.7'],
        spec: '13.20',
        marks: 3,
        prompt: 'Describe how a digital sensor records an astronomical image: (a) what happens in each pixel as photons arrive, (b) what is then read out, and (c) how the observation is kept.',
        fields: [
          { key: 'pixel', type: 'choice', label: '(a) In each pixel', options: ['Electrical charge builds up', 'The pixel darkens, like photographic film', 'The light is stored as light'] },
          { key: 'readout', type: 'choice', label: '(b) Read out', options: ['The charges, converted into numbers', 'A printed picture', 'The photons themselves'] },
          { key: 'kept', type: 'choice', label: '(c) Kept as', options: ['A data file, processed by computer', 'A glass photographic plate', 'A sketch made at the eyepiece'] },
        ],
        check(value) {
          return scored(
            [value.pixel === 'Electrical charge builds up', value.readout === 'The charges, converted into numbers', value.kept === 'A data file, processed by computer'],
            3,
            ['(a) photons are converted into electrical charge, which builds up in each pixel', '(b) the charge in each pixel is read out and converted into a number', '(c) the numbers are stored as a data file, which is processed by computer']
          );
        },
      },
      {
        id: 'exposure-time-count',
        units: ['u4.7'],
        spec: '13.20',
        marks: 1,
        prompt: `In a ${EXPOSURE_1}-second exposure of a steady star, one pixel builds up a count of ${COUNT_1.toLocaleString('en-GB')}. What count would you expect from a ${EXPOSURE_2}-second exposure, assuming the pixel does not fill up?`,
        type: 'number',
        check(value) {
          const factor = EXPOSURE_2 / EXPOSURE_1;
          const working = `${expectedCount.toLocaleString('en-GB')}: the exposure is ${factor} times as long, so it collects ${factor} times as much light: ${COUNT_1.toLocaleString('en-GB')} × ${factor} = ${expectedCount.toLocaleString('en-GB')}`;
          return {
            correct: Math.abs(value - expectedCount) / expectedCount < 0.02,
            message: markScheme([working]),
          };
        },
      },
    ];
  }

  const api = { makeQuestions };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.SpectraQuestions = api;
  }
})();
