(function () {
  const CURRICULUM_UNITS = ['u2.3'];

  const dateInput = document.getElementById('date-input');
  const dateLabel = document.getElementById('date-label');
  const illuminatedValue = document.getElementById('illuminated-value');
  const waxingValue = document.getElementById('waxing-value');
  const phaseNameReadout = document.getElementById('phase-name-readout');

  const orbitCanvas = document.getElementById('moon-orbit');
  const earthViewCanvas = document.getElementById('moon-earth-view');

  const MOON_LIT_COLOR = '#f5e8c8';
  const MOON_DARK_COLOR = '#3a3f4d';

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

  function render() {
    const date = parseDateInput(dateInput.value);
    dateLabel.textContent = formatDate(date);

    const { theta, illuminatedFraction, waxing } = MoonPhase.getMoonPhase(date);

    MoonOrbitPanel.draw(orbitCanvas, { moonAngleDeg: theta, sunAngleDeg: 0 });
    drawEarthViewDisc(earthViewCanvas, theta);

    illuminatedValue.textContent = `${Math.round(illuminatedFraction * 100)}%`;
    waxingValue.textContent = illuminatedFraction < 0.01 || illuminatedFraction > 0.99
      ? '—'
      : waxing ? 'Waxing (growing)' : 'Waning (shrinking)';
    phaseNameReadout.textContent = MoonPhase.phaseName(theta);
  }

  dateInput.value = toDateInputValue(new Date());
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

  render();
  renderCoverage();
  Glossary.init(GLOSSARY);
})();
