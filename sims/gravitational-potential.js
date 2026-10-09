(function () {
  const CURRICULUM_UNITS = ['u3.26', 'u3.27'];
  const OM = OrbitalMechanics;
  const GF = GravityField;

  const M = OM.EARTH_MASS_KG;
  const R = OM.EARTH_RADIUS_M;

  const EARTH_COLOR = '#2a6bd6';
  const MASS_COLOR = '#c0392b';
  const MOON_COLOR = '#8a97a5';
  const CURVE_COLOR = '#3a3f4d';
  const SHADE_COLOR = 'rgba(42, 107, 214, 0.22)';
  const POSITIVE_COLOR = '#2fae4e';
  const NEGATIVE_COLOR = '#e07b1f';
  const NEUTRAL_COLOR = '#555';

  function drawArrow(ctx, x1, y1, x2, y2, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 7;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  // --- 1. Who does the work? ------------------------------------------------

  const RELEASE_MIN_RADIUS = R * 2;
  const RELEASE_MAX_RADIUS = R * 1000;

  const fallCanvas = document.getElementById('fall-view');
  const fallCtx = fallCanvas.getContext('2d');
  const fallDiagramCaption = document.getElementById('fall-diagram-caption');
  const releaseDistanceSlider = document.getElementById('release-distance-slider');
  const releaseDistanceLabel = document.getElementById('release-distance-label');
  const fallProgressSlider = document.getElementById('fall-progress-slider');
  const fallProgressLabel = document.getElementById('fall-progress-label');
  const fallProgressCaptionText = document.getElementById('fall-progress-caption-text');
  const fallPlayButton = document.getElementById('fall-play-button');
  const fallRadiusReadout = document.getElementById('fall-radius-readout');
  const fallKeLabel = document.getElementById('fall-ke-label');
  const fallKeReadout = document.getElementById('fall-ke-readout');
  const fallPeReadout = document.getElementById('fall-pe-readout');
  const fallHandWorkRow = document.getElementById('fall-hand-work-row');
  const fallHandWorkReadout = document.getElementById('fall-hand-work-readout');
  const fallTotalEnergyRow = document.getElementById('fall-total-energy-row');
  const fallTotalEnergyReadout = document.getElementById('fall-total-energy-readout');
  const fallFieldWorkReadout = document.getElementById('fall-field-work-readout');
  const fallSecondBarLabel = document.getElementById('fall-second-bar-label');
  const fallAgentWorkReadout = document.getElementById('fall-agent-work-readout');
  const fallFieldBarFill = document.getElementById('fall-field-bar-fill');
  const fallAgentBarFill = document.getElementById('fall-agent-bar-fill');
  const fallModeFallButton = document.getElementById('fall-mode-fall-button');
  const fallModeLowerButton = document.getElementById('fall-mode-lower-button');
  const fallModeNote = document.getElementById('fall-mode-note');
  const lowerModeNote = document.getElementById('lower-mode-note');
  const fullLowerPanel = document.getElementById('full-lower-panel');
  const fullLowerWorkReadout = document.getElementById('full-lower-work-readout');
  const fullLowerFractionReadout = document.getElementById('full-lower-fraction-readout');

  let fallMode = 'fall';

  function releaseDistanceFromSlider() {
    const fraction = Number(releaseDistanceSlider.value) / 1000;
    return RELEASE_MIN_RADIUS * Math.pow(RELEASE_MAX_RADIUS / RELEASE_MIN_RADIUS, fraction);
  }

  function fallRadiusFromFraction(r0, fraction) {
    return r0 * Math.pow(R / r0, fraction);
  }

  function drawFall(fraction) {
    const width = fallCanvas.width;
    const height = fallCanvas.height;
    fallCtx.clearRect(0, 0, width, height);

    const topY = 80; // leaves room above the release point for the hand-force arrow, even at 0% fallen
    const planetY = height - 30;
    const planetRadius = 16;
    const cx = width / 2;

    fallCtx.strokeStyle = '#cdd7e1';
    fallCtx.setLineDash([4, 4]);
    fallCtx.beginPath();
    fallCtx.moveTo(cx, topY);
    fallCtx.lineTo(cx, planetY);
    fallCtx.stroke();
    fallCtx.setLineDash([]);

    fallCtx.fillStyle = '#888';
    fallCtx.font = '11px sans-serif';
    fallCtx.textAlign = 'center';
    fallCtx.fillText('release point', cx, topY - 6);

    fallCtx.beginPath();
    fallCtx.arc(cx, planetY, planetRadius, 0, Math.PI * 2);
    fallCtx.fillStyle = EARTH_COLOR;
    fallCtx.fill();
    fallCtx.fillStyle = '#fff';
    fallCtx.font = '10px sans-serif';
    fallCtx.fillText('planet', cx, planetY + 3);

    const travelTop = topY;
    const travelBottom = planetY - planetRadius - 10;
    const massY = travelTop + fraction * (travelBottom - travelTop);

    // A trail of ghost positions behind the mass — the two modes must
    // look clearly different, not just read different numbers: bunched
    // together then spreading out (speeding up) when it falls freely,
    // evenly spaced (constant speed) when it's lowered by hand.
    const trailOffsets = fallMode === 'fall' ? [0.015, 0.05, 0.11, 0.2] : [0.05, 0.1, 0.15, 0.2];
    trailOffsets.forEach((d, i) => {
      const f = Math.max(0, fraction - d);
      const y = travelTop + f * (travelBottom - travelTop);
      fallCtx.beginPath();
      fallCtx.arc(cx, y, 5 - i, 0, Math.PI * 2);
      fallCtx.fillStyle = `rgba(192,57,41,${0.32 - i * 0.06})`;
      fallCtx.fill();
    });

    fallCtx.beginPath();
    fallCtx.arc(cx, massY, 7, 0, Math.PI * 2);
    fallCtx.fillStyle = MASS_COLOR;
    fallCtx.fill();
    fallCtx.strokeStyle = '#7a2015';
    fallCtx.lineWidth = 1.5;
    fallCtx.stroke();

    // Displacement (neutral) and field force (green — same direction,
    // positive work) arrows, both inward/downward, every mode.
    const armX = 26;
    drawArrow(fallCtx, cx - armX, massY, cx - armX, massY + 30, NEUTRAL_COLOR);
    fallCtx.fillStyle = NEUTRAL_COLOR;
    fallCtx.font = '10px sans-serif';
    fallCtx.textAlign = 'center';
    fallCtx.fillText('displacement', cx - armX, massY + 44);

    drawArrow(fallCtx, cx + armX, massY, cx + armX, massY + 30, POSITIVE_COLOR);
    fallCtx.fillStyle = POSITIVE_COLOR;
    fallCtx.fillText('field force', cx + armX, massY + 44);

    // Hand force (orange — opposite direction, negative work): only in
    // "lower it slowly" mode, the one visible difference a screenshot
    // of each mode should show beyond the trail.
    if (fallMode === 'lower') {
      drawArrow(fallCtx, cx, massY - 16, cx, massY - 46, NEGATIVE_COLOR);
      fallCtx.fillStyle = NEGATIVE_COLOR;
      fallCtx.fillText('hand force', cx, massY - 54);
      fallCtx.font = '16px sans-serif';
      fallCtx.fillText('✋', cx, massY - 76);
    }
  }

  function updateFullLowerPanel(r0) {
    const fullHandWork = GF.workByExternalAgent(M, r0, R);
    const limit = -(OM.G * M) / R;
    const fraction = fullHandWork / limit;

    fullLowerWorkReadout.textContent = `${(fullHandWork / 1e6).toFixed(2)} MJ/kg`;
    fullLowerFractionReadout.textContent = `${(fraction * 100).toFixed(1)}%`;
  }

  function updateFall() {
    const r0 = releaseDistanceFromSlider();
    const maxFieldWork = GF.workByField(M, r0, R);
    const fraction = Number(fallProgressSlider.value) / 1000;
    const r = fallRadiusFromFraction(r0, fraction);

    const fieldWork = GF.workByField(M, r0, r);
    const agentWork = GF.workByExternalAgent(M, r0, r); // = -fieldWork = ΔPE, always
    const potentialAtRelease = GF.potentialEnergyPerMass(M, r0);
    const potentialAtR = GF.potentialEnergyPerMass(M, r);

    releaseDistanceLabel.textContent = `${(r0 / R).toFixed(1)} × Earth's radius`;
    fallProgressLabel.textContent = `${(fraction * 100).toFixed(0)}%`;
    fallRadiusReadout.textContent = `${(r / 1000).toFixed(0)} km (${(r / R).toFixed(1)} × Earth's radius)`;
    fallPeReadout.textContent = `${(agentWork / 1e6).toFixed(2)} MJ/kg`;
    fallFieldWorkReadout.textContent = `${(fieldWork / 1e6).toFixed(2)} MJ/kg`;
    fallAgentWorkReadout.textContent = `${(agentWork / 1e6).toFixed(2)} MJ/kg`;

    if (fallMode === 'fall') {
      // Released from rest: the work-energy theorem makes kinetic energy
      // gained exactly the field's own work, no agent involved at all.
      const speed = Math.sqrt(Math.max(0, 2 * fieldWork));
      const ke = GF.kineticEnergyPerMass(speed);
      fallKeReadout.textContent = `${(ke / 1e6).toFixed(2)} MJ/kg`;
      // KE(r) + V(r) = V(r0) always, for a mass released from rest at r0
      // and acted on by gravity alone — energy conservation, shown here
      // as a number that never changes as the slider moves.
      const total = ke + potentialAtR;
      fallTotalEnergyReadout.textContent = `${(total / 1e6).toFixed(2)} MJ/kg (= V at the release point, ${(potentialAtRelease / 1e6).toFixed(2)} MJ/kg)`;
    } else {
      // Constant speed the whole way: kinetic energy never builds up.
      fallKeReadout.textContent = '≈0 MJ/kg (constant speed)';
      fallHandWorkReadout.textContent = `${(agentWork / 1e6).toFixed(2)} MJ/kg`;
      updateFullLowerPanel(r0);
    }

    const barFraction = Math.min(1, fieldWork / maxFieldWork);
    fallFieldBarFill.style.height = `${barFraction * 50}%`;
    fallAgentBarFill.style.height = `${barFraction * 50}%`;

    fallDiagramCaption.textContent =
      fallMode === 'fall'
        ? 'Falling freely: speeding up — the trail bunches up, then spreads out.'
        : 'Lowered by hand: constant speed — the trail stays evenly spaced.';

    drawFall(fraction);
  }

  function setFallMode(nextMode) {
    fallMode = nextMode;
    const falling = fallMode === 'fall';
    fallModeFallButton.setAttribute('aria-pressed', String(falling));
    fallModeLowerButton.setAttribute('aria-pressed', String(!falling));
    fallKeLabel.textContent = falling ? 'Kinetic energy gained' : 'Kinetic energy';
    fallSecondBarLabel.textContent = falling ? 'Potential energy change' : 'Work done by the hand, from the release point';
    fallProgressCaptionText.textContent = falling ? 'Fallen so far' : 'Lowered so far';
    fallHandWorkRow.hidden = falling;
    fallTotalEnergyRow.hidden = !falling;
    fallModeNote.hidden = !falling;
    lowerModeNote.hidden = falling;
    fullLowerPanel.hidden = falling;
    updateFall();
  }

  fallModeFallButton.addEventListener('click', () => {
    if (fallMode !== 'fall') setFallMode('fall');
  });
  fallModeLowerButton.addEventListener('click', () => {
    if (fallMode !== 'lower') setFallMode('lower');
  });

  releaseDistanceSlider.addEventListener('input', () => {
    stopFallAnimation();
    fallProgressSlider.value = 0;
    updateFall();
  });

  fallProgressSlider.addEventListener('input', () => {
    stopFallAnimation();
    updateFall();
  });

  const FALL_ANIMATION_SECONDS = 6;
  let fallAnimationFrameId = null;
  let fallAnimationStart = null;

  function stopFallAnimation() {
    if (fallAnimationFrameId !== null) {
      cancelAnimationFrame(fallAnimationFrameId);
      fallAnimationFrameId = null;
    }
    fallAnimationStart = null;
    fallPlayButton.textContent = '▶ Animate';
    fallPlayButton.setAttribute('aria-pressed', 'false');
  }

  function startFallAnimation() {
    fallProgressSlider.value = 0;
    fallPlayButton.textContent = '❚❚ Pause';
    fallPlayButton.setAttribute('aria-pressed', 'true');
    function step(now) {
      if (fallAnimationStart === null) fallAnimationStart = now;
      let progress = (now - fallAnimationStart) / 1000 / FALL_ANIMATION_SECONDS;
      if (progress >= 1) {
        progress = 1;
        fallProgressSlider.value = 1000;
        updateFall();
        stopFallAnimation();
        return;
      }
      fallProgressSlider.value = Math.round(progress * 1000);
      updateFall();
      fallAnimationFrameId = requestAnimationFrame(step);
    }
    fallAnimationFrameId = requestAnimationFrame(step);
  }

  fallPlayButton.addEventListener('click', () => {
    if (fallAnimationFrameId !== null) stopFallAnimation();
    else startFallAnimation();
  });

  // --- 2. Equipotentials and energy cost ------------------------------------

  const EQUI_DELTA_V = 10e6; // 10 MJ/kg, the task's own default step
  const EQUI_RING_COUNT = 6;

  const equiCanvas = document.getElementById('equipotential-view');
  const equiCtx = equiCanvas.getContext('2d');
  const equiCaption = document.getElementById('equipotential-caption');
  const equiModeVButton = document.getElementById('equi-mode-v-button');
  const equiModeRButton = document.getElementById('equi-mode-r-button');
  const equiZigzagButton = document.getElementById('equi-zigzag-button');
  const equiAlongRingButton = document.getElementById('equi-along-ring-button');
  const equiPotentialReadout = document.getElementById('equi-potential-readout');
  const equiDeltaVReadout = document.getElementById('equi-deltav-readout');
  const equiCostStraightReadout = document.getElementById('equi-cost-straight-readout');
  const equiZigzagRow = document.getElementById('equi-zigzag-row');
  const equiCostZigzagReadout = document.getElementById('equi-cost-zigzag-readout');

  // i = 1..6 → V = -10, -20, ... -60 MJ/kg — deepest (most negative, i=6)
  // sits at the smallest radius.
  const equiVSteps = GF.equipotentialRadii(M, EQUI_DELTA_V, EQUI_RING_COUNT);
  const EQUI_INNER_R = equiVSteps[equiVSteps.length - 1].radius;
  const EQUI_OUTER_R = equiVSteps[0].radius;

  let equiRingMode = 'v';
  let equiShowZigzag = false;
  const equiStart = { x: EQUI_INNER_R, y: 0 };
  let equiCurrent = { x: 0, y: EQUI_OUTER_R * 0.6 };

  const EQUI_PLOT_RADIUS_PX = Math.min(equiCanvas.width, equiCanvas.height) / 2 - 34;
  const EQUI_PX_PER_M = EQUI_PLOT_RADIUS_PX / (EQUI_OUTER_R * 1.15);

  function equiRingRadii() {
    if (equiRingMode === 'v') {
      return equiVSteps.map((s) => ({ radius: s.radius, potential: s.potential }));
    }
    // Equal steps in r, spanning the same inner/outer boundary as the
    // equal-V set above, so the two modes are directly comparable.
    const steps = [];
    for (let i = 0; i < EQUI_RING_COUNT; i += 1) {
      const radius = EQUI_INNER_R + ((EQUI_OUTER_R - EQUI_INNER_R) * i) / (EQUI_RING_COUNT - 1);
      steps.push({ radius, potential: GF.potential(M, radius) });
    }
    return steps;
  }

  function equiToCanvas(p) {
    return { x: equiCanvas.width / 2 + p.x * EQUI_PX_PER_M, y: equiCanvas.height / 2 + p.y * EQUI_PX_PER_M };
  }

  function equiFromCanvas(cx, cy) {
    return { x: (cx - equiCanvas.width / 2) / EQUI_PX_PER_M, y: (cy - equiCanvas.height / 2) / EQUI_PX_PER_M };
  }

  function drawArrowHead(ctx, x, y, angle, color) {
    const len = 6;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - len * Math.cos(angle - Math.PI / 7), y - len * Math.sin(angle - Math.PI / 7));
    ctx.lineTo(x - len * Math.cos(angle + Math.PI / 7), y - len * Math.sin(angle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
  }

  function equiZigzagMidpoint() {
    const mx = (equiStart.x + equiCurrent.x) / 2;
    const my = (equiStart.y + equiCurrent.y) / 2;
    const dx = equiCurrent.x - equiStart.x;
    const dy = equiCurrent.y - equiStart.y;
    const len = Math.hypot(dx, dy) || 1;
    const offset = len * 0.35;
    return { x: mx + (-dy / len) * offset, y: my + (dx / len) * offset };
  }

  function drawEquipotentialView() {
    const ctx = equiCtx;
    const center = { x: equiCanvas.width / 2, y: equiCanvas.height / 2 };
    ctx.clearRect(0, 0, equiCanvas.width, equiCanvas.height);

    // Radial field lines, arrowheads pointing inward (the field always
    // pulls towards the planet).
    const lineCount = 8;
    for (let i = 0; i < lineCount; i += 1) {
      const theta = (i / lineCount) * Math.PI * 2;
      const outer = { x: center.x + Math.cos(theta) * EQUI_PLOT_RADIUS_PX, y: center.y + Math.sin(theta) * EQUI_PLOT_RADIUS_PX };
      const inner = { x: center.x + Math.cos(theta) * 18, y: center.y + Math.sin(theta) * 18 };
      ctx.strokeStyle = 'rgba(42,107,214,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(outer.x, outer.y);
      ctx.lineTo(inner.x, inner.y);
      ctx.stroke();
      const t = 0.55;
      drawArrowHead(ctx, outer.x + (inner.x - outer.x) * t, outer.y + (inner.y - outer.y) * t, Math.atan2(inner.y - outer.y, inner.x - outer.x), 'rgba(42,107,214,0.65)');
    }

    // Equipotential rings, each labelled with its (negative) potential —
    // labels fan out at a slightly different angle per ring so the
    // closely-spaced inner rings' labels don't overlap each other.
    equiRingRadii().forEach((ring, i) => {
      const rPx = ring.radius * EQUI_PX_PER_M;
      ctx.beginPath();
      ctx.arc(center.x, center.y, rPx, 0, Math.PI * 2);
      ctx.strokeStyle = '#8a97a5';
      ctx.lineWidth = 1;
      ctx.stroke();
      const labelAngle = -Math.PI / 2 + i * 0.38;
      const labelX = center.x + Math.cos(labelAngle) * rPx;
      const labelY = center.y + Math.sin(labelAngle) * rPx - 4;
      ctx.fillStyle = '#555';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${(ring.potential / 1e6).toFixed(0)} MJ/kg`, labelX, labelY);
    });

    // Planet.
    ctx.beginPath();
    ctx.arc(center.x, center.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = EARTH_COLOR;
    ctx.fill();

    // Fixed start point.
    const startPx = equiToCanvas(equiStart);
    ctx.beginPath();
    ctx.arc(startPx.x, startPx.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#8a97a5';
    ctx.fill();
    ctx.fillStyle = '#555';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('start', startPx.x + 8, startPx.y + 3);

    // The path actually being costed: straight by default, zigzag when toggled on.
    if (equiShowZigzag) {
      const mid = equiZigzagMidpoint();
      [equiStart, mid, equiCurrent].forEach((p, i, arr) => {
        if (i === 0) return;
        const a = equiToCanvas(arr[i - 1]);
        const b = equiToCanvas(p);
        ctx.strokeStyle = '#7b2ff7';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    } else {
      const a = equiToCanvas(equiStart);
      const b = equiToCanvas(equiCurrent);
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // The draggable mass.
    const curPx = equiToCanvas(equiCurrent);
    ctx.beginPath();
    ctx.arc(curPx.x, curPx.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = MASS_COLOR;
    ctx.fill();
    ctx.strokeStyle = '#7a2015';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function equiClampPoint(p) {
    const r = Math.hypot(p.x, p.y) || 1;
    const minR = EQUI_INNER_R * 0.9;
    const maxR = EQUI_OUTER_R * 1.3;
    const clampedR = Math.min(maxR, Math.max(minR, r));
    const scale = clampedR / r;
    return { x: p.x * scale, y: p.y * scale };
  }

  function updateEquipotentialReadouts() {
    const rCurrent = Math.hypot(equiCurrent.x, equiCurrent.y);
    const rStart = Math.hypot(equiStart.x, equiStart.y);
    const vCurrent = GF.potential(M, rCurrent);
    const vStart = GF.potential(M, rStart);
    const deltaV = vCurrent - vStart;
    const costStraight = GF.workAlongPath(M, 1, [equiStart, equiCurrent]);

    equiPotentialReadout.textContent = `${(vCurrent / 1e6).toFixed(2)} MJ/kg`;
    equiDeltaVReadout.textContent = `${(deltaV / 1e6).toFixed(2)} MJ/kg`;
    equiCostStraightReadout.textContent = `${(costStraight / 1e6).toFixed(2)} MJ/kg`;

    if (equiShowZigzag) {
      const mid = equiZigzagMidpoint();
      const costZigzag = GF.workAlongPath(M, 1, [equiStart, mid, equiCurrent]);
      equiCostZigzagReadout.textContent = `${(costZigzag / 1e6).toFixed(2)} MJ/kg`;
    }

    drawEquipotentialView();
  }

  equiModeVButton.addEventListener('click', () => {
    equiRingMode = 'v';
    equiModeVButton.setAttribute('aria-pressed', 'true');
    equiModeRButton.setAttribute('aria-pressed', 'false');
    drawEquipotentialView();
  });
  equiModeRButton.addEventListener('click', () => {
    equiRingMode = 'r';
    equiModeVButton.setAttribute('aria-pressed', 'false');
    equiModeRButton.setAttribute('aria-pressed', 'true');
    drawEquipotentialView();
  });

  equiZigzagButton.addEventListener('click', () => {
    equiShowZigzag = !equiShowZigzag;
    equiZigzagButton.setAttribute('aria-pressed', String(equiShowZigzag));
    equiZigzagRow.hidden = !equiShowZigzag;
    updateEquipotentialReadouts();
  });

  equiAlongRingButton.addEventListener('click', () => {
    const r = Math.hypot(equiCurrent.x, equiCurrent.y);
    const theta = Math.atan2(equiCurrent.y, equiCurrent.x) + Math.PI * (50 / 180);
    equiCurrent = { x: r * Math.cos(theta), y: r * Math.sin(theta) };
    updateEquipotentialReadouts();
  });

  let equiDragging = false;
  function equiApplyPointer(evt) {
    const rect = equiCanvas.getBoundingClientRect();
    const scaleX = equiCanvas.width / rect.width;
    const scaleY = equiCanvas.height / rect.height;
    const cx = (evt.clientX - rect.left) * scaleX;
    const cy = (evt.clientY - rect.top) * scaleY;
    equiCurrent = equiClampPoint(equiFromCanvas(cx, cy));
    updateEquipotentialReadouts();
  }
  equiCanvas.addEventListener('pointerdown', (evt) => {
    equiDragging = true;
    equiCanvas.setPointerCapture(evt.pointerId);
    equiApplyPointer(evt);
  });
  equiCanvas.addEventListener('pointermove', (evt) => {
    if (!equiDragging) return;
    equiApplyPointer(evt);
  });
  equiCanvas.addEventListener('pointerup', () => {
    equiDragging = false;
  });
  equiCanvas.addEventListener('pointercancel', () => {
    equiDragging = false;
  });

  equiCaption.textContent = 'Drag the red mass between the rings.';

  // --- 3. Four graphs, all below zero ---------------------------------------

  const GRAPHS_TEST_MASS = 2000; // kg — F and U are shown for this test mass; g and V are per-unit-mass
  const GRAPHS_R_MIN = R;
  const GRAPHS_R_MAX = R * 6;
  const GRAPHS_MARGIN = { left: 70, right: 20 };
  const GRAPHS_BAND_HEIGHT = 115;
  const GRAPHS_BAND_GAP = 20;

  const fourGraphsCanvas = document.getElementById('four-graphs-view');
  const fourGraphsCtx = fourGraphsCanvas.getContext('2d');
  const graphsRSlider = document.getElementById('graphs-r-slider');
  const graphsRLabel = document.getElementById('graphs-r-label');
  const graphsFReadout = document.getElementById('graphs-f-readout');
  const graphsGReadout = document.getElementById('graphs-g-readout');
  const graphsVReadout = document.getElementById('graphs-v-readout');
  const graphsUReadout = document.getElementById('graphs-u-readout');
  const graphsFDirection = document.getElementById('graphs-f-direction');
  const graphsGDirection = document.getElementById('graphs-g-direction');
  const graphsR1Slider = document.getElementById('graphs-r1-slider');
  const graphsR2Slider = document.getElementById('graphs-r2-slider');
  const graphsR1Label = document.getElementById('graphs-r1-label');
  const graphsR2Label = document.getElementById('graphs-r2-label');
  const graphsAreaReadout = document.getElementById('graphs-area-readout');
  const graphsDeltaVReadout = document.getElementById('graphs-deltav-readout');

  const GRAPH_BANDS = [
    { key: 'f', label: 'F (kN)', fn: (r) => GF.radialForce(M, GRAPHS_TEST_MASS, r) },
    { key: 'g', label: 'g (m/s²)', fn: (r) => GF.radialField(M, r) },
    { key: 'v', label: 'V (MJ/kg)', fn: (r) => GF.potential(M, r) },
    { key: 'u', label: 'U (GJ)', fn: (r) => GF.potentialEnergy(M, GRAPHS_TEST_MASS, r) },
  ];

  function rFromGraphsSlider(value) {
    return (Number(value) / 10) * R;
  }

  function graphsXForR(r) {
    const plotWidth = fourGraphsCanvas.width - GRAPHS_MARGIN.left - GRAPHS_MARGIN.right;
    return GRAPHS_MARGIN.left + ((r - GRAPHS_R_MIN) / (GRAPHS_R_MAX - GRAPHS_R_MIN)) * plotWidth;
  }

  function drawFourGraphs(r, r1, r2) {
    const ctx = fourGraphsCtx;
    ctx.clearRect(0, 0, fourGraphsCanvas.width, fourGraphsCanvas.height);

    GRAPH_BANDS.forEach((band, bandIndex) => {
      const top = 10 + bandIndex * (GRAPHS_BAND_HEIGHT + GRAPHS_BAND_GAP);
      const minVal = band.fn(GRAPHS_R_MIN); // most negative, at the smallest radius
      const yForValue = (v) => top + (v / minVal) * (GRAPHS_BAND_HEIGHT - 10);

      ctx.strokeStyle = '#999';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(GRAPHS_MARGIN.left, top);
      ctx.lineTo(fourGraphsCanvas.width - GRAPHS_MARGIN.right, top);
      ctx.stroke();
      ctx.setLineDash([]);

      // The g band also shows the shaded (signed) area between r1 and r2.
      if (band.key === 'g') {
        const lo = Math.min(r1, r2);
        const hi = Math.max(r1, r2);
        ctx.beginPath();
        ctx.moveTo(graphsXForR(lo), top);
        const shadeSteps = 60;
        for (let s = 0; s <= shadeSteps; s += 1) {
          const rr = lo + ((hi - lo) * s) / shadeSteps;
          ctx.lineTo(graphsXForR(rr), yForValue(band.fn(rr)));
        }
        ctx.lineTo(graphsXForR(hi), top);
        ctx.closePath();
        ctx.fillStyle = SHADE_COLOR;
        ctx.fill();
      }

      ctx.beginPath();
      const steps = 120;
      for (let s = 0; s <= steps; s += 1) {
        const rr = GRAPHS_R_MIN + ((GRAPHS_R_MAX - GRAPHS_R_MIN) * s) / steps;
        const x = graphsXForR(rr);
        const y = yForValue(band.fn(rr));
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = CURVE_COLOR;
      ctx.lineWidth = 2;
      ctx.stroke();

      const mx = graphsXForR(r);
      const my = yForValue(band.fn(r));
      ctx.beginPath();
      ctx.arc(mx, my, 5, 0, Math.PI * 2);
      ctx.fillStyle = MASS_COLOR;
      ctx.fill();

      ctx.fillStyle = '#555';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(band.label, 6, top + 10);
    });

    ctx.fillStyle = '#555';
    ctx.textAlign = 'center';
    ctx.font = '11px sans-serif';
    ctx.fillText('Radius, r (all four graphs share this axis)', fourGraphsCanvas.width / 2, fourGraphsCanvas.height - 4);
  }

  function updateFourGraphs() {
    const r = rFromGraphsSlider(graphsRSlider.value);
    const r1 = rFromGraphsSlider(graphsR1Slider.value);
    const r2 = rFromGraphsSlider(graphsR2Slider.value);
    const lo = Math.min(r1, r2);
    const hi = Math.max(r1, r2);

    graphsRLabel.textContent = `${(r / R).toFixed(1)} × R`;
    graphsR1Label.textContent = `${(r1 / R).toFixed(1)} × R`;
    graphsR2Label.textContent = `${(r2 / R).toFixed(1)} × R`;

    graphsFReadout.textContent = `${(GF.radialForce(M, GRAPHS_TEST_MASS, r) / 1e3).toFixed(2)} kN`;
    graphsGReadout.textContent = `${GF.radialField(M, r).toFixed(2)} m/s²`;
    graphsVReadout.textContent = `${(GF.potential(M, r) / 1e6).toFixed(2)} MJ/kg`;
    graphsUReadout.textContent = `${(GF.potentialEnergy(M, GRAPHS_TEST_MASS, r) / 1e9).toFixed(2)} GJ`;
    graphsFDirection.textContent = '(points inward)';
    graphsGDirection.textContent = '(points inward)';

    // ΔV from the engine directly; the shaded area is that same number,
    // sign-flipped — area = ∫g dr = -(V(r2) - V(r1)), the identity
    // test/gravityField.test.js checks directly.
    const deltaV = GF.potentialDifferenceNumerical(M, lo, hi);
    const area = -deltaV;
    graphsAreaReadout.textContent = `${(area / 1e6).toFixed(2)} MJ/kg`;
    graphsDeltaVReadout.textContent = `${(deltaV / 1e6).toFixed(2)} MJ/kg`;

    drawFourGraphs(r, r1, r2);
  }

  [graphsRSlider, graphsR1Slider, graphsR2Slider].forEach((el) => el.addEventListener('input', updateFourGraphs));

  // --- 4. mgh vs the exact formula -------------------------------------------

  const heightSlider = document.getElementById('height-slider');
  const heightLabel = document.getElementById('height-label');
  const exactDeltaUReadout = document.getElementById('exact-deltaU-readout');
  const mghReadout = document.getElementById('mgh-readout');
  const ratioReadout = document.getElementById('ratio-readout');
  const exactBarFill = document.getElementById('exact-bar-fill');
  const mghBarFill = document.getElementById('mgh-bar-fill');

  const G0 = GF.fieldMagnitude(M, R);

  function updateMghComparison() {
    const h = Number(heightSlider.value);
    const exactDeltaU = GF.potentialEnergyDifferenceNumerical(M, 1, R, R + h);
    const mgh = G0 * h;
    const ratio = exactDeltaU / mgh;

    heightLabel.textContent = h >= 1000 ? `${(h / 1000).toFixed(1)} km` : `${h.toFixed(0)} m`;
    exactDeltaUReadout.textContent = `${(exactDeltaU / 1e3).toFixed(1)} kJ/kg`;
    mghReadout.textContent = `${(mgh / 1e3).toFixed(1)} kJ/kg`;
    ratioReadout.textContent = ratio.toFixed(4);

    const maxVal = Math.max(exactDeltaU, mgh);
    exactBarFill.style.width = `${(exactDeltaU / maxVal) * 100}%`;
    mghBarFill.style.width = `${(mgh / maxVal) * 100}%`;
  }

  heightSlider.addEventListener('input', updateMghComparison);

  // --- 5. Between the Earth and the Moon ------------------------------------

  const EM_MOON_MASS = Tides.MOON_MASS_KG;
  const EM_SEPARATION_M = Tides.MOON_DISTANCE_KM * 1000;
  const EM_EARTH = { mass: M, x: 0, y: 0 };
  const EM_MOON = { mass: EM_MOON_MASS, x: EM_SEPARATION_M, y: 0 };
  const EM_BODIES = [EM_EARTH, EM_MOON];
  const EM_ZERO_FIELD = GF.zeroFieldPointBetween(EM_EARTH, EM_MOON);

  const emCanvas = document.getElementById('em-line-view');
  const emCtx = emCanvas.getContext('2d');
  const emDistanceReadout = document.getElementById('em-distance-readout');
  const emGEarthReadout = document.getElementById('em-g-earth-readout');
  const emGMoonReadout = document.getElementById('em-g-moon-readout');
  const emGTotalReadout = document.getElementById('em-g-total-readout');
  const emVReadout = document.getElementById('em-v-readout');
  const emFallsReadout = document.getElementById('em-falls-readout');

  // Earth's pull dominates almost the whole 384,400 km line (its mass is
  // about 81× the Moon's), so the crossing sits only in the outer ~10%
  // of the true distance — plotting the full span would squash the
  // interesting region to a sliver. All three bands instead share one
  // zoomed window around the crossing, with the strip showing Earth and
  // the Moon as off-screen directions rather than true-scale icons.
  const EM_X_MIN = 150000e3;
  const EM_X_MAX = 370000e3;
  let emX = EM_ZERO_FIELD.x; // starts balanced, right at the zero-field point

  const EM_PLOT_LEFT = 52;
  const EM_PLOT_RIGHT = 20;
  const EM_PLOT_WIDTH = emCanvas.width - EM_PLOT_LEFT - EM_PLOT_RIGHT;
  const EM_STRIP_TOP = 14;
  const EM_STRIP_HEIGHT = 60;
  const EM_G_TOP = EM_STRIP_TOP + EM_STRIP_HEIGHT + 34;
  const EM_G_HEIGHT = 190;
  const EM_V_TOP = EM_G_TOP + EM_G_HEIGHT + 44;
  const EM_V_HEIGHT = 190;
  const EM_G_CLIP = 0.025; // m/s² — display clip either side of zero
  const EM_V_CLIP_FLOOR = -3e6; // J/kg — display clip, deepest shown
  const EM_V_CLIP_CEIL = -0.6e6; // J/kg — display clip, shallowest shown

  function emXForM(xMeters) {
    return EM_PLOT_LEFT + ((xMeters - EM_X_MIN) / (EM_X_MAX - EM_X_MIN)) * EM_PLOT_WIDTH;
  }
  function emMFromPx(px) {
    return EM_X_MIN + ((px - EM_PLOT_LEFT) / EM_PLOT_WIDTH) * (EM_X_MAX - EM_X_MIN);
  }
  function emGToY(g) {
    const clipped = Math.max(-EM_G_CLIP, Math.min(EM_G_CLIP, g));
    return EM_G_TOP + EM_G_HEIGHT / 2 - (clipped / EM_G_CLIP) * (EM_G_HEIGHT / 2 - 8);
  }
  function emVToY(v) {
    const clipped = Math.max(EM_V_CLIP_FLOOR, Math.min(EM_V_CLIP_CEIL, v));
    const t = (clipped - EM_V_CLIP_FLOOR) / (EM_V_CLIP_CEIL - EM_V_CLIP_FLOOR);
    return EM_V_TOP + EM_V_HEIGHT - 8 - t * (EM_V_HEIGHT - 16);
  }

  function drawEmLine() {
    const ctx = emCtx;
    ctx.clearRect(0, 0, emCanvas.width, emCanvas.height);

    const stripY = EM_STRIP_TOP + EM_STRIP_HEIGHT / 2;
    const leftEdge = emXForM(EM_X_MIN);
    const rightEdge = emXForM(EM_X_MAX);
    ctx.strokeStyle = '#cdd7e1';
    ctx.beginPath();
    ctx.moveTo(leftEdge, stripY);
    ctx.lineTo(rightEdge, stripY);
    ctx.stroke();

    // Earth and the Moon sit off-screen in this zoomed window — shown as
    // directions, with their true distance from the window's edge.
    ctx.fillStyle = '#555';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`← Earth, ${(EM_X_MIN / 1000).toLocaleString()} km this way`, leftEdge, stripY - 14);
    ctx.textAlign = 'right';
    ctx.fillText(`Moon, ${((EM_SEPARATION_M - EM_X_MAX) / 1000).toLocaleString()} km this way →`, rightEdge, stripY - 14);
    drawArrow(ctx, leftEdge + 30, stripY, leftEdge + 4, stripY, EARTH_COLOR);
    drawArrow(ctx, rightEdge - 30, stripY, rightEdge - 4, stripY, MOON_COLOR);

    const massPx = emXForM(emX);
    const crossPx = emXForM(EM_ZERO_FIELD.x);

    ctx.strokeStyle = '#bbb';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(crossPx, EM_STRIP_TOP);
    ctx.lineTo(crossPx, EM_V_TOP + EM_V_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(massPx, stripY, 6, 0, Math.PI * 2);
    ctx.fillStyle = MASS_COLOR;
    ctx.fill();
    ctx.strokeStyle = '#7a2015';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // --- g band: Earth's own pull, the Moon's own pull, and the total ---
    ctx.fillStyle = '#555';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('g along the line (mm/s²)', EM_PLOT_LEFT, EM_G_TOP - 10);

    const zeroGY = emGToY(0);
    ctx.strokeStyle = '#999';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(EM_PLOT_LEFT, zeroGY);
    ctx.lineTo(emCanvas.width - EM_PLOT_RIGHT, zeroGY);
    ctx.stroke();
    ctx.setLineDash([]);

    function strokeCurve(fn, toY, color) {
      ctx.beginPath();
      const steps = 150;
      for (let s = 0; s <= steps; s += 1) {
        const x = EM_X_MIN + ((EM_X_MAX - EM_X_MIN) * s) / steps;
        const px = emXForM(x);
        const py = toY(fn(x));
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    strokeCurve((x) => GF.fieldVectorAt([EM_EARTH], { x, y: 0 }).x, emGToY, EARTH_COLOR);
    strokeCurve((x) => GF.fieldVectorAt([EM_MOON], { x, y: 0 }).x, emGToY, MOON_COLOR);
    strokeCurve((x) => GF.fieldAlongLine(EM_BODIES, [x])[0], emGToY, CURVE_COLOR);

    ctx.beginPath();
    ctx.arc(massPx, emGToY(GF.fieldAlongLine(EM_BODIES, [emX])[0]), 5, 0, Math.PI * 2);
    ctx.fillStyle = MASS_COLOR;
    ctx.fill();

    // --- V band: the potential, always negative, peaking at the crossing ---
    ctx.fillStyle = '#555';
    ctx.textAlign = 'left';
    ctx.fillText('V along the line (MJ/kg)', EM_PLOT_LEFT, EM_V_TOP - 10);

    strokeCurve((x) => GF.potentialAlongLine(EM_BODIES, [x])[0], emVToY, CURVE_COLOR);

    const peakV = GF.potentialAlongLine(EM_BODIES, [EM_ZERO_FIELD.x])[0];
    const peakY = emVToY(peakV);
    ctx.fillStyle = '#555';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('unstable equilibrium', crossPx, peakY - 10);

    ctx.beginPath();
    ctx.arc(massPx, emVToY(GF.potentialAlongLine(EM_BODIES, [emX])[0]), 5, 0, Math.PI * 2);
    ctx.fillStyle = MASS_COLOR;
    ctx.fill();
  }

  function updateEmLine() {
    const gEarth = GF.fieldVectorAt([EM_EARTH], { x: emX, y: 0 }).x;
    const gMoon = GF.fieldVectorAt([EM_MOON], { x: emX, y: 0 }).x;
    const gTotal = GF.fieldAlongLine(EM_BODIES, [emX])[0];
    const v = GF.potentialAlongLine(EM_BODIES, [emX])[0];

    emDistanceReadout.textContent = `${(emX / 1000).toFixed(0)} km`;
    emGEarthReadout.textContent = `${(gEarth * 1000).toFixed(2)} mm/s²`;
    emGMoonReadout.textContent = `${(gMoon * 1000).toFixed(2)} mm/s²`;
    emGTotalReadout.textContent = `${(gTotal * 1000).toFixed(3)} mm/s²`;
    emVReadout.textContent = `${(v / 1e6).toFixed(3)} MJ/kg`;

    const EM_BALANCE_TOLERANCE = 1e-5; // m/s² — effectively zero, for the "falls towards" readout
    if (Math.abs(gTotal) < EM_BALANCE_TOLERANCE) {
      emFallsReadout.textContent = 'neither — balanced here, but any nudge decides which way (unstable)';
    } else if (gTotal < 0) {
      emFallsReadout.textContent = 'Earth (total field here is negative — points towards Earth)';
    } else {
      emFallsReadout.textContent = 'the Moon (total field here is positive — points towards the Moon)';
    }

    drawEmLine();
  }

  let emDragging = false;
  function emApplyPointer(evt) {
    const rect = emCanvas.getBoundingClientRect();
    const scaleX = emCanvas.width / rect.width;
    const px = (evt.clientX - rect.left) * scaleX;
    const xMeters = emMFromPx(px);
    emX = Math.min(EM_X_MAX, Math.max(EM_X_MIN, xMeters));
    updateEmLine();
  }
  emCanvas.addEventListener('pointerdown', (evt) => {
    emDragging = true;
    emCanvas.setPointerCapture(evt.pointerId);
    emApplyPointer(evt);
  });
  emCanvas.addEventListener('pointermove', (evt) => {
    if (!emDragging) return;
    emApplyPointer(evt);
  });
  emCanvas.addEventListener('pointerup', () => {
    emDragging = false;
  });
  emCanvas.addEventListener('pointercancel', () => {
    emDragging = false;
  });

  // --- 6. Moving between orbits ----------------------------------------------

  const ORBIT_LOW_ALT_M = 400000;
  const ORBIT_GEO_RADIUS_M = 42164000;
  const ORBIT_GEO_ALT_M = ORBIT_GEO_RADIUS_M - R;
  const ORBIT_MIN_ALT_M = 200000;
  const ORBIT_MAX_ALT_M = 50000000; // 50,000 km — comfortably past geostationary
  const ORBIT1_COLOR = EARTH_COLOR;
  const ORBIT2_COLOR = MASS_COLOR;

  const orbitsCanvas = document.getElementById('orbits-view');
  const orbitsCtx = orbitsCanvas.getContext('2d');
  const orbitsVrCanvas = document.getElementById('orbits-vr-view');
  const orbitsVrCtx = orbitsVrCanvas.getContext('2d');
  const orbit1Slider = document.getElementById('orbit1-altitude-slider');
  const orbit2Slider = document.getElementById('orbit2-altitude-slider');
  const orbit1Label = document.getElementById('orbit1-altitude-label');
  const orbit2Label = document.getElementById('orbit2-altitude-label');
  const orbit1RadiusSpeedReadout = document.getElementById('orbit1-radius-speed-readout');
  const orbit2RadiusSpeedReadout = document.getElementById('orbit2-radius-speed-readout');
  const orbit1KeReadout = document.getElementById('orbit1-ke-readout');
  const orbit1PeReadout = document.getElementById('orbit1-pe-readout');
  const orbit1TotalReadout = document.getElementById('orbit1-total-readout');
  const orbit2KeReadout = document.getElementById('orbit2-ke-readout');
  const orbit2PeReadout = document.getElementById('orbit2-pe-readout');
  const orbit2TotalReadout = document.getElementById('orbit2-total-readout');
  const orbit1KeBarFill = document.getElementById('orbit1-ke-bar-fill');
  const orbit1PeBarFill = document.getElementById('orbit1-pe-bar-fill');
  const orbit1TotalBarFill = document.getElementById('orbit1-total-bar-fill');
  const orbit2KeBarFill = document.getElementById('orbit2-ke-bar-fill');
  const orbit2PeBarFill = document.getElementById('orbit2-pe-bar-fill');
  const orbit2TotalBarFill = document.getElementById('orbit2-total-bar-fill');
  const orbitChangeReadout = document.getElementById('orbit-change-readout');
  const orbitPresetButtons = document.querySelectorAll('[data-orbit][data-preset]');

  const ORBIT_SLIDER_STEPS = 10000; // fine enough that the presets land within a few km of their target
  function orbitAltitudeFromSlider(sliderEl) {
    const fraction = Number(sliderEl.value) / ORBIT_SLIDER_STEPS;
    return ORBIT_MIN_ALT_M * Math.pow(ORBIT_MAX_ALT_M / ORBIT_MIN_ALT_M, fraction);
  }
  function orbitSliderValueForAltitude(altitudeM) {
    const fraction = Math.log(altitudeM / ORBIT_MIN_ALT_M) / Math.log(ORBIT_MAX_ALT_M / ORBIT_MIN_ALT_M);
    return Math.round(Math.min(ORBIT_SLIDER_STEPS, Math.max(0, fraction * ORBIT_SLIDER_STEPS)));
  }

  const ORBIT_ENERGETICS_AT_MIN = GF.circularOrbitEnergetics(M, R + ORBIT_MIN_ALT_M);
  const ORBIT_KE_SCALE = ORBIT_ENERGETICS_AT_MIN.kinetic;
  const ORBIT_PE_SCALE = Math.abs(ORBIT_ENERGETICS_AT_MIN.potential);
  const ORBIT_TOTAL_SCALE = Math.abs(ORBIT_ENERGETICS_AT_MIN.total);

  const ORBITS_PLOT_RADIUS_PX = Math.min(orbitsCanvas.width, orbitsCanvas.height) / 2 - 20;

  function drawOrbitsDiagram(r1, r2) {
    const ctx = orbitsCtx;
    const cx = orbitsCanvas.width / 2;
    const cy = orbitsCanvas.height / 2;
    ctx.clearRect(0, 0, orbitsCanvas.width, orbitsCanvas.height);

    const pxPerM = ORBITS_PLOT_RADIUS_PX / (Math.max(r1, r2) * 1.1);

    // Earth is drawn at a fixed schematic size, not true scale — a true-
    // scale Earth would sit only ~1px inside a 400 km low orbit at this
    // zoomed-out, geostationary-spanning scale, making the low orbit's
    // own ring indistinguishable from Earth's own disk.
    const EARTH_DRAW_RADIUS_PX = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, EARTH_DRAW_RADIUS_PX, 0, Math.PI * 2);
    ctx.fillStyle = EARTH_COLOR;
    ctx.fill();

    [
      [r1, ORBIT1_COLOR, 'Orbit 1'],
      [r2, ORBIT2_COLOR, 'Orbit 2'],
    ].forEach(([r, color, label]) => {
      const rPx = r * pxPerM;
      ctx.beginPath();
      ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const markerX = cx + rPx;
      ctx.beginPath();
      ctx.arc(markerX, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = '#444';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(label, markerX + 8, cy + 3);
    });
  }

  const ORBITS_VR_MARGIN = { left: 55, right: 15, top: 15, bottom: 28 };
  const ORBITS_VR_R_MIN = R;
  const ORBITS_VR_R_MAX = ORBIT_GEO_RADIUS_M * 1.15;
  const ORBITS_VR_V_MIN = GF.potential(M, ORBITS_VR_R_MIN);

  function orbitsVrXForR(r) {
    const plotWidth = orbitsVrCanvas.width - ORBITS_VR_MARGIN.left - ORBITS_VR_MARGIN.right;
    return ORBITS_VR_MARGIN.left + ((r - ORBITS_VR_R_MIN) / (ORBITS_VR_R_MAX - ORBITS_VR_R_MIN)) * plotWidth;
  }
  function orbitsVrYForV(v) {
    const plotHeight = orbitsVrCanvas.height - ORBITS_VR_MARGIN.top - ORBITS_VR_MARGIN.bottom;
    return ORBITS_VR_MARGIN.top + (1 - v / ORBITS_VR_V_MIN) * plotHeight;
  }

  function drawOrbitsVr(r1, r2) {
    const ctx = orbitsVrCtx;
    ctx.clearRect(0, 0, orbitsVrCanvas.width, orbitsVrCanvas.height);

    const zeroY = orbitsVrYForV(0);
    ctx.strokeStyle = '#999';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(ORBITS_VR_MARGIN.left, zeroY);
    ctx.lineTo(orbitsVrCanvas.width - ORBITS_VR_MARGIN.right, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    const steps = 120;
    for (let s = 0; s <= steps; s += 1) {
      const r = ORBITS_VR_R_MIN + ((ORBITS_VR_R_MAX - ORBITS_VR_R_MIN) * s) / steps;
      const x = orbitsVrXForR(r);
      const y = orbitsVrYForV(GF.potential(M, r));
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = CURVE_COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();

    [
      [r1, ORBIT1_COLOR],
      [r2, ORBIT2_COLOR],
    ].forEach(([r, color]) => {
      const v = GF.potential(M, r);
      const total = (-OM.G * M) / (2 * r);
      const px = orbitsVrXForR(r);
      const vy = orbitsVrYForV(v);
      const ey = orbitsVrYForV(total);

      ctx.strokeStyle = color;
      ctx.setLineDash([5, 3]);
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(ORBITS_VR_MARGIN.left, ey);
      ctx.lineTo(px, ey);
      ctx.stroke();
      ctx.setLineDash([]);

      // The gap between the point (V, this orbit's potential energy) and
      // its horizontal total-energy line is exactly that orbit's kinetic
      // energy — the same idiom the escape well below uses.
      ctx.beginPath();
      ctx.moveTo(px, vy);
      ctx.lineTo(px, ey);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(px, vy, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    ctx.fillStyle = '#555';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('r', orbitsVrCanvas.width / 2, orbitsVrCanvas.height - 6);
  }

  function updateOrbits() {
    const alt1 = orbitAltitudeFromSlider(orbit1Slider);
    const alt2 = orbitAltitudeFromSlider(orbit2Slider);
    const r1 = R + alt1;
    const r2 = R + alt2;
    const e1 = GF.circularOrbitEnergetics(M, r1);
    const e2 = GF.circularOrbitEnergetics(M, r2);

    orbit1Label.textContent = `${(alt1 / 1000).toFixed(0)} km`;
    orbit2Label.textContent = `${(alt2 / 1000).toFixed(0)} km`;
    orbit1RadiusSpeedReadout.textContent = `${(r1 / 1000).toFixed(0)} km, ${(e1.speed / 1000).toFixed(2)} km/s`;
    orbit2RadiusSpeedReadout.textContent = `${(r2 / 1000).toFixed(0)} km, ${(e2.speed / 1000).toFixed(2)} km/s`;

    orbit1KeReadout.textContent = `${(e1.kinetic / 1e6).toFixed(2)} MJ/kg`;
    orbit1PeReadout.textContent = `${(e1.potential / 1e6).toFixed(2)} MJ/kg`;
    orbit1TotalReadout.textContent = `${(e1.total / 1e6).toFixed(2)} MJ/kg`;
    orbit2KeReadout.textContent = `${(e2.kinetic / 1e6).toFixed(2)} MJ/kg`;
    orbit2PeReadout.textContent = `${(e2.potential / 1e6).toFixed(2)} MJ/kg`;
    orbit2TotalReadout.textContent = `${(e2.total / 1e6).toFixed(2)} MJ/kg`;

    orbit1KeBarFill.style.height = `${Math.min(1, e1.kinetic / ORBIT_KE_SCALE) * 50}%`;
    orbit1PeBarFill.style.height = `${Math.min(1, Math.abs(e1.potential) / ORBIT_PE_SCALE) * 50}%`;
    orbit1TotalBarFill.style.height = `${Math.min(1, Math.abs(e1.total) / ORBIT_TOTAL_SCALE) * 50}%`;
    orbit2KeBarFill.style.height = `${Math.min(1, e2.kinetic / ORBIT_KE_SCALE) * 50}%`;
    orbit2PeBarFill.style.height = `${Math.min(1, Math.abs(e2.potential) / ORBIT_PE_SCALE) * 50}%`;
    orbit2TotalBarFill.style.height = `${Math.min(1, Math.abs(e2.total) / ORBIT_TOTAL_SCALE) * 50}%`;

    const deltaKe = e2.kinetic - e1.kinetic;
    const deltaPe = e2.potential - e1.potential;
    const deltaTotal = e2.total - e1.total;
    const sign = (v) => (v >= 0 ? '+' : '');
    orbitChangeReadout.textContent = `${sign(deltaKe)}${(deltaKe / 1e6).toFixed(2)} MJ/kg, ${sign(deltaPe)}${(deltaPe / 1e6).toFixed(2)} MJ/kg, ${sign(deltaTotal)}${(deltaTotal / 1e6).toFixed(2)} MJ/kg`;

    drawOrbitsDiagram(r1, r2);
    drawOrbitsVr(r1, r2);
  }

  [orbit1Slider, orbit2Slider].forEach((el) => el.addEventListener('input', updateOrbits));

  orbitPresetButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const slider = button.dataset.orbit === '1' ? orbit1Slider : orbit2Slider;
      const altitude = button.dataset.preset === 'low' ? ORBIT_LOW_ALT_M : ORBIT_GEO_ALT_M;
      slider.value = orbitSliderValueForAltitude(altitude);
      updateOrbits();
    });
  });

  // --- 7. Escape ---------------------------------------------------------

  const ESCAPE_R_MIN = R;
  const ESCAPE_R_MAX = R * 80;

  const escapeCanvas = document.getElementById('escape-well-view');
  const escapeCtx = escapeCanvas.getContext('2d');
  const escapeSpeedSlider = document.getElementById('escape-speed-slider');
  const escapeSpeedLabel = document.getElementById('escape-speed-label');
  const escapeKeReadout = document.getElementById('escape-ke-readout');
  const escapeTotalReadout = document.getElementById('escape-total-readout');
  const escapeTurningPointReadout = document.getElementById('escape-turning-point-readout');
  const escapeClassification = document.getElementById('escape-classification');
  const escapeSpeedMark = document.getElementById('escape-speed-mark');
  const escapeSpeedValueEl = document.getElementById('escape-speed-value');

  const ESCAPE_SPEED = GF.escapeSpeedFromEnergy(M, R);
  const ESCAPE_POTENTIAL = GF.potentialEnergyPerMass(M, R);
  const ESCAPE_SPEED_MAX = Number(escapeSpeedSlider.max);
  const ESCAPE_Y_MIN = ESCAPE_POTENTIAL * 1.08;
  const ESCAPE_Y_MAX = GF.totalEnergyPerMass(M, R, ESCAPE_SPEED_MAX) * 1.15;

  const CLASSIFICATION_TEXT = {
    bound: 'Bound — falls back (total energy negative)',
    parabolic: 'Just escaping — the marginal case (total energy ≈ zero)',
    hyperbolic: 'Escapes with speed to spare (total energy positive)',
  };

  const ESCAPE_MARGIN = { left: 58, right: 20, top: 15, bottom: 30 };

  function escapeXForR(r) {
    const plotWidth = escapeCanvas.width - ESCAPE_MARGIN.left - ESCAPE_MARGIN.right;
    const t = Math.log(r / ESCAPE_R_MIN) / Math.log(ESCAPE_R_MAX / ESCAPE_R_MIN);
    return ESCAPE_MARGIN.left + t * plotWidth;
  }
  function escapeYForEnergy(e) {
    const plotHeight = escapeCanvas.height - ESCAPE_MARGIN.top - ESCAPE_MARGIN.bottom;
    const t = (e - ESCAPE_Y_MIN) / (ESCAPE_Y_MAX - ESCAPE_Y_MIN);
    return ESCAPE_MARGIN.top + (1 - t) * plotHeight;
  }

  function drawEscapeWell(speed) {
    const ctx = escapeCtx;
    ctx.clearRect(0, 0, escapeCanvas.width, escapeCanvas.height);

    const zeroY = escapeYForEnergy(0);
    ctx.strokeStyle = '#999';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(ESCAPE_MARGIN.left, zeroY);
    ctx.lineTo(escapeCanvas.width - ESCAPE_MARGIN.right, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#999';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('E = 0 — just escapes', ESCAPE_MARGIN.left + 4, zeroY - 4);

    ctx.beginPath();
    const steps = 150;
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      const r = ESCAPE_R_MIN * Math.pow(ESCAPE_R_MAX / ESCAPE_R_MIN, t);
      const x = escapeXForR(r);
      const y = escapeYForEnergy(GF.potential(M, r));
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = CURVE_COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();

    const total = GF.totalEnergyPerMass(M, R, speed);
    const classification = GF.classifyOrbit(total, ESCAPE_POTENTIAL);
    const lineColor = classification === 'bound' ? NEGATIVE_COLOR : classification === 'hyperbolic' ? POSITIVE_COLOR : NEUTRAL_COLOR;
    const rTurnExact = classification === 'bound' ? (-OM.G * M) / total : null;
    const turningPointOffChart = classification === 'bound' && rTurnExact > ESCAPE_R_MAX;

    const surfaceX = escapeXForR(R);
    const surfaceVY = escapeYForEnergy(GF.potential(M, R));
    const lineY = escapeYForEnergy(total);
    const endX = classification === 'bound' && !turningPointOffChart ? escapeXForR(rTurnExact) : escapeCanvas.width - ESCAPE_MARGIN.right;

    ctx.strokeStyle = lineColor;
    ctx.setLineDash([5, 3]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(surfaceX, lineY);
    ctx.lineTo(endX, lineY);
    ctx.stroke();
    ctx.setLineDash([]);

    // KE gap at the surface — the vertical distance between the well
    // (potential energy) and the total-energy line.
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(surfaceX, surfaceVY);
    ctx.lineTo(surfaceX, lineY);
    ctx.stroke();

    ctx.font = '10px sans-serif';
    if (classification === 'bound' && !turningPointOffChart) {
      ctx.beginPath();
      ctx.arc(endX, lineY, 5, 0, Math.PI * 2);
      ctx.fillStyle = lineColor;
      ctx.fill();
      ctx.fillStyle = '#444';
      ctx.textAlign = 'center';
      ctx.fillText('highest point reached', endX, lineY - 10);
    } else if (classification === 'bound' && turningPointOffChart) {
      ctx.fillStyle = '#444';
      ctx.textAlign = 'right';
      ctx.fillText('turning point beyond this chart', escapeCanvas.width - ESCAPE_MARGIN.right, lineY - 8);
    } else {
      ctx.beginPath();
      ctx.moveTo(endX - 10, lineY - 6);
      ctx.lineTo(endX, lineY);
      ctx.lineTo(endX - 10, lineY + 6);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#444';
      ctx.textAlign = 'right';
      ctx.fillText('escapes →', endX - 2, lineY - 10);
    }

    ctx.beginPath();
    ctx.arc(surfaceX, surfaceVY, 5, 0, Math.PI * 2);
    ctx.fillStyle = MASS_COLOR;
    ctx.fill();

    ctx.fillStyle = '#555';
    ctx.textAlign = 'center';
    ctx.fillText('r (log scale)', escapeCanvas.width / 2, escapeCanvas.height - 6);
  }

  function updateEscape() {
    const speed = Number(escapeSpeedSlider.value);
    const total = GF.totalEnergyPerMass(M, R, speed);
    const classification = GF.classifyOrbit(total, ESCAPE_POTENTIAL);
    const ke = GF.kineticEnergyPerMass(speed);

    escapeSpeedLabel.textContent = `${(speed / 1000).toFixed(2)} km/s`;
    escapeKeReadout.textContent = `${(ke / 1e6).toFixed(2)} MJ/kg`;
    escapeTotalReadout.textContent = `${(total / 1e6).toFixed(2)} MJ/kg`;
    escapeClassification.textContent = CLASSIFICATION_TEXT[classification];

    if (classification === 'bound') {
      const rTurn = (-OM.G * M) / total;
      const altitude = rTurn - R;
      escapeTurningPointReadout.textContent = `${(altitude / 1000).toFixed(0)} km altitude (${(rTurn / 1000).toFixed(0)} km from the centre)`;
    } else {
      escapeTurningPointReadout.textContent = 'none — it never turns back';
    }

    drawEscapeWell(speed);
  }

  escapeSpeedSlider.addEventListener('input', updateEscape);

  escapeSpeedMark.value = Math.round(ESCAPE_SPEED);
  escapeSpeedValueEl.textContent = `${(ESCAPE_SPEED / 1000).toFixed(2)} km/s`;

  // --- Coverage and questions -----------------------------------------------

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  setFallMode('fall');
  updateEquipotentialReadouts();
  updateFourGraphs();
  updateMghComparison();
  updateEmLine();
  orbit1Slider.value = orbitSliderValueForAltitude(ORBIT_LOW_ALT_M);
  orbit2Slider.value = orbitSliderValueForAltitude(ORBIT_GEO_ALT_M);
  updateOrbits();
  updateEscape();
  renderCoverage();
  Glossary.init({});
  QuizUI.mount(GravitationalPotentialQuestions.makeQuestions(GF, OM));
})();
