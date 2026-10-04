/**
 * Practice questions for sims/kepler.html: Kepler's third law
 * calculations (period <-> radius), identifying aphelion/perihelion, how
 * orbital speed changes around an ellipse (Kepler's second law), and how
 * the third law's constant depends on central mass (Kepler's third law,
 * the "constant depends inversely on mass" half).
 *
 * The two numeric questions use real bodies and figures from the exam
 * data sheet (src/specData.js) rather than made-up numbers, and accept
 * two different "right answers": the exam data sheet's own printed
 * figure for the body (its distance or period column), and the figure
 * you get by applying T²=r³ directly to the data sheet's *other* given
 * column for that body. Those two don't quite agree, because the sheet
 * rounds its distance and period columns independently — both are
 * marked correct.
 *
 * Every number is re-derived live from OrbitalMechanics and SpecData,
 * never a second, independently-typed copy of them.
 */

function makeQuestions(OrbitalMechanics, SpecData) {
  const mars = SpecData.PLANETARY_DATA.find((body) => body.name === 'Mars');
  const ceres = SpecData.PLANETARY_DATA.find((body) => body.name === 'Ceres');

  const marsFormulaPeriod = OrbitalMechanics.periodYearsFromSemiMajorAxisAU(mars.distanceAU);
  const ceresFormulaDistance = OrbitalMechanics.semiMajorAxisAUFromPeriodYears(ceres.periodYears);

  return [
    {
      id: 'period-from-radius',
      units: ['u3.11'],
      type: 'number',
      unitLabel: 'years',
      prompt:
        `The exam data sheet gives Mars's mean distance from the Sun as ${mars.distanceAU} AU. Using Kepler's third law (T² = r³, with T in years and r in AU), calculate its orbital period.`,
      check(value) {
        const margin = 0.15;
        const correct = Math.abs(value - marsFormulaPeriod) <= margin || Math.abs(value - mars.periodYears) <= margin;
        return {
          correct,
          message:
            `T² = r³ = ${mars.distanceAU}³ = ${Math.pow(mars.distanceAU, 3).toFixed(3)}, so T = √${Math.pow(mars.distanceAU, 3).toFixed(3)} ≈ ${marsFormulaPeriod.toFixed(2)} years. ` +
            `The data sheet's own period column gives ${mars.periodYears} years for Mars — both count as correct here, since the sheet rounds its distance and period columns separately, so working forward from one doesn't exactly reproduce the other.`,
        };
      },
    },
    {
      id: 'radius-from-period',
      units: ['u3.11'],
      type: 'number',
      unitLabel: 'AU',
      prompt:
        `The exam data sheet gives Ceres's orbital period as ${ceres.periodYears} years. Using Kepler's third law (T² = r³, with T in years and r in AU), calculate its mean distance from the Sun.`,
      check(value) {
        const margin = 0.3;
        const correct = Math.abs(value - ceresFormulaDistance) <= margin || Math.abs(value - ceres.distanceAU) <= margin;
        return {
          correct,
          message:
            `r³ = T² = ${ceres.periodYears}² = ${Math.pow(ceres.periodYears, 2).toFixed(2)}, so r = ³√${Math.pow(ceres.periodYears, 2).toFixed(2)} ≈ ${ceresFormulaDistance.toFixed(2)} AU. ` +
            `The data sheet's own distance column gives ${ceres.distanceAU} AU for Ceres — both count as correct here, since the sheet rounds its distance and period columns separately, so working forward from one doesn't exactly reproduce the other.`,
        };
      },
    },
    {
      id: 'identify-aphelion-perihelion',
      units: ['u3.10'],
      type: 'choice',
      prompt:
        "On the Orbit view diagram above, one labelled point is the closest the planet ever gets to the Sun, and the other is the farthest. What are these two points called for an orbit around the Sun, and around Earth?",
      options: [
        'Perihelion (closest) and aphelion (farthest); apogee (closest) and perigee (farthest) around Earth',
        'Perihelion (closest) and aphelion (farthest); perigee (closest) and apogee (farthest) around Earth',
        'Aphelion (closest) and perihelion (farthest); perigee (closest) and apogee (farthest) around Earth',
        'Apogee (closest) and perigee (farthest); perihelion (closest) and aphelion (farthest) around Earth',
      ],
      check(value) {
        const correct = value === 'Perihelion (closest) and aphelion (farthest); perigee (closest) and apogee (farthest) around Earth';
        return {
          correct,
          message:
            "Perihelion is the closest point to the Sun, aphelion the farthest — the 'peri-/ap(o)-' pattern repeats for Earth orbits as perigee (closest) and apogee (farthest), as on the Moon Phases page's perigee/apogee section.",
        };
      },
    },
    {
      id: 'speed-around-orbit',
      units: ['u3.9'],
      type: 'choice',
      prompt: "How does a planet's orbital speed change as it moves around its elliptical orbit?",
      options: [
        "It's constant — speed doesn't depend on distance from the Sun",
        'Fastest at aphelion, slowest at perihelion',
        'Fastest at perihelion, slowest at aphelion',
        'Fastest at perihelion and aphelion, slowest in between',
      ],
      check(value) {
        const correct = value === 'Fastest at perihelion, slowest at aphelion';
        return {
          correct,
          message:
            "A planet moves fastest at perihelion (closest to the Sun) and slowest at aphelion (farthest). That's Kepler's second law in speed terms: with the swept-area rate constant, a shorter radius near perihelion needs a faster speed to sweep the same area a longer radius manages more slowly near aphelion.",
        };
      },
    },
    {
      id: 'equal-areas',
      units: ['u3.9'],
      type: 'choice',
      prompt:
        "Two of the shaded wedges on the Second law diagram above cover equal time intervals — one near perihelion (short and wide), one near aphelion (long and thin). How do their areas compare?",
      options: [
        'The perihelion wedge has the greater area',
        'The aphelion wedge has the greater area',
        'They have exactly the same area',
        "It depends on the orbit's eccentricity",
      ],
      check(value) {
        const correct = value === 'They have exactly the same area';
        return {
          correct,
          message:
            "They're exactly equal — that's Kepler's second law: a line from the Sun to the planet sweeps out equal areas in equal times, everywhere on the orbit. The wedges look completely different (short-and-wide vs long-and-thin) precisely because the planet moves faster when closer in, which is what keeps the area the same.",
        };
      },
    },
    {
      id: 'constant-depends-on-mass',
      units: ['u3.12'],
      type: 'choice',
      prompt:
        "Using the central-mass control on the Third law graph above: compare a planet at 1 AU from our Sun to a planet at 1 AU from a star with twice the Sun's mass. How does that star's Kepler's third law constant (T²/r³) compare to the Sun's, and why?",
      options: [
        "It's twice as big — the constant is directly proportional to the central mass",
        "It's half as big — the constant is inversely proportional to the central mass",
        "It's exactly the same — T²/r³ only depends on r, not on the central mass",
        "It's four times as big — the constant depends on the square of the central mass",
      ],
      check(value) {
        const correct = value === "It's half as big — the constant is inversely proportional to the central mass";
        return {
          correct,
          message:
            "It's half as big. In general T²/r³ = 4π²/(GM), so the constant is inversely proportional to the central mass M — double the mass, and the constant halves (which is also why the more massive star's planet has a shorter period at the same 1 AU distance: more gravity pulling it round means it doesn't need as long an orbit to balance). Drag the central-mass control to 2× and compare the dashed line's slope on the graph above to see it.",
        };
      },
    },
  ];
}

const keplerQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = keplerQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.KeplerQuestions = keplerQuestionsApi;
}
