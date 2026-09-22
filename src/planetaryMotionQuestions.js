/**
 * Practice questions for sims/solar-system-observation.html: retrograde
 * motion, and identifying conjunction/opposition/elongation from a
 * given date.
 *
 * The date-specific questions don't hardcode a calendar date and hope
 * it lands near an alignment — Mars's ~780-day synodic period doesn't
 * repeat on a calendar year, so at module-load time this scans
 * PlanetaryMotion.elongationDeg across a fixed date range (mirroring
 * how sims/solar-system-observation.js's own precomputeCurve works) to
 * find real opposition/conjunction dates, then every check() re-derives
 * the answer from PlanetaryMotion at call time from that same date —
 * same dependency-injection pattern as src/sunDeclinationQuestions.js.
 */

function makeQuestions(PlanetaryMotion) {
  const SEARCH_START = Date.UTC(2026, 0, 1);

  function dateForDay(day) {
    return new Date(SEARCH_START + day * 86400000);
  }

  function scanExtreme(wantMax, fromDay, toDay) {
    let best = null;
    for (let d = fromDay; d <= toDay; d++) {
      const e = PlanetaryMotion.elongationDeg('mars', dateForDay(d));
      if (!best || (wantMax ? e > best.elongationDeg : e < best.elongationDeg)) {
        best = { day: d, elongationDeg: e };
      }
    }
    return best;
  }

  // A 1500-day window (nearly two ~780-day synodic periods), kept away
  // from its own edges by a 30-day buffer so the scan can't mistake a
  // clipped edge for the real extremum.
  const oppositionRef = scanExtreme(true, 30, 1530);
  const conjunctionRef = scanExtreme(false, 30, 1530);
  const elongationRef = { day: Math.round((oppositionRef.day + conjunctionRef.day) / 2) };

  function formatDate(day) {
    return dateForDay(day).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }

  function classificationLabel(type) {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  return [
    {
      id: 'retrograde-cause',
      units: ['u1.15'],
      type: 'choice',
      prompt: "What actually causes Mars's apparent retrograde 'loop' against the background stars?",
      options: [
        'Mars briefly reversing its real direction of travel around the Sun',
        'Earth, on a faster inner orbit, overtaking Mars around opposition',
        "Mars's orbit being tilted steeply relative to Earth's",
        'The Moon passing in front of Mars',
      ],
      check(value) {
        const correct = value === 'Earth, on a faster inner orbit, overtaking Mars around opposition';
        return {
          correct,
          message:
            "Mars never actually reverses course. Earth, moving faster on a smaller, inner orbit, overtakes it around opposition, and that relative motion makes Mars briefly appear to drift backwards against the stars.",
        };
      },
    },
    {
      id: 'retrograde-timing',
      units: ['u1.15'],
      type: 'choice',
      prompt: "Around which of Mars's alignments does retrograde motion happen?",
      options: ['Conjunction', 'Opposition', 'Elongation'],
      check(value) {
        const correct = value === 'Opposition';
        return {
          correct,
          message:
            'Retrograde motion happens around opposition — the point where Earth, on the inside track, passes closest to Mars and overtakes it fastest.',
        };
      },
    },
    {
      id: 'synodic-period',
      units: ['u1.15'],
      type: 'number',
      unitLabel: 'days',
      prompt:
        "Using Earth's and Mars's orbital periods (about 365 and 687 days), roughly how many days pass between one Mars opposition and the next — Mars's synodic period? Round to the nearest 10 days.",
      check(value) {
        const { earth, mars } = PlanetaryMotion.PLANETS;
        const synodic = 1 / (1 / earth.orbitalPeriodDays - 1 / mars.orbitalPeriodDays);
        const correct = Math.abs(value - synodic) <= 20;
        return {
          correct,
          message: `1/synodic period = 1/T(Earth) − 1/T(Mars), giving about ${Math.round(synodic)} days (roughly 26 months) — much longer than either planet's own orbital period, since it depends on how fast Earth catches up.`,
        };
      },
    },
    {
      id: 'classify-opposition-date',
      units: ['u1.15'],
      type: 'choice',
      prompt: `On ${formatDate(oppositionRef.day)}, Mars's elongation from the Sun reaches about ${Math.round(oppositionRef.elongationDeg)}°, its highest point in this cycle. What alignment is this?`,
      options: ['Conjunction', 'Opposition', 'Elongation'],
      check(value) {
        const classification = PlanetaryMotion.classifyAlignment('mars', dateForDay(oppositionRef.day));
        const correct = value === classificationLabel(classification.type);
        return {
          correct,
          message: `Elongation this close to 180° (${classification.elongationDeg.toFixed(0)}°) is opposition — Mars is opposite the Sun in Earth's sky: at its closest, brightest, and up all night.`,
        };
      },
    },
    {
      id: 'classify-conjunction-date',
      units: ['u1.15'],
      type: 'choice',
      prompt: `On ${formatDate(conjunctionRef.day)}, Mars's elongation from the Sun drops to about ${Math.round(conjunctionRef.elongationDeg)}°, its lowest point in this cycle. What alignment is this?`,
      options: ['Conjunction', 'Opposition', 'Elongation'],
      check(value) {
        const classification = PlanetaryMotion.classifyAlignment('mars', dateForDay(conjunctionRef.day));
        const correct = value === classificationLabel(classification.type);
        return {
          correct,
          message: `Elongation this close to 0° (${classification.elongationDeg.toFixed(0)}°) is conjunction — Mars is in nearly the same direction as the Sun, lost in its glare.`,
        };
      },
    },
    {
      id: 'classify-elongation-date',
      units: ['u1.15'],
      type: 'number',
      unitLabel: '°',
      prompt: `${formatDate(elongationRef.day)} falls roughly midway between the conjunction and opposition dates above. What is Mars's approximate elongation from the Sun on that date?`,
      check(value) {
        const classification = PlanetaryMotion.classifyAlignment('mars', dateForDay(elongationRef.day));
        const correct = Math.abs(value - classification.elongationDeg) <= 15;
        return {
          correct,
          message: `On this date Mars's elongation is about ${classification.elongationDeg.toFixed(0)}° — neither close to 0° (conjunction) nor 180° (opposition), so this stage is just described by its elongation angle.`,
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
