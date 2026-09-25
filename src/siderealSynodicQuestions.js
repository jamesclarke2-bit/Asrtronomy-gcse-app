/**
 * Practice questions for sims/sidereal-vs-synodic.html: reading the two
 * counters at a given elapsed time, and the "catch-up" gap between them.
 *
 * T_SIDEREAL is re-derived from MoonPhase.SYNODIC_MONTH_DAYS the same way
 * sidereal-vs-synodic.js derives it (1/sidereal = 1/synodic + 1/year), so
 * every answer here always agrees with what the page itself shows —
 * never a second, independently-typed copy of the number.
 */

function makeQuestions(MoonPhase) {
  const T_SYNODIC = MoonPhase.SYNODIC_MONTH_DAYS;
  const T_YEAR_DAYS = 365.25;
  const T_SIDEREAL = 1 / (1 / T_SYNODIC + 1 / T_YEAR_DAYS);

  function cycleScenario(days) {
    const siderealDone = days >= T_SIDEREAL;
    const synodicDone = days >= T_SYNODIC;
    const label = !siderealDone && !synodicDone
      ? 'Neither counter has completed a full cycle yet'
      : siderealDone && !synodicDone
        ? 'Only the sidereal counter has completed a full cycle'
        : !siderealDone && synodicDone
          ? 'Only the synodic counter has completed a full cycle'
          : 'Both counters have completed a full cycle';
    return { siderealDone, synodicDone, label };
  }

  const CYCLE_OPTIONS = [
    'Neither counter has completed a full cycle yet',
    'Only the sidereal counter has completed a full cycle',
    'Only the synodic counter has completed a full cycle',
    'Both counters have completed a full cycle',
  ];

  function cycleQuestion(id, days) {
    return {
      id,
      units: ['u2.17'],
      type: 'choice',
      prompt: `Both counters start at zero together, pointing at the same star at the same phase. After exactly ${days.toFixed(1)} elapsed days, which is true?`,
      options: CYCLE_OPTIONS,
      check(value) {
        const scenario = cycleScenario(days);
        const correct = value === scenario.label;
        return {
          correct,
          message: `At ${days.toFixed(1)} days: the sidereal month is ${T_SIDEREAL.toFixed(1)} days, so it has ${scenario.siderealDone ? 'already completed and reset' : 'not yet completed'}; the synodic month is ${T_SYNODIC.toFixed(1)} days, so it has ${scenario.synodicDone ? 'already completed and reset' : 'not yet completed'}. ${scenario.label}.`,
        };
      },
    };
  }

  return [
    {
      id: 'catch-up-gap',
      units: ['u2.17'],
      type: 'number',
      unitLabel: 'days',
      prompt:
        `The Moon completes a sidereal month (pointing at the same star again) after about ${T_SIDEREAL.toFixed(1)} days, but it isn't back to the same phase relative to the Sun yet. To the nearest 0.1 days, how much longer does it need before it also completes a synodic month?`,
      check(value) {
        const gap = T_SYNODIC - T_SIDEREAL;
        const correct = Math.abs(value - gap) <= 0.3;
        return {
          correct,
          message: `The synodic month (${T_SYNODIC.toFixed(2)} days) minus the sidereal month (${T_SIDEREAL.toFixed(2)} days) is about ${gap.toFixed(1)} days — the extra travel the Moon needs to catch up to the Sun's own direction, which has shifted slightly because Earth kept moving along its own orbit in the meantime.`,
        };
      },
    },
    cycleQuestion('identify-cycle-neither', 15),
    cycleQuestion('identify-cycle-sidereal-only', 28),
    cycleQuestion('identify-cycle-both', 40),
    {
      id: 'next-lap',
      units: ['u2.17'],
      type: 'number',
      unitLabel: 'days',
      prompt:
        `Starting from when both counters were zero together, the sidereal counter (period ${T_SIDEREAL.toFixed(2)} days) keeps completing cycles slightly faster than the synodic counter (period ${T_SYNODIC.toFixed(2)} days). Work out how many cycles per day each counter completes, find the gap between those two rates, then use it to estimate roughly how many days it takes for the sidereal counter to gain one whole extra cycle on the synodic counter.`,
      check(value) {
        const lapDays = 1 / (1 / T_SIDEREAL - 1 / T_SYNODIC);
        const correct = Math.abs(value - lapDays) <= 25;
        return {
          correct,
          message: `The sidereal counter completes 1/${T_SIDEREAL.toFixed(2)} ≈ ${(1 / T_SIDEREAL).toFixed(4)} cycles/day, the synodic counter 1/${T_SYNODIC.toFixed(2)} ≈ ${(1 / T_SYNODIC).toFixed(4)} cycles/day. The gap between those rates is about ${(1 / T_SIDEREAL - 1 / T_SYNODIC).toFixed(5)} cycles/day, so gaining one whole cycle takes about ${lapDays.toFixed(0)} days — close enough to a year that it's no coincidence: it's the same relationship (1/sidereal = 1/synodic + 1/year) that sets the ~2.2-day gap between the two months in the first place.`,
        };
      },
    },
  ];
}

const siderealSynodicQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = siderealSynodicQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.SiderealSynodicQuestions = siderealSynodicQuestionsApi;
}
