/**
 * notes/geocentric-to-heliocentric.html's epicycle diagram.
 *
 * Ptolemy's model for an outer ("superior") planet: a planet rides on a
 * small circle (the epicycle) whose own centre rides on a larger circle
 * (the deferent) around a fixed Earth. Historically, the epicycle for an
 * outer planet reproduces Earth's own heliocentric motion — one full
 * epicycle lap every year, matching the Sun's apparent yearly motion —
 * while the deferent's lap matches the planet's own real orbital period.
 * This page uses Mars's real period (1.881 years) for the deferent, with
 * the slider controlling only the epicycle's size relative to the
 * deferent. src/epicycleModel.js supplies the position function and the
 * exact condition under which that produces a retrograde loop.
 */
(function () {
  const CURRICULUM_UNITS = ['u3.1', 'u3.2', 'u3.6', 'u3.7', 'u3.15'];

  const DEFERENT_RADIUS = 1; // normalised; epicycle size is a fraction of this
  const DEFERENT_RADIUS_PX = 140;
  const STAR_RING_RADIUS_PX = DEFERENT_RADIUS_PX + 35;

  const EARTH_YEAR = 1; // the epicycle's period, matching the Sun's apparent motion
  const MARS_YEAR = 1.881; // Mars's real sidereal orbital period, in years — the deferent's period
  const DEFERENT_ANGULAR_SPEED = (2 * Math.PI) / MARS_YEAR;
  const EPICYCLE_ANGULAR_SPEED = (2 * Math.PI) / EARTH_YEAR;
  const RETROGRADE_THRESHOLD = EpicycleModel.retrogradeThreshold(DEFERENT_RADIUS, DEFERENT_ANGULAR_SPEED, EPICYCLE_ANGULAR_SPEED);

  const ANIMATION_YEARS = MARS_YEAR; // one full deferent lap per animation loop
  const ANIMATION_SECONDS = 12;

  const state = {
    size: 0.3, // epicycle radius, as a fraction of the deferent radius
    t: 0, // years since the start
  };

  const canvas = document.getElementById('epicycle-diagram');
  const sizeSlider = document.getElementById('epicycle-size-slider');
  const sizeLabel = document.getElementById('epicycle-size-label');
  const playButton = document.getElementById('epicycle-play-button');
  const motionStatus = document.getElementById('motion-status');
  const loopStatus = document.getElementById('loop-status');

  function position(t, s) {
    return EpicycleModel.position(t, DEFERENT_RADIUS, DEFERENT_ANGULAR_SPEED, s, EPICYCLE_ANGULAR_SPEED);
  }

  function deferentCentre(t) {
    return EpicycleModel.deferentCentre(t, DEFERENT_RADIUS, DEFERENT_ANGULAR_SPEED);
  }

  function toScreen(x, y, cx, cy) {
    return { x: cx + x * DEFERENT_RADIUS_PX, y: cy - y * DEFERENT_RADIUS_PX };
  }

  function drawStarRing(ctx, cx, cy) {
    const starCount = 36;
    ctx.fillStyle = '#b7c3d1';
    for (let i = 0; i < starCount; i += 1) {
      const angle = (2 * Math.PI * i) / starCount;
      const x = cx + STAR_RING_RADIUS_PX * Math.cos(angle);
      const y = cy + STAR_RING_RADIUS_PX * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPath(ctx, cx, cy, s) {
    ctx.beginPath();
    const steps = 720;
    for (let i = 0; i <= steps; i += 1) {
      const t = (ANIMATION_YEARS * i) / steps;
      const p = position(t, s);
      const sp = toScreen(p.x, p.y, cx, cy);
      if (i === 0) ctx.moveTo(sp.x, sp.y);
      else ctx.lineTo(sp.x, sp.y);
    }
    ctx.strokeStyle = '#2a6bd6';
    ctx.lineWidth = 1.75;
    ctx.stroke();
  }

  function render() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const s = state.size;

    drawStarRing(ctx, cx, cy);

    // Deferent (dashed).
    ctx.beginPath();
    ctx.arc(cx, cy, DEFERENT_RADIUS_PX, 0, Math.PI * 2);
    ctx.strokeStyle = '#b7c3d1';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // The full traced path the model predicts — where this loops back
    // on itself is retrograde motion, with nothing else assumed.
    drawPath(ctx, cx, cy, s);

    // Earth, fixed at the centre.
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#2a6bd6';
    ctx.fill();
    ctx.strokeStyle = '#173d75';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // The epicycle itself (dashed), centred on the deferent at the
    // current t, and the planet riding on its edge.
    const centre = deferentCentre(state.t);
    const centreScreen = toScreen(centre.x, centre.y, cx, cy);
    ctx.beginPath();
    ctx.arc(centreScreen.x, centreScreen.y, s * DEFERENT_RADIUS_PX, 0, Math.PI * 2);
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    const planet = position(state.t, s);
    const planetScreen = toScreen(planet.x, planet.y, cx, cy);
    ctx.beginPath();
    ctx.arc(planetScreen.x, planetScreen.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#c0392b';
    ctx.fill();
    ctx.strokeStyle = '#7a2015';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#8a97a5';
    ctx.font = 'italic 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Deferent = Mars’s period (1.88 yr), epicycle = 1 year', 8, canvas.height - 10);
  }

  function updateMotionStatus() {
    const numerator = EpicycleModel.angularVelocityNumerator(state.t, DEFERENT_RADIUS, DEFERENT_ANGULAR_SPEED, state.size, EPICYCLE_ANGULAR_SPEED);
    motionStatus.textContent = numerator < 0 ? 'Currently: RETROGRADE — looping backward against the stars' : 'Currently: prograde — the usual eastward drift';
    motionStatus.classList.toggle('retrograde-active', numerator < 0);
  }

  // Whether the loop appears anywhere in the cycle at the current slider
  // size — independent of where the animation currently is.
  function updateLoopStatus() {
    const loops = EpicycleModel.showsRetrograde(DEFERENT_RADIUS, DEFERENT_ANGULAR_SPEED, state.size, EPICYCLE_ANGULAR_SPEED);
    loopStatus.textContent = loops ? 'Loop: ON — this epicycle produces a retrograde loop' : 'Loop: OFF — too small to loop back on itself';
    loopStatus.classList.toggle('retrograde-active', loops);
  }

  function updateSize() {
    state.size = Number(sizeSlider.value);
    sizeLabel.textContent = state.size.toFixed(2);
    render();
    updateMotionStatus();
    updateLoopStatus();
  }

  sizeSlider.addEventListener('input', updateSize);

  let animationFrameId = null;
  let animationStart = null;

  function stopAnimation() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    animationStart = null;
    playButton.textContent = '▶ Animate';
    playButton.setAttribute('aria-pressed', 'false');
  }

  function startAnimation() {
    playButton.textContent = '❚❚ Pause';
    playButton.setAttribute('aria-pressed', 'true');
    function step(now) {
      if (animationStart === null) animationStart = now;
      const elapsed = (now - animationStart) / 1000;
      state.t = ((elapsed / ANIMATION_SECONDS) % 1) * ANIMATION_YEARS;
      render();
      updateMotionStatus();
      animationFrameId = requestAnimationFrame(step);
    }
    animationFrameId = requestAnimationFrame(step);
  }

  playButton.addEventListener('click', () => {
    if (animationFrameId !== null) stopAnimation();
    else startAnimation();
  });

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    deferent: 'Deferent: the main, large circle a planet’s epicycle centre travels around in Ptolemy’s geocentric model, with Earth close to its centre.',
    epicycle: 'Epicycle: a small circle a planet rides on, whose own centre travels around the deferent — the extra loop Ptolemy added to explain retrograde motion.',
    equant: 'Equant: an off-centre point Ptolemy placed near the deferent’s centre, about which a planet’s motion appeared uniform even though its distance from Earth changed.',
  };

  const thresholdOption = document.getElementById('loop-threshold-option');
  if (thresholdOption) thresholdOption.value = RETROGRADE_THRESHOLD.toFixed(2);
  const thresholdLabel = document.getElementById('loop-threshold-label');
  if (thresholdLabel) thresholdLabel.textContent = RETROGRADE_THRESHOLD.toFixed(2);

  sizeLabel.textContent = state.size.toFixed(2);
  render();
  updateMotionStatus();
  updateLoopStatus();
  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(GeocentricHeliocentricQuestions.makeQuestions());
})();
