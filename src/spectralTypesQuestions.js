/**
 * Exam-style practice questions for notes/spectral-types.html, each with
 * `marks`, a `spec` tag (13.5 or 13.6) and a full mark scheme in its
 * feedback. Classes, colours and temperature ranges come from Spectra
 * (src/spectra.js), never typed separately.
 */
(function () {
  function makeQuestions(Spectra) {
    const LETTERS = Spectra.CLASS_LETTERS;
    const byLetter = Spectra.classByLetter;
    const classOf = (t) => Spectra.classForTemperature(t);

    const rangesText = Spectra.SPECTRAL_CLASSES.map((c) =>
      c.maxK === null
        ? `${c.letter} above ${c.minK.toLocaleString('en-GB')} K`
        : `${c.letter} ${c.minK.toLocaleString('en-GB')}-${c.maxK.toLocaleString('en-GB')} K`
    ).join('; ');

    function markScheme(points) {
      return `Mark scheme: ${points.map((p) => `${p} (1)`).join('; ')}.`;
    }

    function scored(results, points) {
      const got = results.filter(Boolean).length;
      const total = results.length;
      return { correct: got === total, message: `${got} out of ${total} mark${total === 1 ? '' : 's'}. ${markScheme(points)}` };
    }

    function letterFor(predicate) {
      return Spectra.SPECTRAL_CLASSES.find(predicate).letter;
    }

    const ORDER = LETTERS.join(', ');
    const SUBCLASS = 'A subclass: each class is split into steps 0 to 9, hottest first';
    const HELIUM = letterFor((c) => c.strengths.helium === 'strong');
    const HYDROGEN = letterFor((c) => c.strengths.hydrogen === 'strong');
    const MOLECULES = letterFor((c) => c.molecules);
    const WHY_BLUER = 'It gives out more of its light at shorter wavelengths, so the blue end of the visible band is brighter';

    const T1 = 8000;
    const P = 4500;
    const Q = 25000;

    return [
      {
        id: 'class-order-hottest-first',
        units: ['u4.8'],
        spec: '13.5',
        marks: 1,
        prompt: 'Which list gives the spectral classes in order from hottest to coolest?',
        type: 'choice',
        options: [ORDER, 'A, B, F, G, K, M, O', [...LETTERS].reverse().join(', '), 'O, A, B, F, G, K, M'],
        check(value) {
          return { correct: value === ORDER, message: markScheme([`${ORDER}: hottest (O) to coolest (M)`]) };
        },
      },
      {
        id: 'sun-is-g2',
        units: ['u4.8'],
        spec: '13.5',
        marks: 2,
        prompt: "The Sun's spectral type is G2. (a) Which spectral class is the Sun in? (b) What does the 2 tell you?",
        fields: [
          { key: 'letter', type: 'choice', label: '(a) Class', options: LETTERS },
          {
            key: 'number',
            type: 'choice',
            label: '(b) The 2',
            options: [SUBCLASS, 'The Sun is the second-brightest G star', 'The Sun is twice as hot as a G0 star', 'The Sun has two kinds of spectral line'],
          },
        ],
        check(value) {
          return scored([value.letter === 'G', value.number === SUBCLASS], [
            '(a) G',
            '(b) a subclass: each class is split into 0 to 9, hottest first, so G2 is near the hot end of G',
          ]);
        },
      },
      {
        id: 'hydrogen-strongest-class',
        units: ['u4.8'],
        spec: '13.5',
        marks: 1,
        prompt: "A star's strongest absorption lines are hydrogen's. Which spectral class is it most likely to be?",
        type: 'choice',
        options: LETTERS,
        check(value) {
          return { correct: value === HYDROGEN, message: markScheme([`${HYDROGEN}: hydrogen lines are strongest in ${HYDROGEN} stars`]) };
        },
      },
      {
        id: 'helium-strongest-class',
        units: ['u4.8'],
        spec: '13.5',
        marks: 1,
        prompt: "A star's strongest absorption lines are helium's. Which spectral class is it most likely to be?",
        type: 'choice',
        options: LETTERS,
        check(value) {
          return { correct: value === HELIUM, message: markScheme([`${HELIUM}: helium lines are strongest in ${HELIUM} stars`]) };
        },
      },
      {
        id: 'molecular-bands-class',
        units: ['u4.8'],
        spec: '13.5',
        marks: 1,
        prompt: "A star's spectrum shows broad dark bands from molecules such as titanium oxide. Which spectral class is it most likely to be?",
        type: 'choice',
        options: LETTERS,
        check(value) {
          return {
            correct: value === MOLECULES,
            message: markScheme([`${MOLECULES}: only the coolest stars are cool enough for molecules to survive in their outer layers`]),
          };
        },
      },
      {
        id: 'classify-two-stars-by-lines',
        units: ['u4.8'],
        spec: '13.5',
        marks: 2,
        prompt: "Spica's spectrum shows strong helium lines. Betelgeuse's shows broad molecular bands (titanium oxide). Give each star's spectral class.",
        fields: [
          { key: 'spica', type: 'choice', label: 'Spica', options: LETTERS },
          { key: 'betelgeuse', type: 'choice', label: 'Betelgeuse', options: LETTERS },
        ],
        check(value) {
          return scored([value.spica === HELIUM, value.betelgeuse === MOLECULES], [
            `Spica ${HELIUM}: strong helium lines`,
            `Betelgeuse ${MOLECULES}: molecular bands`,
          ]);
        },
      },
      {
        id: 'class-and-colour-from-temperature',
        units: ['u4.8'],
        spec: '13.6',
        marks: 2,
        prompt: `A star's surface temperature is ${T1.toLocaleString('en-GB')} K. Using these approximate ranges: ${rangesText}. (a) Which class is it? (b) What colour does it look?`,
        fields: [
          { key: 'letter', type: 'choice', label: '(a) Class', options: LETTERS },
          { key: 'colour', type: 'choice', label: '(b) Colour', options: Spectra.SPECTRAL_CLASSES.map((c) => c.colour) },
        ],
        check(value) {
          const cls = classOf(T1);
          return scored([value.letter === cls.letter, value.colour === cls.colour], [
            `(a) ${cls.letter}: ${T1.toLocaleString('en-GB')} K lies in ${cls.letter}'s range, ${cls.minK.toLocaleString('en-GB')}-${cls.maxK.toLocaleString('en-GB')} K`,
            `(b) ${cls.colour}`,
          ]);
        },
      },
      {
        id: 'two-stars-from-temperature',
        units: ['u4.8'],
        spec: '13.6',
        marks: 2,
        prompt: `Star P's surface temperature is ${P.toLocaleString('en-GB')} K and star Q's is ${Q.toLocaleString('en-GB')} K. Using these approximate ranges: ${rangesText}. Give each star's spectral class.`,
        fields: [
          { key: 'p', type: 'choice', label: 'Star P', options: LETTERS },
          { key: 'q', type: 'choice', label: 'Star Q', options: LETTERS },
        ],
        check(value) {
          const p = classOf(P);
          const q = classOf(Q);
          return scored([value.p === p.letter, value.q === q.letter], [
            `star P ${p.letter} (${p.minK.toLocaleString('en-GB')}-${p.maxK.toLocaleString('en-GB')} K)`,
            `star Q ${q.letter} (${q.minK.toLocaleString('en-GB')}-${q.maxK.toLocaleString('en-GB')} K)`,
          ]);
        },
      },
      {
        id: 'why-hotter-looks-bluer',
        units: ['u4.8'],
        spec: '13.6',
        marks: 2,
        prompt: 'Explain why a hotter star looks bluer than a cooler star.',
        type: 'choice',
        options: [
          WHY_BLUER,
          'Its light passes through more blue gas on the way to us',
          'It is bigger, so it scatters more blue light',
          'It is closer to us, so its light is less reddened',
        ],
        check(value) {
          return {
            correct: value === WHY_BLUER,
            message: markScheme([
              'a hotter star gives out more of its light at shorter wavelengths',
              'so the blue (short-wavelength) end of the visible band is brighter, and the star looks bluer',
            ]),
          };
        },
      },
      {
        id: 'hotter-from-colour',
        units: ['u4.8'],
        spec: '13.6',
        marks: 1,
        prompt: 'Arcturus looks orange. Rigel looks blue-white. Which star has the hotter surface?',
        type: 'choice',
        options: ['Rigel', 'Arcturus', 'They are the same temperature', "You can't tell from colour"],
        check(value) {
          return { correct: value === 'Rigel', message: markScheme(['Rigel: a bluer star is hotter, so blue-white Rigel is hotter than orange Arcturus']) };
        },
      },
      {
        id: 'red-star-cooler',
        units: ['u4.8'],
        spec: '13.6',
        marks: 1,
        prompt: `A red star is compared with the Sun, a yellow ${byLetter('G').letter} star. What can you say about the red star's surface?`,
        type: 'choice',
        options: ['It is cooler than the Sun', 'It is hotter than the Sun', 'It is the same temperature as the Sun', 'It has no absorption lines'],
        check(value) {
          return { correct: value === 'It is cooler than the Sun', message: markScheme(['cooler: a redder star gives out more of its light at longer wavelengths, so it is cooler']) };
        },
      },
    ];
  }

  const api = { makeQuestions };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.SpectralTypesQuestions = api;
  }
})();
