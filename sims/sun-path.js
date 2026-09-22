(function () {
  const YEAR = 2026;
  const LONGITUDE = 0;

  const dateSlider = document.getElementById('date-slider');
  const timeSlider = document.getElementById('time-slider');
  const latSlider = document.getElementById('lat-slider');

  const dateLabel = document.getElementById('date-label');
  const timeLabel = document.getElementById('time-label');
  const latLabel = document.getElementById('lat-label');

  const altitudeValue = document.getElementById('altitude-value');
  const azimuthValue = document.getElementById('azimuth-value');
  const declinationValue = document.getElementById('declination-value');
  const eqTimeValue = document.getElementById('eqtime-value');

  const canvas = document.getElementById('sky');
  const ctx = canvas.getContext('2d');
  const labelsToggle = document.getElementById('labels-toggle');

  const orbitCanvas = document.getElementById('orbit');
  const orbitCtx = orbitCanvas.getContext('2d');

  // Earth's axial tilt, in degrees. The tick mark on the orbit diagram is
  // drawn at this fixed screen angle for every orbital position — the axis
  // keeps pointing the same direction in space through the year, which is
  // the mechanism behind the seasons, not distance from the Sun.
  const EARTH_AXIS_SCREEN_ANGLE_DEG = 66.6;

  // Cache the day's culmination (max-altitude point), since it only
  // depends on date and latitude, not the time slider.
  let culminationCache = { dayIndex: null, lat: null, result: null };

  function dayOfYearToUTCDate(year, dayIndex) {
    const d = new Date(Date.UTC(year, 0, 1));
    d.setUTCDate(d.getUTCDate() + dayIndex);
    return d;
  }

  function buildDateTime(dayIndex, minutesOfDay) {
    const day = dayOfYearToUTCDate(YEAR, dayIndex);
    const hours = Math.floor(minutesOfDay / 60);
    const minutes = minutesOfDay % 60;
    return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hours, minutes));
  }

  // Rounding a raw azimuth to 1dp can land exactly on 360.0 when the
  // true value is e.g. 359.98 (common right around transit) — wrap
  // that back to 0.0 so the reading never displays "360.0°".
  function formatAzimuth(azimuth) {
    let rounded = Math.round(azimuth * 10) / 10;
    if (rounded >= 360) rounded -= 360;
    return `${rounded.toFixed(1)}°`;
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  }

  function formatTime(minutesOfDay) {
    const h = String(Math.floor(minutesOfDay / 60)).padStart(2, '0');
    const m = String(minutesOfDay % 60).padStart(2, '0');
    return `${h}:${m} UTC`;
  }

  function polarPoint(cx, cy, radius, altitude, azimuth) {
    const r = radius * (90 - altitude) / 90;
    const rad = (azimuth * Math.PI) / 180;
    return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
  }

  // Extend a point away from the diagram's centre — used to push labels
  // clear of the line/marker they're annotating.
  function offsetOutward(cx, cy, point, distance) {
    const dx = point.x - cx;
    const dy = point.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    return { x: point.x + (dx / len) * distance, y: point.y + (dy / len) * distance };
  }

  function findCulmination(dayIndex, lat) {
    if (culminationCache.dayIndex === dayIndex && culminationCache.lat === lat) {
      return culminationCache.result;
    }
    let best = null;
    for (let m = 0; m < 1440; m++) {
      const sun = SolarPosition.getSunPosition(buildDateTime(dayIndex, m), lat, LONGITUDE);
      if (!best || sun.altitude > best.altitude) best = sun;
    }
    culminationCache = { dayIndex, lat, result: best };
    return best;
  }

  function orbitPoint(cx, cy, radius, thetaDeg) {
    const rad = (thetaDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  }

  function textAlignFor(dx) {
    if (Math.abs(dx) < 5) return 'center';
    return dx > 0 ? 'left' : 'right';
  }

  function drawOrbit(dayIndex) {
    const cx = orbitCanvas.width / 2;
    const cy = orbitCanvas.height / 2;
    const R = Math.min(cx, cy) - 80;

    orbitCtx.clearRect(0, 0, orbitCanvas.width, orbitCanvas.height);
    orbitCtx.textBaseline = 'middle';

    // Orbit path
    orbitCtx.beginPath();
    orbitCtx.arc(cx, cy, R, 0, Math.PI * 2);
    orbitCtx.strokeStyle = '#b7c3d1';
    orbitCtx.lineWidth = 1.5;
    orbitCtx.setLineDash([5, 5]);
    orbitCtx.stroke();
    orbitCtx.setLineDash([]);

    // Reference points around the orbit
    const REFERENCE_POINTS = [
      { theta: 90, label: 'Jun sol.' },
      { theta: 0, label: 'Mar eq.' },
      { theta: 270, label: 'Dec sol.' },
      { theta: 180, label: 'Sep eq.' },
    ];
    orbitCtx.font = '10px sans-serif';
    orbitCtx.fillStyle = '#8a97a5';
    REFERENCE_POINTS.forEach(({ theta, label }) => {
      const p = orbitPoint(cx, cy, R, theta);
      orbitCtx.beginPath();
      orbitCtx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      orbitCtx.fill();

      const labelPoint = orbitPoint(cx, cy, R + 16, theta);
      orbitCtx.textAlign = textAlignFor(labelPoint.x - cx);
      orbitCtx.fillText(label, labelPoint.x, labelPoint.y);
    });

    // The Sun, at the centre
    orbitCtx.beginPath();
    orbitCtx.arc(cx, cy, 12, 0, Math.PI * 2);
    orbitCtx.fillStyle = '#ffb703';
    orbitCtx.fill();
    orbitCtx.strokeStyle = '#e08e00';
    orbitCtx.lineWidth = 1.5;
    orbitCtx.stroke();
    orbitCtx.fillStyle = '#8a5b00';
    orbitCtx.font = '600 11px sans-serif';
    orbitCtx.textAlign = 'center';
    orbitCtx.fillText('Sun', cx, cy + 24);

    // Earth's current position
    const theta = EarthOrbit.computeEarthOrbitAngle(dayIndex);
    const earth = orbitPoint(cx, cy, R, theta);

    // Fixed-direction axis tick: same screen angle at every position
    const axisRad = (EARTH_AXIS_SCREEN_ANGLE_DEG * Math.PI) / 180;
    const axisDx = Math.cos(axisRad);
    const axisDy = -Math.sin(axisRad);
    orbitCtx.beginPath();
    orbitCtx.moveTo(earth.x - axisDx * 9, earth.y - axisDy * 9);
    orbitCtx.lineTo(earth.x + axisDx * 16, earth.y + axisDy * 16);
    orbitCtx.strokeStyle = '#c0392b';
    orbitCtx.lineWidth = 2;
    orbitCtx.stroke();
    orbitCtx.beginPath();
    orbitCtx.arc(earth.x + axisDx * 16, earth.y + axisDy * 16, 2.5, 0, Math.PI * 2);
    orbitCtx.fillStyle = '#c0392b';
    orbitCtx.fill();

    // Earth marker
    orbitCtx.beginPath();
    orbitCtx.arc(earth.x, earth.y, 7, 0, Math.PI * 2);
    orbitCtx.fillStyle = '#2a6bd6';
    orbitCtx.fill();
    orbitCtx.strokeStyle = '#173d75';
    orbitCtx.lineWidth = 1.5;
    orbitCtx.stroke();

    orbitCtx.fillStyle = '#8a97a5';
    orbitCtx.font = 'italic 11px sans-serif';
    orbitCtx.textAlign = 'left';
    orbitCtx.fillText('Not to scale', 8, orbitCanvas.height - 10);
  }

  function drawSky(lat, dayIndex, minutesOfDay, current, showLabels) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const R = Math.min(cx, cy) - 40;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Altitude rings (horizon + 30/60 degrees)
    [0, 30, 60].forEach((ring) => {
      const r = R * (90 - ring) / 90;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = ring === 0 ? '#8a97a5' : '#d6dfe8';
      ctx.lineWidth = ring === 0 ? 2 : 1;
      ctx.stroke();
    });

    // Compass labels
    ctx.fillStyle = '#333';
    ctx.font = '600 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', cx, cy - R - 16);
    ctx.fillText('S', cx, cy + R + 16);
    ctx.fillText('E', cx + R + 16, cy);
    ctx.fillText('W', cx - R - 16, cy);

    if (showLabels) {
      // Meridian: the N-S line through the zenith
      ctx.beginPath();
      ctx.moveTo(cx, cy - R);
      ctx.lineTo(cx, cy + R);
      ctx.strokeStyle = '#5b6b82';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#5b6b82';
      ctx.font = '600 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Meridian', cx + 8, cy - R * 0.5);

      // Zenith: the point directly overhead, at the diagram's centre
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#5b6b82';
      ctx.fill();
      ctx.textAlign = 'left';
      ctx.fillText('Zenith', cx + 8, cy - 8);

      // Horizon: the outer circle, 0 degrees altitude
      ctx.fillStyle = '#5b6b82';
      ctx.textAlign = 'left';
      ctx.fillText('Horizon', cx + R * 0.6, cy + R * 0.75);
    }

    // Sun's path across the selected day, one point every 5 minutes,
    // drawn only while the sun is above the horizon.
    ctx.beginPath();
    let drawing = false;
    for (let m = 0; m <= 1440; m += 5) {
      const t = buildDateTime(dayIndex, m % 1440);
      const sun = SolarPosition.getSunPosition(t, lat, LONGITUDE);
      if (sun.altitude < 0) {
        drawing = false;
        continue;
      }
      const { x, y } = polarPoint(cx, cy, R, sun.altitude, sun.azimuth);
      if (!drawing) {
        ctx.moveTo(x, y);
        drawing = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = '#f5a623';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Current sun position
    const aboveHorizon = current.altitude >= 0;
    const point = aboveHorizon
      ? polarPoint(cx, cy, R, current.altitude, current.azimuth)
      : polarPoint(cx, cy, R, 0, current.azimuth);

    ctx.beginPath();
    ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = aboveHorizon ? '#ffb703' : '#9aa5b1';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Culmination: the day's maximum-altitude point, where the sun
    // crosses the meridian.
    const culmination = findCulmination(dayIndex, lat);
    const culminationVisible = culmination.altitude >= 0;
    const culminationPoint = culminationVisible
      ? polarPoint(cx, cy, R, culmination.altitude, culmination.azimuth)
      : polarPoint(cx, cy, R, 0, culmination.azimuth);

    ctx.beginPath();
    ctx.arc(culminationPoint.x, culminationPoint.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = culminationVisible ? '#8e44ad' : '#c9b6d6';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (showLabels) {
      const labelPoint = offsetOutward(cx, cy, culminationPoint, 14);
      ctx.fillStyle = '#8e44ad';
      ctx.font = '600 12px sans-serif';
      ctx.textAlign = culminationPoint.x >= cx ? 'left' : 'right';
      ctx.fillText('Culmination', labelPoint.x, labelPoint.y);
    }
  }

  function update() {
    const dayIndex = Number(dateSlider.value);
    const minutesOfDay = Number(timeSlider.value);
    const lat = Number(latSlider.value);

    dateLabel.textContent = formatDate(dayOfYearToUTCDate(YEAR, dayIndex));
    timeLabel.textContent = formatTime(minutesOfDay);
    latLabel.textContent = `${lat}°`;

    const date = buildDateTime(dayIndex, minutesOfDay);
    const sun = SolarPosition.getSunPosition(date, lat, LONGITUDE);

    altitudeValue.textContent = `${sun.altitude.toFixed(1)}°${sun.altitude < 0 ? ' (below horizon)' : ''}`;
    azimuthValue.textContent = formatAzimuth(sun.azimuth);
    declinationValue.textContent = `${sun.declination.toFixed(2)}°`;

    const eqTimeAbs = Math.abs(sun.equationOfTime).toFixed(1);
    const eqTimeDirection = sun.equationOfTime >= 0 ? 'ahead of' : 'behind';
    eqTimeValue.textContent = `Sundial reads ${eqTimeAbs} min ${eqTimeDirection} clock time`;

    drawSky(lat, dayIndex, minutesOfDay, sun, labelsToggle.checked);
    drawOrbit(dayIndex);
  }

  function updateLegendVisibility() {
    document.getElementById('labels-legend').hidden = !labelsToggle.checked;
  }

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = SolarPosition.CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  // --- Tap-to-reveal glossary ----------------------------------------
  // Toggle mechanism lives in the shared glossary.js (Glossary.init) —
  // this page just supplies its own term dictionary.
  const GLOSSARY = {
    meridian: 'Meridian: the imaginary north-south line running through the zenith, from the horizon due north to the horizon due south. The sun crosses it once a day, at culmination.',
    zenith: 'Zenith: the point directly overhead, at 90° altitude.',
    horizon: 'Horizon: the boundary between sky and ground, at 0° altitude, all the way round.',
    culmination: "Culmination (transit): the moment the sun crosses the meridian — its highest point in the sky that day.",
    altitude: 'Altitude: how high the sun is above the horizon, in degrees — 0° on the horizon, 90° directly overhead.',
    azimuth: 'Azimuth: compass direction along the horizon, in degrees clockwise from north (0° = N, 90° = E, 180° = S, 270° = W).',
    declination: "Declination: the sun's north-south position on the sky, in degrees from the celestial equator — the same everywhere on Earth on a given date, and the reason its altitude changes with the seasons.",
    eot: 'Equation of time: the difference between apparent (sundial) and mean (clock) solar time, caused by orbital eccentricity and axial tilt — explored in full on the Equation of Time page.',
  };

  [dateSlider, timeSlider, latSlider].forEach((el) => el.addEventListener('input', update));
  labelsToggle.addEventListener('change', () => {
    updateLegendVisibility();
    update();
  });
  update();
  updateLegendVisibility();
  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(Questions.QUESTIONS);
})();
