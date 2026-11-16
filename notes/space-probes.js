(function () {
  const P = window.SpaceProbes;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, svgEl, clearDiagram, addLabel, panel } = D;

  const CURRICULUM_UNITS = ['u5.3'];
  const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const METAL = '#d7dde8';
  const PANEL_BLUE = '#5b7bd5';
  const ROCK = '#8a8178';
  const DUST = '#ffe9b0';

  function seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function starfield(svg, w, h, n, seed) {
    const rand = seeded(seed);
    for (let i = 0; i < n; i += 1) svgEl('circle', { cx: (6 + rand() * (w - 12)).toFixed(1), cy: (6 + rand() * (h - 12)).toFixed(1), r: 0.9, fill: '#fff', opacity: 0.4 }, svg);
  }

  /** A small probe: a body, a dish and two solar panels. */
  function probe(svg, x, y, scale, cls) {
    const g = svgEl('g', { class: cls, transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale})` }, svg);
    [-24, 8].forEach((px) => svgEl('rect', { x: px, y: -4, width: 16, height: 8, fill: PANEL_BLUE, stroke: METAL, 'stroke-width': 0.8 }, g));
    svgEl('rect', { x: -8, y: -7, width: 16, height: 14, rx: 2, fill: METAL }, g);
    svgEl('path', { d: 'M-6,-7 Q0,-17 6,-7 Z', fill: '#ffffff' }, g);
    return g;
  }

  /** A small lander: a body on three legs. */
  function lander(svg, x, y, scale, cls) {
    const g = svgEl('g', { class: cls, transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale})` }, svg);
    [[-12, 0], [0, 2], [12, 0]].forEach(([fx, fy]) => svgEl('line', { x1: 0, y1: -10, x2: fx, y2: fy, stroke: METAL, 'stroke-width': 2 }, g));
    svgEl('rect', { x: -9, y: -20, width: 18, height: 12, rx: 2, fill: METAL }, g);
    svgEl('rect', { x: -7, y: -18, width: 14, height: 4, fill: PANEL_BLUE }, g);
    return g;
  }

  function arrowHead(svg, x, y, angle, cls) {
    const a = angle;
    svgEl('path', { class: cls, d: `M${x.toFixed(1)},${y.toFixed(1)} L${(x - 11 * Math.cos(a - 0.4)).toFixed(1)},${(y - 11 * Math.sin(a - 0.4)).toFixed(1)} M${x.toFixed(1)},${y.toFixed(1)} L${(x - 11 * Math.cos(a + 0.4)).toFixed(1)},${(y - 11 * Math.sin(a + 0.4)).toFixed(1)}`, stroke: INK, 'stroke-width': 2.5, fill: 'none' }, svg);
  }

  /** A cratered grey body. */
  function cratered(svg, cx, cy, r, seed) {
    svgEl('circle', { class: 'pr-target', cx, cy, r, fill: ROCK }, svg);
    const rand = seeded(seed);
    for (let i = 0; i < 9; i += 1) {
      const a = rand() * Math.PI * 2;
      const d = rand() * r * 0.75;
      svgEl('circle', { cx: (cx + d * Math.cos(a)).toFixed(1), cy: (cy + d * Math.sin(a)).toFixed(1), r: (3 + rand() * 7).toFixed(1), fill: '#6f675f', stroke: '#a39a90', 'stroke-width': 1 }, svg);
    }
  }

  const quad = (p0, c, p1, t) => ({
    x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * c.x + t * t * p1.x,
    y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * c.y + t * t * p1.y,
  });

  // ------------------------------------------------------------------
  // 1. Four ways to visit
  // ------------------------------------------------------------------

  const typeState = { chosen: 'orbiter', phase: 0.3, timer: null };
  const BODY = { x: 320, y: 160, r: 62 };

  function drawTypes() {
    const svg = document.getElementById('types-diagram');
    const wrap = document.getElementById('types-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    starfield(svg, 640, 320, 50, 5);
    const t = typeState.phase;
    const id = typeState.chosen;
    svg.dataset.type = id;
    if (id === 'orbiter') {
      svgEl('ellipse', { class: 'pr-path pr-path--orbiter', cx: BODY.x, cy: BODY.y, rx: 150, ry: 78, fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-dasharray': '7 5' }, svg);
    }
    cratered(svg, BODY.x, BODY.y, BODY.r, 11);
    if (id === 'flyby') {
      const p0 = { x: 30, y: 270 };
      const c = { x: 320, y: -80 };
      const p1 = { x: 610, y: 270 };
      svgEl('path', { class: 'pr-path pr-path--flyby', d: `M${p0.x},${p0.y} Q${c.x},${c.y} ${p1.x},${p1.y}`, fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-dasharray': '7 5' }, svg);
      const end = quad(p0, c, p1, 1);
      const before = quad(p0, c, p1, 0.97);
      arrowHead(svg, end.x, end.y, Math.atan2(end.y - before.y, end.x - before.x), 'pr-arrow');
      const p = quad(p0, c, p1, 0.1 + 0.8 * t);
      probe(svg, p.x, p.y, 1.1, 'pr-probe');
      addLabel(svg, wrap, 'flies past once, then carries on', 320, 300, 'diagram-label--tick diagram-label--strong');
    } else if (id === 'orbiter') {
      // Draw the front half of the orbit over the body.
      svgEl('path', { d: `M${BODY.x - 150},${BODY.y} A150,78 0 0 0 ${BODY.x + 150},${BODY.y}`, fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-dasharray': '7 5' }, svg);
      const a = 2 * Math.PI * t;
      probe(svg, BODY.x + 150 * Math.cos(a), BODY.y + 78 * Math.sin(a), 1.1, 'pr-probe');
      arrowHead(svg, BODY.x + 150, BODY.y + 4, Math.PI / 2, 'pr-arrow');
      addLabel(svg, wrap, 'goes round and round', 320, 300, 'diagram-label--tick diagram-label--strong');
    } else if (id === 'impactor') {
      const hit = { x: BODY.x + BODY.r * Math.cos(-0.7), y: BODY.y + BODY.r * Math.sin(-0.7) };
      const start = { x: 600, y: 20 };
      svgEl('line', { class: 'pr-path pr-path--impactor', x1: start.x, y1: start.y, x2: hit.x.toFixed(1), y2: hit.y.toFixed(1), stroke: INK, 'stroke-width': 2, 'stroke-dasharray': '7 5' }, svg);
      const s = Math.min(1, 0.15 + 1.1 * t);
      if (s < 1) {
        probe(svg, start.x + s * (hit.x - start.x), start.y + s * (hit.y - start.y), 1.1, 'pr-probe');
      }
      // The material thrown up by the crash.
      const rand = seeded(4);
      for (let i = 0; i < 26; i += 1) {
        const ang = -1.9 + rand() * 2.0;
        const d = 12 + rand() * 60;
        svgEl('circle', { class: 'pr-plume', cx: (hit.x + d * Math.cos(ang)).toFixed(1), cy: (hit.y + d * Math.sin(ang)).toFixed(1), r: (1.5 + rand() * 3).toFixed(1), fill: DUST, opacity: 0.85 }, svg);
      }
      svgEl('circle', { cx: hit.x.toFixed(1), cy: hit.y.toFixed(1), r: 9, fill: '#fff4cf' }, svg);
      addLabel(svg, wrap, 'material thrown up', 196, 52, 'diagram-label--tick');
      addLabel(svg, wrap, 'crashes in on purpose', 320, 300, 'diagram-label--tick diagram-label--strong');
    } else {
      const top = { x: BODY.x, y: BODY.y - BODY.r };
      const p0 = { x: 590, y: 24 };
      const c = { x: 330, y: 0 };
      svgEl('path', { class: 'pr-path pr-path--lander', d: `M${p0.x},${p0.y} Q${c.x},${c.y} ${top.x},${top.y - 26}`, fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-dasharray': '7 5' }, svg);
      const s = 0.2 + 0.8 * t;
      const p = s < 0.95 ? quad(p0, c, { x: top.x, y: top.y - 26 }, s) : { x: top.x, y: top.y - 26 };
      if (s < 0.95) probe(svg, p.x, p.y, 1.1, 'pr-probe');
      lander(svg, top.x, top.y + 1, 1.4, 'pr-lander');
      addLabel(svg, wrap, 'touches down gently', 320, 300, 'diagram-label--tick diagram-label--strong');
    }
    addLabel(svg, wrap, 'target', BODY.x, BODY.y, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'not to scale', 64, 300, 'diagram-label--tick');
    document.querySelectorAll('#type-buttons button').forEach((b) => {
      const on = b.dataset.type === id;
      b.classList.toggle('preset-button-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    document.querySelectorAll('#type-cards .pr-type-card').forEach((card) => card.classList.toggle('pr-type-card--chosen', card.dataset.type === id));
  }

  function wireTypes() {
    const holder = document.getElementById('type-buttons');
    P.TYPES.forEach((type) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset-button';
      b.dataset.type = type.id;
      b.textContent = type.name;
      b.addEventListener('click', () => {
        typeState.chosen = type.id;
        typeState.phase = 0.3;
        drawTypes();
      });
      holder.appendChild(b);
    });
    drawTypes();
    if (!REDUCED_MOTION) {
      typeState.timer = setInterval(() => {
        typeState.phase = (typeState.phase + 0.01) % 1;
        drawTypes();
      }, 80);
    }
  }

  // ------------------------------------------------------------------
  // 2. One mission of each kind
  // ------------------------------------------------------------------

  function drawNewHorizons() {
    const svg = document.getElementById('nh-diagram');
    const wrap = document.getElementById('nh-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    starfield(svg, 640, 240, 40, 21);
    const pluto = { x: 190, y: 116, r: 70 };
    svgEl('circle', { class: 'pr-pluto', cx: pluto.x, cy: pluto.y, r: pluto.r, fill: '#c9a27c' }, svg);
    // The heart-shaped plain: two lobes meeting in a point.
    svgEl('path', { class: 'pr-heart', d: `M${pluto.x + 8},${pluto.y + 52} C${pluto.x - 34},${pluto.y + 30} ${pluto.x - 30},${pluto.y - 6} ${pluto.x - 4},${pluto.y + 4} C${pluto.x + 4},${pluto.y - 14} ${pluto.x + 40},${pluto.y - 10} ${pluto.x + 34},${pluto.y + 16} C${pluto.x + 30},${pluto.y + 34} ${pluto.x + 16},${pluto.y + 44} ${pluto.x + 8},${pluto.y + 52} Z`, fill: '#f3eee4' }, svg);
    svgEl('circle', { cx: 330, cy: 46, r: 20, fill: '#9c9690' }, svg);
    const a = { x: 60, y: 232 };
    const b = { x: 620, y: 30 };
    svgEl('line', { class: 'pr-path pr-path--flyby', x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: INK, 'stroke-width': 2, 'stroke-dasharray': '7 5' }, svg);
    arrowHead(svg, b.x, b.y, Math.atan2(b.y - a.y, b.x - a.x), 'pr-arrow');
    probe(svg, 470, a.y + ((470 - a.x) / (b.x - a.x)) * (b.y - a.y), 1.1, 'pr-probe');
    addLabel(svg, wrap, 'Pluto', 100, 30, 'diagram-label--tick diagram-label--strong');
    svgEl('line', { x1: pluto.x + 6, y1: pluto.y + 40, x2: pluto.x - 20, y2: 206, stroke: MUTED, 'stroke-width': 1 }, svg);
    addLabel(svg, wrap, 'heart-shaped ice plain', 140, 218, 'diagram-label--tick');
    addLabel(svg, wrap, 'Charon', 330, 82, 'diagram-label--tick');
    addLabel(svg, wrap, 'New Horizons passes once', 450, 170, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'not to scale', 580, 222, 'diagram-label--tick');
  }

  function drawJuno() {
    const svg = document.getElementById('juno-diagram');
    const wrap = document.getElementById('juno-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    starfield(svg, 640, 240, 40, 23);
    const j = { x: 230, y: 120, r: 84 };
    const orbit = { cx: 320, cy: 120, rx: 150, ry: 116 };
    svgEl('ellipse', { class: 'pr-path pr-path--orbiter', cx: orbit.cx, cy: orbit.cy, rx: orbit.rx, ry: orbit.ry, fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-dasharray': '7 5' }, svg);
    const defs = svgEl('defs', {}, svg);
    const clip = svgEl('clipPath', { id: 'pr-jupiter-clip' }, defs);
    svgEl('circle', { cx: j.x, cy: j.y, r: j.r }, clip);
    svgEl('circle', { class: 'pr-jupiter', cx: j.x, cy: j.y, r: j.r, fill: '#e3c7a0' }, svg);
    const bands = svgEl('g', { 'clip-path': 'url(#pr-jupiter-clip)' }, svg);
    [[-50, 12, '#b98a5e'], [-22, 10, '#c99e74'], [6, 14, '#b07a4f'], [34, 9, '#c99e74'], [58, 12, '#b98a5e']].forEach(([dy, h, fill]) => svgEl('rect', { x: j.x - j.r, y: j.y + dy, width: 2 * j.r, height: h, fill }, bands));
    // A cluster of storms round the north pole.
    [[0, -70], [-16, -66], [16, -66], [-8, -76], [8, -76]].forEach(([dx, dy]) => {
      svgEl('circle', { class: 'pr-cyclone', cx: j.x + dx, cy: j.y + dy, r: 5, fill: '#f6e6cc', stroke: '#8a5a36', 'stroke-width': 1.2 }, svg);
      svgEl('path', { d: `M${j.x + dx - 3},${j.y + dy} q3,-4 5,0 q-1,3 -3,2`, fill: 'none', stroke: '#8a5a36', 'stroke-width': 1 }, svg);
    });
    probe(svg, orbit.cx + orbit.rx, orbit.cy, 1.1, 'pr-probe');
    arrowHead(svg, orbit.cx + orbit.rx * Math.cos(0.5), orbit.cy + orbit.ry * Math.sin(0.5), 2.3, 'pr-arrow');
    addLabel(svg, wrap, 'Jupiter', j.x, j.y + 6, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'storms round the pole', 140, 18, 'diagram-label--tick');
    addLabel(svg, wrap, 'Juno', 470, 90, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'orbit over both poles', 500, 160, 'diagram-label--tick');
    addLabel(svg, wrap, 'not to scale', 580, 222, 'diagram-label--tick');
  }

  function drawDeepImpact() {
    const svg = document.getElementById('di-diagram');
    const wrap = document.getElementById('di-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    starfield(svg, 640, 240, 40, 25);
    svgEl('path', { class: 'pr-comet', d: 'M150,150 C140,110 190,80 240,92 C280,80 330,96 340,128 C352,160 320,192 270,190 C220,200 160,188 150,150 Z', fill: '#5f574f' }, svg);
    const hit = { x: 318, y: 100 };
    const start = { x: 600, y: 18 };
    svgEl('line', { class: 'pr-path pr-path--impactor', x1: start.x, y1: start.y, x2: hit.x, y2: hit.y, stroke: INK, 'stroke-width': 2, 'stroke-dasharray': '7 5' }, svg);
    svgEl('rect', { class: 'pr-impactor', x: 486, y: 46, width: 12, height: 9, fill: METAL, transform: 'rotate(-16 492 50)' }, svg);
    const rand = seeded(8);
    for (let i = 0; i < 40; i += 1) {
      const ang = -2.4 + rand() * 1.9;
      const d = 10 + rand() * 76;
      svgEl('circle', { class: 'pr-plume', cx: (hit.x + d * Math.cos(ang)).toFixed(1), cy: (hit.y + d * Math.sin(ang)).toFixed(1), r: (1.5 + rand() * 3.5).toFixed(1), fill: DUST, opacity: 0.8 }, svg);
    }
    svgEl('circle', { cx: hit.x, cy: hit.y, r: 8, fill: '#fff4cf' }, svg);
    // The fly-by craft that carried the impactor, watching from a safe distance.
    svgEl('line', { x1: 380, y1: 236, x2: 630, y2: 168, stroke: MUTED, 'stroke-width': 1.5, 'stroke-dasharray': '4 5' }, svg);
    probe(svg, 520, 198, 1.1, 'pr-probe');
    svgEl('line', { x1: 506, y1: 190, x2: hit.x + 12, y2: hit.y + 6, stroke: MUTED, 'stroke-width': 1, 'stroke-dasharray': '2 4' }, svg);
    addLabel(svg, wrap, 'impactor', 560, 70, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'cloud of fine dust', 130, 40, 'diagram-label--tick');
    addLabel(svg, wrap, 'Comet Tempel 1', 240, 214, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'fly-by craft watches', 530, 226, 'diagram-label--tick');
  }

  function drawPhilae() {
    const svg = document.getElementById('philae-diagram');
    const wrap = document.getElementById('philae-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    starfield(svg, 640, 240, 40, 27);
    // Comet 67P: two lumps joined at a neck.
    svgEl('ellipse', { class: 'pr-comet', cx: 250, cy: 168, rx: 120, ry: 56, fill: '#5f574f' }, svg);
    svgEl('ellipse', { class: 'pr-comet', cx: 410, cy: 138, rx: 66, ry: 46, fill: '#5f574f' }, svg);
    svgEl('path', { d: 'M350,150 Q365,120 382,118 L384,160 Q366,168 350,170 Z', fill: '#5f574f' }, svg);
    // A cliff's shadow, where Philae came to rest.
    svgEl('path', { class: 'pr-shadow', d: 'M150,138 L196,124 L204,150 L160,160 Z', fill: '#1d1916' }, svg);
    // Rosetta, the orbiter that carried it.
    probe(svg, 520, 40, 1.3, 'pr-rosetta');
    const touch1 = { x: 300, y: 114 };
    const touch2 = { x: 236, y: 114 };
    const rest = { x: 182, y: 140 };
    svgEl('path', { class: 'pr-path pr-path--lander', d: `M506,50 Q380,40 ${touch1.x},${touch1.y} Q268,40 ${touch2.x},${touch2.y} Q206,86 ${rest.x},${rest.y}`, fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-dasharray': '7 5' }, svg);
    lander(svg, rest.x, rest.y, 0.9, 'pr-lander');
    [touch1, touch2].forEach((p) => svgEl('circle', { class: 'pr-touch', cx: p.x, cy: p.y, r: 4, fill: 'none', stroke: INK, 'stroke-width': 1.5 }, svg));
    addLabel(svg, wrap, 'Rosetta orbiter', 530, 80, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'bounced', 282, 46, 'diagram-label--tick');
    addLabel(svg, wrap, 'Philae came to rest in shadow', 16, 222, 'diagram-label--tick diagram-label--strong diagram-label--right');
    addLabel(svg, wrap, 'Comet 67P', 420, 196, 'diagram-label--tick');
    addLabel(svg, wrap, 'not to scale', 580, 222, 'diagram-label--tick');
  }

  // ------------------------------------------------------------------
  // 3. A probe or a telescope?
  // ------------------------------------------------------------------

  function drawCompare() {
    const svg = document.getElementById('compare-diagram');
    const wrap = document.getElementById('compare-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const defs = svgEl('defs', {}, svg);
    // Through a telescope: a tiny, blurred disc in the field of view.
    svgEl('circle', { cx: 160, cy: 112, r: 92, fill: '#050812', stroke: MUTED, 'stroke-width': 2 }, svg);
    const blur = svgEl('filter', { id: 'pr-blur' }, defs);
    svgEl('feGaussianBlur', { stdDeviation: 0.9 }, blur);
    const small = svgEl('g', { filter: 'url(#pr-blur)' }, svg);
    svgEl('circle', { class: 'pr-far-disc', cx: 160, cy: 112, r: 9, fill: '#e3c7a0' }, small);
    svgEl('rect', { x: 151, y: 109, width: 18, height: 2.5, fill: '#b98a5e' }, small);
    // From a probe: the same planet filling the view.
    const big = { x: 480, y: 112, r: 92 };
    const clip = svgEl('clipPath', { id: 'pr-near-clip' }, defs);
    svgEl('circle', { cx: big.x, cy: big.y, r: big.r }, clip);
    svgEl('circle', { class: 'pr-near-disc', cx: big.x, cy: big.y, r: big.r, fill: '#e3c7a0' }, svg);
    const g = svgEl('g', { 'clip-path': 'url(#pr-near-clip)' }, svg);
    const rand = seeded(31);
    for (let y = big.y - big.r; y < big.y + big.r; y += 9) {
      svgEl('path', { d: `M${big.x - big.r},${y} q40,${(rand() * 6 - 3).toFixed(1)} 92,0 t92,0`, fill: 'none', stroke: rand() < 0.5 ? '#b98a5e' : '#c99e74', 'stroke-width': 4 + rand() * 3 }, g);
    }
    [[-30, 30, 18, 10], [34, -24, 10, 6], [-50, -40, 7, 4], [10, 56, 8, 5]].forEach(([dx, dy, rx, ry]) => svgEl('ellipse', { class: 'pr-storm', cx: big.x + dx, cy: big.y + dy, rx, ry, fill: '#f6e6cc', stroke: '#8a5a36', 'stroke-width': 1.2 }, g));
    addLabel(svg, wrap, 'from a telescope on Earth', 160, 226, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'from a probe close up', 480, 226, 'diagram-label--tick diagram-label--strong');
  }

  // ------------------------------------------------------------------
  // 4. Getting away from the Earth
  // ------------------------------------------------------------------

  const AXIS = { x0: 90, x1: 560, y: 196, minLog: 2, maxLog: 6 };
  const xForKm = (km) => AXIS.x0 + ((Math.log10(Math.max(km, 10 ** AXIS.minLog)) - AXIS.minLog) / (AXIS.maxLog - AXIS.minLog)) * (AXIS.x1 - AXIS.x0);

  function launchSpeed() {
    return Number(document.getElementById('launch-speed').value);
  }

  /** A height to 2 significant figures, as "25,000". */
  function roughKm(km) {
    const p = 10 ** (Math.floor(Math.log10(km)) - 1);
    return (Math.round(km / p) * p).toLocaleString('en-GB');
  }

  function drawLaunch() {
    const svg = document.getElementById('launch-diagram');
    const wrap = document.getElementById('launch-diagram-wrap');
    const v = launchSpeed();
    const h = P.maxHeightKm(v);
    const escapes = P.outcome(v) === 'escapes';
    clearDiagram(svg, wrap);
    panel(svg);
    starfield(svg, 640, 260, 36, 33);
    document.getElementById('launch-speed-label').textContent = `${v.toFixed(1)} km/s`;
    // The Earth at the left.
    svgEl('circle', { cx: -10, cy: 130, r: 70, fill: '#3d7bd6' }, svg);
    svgEl('path', { d: 'M-10,92 q22,-6 34,10 q-6,14 -24,10 z', fill: '#5fae6a' }, svg);
    // The height scale: each step ten times further.
    svgEl('line', { x1: AXIS.x0, y1: AXIS.y, x2: AXIS.x1 + 40, y2: AXIS.y, stroke: MUTED, 'stroke-width': 1.5 }, svg);
    for (let p = AXIS.minLog; p <= AXIS.maxLog; p += 1) {
      const x = xForKm(10 ** p);
      svgEl('line', { x1: x, y1: AXIS.y - 5, x2: x, y2: AXIS.y + 5, stroke: MUTED, 'stroke-width': 1.5 }, svg);
      if (p % 2 === 0) addLabel(svg, wrap, `${(10 ** p).toLocaleString('en-GB')} km`, x, AXIS.y + 18, 'diagram-label--tick');
    }
    addLabel(svg, wrap, 'height reached: each mark is 10 times further', 330, 246, 'diagram-label--tick');
    // The Moon's distance (data sheet).
    const mx = xForKm(P.MOON_DISTANCE_KM);
    svgEl('line', { class: 'pr-moon-line', x1: mx, y1: 44, x2: mx, y2: AXIS.y, stroke: MUTED, 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }, svg);
    svgEl('circle', { cx: mx, cy: 44, r: 9, fill: '#c9c9c9' }, svg);
    addLabel(svg, wrap, 'Moon’s distance', mx, 20, 'diagram-label--tick');
    // Up, and back down (or not).
    const top = escapes ? 630 : xForKm(h);
    svgEl('line', { class: 'pr-up', x1: 62, y1: 110, x2: top, y2: 110, stroke: INK, 'stroke-width': 3 }, svg);
    arrowHead(svg, top, 110, 0, 'pr-arrow');
    if (!escapes) {
      svgEl('line', { class: 'pr-down', x1: top, y1: 150, x2: 66, y2: 150, stroke: INK, 'stroke-width': 3, 'stroke-dasharray': '8 5' }, svg);
      arrowHead(svg, 66, 150, Math.PI, 'pr-arrow');
      svgEl('path', { d: `M${top},110 A20,20 0 0 1 ${top},150`, fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-dasharray': '8 5' }, svg);
      probe(svg, Math.max(top - 10, 80), 110, 1, 'pr-probe');
      addLabel(svg, wrap, `rises to about ${roughKm(h)} km`, 80, 86, 'diagram-label--tick diagram-label--strong diagram-label--right');
      addLabel(svg, wrap, 'then falls back', 80, 172, 'diagram-label--tick diagram-label--right');
    } else {
      probe(svg, 590, 110, 1, 'pr-probe');
      addLabel(svg, wrap, 'escapes', 80, 86, 'diagram-label--tick diagram-label--strong diagram-label--right');
      addLabel(svg, wrap, 'never comes back', 80, 172, 'diagram-label--tick diagram-label--strong diagram-label--right');
    }
    svg.dataset.speed = v.toFixed(1);
    svg.dataset.outcome = P.outcome(v);
    svg.dataset.heightKm = Number.isFinite(h) ? h.toFixed(0) : 'escapes';
    const esc = P.ESCAPE_KMS.toFixed(1);
    const moonSpeed = P.speedToReachKm(P.MOON_DISTANCE_KM).toFixed(1);
    document.getElementById('launch-readout').textContent = escapes
      ? `${v.toFixed(1)} km/s is at least the escape velocity (about ${esc} km/s), so the probe never comes back.`
      : `At ${v.toFixed(1)} km/s the probe rises to about ${roughKm(h)} km, then gravity pulls it back. Even reaching the Moon’s distance needs about ${moonSpeed} km/s: nearly the escape velocity.`;
  }

  function drawRocket() {
    const svg = document.getElementById('rocket-diagram');
    const wrap = document.getElementById('rocket-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    starfield(svg, 640, 290, 36, 35);
    svgEl('line', { x1: 320, y1: 16, x2: 320, y2: 274, stroke: MUTED, 'stroke-width': 1, 'stroke-dasharray': '3 5' }, svg);
    // A jet engine: an open tube that must take in air.
    svgEl('path', { class: 'pr-jet', d: 'M80,100 L240,112 L240,148 L80,160 Z', fill: METAL }, svg);
    svgEl('ellipse', { cx: 80, cy: 130, rx: 10, ry: 30, fill: '#9aa7bd' }, svg);
    [108, 130, 152].forEach((y) => {
      svgEl('line', { x1: 24, y1: y, x2: 62, y2: y, stroke: MUTED, 'stroke-width': 2, 'stroke-dasharray': '5 4' }, svg);
      arrowHead(svg, 66, y, 0, 'pr-air');
    });
    // It cannot work in space: a large cross over it.
    svgEl('path', { class: 'pr-cross', d: 'M70,80 L260,180 M260,80 L70,180', stroke: '#ff8f8f', 'stroke-width': 6, 'stroke-linecap': 'round' }, svg);
    addLabel(svg, wrap, 'jet engine', 160, 30, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'needs air in: space has none', 160, 238, 'diagram-label--tick');
    addLabel(svg, wrap, '✗ no use in space', 160, 266, 'diagram-label--tick diagram-label--strong');
    // A rocket: fuel and oxidiser on board, exhaust out of the back.
    const rx = 470;
    svgEl('path', { class: 'pr-rocket', d: `M${rx},34 Q${rx + 24},54 ${rx + 24},80 L${rx + 24},170 L${rx - 24},170 L${rx - 24},80 Q${rx - 24},54 ${rx},34 Z`, fill: METAL }, svg);
    svgEl('rect', { class: 'pr-tank pr-tank--fuel', x: rx - 18, y: 84, width: 36, height: 36, rx: 4, fill: '#ffcf7a' }, svg);
    svgEl('rect', { class: 'pr-tank pr-tank--oxidiser', x: rx - 18, y: 128, width: 36, height: 36, rx: 4, fill: '#9fc7ff' }, svg);
    svgEl('path', { class: 'pr-flame', d: `M${rx - 16},172 Q${rx},222 ${rx + 16},172 Z`, fill: '#ffb347' }, svg);
    svgEl('line', { x1: rx, y1: 186, x2: rx, y2: 214, stroke: INK, 'stroke-width': 2.5 }, svg);
    arrowHead(svg, rx, 218, Math.PI / 2, 'pr-exhaust-arrow');
    svgEl('line', { x1: rx + 44, y1: 110, x2: rx + 44, y2: 50, stroke: INK, 'stroke-width': 3 }, svg);
    arrowHead(svg, rx + 44, 46, -Math.PI / 2, 'pr-push-arrow');
    addLabel(svg, wrap, 'rocket', 380, 30, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'fuel', rx - 30, 102, 'diagram-label--tick diagram-label--left');
    addLabel(svg, wrap, 'oxidiser', rx - 30, 146, 'diagram-label--tick diagram-label--left');
    addLabel(svg, wrap, 'push', rx + 54, 80, 'diagram-label--tick diagram-label--strong diagram-label--right');
    addLabel(svg, wrap, 'exhaust out backwards', rx - 10, 238, 'diagram-label--tick');
    addLabel(svg, wrap, '✓ works in space', rx - 10, 266, 'diagram-label--tick diagram-label--strong');
  }

  // ------------------------------------------------------------------

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }

  wireTypes();
  drawNewHorizons();
  drawJuno();
  drawDeepImpact();
  drawPhilae();
  drawCompare();
  document.getElementById('launch-speed').addEventListener('input', drawLaunch);
  drawLaunch();
  drawRocket();
  renderCoverage();
  Glossary.init({
    probe:
      'A space probe: a spacecraft with no crew, sent from the Earth to study another body (a planet, moon, asteroid or comet) close up, sending its measurements back by radio.',
    kuiperBelt:
      'The Kuiper belt: a wide ring of small, icy bodies beyond Neptune, where Pluto lies. More on Bodies of the Solar System.',
    escapeVelocity:
      'Escape velocity: the speed something needs to coast away from a planet’s gravity for good, with no further push. Slower than this, it is pulled back.',
  });
  QuizUI.mount(SpaceProbesQuestions.makeQuestions(P));
})();
