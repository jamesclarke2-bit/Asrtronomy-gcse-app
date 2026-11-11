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

  // A star's on-screen glow (radius and opacity), from its apparent
  // magnitude, relative to a magnitude-0 reference — shared by both the
  // single-star idea diagram and the two-panel "bright but far" diagram,
  // so the same magnitude always draws the same-looking glow everywhere
  // on this page.
  function starGlow(apparentM) {
    const fluxRatio = Mag.brightnessRatio(0 - apparentM);
    return {
      radius: Math.min(22, Math.max(2, 6 + 6 * Math.log10(fluxRatio + 0.01))),
      opacity: Math.min(0.9, Math.max(0.08, 0.5 * Math.sqrt(fluxRatio))),
    };
  }

  // ------------------------------------------------------------------
  // Section 0: two-panel "bright but far vs faint but near" diagram
  // ------------------------------------------------------------------

  const SWAP_PANEL_W = 220;
  const SWAP_PANEL_H = 200;
  const SWAP_AXIS_Y = 120;
  const SWAP_STAR_A = { name: 'Star A', absoluteM: -5, color: '#8fd3ff' };
  const SWAP_STAR_B = { name: 'Star B', absoluteM: 4.83, color: '#ffb703' };
  // The real, un-swapped arrangement: the very luminous star (A) sits
  // far away and so looks faint; the faint, Sun-like star (B) sits close
  // and so looks bright — see this section's own readouts for the exact
  // apparent magnitudes that arrangement gives (computed, never typed).
  const SWAP_DISTANCE_A = 1000;
  const SWAP_DISTANCE_B = 1;

  function drawStarGlowGroup(svg, star) {
    const glow3 = svgEl('circle', { class: 'swap-star-part', cy: SWAP_AXIS_Y, r: 0, fill: star.color, opacity: 0 });
    const glow2 = svgEl('circle', { class: 'swap-star-part', cy: SWAP_AXIS_Y, r: 0, fill: star.color, opacity: 0 });
    const core = svgEl('circle', { class: 'swap-star-part', cy: SWAP_AXIS_Y, r: 2, fill: star.color });
    [glow3, glow2, core].forEach((el) => svg.appendChild(el));
    return { glow3, glow2, core };
  }

  function positionStarGlowGroup(group, x, apparentM) {
    const { radius, opacity } = starGlow(apparentM);
    [[group.glow3, radius * 2.2, opacity * 0.18], [group.glow2, radius * 1.5, opacity * 0.35]].forEach(([el, r, op]) => {
      el.setAttribute('cx', x);
      el.setAttribute('r', r);
      el.setAttribute('opacity', op);
    });
    group.core.setAttribute('cx', x);
    group.core.setAttribute('r', radius);
  }

  // --- Left panel: both stars at the standard 10 pc (static) -----------

  function drawEqualDiagram() {
    const svg = document.getElementById('equal-diagram');
    const wrap = document.getElementById('equal-diagram-wrap');
    clearDiagram(svg, wrap);
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: SWAP_PANEL_W, height: SWAP_PANEL_H, fill: '#0f1830', rx: 10 }));

    const xA = SWAP_PANEL_W * 0.32;
    const xB = SWAP_PANEL_W * 0.68;
    // At exactly 10 pc, apparent magnitude equals absolute magnitude —
    // this panel needs no distance-modulus call at all, just each star's
    // own fixed M.
    const groupA = drawStarGlowGroup(svg, SWAP_STAR_A);
    positionStarGlowGroup(groupA, xA, SWAP_STAR_A.absoluteM);
    const groupB = drawStarGlowGroup(svg, SWAP_STAR_B);
    positionStarGlowGroup(groupB, xB, SWAP_STAR_B.absoluteM);

    // Not sideClassForFraction: that helper grows a label back TOWARD the
    // centre, which is right for a single marker that might sit near
    // either edge, but wrong here — these two fixed, centrally-placed
    // labels need to grow apart from each other instead, or they collide
    // in the middle.
    addLabel(wrap, `Star A (M ${formatMag(SWAP_STAR_A.absoluteM)})`, (xA / SWAP_PANEL_W) * 100, ((SWAP_AXIS_Y + 26) / SWAP_PANEL_H) * 100, 'diagram-label--left');
    addLabel(wrap, `Star B (M ${formatMag(SWAP_STAR_B.absoluteM)})`, (xB / SWAP_PANEL_W) * 100, ((SWAP_AXIS_Y + 26) / SWAP_PANEL_H) * 100, 'diagram-label--right');
  }

  // --- Right panel: each star at its own real distance (swappable) -----

  const SWAP_AXIS_X0 = 30;
  const SWAP_AXIS_X1 = 190;
  const SWAP_LOG_MIN = 0; // 10^0 = 1 pc
  const SWAP_LOG_MAX = 3; // 10^3 = 1000 pc

  function swapX(distancePc) {
    const t = (Math.log10(distancePc) - SWAP_LOG_MIN) / (SWAP_LOG_MAX - SWAP_LOG_MIN);
    return SWAP_AXIS_X0 + t * (SWAP_AXIS_X1 - SWAP_AXIS_X0);
  }

  let swapParts = null;

  function drawRealDiagramOnce() {
    if (swapParts) return swapParts;
    const svg = document.getElementById('real-diagram');
    const wrap = document.getElementById('real-diagram-wrap');
    clearDiagram(svg, wrap);
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: SWAP_PANEL_W, height: SWAP_PANEL_H, fill: '#0f1830', rx: 10 }));
    svg.appendChild(svgEl('line', { x1: SWAP_AXIS_X0, y1: SWAP_AXIS_Y, x2: SWAP_AXIS_X1, y2: SWAP_AXIS_Y, stroke: '#3a4d73', 'stroke-width': 1.5 }));

    const groupA = drawStarGlowGroup(svg, SWAP_STAR_A);
    const groupB = drawStarGlowGroup(svg, SWAP_STAR_B);
    const labelA = addLabel(wrap, 'Star A', 0, ((SWAP_AXIS_Y + 26) / SWAP_PANEL_H) * 100);
    labelA.classList.add('swap-star-part');
    const labelB = addLabel(wrap, 'Star B', 0, ((SWAP_AXIS_Y - 38) / SWAP_PANEL_H) * 100);
    labelB.classList.add('swap-star-part');

    swapParts = { groupA, groupB, labelA, labelB };
    return swapParts;
  }

  function setUpSwapDiagram() {
    drawEqualDiagram();
    const parts = drawRealDiagramOnce();
    const button = document.getElementById('swap-distances-button');
    const readoutA = document.getElementById('swap-starA-readout');
    const readoutB = document.getElementById('swap-starB-readout');
    let swapped = false;

    function render() {
      const distanceA = swapped ? SWAP_DISTANCE_B : SWAP_DISTANCE_A;
      const distanceB = swapped ? SWAP_DISTANCE_A : SWAP_DISTANCE_B;
      const mA = Mag.apparentFromAbsolute(SWAP_STAR_A.absoluteM, distanceA);
      const mB = Mag.apparentFromAbsolute(SWAP_STAR_B.absoluteM, distanceB);
      const xA = swapX(distanceA);
      const xB = swapX(distanceB);

      positionStarGlowGroup(parts.groupA, xA, mA);
      positionStarGlowGroup(parts.groupB, xB, mB);
      const fractionA = xA / SWAP_PANEL_W;
      const fractionB = xB / SWAP_PANEL_W;
      parts.labelA.style.left = `${fractionA * 100}%`;
      parts.labelA.classList.remove('diagram-label--left', 'diagram-label--right');
      parts.labelA.classList.add(sideClassForFraction(fractionA));
      parts.labelB.style.left = `${fractionB * 100}%`;
      parts.labelB.classList.remove('diagram-label--left', 'diagram-label--right');
      parts.labelB.classList.add(sideClassForFraction(fractionB));

      readoutA.textContent = `${formatMag(mA)} (at ${formatDistancePc(distanceA)})`;
      readoutB.textContent = `${formatMag(mB)} (at ${formatDistancePc(distanceB)})`;
    }

    button.addEventListener('click', () => {
      swapped = !swapped;
      render();
    });
    render();
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
  // Section 0b: the inverse-square law, as spreading lamp light
  // ------------------------------------------------------------------

  const SQUARE_W = 440;
  const SQUARE_H = 200;
  const SQUARE_LAMP = { x: 20, y: 100 };
  const SQUARE_CELL = 24;
  // One frame per step away (1×, 2×, 3× the distance), each a grid of
  // the SAME-sized unit cells — so the frame itself grows (2×2, then
  // 3×3) to hold the same total light the single d-frame caught, and one
  // highlighted cell shows what share of that total any one patch gets.
  const SQUARE_STEPS = [
    { n: 1, centerX: 140, distanceLabel: 'd' },
    { n: 2, centerX: 260, distanceLabel: '2d' },
    { n: 3, centerX: 380, distanceLabel: '3d' },
  ];

  function drawInverseSquareDiagram() {
    const svg = document.getElementById('inverse-square-diagram');
    const wrap = document.getElementById('inverse-square-diagram-wrap');
    clearDiagram(svg, wrap);
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: SQUARE_W, height: SQUARE_H, fill: '#0f1830', rx: 10 }));

    // Two diverging guide lines from the lamp through the left edge of
    // the farthest (biggest) frame, suggesting the cone of light
    // spreading out — not to scale, just the shape of the idea.
    const farthest = SQUARE_STEPS[SQUARE_STEPS.length - 1];
    const farthestHalf = (farthest.n * SQUARE_CELL) / 2;
    const farthestLeftX = farthest.centerX - farthestHalf;
    [SQUARE_LAMP.y - farthestHalf, SQUARE_LAMP.y + farthestHalf].forEach((cornerY) => {
      svg.appendChild(svgEl('line', {
        x1: SQUARE_LAMP.x, y1: SQUARE_LAMP.y, x2: farthestLeftX, y2: cornerY,
        stroke: '#5a7ab0', 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.6,
      }));
    });

    svg.appendChild(svgEl('circle', { cx: SQUARE_LAMP.x, cy: SQUARE_LAMP.y, r: 7, fill: '#fff8e3' }));
    svg.appendChild(svgEl('circle', { cx: SQUARE_LAMP.x, cy: SQUARE_LAMP.y, r: 13, fill: 'none', stroke: '#fff8e3', 'stroke-width': 1, opacity: 0.4 }));

    SQUARE_STEPS.forEach((step) => {
      const size = step.n * SQUARE_CELL;
      const x0 = step.centerX - size / 2;
      const y0 = SQUARE_LAMP.y - size / 2;

      for (let row = 0; row < step.n; row += 1) {
        for (let col = 0; col < step.n; col += 1) {
          const isHighlighted = row === 0 && col === 0;
          svg.appendChild(svgEl('rect', {
            x: x0 + col * SQUARE_CELL,
            y: y0 + row * SQUARE_CELL,
            width: SQUARE_CELL,
            height: SQUARE_CELL,
            fill: isHighlighted ? '#ffd27a' : 'none',
            'fill-opacity': isHighlighted ? 0.85 : 0,
            stroke: '#8fa6cf',
            'stroke-width': 1,
          }));
        }
      }

      // Short, single-word labels, centred and narrow (not edge-anchored)
      // — see the ratio ladder's own identical choice above for why: a
      // fixed-width 9rem default label, centred this close to a 440px
      // diagram's own edge (step 3's 'distance' label sits at 86% across),
      // would overflow a narrow phone's viewport even though its own
      // short text never would.
      const distanceLabel = addLabel(wrap, step.distanceLabel, (step.centerX / SQUARE_W) * 100, ((y0 - 14) / SQUARE_H) * 100);
      distanceLabel.classList.add('diagram-label--narrow');
      const brightnessLabel = addLabel(
        wrap,
        step.n === 1 ? '1' : `1/${step.n * step.n}`,
        (step.centerX / SQUARE_W) * 100,
        ((y0 + size + 16) / SQUARE_H) * 100
      );
      brightnessLabel.classList.add('diagram-label--narrow');
    });
  }

  function renderInverseSquareTable() {
    const tbody = document.getElementById('inverse-square-table-body');
    tbody.innerHTML = '';
    SQUARE_STEPS.forEach((step) => {
      const ratio = step.n * step.n;
      const tr = document.createElement('tr');
      const distanceTd = document.createElement('td');
      distanceTd.textContent = step.distanceLabel;
      const brightnessTd = document.createElement('td');
      brightnessTd.textContent = step.n === 1 ? '1 (full)' : `1/${ratio}`;
      const magTd = document.createElement('td');
      magTd.textContent = step.n === 1 ? '0.00 (reference)' : `+${Mag.magnitudeDifference(ratio).toFixed(2)} (fainter)`;
      tr.appendChild(distanceTd);
      tr.appendChild(brightnessTd);
      tr.appendChild(magTd);
      tbody.appendChild(tr);
    });
  }

  // --- A real example: Sirius versus Rigel ------------------------------
  // First draft, general-knowledge figures (to be checked by the
  // teacher) — Rigel's own apparent magnitude and distance; Sirius's
  // apparent magnitude and distance are the same figures already used
  // elsewhere on this page (and on Parallax and the Parsec). Every ratio
  // shown is then computed from Magnitude, never typed as a finished
  // number.
  const SIRIUS_APPARENT_M = -1.46;
  const SIRIUS_DISTANCE_PC = 2.64;
  const RIGEL_APPARENT_M = 0.13;
  const RIGEL_DISTANCE_PC = 260;

  function renderSiriusRigelExample() {
    const siriusAbsoluteM = Mag.absoluteFromApparent(SIRIUS_APPARENT_M, SIRIUS_DISTANCE_PC);
    const rigelAbsoluteM = Mag.absoluteFromApparent(RIGEL_APPARENT_M, RIGEL_DISTANCE_PC);
    const apparentRatio = Mag.brightnessRatio(RIGEL_APPARENT_M - SIRIUS_APPARENT_M);
    const luminosityRatio = Mag.brightnessRatio(siriusAbsoluteM - rigelAbsoluteM);
    const distanceRatio = RIGEL_DISTANCE_PC / SIRIUS_DISTANCE_PC;

    document.getElementById('sirius-rigel-apparent-ratio').textContent = formatRatio(apparentRatio);
    document.getElementById('sirius-rigel-luminosity-ratio').textContent = formatRatio(luminosityRatio);
    document.getElementById('sirius-rigel-distance-ratio').textContent = formatRatio(distanceRatio);
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
  setUpSwapDiagram();
  drawInverseSquareDiagram();
  renderInverseSquareTable();
  renderSiriusRigelExample();
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
