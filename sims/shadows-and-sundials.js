(function () {
  const YEAR = 2026;
  const CURRICULUM_UNITS = ['u2.30', 'u2.31', 'u2.32'];

  // --- Shared helpers (same conventions as coordinates.js / equation-of-time.js) ---

  function dayOfYearToUTCDate(year, dayIndex) {
    const d = new Date(Date.UTC(year, 0, 1));
    d.setUTCDate(d.getUTCDate() + dayIndex);
    return d;
  }

  function buildMinuteDate(dayDate, minutesOfDay) {
    return new Date(dayDate.getTime() + minutesOfDay * 60000);
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  }

  function formatClock(minutes) {
    const pad = (n) => String(n).padStart(2, '0');
    const wrapped = ((Math.round(minutes) % 1440) + 1440) % 1440;
    return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
  }

  function formatLongitude(lon) {
    if (lon === 0) return '0°';
    return `${Math.abs(lon).toFixed(1)}° ${lon > 0 ? 'E' : 'W'}`;
  }

  function formatLatitude(lat) {
    return `${Math.abs(lat).toFixed(1)}° ${lat >= 0 ? 'N' : 'S'}`;
  }

  const COMPASS_DIRECTIONS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

  function compassLabel(azimuthDeg) {
    const idx = Math.round(azimuthDeg / 22.5) % 16;
    return `${azimuthDeg.toFixed(0)}° (${COMPASS_DIRECTIONS[idx]})`;
  }

  // Every shadow tip across a day (sampled every 4 minutes) plus the
  // exact noon tip and noon UT time, both straight from
  // SolarPosition/ShadowGeometry — never a second model of where the
  // Sun is.
  function computeDayTrace(lat, lon, dayDate, heightM) {
    const { solarNoonUT, polar } = SolarPosition.getSunriseSunset(dayDate, lat, lon);
    const points = [];
    for (let m = 0; m < 1440; m += 4) {
      const sun = SolarPosition.getSunPosition(buildMinuteDate(dayDate, m), lat, lon);
      const tip = ShadowGeometry.shadowTipMetres(heightM, sun.altitude, sun.azimuth);
      if (tip) points.push(tip);
    }
    let noonTip = null;
    if (solarNoonUT != null) {
      const noonSun = SolarPosition.getSunPosition(buildMinuteDate(dayDate, solarNoonUT), lat, lon);
      noonTip = ShadowGeometry.shadowTipMetres(heightM, noonSun.altitude, noonSun.azimuth);
    }
    return { points, noonTip, solarNoonUT, polar };
  }

  // --- Top-down shadow-stick diagram, shared by section 1 and the challenge ---

  function drawShadowDiagram(canvas, ctx, trace, options) {
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height / 2;

    if (trace.polar === 'night' || trace.points.length === 0) {
      ctx.fillStyle = '#555';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No shadow today (polar night)', cx, cy);
      return;
    }

    // A fixed multiple of the shortest (noon) shadow bounds the display
    // scale, so the picture stays legible even though a vertical stick's
    // shadow genuinely grows towards infinity near sunrise and sunset.
    const noonLength = trace.noonTip ? trace.noonTip.length : options.heightM;
    const cap = Math.max(noonLength * 5, options.heightM * 3);
    const maxRadius = Math.min(cx, cy) - 28;
    const scale = maxRadius / cap;

    function toCanvas(tip) {
      const len = tip.length;
      const clippedLen = Math.min(len, cap);
      const ux = len === 0 ? 0 : tip.x / len;
      const uy = len === 0 ? 0 : tip.y / len;
      return { x: cx + ux * clippedLen * scale, y: cy - uy * clippedLen * scale };
    }

    // N/E/S/W compass labels.
    ctx.fillStyle = '#8a97a5';
    ctx.font = '600 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', cx, 14);
    ctx.fillText('S', cx, height - 14);
    ctx.fillText('E', width - 14, cy);
    ctx.fillText('W', 14, cy);

    // Traced shadow tip across the day.
    ctx.beginPath();
    let started = false;
    trace.points.forEach((tip) => {
      const p = toCanvas(tip);
      if (!started) {
        ctx.moveTo(p.x, p.y);
        started = true;
      } else {
        ctx.lineTo(p.x, p.y);
      }
    });
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#2e8b57';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // Shortest (noon) shadow marker.
    if (trace.noonTip && options.showNoonMarker !== false) {
      const p = toCanvas(trace.noonTip);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.strokeStyle = '#f5a623';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Equal-shadow-length construction: the current tip, its mirror
    // image either side of noon, the line joining them, and that
    // line's perpendicular bisector through the stick's base — which
    // is exactly the true north-south line, drawn here as the vertical
    // line through the centre (since north is always "up" in this
    // frame).
    if (options.showEqual && options.currentTip && options.mirrorTip) {
      const p1 = toCanvas(options.currentTip);
      const p2 = toCanvas(options.mirrorTip);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = '#8e44ad';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      [p1, p2].forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#8e44ad';
        ctx.fill();
      });
      ctx.beginPath();
      ctx.moveTo(cx, 20);
      ctx.lineTo(cx, height - 20);
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = '#8e44ad';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Stick base.
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();

    // Current shadow.
    if (options.currentTip) {
      const p = toCanvas(options.currentTip);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = '#2a5bd7';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#2a5bd7';
      ctx.fill();
    } else {
      ctx.fillStyle = '#555';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No shadow now (Sun below horizon)', cx, height - 10);
    }
  }

  // --- Section 1: shadow stick --------------------------------------

  const shadowCanvas = document.getElementById('shadow-canvas');
  const shadowCtx = shadowCanvas.getContext('2d');

  const dateSlider = document.getElementById('date-slider');
  const dateLabel = document.getElementById('date-label');
  const latSlider = document.getElementById('lat-slider');
  const latLabel = document.getElementById('lat-label');
  const lonSlider = document.getElementById('lon-slider');
  const lonLabel = document.getElementById('lon-label');
  const timeSlider = document.getElementById('time-slider');
  const timeLabel = document.getElementById('time-label');
  const heightSlider = document.getElementById('height-slider');
  const heightLabel = document.getElementById('height-label');
  const equalShadowToggle = document.getElementById('equal-shadow-toggle');

  function updateShadowSection() {
    const lat = Number(latSlider.value);
    const lon = Number(lonSlider.value);
    const dayIndex = Number(dateSlider.value);
    const heightM = Number(heightSlider.value);
    const minutesUT = Number(timeSlider.value);
    const dayDate = dayOfYearToUTCDate(YEAR, dayIndex);

    dateLabel.textContent = formatDate(dayDate);
    latLabel.textContent = formatLatitude(lat);
    lonLabel.textContent = formatLongitude(lon);
    timeLabel.textContent = `${formatClock(minutesUT)} UT`;
    heightLabel.textContent = `${heightM.toFixed(1)} m`;

    const trace = computeDayTrace(lat, lon, dayDate, heightM);
    const currentSun = SolarPosition.getSunPosition(buildMinuteDate(dayDate, minutesUT), lat, lon);
    const currentTip = ShadowGeometry.shadowTipMetres(heightM, currentSun.altitude, currentSun.azimuth);

    let mirrorTip = null;
    if (trace.solarNoonUT != null) {
      const mirrorMinutes = 2 * trace.solarNoonUT - minutesUT;
      if (mirrorMinutes >= 0 && mirrorMinutes < 1440) {
        const mirrorSun = SolarPosition.getSunPosition(buildMinuteDate(dayDate, mirrorMinutes), lat, lon);
        mirrorTip = ShadowGeometry.shadowTipMetres(heightM, mirrorSun.altitude, mirrorSun.azimuth);
      }
    }

    drawShadowDiagram(shadowCanvas, shadowCtx, trace, {
      heightM,
      currentTip,
      mirrorTip,
      showEqual: equalShadowToggle.checked,
    });

    const lengthValue = document.getElementById('shadow-length-value');
    const directionValue = document.getElementById('shadow-direction-value');
    if (currentTip) {
      lengthValue.textContent = `${currentTip.length.toFixed(2)} m`;
      directionValue.textContent = compassLabel(ShadowGeometry.shadowAzimuthDeg(currentSun.azimuth));
    } else {
      lengthValue.textContent = 'No shadow (Sun below horizon)';
      directionValue.textContent = '—';
    }

    const noonSummary = document.getElementById('shadow-noon-summary');
    if (trace.noonTip && trace.solarNoonUT != null) {
      const dir = trace.noonTip.y >= 0 ? 'due north' : 'due south';
      noonSummary.textContent =
        `Today's shortest shadow: ${trace.noonTip.length.toFixed(2)} m, ${dir}, at local apparent noon ` +
        `(${formatClock(trace.solarNoonUT)} UT).`;
    } else {
      noonSummary.textContent = 'The Sun stays below the horizon all day here (polar night).';
    }

    updateSundialSection();
  }

  // --- Section 2: longitude challenge ---------------------------------

  const challengeCanvas = document.getElementById('challenge-canvas');
  const challengeCtx = challengeCanvas.getContext('2d');
  const challengeTimeSlider = document.getElementById('challenge-time-slider');
  const challengeTimeLabel = document.getElementById('challenge-time-label');

  let challenge = null;

  function newChallenge() {
    const dayIndex = Math.floor(Math.random() * 365);
    const lon = Math.round((Math.random() * 360 - 180) * 10) / 10;
    const lat = 30 + Math.random() * 30; // not part of the longitude calculation; varied only for a fresh-looking diagram
    const heightM = 1;
    const dayDate = dayOfYearToUTCDate(YEAR, dayIndex);
    const equationOfTime = SolarPosition.getSunPosition(buildMinuteDate(dayDate, 720), 0, 0).equationOfTime;
    challenge = { lat, lon, dayDate, heightM, equationOfTime };

    document.getElementById('longitude-guess').value = '';
    const feedback = document.getElementById('longitude-feedback');
    feedback.textContent = '';
    feedback.className = 'question-feedback';

    updateChallengeSection();
  }

  function updateChallengeSection() {
    if (!challenge) return;
    const { lat, lon, dayDate, heightM, equationOfTime } = challenge;
    const minutesUT = Number(challengeTimeSlider.value);
    challengeTimeLabel.textContent = `${formatClock(minutesUT)} UT`;

    const trace = computeDayTrace(lat, lon, dayDate, heightM);
    const currentSun = SolarPosition.getSunPosition(buildMinuteDate(dayDate, minutesUT), lat, lon);
    const currentTip = ShadowGeometry.shadowTipMetres(heightM, currentSun.altitude, currentSun.azimuth);

    drawShadowDiagram(challengeCanvas, challengeCtx, trace, {
      heightM,
      currentTip,
      mirrorTip: null,
      showEqual: false,
      showNoonMarker: false,
    });

    document.getElementById('challenge-date-value').textContent = `Date: ${formatDate(dayDate)}`;
    document.getElementById('challenge-eot-value').textContent =
      `Equation of time: ${equationOfTime >= 0 ? '+' : ''}${equationOfTime.toFixed(1)} min`;
    document.getElementById('challenge-shadow-value').textContent = currentTip
      ? `Shadow length now: ${currentTip.length.toFixed(2)} m`
      : 'No shadow now (Sun below horizon)';
  }

  function checkLongitudeGuess() {
    if (!challenge) return;
    const input = document.getElementById('longitude-guess');
    const feedback = document.getElementById('longitude-feedback');
    if (input.value === '' || Number.isNaN(Number(input.value))) {
      feedback.className = 'question-feedback';
      feedback.textContent = 'Enter a longitude first.';
      return;
    }
    const guess = Number(input.value);
    const tolerance = Math.max(Math.abs(challenge.lon) * 0.02, 1);
    const correct = Math.abs(guess - challenge.lon) <= tolerance;
    feedback.className = 'question-feedback ' + (correct ? 'correct' : 'incorrect');
    feedback.textContent =
      (correct ? 'Correct! ' : 'Not quite. ') + `The hidden longitude was ${formatLongitude(challenge.lon)}.`;
  }

  // --- Section 3: sundial ---------------------------------------------

  const sundialCanvas = document.getElementById('sundial-canvas');
  const sundialCtx = sundialCanvas.getContext('2d');
  const clockTimeToggle = document.getElementById('clock-time-toggle');
  const breakdownSvg = document.getElementById('offset-breakdown');

  function drawSundial(canvas, ctx, lat, hoursFromNoon) {
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height / 2;
    const R = Math.min(cx, cy) - 60;

    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = '#fdf6e3';
    ctx.fill();
    ctx.strokeStyle = '#8a97a5';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#555';
    for (let h = -5; h <= 5; h++) {
      const theta = ShadowGeometry.sundialHourLineAngleDeg(lat, h);
      if (theta === null) continue;
      const rad = (theta * Math.PI) / 180;
      const x = cx + R * Math.sin(rad);
      const y = cy - R * Math.cos(rad);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = h === 0 ? '#8a97a5' : '#cdd7e1';
      ctx.lineWidth = h === 0 ? 1.5 : 1;
      ctx.stroke();

      const labelX = cx + (R + 14) * Math.sin(rad);
      const labelY = cy - (R + 14) * Math.cos(rad);
      // 12-hour clock face: hours past 12 wrap back to 1-11, matching how a
      // real sundial's plate is numbered.
      let clockHour = (12 + h) % 24;
      if (clockHour <= 0) clockHour += 12;
      if (clockHour > 12) clockHour -= 12;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(clockHour), labelX, labelY);
    }

    // Gnomon, schematic: a raised triangular edge pointing toward the pole (up the page).
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy);
    ctx.lineTo(cx + 10, cy);
    ctx.lineTo(cx, cy - 34);
    ctx.closePath();
    ctx.fillStyle = '#8a5b00';
    ctx.fill();
    ctx.strokeStyle = '#5c3d00';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (Math.abs(hoursFromNoon) < 6) {
      const theta = ShadowGeometry.sundialHourLineAngleDeg(lat, hoursFromNoon);
      if (theta !== null) {
        const rad = (theta * Math.PI) / 180;
        const x = cx + R * Math.sin(rad);
        const y = cy - R * Math.cos(rad);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.strokeStyle = '#2a5bd7';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#2a5bd7';
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#555';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No shadow on the dial (night)', cx, height - 16);
    }

    ctx.fillStyle = '#8a97a5';
    ctx.font = '600 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Toward the pole', cx, 14);
  }

  function drawOffsetBreakdown(lon, eotMinutes, zone) {
    const longitudeCorrection = 4 * lon;
    const timeZoneDifference = -60 * zone;
    const total = longitudeCorrection + eotMinutes + timeZoneDifference;
    const maxAbs = Math.max(Math.abs(longitudeCorrection), Math.abs(eotMinutes), Math.abs(timeZoneDifference), Math.abs(total), 20) + 10;
    const left = 36;
    const right = 410;
    const xForValue = (v) => left + ((v + maxAbs) / (2 * maxAbs)) * (right - left);
    const zeroX = xForValue(0);
    const totalX = xForValue(total);

    const segments = [
      { value: longitudeCorrection, color: '#2a6bd6' },
      { value: eotMinutes, color: '#f5a623' },
      { value: timeZoneDifference, color: '#2e8b57' },
    ];

    let bars = '';
    segments.forEach((seg, i) => {
      const x1 = xForValue(0);
      const x2 = xForValue(seg.value);
      const y = 16 + i * 16;
      bars += `<rect x="${Math.min(x1, x2)}" y="${y}" width="${Math.max(Math.abs(x2 - x1), 1)}" height="11" fill="${seg.color}"></rect>`;
    });

    breakdownSvg.innerHTML =
      `<line x1="${zeroX}" y1="10" x2="${zeroX}" y2="72" stroke="#8a97a5" stroke-width="1"></line>` +
      bars +
      `<line x1="${totalX}" y1="10" x2="${totalX}" y2="72" stroke="#8e44ad" stroke-width="2"></line>` +
      `<text x="${zeroX}" y="86" font-size="10" fill="#555" text-anchor="middle">0 min</text>` +
      `<text x="${totalX}" y="100" font-size="11" fill="#5e2d73" text-anchor="middle" font-weight="600">` +
      `${total >= 0 ? '+' : ''}${total.toFixed(1)} min</text>`;

    document.getElementById('offset-breakdown-caption').textContent =
      `Longitude correction ${longitudeCorrection >= 0 ? '+' : ''}${longitudeCorrection.toFixed(1)} min, ` +
      `equation of time ${eotMinutes >= 0 ? '+' : ''}${eotMinutes.toFixed(1)} min, ` +
      `time-zone difference ${timeZoneDifference >= 0 ? '+' : ''}${timeZoneDifference.toFixed(1)} min ` +
      `— sundial minus clock = ${total >= 0 ? '+' : ''}${total.toFixed(1)} min.`;
  }

  function updateSundialSection() {
    const lat = Number(latSlider.value);
    const lon = Number(lonSlider.value);
    const dayIndex = Number(dateSlider.value);
    const minutesUT = Number(timeSlider.value);
    const dayDate = dayOfYearToUTCDate(YEAR, dayIndex);
    const sun = SolarPosition.getSunPosition(buildMinuteDate(dayDate, minutesUT), lat, lon);
    const apparentMinutes = ShadowGeometry.apparentSolarTimeMinutes(minutesUT, lon, sun.equationOfTime);
    const hoursFromNoon = (apparentMinutes - 720) / 60;

    drawSundial(sundialCanvas, sundialCtx, lat, hoursFromNoon);

    const zone = Math.round(lon / 15);
    const timeValue = document.getElementById('sundial-time-value');
    if (clockTimeToggle.checked) {
      const zoneTimeMinutes = minutesUT + 60 * zone;
      const zoneName = zone === 0 ? 'GMT' : `GMT${zone > 0 ? '+' : '−'}${Math.abs(zone)}`;
      timeValue.textContent = `Clock (zone) time: ${formatClock(zoneTimeMinutes)} (${zoneName})`;
    } else {
      timeValue.textContent = `Sundial reading (apparent solar time): ${formatClock(apparentMinutes)}`;
    }

    drawOffsetBreakdown(lon, sun.equationOfTime, zone);
  }

  // --- Wiring, coverage and quiz --------------------------------------

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  [dateSlider, latSlider, lonSlider, timeSlider, heightSlider].forEach((el) => el.addEventListener('input', updateShadowSection));
  equalShadowToggle.addEventListener('change', updateShadowSection);
  challengeTimeSlider.addEventListener('input', updateChallengeSection);
  document.getElementById('new-challenge-button').addEventListener('click', newChallenge);
  document.getElementById('check-longitude').addEventListener('click', checkLongitudeGuess);
  clockTimeToggle.addEventListener('change', updateSundialSection);

  updateShadowSection();
  newChallenge();
  renderCoverage();

  QuizUI.mount(ShadowsAndSundialsQuestions.makeQuestions(ShadowGeometry, SolarPosition));
})();
