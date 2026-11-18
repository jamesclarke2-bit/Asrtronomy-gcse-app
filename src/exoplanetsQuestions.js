/**
 * Exam-style practice questions for notes/exoplanets-life.html (spec 12.4,
 * 12.6, 12.7, 12.8), each with `marks` and a full mark scheme in its
 * feedback, at least one per spec point, two reading drawings.
 */
(function () {
  function makeQuestions(X) {
    const UNITS = ['u3.33'];

    function markScheme(points) {
      return `Mark scheme: ${points.map((p) => `${p} (1)`).join('; ')}.`;
    }

    function single(id, spec, prompt, options, right, point, render) {
      const q = {
        id,
        units: UNITS,
        spec,
        marks: 1,
        prompt,
        type: 'choice',
        options,
        check(value) {
          return { correct: value === right, message: markScheme([point]) };
        },
      };
      if (render) q.render = render;
      return q;
    }

    function picture(label, width, height, draw) {
      return (container) => {
        const panelDiv = document.createElement('div');
        panelDiv.className = 'spectrum-panel hr-question-diagram';
        const wrap = document.createElement('div');
        wrap.className = 'labelled-diagram-wrap';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        [['viewBox', `0 0 ${width} ${height}`], ['width', width], ['height', height], ['class', 'responsive-svg'], ['role', 'img'], ['aria-label', label]].forEach(([k, v]) => svg.setAttribute(k, v));
        wrap.appendChild(svg);
        panelDiv.appendChild(wrap);
        container.appendChild(panelDiv);
        draw(svg, wrap);
      };
    }

    const jupiter = X.PLANETS.find((p) => p.key === 'jupiter');
    const DIP = +X.transitDepthPercent(jupiter.radius).toFixed(2);
    const DIP_TOL = 0.1;

    const drakeGiven = { R: 2, fp: 0.5, ne: 1, fl: 0.1, fi: 0.1, fc: 0.1, L: 10000 };
    const drakeAnswer = +X.drakeN(drakeGiven).toPrecision(6);
    const SETI_DISTANCE = 50;
    const SETI_ANSWER = X.replyYears(SETI_DISTANCE);

    return [
      // --- 12.4 Detection methods -----------------------------------------
      {
        id: 'ex-transit-read',
        units: UNITS,
        spec: '12.4',
        marks: 2,
        prompt: "The light curve shows a star's brightness as a planet passes in front of it. (a) Read the lowest brightness. (b) By how many percent does the star dim?",
        fields: [
          { key: 'lowest', type: 'number', label: '(a) Lowest brightness', unitLabel: '% of normal' },
          { key: 'dip', type: 'number', label: '(b) Dip', unitLabel: '%' },
        ],
        render: picture('A light curve: brightness as a percentage of normal against time in hours, with gridlines every 0.5 percent. The curve is flat at 100, dips while the planet crosses, then returns to 100.', 640, 300, (svg, wrap) => window.ExoplanetsDrawing.drawTransit(svg, wrap, 0.5, 'jupiter', { curveOnly: true })),
        check(value) {
          const a = Math.abs(Number(value.lowest) - (100 - DIP)) <= DIP_TOL;
          const b = Math.abs(Number(value.dip) - DIP) <= DIP_TOL;
          const got = [a, b].filter(Boolean).length;
          const scheme = markScheme([
            `(a) about ${(100 - DIP).toFixed(1)}% from the bottom of the dip (accept ${(100 - DIP - DIP_TOL).toFixed(1)} to ${(100 - DIP + DIP_TOL).toFixed(1)})`,
            `(b) 100 − ${(100 - DIP).toFixed(1)} = ${DIP.toFixed(1)}%: the planet blocks about ${DIP.toFixed(1)}% of the star's light`,
          ]);
          return { correct: a && b, message: `${got} out of 2 marks. ${scheme}` };
        },
        answer: { lowest: 100 - DIP, dip: DIP },
      },
      single('ex-method-dip', '12.4', "A star's brightness drops very slightly for a few hours, every 4 days, again and again. Which method has found a planet?", ['Transit', 'Astrometry', 'Radial velocity', 'Parallax'], 'Transit', 'transit: the planet passes in front of the star once every orbit, blocking a little of its light'),
      single('ex-method-lines', '12.4', "The lines in a star's spectrum shift slightly towards blue, then towards red, then back, every 3 days. Which method has found a planet?", ['Radial velocity', 'Transit', 'Astrometry', 'Parallax'], 'Radial velocity', 'radial velocity: the star moves towards us (blueshift) and away (redshift) as it orbits the shared centre with its planet'),
      single('ex-method-wobble', '12.4', "Very precise measurements show a star's position on the sky moving in a tiny loop, over and over. Which method has found a planet?", ['Astrometry', 'Transit', 'Radial velocity', 'Parallax'], 'Astrometry', 'astrometry: the star wobbles round the centre of mass it shares with its planet'),
      single('ex-transit-bigger', '12.4', 'Two planets transit identical stars. Planet A makes a deeper dip than planet B. What does this tell you?', ['Planet A is bigger', 'Planet A is further from its star', 'Planet A orbits faster', 'Planet A is hotter'], 'Planet A is bigger', 'a bigger planet blocks more of the star, so makes a deeper dip'),

      // --- 12.6 Habitable zone --------------------------------------------
      single('ex-zone-meaning', '12.6', "What is a star's habitable (Goldilocks) zone?", [
        'The range of distances where a planet could have liquid water on its surface',
        'The region where planets are known to have life',
        'The part of the star where new elements form',
        'The distance at which a planet would be pulled apart',
      ], 'The range of distances where a planet could have liquid water on its surface', 'the distances where it is neither too hot nor too cold for liquid water on a planet\'s surface'),
      single('ex-zone-hotter', '12.6', "Star P is hotter and brighter than the Sun. Compared with the Sun's habitable zone, where is star P's?", ['Further from the star', 'Closer to the star', 'At the same distance', 'Inside the star'], 'Further from the star', 'a brighter star heats planets more, so the zone where water stays liquid is further out'),
      single(
        'ex-zone-picture',
        '12.6',
        'The drawing shows a Sun-like star, its habitable zone (hatched) and planets at different distances. Which planet could have liquid water on its surface?',
        ['The planet at 1 AU', 'The planet at 0.4 AU', 'The planet at 3 AU', 'The planet at 0.1 AU'],
        'The planet at 1 AU',
        'the planet at 1 AU is inside the hatched habitable zone; 0.1 and 0.4 AU are too close (too hot), 3 AU is too far (too cold)',
        picture('A star of 5,800 K on the left and planets along a log distance scale in AU, with a hatched habitable zone around 1 AU.', 640, 320, (svg, wrap) => window.ExoplanetsDrawing.drawZone(svg, wrap, X.SUN_T, { hideKey: true })),
      ),

      // --- 12.7 Drake equation --------------------------------------------
      single('ex-drake-n', '12.7', 'In the Drake equation, N = R* × fp × ne × fl × fi × fc × L, what does N stand for?', [
        'The number of civilisations in our Galaxy sending signals we could detect',
        'The number of stars in our Galaxy',
        'The number of planets round the Sun',
        'The number of years until we find life',
      ], 'The number of civilisations in our Galaxy sending signals we could detect', 'N is the number of detectable (communicating) civilisations in our Galaxy'),
      {
        id: 'ex-drake-calc',
        units: UNITS,
        spec: '12.7',
        marks: 2,
        prompt: `Use the Drake equation, N = R* × fp × ne × fl × fi × fc × L, with these guesses: R* = ${drakeGiven.R} new stars a year, fp = ${drakeGiven.fp}, ne = ${drakeGiven.ne}, fl = ${drakeGiven.fl}, fi = ${drakeGiven.fi}, fc = ${drakeGiven.fc} and L = ${drakeGiven.L.toLocaleString('en-GB')} years. Calculate N.`,
        type: 'number',
        unitLabel: 'civilisations',
        check(value) {
          const correct = Math.abs(Number(value) - drakeAnswer) <= 0.02 * drakeAnswer;
          const steps = `${drakeGiven.R} × ${drakeGiven.fp} = 1; × ${drakeGiven.ne} = 1; × ${drakeGiven.fl} = 0.1; × ${drakeGiven.fi} = 0.01; × ${drakeGiven.fc} = 0.001; × ${drakeGiven.L.toLocaleString('en-GB')} = ${drakeAnswer}`;
          return { correct, message: `Mark scheme: multiply all seven factors (1); ${steps}, so N = ${drakeAnswer} (1).` };
        },
        answer: drakeAnswer,
      },
      single('ex-drake-range', '12.7', 'Why do estimates from the Drake equation range from less than one to millions?', [
        'Most of the factors are unknown, so they can only be guessed',
        'The equation has a mistake in it',
        'The number of stars changes every year',
        'Radio telescopes give different answers',
      ], 'Most of the factors are unknown, so they can only be guessed', 'most factors (such as the fraction of planets where life starts, or how long civilisations last) are unknown, so different guesses give hugely different answers'),

      // --- 12.8 SETI -------------------------------------------------------
      single('ex-seti-radio', '12.8', 'Why does SETI mostly search using radio waves?', [
        'Radio passes through dust and the atmosphere, travels far and is cheap to send',
        'Radio travels faster than light',
        'Only radio can be seen with the naked eye',
        'Stars give out no radio waves, so any radio signal must be from aliens',
      ], 'Radio passes through dust and the atmosphere, travels far and is cheap to send', 'radio gets through dust in space and the Earth\'s atmosphere, travels huge distances and takes little energy to send'),
      {
        id: 'ex-seti-delay',
        units: UNITS,
        spec: '12.8',
        marks: 1,
        prompt: `Radio signals travel at the speed of light, so they cover one light-year in one year. We send a message to a star ${SETI_DISTANCE} light-years away, and a civilisation there replies at once. How many years after sending do we get the reply?`,
        type: 'number',
        unitLabel: 'years',
        check(value) {
          const correct = Math.abs(Number(value) - SETI_ANSWER) <= 0.02 * SETI_ANSWER;
          return { correct, message: markScheme([`${SETI_DISTANCE} years there + ${SETI_DISTANCE} years back = ${SETI_ANSWER} years`]) };
        },
        answer: SETI_ANSWER,
      },
      {
        id: 'ex-seti-sort',
        units: UNITS,
        spec: '12.8',
        marks: 2,
        prompt: 'Sort each possible result of contact with an alien civilisation into a benefit or a danger.',
        fields: [
          { key: 'technology', type: 'choice', label: '(a) Learning new technology from their messages', options: ['A benefit', 'A danger'] },
          { key: 'location', type: 'choice', label: '(b) Giving away where the Earth is by replying', options: ['A benefit', 'A danger'] },
        ],
        check(value) {
          const a = value.technology === 'A benefit';
          const b = value.location === 'A danger';
          const got = [a, b].filter(Boolean).length;
          return { correct: a && b, message: `${got} out of 2 marks. ${markScheme(['(a) a benefit: new science and technology', '(b) a danger: a more powerful civilisation would know where we are'])}` };
        },
      },
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.ExoplanetsQuestions = api;
  }
})();
