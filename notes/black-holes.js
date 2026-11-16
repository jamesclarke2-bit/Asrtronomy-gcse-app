(function () {
  const B = window.BlackHoleEvidence;
  const M = window.MassiveStar;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, svgEl, clearDiagram, addLabel, panel } = D;

  const CURRICULUM_UNITS = ['u4.16'];

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

  function glowDefs(svg) {
    const defs = svgEl('defs', {}, svg);
    [['bh-glow-blue', '#ffffff', '#9fc0ff'], ['bh-glow-disc', '#fff6dd', '#ff9a4d']].forEach(([id, inner, outer]) => {
      const g = svgEl('radialGradient', { id }, defs);
      svgEl('stop', { offset: '0%', 'stop-color': inner }, g);
      svgEl('stop', { offset: '100%', 'stop-color': outer }, g);
    });
    return defs;
  }

  /** A wavy arrow, for X-rays. */
  function wavyArrow(svg, x, y, dx, dy, cls) {
    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;
    let d = `M${x.toFixed(1)},${y.toFixed(1)}`;
    for (let s = 0; s <= len; s += 4) {
      const w = 5 * Math.sin(s / 4);
      d += ` L${(x + ux * s - uy * w).toFixed(1)},${(y + uy * s + ux * w).toFixed(1)}`;
    }
    svgEl('path', { class: cls, d, fill: 'none', stroke: '#cfe0ff', 'stroke-width': 2 }, svg);
    const ex = x + dx;
    const ey = y + dy;
    const a = Math.atan2(dy, dx);
    svgEl('path', { d: `M${ex.toFixed(1)},${ey.toFixed(1)} L${(ex - 9 * Math.cos(a - 0.45)).toFixed(1)},${(ey - 9 * Math.sin(a - 0.45)).toFixed(1)} M${ex.toFixed(1)},${ey.toFixed(1)} L${(ex - 9 * Math.cos(a + 0.45)).toFixed(1)},${(ey - 9 * Math.sin(a + 0.45)).toFixed(1)}`, stroke: '#cfe0ff', 'stroke-width': 2, fill: 'none' }, svg);
  }

  // ------------------------------------------------------------------
  // 1. Seen by what it does: an X-ray binary
  // ------------------------------------------------------------------

  function drawXrb() {
    const svg = document.getElementById('xrb-diagram');
    const wrap = document.getElementById('xrb-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    glowDefs(svg);
    starfield(svg, 640, 300, 70, 71);
    // The star, stretched towards its partner.
    svgEl('path', { class: 'bh-star', d: 'M70,150 C70,70 190,60 240,120 Q262,150 240,180 C190,240 70,230 70,150 Z', fill: 'url(#bh-glow-blue)' }, svg);
    // The gas stream into the disc.
    svgEl('path', { class: 'bh-stream', d: 'M246,148 C320,140 380,120 448,136', fill: 'none', stroke: '#ffcf9f', 'stroke-width': 7, opacity: 0.8, 'stroke-linecap': 'round' }, svg);
    const c = { x: 470, y: 150 };
    [[110, 26, 0.35], [80, 19, 0.6], [52, 12, 0.85]].forEach(([rx, ry, op]) => svgEl('ellipse', { class: 'bh-disc', cx: c.x, cy: c.y, rx, ry, fill: 'url(#bh-glow-disc)', opacity: op }, svg));
    svgEl('circle', { class: 'bh-hole', cx: c.x, cy: c.y, r: 9, fill: '#000', stroke: '#ffcf9f', 'stroke-width': 1 }, svg);
    [[-1, -1], [1, -1], [1, 1]].forEach(([sx, sy]) => wavyArrow(svg, c.x + sx * 60, c.y + sy * 26, sx * 40, sy * 40, 'bh-xray'));
    addLabel(svg, wrap, 'visible star', 150, 262, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'gas pulled off', 250, 84, 'diagram-label--tick');
    addLabel(svg, wrap, 'hot disc gives out X-rays', 470, 262, 'diagram-label--tick diagram-label--strong');
    svgEl('line', { class: 'bh-hole-leader', x1: c.x - 30, y1: c.y + 6, x2: c.x - 40, y2: 208, stroke: INK, 'stroke-width': 1.5 }, svg);
    addLabel(svg, wrap, 'black hole (unseen) at the centre', c.x - 40, 222, 'diagram-label--tick');
    addLabel(svg, wrap, 'not to scale', 16, 20, 'diagram-label--tick diagram-label--right');
  }

  // ------------------------------------------------------------------
  // 2. Evidence 1: X-ray binaries, the mass check
  // ------------------------------------------------------------------

  function drawCompanion() {
    const svg = document.getElementById('companion-diagram');
    const wrap = document.getElementById('companion-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    glowDefs(svg);
    // Left: two orbits round the shared centre of mass; the heavier body has the smaller orbit.
    const cm = { x: 150, y: 126 };
    svgEl('circle', { class: 'bh-orbit bh-orbit--star', cx: cm.x, cy: cm.y, r: 88, fill: 'none', stroke: MUTED, 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }, svg);
    svgEl('circle', { class: 'bh-orbit bh-orbit--hole', cx: cm.x, cy: cm.y, r: 30, fill: 'none', stroke: INK, 'stroke-width': 1.5, 'stroke-dasharray': '2 4' }, svg);
    svgEl('path', { d: `M${cm.x - 6},${cm.y - 6} L${cm.x + 6},${cm.y + 6} M${cm.x + 6},${cm.y - 6} L${cm.x - 6},${cm.y + 6}`, stroke: INK, 'stroke-width': 2 }, svg);
    svgEl('circle', { class: 'bh-star', cx: cm.x - 88, cy: cm.y, r: 18, fill: 'url(#bh-glow-blue)' }, svg);
    svgEl('circle', { class: 'bh-hole', cx: cm.x + 30, cy: cm.y, r: 6, fill: '#000', stroke: '#ffcf9f', 'stroke-width': 1.5 }, svg);
    addLabel(svg, wrap, 'visible star: big orbit', 16, 236, 'diagram-label--tick diagram-label--right');
    addLabel(svg, wrap, 'partner: small orbit, heavier', 16, 268, 'diagram-label--tick diagram-label--strong diagram-label--right');
    addLabel(svg, wrap, 'centre of mass', cm.x, cm.y + 20, 'diagram-label--tick');
    // Right: the mass check, by words and a tick, not colour.
    const m = B.CYGNUS_X1.companionMsun;
    const rows = [
      { id: 'white-dwarf', text: `white dwarf: up to ${M.CHANDRASEKHAR_MSUN}`, ok: false },
      { id: 'neutron-star', text: `neutron star: up to ${M.NEUTRON_STAR_MAX_MSUN}`, ok: false },
      { id: 'black-hole', text: `black hole: above ${M.NEUTRON_STAR_MAX_MSUN}`, ok: B.mustBeBlackHole(m) },
    ];
    addLabel(svg, wrap, 'mass check (Sun masses)', 470, 34, 'diagram-label--tick diagram-label--strong');
    rows.forEach((r, k) => {
      const y = 78 + k * 48;
      svgEl('rect', { class: `bh-check bh-check--${r.id}${r.ok ? ' bh-check--yes' : ''}`, x: 330, y: y - 18, width: 290, height: 36, rx: 6, fill: 'none', stroke: INK, 'stroke-width': r.ok ? 3 : 1, 'stroke-dasharray': r.ok ? 'none' : '4 4' }, svg);
      addLabel(svg, wrap, `${r.ok ? '✓ ' : '✗ '}${r.text}`, 346, y, `diagram-label--tick diagram-label--right${r.ok ? ' diagram-label--strong' : ''}`);
    });
    addLabel(svg, wrap, `partner: about ${m}`, 470, 232, 'diagram-label--tick diagram-label--strong');
    svg.dataset.companion = String(m);
    svg.dataset.verdict = B.mustBeBlackHole(m) ? 'black-hole' : 'not-black-hole';
    document.getElementById('companion-readout').textContent =
      `In Cygnus X-1, the visible star's orbit shows its unseen partner has about ${m} times the Sun's mass. That is far more than any neutron star can have (about ${M.NEUTRON_STAR_MAX_MSUN}), and something that heavy, shining in X-rays but not in visible light, can only be a black hole.`;
  }

  // ------------------------------------------------------------------
  // 3. Evidence 2: S2 at the centre of the Milky Way
  // ------------------------------------------------------------------

  const ORBIT = { cx: 560, cy: 150, scale: 0.26 };
  const xy = (p) => ({ x: ORBIT.cx + p.x * ORBIT.scale, y: ORBIT.cy - p.y * ORBIT.scale });

  function year() {
    return Number(document.getElementById('s2-year').value);
  }

  function drawS2() {
    const svg = document.getElementById('s2-diagram');
    const wrap = document.getElementById('s2-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    glowDefs(svg);
    starfield(svg, 640, 320, 50, 73);
    const y0 = year();
    document.getElementById('s2-year-label').textContent = y0 % 1 === 0 ? String(y0) : y0.toFixed(2);
    // The whole orbit.
    const pts = [];
    for (let t = 0; t <= 16.001; t += 0.05) pts.push(xy(B.s2At(B.S2.closestYear + t)));
    svgEl('polyline', { class: 'bh-s2-orbit', points: pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '), fill: 'none', stroke: MUTED, 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }, svg);
    // Where the unseen mass sits: a marked spot, nothing drawn there.
    svgEl('circle', { class: 'bh-centre', cx: ORBIT.cx, cy: ORBIT.cy, r: 7, fill: 'none', stroke: INK, 'stroke-width': 1.5, 'stroke-dasharray': '2 3' }, svg);
    svgEl('path', { d: `M${ORBIT.cx - 4},${ORBIT.cy - 4} L${ORBIT.cx + 4},${ORBIT.cy + 4} M${ORBIT.cx + 4},${ORBIT.cy - 4} L${ORBIT.cx - 4},${ORBIT.cy + 4}`, stroke: INK, 'stroke-width': 1.5 }, svg);
    // Earlier positions, one per year since 2002: bunched far out, spread close in.
    for (let yr = 2002; yr < y0 - 1e-9; yr += 1) {
      const p = xy(B.s2At(yr));
      svgEl('circle', { class: 'bh-s2-past', cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 3, fill: MUTED }, svg);
    }
    const now = B.s2At(y0);
    const p = xy(now);
    svgEl('circle', { class: 'bh-s2-now', cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 7, fill: '#fff6d8', stroke: INK, 'stroke-width': 1.5 }, svg);
    addLabel(svg, wrap, 'S2', p.x, p.y < 70 ? p.y + 22 : p.y - 20, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'unseen mass', ORBIT.cx - 10, ORBIT.cy + 30, 'diagram-label--tick diagram-label--strong diagram-label--left');
    addLabel(svg, wrap, 'dots: one a year since 2002', 16, 20, 'diagram-label--tick diagram-label--right');
    // A scale bar: 1,000 AU.
    const bar = 1000 * ORBIT.scale;
    svgEl('line', { class: 'bh-scale', x1: 20, y1: 302, x2: 20 + bar, y2: 302, stroke: INK, 'stroke-width': 2 }, svg);
    [20, 20 + bar].forEach((x) => svgEl('line', { x1: x, y1: 296, x2: x, y2: 308, stroke: INK, 'stroke-width': 2 }, svg));
    addLabel(svg, wrap, '1,000 AU', 30 + bar, 302, 'diagram-label--tick diagram-label--right');
    svg.dataset.year = String(y0);
    svg.dataset.distanceAu = now.r.toFixed(0);
    svg.dataset.speedKms = now.speedKms.toFixed(0);
    const close = now.r < 200;
    document.getElementById('s2-readout').textContent =
      `${document.getElementById('s2-year-label').textContent}: S2 is about ${Math.round(now.r / 10) * 10} AU from the unseen mass, moving at about ${(Math.round(now.speedKms / 100) * 100).toLocaleString('en-GB')} km/s${close ? ', its fastest, as it swings closest' : now.r > 1700 ? ', its slowest, far out' : ''}.`;
  }

  // ------------------------------------------------------------------

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }

  drawXrb();
  drawCompanion();
  document.getElementById('s2-year').addEventListener('input', drawS2);
  drawS2();
  renderCoverage();
  Glossary.init({
    accretionDisc:
      'An accretion disc: a flat, spinning disc of gas spiralling in towards a black hole (or other compact object). Friction heats the gas to millions of degrees, so it shines in X-rays. More on Space telescopes.',
  });
  QuizUI.mount(BlackHoleEvidenceQuestions.makeQuestions(B, M));
})();
