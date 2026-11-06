(function () {
  const CURRICULUM_UNITS = ['u1.5', 'u1.18', 'u1.19', 'u1.20', 'u1.22', 'u1.25'];

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    darkAdaptationDetail:
      "Dark adaptation is the process by which your rod cells — the retina's low-light receptors — build up a light-sensitive pigment called rhodopsin, gradually increasing your sensitivity over about 20-30 minutes. A single glance at a bright white light (a phone screen, a car's headlights, a torch) bleaches that pigment and undoes most of the adaptation in seconds, so once you're adapted it's worth protecting. Dim red light is the exception: rhodopsin barely absorbs red wavelengths at all, so a red torch lets you read a chart or find equipment by cone vision without bleaching the rod pigment your dark adaptation depends on.",
    avertedVisionDetail:
      "Averted vision is a technique for seeing faint objects at all: rod cells are concentrated away from the centre of the retina, while the very centre (the fovea) is packed with cones, which need far more light to respond but give sharp, colour vision. Looking slightly to one side of a faint object — rather than straight at it — shifts its image onto the rod-rich periphery, often making it visible when a direct look shows nothing at all.",
    skyglow:
      "Skyglow: the orange background haze over urban areas at night, caused by artificial light scattering off dust, moisture and pollution in the atmosphere — it raises the sky's brightness everywhere, not just near individual lights, drowning out all but the brightest stars and making faint objects (galaxies, nebulae, meteor showers) far harder to see.",
    constellationsIAU:
      "The 88 constellations recognised today by the International Astronomical Union (IAU) are largely inherited from Greek and Babylonian tradition, formalised with fixed boundaries only in 1930. They're a useful shared standard — but not the only way people have organised the same sky.",
    // seeingAndTransparency and skyglowDetail's definitions are written
    // directly in the HTML (they need real links, or a list and more
    // than one paragraph), not here — this dict only overwrites a
    // definition span with plain text, which would strip that markup
    // out again on every page load.
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

  // --- Light pollution + dark adaptation: one shared star field -----------

  const starFieldCanvas = document.getElementById('star-field-canvas');
  const starFieldCtx = starFieldCanvas.getContext('2d');
  const darknessSlider = document.getElementById('darkness-slider');
  const darknessLabel = document.getElementById('darkness-label');
  const adaptationSlider = document.getElementById('adaptation-slider');
  const adaptationLabel = document.getElementById('adaptation-label');
  const adaptationPlayButton = document.getElementById('adaptation-play-button');
  const limitingMagnitudeReadout = document.getElementById('limiting-magnitude-readout');
  const starCountReadout = document.getElementById('star-count-readout');

  const DARKNESS_SCALE_WORDS = {
    1: 'dark-sky site', 2: 'rural', 3: 'rural/suburb edge', 4: 'suburb',
    5: 'suburb', 6: 'suburb/city edge', 7: 'city', 8: 'city', 9: 'city centre',
  };

  function drawStarField() {
    const darknessScale = Number(darknessSlider.value);
    const adaptationMinutes = Number(adaptationSlider.value);
    const limitingMagnitude = LightPollution.currentLimitingMagnitude(darknessScale, adaptationMinutes);

    starFieldCtx.clearRect(0, 0, starFieldCanvas.width, starFieldCanvas.height);
    starFieldCtx.fillStyle = '#0b1220';
    starFieldCtx.fillRect(0, 0, starFieldCanvas.width, starFieldCanvas.height);

    LightPollution.STAR_CATALOG.forEach((star) => {
      if (star.magnitude > limitingMagnitude) return; // too faint to see right now
      const x = star.xFrac * starFieldCanvas.width;
      const y = star.yFrac * starFieldCanvas.height;
      // Brighter (lower-magnitude) stars draw bigger and more opaque.
      const brightness = 1 - (star.magnitude - 0.5) / (LightPollution.LIMITING_MAGNITUDE_DARK_SITE - 0.5);
      const radius = 0.6 + brightness * 1.8;
      const alpha = 0.5 + brightness * 0.5;
      starFieldCtx.beginPath();
      starFieldCtx.arc(x, y, radius, 0, Math.PI * 2);
      starFieldCtx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      starFieldCtx.fill();
    });

    darknessLabel.textContent = `${darknessScale} of 9 (${DARKNESS_SCALE_WORDS[darknessScale]})`;
    adaptationLabel.textContent = `${Math.round(adaptationMinutes)} min`;
    limitingMagnitudeReadout.textContent = `magnitude ${limitingMagnitude.toFixed(1)}`;
    starCountReadout.textContent =
      `about ${LightPollution.approxVisibleStarCount(limitingMagnitude).toLocaleString('en-GB')} (whole sky)`;
  }

  darknessSlider.addEventListener('input', drawStarField);
  adaptationSlider.addEventListener('input', () => {
    stopAdaptationAnimation();
    drawStarField();
  });

  let adaptationAnimationId = null;
  let adaptationLastFrameTime = null;
  const ADAPTATION_MINUTES_PER_SECOND = 2;

  function stopAdaptationAnimation() {
    if (adaptationAnimationId !== null) {
      cancelAnimationFrame(adaptationAnimationId);
      adaptationAnimationId = null;
    }
    adaptationLastFrameTime = null;
    adaptationPlayButton.textContent = '▶ Play';
    adaptationPlayButton.setAttribute('aria-pressed', 'false');
  }

  function startAdaptationAnimation() {
    if (Number(adaptationSlider.value) >= LightPollution.ADAPTATION_MAX_MINUTES) adaptationSlider.value = 0;
    adaptationPlayButton.textContent = '❚❚ Pause';
    adaptationPlayButton.setAttribute('aria-pressed', 'true');
    function step(now) {
      const dt = AnimationTiming.cappedElapsedSeconds(now, adaptationLastFrameTime);
      adaptationLastFrameTime = now;
      const next = Number(adaptationSlider.value) + dt * ADAPTATION_MINUTES_PER_SECOND;
      if (next >= LightPollution.ADAPTATION_MAX_MINUTES) {
        adaptationSlider.value = LightPollution.ADAPTATION_MAX_MINUTES;
        drawStarField();
        stopAdaptationAnimation();
        return;
      }
      adaptationSlider.value = next;
      drawStarField();
      adaptationAnimationId = requestAnimationFrame(step);
    }
    adaptationAnimationId = requestAnimationFrame(step);
  }

  adaptationPlayButton.addEventListener('click', () => {
    if (adaptationAnimationId !== null) stopAdaptationAnimation();
    else startAdaptationAnimation();
  });

  drawStarField();

  // --- Day and night: zodiac-at-midnight wheel + month slider --------------

  const zodiacCanvas = document.getElementById('zodiac-canvas');
  const zodiacCtx = zodiacCanvas.getContext('2d');
  const monthSlider = document.getElementById('month-slider');
  const monthLabel = document.getElementById('month-label');
  const zodiacReadout = document.getElementById('zodiac-readout');

  const ZODIAC_WHEEL = { cx: 210, cy: 210, orbitR: 80, ringR: 165 };
  const ZODIAC_DEPS = { PlanetaryMotion };

  function angleToPoint(cx, cy, r, deg) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  }

  function drawZodiacWheel() {
    const monthIndex = Number(monthSlider.value);
    const date = DayAndNight.dateForMonth(monthIndex, new Date().getUTCFullYear());
    const midnightLongitude = DayAndNight.midnightEclipticLongitudeDeg(date, ZODIAC_DEPS);
    const visibleSign = DayAndNight.zodiacVisibleAtMidnight(date, ZODIAC_DEPS);
    const earthLongitude = PlanetaryMotion.heliocentricLongitude('earth', date);

    const { cx, cy, orbitR, ringR } = ZODIAC_WHEEL;
    zodiacCtx.clearRect(0, 0, zodiacCanvas.width, zodiacCanvas.height);

    // The 12 zodiac wedge labels, equally spaced, in PlanetaryMotion's own order.
    PlanetaryMotion.ZODIAC_SIGNS.forEach((sign, i) => {
      const midDeg = i * 30 + 15;
      const isVisible = sign === visibleSign;
      const pos = angleToPoint(cx, cy, ringR, midDeg);
      zodiacCtx.font = isVisible ? 'bold 13px sans-serif' : '11px sans-serif';
      zodiacCtx.fillStyle = isVisible ? '#2a6bd6' : '#8a97a5';
      zodiacCtx.textAlign = 'center';
      zodiacCtx.textBaseline = 'middle';
      zodiacCtx.fillText(sign, pos.x, pos.y);
    });

    // Orbit guide (dashed) and Sun at the centre.
    zodiacCtx.setLineDash([3, 5]);
    zodiacCtx.strokeStyle = '#cdd7e1';
    zodiacCtx.lineWidth = 1;
    zodiacCtx.beginPath();
    zodiacCtx.arc(cx, cy, orbitR, 0, Math.PI * 2);
    zodiacCtx.stroke();
    zodiacCtx.setLineDash([]);

    SunIcon.drawSunDiscCanvas(zodiacCtx, cx, cy, 12, { coronaScale: 1.6 });

    // Earth on its orbit, and an arrow from Earth outward (away from the
    // Sun) to the zodiac sign that's overhead at midnight.
    const earthPos = angleToPoint(cx, cy, orbitR, earthLongitude);
    const arrowTip = angleToPoint(cx, cy, ringR - 20, midnightLongitude);

    zodiacCtx.beginPath();
    zodiacCtx.moveTo(earthPos.x, earthPos.y);
    zodiacCtx.lineTo(arrowTip.x, arrowTip.y);
    zodiacCtx.strokeStyle = '#2a6bd6';
    zodiacCtx.lineWidth = 2;
    zodiacCtx.stroke();

    const angleToArrow = Math.atan2(earthPos.y - arrowTip.y, arrowTip.x - earthPos.x);
    const headLength = 9;
    [angleToArrow - Math.PI / 7, angleToArrow + Math.PI / 7].forEach((wingAngle) => {
      zodiacCtx.beginPath();
      zodiacCtx.moveTo(arrowTip.x, arrowTip.y);
      zodiacCtx.lineTo(
        arrowTip.x - headLength * Math.cos(wingAngle),
        arrowTip.y + headLength * Math.sin(wingAngle)
      );
      zodiacCtx.strokeStyle = '#2a6bd6';
      zodiacCtx.lineWidth = 2;
      zodiacCtx.stroke();
    });

    zodiacCtx.beginPath();
    zodiacCtx.arc(earthPos.x, earthPos.y, 6, 0, Math.PI * 2);
    zodiacCtx.fillStyle = '#2a6bd6';
    zodiacCtx.fill();

    monthLabel.textContent = DayAndNight.MONTH_NAMES[monthIndex];
    zodiacReadout.textContent = `At midnight in ${DayAndNight.MONTH_NAMES[monthIndex]}, you face ${visibleSign} overhead.`;
  }

  monthSlider.addEventListener('input', drawZodiacWheel);
  drawZodiacWheel();

  renderCoverage();
  Glossary.init(GLOSSARY);
  drawVisibilityDiagram();
  QuizUI.mount(ObservingTechniquesQuestions.makeQuestions(VisibilityFactors));
  SunIcon.enhanceStaticSuns(document);
})();
