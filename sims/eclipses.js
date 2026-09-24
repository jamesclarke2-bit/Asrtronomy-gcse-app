(function () {
  const CURRICULUM_UNITS = ['u2.8', 'u2.19'];
  const DAY_MS = 86400000;
  const RAD = Math.PI / 180;

  // The real 5.145° tilt is too shallow to see at this size.
  const TILT_EXAGGERATION = 3;
  // Viewing angle above the ecliptic plane for the angled view.
  const VIEW_ELEVATION_DEG = 24;

  const dateInput = document.getElementById('date-input');
  const dateLabel = document.getElementById('date-label');
  const canvas = document.getElementById('tilted-orbit');
  const indicator = document.getElementById('eclipse-indicator');
  const indicatorTitle = document.getElementById('eclipse-indicator-title');
  const indicatorDetail = document.getElementById('eclipse-indicator-detail');
  const phaseValue = document.getElementById('phase-value');
  const nodeDistanceValue = document.getElementById('node-distance-value');
  const latitudeValue = document.getElementById('latitude-value');
  const syzygyValue = document.getElementById('syzygy-value');
  const syzygyNodeValue = document.getElementById('syzygy-node-value');

  function parseDateInput(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12, 0));
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }

  function formatHourUtc(date) {
    const rounded = new Date(Math.round(date.getTime() / 3600000) * 3600000);
    return `${String(rounded.getUTCHours()).padStart(2, '0')}:00 UTC`;
  }

  // --- Angled view of the ecliptic and the Moon's tilted orbit ---------
  // 3D frame: x points at the Sun, y lies in the ecliptic plane, z points
  // out of it. The Sun stays fixed on the right while the line of nodes
  // swings round through the year — eclipses need it pointing at the Sun.

  function orbitPoint(argumentOfLatitudeDeg, nodeAngleDeg, tiltDeg) {
    const u = argumentOfLatitudeDeg * RAD;
    const a = nodeAngleDeg * RAD;
    const i = tiltDeg * RAD;
    const inPlane = Math.sin(u) * Math.cos(i);
    return {
      x: Math.cos(u) * Math.cos(a) - inPlane * Math.sin(a),
      y: Math.cos(u) * Math.sin(a) + inPlane * Math.cos(a),
      z: Math.sin(u) * Math.sin(i),
    };
  }

  function drawTiltedOrbit(state) {
    const ctx = canvas.getContext('2d');
    const cx = 190;
    const cy = canvas.height / 2 + 10;
    const R = 120;
    const elevation = VIEW_ELEVATION_DEG * RAD;
    const tilt = EclipseGeometry.INCLINATION_DEG * TILT_EXAGGERATION;
    const nodeAngle = state.nodeAngleFromSunDeg;

    const project = (p, scale = R) => ({
      x: cx + p.x * scale,
      y: cy - (p.y * Math.sin(elevation) + p.z * Math.cos(elevation)) * scale,
    });

    function strokeOrbitArc(fromDeg, toDeg, style, dashed) {
      ctx.beginPath();
      for (let u = fromDeg; u <= toDeg; u += 3) {
        const p = project(orbitPoint(u, nodeAngle, tilt));
        if (u === fromDeg) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = style;
      ctx.lineWidth = 2;
      ctx.setLineDash(dashed ? [4, 4] : []);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // The half of the orbit below the ecliptic goes first, so the
    // semi-transparent plane drawn next sits in front of it.
    strokeOrbitArc(180, 360, '#9aa5b1', true);

    ctx.beginPath();
    ctx.ellipse(cx, cy, R * 1.35, R * 1.35 * Math.sin(elevation), 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(120, 140, 165, 0.16)';
    ctx.fill();
    ctx.strokeStyle = '#b7c3d1';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#6b7684';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Ecliptic plane', cx - R * 1.3, cy + R * 1.35 * Math.sin(elevation) + 14);

    // Sunlight, arriving along the ecliptic from the right.
    const sunX = canvas.width - 26;
    ctx.strokeStyle = '#f0d38a';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(sunX, cy);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(sunX, cy, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#f5a623';
    ctx.fill();
    ctx.strokeStyle = '#c9820a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Line of nodes, through Earth.
    const ascending = project(orbitPoint(0, nodeAngle, tilt));
    const descending = project(orbitPoint(180, nodeAngle, tilt));
    const ascendingEnd = project(orbitPoint(0, nodeAngle, tilt), R * 1.12);
    const descendingEnd = project(orbitPoint(180, nodeAngle, tilt), R * 1.12);
    ctx.beginPath();
    ctx.moveTo(descendingEnd.x, descendingEnd.y);
    ctx.lineTo(ascendingEnd.x, ascendingEnd.y);
    ctx.strokeStyle = '#7b4bb3';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    strokeOrbitArc(0, 180, '#2f3f55', false);

    [
      [ascending, ascendingEnd, 'Ascending node'],
      [descending, descendingEnd, 'Descending node'],
    ].forEach(([point, end, label]) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#7b4bb3';
      ctx.fill();
      // Keep the label inside the canvas and clear of the Sun marker, even
      // when the line of nodes points almost straight at the Sun.
      ctx.fillStyle = '#5a3490';
      ctx.font = '600 10px sans-serif';
      ctx.textAlign = 'left';
      const width = ctx.measureText(label).width;
      const preferredLeft = end.x >= cx ? end.x + 4 : end.x - 4 - width;
      const left = Math.min(Math.max(preferredLeft, 4), sunX - 18 - width);
      ctx.fillText(label, left, end.y + (end.y >= cy ? 14 : -6));
    });

    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#2a6bd6';
    ctx.fill();
    ctx.strokeStyle = '#173d75';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // The Moon, with a drop line to the ecliptic showing how far above or
    // below it the Moon is.
    const moon3d = orbitPoint(state.argumentOfLatitudeDeg, nodeAngle, tilt);
    const moon = project(moon3d);
    const shadowOnPlane = project({ x: moon3d.x, y: moon3d.y, z: 0 });
    ctx.beginPath();
    ctx.moveTo(moon.x, moon.y);
    ctx.lineTo(shadowOnPlane.x, shadowOnPlane.y);
    ctx.strokeStyle = '#6b7684';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(shadowOnPlane.x, shadowOnPlane.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#6b7684';
    ctx.fill();
    MoonOrbitPanel.drawMoonIcon(ctx, moon.x, moon.y, 9, 0);

    ctx.fillStyle = '#8a97a5';
    ctx.font = 'italic 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Tilt exaggerated 3× · not to scale', 8, canvas.height - 10);
  }

  // --- Readouts and the eclipse indicator ------------------------------

  function aboveOrBelow(latitudeDeg) {
    if (Math.abs(latitudeDeg) < 0.05) return 'on the ecliptic';
    return `${Math.abs(latitudeDeg).toFixed(1)}° ${latitudeDeg > 0 ? 'above' : 'below'}`;
  }

  function renderIndicator(state) {
    const typeWord = state.syzygy.type === 'new' ? 'new Moon' : 'full Moon';
    const limitText = `the ${state.limitDeg}° ${state.kind} limit`;
    const nodeText = `${state.nodeDistanceAtSyzygyDeg.toFixed(1)}° from a node`;

    indicator.dataset.state = state.eclipsePossible ? 'possible' : 'not-possible';

    if (state.eclipsePossible) {
      indicatorTitle.textContent = state.kind === 'solar' ? 'Solar eclipse possible' : 'Lunar eclipse possible';
      indicatorDetail.textContent = state.kind === 'solar'
        ? `It's a new Moon only ${nodeText} — inside ${limitText} — so it can pass in front of the Sun.`
        : `It's a full Moon only ${nodeText} — inside ${limitText} — so it can pass into Earth's shadow.`;
      return;
    }

    indicatorTitle.textContent = 'No eclipse possible';
    if (!state.onThisDate) {
      indicatorDetail.textContent =
        `Eclipses only happen at a new or full Moon, and this date is a ${state.phaseName.toLowerCase()}. ` +
        `The nearest is a ${typeWord} on ${formatDate(state.syzygy.date)}.`;
      return;
    }
    const latitudeAtSyzygy = EclipseGeometry.eclipticLatitude(
      EclipseGeometry.argumentOfLatitude(state.syzygy.date)
    );
    const passes = state.kind === 'solar' ? 'the Sun' : "Earth's shadow";
    indicatorDetail.textContent =
      `It's a ${typeWord}, but the Moon is ${nodeText} — outside ${limitText} — ` +
      `so it passes ${latitudeAtSyzygy > 0 ? 'above' : 'below'} ${passes}.`;
  }

  function render() {
    const date = parseDateInput(dateInput.value);
    const state = EclipseGeometry.getEclipseState(date);
    dateLabel.textContent = formatDate(date);

    drawTiltedOrbit(state);
    renderIndicator(state);

    phaseValue.textContent = state.phaseName;
    nodeDistanceValue.textContent =
      `${state.nearestNode.degrees.toFixed(1)}° (${state.nearestNode.node})`;
    latitudeValue.textContent = aboveOrBelow(state.eclipticLatitudeDeg);
    syzygyValue.textContent =
      `${state.syzygy.type === 'new' ? 'New' : 'Full'} Moon, ${formatDate(state.syzygy.date)}, ≈${formatHourUtc(state.syzygy.date)}`;
    syzygyNodeValue.textContent =
      `${state.nodeDistanceAtSyzygyDeg.toFixed(1)}° from a node (limit ${state.limitDeg}°)`;
  }

  // --- Stepping from one new/full Moon to the next ---------------------
  // A new or full Moon comes every ~14.8 days, so looking ~7-22 days
  // ahead (or back) always finds the next (or previous) one.

  function stepSyzygy(direction) {
    const current = parseDateInput(dateInput.value);
    const currentDay = dateInput.value;
    for (const offsetDays of [7.4, 14.8, 22]) {
      const found = EclipseGeometry.nearestNewOrFullMoon(
        new Date(current.getTime() + direction * offsetDays * DAY_MS)
      );
      const foundDay = found.date.toISOString().slice(0, 10);
      if (direction > 0 ? foundDay > currentDay : foundDay < currentDay) {
        dateInput.value = foundDay;
        render();
        return;
      }
    }
  }

  document.getElementById('prev-syzygy').addEventListener('click', () => stepSyzygy(-1));
  document.getElementById('next-syzygy').addEventListener('click', () => stepSyzygy(1));
  document.querySelectorAll('.preset-button').forEach((button) => {
    button.addEventListener('click', () => {
      dateInput.value = button.dataset.date;
      render();
    });
  });
  dateInput.addEventListener('input', () => {
    if (dateInput.value) render();
  });

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    node:
      "A node: one of the two points where the Moon's tilted orbit crosses the ecliptic. The Moon is on the ecliptic only when it's at a node.",
    ecliptic:
      "The ecliptic: the plane of Earth's orbit round the Sun — and the Sun's apparent yearly path across the sky.",
    lineOfNodes:
      "The line of nodes: the line through Earth joining the Moon's two nodes. Eclipses can only happen when it points roughly towards the Sun.",
    eclipticLimit:
      'An ecliptic limit: the furthest a new or full Moon can be from a node and still produce an eclipse — about 18.4° for a solar eclipse and 12.2° for a lunar one.',
  };

  render();
  renderCoverage();
  Glossary.init(GLOSSARY);
})();
