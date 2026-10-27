/**
 * Practice questions for notes/moon-structure.html: the Moon's mean
 * diameter compared with Earth's (2.2, u2.2), recognising the five
 * surface-feature types (2.3, u2.2), identifying the seven named
 * features on sight (2.5, u2.20), and the Moon's rotation/orbital
 * periods and why they lock the same face towards Earth (2.6/2.7,
 * u2.21) — plus a common mix-up with the Moon's phase cycle.
 *
 * Both diameters come from src/specData.js (the exam's own data sheet),
 * matching the figures notes/earth-structure.html and this page's own
 * "Inside the Moon" section already state. The 29.5-day phase-cycle
 * figure (for the misconception question) comes live from
 * src/moonPhase.js (SYNODIC_MONTH_DAYS) — the same constant
 * notes/archaeoastronomy.html and sims/sidereal-vs-synodic.html already
 * use — so it can never quote a figure the rest of the site disagrees
 * with.
 *
 * The seven "name that feature" questions are picture-based, as the exam
 * itself asks (spec 2.5): each one's render(container) calls back into
 * notes/moon-structure.js's own renderFeatureQuizDiagram (passed in as
 * MoonStructureDiagram, the third argument), which redraws the real map
 * with one feature highlighted — never a hand-written text clue that
 * could drift from what the map actually shows. makeQuestions still runs
 * perfectly well without that third argument (e.g. from a Node test, or
 * from src/allQuestions.js's sitewide list, neither of which has a DOM
 * to draw into) — render just never gets called there.
 */
const NAMED_FEATURES = [
  { term: 'tranquility', name: 'Sea of Tranquility' },
  { term: 'storms', name: 'Ocean of Storms' },
  { term: 'crises', name: 'Sea of Crises' },
  { term: 'tycho', name: 'Tycho' },
  { term: 'copernicus', name: 'Copernicus' },
  { term: 'kepler', name: 'Kepler' },
  { term: 'apennines', name: 'Apennine Mountains' },
];
const FEATURE_NAMES = NAMED_FEATURES.map((f) => f.name);
const TERRAIN_OPTIONS = ['Maria', 'Terrae (highlands)', 'Crater', 'Valley or rille', 'Mountains'];

function namedFeatureQuestion(feature, MoonStructureDiagram) {
  return {
    id: `named-feature-${feature.term}`,
    units: ['u2.20'],
    type: 'choice',
    prompt: 'Name that feature: which of the seven named features is highlighted on the map?',
    options: FEATURE_NAMES,
    render(container) {
      if (MoonStructureDiagram) MoonStructureDiagram.renderFeatureQuizDiagram(container, feature.term);
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

function makeQuestions(SpecData, MoonPhase, MoonStructureDiagram) {
  const earthDiameterKm = SpecData.CONSTANTS.meanDiameterKm.earth;
  const moonDiameterKm = SpecData.CONSTANTS.meanDiameterKm.moon;
  const diametersAcrossEarth = earthDiameterKm / moonDiameterKm;

  return [
    {
      id: 'moon-diameters-across-earth',
      units: ['u2.2'],
      type: 'number',
      prompt:
        `The data sheet gives the Moon's mean diameter as ${moonDiameterKm.toLocaleString()} km and Earth's as ${earthDiameterKm.toLocaleString()} km. About how many Moon-diameters would fit side by side across Earth's diameter?`,
      check(value) {
        const correct = Math.abs(value - diametersAcrossEarth) <= 0.02 * diametersAcrossEarth;
        return {
          correct,
          message: `${earthDiameterKm.toLocaleString()} ÷ ${moonDiameterKm.toLocaleString()} ≈ ${diametersAcrossEarth.toFixed(1)} — about 3.7 Moon-diameters fit across Earth's diameter.`,
        };
      },
    },
    {
      id: 'terrain-type-identification',
      units: ['u2.2'],
      fields: [
        { key: 'maria', type: 'choice', label: 'A dark, smooth lava plain, flooding a low-lying impact basin.', options: TERRAIN_OPTIONS },
        { key: 'terrae', type: 'choice', label: 'Light-coloured, rugged ground — older than the maria, so far more heavily cratered.', options: TERRAIN_OPTIONS },
        { key: 'crater', type: 'choice', label: 'A round, bowl-shaped scar, caused by a meteoroid or asteroid impact.', options: TERRAIN_OPTIONS },
        { key: 'rille', type: 'choice', label: 'A narrow, channel-like dip crossing the maria, thought to be a collapsed lava tube or old lava channel.', options: TERRAIN_OPTIONS },
        { key: 'mountains', type: 'choice', label: 'An uplifted rim thrown up by a huge impact — not formed by volcanoes.', options: TERRAIN_OPTIONS },
      ],
      prompt: 'Match each description below to the surface-feature type it describes.',
      check(value) {
        const expected = { maria: 'Maria', terrae: 'Terrae (highlands)', crater: 'Crater', rille: 'Valley or rille', mountains: 'Mountains' };
        const correct = Object.keys(expected).every((key) => value[key] === expected[key]);
        return {
          correct,
          message:
            'Dark smooth lava plain → maria; light rugged older ground → terrae (highlands); round impact scar → crater; narrow channel in the maria → valley or rille; uplifted impact-basin rim → mountains.',
        };
      },
    },
    ...NAMED_FEATURES.map((feature) => namedFeatureQuestion(feature, MoonStructureDiagram)),
    {
      id: 'rotation-and-orbit',
      units: ['u2.21'],
      fields: [
        { key: 'rotationDays', type: 'number', label: 'How many days does the Moon take to rotate once on its own axis?', unitLabel: 'days' },
        { key: 'rotationsPerOrbit', type: 'number', label: 'How many times does it rotate during one full orbit of Earth?' },
        {
          key: 'why',
          type: 'choice',
          label: 'Why does this mean the same face always points towards Earth?',
          options: [
            'Because its rotation period exactly matches its orbital period, so it turns at just the rate needed to keep the same side facing Earth throughout the orbit',
            "Because the Moon doesn't rotate on its axis at all",
            "Because Earth's gravity only lights up one side of the Moon",
            "Because the Moon's orbit happens to be a perfect circle",
          ],
        },
      ],
      prompt: "The Moon rotates once on its axis every 27.3 days, and also orbits Earth once every 27.3 days. Use this to answer all three parts.",
      check(value) {
        const rotationCorrect = Math.abs(value.rotationDays - 27.3) <= 0.02 * 27.3;
        const countCorrect = Math.abs(value.rotationsPerOrbit - 1) <= 0.05;
        const whyCorrect =
          value.why === 'Because its rotation period exactly matches its orbital period, so it turns at just the rate needed to keep the same side facing Earth throughout the orbit';
        return {
          correct: rotationCorrect && countCorrect && whyCorrect,
          message:
            'The Moon takes 27.3 days to rotate once, and in that same 27.3 days it also completes exactly one orbit of Earth — so it rotates exactly once per orbit. Because the two periods match exactly, the Moon always turns through the same angle it has moved around its orbit, which keeps the same hemisphere facing Earth the whole way round (synchronous rotation).',
        };
      },
    },
    {
      id: 'phase-cycle-misconception',
      units: ['u2.21'],
      type: 'choice',
      prompt:
        `A student says: "The Moon goes through all its phases in 27.3 days, because that's how long it takes to orbit Earth." What's wrong with this?`,
      options: [
        `27.3 days is the Moon's rotation/orbital period (the sidereal month) — the phase cycle (the synodic month) is actually about ${MoonPhase.SYNODIC_MONTH_DAYS.toFixed(1)} days, a bit longer, because Earth also moves on round the Sun during that time, so the Moon needs a little extra time to catch back up to the same Sun-Earth-Moon alignment`,
        'Nothing is wrong — 27.3 days is correct for the phase cycle too',
        'The phase cycle is actually shorter than 27.3 days, not longer',
        "The Moon doesn't really have phases; that's just an illusion caused by clouds",
      ],
      check(value) {
        const correct = value.startsWith('27.3 days is the');
        return {
          correct,
          message: `The 27.3-day figure is the sidereal month (rotation/orbital period) — it's correct, but it's not the phase cycle. The phase cycle (synodic month) is about ${MoonPhase.SYNODIC_MONTH_DAYS.toFixed(1)} days, because Earth's own movement around the Sun shifts the Sun's direction slightly during each orbit, so the Moon needs a few more days to line back up with the Sun the same way.`,
        };
      },
    },
  ];
}

const moonStructureQuestionsApi = { makeQuestions, NAMED_FEATURES };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = moonStructureQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.MoonStructureQuestions = moonStructureQuestionsApi;
}
