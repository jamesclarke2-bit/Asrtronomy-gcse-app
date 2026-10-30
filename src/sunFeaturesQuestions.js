/**
 * Practice questions for notes/sun-features.html covering nuclear
 * fusion, the butterfly diagram, the solar wind and aurorae. The two
 * butterfly-diagram questions check against ButterflyDiagram's own
 * constants rather than a second, independently hardcoded pair of
 * numbers, so grading always matches what the diagram itself draws —
 * same dependency-injection pattern as src/sunDeclinationQuestions.js.
 */

function makeQuestions(ButterflyDiagram) {
  function normalizeText(value) {
    return String(value).trim().toLowerCase();
  }

  const SOLAR_WIND_PARTICLES = [
    'electron',
    'electrons',
    'proton',
    'protons',
    'alpha particle',
    'alpha particles',
    'helium nucleus',
    'helium nuclei',
  ];

  // In the proton-proton chain, four protons (total mass 4 x the proton
  // mass) end up as one helium-4 nucleus plus two positrons, two
  // neutrinos and energy — about 0.7% of the starting mass, converted
  // to energy via E = mc^2.
  const FUSION_MASS_TO_ENERGY_FRACTION = 0.007;

  return [
    {
      id: 'fusion-mass-to-energy',
      units: ['u2.4'],
      type: 'number',
      unitLabel: 'g',
      prompt:
        "In the proton-proton chain, about 0.7% of the hydrogen's mass is converted into energy (the rest ends up as helium-4). About how many grams of a 1 kg (1000 g) sample of hydrogen become energy?",
      check(value) {
        const correct = 1000 * FUSION_MASS_TO_ENERGY_FRACTION;
        return {
          correct: Math.abs(value - correct) <= 1,
          message: `0.7% of 1000 g = ${correct.toFixed(1)} g.`,
        };
      },
    },
    {
      id: 'butterfly-cycle-length',
      units: ['u2.5'],
      type: 'number',
      unitLabel: 'years',
      prompt:
        'Using the butterfly diagram, estimate the length of the solar cycle — the time from one cycle\'s high-latitude start to the next.',
      check(value) {
        const correct = Math.abs(value - ButterflyDiagram.CYCLE_LENGTH_YEARS) <= 2;
        return {
          correct,
          message: `Each cycle's high-latitude burst repeats about every ${ButterflyDiagram.CYCLE_LENGTH_YEARS} years — the solar cycle.`,
        };
      },
    },
    {
      id: 'butterfly-start-latitude',
      units: ['u2.5'],
      type: 'number',
      unitLabel: '°',
      prompt: 'From the butterfly diagram, what is the approximate sunspot latitude at the start of a cycle?',
      check(value) {
        const correct = Math.abs(value - ButterflyDiagram.LATITUDE_AT_CYCLE_START_DEG) <= 5;
        return {
          correct,
          message: `Each cycle begins with sunspots forming around ${ButterflyDiagram.LATITUDE_AT_CYCLE_START_DEG}° latitude (in both hemispheres), then drifting toward the equator as the cycle goes on.`,
        };
      },
    },
    {
      id: 'solar-wind-particle',
      units: ['u2.12'],
      type: 'text',
      prompt: 'Name one type of charged particle carried by the solar wind.',
      check(value) {
        const correct = SOLAR_WIND_PARTICLES.includes(normalizeText(value));
        return {
          correct,
          message: 'The solar wind is made of electrons, protons and alpha particles (helium nuclei).',
        };
      },
    },
    {
      id: 'solar-wind-aurorae',
      units: ['u2.12'],
      type: 'text',
      prompt: 'Briefly explain how the solar wind causes aurorae.',
      check(value) {
        const text = normalizeText(value);
        const mentionsField = text.includes('magnetic') || text.includes('pole');
        const mentionsCollision = text.includes('atmosphere') || text.includes('gas') || text.includes('collide') || text.includes('collision');
        const correct = mentionsField && mentionsCollision;
        return {
          correct,
          message:
            "Earth's magnetic field funnels incoming charged particles from the solar wind toward the poles, where they collide with atmospheric gases and make them glow — the aurora borealis and aurora australis.",
        };
      },
    },
  ];
}

const sunFeaturesQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = sunFeaturesQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.SunFeaturesQuestions = sunFeaturesQuestionsApi;
}
