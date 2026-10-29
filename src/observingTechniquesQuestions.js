/**
 * Practice questions for notes/observing-techniques.html's "What decides
 * whether you can see it?" section (spec 6.20, u1.25): given a stated
 * target and three site-and-time options, pick the one that actually
 * lets you see it, and say why — weighing altitude (and the atmosphere's
 * path length through it), landscape obstructions, cloud cover, and
 * whether the target has risen or already set.
 */

function makeQuestions(VisibilityFactors) {
  function bestByPathLength(options) {
    return options.reduce((best, option) =>
      VisibilityFactors.pathLengthMultiplier(option.altitudeDeg) < VisibilityFactors.pathLengthMultiplier(best.altitudeDeg)
        ? option
        : best
    );
  }

  const ALTITUDE_OPTIONS = [
    { label: 'Option A: 15° altitude, clear sky, flat unobstructed horizon', altitudeDeg: 15 },
    { label: 'Option B: 45° altitude, clear sky, flat unobstructed horizon', altitudeDeg: 45 },
    { label: 'Option C: 70° altitude, clear sky, flat unobstructed horizon', altitudeDeg: 70 },
  ];

  return [
    {
      id: 'best-altitude-atmosphere',
      units: ['u1.25'],
      type: 'choice',
      prompt:
        "You want to observe a faint galaxy tonight. It will be at a different altitude above the horizon depending on when you look, and all three times have a clear sky and a flat, unobstructed horizon. Option A: altitude 15°. Option B: altitude 45°. Option C: altitude 70°. Which gives the best view, and why?",
      options: ALTITUDE_OPTIONS.map((option) => option.label),
      check(value) {
        const chosen = ALTITUDE_OPTIONS.find((option) => option.label === value);
        const best = bestByPathLength(ALTITUDE_OPTIONS);
        const correct = Boolean(chosen) && chosen.altitudeDeg === best.altitudeDeg;
        const m15 = VisibilityFactors.pathLengthMultiplier(15).toFixed(1);
        const m45 = VisibilityFactors.pathLengthMultiplier(45).toFixed(2);
        const m70 = VisibilityFactors.pathLengthMultiplier(70).toFixed(2);
        return {
          correct,
          message:
            `Option C (70°) is the best choice. The higher a target sits, the shorter the path its light takes through the atmosphere — about 1/sin(altitude) times the straight-up (zenith) path: roughly ×${m15} at 15°, ×${m45} at 45°, and only ×${m70} at 70°. A longer path scatters and absorbs more of the light on the way, so the 15° view would look noticeably dimmer, redder and twinklier than the 70° one, even though all three are clear and unobstructed.`,
        };
      },
    },
    {
      id: 'rising-and-setting-timing',
      units: ['u1.25'],
      type: 'choice',
      prompt:
        "A comet is 5° above the horizon at 9pm (only just risen, still low in the murk near the horizon), 40° above the horizon at 11pm, and has set below the horizon by 1:30am. All three times would otherwise be clear and unobstructed. Which time should you actually plan to observe it?",
      options: ['9pm (5° altitude, only just risen)', '11pm (40° altitude)', '1:30am (already set)'],
      check(value) {
        const correct = value === '11pm (40° altitude)';
        return {
          correct,
          message:
            "11pm is the only sensible choice. At 1:30am the comet has already set — it's below the horizon and physically cannot be seen, whatever the sky is doing. At 9pm it has only just risen to 5°, so even though it's technically visible, it's so low that its light is heavily dimmed, reddened and twinkly, and a landscape obstruction as small as a line of garden fences could hide it entirely. By 11pm, at 40°, it's well clear of the horizon and seen through far less atmosphere.",
        };
      },
    },
    {
      id: 'landscape-blocks-view',
      units: ['u1.25'],
      type: 'choice',
      prompt:
        "A line of hills on your southern horizon blocks anything below 20° altitude in that direction. A planet will be due south at three possible times tonight, all with a clear sky: Time A, at 12° altitude. Time B, at 25° altitude. Time C, at 8° altitude. Which time actually lets you see it over the hills?",
      options: ['Time A (12° altitude)', 'Time B (25° altitude)', 'Time C (8° altitude)'],
      check(value) {
        const correct = value === 'Time B (25° altitude)';
        return {
          correct,
          message:
            "Only Time B works. The hills block anything below 20° altitude, so Times A (12°) and C (8°) are both hidden behind them however clear the sky is — the planet is there, but physically out of sight until it climbs higher. Time B, at 25°, clears the hills by 5° and is the only one of the three where the planet is actually above your visible horizon.",
        };
      },
    },
    {
      id: 'weather-blocks-view',
      units: ['u1.25'],
      type: 'choice',
      prompt:
        "The forecast shows thick cloud covering your target during two of tonight's three observing windows, with a clear gap in between. Window A: cloud. Window B: clear. Window C: cloud. Which window should you actually plan to observe in, and why?",
      options: ['Window A', 'Window B', 'Window C'],
      check(value) {
        const correct = value === 'Window B';
        return {
          correct,
          message:
            'Window B. Cloud is opaque — however good the target\'s altitude, seeing conditions or landscape are during Windows A and C, thick cloud blocks the view completely. Weather is a simple yes/no check that has to be satisfied before any of the other factors (altitude, seeing, landscape) are worth considering at all.',
        };
      },
    },
    {
      id: 'combined-trade-off',
      units: ['u1.25'],
      type: 'choice',
      prompt:
        "You want to observe Jupiter tonight. Plan A: Jupiter at 8° altitude, just above a line of trees that blocks anything below 5°, clear sky. Plan B: Jupiter at 40° altitude, clear horizon, but thick cloud forecast to cover it all evening. Plan C: Jupiter at 35° altitude, clear sky, flat horizon with nothing blocking. Which plan is the only one that actually gives a good view of Jupiter tonight, and why?",
      options: ['Plan A', 'Plan B', 'Plan C'],
      check(value) {
        const correct = value === 'Plan C';
        return {
          correct,
          message:
            "Plan C. Plan B is ruled out immediately: thick cloud blocks the view completely regardless of Jupiter's altitude. Plan A technically clears the trees (8° is just above the 5° obstruction), but sitting that low means a long path through the atmosphere — Jupiter would look dim, reddened and twinkly, and even a small change in the trees' height or your position could hide it again. Plan C is clear, well clear of any obstruction, and high enough (35°) for a short atmospheric path — the only plan with no weak point.",
        };
      },
    },
  ];
}

const observingTechniquesQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = observingTechniquesQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.ObservingTechniquesQuestions = observingTechniquesQuestionsApi;
}
