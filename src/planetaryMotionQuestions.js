/**
 * Practice questions for sims/solar-system-observation.html: retrograde
 * motion, planetary alignments, and what elongation actually decides
 * about when and whether a planet can be seen.
 *
 * Every figure here is computed live from PlanetaryMotion, the same
 * engine the page's own diagrams use, so a question can never quote a
 * number the page itself would disagree with.
 */

function makeQuestions(PlanetaryMotion) {
  const { earth, mars, venus, mercury } = PlanetaryMotion.PLANETS;
  const synodic = (tInner, tOuter) => 1 / Math.abs(1 / tInner - 1 / tOuter);
  const marsSynodicDays = synodic(earth.orbitalPeriodDays, mars.orbitalPeriodDays);
  const venusGreatestElongation = PlanetaryMotion.greatestElongationDeg('venus');
  const mercuryGreatestElongation = PlanetaryMotion.greatestElongationDeg('mercury');

  return [
    {
      id: 'retrograde-cause',
      units: ['u1.15'],
      type: 'choice',
      prompt: "What actually causes a planet's apparent retrograde 'loop' against the background stars?",
      options: [
        'The planet briefly reversing its real direction of travel around the Sun',
        'Earth and the planet changing places relative to each other, as the faster inner orbit overtakes (or is overtaken by) the slower outer one',
        "The planet's orbit being tilted steeply relative to Earth's",
        'The Moon passing in front of the planet',
      ],
      check(value) {
        const correct =
          value === 'Earth and the planet changing places relative to each other, as the faster inner orbit overtakes (or is overtaken by) the slower outer one';
        return {
          correct,
          message:
            "No planet ever actually reverses course. For an outer planet like Mars, Earth — moving faster on a smaller, inner orbit — overtakes it around opposition. For an inner planet like Venus or Mercury, it's the other way round: the faster inner planet overtakes Earth, around its own inferior conjunction. Either way, that relative motion is what makes the planet briefly appear to drift backwards against the stars.",
        };
      },
    },
    {
      id: 'retrograde-timing',
      units: ['u1.15'],
      type: 'choice',
      prompt: "Around which alignment does a superior planet's (e.g. Mars's) retrograde motion happen?",
      options: ['Conjunction', 'Opposition', 'Greatest elongation'],
      check(value) {
        const correct = value === 'Opposition';
        return {
          correct,
          message:
            'For a superior planet, retrograde motion happens around opposition — the point where Earth, on the inside track, passes closest to it and overtakes it fastest. (For an inferior planet like Venus or Mercury, the equivalent point is inferior conjunction instead, where it passes closest to Earth.)',
        };
      },
    },
    {
      id: 'synodic-period',
      units: ['u1.15'],
      type: 'number',
      unitLabel: 'days',
      prompt: `Using Earth's and Mars's orbital periods (about 365 and 687 days), roughly how many days pass between one Mars opposition and the next — Mars's synodic period? Round to the nearest 10 days.`,
      check(value) {
        const correct = Math.abs(value - marsSynodicDays) <= 20;
        return {
          correct,
          message: `1/synodic period = 1/T(Earth) − 1/T(Mars), giving about ${Math.round(marsSynodicDays)} days (roughly 26 months) — much longer than either planet's own orbital period, since it depends on how fast Earth catches up.`,
        };
      },
    },
    {
      id: 'which-planets-can-oppose',
      units: ['u1.15'],
      type: 'choice',
      prompt: 'Which planets can ever be at opposition (elongation 180°)?',
      options: [
        'Any planet — Mercury, Venus, Mars and beyond',
        'Only the superior planets — Mars and anything farther from the Sun than Earth',
        'Only the inferior planets — Mercury and Venus',
        'No real planet ever reaches exactly 180°',
      ],
      check(value) {
        const correct = value === 'Only the superior planets — Mars and anything farther from the Sun than Earth';
        return {
          correct,
          message:
            "Only a superior planet — one whose orbit is bigger than Earth's — can reach opposition. Picture the three bodies in a line with Earth in the middle: that's only geometrically possible if the third body's orbit lies outside Earth's. An inferior planet's whole orbit sits inside Earth's own, so Earth can never get between it and the Sun — the planet is always on the same general side of the sky as the Sun, never opposite it.",
        };
      },
    },
    {
      id: 'venus-never-midnight',
      units: ['u1.15'],
      type: 'choice',
      prompt: 'Why can Venus never be seen high in the sky at midnight, the way Mars can at opposition?',
      options: [
        "Venus is too faint to see at midnight, even though it's in the sky then",
        `Venus's elongation from the Sun can never exceed about ${venusGreatestElongation.toFixed(0)}° (its greatest elongation), so it always sets within a few hours of the Sun and is never above the horizon at midnight`,
        "Venus's orbit is tilted too steeply relative to Earth's for it to ever be visible at night",
        'Venus only orbits during the day',
      ],
      check(value) {
        const correct = value.startsWith("Venus's elongation from the Sun can never exceed about");
        return {
          correct,
          message: `Venus is an inferior planet, so its elongation is capped at arcsin(a) ≈ ${venusGreatestElongation.toFixed(1)}° — it can never swing more than about ${Math.round(venusGreatestElongation)}° from the Sun's own position in the sky. Since the Sun itself is below the horizon at midnight, and Venus is always within ${Math.round(venusGreatestElongation)}° of it, Venus is always below the horizon too at that hour. It's only ever visible for a window after sunset (an "evening star") or before sunrise (a "morning star") — never at midnight, however bright it gets.`,
        };
      },
    },
    {
      id: 'greatest-elongation-meaning',
      units: ['u1.15'],
      type: 'choice',
      prompt: "What does a planet's 'greatest elongation' mean?",
      options: [
        'The date it is closest to Earth',
        'The widest angle from the Sun that planet can ever reach in Earth\'s sky — only meaningful for an inferior planet, since a superior planet can reach any angle up to 180°',
        'The brightest a planet ever appears',
        'The point where the planet is exactly behind the Sun',
      ],
      check(value) {
        const correct = value.startsWith('The widest angle from the Sun');
        return {
          correct,
          message: `Greatest elongation is the maximum angle, as seen from Earth, between the Sun and an inferior planet — reached when the Earth-planet sightline is tangent to the planet's own orbit (a right angle at the planet). That geometry gives greatest elongation = arcsin(a): about ${mercuryGreatestElongation.toFixed(1)}° for Mercury (a = ${mercury.orbitalRadiusAU} AU) and about ${venusGreatestElongation.toFixed(1)}° for Venus (a = ${venus.orbitalRadiusAU} AU). A superior planet has no such limit — it can reach any elongation up to a full 180° at opposition — so the term only applies to an inferior planet.`,
        };
      },
    },
    {
      id: 'mars-brightest-at-opposition',
      units: ['u1.15'],
      type: 'choice',
      prompt: 'Why does Mars look brightest around opposition?',
      options: [
        "Mars's own surface changes colour and reflectivity at that time",
        "Mars is at its closest to Earth then (distance = Mars's orbital radius minus Earth's), and its sunlit, fully-illuminated face is pointed straight at Earth",
        'The Sun is temporarily closer to Mars at opposition, so Mars receives more sunlight',
        "It's an illusion — Mars's true brightness never actually changes"
      ],
      check(value) {
        const correct = value.startsWith('Mars is at its closest to Earth then');
        return {
          correct,
          message:
            "Two things stack together at opposition. First, distance: Earth sits directly between Mars and the Sun, so Mars is as close to Earth as its orbit ever brings it — distance = (Mars's orbital radius) − (Earth's), the smallest gap in the whole cycle. Second, phase: with Earth between Mars and the Sun, the whole sunlit hemisphere of Mars faces Earth, the same way a full Moon is fully lit as seen from Earth. Closest together and fully lit at the same time is exactly why opposition is when Mars outshines the rest of the year.",
        };
      },
    },
  ];
}

const planetaryMotionQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = planetaryMotionQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.PlanetaryMotionQuestions = planetaryMotionQuestionsApi;
}
