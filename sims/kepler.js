(function () {
  const CURRICULUM_UNITS = ['u3.9', 'u3.10', 'u3.11', 'u3.12'];
  const OM = OrbitalMechanics;
  const SD = SpecData;

  const SUN_COLOR = '#f5a623';
  const PLANET_COLOR = '#2a6bd6';
  const ORBIT_LINE_COLOR = '#b7c3d1';
  const WEDGE_COLORS = ['rgba(42, 107, 214, 0.10)', 'rgba(42, 107, 214, 0.22)'];

  // A fixed semi-major axis of 1 AU around 1 solar mass, so the
  // "Animate" button always represents one real year, whatever the
  // eccentricity slider is set to — period depends only on the
  // semi-major axis (Kepler's third law), never on eccentricity.
  const SEMI_MAJOR_AXIS_AU = 1;
  const WEDGE_COUNT = 12;

  // --- Shared orbit state ---------------------------------------------

  const state = {
    eccentricity: 0.5,
    meanAnomaly: 0, // radians, 0 = perihelion
  };

  // --- DOM references --------------------------------------------------

  const eccentricitySlider = document.getElementById('eccentricity-slider');
  const eccentricityLabel = document.getElementById('eccentricity-label');
  const playButton = document.getElementById('play-button');
  const distanceValue = document.getElementById('distance-value');
  const speedValue = document.getElementById('speed-value');
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
  // the Sun visibly sits off-centre towards perihelion, and the
  // half-width of the drawn ellipse (the semi-major axis itself) stays
  // constant on screen whatever the eccentricity, since that distance
  // doesn't depend on e.
  function makeOrbitView(canvas) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const padding = 46;
    const availableRadius = Math.min(canvas.width, canvas.height) / 2 - padding;
    const scale = availableRadius / SEMI_MAJOR_AXIS_AU;
    const c = SEMI_MAJOR_AXIS_AU * state.eccentricity;
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
    const r = OM.radiusAtTrueAnomaly(nu, SEMI_MAJOR_AXIS_AU, state.eccentricity);
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

  function drawPlanet(ctx, view) {
    const nu = OM.trueAnomaly(state.meanAnomaly, state.eccentricity);
    const p = orbitPointAtTrueAnomaly(nu);
    const s = view.toScreen(p.x, p.y);
    ctx.beginPath();
    ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = PLANET_COLOR;
    ctx.fill();
    ctx.strokeStyle = '#173d75';
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

    const peri = OM.perihelionDistance(SEMI_MAJOR_AXIS_AU, state.eccentricity);
    const apo = OM.aphelionDistance(SEMI_MAJOR_AXIS_AU, state.eccentricity);
    drawApsisMarker(ctx, view, peri, 0, 'Perihelion', 'right');
    drawApsisMarker(ctx, view, -apo, 0, 'Aphelion', 'left');

    drawPlanet(ctx, view);

    ctx.fillStyle = '#8a97a5';
    ctx.font = 'italic 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Not to scale', 8, orbitCanvas.height - 10);
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
  function formatDistanceAU(au) {
    return `${au.toFixed(2)} AU (${Math.round((au * SD.CONSTANTS.auKm) / 1e6)} million km)`;
  }

  function formatSpeed(kmPerS) {
    return `${kmPerS.toFixed(1)} km/s`;
  }

  function updateOrbitAssumption() {
    orbitAssumption.textContent =
      `Distance and speed above assume a semi-major axis of 1 AU around the Sun (1 solar mass), ` +
      `at the eccentricity set by the slider (e = ${state.eccentricity.toFixed(2)}) — from the ` +
      `vis-viva equation, checked against this perihelion/aphelion speed ratio in test/orbitalMechanics.test.js.`;
  }

  function drawSecondLaw() {
    const ctx = secondLawCanvas.getContext('2d');
    ctx.clearRect(0, 0, secondLawCanvas.width, secondLawCanvas.height);
    const view = makeOrbitView(secondLawCanvas);

    drawWedges(ctx, view);
    drawEllipseOutline(ctx, view);
    drawSun(ctx, view);
    const { r } = drawPlanet(ctx, view);

    ctx.fillStyle = '#8a97a5';
    ctx.font = 'italic 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${WEDGE_COUNT} equal time intervals — every wedge has the same area`, 8, secondLawCanvas.height - 10);

    const distanceM = r * OM.AU_M;
    const speedMPerS = OM.orbitalSpeed(distanceM, SEMI_MAJOR_AXIS_AU * OM.AU_M, OM.SOLAR_MASS_KG);
    distanceValue.textContent = formatDistanceAU(r);
    speedValue.textContent = formatSpeed(speedMPerS / 1000);
    updateOrbitAssumption();
  }

  function redrawOrbitDiagrams() {
    drawOrbitView();
    drawSecondLaw();
  }

  // --- Animation: advance mean anomaly, one full sweep per ORBIT_SECONDS -

  const ORBIT_SECONDS = 10; // one real year, played out over 10 seconds
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
    eccentricityLabel.textContent = state.eccentricity.toFixed(2);
    redrawOrbitDiagrams();
  });

  // --- Diagram 3: Kepler's third law, T² against r³ -------------------

  const GRAPH_MARGIN = { left: 60, right: 20, top: 15, bottom: 45 };
  // The exam data sheet's own rounded figures (src/specData.js), not the
  // engine's precise PLANETARY_DATA — see that file's header comment on
  // why the two tiers exist and test/specData.test.js for how they're
  // kept from drifting apart.
  const PLANETS = SD.PLANETARY_DATA.filter((body) => body.type === 'planet');

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

    // Each real planet, as a point.
    PLANETS.forEach((p) => {
      const r3 = Math.pow(p.distanceAU, 3);
      const t2 = Math.pow(p.periodYears, 2);
      const x = xFor(r3);
      const y = yFor(t2);
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#f5a623';
      ctx.fill();
      ctx.strokeStyle = '#c9820a';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    // Labels drawn in a second pass so they sit on top of every point.
    ctx.fillStyle = '#444';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    PLANETS.forEach((p) => {
      const r3 = Math.pow(p.distanceAU, 3);
      const t2 = Math.pow(p.periodYears, 2);
      ctx.fillText(p.name, xFor(r3) + 7, yFor(t2) - 4);
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
      `Line through the real planets (exam data sheet values): slope ≈ 1.00 years²/AU³ — T²/r³ for every planet is close to 1, within the data sheet's own rounding (test/specData.test.js checks this against the engine's precise figures too).` +
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
      "Eccentricity: a number from 0 (a perfect circle) up to just under 1 (a very stretched ellipse) describing how elongated an orbit is. Earth's is only 0.0167 — nearly circular.",
  };

  eccentricityLabel.textContent = state.eccentricity.toFixed(2);
  redrawOrbitDiagrams();
  updateMassReadout();
  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(KeplerQuestions.makeQuestions(OM, SD));
})();
