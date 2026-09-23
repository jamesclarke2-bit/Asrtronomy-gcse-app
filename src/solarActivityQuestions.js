/**
 * Practice questions for sims/sun-declination.html covering the
 * butterfly diagram, the solar wind and aurorae. The two
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

  return [
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

const solarActivityQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = solarActivityQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.SolarActivityQuestions = solarActivityQuestionsApi;
}
