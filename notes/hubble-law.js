(function () {
  const H = window.HubbleLaw;
  const GD = window.GalaxyDrawing;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, CURVE, svgEl, clearDiagram, addLabel, panel, makeScale, drawStrip } = D;

  const CURRICULUM_UNITS = ['u6.2'];

  function fmt(n, digits = 0) {
    return n.toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  /** 3.1 × 10¹⁹ style, with a real minus sign for negative powers. */
  function sci(x, digits = 2) {
    const exp = Math.floor(Math.log10(Math.abs(x)));
    const mant = x / 10 ** exp;
    const sup = String(Math.abs(exp)).split('').map((d) => SUP[Number(d)]).join('');
    return `${mant.toFixed(digits)} × 10${exp < 0 ? '⁻' : ''}${sup}`;
  }

  // ------------------------------------------------------------------
  // 1. Evidence: further galaxies, bigger redshift, a straight line
  // ------------------------------------------------------------------

  const EVIDENCE = [
    { d: 20, r: 34 },
    { d: 60, r: 24 },
    { d: 120, r: 15 },
  ];

  function drawEvidence() {
    const svg = document.getElementById('evidence-diagram');
    const wrap = document.getElementById('evidence-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const minNm = 640;
    const maxNm = 690;
    const sx0 = 110;
    const sx1 = 330;
    const xFor = makeScale(sx0, sx1, minNm, maxNm);
    EVIDENCE.forEach((row, k) => {
      const y = 45 + k * 95;
      const v = H.velocity(row.d);
      const observed = 656.3 * (1 + v / H.C_KM_PER_S);
      GD.drawGalaxy(svg, { kind: 'spiral', sub: 'b', tilt: 0.4, angle: -15 + 20 * k }, 55, y, row.r).classList.add('hb-evidence-galaxy');
      addLabel(svg, wrap, `${row.d} Mpc`, 55, y + 38, 'diagram-label--tick diagram-label--strong');
      drawStrip(svg, { x0: sx0, x1: sx1, y: y - 14, h: 28, type: 'absorption', lines: [{ nm: observed, depth: 0.9 }], minNm, maxNm, step: 0.25, widthNm: 0.5 });
      const xl = xFor(656.3);
      svgEl('line', { class: 'hb-lab-mark', x1: xl, x2: xl, y1: y - 20, y2: y + 20, stroke: INK, 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }, svg);
      const xo = xFor(observed);
      svgEl('line', { x1: xl, x2: xo, y1: y + 24, y2: y + 24, stroke: CURVE, 'stroke-width': 2 }, svg);
      svgEl('polygon', { points: `${xo},${y + 24} ${xo - 7},${y + 20} ${xo - 7},${y + 28}`, fill: CURVE }, svg);
      addLabel(svg, wrap, `${fmt(Math.round(v))} km/s`, (sx0 + sx1) / 2, y + 38, 'diagram-label--tick diagram-label--strong');
    });

    // Mini graph.
    const gx0 = 420;
    const gx1 = 610;
    const gy0 = 250;
    const gy1 = 80;
    const dMax = 140;
    const vMax = 10000;
    const X = (d) => gx0 + (d / dMax) * (gx1 - gx0);
    const Y = (v) => gy0 - (v / vMax) * (gy0 - gy1);
    svgEl('line', { x1: gx0, x2: gx1, y1: gy0, y2: gy0, stroke: MUTED, 'stroke-width': 1.5 }, svg);
    svgEl('line', { x1: gx0, x2: gx0, y1: gy0, y2: gy1, stroke: MUTED, 'stroke-width': 1.5 }, svg);
    svgEl('line', { class: 'hb-evidence-line', x1: X(0), y1: Y(0), x2: X(dMax), y2: Y(H.velocity(dMax)), stroke: CURVE, 'stroke-width': 2 }, svg);
    EVIDENCE.forEach((row) => svgEl('circle', { class: 'hb-evidence-point', cx: X(row.d), cy: Y(H.velocity(row.d)), r: 6, fill: INK }, svg));
    addLabel(svg, wrap, 'Distance (Mpc)', (gx0 + gx1) / 2, gy0 + 18, 'diagram-label--tick');
    addLabel(svg, wrap, 'Recession', gx0 - 6, gy1 - 50, 'diagram-label--tick diagram-label--right');
    addLabel(svg, wrap, 'velocity (km/s)', gx0 - 6, gy1 - 18, 'diagram-label--tick diagram-label--right');
  }

  // ------------------------------------------------------------------
  // 2. The Hubble graph: fit a line, find H0 and its uncertainty
  // ------------------------------------------------------------------

  const graph = document.getElementById('hubble-graph');
  const graphWrap = document.getElementById('hubble-graph-wrap');
  const slider = document.getElementById('hb-gradient');
  const PLOT = { x0: 90, x1: 610, yTop: 56, yBottom: 370 };
  const LINES = {
    best: { name: 'Best-fit line', dash: '', width: 2.5, text: 'best fit' },
    steep: { name: 'Steepest line', dash: '9 6', width: 2, text: 'steepest' },
    shallow: { name: 'Shallowest line', dash: '2 5', width: 2.5, text: 'shallowest' },
  };
  const state = { set: 'wide', active: 'best', gradients: { best: 60, steep: 90, shallow: 40 } };

  // A script-set range value must sit on the slider's 0.5 step grid.
  const onGrid = (g) => Math.min(150, Math.max(20, Math.round(g * 2) / 2));

  function scales() {
    const { axis } = H.DATA_SETS[state.set];
    const X = (d) => PLOT.x0 + (d / axis.maxDistanceMpc) * (PLOT.x1 - PLOT.x0);
    const Y = (v) => PLOT.yBottom - (v / axis.maxVelocityKmS) * (PLOT.yBottom - PLOT.yTop);
    return { axis, X, Y };
  }

  /** Where the line v = g × d leaves the plot (top edge or right edge). */
  function lineEnd(g, axis) {
    const dAtTop = axis.maxVelocityKmS / g;
    return dAtTop <= axis.maxDistanceMpc ? { d: dAtTop, v: axis.maxVelocityKmS } : { d: axis.maxDistanceMpc, v: g * axis.maxDistanceMpc };
  }

  function drawGraph() {
    clearDiagram(graph, graphWrap);
    panel(graph);
    const { axis, X, Y } = scales();
    const galaxies = H.DATA_SETS[state.set].galaxies;

    for (let d = 0; d <= axis.maxDistanceMpc; d += axis.distanceStep) {
      svgEl('line', { x1: X(d), x2: X(d), y1: PLOT.yTop, y2: PLOT.yBottom, stroke: '#2a3550', 'stroke-width': 1 }, graph);
      addLabel(graph, graphWrap, String(d), X(d), PLOT.yBottom + 14, 'diagram-label--tick');
    }
    for (let v = 0; v <= axis.maxVelocityKmS; v += axis.velocityStep) {
      svgEl('line', { x1: PLOT.x0, x2: PLOT.x1, y1: Y(v), y2: Y(v), stroke: '#2a3550', 'stroke-width': 1 }, graph);
      addLabel(graph, graphWrap, fmt(v), PLOT.x0 - 8, Y(v), 'diagram-label--tick diagram-label--left');
    }
    svgEl('line', { x1: PLOT.x0, x2: PLOT.x1, y1: PLOT.yBottom, y2: PLOT.yBottom, stroke: MUTED, 'stroke-width': 1.5 }, graph);
    svgEl('line', { x1: PLOT.x0, x2: PLOT.x0, y1: PLOT.yTop, y2: PLOT.yBottom, stroke: MUTED, 'stroke-width': 1.5 }, graph);
    addLabel(graph, graphWrap, 'Distance (Mpc)', (PLOT.x0 + PLOT.x1) / 2, PLOT.yBottom + 50, 'diagram-label--tick diagram-label--strong');
    addLabel(graph, graphWrap, 'Recession velocity (km/s)', 8, 16, 'diagram-label--tick diagram-label--strong diagram-label--right');

    galaxies.forEach((g) => {
      const x = X(g.distanceMpc);
      const yTop = Y(g.velocityKmS + g.errorKmS);
      const yBot = Y(g.velocityKmS - g.errorKmS);
      svgEl('line', { class: 'hb-error-bar', x1: x, x2: x, y1: yTop, y2: yBot, stroke: INK, 'stroke-width': 1.5 }, graph);
      svgEl('line', { x1: x - 5, x2: x + 5, y1: yTop, y2: yTop, stroke: INK, 'stroke-width': 1.5 }, graph);
      svgEl('line', { x1: x - 5, x2: x + 5, y1: yBot, y2: yBot, stroke: INK, 'stroke-width': 1.5 }, graph);
      svgEl('circle', { class: 'hb-point', cx: x, cy: Y(g.velocityKmS), r: 4.5, fill: INK }, graph);
    });

    Object.entries(LINES).forEach(([key, line]) => {
      const g = state.gradients[key];
      const end = lineEnd(g, axis);
      const active = key === state.active;
      svgEl('line', {
        class: `hb-line hb-line-${key}${active ? ' hb-line-active' : ''}`,
        x1: X(0), y1: Y(0), x2: X(end.d), y2: Y(end.v),
        stroke: CURVE, 'stroke-width': active ? line.width + 2 : line.width, 'stroke-dasharray': line.dash, opacity: active ? 1 : 0.7,
      }, graph);
      if (active) svgEl('circle', { class: 'hb-handle', cx: X(end.d), cy: Y(end.v), r: 9, fill: 'none', stroke: CURVE, 'stroke-width': 3 }, graph);
    });
    // Key, top left (above every line): line style, not colour, tells
    // the three lines apart.
    Object.entries(LINES).forEach(([key, line], k) => {
      const y = PLOT.yTop + 22 + k * 34;
      const active = key === state.active;
      svgEl('line', { class: `hb-key hb-key-${key}`, x1: PLOT.x0 + 12, x2: PLOT.x0 + 52, y1: y, y2: y, stroke: CURVE, 'stroke-width': active ? line.width + 2 : line.width, 'stroke-dasharray': line.dash }, graph);
      addLabel(graph, graphWrap, line.text, PLOT.x0 + 60, y, `diagram-label--tick diagram-label--right${active ? ' diagram-label--strong' : ''}`);
    });
    graph.dataset.set = state.set;
    graph.dataset.active = state.active;
    graph.dataset.gradient = String(state.gradients[state.active]);
    updateReadouts();
  }

  function passText(g) {
    return H.passesAllBars(H.DATA_SETS[state.set].galaxies, g) ? 'passes through every error bar' : 'misses at least one error bar';
  }

  function updateReadouts() {
    const { best, steep, shallow } = state.gradients;
    document.getElementById('hb-best-readout').textContent = `${best.toFixed(1)} km/s per Mpc (${passText(best)})`;
    document.getElementById('hb-steep-readout').textContent = `${steep.toFixed(1)} km/s per Mpc (${passText(steep)})`;
    document.getElementById('hb-shallow-readout').textContent = `${shallow.toFixed(1)} km/s per Mpc (${passText(shallow)})`;
    const u = H.uncertainty(steep, shallow, best);
    document.getElementById('hb-uncertainty-readout').textContent = steep >= shallow
      ? `(${steep.toFixed(1)} − ${shallow.toFixed(1)}) ÷ 2 = ±${u.half.toFixed(1)} km/s per Mpc, which is ±${u.percent.toFixed(0)}% of ${best.toFixed(1)}`
      : 'Make the steepest line steeper than the shallowest one first.';
    const age = H.ageSteps(best);
    document.getElementById('hb-your-age').textContent =
      `With your best-fit H₀ of ${best.toFixed(1)} km/s per Mpc, the same steps give an age of about ${age.billionYears.toFixed(1)} billion years.`;
  }

  function setActive(key) {
    state.active = key;
    slider.value = String(onGrid(state.gradients[key]));
    document.getElementById('hb-gradient-label').textContent = LINES[key].name;
    document.querySelectorAll('.hb-line-buttons button').forEach((b) => {
      const on = b.dataset.line === key;
      b.classList.toggle('preset-button-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    drawGraph();
  }

  function setDataSet(key) {
    state.set = key;
    document.querySelectorAll('.hb-set-buttons button').forEach((b) => {
      const on = b.dataset.set === key;
      b.classList.toggle('preset-button-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    drawGraph();
  }

  function setGradient(g) {
    state.gradients[state.active] = onGrid(g);
    slider.value = String(state.gradients[state.active]);
    drawGraph();
  }

  function pointerToGradient(evt) {
    const rect = graph.getBoundingClientRect();
    const vb = graph.viewBox.baseVal;
    const x = ((evt.clientX - rect.left) / rect.width) * vb.width;
    const y = ((evt.clientY - rect.top) / rect.height) * vb.height;
    const { axis } = scales();
    const d = ((x - PLOT.x0) / (PLOT.x1 - PLOT.x0)) * axis.maxDistanceMpc;
    const v = ((PLOT.yBottom - y) / (PLOT.yBottom - PLOT.yTop)) * axis.maxVelocityKmS;
    if (d <= axis.maxDistanceMpc * 0.05 || v <= 0) return null;
    return v / d;
  }

  let dragging = false;
  graph.addEventListener('pointerdown', (evt) => {
    const g = pointerToGradient(evt);
    if (g === null) return;
    dragging = true;
    graph.setPointerCapture(evt.pointerId);
    setGradient(g);
  });
  graph.addEventListener('pointermove', (evt) => {
    if (!dragging) return;
    const g = pointerToGradient(evt);
    if (g !== null) setGradient(g);
  });
  ['pointerup', 'pointercancel'].forEach((type) => graph.addEventListener(type, () => { dragging = false; }));

  function showReasonableLines() {
    const galaxies = H.DATA_SETS[state.set].galaxies;
    const r = H.gradientRange(galaxies);
    // Steepest rounded down and shallowest rounded up, so both still pass
    // through every error bar on the slider's 0.5 grid.
    state.gradients = {
      best: onGrid(H.bestGradient(galaxies)),
      steep: Math.floor(r.steepest * 2) / 2,
      shallow: Math.ceil(r.shallowest * 2) / 2,
    };
    slider.value = String(state.gradients[state.active]);
    drawGraph();
  }

  function fillLawExamples() {
    const h0 = H.H0;
    document.getElementById('hb-h0-value').textContent = `H₀ = ${h0} km/s per Mpc`;
    const items = [
      `A galaxy 120 Mpc away: v = H₀ × d = ${h0} × 120 = ${fmt(H.velocity(120))} km/s.`,
      `A galaxy moving away at ${fmt(H.velocity(150))} km/s: d = v ÷ H₀ = ${fmt(H.velocity(150))} ÷ ${h0} = ${fmt(H.distance(H.velocity(150)))} Mpc.`,
    ];
    const list = document.getElementById('hb-law-examples');
    list.textContent = '';
    items.forEach((t) => {
      const li = document.createElement('li');
      li.textContent = t;
      list.appendChild(li);
    });
  }

  // ------------------------------------------------------------------
  // 3. Age and size
  // ------------------------------------------------------------------

  function fillAgeSteps() {
    const a = H.ageSteps();
    const pc = H.PARSEC_KM;
    const steps = [
      `1 Mpc = 1,000,000 pc = 1,000,000 × ${sci(pc, 1)} km = ${sci(a.mpcKm, 1)} km (data sheet parsec).`,
      `H₀ = ${a.h0} km/s per Mpc = ${a.h0} ÷ (${sci(a.mpcKm, 1)}) per second = ${sci(a.perSecond)} per second: the km cancel.`,
      `Age ≈ 1 ÷ H₀ = 1 ÷ (${sci(a.perSecond)}) = ${sci(a.seconds)} s.`,
      `1 year = 365 × 24 × 3600 s = ${sci(a.secondsPerYear)} s, so age ≈ ${sci(a.seconds)} ÷ ${sci(a.secondsPerYear)} = ${sci(a.years)} years: about ${a.billionYears.toFixed(1)} billion years.`,
    ];
    const list = document.getElementById('hb-age-steps');
    list.textContent = '';
    steps.forEach((t) => {
      const li = document.createElement('li');
      li.textContent = t;
      list.appendChild(li);
    });
    document.getElementById('hb-size-value').textContent = `about ${H.sizeEstimate().billionLightYears.toFixed(1)} billion light-years`;
  }

  function drawRewind() {
    const svg = document.getElementById('rewind-diagram');
    const wrap = document.getElementById('rewind-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const offsets = [[0, 0], [-60, -40], [55, -45], [-70, 40], [65, 35], [5, 62], [-10, -70]];
    const panels = [
      { cx: 110, scale: 1, title: 'today' },
      { cx: 320, scale: 0.5, title: 'earlier' },
      { cx: 530, scale: 0, title: 'the start' },
    ];
    panels.forEach((p, k) => {
      const cy = 110;
      if (p.scale === 0) {
        svgEl('circle', { class: 'hb-start', cx: p.cx, cy, r: 14, fill: '#ffe08a', opacity: 0.35 }, svg);
        svgEl('circle', { cx: p.cx, cy, r: 6, fill: '#fff6d0' }, svg);
      } else {
        offsets.forEach(([dx, dy], i) => {
          const x = p.cx + dx * p.scale;
          const y = cy + dy * p.scale;
          GD.drawGalaxy(svg, { kind: i % 3 === 0 ? 'elliptical' : 'spiral', sub: 'b', tilt: 0.3, angle: 30 * i, e: 3 }, x, y, 9).classList.add('hb-rewind-galaxy');
          if (i === 0) svgEl('circle', { class: 'hb-us', cx: x, cy: y, r: 14, fill: 'none', stroke: INK, 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }, svg);
          if (i > 0 && p.scale === 1) {
            const len = Math.hypot(dx, dy);
            const ux = dx / len;
            const uy = dy / len;
            svgEl('line', { x1: x + ux * 12, y1: y + uy * 12, x2: x + ux * 28, y2: y + uy * 28, stroke: CURVE, 'stroke-width': 2 }, svg);
          }
        });
      }
      addLabel(svg, wrap, p.title, p.cx, 202, 'diagram-label--tick diagram-label--strong');
      if (k < 2) addLabel(svg, wrap, '→', p.cx + 105, 110, 'diagram-label--tick diagram-label--strong');
    });
    addLabel(svg, wrap, 'us (ringed)', 110, 145, 'diagram-label--tick');
    addLabel(svg, wrap, 'back in time →', 320, 240, 'diagram-label--tick');
  }

  function drawSize() {
    const svg = document.getElementById('size-diagram');
    const wrap = document.getElementById('size-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const cx = 170;
    const cy = 140;
    const R = 112;
    const rand = (() => { let s = 11; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; })();
    for (let i = 0; i < 40; i += 1) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * (R - 8);
      svgEl('circle', { cx: (cx + r * Math.cos(a)).toFixed(1), cy: (cy + r * Math.sin(a)).toFixed(1), r: 1.6, fill: '#c9d6ff', opacity: 0.8 }, svg);
    }
    svgEl('circle', { class: 'hb-horizon', cx, cy, r: R, fill: 'none', stroke: CURVE, 'stroke-width': 2, 'stroke-dasharray': '7 6' }, svg);
    GD.drawGalaxy(svg, { kind: 'spiral', sub: 'b', tilt: 0.2 }, cx, cy, 16).classList.add('hb-milky-way');
    svgEl('line', { class: 'hb-radius', x1: cx + 18, y1: cy, x2: cx + R, y2: cy, stroke: INK, 'stroke-width': 2 }, svg);
    svgEl('polygon', { points: `${cx + R},${cy} ${cx + R - 9},${cy - 5} ${cx + R - 9},${cy + 5}`, fill: INK }, svg);
    addLabel(svg, wrap, 'c × age', cx + R / 2 + 10, cy - 14, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'our Galaxy', cx, cy + 30, 'diagram-label--tick');
    const size = H.sizeEstimate();
    const tx = 320;
    addLabel(svg, wrap, 'how far light could', tx, 40, 'diagram-label--tick diagram-label--right');
    addLabel(svg, wrap, 'have travelled since', tx, 72, 'diagram-label--tick diagram-label--right');
    addLabel(svg, wrap, 'the start:', tx, 104, 'diagram-label--tick diagram-label--right');
    addLabel(svg, wrap, `about ${size.billionLightYears.toFixed(1)} billion`, tx, 144, 'diagram-label--tick diagram-label--strong diagram-label--right');
    addLabel(svg, wrap, 'light-years', tx, 176, 'diagram-label--tick diagram-label--strong diagram-label--right');
    addLabel(svg, wrap, `(${sci(size.km)} km)`, tx, 214, 'diagram-label--tick diagram-label--right');
  }

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }

  drawEvidence();
  fillLawExamples();
  document.querySelectorAll('.hb-set-buttons button').forEach((b) => b.addEventListener('click', () => setDataSet(b.dataset.set)));
  document.querySelectorAll('.hb-line-buttons button').forEach((b) => b.addEventListener('click', () => setActive(b.dataset.line)));
  slider.addEventListener('input', () => setGradient(Number(slider.value)));
  document.getElementById('hb-show-lines').addEventListener('click', showReasonableLines);
  setActive('best');
  fillAgeSteps();
  drawRewind();
  drawSize();
  renderCoverage();
  Glossary.init({
    megaparsec:
      `A megaparsec (Mpc): a million parsecs, about ${window.SpecData.CONSTANTS.parsecLightYears} million light-years. More on the parsec on Parallax.`,
    hubbleConstant:
      "The Hubble constant (H₀): how fast galaxies recede for each megaparsec of distance, the gradient of a graph of recession velocity against distance.",
  });
  QuizUI.mount(HubbleLawQuestions.makeQuestions(H));
})();
