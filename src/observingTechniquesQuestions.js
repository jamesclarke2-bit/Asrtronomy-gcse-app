/**
 * Practice questions for notes/observing-techniques.html's "What decides
 * whether you can see it?" section (spec 6.20, u1.25): given a stated
 * target and three site-and-time options, pick the one that actually
 * lets you see it, and say why — weighing altitude (and the atmosphere's
 * path length through it), landscape obstructions, cloud cover, and
 * whether the target has risen or already set; and sky colour (spec
 * 1.6a, u1.5): why the sky is blue, sunsets are red, and stars cannot
 * be seen by day.
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
      id: 'star-opposite-sun-daytime',
      units: ['u1.26'],
      type: 'choice',
      prompt:
        "A particular star happens to lie in exactly the same direction in the sky as the Sun does today. Why can't you see that star tonight?",
      options: [
        "It isn't really there — a star in the Sun's exact direction has already been destroyed.",
        "It's below the horizon all night, having set at the same time as the Sun.",
        "It rises and sets together with the Sun, so it's only ever above the horizon during the day, when it's lost in the Sun's glare.",
        "It's too far away to see at all, regardless of direction.",
      ],
      check(value) {
        const correct = value === "It rises and sets together with the Sun, so it's only ever above the horizon during the day, when it's lost in the Sun's glare.";
        return {
          correct,
          message:
            "A star in the same direction as the Sun shares the Sun's own rising and setting times — it's up only while the Sun is up, which means it's above the horizon only during daylight, when its faint light is completely swamped by the much brighter sky. It's never above the horizon at night at all while the Sun sits in that direction, so \"can't be seen at night\" is really \"isn't up at night\" rather than \"is up but invisible\". Earth's own orbit is what eventually fixes this: a few months later, as Earth moves on, the Sun's direction shifts away from that star, and the star starts rising before the Sun sets — appearing in the evening sky, then earlier and earlier each night until it's visible all night around opposition.",
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
    // Sky colour (spec 1.6a, u1.5).
    skyColour(
      'sky-blue-why',
      'Why does the daytime sky look blue?',
      [
        'Air scatters short-wavelength blue light much more than red, so blue light reaches us from all over the sky',
        'The sky reflects the colour of the oceans',
        'The Sun gives out only blue light',
        'Air absorbs all the red light from the Sun',
      ],
      'blue light is scattered far more than red by the air, so scattered blue light comes at us from every direction',
    ),
    skyColour(
      'sunset-red-why',
      'Why does the Sun look red when it is low, near the horizon?',
      [
        'Its light crosses a much longer path through the air, and most of the blue is scattered out on the way',
        'The Sun cools down at the end of the day',
        'The Sun is further from the Earth in the evening',
        'Dust on the horizon gives out red light',
      ],
      'the low Sun\'s light crosses far more air, so most of the blue is scattered out, leaving mostly red and orange',
    ),
    skyColour(
      'daytime-no-stars',
      'The stars are still above us in the daytime. Why can we not see them?',
      [
        'Sunlight scattered by the air makes the sky far brighter than the starlight',
        'The stars move below the horizon every morning',
        'The Sun blocks the starlight like an eclipse',
        'Stars only shine at night',
      ],
      'scattered sunlight makes the daytime sky much brighter than the stars, so their light is swamped',
    ),
    ...findingTargetsQuestions(),
  ];
}

// --- 6.5 Star charts, planispheres and apps (u1.18) ----------------------

/**
 * A drawn all-sky star chart, the kind held overhead: the edge is the
 * horizon, the centre is straight overhead, and the compass points are
 * printed round the edge (east on the left, because you look up at it).
 * Four stars are lettered A to D; the dashed lines join one constellation.
 */
const STAR_CHART = {
  size: 320,
  centre: 160,
  radius: 130,
  stars: [
    { letter: 'A', x: 162, y: 150, r: 5 },
    { letter: 'B', x: 52, y: 176, r: 4 },
    { letter: 'C', x: 238, y: 88, r: 3.5 },
    { letter: 'D', x: 150, y: 266, r: 4.5 },
  ],
  extra: [[120, 120, 2], [200, 140, 2], [95, 230, 1.8], [215, 230, 2.2], [260, 190, 1.6], [110, 75, 1.8]],
  lines: [[162, 150, 200, 140], [200, 140, 238, 88]],
};

/** Which compass direction a point on the chart lies towards, and how near the centre it is. */
function chartBearing(star) {
  const dx = star.x - STAR_CHART.centre;
  const dy = star.y - STAR_CHART.centre;
  // North is up and east is LEFT on a chart held overhead.
  const names = ['North', 'East', 'South', 'West'];
  const angle = Math.atan2(-dx, -dy); // 0 = up (north), +90° = left (east)
  const k = ((Math.round(angle / (Math.PI / 2)) % 4) + 4) % 4;
  return { direction: names[k], fromCentre: Math.hypot(dx, dy) };
}

function renderStarChart(container) {
  const NS = 'http://www.w3.org/2000/svg';
  const { size, centre, radius } = STAR_CHART;
  const el = (tag, attrs, parent) => {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, String(v)));
    parent.appendChild(node);
    return node;
  };
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('class', 'responsive-svg star-chart-question');
  svg.setAttribute('role', 'img');
  svg.setAttribute(
    'aria-label',
    'An all-sky star chart: a circle whose edge is the horizon and whose centre is straight overhead, with North at the top, East on the left, South at the bottom and West on the right. Star A is almost at the centre, star B near the left (east) edge, star C towards the upper right, between north and west, and star D near the bottom (south) edge. Dashed lines join A to a fainter star and on to C.'
  );
  // A dark panel behind the whole chart, so the compass letters stand out on any card colour.
  el('rect', { x: 0, y: 0, width: size, height: size, rx: 12, fill: '#0b1630' }, svg);
  el('circle', { cx: centre, cy: centre, r: radius, fill: '#10233f', stroke: '#eef3fb', 'stroke-width': 2 }, svg);
  el('circle', { cx: centre, cy: centre, r: 3, fill: 'none', stroke: '#9aa7bd', 'stroke-width': 1 }, svg);
  STAR_CHART.lines.forEach(([x1, y1, x2, y2]) => el('line', { x1, y1, x2, y2, stroke: '#9aa7bd', 'stroke-width': 1.2, 'stroke-dasharray': '4 4' }, svg));
  STAR_CHART.extra.forEach(([cx, cy, r]) => el('circle', { cx, cy, r, fill: '#eef3fb' }, svg));
  STAR_CHART.stars.forEach((s) => {
    el('circle', { class: `star-chart-star star-chart-star-${s.letter}`, cx: s.x, cy: s.y, r: s.r, fill: '#ffe08a' }, svg);
    // Labels sit up and to the right, or up and to the left near the right-hand edge.
    const left = s.x > centre + radius * 0.5;
    const t = el('text', { x: left ? s.x - 9 : s.x + 9, y: s.y - 7, fill: '#eef3fb', 'font-size': 18, 'font-weight': 700, 'text-anchor': left ? 'end' : 'start' }, svg);
    t.textContent = s.letter;
  });
  [['N', centre, centre - radius - 8], ['S', centre, centre + radius + 22], ['E', centre - radius - 16, centre + 6], ['W', centre + radius + 16, centre + 6]].forEach(([text, x, y]) => {
    const t = el('text', { x, y, fill: '#eef3fb', 'font-size': 18, 'font-weight': 700, 'text-anchor': 'middle' }, svg);
    t.textContent = text;
  });
  // The quiz already wraps this in its own .question-diagram (which carries the Enlarge button).
  container.appendChild(svg);
}

function findingTargetsQuestions() {
  const UNITS = ['u1.18'];
  const LETTERS = STAR_CHART.stars.map((s) => s.letter);
  const B = chartBearing(STAR_CHART.stars.find((s) => s.letter === 'B'));
  const HIGHEST = [...STAR_CHART.stars].sort((a, b) => chartBearing(a).fromCentre - chartBearing(b).fromCentre)[0].letter;
  const SET = 'Turn the top disc until 21:00 on its time scale lines up with 15 March on the date scale';
  const DARK = 'A planisphere read by red light: it works for any date and time, with no screen to spoil dark adaptation';
  const APP_GOOD = 'It uses GPS and a compass to show what you are pointing at, in real time';
  const APP_BAD = 'Its bright screen can spoil your dark adaptation unless it is dimmed or set to red';
  return [
    {
      id: 'star-chart-read',
      units: UNITS,
      spec: '6.5',
      marks: 2,
      prompt:
        'The drawing is an all-sky star chart for tonight at 22:00. Hold it overhead: its edge is the horizon and its centre is the point straight above you. (a) Which way should you face to see star B? (b) Which lettered star is highest in the sky?',
      render: renderStarChart,
      fields: [
        { key: 'face', type: 'choice', label: '(a) Face', options: ['North', 'East', 'South', 'West'] },
        { key: 'highest', type: 'choice', label: '(b) Highest star', options: LETTERS },
      ],
      check(value) {
        const ok = [value.face === B.direction, value.highest === HIGHEST];
        const got = ok.filter(Boolean).length;
        return {
          correct: ok.every(Boolean),
          message: `${got} out of 2 marks. Mark scheme: (a) ${B.direction.toLowerCase()}: star B is near the edge marked ${B.direction[0]}, so it is low in the ${B.direction.toLowerCase()} (1); (b) star ${HIGHEST}: it is nearest the centre, which is straight overhead (1). On a chart held overhead, east is on the left.`,
        };
      },
      answer: { face: B.direction, highest: HIGHEST },
    },
    {
      id: 'planisphere-set',
      units: UNITS,
      spec: '6.5',
      marks: 1,
      type: 'choice',
      prompt: 'You want to see which stars are up at 21:00 on 15 March. How do you set a planisphere?',
      options: [SET, 'Point the planisphere at the brightest star you can see', 'Turn it until the Moon is in the window', 'Hold it so the date scale faces south'],
      check(value) {
        return { correct: value === SET, message: 'Mark scheme: line up the time (21:00) with the date (15 March); the window then shows the stars above the horizon at that moment (1).' };
      },
    },
    {
      id: 'finding-tool-dark-site',
      units: UNITS,
      spec: '6.5',
      marks: 1,
      type: 'choice',
      prompt: 'You are at a dark site with no phone signal and want to keep your eyes dark-adapted all night. Which is the best way to find your targets, and why?',
      options: [DARK, 'A sky app at full brightness: it is the quickest', 'A photograph of the sky taken last month', 'No chart: the bright stars are enough to find everything'],
      check(value) {
        return { correct: value === DARK, message: 'Mark scheme: a planisphere (or printed chart) read by red light needs no battery, signal or screen, and works for any date and time, so dark adaptation is kept (1).' };
      },
    },
    {
      id: 'sky-app-pros-cons',
      units: UNITS,
      spec: '6.5',
      marks: 2,
      prompt: 'Give one advantage and one disadvantage of using a sky app on a phone to find targets.',
      fields: [
        { key: 'good', type: 'choice', label: 'Advantage', options: [APP_GOOD, 'It never needs charging', 'It makes faint stars brighter'] },
        { key: 'bad', type: 'choice', label: 'Disadvantage', options: [APP_BAD, 'It only works in the daytime', 'It shows the stars for one date only'] },
      ],
      check(value) {
        const ok = [value.good === APP_GOOD, value.bad === APP_BAD];
        return {
          correct: ok.every(Boolean),
          message: `${ok.filter(Boolean).length} out of 2 marks. Mark scheme: advantage: it uses GPS and a compass to identify what you are pointing at, in real time (1); disadvantage: its bright screen spoils dark adaptation unless dimmed or switched to red (1).`,
        };
      },
    },
  ];
}

function skyColour(id, prompt, options, point) {
  return {
    id,
    units: ['u1.5'],
    spec: '1.6a',
    marks: 1,
    type: 'choice',
    prompt,
    options,
    check(value) {
      return { correct: value === options[0], message: `Mark scheme: ${point} (1).` };
    },
  };
}

const observingTechniquesQuestionsApi = { makeQuestions, STAR_CHART, chartBearing };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = observingTechniquesQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.ObservingTechniquesQuestions = observingTechniquesQuestionsApi;
}
