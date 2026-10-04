/**
 * Practice questions for sims/orbits-gravity.html: how gravity's strength
 * changes with distance and mass (8.9, without ever needing its algebraic
 * form — see the page's own "beyond the spec" reveal for that), why an
 * orbit is a stable free-fall rather than a crash (8.3), and why Newton's
 * gravity turns a circle into an ellipse the moment a launch isn't exactly
 * circular speed (8.3, 8.8).
 *
 * Every ratio is re-derived live from OrbitalMechanics.gravitationalForceRatio,
 * never a second, independently-typed copy of it.
 */

function makeQuestions(OrbitalMechanics) {
  const tripleDistanceRatio = OrbitalMechanics.gravitationalForceRatio({ separationFactor: 3 });
  const doubleMassRatio = OrbitalMechanics.gravitationalForceRatio({ massFactor1: 2 });

  return [
    {
      id: 'force-distance',
      units: ['u3.14'],
      type: 'choice',
      prompt:
        "Two satellites feel a gravitational force F between them. If they move apart to three times the distance, with their masses unchanged, what's the new force?",
      options: ['3F', 'F/3', 'F/9', '9F'],
      check(value) {
        const correct = value === 'F/9';
        return {
          correct,
          message: `Gravity is an inverse-square law: moving apart by a factor of 3 divides the force by 3² = 9, giving F/9 (ratio = ${tripleDistanceRatio.toFixed(4)}). Tripling the distance doesn't just triple-reduce the force — the square makes the drop-off much steeper.`,
        };
      },
    },
    {
      id: 'force-mass',
      units: ['u3.14'],
      type: 'choice',
      prompt:
        "A spacecraft's mass doubles, at the same distance from Earth. What happens to the gravitational force Earth exerts on it?",
      options: ['It doubles', 'It halves', 'It quadruples', 'It stays the same'],
      check(value) {
        const correct = value === 'It doubles';
        return {
          correct,
          message: `It doubles (ratio = ${doubleMassRatio.toFixed(2)}). Gravitational force is directly proportional to each mass involved — unlike distance, mass doesn't get squared.`,
        };
      },
    },
    {
      id: 'stable-orbit',
      units: ['u3.8'],
      type: 'choice',
      prompt:
        "The ISS is constantly pulled toward Earth by gravity, yet it never crashes into the ground. Why not?",
      options: [
        "It's actually beyond the reach of Earth's gravity up there",
        "Its engines constantly fire to hold it up against gravity",
        "It's moving sideways so fast that the curve of the ground falls away beneath it exactly as fast as it falls",
        "It isn't really falling at all, just floating",
      ],
      check(value) {
        const correct = value === "It's moving sideways so fast that the curve of the ground falls away beneath it exactly as fast as it falls";
        return {
          correct,
          message:
            "The ISS is in continuous free fall — gravity never stops pulling it down. What keeps it from hitting the ground is its huge sideways (tangential) speed: by the time it's fallen a little, it's also moved far enough sideways that the curved Earth has dropped away by the same amount. That's Newton's cannon: fast enough sideways, and 'falling' and 'orbiting' are the same motion.",
        };
      },
    },
    {
      id: 'why-ellipse',
      units: ['u3.8', 'u3.13'],
      type: 'choice',
      prompt:
        "A satellite is launched at exactly circular orbital speed, then given a brief extra forward push (same height, same direction, right after reaching that speed). What does its new path look like?",
      options: [
        'A perfect circle at a higher altitude',
        'An ellipse, with the push point as its closest approach (perigee)',
        'It flies straight off into space, never to return',
        'It falls back to Earth',
      ],
      check(value) {
        const correct = value === 'An ellipse, with the push point as its closest approach (perigee)';
        return {
          correct,
          message:
            "It becomes an ellipse. The push adds speed without changing height, so the satellite is now moving faster than circular speed right at that point — too fast to stay at that radius, so it swings out farther before gravity pulls it back. The push point, where it's moving fastest and is closest in, becomes perigee; the far point it swings out to becomes apogee. Exactly circular speed is really just the one special case, out of every possible closed orbit, where perigee and apogee happen to coincide.",
        };
      },
    },
    {
      id: 'newton-explains-kepler',
      units: ['u3.13'],
      type: 'choice',
      prompt: "What did Newton's law of gravitation show about Kepler's three laws of planetary motion?",
      options: [
        "They're three separate, unrelated rules that each needed their own explanation",
        'They all follow mathematically from one underlying cause: gravity obeying an inverse-square law',
        'They only apply within the Solar System, not to any other star system',
        "They were proven wrong by Newton's law of gravitation",
      ],
      check(value) {
        const correct = value === 'They all follow mathematically from one underlying cause: gravity obeying an inverse-square law';
        return {
          correct,
          message:
            "Newton showed Kepler's three empirically-discovered laws (ellipses, equal areas, T²∝r³) all fall out of one cause: gravity pulling with a force that weakens with the square of distance. Kepler found the patterns first, from Brahe's data, without knowing why they held; Newton explained why — and showed the same explanation works for any two masses anywhere, not just the Sun and its planets.",
        };
      },
    },
  ];
}

const orbitsGravityQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = orbitsGravityQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.OrbitsGravityQuestions = orbitsGravityQuestionsApi;
}
