/**
 * notes/telescopes.html.
 *
 * Three engines back this page, each doing one job:
 *  - src/rayOptics.js: the lens/mirror focusing demo and the telescope
 *    bench — paraxial ray tracing, schematic (angles exaggerated on
 *    screen; the numbers in the readouts are the real traced/formula
 *    values).
 *  - src/telescopeModel.js (unchanged): magnification, light grasp and
 *    resolution — shared with the bench's own magnification readout and
 *    with src/telescopeQuestions.js's practice questions, so nothing
 *    here is a second, independently typed copy of them.
 *  - src/specData.js isn't used here; target sizes for the eyepiece
 *    view are this page's own (approximate, see TARGETS below).
 *
 * One shared `state` object underlies the whole page: the bench's own
 * objective diameter/focal length and eyepiece focal length sliders
 * feed the through-the-eyepiece view's magnification and the
 * resolution/double-star section's objective diameter too, rather than
 * each section duplicating its own controls.
 */
(function () {
  const CURRICULUM_UNITS = ['u5.1', 'u5.2'];

  const state = {
    focusApertureMm: 80,
    focusFocalLengthMm: 150,

    design: 'keplerian',
    objectiveDiameterMm: 100,
    objectiveFocalLengthMm: 500,
    eyepieceFocalLengthMm: 50,

    wavelengthNm: 550,

    eyepieceTarget: 'moon',
    eyepieceApparentFieldDeg: 50,
  };

  const DESIGNS = ['galilean', 'keplerian', 'newtonian', 'cassegrain'];
  const DESIGN_LABELS = {
    galilean: 'Galilean',
    keplerian: 'Keplerian',
    newtonian: 'Newtonian',
    cassegrain: 'Cassegrain',
  };

  // Approximate angular sizes — first draft, to be checked by the
  // teacher before this page is treated as a source of real figures.
  const TARGETS = {
    moon: { label: 'The Moon', trueSizeDeg: 31 / 60, kind: 'disc' },
    jupiter: { label: 'Jupiter', trueSizeDeg: 45 / 3600, kind: 'disc' },
    pleiades: { label: 'The Pleiades', trueSizeDeg: 110 / 60, kind: 'disc' },
    albireo: { label: 'Albireo', trueSizeDeg: 35 / 3600, kind: 'double' },
  };

  // --- element lookups -------------------------------------------------

  const focusApertureSlider = document.getElementById('focus-aperture-slider');
  const focusApertureLabel = document.getElementById('focus-aperture-label');
  const focusFocalLengthSlider = document.getElementById('focus-focal-length-slider');
  const focusFocalLengthLabel = document.getElementById('focus-focal-length-label');
  const lensCanvas = document.getElementById('lens-focus-view');
  const mirrorCanvas = document.getElementById('mirror-focus-view');

  const designButtons = [...document.querySelectorAll('[data-design]')];
  const diameterSlider = document.getElementById('objective-diameter-slider');
  const diameterLabel = document.getElementById('objective-diameter-label');
  const objectiveFocalLengthSlider = document.getElementById('objective-focal-length-slider');
  const objectiveFocalLengthLabel = document.getElementById('objective-focal-length-label');
  const eyepieceFocalLengthSlider = document.getElementById('eyepiece-focal-length-slider');
  const eyepieceFocalLengthLabel = document.getElementById('eyepiece-focal-length-label');
  const benchCanvas = document.getElementById('telescope-bench-view');
  const benchMagnificationReadout = document.getElementById('bench-magnification-readout');
  const benchTubeLengthReadout = document.getElementById('bench-tube-length-readout');
  const benchOrientationReadout = document.getElementById('bench-orientation-readout');
  const benchFocalLengthReadout = document.getElementById('bench-focal-length-readout');

  const targetButtons = [...document.querySelectorAll('[data-target]')];
  const apparentFieldSlider = document.getElementById('apparent-field-slider');
  const apparentFieldLabel = document.getElementById('apparent-field-label');
  const eyepieceViewCanvas = document.getElementById('eyepiece-circle-view');
  const trueFieldReadout = document.getElementById('true-field-readout');
  const eyepieceFitReadout = document.getElementById('eyepiece-fit-readout');

  const wavelengthSlider = document.getElementById('wavelength-slider');
  const wavelengthLabel = document.getElementById('wavelength-label');
  const magnificationReadout = document.getElementById('magnification-readout');
  const lightGraspReadout = document.getElementById('light-grasp-readout');
  const resolutionReadout = document.getElementById('resolution-readout');
  const doubleStarCanvas = document.getElementById('double-star-view');
  const doubleStarStatus = document.getElementById('double-star-status');
  const clusterCanvas = document.getElementById('star-cluster-view');
  const clusterStatus = document.getElementById('cluster-status');

  // Roughly where a wavelength sits in the visible spectrum, for the
  // slider's own label — not a precise colorimetric conversion.
  const SPECTRUM_BANDS = [
    { max: 450, name: 'violet', color: '#7b2ff7' },
    { max: 485, name: 'blue', color: '#2a6bd6' },
    { max: 500, name: 'cyan', color: '#1fb6c9' },
    { max: 565, name: 'green', color: '#2fae4e' },
    { max: 590, name: 'yellow', color: '#d8c22a' },
    { max: 625, name: 'orange', color: '#e07b1f' },
    { max: Infinity, name: 'red', color: '#c0392b' },
  ];

  function spectrumBand(nm) {
    return SPECTRUM_BANDS.find((band) => nm <= band.max);
  }

  // --- shared diagram colours --------------------------------------------
  // The lens/mirror panel and the bench sit on the site's own light
  // diagram background (the same pale blue the sun-path sky diagram
  // shows through its canvas's default CSS background) rather than
  // near-black, with dark outlines on the glass/mirror/tube shading and
  // strong, WCAG-AA ray colours so they read clearly against it. The
  // eyepiece view keeps a dark background (it's a night sky) but a deep
  // blue-grey rather than pure black, with near-white label text.
  const DIAGRAM_BG = '#eaf2fb';
  const EYEPIECE_BG = '#1b2436';
  const LABEL_DARK = '#1a1a1a';
  const AXIS_COLOR = '#334155';
  const ON_AXIS_RAY_COLOR = '#8a3d00';
  const OFF_AXIS_RAY_COLOR = '#7d3c98';
  const LENS_OUTLINE = '#2c4a6e';
  const MIRROR_OUTLINE = '#3a4654';

  // --- shared labels infrastructure ---------------------------------------
  // "Labels: all / key only / off" (default 'all'), matching
  // notes/moon-structure.html's "hide labels, test yourself" mode. On a
  // narrow (phone-width) viewport, a wrap still at the default "all"
  // renders as "key" instead — the control itself stays showing "All"
  // selected, but the diagram itself only shows its key labels, with
  // the rest reachable through that diagram's own "Show every label as
  // text" tap-reveal.
  const PHONE_WIDTH_PX = 600;
  const labelsModeButtons = [...document.querySelectorAll('[data-labels-mode]')];
  let labelsMode = 'all';
  const labelWraps = [];

  function effectiveLabelsMode() {
    if (labelsMode === 'all' && window.innerWidth < PHONE_WIDTH_PX) return 'key';
    return labelsMode;
  }

  // Renders `labels` (from notes/telescopeLabels.js) into `wrapId`'s
  // .labelled-diagram-wrap, positioned at `anchors[label.id]` — plain
  // canvas-pixel coordinates, converted to the percentage-of-canvas
  // position the DOM overlay needs.
  // Half of .labelled-diagram-label--wide's own 9.5rem width, plus a
  // small margin, in actual rendered CSS pixels — clamping every
  // anchor this far from each edge means a label can never clip off
  // the canvas, whatever x an individual anchor asks for.
  const LABEL_HALF_WIDTH_CSS_PX = 9.5 * 16 * 0.55;

  function renderLabels(wrapId, canvas, labels, anchors, onDark) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    if (!labelWraps.includes(wrapId)) labelWraps.push(wrapId);
    wrap.querySelectorAll('.labelled-diagram-label').forEach((el) => el.remove());
    // The canvas's intrinsic pixel space (canvas.width) is what anchor
    // coordinates and the left:% positioning are measured in, but the
    // label box itself has a fixed CSS width that doesn't shrink when
    // the canvas is scaled down to fit a narrow viewport. Converting
    // the margin through the canvas's actual rendered width keeps the
    // clamp correct at any screen size, not just at its intrinsic size.
    const renderedWidth = canvas.getBoundingClientRect().width || canvas.width;
    const labelHalfWidthPx = (LABEL_HALF_WIDTH_CSS_PX / renderedWidth) * canvas.width;
    labels.forEach((label) => {
      const anchor = anchors[label.id];
      if (!anchor) return;
      const clampedX = Math.min(canvas.width - labelHalfWidthPx, Math.max(labelHalfWidthPx, anchor.x));
      const el = document.createElement('div');
      el.className = `labelled-diagram-label labelled-diagram-label--wide${label.key ? ' label-key' : ''}${onDark ? ' labelled-diagram-label--on-dark' : ''}`;
      el.style.left = `${(clampedX / canvas.width) * 100}%`;
      el.style.top = `${(anchor.y / canvas.height) * 100}%`;
      el.textContent = label.text;
      wrap.appendChild(el);
    });
    wrap.setAttribute('data-labels-mode', effectiveLabelsMode());
  }

  function applyLabelsMode() {
    labelWraps.forEach((wrapId) => {
      const wrap = document.getElementById(wrapId);
      if (wrap) wrap.setAttribute('data-labels-mode', effectiveLabelsMode());
    });
  }

  function populateAllLabelsText(elementId, labels) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = labels.map((l) => l.text).join(' · ');
  }

  labelsModeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      labelsMode = button.dataset.labelsMode;
      labelsModeButtons.forEach((b) => {
        b.classList.toggle('preset-button-active', b.dataset.labelsMode === labelsMode);
        b.setAttribute('aria-pressed', String(b.dataset.labelsMode === labelsMode));
      });
      applyLabelsMode();
    });
  });

  window.addEventListener('resize', applyLabelsMode);

  // ===================================================================
  // Section 1: how a lens and a mirror focus light
  // ===================================================================

  const FOCUS_SCALE_PX_PER_MM = 0.6;
  const FOCUS_LENS_X = 70;
  const FOCUS_MIRROR_X = 250;

  function drawGlassLens(ctx, x, halfHeightPx, convex, y = 0) {
    const bulge = Math.max(6, halfHeightPx * 0.18) * (convex ? 1 : -1);
    const gradient = ctx.createLinearGradient(x - 10, y, x + 10, y);
    gradient.addColorStop(0, 'rgba(150,185,220,0.55)');
    gradient.addColorStop(0.5, 'rgba(235,245,255,0.9)');
    gradient.addColorStop(1, 'rgba(150,185,220,0.55)');
    ctx.beginPath();
    ctx.moveTo(x, y - halfHeightPx);
    ctx.quadraticCurveTo(x + bulge, y, x, y + halfHeightPx);
    ctx.quadraticCurveTo(x - bulge, y, x, y - halfHeightPx);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = LENS_OUTLINE;
    ctx.lineWidth = 1.75;
    ctx.stroke();
  }

  function drawMirrorSurface(ctx, x, halfHeightPx, concaveTowardsLeft, y = 0) {
    const bulge = Math.max(8, halfHeightPx * 0.22) * (concaveTowardsLeft ? 1 : -1);
    const gradient = ctx.createLinearGradient(x - 6, y - halfHeightPx, x - 6, y + halfHeightPx);
    gradient.addColorStop(0, '#dde4ec');
    gradient.addColorStop(0.5, '#9fb0c2');
    gradient.addColorStop(1, '#dde4ec');
    ctx.beginPath();
    ctx.moveTo(x, y - halfHeightPx);
    ctx.quadraticCurveTo(x + bulge, y, x, y + halfHeightPx);
    ctx.lineTo(x + 5, y + halfHeightPx);
    ctx.quadraticCurveTo(x + 5 + bulge, y, x + 5, y - halfHeightPx);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = MIRROR_OUTLINE;
    ctx.lineWidth = 1.75;
    ctx.stroke();
  }

  // One parallel ray, bent at the element (lens: continues past it;
  // mirror: reflects back the way it came), returned as the sequence
  // of points to draw.
  function focusRayPoints(heightPx, focalLengthPx, elementX, canvasWidth, isMirror) {
    if (!isMirror) {
      const entry = { x: 0, y: heightPx };
      const atLens = { x: elementX, y: heightPx };
      const focus = { x: elementX + focalLengthPx, y: 0 };
      const overshoot = { x: canvasWidth, y: -heightPx * ((canvasWidth - focus.x) / Math.max(focalLengthPx, 1)) };
      return [entry, atLens, focus, overshoot];
    }
    const entry = { x: canvasWidth, y: heightPx };
    const atMirror = { x: elementX, y: heightPx };
    const focus = { x: elementX - focalLengthPx, y: 0 };
    // Same straight line from atMirror to focus, extended on past focus to x = 0.
    const overshoot = { x: 0, y: heightPx * (1 - elementX / Math.max(focalLengthPx, 1)) };
    return [entry, atMirror, focus, overshoot];
  }

  function pathLength(points) {
    let total = 0;
    for (let i = 1; i < points.length; i += 1) {
      total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }
    return total;
  }

  function pointAtDistance(points, distance) {
    let remaining = distance;
    for (let i = 1; i < points.length; i += 1) {
      const segLength = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
      if (remaining <= segLength || i === points.length - 1) {
        const t = segLength === 0 ? 0 : remaining / segLength;
        return {
          x: points[i - 1].x + (points[i].x - points[i - 1].x) * t,
          y: points[i - 1].y + (points[i].y - points[i - 1].y) * t,
        };
      }
      remaining -= segLength;
    }
    return points[points.length - 1];
  }

  function drawFocusDiagram(canvas, isMirror, timeSec) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = DIAGRAM_BG;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(0, h / 2);

    const halfApertureMm = state.focusApertureMm / 2;
    const halfAperturePx = halfApertureMm * FOCUS_SCALE_PX_PER_MM;
    const focalLengthPx = state.focusFocalLengthMm * FOCUS_SCALE_PX_PER_MM;
    const elementX = isMirror ? FOCUS_MIRROR_X : FOCUS_LENS_X;

    // Optical axis.
    ctx.strokeStyle = AXIS_COLOR;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    const rayHeightsPx = [-1, -0.55, 0, 0.55, 1].map((f) => f * halfAperturePx);
    const rayPaths = rayHeightsPx.map((hp) => focusRayPoints(hp, focalLengthPx, elementX, w, isMirror));

    // Faint full ray paths, so the geometry is visible even where no pulse currently sits.
    ctx.strokeStyle = 'rgba(138, 61, 0, 0.35)';
    ctx.lineWidth = 1;
    rayPaths.forEach((points) => {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });

    // Moving pulses: light travelling along each ray, not static lines.
    const speedPxPerSec = 160;
    rayPaths.forEach((points, i) => {
      const total = pathLength(points);
      const phase = (i / rayPaths.length) * total;
      const distance = (timeSec * speedPxPerSec + phase) % total;
      const p = pointAtDistance(points, distance);
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 5);
      glow.addColorStop(0, 'rgba(255,106,0,1)');
      glow.addColorStop(1, 'rgba(255,106,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    if (isMirror) {
      drawMirrorSurface(ctx, elementX, halfAperturePx, true);
    } else {
      drawGlassLens(ctx, elementX, halfAperturePx, true);
    }

    // Focal point marker (the "focal point" DOM label sits over this —
    // see updateFocusLabels, called on slider change rather than every
    // animation frame).
    const focusX = isMirror ? elementX - focalLengthPx : elementX + focalLengthPx;
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(focusX, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Six distinct (x, y) slots, not just two lanes — a 320x280 canvas
  // has room for three above the axis and three below, each labelling
  // something at a different x, so no two labels ever share a spot
  // regardless of where the slider puts the element or its focus.
  // A short focal length can bring the focal point right next to the
  // element itself, too close for x-position alone to keep two labels
  // apart — so every label here gets its own lane (three above the
  // axis, three below), never sharing one with another label, which
  // means only same-lane *and* same-side labels could ever collide,
  // and none are both.
  function focusAnchors(isMirror) {
    const halfAperturePx = (state.focusApertureMm / 2) * FOCUS_SCALE_PX_PER_MM;
    const focalLengthPx = state.focusFocalLengthMm * FOCUS_SCALE_PX_PER_MM;
    const elementX = isMirror ? FOCUS_MIRROR_X : FOCUS_LENS_X;
    const focusX = isMirror ? elementX - focalLengthPx : elementX + focalLengthPx;
    const midY = 180; // canvas height 360, centre at 180
    // Kept at least half a (wide) label's width from either canvas
    // edge (320px wide, label 9.5rem/152px) so neither clips off-screen.
    const entryX = isMirror ? 235 : 85;
    const axisX = isMirror ? 85 : 235;
    const base = halfAperturePx + 30;
    const lane = (n) => base + n * 36;
    return {
      'parallel-rays': { x: entryX, y: midY - lane(0) },
      'element-type': { x: elementX, y: midY - lane(1) },
      'focal-point': { x: focusX, y: midY - lane(2) },
      aperture: { x: elementX, y: midY + lane(0) },
      'focal-length': { x: (elementX + focusX) / 2, y: midY + lane(1) },
      'principal-axis': { x: axisX, y: midY + lane(2) },
    };
  }

  function updateFocusLabels() {
    const lensLabels = TelescopeLabels.filterLabelsByMode(
      TelescopeLabels.focusDiagramLabels(state.focusApertureMm, state.focusFocalLengthMm, false),
      'all'
    );
    const mirrorLabels = TelescopeLabels.filterLabelsByMode(
      TelescopeLabels.focusDiagramLabels(state.focusApertureMm, state.focusFocalLengthMm, true),
      'all'
    );
    renderLabels('lens-label-wrap', lensCanvas, lensLabels, focusAnchors(false));
    renderLabels('mirror-label-wrap', mirrorCanvas, mirrorLabels, focusAnchors(true));
    populateAllLabelsText('focus-labels-detail', lensLabels.concat(mirrorLabels));
  }

  function startFocusAnimation() {
    function frame(timestampMs) {
      const timeSec = timestampMs / 1000;
      drawFocusDiagram(lensCanvas, false, timeSec);
      drawFocusDiagram(mirrorCanvas, true, timeSec);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  focusApertureSlider.addEventListener('input', () => {
    state.focusApertureMm = Number(focusApertureSlider.value);
    focusApertureLabel.textContent = `${state.focusApertureMm} mm`;
    updateFocusLabels();
  });

  focusFocalLengthSlider.addEventListener('input', () => {
    state.focusFocalLengthMm = Number(focusFocalLengthSlider.value);
    focusFocalLengthLabel.textContent = `${state.focusFocalLengthMm} mm`;
    updateFocusLabels();
  });

  // ===================================================================
  // Section 2: the telescope bench
  // ===================================================================

  const BENCH_DIAMETER_SCALE_PX_PER_MM = 0.3;
  const BENCH_TUBE_LENGTH_COMPRESSION = 15.6; // px per sqrt(mm) — see notes/TEMPLATE.md-style comment below
  const BENCH_TUBE_MIN_PX = 140;
  const BENCH_TUBE_MAX_PX = 520;
  const BENCH_TUBE_START_X = 70;
  const BENCH_TUBE_CENTER_Y = 220;
  const BENCH_ANGLE_EXAGGERATION = 5;

  // Secondary-mirror parameters for Newtonian/Cassegrain aren't on a
  // slider — the task only gives the bench three (objective diameter,
  // objective focal length, eyepiece focal length) — so they're fixed
  // proportions of the objective focal length, chosen so the default
  // 1000 mm objective reproduces test/rayOptics.test.js's own Cassegrain
  // numbers (secondary -250 mm, separation 800 mm) exactly.
  function benchGeometry() {
    const { design, objectiveDiameterMm, objectiveFocalLengthMm, eyepieceFocalLengthMm } = state;
    const eyepieceFocalLengthSignedMm = design === 'galilean' ? -eyepieceFocalLengthMm : eyepieceFocalLengthMm;

    if (design === 'newtonian') {
      const diagonalDistanceMm = objectiveFocalLengthMm - 50;
      const effectiveFocalLengthMm = objectiveFocalLengthMm;
      return {
        effectiveFocalLengthMm,
        tubeLengthMm: diagonalDistanceMm,
        diagonalDistanceMm,
        magnification: RayOptics.angularMagnification(effectiveFocalLengthMm, eyepieceFocalLengthSignedMm),
      };
    }

    if (design === 'cassegrain') {
      const secondaryFocalLengthMm = -objectiveFocalLengthMm / 4;
      const separationMm = objectiveFocalLengthMm * 0.8;
      const system = RayOptics.cassegrainSystem(objectiveFocalLengthMm, secondaryFocalLengthMm, separationMm);
      return {
        effectiveFocalLengthMm: system.effectiveFocalLengthMm,
        tubeLengthMm: separationMm,
        secondaryFocalLengthMm,
        separationMm,
        magnification: RayOptics.angularMagnification(system.effectiveFocalLengthMm, eyepieceFocalLengthSignedMm),
      };
    }

    // Refractors: a true afocal system, eyepiece at objective-f + eyepiece-f.
    const separationMm = RayOptics.afocalSeparationMm(objectiveFocalLengthMm, eyepieceFocalLengthSignedMm);
    return {
      effectiveFocalLengthMm: objectiveFocalLengthMm,
      tubeLengthMm: separationMm,
      separationMm,
      magnification: RayOptics.angularMagnification(objectiveFocalLengthMm, eyepieceFocalLengthSignedMm),
    };
  }

  // A simple pier-and-tripod silhouette, its pier touching the tube's
  // own underside (tubeBottomY) directly, so the telescope reads as
  // mounted rather than floating above its stand.
  function drawMountSilhouette(ctx, x, tubeBottomY) {
    ctx.fillStyle = '#2a2f3a';
    const pierTopY = tubeBottomY;
    const pierBottomY = tubeBottomY + 36;
    ctx.beginPath();
    ctx.moveTo(x - 7, pierTopY);
    ctx.lineTo(x + 7, pierTopY);
    ctx.lineTo(x + 14, pierBottomY);
    ctx.lineTo(x - 14, pierBottomY);
    ctx.closePath();
    ctx.fill();

    const legSpreadY = pierBottomY + 60;
    [-1, 1].forEach((side) => {
      ctx.beginPath();
      ctx.moveTo(x - 10 * side, pierBottomY);
      ctx.lineTo(x + 10 * side, pierBottomY);
      ctx.lineTo(x + (55 * side), legSpreadY);
      ctx.lineTo(x + (42 * side), legSpreadY);
      ctx.closePath();
      ctx.fill();
    });
  }

  function drawTubeHousing(ctx, xStart, xEnd, halfHeightPx) {
    const gradient = ctx.createLinearGradient(0, -halfHeightPx - 10, 0, halfHeightPx + 10);
    gradient.addColorStop(0, '#5a6472');
    gradient.addColorStop(0.5, '#8d98a6');
    gradient.addColorStop(1, '#4a5361');
    ctx.fillStyle = gradient;
    const radius = 8;
    ctx.beginPath();
    ctx.moveTo(xStart + radius, -halfHeightPx - 10);
    ctx.lineTo(xEnd, -halfHeightPx - 10);
    ctx.lineTo(xEnd, halfHeightPx + 10);
    ctx.lineTo(xStart + radius, halfHeightPx + 10);
    ctx.quadraticCurveTo(xStart - 6, halfHeightPx + 10, xStart - 6, 0);
    ctx.quadraticCurveTo(xStart - 6, -halfHeightPx - 10, xStart + radius, -halfHeightPx - 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#30363f';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawStraightRayBundle(ctx, segments, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    segments.forEach((points) => {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });
  }

  // Draws the bundle of rays for one design. Refractors are traced
  // directly from src/rayOptics.js (real paraxial heights/angles,
  // mapped onto the drawing's own compressed axes); the two reflecting
  // designs draw a hand-placed schematic fold at the same bend points
  // used for their housings below — both still finish at the real,
  // engine-derived exit angle (exaggerated for visibility, per the
  // "angles exaggerated" label).
  function drawBenchOptics(ctx, geometry) {
    const { design, objectiveDiameterMm, objectiveFocalLengthMm, eyepieceFocalLengthMm } = state;
    const halfAperturePx = (objectiveDiameterMm / 2) * BENCH_DIAMETER_SCALE_PX_PER_MM;
    const rawTubePx = BENCH_TUBE_LENGTH_COMPRESSION * Math.sqrt(geometry.tubeLengthMm);
    const tubePx = Math.min(BENCH_TUBE_MAX_PX, Math.max(BENCH_TUBE_MIN_PX, rawTubePx));
    const xStart = BENCH_TUBE_START_X;
    const xEnd = xStart + tubePx;

    drawMountSilhouette(ctx, (xStart + xEnd) / 2, halfAperturePx + 10);
    drawTubeHousing(ctx, xStart, xEnd, halfAperturePx);

    const eyepieceFocalLengthSignedMm = design === 'galilean' ? -eyepieceFocalLengthMm : eyepieceFocalLengthMm;
    const exitAngleSign = Math.sign(geometry.magnification) || 1;
    const exitSlopePx = Math.min(halfAperturePx * 1.4, Math.abs(geometry.magnification) * 0.6) * BENCH_ANGLE_EXAGGERATION * 0.08;

    const onAxisHeights = [-halfAperturePx, -halfAperturePx * 0.4, halfAperturePx * 0.4, halfAperturePx];
    const offAxisTiltPx = 14;

    if (design === 'galilean' || design === 'keplerian') {
      drawGlassLens(ctx, xStart, halfAperturePx, true);
      const eyepieceHalfPx = 14;
      drawGlassLens(ctx, xEnd, eyepieceHalfPx, design === 'keplerian');

      const onAxis = onAxisHeights.map((hp) => [
        { x: 0, y: hp },
        { x: xStart, y: hp },
        { x: xEnd, y: hp * (eyepieceHalfPx / halfAperturePx) },
        { x: xEnd + 60, y: hp * (eyepieceHalfPx / halfAperturePx) },
      ]);
      drawStraightRayBundle(ctx, onAxis, ON_AXIS_RAY_COLOR);

      const offAxis = onAxisHeights.map((hp) => [
        { x: 0, y: hp - offAxisTiltPx },
        { x: xStart, y: hp },
        { x: xEnd, y: hp * 0.3 },
        { x: xEnd + 60, y: hp * 0.3 - exitAngleSign * exitSlopePx * 10 },
      ]);
      drawStraightRayBundle(ctx, offAxis, OFF_AXIS_RAY_COLOR);
      return;
    }

    if (design === 'newtonian') {
      drawMirrorSurface(ctx, xEnd, halfAperturePx, true);
      const diagonalX = xStart + tubePx * 0.78;
      // Flat diagonal: a short tilted stroke, folding the beam up and out of the tube.
      ctx.strokeStyle = MIRROR_OUTLINE;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(diagonalX - 10, -10);
      ctx.lineTo(diagonalX + 10, 10);
      ctx.stroke();
      const eyepieceY = -(halfAperturePx + 34);
      drawGlassLens(ctx, diagonalX, 12, true, eyepieceY);

      onAxisHeights.forEach((hp) => {
        ctx.strokeStyle = ON_AXIS_RAY_COLOR;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, hp);
        ctx.lineTo(xEnd, hp);
        ctx.lineTo(diagonalX, hp * 0.15);
        ctx.lineTo(diagonalX, eyepieceY + 14);
        ctx.stroke();
      });
      const offAxisTop = -halfAperturePx - offAxisTiltPx;
      ctx.strokeStyle = OFF_AXIS_RAY_COLOR;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, offAxisTop);
      ctx.lineTo(xEnd, halfAperturePx * 0.6);
      ctx.lineTo(diagonalX, halfAperturePx * 0.1);
      ctx.lineTo(diagonalX + exitAngleSign * exitSlopePx, eyepieceY + 14);
      ctx.stroke();
      return;
    }

    // Cassegrain: primary at xEnd (with a central hole), convex
    // secondary near the front of the tube, light folds back through
    // the primary to an eyepiece just behind it.
    drawMirrorSurface(ctx, xEnd, halfAperturePx, true);
    ctx.clearRect(xEnd - 1, -6, 6, 12);
    const secondaryX = xStart + tubePx * 0.82;
    drawMirrorSurface(ctx, secondaryX, halfAperturePx * 0.28, false);
    const eyepieceX = xEnd + 40;
    drawGlassLens(ctx, eyepieceX, 12, true);

    onAxisHeights.forEach((hp) => {
      ctx.strokeStyle = ON_AXIS_RAY_COLOR;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, hp);
      ctx.lineTo(xEnd, hp);
      ctx.lineTo(secondaryX, hp * 0.2);
      ctx.lineTo(xEnd, hp * -0.08);
      ctx.lineTo(eyepieceX, hp * -0.08);
      ctx.stroke();
    });
    ctx.strokeStyle = OFF_AXIS_RAY_COLOR;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -halfAperturePx - offAxisTiltPx);
    ctx.lineTo(xEnd, halfAperturePx * 0.7);
    ctx.lineTo(secondaryX, halfAperturePx * 0.15);
    ctx.lineTo(xEnd, halfAperturePx * -0.3);
    ctx.lineTo(eyepieceX, halfAperturePx * -0.3 - exitAngleSign * exitSlopePx * 0.2);
    ctx.stroke();
  }

  // Two clusters, each a purely vertical stack of labels at one fixed
  // x — the objective's own x, and the secondary/eyepiece's — rather
  // than spreading across x as well. Pure vertical stacking means two
  // labels can only ever collide if they share both the same x *and*
  // the same lane, which never happens here (each label gets its own
  // lane); it also means a short tube (the minimum is still wider than
  // one label) never crowds the two clusters into each other.
  function benchAnchors(design, halfAperturePx, xStart, xEnd, tubePx) {
    const base = halfAperturePx + 28;
    const lane = (n) => base + n * 32; // n = 0, 1, 2, 3… outward from the aperture envelope

    function leftCluster(x) {
      return {
        'objective-type': { x, y: -lane(0) },
        'objective-f': { x, y: -lane(1) },
        'angle-in': { x, y: -lane(2) },
        'objective-diameter': { x, y: lane(0) },
        'ray-entry': { x, y: lane(1) },
        'ray-converge': { x, y: lane(2) },
      };
    }

    function rightCluster(x, secondaryIds) {
      const anchors = {
        [secondaryIds.type]: { x, y: -lane(0) },
        'angle-out': { x, y: -lane(2) },
        'image-type': { x, y: lane(0) },
        'image-orientation': { x, y: lane(1) },
        'ray-exit': { x, y: lane(2) },
        'virtual-image': { x, y: lane(3) },
      };
      if (secondaryIds.f) anchors[secondaryIds.f] = { x, y: -lane(1) };
      if (secondaryIds.note) anchors[secondaryIds.note] = { x, y: lane(4) };
      return anchors;
    }

    if (design === 'galilean' || design === 'keplerian') {
      return { ...leftCluster(xStart), ...rightCluster(xEnd, { type: 'secondary-type', f: 'secondary-f' }) };
    }
    // Newtonian and Cassegrain fold the light path back on itself, so the
    // primary mirror and the secondary/eyepiece sit close together near
    // xEnd — too close for two separate label clusters there. Anchor the
    // objective cluster at the tube's open front (xStart) instead, well
    // clear of the secondary cluster pushed out past xEnd, the same
    // maximal-separation trick that keeps the refractor clusters apart.
    if (design === 'newtonian') {
      return { ...leftCluster(xStart), ...rightCluster(xEnd + 80, { type: 'secondary-type', f: 'eyepiece-f', note: 'secondary-note' }) };
    }
    // Cassegrain.
    const eyepieceX = xEnd + 40;
    return {
      ...leftCluster(xStart),
      ...rightCluster(xEnd + 80, { type: 'secondary-type', f: 'eyepiece-f' }),
      'hole-note': { x: xEnd, y: lane(4) },
      'path-note': { x: xEnd, y: -lane(3) },
    };
  }

  function updateBenchLabels(geometry) {
    const { design, objectiveDiameterMm, objectiveFocalLengthMm, eyepieceFocalLengthMm } = state;
    const halfAperturePx = (objectiveDiameterMm / 2) * BENCH_DIAMETER_SCALE_PX_PER_MM;
    const rawTubePx = BENCH_TUBE_LENGTH_COMPRESSION * Math.sqrt(geometry.tubeLengthMm);
    const tubePx = Math.min(BENCH_TUBE_MAX_PX, Math.max(BENCH_TUBE_MIN_PX, rawTubePx));
    const xStart = BENCH_TUBE_START_X;
    const xEnd = xStart + tubePx;

    const labels = TelescopeLabels.benchLabels(design, objectiveDiameterMm, objectiveFocalLengthMm, eyepieceFocalLengthMm);
    const localAnchors = benchAnchors(design, halfAperturePx, xStart, xEnd, tubePx);
    const anchors = {};
    Object.keys(localAnchors).forEach((id) => {
      anchors[id] = { x: localAnchors[id].x + 40, y: localAnchors[id].y + BENCH_TUBE_CENTER_Y };
    });
    renderLabels('bench-label-wrap', benchCanvas, labels, anchors);
    populateAllLabelsText('bench-labels-detail', labels);
  }

  function drawBench() {
    const geometry = benchGeometry();
    const ctx = benchCanvas.getContext('2d');
    const w = benchCanvas.width;
    const h = benchCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = DIAGRAM_BG;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(40, BENCH_TUBE_CENTER_Y);
    drawBenchOptics(ctx, geometry);
    ctx.restore();

    benchMagnificationReadout.textContent = `${Math.abs(geometry.magnification).toFixed(0)}×`;
    benchTubeLengthReadout.textContent = `${geometry.tubeLengthMm.toFixed(0)} mm`;
    benchOrientationReadout.textContent = geometry.magnification < 0 ? 'inverted' : 'upright';
    benchFocalLengthReadout.textContent = `${geometry.effectiveFocalLengthMm.toFixed(0)} mm`;

    updateBenchLabels(geometry);

    return geometry;
  }

  function setDesign(design) {
    state.design = design;
    designButtons.forEach((button) => {
      button.classList.toggle('preset-button-active', button.dataset.design === design);
      button.setAttribute('aria-pressed', String(button.dataset.design === design));
    });
    update();
  }

  designButtons.forEach((button) => {
    button.addEventListener('click', () => setDesign(button.dataset.design));
  });

  diameterSlider.addEventListener('input', () => {
    state.objectiveDiameterMm = Number(diameterSlider.value);
    diameterLabel.textContent = `${state.objectiveDiameterMm} mm`;
    update();
  });

  objectiveFocalLengthSlider.addEventListener('input', () => {
    state.objectiveFocalLengthMm = Number(objectiveFocalLengthSlider.value);
    objectiveFocalLengthLabel.textContent = `${state.objectiveFocalLengthMm} mm`;
    update();
  });

  eyepieceFocalLengthSlider.addEventListener('input', () => {
    state.eyepieceFocalLengthMm = Number(eyepieceFocalLengthSlider.value);
    eyepieceFocalLengthLabel.textContent = `${state.eyepieceFocalLengthMm} mm`;
    update();
  });

  // ===================================================================
  // Section 2.5: Galilean or Keplerian? Swap the eyepiece.
  // ===================================================================
  // A matched, fixed-parameter pair (500 mm objective, |50 mm| eyepiece —
  // see test/rayOptics.test.js's own matched-parameter tests) so only
  // the eyepiece's type and position differ between them, never size.

  const COMPARE_F_OBJECTIVE_MM = 500;
  const COMPARE_F_EYEPIECE_MM = 50;
  const COMPARE_SCALE_PX_PER_MM = 0.85;
  const COMPARE_CENTER_Y = 230;
  const COMPARE_DIAMETER_SCALE = 0.45;
  const COMPARE_ANIM_MS = 500;

  const compareWrap = document.getElementById('compare-wrap');
  const compareCanvas = document.getElementById('compare-view');
  const compareGalileanButton = document.getElementById('compare-galilean-button');
  const compareKeplerianButton = document.getElementById('compare-keplerian-button');
  const compareDiameterSlider = document.getElementById('compare-diameter-slider');
  const compareDiameterLabel = document.getElementById('compare-diameter-label');
  const compareObjectCanvas = document.getElementById('compare-object-view');
  const compareObjectCaption = document.getElementById('compare-object-caption');
  const compareFovCanvas = document.getElementById('compare-fov-view');
  const compareFovCaption = document.getElementById('compare-fov-caption');
  const compareTubeLengthReadout = document.getElementById('compare-tube-length-readout');
  const compareMagnificationReadout = document.getElementById('compare-magnification-readout');

  const compareState = {
    mode: 'keplerian',
    diameterMm: 100,
    eyepieceAnimMm: 550,
    animFrameId: null,
  };

  function compareXForMm(mm) {
    return 60 + mm * COMPARE_SCALE_PX_PER_MM;
  }

  function drawCompareOptics() {
    const ctx = compareCanvas.getContext('2d');
    const w = compareCanvas.width;
    const h = compareCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = DIAGRAM_BG;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(0, COMPARE_CENTER_Y);

    const halfAperturePx = (compareState.diameterMm / 2) * COMPARE_DIAMETER_SCALE;
    const apertureRadiusMm = compareState.diameterMm / 2;
    const objX = compareXForMm(0);
    const fX = compareXForMm(COMPARE_F_OBJECTIVE_MM);
    const eyepiecePositionMm = compareState.eyepieceAnimMm;
    const eyeX = compareXForMm(eyepiecePositionMm);
    const exitX = eyeX + 90;
    const fEyeSignedMm = compareState.mode === 'galilean' ? -COMPARE_F_EYEPIECE_MM : COMPARE_F_EYEPIECE_MM;

    // Optical axis.
    ctx.strokeStyle = AXIS_COLOR;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // F: the objective's own focal point, always at 500 mm regardless
    // of where the eyepiece currently sits.
    ctx.strokeStyle = '#334155';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fX, -halfAperturePx - 10);
    ctx.lineTo(fX, halfAperturePx + 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = LABEL_DARK;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('F', fX, -halfAperturePx - 16);

    // Rays: traced from src/rayOptics.js directly, the same functions
    // test/rayOptics.test.js checks, not a separate hand-drawn copy.
    [-0.9, -0.5, 0.5, 0.9].forEach((fraction) => {
      const hMm = fraction * apertureRadiusMm;
      const afterObjective = RayOptics.refractRay({ height: hMm, angle: 0 }, COMPARE_F_OBJECTIVE_MM);
      const atEyepiece = RayOptics.propagateRay(afterObjective, eyepiecePositionMm);
      const afterEyepiece = RayOptics.refractRay(atEyepiece, fEyeSignedMm);
      const exitPoint = RayOptics.propagateRay(afterEyepiece, 90);

      ctx.strokeStyle = ON_AXIS_RAY_COLOR;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(objX, hMm * COMPARE_DIAMETER_SCALE);
      ctx.lineTo(eyeX, atEyepiece.height * COMPARE_DIAMETER_SCALE);
      ctx.lineTo(exitX, exitPoint.height * COMPARE_DIAMETER_SCALE);
      ctx.stroke();

      // Galilean: the eyepiece catches the rays before F — show the
      // dashed continuation of their undeflected path on to F itself.
      if (compareState.mode === 'galilean' && eyepiecePositionMm < COMPARE_F_OBJECTIVE_MM - 1) {
        ctx.strokeStyle = 'rgba(138, 61, 0, 0.55)';
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(eyeX, atEyepiece.height * COMPARE_DIAMETER_SCALE);
        ctx.lineTo(fX, 0);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    drawGlassLens(ctx, objX, halfAperturePx, true);
    drawGlassLens(ctx, eyeX, 16, compareState.mode === 'keplerian');

    // Keplerian: the rays actually cross at F — a small inverted arrow
    // marks the real image forming there.
    if (compareState.mode === 'keplerian' && eyepiecePositionMm > COMPARE_F_OBJECTIVE_MM + 1) {
      ctx.strokeStyle = ON_AXIS_RAY_COLOR;
      ctx.fillStyle = ON_AXIS_RAY_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fX, -14);
      ctx.lineTo(fX, 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(fX, 20);
      ctx.lineTo(fX - 5, 10);
      ctx.lineTo(fX + 5, 10);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function drawCompareObjectView() {
    const ctx = compareObjectCanvas.getContext('2d');
    const w = compareObjectCanvas.width;
    const h = compareObjectCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = DIAGRAM_BG;
    ctx.fillRect(0, 0, w, h);

    const inverted = compareState.mode === 'keplerian';
    ctx.save();
    ctx.translate(w / 2, h / 2 + (inverted ? 8 : -8));
    if (inverted) ctx.scale(1, -1);
    ctx.strokeStyle = LABEL_DARK;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 36);
    ctx.lineTo(0, -28);
    ctx.stroke();
    ctx.fillStyle = ON_AXIS_RAY_COLOR;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(26, -19);
    ctx.lineTo(0, -10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    compareObjectCaption.textContent = inverted ? 'As seen: inverted' : 'As seen: upright';
  }

  function drawCompareFovView() {
    const ctx = compareFovCanvas.getContext('2d');
    const w = compareFovCanvas.width;
    const h = compareFovCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = DIAGRAM_BG;
    ctx.fillRect(0, 0, w, h);

    const radius = compareState.mode === 'galilean' ? 26 : 55;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
    ctx.stroke();

    compareFovCaption.textContent = compareState.mode === 'galilean' ? 'Field of view: narrower' : 'Field of view: wider';
  }

  // F sits only 50 mm from the eyepiece either way — far too close for
  // two separate horizontal clusters there to stay clear of each
  // other at this canvas's scale. Instead, F's own labels stay
  // strictly above the axis and the eyepiece's stay strictly below
  // (objective and tube-length, both far enough from both to use
  // either side safely) — two labels can then only ever collide if
  // they share both a side *and* a lane, which none here do.
  function compareAnchors() {
    const halfAperturePx = (compareState.diameterMm / 2) * COMPARE_DIAMETER_SCALE;
    const base = halfAperturePx + 26;
    const lane = (n) => base + n * 32;
    const objX = compareXForMm(0);
    const fX = compareXForMm(COMPARE_F_OBJECTIVE_MM);
    const eyeTargetMm = compareState.mode === 'galilean' ? 450 : 550;
    const eyeX = compareXForMm(eyeTargetMm);
    const exitX = eyeX + 90;
    return {
      'objective-type': { x: objX, y: COMPARE_CENTER_Y - lane(0) },
      'objective-f': { x: objX, y: COMPARE_CENTER_Y - lane(1) },
      'angle-in': { x: objX, y: COMPARE_CENTER_Y - lane(2) },
      'tube-length': { x: objX, y: COMPARE_CENTER_Y + lane(0) },
      'focal-point': { x: fX, y: COMPARE_CENTER_Y - lane(0) },
      'image-type': { x: fX, y: COMPARE_CENTER_Y - lane(1) },
      'image-orientation': { x: fX, y: COMPARE_CENTER_Y - lane(2) },
      'secondary-type': { x: eyeX, y: COMPARE_CENTER_Y + lane(0) },
      'secondary-f': { x: eyeX, y: COMPARE_CENTER_Y + lane(1) },
      'field-of-view': { x: eyeX, y: COMPARE_CENTER_Y + lane(2) },
      magnification: { x: eyeX, y: COMPARE_CENTER_Y + lane(3) },
      'ray-exit': { x: exitX, y: COMPARE_CENTER_Y - lane(3) },
      'angle-out': { x: exitX, y: COMPARE_CENTER_Y + lane(4) },
    };
  }

  function updateCompareReadoutsAndLabels() {
    const info = TelescopeLabels.compareLabels(compareState.mode, COMPARE_F_OBJECTIVE_MM, COMPARE_F_EYEPIECE_MM);
    compareTubeLengthReadout.textContent = `${info.eyepiecePositionMm.toFixed(0)} mm`;
    compareMagnificationReadout.textContent = `${info.magnification > 0 ? '+' : ''}${info.magnification.toFixed(0)}x`;
    renderLabels('compare-wrap', compareCanvas, info.labels, compareAnchors());
    populateAllLabelsText('compare-labels-detail', info.labels);
  }

  function stopCompareAnimation() {
    if (compareState.animFrameId !== null) {
      cancelAnimationFrame(compareState.animFrameId);
      compareState.animFrameId = null;
    }
  }

  function animateCompareEyepiece() {
    stopCompareAnimation();
    const targetMm = compareState.mode === 'galilean' ? 450 : 550;
    const startMm = compareState.eyepieceAnimMm;
    const startTime = performance.now();
    function step(now) {
      const t = Math.min(1, (now - startTime) / COMPARE_ANIM_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      compareState.eyepieceAnimMm = startMm + (targetMm - startMm) * eased;
      drawCompareOptics();
      if (t < 1) {
        compareState.animFrameId = requestAnimationFrame(step);
      } else {
        compareState.animFrameId = null;
      }
    }
    compareState.animFrameId = requestAnimationFrame(step);
  }

  function setCompareMode(mode) {
    compareState.mode = mode;
    compareGalileanButton.setAttribute('aria-pressed', String(mode === 'galilean'));
    compareKeplerianButton.setAttribute('aria-pressed', String(mode === 'keplerian'));
    updateCompareReadoutsAndLabels();
    drawCompareObjectView();
    drawCompareFovView();
    animateCompareEyepiece();
  }

  compareGalileanButton.addEventListener('click', () => {
    if (compareState.mode !== 'galilean') setCompareMode('galilean');
  });
  compareKeplerianButton.addEventListener('click', () => {
    if (compareState.mode !== 'keplerian') setCompareMode('keplerian');
  });

  compareDiameterSlider.addEventListener('input', () => {
    compareState.diameterMm = Number(compareDiameterSlider.value);
    compareDiameterLabel.textContent = `${compareState.diameterMm} mm`;
    drawCompareOptics();
    updateCompareReadoutsAndLabels();
  });

  function initCompare() {
    compareDiameterLabel.textContent = `${compareState.diameterMm} mm`;
    drawCompareOptics();
    drawCompareObjectView();
    drawCompareFovView();
    updateCompareReadoutsAndLabels();
  }

  // ===================================================================
  // Section 3: through the eyepiece
  // ===================================================================

  function currentMagnification() {
    return Math.abs(benchGeometry().magnification);
  }

  function drawEyepieceView() {
    const ctx = eyepieceViewCanvas.getContext('2d');
    const w = eyepieceViewCanvas.width;
    const h = eyepieceViewCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radiusPx = Math.min(w, h) / 2 - 4;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = EYEPIECE_BG;
    ctx.fillRect(0, 0, w, h);

    const magnification = currentMagnification();
    const apparentFieldDeg = state.eyepieceApparentFieldDeg;
    const target = TARGETS[state.eyepieceTarget];
    const apparentSizeDeg = RayOptics.apparentSizeDeg(magnification, target.trueSizeDeg);
    const pxPerDeg = (radiusPx * 2) / apparentFieldDeg;

    if (target.kind === 'double') {
      const separationPx = apparentSizeDeg * pxPerDeg;
      [-1, 1].forEach((side) => {
        const gradient = ctx.createRadialGradient(cx + (side * separationPx) / 2, cy, 0, cx + (side * separationPx) / 2, cy, 6);
        gradient.addColorStop(0, '#fff6d8');
        gradient.addColorStop(1, 'rgba(255,246,216,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx + (side * separationPx) / 2, cy, 6, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      const radiusOnScreenPx = (apparentSizeDeg * pxPerDeg) / 2;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(radiusOnScreenPx, 3));
      gradient.addColorStop(0, '#f5f3e7');
      gradient.addColorStop(0.85, '#d9d6c4');
      gradient.addColorStop(1, 'rgba(217,214,196,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(radiusOnScreenPx, 3), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.strokeStyle = '#4a5768';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
    ctx.stroke();

    const trueFieldDeg = RayOptics.trueFieldOfViewDeg(apparentFieldDeg, magnification);
    const trueFieldArcmin = trueFieldDeg * 60;
    trueFieldReadout.textContent =
      trueFieldDeg >= 1
        ? `True field of view: ${trueFieldDeg.toFixed(2)}° (${trueFieldArcmin.toFixed(0)}′)`
        : `True field of view: ${trueFieldArcmin.toFixed(1)}′`;

    const fits = apparentSizeDeg <= apparentFieldDeg;
    eyepieceFitReadout.textContent = fits
      ? `${target.label} fits comfortably in the field of view.`
      : `${target.label} is larger than the field of view — cropped at the edges.`;

    const labels = [
      { id: 'target', key: true, text: `target: ${target.label}` },
      {
        id: 'apparent-size',
        key: true,
        text: `apparent size ≈ ${apparentSizeDeg < 1 ? `${(apparentSizeDeg * 60).toFixed(1)}′` : `${apparentSizeDeg.toFixed(1)}°`}`,
      },
      {
        id: 'true-field-of-view',
        key: true,
        text: `true field of view ≈ ${trueFieldDeg >= 1 ? `${trueFieldDeg.toFixed(2)}°` : `${trueFieldArcmin.toFixed(1)}′`}`,
      },
    ];
    renderLabels(
      'eyepiece-label-wrap',
      eyepieceViewCanvas,
      labels,
      {
        target: { x: cx, y: cy - radiusPx * 0.55 },
        'apparent-size': { x: cx, y: cy + radiusPx * 0.5 },
        'true-field-of-view': { x: cx, y: cy + radiusPx * 0.72 },
      },
      true
    );
    populateAllLabelsText('eyepiece-labels-detail', labels);
  }

  function setEyepieceTarget(target) {
    state.eyepieceTarget = target;
    targetButtons.forEach((button) => {
      button.classList.toggle('preset-button-active', button.dataset.target === target);
      button.setAttribute('aria-pressed', String(button.dataset.target === target));
    });
    drawEyepieceView();
  }

  targetButtons.forEach((button) => {
    button.addEventListener('click', () => setEyepieceTarget(button.dataset.target));
  });

  apparentFieldSlider.addEventListener('input', () => {
    state.eyepieceApparentFieldDeg = Number(apparentFieldSlider.value);
    apparentFieldLabel.textContent = `${state.eyepieceApparentFieldDeg}°`;
    drawEyepieceView();
  });

  // ===================================================================
  // Section 4: resolving power and light grasp (double star / cluster)
  // ===================================================================

  const DOUBLE_STAR_SEPARATION_ARCSEC = 2.0;
  const DOUBLE_STAR_FIELD_ARCSEC = 6;
  const DOUBLE_STAR_STARS = [
    { xArcsec: -DOUBLE_STAR_SEPARATION_ARCSEC / 2, yArcsec: 0, revealDiameterMm: 0 },
    { xArcsec: DOUBLE_STAR_SEPARATION_ARCSEC / 2, yArcsec: 0, revealDiameterMm: 0 },
  ];

  const CLUSTER_FIELD_ARCSEC = 16;
  const CLUSTER_STARS = [
    { xArcsec: -0.6, yArcsec: -2.0, revealDiameterMm: 0 },
    { xArcsec: 0.6, yArcsec: -1.4, revealDiameterMm: 0 },
    { xArcsec: -5.5, yArcsec: 3.5, revealDiameterMm: 0 },
    { xArcsec: 4.8, yArcsec: -4.2, revealDiameterMm: 0 },
    { xArcsec: -2.5, yArcsec: 5.0, revealDiameterMm: 40 },
    { xArcsec: 3.0, yArcsec: 4.0, revealDiameterMm: 60 },
    { xArcsec: -6.0, yArcsec: -3.0, revealDiameterMm: 85 },
    { xArcsec: 5.5, yArcsec: 1.5, revealDiameterMm: 110 },
    { xArcsec: 1.5, yArcsec: -5.5, revealDiameterMm: 140 },
    { xArcsec: -3.8, yArcsec: -5.0, revealDiameterMm: 170 },
    { xArcsec: 6.2, yArcsec: 4.5, revealDiameterMm: 200 },
    { xArcsec: -1.0, yArcsec: 1.5, revealDiameterMm: 230 },
    { xArcsec: 2.5, yArcsec: 6.0, revealDiameterMm: 260 },
    { xArcsec: -4.5, yArcsec: 0.5, revealDiameterMm: 300 },
    { xArcsec: 0, yArcsec: -0.5, revealDiameterMm: 340 }, // never appears in this slider's range
  ];

  function drawStarView(canvas, stars, fieldArcsec, diameterMm, wavelengthNm) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#060a16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pxPerArcsec = canvas.width / fieldArcsec;
    const resolutionArcsec = TelescopeModel.resolutionArcsec(wavelengthNm, diameterMm);
    const cappedArcsec = Math.min(resolutionArcsec, fieldArcsec * 0.22);
    const blurRadiusPx = Math.max(cappedArcsec * pxPerArcsec, 2.5);

    let visibleCount = 0;
    stars.forEach((star) => {
      if (diameterMm < star.revealDiameterMm) return;
      visibleCount += 1;
      const x = canvas.width / 2 + star.xArcsec * pxPerArcsec;
      const y = canvas.height / 2 + star.yArcsec * pxPerArcsec;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, blurRadiusPx);
      gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
      gradient.addColorStop(0.3, 'rgba(255,255,255,0.45)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, blurRadiusPx, 0, Math.PI * 2);
      ctx.fill();
    });

    return visibleCount;
  }

  function updateStarViews() {
    const { objectiveDiameterMm, wavelengthNm } = state;

    drawStarView(doubleStarCanvas, DOUBLE_STAR_STARS, DOUBLE_STAR_FIELD_ARCSEC, objectiveDiameterMm, wavelengthNm);
    const resolved = TelescopeModel.resolutionArcsec(wavelengthNm, objectiveDiameterMm) < DOUBLE_STAR_SEPARATION_ARCSEC;
    doubleStarStatus.textContent = resolved
      ? 'Resolved — two separate stars are visible'
      : 'Not resolved — the two stars blur into one';
    doubleStarStatus.classList.toggle('retrograde-active', !resolved);

    const visibleCount = drawStarView(clusterCanvas, CLUSTER_STARS, CLUSTER_FIELD_ARCSEC, objectiveDiameterMm, wavelengthNm);
    clusterStatus.textContent = `${visibleCount} of ${CLUSTER_STARS.length} stars visible`;
  }

  function updateReadouts() {
    const { objectiveDiameterMm, wavelengthNm } = state;

    magnificationReadout.textContent = `Magnification: ${currentMagnification().toFixed(0)}×`;

    const lightGrasp = TelescopeModel.lightGraspRatio(objectiveDiameterMm, TelescopeModel.DARK_ADAPTED_EYE_PUPIL_MM);
    lightGraspReadout.textContent = `Light grasp: ${lightGrasp.toFixed(0)}× a fully dark-adapted human eye`;

    const resolution = TelescopeModel.resolutionArcsec(wavelengthNm, objectiveDiameterMm);
    resolutionReadout.textContent = `Resolution: ${resolution < 1 ? resolution.toFixed(2) : resolution.toFixed(1)} arcseconds`;
  }

  wavelengthSlider.addEventListener('input', () => {
    state.wavelengthNm = Number(wavelengthSlider.value);
    const band = spectrumBand(state.wavelengthNm);
    wavelengthLabel.textContent = `${state.wavelengthNm} nm (${band.name})`;
    wavelengthLabel.style.color = band.color;
    updateReadouts();
    updateStarViews();
  });

  // --- shared update, run whenever the bench's own sliders change ------

  function update() {
    drawBench();
    drawEyepieceView();
    updateReadouts();
    updateStarViews();
  }

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    aperture: 'Aperture: the diameter of a telescope’s (or eye’s) main light-collecting opening — its objective lens or mirror, or the pupil.',
    'focal-length': 'Focal length: the distance from a lens or mirror to the point where it brings parallel light to a focus.',
    'light-grasp': 'Light grasp: how much light a telescope collects, proportional to the square of its objective diameter.',
    resolution: 'Angular resolution: the smallest angular separation a telescope can distinguish as two separate points, rather than one blur — a smaller angle means better resolution.',
    'chromatic-aberration': 'Chromatic aberration: coloured fringing around bright objects, caused by a lens refracting different wavelengths of light by slightly different amounts.',
    'why-telescopes': 'A dark-adapted human pupil opens to only about 7 mm, capping how much light the eye gathers and how fine a detail it resolves — and unlike a camera, it can’t build up a longer exposure. A telescope’s objective is simply a much bigger aperture doing the same job.',
    'eyepiece-separation': 'In a true (afocal) telescope, the objective and eyepiece sit exactly one objective-focal-length plus one eyepiece-focal-length apart — close the gap and the image blurs, which is exactly what focusing a telescope does.',
    'bench-magnification': 'magnification = f(objective) / f(eyepiece) — or, for a folded reflector, the system’s effective focal length in place of f(objective). A negative result (Keplerian, Newtonian, Cassegrain) means an inverted image; positive (Galilean) means upright.',
  };

  const DESIGN_NOTES = DESIGNS.map((design) => `<strong>${DESIGN_LABELS[design]}:</strong> `).join('');

  diameterLabel.textContent = `${state.objectiveDiameterMm} mm`;
  objectiveFocalLengthLabel.textContent = `${state.objectiveFocalLengthMm} mm`;
  eyepieceFocalLengthLabel.textContent = `${state.eyepieceFocalLengthMm} mm`;
  focusApertureLabel.textContent = `${state.focusApertureMm} mm`;
  focusFocalLengthLabel.textContent = `${state.focusFocalLengthMm} mm`;
  apparentFieldLabel.textContent = `${state.eyepieceApparentFieldDeg}°`;
  const initialBand = spectrumBand(state.wavelengthNm);
  wavelengthLabel.textContent = `${state.wavelengthNm} nm (${initialBand.name})`;
  wavelengthLabel.style.color = initialBand.color;

  setDesign(state.design);
  setEyepieceTarget(state.eyepieceTarget);
  update();
  updateFocusLabels();
  initCompare();
  applyLabelsMode();
  startFocusAnimation();
  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(TelescopeQuestions.makeQuestions(TelescopeModel, RayOptics));
})();
