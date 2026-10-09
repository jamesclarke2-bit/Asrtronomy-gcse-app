(function () {
  const CURRICULUM_UNITS = ['u3.8', 'u3.13', 'u3.14'];
  const OM = OrbitalMechanics;
  const GS = GravitySim;
  const GF = GravityField;

  const GM = OM.G * OM.EARTH_MASS_KG;
  const R = OM.EARTH_RADIUS_M;
  const V_CIRCULAR_SURFACE = OM.circularOrbitSpeed(R, OM.EARTH_MASS_KG);
  const V_ESCAPE_SURFACE = OM.escapeSpeed(R, OM.EARTH_MASS_KG);

  // Newton's own thought experiment fires from a very tall mountain, not
  // the ground itself — fire exactly at ground level and even circular
  // speed technically "touches" the ground on every pass, which a naive
  // r <= groundRadius impact check can't tell apart from a real impact
  // once RK4's tiny floating-point noise is involved. A schematic 10 km
  // tower sidesteps that, and changes the circular/escape speeds here by
  // under 0.1% from their surface values — invisible at the 1 decimal
  // place this page displays them to.
  const TOWER_HEIGHT_M = 10000;
  const LAUNCH_RADIUS_M = R + TOWER_HEIGHT_M;
  const V_CIRCULAR_LAUNCH = OM.circularOrbitSpeed(LAUNCH_RADIUS_M, OM.EARTH_MASS_KG);
  const V_ESCAPE_LAUNCH = OM.escapeSpeed(LAUNCH_RADIUS_M, OM.EARTH_MASS_KG);

  const EARTH_COLOR = '#2a6bd6';
  const PATH_COLOR = '#3a3f4d';
  const MARKER_COLOR = '#c0392b';
  const WEDGE_COLORS = ['rgba(42, 107, 214, 0.10)', 'rgba(42, 107, 214, 0.22)'];

  // --- DOM references --------------------------------------------------

  const cannonCanvas = document.getElementById('cannon-view');
  const launchSpeedSlider = document.getElementById('launch-speed-slider');
  const launchSpeedLabel = document.getElementById('launch-speed-label');
  const cannonPresetButtons = document.querySelectorAll('.preset-button[data-cannon-preset]');
  const cannonPlayButton = document.getElementById('cannon-play-button');
  const orbitClassification = document.getElementById('orbit-classification');
  const outcomeDetail = document.getElementById('outcome-detail');
  const circularSpeedValueEl = document.getElementById('circular-speed-value');
  const escapeSpeedValueEl = document.getElementById('escape-speed-value');

  const inverseSquareCanvas = document.getElementById('inverse-square-view');
  const mass1Slider = document.getElementById('mass1-slider');
  const mass1Label = document.getElementById('mass1-label');
  const mass2Slider = document.getElementById('mass2-slider');
  const mass2Label = document.getElementById('mass2-label');
  const separationSlider = document.getElementById('separation-slider');
  const separationLabel = document.getElementById('separation-label');
  const forceRatioReadout = document.getElementById('force-ratio-readout');
  const exampleDistanceNote = document.getElementById('example-distance-note');
  const exampleMassNote = document.getElementById('example-mass-note');

  const realworldCircularCanvas = document.getElementById('realworld-circular-view');
  const realworldEscapeCanvas = document.getElementById('realworld-escape-view');
  const realworldIssCanvas = document.getElementById('realworld-iss-view');
  const realworldCircularValue = document.getElementById('realworld-circular-value');
  const realworldEscapeValue = document.getElementById('realworld-escape-value');
  const realworldPeriodValue = document.getElementById('realworld-period-value');

  // --- Newton's cannon: simulate, classify, draw -------------------------

  const cannon = {
    points: [{ x: R, y: 0 }],
    outcome: 'impact',
    periodSeconds: null,
  };

  // The semi-major axis vis-viva implies for a horizontal launch at the
  // tower's radius and speed v: 1/a = 2/LAUNCH_RADIUS - v²/GM. Positive
  // and finite for a closed ellipse (including the special case of a
  // circle), infinite exactly at escape speed, negative beyond it (an
  // open hyperbola).
  function semiMajorAxisFromLaunch(v) {
    return 1 / (2 / LAUNCH_RADIUS_M - (v * v) / GM);
  }

  // Bound / parabolic / hyperbolic, from specific orbital energy
  // directly via GravityField.classifyOrbit — not from testing the
  // semi-major axis above for being positive and finite. That test
  // looks right (1/a is exactly the vis-viva quantity), but 1/x is
  // numerically unstable right at the knife edge this matters most
  // for: at *exactly* escape speed, "2/LAUNCH_RADIUS - v²/GM" can land
  // on a tiny nonzero floating-point value instead of the true zero,
  // and 1/(tiny nonzero) is some huge but finite a — Number.isFinite(a)
  // then wrongly says "bound", and simulateCannon below would size the
  // simulation for a gigantic elliptical period instead of recognising
  // an escape. classifyOrbit's own tolerance (relative to the
  // potential energy here, not an absolute cutoff) is built for
  // exactly this, and never divides by the quantity it's testing.
  function cannonEnergyClassification(launchSpeedMPerS) {
    const total = GF.totalEnergyPerMass(OM.EARTH_MASS_KG, LAUNCH_RADIUS_M, launchSpeedMPerS);
    const potentialValue = GF.potentialEnergyPerMass(OM.EARTH_MASS_KG, LAUNCH_RADIUS_M);
    return GF.classifyOrbit(total, potentialValue);
  }

  function simulateCannon(launchSpeedMPerS) {
    const bound = cannonEnergyClassification(launchSpeedMPerS) === 'bound';
    let dt;
    let maxSteps;
    let maxRadius;
    if (bound) {
      const a = semiMajorAxisFromLaunch(launchSpeedMPerS);
      const period = 2 * Math.PI * Math.sqrt((a * a * a) / GM);
      dt = period / 720;
      maxSteps = Math.ceil((period * 1.05) / dt);
      maxRadius = a * 2.2; // comfortably above any possible apoapsis for this a (<= 2a)
      cannon.periodSeconds = period;
    } else {
      // Parabolic or hyperbolic: scale the step to the time to cross
      // one Earth radius at this speed, and simulate out to a generous
      // multiple of R.
      dt = LAUNCH_RADIUS_M / launchSpeedMPerS;
      maxSteps = 4000;
      maxRadius = R * 12;
      cannon.periodSeconds = null;
    }
    const result = GS.simulateTrajectory({
      x0: LAUNCH_RADIUS_M, y0: 0, vx0: 0, vy0: launchSpeedMPerS, GM, dt, maxSteps,
      groundRadius: R,
      maxRadius,
    });
    cannon.points = result.points;
    cannon.outcome = result.outcome;
  }

  function classifyCannonPath(launchSpeedKmPerS) {
    if (cannon.outcome === 'impact') return 'Sub-orbital — falls back to Earth';
    const energyClass = cannonEnergyClassification(launchSpeedKmPerS * 1000);
    if (energyClass === 'parabolic') return 'Escape — a parabola';
    if (energyClass === 'hyperbolic') return 'Escape — a hyperbola, with speed to spare';
    return Math.abs(launchSpeedKmPerS - V_CIRCULAR_LAUNCH / 1000) < 0.02
      ? 'A perfect circle'
      : 'An ellipse — closed, and repeating forever';
  }

  function formatDuration(seconds) {
    if (seconds < 120) return `${seconds.toFixed(0)} s`;
    if (seconds < 3600 * 3) return `${(seconds / 60).toFixed(1)} min`;
    return `${(seconds / 3600).toFixed(2)} hours`;
  }

  function outcomeDetailText() {
    if (cannon.outcome === 'impact') {
      const last = cannon.points[cannon.points.length - 1];
      const stepSeconds = cannon.periodSeconds ? cannon.periodSeconds / 720 : 0;
      const fallTime = (cannon.points.length - 1) * stepSeconds;
      return `Hits the ground after about ${formatDuration(fallTime)}, ${(Math.hypot(last.x, last.y) / 1000).toFixed(0)} km from Earth's centre.`;
    }
    if (cannon.outcome === 'escaped') {
      return "Never comes back — keeps moving away from Earth forever, slowing but never stopping (unless something else's gravity catches it).";
    }
    return `Orbital period: ${formatDuration(cannon.periodSeconds)}.`;
  }

  // A 10 km tower is invisible next to a 6,371 km Earth at any single
  // linear scale — the circular and sub-orbital paths would hug the
  // surface so closely they'd be indistinguishable from it. Altitude
  // above the true surface is exaggerated by a square-root curve instead
  // of a flat multiplier: it expands a 10 km gap by about 40x (clearly
  // visible) while barely touching a 16,000 km one (the elliptical and
  // escape paths already have plenty of visual room at the true scale).
  // Earth's own radius is never touched — altitude 0 stays altitude 0 —
  // so only the gap above the surface is stretched, the same idea as
  // src/moonOrbitPanel.js's VISUAL_EXAGGERATION for the Moon's orbit.
  const ALTITUDE_VISUAL_K = 4000; // sqrt(metres) -> metres

  function exaggeratedRadius(trueRadiusM) {
    const altitude = Math.max(0, trueRadiusM - R);
    return R + ALTITUDE_VISUAL_K * Math.sqrt(altitude);
  }

  function toVisualXY(x, y) {
    const r = Math.hypot(x, y);
    if (r < 1) return { x: 0, y: 0 };
    const stretch = exaggeratedRadius(r) / r;
    return { x: x * stretch, y: y * stretch };
  }

  function computeCannonView() {
    let maxVisualR = R;
    cannon.points.forEach((p) => {
      const v = toVisualXY(p.x, p.y);
      maxVisualR = Math.max(maxVisualR, Math.hypot(v.x, v.y));
    });
    const cx = cannonCanvas.width / 2;
    const cy = cannonCanvas.height / 2;
    const padding = 40;
    const availableRadius = Math.min(cannonCanvas.width, cannonCanvas.height) / 2 - padding;
    const scale = availableRadius / maxVisualR;
    return {
      cx, cy, scale,
      toScreen(x, y) {
        const v = toVisualXY(x, y);
        return { x: cx + v.x * scale, y: cy - v.y * scale };
      },
    };
  }

  function drawEarthAndTower(ctx, view) {
    const center = view.toScreen(0, 0);
    const radiusPx = R * view.scale;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radiusPx, 0, Math.PI * 2);
    ctx.fillStyle = EARTH_COLOR;
    ctx.fill();

    // A small schematic tower at the launch point, LAUNCH_RADIUS_M out —
    // Newton's own thought experiment fires from a very tall mountain,
    // above the ground a falling cannonball would actually hit.
    const launch = view.toScreen(LAUNCH_RADIUS_M, 0);
    const towerHeightPx = Math.max(10, radiusPx * 0.07);
    ctx.beginPath();
    ctx.moveTo(launch.x - 3, launch.y);
    ctx.lineTo(launch.x - 3, launch.y - towerHeightPx);
    ctx.lineTo(launch.x + 3, launch.y - towerHeightPx);
    ctx.lineTo(launch.x + 3, launch.y);
    ctx.closePath();
    ctx.fillStyle = '#6b7684';
    ctx.fill();
  }

  function drawWedges(ctx, view) {
    const points = cannon.points;
    if (points.length < 6) return;
    const wedgeCount = Math.min(12, Math.max(3, Math.floor(points.length / 8)));
    const chunkSize = Math.floor(points.length / wedgeCount);
    const centre = view.toScreen(0, 0);
    for (let w = 0; w < wedgeCount; w += 1) {
      const start = w * chunkSize;
      const end = w === wedgeCount - 1 ? points.length - 1 : (w + 1) * chunkSize;
      ctx.beginPath();
      ctx.moveTo(centre.x, centre.y);
      for (let i = start; i <= end; i += 1) {
        const s = view.toScreen(points[i].x, points[i].y);
        ctx.lineTo(s.x, s.y);
      }
      ctx.closePath();
      ctx.fillStyle = WEDGE_COLORS[w % 2];
      ctx.fill();
    }
  }

  function drawPath(ctx, view) {
    ctx.beginPath();
    cannon.points.forEach((p, i) => {
      const s = view.toScreen(p.x, p.y);
      if (i === 0) ctx.moveTo(s.x, s.y);
      else ctx.lineTo(s.x, s.y);
    });
    ctx.strokeStyle = PATH_COLOR;
    ctx.lineWidth = 1.75;
    ctx.stroke();
  }

  function drawMarker(ctx, view, index) {
    const p = cannon.points[Math.min(index, cannon.points.length - 1)];
    const s = view.toScreen(p.x, p.y);
    ctx.beginPath();
    ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = MARKER_COLOR;
    ctx.fill();
    ctx.strokeStyle = '#7a2015';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  let markerIndex = 0;

  function renderCannon() {
    const ctx = cannonCanvas.getContext('2d');
    ctx.clearRect(0, 0, cannonCanvas.width, cannonCanvas.height);
    const view = computeCannonView();
    drawWedges(ctx, view);
    drawPath(ctx, view);
    drawEarthAndTower(ctx, view);
    drawMarker(ctx, view, markerIndex);

    ctx.fillStyle = '#8a97a5';
    ctx.font = 'italic 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Not to scale — altitude exaggerated for visibility', 8, cannonCanvas.height - 10);
  }

  function updateCannonReadouts(launchSpeedKmPerS) {
    orbitClassification.textContent = classifyCannonPath(launchSpeedKmPerS);
    outcomeDetail.textContent = outcomeDetailText();
  }

  // A circular orbit is a knife edge: at this altitude, a launch speed
  // just 50 m/s under true circular speed (close to the slider's own
  // 0.05 km/s step) already drops periapsis over 30 km below the ground —
  // easily enough to turn "circular" into a crash. Rather than chase
  // that with an ever-taller tower, any launch speed within one slider
  // step of true circular is treated as exactly circular: close enough
  // that a student dragging the slider by eye, or clicking the preset,
  // reliably gets the clean circle they're aiming for, not a coin-flip
  // between a circle and a crash.
  const CIRCULAR_SNAP_TOLERANCE_KM_S = 0.06;

  function effectiveLaunchSpeedKmPerS(nominalKmPerS) {
    const circularKmPerS = V_CIRCULAR_LAUNCH / 1000;
    return Math.abs(nominalKmPerS - circularKmPerS) < CIRCULAR_SNAP_TOLERANCE_KM_S ? circularKmPerS : nominalKmPerS;
  }

  // Accepts an explicit speed so preset buttons can bypass the slider
  // entirely: <input type="range">'s .value snaps to the nearest step on
  // every set, even from script, so reading it back after a preset sets
  // it would silently corrupt that preset's exact figure.
  function updateCannon(explicitKmPerS) {
    const nominalKmPerS = explicitKmPerS !== undefined ? explicitKmPerS : Number(launchSpeedSlider.value);
    const launchSpeedKmPerS = effectiveLaunchSpeedKmPerS(nominalKmPerS);
    launchSpeedLabel.textContent = `${launchSpeedKmPerS.toFixed(2)} km/s`;
    simulateCannon(launchSpeedKmPerS * 1000);
    markerIndex = 0;
    updateCannonReadouts(launchSpeedKmPerS);
    renderCannon();
  }

  launchSpeedSlider.addEventListener('input', () => updateCannon());

  const CANNON_PRESETS = {
    // 5% under circular speed: close enough to trace a real, visible arc
    // before impact. A launch speed much further under circular falls
    // almost straight back down within a couple of degrees at this
    // altitude — too quick to see anything of the path.
    slow: (V_CIRCULAR_LAUNCH / 1000) * 0.95,
    circular: V_CIRCULAR_LAUNCH / 1000,
    elliptical: (V_CIRCULAR_LAUNCH / 1000) * 1.25,
    escape: V_ESCAPE_LAUNCH / 1000,
  };

  cannonPresetButtons.forEach((button) => {
    const value = CANNON_PRESETS[button.dataset.cannonPreset];
    if (value === undefined) return;
    button.addEventListener('click', () => {
      stopCannonAnimation();
      launchSpeedSlider.value = value; // visual position only — may snap to the nearest step
      updateCannon(value); // the exact preset figure, bypassing that snap
    });
  });

  // --- Cannon animation: step the marker along the already-simulated path

  const CANNON_ANIMATION_SECONDS = 8;
  let cannonAnimationFrameId = null;
  let cannonAnimationStart = null;

  function stopCannonAnimation() {
    if (cannonAnimationFrameId !== null) {
      cancelAnimationFrame(cannonAnimationFrameId);
      cannonAnimationFrameId = null;
    }
    cannonAnimationStart = null;
    cannonPlayButton.textContent = '▶ Animate';
    cannonPlayButton.setAttribute('aria-pressed', 'false');
  }

  function startCannonAnimation() {
    cannonPlayButton.textContent = '❚❚ Pause';
    cannonPlayButton.setAttribute('aria-pressed', 'true');
    const loop = cannon.outcome === 'orbiting';
    function step(now) {
      if (cannonAnimationStart === null) cannonAnimationStart = now;
      let progress = (now - cannonAnimationStart) / 1000 / CANNON_ANIMATION_SECONDS;
      if (progress >= 1) {
        if (loop) {
          progress %= 1;
          cannonAnimationStart = now - progress * CANNON_ANIMATION_SECONDS * 1000;
        } else {
          progress = 1;
        }
      }
      markerIndex = Math.floor(progress * (cannon.points.length - 1));
      renderCannon();
      if (loop || progress < 1) cannonAnimationFrameId = requestAnimationFrame(step);
      else stopCannonAnimation();
    }
    cannonAnimationFrameId = requestAnimationFrame(step);
  }

  cannonPlayButton.addEventListener('click', () => {
    if (cannonAnimationFrameId !== null) stopCannonAnimation();
    else startCannonAnimation();
  });

  // --- Inverse-square widget -----------------------------------------------

  const SEPARATION_FACTORS = [0.5, 1, 2, 3, 4];
  const FRACTION_GLYPHS = { 2: '½', 3: '⅓', 4: '¼', 8: '⅛', 9: '⅑', 16: '1/16' };

  function ratioPhrase(ratio) {
    if (Math.abs(ratio - 1) < 1e-9) return 'leaves the force unchanged';
    if (Math.abs(ratio - Math.round(ratio)) < 1e-9) return `gives ${Math.round(ratio)}× the force`;
    const inv = 1 / ratio;
    if (Math.abs(inv - Math.round(inv)) < 1e-9) {
      const n = Math.round(inv);
      const glyph = FRACTION_GLYPHS[n];
      return glyph ? `gives ${glyph} of the force` : `gives 1/${n} of the force`;
    }
    return `gives ${ratio.toFixed(2)}× the force`;
  }

  function drawInverseSquare() {
    const ctx = inverseSquareCanvas.getContext('2d');
    const w = inverseSquareCanvas.width;
    const h = inverseSquareCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const m1 = Number(mass1Slider.value);
    const m2 = Number(mass2Slider.value);
    const sep = SEPARATION_FACTORS[Number(separationSlider.value)];
    const ratio = OM.gravitationalForceRatio({ massFactor1: m1, massFactor2: m2, separationFactor: sep });

    const cy = h / 2;
    const maxSep = SEPARATION_FACTORS[SEPARATION_FACTORS.length - 1];
    const margin = 55;
    const pxPerUnit = (w - 2 * margin) / (2 * maxSep);
    const dx = sep * pxPerUnit;
    const cx = w / 2;
    const x1 = cx - dx / 2;
    const x2 = cx + dx / 2;
    const r1 = 9 + 7 * Math.cbrt(m1);
    const r2 = 9 + 7 * Math.cbrt(m2);

    ctx.beginPath();
    ctx.moveTo(x1, cy);
    ctx.lineTo(x2, cy);
    ctx.strokeStyle = `rgba(192, 57, 43, ${Math.min(1, Math.max(0.18, Math.sqrt(ratio) * 0.55))})`;
    ctx.lineWidth = Math.min(16, Math.max(1.5, Math.sqrt(ratio) * 6));
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x1, cy, r1, 0, Math.PI * 2);
    ctx.fillStyle = '#2a6bd6';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x2, cy, r2, 0, Math.PI * 2);
    ctx.fillStyle = '#f5a623';
    ctx.fill();

    ctx.fillStyle = '#3a3f4d';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`mass ×${m1}`, x1, cy + r1 + 10);
    ctx.fillText(`mass ×${m2}`, x2, cy + r2 + 10);

    ctx.font = 'italic 11px sans-serif';
    ctx.fillStyle = '#8a97a5';
    ctx.fillText(`separation ×${sep}`, cx, h - 20);
  }

  function updateInverseSquare() {
    const m1 = Number(mass1Slider.value);
    const m2 = Number(mass2Slider.value);
    const sep = SEPARATION_FACTORS[Number(separationSlider.value)];
    mass1Label.textContent = `${m1}×`;
    mass2Label.textContent = `${m2}×`;
    separationLabel.textContent = `${sep}×`;
    const ratio = OM.gravitationalForceRatio({ massFactor1: m1, massFactor2: m2, separationFactor: sep });
    forceRatioReadout.textContent =
      `At these settings (mass ${m1}×, mass ${m2}×, separation ${sep}× a reference setting), this ${ratioPhrase(ratio)} compared to that reference (both masses ×1, separation ×1).`;
    drawInverseSquare();
  }

  [mass1Slider, mass2Slider, separationSlider].forEach((el) => el.addEventListener('input', updateInverseSquare));

  function renderStaticExamples() {
    const distanceRatio = OM.gravitationalForceRatio({ separationFactor: 2 });
    const massRatio = OM.gravitationalForceRatio({ massFactor1: 3 });
    exampleDistanceNote.textContent = `Twice as far apart, masses unchanged: ${ratioPhrase(distanceRatio)}.`;
    exampleMassNote.textContent = `Three times the mass, separation unchanged: ${ratioPhrase(massRatio)}.`;
  }

  // --- Real-world check: three figures, each with a small picture ----------

  function drawRealWorldCircular() {
    const ctx = realworldCircularCanvas.getContext('2d');
    const w = realworldCircularCanvas.width;
    const h = realworldCircularCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const earthR = 45;
    const pathR = earthR + 8;
    ctx.clearRect(0, 0, w, h);

    ctx.beginPath();
    ctx.arc(cx, cy, earthR, 0, Math.PI * 2);
    ctx.fillStyle = EARTH_COLOR;
    ctx.fill();

    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.arc(cx, cy, pathR, 0, Math.PI * 2);
    ctx.strokeStyle = PATH_COLOR;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    const markerAngle = -Math.PI / 2;
    const markerX = cx + pathR * Math.cos(markerAngle);
    const markerY = cy + pathR * Math.sin(markerAngle);
    ctx.beginPath();
    ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
    ctx.fillStyle = MARKER_COLOR;
    ctx.fill();

    drawArrowhead(ctx, markerX + 18, markerY - 2, markerX + 30, markerY - 2, MARKER_COLOR);
  }

  function drawRealWorldEscape() {
    const ctx = realworldEscapeCanvas.getContext('2d');
    const w = realworldEscapeCanvas.width;
    const h = realworldEscapeCanvas.height;
    const earthCx = 36;
    const earthCy = h - 36;
    const earthR = 32;
    ctx.clearRect(0, 0, w, h);

    ctx.beginPath();
    ctx.arc(earthCx, earthCy, earthR, 0, Math.PI * 2);
    ctx.fillStyle = EARTH_COLOR;
    ctx.fill();

    const startAngle = -Math.PI / 5;
    const startX = earthCx + earthR * Math.cos(startAngle);
    const startY = earthCy + earthR * Math.sin(startAngle);
    const endX = w - 10;
    const endY = 14;
    const controlX = earthCx + 70;
    const controlY = earthCy - 20;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(controlX, controlY, endX, endY);
    ctx.strokeStyle = PATH_COLOR;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(startX, startY, 5, 0, Math.PI * 2);
    ctx.fillStyle = MARKER_COLOR;
    ctx.fill();

    drawArrowhead(ctx, endX - 14, endY + 9, endX, endY, MARKER_COLOR);
  }

  function drawRealWorldIss() {
    const ctx = realworldIssCanvas.getContext('2d');
    const w = realworldIssCanvas.width;
    const h = realworldIssCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const earthR = 32;
    const pathR = earthR + 22; // altitude exaggerated well past true scale so it reads clearly
    ctx.clearRect(0, 0, w, h);

    ctx.beginPath();
    ctx.arc(cx, cy, earthR, 0, Math.PI * 2);
    ctx.fillStyle = EARTH_COLOR;
    ctx.fill();

    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.arc(cx, cy, pathR, 0, Math.PI * 2);
    ctx.strokeStyle = PATH_COLOR;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    const markerAngle = -Math.PI / 3;
    const markerX = cx + pathR * Math.cos(markerAngle);
    const markerY = cy + pathR * Math.sin(markerAngle);
    ctx.beginPath();
    ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
    ctx.fillStyle = MARKER_COLOR;
    ctx.fill();
    ctx.fillStyle = '#444';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ISS', markerX + 8, markerY - 6);
  }

  function drawArrowhead(ctx, x1, y1, x2, y2, color) {
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

  function renderRealWorldCheck() {
    realworldCircularValue.textContent = `≈ ${(V_CIRCULAR_SURFACE / 1000).toFixed(1)} km/s`;
    realworldEscapeValue.textContent = `≈ ${(V_ESCAPE_SURFACE / 1000).toFixed(1)} km/s (= √2 × circular speed)`;
    const period400 = OM.periodFromSemiMajorAxis(R + 400000, OM.EARTH_MASS_KG);
    const orbitsPerDay = (24 * 3600) / period400;
    realworldPeriodValue.textContent = `≈ ${(period400 / 60).toFixed(0)} minutes (≈ ${orbitsPerDay.toFixed(1)} orbits a day)`;

    circularSpeedValueEl.textContent = `${(V_CIRCULAR_SURFACE / 1000).toFixed(1)} km/s`;
    escapeSpeedValueEl.textContent = `${(V_ESCAPE_SURFACE / 1000).toFixed(1)} km/s`;

    drawRealWorldCircular();
    drawRealWorldEscape();
    drawRealWorldIss();
  }

  // --- Coverage, glossary, questions --------------------------------------

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    inverseSquareFormula:
      'Beyond the spec: the full equation is F = Gm₁m₂/r², where G is the gravitational constant. The exam never requires you to use this formula — only to reason about how the force changes, which is exactly what the sliders above let you check directly.',
  };

  launchSpeedSlider.value = V_CIRCULAR_LAUNCH / 1000; // visual position only — see updateCannon's own note
  updateCannon(V_CIRCULAR_LAUNCH / 1000);
  updateInverseSquare();
  renderStaticExamples();
  renderRealWorldCheck();
  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(OrbitsGravityQuestions.makeQuestions(OM));
})();
