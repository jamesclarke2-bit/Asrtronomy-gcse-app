/**
 * Draws the Milky Way face-on or edge-on, for notes/our-galaxy.html and
 * its "place the objects" practice question. Every feature is told apart
 * by its shape as well as its colour:
 *   Sun: a ringed disc with a dot (☉); star-forming region: a four-point
 *   star; globular cluster: a small circle packed with dots; dust lane: a
 *   dark dashed line; bar: a long oval; arms: broad glowing bands.
 * Positions come from MilkyWay (src/milkyWay.js). Browser only.
 */
(function () {
  const G = window.MilkyWay;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, svgEl, addLabel } = D;

  const ARM_FILL = '#c9d6ff';
  const DUST = '#2a1c10';
  const SFR = '#ff9fb4';
  const SUN_FILL = '#ffe27a';
  const CLUSTER = '#ffd7a1';

  // Globular clusters in the halo: (angle round the centre, distance from
  // it as a fraction of the disc radius, height above the disc as a
  // fraction), fixed so every view and redraw matches.
  const CLUSTERS = [
    [0.3, 0.55, 0.62], [1.1, 0.8, -0.45], [1.9, 0.4, 0.8], [2.6, 0.9, 0.3], [3.3, 0.6, -0.75],
    [4.0, 0.85, 0.55], [4.7, 0.5, -0.5], [5.4, 0.95, -0.2], [5.9, 0.7, 0.9], [2.2, 0.3, -0.92],
  ];

  function defs(svg, prefix) {
    const d = svgEl('defs', {}, svg);
    const g = svgEl('radialGradient', { id: `${prefix}-glow` }, d);
    svgEl('stop', { offset: '0%', 'stop-color': '#fff1c9', 'stop-opacity': 0.9 }, g);
    svgEl('stop', { offset: '35%', 'stop-color': '#c9d6ff', 'stop-opacity': 0.35 }, g);
    svgEl('stop', { offset: '100%', 'stop-color': '#c9d6ff', 'stop-opacity': 0 }, g);
  }

  function sunSymbol(svg, x, y, cls) {
    svgEl('circle', { class: cls, cx: x, cy: y, r: 7, fill: SUN_FILL, stroke: INK, 'stroke-width': 1.5 }, svg);
    svgEl('circle', { cx: x, cy: y, r: 1.8, fill: '#3a2a00' }, svg);
  }

  function sfrSymbol(svg, x, y, size = 6) {
    const s = size;
    const t = s * 0.3;
    svgEl('path', { class: 'mw-sfr', d: `M${x},${y - s} L${x + t},${y - t} L${x + s},${y} L${x + t},${y + t} L${x},${y + s} L${x - t},${y + t} L${x - s},${y} L${x - t},${y - t} Z`, fill: SFR }, svg);
  }

  function clusterSymbol(svg, x, y) {
    svgEl('circle', { class: 'mw-cluster', cx: x, cy: y, r: 5, fill: 'none', stroke: CLUSTER, 'stroke-width': 1 }, svg);
    [[0, 0], [-2, -1.5], [2, -1.5], [-2, 1.8], [2, 1.8], [0, -3], [0, 3]].forEach(([dx, dy]) => svgEl('circle', { cx: x + dx, cy: y + dy, r: 0.9, fill: CLUSTER }, svg));
  }

  function dustSymbol(svg, x1, y1, x2, y2) {
    svgEl('line', { x1, y1, x2, y2, stroke: DUST, 'stroke-width': 4, 'stroke-dasharray': '6 3' }, svg);
  }

  /** Face-on geometry: centre (cx, cy), `s` drawing units per kly. */
  function faceOn(svg, { cx, cy, s, prefix = 'mw', sfr = true, clusters = true }) {
    const P = (p) => ({ x: cx + p.x * s, y: cy - p.y * s });
    svgEl('circle', { cx, cy, r: G.DISC_RADIUS_KLY * s * 1.05, fill: `url(#${prefix}-glow)` }, svg);
    G.ARMS.forEach((arm) => {
      const pts = arm.points.map(P).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
      svgEl('polyline', { class: `mw-arm${arm.major ? ' mw-arm--major' : ''}`, points: pts, fill: 'none', stroke: ARM_FILL, 'stroke-width': (arm.major ? 3.4 : 2.2) * s, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: arm.major ? 0.45 : 0.3 }, svg);
      // A dust lane along the inner edge of each major arm.
      if (arm.major) {
        const inner = arm.points.filter((_, k) => k > 8).map((p) => ({ x: p.x * 0.95, y: p.y * 0.95 })).map(P);
        svgEl('polyline', { class: 'mw-dust', points: inner.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '), fill: 'none', stroke: DUST, 'stroke-width': 3, 'stroke-dasharray': '6 3', opacity: 0.9 }, svg);
      }
      if (sfr) arm.points.forEach((p, k) => { if (k % 55 === 30) { const q = P(p); sfrSymbol(svg, q.x, q.y); } });
    });
    // The bar and the central bulge.
    const deg = (-G.ARM_TURN * 180) / Math.PI;
    // (SVG rotates clockwise, the model anticlockwise, hence the minus sign.)
    svgEl('ellipse', { class: 'mw-bar', cx, cy, rx: G.BAR_HALF_LENGTH_KLY * s, ry: 3.6 * s, fill: '#fff1c9', opacity: 0.85, transform: `rotate(${deg.toFixed(1)} ${cx} ${cy})` }, svg);
    svgEl('circle', { cx, cy, r: 4 * s, fill: '#fff6dd', opacity: 0.7 }, svg);
    if (clusters) {
      CLUSTERS.forEach(([a, f]) => {
        const r = G.DISC_RADIUS_KLY * s * (0.75 + 0.35 * f);
        clusterSymbol(svg, cx + r * Math.cos(a), cy - r * Math.sin(a));
      });
    }
    const sun = P(G.sun());
    sunSymbol(svg, sun.x, sun.y, 'mw-sun');
    return { sun, P };
  }

  /** Edge-on geometry: centre (cx, cy), `s` units per kly across; the disc's thickness is drawn exaggerated. */
  function edgeOn(svg, { cx, cy, s, prefix = 'mw' }) {
    const R = G.DISC_RADIUS_KLY * s;
    svgEl('circle', { class: 'mw-halo', cx, cy, r: R * 1.08, fill: 'none', stroke: MUTED, 'stroke-width': 1, 'stroke-dasharray': '2 5' }, svg);
    svgEl('ellipse', { cx, cy, rx: R, ry: 22, fill: `url(#${prefix}-glow)` }, svg);
    svgEl('ellipse', { class: 'mw-disc', cx, cy, rx: R, ry: 7, fill: ARM_FILL, opacity: 0.45 }, svg);
    svgEl('ellipse', { class: 'mw-bulge', cx, cy, rx: 7 * s, ry: 4.5 * s, fill: '#fff1c9', opacity: 0.85 }, svg);
    svgEl('line', { class: 'mw-dust', x1: cx - R * 0.95, y1: cy, x2: cx + R * 0.95, y2: cy, stroke: DUST, 'stroke-width': 3, 'stroke-dasharray': '6 3' }, svg);
    [-0.8, -0.55, -0.3, 0.35, 0.6, 0.85].forEach((f) => sfrSymbol(svg, cx + f * R, cy - 1, 5));
    const clusters = CLUSTERS.map(([a, f, h]) => {
      const x = cx + Math.cos(a) * R * 0.95 * f;
      const y = cy - h * R * 0.92;
      clusterSymbol(svg, x, y);
      return { x, y };
    });
    const sun = { x: cx - G.SUN_FROM_CENTRE_KLY * s, y: cy };
    sunSymbol(svg, sun.x, sun.y, 'mw-sun');
    return { sun, clusters, R };
  }

  /** The legend: one row per feature, told apart by shape. */
  function legend(svg, wrap, y0) {
    const rows = [
      [(x, y) => sunSymbol(svg, x, y), 'the Sun'],
      [(x, y) => sfrSymbol(svg, x, y), 'star-forming region'],
      [(x, y) => clusterSymbol(svg, x, y), 'globular cluster'],
      [(x, y) => dustSymbol(svg, x - 12, y, x + 12, y), 'dust lane (dark)'],
    ];
    rows.forEach(([draw, text], k) => {
      const x = k % 2 === 0 ? 40 : 340;
      const y = y0 + Math.floor(k / 2) * 34;
      draw(x, y);
      addLabel(svg, wrap, text, x + 22, y, 'diagram-label--tick diagram-label--right');
    });
  }

  /** The whole labelled galaxy, for the page: view 'face' or 'edge'. SVG viewBox 640 x 520. */
  function drawGalaxy(svg, wrap, view) {
    defs(svg, 'mw');
    const cx = 320;
    const cy = 210;
    const s = 3.5;
    if (view === 'face') {
      const { sun } = faceOn(svg, { cx, cy, s });
      addLabel(svg, wrap, 'Sun', sun.x + 14, sun.y + 2, 'diagram-label--tick diagram-label--strong diagram-label--right');
      addLabel(svg, wrap, 'central bar', cx, cy - 34, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'face-on: seen from above', 16, 18, 'diagram-label--tick diagram-label--right');
      // A leader from the label to the nearest point on an arm.
      const target = { x: 520, y: 92 };
      let best = null;
      G.ARMS.forEach((arm) => arm.points.forEach((p) => {
        const q = { x: cx + p.x * s, y: cy - p.y * s };
        const dd = Math.hypot(q.x - target.x, q.y - target.y);
        if (!best || dd < best.dd) best = { ...q, dd };
      }));
      svgEl('line', { class: 'mw-arm-leader', x1: 560, y1: 70, x2: best.x, y2: best.y, stroke: INK, 'stroke-width': 1.2 }, svg);
      addLabel(svg, wrap, 'spiral arms', 570, 58, 'diagram-label--tick');
    } else {
      const { sun } = edgeOn(svg, { cx, cy, s });
      addLabel(svg, wrap, 'Sun, in the disc', sun.x, sun.y + 26, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'bulge and bar', cx + 70, cy - 30, 'diagram-label--tick diagram-label--strong diagram-label--right');
      addLabel(svg, wrap, 'halo', cx + 150, cy - 150, 'diagram-label--tick');
      addLabel(svg, wrap, 'edge-on: seen from the side (thickness exaggerated)', 16, 18, 'diagram-label--tick diagram-label--right');
    }
    // Scale: the disc's width.
    const y = 412;
    const R = G.DISC_RADIUS_KLY * s;
    svgEl('line', { class: 'mw-scale', x1: cx - R, y1: y, x2: cx + R, y2: y, stroke: INK, 'stroke-width': 1.5 }, svg);
    [cx - R, cx + R].forEach((x) => svgEl('line', { x1: x, y1: y - 6, x2: x, y2: y + 6, stroke: INK, 'stroke-width': 1.5 }, svg));
    addLabel(svg, wrap, `about ${(G.DISC_DIAMETER_KLY * 1000).toLocaleString('en-GB')} light-years across`, cx, y + 18, 'diagram-label--tick');
    legend(svg, wrap, 458);
    svg.dataset.view = view;
  }

  /**
   * The edge-on galaxy with four lettered places and no labels, for the
   * "place the objects" question: A a globular cluster in the halo, B the
   * Sun, C the dust lane, D the central bulge. SVG viewBox 400 x 260.
   */
  const QUIZ_LETTERS = G.QUIZ_LETTERS;

  function drawQuiz(svg, wrap) {
    defs(svg, 'mwq');
    const cx = 200;
    const cy = 135;
    const s = 3.2;
    const { sun, clusters, R } = edgeOn(svg, { cx, cy, s, prefix: 'mwq' });
    const c = clusters[4];
    const spots = {
      cluster: { x: c.x, y: c.y },
      sun: { x: sun.x, y: sun.y },
      dust: { x: cx + R * 0.72, y: cy },
      bulge: { x: cx, y: cy },
    };
    const offsets = { cluster: [-18, -14], sun: [0, 24], dust: [0, 24], bulge: [0, -30] };
    Object.entries(spots).forEach(([key, p]) => {
      const [dx, dy] = offsets[key];
      svgEl('line', { x1: p.x, y1: p.y, x2: p.x + dx * 0.7, y2: p.y + dy * 0.7, stroke: INK, 'stroke-width': 1 }, svg);
      addLabel(svg, wrap, QUIZ_LETTERS[key], p.x + dx, p.y + dy, 'diagram-label--tick diagram-label--strong mw-quiz-letter');
    });
    addLabel(svg, wrap, 'edge-on (thickness exaggerated)', 10, 14, 'diagram-label--tick diagram-label--right');
  }

  window.MilkyWayDrawing = { drawGalaxy, drawQuiz, faceOn, sunSymbol, sfrSymbol, clusterSymbol, QUIZ_LETTERS, defs };
})();
