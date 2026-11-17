(function () {
  const B = window.BigBang;
  const GD = window.GalaxyDrawing;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, CURVE, svgEl, clearDiagram, addLabel, panel } = D;

  const CURRICULUM_UNITS = ['u6.9'];
  const SCALE = 1.0;
  const PANELS = [
    { key: 'big-bang', title: 'Big Bang', cx: 160, galaxies: (k) => B.bigBang(k) },
    { key: 'steady-state', title: 'Steady State', cx: 480, galaxies: (k) => B.steadyState(k) },
  ];
  const CY = 160;
  const HALF = B.PATCH_HALF * SCALE;
  const GLOW = [0.5, 0.28, 0.14, 0.05];
  const BB_STATE = ['hot and dense', 'cooler, thinner', 'cooler still', 'cool, thin'];

  let step = 1;

  function square(svg, x, y, cls) {
    svgEl('rect', { class: cls, x: x - 6, y: y - 6, width: 12, height: 12, fill: 'none', stroke: CURVE, 'stroke-width': 2.5 }, svg);
  }

  function triangle(svg, x, y, cls) {
    svgEl('polygon', { class: cls, points: `${x},${y - 8} ${x + 7},${y + 5} ${x - 7},${y + 5}`, fill: 'none', stroke: CURVE, 'stroke-width': 2.5 }, svg);
  }

  function drawTheories() {
    const svg = document.getElementById('theories-diagram');
    const wrap = document.getElementById('theories-diagram-wrap');
    const k = step - 1;
    clearDiagram(svg, wrap);
    panel(svg);
    const counts = {};
    PANELS.forEach((p) => {
      const x0 = p.cx - HALF;
      const y0 = CY - HALF;
      svgEl('rect', { class: `bb-patch bb-patch-${p.key}`, x: x0, y: y0, width: 2 * HALF, height: 2 * HALF, fill: '#0a1122', stroke: MUTED, 'stroke-width': 1.5 }, svg);
      if (p.key === 'big-bang') {
        svgEl('rect', { class: 'bb-glow', x: x0, y: y0, width: 2 * HALF, height: 2 * HALF, fill: '#ffb36b', opacity: GLOW[k] }, svg);
      }
      const gals = p.galaxies(k);
      counts[p.key] = gals.length;
      gals.forEach((g) => {
        const x = p.cx + g.x * SCALE;
        const y = CY + g.y * SCALE;
        const isNew = p.key === 'steady-state' && k > 0 && g.created === k;
        if (isNew) svgEl('circle', { class: 'bb-new', cx: x.toFixed(1), cy: y.toFixed(1), r: 4.5, fill: 'none', stroke: INK, 'stroke-width': 1.8 }, svg);
        else svgEl('circle', { class: 'bb-galaxy', cx: x.toFixed(1), cy: y.toFixed(1), r: 2.4, fill: INK }, svg);
      });
      const [a, b] = B.markedPair(k);
      const ax = p.cx + a.x * SCALE;
      const ay = CY + a.y * SCALE;
      const bx = p.cx + b.x * SCALE;
      const by = CY + b.y * SCALE;
      svgEl('line', { class: 'bb-pair-line', x1: ax, y1: ay, x2: bx, y2: by, stroke: CURVE, 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }, svg);
      square(svg, ax, ay, 'bb-pair');
      triangle(svg, bx, by, 'bb-pair');
      addLabel(svg, wrap, p.title, p.cx, 18, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, `${gals.length} galaxies in this patch`, p.cx, CY + HALF + 16, 'diagram-label--tick');
      const state = p.key === 'big-bang' ? BB_STATE[k] : k === 0 ? 'always the same density' : 'new galaxies fill the gaps';
      addLabel(svg, wrap, state, p.cx, CY + HALF + 48, 'diagram-label--tick diagram-label--strong');
    });
    svg.dataset.step = String(step);
    svg.dataset.bigBangCount = String(counts['big-bang']);
    svg.dataset.steadyStateCount = String(counts['steady-state']);
    const newCount = k === 0 ? 0 : B.steadyState(k).filter((g) => g.created === k).length;
    document.getElementById('theories-readout').textContent =
      `Step ${step}, ${B.STEPS[k].label}: the same two galaxies are ${(B.pairGap(k) / B.pairGap(0)).toFixed(1)} times as far apart as at step 1 in both. ` +
      `Big Bang: ${counts['big-bang']} galaxies in the patch, ${BB_STATE[k]}. ` +
      `Steady State: ${counts['steady-state']} galaxies${k === 0 ? '' : `, ${newCount} of them new since the last step`}.`;
    document.querySelectorAll('.bb-step-buttons button').forEach((btn) => {
      const on = Number(btn.dataset.step) === step;
      btn.classList.toggle('preset-button-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
  }

  function quasar(svg, x, y) {
    const s = 7;
    const t = 2;
    svgEl('path', { class: 'bb-quasar', d: `M${x},${y - s} L${x + t},${y - t} L${x + s},${y} L${x + t},${y + t} L${x},${y + s} L${x - t},${y + t} L${x - s},${y} L${x - t},${y - t} Z`, fill: '#fff3c4' }, svg);
  }

  function drawLookingBack() {
    const svg = document.getElementById('looking-back-diagram');
    const wrap = document.getElementById('looking-back-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const rows = [
      { y: 80, title: 'Big Bang predicts', note: 'different long ago: smaller galaxies, quasars', key: 'bb' },
      { y: 200, title: 'Steady State predicts', note: 'the same mix at every distance', key: 'ss' },
    ];
    const xs = [100, 210, 320, 430, 540];
    rows.forEach((row) => {
      addLabel(svg, wrap, row.title, 16, row.y - 50, 'diagram-label--tick diagram-label--strong diagram-label--right');
      xs.forEach((x, i) => {
        if (row.key === 'ss') {
          const kind = i % 2 === 0 ? { kind: 'spiral', sub: 'b', tilt: 0.35, angle: 20 * i } : { kind: 'elliptical', e: 3, angle: 15 };
          GD.drawGalaxy(svg, kind, x, row.y, 20).classList.add('bb-ss-galaxy');
        } else if (i < 2) {
          GD.drawGalaxy(svg, i === 0 ? { kind: 'spiral', sub: 'b', tilt: 0.35 } : { kind: 'elliptical', e: 3 }, x, row.y, 22 - i * 3).classList.add('bb-bb-galaxy');
        } else if (i < 4) {
          GD.drawGalaxy(svg, { kind: 'irregular', seed: 4 + i }, x - 12, row.y - 8, 10).classList.add('bb-bb-young');
          GD.drawGalaxy(svg, { kind: 'irregular', seed: 9 + i }, x + 14, row.y + 10, 8).classList.add('bb-bb-young');
          if (i === 3) quasar(svg, x + 20, row.y - 16);
        } else {
          quasar(svg, x - 10, row.y - 6);
          quasar(svg, x + 16, row.y + 12);
          GD.drawGalaxy(svg, { kind: 'irregular', seed: 21 }, x + 18, row.y - 18, 7).classList.add('bb-bb-young');
        }
      });
      addLabel(svg, wrap, row.note, 320, row.y + 40, 'diagram-label--tick');
    });
    svgEl('line', { x1: 60, x2: 600, y1: 268, y2: 268, stroke: MUTED, 'stroke-width': 1.5 }, svg);
    svgEl('polygon', { points: '606,268 596,263 596,273', fill: MUTED }, svg);
    addLabel(svg, wrap, 'nearby', 60, 286, 'diagram-label--tick diagram-label--right');
    addLabel(svg, wrap, 'far away = long ago', 604, 286, 'diagram-label--tick diagram-label--left');
  }

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }

  document.querySelectorAll('.bb-step-buttons button').forEach((btn) =>
    btn.addEventListener('click', () => {
      step = Number(btn.dataset.step);
      drawTheories();
    }),
  );
  drawTheories();
  drawLookingBack();
  renderCoverage();
  QuizUI.mount(BigBangQuestions.makeQuestions(B));
})();
