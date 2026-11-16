(function () {
  const M = window.MassiveStar;
  const L = window.SunLikeStar;
  const H = window.HrDiagram;
  const D = window.SpectrumDrawing;
  const TD = window.HrTrackDrawing;
  const { INK, MUTED, svgEl, clearDiagram, addLabel, panel } = D;

  const CURRICULUM_UNITS = ['u4.15'];
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
    [['ms-glow-blue', '#ffffff', '#9fc0ff'], ['ms-glow-red', '#ffb38a', '#c7381f'], ['ms-glow-white', '#ffffff', '#cfe0ff'], ['ms-glow-pink', '#ffd0e0', '#c86a9a'], ['ms-glow-burst', '#ffffff', '#ffb347']].forEach(([id, inner, outer]) => {
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
  // 1. From nebula to supernova
  // ------------------------------------------------------------------

  function drawStage() {
    const svg = document.getElementById('stage-diagram');
    const wrap = document.getElementById('stage-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    glowDefs(svg);
    starfield(svg, 640, 320, 60, 61);
    const id = state.stage;
    const c = { x: 320, y: 150 };
    if (id === 'nebula') {
      [[0, 0, 110, 70, 0.35], [-30, -10, 80, 50, 0.35], [26, 14, 60, 40, 0.45]].forEach(([dx, dy, rx, ry, op]) => svgEl('ellipse', { cx: 180 + dx, cy: c.y + dy, rx, ry, fill: 'url(#ms-glow-pink)', opacity: op }, svg));
      svgEl('rect', { x: 380, y: 60, width: 200, height: 180, rx: 30, fill: '#cfe3ff', opacity: 0.18 }, svg);
      svgEl('path', { class: 'ms-absorption', d: 'M410,210 C400,150 440,90 480,110 C520,70 560,120 545,170 C560,210 500,235 460,225 C440,240 415,230 410,210 Z', fill: '#05070d' }, svg);
      addLabel(svg, wrap, 'emission nebula', 180, 244, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'absorption nebula', 480, 244, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'as for a Sun-like star', 320, 284, 'diagram-label--tick');
    } else if (id === 'main-sequence') {
      svgEl('circle', { cx: c.x, cy: c.y, r: 96, fill: '#9fc0ff', opacity: 0.18 }, svg);
      svgEl('circle', { class: 'ms-star', cx: c.x, cy: c.y, r: 74, fill: 'url(#ms-glow-blue)' }, svg);
      addLabel(svg, wrap, 'big, hot, blue-white star', c.x, 274, 'diagram-label--tick diagram-label--strong');
    } else if (id === 'red-supergiant') {
      svgEl('circle', { class: 'ms-star', cx: c.x, cy: 196, r: 168, fill: 'url(#ms-glow-red)', opacity: 0.9 }, svg);
      [[46, '#ffcf9f'], [34, '#ffe9b0'], [22, '#cfe0ff'], [11, '#9aa7bd']].forEach(([r, fill]) => svgEl('circle', { class: 'ms-shell', cx: c.x, cy: 196, r, fill, stroke: '#10131c', 'stroke-width': 1 }, svg));
      addLabel(svg, wrap, 'vast, cool outer layers', c.x, 52, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'shells of heavier elements', c.x, 128, 'diagram-label--tick');
      addLabel(svg, wrap, 'iron core', c.x, 262, 'diagram-label--tick diagram-label--strong');
    } else if (id === 'supernova') {
      const rand = seeded(9);
      for (let k = 0; k < 18; k += 1) {
        const a = (k / 18) * Math.PI * 2 + rand() * 0.2;
        const r1 = 40 + rand() * 20;
        const r2 = 110 + rand() * 30;
        arrow(svg, c.x + r1 * Math.cos(a), c.y + r1 * Math.sin(a), c.x + r2 * Math.cos(a), c.y + r2 * 0.8 * Math.sin(a), 'ms-blast');
      }
      svgEl('circle', { class: 'ms-star', cx: c.x, cy: c.y, r: 36, fill: 'url(#ms-glow-burst)' }, svg);
      addLabel(svg, wrap, 'outer layers blasted outward', c.x, 290, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'core collapses', c.x, c.y, 'diagram-label--tick');
    } else if (id === 'neutron-star') {
      svgEl('circle', { cx: c.x, cy: c.y, r: 20, fill: '#cfe0ff', opacity: 0.2 }, svg);
      svgEl('circle', { class: 'ms-star', cx: c.x, cy: c.y, r: 6, fill: 'url(#ms-glow-white)' }, svg);
      addLabel(svg, wrap, 'neutron star', c.x, c.y + 36, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'about 20 km across, more mass than the Sun', c.x, 270, 'diagram-label--tick');
    } else {
      svgEl('ellipse', { class: 'ms-ring', cx: c.x, cy: c.y, rx: 64, ry: 20, fill: 'none', stroke: '#ffcf9f', 'stroke-width': 8, opacity: 0.8 }, svg);
      svgEl('circle', { class: 'ms-star', cx: c.x, cy: c.y, r: 30, fill: '#000', stroke: '#ffcf9f', 'stroke-width': 2 }, svg);
      svgEl('path', { d: `M${c.x - 64},${c.y} A64,20 0 0 1 ${c.x + 64},${c.y}`, fill: 'none', stroke: '#ffcf9f', 'stroke-width': 8, opacity: 0.8 }, svg);
      addLabel(svg, wrap, 'black hole', c.x, c.y + 56, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'not even light escapes', c.x, 270, 'diagram-label--tick');
    }
    addLabel(svg, wrap, 'not to scale', 16, 20, 'diagram-label--tick diagram-label--right');
    svg.dataset.stage = id;
    const k = M.STAGES.findIndex((s) => s.id === id);
    const s = M.STAGES[k];
    document.getElementById('stage-readout').textContent = `${stageNumber(k)}: ${s.name}. How long: ${s.time}. The core: ${s.core}`;
  }

  /** Stages 1 to 4, then the two possible ends as 5a and 5b. */
  function stageNumber(k) {
    return k < 4 ? `Stage ${k + 1}` : `Stage 5${k === 4 ? 'a' : 'b'} (one of two possible ends)`;
  }

  // ------------------------------------------------------------------
  // 2. The balance, stage by stage
  // ------------------------------------------------------------------

  const BALANCE_RADIUS = { nebula: 62, 'main-sequence': 60, 'red-supergiant': 70, supernova: 40, 'neutron-star': 24, 'black-hole': 22 };
  const BALANCE_FILL = { nebula: '#6b5a4a', 'main-sequence': 'url(#ms-glow-blue)', 'red-supergiant': 'url(#ms-glow-red)', supernova: 'url(#ms-glow-burst)', 'neutron-star': 'url(#ms-glow-white)', 'black-hole': '#000' };

  function drawBalance() {
    const svg = document.getElementById('balance-diagram');
    const wrap = document.getElementById('balance-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    glowDefs(svg);
    const s = M.stage(state.stage);
    const b = s.balance;
    const c = { x: 136, y: 150 };
    const R = BALANCE_RADIUS[s.id];
    svgEl('circle', { class: 'sl-balance-star', cx: c.x, cy: c.y, r: R, fill: BALANCE_FILL[s.id], stroke: '#5a5f70', 'stroke-width': 1 }, svg);
    const LEN = 40;
    // Gravity: solid arrows from outside, pointing inward (as on the Sun-like page).
    [45, 135, 225, 315].forEach((deg) => {
      const a = (deg * Math.PI) / 180;
      const start = R + 12 + LEN * b.in;
      arrow(svg, c.x + start * Math.cos(a), c.y + start * Math.sin(a), c.x + (R + 6) * Math.cos(a), c.y + (R + 6) * Math.sin(a), 'sl-arrow-in');
    });
    // The pressure: dashed arrows from the surface, pointing outward (none for a black hole).
    if (b.out > 0) {
      [0, 90, 180, 270].forEach((deg) => {
        const a = (deg * Math.PI) / 180;
        arrow(svg, c.x + (R - 4) * Math.cos(a), c.y + (R - 4) * Math.sin(a), c.x + (R + 4 + LEN * b.out) * Math.cos(a), c.y + (R + 4 + LEN * b.out) * Math.sin(a), 'sl-arrow-out', '6 4');
      });
    }
    arrow(svg, 480, 44, 420, 44, 'sl-key-in');
    addLabel(svg, wrap, 'gravity (inward)', 450, 70, 'diagram-label--tick');
    arrow(svg, 420, 108, 480, 108, 'sl-key-out', '6 4');
    addLabel(svg, wrap, b.out > 0 ? `${b.outName} (outward)` : 'nothing pushes outward', 450, 134, 'diagram-label--tick');
    const t = M.trend(s.id);
    const verdict = { steady: 'balanced: stays the same size', shrinking: 'gravity wins: it shrinks', swelling: 'push wins: outer layers swell', collapsing: 'gravity wins: the core collapses' }[t];
    addLabel(svg, wrap, verdict, 450, 200, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, s.name, 450, 232, 'diagram-label--tick');
    svg.dataset.trend = t;
    svg.dataset.outName = b.outName;
    document.getElementById('balance-readout').textContent = `${s.name}: ${b.verdict}`;
  }

  // ------------------------------------------------------------------
  // 3. The Chandrasekhar limit
  // ------------------------------------------------------------------

  const CORE = { x0: 50, x1: 590, min: 0.5, max: 5 };
  const xForMass = (m) => CORE.x0 + ((m - CORE.min) / (CORE.max - CORE.min)) * (CORE.x1 - CORE.x0);

  function coreMass() {
    return Number(document.getElementById('core-mass').value);
  }

  function drawCore() {
    const svg = document.getElementById('core-diagram');
    const wrap = document.getElementById('core-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    glowDefs(svg);
    const m = coreMass();
    const end = M.coreEnd(m);
    document.getElementById('core-mass-label').textContent = `${m.toFixed(1)} times the Sun's mass`;
    // What the core becomes, drawn above the scale.
    const c = { x: 320, y: 70 };
    if (end.id === 'white-dwarf') {
      svgEl('circle', { cx: c.x, cy: c.y, r: 26, fill: '#cfe0ff', opacity: 0.2 }, svg);
      svgEl('circle', { class: 'ms-remnant ms-remnant--white-dwarf', cx: c.x, cy: c.y, r: 14, fill: 'url(#ms-glow-white)' }, svg);
    } else if (end.id === 'neutron-star') {
      svgEl('circle', { cx: c.x, cy: c.y, r: 16, fill: '#cfe0ff', opacity: 0.2 }, svg);
      svgEl('circle', { class: 'ms-remnant ms-remnant--neutron-star', cx: c.x, cy: c.y, r: 5, fill: 'url(#ms-glow-white)' }, svg);
    } else {
      svgEl('ellipse', { cx: c.x, cy: c.y, rx: 44, ry: 13, fill: 'none', stroke: '#ffcf9f', 'stroke-width': 6, opacity: 0.8 }, svg);
      svgEl('circle', { class: 'ms-remnant ms-remnant--black-hole', cx: c.x, cy: c.y, r: 20, fill: '#000', stroke: '#ffcf9f', 'stroke-width': 2 }, svg);
    }
    addLabel(svg, wrap, `a ${end.name}: held up by ${end.heldBy}`.replace('held up by nothing: it collapses for good', 'nothing holds it up'), c.x, 124, 'diagram-label--tick diagram-label--strong');
    // The three zones, named, with a different fill pattern each.
    const zones = [
      { id: 'white-dwarf', from: CORE.min, to: M.CHANDRASEKHAR_MSUN, name: 'white dwarf', fill: '#cfe0ff', op: 0.25 },
      { id: 'neutron-star', from: M.CHANDRASEKHAR_MSUN, to: M.NEUTRON_STAR_MAX_MSUN, name: 'neutron star', fill: '#9aa7bd', op: 0.4 },
      { id: 'black-hole', from: M.NEUTRON_STAR_MAX_MSUN, to: CORE.max, name: 'black hole', fill: '#05070d', op: 1 },
    ];
    zones.forEach((z) => {
      const on = z.id === end.id;
      svgEl('rect', { class: `ms-zone ms-zone--${z.id}${on ? ' ms-zone--chosen' : ''}`, x: xForMass(z.from), y: 172, width: xForMass(z.to) - xForMass(z.from), height: 36, fill: z.fill, opacity: z.op, stroke: INK, 'stroke-width': on ? 3 : 1 }, svg);
      addLabel(svg, wrap, z.name, (xForMass(z.from) + xForMass(z.to)) / 2, 190, `diagram-label--tick${on ? ' diagram-label--strong' : ''}`);
    });
    // The limit, marked with a line and its name.
    const xl = xForMass(M.CHANDRASEKHAR_MSUN);
    svgEl('line', { class: 'ms-limit', x1: xl, y1: 152, x2: xl, y2: 214, stroke: INK, 'stroke-width': 2.5, 'stroke-dasharray': '4 3' }, svg);
    addLabel(svg, wrap, 'Chandrasekhar limit', xl - 6, 158, 'diagram-label--tick diagram-label--strong diagram-label--right');
    // The scale and the marker.
    svgEl('line', { x1: CORE.x0, y1: 222, x2: CORE.x1, y2: 222, stroke: MUTED, 'stroke-width': 1.5 }, svg);
    [1, 2, 3, 4, 5].forEach((v) => {
      svgEl('line', { x1: xForMass(v), y1: 222, x2: xForMass(v), y2: 228, stroke: MUTED }, svg);
      addLabel(svg, wrap, String(v), xForMass(v), 240, 'diagram-label--tick');
    });
    addLabel(svg, wrap, 'core mass (times the Sun’s mass)', 320, 266, 'diagram-label--tick');
    const xm = xForMass(m);
    svgEl('path', { class: 'ms-marker', d: `M${xm.toFixed(1)},214 l-8,-14 h16 z`, fill: INK }, svg);
    svg.dataset.end = end.id;
    svg.dataset.mass = m.toFixed(1);
    document.getElementById('core-readout').textContent =
      end.id === 'white-dwarf'
        ? `${m.toFixed(1)} times the Sun's mass is below the Chandrasekhar limit (about ${M.CHANDRASEKHAR_MSUN}), so electron pressure can hold the core up: it ends as a white dwarf, as a Sun-like star does.`
        : end.id === 'neutron-star'
          ? `${m.toFixed(1)} times the Sun's mass is above the Chandrasekhar limit (about ${M.CHANDRASEKHAR_MSUN}), so electron pressure fails and the core collapses until neutron pressure stops it: a neutron star.`
          : `${m.toFixed(1)} times the Sun's mass is above about ${M.NEUTRON_STAR_MAX_MSUN}, too heavy even for neutron pressure: nothing can stop the collapse, and it becomes a black hole.`;
  }

  // ------------------------------------------------------------------
  // 4. Two paths across the HR diagram (13.8)
  // ------------------------------------------------------------------

  // The plot starts lower than on the Sun-like page, leaving room above it
  // for the supernova arrow off the chart.
  const T = TD.make(H, D, { yTop: 70, yBottom: 400 });
  const MASSIVE_LABEL = {
    'main-sequence': ['Main sequence', 14, 28, 'right'],
    'red-supergiant': ['Red supergiant', -14, 22, 'left'],
  };
  const SUN_LIKE_LABEL = {
    'main-sequence': ['the Sun', 14, 14, 'right'],
    'red-giant': ['Red giant', -14, 2, 'left'],
    'white-dwarf': ['White dwarf', 16, 0, 'right'],
  };

  function drawTracks() {
    const svg = document.getElementById('track-diagram');
    const wrap = document.getElementById('track-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    T.drawAxes(svg, wrap);
    T.drawTrack(svg, L.TRACKS.sunLike, 'sl-track--sun-like', TD.STYLES.sunLike);
    T.drawPoints(svg, wrap, L.TRACKS.sunLike, TD.STYLES.sunLike, null, (id) => SUN_LIKE_LABEL[id] || null, 'sunLike');
    T.drawTrack(svg, L.TRACKS.massive, 'sl-track--massive', TD.STYLES.massive);
    T.drawPoints(svg, wrap, L.TRACKS.massive, TD.STYLES.massive, state.stage, (id) => MASSIVE_LABEL[id], 'massive');
    // The track ends at the red supergiant: the supernova is an explosion,
    // far too bright for the chart, so it is an arrow off the top, not a point.
    const end = L.TRACKS.massive.end;
    const [te, le] = L.TRACKS.massive.points[end.from];
    const ex = T.plot.xForT(te);
    const ey = T.plot.yForL(le);
    const chosenEnd = state.stage === end.stage;
    svgEl('line', { class: 'ms-supernova-arrow', x1: ex, y1: ey - 10, x2: ex, y2: 34, stroke: INK, 'stroke-width': chosenEnd ? 4 : 2.5, 'stroke-dasharray': '3 4' }, svg);
    svgEl('path', { class: 'ms-supernova-arrow', d: `M${ex},28 l-7,12 h14 z`, fill: INK }, svg);
    addLabel(svg, wrap, end.label, ex - 14, 50, `diagram-label--tick${chosenEnd ? ' diagram-label--strong' : ''} diagram-label--left`);
    // A key, by line style and marker shape, not colour.
    const y1 = 482;
    const y2 = 512;
    svgEl('line', { x1: 60, y1, x2: 120, y2: y1, stroke: INK, 'stroke-width': TD.STYLES.massive.width }, svg);
    svgEl('rect', { x: 84.5, y: y1 - 5.5, width: 11, height: 11, fill: INK }, svg);
    addLabel(svg, wrap, 'massive star (about 20 times the Sun’s mass)', 132, y1, 'diagram-label--tick diagram-label--right');
    svgEl('line', { x1: 60, y1: y2, x2: 120, y2, stroke: INK, 'stroke-width': TD.STYLES.sunLike.width, 'stroke-dasharray': TD.STYLES.sunLike.dash }, svg);
    svgEl('circle', { cx: 90, cy: y2, r: 5, fill: INK }, svg);
    addLabel(svg, wrap, 'Sun-like star', 132, y2, 'diagram-label--tick diagram-label--right');
    const onDiagram = Boolean(L.TRACKS.massive.points[state.stage]);
    if (!onDiagram) {
      const why = state.stage === 'nebula'
        ? 'a nebula is not a star yet, so it is not on the diagram'
        : state.stage === 'supernova'
          ? 'a supernova: an explosion, not a point'
          : `a ${M.stage(state.stage).name.toLowerCase()} is not on the diagram`;
      addLabel(svg, wrap, why, 340, T.GEOM.yBottom - 18, 'diagram-label--tick diagram-label--strong');
    }
    svg.dataset.stage = state.stage;
    svg.dataset.onDiagram = String(onDiagram);
  }

  // ------------------------------------------------------------------
  // 5. How long each stage lasts
  // ------------------------------------------------------------------

  function fillTable() {
    const body = document.querySelector('#stage-table tbody');
    body.replaceChildren();
    M.STAGES.forEach((s) => {
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
    const defs = svgEl('defs', {}, svg);
    const hatch = svgEl('pattern', { id: 'ms-hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    svgEl('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: '#ffd36b', 'stroke-width': 3 }, hatch);
    const X0 = 200;
    const X1 = 600;
    const xFor = (y) => X0 + ((Math.log10(y) - 3) / 8) * (X1 - X0);
    [1e4, 1e6, 1e8, 1e10].forEach((y) => svgEl('line', { x1: xFor(y), y1: 34, x2: xFor(y), y2: 262, stroke: MUTED, 'stroke-dasharray': '2 5' }, svg));
    [[1e4, '10,000'], [1e7, '10 million'], [1e10, '10 billion']].forEach(([y, text]) => addLabel(svg, wrap, text, xFor(y), 280, 'diagram-label--tick'));
    addLabel(svg, wrap, 'years: each dotted line is 100 times longer', 20, 16, 'diagram-label--tick diagram-label--right');
    const rows = [
      ...M.STAGES.map((s) => ({ id: s.id, name: s.name, years: s.years, text: s.years ? yearsText(s.years) : s.id === 'supernova' ? 'under a second to months' : 'for ever' })),
      { id: 'sun-like-main-sequence', name: 'Sun-like star', years: L.stage('main-sequence').years, compare: true },
    ];
    rows.forEach((r, k) => {
      const y = 46 + k * 32;
      addLabel(svg, wrap, r.name, 20, y, `diagram-label--tick diagram-label--right${r.compare ? ' diagram-label--strong' : ''}`);
      if (r.years) {
        const w = xFor(r.years) - X0;
        svgEl('rect', { class: `sl-time-bar${r.compare ? ' ms-time-bar--compare' : ''}`, 'data-stage': r.id, x: X0, y: y - 9, width: w.toFixed(1), height: 18, fill: r.compare ? 'url(#ms-hatch)' : '#ffd36b', stroke: INK, 'stroke-width': 0.8 }, svg);
        const text = r.compare ? `main sequence, ${yearsText(r.years)}` : yearsText(r.years);
        if (r.compare) addLabel(svg, wrap, text, X0 + w - 8, y + 1, 'diagram-label--tick diagram-label--strong diagram-label--left ms-on-hatch');
        else if (w > 260) addLabel(svg, wrap, text, X0 + w - 8, y, 'diagram-label--tick diagram-label--strong diagram-label--left sl-on-bar');
        else addLabel(svg, wrap, text, X0 + w + 8, y, 'diagram-label--tick diagram-label--right');
      } else {
        addLabel(svg, wrap, r.text, X0, y, 'diagram-label--tick diagram-label--right');
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
    drawTracks();
  }

  function wireStages() {
    const holder = document.getElementById('stage-buttons');
    M.STAGES.forEach((s, k) => {
      const num = k < 4 ? `${k + 1}` : `5${k === 4 ? 'a' : 'b'}`;
      const b = el('button', `${num}. ${s.name}`, { type: 'button', class: 'preset-button', 'data-stage': s.id, 'aria-controls': 'stage-diagram balance-diagram track-diagram' });
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
  document.getElementById('core-mass').addEventListener('input', drawCore);
  drawCore();
  drawTimeline();
  renderCoverage();
  QuizUI.mount(MassiveStarQuestions.makeQuestions(M, L));
})();
