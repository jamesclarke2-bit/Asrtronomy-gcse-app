/**
 * Practice questions for notes/parallax.html: the core d = 1/p formula
 * in both directions, pc-to-ly conversion, comparing two stars' own
 * parallaxes, why the two observations are six months apart, why the
 * method runs out for distant stars, an "explain" question on the
 * geometry itself, and converting between degrees and arcseconds.
 *
 * Every numeric check is computed from src/parallax.js at question-
 * build time, never a second, hand-typed figure that could drift out
 * of step with the page's own engine.
 */
function makeQuestions(ParallaxModule) {
  return [
    {
      id: 'distance-from-parallax',
      units: ['u4.5'],
      type: 'number',
      unitLabel: 'pc',
      prompt: 'A star has a measured parallax of 0.25 arcsec. What is its distance, in parsecs?',
      check(value) {
        const expected = ParallaxModule.distanceFromParallax(0.25);
        const correct = Math.abs(value - expected) <= 0.02 * expected;
        return {
          correct,
          message: `d (pc) = 1 ÷ p (arcsec) = 1 ÷ 0.25 = ${expected.toFixed(1)} pc.`,
        };
      },
    },
    {
      id: 'parallax-from-distance',
      units: ['u4.5'],
      type: 'number',
      unitLabel: 'arcsec',
      prompt: 'A star is 20 pc away. What parallax angle would it show, in arcseconds?',
      check(value) {
        const expected = ParallaxModule.parallaxFromDistance(20);
        const correct = Math.abs(value - expected) <= 0.02 * expected;
        return {
          correct,
          message: `p (arcsec) = 1 ÷ d (pc) = 1 ÷ 20 = ${expected.toFixed(3)} arcsec.`,
        };
      },
    },
    {
      id: 'parsecs-to-light-years',
      units: ['u4.5', 'u3.4'],
      type: 'number',
      unitLabel: 'ly',
      prompt: `A star is 5 pc away. Using 1 pc ≈ ${ParallaxModule.PARSEC_LIGHT_YEARS.toFixed(2)} ly, what is that distance in light years?`,
      check(value) {
        const expected = ParallaxModule.parsecToLightYears(5);
        const correct = Math.abs(value - expected) <= 0.02 * expected;
        return {
          correct,
          message: `5 × ${ParallaxModule.PARSEC_LIGHT_YEARS.toFixed(2)} = ${expected.toFixed(1)} ly.`,
        };
      },
    },
    {
      id: 'comparing-two-stars',
      units: ['u4.5'],
      type: 'choice',
      prompt: "Star A has a measured parallax of 0.2 arcsec. Star B has a measured parallax of 0.05 arcsec. Which star is closer to Earth?",
      options: ['Star A', 'Star B', 'They are the same distance', 'Cannot be determined from parallax alone'],
      check(value) {
        const correct = value === 'Star A';
        return {
          correct,
          message: `Star A: d = 1 ÷ 0.2 = 5 pc. Star B: d = 1 ÷ 0.05 = 20 pc. A bigger parallax angle always means a smaller distance — Star A is closer.`,
        };
      },
    },
    {
      id: 'why-six-months-apart',
      units: ['u4.5'],
      type: 'choice',
      prompt: "Why are the two observations used to measure a star's parallax made six months apart, rather than a day or a week apart?",
      options: [
        "Because that's when Earth is at opposite ends of its orbit, giving the longest possible baseline (2 AU) and so the largest, most measurable shift",
        'Because the star is only visible in the night sky every six months',
        "Because Earth's rotation needs six months to bring the telescope back to the same position",
        'Because six months is how long it takes light from the star to reach Earth',
      ],
      check(value) {
        const correct = value.startsWith("Because that's when Earth is at opposite ends");
        return {
          correct,
          message:
            "The parallax shift is tiny, so it needs the biggest possible baseline to be measurable at all. Earth's orbit gives its largest baseline, 2 AU, between two positions exactly six months apart — any shorter gap gives a smaller, harder-to-measure shift.",
        };
      },
    },
    {
      id: 'why-only-nearby-stars',
      units: ['u4.5'],
      type: 'choice',
      prompt: 'Why does the parallax method only work for measuring the distance to relatively nearby stars?',
      options: [
        'Because at larger distances the parallax angle becomes too small to measure accurately, even with the best telescopes and satellites',
        'Because distant starlight is too dim for a telescope to detect at all',
        "Because distant stars don't move between the two observations",
        'Because the formula d = 1/p only applies to stars less than 1 light year away',
      ],
      check(value) {
        const correct = value.startsWith('Because at larger distances the parallax angle');
        return {
          correct,
          message:
            'd = 1/p means a star twice as far away shows a parallax angle half as large. Past a few hundred parsecs (even for space telescopes like Gaia), the angle shrinks below what any instrument can actually resolve, so the method simply runs out — which is why the next page switches to measuring brightness instead.',
        };
      },
    },
    {
      id: 'explain-the-geometry',
      units: ['u4.5'],
      type: 'choice',
      prompt:
        "Explain why measuring a star's parallax lets astronomers calculate its distance using simple geometry, without needing to travel to the star or know its brightness.",
      options: [
        'Because the baseline (1 AU, the Sun-Earth distance) is already known, and measuring the parallax angle gives the one other piece a long, thin right-angled triangle needs to find its own length — the distance to the star',
        "Because a star's parallax angle directly reveals its true physical size",
        "Because the star's own light carries information about how far it has travelled",
        'Because every star has the same, known distance once its spectrum is measured',
      ],
      check(value) {
        const correct = value.startsWith('Because the baseline (1 AU');
        return {
          correct,
          message:
            "Parallax turns distance into a triangulation problem: the Sun-Earth distance (1 AU) is already known, and the parallax angle is the one other measurement a long, thin triangle needs to be solved completely. No trip to the star, and no assumption about how bright it 'really' is, is needed at all — just geometry.",
        };
      },
    },
    {
      id: 'degrees-to-arcseconds',
      units: ['u4.5'],
      type: 'number',
      unitLabel: 'arcsec',
      prompt: `An angle measures 0.05 degrees. Using 1 degree = ${ParallaxModule.ARCSECONDS_PER_DEGREE} arcseconds, how many arcseconds is that?`,
      check(value) {
        const expected = 0.05 * ParallaxModule.ARCSECONDS_PER_DEGREE;
        const correct = Math.abs(value - expected) <= 0.02 * expected;
        return {
          correct,
          message: `0.05 × ${ParallaxModule.ARCSECONDS_PER_DEGREE} = ${expected} arcsec.`,
        };
      },
    },
  ];
}

const parallaxQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = parallaxQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.ParallaxQuestions = parallaxQuestionsApi;
}
