/**
 * Practice questions for sims/kepler.html: Kepler's third law
 * calculations (period <-> radius), identifying aphelion/perihelion,
 * and how orbital speed changes around an ellipse (Kepler's second
 * law). Every number is re-derived live from OrbitalMechanics, never a
 * second, independently-typed copy of it.
 */

function makeQuestions(OrbitalMechanics) {
  return [
    {
      id: 'period-from-radius',
      units: ['u3.11'],
      type: 'number',
      unitLabel: 'years',
      prompt:
        "An asteroid orbits the Sun at a mean distance of 4 AU. Using Kepler's third law (T² = r³, with T in years and r in AU), calculate its orbital period.",
      check(value) {
        const period = OrbitalMechanics.periodYearsFromSemiMajorAxisAU(4);
        const correct = Math.abs(value - period) <= 0.2;
        return {
          correct,
          message: `T² = r³ = 4³ = 64, so T = √64 = ${period.toFixed(1)} years.`,
        };
      },
    },
    {
      id: 'radius-from-period',
      units: ['u3.11'],
      type: 'number',
      unitLabel: 'AU',
      prompt:
        "A newly-discovered comet takes 125 years to orbit the Sun once. Using Kepler's third law (T² = r³, with T in years and r in AU), calculate its mean distance from the Sun.",
      check(value) {
        const radius = OrbitalMechanics.semiMajorAxisAUFromPeriodYears(125);
        const correct = Math.abs(value - radius) <= 1;
        return {
          correct,
          message: `r³ = T² = 125² = 15,625, so r = ³√15,625 = ${radius.toFixed(0)} AU (check: 25³ = 15,625).`,
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
      units: ['u3.12'],
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
      units: ['u3.9', 'u3.12'],
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
  ];
}

const keplerQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = keplerQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.KeplerQuestions = keplerQuestionsApi;
}
