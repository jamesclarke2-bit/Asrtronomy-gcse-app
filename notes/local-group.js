(function () {
  const L = window.LocalGroup;
  const GD = window.GalaxyDrawing;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, svgEl, clearDiagram, addLabel, panel } = D;

  const CURRICULUM_UNITS = ['u6.5'];

  function seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  const DRAW = {
    'barred-spiral': { kind: 'barred', sub: 'b' },
    spiral: { kind: 'spiral', sub: 'b' },
    irregular: { kind: 'irregular' },
  };
  const TYPE_NAME = { 'barred-spiral': 'Barred spiral', spiral: 'Spiral', irregular: 'Irregular' };

  function dwarf(svg, x, y) {
    svgEl('circle', { class: 'lg-dwarf', cx: x.toFixed(1), cy: y.toFixed(1), r: 2.6, fill: '#e4ebff', opacity: 0.85 }, svg);
  }

  function scaleBar(svg, wrap, x, y, len, text) {
    svgEl('line', { class: 'lg-scale', x1: x, y1: y, x2: x + len, y2: y, stroke: INK, 'stroke-width': 1.5 }, svg);
    [x, x + len].forEach((xx) => svgEl('line', { x1: xx, y1: y - 5, x2: xx, y2: y + 5, stroke: INK, 'stroke-width': 1.5 }, svg));
    addLabel(svg, wrap, text, x + len / 2, y + 16, 'diagram-label--tick');
  }

  // ------------------------------------------------------------------
  // 1. The Local Group map, with a close-up of the Milky Way
  // ------------------------------------------------------------------

  const MAP = { cx: 320, cy: 200, rx: 300, ry: 180, mwX: 244, mwY: 206, s: 0.0002 };
  const INSET = { x0: 16, y0: 430, w: 344, h: 160, mwX: 300, mwY: 512, s: 0.0024 };

  function drawMap() {
    const svg = document.getElementById('map-diagram');
    const wrap = document.getElementById('map-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    // The group's rough edge, and its dwarf galaxies.
    svgEl('ellipse', { class: 'lg-boundary', cx: MAP.cx, cy: MAP.cy, rx: MAP.rx, ry: MAP.ry, fill: 'none', stroke: MUTED, 'stroke-width': 1.5, 'stroke-dasharray': '6 6' }, svg);
    const rand = seeded(17);
    for (let i = 0; i < 26; i += 1) {
      const a = rand() * Math.PI * 2;
      const f = Math.sqrt(rand()) * 0.85;
      dwarf(svg, MAP.cx + Math.cos(a) * MAP.rx * f, MAP.cy + Math.sin(a) * MAP.ry * f);
    }
    const at = (m) => {
      const p = L.position(m);
      return { x: MAP.mwX + p.x * MAP.s, y: MAP.mwY - p.y * MAP.s };
    };
    const mw = at(L.member('mw'));
    const m31 = at(L.member('m31'));
    const m33 = at(L.member('m33'));
    GD.drawGalaxy(svg, { ...DRAW['barred-spiral'], angle: 20 }, mw.x, mw.y, 16).classList.add('lg-mw');
    GD.drawGalaxy(svg, { ...DRAW.spiral, tilt: 0.55, angle: -35 }, m31.x, m31.y, 24).classList.add('lg-m31');
    GD.drawGalaxy(svg, { ...DRAW.spiral, sub: 'c', tilt: 0.3, angle: 15 }, m33.x, m33.y, 12).classList.add('lg-m33');
    // A box round the Milky Way, opened out below.
    svgEl('rect', { class: 'lg-zoom-box', x: mw.x - 22, y: mw.y - 22, width: 44, height: 44, fill: 'none', stroke: INK, 'stroke-width': 1, 'stroke-dasharray': '3 3' }, svg);
    svgEl('line', { x1: mw.x - 22, y1: mw.y + 22, x2: INSET.x0 + 40, y2: INSET.y0, stroke: MUTED, 'stroke-width': 1, 'stroke-dasharray': '3 3' }, svg);
    svgEl('line', { x1: mw.x + 22, y1: mw.y + 22, x2: INSET.x0 + INSET.w - 20, y2: INSET.y0, stroke: MUTED, 'stroke-width': 1, 'stroke-dasharray': '3 3' }, svg);
    addLabel(svg, wrap, 'Milky Way', mw.x - 30, mw.y - 36, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'Andromeda (M31)', m31.x, m31.y - 44, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'Triangulum (M33)', m33.x + 18, m33.y + 26, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'edge of the Local Group (roughly)', MAP.cx, MAP.cy - MAP.ry - 4 + 22, 'diagram-label--tick');
    const millionPc = 1e6;
    scaleBar(svg, wrap, 400, 396, millionPc * MAP.s, '1 million pc');

    // The close-up of the Milky Way.
    svgEl('rect', { class: 'lg-inset', x: INSET.x0, y: INSET.y0, width: INSET.w, height: INSET.h, rx: 8, fill: '#0b0e18', stroke: INK, 'stroke-width': 1, 'stroke-dasharray': '3 3' }, svg);
    addLabel(svg, wrap, 'close-up of the Milky Way', INSET.x0 + 10, INSET.y0 + 16, 'diagram-label--tick diagram-label--right');
    const inAt = (m) => {
      const p = L.position(m);
      return { x: INSET.mwX + p.x * INSET.s, y: INSET.mwY - p.y * INSET.s };
    };
    GD.drawGalaxy(svg, { ...DRAW['barred-spiral'], angle: 20 }, INSET.mwX, INSET.mwY, 26);
    const lmc = inAt(L.member('lmc'));
    const smc = inAt(L.member('smc'));
    GD.drawGalaxy(svg, { kind: 'irregular', seed: 3 }, lmc.x, lmc.y, 13).classList.add('lg-lmc');
    GD.drawGalaxy(svg, { kind: 'irregular', seed: 9 }, smc.x, smc.y, 9).classList.add('lg-smc');
    addLabel(svg, wrap, 'LMC', lmc.x - 2, lmc.y + 24, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'SMC', smc.x + 30, smc.y + 4, 'diagram-label--tick diagram-label--strong');
    scaleBar(svg, wrap, INSET.x0 + 190, INSET.y0 + 132, L.LMC_PC * INSET.s, `${L.LMC_PC.toLocaleString('en-GB')} pc`);

    // The key: one row per shape.
    const kx = 392;
    [
      [(x, y) => GD.drawGalaxy(svg, { ...DRAW['barred-spiral'] }, x, y, 11), 'barred spiral'],
      [(x, y) => GD.drawGalaxy(svg, { ...DRAW.spiral }, x, y, 11), 'spiral'],
      [(x, y) => GD.drawGalaxy(svg, { kind: 'irregular', seed: 3 }, x, y, 10), 'irregular'],
      [(x, y) => dwarf(svg, x, y), 'dwarf galaxy'],
    ].forEach(([draw, text], k) => {
      const y = INSET.y0 + 22 + k * 36;
      draw(kx, y);
      addLabel(svg, wrap, text, kx + 22, y, 'diagram-label--tick diagram-label--right');
    });
  }

  function fillTable() {
    const body = document.getElementById('members-body');
    body.textContent = '';
    L.MEMBERS.filter((m) => m.id !== 'mw').forEach((m) => {
      const tr = document.createElement('tr');
      const ly = L.roundSig(L.lightYears(m.pc), 2);
      [m.name, TYPE_NAME[m.shape], `about ${L.roundSig(m.pc, 2).toLocaleString('en-GB')}`, `about ${ly.toLocaleString('en-GB')}`].forEach((t, k) => {
        const cell = document.createElement(k === 0 ? 'th' : 'td');
        if (k === 0) cell.scope = 'row';
        cell.textContent = t;
        tr.appendChild(cell);
      });
      body.appendChild(tr);
    });
  }

  // ------------------------------------------------------------------
  // 2. Zoom out: group, cluster, supercluster, cosmic web
  // ------------------------------------------------------------------

  let level = 'group';

  function swarm(svg, cx, cy, r, n, seed, sizeRange = [3, 6]) {
    const rand = seeded(seed);
    for (let i = 0; i < n; i += 1) {
      const a = rand() * Math.PI * 2;
      const f = rand() ** 1.6;
      const x = cx + Math.cos(a) * r * f;
      const y = cy + Math.sin(a) * r * f * 0.85;
      const size = sizeRange[0] + rand() * (sizeRange[1] - sizeRange[0]);
      if (size > 5 && rand() < 0.5) GD.drawGalaxy(svg, { kind: f < 0.4 ? 'elliptical' : 'spiral', e: 3, sub: 'b', tilt: 0.4, angle: rand() * 180 }, x, y, size);
      else svgEl('circle', { class: 'lg-dot', cx: x.toFixed(1), cy: y.toFixed(1), r: (size / 3).toFixed(1), fill: '#e4ebff', opacity: 0.8 }, svg);
    }
  }

  /** A dashed square in the top-left corner, the size of the previous view, for scale. */
  function previousBox(svg, wrap, size, text) {
    svgEl('rect', { class: 'lg-prev-box', x: 20, y: 20, width: size, height: size, fill: '#10131c', stroke: INK, 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, svg);
    addLabel(svg, wrap, text, 20, 20 + size + 16, 'diagram-label--tick diagram-label--right');
  }

  function drawZoom() {
    const svg = document.getElementById('zoom-diagram');
    const wrap = document.getElementById('zoom-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const lv = L.LEVELS.find((l) => l.id === level);
    if (level === 'group') {
      svgEl('ellipse', { class: 'lg-boundary', cx: 320, cy: 205, rx: 270, ry: 160, fill: 'none', stroke: MUTED, 'stroke-width': 1.5, 'stroke-dasharray': '6 6' }, svg);
      GD.drawGalaxy(svg, { kind: 'barred', sub: 'b', angle: 20 }, 250, 210, 22);
      GD.drawGalaxy(svg, { kind: 'spiral', sub: 'b', tilt: 0.55, angle: -35 }, 400, 200, 30);
      GD.drawGalaxy(svg, { kind: 'spiral', sub: 'c', tilt: 0.3 }, 425, 250, 14);
      const rand = seeded(5);
      for (let i = 0; i < 20; i += 1) {
        const a = rand() * Math.PI * 2;
        const f = Math.sqrt(rand()) * 0.85;
        dwarf(svg, 320 + Math.cos(a) * 270 * f, 205 + Math.sin(a) * 160 * f);
      }
      addLabel(svg, wrap, 'Milky Way', 250, 248, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'Andromeda', 400, 152, 'diagram-label--tick diagram-label--strong');
    } else if (level === 'cluster') {
      swarm(svg, 320, 205, 190, 150, 23, [2.5, 9]);
      previousBox(svg, wrap, 120, 'a group like ours: about this big');
    } else if (level === 'supercluster') {
      const clumps = [[170, 150, 46, 40], [330, 215, 58, 55], [480, 120, 40, 30], [470, 310, 46, 35], [210, 320, 34, 22], [585, 225, 26, 14], [70, 260, 24, 12]];
      // Faint chains linking the clumps.
      [[0, 1], [1, 2], [1, 3], [1, 4], [3, 5], [0, 6], [2, 5]].forEach(([a, b], k) => {
        const [x1, y1] = clumps[a];
        const [x2, y2] = clumps[b];
        const rand = seeded(40 + k);
        for (let i = 0; i < 14; i += 1) {
          const t = rand();
          svgEl('circle', { cx: (x1 + (x2 - x1) * t + (rand() - 0.5) * 14).toFixed(1), cy: (y1 + (y2 - y1) * t + (rand() - 0.5) * 14).toFixed(1), r: 1.2, fill: '#e4ebff', opacity: 0.45 }, svg);
        }
      });
      clumps.forEach(([x, y, r, n], k) => {
        svgEl('circle', { class: 'lg-clump', cx: x, cy: y, r: r * 0.8, fill: '#c9d6ff', opacity: 0.12 }, svg);
        swarm(svg, x, y, r, n * 2, 60 + k, [2.4, 4.6]);
      });
      previousBox(svg, wrap, 44, 'one cluster');
      addLabel(svg, wrap, 'groups and clusters, strung together', 400, 30, 'diagram-label--tick');
    } else {
      // The cosmic web: filaments between nodes, round dark voids.
      const nodes = [[60, 80], [200, 60], [340, 110], [500, 70], [600, 160], [120, 220], [260, 230], [420, 250], [560, 330], [80, 360], [240, 370], [380, 360], [600, 30]];
      const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [1, 6], [2, 6], [2, 7], [3, 7], [4, 8], [5, 6], [6, 7], [7, 8], [5, 9], [6, 10], [9, 10], [10, 11], [11, 7], [11, 8], [3, 12], [4, 12]];
      edges.forEach(([a, b], k) => {
        const [x1, y1] = nodes[a];
        const [x2, y2] = nodes[b];
        const rand = seeded(90 + k);
        svgEl('line', { class: 'lg-filament', x1, y1, x2, y2, stroke: '#c9d6ff', 'stroke-width': 6, opacity: 0.18, 'stroke-linecap': 'round' }, svg);
        for (let i = 0; i < 26; i += 1) {
          const t = rand();
          svgEl('circle', { cx: (x1 + (x2 - x1) * t + (rand() - 0.5) * 8).toFixed(1), cy: (y1 + (y2 - y1) * t + (rand() - 0.5) * 8).toFixed(1), r: 1.1, fill: '#e4ebff', opacity: 0.8 }, svg);
        }
      });
      nodes.forEach(([x, y], k) => swarm(svg, x, y, 12, 14, 120 + k, [1.2, 2.4]));
      previousBox(svg, wrap, 60, 'one supercluster');
      addLabel(svg, wrap, 'void', 470, 165, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'void', 160, 150, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'filament', 150, 300, 'diagram-label--tick diagram-label--strong');
    }
    const across = lv.acrossLy >= 1e9 ? `${lv.acrossLy / 1e9} billion` : `${lv.acrossLy / 1e6} million`;
    addLabel(svg, wrap, `this view: about ${across} light-years across`, 16, 406, 'diagram-label--tick diagram-label--right');
    svg.dataset.level = level;
    document.getElementById('zoom-readout').textContent = `${lv.name}: about ${across} light-years across, holding ${lv.holds}.`;
    document.querySelectorAll('.lg-zoom-buttons button').forEach((b) => {
      const on = b.dataset.level === level;
      b.classList.toggle('preset-button-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }

  drawMap();
  fillTable();
  document.querySelectorAll('.lg-zoom-buttons button').forEach((b) =>
    b.addEventListener('click', () => {
      level = b.dataset.level;
      drawZoom();
    }),
  );
  drawZoom();
  renderCoverage();
  QuizUI.mount(LocalGroupQuestions.makeQuestions(L));
})();
