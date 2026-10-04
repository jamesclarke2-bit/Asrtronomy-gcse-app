/**
 * Pearson Edexcel GCSE Astronomy (1AS0) Appendix 2: the exam's own
 * "Formulae and data sheet" — the rounded values students are actually
 * given in the exam, and the only values an answer is marked against
 * when a question supplies them. Reproduced here once, as plain data, so
 * every student-facing page (notes/data-sheet.html, sims/kepler.html,
 * src/keplerQuestions.js, ...) quotes the same numbers instead of each
 * retyping its own copy that could drift out of sync.
 *
 * This is deliberately a *separate* tier from src/orbitalMechanics.js's
 * PLANETARY_DATA, which holds precise modern values for the engine's own
 * maths (see that file's header comment) — this file holds only the
 * rounded figures the exam itself prints, exactly as given, for anything
 * student-facing. test/specData.test.js checks the two tiers agree
 * within normal rounding, so they can't silently drift apart.
 *
 * Every column of PLANETARY_DATA — type, distance, period, mean
 * temperature, diameter, mass, ring systems and moons — is transcribed
 * directly from the Appendix 2 sheet. Note that the Appendix 2 sheet
 * itself is not internally consistent: the constants list above gives
 * Earth's diameter as 13,000 km, but the planet table gives 12.8
 * (thousand km) for Earth — both figures are printed on the real sheet,
 * not a transcription error here (see notes/data-sheet.html, which
 * flags this to students).
 */
(function () {
  const CONSTANTS = {
    earthMassKg: 6.0e24,
    meanDiameterKm: {
      earth: 13000,
      moon: 3500,
      sun: 1.4e6,
    },
    auKm: 1.5e8,
    meanEarthMoonDistanceKm: 380000,
    lightYearKm: 9.5e12,
    parsecKm: 3.1e13,
    parsecLightYears: 3.26,
    // Sidereal day: 23 h 56 min, relative to the stars.
    siderealDay: { hours: 23, minutes: 56 },
    // Synodic ("solar") day: 24 h 00 min, relative to the Sun.
    synodicDay: { hours: 24, minutes: 0 },
    photosphereTemperatureK: 5800,
    hubbleConstantKmPerSPerMpc: 68,
    speedOfLightMPerS: 3.0e8,
  };

  function hoursAndMinutesToDecimalHours(value) {
    return value.hours + value.minutes / 60;
  }

  CONSTANTS.siderealDayHours = hoursAndMinutesToDecimalHours(CONSTANTS.siderealDay);
  CONSTANTS.synodicDayHours = hoursAndMinutesToDecimalHours(CONSTANTS.synodicDay);

  // --- Planets and dwarf planets: distance and period exactly as given,
  // every other column a standard-values placeholder (see header). ---

  const PLANETARY_DATA = [
    {
      name: 'Mercury',
      type: 'planet',
      distanceAU: 0.38,
      periodYears: 0.24,
      meanTemperatureC: 170,
      diameterThousandKm: 4.9,
      massEarthMasses: 0.055,
      rings: false,
      moons: 'None',
    },
    {
      name: 'Venus',
      type: 'planet',
      distanceAU: 0.72,
      periodYears: 0.62,
      meanTemperatureC: 470,
      diameterThousandKm: 12.1,
      massEarthMasses: 0.82,
      rings: false,
      moons: 'None',
    },
    {
      name: 'Earth',
      type: 'planet',
      distanceAU: 1.0,
      periodYears: 1.0,
      meanTemperatureC: 15,
      diameterThousandKm: 12.8,
      massEarthMasses: 1.0,
      rings: false,
      moons: '1 (the Moon)',
    },
    {
      name: 'Mars',
      type: 'planet',
      distanceAU: 1.5,
      periodYears: 1.9,
      meanTemperatureC: -50,
      diameterThousandKm: 6.9,
      massEarthMasses: 0.11,
      rings: false,
      moons: '2 small moons (Deimos and Phobos)',
    },
    {
      name: 'Ceres',
      type: 'dwarf planet',
      distanceAU: 2.8,
      periodYears: 4.6,
      meanTemperatureC: -105,
      diameterThousandKm: 0.95,
      massEarthMasses: 1.5e-4,
      rings: false,
      moons: 'None',
    },
    {
      name: 'Jupiter',
      type: 'planet',
      distanceAU: 5.2,
      periodYears: 11.9,
      meanTemperatureC: -150,
      diameterThousandKm: 143,
      massEarthMasses: 318,
      rings: true,
      moons: '4 major moons (Ganymede, Callisto, Europa, Io) and more than 60 others',
    },
    {
      name: 'Saturn',
      type: 'planet',
      distanceAU: 9.5,
      periodYears: 29.5,
      meanTemperatureC: -180,
      diameterThousandKm: 121,
      massEarthMasses: 95,
      rings: true,
      moons: '5 major moons including Titan and Iapetus, and more than 55 others',
    },
    {
      name: 'Uranus',
      type: 'planet',
      distanceAU: 19.1,
      periodYears: 84.0,
      meanTemperatureC: -210,
      diameterThousandKm: 51,
      massEarthMasses: 15,
      rings: true,
      moons: '5 major moons including Titania and Oberon, and more than 20 others',
    },
    {
      name: 'Neptune',
      type: 'planet',
      distanceAU: 30.0,
      periodYears: 165,
      meanTemperatureC: -220,
      diameterThousandKm: 50,
      massEarthMasses: 17,
      rings: true,
      moons: '1 major moon (Triton) and more than 12 others',
    },
    {
      name: 'Pluto',
      type: 'dwarf planet',
      distanceAU: 39.5,
      periodYears: 248,
      meanTemperatureC: -230,
      diameterThousandKm: 2.4,
      massEarthMasses: 2.2e-3,
      rings: false,
      moons: '1 major moon (Charon) and more than 4 others',
    },
    {
      name: 'Haumea',
      type: 'dwarf planet',
      distanceAU: 43.1,
      periodYears: 283,
      meanTemperatureC: -241,
      diameterThousandKm: 1.4,
      massEarthMasses: 6.7e-4,
      rings: false,
      moons: '2',
    },
    {
      name: 'Eris',
      type: 'dwarf planet',
      distanceAU: 67.8,
      periodYears: 557,
      meanTemperatureC: -230,
      diameterThousandKm: 2.3,
      massEarthMasses: 2.8e-3,
      rings: false,
      moons: 'At least 1',
    },
  ];

  const api = { CONSTANTS, PLANETARY_DATA };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.SpecData = api;
  }
})();
