(function () {
  const Mag = window.Magnitude;
  const P = window.Parallax;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  }

  // Removes both the svg's own children and every HTML label previously
  // added beside it (see CLAUDE.md's rule on clearDiagram: a label's own
  // className is usually explicit, e.g. 'diagram-label diagram-label--left',
  // never just 'labelled-diagram-label' alone, so both selectors are
  // needed or stale labels silently stack on every re-render).
  function clearDiagram(svg, wrap) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    wrap.querySelectorAll('.labelled-diagram-label, .diagram-label').forEach((el) => el.remove());
  }

  function addLabel(wrap, text, leftPercent, topPercent, extraClass) {
    const label = document.createElement('span');
    label.className = `diagram-label${extraClass ? ` ${extraClass}` : ''}`;
    label.style.left = `${leftPercent}%`;
    label.style.top = `${topPercent}%`;
    label.textContent = text;
    wrap.appendChild(label);
    return label;
  }

  // Which way a label anchored at this horizontal fraction of its diagram
  // should grow, so it always grows back toward the middle rather than off
  // the edge of a narrow phone screen: left of centre grows right
  // ('diagram-label--right'), right of centre grows left
  // ('diagram-label--left') — see test/noHorizontalScroll.test.js, which
  // this fixes for every position a slider-driven label can reach, not
  // just the position it happens to load at.
  function sideClassForFraction(fraction) {
    return fraction >= 0.5 ? 'diagram-label--left' : 'diagram-label--right';
  }

  function formatMag(value) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
  }

  function formatDistancePc(d) {
    if (d < 0.0001) return `${d.toExponential(2)} pc`;
    if (d < 10) return `${d.toFixed(2)} pc`;
    return `${Math.round(d).toLocaleString()} pc`;
  }

  function formatRatio(r) {
    if (r >= 100) return `${Math.round(r).toLocaleString()}×`;
    return `${r.toFixed(2)}×`;
  }

  // ------------------------------------------------------------------
  // Section 1: apparent versus absolute magnitude
  // ------------------------------------------------------------------

  const IDEA_W = 440;
  const IDEA_H = 200;
  const IDEA_AXIS_Y = 110;
  const IDEA_OBS_X = 30;
  const IDEA_AXIS_X0 = 70;
  const IDEA_AXIS_X1 = 410;
  const IDEA_LOG_MIN = 0; // 10^0 = 1 pc
  const IDEA_LOG_MAX = 3; // 10^3 = 1000 pc
  const IDEA_ABSOLUTE_M = 0; // fixed demo star, doesn't change with the slider

  function ideaX(distancePc) {
    const t = (Math.log10(distancePc) - IDEA_LOG_MIN) / (IDEA_LOG_MAX - IDEA_LOG_MIN);
    return IDEA_AXIS_X0 + t * (IDEA_AXIS_X1 - IDEA_AXIS_X0);
  }

  // Static background, axis and Earth/10pc markers are drawn once; only
  // the star's own glow circles, core and label are then repositioned and
  // restyled in place on every slider move (never removed and recreated),
  // so the CSS transition on .idea-star-part (styles.css) can actually
  // animate between the old and new values — see that rule's own comment
  // for why a full clear-and-redraw can never animate smoothly.
  let ideaStarParts = null;

  function drawIdeaDiagramOnce() {
    if (ideaStarParts) return ideaStarParts;
    const svg = document.getElementById('idea-diagram');
    const wrap = document.getElementById('idea-diagram-wrap');
    clearDiagram(svg, wrap);

    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: IDEA_W, height: IDEA_H, fill: '#0f1830', rx: 10 }));

    const backgroundStars = [
      [60, 28], [120, 22], [190, 36], [250, 18], [310, 32], [370, 24], [405, 40],
      [95, 170], [170, 178], [240, 168], [320, 176], [380, 164], [55, 150],
    ];
    backgroundStars.forEach(([x, y]) => svg.appendChild(svgEl('circle', { cx: x, cy: y, r: 1.1, fill: '#9fb3d9', opacity: '0.6' })));

    svg.appendChild(svgEl('line', { x1: IDEA_AXIS_X0, y1: IDEA_AXIS_Y, x2: IDEA_AXIS_X1, y2: IDEA_AXIS_Y, stroke: '#3a4d73', 'stroke-width': 1.5 }));

    svg.appendChild(svgEl('circle', { cx: IDEA_OBS_X, cy: IDEA_AXIS_Y, r: 6, fill: '#8fd3ff' }));
    // Above the axis, while "Chosen star" (below it) can swing arbitrarily
    // close on the same line at small distances — keeping them on opposite
    // sides means they never collide, whatever the slider's value.
    addLabel(wrap, 'Earth', (IDEA_OBS_X / IDEA_W) * 100, ((IDEA_AXIS_Y - 20) / IDEA_H) * 100, sideClassForFraction(IDEA_OBS_X / IDEA_W));

    [1, 100, 1000].forEach((d) => {
      const x = ideaX(d);
      svg.appendChild(svgEl('line', { x1: x, y1: IDEA_AXIS_Y - 4, x2: x, y2: IDEA_AXIS_Y + 4, stroke: '#5a7ab0', 'stroke-width': 1 }));
    });

    const tenPcX = ideaX(10);
    svg.appendChild(svgEl('line', {
      x1: tenPcX, y1: IDEA_AXIS_Y - 55, x2: tenPcX, y2: IDEA_AXIS_Y + 55,
      stroke: '#5a7ab0', 'stroke-width': 1.5, 'stroke-dasharray': '4 4',
    }));
    addLabel(wrap, '10 pc (standard distance)', (tenPcX / IDEA_W) * 100, ((IDEA_AXIS_Y - 68) / IDEA_H) * 100);

    const glow3 = svgEl('circle', { class: 'idea-star-part', cy: IDEA_AXIS_Y, r: 0, fill: 'rgba(238, 243, 251, 0)' });
    const glow2 = svgEl('circle', { class: 'idea-star-part', cy: IDEA_AXIS_Y, r: 0, fill: 'rgba(238, 243, 251, 0)' });
    const glow1 = svgEl('circle', { class: 'idea-star-part', cy: IDEA_AXIS_Y, r: 0, fill: 'rgba(238, 243, 251, 0)' });
    const core = svgEl('circle', { class: 'idea-star-part', cy: IDEA_AXIS_Y, r: 2, fill: 'rgba(238, 243, 251, 0.3)', stroke: '#eef3fb', 'stroke-width': 1 });
    const marker = svgEl('circle', { class: 'idea-star-part', cy: IDEA_AXIS_Y, r: 2, fill: '#ffffff' });
    [glow3, glow2, glow1, core, marker].forEach((el) => svg.appendChild(el));

    const label = addLabel(wrap, 'Chosen star', 0, ((IDEA_AXIS_Y + 34) / IDEA_H) * 100);
    label.classList.add('idea-star-part');

    ideaStarParts = { glow3, glow2, glow1, core, marker, label };
    return ideaStarParts;
  }

  function updateIdeaStar(distancePc, apparentM) {
    const parts = drawIdeaDiagramOnce();
    const x = ideaX(distancePc);
    // Flux relative to the 10 pc reference (=1 there), via the real engine —
    // drives both the glow's radius and its opacity, so the star visibly
    // brightens and dims as the slider moves, not just the readout numbers.
    const fluxRatio = Mag.brightnessRatio(IDEA_ABSOLUTE_M - apparentM);
    const radius = Math.min(22, Math.max(2, 6 + 6 * Math.log10(fluxRatio + 0.01)));
    const glowOpacity = Math.min(0.9, Math.max(0.08, 0.5 * Math.sqrt(fluxRatio)));

    [[parts.glow3, radius * 2.4, 0.08], [parts.glow2, radius * 1.7, 0.16], [parts.glow1, radius * 1.2, 0.28]].forEach(([el, r, op]) => {
      el.setAttribute('cx', x);
      el.setAttribute('r', r);
      el.setAttribute('fill', `rgba(238, 243, 251, ${op * glowOpacity})`);
    });
    parts.core.setAttribute('cx', x);
    parts.core.setAttribute('r', radius);
    parts.core.setAttribute('fill', `rgba(238, 243, 251, ${Math.max(0.3, glowOpacity)})`);
    parts.marker.setAttribute('cx', x);
    const fraction = x / IDEA_W;
    parts.label.style.left = `${fraction * 100}%`;
    parts.label.classList.remove('diagram-label--left', 'diagram-label--right');
    parts.label.classList.add(sideClassForFraction(fraction));
  }

  function setUpIdeaDiagram() {
    const slider = document.getElementById('idea-distance-slider');
    const distanceLabel = document.getElementById('idea-distance-label');
    const apparentReadout = document.getElementById('idea-apparent-readout');
    const absoluteReadout = document.getElementById('idea-absolute-readout');

    function render() {
      const distancePc = Math.pow(10, parseFloat(slider.value));
      const apparentM = Mag.apparentFromAbsolute(IDEA_ABSOLUTE_M, distancePc);
      updateIdeaStar(distancePc, apparentM);
      distanceLabel.textContent = formatDistancePc(distancePc);
      apparentReadout.textContent = formatMag(apparentM);
      absoluteReadout.textContent = `${formatMag(IDEA_ABSOLUTE_M)} (fixed)`;
    }
    slider.addEventListener('input', render);
    render();
  }

  // ------------------------------------------------------------------
  // Section 2: the magnitude ruler
  // ------------------------------------------------------------------

  const RULER_W = 300;
  const RULER_H = 560;
  const RULER_MAG_TOP = -27;
  const RULER_MAG_BOTTOM = 31;
  const RULER_Y0 = 20;
  const RULER_Y1 = 540;
  const RULER_BAR_X0 = 125;
  const RULER_BAR_X1 = 175;

  function rulerY(mag) {
    const t = (mag - RULER_MAG_TOP) / (RULER_MAG_BOTTOM - RULER_MAG_TOP);
    return RULER_Y0 + t * (RULER_Y1 - RULER_Y0);
  }

  // First draft, to be checked by the teacher — see #magnitude-scale's own
  // table caption and notes/TEMPLATE.md's general-knowledge convention.
  const RULER_OBJECTS = [
    { name: 'Sun', mag: -26.74, side: 'left' },
    { name: 'Full Moon', mag: -12.7, side: 'right' },
    { name: 'Venus (brightest)', mag: -4.6, side: 'left' },
    { name: 'Sirius', mag: -1.46, side: 'right' },
    { name: 'Vega', mag: 0.03, side: 'left' },
    { name: 'Polaris', mag: 2.0, side: 'right' },
    { name: 'Naked-eye limit', mag: 6.0, side: 'left' },
    { name: 'Hubble / JWST deep images', mag: 30, side: 'right' },
  ];

  function drawRuler() {
    const svg = document.getElementById('ruler-diagram');
    const wrap = document.getElementById('ruler-diagram-wrap');
    clearDiagram(svg, wrap);

    const defs = svgEl('defs', {});
    const gradient = svgEl('linearGradient', { id: 'ruler-gradient', x1: '0', y1: '0', x2: '0', y2: '1' });
    gradient.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#fff8e3' }));
    gradient.appendChild(svgEl('stop', { offset: '12%', 'stop-color': '#ffd27a' }));
    gradient.appendChild(svgEl('stop', { offset: '55%', 'stop-color': '#5a7ab0' }));
    gradient.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#0f1830' }));
    defs.appendChild(gradient);
    svg.appendChild(defs);

    svg.appendChild(svgEl('rect', {
      x: RULER_BAR_X0, y: RULER_Y0, width: RULER_BAR_X1 - RULER_BAR_X0, height: RULER_Y1 - RULER_Y0,
      fill: 'url(#ruler-gradient)', rx: 6, stroke: '#1a1a1a', 'stroke-width': 1,
    }));

    [-20, -10, 0, 10, 20, 30].forEach((mag) => {
      const y = rulerY(mag);
      svg.appendChild(svgEl('line', { x1: RULER_BAR_X0, y1: y, x2: RULER_BAR_X1, y2: y, stroke: '#1a1a1a', 'stroke-width': 0.5, opacity: '0.4' }));
    });

    RULER_OBJECTS.forEach((obj) => {
      const y = rulerY(obj.mag);
      const anchorX = obj.side === 'left' ? RULER_BAR_X0 : RULER_BAR_X1;
      const leaderX = obj.side === 'left' ? RULER_BAR_X0 - 10 : RULER_BAR_X1 + 10;
      svg.appendChild(svgEl('line', { x1: anchorX, y1: y, x2: leaderX, y2: y, stroke: '#1a1a1a', 'stroke-width': 1 }));
      svg.appendChild(svgEl('circle', { cx: anchorX, cy: y, r: 3, fill: '#ffb703', stroke: '#1a1a1a', 'stroke-width': 0.5 }));
      addLabel(
        wrap,
        obj.name,
        (leaderX / RULER_W) * 100,
        (y / RULER_H) * 100,
        `diagram-label--${obj.side}`
      );
    });
  }

  function renderRulerTable() {
    const tbody = document.getElementById('ruler-object-table-body');
    tbody.innerHTML = '';
    RULER_OBJECTS.forEach((obj) => {
      const tr = document.createElement('tr');
      const nameTd = document.createElement('td');
      nameTd.textContent = obj.name;
      const magTd = document.createElement('td');
      magTd.textContent = obj.mag === 30 ? 'about 29 to 31' : formatMag(obj.mag);
      tr.appendChild(nameTd);
      tr.appendChild(magTd);
      tbody.appendChild(tr);
    });
  }

  // ------------------------------------------------------------------
  // Section 3: brightness ratios
  // ------------------------------------------------------------------

  const LADDER_W = 420;
  const LADDER_H = 170;
  const LADDER_X0 = 40;
  // A little short of the viewBox's own right edge (420) so the Δm=10
  // guide's own label — sitting right at this end of the bar — doesn't
  // clip against the dark diagram box's rounded corner.
  const LADDER_X1 = 385;
  const LADDER_Y = 85;
  const LADDER_DM_MAX = 10;
  const LADDER_GUIDES = [2.5, 5, 7.5, 10];

  function ladderX(deltaM) {
    return LADDER_X0 + (deltaM / LADDER_DM_MAX) * (LADDER_X1 - LADDER_X0);
  }

  // Same persistent-element approach as the idea diagram (see its own
  // comment): the axis and guide lines are drawn once, and only the fill
  // bar's width and the marker's position are then updated in place, so
  // .ladder-marker-part's CSS transition can animate them smoothly.
  let ladderParts = null;

  function drawLadderOnce() {
    if (ladderParts) return ladderParts;
    const svg = document.getElementById('ladder-diagram');
    const wrap = document.getElementById('ladder-diagram-wrap');
    clearDiagram(svg, wrap);

    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: LADDER_W, height: LADDER_H, fill: '#0f1830', rx: 10 }));
    svg.appendChild(svgEl('line', { x1: LADDER_X0, y1: LADDER_Y, x2: LADDER_X1, y2: LADDER_Y, stroke: '#3a4d73', 'stroke-width': 10, 'stroke-linecap': 'round' }));

    LADDER_GUIDES.forEach((dm) => {
      const x = ladderX(dm);
      svg.appendChild(svgEl('line', { x1: x, y1: LADDER_Y - 30, x2: x, y2: LADDER_Y + 30, stroke: '#5a7ab0', 'stroke-width': 1, 'stroke-dasharray': '3 3' }));
      // Short, narrow and centred (not edge-anchored): the four guides sit
      // close enough together that growing toward one another (as the
      // edge-anchored classes do) would make neighbours overlap instead —
      // narrow enough to need no anchoring at all. The full "Δm → ratio"
      // mapping is already spelled out in the mental-maths table below.
      const label = addLabel(wrap, `×${Math.round(Mag.brightnessRatio(dm)).toLocaleString()}`, (x / LADDER_W) * 100, ((LADDER_Y - 44) / LADDER_H) * 100);
      label.classList.add('diagram-label--narrow');
    });

    const fill = svgEl('rect', { class: 'ladder-marker-part', x: LADDER_X0, y: LADDER_Y - 5, width: 0, height: 10, fill: '#ffb703', rx: 5 });
    const marker = svgEl('circle', { class: 'ladder-marker-part', cy: LADDER_Y, r: 8, fill: '#ffffff', stroke: '#ffb703', 'stroke-width': 2 });
    svg.appendChild(fill);
    svg.appendChild(marker);
    const label = addLabel(wrap, '', 0, ((LADDER_Y + 40) / LADDER_H) * 100);
    label.classList.add('ladder-marker-part');

    ladderParts = { fill, marker, label };
    return ladderParts;
  }

  function updateLadderMarker(deltaM) {
    const parts = drawLadderOnce();
    const markerX = ladderX(deltaM);
    parts.fill.setAttribute('width', Math.max(0, markerX - LADDER_X0));
    parts.marker.setAttribute('cx', markerX);
    const fraction = markerX / LADDER_W;
    parts.label.style.left = `${fraction * 100}%`;
    parts.label.classList.remove('diagram-label--left', 'diagram-label--right');
    parts.label.classList.add(sideClassForFraction(fraction));
    parts.label.textContent = `Δm = ${deltaM.toFixed(2)}`;
  }

  function setUpRatioLadder() {
    const slider = document.getElementById('ratio-delta-m-slider');
    const deltaMLabel = document.getElementById('ratio-delta-m-label');
    const exactReadout = document.getElementById('ratio-exact-readout');
    const approxReadout = document.getElementById('ratio-approx-readout');

    function render() {
      const deltaM = parseFloat(slider.value);
      updateLadderMarker(deltaM);
      deltaMLabel.textContent = `${deltaM.toFixed(2)} mag`;
      exactReadout.textContent = formatRatio(Mag.brightnessRatio(deltaM));
      approxReadout.textContent = formatRatio(Mag.approxBrightnessRatio(deltaM));
    }
    slider.addEventListener('input', render);
    render();
  }

  function renderMentalMathsTable() {
    const tbody = document.getElementById('mental-maths-table-body');
    tbody.innerHTML = '';
    [0.75, 2.5, 5, 7.5, 10].forEach((dm) => {
      const tr = document.createElement('tr');
      const dmTd = document.createElement('td');
      dmTd.textContent = dm.toString();
      const ratioTd = document.createElement('td');
      ratioTd.textContent = `about ${formatRatio(Mag.brightnessRatio(dm))}`;
      tr.appendChild(dmTd);
      tr.appendChild(ratioTd);
      tbody.appendChild(tr);
    });
  }

  // ------------------------------------------------------------------
  // Section 4: distance modulus calculator
  // ------------------------------------------------------------------

  function setUpModulusCalculator() {
    const solveSelect = document.getElementById('modulus-solve-for');
    const mInput = document.getElementById('modulus-m-input');
    const MInput = document.getElementById('modulus-M-input');
    const dInput = document.getElementById('modulus-d-input');
    const working = document.getElementById('modulus-working');
    const inputsByKey = { m: mInput, M: MInput, d: dInput };

    function recompute() {
      const target = solveSelect.value;
      Object.entries(inputsByKey).forEach(([key, input]) => {
        input.disabled = key === target;
      });
      const mVal = parseFloat(mInput.value);
      const MVal = parseFloat(MInput.value);
      const dVal = parseFloat(dInput.value);

      if (target === 'M' && Number.isFinite(mVal) && Number.isFinite(dVal) && dVal > 0) {
        const result = Mag.absoluteFromApparent(mVal, dVal);
        MInput.value = result.toFixed(2);
        working.textContent = `M = m − 5 log₁₀(d / 10) = ${mVal} − 5 log₁₀(${dVal} / 10) = ${result.toFixed(2)}`;
      } else if (target === 'm' && Number.isFinite(MVal) && Number.isFinite(dVal) && dVal > 0) {
        const result = Mag.apparentFromAbsolute(MVal, dVal);
        mInput.value = result.toFixed(2);
        working.textContent = `m = M + 5 log₁₀(d / 10) = ${MVal} + 5 log₁₀(${dVal} / 10) = ${result.toFixed(2)}`;
      } else if (target === 'd' && Number.isFinite(mVal) && Number.isFinite(MVal)) {
        const result = Mag.distanceFromModulus(mVal, MVal);
        dInput.value = Number(result.toPrecision(4));
        working.textContent = `d = 10 × 10^((m − M) / 5) = 10 × 10^((${mVal} − ${MVal}) / 5) ≈ ${result.toPrecision(4)} pc`;
      }
    }

    solveSelect.addEventListener('change', recompute);
    [mInput, MInput, dInput].forEach((input) => input.addEventListener('input', recompute));

    document.getElementById('modulus-load-sun').addEventListener('click', () => {
      solveSelect.value = 'M';
      mInput.value = -26.74;
      dInput.value = 1 / P.AU_PER_PARSEC;
      recompute();
    });
    document.getElementById('modulus-load-sirius').addEventListener('click', () => {
      solveSelect.value = 'M';
      mInput.value = -1.46;
      const sirius = P.STARS.find((s) => s.name === 'Sirius');
      dInput.value = Number(P.distanceFromParallax(sirius.parallaxArcsec).toPrecision(4));
      recompute();
    });

    recompute();
  }

  // ------------------------------------------------------------------
  // Worked examples
  // ------------------------------------------------------------------

  function renderWorkedExamples() {
    const novaDeltaM = 11.2 - 3.0;
    document.getElementById('nova-delta-m').textContent = novaDeltaM.toFixed(1);
    document.getElementById('nova-delta-m-2').textContent = novaDeltaM.toFixed(1);
    document.getElementById('nova-ratio-exact').textContent = formatRatio(Mag.brightnessRatio(novaDeltaM));
    document.getElementById('nova-ratio-approx').textContent = formatRatio(Mag.approxBrightnessRatio(novaDeltaM));

    const demoM = 0;
    const dNear = 10;
    const dFar = 25; // exactly 2.5x farther
    const tbody = document.getElementById('distance-ratio-table-body');
    tbody.innerHTML = '';
    [dNear, dFar].forEach((d) => {
      const tr = document.createElement('tr');
      const dTd = document.createElement('td');
      dTd.textContent = d.toString();
      const mTd = document.createElement('td');
      mTd.textContent = formatMag(Mag.apparentFromAbsolute(demoM, d));
      tr.appendChild(dTd);
      tr.appendChild(mTd);
      tbody.appendChild(tr);
    });
    document.getElementById('distance-ratio-delta-m').textContent =
      (Mag.apparentFromAbsolute(demoM, dFar) - Mag.apparentFromAbsolute(demoM, dNear)).toFixed(2);

    const exampleM = 8.2;
    const exampleAbsM = 1.2;
    document.getElementById('distance-example-modulus').textContent = (exampleM - exampleAbsM).toFixed(1);
    document.getElementById('distance-example-distance').textContent = Mag.distanceFromModulus(exampleM, exampleAbsM).toFixed(1);
  }

  // ------------------------------------------------------------------
  // Coverage, glossary and quiz
  // ------------------------------------------------------------------

  const CURRICULUM_UNITS = ['u4.2'];

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    magnitude: 'Magnitude: a number on an astronomical brightness scale that runs backwards — smaller, and especially negative, numbers mean brighter objects.',
    apparentMagnitude: 'Apparent magnitude (m): how bright a star looks from Earth, which depends on both how luminous it really is and how far away it is.',
    absoluteMagnitude: 'Absolute magnitude (M): how bright a star would look from a fixed standard distance of 10 parsecs — a measure of true luminosity, with distance removed.',
    flux: 'Flux: the amount of light energy actually arriving per second from an object, the physical quantity the magnitude scale measures — it falls off with distance by the inverse-square law.',
    streetLamp:
      "Comparing two streetlamps fairly means standing the same distance from both — a dim lamp close up can look brighter than a powerful one far away. Absolute magnitude solves exactly this problem for stars: it's each star's apparent magnitude if every one of them were moved to the same standard distance, 10 parsecs, so the comparison is fair.",
    magnitudeHistory:
      'The ancient Greek astronomer Hipparchus (as recorded by Ptolemy) sorted naked-eye stars into six classes by eye, brightest to faintest. In 1856, Norman Pogson fixed that rough scale into a precise one: exactly 5 magnitudes was defined as exactly a factor of 100 in brightness, making one magnitude step the fifth root of 100, about 2.512 — the exact scale this whole page uses.',
  };

  setUpIdeaDiagram();
  drawRuler();
  renderRulerTable();
  setUpRatioLadder();
  renderMentalMathsTable();
  setUpModulusCalculator();
  renderWorkedExamples();
  document.getElementById('ratio-constant-readout').textContent = Mag.MAGNITUDE_RATIO_PER_STEP.toFixed(3);
  QuizUI.mount(MagnitudeQuestions.makeQuestions(Mag));
  renderCoverage();
  Glossary.init(GLOSSARY);
})();
