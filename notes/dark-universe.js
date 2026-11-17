(function () {
  const U = window.DarkUniverse;
  const GD = window.GalaxyDrawing;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, CURVE, svgEl, clearDiagram, addLabel, panel } = D;

  const CURRICULUM_UNITS = ['u6.4'];

  // ------------------------------------------------------------------
  // 1. The rotation curve
  // ------------------------------------------------------------------

  // Schematic "measured" points: on the flat curve, with error bars.
  const MEASURED_POINTS = [6, 12, 18, 26, 34, 42, 50, 58];
  const POINT_ERR_KMS = 12;

  function drawRotation() {
    const svg = document.getElementById('rotation-graph');
    const wrap = document.getElementById('rotation-graph-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const x0 = 80;
    const x1 = 610;
    const yTop = 60;
    const yBottom = 300;
    const vMax = 300;
    const X = (r) => x0 + (r / U.MAX_KLY) * (x1 - x0);
    const Y = (v) => yBottom - (v / vMax) * (yBottom - yTop);
    for (let r = 0; r <= U.MAX_KLY; r += 10) {
      svgEl('line', { x1: X(r), x2: X(r), y1: yTop, y2: yBottom, stroke: '#2a3550', 'stroke-width': 1 }, svg);
      addLabel(svg, wrap, String(r), X(r), yBottom + 14, 'diagram-label--tick');
    }
    for (let v = 0; v <= vMax; v += 50) {
      svgEl('line', { x1: x0, x2: x1, y1: Y(v), y2: Y(v), stroke: '#2a3550', 'stroke-width': 1 }, svg);
      addLabel(svg, wrap, String(v), x0 - 8, Y(v), 'diagram-label--tick diagram-label--left');
    }
    svgEl('line', { x1: x0, x2: x1, y1: yBottom, y2: yBottom, stroke: MUTED, 'stroke-width': 1.5 }, svg);
    svgEl('line', { x1: x0, x2: x0, y1: yTop, y2: yBottom, stroke: MUTED, 'stroke-width': 1.5 }, svg);
    const path = (fn) => {
      let d = '';
      for (let r = 0.5; r <= U.MAX_KLY; r += 0.5) d += `${d ? 'L' : 'M'}${X(r).toFixed(1)},${Y(fn(r)).toFixed(1)} `;
      return d;
    };
    svgEl('path', { class: 'du-visible-curve', d: path(U.visibleSpeed), fill: 'none', stroke: INK, 'stroke-width': 2.5, 'stroke-dasharray': '8 6' }, svg);
    svgEl('path', { class: 'du-measured-curve', d: path(U.measuredSpeed), fill: 'none', stroke: CURVE, 'stroke-width': 3 }, svg);
    MEASURED_POINTS.forEach((r) => {
      const v = U.measuredSpeed(r);
      svgEl('line', { x1: X(r), x2: X(r), y1: Y(v + POINT_ERR_KMS), y2: Y(v - POINT_ERR_KMS), stroke: CURVE, 'stroke-width': 1.5 }, svg);
      svgEl('circle', { class: 'du-point', cx: X(r), cy: Y(v), r: 4.5, fill: CURVE }, svg);
    });
    const sunX = X(U.SUN_KLY);
    const sunY = Y(U.measuredSpeed(U.SUN_KLY));
    svgEl('circle', { class: 'du-sun', cx: sunX, cy: sunY, r: 9, fill: 'none', stroke: INK, 'stroke-width': 2 }, svg);
    addLabel(svg, wrap, 'Sun', sunX, sunY - 22, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, `measured: flat at about ${U.FLAT_KMS} km/s (solid)`, x1, Y(U.FLAT_KMS) - 58, 'diagram-label--tick diagram-label--strong diagram-label--left');
    addLabel(svg, wrap, 'visible matter alone (dashed)', x1, Y(U.visibleSpeed(U.MAX_KLY)) + 24, 'diagram-label--tick diagram-label--left');
    addLabel(svg, wrap, 'Distance from centre (thousand light-years)', (x0 + x1) / 2, yBottom + 44, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'Orbital speed (km/s)', 8, 20, 'diagram-label--tick diagram-label--strong diagram-label--right');
  }

  // ------------------------------------------------------------------
  // 2. The make-up of the Universe: one bar, three patterns
  // ------------------------------------------------------------------

  function drawMakeUp() {
    const svg = document.getElementById('make-up-bar');
    const wrap = document.getElementById('make-up-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const defs = svgEl('defs', {}, svg);
    const hatch = svgEl('pattern', { id: 'du-hatch', width: 8, height: 8, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    svgEl('rect', { width: 8, height: 8, fill: '#1b2438' }, hatch);
    svgEl('line', { x1: 0, y1: 0, x2: 0, y2: 8, stroke: '#9aa7bd', 'stroke-width': 3 }, hatch);
    const dots = svgEl('pattern', { id: 'du-dots', width: 10, height: 10, patternUnits: 'userSpaceOnUse' }, defs);
    svgEl('rect', { width: 10, height: 10, fill: '#0f1830' }, dots);
    svgEl('circle', { cx: 5, cy: 5, r: 1.6, fill: '#9aa7bd' }, dots);
    const fills = { ordinary: '#ffe08a', 'dark-matter': 'url(#du-hatch)', 'dark-energy': 'url(#du-dots)' };
    const x0 = 30;
    const width = 580;
    const y = 70;
    const h = 56;
    let x = x0;
    U.MAKE_UP.forEach((part, i) => {
      const w = (part.percent / 100) * width;
      svgEl('rect', { class: `du-share du-share-${part.key}`, x, y, width: w, height: h, fill: fills[part.key], stroke: INK, 'stroke-width': 1.5 }, svg);
      const mid = x + w / 2;
      if (i === 0) {
        addLabel(svg, wrap, `${part.name}: about ${part.percent}% (plain)`, x0, y - 26, 'diagram-label--tick diagram-label--strong diagram-label--right');
        svgEl('line', { x1: mid, x2: mid, y1: y - 14, y2: y, stroke: INK, 'stroke-width': 1 }, svg);
      } else {
        // Dark matter's label starts at the bar's left end and dark energy's ends at
        // its right end, so the two never run into each other on a phone.
        if (i === 1) addLabel(svg, wrap, `${part.name}: about ${part.percent}%`, x0, y + h + 22, 'diagram-label--tick diagram-label--strong diagram-label--right');
        else addLabel(svg, wrap, `${part.name}: about ${part.percent}%`, x0 + width, y + h + 22, 'diagram-label--tick diagram-label--strong diagram-label--left');
        addLabel(svg, wrap, i === 1 ? '(stripes)' : '(dots)', mid, y + h + 58, 'diagram-label--tick');
      }
      x += w;
    });
  }

  // ------------------------------------------------------------------
  // 3. Why they are so hard to find
  // ------------------------------------------------------------------

  function arrow(svg, x1, y1, x2, y2, cls, dash) {
    svgEl('line', { class: cls, x1, y1, x2, y2, stroke: CURVE, 'stroke-width': 2, 'stroke-dasharray': dash || '' }, svg);
    const a = Math.atan2(y2 - y1, x2 - x1);
    svgEl('path', { d: `M${x2},${y2} l${(-10 * Math.cos(a - 0.4)).toFixed(1)},${(-10 * Math.sin(a - 0.4)).toFixed(1)} M${x2},${y2} l${(-10 * Math.cos(a + 0.4)).toFixed(1)},${(-10 * Math.sin(a + 0.4)).toFixed(1)}`, stroke: CURVE, 'stroke-width': 2, fill: 'none' }, svg);
  }

  function eye(svg, x, y) {
    svgEl('path', { d: `M${x - 14},${y} Q${x},${y - 12} ${x + 14},${y} Q${x},${y + 12} ${x - 14},${y} Z`, fill: 'none', stroke: INK, 'stroke-width': 2 }, svg);
    svgEl('circle', { cx: x, cy: y, r: 4, fill: INK }, svg);
  }

  function drawDetect() {
    const svg = document.getElementById('detect-diagram');
    const wrap = document.getElementById('detect-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const cols = [107, 320, 533];
    // Star: gives out light.
    svgEl('circle', { class: 'du-star', cx: cols[0], cy: 70, r: 16, fill: '#ffe08a' }, svg);
    arrow(svg, cols[0], 92, cols[0], 150, 'du-light');
    eye(svg, cols[0], 168);
    addLabel(svg, wrap, 'a star', cols[0], 24, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'gives out light', cols[0], 206, 'diagram-label--tick');
    // Gas cloud: absorbs light from behind.
    svgEl('circle', { cx: cols[1], cy: 50, r: 9, fill: '#ffe08a' }, svg);
    svgEl('ellipse', { class: 'du-cloud', cx: cols[1], cy: 100, rx: 50, ry: 20, fill: '#9aa7bd', opacity: 0.55 }, svg);
    arrow(svg, cols[1], 62, cols[1], 82, 'du-light');
    arrow(svg, cols[1], 122, cols[1], 150, 'du-light', '3 4');
    eye(svg, cols[1], 168);
    addLabel(svg, wrap, 'a gas cloud', cols[1], 24, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'absorbs some light', cols[1], 206, 'diagram-label--tick');
    // Dark matter: invisible; only bends light by gravity.
    GD.drawGalaxy(svg, { kind: 'elliptical', e: 2 }, cols[2], 48, 10).classList.add('du-far-galaxy');
    svgEl('circle', { class: 'du-dark-matter', cx: cols[2], cy: 102, r: 26, fill: 'none', stroke: MUTED, 'stroke-width': 1.5, 'stroke-dasharray': '3 5' }, svg);
    svgEl('path', { class: 'du-bent-light', d: `M${cols[2] - 6},58 Q${cols[2] - 44},102 ${cols[2] - 8},150`, fill: 'none', stroke: CURVE, 'stroke-width': 2 }, svg);
    svgEl('path', { class: 'du-bent-light', d: `M${cols[2] + 6},58 Q${cols[2] + 44},102 ${cols[2] + 8},150`, fill: 'none', stroke: CURVE, 'stroke-width': 2 }, svg);
    eye(svg, cols[2], 168);
    addLabel(svg, wrap, 'dark matter', cols[2], 24, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'no light: only gravity,', cols[2], 206, 'diagram-label--tick');
    addLabel(svg, wrap, 'which bends light', cols[2], 232, 'diagram-label--tick');
  }

  // ------------------------------------------------------------------
  // 4. Possible futures
  // ------------------------------------------------------------------

  const DASH = { crunch: '2 5', stop: '10 5', forever: '4 4', speeding: '' };
  let chosen = U.FAVOURED;

  function drawFutures() {
    const svg = document.getElementById('future-graph');
    const wrap = document.getElementById('future-graph-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const x0 = 70;
    const x1 = 610;
    const yTop = 60;
    const yBottom = 320;
    const tMin = -15;
    const tMax = 45;
    const aMax = 4;
    const X = (t) => x0 + ((t - tMin) / (tMax - tMin)) * (x1 - x0);
    const Y = (a) => yBottom - (Math.min(a, aMax) / aMax) * (yBottom - yTop);
    for (let t = -10; t <= tMax; t += 10) {
      svgEl('line', { x1: X(t), x2: X(t), y1: yTop, y2: yBottom, stroke: '#2a3550', 'stroke-width': 1 }, svg);
      addLabel(svg, wrap, String(t), X(t), yBottom + 14, 'diagram-label--tick');
    }
    for (let a = 0; a <= aMax; a += 1) {
      svgEl('line', { x1: x0, x2: x1, y1: Y(a), y2: Y(a), stroke: '#2a3550', 'stroke-width': 1 }, svg);
      addLabel(svg, wrap, String(a), x0 - 8, Y(a), 'diagram-label--tick diagram-label--left');
    }
    svgEl('line', { x1: X(0), x2: X(0), y1: yTop, y2: yBottom, stroke: INK, 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }, svg);
    addLabel(svg, wrap, 'today', X(0) + 8, Y(2.6), 'diagram-label--tick diagram-label--strong diagram-label--right');
    U.FUTURES.forEach((f) => {
      const pts = U.futureCurve(f.key, tMax).filter((p) => p.tGyr >= tMin && p.a <= aMax * 1.02);
      const on = f.key === chosen;
      svgEl('path', {
        class: `du-future du-future-${f.key}${on ? ' du-future-chosen' : ''}`,
        d: pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.tGyr).toFixed(1)},${Y(p.a).toFixed(1)}`).join(' '),
        fill: 'none',
        stroke: on ? CURVE : MUTED,
        'stroke-width': on ? 4 : 1.5,
        'stroke-dasharray': DASH[f.key],
        opacity: on ? 1 : 0.7,
      }, svg);
    });
    svgEl('circle', { cx: X(0), cy: Y(1), r: 5, fill: INK }, svg);
    const f = U.FUTURES.find((x) => x.key === chosen);
    addLabel(svg, wrap, `${f.name} (bold)`, x1, yTop + 14, 'diagram-label--tick diagram-label--strong diagram-label--left');
    addLabel(svg, wrap, 'Time from now (billion years)', (x0 + x1) / 2, yBottom + 44, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'Size of the Universe (today = 1)', 8, 20, 'diagram-label--tick diagram-label--strong diagram-label--right');
    svg.dataset.future = chosen;
    const end = U.futureCurve(chosen, tMax).slice(-1)[0];
    document.getElementById('future-readout').textContent =
      `${f.name}: ${f.balance}. Today the expansion is ${U.todayTrend(chosen)}; ` +
      (end.a === 0 ? `in this model it stops and collapses back to nothing about ${Math.round(end.tGyr)} billion years from now.` : `in ${tMax} billion years this model is about ${end.a.toFixed(1)} times today's size.`) +
      (chosen === U.FAVOURED ? ' This is the future current measurements favour.' : '');
    document.querySelectorAll('.du-future-buttons button').forEach((b) => {
      const on2 = b.dataset.future === chosen;
      b.classList.toggle('preset-button-active', on2);
      b.setAttribute('aria-pressed', String(on2));
    });
  }

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }

  drawRotation();
  drawMakeUp();
  drawDetect();
  document.querySelectorAll('.du-future-buttons button').forEach((b) =>
    b.addEventListener('click', () => {
      chosen = b.dataset.future;
      drawFutures();
    }),
  );
  drawFutures();
  renderCoverage();
  QuizUI.mount(DarkUniverseQuestions.makeQuestions(U));
})();
