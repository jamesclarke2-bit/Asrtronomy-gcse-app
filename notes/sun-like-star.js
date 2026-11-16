(function () {
  const L = window.SunLikeStar;
  const H = window.HrDiagram;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, svgEl, clearDiagram, addLabel, panel } = D;

  const CURRICULUM_UNITS = ['u4.14'];
  const state = { stage: 'main-sequence' };

  function seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function starfield(svg, w, h, n, seed) {
    const rand = seeded(seed);
    for (let i = 0; i < n; i += 1) svgEl('circle', { cx: (6 + rand() * (w - 12)).toFixed(1), cy: (6 + rand() * (h - 12)).toFixed(1), r: 0.8, fill: '#fff', opacity: 0.35 }, svg);
  }

  function el(tag, text, attrs = {}) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
  }

  function glowDefs(svg) {
    const defs = svgEl('defs', {}, svg);
    [['sl-glow-yellow', '#fff2b0', '#ffd34d'], ['sl-glow-red', '#ffb38a', '#d9472b'], ['sl-glow-white', '#ffffff', '#cfe0ff'], ['sl-glow-pink', '#ffd0e0', '#c86a9a']].forEach(([id, inner, outer]) => {
      const g = svgEl('radialGradient', { id }, defs);
      svgEl('stop', { offset: '0%', 'stop-color': inner }, g);
      svgEl('stop', { offset: '100%', 'stop-color': outer }, g);
    });
    return defs;
  }

  function arrow(svg, x1, y1, x2, y2, cls, dash) {
    svgEl('line', { class: cls, x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1), stroke: INK, 'stroke-width': 3, 'stroke-dasharray': dash || 'none' }, svg);
    const a = Math.atan2(y2 - y1, x2 - x1);
    svgEl('path', { class: cls, d: `M${x2.toFixed(1)},${y2.toFixed(1)} L${(x2 - 11 * Math.cos(a - 0.45)).toFixed(1)},${(y2 - 11 * Math.sin(a - 0.45)).toFixed(1)} M${x2.toFixed(1)},${y2.toFixed(1)} L${(x2 - 11 * Math.cos(a + 0.45)).toFixed(1)},${(y2 - 11 * Math.sin(a + 0.45)).toFixed(1)}`, stroke: INK, 'stroke-width': 3, fill: 'none' }, svg);
  }

  // ------------------------------------------------------------------
  // 1. Seven stages
  // ------------------------------------------------------------------

  function drawStage() {
    const svg = document.getElementById('stage-diagram');
    const wrap = document.getElementById('stage-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    glowDefs(svg);
    starfield(svg, 640, 320, 60, 51);
    const id = state.stage;
    const c = { x: 320, y: 150 };
    if (id === 'nebula') {
      [[0, 0, 110, 70, 0.35], [-30, -10, 80, 50, 0.35], [26, 14, 60, 40, 0.45]].forEach(([dx, dy, rx, ry, op]) => svgEl('ellipse', { class: 'sl-emission', cx: 180 + dx, cy: c.y + dy, rx, ry, fill: 'url(#sl-glow-pink)', opacity: op }, svg));
      [[170, 140], [196, 162], [150, 160]].forEach(([x, y]) => svgEl('circle', { cx: x, cy: y, r: 2.5, fill: '#fff' }, svg));
      svgEl('rect', { x: 380, y: 60, width: 200, height: 180, rx: 30, fill: '#cfe3ff', opacity: 0.18 }, svg);
      svgEl('path', { class: 'sl-absorption', d: 'M410,210 C400,150 440,90 480,110 C520,70 560,120 545,170 C560,210 500,235 460,225 C440,240 415,230 410,210 Z', fill: '#05070d' }, svg);
      addLabel(svg, wrap, 'emission nebula', 180, 244, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'glowing gas', 180, 278, 'diagram-label--tick');
      addLabel(svg, wrap, 'absorption nebula', 480, 244, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'dark dust', 480, 278, 'diagram-label--tick');
    } else if (id === 'protostar') {
      svgEl('ellipse', { cx: c.x, cy: c.y, rx: 150, ry: 95, fill: '#6b5a4a', opacity: 0.45 }, svg);
      [0, 1, 2, 3, 4, 5, 6, 7].forEach((k) => {
        const a = (k / 8) * Math.PI * 2;
        arrow(svg, c.x + 135 * Math.cos(a), c.y + 85 * Math.sin(a), c.x + 70 * Math.cos(a), c.y + 45 * Math.sin(a), 'sl-collapse');
      });
      svgEl('circle', { class: 'sl-star', cx: c.x, cy: c.y, r: 26, fill: 'url(#sl-glow-red)' }, svg);
      addLabel(svg, wrap, 'cloud collapsing inward', c.x, 270, 'diagram-label--tick');
      addLabel(svg, wrap, 'protostar', c.x, c.y, 'diagram-label--tick diagram-label--strong');
    } else if (id === 'main-sequence') {
      svgEl('circle', { cx: c.x, cy: c.y, r: 72, fill: '#ffd34d', opacity: 0.18 }, svg);
      svgEl('circle', { class: 'sl-star', cx: c.x, cy: c.y, r: 54, fill: 'url(#sl-glow-yellow)' }, svg);
      addLabel(svg, wrap, 'a steady, yellow star like the Sun', c.x, 260, 'diagram-label--tick diagram-label--strong');
    } else if (id === 'red-giant') {
      svgEl('circle', { class: 'sl-star', cx: c.x, cy: 190, r: 150, fill: 'url(#sl-glow-red)', opacity: 0.9 }, svg);
      svgEl('circle', { class: 'sl-core', cx: c.x, cy: 190, r: 6, fill: '#fff' }, svg);
      addLabel(svg, wrap, 'swollen, cool outer layers', c.x, 70, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'small, hot, shrinking core', c.x, 216, 'diagram-label--tick');
    } else if (id === 'planetary-nebula') {
      svgEl('ellipse', { class: 'sl-shell', cx: c.x, cy: c.y, rx: 120, ry: 92, fill: 'none', stroke: 'url(#sl-glow-pink)', 'stroke-width': 34, opacity: 0.8 }, svg);
      svgEl('ellipse', { cx: c.x, cy: c.y, rx: 100, ry: 74, fill: '#cfe3ff', opacity: 0.12 }, svg);
      svgEl('circle', { class: 'sl-core', cx: c.x, cy: c.y, r: 5, fill: '#fff' }, svg);
      addLabel(svg, wrap, 'glowing shell of gas drifting away', c.x, 286, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'hot core', c.x, c.y + 22, 'diagram-label--tick');
    } else if (id === 'white-dwarf') {
      svgEl('circle', { cx: 220, cy: c.y, r: 22, fill: '#cfe0ff', opacity: 0.2 }, svg);
      svgEl('circle', { class: 'sl-star', cx: 220, cy: c.y, r: 9, fill: 'url(#sl-glow-white)' }, svg);
      svgEl('circle', { cx: 420, cy: c.y, r: 9, fill: '#3d7bd6' }, svg);
      addLabel(svg, wrap, 'white dwarf', 220, c.y + 36, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'the Earth, for size', 420, c.y + 36, 'diagram-label--tick');
      addLabel(svg, wrap, 'hot, but tiny and dim', 320, 270, 'diagram-label--tick');
    } else {
      svgEl('circle', { class: 'sl-star', cx: c.x, cy: c.y, r: 9, fill: '#15161c', stroke: '#5a5f70', 'stroke-width': 1.5 }, svg);
      addLabel(svg, wrap, 'black dwarf: cold and dark', c.x, c.y + 36, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'none exists yet', c.x, 270, 'diagram-label--tick');
    }
    addLabel(svg, wrap, 'not to scale', 16, 20, 'diagram-label--tick diagram-label--right');
    svg.dataset.stage = id;
    const k = L.STAGES.findIndex((s) => s.id === id);
    const s = L.STAGES[k];
    document.getElementById('stage-readout').textContent = `Stage ${k + 1} of ${L.STAGES.length}: ${s.name}. How long: ${s.time}. The core: ${s.core}`;
  }

  // ------------------------------------------------------------------
  // 2. What holds a star steady
  // ------------------------------------------------------------------

  const BALANCE_RADIUS = { nebula: 62, protostar: 58, 'main-sequence': 52, 'red-giant': 68, 'planetary-nebula': 46, 'white-dwarf': 30, 'black-dwarf': 30 };
  const BALANCE_FILL = { nebula: '#6b5a4a', protostar: 'url(#sl-glow-red)', 'main-sequence': 'url(#sl-glow-yellow)', 'red-giant': 'url(#sl-glow-red)', 'planetary-nebula': 'url(#sl-glow-white)', 'white-dwarf': 'url(#sl-glow-white)', 'black-dwarf': '#15161c' };

  function drawBalance() {
    const svg = document.getElementById('balance-diagram');
    const wrap = document.getElementById('balance-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    glowDefs(svg);
    const s = L.stage(state.stage);
    const b = s.balance;
    const c = { x: 136, y: 150 };
    const R = BALANCE_RADIUS[s.id];
    svgEl('circle', { class: 'sl-balance-star', cx: c.x, cy: c.y, r: R, fill: BALANCE_FILL[s.id], stroke: '#5a5f70', 'stroke-width': 1 }, svg);
    const LEN = 40;
    // Gravity: solid arrows from outside, pointing inward.
    [45, 135, 225, 315].forEach((deg) => {
      const a = (deg * Math.PI) / 180;
      const start = R + 12 + LEN * b.in;
      arrow(svg, c.x + start * Math.cos(a), c.y + start * Math.sin(a), c.x + (R + 6) * Math.cos(a), c.y + (R + 6) * Math.sin(a), 'sl-arrow-in');
    });
    // The pressure: dashed arrows from the surface, pointing outward.
    [0, 90, 180, 270].forEach((deg) => {
      const a = (deg * Math.PI) / 180;
      arrow(svg, c.x + (R - 4) * Math.cos(a), c.y + (R - 4) * Math.sin(a), c.x + (R + 4 + LEN * b.out) * Math.cos(a), c.y + (R + 4 + LEN * b.out) * Math.sin(a), 'sl-arrow-out', '6 4');
    });
    // Key, by line style and words, not colour.
    arrow(svg, 480, 44, 420, 44, 'sl-key-in');
    addLabel(svg, wrap, 'gravity (inward)', 450, 70, 'diagram-label--tick');
    arrow(svg, 420, 108, 480, 108, 'sl-key-out', '6 4');
    addLabel(svg, wrap, `${b.outName} (outward)`, 450, 134, 'diagram-label--tick');
    const t = L.trend(s.id);
    const verdict = t === 'steady' ? 'balanced: stays the same size' : t === 'shrinking' ? 'gravity wins: it shrinks' : 'push wins: outer layers swell';
    addLabel(svg, wrap, verdict, 450, 200, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, s.name, 450, 232, 'diagram-label--tick');
    svg.dataset.trend = t;
    svg.dataset.outName = b.outName;
    document.getElementById('balance-readout').textContent = `${s.name}: ${b.verdict}`;
  }

  // ------------------------------------------------------------------
  // 3. Its path across the HR diagram
  // ------------------------------------------------------------------

  const GEOM = { x0: 92, x1: 590, yTop: 40, yBottom: 370 };
  const plot = H.makePlot(GEOM);
  const L_TICKS = [[1e4, '10⁴'], [1e2, '10²'], [1, '1'], [1e-2, '10⁻²'], [1e-4, '10⁻⁴']];
  const T_TICKS = [40000, 20000, 10000, 5000, 3000];

  /**
   * One star's track across the HR diagram, from SunLikeStar.TRACKS. 13.8
   * HOOK: "Massive stars and their ends" calls this again with the massive
   * track (and its own class) on the same axes, so both paths show together.
   */
  function drawTrack(svg, trackId, cls) {
    const track = L.TRACKS[trackId];
    const pts = track.path.map(([t, lum]) => [plot.xForT(t), plot.yForL(lum)]);
    svgEl('polyline', { class: `sl-track ${cls}`, points: pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '), fill: 'none', stroke: INK, 'stroke-width': 2.5, 'stroke-dasharray': '8 5' }, svg);
    for (let k = 1; k < pts.length; k += 3) {
      const [xa, ya] = pts[k - 1];
      const [xb, yb] = pts[k];
      const mx = (xa + xb) / 2;
      const my = (ya + yb) / 2;
      const a = Math.atan2(yb - ya, xb - xa);
      svgEl('path', { d: `M${(mx + 7 * Math.cos(a)).toFixed(1)},${(my + 7 * Math.sin(a)).toFixed(1)} L${(mx - 7 * Math.cos(a - 0.5)).toFixed(1)},${(my - 7 * Math.sin(a - 0.5)).toFixed(1)} M${(mx + 7 * Math.cos(a)).toFixed(1)},${(my + 7 * Math.sin(a)).toFixed(1)} L${(mx - 7 * Math.cos(a + 0.5)).toFixed(1)},${(my - 7 * Math.sin(a + 0.5)).toFixed(1)}`, stroke: INK, 'stroke-width': 2.5, fill: 'none' }, svg);
    }
    return track;
  }

  const TRACK_LABEL = {
    protostar: [16, -14, 'right'],
    'main-sequence': [16, 14, 'right'],
    'red-giant': [-14, -20, 'left'],
    'planetary-nebula': [16, -18, 'right'],
    'white-dwarf': [16, 0, 'right'],
    'black-dwarf': [-14, -16, 'left'],
  };

  function drawTrackDiagram() {
    const svg = document.getElementById('track-diagram');
    const wrap = document.getElementById('track-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    // Axes and ticks.
    svgEl('rect', { x: GEOM.x0, y: GEOM.yTop, width: GEOM.x1 - GEOM.x0, height: GEOM.yBottom - GEOM.yTop, fill: 'none', stroke: MUTED }, svg);
    L_TICKS.forEach(([lum, text]) => {
      const y = plot.yForL(lum);
      svgEl('line', { x1: GEOM.x0 - 6, y1: y, x2: GEOM.x0, y2: y, stroke: MUTED }, svg);
      addLabel(svg, wrap, text, GEOM.x0 - 10, y, 'diagram-label--tick diagram-label--left');
    });
    T_TICKS.forEach((t) => {
      const x = plot.xForT(t);
      svgEl('line', { x1: x, y1: GEOM.yBottom, x2: x, y2: GEOM.yBottom + 6, stroke: MUTED }, svg);
      addLabel(svg, wrap, t.toLocaleString('en-GB'), x, GEOM.yBottom + 18, 'diagram-label--tick');
    });
    addLabel(svg, wrap, 'surface temperature (K), hottest on the left', 340, GEOM.yBottom + 44, 'diagram-label--tick');
    addLabel(svg, wrap, 'luminosity (Sun = 1)', GEOM.x0 + 6, 20, 'diagram-label--tick diagram-label--right');
    // The main sequence band, for reference.
    const upper = [];
    const lower = [];
    for (let lt = Math.log10(40000); lt >= Math.log10(3000); lt -= 0.02) {
      const t = 10 ** lt;
      const r = H.mainSequenceRange(t);
      upper.push([plot.xForT(t), plot.yForM(r.bright)]);
      lower.unshift([plot.xForT(t), plot.yForM(r.faint)]);
    }
    svgEl('polygon', { class: 'sl-ms-band', points: [...upper, ...lower].map(([x, y]) => `${x.toFixed(1)},${Math.max(GEOM.yTop, Math.min(GEOM.yBottom, y)).toFixed(1)}`).join(' '), fill: 'rgba(255, 224, 138, 0.16)', stroke: '#ffe08a', 'stroke-dasharray': '6 4' }, svg);
    addLabel(svg, wrap, 'main sequence band', plot.xForT(14000), plot.yForL(2), 'diagram-label--tick');
    const track = drawTrack(svg, 'sunLike', 'sl-track--sun-like');
    // A marker at every stage on the track, and a ring on the chosen one.
    Object.entries(track.points).forEach(([id, [t, lum]]) => {
      const x = plot.xForT(t);
      const y = plot.yForL(lum);
      const chosen = id === state.stage;
      svgEl('circle', { class: `sl-track-point${chosen ? ' sl-track-point--chosen' : ''}`, 'data-stage': id, cx: x.toFixed(1), cy: y.toFixed(1), r: 5, fill: INK }, svg);
      if (chosen) svgEl('circle', { class: 'sl-track-ring', cx: x.toFixed(1), cy: y.toFixed(1), r: 12, fill: 'none', stroke: INK, 'stroke-width': 2.5 }, svg);
      const [dx, dy, side] = TRACK_LABEL[id];
      addLabel(svg, wrap, L.stage(id).name, x + dx, y + dy, `diagram-label--tick${chosen ? ' diagram-label--strong' : ''} diagram-label--${side}`);
    });
    const onDiagram = Boolean(track.points[state.stage]);
    if (!onDiagram) addLabel(svg, wrap, 'a nebula is not a star yet, so it is not on the diagram', 340, GEOM.yTop + 18, 'diagram-label--tick diagram-label--strong');
    svg.dataset.stage = state.stage;
    svg.dataset.onDiagram = String(onDiagram);
  }

  // ------------------------------------------------------------------
  // 4. How long each stage lasts
  // ------------------------------------------------------------------

  function fillTable() {
    const body = document.querySelector('#stage-table tbody');
    body.replaceChildren();
    L.STAGES.forEach((s) => {
      const tr = el('tr', undefined, { 'data-stage': s.id });
      tr.append(el('td', s.name), el('td', s.time), el('td', s.core));
      body.appendChild(tr);
    });
  }

  function yearsText(y) {
    if (y >= 1e9) return `about ${y / 1e9} billion`;
    if (y >= 1e6) return `about ${y / 1e6} million`;
    return `about ${y.toLocaleString('en-GB')}`;
  }

  function drawTimeline() {
    const svg = document.getElementById('timeline-diagram');
    const wrap = document.getElementById('timeline-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const X0 = 190;
    const X1 = 600;
    const xFor = (y) => X0 + ((Math.log10(y) - 3) / 8) * (X1 - X0);
    [1e4, 1e6, 1e8, 1e10].forEach((y) => {
      svgEl('line', { x1: xFor(y), y1: 34, x2: xFor(y), y2: 262, stroke: MUTED, 'stroke-dasharray': '2 5' }, svg);
    });
    [[1e4, '10,000'], [1e7, '10 million'], [1e10, '10 billion']].forEach(([y, text]) => addLabel(svg, wrap, text, xFor(y), 280, 'diagram-label--tick'));
    addLabel(svg, wrap, 'years: each dotted line is 100 times longer', 20, 16, 'diagram-label--tick diagram-label--right');
    L.STAGES.forEach((s, k) => {
      const y = 46 + k * 32;
      addLabel(svg, wrap, s.name, 20, y, 'diagram-label--tick diagram-label--right');
      if (s.years) {
        const w = xFor(s.years) - X0;
        svgEl('rect', { class: 'sl-time-bar', 'data-stage': s.id, x: X0, y: y - 9, width: w.toFixed(1), height: 18, fill: '#ffd36b', stroke: INK, 'stroke-width': 0.8 }, svg);
        const text = yearsText(s.years);
        if (w > 260) addLabel(svg, wrap, text, X0 + w - 8, y, 'diagram-label--tick diagram-label--strong diagram-label--left sl-on-bar');
        else addLabel(svg, wrap, text, X0 + w + 8, y, 'diagram-label--tick diagram-label--right');
      } else {
        addLabel(svg, wrap, 'longer than the Universe so far', X0, y, 'diagram-label--tick diagram-label--right');
      }
    });
  }

  // ------------------------------------------------------------------

  function choose(id) {
    state.stage = id;
    document.querySelectorAll('#stage-buttons button').forEach((b) => {
      const on = b.dataset.stage === id;
      b.classList.toggle('preset-button-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    document.querySelectorAll('#stage-table tbody tr').forEach((tr) => tr.classList.toggle('sl-row--chosen', tr.dataset.stage === id));
    drawStage();
    drawBalance();
    drawTrackDiagram();
  }

  function wireStages() {
    const holder = document.getElementById('stage-buttons');
    L.STAGES.forEach((s, k) => {
      const b = el('button', `${k + 1}. ${s.name}`, { type: 'button', class: 'preset-button', 'data-stage': s.id, 'aria-controls': 'stage-diagram balance-diagram track-diagram' });
      b.addEventListener('click', () => choose(s.id));
      holder.appendChild(b);
    });
  }

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }

  wireStages();
  fillTable();
  choose(state.stage);
  drawTimeline();
  renderCoverage();
  Glossary.init({
    fusion:
      'Nuclear fusion: small nuclei, such as hydrogen, joining to make bigger ones, such as helium, releasing a great deal of energy. It needs the huge temperature and pressure in a star’s core.',
    radiationPressure:
      'Radiation pressure: the outward push of the energy (light and other radiation) streaming out from the hot core, together with the hot gas’s own pressure.',
  });
  QuizUI.mount(SunLikeStarQuestions.makeQuestions(L));
})();
