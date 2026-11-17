(function () {
  const G = window.MilkyWay;
  const W = window.MilkyWayDrawing;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, svgEl, clearDiagram, addLabel, panel } = D;

  const CURRICULUM_UNITS = ['u4.4'];

  function seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  // ------------------------------------------------------------------
  // 1. The Milky Way from Earth, with a binocular view
  // ------------------------------------------------------------------

  /** The band's centre line across the sky: a gentle arch. */
  const bandY = (x) => 230 - 180 * Math.sin((Math.PI * (x + 40)) / 720);

  function drawSky() {
    const svg = document.getElementById('sky-diagram');
    const wrap = document.getElementById('sky-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const defs = svgEl('defs', {}, svg);
    const blur = svgEl('filter', { id: 'mw-sky-blur', x: '-20%', y: '-50%', width: '140%', height: '200%' }, defs);
    svgEl('feGaussianBlur', { stdDeviation: 14 }, blur);
    const clip = svgEl('clipPath', { id: 'mw-bino-clip' }, defs);
    svgEl('circle', { cx: 500, cy: 236, r: 76 }, clip);
    const rand = seeded(11);
    // Scattered stars all over the sky.
    for (let i = 0; i < 90; i += 1) svgEl('circle', { cx: (rand() * 640).toFixed(1), cy: (rand() * 280).toFixed(1), r: rand() < 0.1 ? 1.4 : 0.8, fill: '#fff', opacity: 0.6 }, svg);
    // The glowing band, and many faint stars crowded along it.
    const pts = [];
    for (let x = -20; x <= 660; x += 20) pts.push(`${x},${bandY(x).toFixed(1)}`);
    svgEl('polyline', { class: 'mw-band', points: pts.join(' '), fill: 'none', stroke: '#dfe6ff', 'stroke-width': 54, opacity: 0.32, filter: 'url(#mw-sky-blur)', 'stroke-linecap': 'round' }, svg);
    for (let i = 0; i < 260; i += 1) {
      const x = rand() * 640;
      const y = bandY(x) + (rand() - 0.5) * 50;
      svgEl('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 0.6, fill: '#fff', opacity: 0.45 }, svg);
    }
    // Dark dust lanes along the band.
    const soft = svgEl('filter', { id: 'mw-dust-blur', x: '-20%', y: '-50%', width: '140%', height: '200%' }, defs);
    svgEl('feGaussianBlur', { stdDeviation: 3 }, soft);
    [[120, 4, 110], [250, -2, 60], [330, 6, 50]].forEach(([x0, off, len]) => {
      const lane = [];
      for (let x = x0; x <= x0 + len; x += 8) lane.push(`${x},${(bandY(x) + off + 5 * Math.sin(x / 13)).toFixed(1)}`);
      svgEl('polyline', { class: 'mw-sky-dust', points: lane.join(' '), fill: 'none', stroke: '#0b0d14', 'stroke-width': 13, 'stroke-linecap': 'round', opacity: 0.8, filter: 'url(#mw-dust-blur)' }, svg);
    });
    // Hills along the bottom.
    svgEl('path', { d: 'M0,340 L0,300 Q80,276 160,296 T330,290 Q420,272 500,294 T640,284 L640,340 Z', fill: '#05060a' }, svg);
    // The binocular view: one patch of the band, enlarged.
    const spot = { x: 420, y: bandY(420) };
    svgEl('circle', { cx: spot.x, cy: spot.y, r: 9, fill: 'none', stroke: INK, 'stroke-width': 1.5 }, svg);
    svgEl('line', { x1: spot.x + 8, y1: spot.y + 6, x2: 446, y2: 196, stroke: INK, 'stroke-width': 1.2 }, svg);
    svgEl('circle', { cx: 500, cy: 236, r: 76, fill: '#0d1020', stroke: INK, 'stroke-width': 2 }, svg);
    const inside = svgEl('g', { 'clip-path': 'url(#mw-bino-clip)' }, svg);
    const r2 = seeded(5);
    for (let i = 0; i < 170; i += 1) {
      const x = 424 + r2() * 152;
      const y = 160 + r2() * 152;
      const big = r2();
      svgEl('circle', { class: 'mw-bino-star', cx: x.toFixed(1), cy: y.toFixed(1), r: big < 0.08 ? 2.2 : big < 0.3 ? 1.4 : 0.8, fill: '#fff', opacity: big < 0.3 ? 0.95 : 0.7 }, inside);
    }
    // A small cluster, and a dark dust patch, in the binocular view.
    for (let i = 0; i < 18; i += 1) svgEl('circle', { cx: (540 + (r2() - 0.5) * 18).toFixed(1), cy: (205 + (r2() - 0.5) * 18).toFixed(1), r: 1.1, fill: '#ffe7c4' }, inside);
    svgEl('ellipse', { class: 'mw-sky-dust', cx: 470, cy: 270, rx: 30, ry: 12, fill: '#07080d', opacity: 0.9, transform: 'rotate(-25 470 270)' }, inside);
    addLabel(svg, wrap, 'the Milky Way: a faint band', 16, 22, 'diagram-label--tick diagram-label--strong diagram-label--right');
    addLabel(svg, wrap, 'dark dust lane', 175, bandY(175) + 44, 'diagram-label--tick');
    addLabel(svg, wrap, 'binoculars: many stars', 630, 326, 'diagram-label--tick diagram-label--strong diagram-label--left');
  }

  // ------------------------------------------------------------------
  // 2. Shape, size and type: face-on or edge-on
  // ------------------------------------------------------------------

  let view = 'face';

  function drawGalaxy() {
    const svg = document.getElementById('galaxy-diagram');
    const wrap = document.getElementById('galaxy-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    W.drawGalaxy(svg, wrap, view);
    document.querySelectorAll('.mw-view-buttons button').forEach((b) => {
      const on = b.dataset.view === view;
      b.classList.toggle('preset-button-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  // ------------------------------------------------------------------
  // 3. Mapping it with 21 cm: a line of sight and its 21 cm peaks
  // ------------------------------------------------------------------

  const MAP = { cx: 320, cy: 175, s: 3.0 };
  const SPEC = { x0: 60, x1: 600, yBase: 520, yTop: 395, vMax: 120 };
  const vx = (v) => SPEC.x0 + ((v + SPEC.vMax) / (2 * SPEC.vMax)) * (SPEC.x1 - SPEC.x0);
  const signed = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(Math.round(v))}`;

  function lookAngle() {
    return Number(document.getElementById('look-angle').value);
  }

  function drawRadio() {
    const svg = document.getElementById('radio-diagram');
    const wrap = document.getElementById('radio-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    W.defs(svg, 'mwr');
    const l = lookAngle();
    document.getElementById('look-angle-label').textContent = `${l}°`;
    const { sun, P } = W.faceOn(svg, { cx: MAP.cx, cy: MAP.cy, s: MAP.s, prefix: 'mwr', sfr: false, clusters: false });
    // Which way it turns.
    const rr = G.DISC_RADIUS_KLY * MAP.s * 1.04;
    svgEl('path', { class: 'mw-turn', d: `M${MAP.cx - rr * Math.sin(0.5)},${MAP.cy - rr * Math.cos(0.5)} A${rr},${rr} 0 0 1 ${MAP.cx + rr * Math.sin(0.5)},${MAP.cy - rr * Math.cos(0.5)}`, fill: 'none', stroke: MUTED, 'stroke-width': 1.5, 'marker-end': '' }, svg);
    const ax = MAP.cx + rr * Math.sin(0.5);
    const ay = MAP.cy - rr * Math.cos(0.5);
    svgEl('path', { d: `M${ax},${ay} l-10,-6 M${ax},${ay} l-4,10`, stroke: MUTED, 'stroke-width': 1.5, fill: 'none' }, svg);
    addLabel(svg, wrap, 'the Galaxy turns this way', MAP.cx, 14, 'diagram-label--tick');
    // The direction to the centre, and the line of sight.
    svgEl('line', { class: 'mw-to-centre', x1: sun.x, y1: sun.y, x2: MAP.cx, y2: MAP.cy, stroke: MUTED, 'stroke-width': 1, 'stroke-dasharray': '3 4' }, svg);
    const u = G.direction(l);
    let dEnd = 0;
    for (let d = 0; d < 120; d += 0.5) {
      const x = G.sun().x + u.x * d;
      const y = G.sun().y + u.y * d;
      if (Math.hypot(x, y) > G.DISC_RADIUS_KLY) break;
      dEnd = d;
    }
    const end = P({ x: G.sun().x + u.x * dEnd, y: G.sun().y + u.y * dEnd });
    svgEl('line', { class: 'mw-sight', x1: sun.x, y1: sun.y, x2: end.x, y2: end.y, stroke: INK, 'stroke-width': 2 }, svg);
    addLabel(svg, wrap, 'Sun', sun.x + 12, sun.y + 14, 'diagram-label--tick diagram-label--strong diagram-label--right');
    const cs = G.crossings(l);
    cs.forEach((c) => {
      const p = P(c);
      svgEl('circle', { class: 'mw-crossing', cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 6, fill: '#10131c', stroke: INK, 'stroke-width': 2 }, svg);
      addLabel(svg, wrap, c.letter, p.x + 14 * u.y + 4, p.y + 14 * u.x - 4, 'diagram-label--tick diagram-label--strong');
    });
    // The 21 cm signal along this line: one peak per arm crossed.
    svgEl('line', { x1: SPEC.x0, y1: SPEC.yBase, x2: SPEC.x1, y2: SPEC.yBase, stroke: INK, 'stroke-width': 1.5 }, svg);
    svgEl('line', { class: 'mw-zero', x1: vx(0), y1: SPEC.yTop - 10, x2: vx(0), y2: SPEC.yBase, stroke: MUTED, 'stroke-width': 1, 'stroke-dasharray': '3 4' }, svg);
    [-100, -50, 0, 50, 100].forEach((v) => {
      svgEl('line', { x1: vx(v), y1: SPEC.yBase, x2: vx(v), y2: SPEC.yBase + 6, stroke: INK, 'stroke-width': 1.5 }, svg);
      addLabel(svg, wrap, signed(v), vx(v), SPEC.yBase + 16, 'diagram-label--tick');
    });
    const pts = [];
    for (let x = SPEC.x0; x <= SPEC.x1; x += 1.5) {
      const v = -SPEC.vMax + ((x - SPEC.x0) / (SPEC.x1 - SPEC.x0)) * 2 * SPEC.vMax;
      const h = cs.reduce((sum, c) => sum + Math.exp(-((v - c.v) ** 2) / (2 * 4 ** 2)), 0);
      pts.push(`${x.toFixed(1)},${(SPEC.yBase - Math.min(h, 1.6) * 70).toFixed(1)}`);
    }
    svgEl('polyline', { class: 'mw-signal', points: pts.join(' '), fill: 'none', stroke: INK, 'stroke-width': 2 }, svg);
    // Peak letters, raised a row where two peaks are close together.
    const placed = [];
    [...cs].sort((a, b) => a.v - b.v).forEach((c) => {
      const x = vx(c.v);
      const row = placed.filter((q) => Math.abs(q.x - x) < 26 && q.row === 0).length ? 1 : 0;
      placed.push({ x, row });
      addLabel(svg, wrap, c.letter, x, SPEC.yTop - 18 - row * 26, 'diagram-label--tick diagram-label--strong mw-peak-letter');
    });
    addLabel(svg, wrap, 'speed along the line of sight (km/s)', 320, SPEC.yBase + 48, 'diagram-label--tick');
    addLabel(svg, wrap, '− towards us: blueshift', SPEC.x0 - 40, SPEC.yBase + 78, 'diagram-label--tick diagram-label--right');
    addLabel(svg, wrap, '+ away: redshift', SPEC.x1 + 30, SPEC.yBase + 78, 'diagram-label--tick diagram-label--left');
    addLabel(svg, wrap, '21 cm signal', 16, SPEC.yTop - 46, 'diagram-label--tick diagram-label--right');
    svg.dataset.angle = String(l);
    svg.dataset.peaks = cs.map((c) => `${c.letter}:${Math.round(c.v)}`).join(',');
    const parts = cs.map((c) => `${c.letter}, ${signed(c.v)} km/s (${c.v > 0.5 ? 'moving away: redshift' : c.v < -0.5 ? 'moving towards us: blueshift' : 'hardly moving along the line'})`);
    document.getElementById('radio-readout').textContent = `Looking ${l}° from the centre, the line crosses ${cs.length} arm${cs.length === 1 ? '' : 's'}: ${parts.join('; ')}. Arms inside the Sun's orbit move away (positive); arms outside it, towards us (negative).`;
  }

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }

  drawSky();
  document.querySelectorAll('.mw-view-buttons button').forEach((b) =>
    b.addEventListener('click', () => {
      view = b.dataset.view;
      drawGalaxy();
    }),
  );
  drawGalaxy();
  document.getElementById('look-angle').addEventListener('input', drawRadio);
  drawRadio();
  renderCoverage();
  QuizUI.mount(MilkyWayQuestions.makeQuestions(G));
})();
