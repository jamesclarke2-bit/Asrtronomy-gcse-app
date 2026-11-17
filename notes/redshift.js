(function () {
  const R = window.Redshift;
  const GD = window.GalaxyDrawing;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, CURVE, svgEl, clearDiagram, addLabel, panel, makeScale, drawStrip, drawWavelengthAxis } = D;

  const CURRICULUM_UNITS = ['u6.1'];
  const RANGE = R.DRAW_RANGE_NM;
  const AXIS_TICKS = [400, 450, 500, 550, 600, 650, 700];
  const X0 = 130;
  const X1 = 620;

  function fmt(n, digits = 0) {
    return n.toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function cText() {
    const c = R.C_M_PER_S;
    const exp = Math.floor(Math.log10(c));
    const sup = String(exp).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]).join('');
    return `${(c / 10 ** exp).toFixed(1)} × 10${sup} m/s = ${fmt(R.C_KM_PER_S)} km/s`;
  }

  /** A small glowing laboratory lamp: a tube of hydrogen. */
  function lamp(svg, cx, cy) {
    svgEl('rect', { x: cx - 30, y: cy - 9, width: 60, height: 18, rx: 9, fill: '#f6b4d4', opacity: 0.35 }, svg);
    svgEl('rect', { class: 'rs-lamp', x: cx - 26, y: cy - 5, width: 52, height: 10, rx: 5, fill: '#ffd6ea', stroke: '#f6b4d4', 'stroke-width': 1.5 }, svg);
    svgEl('rect', { x: cx - 34, y: cy - 7, width: 8, height: 14, rx: 2, fill: MUTED }, svg);
    svgEl('rect', { x: cx + 26, y: cy - 7, width: 8, height: 14, rx: 2, fill: MUTED }, svg);
  }

  function lines(vKmPerS) {
    return R.LINES.map((l) => ({ nm: R.observedWavelength(l.nm, vKmPerS), depth: 0.85, name: l.name, rest: l.nm }));
  }

  function arrowsBetween(svg, xFor, from, to, yTop, yBottom) {
    from.forEach((line, i) => {
      const xa = xFor(line.nm);
      const xb = xFor(to[i].nm);
      svgEl('line', { class: 'rs-arrow', x1: xa, x2: xb, y1: yTop, y2: yBottom, stroke: CURVE, 'stroke-width': 1.5 }, svg);
      if (xb - xa > 4) svgEl('polygon', { points: `${xb},${yBottom} ${xb - 3},${yBottom - 8} ${xb + 4},${yBottom - 6}`, fill: CURVE }, svg);
    });
  }

  // ------------------------------------------------------------------
  // 1. The main diagram: laboratory lines against a galaxy's lines
  // ------------------------------------------------------------------

  const speedSlider = document.getElementById('redshift-speed');

  function drawMain() {
    const svg = document.getElementById('redshift-diagram');
    const wrap = document.getElementById('redshift-diagram-wrap');
    const v = Number(speedSlider.value);
    clearDiagram(svg, wrap);
    panel(svg);
    const xFor = makeScale(X0, X1, RANGE.min, RANGE.max);
    const lab = lines(0);
    const galaxy = lines(v);

    lamp(svg, 62, 72);
    addLabel(svg, wrap, 'laboratory', 62, 100, 'diagram-label--tick');
    lab.forEach((l) => addLabel(svg, wrap, l.name, xFor(l.nm), 40, 'diagram-label--tick'));
    drawStrip(svg, { x0: X0, x1: X1, y: 55, h: 34, type: 'absorption', lines: lab, minNm: RANGE.min, maxNm: RANGE.max });

    GD.drawGalaxy(svg, { kind: 'spiral', sub: 'b', tilt: 0.45, angle: -20 }, 62, 178, 34).classList.add('rs-galaxy');
    addLabel(svg, wrap, 'galaxy', 62, 222, 'diagram-label--tick');
    drawStrip(svg, { x0: X0, x1: X1, y: 160, h: 34, type: 'absorption', lines: galaxy, minNm: RANGE.min, maxNm: RANGE.max });
    arrowsBetween(svg, xFor, lab, galaxy, 102, 156);

    const shift = R.wavelengthShift(656.3, v);
    if (v > 0) addLabel(svg, wrap, `+${shift.toFixed(1)} nm`, (xFor(656.3) + xFor(656.3 + shift)) / 2 - 18, 129, 'diagram-label--tick diagram-label--strong');
    drawWavelengthAxis(svg, wrap, { x0: X0, x1: X1, y: 214, ticks: AXIS_TICKS, minNm: RANGE.min, maxNm: RANGE.max });
    addLabel(svg, wrap, '← bluer', X0, 284, 'diagram-label--tick diagram-label--right');
    addLabel(svg, wrap, 'redder →', X1, 284, 'diagram-label--tick diagram-label--left');

    svg.dataset.speed = String(v);
    document.getElementById('rs-speed-readout').textContent = `${fmt(v)} km/s`;
    document.getElementById('rs-observed-readout').textContent = `${R.observedWavelength(656.3, v).toFixed(1)} nm`;
    document.getElementById('rs-shift-readout').textContent =
      v > 0 ? `+${shift.toFixed(1)} nm: every line moves to a longer wavelength, a redshift` : '0.0 nm: no shift';
  }

  // ------------------------------------------------------------------
  // 2. Why: stretched waves from a receding galaxy
  // ------------------------------------------------------------------

  function wave(svg, x0, x1, y, wavelength, amp, cls) {
    let d = '';
    for (let x = x0; x <= x1; x += 2) {
      const yy = y + amp * Math.sin(((x1 - x) / wavelength) * 2 * Math.PI);
      d += `${x === x0 ? 'M' : 'L'}${x.toFixed(1)},${yy.toFixed(1)} `;
    }
    svgEl('path', { class: cls, d, fill: 'none', stroke: INK, 'stroke-width': 2 }, svg);
  }

  function wavelengthBracket(svg, wrap, xRight, wavelength, y, text) {
    const xLeft = xRight - wavelength;
    svgEl('path', { d: `M${xLeft},${y + 6} L${xLeft},${y} L${xRight},${y} L${xRight},${y + 6}`, fill: 'none', stroke: CURVE, 'stroke-width': 2 }, svg);
    addLabel(svg, wrap, text, (xLeft + xRight) / 2, y - 12, 'diagram-label--tick diagram-label--strong');
  }

  function earth(svg, wrap, x, y) {
    svgEl('circle', { cx: x, cy: y, r: 16, fill: '#3b6fb0', stroke: '#c9d6ff', 'stroke-width': 1.5 }, svg);
    svgEl('path', { d: `M${x - 9},${y - 4} q5,-6 10,-2 q4,4 -2,8 q-5,3 -8,-6 Z`, fill: '#6fbf73' }, svg);
    addLabel(svg, wrap, 'Earth', x, y + 28, 'diagram-label--tick');
  }

  function drawReceding() {
    const svg = document.getElementById('receding-diagram');
    const wrap = document.getElementById('receding-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const rows = [
      { y: 85, wavelength: 50, moving: false, title: 'galaxy not moving', bracket: 'wavelength' },
      { y: 225, wavelength: 78, moving: true, title: 'galaxy moving away', bracket: 'longer wavelength: redshift' },
    ];
    rows.forEach((row, k) => {
      earth(svg, wrap, 50, row.y);
      const gx = row.moving ? 530 : 520;
      GD.drawGalaxy(svg, { kind: 'spiral', sub: 'b', tilt: 0.4, angle: -15 }, gx, row.y, 34).classList.add(row.moving ? 'rs-galaxy-moving' : 'rs-galaxy-still');
      wave(svg, 80, gx - 42, row.y, row.wavelength, 12, `rs-wave rs-wave-${k}`);
      svgEl('polygon', { points: `80,${row.y} 90,${row.y - 6} 90,${row.y + 6}`, fill: INK }, svg);
      wavelengthBracket(svg, wrap, gx - 42 - row.wavelength, row.wavelength, row.y - 30, row.bracket);
      addLabel(svg, wrap, row.title, 612, row.y + 48, 'diagram-label--tick diagram-label--strong diagram-label--left');
      if (row.moving) {
        svgEl('line', { class: 'rs-away-arrow', x1: 572, y1: row.y, x2: 618, y2: row.y, stroke: CURVE, 'stroke-width': 3 }, svg);
        svgEl('polygon', { points: `626,${row.y} 614,${row.y - 7} 614,${row.y + 7}`, fill: CURVE }, svg);
      }
    });
    svgEl('line', { x1: 20, x2: 620, y1: 155, y2: 155, stroke: MUTED, 'stroke-width': 1, 'stroke-dasharray': '4 5' }, svg);
  }

  // ------------------------------------------------------------------
  // 3. Practice: read a shifted line, work out v
  // ------------------------------------------------------------------

  let practiceId = 'A';
  const practice = (id) => R.PRACTICE_GALAXIES.find((g) => g.id === id);

  function drawPractice() {
    const svg = document.getElementById('practice-diagram');
    const wrap = document.getElementById('practice-diagram-wrap');
    const g = practice(practiceId);
    clearDiagram(svg, wrap);
    panel(svg);
    const xFor = makeScale(X0, X1, RANGE.min, RANGE.max);
    const lab = lines(0);
    const shifted = lines(R.velocityFromWavelengths(g.lineNm, g.observedNm));
    lamp(svg, 62, 57);
    drawStrip(svg, { x0: X0, x1: X1, y: 42, h: 30, type: 'absorption', lines: lab, minNm: RANGE.min, maxNm: RANGE.max });
    GD.drawGalaxy(svg, { kind: 'spiral', sub: 'c', tilt: 0.3, angle: 25 }, 62, 140, 28).classList.add('rs-galaxy');
    addLabel(svg, wrap, `Galaxy ${g.id}`, 62, 186, 'diagram-label--tick diagram-label--strong');
    drawStrip(svg, { x0: X0, x1: X1, y: 125, h: 30, type: 'absorption', lines: shifted, minNm: RANGE.min, maxNm: RANGE.max });

    const xe = xFor(g.lineNm);
    const xo = xFor(g.observedNm);
    svgEl('line', { class: 'rs-practice-line', x1: xe, x2: xe, y1: 34, y2: 80, stroke: CURVE, 'stroke-width': 2, 'stroke-dasharray': '3 3' }, svg);
    svgEl('line', { class: 'rs-practice-line', x1: xo, x2: xo, y1: 118, y2: 162, stroke: CURVE, 'stroke-width': 2, 'stroke-dasharray': '3 3' }, svg);
    svgEl('line', { x1: xe, x2: xo, y1: 86, y2: 116, stroke: CURVE, 'stroke-width': 1.5 }, svg);
    const anchor = xe > 520 ? 'diagram-label--left' : xe < 230 ? 'diagram-label--right' : '';
    addLabel(svg, wrap, `${g.name} emitted: ${g.lineNm.toFixed(1)} nm`, xe, 20, `diagram-label--tick diagram-label--strong ${anchor}`);
    addLabel(svg, wrap, `${g.name} observed: ${g.observedNm.toFixed(1)} nm`, xo, 194, `diagram-label--tick diagram-label--strong ${anchor}`);
    drawWavelengthAxis(svg, wrap, { x0: X0, x1: X1, y: 220, ticks: AXIS_TICKS, minNm: RANGE.min, maxNm: RANGE.max });
    svg.dataset.galaxy = g.id;

    document.querySelectorAll('.rs-galaxy-buttons button').forEach((b) => {
      const on = b.dataset.galaxy === practiceId;
      b.classList.toggle('preset-button-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    document.getElementById('rs-calculator-label').textContent = `Your v for Galaxy ${g.id}`;
    document.getElementById('rs-feedback').textContent = '';
  }

  function workingFor(g) {
    const ratio = g.shiftNm / g.lineNm;
    return [
      `Wavelength shift = ${g.observedNm.toFixed(1)} − ${g.lineNm.toFixed(1)} = ${g.shiftNm.toFixed(1)} nm`,
      `(wavelength shift) ÷ (emitted wavelength) = ${g.shiftNm.toFixed(1)} ÷ ${g.lineNm.toFixed(1)} = ${ratio.toFixed(4)}`,
      `v = c × ${ratio.toFixed(4)} = ${fmt(R.C_KM_PER_S)} km/s × ${ratio.toFixed(4)} = ${fmt(Math.round(g.answerKmPerS))} km/s`,
    ];
  }

  function fillWorkedExample() {
    const list = document.getElementById('rs-worked-example');
    const g = practice('A');
    const steps = [`Read the drawing: ${g.name} is emitted at ${g.lineNm.toFixed(1)} nm and observed at ${g.observedNm.toFixed(1)} nm.`, ...workingFor(g)];
    steps.push(`So Galaxy A is moving away at about ${fmt(Math.round(g.answerKmPerS / 100) * 100)} km/s. Now try galaxies B and C.`);
    list.textContent = '';
    steps.forEach((s) => {
      const li = document.createElement('li');
      li.textContent = s;
      list.appendChild(li);
    });
  }

  function checkAnswer() {
    const g = practice(practiceId);
    const raw = document.getElementById('rs-answer').value;
    const ok = R.withinTwoPercent(raw, g.answerKmPerS);
    const verdict = raw === '' ? 'Type your answer first.' : ok ? 'Correct.' : 'Not quite.';
    document.getElementById('rs-feedback').textContent =
      `${verdict} Working: ${workingFor(g).join('; ')}. (Accepted within 2%.)`;
  }

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }

  document.getElementById('rs-c-value').textContent = cText();
  speedSlider.addEventListener('input', drawMain);
  drawMain();
  drawReceding();
  document.querySelectorAll('.rs-galaxy-buttons button').forEach((b) =>
    b.addEventListener('click', () => {
      practiceId = b.dataset.galaxy;
      document.getElementById('rs-answer').value = '';
      drawPractice();
    }),
  );
  drawPractice();
  fillWorkedExample();
  document.getElementById('rs-check').addEventListener('click', checkAnswer);
  renderCoverage();
  Glossary.init({
    redshift:
      'Redshift: the lines in an object\'s spectrum are moved to longer wavelengths, towards the red end, because the object is moving away from us.',
    receding:
      'Receding: moving away. A galaxy\'s recession velocity is its speed away from us.',
  });
  QuizUI.mount(RedshiftQuestions.makeQuestions(R));
})();
