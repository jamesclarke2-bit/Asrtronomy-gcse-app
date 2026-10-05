/**
 * Practice questions for notes/scale-of-the-solar-system.html: converting
 * a distance between km, AU, light years and parsecs (11.8), and
 * calculating light travel time (11.9), plus one conceptual question on
 * why astronomers switch units at different scales (7.6).
 *
 * Every figure in a prompt is derived live from SpecData (the exam's own
 * data sheet), so a question can never quote a number that drifts out of
 * sync with the constants/planet table it's built from. Numeric answers
 * accept a tolerance around the value you get by working the stated
 * calculation forward from those same data-sheet figures.
 */

const SUPERSCRIPT_DIGITS = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻', '+': '' };

function toSuperscript(value) {
  return String(value)
    .split('')
    .map((ch) => SUPERSCRIPT_DIGITS[ch] ?? ch)
    .join('');
}

// "1.5e+8" -> "1.5 × 10⁸", matching the data sheet's own notation.
function formatScientific(value, sigFigs) {
  const [mantissa, exponent] = value.toExponential(sigFigs).split('e');
  return `${mantissa} × 10${toSuperscript(Number(exponent))}`;
}

function makeQuestions(SpecData) {
  const C = SpecData.CONSTANTS;
  const neptune = SpecData.PLANETARY_DATA.find((body) => body.name === 'Neptune');
  const jupiter = SpecData.PLANETARY_DATA.find((body) => body.name === 'Jupiter');
  const mars = SpecData.PLANETARY_DATA.find((body) => body.name === 'Mars');

  const neptuneKm = neptune.distanceAU * C.auKm;
  const jupiterKm = jupiter.distanceAU * C.auKm;
  const nearestStarLy = 4.25; // Proxima Centauri — real-world figure, not on the exam data sheet
  const nearestStarKm = nearestStarLy * C.lightYearKm;
  const marsKm = mars.distanceAU * C.auKm;
  const marsLightSeconds = (marsKm * 1000) / C.speedOfLightMPerS;
  const marsLightMinutes = marsLightSeconds / 60;

  return [
    {
      id: 'convert-km-to-au',
      units: ['u3.16'],
      type: 'number',
      unitLabel: 'AU',
      prompt: `Neptune's mean distance from the Sun is ${formatScientific(neptuneKm, 1)} km. Using the data sheet's 1 AU = ${formatScientific(C.auKm, 1)} km, convert this to AU.`,
      check(value) {
        const correct = Math.abs(value - neptune.distanceAU) <= 0.5;
        return {
          correct,
          message:
            `distance (AU) = distance (km) / (km per AU) = ${formatScientific(neptuneKm, 1)} / ${formatScientific(C.auKm, 1)} = ${neptune.distanceAU} AU. ` +
            `That matches the data sheet's own distance column for Neptune (${neptune.distanceAU} AU) — this is exactly how that column was derived from the true distance in km.`,
        };
      },
    },
    {
      id: 'convert-au-to-km',
      units: ['u3.16'],
      type: 'number',
      unitLabel: 'km',
      prompt: `The data sheet gives Jupiter's mean distance from the Sun as ${jupiter.distanceAU} AU. Using 1 AU = ${formatScientific(C.auKm, 1)} km, convert this to km.`,
      check(value) {
        const correct = Math.abs(value - jupiterKm) <= 0.05 * jupiterKm;
        return {
          correct,
          message:
            `distance (km) = distance (AU) × (km per AU) = ${jupiter.distanceAU} × ${formatScientific(C.auKm, 1)} = ${formatScientific(jupiterKm, 2)} km.`,
        };
      },
    },
    {
      id: 'convert-ly-to-km',
      units: ['u3.16'],
      type: 'number',
      unitLabel: 'km',
      prompt: `Proxima Centauri, the nearest star beyond the Sun, is about ${nearestStarLy} light years away. Using the data sheet's 1 light year = ${formatScientific(C.lightYearKm, 1)} km, convert this to km.`,
      check(value) {
        const correct = Math.abs(value - nearestStarKm) <= 0.05 * nearestStarKm;
        return {
          correct,
          message:
            `distance (km) = distance (ly) × (km per ly) = ${nearestStarLy} × ${formatScientific(C.lightYearKm, 1)} = ${formatScientific(nearestStarKm, 2)} km — a number so large that light years (or parsecs) exist specifically so nobody has to write distances like this out in km.`,
        };
      },
    },
    {
      id: 'convert-parsec-to-ly',
      units: ['u3.16'],
      type: 'number',
      unitLabel: 'light years',
      prompt: `A star is measured to be 2.5 parsecs away. Using the data sheet's figure that 1 parsec = ${C.parsecLightYears} light years, convert this to light years.`,
      check(value) {
        const expected = 2.5 * C.parsecLightYears;
        const correct = Math.abs(value - expected) <= 0.3;
        return {
          correct,
          message: `distance (ly) = distance (pc) × (ly per pc) = 2.5 × ${C.parsecLightYears} = ${expected.toFixed(2)} light years.`,
        };
      },
    },
    {
      id: 'light-travel-time-mars',
      units: ['u3.17'],
      type: 'number',
      unitLabel: 'minutes',
      prompt: `Using Mars's mean distance from the Sun (${mars.distanceAU} AU, from the data sheet) and the data sheet's speed of light (${formatScientific(C.speedOfLightMPerS, 1)} m/s), calculate how long light takes to travel from the Sun to Mars, in minutes.`,
      check(value) {
        const correct = Math.abs(value - marsLightMinutes) <= 1;
        return {
          correct,
          message:
            `First convert Mars's distance to metres: ${mars.distanceAU} × ${formatScientific(C.auKm, 1)} km = ${formatScientific(marsKm, 2)} km = ${formatScientific(marsKm * 1000, 2)} m. ` +
            `time = distance / speed = ${formatScientific(marsKm * 1000, 2)} / ${formatScientific(C.speedOfLightMPerS, 1)} = ${marsLightSeconds.toFixed(0)} s = ${marsLightMinutes.toFixed(1)} minutes.`,
        };
      },
    },
    {
      id: 'why-different-units',
      units: ['u3.4'],
      type: 'choice',
      prompt:
        "Why do astronomers use the astronomical unit (AU) for distances within the Solar System, but switch to light years or parsecs for distances to other stars?",
      options: [
        'Because distances in km stop being accurate once they get very large',
        'Because the AU, light year and parsec are each chosen to keep the numbers in a sensible range at their own scale — interstellar distances in AU, or Solar System distances in light years, would be awkwardly large or tiny',
        'Because light years and parsecs are measured more precisely than the AU',
        'Because the AU only applies to planets with perfectly circular orbits',
      ],
      check(value) {
        const correct =
          value ===
          'Because the AU, light year and parsec are each chosen to keep the numbers in a sensible range at their own scale — interstellar distances in AU, or Solar System distances in light years, would be awkwardly large or tiny';
        return {
          correct,
          message:
            `It's purely about convenient numbers, not accuracy. Neptune's distance is a manageable ${neptune.distanceAU} AU, but the nearest star beyond the Sun sits roughly ${Math.round(nearestStarKm / C.auKm).toLocaleString()} AU away — switch to light years and that becomes a much more manageable ${nearestStarLy} ly. Run it the other way and Mercury's distance would be an awkward 0.000006 light years. Each unit is just sized for the distances it's normally used for.`,
        };
      },
    },
  ];
}

const scaleOfSolarSystemQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = scaleOfSolarSystemQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.ScaleOfSolarSystemQuestions = scaleOfSolarSystemQuestionsApi;
}
