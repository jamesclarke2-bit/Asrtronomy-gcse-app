(function () {
  const CURRICULUM_UNITS = ['u3.28', 'u3.29'];
  const OM = OrbitalMechanics;
  const GF = GravityField;

  const EARTH_COLOR = '#2a6bd6';
  const MOON_COLOR = '#8a97a5';
  const SUN_COLOR = '#e8a23a';
  const BODY_A_COLOR = '#2a6bd6';
  const BODY_B_COLOR = '#6a3fa0';
  const ZERO_POINT_COLOR = '#c0392b';
  const LAGRANGE_COLOR = '#173d75';
  const ARROW_COLOR = 'rgba(42, 107, 214, 0.55)';
  const CONTOUR_COLOR = 'rgba(58, 63, 77, 0.35)';

  // --- Real-world constants used by both widgets --------------------------

  const M_EARTH = OM.EARTH_MASS_KG;
  const M_MOON = Tides.MOON_MASS_KG;
  const EARTH_MOON_DISTANCE = Tides.MOON_DISTANCE_KM * 1000;
  const M_SUN = OM.SOLAR_MASS_KG;
  const SUN_EARTH_DISTANCE = OM.AU_M;

  // --- Shared geometry helpers ---------------------------------------------

  // Everything collinearLagrangePoints/equilateralLagrangePoints/
  // effectivePotential expect lives on a 1D line through the barycentre
  // (see src/gravityField.js's own comments) — this computes that
  // "local" frame for whatever two bodies and orientation the map
  // currently has (the masses are draggable anywhere in 2D, not fixed
  // to the x-axis), then rotates/translates the engine's own results
  // back into map (world) coordinates. A rotation about the barycentre
  // doesn't change any physical distance, so this is exact, not an
  // approximation — the engine never sees anything but a clean 1D
  // problem, on every drag.
  function computeRotatingFrame(bodyA, bodyB) {
    const big = bodyA.mass >= bodyB.mass ? bodyA : bodyB;
    const small = bodyA.mass >= bodyB.mass ? bodyB : bodyA;
    const dx = small.x - big.x;
    const dy = small.y - big.y;
    const separation = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const totalMass = big.mass + small.mass;
    const baryX = (big.mass * big.x + small.mass * small.x) / totalMass;
    const baryY = (big.mass * big.y + small.mass * small.y) / totalMass;

    function toWorld(lx, ly) {
      return { x: baryX + lx * cosA - ly * sinA, y: baryY + lx * sinA + ly * cosA };
    }
    function toLocal(wx, wy) {
      const rx = wx - baryX;
      const ry = wy - baryY;
      return { x: rx * cosA + ry * sinA, y: -rx * sinA + ry * cosA };
    }

    const collinear = GF.collinearLagrangePoints(big.mass, small.mass, separation);
    const equilateral = GF.equilateralLagrangePoints(big.mass, small.mass, separation);
    const localBodies = [
      { mass: big.mass, x: collinear.xLarger, y: 0 },
      { mass: small.mass, x: collinear.xSmaller, y: 0 },
    ];

    return {
      big,
      small,
      separation,
      bary: { x: baryX, y: baryY },
      omega: collinear.omega,
      localBodies,
      toWorld,
      toLocal,
      L1: toWorld(collinear.L1.x, 0),
      L2: toWorld(collinear.L2.x, 0),
      L3: toWorld(collinear.L3.x, 0),
      L4: toWorld(equilateral.L4.x, equilateral.L4.y),
      L5: toWorld(equilateral.L5.x, equilateral.L5.y),
    };
  }

  function effectivePotentialAtWorldPoint(frame, worldX, worldY) {
    const local = frame.toLocal(worldX, worldY);
    return GF.effectivePotential(frame.localBodies, frame.omega, local);
  }

  function formatDistance(metres) {
    const km = metres / 1000;
    if (km >= 1e6) return `${(km / 1e6).toFixed(2)} million km`;
    if (km >= 1000) return `${km.toFixed(0)} km`;
    return `${km.toFixed(1)} km`;
  }

  // --- Widget 1: the draggable field map -----------------------------------

  const mapCanvas = document.getElementById('map-view');
  const mapCtx = mapCanvas.getContext('2d');
  const viewModeFieldButton = document.getElementById('view-mode-field-button');
  const viewModeEffectiveButton = document.getElementById('view-mode-effective-button');
  const zoomToggleButton = document.getElementById('zoom-toggle-button');
  const zoomNote = document.getElementById('zoom-note');
  const bodyADot = document.getElementById('body-a-dot');
  const bodyALabel = document.getElementById('body-a-label');
  const bodyBDot = document.getElementById('body-b-dot');
  const bodyBLabel = document.getElementById('body-b-label');
  const mapSeparationReadout = document.getElementById('map-separation-readout');
  const mapZeroFieldReference = document.getElementById('map-zero-field-reference');
  const mapZeroFieldReadout = document.getElementById('map-zero-field-readout');
  const mapLagrangeRow = document.getElementById('map-lagrange-row');
  const mapL1Reference = document.getElementById('map-l1-reference');
  const mapL1Readout = document.getElementById('map-l1-readout');
  const presetButtons = document.querySelectorAll('.preset-button[data-map-preset]');

  let mapBodies = [];
  let mapViewMode = 'effective';
  let mapZoomed = false;
  let mapCurrentPreset = 'earth-moon';
  // Which of the two bodies distances are measured "from" — Earth in
  // both the Earth-Moon preset (where it's the larger body) and the
  // Sun-Earth preset (where it's the smaller one), matching how this
  // page's own prose states both figures. Not simply "the smaller
  // body": that happens to be Earth in the Sun-Earth case but would be
  // the Moon in the Earth-Moon case, which isn't the distance anyone
  // actually quotes.
  let mapReferenceIndex = 0;
  let lastMapView = null;

  const MAP_MARGIN_PX = 24;

  function mapHalfSizePx() {
    return Math.min(mapCanvas.width, mapCanvas.height) / 2 - MAP_MARGIN_PX;
  }

  function computeMapView() {
    const [a, b] = mapBodies;
    const zero = GF.zeroFieldPointBetween(a, b);
    const frame = mapViewMode === 'effective' ? computeRotatingFrame(a, b) : null;

    const focusBody = mapBodies[mapReferenceIndex];

    if (mapZoomed) {
      const l1 = frame ? frame.L1 : null;
      const l2 = frame ? frame.L2 : null;
      const spreadCandidates = [1];
      if (l1) spreadCandidates.push(Math.hypot(l1.x - focusBody.x, l1.y - focusBody.y));
      if (l2) spreadCandidates.push(Math.hypot(l2.x - focusBody.x, l2.y - focusBody.y));
      spreadCandidates.push(Math.hypot(zero.x - focusBody.x, zero.y - focusBody.y));
      const spread = Math.max(...spreadCandidates);
      return { center: { x: focusBody.x, y: focusBody.y }, radius: spread * 2.4, frame, zero, zoomed: true, focusBody };
    }

    const points = [a, b, zero];
    if (frame) points.push(frame.L1, frame.L2, frame.L3, frame.L4, frame.L5);
    const centerX = (Math.min(...points.map((p) => p.x)) + Math.max(...points.map((p) => p.x))) / 2;
    const centerY = (Math.min(...points.map((p) => p.y)) + Math.max(...points.map((p) => p.y))) / 2;
    const maxDist = Math.max(...points.map((p) => Math.hypot(p.x - centerX, p.y - centerY)), 1);
    return { center: { x: centerX, y: centerY }, radius: maxDist * 1.3, frame, zero, zoomed: false, focusBody };
  }

  function worldToPixel(view, p) {
    const scale = mapHalfSizePx() / view.radius;
    return {
      x: mapCanvas.width / 2 + (p.x - view.center.x) * scale,
      y: mapCanvas.height / 2 - (p.y - view.center.y) * scale,
    };
  }

  function pixelToWorld(view, px) {
    const scale = mapHalfSizePx() / view.radius;
    return {
      x: view.center.x + (px.x - mapCanvas.width / 2) / scale,
      y: view.center.y - (px.y - mapCanvas.height / 2) / scale,
    };
  }

  function drawArrow(ctx, x1, y1, x2, y2, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLength = 5;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }

  function drawFieldArrows(ctx, view, bodies) {
    const gridCount = 11;
    const margin = 40;
    for (let i = 0; i < gridCount; i += 1) {
      for (let j = 0; j < gridCount; j += 1) {
        const px = margin + (i / (gridCount - 1)) * (mapCanvas.width - 2 * margin);
        const py = margin + (j / (gridCount - 1)) * (mapCanvas.height - 2 * margin);
        const world = pixelToWorld(view, { x: px, y: py });
        const tooClose = bodies.some((b) => Math.hypot(world.x - b.x, world.y - b.y) < view.radius * 0.06);
        if (tooClose) continue;
        const field = GF.fieldVectorAt(bodies, world);
        if (field.magnitude === 0) continue;
        const dirX = field.x / field.magnitude;
        const dirY = -field.y / field.magnitude; // screen y is flipped
        const length = 9;
        drawArrow(ctx, px - (dirX * length) / 2, py - (dirY * length) / 2, px + (dirX * length) / 2, py + (dirY * length) / 2, ARROW_COLOR);
      }
    }
  }

  function drawEquipotentials(ctx, view, bodies) {
    [0.35, 0.6, 0.9].forEach((fraction) => {
      const samplePoint = { x: view.center.x + view.radius * fraction, y: view.center.y };
      const target = GF.potentialAt(bodies, samplePoint);
      const contour = GF.equipotentialContour(bodies, view.center, target, 72, { minR: view.radius * 0.02, maxR: view.radius * 4 });
      ctx.strokeStyle = CONTOUR_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      contour.forEach((p, i) => {
        const px = worldToPixel(view, p);
        if (i === 0) ctx.moveTo(px.x, px.y);
        else ctx.lineTo(px.x, px.y);
      });
      ctx.closePath();
      ctx.stroke();
    });
  }

  function effectiveColorForValue(t) {
    // t: 0 (deepest well) .. 1 (highest hill), clamped — blue (low/deep)
    // to amber (high/hill), the same blue/amber language as the mgh-vs-
    // exact comparison bars elsewhere on the site.
    const clamped = Math.max(0, Math.min(1, t));
    const r = Math.round(42 + clamped * (232 - 42));
    const g = Math.round(107 + clamped * (162 - 107));
    const b = Math.round(214 + clamped * (58 - 214));
    return `rgb(${r}, ${g}, ${b})`;
  }

  function drawEffectivePotentialHeatmap(ctx, view, frame) {
    const cells = 48;
    const cellSize = (2 * mapHalfSizePx()) / cells;
    const topValue = effectivePotentialAtWorldPoint(frame, frame.L4.x, frame.L4.y);
    const bottomValue = topValue * 2.4;
    for (let i = 0; i < cells; i += 1) {
      for (let j = 0; j < cells; j += 1) {
        const px = mapCanvas.width / 2 - mapHalfSizePx() + i * cellSize;
        const py = mapCanvas.height / 2 - mapHalfSizePx() + j * cellSize;
        const world = pixelToWorld(view, { x: px + cellSize / 2, y: py + cellSize / 2 });
        const value = effectivePotentialAtWorldPoint(frame, world.x, world.y);
        const t = (value - bottomValue) / (topValue - bottomValue);
        ctx.fillStyle = effectiveColorForValue(t);
        ctx.fillRect(px, py, cellSize + 0.5, cellSize + 0.5);
      }
    }
  }

  function drawBodyMarker(ctx, px, color, radiusPx, label) {
    ctx.beginPath();
    ctx.arc(px.x, px.y, radiusPx, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, px.x, px.y - radiusPx - 6);
  }

  function drawPointMarker(ctx, px, color, label, labelOffset) {
    ctx.beginPath();
    ctx.arc(px.x, px.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (label) {
      ctx.fillStyle = color;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, px.x, px.y + (labelOffset || -8));
    }
  }

  function renderMap() {
    const view = computeMapView();
    lastMapView = view;
    const [a, b] = mapBodies;

    mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);

    if (mapViewMode === 'field') {
      drawFieldArrows(mapCtx, view, mapBodies);
      drawEquipotentials(mapCtx, view, mapBodies);
    } else {
      drawEffectivePotentialHeatmap(mapCtx, view, view.frame);
    }

    drawBodyMarker(mapCtx, worldToPixel(view, a), a.color, a.pxRadius, a.label);
    drawBodyMarker(mapCtx, worldToPixel(view, b), b.color, b.pxRadius, b.label);
    drawPointMarker(mapCtx, worldToPixel(view, view.zero), ZERO_POINT_COLOR, 'zero field');

    if (view.frame) {
      drawPointMarker(mapCtx, worldToPixel(view, view.frame.L1), LAGRANGE_COLOR, 'L1', 14);
      drawPointMarker(mapCtx, worldToPixel(view, view.frame.L2), LAGRANGE_COLOR, 'L2', 14);
      drawPointMarker(mapCtx, worldToPixel(view, view.frame.L3), LAGRANGE_COLOR, 'L3', 14);
      drawPointMarker(mapCtx, worldToPixel(view, view.frame.L4), LAGRANGE_COLOR, 'L4', -10);
      drawPointMarker(mapCtx, worldToPixel(view, view.frame.L5), LAGRANGE_COLOR, 'L5', 14);
    }

    if (view.zoomed) {
      mapCtx.fillStyle = '#8a2d22';
      mapCtx.font = 'bold 12px sans-serif';
      mapCtx.textAlign = 'left';
      mapCtx.fillText('Not to scale — zoomed in', 10, 18);
    }

    updateMapReadouts(view);
  }

  function updateMapReadouts(view) {
    const [a, b] = mapBodies;
    const separation = Math.hypot(b.x - a.x, b.y - a.y);
    const reference = view.focusBody.label;
    mapSeparationReadout.textContent = formatDistance(separation);
    mapZeroFieldReference.textContent = reference;
    mapZeroFieldReadout.textContent = formatDistance(Math.hypot(view.zero.x - view.focusBody.x, view.zero.y - view.focusBody.y));

    if (view.frame) {
      mapLagrangeRow.hidden = false;
      mapL1Reference.textContent = reference;
      mapL1Readout.textContent = formatDistance(Math.hypot(view.frame.L1.x - view.focusBody.x, view.frame.L1.y - view.focusBody.y));
    } else {
      mapLagrangeRow.hidden = true;
    }

    if (view.zoomed) {
      const otherBody = view.focusBody === a ? b : a;
      zoomNote.hidden = false;
      zoomNote.textContent = `Zoomed in near ${view.focusBody.label} — distances within this view are real, but ${otherBody.label} itself (${formatDistance(Math.hypot(otherBody.x - view.focusBody.x, otherBody.y - view.focusBody.y))} away) is off-canvas at this zoom level, not drawn to the same scale as everything shown here.`;
    } else {
      zoomNote.hidden = true;
    }
  }

  function applyMapPreset(name) {
    mapCurrentPreset = name;
    mapZoomed = false;
    zoomToggleButton.setAttribute('aria-pressed', 'false');

    if (name === 'earth-moon') {
      mapBodies = [
        { mass: M_EARTH, x: 0, y: 0, color: EARTH_COLOR, pxRadius: 12, label: 'Earth' },
        { mass: M_MOON, x: EARTH_MOON_DISTANCE, y: 0, color: MOON_COLOR, pxRadius: 6, label: 'Moon' },
      ];
      mapViewMode = 'effective';
      mapReferenceIndex = 0; // Earth
    } else if (name === 'sun-earth') {
      mapBodies = [
        { mass: M_SUN, x: 0, y: 0, color: SUN_COLOR, pxRadius: 16, label: 'Sun' },
        { mass: M_EARTH, x: SUN_EARTH_DISTANCE, y: 0, color: EARTH_COLOR, pxRadius: 6, label: 'Earth' },
      ];
      mapViewMode = 'effective';
      mapReferenceIndex = 1; // Earth
      mapZoomed = true;
      zoomToggleButton.setAttribute('aria-pressed', 'true');
    } else {
      mapBodies = [
        { mass: 5e24, x: 0, y: 0, color: BODY_A_COLOR, pxRadius: 10, label: 'Body A' },
        { mass: 5e24, x: 4e8, y: 0, color: BODY_B_COLOR, pxRadius: 10, label: 'Body B' },
      ];
      mapViewMode = 'field';
      mapReferenceIndex = 0; // arbitrary — the two masses are identical
    }

    viewModeFieldButton.setAttribute('aria-pressed', String(mapViewMode === 'field'));
    viewModeEffectiveButton.setAttribute('aria-pressed', String(mapViewMode === 'effective'));
    bodyADot.style.background = mapBodies[0].color;
    bodyALabel.textContent = mapBodies[0].label;
    bodyBDot.style.background = mapBodies[1].color;
    bodyBLabel.textContent = mapBodies[1].label;
    zoomToggleButton.textContent = `Zoom in near ${mapBodies[mapReferenceIndex].label} (not to scale)`;
    presetButtons.forEach((btn) => btn.classList.toggle('preset-button-active', btn.dataset.mapPreset === name));
    renderMap();
  }

  presetButtons.forEach((button) => {
    button.addEventListener('click', () => applyMapPreset(button.dataset.mapPreset));
  });

  viewModeFieldButton.addEventListener('click', () => {
    mapViewMode = 'field';
    viewModeFieldButton.setAttribute('aria-pressed', 'true');
    viewModeEffectiveButton.setAttribute('aria-pressed', 'false');
    renderMap();
  });
  viewModeEffectiveButton.addEventListener('click', () => {
    mapViewMode = 'effective';
    viewModeFieldButton.setAttribute('aria-pressed', 'false');
    viewModeEffectiveButton.setAttribute('aria-pressed', 'true');
    renderMap();
  });

  zoomToggleButton.addEventListener('click', () => {
    mapZoomed = !mapZoomed;
    zoomToggleButton.setAttribute('aria-pressed', String(mapZoomed));
    renderMap();
  });

  // --- Dragging the two masses ----------------------------------------------

  function mapPixelFromEvent(evt) {
    const rect = mapCanvas.getBoundingClientRect();
    const scaleX = mapCanvas.width / rect.width;
    const scaleY = mapCanvas.height / rect.height;
    return { x: (evt.clientX - rect.left) * scaleX, y: (evt.clientY - rect.top) * scaleY };
  }

  let dragBodyIndex = -1;
  let dragView = null;
  const HIT_RADIUS_PX = 20;

  mapCanvas.addEventListener('pointerdown', (evt) => {
    if (!lastMapView) return;
    const pos = mapPixelFromEvent(evt);
    dragBodyIndex = mapBodies.findIndex((body) => {
      const px = worldToPixel(lastMapView, body);
      return Math.hypot(px.x - pos.x, px.y - pos.y) < HIT_RADIUS_PX;
    });
    if (dragBodyIndex === -1) return;
    dragView = lastMapView;
    mapCanvas.setPointerCapture(evt.pointerId);
  });
  mapCanvas.addEventListener('pointermove', (evt) => {
    if (dragBodyIndex === -1 || !dragView) return;
    const pos = mapPixelFromEvent(evt);
    const world = pixelToWorld(dragView, pos);
    mapBodies[dragBodyIndex].x = world.x;
    mapBodies[dragBodyIndex].y = world.y;
    renderMap();
  });
  mapCanvas.addEventListener('pointerup', () => {
    dragBodyIndex = -1;
    dragView = null;
  });
  mapCanvas.addEventListener('pointercancel', () => {
    dragBodyIndex = -1;
    dragView = null;
  });

  // --- Widget 2: mass-ratio explorer ----------------------------------------

  const ratioCanvas = document.getElementById('ratio-view');
  const ratioCtx = ratioCanvas.getContext('2d');
  const ratioSlider = document.getElementById('mass-ratio-slider');
  const ratioLabel = document.getElementById('mass-ratio-label');
  const ratioThresholdReadout = document.getElementById('ratio-threshold-readout');
  const ratioStabilityBadge = document.getElementById('ratio-stability-badge');
  const ratioThresholdMark = document.getElementById('mass-ratio-threshold-mark');

  const RATIO_BIG_MASS = M_EARTH;
  const RATIO_SEPARATION = EARTH_MOON_DISTANCE;
  const STABILITY_THRESHOLD = GF.lagrangeStabilityMassRatioThreshold();

  function renderRatioExplorer() {
    const ratio = Number(ratioSlider.value);
    const smallMass = RATIO_BIG_MASS / ratio;
    const bodyBig = { mass: RATIO_BIG_MASS, x: 0, y: 0 };
    const bodySmall = { mass: smallMass, x: RATIO_SEPARATION, y: 0 };
    const frame = computeRotatingFrame(bodyBig, bodySmall);

    const points = [bodyBig, bodySmall, frame.L1, frame.L2, frame.L3, frame.L4, frame.L5];
    const centerX = (Math.min(...points.map((p) => p.x)) + Math.max(...points.map((p) => p.x))) / 2;
    const centerY = (Math.min(...points.map((p) => p.y)) + Math.max(...points.map((p) => p.y))) / 2;
    const maxDist = Math.max(...points.map((p) => Math.hypot(p.x - centerX, p.y - centerY)), 1);
    const view = { center: { x: centerX, y: centerY }, radius: maxDist * 1.3 };

    function toPixel(p) {
      const halfSize = Math.min(ratioCanvas.width, ratioCanvas.height) / 2 - MAP_MARGIN_PX;
      const scale = halfSize / view.radius;
      return {
        x: ratioCanvas.width / 2 + (p.x - view.center.x) * scale,
        y: ratioCanvas.height / 2 - (p.y - view.center.y) * scale,
      };
    }

    ratioCtx.clearRect(0, 0, ratioCanvas.width, ratioCanvas.height);

    const cells = 44;
    const halfSize = Math.min(ratioCanvas.width, ratioCanvas.height) / 2 - MAP_MARGIN_PX;
    const scale = halfSize / view.radius;
    const cellSize = (2 * halfSize) / cells;
    const topValue = effectivePotentialAtWorldPoint(frame, frame.L4.x, frame.L4.y);
    const bottomValue = topValue * 2.4;
    for (let i = 0; i < cells; i += 1) {
      for (let j = 0; j < cells; j += 1) {
        const px = ratioCanvas.width / 2 - halfSize + i * cellSize;
        const py = ratioCanvas.height / 2 - halfSize + j * cellSize;
        const worldX = view.center.x + (px + cellSize / 2 - ratioCanvas.width / 2) / scale;
        const worldY = view.center.y - (py + cellSize / 2 - ratioCanvas.height / 2) / scale;
        const value = effectivePotentialAtWorldPoint(frame, worldX, worldY);
        const t = (value - bottomValue) / (topValue - bottomValue);
        ratioCtx.fillStyle = effectiveColorForValue(t);
        ratioCtx.fillRect(px, py, cellSize + 0.5, cellSize + 0.5);
      }
    }

    drawBodyMarker(ratioCtx, toPixel(bodyBig), BODY_A_COLOR, 12, 'Larger');
    drawBodyMarker(ratioCtx, toPixel(bodySmall), BODY_B_COLOR, 6, 'Smaller');
    drawPointMarker(ratioCtx, toPixel(frame.L1), LAGRANGE_COLOR, 'L1', 14);
    drawPointMarker(ratioCtx, toPixel(frame.L2), LAGRANGE_COLOR, 'L2', 14);
    drawPointMarker(ratioCtx, toPixel(frame.L3), LAGRANGE_COLOR, 'L3', 14);

    const stable = GF.isEquilateralPointStable(RATIO_BIG_MASS, smallMass);
    const stabilityWord = stable ? 'stable' : 'unstable';
    [frame.L4, frame.L5].forEach((point, i) => {
      drawPointMarker(ratioCtx, toPixel(point), LAGRANGE_COLOR, `L${i === 0 ? 4 : 5} (${stabilityWord})`, i === 0 ? -10 : 14);
    });

    ratioLabel.textContent = `${ratio}:1`;
    ratioThresholdReadout.textContent = `${STABILITY_THRESHOLD.toFixed(1)} : 1`;
    ratioStabilityBadge.textContent = stable ? 'Stable' : 'Unstable';
    ratioStabilityBadge.dataset.stability = stable ? 'stable' : 'unstable';
  }

  ratioSlider.addEventListener('input', renderRatioExplorer);
  ratioThresholdMark.value = Math.round(STABILITY_THRESHOLD);

  // --- Coverage and questions -----------------------------------------------

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  applyMapPreset('earth-moon');
  renderRatioExplorer();
  renderCoverage();
  QuizUI.mount(GravityFieldMapQuestions.makeQuestions(GF, OM, Tides));
})();
