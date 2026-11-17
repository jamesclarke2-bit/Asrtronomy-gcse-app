/**
 * Exam-style practice questions for notes/hubble-law.html (spec
 * 16.4-16.6), each with `marks` and a full mark scheme in its feedback.
 * Every constant a calculation needs is stated in its own prompt,
 * numeric answers are accepted within 2%, and the mark scheme shows the
 * full working, every unit conversion included.
 */
(function () {
  function makeQuestions(H) {
    const UNITS = ['u6.2'];

    function markScheme(points) {
      return `Mark scheme: ${points.map((p) => `${p} (1)`).join('; ')}.`;
    }

    function fmt(n, digits = 0) {
      return n.toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits });
    }

    const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
    function sci(x, digits = 2) {
      const exp = Math.floor(Math.log10(Math.abs(x)));
      const mant = x / 10 ** exp;
      const sup = String(Math.abs(exp)).split('').map((d) => SUP[Number(d)]).join('');
      return `${mant.toFixed(digits)} × 10${exp < 0 ? '⁻' : ''}${sup}`;
    }

    function within2(value, target) {
      const v = Number(value);
      return Number.isFinite(v) && Math.abs(v - target) <= 0.02 * Math.abs(target) * (1 + 1e-9);
    }

    function accept(target, digits = 0) {
      return `accept ${fmt(0.98 * target, digits)} to ${fmt(1.02 * target, digits)}`;
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
          return { correct: value === right, message: markScheme([point]) };
        },
      };
    }

    function numeric(id, spec, marks, prompt, unitLabel, target, points, extra = {}) {
      return {
        id,
        units: UNITS,
        spec,
        marks,
        prompt,
        type: 'number',
        unitLabel,
        check(value) {
          const correct = within2(value, target);
          return { correct, message: `${correct ? 'Correct.' : 'Not quite.'} ${markScheme(points)}` };
        },
        answer: { value: target },
        ...extra,
      };
    }

    const H0 = H.H0;

    // v = H0 × d
    const V_D = 120;
    const vAnswer = H.velocity(V_D, H0);
    // d = v ÷ H0
    const D_V = 10200;
    const dAnswer = H.distance(D_V, H0);

    // Gradient from a given graph: a line through the origin and one
    // marked point.
    const G_D = 150;
    const G_V = 10500;
    const gAnswer = G_V / G_D;

    // Uncertainty as half the range.
    const U_BEST = 68;
    const U_STEEP = 74;
    const U_SHALLOW = 62;
    const uHalf = (U_STEEP - U_SHALLOW) / 2;
    const uPercent = (100 * uHalf) / U_BEST;

    // Age, every conversion stated.
    const A_H0 = 70;
    const A_MPC_KM = 3.1e19;
    const A_YEAR_S = 3.15e7;
    const aPerSecond = A_H0 / A_MPC_KM;
    const aSeconds = 1 / aPerSecond;
    const aYears = aSeconds / A_YEAR_S;
    const aBillion = aYears / 1e9;

    function renderGradientGraph(container) {
      const D = window.SpectrumDrawing;
      const W = 400;
      const Ht = 316;
      const panelDiv = document.createElement('div');
      panelDiv.className = 'spectrum-panel hr-question-diagram';
      const wrap = document.createElement('div');
      wrap.className = 'labelled-diagram-wrap';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      [['viewBox', `0 0 ${W} ${Ht}`], ['width', W], ['height', Ht], ['class', 'responsive-svg'], ['role', 'img'],
        ['aria-label', `A graph of recession velocity in km/s against distance in Mpc, with a best-fit line through the origin passing through the marked point at ${G_D} Mpc and ${fmt(G_V)} km/s.`]].forEach(([k, v]) => svg.setAttribute(k, v));
      wrap.appendChild(svg);
      panelDiv.appendChild(wrap);
      container.appendChild(panelDiv);
      D.panel(svg);
      const x0 = 70;
      const x1 = 380;
      const yTop = 52;
      const yBottom = 250;
      const X = (d) => x0 + (d / 200) * (x1 - x0);
      const Y = (v) => yBottom - (v / 14000) * (yBottom - yTop);
      for (let d = 0; d <= 200; d += 50) {
        D.svgEl('line', { x1: X(d), x2: X(d), y1: yTop, y2: yBottom, stroke: '#2a3550', 'stroke-width': 1 }, svg);
        D.addLabel(svg, wrap, String(d), X(d), yBottom + 14, 'diagram-label--tick');
      }
      for (let v = 0; v <= 14000; v += 3500) {
        D.svgEl('line', { x1: x0, x2: x1, y1: Y(v), y2: Y(v), stroke: '#2a3550', 'stroke-width': 1 }, svg);
        D.addLabel(svg, wrap, fmt(v), x0 - 6, Y(v), 'diagram-label--tick diagram-label--left');
      }
      D.svgEl('line', { x1: X(0), y1: Y(0), x2: X(200), y2: Y(gAnswer * 200), stroke: D.CURVE, 'stroke-width': 2.5 }, svg);
      D.svgEl('circle', { cx: X(G_D), cy: Y(G_V), r: 6, fill: 'none', stroke: D.INK, 'stroke-width': 2 }, svg);
      D.svgEl('line', { x1: X(G_D), x2: X(G_D), y1: Y(G_V), y2: yBottom, stroke: D.INK, 'stroke-width': 1, 'stroke-dasharray': '3 3' }, svg);
      D.svgEl('line', { x1: x0, x2: X(G_D), y1: Y(G_V), y2: Y(G_V), stroke: D.INK, 'stroke-width': 1, 'stroke-dasharray': '3 3' }, svg);
      D.addLabel(svg, wrap, `(${G_D} Mpc, ${fmt(G_V)} km/s)`, X(G_D) - 10, Y(G_V) - 16, 'diagram-label--tick diagram-label--strong diagram-label--left');
      D.addLabel(svg, wrap, 'Distance (Mpc)', (x0 + x1) / 2, yBottom + 50, 'diagram-label--tick');
      D.addLabel(svg, wrap, 'Recession velocity (km/s)', 8, 14, 'diagram-label--tick diagram-label--right');
    }

    const BOTH = 'Distances from Cepheid variable stars, and speeds from redshift';
    const LINE = 'A straight line through the origin: the further away a galaxy, the faster it is moving away';
    const WIDER = 'Include galaxies over a much wider range of distances';
    const LIGHT = 'Light could have travelled about c × age since the start, so that is roughly how far we can see';
    const ASSUME = 'It assumes the Universe has always expanded at the same rate as today';

    return [
      single('hb-evidence', '16.4', 'Which two measurements, put together, confirmed that the Universe is expanding?', [BOTH, 'Distances from redshift, and speeds from Cepheid variable stars', 'Temperatures from star colours, and sizes from parallax', 'Brightness from magnitudes, and ages from the HR diagram'], BOTH, 'distances to galaxies from Cepheid variables, and recession velocities from redshift, plotted against each other'),
      single('hb-graph', '16.4', 'What does a graph of recession velocity against distance for many galaxies show?', [LINE, 'A horizontal line: all galaxies move at the same speed', 'A line sloping down: nearer galaxies move away faster', 'No pattern at all'], LINE, 'a straight line through the origin: recession velocity is proportional to distance, so the Universe is expanding'),
      numeric('hb-find-v', '16.5', 2, `Use Hubble's law, v = H₀ × d, with H₀ = ${H0} km/s per Mpc. Find the recession velocity of a galaxy ${V_D} Mpc away.`, 'km/s', vAnswer, [
        `v = H₀ × d = ${H0} × ${V_D}`,
        `= ${fmt(vAnswer)} km/s (${accept(vAnswer)})`,
      ]),
      numeric('hb-find-d', '16.5', 2, `Use Hubble's law, v = H₀ × d, with H₀ = ${H0} km/s per Mpc. A galaxy is moving away at ${fmt(D_V)} km/s. How far away is it?`, 'Mpc', dAnswer, [
        `divide both sides by H₀: d = v ÷ H₀ = ${fmt(D_V)} ÷ ${H0}`,
        `= ${fmt(dAnswer)} Mpc (${accept(dAnswer)})`,
      ]),
      numeric('hb-gradient', '16.5', 2, `The graph shows a best-fit line for a set of galaxies. It passes through the origin and the marked point (${G_D} Mpc, ${fmt(G_V)} km/s). Use the gradient to find H₀ in km/s per Mpc.`, 'km/s per Mpc', gAnswer, [
        `gradient = rise ÷ run = ${fmt(G_V)} km/s ÷ ${G_D} Mpc`,
        `H₀ = ${fmt(gAnswer)} km/s per Mpc (${accept(gAnswer, 1)})`,
      ], { render: renderGradientGraph }),
      {
        id: 'hb-uncertainty',
        units: UNITS,
        spec: '16.5',
        marks: 2,
        prompt: `A student's best-fit line gives H₀ = ${U_BEST} km/s per Mpc. The steepest line through every error bar has a gradient of ${U_STEEP} km/s per Mpc and the shallowest ${U_SHALLOW} km/s per Mpc. (a) Find the uncertainty in H₀, as half the range. (b) Find the percentage uncertainty.`,
        fields: [
          { key: 'half', type: 'number', label: '(a) Uncertainty', unitLabel: 'km/s per Mpc' },
          { key: 'percent', type: 'number', label: '(b) Percentage uncertainty', unitLabel: '%' },
        ],
        check(value) {
          const a = within2(value.half, uHalf);
          const b = within2(value.percent, uPercent);
          const got = [a, b].filter(Boolean).length;
          const scheme = markScheme([
            `(a) uncertainty = (steepest − shallowest) ÷ 2 = (${U_STEEP} − ${U_SHALLOW}) ÷ 2 = ±${fmt(uHalf)} km/s per Mpc`,
            `(b) percentage uncertainty = ${fmt(uHalf)} ÷ ${U_BEST} × 100 = ${uPercent.toFixed(1)}% (${accept(uPercent, 1)})`,
          ]);
          return { correct: a && b, message: `${got} out of 2 marks. ${scheme}` };
        },
        answer: { half: uHalf, percent: uPercent },
      },
      single('hb-wider', '16.5', "A student's Hubble graph uses only nearby galaxies, and the error bars are the same size for every galaxy. What would most reduce the percentage uncertainty in the gradient?", [WIDER, 'Use a thicker pencil for the best-fit line', 'Leave out the galaxies whose points are furthest from the line', 'Draw the graph on smaller paper'], WIDER, 'over a wider range of distances (a longer measurement) the same-sized error bars are a smaller fraction of the velocities, so the steepest and shallowest lines are closer together and the percentage uncertainty is smaller'),
      numeric('hb-age', '16.6', 3, `Estimate the age of the Universe as 1 ÷ H₀, for H₀ = ${A_H0} km/s per Mpc. Use 1 Mpc = ${sci(A_MPC_KM, 1)} km and 1 year = ${sci(A_YEAR_S)} s. Give your answer in billions of years.`, 'billion years', aBillion, [
        `change Mpc into km so the km cancel: H₀ = ${A_H0} ÷ (${sci(A_MPC_KM, 1)}) = ${sci(aPerSecond)} per second`,
        `age ≈ 1 ÷ H₀ = 1 ÷ (${sci(aPerSecond)}) = ${sci(aSeconds)} s`,
        `÷ ${sci(A_YEAR_S)} s per year = ${sci(aYears)} years, about ${aBillion.toFixed(1)} billion years (${accept(aBillion, 1)})`,
      ]),
      single('hb-size', '16.6', 'Why is c × (age of the Universe) used to estimate the size of the Universe we can see?', [LIGHT, 'Because galaxies move at the speed of light', 'Because the Universe is exactly as old as it is wide', 'Because c is the Hubble constant in different units'], LIGHT, 'nothing travels faster than light, so light from further away than about c × age has not had time to reach us'),
      single('hb-estimate', '16.6', 'Why is 1 ÷ H₀ only an estimate of the age of the Universe?', [ASSUME, 'Because H₀ has no units', 'Because the Universe is not expanding', 'Because light travels at different speeds in different galaxies'], ASSUME, 'it assumes the expansion rate has always been the same as today, which is not quite true'),
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.HubbleLawQuestions = api;
  }
})();
