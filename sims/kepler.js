(function () {
  const CURRICULUM_UNITS = ['u3.9', 'u3.10', 'u3.11', 'u3.12'];
  const OM = OrbitalMechanics;
  const SD = SpecData;

  const SUN_COLOR = '#f5a623';
  const PLANET_COLOR = '#2a6bd6';
  const ORBIT_LINE_COLOR = '#b7c3d1';
  const WEDGE_COLORS = ['rgba(42, 107, 214, 0.10)', 'rgba(42, 107, 214, 0.22)'];
  const COMET_COLOR = '#8e5fc9';

  const WEDGE_COUNT = 12;

  // Orbits with eccentricity at or above this look comet-like (a visible
  // tail), below it they're drawn as a plain planet dot — not a precise
  // physical boundary (real comets range more widely), just a reasonable
  // cutoff so Earth (e=0.017) and the default view (e=0.5) stay plain
  // while every comet preset (e >= 0.85) gets a tail.
  const COMET_ECCENTRICITY_THRESHOLD = 0.6;

  // --- Shared orbit state ---------------------------------------------

  const state = {
    eccentricity: 0.5,
    semiMajorAxisAU: 1,
    meanAnomaly: 0, // radians, 0 = perihelion
  };

  // --- DOM references --------------------------------------------------

  const eccentricitySlider = document.getElementById('eccentricity-slider');
  const eccentricityLabel = document.getElementById('eccentricity-label');
  const semiMajorAxisSlider = document.getElementById('semi-major-axis-slider');
  const semiMajorAxisLabel = document.getElementById('semi-major-axis-label');
  const presetButtons = document.querySelectorAll('.preset-button[data-preset]');
  const presetNote = document.getElementById('preset-note');
  const playButton = document.getElementById('play-button');
  const distanceValue = document.getElementById('distance-value');
  const speedValue = document.getElementById('speed-value');
  const periodValue = document.getElementById('period-value');
  const perihelionDistanceValue = document.getElementById('perihelion-distance-value');
  const perihelionSpeedValue = document.getElementById('perihelion-speed-value');
  const aphelionDistanceValue = document.getElementById('aphelion-distance-value');
  const aphelionSpeedValue = document.getElementById('aphelion-speed-value');
  const massSelect = document.getElementById('mass-select');
  const massReadout = document.getElementById('mass-readout');
  const orbitAssumption = document.getElementById('orbit-assumption');
  const orbitCanvas = document.getElementById('orbit-view');
  const secondLawCanvas = document.getElementById('second-law');
  const thirdLawCanvas = document.getElementById('third-law-graph');
  const slopeReadout = document.getElementById('slope-readout');

  // --- Shared drawing helpers -------------------------------------------

  // Maps orbital-plane coordinates (focus at the origin, periapsis along
  // +x, y up) to canvas pixels. The ellipse's own centre — not its focus
  // — sits at the canvas centre, offset from the focus by c = a*e, so
  // the Sun visibly sits off-centre towards perihelion. The scale is
  // recomputed from the CURRENT semi-major axis on every call, so the
  // view automatically rescales to fit whatever orbit is selected,
  // whether that's Earth's 1 AU or a comet's 20,000 AU — see the note
  // on the page explaining that two differently-scaled orbits can look
  // the same size here.
  function makeOrbitView(canvas) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const padding = 46;
    const availableRadius = Math.min(canvas.width, canvas.height) / 2 - padding;
    const scale = availableRadius / state.semiMajorAxisAU;
    const c = state.semiMajorAxisAU * state.eccentricity;
    return {
      cx,
      cy,
      scale,
      c,
      toScreen(x, y) {
        return { x: cx + (x + c) * scale, y: cy - y * scale };
      },
    };
  }

  function orbitPointAtTrueAnomaly(nu) {
    const r = OM.radiusAtTrueAnomaly(nu, state.semiMajorAxisAU, state.eccentricity);
    return { x: r * Math.cos(nu), y: r * Math.sin(nu), r };
  }

  function drawEllipseOutline(ctx, view) {
    ctx.beginPath();
    const steps = 180;
    for (let i = 0; i <= steps; i += 1) {
      const nu = (2 * Math.PI * i) / steps;
      const p = orbitPointAtTrueAnomaly(nu);
      const s = view.toScreen(p.x, p.y);
      if (i === 0) ctx.moveTo(s.x, s.y);
      else ctx.lineTo(s.x, s.y);
    }
    ctx.closePath();
    ctx.strokeStyle = ORBIT_LINE_COLOR;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawSun(ctx, view) {
    const s = view.toScreen(0, 0);
    ctx.beginPath();
    ctx.arc(s.x, s.y, 11, 0, Math.PI * 2);
    ctx.fillStyle = SUN_COLOR;
    ctx.fill();
    ctx.strokeStyle = '#c9820a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function isCometLike() {
    return state.eccentricity >= COMET_ECCENTRICITY_THRESHOLD;
  }

  // A comet's tail always points directly away from the Sun (pushed out
  // by the solar wind and radiation pressure, not left behind by its
  // motion), and grows as it nears the Sun. Modelled simply, as an
  // inverse relationship with distance, capped so it never dwarfs the
  // orbit itself: a 0.35*a-long tail right at perihelion, shrinking
  // fast with distance, and negligible by aphelion for any eccentric
  // orbit. Drawn as a gradient fading from near-white at the nucleus to
  // transparent at the tip, rather than a flat fill, since a flat pale
  // blue is barely distinguishable from the canvas's own background.
  function drawCometTail(ctx, view, p, s) {
    const perihelionAU = OM.perihelionDistance(state.semiMajorAxisAU, state.eccentricity);
    const maxTailAU = state.semiMajorAxisAU * 0.4;
    const tailLengthAU = Math.min(maxTailAU, (perihelionAU * maxTailAU) / p.r);
    if (tailLengthAU < state.semiMajorAxisAU * 0.012) return;

    const ux = p.x / p.r;
    const uy = p.y / p.r;
    const perpX = -uy;
    const perpY = ux;
    // A floor on the half-width in pixels (not just AU), so the tail
    // stays a visible wedge rather than a razor-thin sliver once it's
    // been scaled down for a huge orbit.
    const halfWidthAU = Math.max(tailLengthAU * 0.22, 3 / view.scale);

    const tip = view.toScreen(p.x + ux * tailLengthAU, p.y + uy * tailLengthAU);
    const left = view.toScreen(p.x + perpX * halfWidthAU, p.y + perpY * halfWidthAU);
    const right = view.toScreen(p.x - perpX * halfWidthAU, p.y - perpY * halfWidthAU);

    const gradient = ctx.createLinearGradient(s.x, s.y, tip.x, tip.y);
    gradient.addColorStop(0, 'rgba(110, 185, 228, 0.95)');
    gradient.addColorStop(0.55, 'rgba(140, 200, 232, 0.5)');
    gradient.addColorStop(1, 'rgba(170, 212, 236, 0)');

    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(tip.x, tip.y);
    ctx.lineTo(right.x, right.y);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  function drawBody(ctx, view) {
    const nu = OM.trueAnomaly(state.meanAnomaly, state.eccentricity);
    const p = orbitPointAtTrueAnomaly(nu);
    const comet = isCometLike();
    const s = view.toScreen(p.x, p.y);
    if (comet) drawCometTail(ctx, view, p, s);
    ctx.beginPath();
    ctx.arc(s.x, s.y, comet ? 5 : 8, 0, Math.PI * 2);
    ctx.fillStyle = comet ? '#e8eef5' : PLANET_COLOR;
    ctx.fill();
    ctx.strokeStyle = comet ? '#6b7684' : '#173d75';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    return { nu, r: p.r };
  }

  function drawApsisMarker(ctx, view, x, y, label, side) {
    const s = view.toScreen(x, y);
    ctx.beginPath();
    ctx.arc(s.x, s.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#6b7684';
    ctx.fill();
    ctx.fillStyle = '#3a3f4d';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = side === 'left' ? 'right' : 'left';
    ctx.textBaseline = 'middle';
    const dx = side === 'left' ? -10 : 10;
    ctx.fillText(label, s.x + dx, s.y);
  }

  // --- Diagram 1: orbit view --------------------------------------------

  function drawOrbitView() {
    const ctx = orbitCanvas.getContext('2d');
    ctx.clearRect(0, 0, orbitCanvas.width, orbitCanvas.height);
    const view = makeOrbitView(orbitCanvas);

    drawEllipseOutline(ctx, view);
    drawSun(ctx, view);

    const extremes = OM.orbitExtremes(state.semiMajorAxisAU * OM.AU_M, state.eccentricity, OM.SOLAR_MASS_KG);
    const peri = extremes.periDistance / OM.AU_M;
    const apo = extremes.apoDistance / OM.AU_M;
    drawApsisMarker(ctx, view, peri, 0, 'Perihelion', 'right');
    drawApsisMarker(ctx, view, -apo, 0, 'Aphelion', 'left');

    perihelionDistanceValue.textContent = formatDistanceAU(peri);
    perihelionSpeedValue.textContent = formatSpeed(extremes.periSpeed / 1000);
    aphelionDistanceValue.textContent = formatDistanceAU(apo);
    aphelionSpeedValue.textContent = formatSpeed(extremes.apoSpeed / 1000);

    drawBody(ctx, view);

    ctx.fillStyle = '#8a97a5';
    ctx.font = 'italic 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Not to scale — rescales to fit whatever orbit is shown', 8, orbitCanvas.height - 10);
  }

  // --- Diagram 2: second law (equal-area wedges) -------------------------

  function wedgePoints(startM, endM, samples) {
    const points = [];
    for (let i = 0; i <= samples; i += 1) {
      const m = startM + ((endM - startM) * i) / samples;
      const nu = OM.trueAnomaly(m, state.eccentricity);
      points.push(orbitPointAtTrueAnomaly(nu));
    }
    return points;
  }

  function drawWedges(ctx, view) {
    for (let k = 0; k < WEDGE_COUNT; k += 1) {
      const startM = (2 * Math.PI * k) / WEDGE_COUNT;
      const endM = (2 * Math.PI * (k + 1)) / WEDGE_COUNT;
      const points = wedgePoints(startM, endM, 6);
      ctx.beginPath();
      const sun = view.toScreen(0, 0);
      ctx.moveTo(sun.x, sun.y);
      points.forEach((p) => {
        const s = view.toScreen(p.x, p.y);
        ctx.lineTo(s.x, s.y);
      });
      ctx.closePath();
      ctx.fillStyle = WEDGE_COLORS[k % 2];
      ctx.fill();
      ctx.strokeStyle = 'rgba(42, 107, 214, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // The million-km conversion is a readout a student would reproduce by
  // hand from the exam data sheet's own 1 AU = 1.5 × 10⁸ km, so it uses
  // SpecData's rounded constant rather than the engine's precise AU_KM —
  // the underlying physics (orbitalSpeed below) still needs the precise
  // value, since G and the Sun's mass aren't on the data sheet at all.
  // Above 1000 AU the km conversion stops being a meaningful readout, so
  // it's dropped in favour of just the (comma-grouped) AU figure.
  function formatDistanceAU(au) {
    if (au >= 1000) return `${Math.round(au).toLocaleString()} AU`;
    return `${au.toFixed(2)} AU (${Math.round((au * SD.CONSTANTS.auKm) / 1e6).toLocaleString()} million km)`;
  }

  function formatSemiMajorAxis(au) {
    if (au >= 1000) return `${Math.round(au).toLocaleString()} AU`;
    if (au >= 10) return `${au.toFixed(1)} AU`;
    return `${au.toFixed(2)} AU`;
  }

  // Adaptive precision: a comet's aphelion speed can be a small fraction
  // of a km/s, where one decimal place would misleadingly round to "0.0".
  function formatSpeed(kmPerS) {
    if (kmPerS < 1) return `${kmPerS.toFixed(3)} km/s`;
    if (kmPerS < 10) return `${kmPerS.toFixed(2)} km/s`;
    return `${kmPerS.toFixed(1)} km/s`;
  }

  function formatPeriod(years) {
    if (years >= 1e6) return `${(years / 1e6).toFixed(2)} million years`;
    if (years >= 1) return `${years.toFixed(2)} years`;
    return `${(years * 365.25).toFixed(1)} days`;
  }

  function updateOrbitAssumption() {
    orbitAssumption.textContent =
      `Distance, speed and period above assume a semi-major axis of ${formatSemiMajorAxis(state.semiMajorAxisAU)} ` +
      `around the Sun (1 solar mass), at the eccentricity set by the slider (e = ${state.eccentricity.toFixed(3)}) — ` +
      `from the vis-viva equation, which reproduces the known perihelion/aphelion speed ratios for an elliptical orbit.`;
  }

  function drawSecondLaw() {
    const ctx = secondLawCanvas.getContext('2d');
    ctx.clearRect(0, 0, secondLawCanvas.width, secondLawCanvas.height);
    const view = makeOrbitView(secondLawCanvas);

    drawWedges(ctx, view);
    drawEllipseOutline(ctx, view);
    drawSun(ctx, view);
    const { r } = drawBody(ctx, view);

    ctx.fillStyle = '#8a97a5';
    ctx.font = 'italic 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${WEDGE_COUNT} equal time intervals — every wedge has the same area`, 8, secondLawCanvas.height - 10);

    const distanceM = r * OM.AU_M;
    const semiMajorAxisM = state.semiMajorAxisAU * OM.AU_M;
    const speedMPerS = OM.orbitalSpeed(distanceM, semiMajorAxisM, OM.SOLAR_MASS_KG);
    distanceValue.textContent = formatDistanceAU(r);
    speedValue.textContent = formatSpeed(speedMPerS / 1000);
    periodValue.textContent = formatPeriod(OM.periodYearsFromSemiMajorAxisAU(state.semiMajorAxisAU));
    updateOrbitAssumption();
  }

  function redrawOrbitDiagrams() {
    drawOrbitView();
    drawSecondLaw();
  }

  // --- Animation: advance mean anomaly, one full sweep per ORBIT_SECONDS -
  //
  // One full animated sweep always represents one full orbit of whatever
  // body is currently selected — a few seconds on screen whether that
  // orbit really takes one year (Earth) or 2.8 million years (the
  // long-period comet). Only the semi-major axis changes the real
  // period (Kepler's third law); eccentricity alone never does.

  const ORBIT_SECONDS = 10;
  let animationFrameId = null;
  let lastFrameTime = null;

  function stopAnimation() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    lastFrameTime = null;
    playButton.textContent = '▶ Animate';
    playButton.setAttribute('aria-pressed', 'false');
  }

  function startAnimation() {
    playButton.textContent = '❚❚ Pause';
    playButton.setAttribute('aria-pressed', 'true');
    function step(now) {
      if (lastFrameTime !== null) {
        const dt = (now - lastFrameTime) / 1000;
        state.meanAnomaly = (state.meanAnomaly + (2 * Math.PI * dt) / ORBIT_SECONDS) % (2 * Math.PI);
        redrawOrbitDiagrams();
      }
      lastFrameTime = now;
      animationFrameId = requestAnimationFrame(step);
    }
    animationFrameId = requestAnimationFrame(step);
  }

  playButton.addEventListener('click', () => {
    if (animationFrameId !== null) stopAnimation();
    else startAnimation();
  });

  eccentricitySlider.addEventListener('input', () => {
    state.eccentricity = Number(eccentricitySlider.value);
    eccentricityLabel.textContent = state.eccentricity.toFixed(3);
    redrawOrbitDiagrams();
  });

  // Logarithmic: the slider's own value is log10(semi-major axis in AU),
  // so one control can sensibly span 0.1 AU up to 20,000+ AU — a linear
  // slider over that range would squeeze every planet into a sliver at
  // one end.
  function semiMajorAxisFromSliderValue(v) {
    return Math.pow(10, Number(v));
  }

  function sliderValueFromSemiMajorAxis(au) {
    return Math.log10(au);
  }

  semiMajorAxisSlider.addEventListener('input', () => {
    state.semiMajorAxisAU = semiMajorAxisFromSliderValue(semiMajorAxisSlider.value);
    semiMajorAxisLabel.textContent = formatSemiMajorAxis(state.semiMajorAxisAU);
    redrawOrbitDiagrams();
  });

  // --- Presets: planet and comet orbits -----------------------------------
  //
  // Earth's semi-major axis matches the exam data sheet's 1 AU; every
  // other figure here — including Earth's own eccentricity — is an
  // approximate value for illustration, not from the exam data sheet.

  const PRESETS = [
    {
      id: 'earth',
      label: 'Earth',
      semiMajorAxisAU: 1,
      eccentricity: 0.017,
      note:
        "Earth's own orbit — the semi-major axis matches the exam data sheet's 1 AU; the eccentricity (0.017) is the precise real value, far more detail than the data sheet needs.",
    },
    {
      id: 'halley',
      label: "Halley's Comet",
      semiMajorAxisAU: 17.8,
      eccentricity: 0.967,
      note:
        'Approximate values, not from the exam data sheet. Period from these: about 75 years (computed live below) — Halley last passed perihelion in 1986, and is due back around 2061.',
    },
    {
      id: 'encke',
      label: "Encke's Comet",
      semiMajorAxisAU: 2.2,
      eccentricity: 0.85,
      note:
        'Approximate values, not from the exam data sheet. A short-period comet, back every ~3.3 years (computed live below) — one of the shortest periods of any known comet.',
    },
    {
      id: 'long-period',
      label: 'Long-period comet (illustrative)',
      semiMajorAxisAU: 20000,
      eccentricity: 0.99,
      note:
        "Illustrative only — not a real, measured comet. Shows how far Kepler's third law extrapolates: a semi-major axis of 20,000 AU gives a period of about 2.8 million years (computed live below, from T² = r³).",
    },
  ];

  function applyPreset(preset) {
    stopAnimation();
    state.eccentricity = preset.eccentricity;
    state.semiMajorAxisAU = preset.semiMajorAxisAU;
    state.meanAnomaly = 0;
    // Slider .value snaps to the nearest step on every set, so the
    // sliders are updated for visual feedback only — state above holds
    // the exact preset figures regardless of how that snaps.
    eccentricitySlider.value = preset.eccentricity;
    eccentricityLabel.textContent = state.eccentricity.toFixed(3);
    semiMajorAxisSlider.value = sliderValueFromSemiMajorAxis(preset.semiMajorAxisAU);
    semiMajorAxisLabel.textContent = formatSemiMajorAxis(state.semiMajorAxisAU);
    presetNote.textContent = preset.note;
    redrawOrbitDiagrams();
  }

  presetButtons.forEach((button) => {
    const preset = PRESETS.find((p) => p.id === button.dataset.preset);
    if (!preset) return;
    button.addEventListener('click', () => applyPreset(preset));
  });

  // --- Diagram 3: Kepler's third law, T² against r³ -------------------

  const GRAPH_MARGIN = { left: 60, right: 20, top: 15, bottom: 45 };
  // The exam data sheet's own rounded figures (src/specData.js), not the
  // engine's precise PLANETARY_DATA — see that file's header comment on
  // why the two tiers exist and test/specData.test.js for how they're
  // kept from drifting apart.
  const PLANETS = SD.PLANETARY_DATA.filter((body) => body.type === 'planet');

  // Same approximate figures as the Halley/Encke presets above — not on
  // the exam data sheet, plotted to show comets fall on the same T²=r³
  // line as the planets. test/orbitalMechanics.test.js checks these two
  // pairs satisfy Kepler's third law.
  const COMETS = [
    { name: "Halley's Comet", distanceAU: 17.8, periodYears: 75 },
    { name: "Encke's Comet", distanceAU: 2.2, periodYears: 3.3 },
  ];

  function graphScales(maxR3, maxT2) {
    const width = thirdLawCanvas.width;
    const height = thirdLawCanvas.height;
    const xFor = (r3) => GRAPH_MARGIN.left + (r3 / maxR3) * (width - GRAPH_MARGIN.left - GRAPH_MARGIN.right);
    const yFor = (t2) => height - GRAPH_MARGIN.bottom - (t2 / maxT2) * (height - GRAPH_MARGIN.top - GRAPH_MARGIN.bottom);
    return { xFor, yFor, width, height };
  }

  function massMultiplier() {
    return Number(massSelect.value);
  }

  function plotPoint(ctx, xFor, yFor, distanceAU, periodYears, color) {
    const x = xFor(Math.pow(distanceAU, 3));
    const y = yFor(Math.pow(periodYears, 2));
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawThirdLawGraph() {
    const ctx = thirdLawCanvas.getContext('2d');
    const maxR3 = Math.max(...PLANETS.map((p) => Math.pow(p.distanceAU, 3))) * 1.08;
    const maxT2 = Math.max(...PLANETS.map((p) => Math.pow(p.periodYears, 2))) * 1.08;
    const { xFor, yFor, width, height } = graphScales(maxR3, maxT2);

    ctx.clearRect(0, 0, width, height);

    // Gridlines and axis labels.
    ctx.strokeStyle = '#e5e9ee';
    ctx.fillStyle = '#8a97a5';
    ctx.font = '11px sans-serif';
    const xStep = Math.pow(10, Math.floor(Math.log10(maxR3))) || 1;
    const yStep = Math.pow(10, Math.floor(Math.log10(maxT2))) || 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let v = 0; v <= maxR3; v += xStep) {
      const x = xFor(v);
      ctx.beginPath();
      ctx.moveTo(x, GRAPH_MARGIN.top);
      ctx.lineTo(x, height - GRAPH_MARGIN.bottom);
      ctx.stroke();
      ctx.fillText(Math.round(v).toLocaleString(), x, height - GRAPH_MARGIN.bottom + 6);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let v = 0; v <= maxT2; v += yStep) {
      const y = yFor(v);
      ctx.beginPath();
      ctx.moveTo(GRAPH_MARGIN.left, y);
      ctx.lineTo(width - GRAPH_MARGIN.right, y);
      ctx.stroke();
      ctx.fillText(Math.round(v).toLocaleString(), GRAPH_MARGIN.left - 8, y);
    }

    // The theoretical line for our Sun: T² = r³, slope 1.
    ctx.beginPath();
    ctx.moveTo(xFor(0), yFor(0));
    ctx.lineTo(xFor(maxR3), yFor(maxR3));
    ctx.strokeStyle = '#2a6bd6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // The comparison line for the chosen central mass: T² = r³ /
    // multiplier, from OrbitalMechanics.tSquaredOverRCubed's own
    // inverse-mass relationship.
    const multiplier = massMultiplier();
    if (multiplier !== 1) {
      ctx.beginPath();
      ctx.moveTo(xFor(0), yFor(0));
      ctx.lineTo(xFor(maxR3), yFor(maxR3 / multiplier));
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Each real planet, then each comet, as a point.
    PLANETS.forEach((p) => plotPoint(ctx, xFor, yFor, p.distanceAU, p.periodYears, '#f5a623'));
    COMETS.forEach((c) => plotPoint(ctx, xFor, yFor, c.distanceAU, c.periodYears, COMET_COLOR));

    // Labels drawn in a second pass so they sit on top of every point.
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#444';
    PLANETS.forEach((p) => {
      ctx.fillText(p.name, xFor(Math.pow(p.distanceAU, 3)) + 7, yFor(Math.pow(p.periodYears, 2)) - 4);
    });
    ctx.fillStyle = COMET_COLOR;
    COMETS.forEach((c) => {
      ctx.fillText(c.name, xFor(Math.pow(c.distanceAU, 3)) + 7, yFor(Math.pow(c.periodYears, 2)) - 4);
    });

    // Axis titles.
    ctx.fillStyle = '#555';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('r³ (AU³)', width / 2, height - GRAPH_MARGIN.bottom + 24);
    ctx.save();
    ctx.translate(16, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('T² (years²)', 0, 0);
    ctx.restore();

    slopeReadout.textContent =
      `Line through the real planets (exam data sheet values): slope ≈ 1.00 years²/AU³ — T²/r³ for every planet is close to 1, within the data sheet's own rounding. ` +
      `Halley's and Encke's comets (purple, not on the exam data sheet) fall on the same line — Kepler's third law doesn't care whether an orbiting body is a planet or a comet.` +
      (multiplier !== 1
        ? ` Dashed line: the same r³ values around a ${multiplier}×-solar-mass star instead — slope ≈ ${(1 / multiplier).toFixed(2)}.`
        : '');
  }

  function updateMassReadout() {
    const multiplier = massMultiplier();
    const centralMassKg = OM.SOLAR_MASS_KG * multiplier;
    const periodSeconds = OM.periodFromSemiMajorAxis(OM.AU_M, centralMassKg);
    const periodYears = periodSeconds / OM.YEAR_SECONDS;
    const constant = OM.tSquaredOverRCubed(periodYears, 1);
    massReadout.textContent =
      `At 1 AU from a star of ${multiplier}× the Sun's mass, a planet's period would be ${periodYears.toFixed(2)} years ` +
      `(T²/r³ = ${constant.toFixed(2)} years²/AU³, vs 1.00 for our own Sun) — ${multiplier}× the mass gives ` +
      `${(1 / multiplier).toFixed(2)}× the constant: the relationship is inverse.`;
    drawThirdLawGraph();
  }

  massSelect.addEventListener('change', updateMassReadout);

  // --- Coverage, glossary, questions --------------------------------------

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    perihelion: 'Perihelion: the point in an orbit around the Sun where an object is closest to it.',
    aphelion: 'Aphelion: the point in an orbit around the Sun where an object is farthest from it.',
    eccentricity:
      "Eccentricity: a number from 0 (a perfect circle) up to just under 1 (a very stretched ellipse) describing how elongated an orbit is. Earth's is only 0.017 — nearly circular — while comets like Halley's can exceed 0.9.",
  };

  eccentricityLabel.textContent = state.eccentricity.toFixed(3);
  semiMajorAxisLabel.textContent = formatSemiMajorAxis(state.semiMajorAxisAU);
  semiMajorAxisSlider.value = sliderValueFromSemiMajorAxis(state.semiMajorAxisAU);
  redrawOrbitDiagrams();
  updateMassReadout();
  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(KeplerQuestions.makeQuestions(OM, SD));
})();
