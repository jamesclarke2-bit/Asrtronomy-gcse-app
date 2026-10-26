/**
 * Practice questions for notes/tides.html: why the Moon raises bigger
 * tides than the Sun despite pulling on Earth far less strongly (u2.7) —
 * gravity's pull falls with the square of distance, but the *difference*
 * in pull across Earth (the tidal stretch that actually raises tides)
 * falls one power of distance faster, with the cube.
 *
 * Every figure comes live from src/tides.js (sunToMoonPullRatio(),
 * sunToMoonTideRatio()), the same engine notes/tides.js itself reads for
 * its "Pull: ... (Sun) against 1 (Moon)" / "Stretch across Earth: ..."
 * diagram captions, so a question can never quote a number the page
 * itself would disagree with. Tolerances are at least 2% of the expected
 * value.
 */
function makeQuestions(Tides) {
  function tolerance(expected, minAbsolute) {
    return Math.max(Math.abs(expected) * 0.02, minAbsolute);
  }

  const pullRatio = Tides.sunToMoonPullRatio();
  const tideRatio = Tides.sunToMoonTideRatio();
  const pullRatioRounded = Math.round(pullRatio / 10) * 10;

  return [
    {
      id: 'pull-vs-stretch-falloff',
      units: ['u2.7'],
      type: 'choice',
      prompt:
        `The Sun pulls on Earth about ${pullRatioRounded} times harder than the Moon does, yet the Moon raises the bigger tides. Gravity's pull falls with the square of distance (pull ∝ 1/d²). What does the tidal stretch — the difference in pull from one side of Earth to the other — fall with, and why does that let the closer Moon win?`,
      options: [
        'The cube of distance (stretch ∝ 1/d³): the stretch depends on how fast the pull itself is changing across Earth, which falls off one power of distance faster than the pull itself',
        'The square of distance, the same as the pull itself, so distance makes no difference to which body wins',
        'The fourth power of distance (stretch ∝ 1/d⁴): the stretch is far more sensitive to distance than even the cube',
        "Distance doesn't affect the stretch at all, only the pull itself",
      ],
      check(value) {
        const correct =
          value ===
          'The cube of distance (stretch ∝ 1/d³): the stretch depends on how fast the pull itself is changing across Earth, which falls off one power of distance faster than the pull itself';
        return {
          correct,
          message:
            "Pull itself falls as 1/d². The stretch is the difference in that pull between the near and far side of Earth — essentially how fast the pull is changing with distance — which brings in one more factor of 1/d, giving 1/d³. Because the Moon is so much closer than the Sun, that extra power of distance matters more than the Sun's far greater mass: the Moon's distance advantage, cubed, outweighs the Sun's mass advantage, so the Moon's tidal stretch wins even though its pull is far weaker.",
        };
      },
    },
    {
      id: 'sun-moon-pull-ratio-calculation',
      units: ['u2.7'],
      type: 'number',
      unitLabel: '× the Moon’s',
      prompt:
        'The Sun has a mass of 1.989×10³⁰ kg and is about 149,600,000 km from Earth; the Moon has a mass of 7.342×10²² kg and is about 384,400 km from Earth. Gravitational pull is proportional to mass / distance². Calculate how many times stronger the Sun’s overall pull on Earth is than the Moon’s (pull ratio = (Sun mass ÷ Moon mass) × (Moon distance ÷ Sun distance)²).',
      check(value) {
        const correct = Math.abs(value - pullRatio) <= tolerance(pullRatio, 4);
        return {
          correct,
          message: `pull ratio = (1.989×10³⁰ ÷ 7.342×10²²) × (384,400 ÷ 149,600,000)² ≈ ${pullRatio.toFixed(0)} — about ${pullRatioRounded} times.`,
        };
      },
    },
    {
      id: 'sun-moon-stretch-ratio-calculation',
      units: ['u2.7'],
      type: 'number',
      unitLabel: '× the Moon’s',
      prompt:
        'The Sun has a mass of 1.989×10³⁰ kg and is about 149,600,000 km from Earth; the Moon has a mass of 7.342×10²² kg and is about 384,400 km from Earth. Tidal stretch (the difference in pull across Earth) is proportional to mass / distance³. Calculate the Sun’s tidal effect as a fraction of the Moon’s (stretch ratio = (Sun mass ÷ Moon mass) × (Moon distance ÷ Sun distance)³).',
      check(value) {
        const correct = Math.abs(value - tideRatio) <= tolerance(tideRatio, 0.02);
        return {
          correct,
          message: `stretch ratio = (1.989×10³⁰ ÷ 7.342×10²²) × (384,400 ÷ 149,600,000)³ ≈ ${tideRatio.toFixed(2)} — under half the Moon's, even though the Sun's pull is far bigger.`,
        };
      },
    },
  ];
}

const tidesQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = tidesQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.TidesQuestions = tidesQuestionsApi;
}
