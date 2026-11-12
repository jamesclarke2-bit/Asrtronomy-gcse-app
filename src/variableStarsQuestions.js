/**
 * Exam-style practice questions for notes/variable-stars.html, each with
 * `marks`, a `spec` tag (13.14a-d or 13.16) and a full mark scheme in its
 * feedback. Periods, magnitudes and the period-luminosity relation come
 * from VariableStars (src/variableStars.js). Two questions read a period
 * off a light curve they draw themselves, and two read M off a
 * period-luminosity graph they draw themselves (browser only, via render).
 */
(function () {
  function makeQuestions(V) {
    const UNITS = ['u4.11'];
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const signed = V.signed;

    function markScheme(points) {
      return `Mark scheme: ${points.map((p) => `${p} (1)`).join('; ')}.`;
    }

    function scored(results, points) {
      const got = results.filter(Boolean).length;
      const total = results.length;
      const scheme = markScheme(points);
      return { correct: got === total, message: `${got} out of ${total} mark${total === 1 ? '' : 's'}. ${scheme}` };
    }

    function single(id, spec, prompt, options, right, point) {
      return {
        id,
        units: UNITS,
        spec,
        marks: 1,
        prompt,
        type: 'choice',
        options,
        check(value) {
          const scheme = markScheme([point]);
          return { correct: value === right, message: scheme };
        },
      };
    }

    const fmt = (d) => Number(d.toPrecision(3)).toLocaleString('en-GB');

    // ---- Small drawn graphs (browser only) ------------------------------

    function graphShell(container, W, H, ariaLabel) {
      const panelDiv = document.createElement('div');
      panelDiv.className = 'spectrum-panel hr-question-diagram';
      const wrap = document.createElement('div');
      wrap.className = 'labelled-diagram-wrap';
      const svg = document.createElementNS(SVG_NS, 'svg');
      [['viewBox', `0 0 ${W} ${H}`], ['width', W], ['height', H], ['class', 'responsive-svg'], ['role', 'img'], ['aria-label', ariaLabel]].forEach(([k, v]) => svg.setAttribute(k, v));
      wrap.appendChild(svg);
      panelDiv.appendChild(wrap);
      container.appendChild(panelDiv);
      const el = (tag, attrs) => {
        const node = document.createElementNS(SVG_NS, tag);
        Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
        svg.appendChild(node);
        return node;
      };
      const label = (text, x, y, cls) => {
        const span = document.createElement('span');
        span.className = `diagram-label diagram-label--tick ${cls || ''}`;
        span.style.left = `${(x / W) * 100}%`;
        span.style.top = `${(y / H) * 100}%`;
        span.textContent = text;
        wrap.appendChild(span);
      };
      el('rect', { x: 0, y: 0, width: W, height: H, rx: 10, fill: '#0f1830' });
      return { el, label };
    }

    function renderLightCurve(container, star, spanDays, mTop, mBottom) {
      const W = 400;
      const H = 300;
      const g = { x0: 50, x1: 380, yTop: 36, yBottom: 220 };
      const { el, label } = graphShell(container, W, H, `A light curve: apparent magnitude against time from 0 to ${spanDays} days, with a grid line every day.`);
      const xFor = (t) => g.x0 + (t / spanDays) * (g.x1 - g.x0);
      const yFor = (m) => g.yTop + ((m - mTop) / (mBottom - mTop)) * (g.yBottom - g.yTop);
      for (let t = 0; t <= spanDays; t += 1) {
        el('line', { x1: xFor(t), x2: xFor(t), y1: g.yTop, y2: g.yBottom, stroke: '#9aa7bd', 'stroke-width': t % 2 === 0 ? 0.8 : 0.4, opacity: t % 2 === 0 ? 0.6 : 0.35 });
        if (t % 2 === 0) label(String(t), xFor(t), g.yBottom + 14);
      }
      const step = (mBottom - mTop) / 4;
      for (let i = 0; i <= 4; i += 1) {
        const m = mTop + i * step;
        el('line', { x1: g.x0, x2: g.x1, y1: yFor(m), y2: yFor(m), stroke: '#9aa7bd', 'stroke-width': 0.4, opacity: 0.35 });
        if (i % 2 === 0) label(m.toFixed(1), g.x0 - 6, yFor(m), 'diagram-label--left');
      }
      const pts = [];
      for (let i = 0; i <= 800; i += 1) {
        const t = (spanDays * i) / 800;
        pts.push(`${xFor(t).toFixed(1)},${yFor(V.magnitudeAt(star, t)).toFixed(1)}`);
      }
      el('polyline', { points: pts.join(' '), fill: 'none', stroke: '#ffe08a', 'stroke-width': 2 });
      el('rect', { x: g.x0, y: g.yTop, width: g.x1 - g.x0, height: g.yBottom - g.yTop, fill: 'none', stroke: '#9aa7bd' });
      label('Apparent magnitude (brighter at the top)', 8, 16, 'diagram-label--right');
      label('Time (days)', (g.x0 + g.x1) / 2, g.yBottom + 42);
    }

    function renderPL(container, periodDays) {
      const W = 400;
      const H = 340;
      const g = { x0: 50, x1: 380, yTop: 36, yBottom: 250, mTop: -7, mBottom: -1 };
      const { el, label } = graphShell(container, W, H, `The period-luminosity graph for Cepheids: absolute magnitude from minus 7 at the top to minus 1 at the bottom, with a grid line every half magnitude, against period from 1 to 100 days on a log scale. A dashed line rises from a period of ${periodDays} days.`);
      const xFor = (p) => g.x0 + (Math.log10(p) / 2) * (g.x1 - g.x0);
      const yFor = (M) => g.yTop + ((M - g.mTop) / (g.mBottom - g.mTop)) * (g.yBottom - g.yTop);
      for (let M = g.mTop; M <= g.mBottom + 1e-9; M += 0.5) {
        const whole = Math.abs(M - Math.round(M)) < 1e-9;
        el('line', { x1: g.x0, x2: g.x1, y1: yFor(M), y2: yFor(M), stroke: '#9aa7bd', 'stroke-width': whole ? 0.8 : 0.4, opacity: whole ? 0.6 : 0.35 });
        if (whole) label(signed(M, 0), g.x0 - 6, yFor(M), 'diagram-label--left');
      }
      [1, 2, 3, 5, 10, 20, 30, 50, 100].forEach((p) => {
        el('line', { x1: xFor(p), x2: xFor(p), y1: g.yTop, y2: g.yBottom, stroke: '#9aa7bd', 'stroke-width': 0.5, opacity: 0.45 });
        if ([1, 3, 10, 30, 100].includes(p)) label(String(p), xFor(p), g.yBottom + 14);
      });
      const pts = [];
      for (let i = 0; i <= 40; i += 1) {
        const p = Math.pow(10, (2 * i) / 40);
        pts.push(`${xFor(p).toFixed(1)},${yFor(V.absoluteMagnitudeFromPeriod(p)).toFixed(1)}`);
      }
      el('polyline', { points: pts.join(' '), fill: 'none', stroke: '#ffe08a', 'stroke-width': 2 });
      el('rect', { x: g.x0, y: g.yTop, width: g.x1 - g.x0, height: g.yBottom - g.yTop, fill: 'none', stroke: '#9aa7bd' });
      el('line', { x1: xFor(periodDays), x2: xFor(periodDays), y1: g.yBottom, y2: g.yTop, stroke: '#eef3fb', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' });
      label(`${periodDays} days`, xFor(periodDays) + 6, g.yBottom - 12, 'diagram-label--right diagram-label--strong');
      label('Absolute magnitude M', 8, 16, 'diagram-label--right');
      label('Period (days), log scale', (g.x0 + g.x1) / 2, g.yBottom + 42);
    }

    // ---- Reading a period off a light curve -----------------------------

    function periodQuestion({ id, spec, star, spanDays, mTop, mBottom, what }) {
      const P = star.periodDays;
      const cycles = Math.floor((spanDays - 1) / P);
      // Each end read to the light curve's own reading uncertainty, so the
      // span is good to twice that, shared over the cycles timed.
      const tol = Math.max((2 * V.TIME_READING_DAYS) / cycles, 0.02 * P);
      return {
        id,
        units: UNITS,
        spec,
        marks: 2,
        prompt: `The light curve shows ${what}. Find its period, in days, by timing several whole cycles and dividing.`,
        type: 'number',
        unitLabel: 'days',
        render(container) {
          renderLightCurve(container, star, spanDays, mTop, mBottom);
        },
        check(value) {
          const v = Number(value);
          const correct = Number.isFinite(v) && Math.abs(v - P) <= tol;
          const scheme = markScheme([
            `time several whole cycles, e.g. ${cycles} cycles from one ${star.primaryHalfWidth ? 'dip' : 'peak'} to another, about ${(cycles * P).toFixed(1)} days`,
            `period = ${(cycles * P).toFixed(1)} ÷ ${cycles} ≈ ${P.toFixed(1)} days (accept ${(P - tol).toFixed(2)} to ${(P + tol).toFixed(2)})`,
          ]);
          return { correct, message: `${correct ? 'Correct.' : 'Not quite.'} ${scheme}` };
        },
        answer: { period: P, tolerance: tol },
      };
    }

    // ---- Cepheid distances, reading M off the graph ---------------------

    function distanceQuestion({ id, periodDays, m, where }) {
      const r = V.cepheidDistance(periodDays, m);
      const lowPc = r.nearPc * 0.98;
      const highPc = r.farPc * 1.02;
      return {
        id,
        units: UNITS,
        spec: '13.16',
        marks: 3,
        prompt: `A Cepheid ${where} has a period of ${periodDays} days and an average apparent magnitude m = ${signed(m)}. Use the period-luminosity graph to read its absolute magnitude M, then use M = m + 5 − 5 log d to find its distance d in parsecs.`,
        type: 'number',
        unitLabel: 'pc',
        render(container) {
          renderPL(container, periodDays);
        },
        check(value) {
          const v = Number(value);
          const correct = Number.isFinite(v) && v >= lowPc && v <= highPc;
          const scheme = markScheme([
            `M read from the graph: about ${signed(r.M)} (accept ${signed(r.bright)} to ${signed(r.faint)})`,
            `5 log d = m − M + 5 = ${signed(m)} − (${signed(r.M)}) + 5 = ${(m - r.M + 5).toFixed(1)}`,
            `log d = ${r.logD.toFixed(2)}, so d ≈ ${fmt(r.distancePc)} pc (accept ${fmt(r.nearPc)} to ${fmt(r.farPc)} pc)`,
          ]);
          return { correct, message: `${correct ? 'Correct.' : 'Not quite.'} ${scheme}` };
        },
        answer: { M: r.M, distancePc: r.distancePc, lowPc, highPc },
      };
    }

    const algol = V.galleryById('algol');
    const cephei = { ...V.galleryById('delta-cephei'), phaseOffset: 0.28 };
    const rr = V.galleryById('rr-lyrae');
    const mira = V.galleryById('mira');

    const TOP = 'At the top: smaller magnitudes are brighter';
    const RR_P = `About ${rr.periodDays.toFixed(1)} days`;
    const MIRA_WHAT = 'A pulsating red giant';
    const FLAT_DIPS = 'Flat most of the time, with sharp dips that repeat regularly';
    const QUICK_RISE = 'A quick rise to maximum, then a slower fall';
    const PULSATES = 'It swells and shrinks, getting brighter and dimmer as it pulsates';
    const NOVA_CURVE = 'A sudden rise of many magnitudes, then a fade over weeks to months';
    const NOVA_WHERE = 'On a white dwarf in a close binary, pulling gas from its companion';
    const ONE_OFF = 'Novae and supernovae';
    const OUTSHINE = 'It can outshine its whole galaxy for a few weeks';
    const SEVERAL = 'The same reading uncertainty is spread over a longer time, so the percentage uncertainty is smaller';
    const CANDLE = "Its period tells us its luminosity, so how bright it looks tells us its distance";

    return [
      single('light-curve-axis', '13.14a', 'A light curve has apparent magnitude on its y-axis, drawn the usual way. Where on the graph is the star at its brightest?', [TOP, 'At the bottom: larger magnitudes are brighter', 'In the middle', 'On the far right'], TOP, 'at the top: the magnitude axis runs upside down, smallest (brightest) at the top'),
      {
        id: 'short-and-long-period',
        units: UNITS,
        spec: '13.14a',
        marks: 2,
        prompt: `(a) RR Lyrae is a short-period variable. Roughly how long is its period? (b) Mira is a long-period variable, with a period of about ${Math.round(mira.periodDays / 10) * 10} days. What kind of star is it?`,
        fields: [
          { key: 'p', type: 'choice', label: '(a) Period', options: [RR_P, 'About 5 days', 'About 330 days', 'About 30 years'] },
          { key: 'what', type: 'choice', label: '(b) Mira is', options: [MIRA_WHAT, 'A white dwarf', 'An eclipsing binary', 'A nova'] },
        ],
        check(value) {
          return scored([value.p === RR_P, value.what === MIRA_WHAT], [
            `(a) about ${rr.periodDays.toFixed(2)} days (about 13.6 hours)`,
            '(b) a pulsating red giant',
          ]);
        },
      },
      single('mira-range', '13.14a', `Mira's brightness typically ranges from magnitude ${mira.brightest} to ${mira.faintest}. How does that compare with a Cepheid such as Delta Cephei, which varies by under 1 magnitude?`, ['Mira changes by several magnitudes: far more than a Cepheid', 'Mira changes by less than a Cepheid', 'They change by the same amount', 'Mira does not change at all'], 'Mira changes by several magnitudes: far more than a Cepheid', `Mira changes by about ${(mira.faintest - mira.brightest).toFixed(1)} magnitudes, well over 100 times in brightness, against under 1 magnitude for a Cepheid`),
      single('eclipsing-shape', '13.14b', 'Which describes the light curve of an eclipsing binary such as Algol?', [FLAT_DIPS, 'A quick rise, then a slower fall, again and again', 'One huge rise, then a slow fade', 'A smooth wave with no flat parts'], FLAT_DIPS, 'flat (both stars in view) with sharp, regular dips as one star passes in front of the other'),
      periodQuestion({ id: 'read-period-algol', spec: '13.14b', star: algol, spanDays: 12, mTop: 2.0, mBottom: 3.6, what: 'the eclipsing binary Algol over 12 days' }),
      single('cepheid-shape', '13.14c', 'Which describes the light curve of a Cepheid variable?', [QUICK_RISE, 'A slow rise, then a sudden drop', 'Flat with sharp dips', 'One rise and a fade that never repeats'], QUICK_RISE, 'a regular cycle: a quick rise to maximum, then a slower fall'),
      periodQuestion({ id: 'read-period-cepheid', spec: '13.14c', star: cephei, spanDays: 20, mTop: 3.4, mBottom: 4.6, what: 'the Cepheid Delta Cephei over 20 days' }),
      single('why-cepheids-vary', '13.14c', 'Why does a Cepheid change in brightness?', [PULSATES, 'Another star passes in front of it', 'Clouds on Earth block it', 'It explodes every few days'], PULSATES, 'it pulsates: the giant star swells and shrinks, getting brighter and dimmer'),
      {
        id: 'nova',
        units: UNITS,
        spec: '13.14d',
        marks: 2,
        prompt: 'A nova appears in the sky. (a) What does its light curve look like? (b) Where does a nova happen?',
        fields: [
          { key: 'curve', type: 'choice', label: '(a) Light curve', options: [NOVA_CURVE, 'A regular rise and fall every few days', 'Flat with sharp regular dips'] },
          { key: 'where', type: 'choice', label: '(b) Where', options: [NOVA_WHERE, 'In the core of a red giant', 'On the surface of a planet'] },
        ],
        check(value) {
          return scored([value.curve === NOVA_CURVE, value.where === NOVA_WHERE], [
            '(a) a sudden rise of many magnitudes in a day or two, then a fade over weeks to months',
            '(b) on a white dwarf in a close binary: it pulls gas from its companion, and the gas explodes on its surface',
          ]);
        },
      },
      single('one-off-outbursts', '13.14d', 'Which of these do NOT repeat with a regular period?', [ONE_OFF, 'Cepheids', 'Eclipsing binaries', 'Long-period variables such as Mira'], ONE_OFF, 'novae and supernovae are one-off outbursts, not regular cycles'),
      single('supernova-peak', '13.14d', 'What is special about the peak of a supernova’s light curve?', [OUTSHINE, 'It lasts exactly one day', 'It repeats every year', 'It is fainter than the star before it'], OUTSHINE, 'it rises hugely, and for a few weeks can outshine its whole galaxy, then fades over months'),
      single('several-cycles', '13.16', 'To find a Cepheid’s period, a student times six whole cycles and divides by six, instead of timing one. Why is this better?', [SEVERAL, 'It makes the star pulsate faster', 'It removes all uncertainty', 'One cycle cannot be seen on a light curve'], SEVERAL, 'each reading is just as uncertain, but the time measured is six times longer, so the percentage uncertainty in the period is six times smaller'),
      distanceQuestion({ id: 'cepheid-distance-20', periodDays: 20, m: 13.7, where: 'in the Large Magellanic Cloud' }),
      distanceQuestion({ id: 'cepheid-distance-3', periodDays: 3, m: 9.2, where: 'in our Galaxy' }),
      single('standard-candle', '13.16', 'Why is a Cepheid called a standard candle?', [CANDLE, 'It is the same colour as a candle', 'It never changes in brightness', 'It is the nearest star'], CANDLE, 'its period gives its luminosity (absolute magnitude), so comparing that with its apparent magnitude gives its distance'),
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.VariableStarsQuestions = api;
  }
})();
