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
 * CONSTANTS and the (distanceAU, periodYears) pair of every body in
 * PLANETARY_DATA are the exact figures supplied for this file. The
 * other per-body columns (type, mean temperature, diameter, mass, rings,
 * moons) were not supplied verbatim alongside them; they're standard
 * published values rounded to the data sheet's own 2-significant-figure
 * style, not transcribed from the actual Appendix 2 sheet — treat those
 * columns as a reasonable placeholder to check against the real sheet,
 * not as exam-exact.
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
      kind: 'planet',
      distanceAU: 0.38,
      periodYears: 0.24,
      type: 'Rocky',
      meanTemperatureC: 167,
      diameterThousandKm: 4.9,
      massEarthMasses: 0.055,
      rings: false,
      moons: 0,
    },
    {
      name: 'Venus',
      kind: 'planet',
      distanceAU: 0.72,
      periodYears: 0.62,
      type: 'Rocky',
      meanTemperatureC: 464,
      diameterThousandKm: 12.1,
      massEarthMasses: 0.82,
      rings: false,
      moons: 0,
    },
    {
      name: 'Earth',
      kind: 'planet',
      distanceAU: 1.0,
      periodYears: 1.0,
      type: 'Rocky',
      meanTemperatureC: 15,
      diameterThousandKm: 13,
      massEarthMasses: 1.0,
      rings: false,
      moons: 1,
    },
    {
      name: 'Mars',
      kind: 'planet',
      distanceAU: 1.5,
      periodYears: 1.9,
      type: 'Rocky',
      meanTemperatureC: -65,
      diameterThousandKm: 6.8,
      massEarthMasses: 0.11,
      rings: false,
      moons: 2,
    },
    {
      name: 'Ceres',
      kind: 'dwarf planet',
      distanceAU: 2.8,
      periodYears: 4.6,
      type: 'Rocky',
      meanTemperatureC: -105,
      diameterThousandKm: 0.94,
      massEarthMasses: 0.00016,
      rings: false,
      moons: 0,
    },
    {
      name: 'Jupiter',
      kind: 'planet',
      distanceAU: 5.2,
      periodYears: 11.9,
      type: 'Gas giant',
      meanTemperatureC: -110,
      diameterThousandKm: 143,
      massEarthMasses: 318,
      rings: true,
      moons: 95,
    },
    {
      name: 'Saturn',
      kind: 'planet',
      distanceAU: 9.5,
      periodYears: 29.5,
      type: 'Gas giant',
      meanTemperatureC: -140,
      diameterThousandKm: 121,
      massEarthMasses: 95,
      rings: true,
      moons: 146,
    },
    {
      name: 'Uranus',
      kind: 'planet',
      distanceAU: 19.1,
      periodYears: 84.0,
      type: 'Ice giant',
      meanTemperatureC: -195,
      diameterThousandKm: 51,
      massEarthMasses: 14.5,
      rings: true,
      moons: 27,
    },
    {
      name: 'Neptune',
      kind: 'planet',
      distanceAU: 30.0,
      periodYears: 165,
      type: 'Ice giant',
      meanTemperatureC: -200,
      diameterThousandKm: 50,
      massEarthMasses: 17,
      rings: true,
      moons: 14,
    },
    {
      name: 'Pluto',
      kind: 'dwarf planet',
      distanceAU: 39.5,
      periodYears: 248,
      type: 'Rocky/icy',
      meanTemperatureC: -225,
      diameterThousandKm: 2.4,
      massEarthMasses: 0.0022,
      rings: false,
      moons: 5,
    },
    {
      name: 'Haumea',
      kind: 'dwarf planet',
      distanceAU: 43.1,
      periodYears: 283,
      type: 'Rocky/icy',
      meanTemperatureC: -241,
      diameterThousandKm: 1.6,
      massEarthMasses: 0.00066,
      rings: true,
      moons: 2,
    },
    {
      name: 'Eris',
      kind: 'dwarf planet',
      distanceAU: 67.8,
      periodYears: 557,
      type: 'Rocky/icy',
      meanTemperatureC: -231,
      diameterThousandKm: 2.3,
      massEarthMasses: 0.0028,
      rings: false,
      moons: 1,
    },
  ];

  const api = { CONSTANTS, PLANETARY_DATA };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.SpecData = api;
  }
})();
