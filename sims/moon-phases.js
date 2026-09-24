(function () {
  const CURRICULUM_UNITS = ['u2.3', 'u2.18'];
  const SYNODIC = MoonPhase.SYNODIC_MONTH_DAYS;
  const DAY_MS = 86400000;

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
  const distanceValue = document.getElementById('distance-value');
  const perigeeValue = document.getElementById('perigee-value');
  const supermoonFlag = document.getElementById('supermoon-flag');

  const orbitCanvas = document.getElementById('moon-orbit');
  const earthViewCanvas = document.getElementById('moon-earth-view');

  const MOON_LIT_COLOR = '#f5e8c8';
  const MOON_DARK_COLOR = '#3a3f4d';

  let mode = 'explore';
  // The single quantity both modes drive and carry across a mode switch:
  // days elapsed since New Moon, 0 up to (not including) SYNODIC.
  let currentAgeDays = 0;
  // The exact (mean) New Moon that starts the lunar cycle being shown.
  // Phase alone doesn't fix the Moon's distance — perigee drifts against
  // the phases by ~2 days a month — so Explore mode borrows a real cycle
  // for distance: the one last checked, or the current one to begin with.
  let anchorNewMoonMs = Date.now() - MoonPhase.getMoonPhase(new Date()).ageDays * DAY_MS;

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

  // The calendar date whose UTC noon (how parseDateInput reads a date) is
  // nearest to the given instant — so Check -> Explore -> Check returns
  // to exactly the same date.
  function nearestNoonDateValue(ms) {
    const noonOffset = 12 * 3600000;
    const nearestNoon = new Date(Math.round((ms - noonOffset) / DAY_MS) * DAY_MS + noonOffset);
    return nearestNoon.toISOString().slice(0, 10);
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

  function describePerigee(daysFromPerigee) {
    const days = Math.abs(daysFromPerigee).toFixed(1);
    if (days === '0.0') return 'Now';
    return daysFromPerigee > 0 ? `${days} days ago` : `In ${days} days`;
  }

  function renderSupermoonFlag(name, daysFromPerigee) {
    const atSyzygy = name === 'Full Moon' || name === 'New Moon';
    const nearPerigee = Math.abs(daysFromPerigee) <= MoonOrbitPanel.SUPERMOON_WINDOW_DAYS;
    supermoonFlag.hidden = !(atSyzygy && nearPerigee);
    if (supermoonFlag.hidden) return;

    const within = `within ${MoonOrbitPanel.SUPERMOON_WINDOW_DAYS} days of perigee`;
    supermoonFlag.textContent = name === 'Full Moon'
      ? `Supermoon! A full Moon ${within}. A full Moon at perigee can look up to about 14% larger and 30% brighter than one at apogee.`
      : `Supermoon (new Moon): ${within}. It's lost in the Sun's glare, so you can't see it, but its extra pull raises unusually large spring tides.`;
  }

  function renderDiagramsAndReadouts(phase, orbit) {
    // In the Sun-fixed frame the Moon sits at its phase angle, and it is
    // trueAnomalyDeg past perigee — which fixes where perigee points.
    const perigeeAngleDeg = phase.theta - orbit.trueAnomalyDeg;
    MoonOrbitPanel.draw(orbitCanvas, { moonAngleDeg: phase.theta, sunAngleDeg: 0, perigeeAngleDeg });
    drawEarthViewDisc(earthViewCanvas, phase.theta);

    const name = MoonPhase.phaseName(phase.theta);
    illuminatedValue.textContent = `${Math.round(phase.illuminatedFraction * 100)}%`;
    waxingValue.textContent = phase.illuminatedFraction < 0.01 || phase.illuminatedFraction > 0.99
      ? '—'
      : phase.waxing ? 'Waxing (growing)' : 'Waning (shrinking)';
    phaseNameReadout.textContent = name;
    distanceValue.textContent = `${Math.round(orbit.distanceKm).toLocaleString('en-GB')} km`;
    perigeeValue.textContent = describePerigee(orbit.daysFromPerigee);
    renderSupermoonFlag(name, orbit.daysFromPerigee);
  }

  function renderExplore() {
    const ageDays = Number(cycleSlider.value);
    currentAgeDays = ageDays;
    cycleLabel.textContent = `Day ${ageDays.toFixed(1)} of ${SYNODIC.toFixed(1)}`;
    const orbit = MoonOrbitPanel.getMoonOrbit(new Date(anchorNewMoonMs + ageDays * DAY_MS));
    renderDiagramsAndReadouts(MoonPhase.fromAgeDays(ageDays), orbit);
  }

  function renderCheck() {
    const date = parseDateInput(dateInput.value);
    dateLabel.textContent = formatDate(date);
    const phase = MoonPhase.getMoonPhase(date);
    currentAgeDays = phase.ageDays;
    anchorNewMoonMs = date.getTime() - phase.ageDays * DAY_MS;
    renderDiagramsAndReadouts(phase, MoonOrbitPanel.getMoonOrbit(date));
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
      // The real date in the anchored cycle closest to the current
      // position — as close as a whole calendar day allows, since
      // <input type="date"> can't represent a fraction of one.
      dateInput.value = nearestNoonDateValue(anchorNewMoonMs + currentAgeDays * DAY_MS);
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

  const PERIGEE_DEFINITION =
    "Perigee: the point in the Moon's elliptical orbit closest to Earth, about 363,300 km away. The Moon moves fastest here.";

  const GLOSSARY = {
    lunarEclipse:
      "A lunar eclipse: Earth passing directly between the Sun and a Full Moon, so Earth's shadow falls on the Moon. Unlike an ordinary phase, this needs an almost exact Sun-Earth-Moon alignment, so it only happens a few times a year at most — not every month.",
    perigee: PERIGEE_DEFINITION,
    perigeeSection: PERIGEE_DEFINITION,
    apogee:
      "Apogee: the point in the Moon's elliptical orbit farthest from Earth, about 405,500 km away. The Moon moves slowest here.",
    supermoon:
      'A supermoon: a full (or new) Moon that falls within a few days of perigee. It is a popular term rather than a strict scientific one — the effect is real but modest.',
  };

  // The headline ~14% / ~30% figures come from the most extreme real
  // distances; this page's fixed-shape orbit gives a slightly smaller
  // spread. Computed from the model's own constants so it can't drift.
  const sizeRatio = MoonOrbitPanel.APOGEE_KM / MoonOrbitPanel.PERIGEE_KM;
  document.getElementById('model-spread-note').textContent =
    `Those headline figures use the Moon's most extreme real distances — the Sun's pull stretches ` +
    `the orbit enough that real perigees range from about 356,500 to 370,400 km. This page keeps the ` +
    `orbit's shape fixed, so its perigee and apogee full Moons differ by a slightly smaller ` +
    `~${Math.round((sizeRatio - 1) * 100)}% in size and ~${Math.round((sizeRatio ** 2 - 1) * 100)}% in brightness.`;

  dateInput.value = toDateInputValue(new Date());
  render();
  renderCoverage();
  Glossary.init(GLOSSARY);
})();
