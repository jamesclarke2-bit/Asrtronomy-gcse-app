/**
 * Exam-style practice questions for notes/hr-diagram.html, each with
 * `marks`, a `spec` tag (13.7a-e or 13.13) and a full mark scheme in its
 * feedback. Regions, the main sequence and the star data come from
 * HRDiagram (src/hrDiagram.js), never typed separately. The two
 * read-from-the-diagram distance questions draw their own small HR
 * diagram (render), so the value is read off a picture, not given.
 */
(function () {
  function makeQuestions(H) {
    const UNITS = ['u4.9'];

    function markScheme(points) {
      return `Mark scheme: ${points.map((p) => `${p} (1)`).join('; ')}.`;
    }

    function scored(results, points) {
      const got = results.filter(Boolean).length;
      const total = results.length;
      const scheme = markScheme(points);
      return { correct: got === total, message: `${got} out of ${total} mark${total === 1 ? '' : 's'}. ${scheme}` };
    }

    const signed = H.signed;
    const fmt = (d) => Number(d.toPrecision(3)).toLocaleString('en-GB');

    // ---- A small read-off diagram, drawn in the browser only ----------
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const READ = { x0: 50, x1: 370, yTop: 40, yBottom: 250, mTop: -2, mBottom: 12 };

    function renderReadOff(container, type, temperatureK) {
      const p = H.makePlot(READ);
      const panelDiv = document.createElement('div');
      panelDiv.className = 'spectrum-panel hr-question-diagram';
      const wrap = document.createElement('div');
      wrap.className = 'labelled-diagram-wrap';
      const svg = document.createElementNS(SVG_NS, 'svg');
      const W = 400;
      const Ht = 340;
      [['viewBox', `0 0 ${W} ${Ht}`], ['width', W], ['height', Ht], ['class', 'responsive-svg'], ['role', 'img'],
        ['aria-label', `Part of an HR diagram: the main sequence band with its middle line, absolute magnitude from ${signed(READ.mTop, 0)} at the top to ${signed(READ.mBottom, 0)} at the bottom with a grid line every magnitude, and a dashed line up from a ${type} star's temperature, ${temperatureK.toLocaleString('en-GB')} K.`]]
        .forEach(([k, v]) => svg.setAttribute(k, v));
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
        span.style.top = `${(y / Ht) * 100}%`;
        span.textContent = text;
        wrap.appendChild(span);
      };
      el('rect', { x: 0, y: 0, width: W, height: Ht, rx: 10, fill: '#0f1830' });
      for (let m = READ.mTop; m <= READ.mBottom; m += 1) {
        const y = p.yForM(m);
        el('line', { x1: p.x0, x2: p.x1, y1: y, y2: y, stroke: '#9aa7bd', 'stroke-width': m % 2 === 0 ? 0.8 : 0.4, opacity: m % 2 === 0 ? 0.7 : 0.4 });
        if (m % 2 === 0 && m < READ.mBottom) label(m === 0 ? '0' : signed(m, 0), p.x0 - 8, y, 'diagram-label--left');
      }
      const upper = [];
      const lower = [];
      const centre = [];
      for (let i = 0; i <= 80; i += 1) {
        const t = Math.pow(10, Math.log10(H.AXES.tHotK) - (i / 80) * (Math.log10(H.AXES.tHotK) - Math.log10(H.AXES.tCoolK)));
        const c = H.mainSequenceMagnitude(t);
        const clampY = (m) => Math.max(p.yTop, Math.min(p.yBottom, p.yForM(m)));
        upper.push(`${p.xForT(t).toFixed(1)},${clampY(c - H.MAIN_SEQUENCE_HALF_WIDTH).toFixed(1)}`);
        lower.unshift(`${p.xForT(t).toFixed(1)},${clampY(c + H.MAIN_SEQUENCE_HALF_WIDTH).toFixed(1)}`);
        if (c >= READ.mTop && c <= READ.mBottom) centre.push(`${p.xForT(t).toFixed(1)},${p.yForM(c).toFixed(1)}`);
      }
      el('polygon', { points: [...upper, ...lower].join(' '), fill: 'rgba(255, 224, 138, 0.22)', stroke: '#ffe08a', 'stroke-dasharray': '6 4' });
      el('polyline', { points: centre.join(' '), fill: 'none', stroke: '#ffe08a', 'stroke-width': 2 });
      el('rect', { x: p.x0, y: p.yTop, width: p.x1 - p.x0, height: p.yBottom - p.yTop, fill: 'none', stroke: '#9aa7bd' });
      const x = p.xForT(temperatureK);
      el('line', { x1: x, x2: x, y1: p.yTop, y2: p.yBottom, stroke: '#eef3fb', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' });
      label(`${type}`, x + 6, p.yTop + 12, 'diagram-label--right diagram-label--strong');
      [40000, 10000, 5000, 2500].forEach((t) => {
        el('line', { x1: p.xForT(t), x2: p.xForT(t), y1: p.yBottom, y2: p.yBottom + 5, stroke: '#9aa7bd' });
        label(t.toLocaleString('en-GB'), p.xForT(t), p.yBottom + 16);
      });
      label('\u2190 hotter   Temperature (K)', (p.x0 + p.x1) / 2, p.yBottom + 44);
      label('Solid line: middle of the band', (p.x0 + p.x1) / 2, p.yBottom + 72);
      label('Absolute magnitude', 6, 16, 'diagram-label--right');
      wrap.insertBefore(svg, wrap.firstChild);
      panelDiv.appendChild(wrap);
      container.appendChild(panelDiv);
    }

    // ---- Read-off distance questions ---------------------------------
    // The reader is allowed half a magnitude either way of the band's
    // middle, as a marker reading a printed diagram would be.
    const READ_TOLERANCE_MAG = 0.5;

    function readOffQuestion({ id, type, temperatureK, m }) {
      const r = H.distanceFromMainSequence(temperatureK, m);
      const lowPc = Math.pow(10, (m - (r.M + READ_TOLERANCE_MAG) + 5) / 5);
      const highPc = Math.pow(10, (m - (r.M - READ_TOLERANCE_MAG) + 5) / 5);
      return {
        id,
        units: UNITS,
        spec: '13.13',
        marks: 3,
        prompt: `${/^[AEFHILMNORSX]/.test(type) ? 'An' : 'A'} ${type} star is on the main sequence. Its apparent magnitude is m = ${signed(m)}. Use the HR diagram to read its absolute magnitude M where the dashed line meets the middle of the main sequence, then use M = m + 5 − 5 log d to find its distance d in parsecs.`,
        type: 'number',
        unitLabel: 'pc',
        render(container) {
          renderReadOff(container, type, temperatureK);
        },
        check(value) {
          const v = Number(value);
          const correct = Number.isFinite(v) && v >= lowPc * 0.98 && v <= highPc * 1.02;
          const points = [
            `M read from the diagram: about ${signed(r.M)} (accept ${signed(r.M - READ_TOLERANCE_MAG)} to ${signed(r.M + READ_TOLERANCE_MAG)})`,
            `5 log d = m − M + 5 = ${signed(m)} − (${signed(r.M)}) + 5 = ${(m - r.M + 5).toFixed(1)}`,
            `log d = ${((m - r.M + 5) / 5).toFixed(2)}, so d ≈ ${fmt(r.distancePc)} pc (accept ${fmt(lowPc)} to ${fmt(highPc)} pc, from the reading range)`,
          ];
          const scheme = markScheme(points);
          return { correct, message: `${correct ? 'Correct.' : 'Not quite.'} ${scheme}` };
        },
        answer: { M: r.M, distancePc: r.distancePc, lowPc, highPc },
      };
    }

    const G2 = H.DISTANCE_TYPES.find((d) => d.type === 'G2');
    const ex = H.distanceFromMainSequence(G2.temperatureK, 9.8);
    const UNCERTAINTY = ex.uncertaintyPc;

    const MS = 'A diagonal band from top left (hot, bright) to bottom right (cool, dim)';
    const WD_POS = 'Bottom left';
    const WD_WHY = 'They are very small, so they give out little light even though they are hot';
    const RG_TEMP = 'Cool';
    const RG_LUM = 'Much more luminous than the Sun';
    const ONLY_MS = 'A giant of the same spectral type is far more luminous, so reading M from the main sequence would make it seem much too close';

    const siriusB = H.STARS.find((s) => s.name === 'Sirius B');
    const betelgeuse = H.STARS.find((s) => s.name === 'Betelgeuse');

    return [
      {
        id: 'x-axis-label-and-direction',
        units: UNITS,
        spec: '13.7a',
        marks: 2,
        prompt: 'A student sketches an HR diagram. (a) What quantity goes on the x-axis? (b) Which way does it increase?',
        fields: [
          { key: 'quantity', type: 'choice', label: '(a) x-axis', options: ['Surface temperature', 'Apparent magnitude', 'Distance', 'Mass'] },
          { key: 'direction', type: 'choice', label: '(b) Increases', options: ['To the left', 'To the right'] },
        ],
        check(value) {
          return scored([value.quantity === 'Surface temperature', value.direction === 'To the left'], [
            '(a) surface temperature (or spectral type)',
            '(b) to the left: hottest stars on the left, the standard way round',
          ]);
        },
      },
      {
        id: 'y-axis-magnitude-direction',
        units: UNITS,
        spec: '13.7a',
        marks: 1,
        prompt: 'An HR diagram has absolute magnitude on its y-axis. Where are the most negative values?',
        type: 'choice',
        options: ['At the top', 'At the bottom', 'In the middle', 'On the right'],
        check(value) {
          return { correct: value === 'At the top', message: markScheme(['at the top: a more negative absolute magnitude means a brighter star, and the brightest stars go at the top']) };
        },
      },
      {
        id: 'main-sequence-shape',
        units: UNITS,
        spec: '13.7a',
        marks: 1,
        prompt: 'On an HR diagram drawn the standard way round, what shape and position does the main sequence have?',
        type: 'choice',
        options: [MS, 'A horizontal band across the top', 'A diagonal band from bottom left to top right', 'A small group in the bottom left'],
        check(value) {
          return { correct: value === MS, message: markScheme(['a diagonal band from top left (hot, luminous) to bottom right (cool, dim)']) };
        },
      },
      {
        id: 'sun-position',
        units: UNITS,
        spec: '13.7b',
        marks: 2,
        prompt: 'Where is the Sun on an HR diagram? (a) Which group is it in? (b) Where in that group?',
        fields: [
          { key: 'group', type: 'choice', label: '(a) Group', options: ['Main sequence', 'Red giants', 'White dwarfs', 'Supergiants'] },
          { key: 'where', type: 'choice', label: '(b) Where', options: ['Near the middle', 'At the top-left end', 'At the bottom-right end'] },
        ],
        check(value) {
          return scored([value.group === 'Main sequence', value.where === 'Near the middle'], [
            '(a) the main sequence',
            '(b) near the middle of it: a medium temperature (about 5,800 K) and luminosity 1, absolute magnitude +4.8',
          ]);
        },
      },
      {
        id: 'red-giant-position',
        units: UNITS,
        spec: '13.7c',
        marks: 2,
        prompt: 'Red giants are found at the top right of an HR diagram. What does that position tell you about (a) their surface temperature and (b) their luminosity?',
        fields: [
          { key: 'temp', type: 'choice', label: '(a) Temperature', options: [RG_TEMP, 'Hot'] },
          { key: 'lum', type: 'choice', label: '(b) Luminosity', options: [RG_LUM, 'Much less luminous than the Sun'] },
        ],
        check(value) {
          return scored([value.temp === RG_TEMP, value.lum === RG_LUM], [
            '(a) cool: they are on the right, where temperature is lowest',
            '(b) much more luminous than the Sun: they are near the top',
          ]);
        },
      },
      {
        id: 'blue-giant-position',
        units: UNITS,
        spec: '13.7c',
        marks: 1,
        prompt: 'Where on an HR diagram are blue giants?',
        type: 'choice',
        options: ['Top left, above the main sequence', 'Bottom left, below the main sequence', 'Top right, above the main sequence', 'Bottom right, at the end of the main sequence'],
        check(value) {
          return { correct: value === 'Top left, above the main sequence', message: markScheme(['top left, above the main sequence: hot and very luminous']) };
        },
      },
      {
        id: 'white-dwarf-position',
        units: UNITS,
        spec: '13.7d',
        marks: 2,
        prompt: 'White dwarfs are hot. (a) Where are they on an HR diagram? (b) Why are they so dim?',
        fields: [
          { key: 'pos', type: 'choice', label: '(a) Position', options: [WD_POS, 'Top left', 'Top right', 'Bottom right'] },
          { key: 'why', type: 'choice', label: '(b) Why dim', options: [WD_WHY, 'They are very far away', 'They are cool', 'Their light is blocked by dust'] },
        ],
        check(value) {
          return scored([value.pos === WD_POS, value.why === WD_WHY], [
            '(a) bottom left, below the main sequence',
            '(b) they are very small (about Earth-sized), so they give out little light despite being hot',
          ]);
        },
      },
      {
        id: 'identify-white-dwarf',
        units: UNITS,
        spec: '13.7d',
        marks: 1,
        prompt: `A star has surface temperature ${siriusB.temperatureK.toLocaleString('en-GB')} K and absolute magnitude ${signed(siriusB.absoluteMagnitude)}. (For comparison, the Sun is about 5,800 K and +4.8.) Which kind of star is it?`,
        type: 'choice',
        options: ['White dwarf', 'Blue giant', 'Main-sequence star', 'Red giant'],
        check(value) {
          return { correct: value === 'White dwarf', message: markScheme(['white dwarf: much hotter than the Sun but far dimmer, so bottom left']) };
        },
      },
      {
        id: 'supergiants-position',
        units: UNITS,
        spec: '13.7e',
        marks: 1,
        prompt: 'Where are supergiants on an HR diagram?',
        type: 'choice',
        options: ['Across the top, at every temperature', 'Only in the bottom left', 'Along the middle of the main sequence', 'Only at the bottom right'],
        check(value) {
          return { correct: value === 'Across the top, at every temperature', message: markScheme(['across the top: the most luminous stars, from hot (blue) to cool (red)']) };
        },
      },
      {
        id: 'identify-supergiant',
        units: UNITS,
        spec: '13.7e',
        marks: 1,
        prompt: `Betelgeuse has surface temperature ${betelgeuse.temperatureK.toLocaleString('en-GB')} K and absolute magnitude ${signed(betelgeuse.absoluteMagnitude)} (the Sun: about 5,800 K and +4.8). Which group is it in?`,
        type: 'choice',
        options: ['Supergiants', 'Main sequence', 'White dwarfs', 'Blue giants'],
        check(value) {
          return { correct: value === 'Supergiants', message: markScheme(['supergiants: cool (red) but among the most luminous stars, so top right, across the top']) };
        },
      },
      readOffQuestion({ id: 'distance-read-off-f5', type: 'F5', temperatureK: H.DISTANCE_TYPES.find((d) => d.type === 'F5').temperatureK, m: 8.4 }),
      readOffQuestion({ id: 'distance-read-off-k5', type: 'K5', temperatureK: H.DISTANCE_TYPES.find((d) => d.type === 'K5').temperatureK, m: 9.9 }),
      {
        id: 'distance-uncertainty',
        units: UNITS,
        spec: '13.13',
        marks: 2,
        prompt: `A G2 main-sequence star has m = +9.8. The main sequence at G2 runs from M = ${signed(ex.bright)} to M = ${signed(ex.faint)}, which puts the star between ${fmt(ex.nearPc)} pc and ${fmt(ex.farPc)} pc away. What is the uncertainty in its distance, taken as half the range, in parsecs?`,
        type: 'number',
        unitLabel: 'pc',
        check(value) {
          const v = Number(value);
          const correct = Number.isFinite(v) && Math.abs(v - UNCERTAINTY) <= UNCERTAINTY * 0.02 + 0.5;
          const scheme = markScheme([
            `range = ${fmt(ex.farPc)} − ${fmt(ex.nearPc)} = ${fmt(ex.rangePc)} pc`,
            `uncertainty = half the range = ${fmt(ex.rangePc)} ÷ 2 ≈ ${fmt(UNCERTAINTY)} pc, so about ±${Math.round(UNCERTAINTY)} pc`,
          ]);
          return { correct, message: `${correct ? 'Correct.' : 'Not quite.'} ${scheme}` };
        },
      },
      {
        id: 'distance-main-sequence-only',
        units: UNITS,
        spec: '13.13',
        marks: 1,
        prompt: 'The HR diagram method gives a star\'s distance from its spectral type. Why must we know the star is on the main sequence?',
        type: 'choice',
        options: [ONLY_MS, 'Only main-sequence stars have a spectral type', 'Giants are too far away to measure', 'The formula only works for the Sun'],
        check(value) {
          return { correct: value === ONLY_MS, message: markScheme(['a star of the same type could be a giant, far more luminous (more negative M), so using the main-sequence M would give much too small a distance']) };
        },
      },
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.HRDiagramQuestions = api;
  }
})();
