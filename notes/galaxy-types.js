(function () {
  const T = window.GalaxyTypes;
  const GD = window.GalaxyDrawing;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, svgEl, clearDiagram, addLabel, panel } = D;

  const CURRICULUM_UNITS = ['u6.6'];

  // ------------------------------------------------------------------
  // 1. Sort the galaxies: one tile per drawn galaxy, four class buttons
  // ------------------------------------------------------------------

  const answers = {};

  function drawTile(item) {
    const svg = document.getElementById(`tile-${item.id}`);
    const wrap = svg.parentElement;
    clearDiagram(svg, wrap);
    panel(svg);
    GD.drawGalaxy(svg, item.draw, 100, 80, 58);
    const chosen = answers[item.id];
    if (chosen) {
      const fb = T.feedback(item, chosen);
      // The answer is shown in the picture itself, by a symbol and words.
      svgEl('rect', { class: `gt-answer-band${fb.correct ? ' gt-answer-band--right' : ''}`, x: 0, y: 136, width: 200, height: 24, fill: '#10131c', opacity: 0.85 }, svg);
      addLabel(svg, wrap, `${fb.correct ? '✓' : '✗'} ${T.classById(item.answer).name}`, 100, 148, 'diagram-label--tick diagram-label--strong gt-tile-answer');
    }
    svg.dataset.answered = chosen ? (T.feedback(item, chosen).correct ? 'right' : 'wrong') : 'no';
  }

  function updateScore() {
    const done = T.SORT_SET.filter((s) => answers[s.id]);
    const right = done.filter((s) => answers[s.id] === s.answer);
    document.getElementById('sort-score').textContent = done.length
      ? `Sorted correctly: ${right.length} of ${done.length} tried (${T.SORT_SET.length} galaxies in all).`
      : `Pick a class for each of the ${T.SORT_SET.length} galaxies.`;
  }

  function buildSort() {
    const grid = document.getElementById('sort-grid');
    grid.textContent = '';
    T.SORT_SET.forEach((item, k) => {
      const tile = document.createElement('div');
      tile.className = 'gt-tile';
      // A plain wrapper, not .labelled-diagram-wrap: a small sorting card
      // needs no Enlarge button of its own.
      const panelDiv = document.createElement('div');
      panelDiv.className = 'spectrum-panel';
      const wrap = document.createElement('div');
      wrap.className = 'gt-tile-wrap';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      [['id', `tile-${item.id}`], ['viewBox', '0 0 200 160'], ['width', 200], ['height', 160], ['class', 'responsive-svg'], ['role', 'img'], ['aria-label', `Galaxy ${k + 1} to classify`]].forEach(([a, v]) => svg.setAttribute(a, v));
      wrap.appendChild(svg);
      panelDiv.appendChild(wrap);
      tile.appendChild(panelDiv);
      const buttons = document.createElement('div');
      buttons.className = 'gt-tile-buttons';
      buttons.setAttribute('role', 'group');
      buttons.setAttribute('aria-label', `Classify galaxy ${k + 1}`);
      T.CLASSES.forEach((c) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'preset-button';
        b.dataset.item = item.id;
        b.dataset.choice = c.id;
        b.setAttribute('aria-pressed', 'false');
        b.textContent = c.name;
        b.addEventListener('click', () => {
          answers[item.id] = c.id;
          buttons.querySelectorAll('button').forEach((x) => {
            const on = x === b;
            x.classList.toggle('preset-button-active', on);
            x.setAttribute('aria-pressed', String(on));
          });
          feedback.textContent = T.feedback(item, c.id).text;
          drawTile(item);
          updateScore();
        });
        buttons.appendChild(b);
      });
      tile.appendChild(buttons);
      const feedback = document.createElement('p');
      feedback.className = 'note gt-feedback';
      feedback.id = `feedback-${item.id}`;
      feedback.setAttribute('aria-live', 'polite');
      tile.appendChild(feedback);
      grid.appendChild(tile);
      drawTile(item);
    });
    updateScore();
  }

  // ------------------------------------------------------------------
  // 2. The tuning fork
  // ------------------------------------------------------------------

  function drawFork() {
    const svg = document.getElementById('fork-diagram');
    const wrap = document.getElementById('fork-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const forkAt = T.forkSpot('S0');
    const up = T.forkSpot('Sa');
    const down = T.forkSpot('SBa');
    const endX = T.forkSpot('Sc').x + 30;
    const stroke = { stroke: MUTED, 'stroke-width': 10, 'stroke-linecap': 'round', fill: 'none', opacity: 0.35 };
    svgEl('path', { class: 'gt-fork', d: `M${T.forkSpot('E0').x - 30},${forkAt.y} L${forkAt.x + 20},${forkAt.y} Q${forkAt.x + 50},${forkAt.y} ${up.x - 40},${up.y} L${endX},${up.y} M${forkAt.x + 20},${forkAt.y} Q${forkAt.x + 50},${forkAt.y} ${down.x - 40},${down.y} L${endX},${down.y}`, ...stroke }, svg);
    T.FORK.forEach((f) => {
      GD.drawGalaxy(svg, f.draw, f.x, f.y, 26).classList.add('gt-fork-galaxy');
      addLabel(svg, wrap, f.label, f.x, f.y + 40, 'diagram-label--tick diagram-label--strong gt-fork-label');
    });
    // The Milky Way, ringed on the barred prong.
    const mw = T.forkSpot(T.MILKY_WAY_TYPE);
    svgEl('circle', { class: 'gt-mw-ring', cx: mw.x, cy: mw.y, r: 34, fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-dasharray': '5 3' }, svg);
    addLabel(svg, wrap, 'Milky Way', mw.x, mw.y - 48, 'diagram-label--tick');
    // Group names.
    addLabel(svg, wrap, 'ellipticals', T.forkSpot('E3').x, forkAt.y - 48, 'diagram-label--tick');
    addLabel(svg, wrap, 'spirals', T.forkSpot('Sb').x, up.y - 48, 'diagram-label--tick');
    addLabel(svg, wrap, 'barred spirals', T.forkSpot('SBb').x, down.y + 76, 'diagram-label--tick');
    // Irregulars, off the fork.
    const irr = T.FORK_IRREGULAR;
    GD.drawGalaxy(svg, irr.draw, irr.x, irr.y, 26).classList.add('gt-fork-galaxy');
    addLabel(svg, wrap, 'irregulars: not on the fork', irr.x - 30, irr.y + 44, 'diagram-label--tick diagram-label--right');
  }

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }

  buildSort();
  drawFork();
  renderCoverage();
  QuizUI.mount(GalaxyTypesQuestions.makeQuestions(T));
})();
