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
 * Three more (tilt-not-distance-misconception, relative-intensity-from-
 * altitude, noon-altitude-december-guildford; all tagged u2.9, spec
 * 4.12/4.13) back the page's "Why does the tilt cause the seasons?"
 * section — the same sin(altitude) and 90° - |lat - declination|
 * formulas that section's own diagrams use, restated here as worked
 * calculations rather than drawn.
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
      id: 'tilt-not-distance-misconception',
      units: ['u2.9'],
      type: 'choice',
      prompt:
        "Earth's distance from the Sun is about 152 million km in June and about 147 million km in December — so Earth is actually slightly closer to the Sun in December. Which of these correctly explains why the UK still has summer in June, not December?",
      options: [
        'Because Earth is closer to the Sun in June',
        "Because the UK is tilted towards the Sun in June, giving the Sun a higher noon altitude and a longer day",
        "Because Earth moves faster around its orbit in June",
        'Because the Moon blocks less sunlight in June',
      ],
      check(value) {
        const correct = value === "Because the UK is tilted towards the Sun in June, giving the Sun a higher noon altitude and a longer day";
        return {
          correct,
          message:
            "Earth is actually very slightly closer to the Sun in December, the opposite of what the 'closer = warmer' idea predicts — so distance can't be the explanation. What changes with the seasons is axial tilt: in June the UK's hemisphere is tilted towards the Sun, giving a higher noon Sun (more energy per square metre) and a longer day (more hours for that energy to arrive).",
        };
      },
    },
    {
      id: 'relative-intensity-from-altitude',
      units: ['u2.9'],
      type: 'number',
      unitLabel: '(compared with the Sun overhead, where that value is 1.00)',
      prompt:
        'A beam of sunlight spreads over an area proportional to 1/sin(altitude) once it lands on flat ground, so the energy landing on each square metre is proportional to sin(altitude). On a day when the Sun reaches a noon altitude of 40°, how much energy lands on each square metre, compared with the Sun directly overhead (altitude 90°, where the answer is 1.00)? Give your answer to 2 decimal places.',
      check(value) {
        const correctValue = Math.sin((40 * Math.PI) / 180);
        const correct = Math.abs(value - correctValue) <= 0.05;
        return {
          correct,
          message: `Energy per square metre ∝ sin(altitude), so sin(40°) ≈ ${correctValue.toFixed(2)} — about ${Math.round(correctValue * 100)}% of what the same square metre gets with the Sun directly overhead.`,
        };
      },
    },
    {
      id: 'noon-altitude-december-guildford',
      units: ['u2.9'],
      type: 'number',
      unitLabel: '°',
      prompt:
        "At the December solstice the Sun's declination is about -23.5°. Using noon altitude = 90° - |latitude - declination|, what is the Sun's noon altitude at latitude 51°N (about Guildford) on the December solstice?",
      check(value) {
        const correctValue = 90 - Math.abs(51 - -23.5);
        const correct = Math.abs(value - correctValue) <= 2;
        return {
          correct,
          message: `noon altitude = 90° - |latitude - declination| = 90° - |51° - (-23.5°)| = 90° - 74.5° = ${correctValue.toFixed(1)}°.`,
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
    // 13.22: the atmosphere blocks almost all radiation except visible
    // light and radio waves — read directly off the transmission chart.
    {
      id: 'transmission-chart-open-bands',
      units: ['u2.16'],
      type: 'choice',
      prompt:
        "Looking at the atmospheric transmission chart above (the one with gamma ray, X-ray, ultraviolet, optical, infrared and radio bars): besides radio waves, which part of the spectrum is shown reaching the ground largely unblocked?",
      options: ['Gamma ray', 'X-ray', 'Ultraviolet', 'Optical', 'Infrared'],
      check(value) {
        const correct = value === 'Optical';
        return {
          correct,
          message:
            "The chart shows gamma ray, X-ray and ultraviolet all absorbed high up (blocked, red), infrared only partly getting through (orange), and only optical light and radio waves reaching the ground largely unimpeded (blue) — exactly the two transmission windows the spec names.",
        };
      },
    },
    // 13.30: the atmosphere's detrimental effect on image quality
    // (scintillation/twinkling), and why it matters for ground telescopes.
    {
      id: 'scintillation-and-ground-telescopes',
      units: ['u2.33'],
      type: 'choice',
      prompt:
        "Constantly shifting pockets of different density and temperature in the atmosphere bend starlight unpredictably as it arrives, making stars visibly twinkle. What is this effect called, and why does it matter for a ground-based telescope?",
      options: [
        'Scintillation — it blurs and distorts fine detail in any ground-based image or measurement',
        'Refraction — it bends starlight so much that stars appear in the wrong place in the sky',
        'Extinction — it dims every star by exactly the same amount, with no effect on image sharpness',
        'Diffraction — it is caused by the telescope\'s own aperture, not by the atmosphere at all',
      ],
      check(value) {
        const correct = value === 'Scintillation — it blurs and distorts fine detail in any ground-based image or measurement';
        return {
          correct,
          message:
            "This is scintillation: unpredictable bending of starlight by small, constantly shifting pockets of different air density and temperature. It blurs and distorts fine detail in any ground-based image or measurement — one of the main reasons the very largest, most detail-hungry telescopes (and anything needing the sharpest possible resolution) are instead placed above the atmosphere, in space.",
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
