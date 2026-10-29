(function () {
  const CURRICULUM_UNITS = ['u1.5', 'u1.18', 'u1.19', 'u1.20', 'u1.22', 'u1.25'];

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    darkAdaptation:
      "Dark adaptation: the gradual increase in your eyes' sensitivity in darkness, mostly complete after 20-30 minutes, as rod cells build up light-sensitive rhodopsin. A single bright light undoes most of it in seconds.",
    avertedVision:
      'Averted vision: looking slightly to one side of a faint object instead of straight at it, so its image falls on the rod-rich peripheral retina rather than the less light-sensitive centre.',
    radiant:
      "A meteor shower's radiant point: the point in the sky meteor trails appear to radiate from, a perspective effect of near-parallel debris particles all approaching Earth from the same direction.",
    skyglow:
      "Skyglow: the orange background haze over urban areas at night, caused by artificial light scattering off dust, moisture and pollution in the atmosphere — it raises the sky's brightness everywhere, not just near individual lights.",
    darkSkyPark:
      'A Dark Sky Park: an area officially designated and protected for its exceptionally low light pollution, through measures like shielded fixtures and limits on night-time lighting.',
    // seeingAndTransparency's definition is written directly in the HTML
    // (it needs a real link to earth-structure.html), not here — this
    // dict only overwrites a definition span with plain text, which
    // would strip that link out again on every page load.
  };

  // --- "What decides whether you can see it?": the horizon diagram --------

  const OBSTRUCTION_ALTITUDE_DEG = 15;
  const DOME_RADIUS = 165;
  const OBSERVER = { x: 70, y: 225 };

  const visibilityCanvas = document.getElementById('visibility-canvas');
  const visibilityCtx = visibilityCanvas.getContext('2d');
  const altitudeSlider = document.getElementById('altitude-slider');
  const altitudeLabel = document.getElementById('altitude-label');
  const landscapeToggle = document.getElementById('landscape-toggle');
  const weatherToggle = document.getElementById('weather-toggle');
  const pathLengthReadout = document.getElementById('path-length-readout');
  const visibilityStatusReadout = document.getElementById('visibility-status-readout');

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // Blue at the zenith (multiplier 1) fading to red toward the horizon
  // (multiplier 6+) — the same "redder at low altitude" effect the text
  // describes, shown directly in the diagram's own colour.
  function pathColor(multiplier) {
    const t = Math.max(0, Math.min(1, (multiplier - 1) / 5));
    const r = Math.round(lerp(42, 192, t));
    const g = Math.round(lerp(107, 57, t));
    const b = Math.round(lerp(214, 43, t));
    return `rgb(${r}, ${g}, ${b})`;
  }

  function drawVisibilityDiagram() {
    const altitudeDeg = Number(altitudeSlider.value);
    const landscapeOn = landscapeToggle.checked;
    const weatherOn = weatherToggle.checked;

    visibilityCtx.clearRect(0, 0, visibilityCanvas.width, visibilityCanvas.height);

    const skyGradient = visibilityCtx.createLinearGradient(0, 0, 0, OBSERVER.y);
    skyGradient.addColorStop(0, '#13213f');
    skyGradient.addColorStop(1, '#3a5a8c');
    visibilityCtx.fillStyle = skyGradient;
    visibilityCtx.fillRect(0, 0, visibilityCanvas.width, OBSERVER.y);

    visibilityCtx.fillStyle = '#3f6b4a';
    visibilityCtx.fillRect(0, OBSERVER.y, visibilityCanvas.width, visibilityCanvas.height - OBSERVER.y);

    // Thick cloud covers the whole sky, whatever the target's altitude —
    // a simple yes/no block, not something altitude can fix.
    if (weatherOn) {
      visibilityCtx.fillStyle = 'rgba(200, 200, 205, 0.85)';
      visibilityCtx.fillRect(0, 0, visibilityCanvas.width, OBSERVER.y);
      visibilityCtx.fillStyle = 'rgba(222, 222, 227, 0.9)';
      [
        [60, 60, 42],
        [150, 45, 55],
        [250, 65, 50],
        [330, 55, 38],
      ].forEach(([cx, cy, r]) => {
        visibilityCtx.beginPath();
        visibilityCtx.arc(cx, cy, r, 0, Math.PI * 2);
        visibilityCtx.fill();
      });
    }

    // Dome guide: a dotted quarter-circle from the horizon up to the
    // zenith, with a dashed zenith reference line.
    visibilityCtx.setLineDash([3, 5]);
    visibilityCtx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    visibilityCtx.lineWidth = 1;
    visibilityCtx.beginPath();
    visibilityCtx.arc(OBSERVER.x, OBSERVER.y, DOME_RADIUS, -Math.PI / 2, 0);
    visibilityCtx.stroke();
    visibilityCtx.setLineDash([4, 4]);
    visibilityCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    visibilityCtx.beginPath();
    visibilityCtx.moveTo(OBSERVER.x, OBSERVER.y);
    visibilityCtx.lineTo(OBSERVER.x, OBSERVER.y - DOME_RADIUS);
    visibilityCtx.stroke();
    visibilityCtx.setLineDash([]);

    // Landscape silhouette: a jagged skyline whose peak height matches
    // the stated obstruction altitude (schematic, not to scale).
    if (landscapeOn) {
      const riseHeight = DOME_RADIUS * Math.sin((OBSTRUCTION_ALTITUDE_DEG * Math.PI) / 180);
      visibilityCtx.fillStyle = '#1f3b26';
      visibilityCtx.beginPath();
      visibilityCtx.moveTo(OBSERVER.x, OBSERVER.y);
      visibilityCtx.lineTo(OBSERVER.x, OBSERVER.y - riseHeight * 0.4);
      visibilityCtx.lineTo(OBSERVER.x + 40, OBSERVER.y - riseHeight);
      visibilityCtx.lineTo(OBSERVER.x + 90, OBSERVER.y - riseHeight * 0.7);
      visibilityCtx.lineTo(OBSERVER.x + 150, OBSERVER.y - riseHeight);
      visibilityCtx.lineTo(OBSERVER.x + 210, OBSERVER.y - riseHeight * 0.5);
      visibilityCtx.lineTo(OBSERVER.x + 260, OBSERVER.y);
      visibilityCtx.closePath();
      visibilityCtx.fill();
    }

    const altitudeRad = (altitudeDeg * Math.PI) / 180;
    const objectX = OBSERVER.x + DOME_RADIUS * Math.cos(altitudeRad);
    const objectY = OBSERVER.y - DOME_RADIUS * Math.sin(altitudeRad);

    const blockedByLandscape = landscapeOn && altitudeDeg < OBSTRUCTION_ALTITUDE_DEG;
    const blockedByWeather = weatherOn;
    const visible = !blockedByLandscape && !blockedByWeather;

    // Guard altitude 0 for the colour/width maths only — the readout
    // text below shows the real (unclamped) multiplier.
    const multiplierForDrawing = VisibilityFactors.pathLengthMultiplier(Math.max(altitudeDeg, 0.5));

    if (visible) {
      const color = pathColor(multiplierForDrawing);
      const width = Math.max(2, Math.min(14, 2 + multiplierForDrawing * 1.6));
      visibilityCtx.beginPath();
      visibilityCtx.moveTo(objectX, objectY);
      visibilityCtx.lineTo(OBSERVER.x, OBSERVER.y);
      visibilityCtx.strokeStyle = color;
      visibilityCtx.lineWidth = width;
      visibilityCtx.lineCap = 'round';
      visibilityCtx.stroke();

      visibilityCtx.beginPath();
      visibilityCtx.arc(objectX, objectY, 7, 0, Math.PI * 2);
      visibilityCtx.fillStyle = color;
      visibilityCtx.fill();
      visibilityCtx.beginPath();
      visibilityCtx.arc(objectX, objectY, 11, 0, Math.PI * 2);
      visibilityCtx.strokeStyle = color;
      visibilityCtx.globalAlpha = 0.4;
      visibilityCtx.lineWidth = 1.5;
      visibilityCtx.stroke();
      visibilityCtx.globalAlpha = 1;
    } else {
      // A faint ghost marker, so the slider's own effect on position is
      // still visible even while something else blocks the view.
      visibilityCtx.beginPath();
      visibilityCtx.arc(objectX, objectY, 6, 0, Math.PI * 2);
      visibilityCtx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      visibilityCtx.fill();
    }

    visibilityCtx.beginPath();
    visibilityCtx.arc(OBSERVER.x, OBSERVER.y, 5, 0, Math.PI * 2);
    visibilityCtx.fillStyle = '#f5e6c8';
    visibilityCtx.fill();

    altitudeLabel.textContent = `${altitudeDeg}°`;
    const realMultiplier = VisibilityFactors.pathLengthMultiplier(altitudeDeg);
    pathLengthReadout.textContent =
      altitudeDeg <= 0
        ? '×∞ (the flat-layer model breaks down exactly at the horizon)'
        : `×${realMultiplier.toFixed(1)} the zenith (straight-up) path`;

    if (blockedByWeather) {
      visibilityStatusReadout.textContent = 'No — hidden by cloud.';
    } else if (blockedByLandscape) {
      visibilityStatusReadout.textContent = `No — blocked by the landscape (below ${OBSTRUCTION_ALTITUDE_DEG}°).`;
    } else if (altitudeDeg < 5) {
      visibilityStatusReadout.textContent = 'Yes, but very low — expect it to look dim, reddened and to twinkle a lot.';
    } else {
      visibilityStatusReadout.textContent = 'Yes.';
    }
  }

  altitudeSlider.addEventListener('input', drawVisibilityDiagram);
  landscapeToggle.addEventListener('change', drawVisibilityDiagram);
  weatherToggle.addEventListener('change', drawVisibilityDiagram);

  renderCoverage();
  Glossary.init(GLOSSARY);
  drawVisibilityDiagram();
  QuizUI.mount(ObservingTechniquesQuestions.makeQuestions(VisibilityFactors));
})();
