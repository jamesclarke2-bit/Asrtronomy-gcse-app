(function () {
  const T = window.SpaceTelescopes;
  const W = window.AtmosphereWindows;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, svgEl, clearDiagram, addLabel, panel } = D;

  const CURRICULUM_UNITS = ['u5.7'];
  const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RAY = '#b9a7ff';
  const METAL = '#d7dde8';

  function seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function starfield(svg, x0, y0, w, h, n, seed) {
    const rand = seeded(seed);
    for (let i = 0; i < n; i += 1) svgEl('circle', { cx: x0 + 6 + rand() * (w - 12), cy: y0 + 6 + rand() * (h - 12), r: 0.9, fill: '#fff', opacity: 0.4 }, svg);
  }

  /** A small space telescope: a tube with two solar panels. */
  function satellite(svg, x, y, scale, cls) {
    const g = svgEl('g', { class: cls, transform: `translate(${x} ${y}) scale(${scale})` }, svg);
    svgEl('rect', { x: -9, y: -6, width: 18, height: 12, rx: 2, fill: METAL }, g);
    svgEl('rect', { x: 9, y: -4, width: 4, height: 8, fill: '#0f1830' }, g);
    [-25, 13].forEach((x) => svgEl('rect', { x, y: -4, width: 12, height: 8, fill: '#5b7bd5', stroke: METAL, 'stroke-width': 0.8 }, g));
    return g;
  }

  function dome(svg, x, groundY, cls) {
    const g = svgEl('g', { class: cls }, svg);
    svgEl('rect', { x: x - 18, y: groundY - 16, width: 36, height: 16, fill: METAL }, g);
    svgEl('path', { d: `M${x - 18},${groundY - 16} A18,18 0 0 1 ${x + 18},${groundY - 16} Z`, fill: '#eef3fb' }, g);
    return g;
  }

  // ------------------------------------------------------------------
  // 1. Why some telescopes must be in space
  // ------------------------------------------------------------------

  const SHORT_NAMES = { 'Gamma ray': 'Gamma', 'X-ray': 'X-ray', Ultraviolet: 'UV', Optical: 'Visible', Infrared: 'Infrared', Radio: 'Radio' };
  const MARKS = { open: '✓', partial: '∼', blocked: '✗' };

  function drawChart() {
    const svg = document.getElementById('space-chart');
    const wrap = document.getElementById('space-chart-wrap');
    clearDiagram(svg, wrap);
    W.draw(svg, { text: false });
    W.BANDS.forEach((band, i) => {
      const x = W.bandCentre(i);
      addLabel(svg, wrap, MARKS[band.category], x, 19, `diagram-label--tick diagram-label--strong sp-mark sp-mark--${band.category}`);
      addLabel(svg, wrap, SHORT_NAMES[band.name], x, W.GROUND_Y + 24, 'diagram-label--tick');
    });
    // A bracket under the bands that never reach the ground.
    const spaceOnly = T.spaceOnlyBands().map((name) => W.BANDS.findIndex((b) => b.name === name));
    const x0 = W.bandCentre(Math.min(...spaceOnly)) - 40;
    const x1 = W.bandCentre(Math.max(...spaceOnly)) + 40;
    const y = W.GROUND_Y + 42;
    svgEl('path', { class: 'sp-space-bracket', d: `M${x0},${y - 6} L${x0},${y} L${x1},${y} L${x1},${y - 6}`, fill: 'none', stroke: '#333', 'stroke-width': 2 }, svg);
    addLabel(svg, wrap, 'need space', (x0 + x1) / 2, y + 14, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, "Earth's surface", 470, y + 14, 'diagram-label--tick');
    svg.dataset.spaceOnly = T.spaceOnlyBands().join(',');
  }

  // ------------------------------------------------------------------
  // 2. Telescopes in orbit
  // ------------------------------------------------------------------

  const orbitState = { chosen: 'low', angle: 0, timer: null };
  const EARTH = { x: 230, y: 150, r: 34 };
  const LOW_R = 54;
  const FAR = { x: 590, y: 150, r: 18 };

  function drawOrbits() {
    const svg = document.getElementById('orbit-diagram');
    const wrap = document.getElementById('orbit-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    starfield(svg, 0, 0, 640, 300, 40, 9);
    const low = orbitState.chosen === 'low';
    // The Sun, far off to the left.
    svgEl('circle', { cx: -10, cy: 150, r: 60, fill: '#ffd36b' }, svg);
    // The Earth, with its low orbit.
    svgEl('circle', { cx: EARTH.x, cy: EARTH.y, r: EARTH.r, fill: '#3d7bd6' }, svg);
    svgEl('path', { d: `M${EARTH.x - 20},${EARTH.y - 12} q14,-10 26,2 q-4,14 -18,12 z`, fill: '#5fae6a' }, svg);
    svgEl('circle', { class: `sp-orbit sp-orbit--low${low ? ' sp-orbit--chosen' : ''}`, cx: EARTH.x, cy: EARTH.y, r: LOW_R, fill: 'none', stroke: INK, 'stroke-width': low ? 3 : 1.2, 'stroke-dasharray': low ? 'none' : '5 5' }, svg);
    // The Moon, then the far orbit beyond it, on the side away from the Sun.
    svgEl('circle', { cx: 430, cy: 150, r: 9, fill: '#c9c9c9' }, svg);
    svgEl('line', { x1: EARTH.x + EARTH.r, y1: 150, x2: FAR.x - FAR.r, y2: 150, stroke: MUTED, 'stroke-width': 1, 'stroke-dasharray': '2 6' }, svg);
    svgEl('circle', { class: `sp-orbit sp-orbit--far${low ? '' : ' sp-orbit--chosen'}`, cx: FAR.x, cy: FAR.y, r: FAR.r, fill: 'none', stroke: INK, 'stroke-width': low ? 1.2 : 3, 'stroke-dasharray': low ? '5 5' : 'none' }, svg);
    // The telescope on the chosen orbit.
    const a = orbitState.angle;
    const pos = low ? { x: EARTH.x + LOW_R * Math.cos(a), y: EARTH.y + LOW_R * Math.sin(a) } : { x: FAR.x + FAR.r * Math.cos(a), y: FAR.y + FAR.r * Math.sin(a) };
    satellite(svg, pos.x, pos.y, low ? 0.9 : 0.9, 'sp-orbit-telescope');
    svg.dataset.chosen = orbitState.chosen;
    addLabel(svg, wrap, 'not to scale', 560, 284, 'diagram-label--tick');
    addLabel(svg, wrap, 'Sun', 26, 150, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'Earth', EARTH.x, EARTH.y + 74, 'diagram-label--tick');
    addLabel(svg, wrap, 'low orbit', EARTH.x, EARTH.y - 76, `diagram-label--tick${low ? ' diagram-label--strong' : ''}`);
    addLabel(svg, wrap, 'Moon', 430, 178, 'diagram-label--tick');
    addLabel(svg, wrap, 'far orbit', FAR.x - 10, FAR.y - 42, `diagram-label--tick${low ? '' : ' diagram-label--strong'}`);

    const moonTimes = Math.round(T.farOrbitInMoonDistances());
    const facts = low
      ? [
        `About ${T.ORBITS.low.heightKm} km up, going round the Earth in about ${T.ORBITS.low.periodMinutes} minutes.`,
        'Close enough for astronauts to reach it, to repair or upgrade it.',
        'But the Earth blocks part of its view, and it passes into the Earth’s shadow on every orbit.',
      ]
      : [
        `About 1.5 million km away: about ${moonTimes} times as far as the Moon.`,
        'Far from the Earth’s heat and light, so it has a steady, cold, dark view.',
        'But it is far too far away to repair.',
      ];
    const ul = document.getElementById('orbit-facts');
    ul.innerHTML = '';
    facts.forEach((f) => {
      const li = document.createElement('li');
      li.textContent = f;
      ul.appendChild(li);
    });
    document.querySelectorAll('#orbit-buttons button').forEach((b) => {
      const on = b.dataset.orbit === orbitState.chosen;
      b.classList.toggle('preset-button-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function wireOrbits() {
    const holder = document.getElementById('orbit-buttons');
    [['low', 'Low orbit'], ['far', 'Far orbit']].forEach(([id, text]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset-button';
      b.dataset.orbit = id;
      b.textContent = text;
      b.addEventListener('click', () => {
        orbitState.chosen = id;
        drawOrbits();
      });
      holder.appendChild(b);
    });
    drawOrbits();
    if (!REDUCED_MOTION) {
      orbitState.timer = setInterval(() => {
        orbitState.angle += orbitState.chosen === 'low' ? 0.08 : 0.03;
        drawOrbits();
      }, 80);
    }
  }

  // ------------------------------------------------------------------
  // 3. Space or the ground?
  // ------------------------------------------------------------------

  const BAND_LABELS = { 'Gamma ray': 'Gamma rays', 'X-ray': 'X-rays', Ultraviolet: 'Ultraviolet', Infrared: 'Infrared', Optical: 'Visible light', Radio: 'Radio' };
  const balanceState = { band: 'X-ray' };

  function drawBalance() {
    const svg = document.getElementById('balance-diagram');
    const wrap = document.getElementById('balance-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const v = T.verdict(balanceState.band);
    const angle = (v.tilt * 14 * Math.PI) / 180;
    const pivot = { x: 320, y: 120 };
    const half = 190;
    const end = (s) => ({ x: pivot.x + s * half * Math.cos(angle), y: pivot.y + s * half * Math.sin(angle) });
    const left = end(-1);
    const right = end(1);
    // Stand and beam.
    svgEl('polygon', { points: `${pivot.x - 30},250 ${pivot.x + 30},250 ${pivot.x},${pivot.y + 6}`, fill: '#55607a', stroke: METAL }, svg);
    svgEl('line', { class: 'sp-beam', x1: left.x, y1: left.y, x2: right.x, y2: right.y, stroke: METAL, 'stroke-width': 6, 'stroke-linecap': 'round' }, svg);
    svgEl('circle', { cx: pivot.x, cy: pivot.y, r: 6, fill: '#0f1830', stroke: METAL, 'stroke-width': 2 }, svg);
    // Pans hanging from each end.
    [[left, 'ground'], [right, 'space']].forEach(([p, side]) => {
      const panY = p.y + 60;
      svgEl('line', { x1: p.x, y1: p.y, x2: p.x - 40, y2: panY, stroke: MUTED, 'stroke-width': 1.5 }, svg);
      svgEl('line', { x1: p.x, y1: p.y, x2: p.x + 40, y2: panY, stroke: MUTED, 'stroke-width': 1.5 }, svg);
      svgEl('path', { class: `sp-pan sp-pan--${side}`, d: `M${p.x - 48},${panY} Q${p.x},${panY + 22} ${p.x + 48},${panY} Z`, fill: '#2a3550', stroke: METAL, 'stroke-width': 1.5 }, svg);
      if (side === 'ground') dome(svg, p.x, panY, 'sp-pan-dome');
      else satellite(svg, p.x, panY - 12, 1.2, 'sp-pan-satellite');
      addLabel(svg, wrap, side === 'ground' ? 'on the ground' : 'in space', p.x, panY + 34, 'diagram-label--tick diagram-label--strong');
    });
    svg.dataset.tilt = String(v.tilt);
    svg.dataset.band = v.band;
    const heading = v.tilt > 0.75 ? 'space only' : v.tilt > 0 ? 'mostly space' : v.tilt < -0.75 ? 'the ground' : 'both have a case';
    addLabel(svg, wrap, `${BAND_LABELS[v.band]}: ${heading}`, 320, 278, 'diagram-label--tick diagram-label--strong');
    document.getElementById('balance-readout').textContent = `${BAND_LABELS[v.band]}: ${v.where}. ${v.reason}`;
    document.querySelectorAll('#band-buttons button').forEach((b) => {
      const on = b.dataset.band === v.band;
      b.classList.toggle('preset-button-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function wireBalance() {
    const holder = document.getElementById('band-buttons');
    W.BANDS.forEach((band) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset-button';
      b.dataset.band = band.name;
      b.textContent = BAND_LABELS[band.name];
      b.addEventListener('click', () => {
        balanceState.band = band.name;
        drawBalance();
      });
      holder.appendChild(b);
    });
    drawBalance();
  }

  // ------------------------------------------------------------------
  // 4. What gamma-ray, X-ray and ultraviolet astronomy found
  // ------------------------------------------------------------------

  function burst(svg, x, y, r, cls) {
    const pts = [];
    for (let k = 0; k < 16; k += 1) {
      const rr = k % 2 ? r * 0.35 : r;
      const a = (k * Math.PI) / 8;
      pts.push(`${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`);
    }
    svgEl('polygon', { class: cls, points: pts.join(' '), fill: '#fff' }, svg);
    svgEl('circle', { class: cls, cx: x, cy: y, r: r * 1.4, fill: RAY, opacity: 0.25 }, svg);
  }

  function wavyArrow(svg, x, y, dx, dy) {
    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;
    const pts = [];
    for (let s = 0; s <= len; s += 2) {
      const w = 4 * Math.sin(s / 3);
      pts.push(`${(x + ux * s - uy * w).toFixed(1)},${(y + uy * s + ux * w).toFixed(1)}`);
    }
    svgEl('polyline', { class: 'sp-xray', points: pts.join(' '), fill: 'none', stroke: RAY, 'stroke-width': 2 }, svg);
  }

  function drawDiscoveries() {
    const svg = document.getElementById('discoveries-diagram');
    const wrap = document.getElementById('discoveries-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const rows = ['Gamma-ray bursts', 'A black hole accretion disc', 'A young star’s chromosphere and corona'];
    rows.forEach((title, r) => {
      const y0 = 10 + r * 170;
      svgEl('rect', { class: 'sp-find-panel', x: 10, y: y0, width: 620, height: 160, rx: 8, fill: '#05070d', stroke: MUTED }, svg);
      starfield(svg, 20, y0 + 28, 600, 104, 24, 70 + r);
      addLabel(svg, wrap, title, 320, y0 + 16, 'diagram-label--tick diagram-label--strong');
    });
    // Gamma-ray bursts: a sudden flash, and a spike on a graph of gamma rays against time.
    let y0 = 10;
    burst(svg, 165, y0 + 82, 22, 'sp-burst');
    const g = { x0: 360, x1: 600, yTop: y0 + 40, yBottom: y0 + 120 };
    svgEl('line', { x1: g.x0, y1: g.yBottom, x2: g.x1, y2: g.yBottom, stroke: MUTED }, svg);
    svgEl('line', { x1: g.x0, y1: g.yTop, x2: g.x0, y2: g.yBottom, stroke: MUTED }, svg);
    const curve = [];
    for (let x = g.x0; x <= g.x1; x += 3) {
      const t = (x - g.x0) / (g.x1 - g.x0);
      const h = t < 0.4 ? 0.04 : t < 0.45 ? 0.04 + (t - 0.4) * 19 : 0.99 * Math.exp(-(t - 0.45) * 9) + 0.04;
      curve.push(`${x},${(g.yBottom - h * (g.yBottom - g.yTop)).toFixed(1)}`);
    }
    svgEl('polyline', { class: 'sp-burst-curve', points: curve.join(' '), fill: 'none', stroke: RAY, 'stroke-width': 2.5 }, svg);
    addLabel(svg, wrap, 'a sudden flash', 165, y0 + 146, 'diagram-label--tick');
    addLabel(svg, wrap, 'gamma rays against time', 480, y0 + 146, 'diagram-label--tick');
    // Accretion disc: gas pulled off a star into a hot disc round a black hole.
    y0 = 180;
    const bh = { x: 430, y: y0 + 84 };
    svgEl('circle', { cx: 170, cy: y0 + 84, r: 40, fill: '#ffcf7a' }, svg);
    svgEl('path', { class: 'sp-stream', d: `M205,${y0 + 70} C280,${y0 + 40} 360,${y0 + 60} ${bh.x - 40},${bh.y - 6}`, fill: 'none', stroke: '#ffcf7a', 'stroke-width': 5, opacity: 0.7 }, svg);
    [[78, 20, 0.35], [60, 15, 0.55], [40, 10, 0.8]].forEach(([rx, ry, op]) => svgEl('ellipse', { class: 'sp-disc', cx: bh.x, cy: bh.y, rx, ry, fill: '#ffffff', opacity: op * 0.6 }, svg));
    svgEl('circle', { class: 'sp-black-hole', cx: bh.x, cy: bh.y, r: 9, fill: '#000', stroke: '#fff', 'stroke-width': 1.5 }, svg);
    [[-1, -1], [1, -1], [1, 1]].forEach(([sx, sy]) => wavyArrow(svg, bh.x + sx * 50, bh.y + sy * 14, sx * 46, sy * 22));
    addLabel(svg, wrap, 'gas pulled off a star', 170, y0 + 146, 'diagram-label--tick');
    addLabel(svg, wrap, 'hot disc gives out X-rays', 450, y0 + 146, 'diagram-label--tick');
    // A young star: a thin, hot chromosphere and huge loops of corona.
    y0 = 350;
    const st = { x: 320, y: y0 + 86, r: 32 };
    let coronaApex = null;
    [[-1, 52, 0.6], [1, 60, 0.5], [-0.2, 66, 0.45], [0.6, 48, 0.6]].forEach(([dir, h, op], k) => {
      const a0 = -Math.PI / 2 + dir * 0.9 - 0.45;
      const a1 = a0 + 0.9;
      const p0 = { x: st.x + st.r * Math.cos(a0), y: st.y + st.r * Math.sin(a0) };
      const p1 = { x: st.x + st.r * Math.cos(a1), y: st.y + st.r * Math.sin(a1) };
      const am = (a0 + a1) / 2;
      const c = { x: st.x + (st.r + h) * Math.cos(am), y: st.y + (st.r + h) * Math.sin(am) };
      // The top of the right-hand loop, for the corona's leader line.
      if (k === 1) coronaApex = { x: st.x + (st.r + h / 2) * Math.cos(am), y: st.y + (st.r + h / 2) * Math.sin(am) };
      svgEl('path', { class: 'sp-corona-loop', d: `M${p0.x.toFixed(1)},${p0.y.toFixed(1)} Q${c.x.toFixed(1)},${c.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`, fill: 'none', stroke: RAY, 'stroke-width': 3 + (k % 2), opacity: op + 0.2 }, svg);
    });
    svgEl('circle', { class: 'sp-chromosphere', cx: st.x, cy: st.y, r: st.r + 5, fill: 'none', stroke: '#ff8fa3', 'stroke-width': 5 }, svg);
    svgEl('circle', { cx: st.x, cy: st.y, r: st.r, fill: '#ffe9b0' }, svg);
    svgEl('line', { x1: st.x - st.r - 6, y1: st.y + 8, x2: 190, y2: y0 + 128, stroke: MUTED, 'stroke-width': 1 }, svg);
    svgEl('line', { class: 'sp-corona-leader', x1: coronaApex.x.toFixed(1), y1: coronaApex.y.toFixed(1), x2: 460, y2: y0 + 128, stroke: MUTED, 'stroke-width': 1 }, svg);
    addLabel(svg, wrap, 'chromosphere', 170, y0 + 146, 'diagram-label--tick');
    addLabel(svg, wrap, 'corona', 470, y0 + 146, 'diagram-label--tick');
  }

  // ------------------------------------------------------------------

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }

  drawChart();
  wireOrbits();
  wireBalance();
  drawDiscoveries();
  renderCoverage();
  QuizUI.mount(SpaceTelescopesQuestions.makeQuestions(T));
})();
