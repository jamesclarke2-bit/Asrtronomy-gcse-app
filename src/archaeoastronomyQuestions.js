/**
 * Practice questions for notes/archaeoastronomy.html: why the Moon's
 * phase cycle gives a natural "month" that doesn't divide evenly into
 * a solar year (u3.5, part of the "time and calendar systems" use the
 * page's own ancient-uses grid covers), and why the Sun, not the Moon,
 * is what actually tracks the seasons (same unit).
 *
 * The synodic month figure comes live from src/moonPhase.js
 * (SYNODIC_MONTH_DAYS), the same constant notes/moon-structure.html and
 * sims/sidereal-vs-synodic.html already use, so this question can never
 * quote a figure the rest of the site would disagree with. The solar
 * year length isn't modelled anywhere else in the codebase, so it's
 * stated plainly in the prompt, as any other given constant is.
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
  ];
}

const archaeoastronomyQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = archaeoastronomyQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.ArchaeoastronomyQuestions = archaeoastronomyQuestionsApi;
}
