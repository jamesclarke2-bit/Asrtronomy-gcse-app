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
    objectiveFocalLengthMm: 1000,
    eyepieceFocalLengthMm: 25,

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

  // ===================================================================
  // Section 1: how a lens and a mirror focus light
  // ===================================================================

  const FOCUS_SCALE_PX_PER_MM = 0.6;
  const FOCUS_LENS_X = 70;
  const FOCUS_MIRROR_X = 250;

  function drawGlassLens(ctx, x, halfHeightPx, convex, y = 0) {
    const bulge = Math.max(6, halfHeightPx * 0.18) * (convex ? 1 : -1);
    const gradient = ctx.createLinearGradient(x - 10, y, x + 10, y);
    gradient.addColorStop(0, 'rgba(180,210,240,0.35)');
    gradient.addColorStop(0.5, 'rgba(220,240,255,0.75)');
    gradient.addColorStop(1, 'rgba(180,210,240,0.35)');
    ctx.beginPath();
    ctx.moveTo(x, y - halfHeightPx);
    ctx.quadraticCurveTo(x + bulge, y, x, y + halfHeightPx);
    ctx.quadraticCurveTo(x - bulge, y, x, y - halfHeightPx);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#5a7fa8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawMirrorSurface(ctx, x, halfHeightPx, concaveTowardsLeft, y = 0) {
    const bulge = Math.max(8, halfHeightPx * 0.22) * (concaveTowardsLeft ? 1 : -1);
    const gradient = ctx.createLinearGradient(x - 6, y - halfHeightPx, x - 6, y + halfHeightPx);
    gradient.addColorStop(0, '#f4f7fb');
    gradient.addColorStop(0.5, '#b9c6d6');
    gradient.addColorStop(1, '#f4f7fb');
    ctx.beginPath();
    ctx.moveTo(x, y - halfHeightPx);
    ctx.quadraticCurveTo(x + bulge, y, x, y + halfHeightPx);
    ctx.lineTo(x + 5, y + halfHeightPx);
    ctx.quadraticCurveTo(x + 5 + bulge, y, x + 5, y - halfHeightPx);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#8a97a5';
    ctx.lineWidth = 1;
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
    ctx.fillStyle = '#060a16';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(0, h / 2);

    const halfApertureMm = state.focusApertureMm / 2;
    const halfAperturePx = halfApertureMm * FOCUS_SCALE_PX_PER_MM;
    const focalLengthPx = state.focusFocalLengthMm * FOCUS_SCALE_PX_PER_MM;
    const elementX = isMirror ? FOCUS_MIRROR_X : FOCUS_LENS_X;

    // Optical axis.
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
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
    ctx.strokeStyle = 'rgba(255, 210, 110, 0.25)';
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
      glow.addColorStop(0, 'rgba(255,235,180,1)');
      glow.addColorStop(1, 'rgba(255,235,180,0)');
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

    // Focal point marker.
    const focusX = isMirror ? elementX - focalLengthPx : elementX + focalLengthPx;
    ctx.fillStyle = '#ff5f5f';
    ctx.beginPath();
    ctx.arc(focusX, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8e8e0';
    ctx.font = '11px sans-serif';
    ctx.fillText('focal point', focusX - 28, 14);

    ctx.restore();
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
  });

  focusFocalLengthSlider.addEventListener('input', () => {
    state.focusFocalLengthMm = Number(focusFocalLengthSlider.value);
    focusFocalLengthLabel.textContent = `${state.focusFocalLengthMm} mm`;
  });

  // ===================================================================
  // Section 2: the telescope bench
  // ===================================================================

  const BENCH_DIAMETER_SCALE_PX_PER_MM = 0.3;
  const BENCH_TUBE_LENGTH_COMPRESSION = 15.6; // px per sqrt(mm) — see notes/TEMPLATE.md-style comment below
  const BENCH_TUBE_MIN_PX = 140;
  const BENCH_TUBE_MAX_PX = 520;
  const BENCH_TUBE_START_X = 70;
  const BENCH_TUBE_CENTER_Y = 120;
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
      drawStraightRayBundle(ctx, onAxis, 'rgba(255, 221, 120, 0.85)');

      const offAxis = onAxisHeights.map((hp) => [
        { x: 0, y: hp - offAxisTiltPx },
        { x: xStart, y: hp },
        { x: xEnd, y: hp * 0.3 },
        { x: xEnd + 60, y: hp * 0.3 - exitAngleSign * exitSlopePx * 10 },
      ]);
      drawStraightRayBundle(ctx, offAxis, 'rgba(120, 210, 255, 0.85)');
      return;
    }

    if (design === 'newtonian') {
      drawMirrorSurface(ctx, xEnd, halfAperturePx, true);
      const diagonalX = xStart + tubePx * 0.78;
      // Flat diagonal: a short tilted stroke, folding the beam up and out of the tube.
      ctx.strokeStyle = '#c9d3dd';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(diagonalX - 10, -10);
      ctx.lineTo(diagonalX + 10, 10);
      ctx.stroke();
      const eyepieceY = -(halfAperturePx + 34);
      drawGlassLens(ctx, diagonalX, 12, true, eyepieceY);

      onAxisHeights.forEach((hp) => {
        ctx.strokeStyle = 'rgba(255, 221, 120, 0.85)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, hp);
        ctx.lineTo(xEnd, hp);
        ctx.lineTo(diagonalX, hp * 0.15);
        ctx.lineTo(diagonalX, eyepieceY + 14);
        ctx.stroke();
      });
      const offAxisTop = -halfAperturePx - offAxisTiltPx;
      ctx.strokeStyle = 'rgba(120, 210, 255, 0.85)';
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
      ctx.strokeStyle = 'rgba(255, 221, 120, 0.85)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, hp);
      ctx.lineTo(xEnd, hp);
      ctx.lineTo(secondaryX, hp * 0.2);
      ctx.lineTo(xEnd, hp * -0.08);
      ctx.lineTo(eyepieceX, hp * -0.08);
      ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(120, 210, 255, 0.85)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -halfAperturePx - offAxisTiltPx);
    ctx.lineTo(xEnd, halfAperturePx * 0.7);
    ctx.lineTo(secondaryX, halfAperturePx * 0.15);
    ctx.lineTo(xEnd, halfAperturePx * -0.3);
    ctx.lineTo(eyepieceX, halfAperturePx * -0.3 - exitAngleSign * exitSlopePx * 0.2);
    ctx.stroke();
  }

  function drawBench() {
    const geometry = benchGeometry();
    const ctx = benchCanvas.getContext('2d');
    const w = benchCanvas.width;
    const h = benchCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(40, BENCH_TUBE_CENTER_Y);
    drawBenchOptics(ctx, geometry);
    ctx.restore();

    benchMagnificationReadout.textContent = `${Math.abs(geometry.magnification).toFixed(0)}×`;
    benchTubeLengthReadout.textContent = `${geometry.tubeLengthMm.toFixed(0)} mm`;
    benchOrientationReadout.textContent = geometry.magnification < 0 ? 'inverted' : 'upright';
    benchFocalLengthReadout.textContent = `${geometry.effectiveFocalLengthMm.toFixed(0)} mm`;

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
    ctx.fillStyle = '#04060f';
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
  startFocusAnimation();
  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(TelescopeQuestions.makeQuestions(TelescopeModel));
})();
