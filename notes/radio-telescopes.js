(function () {
  const R = window.RadioTelescopes;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, svgEl, clearDiagram, addLabel, panel } = D;

  const CURRICULUM_UNITS = ['u5.5'];
  const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WAVE = '#9fd3ff';
  const METAL = '#c9d3e3';

  function seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function starfield(svg, x0, y0, w, h, n, seed) {
    const rand = seeded(seed);
    for (let i = 0; i < n; i += 1) svgEl('circle', { cx: x0 + 6 + rand() * (w - 12), cy: y0 + 6 + rand() * (h - 12), r: 0.9, fill: '#fff', opacity: 0.35 }, svg);
  }

  function stepNumber(svg, wrap, n, x, y) {
    svgEl('circle', { cx: x, cy: y, r: 12, fill: '#0f1830', stroke: INK, 'stroke-width': 1.5 }, svg);
    addLabel(svg, wrap, n, x, y, 'diagram-label--tick diagram-label--strong rt-step-number');
  }

  /** A length in metres, in the most readable unit. */
  function fmtLength(m) {
    const twoSig = (x) => x.toLocaleString('en-GB', { maximumSignificantDigits: 2 });
    if (m >= 1000) return twoSig(m / 1000) + ' km';
    if (m >= 1) return Math.round(m).toLocaleString('en-GB') + ' m';
    if (m >= 0.01) return twoSig(m * 100) + ' cm';
    return twoSig(m * 1000) + ' mm';
  }

  /** A small number to two significant figures, written out in full. */
  function fmtSig(x) {
    const digits = Math.max(0, 1 - Math.floor(Math.log10(x)));
    return x.toFixed(digits);
  }

  // ------------------------------------------------------------------
  // 1. How a simple radio telescope works
  // ------------------------------------------------------------------

  const DISH = { cx: 200, vertexY: 310, focal: 80, half: 120 };
  const dishY = (x) => DISH.vertexY - ((x - DISH.cx) ** 2) / (4 * DISH.focal);
  const FOCUS = { x: DISH.cx, y: DISH.vertexY - DISH.focal };

  function wavyPath(x, yTop, yBottom) {
    const pts = [];
    for (let y = yTop; y <= yBottom; y += 2) pts.push(`${(x + 5 * Math.sin((2 * Math.PI * (y - yTop)) / 26)).toFixed(1)},${y.toFixed(1)}`);
    return `M${pts.join(' L')}`;
  }

  function drawDish() {
    const svg = document.getElementById('dish-diagram');
    const wrap = document.getElementById('dish-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    starfield(svg, 0, 0, 640, 170, 40, 5);
    // Ground and pedestal.
    svgEl('rect', { x: 0, y: 372, width: 640, height: 28, fill: '#1d2a20' }, svg);
    svgEl('polygon', { points: '160,372 240,372 222,346 178,346', fill: '#55607a', stroke: METAL, 'stroke-width': 1.5 }, svg);
    svgEl('line', { x1: DISH.cx, y1: DISH.vertexY, x2: DISH.cx, y2: 346, stroke: METAL, 'stroke-width': 6 }, svg);
    // Incoming radio waves, then reflected to the focus.
    [110, 150, 250, 290].forEach((x) => {
      svgEl('path', { class: 'rt-wave', d: wavyPath(x, 50, dishY(x)), fill: 'none', stroke: WAVE, 'stroke-width': 2 }, svg);
      svgEl('line', { class: 'rt-reflected', x1: x, y1: dishY(x), x2: FOCUS.x, y2: FOCUS.y, stroke: WAVE, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, svg);
    });
    // The dish: a curved bowl, drawn side-on.
    const rim = [];
    for (let x = DISH.cx - DISH.half; x <= DISH.cx + DISH.half; x += 4) rim.push(`${x},${dishY(x).toFixed(1)}`);
    svgEl('polyline', { class: 'rt-dish', points: rim.join(' '), fill: 'none', stroke: METAL, 'stroke-width': 7, 'stroke-linecap': 'round' }, svg);
    // Struts holding the receiver at the focus.
    [DISH.cx - DISH.half + 10, DISH.cx + DISH.half - 10].forEach((x) => svgEl('line', { x1: x, y1: dishY(x), x2: FOCUS.x, y2: FOCUS.y, stroke: METAL, 'stroke-width': 2 }, svg));
    svgEl('rect', { class: 'rt-receiver', x: FOCUS.x - 10, y: FOCUS.y - 8, width: 20, height: 16, rx: 3, fill: '#e8eef8', stroke: '#0f1830' }, svg);
    // Cable to the amplifier, then the computer.
    svgEl('path', { d: `M${FOCUS.x + 10},${FOCUS.y} L380,${FOCUS.y}`, stroke: '#f5c86b', 'stroke-width': 2.5, fill: 'none' }, svg);
    svgEl('rect', { class: 'rt-amplifier', x: 380, y: 214, width: 90, height: 32, rx: 6, fill: '#2a3550', stroke: INK }, svg);
    svgEl('path', { d: 'M392,230 l10,-8 l10,16 l10,-16 l10,16 l10,-16 l10,8', stroke: '#f5c86b', 'stroke-width': 2, fill: 'none' }, svg);
    svgEl('line', { x1: 470, y1: 230, x2: 510, y2: 230, stroke: '#f5c86b', 'stroke-width': 2.5 }, svg);
    svgEl('rect', { class: 'rt-computer', x: 510, y: 176, width: 112, height: 84, rx: 6, fill: '#05070d', stroke: INK, 'stroke-width': 2 }, svg);
    svgEl('rect', { x: 556, y: 260, width: 20, height: 14, fill: '#55607a' }, svg);
    svgEl('rect', { x: 540, y: 274, width: 52, height: 6, rx: 2, fill: '#55607a' }, svg);
    // A tiny map on the screen.
    R.scan(8, 5, 40).forEach((p) => {
      const v = Math.round(30 + 225 * p.signal);
      svgEl('rect', { x: 522 + p.col * 11, y: 188 + p.row * 12, width: 10, height: 11, fill: `rgb(${v}, ${v}, ${v})` }, svg);
    });

    addLabel(svg, wrap, 'radio waves from space', 200, 26, 'diagram-label--tick');
    stepNumber(svg, wrap, '1', 52, 286);
    addLabel(svg, wrap, 'dish', 52, 320, 'diagram-label--tick');
    stepNumber(svg, wrap, '2', 200, 190);
    addLabel(svg, wrap, 'receiver', 200, 158, 'diagram-label--tick');
    stepNumber(svg, wrap, '3', 425, 186);
    addLabel(svg, wrap, 'amplifier', 425, 272, 'diagram-label--tick');
    stepNumber(svg, wrap, '4', 566, 148);
    addLabel(svg, wrap, 'computer', 566, 304, 'diagram-label--tick');
  }

  // Scanning: one point at a time builds the picture.
  const SCAN = { cols: 16, rows: 10 };
  const scanState = { timer: null };

  function drawScan() {
    const svg = document.getElementById('scan-diagram');
    const wrap = document.getElementById('scan-diagram-wrap');
    const n = Number(document.getElementById('scan').value);
    clearDiagram(svg, wrap);
    panel(svg);
    const sky = { x: 24, y: 72, cell: 14 };
    const map = { x: 352, y: 64, cell: 16 };
    svgEl('rect', { x: sky.x, y: sky.y, width: SCAN.cols * sky.cell, height: SCAN.rows * sky.cell, fill: '#05070d', stroke: MUTED }, svg);
    starfield(svg, sky.x, sky.y, SCAN.cols * sky.cell, SCAN.rows * sky.cell, 18, 11);
    const points = R.scan(SCAN.cols, SCAN.rows, n);
    const centre = (p) => ({ x: sky.x + (p.col + 0.5) * sky.cell, y: sky.y + (p.row + 0.5) * sky.cell });
    // The path along each row scanned so far (left to right, row after row).
    for (let row = 0; row * SCAN.cols < points.length; row += 1) {
      const inRow = points.filter((p) => p.row === row);
      const a = centre(inRow[0]);
      const b = centre(inRow[inRow.length - 1]);
      svgEl('line', { class: 'rt-scan-path', x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: WAVE, 'stroke-width': 1.5, opacity: 0.8 }, svg);
    }
    if (points.length > 0) {
      const c = centre(points[points.length - 1]);
      svgEl('circle', { class: 'rt-beam', cx: c.x, cy: c.y, r: 9, fill: 'none', stroke: '#fff', 'stroke-width': 2.5 }, svg);
    }
    // The map: every cell outlined; scanned cells shaded by signal.
    for (let row = 0; row < SCAN.rows; row += 1) {
      for (let col = 0; col < SCAN.cols; col += 1) {
        svgEl('rect', { x: map.x + col * map.cell, y: map.y + row * map.cell, width: map.cell, height: map.cell, fill: '#05070d', stroke: '#26324a', 'stroke-width': 0.6 }, svg);
      }
    }
    points.forEach((p) => {
      const v = Math.round(30 + 225 * p.signal);
      svgEl('rect', { class: 'rt-map-cell', x: map.x + p.col * map.cell, y: map.y + p.row * map.cell, width: map.cell, height: map.cell, fill: `rgb(${v}, ${v}, ${v})` }, svg);
    });
    // A key: weak to strong.
    for (let k = 0; k < 8; k += 1) {
      const v = Math.round(30 + (225 * k) / 7);
      svgEl('rect', { x: 432 + k * 12, y: 252, width: 12, height: 12, fill: `rgb(${v}, ${v}, ${v})`, stroke: '#26324a', 'stroke-width': 0.6 }, svg);
    }
    svg.dataset.scanned = String(points.length);
    addLabel(svg, wrap, 'the dish scans the sky', 136, 40, 'diagram-label--tick');
    addLabel(svg, wrap, 'the map it builds', 480, 34, 'diagram-label--tick');
    addLabel(svg, wrap, 'weak', 424, 258, 'diagram-label--tick diagram-label--left');
    addLabel(svg, wrap, 'strong', 536, 258, 'diagram-label--tick diagram-label--right');
    document.getElementById('scan-label').textContent = `${points.length} of ${SCAN.cols * SCAN.rows}`;
  }

  function setScanPlaying(on) {
    const btn = document.getElementById('scan-play');
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? 'Pause' : 'Play';
    if (scanState.timer) clearInterval(scanState.timer);
    scanState.timer = null;
    if (!on) return;
    const slider = document.getElementById('scan');
    if (Number(slider.value) >= Number(slider.max)) slider.value = '0';
    scanState.timer = setInterval(() => {
      const next = Number(slider.value) + 1;
      slider.value = String(next);
      drawScan();
      if (next >= Number(slider.max)) setScanPlaying(false);
    }, 70);
  }

  function wireScan() {
    document.getElementById('scan').addEventListener('input', () => {
      setScanPlaying(false);
      drawScan();
    });
    document.getElementById('scan-play').addEventListener('click', (e) => {
      e.stopPropagation();
      setScanPlaying(document.getElementById('scan-play').getAttribute('aria-pressed') !== 'true');
    });
    drawScan();
  }

  // ------------------------------------------------------------------
  // 2. Why radio dishes are so big
  // ------------------------------------------------------------------

  function dishAndWavelength() {
    const d = R.DIAMETER_RANGE_M;
    const w = R.WAVELENGTH_RANGE_M;
    return {
      diameterM: R.logSlider(Number(document.getElementById('diameter').value), d.min, d.max),
      wavelengthM: R.logSlider(Number(document.getElementById('wavelength').value), w.min, w.max),
    };
  }

  function drawSources() {
    const svg = document.getElementById('sources-diagram');
    const wrap = document.getElementById('sources-diagram-wrap');
    const { diameterM, wavelengthM } = dishAndWavelength();
    clearDiagram(svg, wrap);
    panel(svg);
    starfield(svg, 0, 0, 640, 260, 30, 17);
    const theta = R.resolutionArcsec(wavelengthM, diameterM);
    const sep = R.SOURCE_SEPARATION_ARCSEC;
    const apart = 160;
    const blur = Math.min(240, Math.max(6, (theta / sep) * apart));
    const defs = svgEl('defs', {}, svg);
    const grad = svgEl('radialGradient', { id: 'rt-blob' }, defs);
    svgEl('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': 0.95 }, grad);
    svgEl('stop', { offset: '45%', 'stop-color': '#dfe9ff', 'stop-opacity': 0.55 }, grad);
    svgEl('stop', { offset: '100%', 'stop-color': '#dfe9ff', 'stop-opacity': 0 }, grad);
    [240, 400].forEach((x) => svgEl('circle', { class: 'rt-source', cx: x, cy: 130, r: blur.toFixed(1), fill: 'url(#rt-blob)' }, svg));
    // Where the two sources really are.
    svgEl('line', { x1: 240, y1: 46, x2: 400, y2: 46, stroke: MUTED, 'stroke-width': 1.5 }, svg);
    [240, 400].forEach((x) => svgEl('line', { x1: x, y1: 40, x2: x, y2: 52, stroke: MUTED, 'stroke-width': 1.5 }, svg));
    const two = R.separates(wavelengthM, diameterM);
    svg.dataset.separates = String(two);
    svg.dataset.resolutionArcsec = theta.toFixed(1);
    svg.dataset.blur = blur.toFixed(1);
    addLabel(svg, wrap, '10 arcminutes (1/6 of a degree) apart', 320, 24, 'diagram-label--tick');
    addLabel(svg, wrap, two ? 'two separate sources' : 'merged into one blob', 320, 236, 'diagram-label--tick diagram-label--strong');

    document.getElementById('diameter-label').textContent = fmtLength(diameterM);
    document.getElementById('wavelength-label').textContent = fmtLength(wavelengthM);
    document.getElementById('ratio-readout').textContent = `${fmtLength(wavelengthM)} ÷ ${fmtLength(diameterM)} = ${fmtSig(R.detailRatio(wavelengthM, diameterM))}. Smaller means finer detail.`;
    document.getElementById('separate-readout').textContent = two
      ? 'this dish shows them as two separate sources.'
      : 'this dish blurs them into one blob: it cannot tell there are two.';
    document.getElementById('optical-readout').textContent = `an optical telescope would see the same detail, in yellow-green light, with a lens just ${fmtLength(R.equivalentOpticalDiameterM(wavelengthM, diameterM))} across.`;
  }

  function drawCompare() {
    const svg = document.getElementById('compare-diagram');
    const wrap = document.getElementById('compare-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    svgEl('rect', { x: 0, y: 140, width: 640, height: 20, fill: '#1d2a20' }, svg);
    // A small optical telescope on a tripod.
    svgEl('rect', { class: 'rt-optical', x: 82, y: 70, width: 64, height: 16, rx: 3, fill: METAL, transform: 'rotate(-28 114 78)' }, svg);
    [[110, 140], [96, 140], [124, 140]].forEach(([x, y]) => svgEl('line', { x1: 112, y1: 92, x2: x, y2: y, stroke: METAL, 'stroke-width': 2 }, svg));
    // The radio dish that would match it: an enormous shallow bowl.
    const pts = [];
    for (let x = 250; x <= 630; x += 6) pts.push(`${x},${(138 - 50 * (1 - ((x - 440) / 190) ** 2)).toFixed(1)}`);
    svgEl('polyline', { class: 'rt-giant-dish', points: pts.join(' '), fill: 'none', stroke: METAL, 'stroke-width': 5 }, svg);
    svgEl('line', { x1: 250, y1: 36, x2: 630, y2: 36, stroke: MUTED, 'stroke-width': 1.5 }, svg);
    [250, 630].forEach((x) => svgEl('line', { x1: x, y1: 30, x2: x, y2: 42, stroke: MUTED, 'stroke-width': 1.5 }, svg));
    const needed = R.dishNeededM(R.HYDROGEN_LINE_M, 0.1);
    svg.dataset.neededKm = (needed / 1000).toFixed(1);
    addLabel(svg, wrap, 'not to scale', 110, 22, 'diagram-label--tick');
    addLabel(svg, wrap, 'optical telescope', 110, 186, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, '10 cm across', 110, 216, 'diagram-label--tick');
    addLabel(svg, wrap, 'radio dish for the same detail', 440, 186, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, `at 21 cm: about ${Math.round(needed / 1000)} km across`, 440, 216, 'diagram-label--tick');
  }

  function wireSources() {
    ['diameter', 'wavelength'].forEach((id) => document.getElementById(id).addEventListener('input', drawSources));
    drawSources();
    drawCompare();
  }

  // ------------------------------------------------------------------
  // 3. Many dishes working as one
  // ------------------------------------------------------------------

  function drawArray() {
    const svg = document.getElementById('array-diagram');
    const wrap = document.getElementById('array-diagram-wrap');
    const hours = Number(document.getElementById('hours').value);
    clearDiagram(svg, wrap);
    panel(svg);
    const dishes = R.DEMO_ARRAY_KM;
    const L = R.longestBaselineKm(dishes);
    // Left: the dishes from above, cabled to one computer.
    svgEl('rect', { x: 14, y: 80, width: 276, height: 190, rx: 8, fill: '#1d2a20' }, svg);
    const toLeft = (p) => ({ x: 150 + p.x * 10.5, y: 170 - p.y * 12 });
    const computer = { x: 150, y: 250 };
    dishes.forEach((p) => {
      const q = toLeft(p);
      svgEl('line', { x1: q.x, y1: q.y, x2: computer.x, y2: computer.y, stroke: '#f5c86b', 'stroke-width': 1.5, opacity: 0.8 }, svg);
    });
    svgEl('rect', { class: 'rt-array-computer', x: computer.x - 16, y: computer.y - 10, width: 32, height: 20, rx: 3, fill: '#05070d', stroke: INK }, svg);
    dishes.forEach((p) => {
      const q = toLeft(p);
      svgEl('circle', { class: 'rt-array-dish', cx: q.x, cy: q.y, r: 9, fill: '#55607a', stroke: METAL, 'stroke-width': 2 }, svg);
      svgEl('circle', { cx: q.x, cy: q.y, r: 2.5, fill: METAL }, svg);
    });
    const pair = R.baselines(dishes).reduce((a, b) => (b.length > a.length ? b : a));
    const a = toLeft(dishes[pair.i]);
    const b = toLeft(dishes[pair.j]);
    svgEl('line', { class: 'rt-longest', x1: a.x, y1: a.y - 22, x2: b.x, y2: b.y - 22, stroke: INK, 'stroke-width': 1.5, 'stroke-dasharray': '6 4' }, svg);
    // Right: the giant dish they act like, filling in as the Earth turns.
    const centre = { x: 470, y: 182 };
    const radius = 128;
    const scale = radius / (L / 2);
    svgEl('circle', { class: 'rt-giant-outline', cx: centre.x, cy: centre.y, r: radius, fill: '#05070d', stroke: INK, 'stroke-width': 1.5, 'stroke-dasharray': '6 5' }, svg);
    const toRight = (p) => `${(centre.x + p.x * 0.5 * scale).toFixed(1)},${(centre.y - p.y * 0.5 * scale).toFixed(1)}`;
    R.tracks(dishes, hours).forEach((t) => {
      [t.points, t.mirror].forEach((pts) => {
        if (pts.length === 1) {
          const [x, y] = toRight(pts[0]).split(',').map(Number);
          svgEl('circle', { class: 'rt-track', cx: x, cy: y, r: 3, fill: WAVE }, svg);
        } else {
          svgEl('polyline', { class: 'rt-track', points: pts.map(toRight).join(' '), fill: 'none', stroke: WAVE, 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
        }
      });
    });
    const filled = R.coverageFraction(dishes, hours);
    svg.dataset.coverage = filled.toFixed(3);
    addLabel(svg, wrap, 'dishes, seen from above', 150, 22, 'diagram-label--tick');
    addLabel(svg, wrap, `farthest apart: ${Math.round(L)} km`, 150, 56, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'computer', 150, 296, 'diagram-label--tick');
    addLabel(svg, wrap, 'the giant dish they act like', 460, 22, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, `${Math.round(L)} km across`, 460, 326, 'diagram-label--tick');

    document.getElementById('hours-label').textContent = `${hours} hour${hours === 1 ? '' : 's'}`;
    const finer = (Math.round((L * 1000) / R.DEMO_DISH_M / 10) * 10).toLocaleString('en-GB');
    document.getElementById('array-readout').textContent =
      `After ${hours} hour${hours === 1 ? '' : 's'}, the pairs of dishes have filled in about ${Math.round(filled * 100)}% of the giant dish. ` +
      `Together, the dishes pick out detail about ${finer} times finer than one of their own ${R.DEMO_DISH_M} m dishes could.`;
  }

  function wireArray() {
    document.getElementById('hours').addEventListener('input', drawArray);
    drawArray();
  }

  // ------------------------------------------------------------------
  // 4. What radio astronomy found
  // ------------------------------------------------------------------

  function drawDiscoveries() {
    const svg = document.getElementById('discoveries-diagram');
    const wrap = document.getElementById('discoveries-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const panels = [
      { x: 10, y: 10, title: 'Quasar' },
      { x: 330, y: 10, title: 'Black-hole jets' },
      { x: 10, y: 228, title: 'Milky Way structure' },
      { x: 330, y: 228, title: 'Protoplanetary disc' },
    ];
    panels.forEach((p, i) => {
      svgEl('rect', { class: 'rt-find-panel', x: p.x, y: p.y, width: 300, height: 202, rx: 8, fill: '#05070d', stroke: MUTED }, svg);
      starfield(svg, p.x, p.y + 30, 300, 172, 14, 21 + i);
      addLabel(svg, wrap, p.title, p.x + 150, p.y + 20, 'diagram-label--tick diagram-label--strong');
    });
    // Quasar: a star-like point with radio clouds either side.
    const q = { x: 160, y: 126 };
    [-1, 1].forEach((s) => {
      svgEl('line', { x1: q.x, y1: q.y, x2: q.x + s * 92, y2: q.y - s * 18, stroke: WAVE, 'stroke-width': 1.5, opacity: 0.7 }, svg);
      svgEl('ellipse', { cx: q.x + s * 104, cy: q.y - s * 20, rx: 30, ry: 20, fill: WAVE, opacity: 0.35 }, svg);
    });
    svgEl('circle', { cx: q.x, cy: q.y, r: 4, fill: '#fff' }, svg);
    [[0, 14], [14, 0], [0, -14], [-14, 0]].forEach(([dx, dy]) => svgEl('line', { x1: q.x, y1: q.y, x2: q.x + dx, y2: q.y + dy, stroke: '#fff', 'stroke-width': 1.2 }, svg));
    // Jets: a galaxy with two narrow jets from its centre.
    const j = { x: 480, y: 126 };
    svgEl('ellipse', { cx: j.x, cy: j.y, rx: 44, ry: 26, fill: '#ffe9b0', opacity: 0.55 }, svg);
    svgEl('ellipse', { cx: j.x, cy: j.y, rx: 18, ry: 11, fill: '#fff4d6', opacity: 0.8 }, svg);
    [-1, 1].forEach((s) => {
      svgEl('polygon', { points: `${j.x},${j.y - 3} ${j.x},${j.y + 3} ${j.x + s * 128},${j.y + s * 2}`, fill: WAVE, opacity: 0.9 }, svg);
      svgEl('circle', { cx: j.x + s * 128, cy: j.y + s * 2, r: 14, fill: WAVE, opacity: 0.35 }, svg);
    });
    svgEl('circle', { cx: j.x, cy: j.y, r: 3, fill: '#000', stroke: '#fff', 'stroke-width': 1 }, svg);
    // Milky Way: spiral arms traced by hydrogen gas.
    const m = { x: 160, y: 340 };
    for (let arm = 0; arm < 2; arm += 1) {
      const pts = [];
      for (let t = 0; t <= 3.6; t += 0.08) {
        const r = 15 * Math.exp(0.42 * t);
        const a = t + arm * Math.PI;
        pts.push(`${(m.x + r * Math.cos(a) * 1.25).toFixed(1)},${(m.y + r * Math.sin(a) * 0.8).toFixed(1)}`);
      }
      svgEl('polyline', { class: 'rt-arm', points: pts.join(' '), fill: 'none', stroke: WAVE, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.85 }, svg);
    }
    svgEl('ellipse', { cx: m.x, cy: m.y, rx: 14, ry: 9, fill: '#ffe9b0', opacity: 0.9 }, svg);
    // Protoplanetary disc: a young star in a dusty disc with gaps.
    const d = { x: 480, y: 340 };
    [[118, 40, 0.5], [96, 32, 0], [78, 26, 0.55], [60, 20, 0], [44, 14, 0.65]].forEach(([rx, ry, op]) => {
      svgEl('ellipse', { class: op ? 'rt-ring' : 'rt-gap', cx: d.x, cy: d.y, rx, ry, fill: op ? '#e7b98a' : '#05070d', opacity: op || 1 }, svg);
    });
    svgEl('circle', { cx: d.x, cy: d.y, r: 7, fill: '#fff4d6' }, svg);
  }

  // ------------------------------------------------------------------

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }

  drawDish();
  wireScan();
  wireSources();
  wireArray();
  drawDiscoveries();
  renderCoverage();
  Glossary.init({
    resolution:
      'Resolution: how fine a detail a telescope can pick out, such as whether two sources close together on the sky show as two or blur into one. Covered for optical telescopes on Telescopes: Magnification, Light Grasp and Resolution.',
    aperture:
      'Aperture: the diameter of the part of a telescope that collects the waves: the dish of a radio telescope, or the main lens or mirror of an optical one.',
  });
  QuizUI.mount(RadioTelescopesQuestions.makeQuestions(R));
  document.body.classList.toggle('rt-reduced-motion', Boolean(REDUCED_MOTION));
})();
