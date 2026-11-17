(function () {
  const E = window.BigBangEvidence;
  const GD = window.GalaxyDrawing;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, CURVE, svgEl, clearDiagram, addLabel, panel } = D;

  const CURRICULUM_UNITS = ['u6.3'];

  /** A quasar: a bright four-pointed star. */
  function quasar(svg, x, y, s = 6, cls = 'ev-quasar') {
    const t = s * 0.3;
    svgEl('path', { class: cls, d: `M${x},${y - s} L${x + t},${y - t} L${x + s},${y} L${x + t},${y + t} L${x},${y + s} L${x - t},${y + t} L${x - s},${y} L${x - t},${y - t} Z`, fill: '#fff3c4' }, svg);
  }

  // ------------------------------------------------------------------
  // 1. Quasars: a pictogram chart, one star per unit
  // ------------------------------------------------------------------

  function drawQuasars() {
    const svg = document.getElementById('quasar-diagram');
    const wrap = document.getElementById('quasar-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const x0 = 80;
    const x1 = 610;
    const yBottom = 210;
    const yTop = 40;
    const maxD = 12;
    const X = (d) => x0 + (d / maxD) * (x1 - x0);
    const unit = (yBottom - yTop) / 12;
    svgEl('line', { x1: x0, x2: x1, y1: yBottom, y2: yBottom, stroke: MUTED, 'stroke-width': 1.5 }, svg);
    svgEl('line', { x1: x0, x2: x0, y1: yTop, y2: yBottom, stroke: MUTED, 'stroke-width': 1.5 }, svg);
    for (let d = 0; d <= maxD; d += 2) {
      svgEl('line', { x1: X(d), x2: X(d), y1: yBottom, y2: yBottom + 5, stroke: MUTED }, svg);
      addLabel(svg, wrap, String(d), X(d), yBottom + 16, 'diagram-label--tick');
    }
    E.QUASAR_BINS.forEach((bin) => {
      const cx = (X(bin.from) + X(bin.to)) / 2;
      for (let n = 0; n < bin.count; n += 1) quasar(svg, cx, yBottom - unit * (n + 0.5), Math.min(6, unit * 0.45));
    });
    addLabel(svg, wrap, 'none nearby', (X(0) + X(2)) / 2, yBottom - 22, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'Distance (billion light-years)', (x0 + x1) / 2, yBottom + 46, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'further away = seen further back in time →', (x0 + x1) / 2, yBottom + 80, 'diagram-label--tick');
    addLabel(svg, wrap, 'Number of quasars (one star each)', 8, 18, 'diagram-label--tick diagram-label--right');
  }

  // ------------------------------------------------------------------
  // 2. The CMB: from every direction, one smooth spectrum
  // ------------------------------------------------------------------

  function drawCmb() {
    const svg = document.getElementById('cmb-diagram');
    const wrap = document.getElementById('cmb-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    // Left: microwaves arriving from every direction.
    const ex = 125;
    const ey = 140;
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      const r0 = 100;
      const r1 = 28;
      const xs = ex + r0 * Math.cos(a);
      const ys = ey + r0 * Math.sin(a);
      const xe = ex + r1 * Math.cos(a);
      const ye = ey + r1 * Math.sin(a);
      let d = '';
      for (let t = 0; t <= 1.0001; t += 0.05) {
        const px = xs + (xe - xs) * t;
        const py = ys + (ye - ys) * t;
        const w = 4 * Math.sin(t * Math.PI * 6);
        d += `${t === 0 ? 'M' : 'L'}${(px - w * Math.sin(a)).toFixed(1)},${(py + w * Math.cos(a)).toFixed(1)} `;
      }
      svgEl('path', { class: 'ev-cmb-ray', d, fill: 'none', stroke: CURVE, 'stroke-width': 1.8 }, svg);
      svgEl('polygon', { points: `${xe},${ye} ${(xe + 9 * Math.cos(a) - 4 * Math.sin(a)).toFixed(1)},${(ye + 9 * Math.sin(a) + 4 * Math.cos(a)).toFixed(1)} ${(xe + 9 * Math.cos(a) + 4 * Math.sin(a)).toFixed(1)},${(ye + 9 * Math.sin(a) - 4 * Math.cos(a)).toFixed(1)}`, fill: CURVE }, svg);
    }
    svgEl('circle', { cx: ex, cy: ey, r: 16, fill: '#3b6fb0', stroke: '#c9d6ff', 'stroke-width': 1.5 }, svg);
    addLabel(svg, wrap, 'Earth', ex, ey + 2, 'diagram-label--tick');
    addLabel(svg, wrap, 'the same from', ex, 260, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'every direction', ex, 294, 'diagram-label--tick diagram-label--strong');

    // Right: the spectrum.
    const gx0 = 330;
    const gx1 = 610;
    const gyTop = 72;
    const gyBottom = 222;
    const maxMm = 5;
    const X = (mm) => gx0 + (mm / maxMm) * (gx1 - gx0);
    const Y = (v) => gyBottom - v * (gyBottom - gyTop);
    svgEl('line', { x1: gx0, x2: gx1, y1: gyBottom, y2: gyBottom, stroke: MUTED, 'stroke-width': 1.5 }, svg);
    svgEl('line', { x1: gx0, x2: gx0, y1: gyTop - 10, y2: gyBottom, stroke: MUTED, 'stroke-width': 1.5 }, svg);
    for (let mm = 0; mm <= maxMm; mm += 1) {
      svgEl('line', { x1: X(mm), x2: X(mm), y1: gyBottom, y2: gyBottom + 5, stroke: MUTED }, svg);
      addLabel(svg, wrap, String(mm), X(mm), gyBottom + 16, 'diagram-label--tick');
    }
    const pts = E.cmbCurve(0.15, maxMm, 160);
    svgEl('path', { class: 'ev-cmb-curve', d: pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.mm).toFixed(1)},${Y(p.value).toFixed(1)}`).join(' '), fill: 'none', stroke: CURVE, 'stroke-width': 3 }, svg);
    const peak = E.peakWavelengthMm();
    svgEl('line', { class: 'ev-cmb-peak', x1: X(peak), x2: X(peak), y1: Y(1), y2: gyBottom, stroke: INK, 'stroke-width': 1, 'stroke-dasharray': '3 4' }, svg);
    addLabel(svg, wrap, 'peak near 1 mm', X(peak) + 10, Y(1) - 4, 'diagram-label--tick diagram-label--strong diagram-label--right');
    addLabel(svg, wrap, 'Wavelength (mm)', (gx0 + gx1) / 2, gyBottom + 44, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'Brightness (relative units)', gx0 - 6, 16, 'diagram-label--tick diagram-label--right');
    addLabel(svg, wrap, 'an object at about 2.7 K', (gx0 + gx1) / 2, gyBottom + 78, 'diagram-label--tick');
  }

  // ------------------------------------------------------------------
  // 3. The Hubble Deep Field (a drawing)
  // ------------------------------------------------------------------

  let ringsOn = false;

  function drawDeepField() {
    const svg = document.getElementById('deep-field-diagram');
    const wrap = document.getElementById('deep-field-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const ox = 20;
    const oy = 20;
    E.DEEP_FIELD.far.forEach((g) => {
      const spec = g.kind === 'irregular' ? { kind: 'irregular', seed: g.seed } : { kind: 'elliptical', e: 4, angle: g.angle };
      GD.drawGalaxy(svg, spec, ox + g.x, oy + g.y, g.r).classList.add('ev-far-galaxy');
    });
    E.DEEP_FIELD.near.forEach((g) => {
      const spec = g.kind === 'spiral' ? { kind: 'spiral', sub: 'b', tilt: 0.45, angle: g.angle } : { kind: 'elliptical', e: 4, angle: g.angle };
      GD.drawGalaxy(svg, spec, ox + g.x, oy + g.y, g.r).classList.add('ev-near-galaxy');
    });
    const s = E.DEEP_FIELD.star;
    const sx = ox + s.x;
    const sy = oy + s.y;
    svgEl('line', { class: 'ev-star', x1: sx - 16, x2: sx + 16, y1: sy, y2: sy, stroke: '#ffffff', 'stroke-width': 1.5 }, svg);
    svgEl('line', { x1: sx, x2: sx, y1: sy - 16, y2: sy + 16, stroke: '#ffffff', 'stroke-width': 1.5 }, svg);
    svgEl('circle', { cx: sx, cy: sy, r: 3.5, fill: '#ffffff' }, svg);
    if (ringsOn) {
      E.DEEP_FIELD.far.forEach((g) => {
        svgEl('circle', { class: 'ev-ring', cx: ox + g.x, cy: oy + g.y, r: g.r + 5, fill: 'none', stroke: CURVE, 'stroke-width': 1.5, 'stroke-dasharray': '3 2' }, svg);
      });
    }
    svg.dataset.rings = String(ringsOn);
    const button = document.getElementById('df-ring');
    button.setAttribute('aria-pressed', String(ringsOn));
    button.classList.toggle('preset-button-active', ringsOn);
    button.textContent = ringsOn ? `${E.DEEP_FIELD.far.length} distant galaxies ringed: hide the rings` : 'Ring the most distant galaxies';
  }

  // ------------------------------------------------------------------
  // 4. The CMB map, coarse to fine (a drawing)
  // ------------------------------------------------------------------

  const detail = document.getElementById('cmb-detail');
  const MAP = { cx: 320, cy: 175, rx: 300, ry: 150 };

  function shade(value) {
    const g = Math.round(128 + value * 100);
    return `rgb(${g}, ${g}, ${g})`;
  }

  function drawMap() {
    const svg = document.getElementById('cmb-map');
    const wrap = document.getElementById('cmb-map-wrap');
    const level = Number(detail.value);
    clearDiagram(svg, wrap);
    panel(svg);
    const defs = svgEl('defs', {}, svg);
    const clip = svgEl('clipPath', { id: 'cmb-map-clip' }, defs);
    svgEl('ellipse', { cx: MAP.cx, cy: MAP.cy, rx: MAP.rx, ry: MAP.ry }, clip);
    const g = svgEl('g', { 'clip-path': 'url(#cmb-map-clip)' }, svg);
    const { nx, ny, cells } = E.mapCells(level, 2);
    const w = (2 * MAP.rx) / nx;
    const h = (2 * MAP.ry) / ny;
    const left = MAP.cx - MAP.rx;
    const top = MAP.cy - MAP.ry;
    cells.forEach((c) => {
      svgEl('rect', { class: 'ev-cell', x: (left + c.i * w).toFixed(2), y: (top + c.j * h).toFixed(2), width: (w + 0.6).toFixed(2), height: (h + 0.6).toFixed(2), fill: shade(c.value) }, g);
    });
    // Symbols as well as shading: + warmer, − cooler, on the clearest
    // cells (never colour or shade alone).
    const arm = Math.max(2.5, Math.min(w, h) * 0.28);
    cells.forEach((c) => {
      if (Math.abs(c.value) < 0.45) return;
      const x = left + (c.i + 0.5) * w;
      const y = top + (c.j + 0.5) * h;
      const ink = c.value > 0 ? '#111' : '#f5f5f5';
      svgEl('line', { class: c.value > 0 ? 'ev-plus' : 'ev-minus', x1: x - arm, x2: x + arm, y1: y, y2: y, stroke: ink, 'stroke-width': 1.4 }, g);
      if (c.value > 0) svgEl('line', { x1: x, x2: x, y1: y - arm, y2: y + arm, stroke: ink, 'stroke-width': 1.4 }, g);
    });
    svgEl('ellipse', { cx: MAP.cx, cy: MAP.cy, rx: MAP.rx, ry: MAP.ry, fill: 'none', stroke: INK, 'stroke-width': 1.5 }, svg);
    addLabel(svg, wrap, '+ lighter: slightly warmer', 20, 350, 'diagram-label--tick diagram-label--right');
    addLabel(svg, wrap, '− darker: slightly cooler', 620, 350, 'diagram-label--tick diagram-label--left');
    svg.dataset.level = E.MAP_LEVELS[level].id;
    svg.dataset.cells = String(nx);
    const names = E.MAP_LEVELS.map((l) => l.name);
    document.getElementById('cmb-map-readout').textContent =
      `${names[level]}: ${nx} cells across this drawing. ${level === 0 ? 'Only the biggest patches show.' : 'Finer detail appears inside the same big patches.'} (A drawing, not a real map.)`;
  }

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }

  drawQuasars();
  drawCmb();
  drawDeepField();
  document.getElementById('df-ring').addEventListener('click', () => {
    ringsOn = !ringsOn;
    drawDeepField();
  });
  detail.addEventListener('input', drawMap);
  drawMap();
  renderCoverage();
  Glossary.init({
    cmb: 'The cosmic microwave background (CMB): faint microwave radiation from every direction in the sky, the cooled glow of the hot, dense early Universe.',
  });
  QuizUI.mount(BigBangEvidenceQuestions.makeQuestions(E));
})();
