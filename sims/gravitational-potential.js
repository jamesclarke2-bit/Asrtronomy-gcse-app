(function () {
  const CURRICULUM_UNITS = ['u3.26', 'u3.27'];
  const OM = OrbitalMechanics;
  const GF = GravityField;

  const M = OM.EARTH_MASS_KG;
  const R = OM.EARTH_RADIUS_M;

  const EARTH_COLOR = '#2a6bd6';
  const MASS_COLOR = '#c0392b';
  const CURVE_COLOR = '#3a3f4d';
  const SHADE_COLOR = 'rgba(42, 107, 214, 0.22)';

  // --- 1. Two ways in: two work counters ----------------------------------

  const RELEASE_MIN_RADIUS = R * 2;
  const RELEASE_MAX_RADIUS = R * 1000;

  const fallCanvas = document.getElementById('fall-view');
  const fallCtx = fallCanvas.getContext('2d');
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

    const topY = 20;
    const planetY = height - 30;
    const planetRadius = 16;

    fallCtx.strokeStyle = '#cdd7e1';
    fallCtx.setLineDash([4, 4]);
    fallCtx.beginPath();
    fallCtx.moveTo(width / 2, topY);
    fallCtx.lineTo(width / 2, planetY);
    fallCtx.stroke();
    fallCtx.setLineDash([]);

    fallCtx.fillStyle = '#888';
    fallCtx.font = '11px sans-serif';
    fallCtx.textAlign = 'center';
    fallCtx.fillText('release point', width / 2, topY - 6);

    fallCtx.beginPath();
    fallCtx.arc(width / 2, planetY, planetRadius, 0, Math.PI * 2);
    fallCtx.fillStyle = EARTH_COLOR;
    fallCtx.fill();
    fallCtx.fillStyle = '#fff';
    fallCtx.font = '10px sans-serif';
    fallCtx.fillText('Earth', width / 2, planetY + 3);

    const massY = topY + fraction * (planetY - planetRadius - 10 - topY);
    fallCtx.beginPath();
    fallCtx.arc(width / 2, massY, 7, 0, Math.PI * 2);
    fallCtx.fillStyle = MASS_COLOR;
    fallCtx.fill();
    fallCtx.strokeStyle = '#7a2015';
    fallCtx.lineWidth = 1.5;
    fallCtx.stroke();
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

  // --- 2. The potential well, V(r) = -GM/r --------------------------------

  const WELL_R_MAX = R * 15;
  const WELL_MARGIN = { left: 60, right: 20, top: 30, bottom: 40 };

  const wellCanvas = document.getElementById('well-view');
  const wellCtx = wellCanvas.getContext('2d');
  const wellRadiusSlider = document.getElementById('well-radius-slider');
  const wellRadiusLabel = document.getElementById('well-radius-label');
  const wellRadiusReadout = document.getElementById('well-radius-readout');
  const wellPotentialReadout = document.getElementById('well-potential-readout');
  const wellClimbedReadout = document.getElementById('well-climbed-readout');

  const V_AT_SURFACE = GF.potential(M, R);

  function wellRadiusFromFraction(fraction) {
    return R + fraction * (WELL_R_MAX - R);
  }

  function wellXForR(r) {
    const plotWidth = wellCanvas.width - WELL_MARGIN.left - WELL_MARGIN.right;
    return WELL_MARGIN.left + ((r - R) / (WELL_R_MAX - R)) * plotWidth;
  }

  // V_AT_SURFACE (most negative) sits at the bottom of the well; 0 (the
  // zero-at-infinity convention) sits at the top — climbing "up" the
  // well is literally climbing up the canvas, matching "higher means
  // less negative" in the prose above.
  function wellYForV(v) {
    const plotHeight = wellCanvas.height - WELL_MARGIN.top - WELL_MARGIN.bottom;
    const bottomY = wellCanvas.height - WELL_MARGIN.bottom;
    const fraction = (v - V_AT_SURFACE) / (0 - V_AT_SURFACE);
    return bottomY - fraction * plotHeight;
  }

  function drawWell(r) {
    const width = wellCanvas.width;
    const height = wellCanvas.height;
    wellCtx.clearRect(0, 0, width, height);

    // Zero line (the convention: zero at infinity)
    const zeroY = wellYForV(0);
    wellCtx.strokeStyle = '#999';
    wellCtx.setLineDash([5, 4]);
    wellCtx.beginPath();
    wellCtx.moveTo(WELL_MARGIN.left, zeroY);
    wellCtx.lineTo(width - WELL_MARGIN.right, zeroY);
    wellCtx.stroke();
    wellCtx.setLineDash([]);
    wellCtx.fillStyle = '#777';
    wellCtx.font = '11px sans-serif';
    wellCtx.textAlign = 'left';
    wellCtx.fillText('zero at infinity (convention)', WELL_MARGIN.left, zeroY - 6);

    // The curve
    wellCtx.beginPath();
    const steps = 200;
    for (let i = 0; i <= steps; i += 1) {
      const rr = R + (i / steps) * (WELL_R_MAX - R);
      const vv = GF.potential(M, rr);
      const x = wellXForR(rr);
      const y = wellYForV(vv);
      if (i === 0) wellCtx.moveTo(x, y);
      else wellCtx.lineTo(x, y);
    }
    wellCtx.strokeStyle = CURVE_COLOR;
    wellCtx.lineWidth = 2;
    wellCtx.stroke();

    // Axis labels
    wellCtx.fillStyle = '#555';
    wellCtx.textAlign = 'center';
    wellCtx.fillText('Radius, r', width / 2, height - 8);
    wellCtx.save();
    wellCtx.translate(16, height / 2);
    wellCtx.rotate(-Math.PI / 2);
    wellCtx.fillText('V(r)', 0, 0);
    wellCtx.restore();

    // Draggable marker
    const v = GF.potential(M, r);
    const mx = wellXForR(r);
    const my = wellYForV(v);
    wellCtx.beginPath();
    wellCtx.arc(mx, my, 7, 0, Math.PI * 2);
    wellCtx.fillStyle = MASS_COLOR;
    wellCtx.fill();
    wellCtx.strokeStyle = '#7a2015';
    wellCtx.lineWidth = 1.5;
    wellCtx.stroke();
  }

  function updateWell() {
    const fraction = Number(wellRadiusSlider.value) / 1000;
    const r = wellRadiusFromFraction(fraction);
    const v = GF.potential(M, r);
    const climbedFraction = (v - V_AT_SURFACE) / (0 - V_AT_SURFACE);

    wellRadiusLabel.textContent = `${(r / R).toFixed(1)} × Earth's radius`;
    wellRadiusReadout.textContent = `${(r / 1000).toFixed(0)} km (${(r / R).toFixed(1)} × Earth's radius)`;
    wellPotentialReadout.textContent = `${(v / 1e6).toFixed(2)} MJ/kg`;
    wellClimbedReadout.textContent = `${(climbedFraction * 100).toFixed(1)}% of the way out of the well shown here`;

    drawWell(r);
  }

  wellRadiusSlider.addEventListener('input', updateWell);

  function wellFractionFromPointerEvent(evt) {
    const rect = wellCanvas.getBoundingClientRect();
    const scaleX = wellCanvas.width / rect.width;
    const x = (evt.clientX - rect.left) * scaleX;
    const plotWidth = wellCanvas.width - WELL_MARGIN.left - WELL_MARGIN.right;
    const frac = (x - WELL_MARGIN.left) / plotWidth;
    return Math.max(0, Math.min(1, frac));
  }

  function applyWellDrag(evt) {
    const fraction = wellFractionFromPointerEvent(evt);
    wellRadiusSlider.value = Math.round(fraction * 1000);
    updateWell();
  }

  let wellDragging = false;
  wellCanvas.addEventListener('pointerdown', (evt) => {
    wellDragging = true;
    wellCanvas.setPointerCapture(evt.pointerId);
    applyWellDrag(evt);
  });
  wellCanvas.addEventListener('pointermove', (evt) => {
    if (!wellDragging) return;
    applyWellDrag(evt);
  });
  wellCanvas.addEventListener('pointerup', () => {
    wellDragging = false;
  });
  wellCanvas.addEventListener('pointercancel', () => {
    wellDragging = false;
  });

  // --- 3. mgh vs the exact formula -----------------------------------------

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

  // --- 4. The g-r graph: area as potential difference ----------------------

  const G_R_MAX_FACTOR = 6; // slider domain, in multiples of R
  const G_R_MARGIN = { left: 60, right: 20, top: 20, bottom: 40 };

  const gRCanvas = document.getElementById('g-r-view');
  const gRCtx = gRCanvas.getContext('2d');
  const r1Slider = document.getElementById('r1-slider');
  const r2Slider = document.getElementById('r2-slider');
  const r1Label = document.getElementById('r1-label');
  const r2Label = document.getElementById('r2-label');
  const gRAreaReadout = document.getElementById('g-r-area-readout');

  const G_AT_R = GF.fieldMagnitude(M, R);

  function rFromGRSlider(value) {
    return (Number(value) / 10) * R;
  }

  function gRXForR(r) {
    const plotWidth = gRCanvas.width - G_R_MARGIN.left - G_R_MARGIN.right;
    return G_R_MARGIN.left + ((r - R) / (R * G_R_MAX_FACTOR - R)) * plotWidth;
  }

  function gRYForG(g) {
    const plotHeight = gRCanvas.height - G_R_MARGIN.top - G_R_MARGIN.bottom;
    return G_R_MARGIN.top + (1 - g / G_AT_R) * plotHeight;
  }

  function drawGR(r1, r2) {
    const width = gRCanvas.width;
    const height = gRCanvas.height;
    gRCtx.clearRect(0, 0, width, height);

    const lo = Math.min(r1, r2);
    const hi = Math.max(r1, r2);

    // Shaded area under the curve between lo and hi
    gRCtx.beginPath();
    gRCtx.moveTo(gRXForR(lo), gRYForG(0));
    const shadeSteps = 100;
    for (let i = 0; i <= shadeSteps; i += 1) {
      const rr = lo + (i / shadeSteps) * (hi - lo);
      gRCtx.lineTo(gRXForR(rr), gRYForG(GF.fieldMagnitude(M, rr)));
    }
    gRCtx.lineTo(gRXForR(hi), gRYForG(0));
    gRCtx.closePath();
    gRCtx.fillStyle = SHADE_COLOR;
    gRCtx.fill();

    // The g(r) curve
    gRCtx.beginPath();
    const steps = 200;
    for (let i = 0; i <= steps; i += 1) {
      const rr = R + (i / steps) * (R * G_R_MAX_FACTOR - R);
      const gg = GF.fieldMagnitude(M, rr);
      const x = gRXForR(rr);
      const y = gRYForG(gg);
      if (i === 0) gRCtx.moveTo(x, y);
      else gRCtx.lineTo(x, y);
    }
    gRCtx.strokeStyle = CURVE_COLOR;
    gRCtx.lineWidth = 2;
    gRCtx.stroke();

    // r1/r2 markers
    [lo, hi].forEach((r) => {
      const x = gRXForR(r);
      gRCtx.strokeStyle = '#888';
      gRCtx.setLineDash([3, 3]);
      gRCtx.beginPath();
      gRCtx.moveTo(x, G_R_MARGIN.top);
      gRCtx.lineTo(x, height - G_R_MARGIN.bottom);
      gRCtx.stroke();
      gRCtx.setLineDash([]);
    });

    gRCtx.fillStyle = '#555';
    gRCtx.textAlign = 'center';
    gRCtx.font = '11px sans-serif';
    gRCtx.fillText('Radius, r', width / 2, height - 8);
    gRCtx.save();
    gRCtx.translate(16, height / 2);
    gRCtx.rotate(-Math.PI / 2);
    gRCtx.fillText('g(r)', 0, 0);
    gRCtx.restore();
  }

  function updateGR() {
    const r1 = rFromGRSlider(r1Slider.value);
    const r2 = rFromGRSlider(r2Slider.value);
    const lo = Math.min(r1, r2);
    const hi = Math.max(r1, r2);
    const area = GF.potentialDifferenceNumerical(M, lo, hi);

    r1Label.textContent = `${(r1 / R).toFixed(1)} × R`;
    r2Label.textContent = `${(r2 / R).toFixed(1)} × R`;
    gRAreaReadout.textContent = `${(area / 1e6).toFixed(2)} MJ/kg`;

    drawGR(r1, r2);
  }

  r1Slider.addEventListener('input', updateGR);
  r2Slider.addEventListener('input', updateGR);

  // --- 5. A satellite's energy budget --------------------------------------

  const orbitAltitudeSlider = document.getElementById('orbit-altitude-slider');
  const orbitAltitudeLabel = document.getElementById('orbit-altitude-label');
  const orbitRadiusReadout = document.getElementById('orbit-radius-readout');
  const orbitSpeedReadout = document.getElementById('orbit-speed-readout');
  const orbitKeReadout = document.getElementById('orbit-ke-readout');
  const orbitPeReadout = document.getElementById('orbit-pe-readout');
  const orbitTotalReadout = document.getElementById('orbit-total-readout');
  const orbitKeBarFill = document.getElementById('orbit-ke-bar-fill');
  const orbitPeBarFill = document.getElementById('orbit-pe-bar-fill');
  const orbitTotalBarFill = document.getElementById('orbit-total-bar-fill');
  const orbitTotalSign = document.getElementById('orbit-total-sign');

  const ORBIT_MIN_ALTITUDE = Number(orbitAltitudeSlider.min);
  const ORBIT_ENERGETICS_AT_MIN = GF.circularOrbitEnergetics(M, R + ORBIT_MIN_ALTITUDE);
  const ORBIT_KE_SCALE = ORBIT_ENERGETICS_AT_MIN.kinetic;
  const ORBIT_PE_SCALE = Math.abs(ORBIT_ENERGETICS_AT_MIN.potential);
  const ORBIT_TOTAL_SCALE = Math.abs(ORBIT_ENERGETICS_AT_MIN.total);

  function updateOrbit() {
    const altitude = Number(orbitAltitudeSlider.value);
    const r = R + altitude;
    const energetics = GF.circularOrbitEnergetics(M, r);

    orbitAltitudeLabel.textContent = `${(altitude / 1000).toFixed(0)} km`;
    orbitRadiusReadout.textContent = `${(r / 1000).toFixed(0)} km (${(r / R).toFixed(2)} × Earth's radius)`;
    orbitSpeedReadout.textContent = `${(energetics.speed / 1000).toFixed(2)} km/s`;
    orbitKeReadout.textContent = `${(energetics.kinetic / 1e6).toFixed(2)} MJ/kg`;
    orbitPeReadout.textContent = `${(energetics.potential / 1e6).toFixed(2)} MJ/kg`;
    orbitTotalReadout.textContent = `${(energetics.total / 1e6).toFixed(2)} MJ/kg`;

    orbitKeBarFill.style.height = `${Math.min(1, energetics.kinetic / ORBIT_KE_SCALE) * 50}%`;
    orbitPeBarFill.style.height = `${Math.min(1, Math.abs(energetics.potential) / ORBIT_PE_SCALE) * 50}%`;
    orbitTotalBarFill.style.height = `${Math.min(1, Math.abs(energetics.total) / ORBIT_TOTAL_SCALE) * 50}%`;

    orbitTotalSign.textContent = energetics.total < 0 ? '(negative — bound)' : energetics.total > 0 ? '(positive — unbound)' : '(zero)';
  }

  orbitAltitudeSlider.addEventListener('input', updateOrbit);

  // --- 6. Escaping: total energy reaching zero ------------------------------

  const escapeSpeedSlider = document.getElementById('escape-speed-slider');
  const escapeSpeedLabel = document.getElementById('escape-speed-label');
  const escapeTotalReadout = document.getElementById('escape-total-readout');
  const escapeClassification = document.getElementById('escape-classification');
  const escapeSpeedMark = document.getElementById('escape-speed-mark');
  const escapeSpeedValueEl = document.getElementById('escape-speed-value');

  const ESCAPE_SPEED = GF.escapeSpeedFromEnergy(M, R);
  const ESCAPE_POTENTIAL = GF.potentialEnergyPerMass(M, R);

  const CLASSIFICATION_TEXT = {
    bound: 'Bound — falls back or settles into an orbit (total energy negative)',
    parabolic: 'Just escaping — the marginal case (total energy ≈ zero)',
    hyperbolic: 'Escapes with speed to spare (total energy positive)',
  };

  function updateEscape() {
    const speed = Number(escapeSpeedSlider.value);
    const total = GF.totalEnergyPerMass(M, R, speed);
    const classification = GF.classifyOrbit(total, ESCAPE_POTENTIAL);

    escapeSpeedLabel.textContent = `${(speed / 1000).toFixed(2)} km/s`;
    escapeTotalReadout.textContent = `${(total / 1e6).toFixed(2)} MJ/kg`;
    escapeClassification.textContent = CLASSIFICATION_TEXT[classification];
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
  updateWell();
  updateMghComparison();
  updateGR();
  updateOrbit();
  updateEscape();
  renderCoverage();
  QuizUI.mount(GravitationalPotentialQuestions.makeQuestions(GF, OM));
})();
