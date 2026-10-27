/**
 * Practice questions for notes/archaeoastronomy.html: why the Moon's
 * phase cycle gives a natural "month" that doesn't divide evenly into
 * a solar year (u3.5, part of the "time and calendar systems" use the
 * page's own ancient-uses grid covers), why the Sun, not the Moon, is
 * what actually tracks the seasons (same unit), and using the rate of
 * axial precession (3.7, u2.29) — the quarter/half cycle, the
 * years-per-degree drift, why Polaris isn't permanent, and the page's
 * own Great Pyramid example.
 *
 * The synodic month figure comes live from src/moonPhase.js
 * (SYNODIC_MONTH_DAYS), the same constant notes/moon-structure.html and
 * sims/sidereal-vs-synodic.html already use, so this question can never
 * quote a figure the rest of the site would disagree with. The solar
 * year length and the precession figures (the ~26,000-year cycle, the
 * ~50 arcsecond/year drift) aren't modelled anywhere in the codebase as
 * live constants — this page's own precession diagram is driven by real
 * star positions, not a single rate figure — so they're stated plainly
 * in each prompt, as any other given constant is.
 */
function makeQuestions(MoonPhaseModule) {
  const synodicMonthDays = MoonPhaseModule.SYNODIC_MONTH_DAYS;
  const synodicMonthRounded = synodicMonthDays.toFixed(1);
  const solarYearDays = 365.25;
  const monthsPerYear = solarYearDays / synodicMonthDays;

  return [
    {
      id: 'lunar-month-not-whole-number-of-year',
      units: ['u3.5'],
      type: 'choice',
      prompt:
        `The Moon repeats the same phase (a synodic month) every about ${synodicMonthRounded} days; a solar year is about ${solarYearDays} days. Divide one by the other: about how many lunar months fit in a year, and what did that mean for a calendar built purely from counting Moons?`,
      options: [
        `About ${monthsPerYear.toFixed(2)} lunar months fit in a year — not a whole number, so a calendar of whole lunar months either falls short of or overshoots a full year, every single year, and drifts against the seasons unless corrected`,
        'Exactly 12 lunar months fit in a year, so a calendar built purely from counting Moons always agrees with the seasons',
        'About 13.5 lunar months fit in a year, so a calendar of thirteen and a half lunar months matches the seasons exactly, with nothing left over',
        "The Moon's phase cycle and the length of the year are unrelated, so the question doesn't really make sense",
      ],
      check(value) {
        const correct = value.startsWith(`About ${monthsPerYear.toFixed(2)} lunar months`);
        return {
          correct,
          message:
            `${solarYearDays} ÷ ${synodicMonthRounded} ≈ ${monthsPerYear.toFixed(2)} lunar months per year — not a whole number. A calendar of 12 lunar months runs about ${(12 * synodicMonthDays).toFixed(0)} days, roughly ${(solarYearDays - 12 * synodicMonthDays).toFixed(0)} days short of a solar year, so it drifts earlier against the seasons every year unless an extra ("intercalary") month is added from time to time — see the Time and calendar systems card above for how the Babylonians and Greeks eventually fixed this with the Metonic cycle.`,
        };
      },
    },
    {
      id: 'sun-not-moon-for-seasons',
      units: ['u3.5'],
      type: 'choice',
      prompt:
        "A farmer needs to know when to plant in spring and harvest in autumn. Why does the Sun's position in the sky, not the Moon's phase, actually track the seasons?",
      options: [
        "The seasons are caused by Earth's axial tilt as it orbits the Sun over a year, so only something tied to that yearly cycle — the Sun's changing position against the stars — lines up with the seasons; the Moon's phase cycle is a separate clock, set by the Moon's own orbit around Earth, with no link to Earth's tilt or its orbit around the Sun",
        "The Moon's phases are themselves caused by the seasons, so a full Moon always falls at the same time of year",
        'The Sun and the Moon both repeat their cycle in almost exactly the same number of days, so either one works equally well for tracking the seasons',
        "Farmers used the Moon because it's visible for longer each day than the Sun is",
      ],
      check(value) {
        const correct = value.startsWith("The seasons are caused by Earth's axial tilt");
        return {
          correct,
          message:
            "The seasons come from Earth's axial tilt combined with its one-year orbit around the Sun — that's what makes the Sun's midday height and its rising/setting point drift through the year, always in step with the seasons. The Moon's ~29.5-day phase cycle is driven by something else entirely (the Moon orbiting Earth) and carries no information about where Earth is on its own orbit, so a full Moon can fall in any season, in any year. A calendar that needs to stay lined up with planting and harvest has to be anchored to the Sun's year, not the Moon's month — exactly the drift problem the previous question's intercalary months were invented to fix.",
        };
      },
    },
    {
      id: 'precession-quarter-and-half-cycle',
      units: ['u2.29'],
      fields: [
        { key: 'quarterYears', type: 'number', label: 'Time to move a quarter of the way round (years)', unitLabel: 'years' },
        { key: 'halfYears', type: 'number', label: 'Time to move halfway round (years)', unitLabel: 'years' },
      ],
      prompt:
        "Earth's axis completes one full precession cycle in about 26,000 years. How long does it take to move a quarter of the way round, and how long to move halfway round (the point at which Vega becomes the pole star)?",
      check(value) {
        const quarterCorrect = Math.abs(value.quarterYears - 6500) <= 0.02 * 6500;
        const halfCorrect = Math.abs(value.halfYears - 13000) <= 0.02 * 13000;
        return {
          correct: quarterCorrect && halfCorrect,
          message:
            '26,000 ÷ 4 = 6,500 years for a quarter of the cycle; 26,000 ÷ 2 = 13,000 years for half of it — the point in the cycle farthest from today\'s alignment, when Vega (rather than Thuban or Polaris) sits nearest the celestial pole.',
        };
      },
    },
    {
      id: 'precession-years-per-degree',
      units: ['u2.29'],
      type: 'number',
      unitLabel: 'years',
      prompt: 'Precession moves the celestial pole (and the equinoxes) by about 50 arcseconds per year. About how many years does it take to move 1 degree (= 3,600 arcseconds)?',
      check(value) {
        const expected = 3600 / 50;
        const correct = Math.abs(value - expected) <= 0.02 * expected;
        return {
          correct,
          message: `1° = 3,600 arcseconds. 3,600 ÷ 50 = 72 years per degree — the same figure this page's companion, Measuring the Sky, gives for how fast the equinoxes drift along the ecliptic.`,
        };
      },
    },
    {
      id: 'why-polaris-not-forever',
      units: ['u2.29'],
      type: 'choice',
      prompt: "Why won't Polaris always be the pole star?",
      options: [
        "Because precession slowly swings the direction Earth's rotation axis points among the stars, so a different bright star happens to lie near the celestial pole in different eras — Polaris itself isn't moving away, the axis is pointing somewhere else",
        'Because Polaris is slowly moving away from Earth, out of the Solar System',
        'Because Polaris is a dying star that will soon burn out and stop shining',
        "Because Earth's axial tilt is slowly increasing, carrying the pole away from Polaris",
      ],
      check(value) {
        const correct = value.startsWith('Because precession slowly swings');
        return {
          correct,
          message:
            "Precession doesn't move Polaris, and it doesn't change Earth's 23.4° tilt — it changes the direction Earth's rotation axis points in space, tracing a ~26,000-year circle among the stars. Whichever bright star happens to lie near wherever the axis currently points gets to be \"the pole star\" for a few centuries, until the axis swings on: Thuban around 2800 BCE, Polaris now, Vega around AD 14,000.",
        };
      },
    },
    {
      id: 'great-pyramid-thuban-alignment',
      units: ['u2.29', 'u3.5'],
      type: 'choice',
      prompt:
        "This page's Great Pyramid diagram shows the shafts once pointing at Thuban, not Polaris. Why would the ancient Egyptians who built it have aligned to Thuban instead?",
      options: [
        'Because at the time the pyramid was built, precession meant Thuban — not Polaris — was the star then sitting nearest the celestial pole, so Thuban was the useful marker of true north for them',
        'Because the Egyptians considered Thuban a more important god than any star near the pole',
        'Because Polaris did not exist yet when the pyramid was built',
        "Because Thuban is brighter than Polaris, so it was easier to see with the naked eye"
      ],
      check(value) {
        const correct = value.startsWith('Because at the time the pyramid was built');
        return {
          correct,
          message:
            "Precession had the celestial pole sitting right next to Thuban around 2800 BCE, close to when the pyramids were built — Polaris was tens of degrees away from the pole at that time, no use at all for finding true north. The builders aligned to whichever star was actually nearest the pole in their own era, exactly as anyone would today use Polaris.",
        };
      },
    },
  ];
}

const archaeoastronomyQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = archaeoastronomyQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.ArchaeoastronomyQuestions = archaeoastronomyQuestionsApi;
}
