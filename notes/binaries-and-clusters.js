(function () {
  const B = window.BinariesClusters;
  const D = window.SpectrumDrawing;
  const SV = window.StarView;
  const { INK, MUTED, svgEl, clearDiagram, addLabel, panel, rgbString } = D;

  const CURRICULUM_UNITS = ['u4.10'];

  const GLOSSARY = {
    opticalDouble:
      'An optical double: two stars that happen to lie in nearly the same direction from Earth, but at very different distances. They are not connected at all.',
    binary:
      'A binary star: two stars held together by their gravity, orbiting each other. Most stars in our Galaxy are thought to be in binary or multiple systems.',
    centreOfMass:
      'The centre of mass: the balance point between the two stars. Both stars orbit it; the heavier star sits closer to it, so it moves on a smaller orbit.',
  };

  const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Deterministic "random" numbers, so every drawing is the same each time.
  function seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function glowDefs(svg) {
    const defs = svgEl('defs', {}, svg);
    const grad = svgEl('radialGradient', { id: `${svg.id}-glow` }, defs);
    svgEl('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': '0.55' }, grad);
    svgEl('stop', { offset: '100%', 'stop-color': '#ffffff', 'stop-opacity': '0' }, grad);
  }

  function starDisc(svg, temperatureK, cx, cy, r, extra) {
    svgEl('circle', { cx, cy, r: r * 2.2, fill: `url(#${svg.id}-glow)` }, svg);
    return svgEl('circle', { cx, cy, r, fill: rgbString(D.starDisplayRgb(temperatureK)), stroke: '#0f1830', 'stroke-width': 1, ...(extra || {}) }, svg);
  }

  function earthIcon(svg, x, y) {
    svgEl('circle', { cx: x, cy: y, r: 11, fill: '#2f6fd1', stroke: '#9cc3ff', 'stroke-width': 1.5 }, svg);
    svgEl('path', { d: `M${x - 7},${y - 3} q4,-6 9,-2 q3,4 -2,6 q-5,1 -7,-4 Z M${x + 2},${y + 4} q4,-1 5,2 q-3,4 -6,1 Z`, fill: '#4caf6a' }, svg);
  }

  // ------------------------------------------------------------------
  // 1. Double star or binary?
  // ------------------------------------------------------------------

  let pairPhase = 0;

  function drawPair() {
    const svg = document.getElementById('pair-diagram');
    const wrap = document.getElementById('pair-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    glowDefs(svg);
    svgEl('line', { x1: 320, x2: 320, y1: 14, y2: 366, stroke: MUTED, 'stroke-width': 1, 'stroke-dasharray': '4 5' }, svg);

    [0, 320].forEach((col) => {
      const cx = col + 160;
      // The same-looking pair in the sky.
      svgEl('circle', { cx, cy: 100, r: 56, fill: '#05070d', stroke: MUTED, 'stroke-width': 1 }, svg);
      const rand = seeded(5);
      for (let i = 0; i < 14; i += 1) {
        const a = rand() * Math.PI * 2;
        const r = Math.sqrt(rand()) * 50;
        svgEl('circle', { cx: cx + r * Math.cos(a), cy: 100 + r * Math.sin(a), r: 0.9, fill: '#ffffff', opacity: 0.5 }, svg);
      }
      starDisc(svg, 9000, cx - 9, 98, 4.2);
      starDisc(svg, 5200, cx + 9, 103, 3.2);
      addLabel(svg, wrap, 'In the sky', cx, 172, 'diagram-label--tick');
      // Earth, far left of the side-on view.
      earthIcon(svg, col + 34, 286);
      addLabel(svg, wrap, 'Earth', col + 34, 314, 'diagram-label--tick');
    });
    addLabel(svg, wrap, 'Optical double', 160, 24, 'diagram-label--tick diagram-label--strong bc-pair-title');
    addLabel(svg, wrap, 'True binary', 480, 24, 'diagram-label--tick diagram-label--strong bc-pair-title');
    addLabel(svg, wrap, 'Seen side-on from space:', 320, 204, 'diagram-label--tick');

    // Optical double: a near star and a far star along almost the same line.
    svgEl('line', { x1: 46, y1: 284, x2: 300, y2: 262, stroke: INK, 'stroke-width': 1, 'stroke-dasharray': '5 4', opacity: 0.7 }, svg);
    svgEl('line', { x1: 46, y1: 288, x2: 300, y2: 300, stroke: INK, 'stroke-width': 1, 'stroke-dasharray': '5 4', opacity: 0.7 }, svg);
    starDisc(svg, 9000, 112, 279, 5, { class: 'bc-near-star' });
    starDisc(svg, 5200, 288, 299, 6, { class: 'bc-far-star' });
    addLabel(svg, wrap, 'near star', 112, 258, 'diagram-label--tick');
    addLabel(svg, wrap, 'far star', 280, 324, 'diagram-label--tick');
    addLabel(svg, wrap, 'very different distances', 170, 352, 'diagram-label--tick');

    // True binary: two stars at one distance circling their centre of mass.
    const com = { x: 550, y: 286 };
    const q = 2;
    const p = B.binaryPositions(q, 48, pairPhase);
    svgEl('line', { x1: 366, y1: 286, x2: com.x - 30, y2: com.y, stroke: INK, 'stroke-width': 1, 'stroke-dasharray': '5 4', opacity: 0.7 }, svg);
    svgEl('circle', { cx: com.x, cy: com.y, r: p.r1, fill: 'none', stroke: MUTED, 'stroke-dasharray': '3 3' }, svg);
    svgEl('circle', { cx: com.x, cy: com.y, r: p.r2, fill: 'none', stroke: MUTED, 'stroke-dasharray': '3 3' }, svg);
    svgEl('path', { d: `M${com.x - 4},${com.y} h8 M${com.x},${com.y - 4} v8`, stroke: INK, 'stroke-width': 1.5 }, svg);
    starDisc(svg, 9000, com.x + p.star1.x, com.y + p.star1.y * 0.45, 6, { class: 'bc-binary-star' });
    starDisc(svg, 5200, com.x + p.star2.x, com.y + p.star2.y * 0.45, 4.5, { class: 'bc-binary-star' });
    addLabel(svg, wrap, 'centre of mass', com.x, 324, 'diagram-label--tick');
    addLabel(svg, wrap, 'same distance, orbiting', 480, 352, 'diagram-label--tick');
  }

  // ------------------------------------------------------------------
  // 2. Binary stars: the orbit and the spectral lines
  // ------------------------------------------------------------------

  const ORBIT = { cx: 190, cy: 200, a: 170 };
  const H_ALPHA_NM = 656.3;
  const LIGHTER_SPEED_KM_S = 60;
  const SHIFT_EXAGGERATION = 50;
  const STRIP = { x0: 404, x1: 620, minNm: 646, maxNm: 667 };

  let playing = false;
  let lastTime = null;

  function massRatio() {
    return Number(document.getElementById('mass-ratio-slider').value) / 10;
  }

  function orbitPhase() {
    return Number(document.getElementById('orbit-phase-slider').value);
  }

  function motionWord(v) {
    if (Math.abs(v) < 1) return 'moving across our line of sight: no shift';
    return v > 0 ? 'moving away from Earth: line shifted to a longer wavelength' : 'moving towards Earth: line shifted to a shorter wavelength';
  }

  function drawSpectrum(svg, wrap, y, title, vKmS, key) {
    const shifted = H_ALPHA_NM + (B.shiftedLineNm(H_ALPHA_NM, vKmS) - H_ALPHA_NM) * SHIFT_EXAGGERATION;
    D.drawStrip(svg, { x0: STRIP.x0, x1: STRIP.x1, y, h: 26, type: 'absorption', lines: [{ nm: shifted, depth: 0.9 }], minNm: STRIP.minNm, maxNm: STRIP.maxNm, step: 0.25, widthNm: 0.5 });
    const xFor = D.makeScale(STRIP.x0, STRIP.x1, STRIP.minNm, STRIP.maxNm);
    const xr = xFor(H_ALPHA_NM);
    svgEl('line', { class: 'bc-rest-line', x1: xr, x2: xr, y1: y - 10, y2: y + 40, stroke: INK, 'stroke-width': 1, 'stroke-dasharray': '3 3' }, svg);
    const xs = xFor(shifted);
    svgEl('polygon', { class: `bc-line-marker bc-line-marker--${key}`, points: `${xs},${y - 3} ${xs - 5},${y - 11} ${xs + 5},${y - 11}`, fill: INK }, svg);
    addLabel(svg, wrap, title, (STRIP.x0 + STRIP.x1) / 2, y - 26, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'rest', xr, y + 52, 'diagram-label--tick');
    svg.dataset[`shift${key}`] = (shifted - H_ALPHA_NM).toFixed(3);
  }

  function drawOrbit() {
    const svg = document.getElementById('orbit-diagram');
    const wrap = document.getElementById('orbit-diagram-wrap');
    const q = massRatio();
    const phase = orbitPhase();
    const pos = B.binaryPositions(q, ORBIT.a, phase);
    const rv = B.radialVelocities(q, phase, LIGHTER_SPEED_KM_S);
    clearDiagram(svg, wrap);
    panel(svg);
    glowDefs(svg);
    const rand = seeded(13);
    for (let i = 0; i < 40; i += 1) svgEl('circle', { cx: 10 + rand() * 370, cy: 10 + rand() * 360, r: 0.8, fill: '#fff', opacity: 0.35 }, svg);

    const { cx, cy } = ORBIT;
    svgEl('circle', { class: 'bc-orbit bc-orbit--a', cx, cy, r: pos.r1, fill: 'none', stroke: '#ffe08a', 'stroke-width': 1.2, 'stroke-dasharray': '6 4' }, svg);
    svgEl('circle', { class: 'bc-orbit bc-orbit--b', cx, cy, r: pos.r2, fill: 'none', stroke: '#ff9a7a', 'stroke-width': 1.2, 'stroke-dasharray': '2 4' }, svg);
    svgEl('path', { d: `M${cx - 6},${cy} h12 M${cx},${cy - 6} v12`, stroke: INK, 'stroke-width': 2 }, svg);
    // A key in the corner, so no label has to chase the moving stars.
    svgEl('path', { d: 'M410,50 h10 M415,45 v10', stroke: INK, 'stroke-width': 2 }, svg);
    addLabel(svg, wrap, 'A: heavier star', 406, 24, 'diagram-label--tick diagram-label--right');
    addLabel(svg, wrap, 'centre of mass', 426, 50, 'diagram-label--tick diagram-label--right');

    const ax = cx + pos.star1.x;
    const ay = cy + pos.star1.y;
    const bx = cx + pos.star2.x;
    const by = cy + pos.star2.y;
    svgEl('line', { x1: ax, y1: ay, x2: bx, y2: by, stroke: MUTED, 'stroke-width': 0.8, opacity: 0.6 }, svg);
    starDisc(svg, 8000, ax, ay, 13, { class: 'bc-star-a' });
    starDisc(svg, 4200, bx, by, 8, { class: 'bc-star-b' });
    // Labels sit on the far side of each star from the centre of mass.
    const away = (x, y, d) => {
      const len = Math.hypot(x - cx, y - cy) || 1;
      return [x + ((x - cx) / len) * d, y + ((y - cy) / len) * d];
    };
    // Anchor each label by its edge nearest the star, so it grows away from it.
    const starLabel = (text, x, y, d) => {
      const [lx, ly] = away(x, y, d);
      const dx = lx - x;
      const side = dx > 6 ? 'diagram-label--right' : dx < -6 ? 'diagram-label--left' : '';
      addLabel(svg, wrap, text, lx, ly, `diagram-label--tick diagram-label--strong bc-star-label ${side}`);
    };
    starLabel('A', ax, ay, 22);
    starLabel('B', bx, by, 18);
    svgEl('path', { d: `M${cx},372 v18 m-6,-7 l6,7 l6,-7`, stroke: INK, 'stroke-width': 1.5, fill: 'none' }, svg);
    addLabel(svg, wrap, 'to Earth, far away', cx + 14, 384, 'diagram-label--tick diagram-label--right');

    drawSpectrum(svg, wrap, 120, "Star A's spectrum", rv.star1, 'A');
    drawSpectrum(svg, wrap, 270, "Star B's spectrum", rv.star2, 'B');
    const xFor = D.makeScale(STRIP.x0, STRIP.x1, STRIP.minNm, STRIP.maxNm);
    addLabel(svg, wrap, '← shorter', xFor(649), 388, 'diagram-label--tick');
    addLabel(svg, wrap, 'longer →', xFor(664), 388, 'diagram-label--tick');
    svg.dataset.r1 = pos.r1.toFixed(2);
    svg.dataset.r2 = pos.r2.toFixed(2);

    document.getElementById('mass-ratio-label').textContent = `${q.toFixed(1)} ×`;
    document.getElementById('orbit-phase-label').textContent = `${phase}°`;
    document.getElementById('orbit-size-readout').textContent =
      `A's orbit is ${q.toFixed(1)} times smaller than B's (A is ${q.toFixed(1)} times as massive).`;
    document.getElementById('star-a-readout').textContent = capitalise(motionWord(rv.star1));
    document.getElementById('star-b-readout').textContent = capitalise(motionWord(rv.star2));
  }

  function capitalise(t) {
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  function tick(time) {
    if (!playing) return;
    if (lastTime !== null) {
      const slider = document.getElementById('orbit-phase-slider');
      const step = Math.max(1, Math.round((time - lastTime) / 40));
      slider.value = String((Number(slider.value) + step) % 360);
      drawOrbit();
      pairPhase = (pairPhase + step) % 360;
      drawPair();
    }
    lastTime = time;
    requestAnimationFrame(tick);
  }

  function setPlaying(on) {
    playing = on;
    lastTime = null;
    const button = document.getElementById('orbit-play');
    button.setAttribute('aria-pressed', String(on));
    button.textContent = on ? 'Pause' : 'Play';
    if (on) requestAnimationFrame(tick);
  }

  // ------------------------------------------------------------------
  // 3. Clusters
  // ------------------------------------------------------------------

  function drawClusters() {
    const svg = document.getElementById('cluster-diagram');
    const wrap = document.getElementById('cluster-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    glowDefs(svg);

    // Open cluster: a loose, irregular handful of bright young blue-white stars.
    svgEl('circle', { cx: 160, cy: 120, r: 100, fill: '#05070d', stroke: MUTED }, svg);
    const ro = seeded(21);
    for (let i = 0; i < 26; i += 1) {
      const x = 160 + (ro() - 0.5) * 150 + (i % 3 === 0 ? 20 : 0);
      const y = 120 + (ro() - 0.5) * 120;
      if (Math.hypot(x - 160, y - 120) > 92) continue;
      starDisc(svg, 12000 + ro() * 10000, x, y, 1.6 + ro() * 3.2, { class: 'bc-open-star' });
    }
    // Globular cluster: hundreds of old yellow-orange stars, crowded to the centre.
    svgEl('circle', { cx: 480, cy: 120, r: 100, fill: '#05070d', stroke: MUTED }, svg);
    const core = svgEl('radialGradient', { id: 'cluster-diagram-core' }, svg.querySelector('defs'));
    svgEl('stop', { offset: '0%', 'stop-color': '#ffe6b0', 'stop-opacity': '0.9' }, core);
    svgEl('stop', { offset: '100%', 'stop-color': '#ffe6b0', 'stop-opacity': '0' }, core);
    svgEl('circle', { cx: 480, cy: 120, r: 46, fill: 'url(#cluster-diagram-core)' }, svg);
    const rg = seeded(34);
    for (let i = 0; i < 520; i += 1) {
      // Plummer-like: most stars near the middle.
      const u = rg();
      const r = 24 * Math.sqrt(u ** (2 / 3) / (1 - u ** (2 / 3) + 1e-6)) * 0.55;
      if (r > 92) continue;
      const a = rg() * Math.PI * 2;
      svgEl('circle', { class: 'bc-globular-star', cx: (480 + r * Math.cos(a)).toFixed(1), cy: (120 + r * Math.sin(a)).toFixed(1), r: (0.6 + rg() * 0.9).toFixed(2), fill: rgbString(D.starDisplayRgb(4200 + rg() * 1200)) }, svg);
    }
    addLabel(svg, wrap, 'Open cluster', 160, 228, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'loose, young', 160, 260, 'diagram-label--tick');
    addLabel(svg, wrap, 'Globular cluster', 480, 228, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'dense, very old', 480, 260, 'diagram-label--tick');

    // The Galaxy edge-on: open clusters (rings) in the disc, globulars (dots) in the halo.
    const g = { x: 320, y: 410 };
    svgEl('ellipse', { cx: g.x, cy: g.y, rx: 292, ry: 74, fill: 'rgba(255,255,255,0.03)', stroke: MUTED, 'stroke-dasharray': '4 4' }, svg);
    svgEl('ellipse', { cx: g.x, cy: g.y, rx: 250, ry: 9, fill: 'rgba(200,215,255,0.5)' }, svg);
    svgEl('ellipse', { cx: g.x, cy: g.y, rx: 52, ry: 24, fill: 'rgba(255,230,180,0.75)' }, svg);
    [-200, -140, -85, 95, 150, 205].forEach((dx) => svgEl('circle', { class: 'bc-galaxy-open', cx: g.x + dx, cy: g.y + (dx % 2 ? 2 : -2), r: 4.5, fill: 'none', stroke: '#ffffff', 'stroke-width': 1.6 }, svg));
    const rh = seeded(55);
    for (let i = 0; i < 16; i += 1) {
      const a = rh() * Math.PI * 2;
      const r = 0.45 + rh() * 0.5;
      const x = g.x + Math.cos(a) * 270 * r;
      const y = g.y + Math.sin(a) * 66 * r;
      if (Math.abs(y - g.y) < 16) continue;
      svgEl('circle', { class: 'bc-galaxy-globular', cx: x.toFixed(1), cy: y.toFixed(1), r: 3.2, fill: '#ffe6b0' }, svg);
    }
    addLabel(svg, wrap, '\u25cb open clusters: in the disc', 160, 292, 'diagram-label--tick');
    addLabel(svg, wrap, '\u25cf globular clusters: in the halo', 480, 292, 'diagram-label--tick');
    addLabel(svg, wrap, 'Our Galaxy, edge-on', 320, 322, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'disc', 632, 410, 'diagram-label--tick diagram-label--left');
    addLabel(svg, wrap, 'halo', 8, 356, 'diagram-label--tick diagram-label--right');
  }

  function fillClusterTable() {
    const body = document.getElementById('cluster-table-body');
    B.CLUSTER_TABLE.forEach((row) => {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = row.feature;
      tr.appendChild(th);
      [row.open, row.globular].forEach((v) => {
        const td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
  }

  // ------------------------------------------------------------------
  // 4. Through the eyepiece
  // ------------------------------------------------------------------

  const INSTRUMENTS = [
    { id: 'eye', name: 'Naked eye', apertureMm: 7, magnification: 1 },
    { id: 'binoculars', name: 'Binoculars', apertureMm: 50, magnification: 10 },
    { id: 'small', name: 'Small telescope', apertureMm: 80, magnification: 40 },
    { id: 'large', name: 'Large telescope', apertureMm: 250, magnification: 150 },
  ];

  const eye = { objectId: 'star' };
  // The Andromeda Galaxy's dust lanes and arms need at least this much sky in view.
  const GALAXY_FEATURE_FIELD_ARCMIN = 75;

  // Background stars, in 1-degree sky cells: each cell's stars come from
  // its own fixed seed, brightest first, so raising the limit only ever
  // adds fainter stars. Roughly 0.12 stars per square degree are brighter
  // than magnitude 6, rising about 2.8 times per magnitude fainter.
  const STARS_PER_SQ_DEG_TO_MAG_6 = 0.12;
  const COUNT_GROWTH_PER_MAG = 0.45; // log10 of the rise per magnitude
  const MAX_STARS_PER_CELL = 400;

  function starsBrighterThan(lim) {
    return STARS_PER_SQ_DEG_TO_MAG_6 * Math.pow(10, COUNT_GROWTH_PER_MAG * (lim - 6));
  }

  function cellStars(i, j, lim) {
    const rand = seeded(Math.abs((i * 7919 + j * 104729 + 1234567) % 233280));
    const n = Math.min(MAX_STARS_PER_CELL, Math.floor(starsBrighterThan(lim) + rand()));
    const out = [];
    for (let k = 1; k <= n; k += 1) {
      // The k-th brightest star in a cell of one square degree.
      const m = 6 + Math.log10((k - rand() * 0.999) / STARS_PER_SQ_DEG_TO_MAG_6) / COUNT_GROWTH_PER_MAG;
      out.push({ x: (i + rand()) * 60, y: (j + rand()) * 60, m });
    }
    return out;
  }

  function fieldStarsInView(fieldArcmin, lim) {
    const half = fieldArcmin / 2;
    const cells = Math.ceil(half / 60);
    const out = [];
    for (let i = -cells - 1; i <= cells; i += 1) {
      for (let j = -cells - 1; j <= cells; j += 1) {
        cellStars(i, j, lim).forEach((st) => {
          if (Math.hypot(st.x, st.y) <= half) out.push(st);
        });
      }
    }
    return out;
  }

  // The Pleiades: its bright stars in their familiar little-dipper shape,
  // plus fainter members; positions in arcminutes from the centre.
  const PLEIADES = (() => {
    const bright = [
      [0, 0, 2.9], [-23, -6, 3.6], [24, 11, 3.7], [-15, 13, 3.9], [-37, 5, 4.2], [-4, -24, 4.3], [33, 30, 5.1], [-2, 24, 5.4], [-28, -20, 5.6],
    ];
    const rand = seeded(91);
    const faint = [];
    for (let i = 0; i < 140; i += 1) {
      const r = 55 * Math.sqrt(rand());
      const a = rand() * Math.PI * 2;
      faint.push([r * Math.cos(a), r * Math.sin(a) * 0.85, 6 + rand() * 7]);
    }
    return [...bright, ...faint].map(([x, y, m]) => ({ x, y, m }));
  })();

  // M13: members beyond the crowded core, in arcminutes, magnitudes 11.9 to 15.
  const M13_STARS = (() => {
    const rand = seeded(103);
    const out = [];
    for (let i = 0; i < 260; i += 1) {
      const r = 2.2 + 8 * Math.pow(rand(), 1.6);
      const a = rand() * Math.PI * 2;
      out.push({ x: r * Math.cos(a), y: r * Math.sin(a), m: 11.9 + 3.1 * Math.pow(rand(), 0.6) });
    }
    return out;
  })();

  function setting() {
    return {
      apertureMm: Number(document.getElementById('aperture-slider').value),
      magnification: Number(document.getElementById('magnification-slider').value),
      darkSky: document.getElementById('dark-sky').checked,
      photograph: document.getElementById('photograph').checked,
    };
  }

  // How bright a star of magnitude m looks, 0 to 1, given the limit.
  function starAlpha(m, lim) {
    return Math.max(0, Math.min(1, 0.25 + (lim - m) / 6));
  }

  function drawPoint(ctx, x, y, m, lim, rgb) {
    if (m > lim) return false;
    const radius = 1.6 + Math.max(0, Math.min(3, (lim - m) / 2.5));
    SV.drawBlurredStar(ctx, x, y, radius, starAlpha(m, lim), rgb);
    return true;
  }

  function glow(ctx, x, y, rx, ry, rgb, alpha, angle = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, `rgba(${rgb},${alpha})`);
    g.addColorStop(0.45, `rgba(${rgb},${alpha * 0.45})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawEyepiece() {
    const canvas = document.getElementById('eyepiece-view');
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const c = W / 2;
    const R = c - 4;
    const s = setting();
    const obj = B.objectById(eye.objectId);
    const view = B.viewOf(obj.id, s);
    const lim = view.limitingMagnitude;
    const fieldArcmin = B.trueFieldArcmin(s.magnification);
    const pxPerArcmin = (2 * R) / fieldArcmin;
    // A faint glow's visibility: its surface brightness, dimmed by a town sky.
    const glowAlpha = (base) => base * Math.sqrt(view.surfaceBrightness) * (s.darkSky ? 1 : 0.45) * (s.photograph ? 1.6 : 1);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, W);
    ctx.save();
    ctx.beginPath();
    ctx.arc(c, c, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = s.darkSky ? '#03050b' : '#1d2233';
    ctx.fillRect(0, 0, W, W);

    let visible = 0;
    fieldStarsInView(fieldArcmin, lim).forEach((st) => {
      const x = c + st.x * pxPerArcmin;
      const y = c + st.y * pxPerArcmin;
      if (Math.hypot(x - c, y - c) > R) return;
      if (drawPoint(ctx, x, y, st.m, lim, '255,255,255')) visible += 1;
    });

    const data = { object: obj.id, kind: obj.kind };
    if (obj.kind === 'star') {
      drawPoint(ctx, c, c, 3, lim, '255,255,255');
      visible += 1;
    } else if (obj.kind === 'double') {
      // Close pairs are drawn at an "eye scale" so the split can be seen.
      const EYE_SCALE = 0.1;
      const blur = Math.max(B.resolutionArcsec(s.apertureMm) * s.magnification, B.EYE_RESOLUTION_ARCSEC) * EYE_SCALE;
      const sep = Math.min(obj.separationArcsec * s.magnification * EYE_SCALE, 140);
      const [m1, m2] = obj.magnitudes;
      [[-sep / 2, m1], [sep / 2, m2]].forEach(([dx, m]) => {
        if (m <= lim) SV.drawBlurredStar(ctx, c + dx, c, Math.max(blur, 2.5), starAlpha(m, lim), '255,255,255');
      });
      if (obj.id === 'mizar') {
        // Alcor, about 12 arcminutes away, at true scale.
        drawPoint(ctx, c + 10 * pxPerArcmin, c - 6.5 * pxPerArcmin, 4.0, lim, '255,255,255');
      }
      data.split = String(view.split);
      data.status = view.status;
    } else if (obj.kind === 'open') {
      let members = 0;
      PLEIADES.forEach((st) => {
        const x = c + st.x * pxPerArcmin;
        const y = c + st.y * pxPerArcmin;
        if (Math.hypot(x - c, y - c) > R) return;
        if (drawPoint(ctx, x, y, st.m, lim, '205,222,255')) members += 1;
      });
      data.members = String(members);
      // Faint blue haze around the brightest stars, in photographs only.
      if (s.photograph) glow(ctx, c, c, 50 * pxPerArcmin, 40 * pxPerArcmin, '120,160,255', 0.18);
    } else if (obj.kind === 'globular') {
      const r = (obj.sizeArcmin / 2) * pxPerArcmin;
      glow(ctx, c, c, r, r, s.photograph ? '255,225,170' : '225,225,215', Math.min(0.95, glowAlpha(0.9)));
      let resolved = 0;
      if (view.edgeStarsResolved) {
        M13_STARS.forEach((st) => {
          if (st.m > lim) return;
          SV.drawBlurredStar(ctx, c + st.x * pxPerArcmin, c + st.y * pxPerArcmin, 2.6, 0.9, s.photograph ? '255,215,160' : '255,250,235');
          resolved += 1;
        });
      }
      data.edgeResolved = String(view.edgeStarsResolved);
      data.resolvedStars = String(resolved);
    } else if (obj.kind === 'nebula') {
      const r = (obj.sizeArcmin / 2) * pxPerArcmin;
      if (view.colours) {
        glow(ctx, c - 0.1 * r, c + 0.05 * r, r, r * 0.8, '255,90,140', Math.min(0.9, glowAlpha(0.75)), 0.3);
        glow(ctx, c + 0.15 * r, c - 0.1 * r, r * 0.55, r * 0.45, '120,170,255', Math.min(0.8, glowAlpha(0.5)), -0.4);
      } else {
        glow(ctx, c - 0.1 * r, c + 0.05 * r, r, r * 0.8, '180,205,190', Math.min(0.85, glowAlpha(1.2)), 0.3);
        glow(ctx, c + 0.25 * r, c - 0.25 * r, r * 0.45, r * 0.3, '180,205,190', Math.min(0.7, glowAlpha(0.8)), -0.6);
      }
      // The four Trapezium stars at the heart of the nebula.
      [[-0.15, -0.1], [0.12, -0.12], [-0.05, 0.12], [0.18, 0.08]].forEach(([dx, dy], i) => {
        drawPoint(ctx, c + dx * 1.2 * pxPerArcmin, c + dy * 1.2 * pxPerArcmin, 5.1 + i * 0.6, lim, '255,255,255');
      });
      data.colours = String(view.colours);
    } else if (obj.kind === 'galaxy') {
      const len = (obj.sizeArcmin / 2) * pxPerArcmin;
      // Dust lanes and arms lie well out from the core: only claim them
      // when enough of the galaxy fits in the view to show them.
      view.dustLanes = view.dustLanes && fieldArcmin >= GALAXY_FEATURE_FIELD_ARCMIN;
      view.spiralArms = view.spiralArms && fieldArcmin >= GALAXY_FEATURE_FIELD_ARCMIN;
      view.coreOnlyInView = fieldArcmin < GALAXY_FEATURE_FIELD_ARCMIN;
      const angle = -0.6;
      if (view.disc) glow(ctx, c, c, len, len * 0.3, s.photograph ? '200,210,255' : '215,215,205', Math.min(0.6, glowAlpha(0.45)), angle);
      glow(ctx, c, c, len * 0.18, len * 0.11, s.photograph ? '255,235,190' : '235,235,225', Math.min(0.95, glowAlpha(0.95)), angle);
      if (view.dustLanes) {
        ctx.save();
        ctx.translate(c, c);
        ctx.rotate(angle);
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = Math.max(1.5, len * 0.02);
        [0.12, 0.2].forEach((k) => {
          ctx.beginPath();
          ctx.ellipse(0, 0, len * (0.45 + k), len * (0.12 + k * 0.3), 0, Math.PI * 1.05, Math.PI * 1.85);
          ctx.stroke();
        });
        ctx.restore();
      }
      if (view.spiralArms) {
        ctx.save();
        ctx.translate(c, c);
        ctx.rotate(angle);
        ctx.scale(1, 0.3);
        ctx.strokeStyle = 'rgba(150,180,255,0.55)';
        ctx.lineWidth = Math.max(2, len * 0.04);
        for (let arm = 0; arm < 2; arm += 1) {
          ctx.beginPath();
          for (let t = 0; t <= 1.6 * Math.PI; t += 0.1) {
            const rr = len * (0.15 + 0.17 * t);
            const a = t + arm * Math.PI;
            const x = rr * Math.cos(a);
            const y = rr * Math.sin(a);
            if (t === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.restore();
      }
      data.coreOnly = String(view.coreOnlyInView);
      data.disc = String(view.disc);
      data.dustLanes = String(view.dustLanes);
      data.spiralArms = String(view.spiralArms);
    }
    ctx.restore();
    ctx.strokeStyle = '#3a4560';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c, c, R, 0, Math.PI * 2);
    ctx.stroke();

    data.visibleStars = String(visible);
    data.brightness = view.surfaceBrightness.toFixed(4);
    data.limit = lim.toFixed(2);
    data.darkSky = String(s.darkSky);
    data.photograph = String(s.photograph);
    Object.keys(canvas.dataset).forEach((k) => delete canvas.dataset[k]);
    Object.assign(canvas.dataset, data);
    renderEyepieceReadouts(obj, view, s, fieldArcmin, visible);
  }

  function fmtArc(arcmin) {
    if (arcmin >= 90) return `about ${(arcmin / 60).toFixed(arcmin >= 600 ? 0 : 1)} degrees across`;
    return `about ${Math.round(arcmin)} arcminutes across`;
  }

  function seenText(obj, view, s, visible) {
    const dimmer = 'Higher magnification spreads it over more of the view, so it looks dimmer.';
    switch (obj.kind) {
      case 'star':
        return `A single point of light: stars are so far away that no magnification makes them bigger. A wider aperture gathers more light and shows fainter stars: ${visible} stars in this view.`;
      case 'double': {
        const binaryNote = obj.id === 'binary'
          ? ' This pair really does orbit each other, but it looks just like a chance line-up: one look cannot tell a binary from a double star. It takes years of watching the orbit, or measuring both distances.'
          : '';
        if (view.status === 'split') return `Two separate stars: the pair is split.${binaryNote}`;
        if (view.status === 'aperture') return `One blob: the aperture is too small to resolve stars ${obj.separationArcsec} arcseconds apart. A wider aperture gives finer resolution.${binaryNote}`;
        return `One blob: the telescope can resolve the pair, but the magnification is too low for your eye to see the gap.${binaryNote}`;
      }
      case 'open':
        return `Separate stars, even in binoculars: the members are far enough apart to resolve easily. More aperture shows more, fainter members.${B.trueFieldArcmin(s.magnification) < obj.sizeArcmin ? ' At this magnification the cluster is too big to fit in the view.' : ''}`;
      case 'globular':
        return view.edgeStarsResolved
          ? `A ball of light whose edges break up into separate stars; the core stays a crowded glow, its stars too close together to split. ${dimmer}`
          : `A fuzzy ball of light: its stars are too faint and too close together to separate with this aperture. ${dimmer}`;
      case 'nebula':
        return view.colours
          ? 'Reds, pinks and blues: colours that build up only in a long-exposure photograph. To the eye the same nebula is a faint grey-green glow.'
          : `A faint grey-green glow, with a few stars at its heart. The colours in photographs come from long exposures; the eye is not sensitive enough to see them. ${dimmer}`;
      case 'galaxy':
        if (view.coreOnlyInView) return `Only the middle of the galaxy fits in the view at this magnification: a glow with no visible structure. Lower the magnification to see more of it. ${dimmer}`;
        if (view.spiralArms) return 'Spiral arms, dust lanes and colour, built up in a long-exposure photograph.';
        if (view.dustLanes) return `A long oval glow around a bright core, with hints of dark dust lanes: a large aperture and a dark sky show this much. ${dimmer}`;
        if (view.disc) return `A faint oval glow around the bright core. Spiral arms need a larger aperture, a dark sky or a photograph. ${dimmer}`;
        return `A faint smudge: mainly the bright core. Spiral arms need a large aperture, a dark sky or a photograph. ${dimmer}`;
      default:
        return '';
    }
  }

  function renderEyepieceReadouts(obj, view, s, fieldArcmin, visible) {
    document.getElementById('aperture-label').textContent = s.apertureMm === 7 ? '7 mm (the eye’s own pupil)' : `${s.apertureMm} mm`;
    document.getElementById('magnification-label').textContent = `${s.magnification}×`;
    document.getElementById('eyepiece-seen-readout').textContent = seenText(obj, view, s, visible);
    document.getElementById('eyepiece-limit-readout').textContent =
      `down to magnitude ${view.limitingMagnitude.toFixed(1)}${s.darkSky ? '' : ' (town sky glow hides the faintest)'}${s.photograph ? ' (a long exposure reaches fainter)' : ''}`;
    const res = B.resolutionArcsec(s.apertureMm);
    document.getElementById('eyepiece-resolution-readout').textContent = `${res < 10 ? res.toFixed(1) : Math.round(res)} arcseconds`;
    document.getElementById('eyepiece-field-readout').textContent =
      `${fmtArc(fieldArcmin)}${obj.sizeArcmin ? `; the object is ${fmtArc(obj.sizeArcmin)}` : ''}`;
    document.getElementById('eyepiece-brightness-readout').textContent =
      `${Math.round(view.surfaceBrightness * 100)}% of the brightest possible (the beam leaving the eyepiece is ${B.exitPupilMm(s.apertureMm, s.magnification).toFixed(1)} mm wide)`;
    const facts = document.getElementById('object-facts');
    facts.innerHTML = '';
    if (obj.facts.length) {
      const h = document.createElement('h3');
      h.textContent = capitalise(obj.name);
      const ul = document.createElement('ul');
      obj.facts.forEach((f) => {
        const li = document.createElement('li');
        li.textContent = f;
        ul.appendChild(li);
      });
      facts.append(h, ul);
    }
    document.querySelectorAll('#object-buttons button').forEach((b) => {
      const on = b.dataset.object === obj.id;
      b.classList.toggle('preset-button-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    document.querySelectorAll('#instrument-buttons button').forEach((b) => {
      const inst = INSTRUMENTS.find((i) => i.id === b.dataset.instrument);
      const on = inst.apertureMm === s.apertureMm && inst.magnification === s.magnification;
      b.classList.toggle('preset-button-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function wireEyepiece() {
    const objectBox = document.getElementById('object-buttons');
    B.OBJECTS.forEach((o) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset-button';
      b.dataset.object = o.id;
      b.textContent = capitalise(o.name);
      b.addEventListener('click', () => {
        eye.objectId = o.id;
        drawEyepiece();
      });
      objectBox.appendChild(b);
    });
    const instBox = document.getElementById('instrument-buttons');
    INSTRUMENTS.forEach((inst) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset-button';
      b.dataset.instrument = inst.id;
      b.textContent = inst.name;
      b.addEventListener('click', () => {
        // Both values are whole numbers, so they always land on the sliders' step grid.
        document.getElementById('aperture-slider').value = String(inst.apertureMm);
        document.getElementById('magnification-slider').value = String(inst.magnification);
        drawEyepiece();
      });
      instBox.appendChild(b);
    });
    ['aperture-slider', 'magnification-slider'].forEach((id) => document.getElementById(id).addEventListener('input', drawEyepiece));
    ['dark-sky', 'photograph'].forEach((id) => document.getElementById(id).addEventListener('change', drawEyepiece));
  }

  // ------------------------------------------------------------------

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }

  drawPair();
  ['mass-ratio-slider', 'orbit-phase-slider'].forEach((id) => document.getElementById(id).addEventListener('input', drawOrbit));
  document.getElementById('orbit-play').addEventListener('click', () => setPlaying(!playing));
  drawOrbit();
  drawClusters();
  fillClusterTable();
  wireEyepiece();
  drawEyepiece();
  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(BinariesClustersQuestions.makeQuestions(B));
  if (!REDUCED_MOTION) setPlaying(true);
})();
