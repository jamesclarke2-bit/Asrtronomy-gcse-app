/**
 * Practice questions for notes/magnitude.html, across all three tiers:
 * the idea (apparent vs absolute, in words), brightness ratios, and
 * distance modulus. Every numeric answer is computed from Magnitude
 * (src/magnitude.js) — never hard-coded — using fresh numbers, distinct
 * from the page's own worked examples.
 */
(function () {
  function makeQuestions(Magnitude) {
    return [
      {
        id: 'which-brighter-sign-convention',
        units: ['u4.2'],
        prompt:
          'A star has apparent magnitude +2. A different star has apparent magnitude -1. Which one looks brighter?',
        type: 'choice',
        options: [
          'The magnitude -1 star — smaller (or more negative) magnitudes mean brighter objects',
          'The magnitude +2 star — larger magnitudes mean brighter objects',
          'They look equally bright — only the difference between magnitudes matters',
          'It depends on how far away each one is',
        ],
        check(value) {
          const correct = value === 'The magnitude -1 star — smaller (or more negative) magnitudes mean brighter objects';
          return {
            correct,
            message:
              'The magnitude scale runs backwards from how it first sounds: smaller, and especially negative, magnitudes mean a brighter object. -1 is smaller than +2, so that star looks brighter.',
          };
        },
      },
      {
        id: 'apparent-vs-absolute-words',
        units: ['u4.2'],
        prompt:
          'Two stars have exactly the same apparent magnitude as seen from Earth, but one is physically far more luminous (a far greater absolute magnitude of brightness) than the other. What must be true?',
        type: 'choice',
        options: [
          'The more luminous star must be much farther away',
          'The more luminous star must be much closer',
          'The two stars must be the same distance away',
          'Apparent magnitude has nothing to do with distance, so nothing can be concluded',
        ],
        check(value) {
          const correct = value === 'The more luminous star must be much farther away';
          return {
            correct,
            message:
              "Apparent magnitude is brightness as seen from Earth, which falls off with distance. For the truly more luminous star to look only as bright as the dimmer one, it must be sitting much farther away — its extra luminosity is being 'used up' by the extra distance.",
          };
        },
      },
      {
        id: 'which-brighter-and-by-what-factor',
        units: ['u4.2'],
        prompt:
          'At the standard distance of 10 pc, star A has absolute magnitude +3 and star B has absolute magnitude +8. Which is really more luminous, and by what factor (to the nearest whole number)?',
        fields: [
          { key: 'brighter', type: 'choice', label: 'More luminous star', options: ['Star A', 'Star B'] },
          { key: 'factor', type: 'number', label: 'Factor', unitLabel: '×' },
        ],
        check(value) {
          const expectedFactor = Magnitude.brightnessRatio(8 - 3); // = 100
          const factorOk = Math.abs(value.factor - expectedFactor) / expectedFactor < 0.02;
          const correct = value.brighter === 'Star A' && factorOk;
          return {
            correct,
            message: `Star A is brighter (it has the smaller magnitude). The difference is 5 magnitudes, and Pogson's scale fixes exactly 5 magnitudes as exactly a factor of 100 — so Star A is 100× more luminous than Star B.`,
          };
        },
      },
      {
        id: 'ratio-from-difference',
        units: ['u4.2'],
        prompt: 'Two stars differ by exactly 4 magnitudes. What is the exact brightness ratio between them (to 1 decimal place)?',
        type: 'number',
        check(value) {
          const expected = Magnitude.brightnessRatio(4);
          const correct = Math.abs(value - expected) / expected < 0.02;
          return {
            correct,
            message: `I2 / I1 = 10^(0.4 × 4) = 10^1.6 ≈ ${expected.toFixed(1)}.`,
          };
        },
      },
      {
        id: 'magnitude-difference-from-ratio',
        units: ['u4.2'],
        prompt: 'One star is measured to be exactly 630 times brighter than another. What is the magnitude difference between them (to 1 decimal place)?',
        type: 'number',
        check(value) {
          const expected = Magnitude.magnitudeDifference(630);
          const correct = Math.abs(value - expected) < 0.1;
          return {
            correct,
            message: `m1 - m2 = 2.5 × log10(630) ≈ ${expected.toFixed(1)} magnitudes.`,
          };
        },
      },
      {
        id: 'mental-maths-shortcut',
        units: ['u4.2'],
        prompt:
          'Using the mental-maths shortcuts (2.5 mag ≈ ×10, 0.75 mag ≈ ×2), roughly what factor does a difference of 1.5 magnitudes correspond to?',
        type: 'number',
        check(value) {
          const expected = Magnitude.brightnessRatio(1.5);
          const correct = Math.abs(value - expected) / expected < 0.15;
          return {
            correct,
            message: `1.5 magnitudes is two 0.75-magnitude steps, each about ×2, so about ×4 (the exact value is 10^0.6 ≈ ${expected.toFixed(2)}).`,
          };
        },
      },
      {
        id: 'fading-star-factor',
        units: ['u4.2'],
        prompt: 'A star fades from magnitude 5.0 to magnitude 10.0 as a dust cloud drifts in front of it. By what factor has its apparent brightness dropped (to the nearest whole number)?',
        type: 'number',
        check(value) {
          const expected = Magnitude.brightnessRatio(10 - 5); // = 100
          const correct = Math.abs(value - expected) / expected < 0.02;
          return {
            correct,
            message: `The magnitude difference is exactly 5, which Pogson's scale fixes as exactly a factor of ${expected.toFixed(0)}.`,
          };
        },
      },
      {
        id: 'distance-from-modulus',
        units: ['u4.2'],
        prompt: 'A star has apparent magnitude m = +6.5 and absolute magnitude M = +1.5. How far away is it, in parsecs?',
        type: 'number',
        check(value) {
          const expected = Magnitude.distanceFromModulus(6.5, 1.5);
          const correct = Math.abs(value - expected) / expected < 0.02;
          return {
            correct,
            message: `m - M = 5, so d = 10 × 10^(5/5) = 10 × 10 = ${expected.toFixed(0)} pc.`,
          };
        },
      },
      {
        id: 'absolute-from-modulus',
        units: ['u4.2'],
        prompt: 'A star 50 pc away has an apparent magnitude of +7.0. What is its absolute magnitude (to 2 decimal places)?',
        type: 'number',
        check(value) {
          const expected = Magnitude.absoluteFromApparent(7.0, 50);
          const correct = Math.abs(value - expected) < 0.1;
          return {
            correct,
            message: `M = m - 5 log10(d / 10) = 7.0 - 5 log10(5) ≈ ${expected.toFixed(2)}.`,
          };
        },
      },
      {
        id: 'explain-distance-modulus',
        units: ['u4.2'],
        prompt: "Why does moving a star 10 times farther away make it exactly 5 magnitudes fainter, not some other number?",
        type: 'choice',
        options: [
          'Brightness falls with the inverse-square law, so a ×10 distance is a ÷100 brightness, and 100 is defined as exactly 5 magnitudes',
          'The magnitude scale was built so that every factor of 10 in distance is always 5 magnitudes, by pure coincidence',
          'Because the Sun is exactly 5 magnitudes brighter than Sirius',
          'Because 10 pc is the standard distance for absolute magnitude',
        ],
        check(value) {
          const correct = value === 'Brightness falls with the inverse-square law, so a ×10 distance is a ÷100 brightness, and 100 is defined as exactly 5 magnitudes';
          return {
            correct,
            message:
              'Brightness (flux) falls as 1/d², so multiplying distance by 10 divides brightness by 100 — and Pogson fixed a brightness ratio of exactly 100 as exactly 5 magnitudes. That link between the inverse-square law and the magnitude scale is exactly where m - M = 5 log10(d / 10 pc) comes from.',
          };
        },
      },
    ];
  }

  const api = { makeQuestions };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.MagnitudeQuestions = api;
  }
})();
