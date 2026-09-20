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

  const canvas = document.getElementById('sky');
  const ctx = canvas.getContext('2d');
  const labelsToggle = document.getElementById('labels-toggle');

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
    azimuthValue.textContent = `${sun.azimuth.toFixed(1)}°`;
    declinationValue.textContent = `${sun.declination.toFixed(2)}°`;

    drawSky(lat, dayIndex, minutesOfDay, sun, labelsToggle.checked);
  }

  function updateLegendVisibility() {
    document.getElementById('labels-legend').hidden = !labelsToggle.checked;
  }

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = SolarPosition.CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  [dateSlider, timeSlider, latSlider].forEach((el) => el.addEventListener('input', update));
  labelsToggle.addEventListener('change', () => {
    updateLegendVisibility();
    update();
  });
  update();
  updateLegendVisibility();
  renderCoverage();
})();
