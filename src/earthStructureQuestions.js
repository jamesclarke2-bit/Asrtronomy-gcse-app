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
 * The eight "name that line" questions are picture-based, as the exam
 * itself asks (spec 1.5): each one's render(container) calls back into
 * notes/earth-structure.js's own renderLineQuizDiagram (passed in as
 * EarthStructureDiagram, the second argument), which redraws the real
 * globe with one reference feature highlighted — never a hand-written
 * text clue that could drift from what the globe actually shows.
 * makeQuestions still runs perfectly well without that second argument
 * (e.g. from a Node test, or from src/allQuestions.js's sitewide list,
 * neither of which has a DOM to draw into) — render just never gets
 * called there.
 */
const EIGHT_FEATURES = [
  { term: 'northPole', name: 'North Pole' },
  { term: 'arcticCircle', name: 'Arctic Circle' },
  { term: 'tropicOfCancer', name: 'Tropic of Cancer' },
  { term: 'equator', name: 'Equator' },
  { term: 'tropicOfCapricorn', name: 'Tropic of Capricorn' },
  { term: 'antarcticCircle', name: 'Antarctic Circle' },
  { term: 'southPole', name: 'South Pole' },
  { term: 'primeMeridian', name: 'Prime Meridian' },
];
const EIGHT_FEATURE_NAMES = EIGHT_FEATURES.map((f) => f.name);

function namedLineQuestion(feature, EarthStructureDiagram) {
  return {
    id: `name-that-line-${feature.term}`,
    units: ['u2.1'],
    type: 'choice',
    prompt: 'Name that line: which of the eight reference features is highlighted on the globe?',
    options: EIGHT_FEATURE_NAMES,
    render(container) {
      if (EarthStructureDiagram) EarthStructureDiagram.renderLineQuizDiagram(container, feature.term);
    },
    check(value) {
      const correct = value === feature.name;
      return {
        correct,
        message: `The highlighted feature is the ${feature.name}.`,
      };
    },
  };
}

function makeQuestions(SpecData, EarthStructureDiagram) {
  const diameterKm = SpecData.CONSTANTS.meanDiameterKm.earth;
  const radiusKm = diameterKm / 2;
  const circumferenceKm = Math.PI * diameterKm;

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
      options: EIGHT_FEATURE_NAMES,
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
      options: EIGHT_FEATURE_NAMES,
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
    ...EIGHT_FEATURES.map((feature) => namedLineQuestion(feature, EarthStructureDiagram)),
  ];
}

const earthStructureQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = earthStructureQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.EarthStructureQuestions = earthStructureQuestionsApi;
}
