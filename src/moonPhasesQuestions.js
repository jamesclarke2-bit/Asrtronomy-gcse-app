/**
 * Practice questions for sims/moon-phases.html's "Phase detective"
 * section, covering the rest of exam question June 2025 Paper 1 Q4: (b)
 * why there isn't a solar eclipse every month, (c)(i) why a lunar
 * calendar starts a month at the first crescent, and (c)(ii) why that
 * date can't be fixed by calendar months.
 *
 * The 12-lunar-months-per-year figure in (c)(ii) comes live from
 * MoonPhase.SYNODIC_MONTH_DAYS, the same constant the rest of the site
 * already uses, rather than a second, hand-typed "~354 days".
 */
function makeQuestions(MoonPhaseModule) {
  const synodicMonthDays = MoonPhaseModule.SYNODIC_MONTH_DAYS;
  const lunarYearDays = 12 * synodicMonthDays;
  const solarYearDays = 365.25;
  const shortfallDays = solarYearDays - lunarYearDays;

  return [
    {
      id: 'why-not-eclipse-every-month',
      units: ['u2.19'],
      type: 'choice',
      prompt:
        "There's a New Moon (the Moon passing between Earth and the Sun) roughly every 29.5 days. Why isn't there a solar eclipse every single month?",
      options: [
        "Because the Moon's orbit is tilted about 5 degrees to the plane of Earth's own orbit (the ecliptic), crossing it at only two points (the nodes) — a solar eclipse needs that month's New Moon to fall close to a node, which only happens for a few New Moons a year",
        'Because the Moon only passes between Earth and the Sun some months, not every month',
        "Because Earth's shadow usually misses the Moon at New Moon",
        'Because the Moon is sometimes too small, from Earth, to block the Sun',
      ],
      check(value) {
        const correct = value.startsWith("Because the Moon's orbit is tilted about 5 degrees");
        return {
          correct,
          message:
            "Every New Moon does put the Moon roughly between Earth and the Sun — that's what New Moon means. What usually stops an eclipse is height, not timing: the Moon's orbit is tilted about 5.1° to the ecliptic, so most months it passes a little above or below the Sun's disc as seen from Earth, rather than exactly in front of it. Only when New Moon happens close to one of the two points where the orbits cross (the nodes) does the Moon line up closely enough — see Eclipses' own 'Why there isn't an eclipse every month' section.",
        };
      },
    },
    {
      id: 'why-calendar-starts-at-first-crescent',
      units: ['u3.5'],
      type: 'choice',
      prompt:
        'Many lunar calendars start a new month at the first visible crescent, not at New Moon itself (which can\'t be seen) or at Full Moon (which can). Why does the first crescent pin down the date more precisely than Full Moon does?',
      options: [
        'The Moon looks close to full for several days in a row — night to night, the shape barely changes — but the first visible crescent is a brief, sharp event, visible for only a day or two after New Moon, so its date is far more precise',
        'Because a crescent Moon is brighter than a full Moon, so it is easier to time exactly',
        "Because the Moon's distance from Earth is easiest to measure at crescent phase",
        'Because Full Moon never falls on the same date twice, so it cannot be used as a calendar marker at all',
      ],
      check(value) {
        const correct = value.startsWith('The Moon looks close to full for several days');
        return {
          correct,
          message:
            "Around Full Moon the illuminated shape changes very little from one night to the next, so it's hard to say which exact night was 'the' Full Moon just by looking. The first crescent, by contrast, is a short-lived, unmistakable event — invisible one evening, then a thin sliver low in the twilight sky a day or two later — giving a single, well-defined night to start counting from.",
        };
      },
    },
    {
      id: 'why-lunar-calendar-drifts',
      units: ['u3.5'],
      fields: [
        { key: 'lunarYearDays', type: 'number', label: '12 lunar months (days)', unitLabel: 'days' },
        { key: 'shortfallDays', type: 'number', label: 'Short of a 365.25-day year by (days)', unitLabel: 'days' },
      ],
      prompt:
        `A lunar month (New Moon to New Moon) is about ${synodicMonthDays.toFixed(2)} days. If a calendar counts 12 of these as one year, about how many days does that year last — and by how many days does it fall short of a 365.25-day calendar year?`,
      check(value) {
        const yearCorrect = Math.abs(value.lunarYearDays - lunarYearDays) <= 0.02 * lunarYearDays;
        const shortfallCorrect = Math.abs(value.shortfallDays - shortfallDays) <= 0.02 * shortfallDays;
        return {
          correct: yearCorrect && shortfallCorrect,
          message:
            `12 × ${synodicMonthDays.toFixed(2)} ≈ ${lunarYearDays.toFixed(1)} days — about ${shortfallDays.toFixed(1)} days short of 365.25. A lunar month isn't the same length as a calendar month, and 12 of them aren't a whole number of days in a calendar year, so a purely lunar calendar's dates drift earlier against the seasons every year unless corrected (see the Time and calendar systems card on Archaeoastronomy for how some cultures fixed this).`,
        };
      },
    },
  ];
}

const moonPhasesQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = moonPhasesQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.MoonPhasesQuestions = moonPhasesQuestionsApi;
}
