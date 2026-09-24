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
  const shadowPanel = document.getElementById('shadow-panel');
  const shadowHeading = document.getElementById('shadow-heading');
  const shadowCanvas = document.getElementById('shadow-diagram');
  const shadowCaption = document.getElementById('shadow-caption');
  const shadowReadout = document.getElementById('shadow-readout');

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

  // --- Shadow diagrams -------------------------------------------------

  const EARTH_RADIUS_KM = 6371;
  const MOON_RADIUS_KM = 1737.4;

  function drawLabel(ctx, text, x, y, align = 'left', color = '#3d4550') {
    ctx.fillStyle = color;
    ctx.font = '600 10px sans-serif';
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  // Side view, Sun off to the left. The Sun-Moon-Earth distances are
  // squashed to fit, but everything around Earth is drawn to one scale —
  // so where the umbra's tip lands relative to Earth's surface is true.
  function drawSolarShadow(shadow) {
    const ctx = shadowCanvas.getContext('2d');
    const W = shadowCanvas.width;
    const H = shadowCanvas.height;
    const axisY = H / 2;
    const earthR = 50;
    const kmToPx = earthR / EARTH_RADIUS_KM;
    const earthX = 350;
    const earthY = axisY + shadow.gamma * earthR;
    const moonX = 72;
    const moonR = 12;

    const surfaceX = shadow.central
      ? earthX - Math.sqrt(1 - shadow.gamma ** 2) * earthR
      : earthX;
    const tipX = Math.max(surfaceX + shadow.umbraMarginKm * kmToPx, moonX + 24);
    const penumbraHalfPx = (shadow.penumbraDiameterKm / 2) * kmToPx;

    ctx.clearRect(0, 0, W, H);
    ctx.textBaseline = 'alphabetic';

    ctx.beginPath();
    ctx.arc(-38, axisY, 52, -Math.PI / 2, Math.PI / 2);
    ctx.fillStyle = '#f5a623';
    ctx.fill();
    drawLabel(ctx, 'Sun', 4, axisY - 60);

    // Penumbra: widening from the Moon's edges out past Earth.
    ctx.beginPath();
    ctx.moveTo(moonX, axisY - moonR);
    ctx.lineTo(W, axisY - penumbraHalfPx - 6);
    ctx.lineTo(W, axisY + penumbraHalfPx + 6);
    ctx.lineTo(moonX, axisY + moonR);
    ctx.closePath();
    ctx.fillStyle = 'rgba(60, 70, 90, 0.14)';
    ctx.fill();

    // Umbra: a cone narrowing from the Moon to its tip. Where the tip
    // lies beyond Earth's surface, the cone stops at the surface (Earth is
    // opaque) and the rest is only outlined, dashed.
    const reachesSurface = shadow.central && shadow.umbraMarginKm >= 0;
    const coneEndX = reachesSurface ? surfaceX : tipX;
    const halfWidthAt = (x) => (moonR * (tipX - x)) / (tipX - moonX);
    ctx.beginPath();
    ctx.moveTo(moonX, axisY - moonR);
    ctx.lineTo(coneEndX, axisY - halfWidthAt(coneEndX));
    ctx.lineTo(coneEndX, axisY + halfWidthAt(coneEndX));
    ctx.lineTo(moonX, axisY + moonR);
    ctx.closePath();
    ctx.fillStyle = 'rgba(20, 22, 30, 0.8)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2);
    ctx.fillStyle = '#2a6bd6';
    ctx.fill();
    ctx.strokeStyle = '#173d75';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Where the shadow meets the ground, drawn at its true (tiny) width,
    // with a minimum so it stays visible.
    if (shadow.central) {
      const spotR = Math.max((shadow.umbraDiameterKm / 2) * kmToPx, 3);
      if (!reachesSurface) {
        // Beyond the tip the cone opens out again (the antumbra): from in
        // there the Moon looks smaller than the Sun, so a ring is left.
        ctx.beginPath();
        ctx.moveTo(tipX, axisY);
        ctx.lineTo(surfaceX, axisY - spotR);
        ctx.lineTo(surfaceX, axisY + spotR);
        ctx.closePath();
        ctx.fillStyle = 'rgba(20, 22, 30, 0.3)';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(surfaceX, axisY, spotR, 0, Math.PI * 2);
      ctx.fillStyle = reachesSurface ? '#14161e' : 'rgba(20, 22, 30, 0.45)';
      ctx.fill();
    }

    if (reachesSurface) {
      ctx.beginPath();
      ctx.moveTo(surfaceX, axisY - halfWidthAt(surfaceX));
      ctx.lineTo(tipX, axisY);
      ctx.lineTo(surfaceX, axisY + halfWidthAt(surfaceX));
      ctx.strokeStyle = 'rgba(20, 22, 30, 0.7)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    MoonOrbitPanel.drawMoonIcon(ctx, moonX, axisY, moonR, 180);

    if (tipX < W - 4) {
      ctx.beginPath();
      ctx.moveTo(tipX, axisY - 16);
      ctx.lineTo(tipX, axisY + 16);
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 2;
      ctx.stroke();
      const tipText = reachesSurface ? "Umbra's tip" : 'Umbra ends';
      ctx.font = '600 10px sans-serif';
      const halfText = ctx.measureText(tipText).width / 2 + 4;
      drawLabel(ctx, tipText, Math.min(Math.max(tipX, halfText), W - halfText), axisY - 24, 'center', '#a02d22');
    }

    drawLabel(ctx, 'Moon', moonX, axisY + moonR + 12, 'center');
    if (earthY + earthR + 12 < H - 22) drawLabel(ctx, 'Earth', earthX, earthY + earthR + 12, 'center');
    else drawLabel(ctx, 'Earth', earthX - earthR - 6, Math.min(earthY, H - 30), 'right');
    drawLabel(ctx, 'Umbra', moonX + 20, axisY - moonR - 8, 'left', '#1f2430');
    drawLabel(ctx, 'Penumbra', W - 6, axisY - penumbraHalfPx - 16, 'right', '#5b6474');

    ctx.fillStyle = '#8a97a5';
    ctx.font = 'italic 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Distances squashed · to scale around Earth', 8, H - 8);
  }

  // Looking along Earth's shadow at the Moon's distance, to scale.
  function drawLunarShadow(shadow) {
    const ctx = shadowCanvas.getContext('2d');
    const W = shadowCanvas.width;
    const H = shadowCanvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const kmToPx = 92 / 8500;
    const penumbraR = (shadow.penumbraDiameterKm / 2) * kmToPx;
    const umbraR = (shadow.umbraDiameterKm / 2) * kmToPx;
    const moonR = MOON_RADIUS_KM * kmToPx;
    const moonY = cy - shadow.offsetKm * kmToPx;

    ctx.clearRect(0, 0, W, H);
    ctx.textBaseline = 'alphabetic';

    ctx.beginPath();
    ctx.arc(cx, cy, penumbraR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(60, 70, 90, 0.16)';
    ctx.fill();
    ctx.strokeStyle = '#9aa5b1';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, umbraR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(40, 30, 40, 0.6)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(16, moonY);
    ctx.lineTo(W - 16, moonY);
    ctx.strokeStyle = '#6b7684';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(cx, moonY, moonR, 0, Math.PI * 2);
    ctx.fillStyle = shadow.type === 'total' ? 'rgba(196, 98, 66, 0.9)' : 'rgba(245, 232, 200, 0.85)';
    ctx.fill();
    ctx.strokeStyle = '#555b6e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label on the side of the shadow away from the Moon's path.
    const away = shadow.offsetKm > 0 ? 1 : -1;
    drawLabel(ctx, 'Penumbra', cx - penumbraR * 0.72, cy + away * (penumbraR * 0.72 + 8), 'right', '#5b6474');
    drawLabel(ctx, 'Umbra', cx + umbraR * 0.75, cy + away * (umbraR * 0.75 + 10), 'left', '#3a2a36');
    drawLabel(ctx, "Moon's path", W - 16, moonY - 9, 'right', '#5b6474');

    ctx.fillStyle = '#8a97a5';
    ctx.font = 'italic 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("Looking along Earth's shadow · to scale", 8, H - 8);
  }

  function setShadowReadout(rows) {
    shadowReadout.replaceChildren(
      ...rows.map(([term, value]) => {
        const row = document.createElement('div');
        row.className = 'readout-row';
        const dt = document.createElement('dt');
        dt.textContent = term;
        const dd = document.createElement('dd');
        dd.textContent = value;
        row.append(dt, dd);
        return row;
      })
    );
  }

  function renderShadowPanel(state) {
    shadowPanel.hidden = !state.shadow;
    if (!state.shadow) {
      shadowReadout.replaceChildren();
      return;
    }

    const shadow = state.shadow;
    const km = (value) => `${Math.round(value).toLocaleString('en-GB')} km`;

    if (shadow.kind === 'solar') {
      shadowHeading.textContent = "The Moon's shadow on Earth";
      drawSolarShadow(shadow);
      shadowCaption.textContent = shadow.central
        ? shadow.umbraMarginKm >= 0
          ? "The umbra's tip reaches past Earth's surface, so a narrow path sees a total eclipse; around it, the penumbra gives a partial one."
          : "The umbra's tip falls short of Earth's surface. Beyond the tip the shadow opens out again, and from inside that region the Moon can't quite cover the Sun."
        : "The umbra's axis passes clear of Earth, so only the penumbra falls on it.";
      setShadowReadout([
        ["Moon's distance", km(shadow.moonDistanceKm)],
        ['Umbra length', km(shadow.umbraLengthKm)],
        [shadow.central ? "Moon to Earth's surface" : "Moon to Earth's centre", km(shadow.surfaceDistanceKm)],
        ...(shadow.central
          ? [[
            shadow.umbraMarginKm >= 0 ? 'Umbra reaches surface by' : 'Umbra falls short by',
            km(Math.abs(shadow.umbraMarginKm)),
          ], [shadow.umbraMarginKm >= 0 ? 'Umbra width at Earth' : 'Ring-shadow width at Earth', km(shadow.umbraDiameterKm)]]
          : []),
        ['Penumbra width at Earth', km(shadow.penumbraDiameterKm)],
        ["Axis from Earth's centre", `${Math.abs(shadow.gamma).toFixed(2)} Earth radii`],
      ]);
    } else {
      shadowHeading.textContent = "The Moon in Earth's shadow";
      drawLunarShadow(shadow);
      shadowCaption.textContent =
        "Earth's shadow at the Moon's distance, drawn to scale. The Moon crosses it along the dashed line; its closest approach to the centre is shown.";
      setShadowReadout([
        ["Moon's distance", km(shadow.moonDistanceKm)],
        ["Earth's umbra width there", km(shadow.umbraDiameterKm)],
        ["Earth's penumbra width there", km(shadow.penumbraDiameterKm)],
        ["Moon's centre from shadow centre", km(Math.abs(shadow.offsetKm))],
        ['Share of Moon in umbra', `${Math.round(Math.min(Math.max(shadow.umbralMagnitude, 0), 1) * 100)}%`],
      ]);
    }
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

    indicator.dataset.state = state.eclipseType !== 'none' ? 'possible' : 'not-possible';

    if (state.eclipsePossible) {
      const shadow = state.shadow;
      const km = (value) => `${Math.round(value).toLocaleString('en-GB')} km`;
      const aligned = `It's a ${typeWord} only ${nodeText}, inside ${limitText}.`;
      const why = {
        total: shadow.kind === 'solar'
          ? `The Moon is ${km(shadow.moonDistanceKm)} away — close enough that its umbra reaches Earth's surface, so inside the path the Sun is completely covered.`
          : "The whole Moon passes into Earth's umbra, often turning a coppery red.",
        annular: `The Moon is ${km(shadow.moonDistanceKm)} away — so far that its umbra ends ${km(-shadow.umbraMarginKm)} short of Earth. The Moon looks slightly smaller than the Sun, leaving a bright ring.`,
        partial: shadow.kind === 'solar'
          ? "The shadow's central axis misses Earth, so only the penumbra falls on it: the Sun is never completely covered."
          : `Only part of the Moon enters Earth's umbra (about ${Math.round(shadow.umbralMagnitude * 100)}% of its width).`,
        penumbral: "The Moon misses Earth's umbra and only crosses the faint penumbra — a subtle dimming that's easy to miss.",
        none: shadow.kind === 'solar'
          ? 'But at these distances even the penumbra misses Earth.'
          : "But at these distances the Moon misses even Earth's penumbra.",
      };
      const kindWord = shadow.kind === 'solar' ? 'solar' : 'lunar';
      indicatorTitle.textContent = state.eclipseType === 'none'
        ? 'No eclipse — a near miss'
        : `${state.eclipseType[0].toUpperCase()}${state.eclipseType.slice(1)} ${kindWord} eclipse`;
      indicatorDetail.textContent = `${aligned} ${why[state.eclipseType]}` +
        (shadow.nearHybrid
          ? ' Only just, though: this is close to the dividing line between total and annular.'
          : '');
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
    renderShadowPanel(state);

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
    umbra:
      'The umbra: the dark central part of a shadow, where the Sun is completely blocked.',
    penumbra:
      'The penumbra: the fainter outer part of a shadow, where the Sun is only partly blocked.',
    eclipticLimit:
      'An ecliptic limit: the furthest a new or full Moon can be from a node and still produce an eclipse — about 18.4° for a solar eclipse and 12.2° for a lunar one.',
  };

  render();
  renderCoverage();
  Glossary.init(GLOSSARY);
})();
