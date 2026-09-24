(function () {
  const CURRICULUM_UNITS = ['u2.3'];
  const SYNODIC = MoonPhase.SYNODIC_MONTH_DAYS;

  const modeExploreButton = document.getElementById('mode-explore-button');
  const modeCheckButton = document.getElementById('mode-check-button');
  const exploreControls = document.getElementById('explore-controls');
  const checkControls = document.getElementById('check-controls');

  const cycleSlider = document.getElementById('cycle-slider');
  const cycleLabel = document.getElementById('cycle-label');
  const playButton = document.getElementById('play-button');
  const speedSelect = document.getElementById('speed-select');

  const dateInput = document.getElementById('date-input');
  const dateLabel = document.getElementById('date-label');
  const illuminatedValue = document.getElementById('illuminated-value');
  const waxingValue = document.getElementById('waxing-value');
  const phaseNameReadout = document.getElementById('phase-name-readout');

  const orbitCanvas = document.getElementById('moon-orbit');
  const earthViewCanvas = document.getElementById('moon-earth-view');

  const MOON_LIT_COLOR = '#f5e8c8';
  const MOON_DARK_COLOR = '#3a3f4d';

  let mode = 'explore';
  // The single quantity both modes drive and carry across a mode switch:
  // days elapsed since New Moon, 0 up to (not including) SYNODIC.
  let currentAgeDays = 0;

  // dateInput.value is a "YYYY-MM-DD" string (native <input type="date">
  // behaviour) — parsed as UTC noon, matching the noon-anchoring the rest
  // of the app uses to sidestep local-timezone date-boundary issues.
  function parseDateInput(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12, 0));
  }

  function toDateInputValue(date) {
    const year = String(date.getFullYear()).padStart(4, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Unlike the Sun's position, the Moon's phase does NOT repeat every
  // calendar year (the ~29.53-day synodic month doesn't divide evenly
  // into a year), so the year has to be shown here for the date to be a
  // real, checkable moment rather than an ambiguous "21 June".
  function formatDate(date) {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  // The Moon's disc exactly as it appears from Earth: the illuminated
  // region's boundary is one half of the true circular limb (the bright
  // limb) plus a terminator that's an ellipse of horizontal radius
  // r*cos(theta) — which degenerates to a straight line at the quarters,
  // bulges into a thin crescent near New Moon, and bulges out to the full
  // disc at Full Moon. Waxing (theta < 180) lights the right side;
  // waning (theta > 180) mirrors it onto the left.
  function drawEarthViewDisc(canvas, theta) {
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = Math.min(cx, cy) - 24;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#10141f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = MOON_DARK_COLOR;
    ctx.fill();

    const thetaRad = (theta * Math.PI) / 180;
    const e = Math.cos(thetaRad);
    const waxing = theta <= 180;
    const steps = 48;
    const points = [];

    for (let i = 0; i <= steps; i++) {
      const t = -Math.PI / 2 + (Math.PI * i) / steps;
      const y = cy - r * Math.sin(t);
      const outer = r * Math.cos(t);
      points.push([waxing ? cx + outer : cx - outer, y]);
    }
    for (let i = steps; i >= 0; i--) {
      const t = -Math.PI / 2 + (Math.PI * i) / steps;
      const y = cy - r * Math.sin(t);
      const term = e * r * Math.cos(t);
      points.push([waxing ? cx + term : cx - term, y]);
    }

    ctx.beginPath();
    points.forEach(([x, y], idx) => (idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = MOON_LIT_COLOR;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#555b6e';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function renderDiagramsAndReadouts(phase) {
    MoonOrbitPanel.draw(orbitCanvas, { moonAngleDeg: phase.theta, sunAngleDeg: 0 });
    drawEarthViewDisc(earthViewCanvas, phase.theta);

    illuminatedValue.textContent = `${Math.round(phase.illuminatedFraction * 100)}%`;
    waxingValue.textContent = phase.illuminatedFraction < 0.01 || phase.illuminatedFraction > 0.99
      ? '—'
      : phase.waxing ? 'Waxing (growing)' : 'Waning (shrinking)';
    phaseNameReadout.textContent = MoonPhase.phaseName(phase.theta);
  }

  function renderExplore() {
    const ageDays = Number(cycleSlider.value);
    currentAgeDays = ageDays;
    cycleLabel.textContent = `Day ${ageDays.toFixed(1)} of ${SYNODIC.toFixed(1)}`;
    renderDiagramsAndReadouts(MoonPhase.fromAgeDays(ageDays));
  }

  function renderCheck() {
    const date = parseDateInput(dateInput.value);
    dateLabel.textContent = formatDate(date);
    const phase = MoonPhase.getMoonPhase(date);
    currentAgeDays = phase.ageDays;
    renderDiagramsAndReadouts(phase);
  }

  function render() {
    if (mode === 'explore') renderExplore();
    else renderCheck();
  }

  // --- Mode switching: both modes are driven by the same currentAgeDays,
  // so switching carries the current position across instead of
  // resetting to day 0.

  function setMode(nextMode) {
    stopAnimation();
    mode = nextMode;
    const exploring = mode === 'explore';
    modeExploreButton.setAttribute('aria-pressed', String(exploring));
    modeCheckButton.setAttribute('aria-pressed', String(!exploring));
    exploreControls.hidden = !exploring;
    checkControls.hidden = exploring;

    if (exploring) {
      cycleSlider.value = currentAgeDays;
    } else {
      // Pick a real date whose Moon age matches currentAgeDays as closely
      // as a whole calendar day allows — <input type="date"> can't
      // represent a fractional day, so this is the closest continuous
      // handoff available.
      const today = new Date();
      const todayAgeDays = MoonPhase.getMoonPhase(today).ageDays;
      const deltaDays = Math.round(currentAgeDays - todayAgeDays);
      const matchedDate = new Date(today.getTime() + deltaDays * 86400000);
      dateInput.value = toDateInputValue(matchedDate);
    }
    render();
  }

  modeExploreButton.addEventListener('click', () => {
    if (mode !== 'explore') setMode('explore');
  });
  modeCheckButton.addEventListener('click', () => {
    if (mode !== 'check') setMode('check');
  });

  // --- Explore mode: scrub or animate through the cycle. Setting
  // cycleSlider.value programmatically doesn't fire 'input', so animation
  // can't fight with the "stop on manual drag" handler below.
  const SPEEDS = { slow: 0.02, fast: 0.08 };
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
      const perFrame = SPEEDS[speedSelect.value] || SPEEDS.slow;
      let next = Number(cycleSlider.value) + perFrame;
      if (next > SYNODIC) next -= SYNODIC;
      cycleSlider.value = next;
      renderExplore();
      animationFrameId = requestAnimationFrame(step);
    }
    animationFrameId = requestAnimationFrame(step);
  }

  playButton.addEventListener('click', () => {
    if (animationFrameId !== null) stopAnimation();
    else startAnimation();
  });

  cycleSlider.addEventListener('input', () => {
    stopAnimation();
    render();
  });

  dateInput.addEventListener('input', render);

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    lunarEclipse:
      "A lunar eclipse: Earth passing directly between the Sun and a Full Moon, so Earth's shadow falls on the Moon. Unlike an ordinary phase, this needs an almost exact Sun-Earth-Moon alignment, so it only happens a few times a year at most — not every month.",
  };

  dateInput.value = toDateInputValue(new Date());
  render();
  renderCoverage();
  Glossary.init(GLOSSARY);
})();
