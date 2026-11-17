(function () {
  const F = window.GalaxyFormation;
  const GD = window.GalaxyDrawing;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, svgEl, clearDiagram, addLabel, panel } = D;

  const CURRICULUM_UNITS = ['u6.8'];

  function seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function glowDefs(svg) {
    const d = svgEl('defs', {}, svg);
    const g = svgEl('radialGradient', { id: `gf-gas-${svg.id}` }, d);
    svgEl('stop', { offset: '0%', 'stop-color': '#c9d6ff', 'stop-opacity': 0.55 }, g);
    svgEl('stop', { offset: '100%', 'stop-color': '#c9d6ff', 'stop-opacity': 0 }, g);
    return `url(#gf-gas-${svg.id})`;
  }

  function cluster(svg, x, y) {
    svgEl('circle', { class: 'gf-cluster', cx: x.toFixed(1), cy: y.toFixed(1), r: 4.5, fill: 'none', stroke: '#ffd7a1', 'stroke-width': 1 }, svg);
    svgEl('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 1.6, fill: '#ffd7a1' }, svg);
  }

  function star(svg, x, y, s = 5, cls = 'gf-new-stars') {
    const t = s * 0.3;
    svgEl('path', { class: cls, d: `M${x},${y - s} L${x + t},${y - t} L${x + s},${y} L${x + t},${y + t} L${x},${y + s} L${x - t},${y + t} L${x - s},${y} L${x - t},${y - t} Z`, fill: '#ff9fb4' }, svg);
  }

  function arrow(svg, x1, y1, x2, y2) {
    svgEl('line', { class: 'gf-arrow', x1, y1, x2, y2, stroke: INK, 'stroke-width': 2 }, svg);
    const a = Math.atan2(y2 - y1, x2 - x1);
    svgEl('path', { d: `M${x2},${y2} L${(x2 - 10 * Math.cos(a - 0.45)).toFixed(1)},${(y2 - 10 * Math.sin(a - 0.45)).toFixed(1)} M${x2},${y2} L${(x2 - 10 * Math.cos(a + 0.45)).toFixed(1)},${(y2 - 10 * Math.sin(a + 0.45)).toFixed(1)}`, stroke: INK, 'stroke-width': 2, fill: 'none' }, svg);
  }

  /** A ragged gas cloud: overlapping soft blobs. */
  function cloud(svg, fill, cx, cy, rx, ry, seed) {
    const rand = seeded(seed);
    for (let i = 0; i < 9; i += 1) {
      svgEl('ellipse', { class: 'gf-gas', cx: (cx + (rand() - 0.5) * rx).toFixed(1), cy: (cy + (rand() - 0.5) * ry).toFixed(1), rx: (rx * (0.4 + rand() * 0.4)).toFixed(1), ry: (ry * (0.4 + rand() * 0.4)).toFixed(1), fill }, svg);
    }
  }

  const DRAW = {
    'top-down': [
      (svg, fill) => { cloud(svg, fill, 320, 160, 300, 220, 3); },
      (svg, fill) => {
        cloud(svg, fill, 320, 160, 190, 150, 5);
        const rand = seeded(8);
        for (let i = 0; i < 9; i += 1) { const a = rand() * 6.28; const r = 70 + rand() * 60; cluster(svg, 320 + r * Math.cos(a), 160 + r * Math.sin(a) * 0.8); }
        [-1, 1].forEach((s) => arrow(svg, 320 + s * 210, 160, 320 + s * 160, 160));
      },
      (svg, fill) => {
        svgEl('ellipse', { class: 'gf-gas gf-disc', cx: 320, cy: 160, rx: 170, ry: 34, fill }, svg);
        svgEl('ellipse', { cx: 320, cy: 160, rx: 120, ry: 18, fill: '#e4ebff', opacity: 0.35 }, svg);
        const rand = seeded(8);
        for (let i = 0; i < 9; i += 1) { const a = rand() * 6.28; const r = 70 + rand() * 60; cluster(svg, 320 + r * Math.cos(a), 160 + r * Math.sin(a) * 0.8); }
        svgEl('path', { class: 'gf-spin', d: 'M210,215 A120,30 0 0 0 430,215', fill: 'none', stroke: INK, 'stroke-width': 2 }, svg);
        svgEl('path', { d: 'M430,215 l-12,-2 M430,215 l-5,-10', stroke: INK, 'stroke-width': 2, fill: 'none' }, svg);
      },
      (svg) => {
        GD.drawGalaxy(svg, { kind: 'spiral', sub: 'b', tilt: 0.55, angle: -10 }, 320, 160, 120).classList.add('gf-result');
        const rand = seeded(8);
        for (let i = 0; i < 9; i += 1) { const a = rand() * 6.28; const r = 120 + rand() * 30; cluster(svg, 320 + r * Math.cos(a), 160 + r * Math.sin(a) * 0.8); }
      },
    ],
    'bottom-up': [
      (svg, fill) => { const rand = seeded(21); for (let i = 0; i < 30; i += 1) svgEl('circle', { class: 'gf-clump', cx: (40 + rand() * 560).toFixed(1), cy: (40 + rand() * 240).toFixed(1), r: (5 + rand() * 5).toFixed(1), fill: '#e4ebff', opacity: 0.8 }, svg); },
      (svg) => { const rand = seeded(31); for (let i = 0; i < 9; i += 1) GD.drawGalaxy(svg, { kind: 'irregular', seed: 5 + i }, 70 + (i % 5) * 120 + rand() * 30, 90 + Math.floor(i / 5) * 130 + rand() * 30, 20).classList.add('gf-dwarf'); },
      (svg) => {
        GD.drawGalaxy(svg, { kind: 'irregular', seed: 13 }, 150, 110, 44).classList.add('gf-dwarf');
        GD.drawGalaxy(svg, { kind: 'spiral', sub: 'c', tilt: 0.3 }, 420, 150, 60).classList.add('gf-result');
        GD.drawGalaxy(svg, { kind: 'irregular', seed: 17 }, 200, 240, 30).classList.add('gf-dwarf');
      },
      (svg) => {
        GD.drawGalaxy(svg, { kind: 'spiral', sub: 'b', tilt: 0.4, angle: -15 }, 290, 160, 110).classList.add('gf-result');
        GD.drawGalaxy(svg, { kind: 'irregular', seed: 23 }, 510, 90, 20).classList.add('gf-dwarf');
        const rand = seeded(4);
        for (let i = 0; i < 26; i += 1) { const t = rand(); svgEl('circle', { class: 'gf-stream', cx: (510 - t * 150).toFixed(1), cy: (90 + t * 50 + Math.sin(t * 6) * 8).toFixed(1), r: 1.4, fill: '#e4ebff' }, svg); }
        arrow(svg, 480, 100, 420, 125);
      },
    ],
    mergers: [
      (svg) => {
        GD.drawGalaxy(svg, { kind: 'spiral', sub: 'b', tilt: 0.3, angle: 20 }, 160, 160, 75).classList.add('gf-result');
        GD.drawGalaxy(svg, { kind: 'spiral', sub: 'b', tilt: 0.5, angle: -40 }, 480, 160, 75).classList.add('gf-result');
        arrow(svg, 250, 160, 300, 160);
        arrow(svg, 390, 160, 340, 160);
      },
      (svg, fill) => {
        GD.drawGalaxy(svg, { kind: 'spiral', sub: 'c', tilt: 0.3, angle: 40 }, 270, 150, 60);
        GD.drawGalaxy(svg, { kind: 'spiral', sub: 'c', tilt: 0.5, angle: -60 }, 370, 175, 60);
        [[270, 150, -1], [370, 175, 1]].forEach(([x, y, s], k) => {
          const rand = seeded(50 + k);
          for (let i = 0; i < 40; i += 1) { const t = i / 40; svgEl('circle', { class: 'gf-tail', cx: (x + s * (60 + t * 200)).toFixed(1), cy: (y - s * 40 * Math.sin(t * 3) + (rand() - 0.5) * 8).toFixed(1), r: 1.3, fill: '#e4ebff', opacity: 1 - t * 0.6 }, svg); }
        });
        [[300, 140], [345, 170], [320, 190], [290, 175]].forEach(([x, y]) => star(svg, x, y, 6));
      },
      (svg, fill) => {
        svgEl('ellipse', { class: 'gf-gas', cx: 320, cy: 160, rx: 110, ry: 70, fill }, svg);
        svgEl('ellipse', { cx: 320, cy: 160, rx: 80, ry: 50, fill: '#e4ebff', opacity: 0.35 }, svg);
        [[295, 150], [345, 170]].forEach(([x, y]) => svgEl('circle', { class: 'gf-core', cx: x, cy: y, r: 9, fill: '#fff4dc' }, svg));
        [-1, 1].forEach((s) => { for (let i = 0; i < 30; i += 1) { const t = i / 30; svgEl('circle', { class: 'gf-tail', cx: (320 + s * (110 + t * 160)).toFixed(1), cy: (160 - s * 30 * Math.sin(t * 3)).toFixed(1), r: 1.2, fill: '#e4ebff', opacity: 0.8 - t * 0.6 }, svg); } });
      },
      (svg) => { GD.drawGalaxy(svg, { kind: 'elliptical', e: 3, angle: 15 }, 320, 160, 110).classList.add('gf-result'); },
    ],
  };

  const LABELS = {
    'top-down': [['a huge gas cloud', 320, 300], ['first stars and globular clusters', 320, 300], ['spinning, flattening disc', 320, 300], ['a spiral galaxy, clusters in the halo', 320, 300]],
    'bottom-up': [['many small clumps', 320, 305], ['dwarf galaxies', 320, 305], ['dwarfs merge into bigger galaxies', 320, 305], ['a big galaxy swallowing a small one', 320, 305]],
    mergers: [['two spirals pulled together', 320, 290], ['tails of stars; bursts of new stars', 320, 290], ['the centres merge', 320, 290], ['one elliptical galaxy', 320, 290]],
  };

  const state = { 'top-down': 1, 'bottom-up': 1, mergers: 1 };

  function draw(theoryId) {
    const svg = document.getElementById(`${theoryId}-diagram`);
    const wrap = document.getElementById(`${theoryId}-diagram-wrap`);
    clearDiagram(svg, wrap);
    panel(svg);
    const fill = glowDefs(svg);
    const step = state[theoryId];
    DRAW[theoryId][step - 1](svg, fill);
    const [text, x, y] = LABELS[theoryId][step - 1];
    addLabel(svg, wrap, text, x, y, 'diagram-label--tick diagram-label--strong gf-step-label');
    addLabel(svg, wrap, `step ${step} of ${F.STEPS}`, 16, 18, 'diagram-label--tick diagram-label--right');
    svg.dataset.step = String(step);
    document.getElementById(`${theoryId}-readout`).textContent = `Step ${step}: ${F.theory(theoryId).steps[step - 1]}`;
    document.querySelectorAll(`.gf-step-buttons[data-theory="${theoryId}"] button`).forEach((b) => {
      const on = Number(b.dataset.step) === step;
      b.classList.toggle('preset-button-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }

  F.THEORIES.forEach((t) => {
    document.querySelectorAll(`.gf-step-buttons[data-theory="${t.id}"] button`).forEach((b) =>
      b.addEventListener('click', () => {
        state[t.id] = Number(b.dataset.step);
        draw(t.id);
      }),
    );
    draw(t.id);
  });
  renderCoverage();
  QuizUI.mount(GalaxyFormationQuestions.makeQuestions(F));
})();
