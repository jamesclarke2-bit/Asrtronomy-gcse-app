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

  function drawSky(lat, dayIndex, minutesOfDay, current) {
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

    drawSky(lat, dayIndex, minutesOfDay, sun);
  }

  [dateSlider, timeSlider, latSlider].forEach((el) => el.addEventListener('input', update));
  update();
})();
