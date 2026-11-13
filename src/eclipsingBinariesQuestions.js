/**
 * Exam-style practice questions for notes/eclipsing-binaries.html, each
 * with `marks`, a `spec` tag (13.15 or 13.18) and a full mark scheme in
 * its feedback. Light curves come from EclipsingBinaries
 * (src/eclipsingBinaries.js). Two questions read a period off a light
 * curve they draw themselves (browser only, via render, using the shared
 * light-curve drawing in src/lightCurveDrawing.js); one of them is the
 * deep-dip-to-shallow-dip trap.
 */
(function () {
  function makeQuestions(E) {
    const UNITS = ['u4.12'];

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

    // ---- A drawn light curve with a grid line every day (browser only) ---

    function renderCurve(container, sys, spanDays) {
      const D = window.SpectrumDrawing;
      const L = window.LightCurveDrawing;
      const W = 400;
      const H = 300;
      const panelDiv = document.createElement('div');
      panelDiv.className = 'spectrum-panel hr-question-diagram';
      const wrap = document.createElement('div');
      wrap.className = 'labelled-diagram-wrap';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      [['viewBox', `0 0 ${W} ${H}`], ['width', W], ['height', H], ['class', 'responsive-svg'], ['role', 'img'],
        ['aria-label', `An eclipsing binary's light curve over ${spanDays} days, with deep and shallow dips and a grid line every day.`]].forEach(([k, v]) => svg.setAttribute(k, v));
      wrap.appendChild(svg);
      panelDiv.appendChild(wrap);
      container.appendChild(panelDiv);
      D.panel(svg);
      const depth = E.dips(sys).primaryDepth;
      const mTop = sys.brightestMag - 0.1;
      const mBottom = sys.brightestMag + depth * 1.15;
      const ticks = [];
      for (let t = 0; t <= spanDays; t += 2) ticks.push(t);
      L.drawLightCurve(svg, wrap, {
        x0: 50, x1: 380, yTop: 36, yBottom: 220, tMin: 0, tMax: spanDays, mTop, mBottom,
        fn: (t) => E.magnitudeAt(sys, t), samples: 1200, tGrid: 1, tTicks: ticks,
        mTicks: L.niceTicks(mTop + 0.05, mBottom - 0.12 * (mBottom - mTop), 3), brighterNote: false,
      });
      D.addLabel(svg, wrap, 'Apparent magnitude (brighter at the top)', 8, 16, 'diagram-label--tick diagram-label--right');
      D.addLabel(svg, wrap, 'Time (days)', 215, 262, 'diagram-label--tick');
    }

    function periodQuestion({ id, sys, spanDays, prompt, trap }) {
      const P = sys.periodDays;
      const { primary } = E.dipTimes(sys, 0, spanDays);
      const cycles = primary.length - 1;
      const tol = Math.max(0.5 / cycles, 0.02 * P);
      return {
        id,
        units: UNITS,
        spec: '13.18',
        marks: 2,
        prompt,
        type: 'number',
        unitLabel: 'days',
        render(container) {
          renderCurve(container, sys, spanDays);
        },
        check(value) {
          const v = Number(value);
          const correct = Number.isFinite(v) && Math.abs(v - P) <= tol;
          const points = [
            `time from one deep (primary) dip to another deep dip, over several cycles: e.g. ${cycles} cycles from day ${primary[0].toFixed(1)} to day ${primary[cycles].toFixed(1)}, ${(primary[cycles] - primary[0]).toFixed(1)} days`,
            `period = ${(primary[cycles] - primary[0]).toFixed(1)} ÷ ${cycles} ≈ ${P.toFixed(1)} days (accept ${(P - tol).toFixed(2)} to ${(P + tol).toFixed(2)})${trap ? `; ${(P / 2).toFixed(1)} days, deep dip to shallow dip, is only half the period and scores 0` : ''}`,
          ];
          const scheme = markScheme(points);
          return { correct, message: `${correct ? 'Correct.' : 'Not quite.'} ${scheme}` };
        },
        answer: { period: P, tolerance: tol, half: P / 2 },
      };
    }

    const trapSys = { ...E.preset('demo'), periodDays: 5.0, zeroDay: 1.5 };
    const readSys = { ...E.preset('demo'), zeroDay: 0.6 };

    const HOTTER = 'The hotter star';
    const WHY_HOT = 'Each square metre of a hotter star gives out more light, so covering it loses more light';
    const EDGE = 'Their orbits are not lined up edge-on to us, so the stars never pass in front of each other';
    const FLAT = 'The smaller star is completely hidden behind the larger one (or completely in front of it) for a while';
    const PARTIAL = 'Only part of a star is ever hidden: a partial eclipse';
    const SHRINK = 'The dips get shallower, then disappear';
    const BOTH_SEEN = 'Both stars are fully visible: neither is in front of the other';
    const COOLER = 'The cooler star is hidden behind the hotter one';
    const SEVERAL = 'The same reading uncertainty is spread over a longer time, so the percentage uncertainty is smaller';

    const span = 14.4;
    const n = 4;
    const r = E.periodFromDips(1.0, 1.0 + span, n);

    return [
      {
        id: 'deep-dip-hidden-star',
        units: UNITS,
        spec: '13.15',
        marks: 2,
        prompt: 'An eclipsing binary has a hot star and a cooler star. (a) Which star is hidden during the deep (primary) dip? (b) Why does hiding it lose more light?',
        fields: [
          { key: 'which', type: 'choice', label: '(a) Hidden at the deep dip', options: [HOTTER, 'The cooler star', 'Whichever star is bigger'] },
          { key: 'why', type: 'choice', label: '(b) Why', options: [WHY_HOT, 'The hotter star is always further away', 'The cooler star gives out more light per square metre'] },
        ],
        check(value) {
          return scored([value.which === HOTTER, value.why === WHY_HOT], [
            '(a) the hotter star is hidden (behind the cooler star)',
            '(b) each square metre of the hotter star gives out more light, so covering the same area of it loses more light',
          ]);
        },
      },
      single('most-binaries-no-eclipse', '13.15', 'Most binary stars show no eclipses at all. Why?', [EDGE, 'Their stars are too far apart to orbit', 'Their stars are the same temperature', 'Eclipses only happen in our Galaxy'], EDGE, 'we only see eclipses if the orbit is (nearly) edge-on to us; most orbits are tilted, so the stars never pass in front of each other as we see them'),
      single('flat-bottomed-dip', '13.15', 'One dip in an eclipsing binary’s light curve has a flat bottom. What does this tell you?', [FLAT, 'The stars are moving apart', 'Both stars are the same size', 'The telescope lost the star for a while'], FLAT, 'a total eclipse: the smaller star is completely hidden (or completely in front of the larger star), so the hidden area stays the same for a while'),
      single('v-shaped-dip', '13.15', 'A dip in an eclipsing binary’s light curve is V-shaped, with no flat part. What does this tell you?', [PARTIAL, 'The smaller star is completely hidden', 'The stars have stopped orbiting', 'Neither star is hidden'], PARTIAL, 'a partial eclipse: the hidden area grows to a maximum, then shrinks straight away'),
      single('tilt-effect', '13.15', 'The orbit of an eclipsing binary is tilted further and further away from edge-on. What happens to its dips?', [SHRINK, 'They get deeper', 'They stay exactly the same', 'They get closer together in time'], SHRINK, 'less of each star is covered, so the dips get shallower, and once the stars no longer pass in front of each other the dips vanish'),
      single('between-dips', '13.15', 'Between the dips, an eclipsing binary’s light curve is flat and at its brightest. Why?', [BOTH_SEEN, 'Both stars are hidden', 'The stars stop shining', 'The hotter star is in front'], BOTH_SEEN, 'neither star is covering the other, so we see all the light from both'),
      single('shallow-dip', '13.15', 'What is happening during the shallow (secondary) dip?', [COOLER, 'The hotter star is hidden behind the cooler one', 'Both stars are hidden', 'The stars are side by side'], COOLER, 'the cooler star is hidden (behind the hotter star); covering it loses less light, so the dip is shallow'),
      periodQuestion({ id: 'read-period', sys: readSys, spanDays: 16, prompt: 'The light curve shows an eclipsing binary over 16 days. Find its period, in days, by timing several whole cycles between deep dips and dividing.' }),
      periodQuestion({ id: 'read-period-trap', sys: trapSys, spanDays: 16, trap: true, prompt: 'A student times this eclipsing binary from a deep dip to the next shallow dip and says the period is the time between them. Use the light curve to find the correct period, in days.' }),
      single('eclipse-several-cycles', '13.18', 'Why should you time several whole cycles of an eclipsing binary, then divide, rather than time one?', [SEVERAL, 'It removes all uncertainty', 'The dips get deeper', 'One cycle cannot be seen'], SEVERAL, 'each reading is just as uncertain, but the time measured is longer, so the percentage uncertainty in the period is smaller'),
      {
        id: 'period-from-times',
        units: UNITS,
        spec: '13.18',
        marks: 1,
        prompt: `Deep dips of an eclipsing binary are seen at day 1.0 and day ${(1.0 + span).toFixed(1)}, with ${n} whole cycles between them. What is its period, in days?`,
        type: 'number',
        unitLabel: 'days',
        check(value) {
          const v = Number(value);
          const correct = Number.isFinite(v) && Math.abs(v - r.period) <= 0.02 * r.period;
          const scheme = markScheme([`period = (${(1.0 + span).toFixed(1)} − 1.0) ÷ ${n} = ${r.period.toFixed(1)} days`]);
          return { correct, message: `${correct ? 'Correct.' : 'Not quite.'} ${scheme}` };
        },
      },
      {
        id: 'period-uncertainty',
        units: UNITS,
        spec: '13.18',
        marks: 2,
        prompt: `Timing ${n} cycles between deep dips gives ${span.toFixed(1)} days, with each dip read to ±0.25 days, so the time could be anywhere from ${(span - 0.5).toFixed(1)} to ${(span + 0.5).toFixed(1)} days. Taking the uncertainty as half the range of the period, what is the uncertainty in the period, in days?`,
        type: 'number',
        unitLabel: 'days',
        check(value) {
          const v = Number(value);
          const correct = Number.isFinite(v) && v >= 0.12 && v <= 0.13;
          const scheme = markScheme([
            `the period could be ${(span - 0.5).toFixed(1)} ÷ ${n} = ${r.low.toFixed(3)} to ${(span + 0.5).toFixed(1)} ÷ ${n} = ${r.high.toFixed(3)} days`,
            `half that range: (${r.high.toFixed(3)} − ${r.low.toFixed(3)}) ÷ 2 = ±${r.uncertaintyDays.toFixed(3)} days (accept 0.12 to 0.13)`,
          ]);
          return { correct, message: `${correct ? 'Correct.' : 'Not quite.'} ${scheme}` };
        },
        answer: { uncertaintyDays: r.uncertaintyDays },
      },
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.EclipsingBinariesQuestions = api;
  }
})();
