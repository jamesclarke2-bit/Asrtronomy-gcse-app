/**
 * Practice questions for notes/earth-structure.html: working radius and
 * circumference from Earth's mean diameter (1.2, u2.28), reading and
 * reasoning about latitude/longitude and the globe's named reference
 * lines (1.4/1.5, u2.1).
 *
 * The mean diameter comes from src/specData.js (the exam's own rounded
 * data sheet), the same figure the page's own "Earth's shape and size"
 * section states. Greenwich and Sydney's coordinates are quoted exactly
 * as that page already states them.
 *
 * The last question ("click the line") stands in for literally clicking
 * a highlighted feature on the globe: quiz-ui.js's question cards are
 * plain text with no diagram of their own, so the clue instead describes
 * exactly how that line is actually drawn (its colour, dash pattern and
 * which side of the equator it's on) — the same facts NAMED_PARALLELS in
 * earth-structure.js uses to draw it, just read back as a clue instead
 * of a drawing instruction.
 */
function makeQuestions(SpecData) {
  const diameterKm = SpecData.CONSTANTS.meanDiameterKm.earth;
  const radiusKm = diameterKm / 2;
  const circumferenceKm = Math.PI * diameterKm;

  const EIGHT_FEATURES = [
    'North Pole',
    'Arctic Circle',
    'Tropic of Cancer',
    'Equator',
    'Tropic of Capricorn',
    'Antarctic Circle',
    'South Pole',
    'Prime Meridian',
  ];

  return [
    {
      id: 'earth-radius-circumference',
      units: ['u2.28'],
      fields: [
        { key: 'radius', type: 'number', label: 'Radius (km)', unitLabel: 'km' },
        { key: 'circumference', type: 'number', label: 'Circumference (km)', unitLabel: 'km' },
      ],
      prompt:
        `The data sheet gives Earth's mean diameter as ${diameterKm.toLocaleString()} km. Work out its radius, and its circumference (circumference = π × diameter).`,
      check(value) {
        const radiusCorrect = Math.abs(value.radius - radiusKm) <= 0.02 * radiusKm;
        const circumferenceCorrect = Math.abs(value.circumference - circumferenceKm) <= 0.02 * circumferenceKm;
        return {
          correct: radiusCorrect && circumferenceCorrect,
          message:
            `radius = diameter ÷ 2 = ${diameterKm.toLocaleString()} ÷ 2 = ${radiusKm.toLocaleString()} km. ` +
            `circumference = π × diameter = π × ${diameterKm.toLocaleString()} ≈ ${Math.round(circumferenceKm).toLocaleString()} km.`,
        };
      },
    },
    {
      id: 'equator-meets-prime-meridian',
      units: ['u2.1'],
      fields: [
        { key: 'lat', type: 'number', label: 'Latitude (°)', unitLabel: '°' },
        { key: 'long', type: 'number', label: 'Longitude (°)', unitLabel: '°' },
      ],
      prompt:
        'The equator is the parallel at 0° latitude; the Prime Meridian is the meridian at 0° longitude. What latitude and longitude does their crossing point have?',
      check(value) {
        const correct = Math.abs(value.lat) <= 1 && Math.abs(value.long) <= 1;
        return {
          correct,
          message:
            'The equator is defined as 0° latitude, and the Prime Meridian is defined as 0° longitude — so the point where they cross is 0° latitude, 0° longitude (in the Gulf of Guinea, off the coast of West Africa).',
        };
      },
    },
    {
      id: 'sydney-hemisphere-directions',
      units: ['u2.1'],
      type: 'choice',
      prompt: "This page gives Sydney's position as about 33.9°S, 151.2°E. Which combination of hemisphere directions is that?",
      options: ['North and East', 'North and West', 'South and East', 'South and West'],
      check(value) {
        const correct = value === 'South and East';
        return {
          correct,
          message: '"S" in 33.9°S means south of the equator, and "E" in 151.2°E means east of the Prime Meridian — so South and East.',
        };
      },
    },
    {
      id: 'greenwich-hemisphere-directions',
      units: ['u2.1'],
      type: 'choice',
      prompt: "This page gives Greenwich's position as about 51.5°N, 0°. Which of these is correct?",
      options: [
        'North, and right on the Prime Meridian (0°) — so it has no east/west direction',
        'North and East',
        'North and West',
        'South, and right on the Prime Meridian (0°) — so it has no east/west direction',
      ],
      check(value) {
        const correct = value === 'North, and right on the Prime Meridian (0°) — so it has no east/west direction';
        return {
          correct,
          message:
            '51.5°N means north of the equator. But a longitude of exactly 0° means Greenwich sits on the Prime Meridian itself — the line longitude is measured from — so it is neither east nor west of it.',
        };
      },
    },
    {
      id: 'furthest-north-overhead-sun',
      units: ['u2.1'],
      type: 'choice',
      prompt: 'Which named line is the furthest north at which the Sun is ever directly overhead at noon?',
      options: EIGHT_FEATURES,
      check(value) {
        const correct = value === 'Tropic of Cancer';
        return {
          correct,
          message:
            'The Tropic of Cancer (~23.5°N) is the farthest north the Sun ever gets directly overhead at noon, at the June solstice — its latitude equals Earth\'s own 23.5° axial tilt.',
        };
      },
    },
    {
      id: 'midnight-sun-boundary',
      units: ['u2.1'],
      type: 'choice',
      prompt:
        "Which named circle marks the latitude beyond which there's at least one day a year with 24 hours of daylight, and one with 24 hours of darkness?",
      options: EIGHT_FEATURES,
      check(value) {
        const correct = value === 'Arctic Circle';
        return {
          correct,
          message:
            "North of the Arctic Circle (~66.5°N, that is 90° − 23.5°), the June solstice brings a day with 24 hours of daylight (the midnight Sun) and the December solstice a day with 24 hours of darkness (polar night). The Antarctic Circle is its southern match, with the solstices swapped.",
        };
      },
    },
    {
      id: 'equator-latitude-value',
      units: ['u2.1'],
      type: 'number',
      unitLabel: '°',
      prompt: 'What is the latitude of the equator itself, in degrees?',
      check(value) {
        const correct = Math.abs(value) <= 1;
        return {
          correct,
          message: 'The equator is the line latitude is measured from, so by definition it is 0°.',
        };
      },
    },
    {
      id: 'click-the-line-styling',
      units: ['u2.1'],
      type: 'choice',
      prompt:
        'On the globe diagram, one reference line is drawn as a dashed orange line, south of the equator. Which of the eight named reference features is it?',
      options: EIGHT_FEATURES,
      check(value) {
        const correct = value === 'Tropic of Capricorn';
        return {
          correct,
          message:
            "The globe draws the Tropic of Cancer and Tropic of Capricorn both as dashed orange lines — they're the same distance (23.5°) either side of the equator — but the Tropic of Cancer is north and the Tropic of Capricorn is south, so a dashed orange line south of the equator can only be the Tropic of Capricorn. (The Arctic and Antarctic Circles are also a matching north/south pair, but drawn dashed blue instead; the equator itself is solid red; the Prime Meridian is a solid green curve, not a straight parallel at all.)",
        };
      },
    },
  ];
}

const earthStructureQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = earthStructureQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.EarthStructureQuestions = earthStructureQuestionsApi;
}
