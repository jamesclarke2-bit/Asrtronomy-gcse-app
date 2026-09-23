(function () {
  const CURRICULUM_UNITS = ['u2.17'];

  // An arbitrary start moment, anchored near the March equinox: away from
  // a solstice, EarthOrbit's declination-based angle is best-behaved
  // (closest to a constant ~1 degree/day rate), which keeps the diagram's
  // motion visually smooth. The whole point of this page is the relative
  // ~30-day window from here, not this specific calendar date.
  const YEAR = 2026;
  const START_DAY_INDEX = 78;
  const START_DATE_MS = Date.UTC(YEAR, 0, 1, 12, 0) + START_DAY_INDEX * 86400000;
  const T_YEAR_DAYS = 365.25;
  const MAX_DAYS = 30;

  const daySlider = document.getElementById('day-slider');
  const dayLabel = document.getElementById('day-label');
  const playButton = document.getElementById('play-button');
  const earthOrbitCanvas = document.getElementById('earth-orbit');
  const moonOrbitCanvas = document.getElementById('moon-orbit');
  const siderealValue = document.getElementById('sidereal-value');
  const synodicValue = document.getElementById('synodic-value');
  const periodNote = document.getElementById('period-note');

  // The synodic month (Moon back to the same phase) is exact by
  // construction in src/moonPhase.js. The sidereal month (Moon back to
  // the same direction against the stars) follows from it plus Earth's
  // own orbital period, via the standard relation
  // 1/synodic = 1/sidereal - 1/year (rearranged below) — derived from the
  // reused constant rather than a second, independently-asserted number.
  const T_SYNODIC = MoonPhase.SYNODIC_MONTH_DAYS;
  const T_SIDEREAL = 1 / (1 / T_SYNODIC + 1 / T_YEAR_DAYS);

  function dateAtElapsedDays(t) {
    return new Date(START_DATE_MS + t * 86400000);
  }

  function earthOrbitAngleAt(t) {
    return EarthOrbit.computeEarthOrbitAngle(START_DAY_INDEX + t);
  }

  function orbitPoint(cx, cy, radius, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  }

  // Fixed at the very start: wherever the Moon is pointing (relative to
  // the stars) at t=0 becomes "the reference star" for the rest of the
  // run — matching the brief's "starting alignment".
  const startEarthAngle = earthOrbitAngleAt(0);
  const startTheta = MoonPhase.getMoonPhase(dateAtElapsedDays(0)).theta;
  const startSunDirection = (startEarthAngle + 180) % 360;
  const referenceStarAngleDeg = (startSunDirection + startTheta) % 360;

  // Reuses orbitPanel.js's own orbit radius exactly (Math.min(cx,cy) - 80)
  // so this overlay lines up with the reused diagram beneath it.
  //
  // Earth's orbital angle only ever increases (prograde motion), but
  // EarthOrbit.computeEarthOrbitAngle wraps it into [0, 360) — so toDeg
  // can come back smaller than fromDeg despite genuinely being "later"
  // (e.g. 359.9 degrees -> 26.9 degrees is +27 degrees of real travel,
  // not -333). Unwrapping toDeg forward past fromDeg before interpolating
  // keeps the arc sweeping the short, correct way.
  function drawTravelledArc(canvas, fromDeg, toDeg) {
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const R = Math.min(cx, cy) - 80;
    const steps = 40;
    const unwrappedTo = toDeg < fromDeg ? toDeg + 360 : toDeg;

    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const deg = fromDeg + ((unwrappedTo - fromDeg) * i) / steps;
      const p = orbitPoint(cx, cy, R, deg);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = '#2a6bd6';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function drawReferenceStar(canvas, geom) {
    const ctx = canvas.getContext('2d');
    const inner = orbitPoint(geom.cx, geom.cy, 15, referenceStarAngleDeg);
    const outer = orbitPoint(geom.cx, geom.cy, geom.R + 18, referenceStarAngleDeg);

    ctx.beginPath();
    ctx.moveTo(inner.x, inner.y);
    ctx.lineTo(outer.x, outer.y);
    ctx.strokeStyle = '#c9cdd6';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.save();
    ctx.translate(outer.x, outer.y);
    ctx.strokeStyle = '#e8e8e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.lineTo(7, 0);
    ctx.moveTo(0, -7);
    ctx.lineTo(0, 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
  }

  function render() {
    const t = Number(daySlider.value);
    dayLabel.textContent = `Day ${t.toFixed(1)}`;

    const earthAngle = earthOrbitAngleAt(t);
    const { theta } = MoonPhase.getMoonPhase(dateAtElapsedDays(t));
    const sunDirection = (earthAngle + 180) % 360;
    const moonAbsoluteAngle = (sunDirection + theta) % 360;

    OrbitPanel.draw(earthOrbitCanvas, START_DAY_INDEX + t);
    drawTravelledArc(earthOrbitCanvas, startEarthAngle, earthAngle);

    const geom = MoonOrbitPanel.draw(moonOrbitCanvas, {
      moonAngleDeg: moonAbsoluteAngle,
      sunAngleDeg: sunDirection,
    });
    drawReferenceStar(moonOrbitCanvas, geom);

    const sidereal = t % T_SIDEREAL;
    const synodic = t % T_SYNODIC;
    siderealValue.textContent = `${sidereal.toFixed(1)} days`;
    synodicValue.textContent = `${synodic.toFixed(1)} days`;
  }

  periodNote.textContent =
    `Sidereal month completes at ~${T_SIDEREAL.toFixed(1)} days; synodic month completes at ` +
    `~${T_SYNODIC.toFixed(2)} days — a gap of ~${(T_SYNODIC - T_SIDEREAL).toFixed(1)} days.`;

  // --- Animation: advance the day slider automatically, looping back to
  // the start. Setting .value programmatically doesn't fire 'input', so
  // this can't fight with the "stop on manual drag" handler below.
  const DAYS_PER_FRAME = 0.03;
  let animationFrameId = null;

  function stopAnimation() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    playButton.textContent = '▶ Animate';
    playButton.setAttribute('aria-pressed', 'false');
  }

  function startAnimation() {
    playButton.textContent = '❚❚ Pause';
    playButton.setAttribute('aria-pressed', 'true');
    function step() {
      let next = Number(daySlider.value) + DAYS_PER_FRAME;
      if (next > MAX_DAYS) next = 0;
      daySlider.value = next;
      render();
      animationFrameId = requestAnimationFrame(step);
    }
    animationFrameId = requestAnimationFrame(step);
  }

  playButton.addEventListener('click', () => {
    if (animationFrameId !== null) stopAnimation();
    else startAnimation();
  });

  daySlider.addEventListener('input', () => {
    stopAnimation();
    render();
  });

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    siderealMonth:
      'The sidereal month (~27.3 days): how long the Moon takes to return to the same direction against the fixed background stars.',
    synodicMonth:
      "The synodic month (~29.5 days): how long the Moon takes to return to the same phase — the same position relative to the Sun as seen from Earth. Longer than the sidereal month because Earth's own orbital motion shifts the Sun's direction in the meantime.",
  };

  render();
  renderCoverage();
  Glossary.init(GLOSSARY);
})();
