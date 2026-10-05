/**
 * notes/geocentric-to-heliocentric.html's epicycle diagram.
 *
 * Ptolemy's model: a planet rides on a small circle (the epicycle)
 * whose own centre rides on a larger circle (the deferent) around a
 * fixed Earth. With the deferent radius fixed at 1 unit, epicycle
 * radius s (the slider) and the epicycle completing EPICYCLE_RATIO
 * trips around its own centre for every one trip the deferent's centre
 * makes around Earth, the planet's actual position is the classic
 * epitrochoid:
 *
 *   x(t) = cos(t) + s*cos(EPICYCLE_RATIO*t)
 *   y(t) = sin(t) + s*sin(EPICYCLE_RATIO*t)
 *
 * No retrograde-detection logic is special-cased: a loop is simply
 * wherever this curve doubles back on itself, which is already visible
 * directly in the traced path. The live "currently retrograde" readout
 * during animation just checks the sign of the geocentric angle's own
 * rate of change, the same thing a real observer tracking the planet
 * against the fixed stars would be watching.
 */
(function () {
  const CURRICULUM_UNITS = ['u3.1', 'u3.2', 'u3.6', 'u3.7', 'u3.15'];

  const EPICYCLE_RATIO = 5; // epicycle laps per one deferent lap
  const DEFERENT_RADIUS_PX = 140;
  const STAR_RING_RADIUS_PX = DEFERENT_RADIUS_PX + 35;

  const state = {
    size: 0.1, // epicycle radius, as a fraction of the deferent radius
    t: 0, // radians around the deferent, 0 = start
  };

  const canvas = document.getElementById('epicycle-diagram');
  const sizeSlider = document.getElementById('epicycle-size-slider');
  const sizeLabel = document.getElementById('epicycle-size-label');
  const playButton = document.getElementById('epicycle-play-button');
  const motionStatus = document.getElementById('motion-status');

  function position(t, s) {
    return {
      x: Math.cos(t) + s * Math.cos(EPICYCLE_RATIO * t),
      y: Math.sin(t) + s * Math.sin(EPICYCLE_RATIO * t),
    };
  }

  function deferentCentre(t) {
    return { x: Math.cos(t), y: Math.sin(t) };
  }

  // Positive = the geocentric angle is increasing (prograde, the usual
  // eastward drift against the stars); negative = retrograde.
  function motionSign(t, s) {
    const dt = 1e-3;
    const a1 = Math.atan2(position(t, s).y, position(t, s).x);
    const a2 = Math.atan2(position(t + dt, s).y, position(t + dt, s).x);
    let delta = a2 - a1;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    return delta;
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
      const t = (2 * Math.PI * i) / steps;
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
    ctx.fillText('Not to scale — a schematic, not a real planet’s epicycle', 8, canvas.height - 10);
  }

  function updateMotionStatus() {
    const sign = motionSign(state.t, state.size);
    motionStatus.textContent = sign < 0 ? 'Currently: RETROGRADE — looping backward against the stars' : 'Currently: prograde — the usual eastward drift';
    motionStatus.classList.toggle('retrograde-active', sign < 0);
  }

  function updateSize() {
    state.size = Number(sizeSlider.value);
    sizeLabel.textContent = state.size.toFixed(2);
    render();
    updateMotionStatus();
  }

  sizeSlider.addEventListener('input', updateSize);

  const ANIMATION_SECONDS = 12;
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
      state.t = ((elapsed / ANIMATION_SECONDS) % 1) * 2 * Math.PI;
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

  sizeLabel.textContent = state.size.toFixed(2);
  render();
  updateMotionStatus();
  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(GeocentricHeliocentricQuestions.makeQuestions());
})();
