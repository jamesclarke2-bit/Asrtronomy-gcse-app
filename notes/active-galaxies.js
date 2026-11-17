(function () {
  const A = window.ActiveGalaxies;
  const AD = window.ActiveGalaxyDrawing;
  const GD = window.GalaxyDrawing;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, svgEl, clearDiagram, addLabel, panel } = D;

  const CURRICULUM_UNITS = ['u6.7'];

  function arrowHead(svg, x, y, angle, size = 9) {
    svgEl('path', { d: `M${x},${y} L${(x - size * Math.cos(angle - 0.45)).toFixed(1)},${(y - size * Math.sin(angle - 0.45)).toFixed(1)} M${x},${y} L${(x - size * Math.cos(angle + 0.45)).toFixed(1)},${(y - size * Math.sin(angle + 0.45)).toFixed(1)}`, stroke: INK, 'stroke-width': 1.8, fill: 'none' }, svg);
  }

  // ------------------------------------------------------------------
  // 1. The AGN, labelled
  // ------------------------------------------------------------------

  function drawAgnDiagram() {
    const svg = document.getElementById('agn-diagram');
    const wrap = document.getElementById('agn-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    AD.drawAgn(svg, wrap, { cx: 320, cy: 170, scale: 1.15, labels: true });
    // Gas spiralling in: curved arrows towards the centre.
    [[-1, 1], [1, -1]].forEach(([sx, sy]) => {
      const x0 = 320 + sx * 190;
      const y0 = 170 + sy * 40;
      const x1 = 320 + sx * 70;
      const y1 = 170 + sy * 8;
      svgEl('path', { class: 'agn-infall', d: `M${x0},${y0} Q${320 + sx * 140},${170 + sy * 4} ${x1},${y1}`, fill: 'none', stroke: MUTED, 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, svg);
      arrowHead(svg, x1, y1, Math.atan2(y1 - (170 + sy * 4), x1 - (320 + sx * 140)));
    });
    addLabel(svg, wrap, 'gas falling in', 545, 108, 'diagram-label--tick');
    addLabel(svg, wrap, 'not to scale', 16, 18, 'diagram-label--tick diagram-label--right');
  }

  // ------------------------------------------------------------------
  // 2. One model, different views
  // ------------------------------------------------------------------

  let power = 'modest';

  function viewAngle() {
    return Number(document.getElementById('view-angle').value);
  }

  function drawView() {
    const svg = document.getElementById('view-diagram');
    const wrap = document.getElementById('view-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const angle = viewAngle();
    document.getElementById('view-angle-label').textContent = `${angle}°`;
    const kind = A.classify(angle, power);
    // Left: the AGN side-on, and your line of sight.
    const c = { x: 160, y: 175 };
    AD.drawAgn(svg, wrap, { cx: c.x, cy: c.y, scale: 0.62 });
    const a = (angle * Math.PI) / 180;
    const far = 140;
    const ex = c.x + far * Math.sin(a);
    const ey = c.y - far * Math.cos(a);
    svgEl('line', { class: 'ag-sight', x1: ex, y1: ey, x2: c.x + 18 * Math.sin(a), y2: c.y - 18 * Math.cos(a), stroke: INK, 'stroke-width': 2, 'stroke-dasharray': '6 4' }, svg);
    arrowHead(svg, c.x + 18 * Math.sin(a), c.y - 18 * Math.cos(a), Math.atan2(c.y - ey, c.x - ex));
    svgEl('circle', { class: 'ag-eye', cx: ex, cy: ey, r: 9, fill: '#10131c', stroke: INK, 'stroke-width': 2 }, svg);
    svgEl('circle', { cx: ex, cy: ey, r: 3.5, fill: INK }, svg);
    addLabel(svg, wrap, 'you', ex + 18, ey - 6, 'diagram-label--tick diagram-label--strong diagram-label--right');
    // Divider, then what you see.
    svgEl('line', { x1: 330, y1: 20, x2: 330, y2: 300, stroke: MUTED, 'stroke-width': 1, 'stroke-dasharray': '3 4' }, svg);
    addLabel(svg, wrap, 'what you see', 480, 24, 'diagram-label--tick');
    const v = { x: 480, y: 160 };
    const t = A.type(kind);
    if (kind === 'blazar') {
      for (let k = 0; k < 12; k += 1) {
        const r = k % 2 ? 40 : 70;
        const th = (k * Math.PI) / 6;
        svgEl('line', { class: 'ag-glare', x1: v.x, y1: v.y, x2: v.x + r * Math.cos(th), y2: v.y + r * Math.sin(th), stroke: '#fff4dc', 'stroke-width': 2, opacity: 0.8 }, svg);
      }
      svgEl('circle', { class: 'ag-point', cx: v.x, cy: v.y, r: 14, fill: '#ffffff' }, svg);
      addLabel(svg, wrap, 'a brilliant, flickering point', v.x, 262, 'diagram-label--tick');
    } else if (kind === 'quasar') {
      [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy]) => svgEl('line', { class: 'ag-glare', x1: v.x, y1: v.y, x2: v.x + dx * 18, y2: v.y + dy * 18, stroke: '#fff4dc', 'stroke-width': 1.5 }, svg));
      svgEl('circle', { class: 'ag-point', cx: v.x, cy: v.y, r: 5, fill: '#ffffff' }, svg);
      addLabel(svg, wrap, 'a star-like point', v.x, 262, 'diagram-label--tick');
    } else {
      GD.drawGalaxy(svg, { kind: 'spiral', sub: 'b', tilt: 0.35, angle: -20 }, v.x, v.y, 80).classList.add('ag-host');
      svgEl('circle', { class: 'ag-point', cx: v.x, cy: v.y, r: 7, fill: '#ffffff' }, svg);
      addLabel(svg, wrap, 'a spiral with a bright centre', v.x, 262, 'diagram-label--tick');
    }
    addLabel(svg, wrap, t.name, v.x, 52, 'diagram-label--tick diagram-label--strong ag-type-name');
    svg.dataset.kind = kind;
    svg.dataset.angle = String(angle);
    document.getElementById('view-readout').textContent = `${angle}° from the jet, ${power === 'huge' ? 'hugely powerful' : 'less powerful'}: a ${t.name.toLowerCase()}, ${t.clue}.`;
    document.querySelectorAll('.ag-power-buttons button').forEach((b) => {
      const on = b.dataset.power === power;
      b.classList.toggle('preset-button-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  // ------------------------------------------------------------------
  // 3. Which band shows what
  // ------------------------------------------------------------------

  const RING = {
    radio: { dx: 0, dy: -26, r: 11 },
    infrared: { dx: 24, dy: 0, r: 11 },
    visible: { dx: 0, dy: 0, r: 17 },
    ultraviolet: { dx: 0, dy: 0, r: 10 },
    xray: { dx: 0, dy: 0, r: 6 },
    gamma: { dx: 0, dy: -13, r: 8 },
  };
  const SHORT = {
    radio: 'jets and lobes',
    infrared: 'dusty ring',
    visible: 'disc and stars',
    ultraviolet: 'hot disc',
    xray: 'hottest gas',
    gamma: 'jet aimed at us',
  };

  function drawBands() {
    const svg = document.getElementById('bands-diagram');
    const wrap = document.getElementById('bands-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const wavelengths = [70, 42, 26, 16, 9, 5];
    A.BANDS.forEach((b, k) => {
      const y = 34 + k * 56;
      // A wave whose wavelength shrinks down the strip.
      const lam = wavelengths[k];
      let d = `M20,${y}`;
      for (let x = 20; x <= 120; x += 1) d += ` L${x.toFixed(1)},${(y + 9 * Math.sin(((x - 20) / lam) * 2 * Math.PI)).toFixed(1)}`;
      svgEl('path', { class: `ag-wave ag-wave--${b.id}`, d, fill: 'none', stroke: INK, 'stroke-width': 2 }, svg);
      addLabel(svg, wrap, b.name, 136, y, 'diagram-label--tick diagram-label--strong diagram-label--right');
      // A small AGN with the part this band shows ringed.
      const ax = 400;
      AD.drawAgn(svg, wrap, { cx: ax, cy: y, scale: 0.26, jetLength: 90 });
      const r = RING[b.id];
      svgEl('circle', { class: `ag-band-ring ag-band-ring--${b.id}`, cx: ax + r.dx, cy: y + r.dy, r: r.r, fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-dasharray': '3 2' }, svg);
      addLabel(svg, wrap, SHORT[b.id], 452, y, 'diagram-label--tick diagram-label--right');
    });
    addLabel(svg, wrap, '↑ longer wavelength', 270, 352, 'diagram-label--tick');
  }

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }

  drawAgnDiagram();
  document.getElementById('view-angle').addEventListener('input', drawView);
  document.querySelectorAll('.ag-power-buttons button').forEach((b) =>
    b.addEventListener('click', () => {
      power = b.dataset.power;
      drawView();
    }),
  );
  drawView();
  drawBands();
  renderCoverage();
  QuizUI.mount(ActiveGalaxiesQuestions.makeQuestions(A));
})();
