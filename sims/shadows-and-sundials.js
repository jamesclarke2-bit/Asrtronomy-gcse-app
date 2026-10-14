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

  // The diagram's own metres-to-pixels scale, for a given place and date,
  // independent of the stick's actual height — see drawShadowDiagram's own
  // comment for why that independence is what makes the height slider
  // visibly change the picture. REFERENCE_HEIGHT_M is arbitrary (the
  // challenge diagram's own fixed stick height, conveniently); only the
  // cap's shape (a multiple of the reference noon shadow) matters.
  const REFERENCE_HEIGHT_M = 1;

  function scaleCapMetres(lat, lon, dayDate, solarNoonUT) {
    if (solarNoonUT == null) return REFERENCE_HEIGHT_M * 3;
    const noonSun = SolarPosition.getSunPosition(buildMinuteDate(dayDate, solarNoonUT), lat, lon);
    const refNoonLength = ShadowGeometry.shadowLengthM(REFERENCE_HEIGHT_M, noonSun.altitude);
    const noonLength = refNoonLength === null ? REFERENCE_HEIGHT_M : refNoonLength;
    return Math.max(noonLength * 5, REFERENCE_HEIGHT_M * 3);
  }

  // A "nice" round number of metres for the scale bar: the largest
  // candidate that still fits within maxBarPx at the diagram's current
  // scale, so the bar reads as a sensible distance (1 m, 2 m, 5 m, ...)
  // rather than an arbitrary fraction.
  const SCALE_BAR_CANDIDATES_M = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];

  function pickScaleBarMetres(scale, maxBarPx) {
    let chosen = SCALE_BAR_CANDIDATES_M[0];
    for (const m of SCALE_BAR_CANDIDATES_M) {
      if (m * scale <= maxBarPx) chosen = m;
      else break;
    }
    return chosen;
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

    // The display scale (metres -> pixels) is fixed from options.scaleCapM
    // — the shortest shadow a REFERENCE_HEIGHT_M stick would cast today,
    // not today's actual stick height — so the canvas's own scale never
    // moves when the height slider does. A cap keyed to the real height
    // would grow in lockstep with every plotted point's own length,
    // cancelling out exactly and leaving the picture frozen regardless of
    // height; this way, a taller stick's shadow is genuinely drawn longer
    // (house rule 2: a toggle must visibly change the diagram).
    const cap = options.scaleCapM;
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

    // "Find north and noon with equal shadows" construction, revealed one
    // piece at a time as options.equalShadowStep advances 1-5: the
    // morning mark (step 1), its afternoon mirror image (step 2), the
    // line joining them (step 3), and that line's perpendicular bisector
    // through the stick's base — step 4, exactly the true north-south
    // line, drawn here as the vertical line through the centre, since
    // north is always "up" in this frame. Step 5 adds no new drawing,
    // only the readout naming the midpoint as local noon.
    const step = options.equalShadowStep || 0;
    if (step >= 1 && options.currentTip && options.mirrorTip) {
      const p1 = toCanvas(options.currentTip);
      const p2 = toCanvas(options.mirrorTip);

      if (step >= 3) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = '#8e44ad';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      const marks = step >= 2 ? [p1, p2] : [p1];
      marks.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#8e44ad';
        ctx.fill();
      });

      if (step >= 4) {
        ctx.beginPath();
        ctx.moveTo(cx, 20);
        ctx.lineTo(cx, height - 20);
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = '#8e44ad';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Stick, drawn top-down as its own base marker: a real stick would be
    // just a point seen from directly above, so its height is shown the
    // way a map shows a proportional symbol — the marker's own radius
    // grows with height, at the same fixed scale as the shadow, so a 2 m
    // stick's marker is visibly bigger than a 0.2 m stick's.
    const stickRadius = 3 + options.heightM * scale * 0.06;
    ctx.beginPath();
    ctx.arc(cx, cy, stickRadius, 0, Math.PI * 2);
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

    // Scale bar: a "nice" round number of metres at the diagram's own
    // fixed scale, so a shadow's length can be read directly off the
    // picture, not just from the readout.
    const barMetres = pickScaleBarMetres(scale, 70);
    const barPx = barMetres * scale;
    const barX0 = 18;
    const barY = height - 22;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(barX0, barY);
    ctx.lineTo(barX0 + barPx, barY);
    ctx.moveTo(barX0, barY - 4);
    ctx.lineTo(barX0, barY + 4);
    ctx.moveTo(barX0 + barPx, barY - 4);
    ctx.lineTo(barX0 + barPx, barY + 4);
    ctx.stroke();
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${barMetres} m`, barX0, barY - 7);
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

  // --- "Find north and noon with equal shadows" step-through ---------

  const EQUAL_SHADOW_STEPS = [
    'Mark the tip of the shadow in the morning.',
    'Wait until the afternoon shadow is the same length, and mark that tip too.',
    'Join the two marks: that line runs east to west.',
    'The line at right angles through its middle runs north to south — at local noon, the shadow lies exactly along it.',
    'The time exactly halfway between the two marks is local noon.',
  ];
  let equalShadowStep = 1;
  const equalShadowStepIndicator = document.getElementById('equal-shadow-step-indicator');
  const equalShadowCaption = document.getElementById('equal-shadow-caption');
  const equalShadowPrev = document.getElementById('equal-shadow-prev');
  const equalShadowNext = document.getElementById('equal-shadow-next');
  const equalShadowTimes = document.getElementById('equal-shadow-times');

  function setEqualShadowStep(step) {
    equalShadowStep = Math.min(Math.max(step, 1), EQUAL_SHADOW_STEPS.length);
    equalShadowPrev.disabled = equalShadowStep === 1;
    equalShadowNext.disabled = equalShadowStep === EQUAL_SHADOW_STEPS.length;
    equalShadowStepIndicator.textContent = `Step ${equalShadowStep} of ${EQUAL_SHADOW_STEPS.length}`;
    equalShadowCaption.textContent = EQUAL_SHADOW_STEPS[equalShadowStep - 1];
    updateShadowSection();
  }

  equalShadowPrev.addEventListener('click', () => setEqualShadowStep(equalShadowStep - 1));
  equalShadowNext.addEventListener('click', () => setEqualShadowStep(equalShadowStep + 1));

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
      equalShadowStep,
      scaleCapM: scaleCapMetres(lat, lon, dayDate, trace.solarNoonUT),
    });

    if (mirrorTip && equalShadowStep >= 2) {
      const afternoonMinutes = 2 * trace.solarNoonUT - minutesUT;
      const midpoint = (minutesUT + afternoonMinutes) / 2;
      equalShadowTimes.textContent =
        `Morning mark: ${formatClock(minutesUT)} UT. Afternoon mark: ${formatClock(afternoonMinutes)} UT. ` +
        `Midpoint: ${formatClock(midpoint)} UT — local noon.`;
    } else {
      equalShadowTimes.textContent = '';
    }

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

  // --- Guided 4-step flow ---

  const LONGITUDE_STEP_COUNT = 4;
  let longitudeStep = 1;
  const longitudeStepIndicator = document.getElementById('longitude-step-indicator');
  const longitudeStepEls = [...document.querySelectorAll('[data-longitude-step]')];
  const longitudeStepPrev = document.getElementById('longitude-step-prev');
  const longitudeStepNext = document.getElementById('longitude-step-next');

  function setLongitudeStep(step) {
    longitudeStep = Math.min(Math.max(step, 1), LONGITUDE_STEP_COUNT);
    longitudeStepIndicator.textContent = `Step ${longitudeStep} of ${LONGITUDE_STEP_COUNT}`;
    longitudeStepPrev.disabled = longitudeStep === 1;
    longitudeStepNext.disabled = longitudeStep === LONGITUDE_STEP_COUNT;
    longitudeStepEls.forEach((el) => {
      el.hidden = Number(el.dataset.longitudeStep) !== longitudeStep;
    });
  }

  longitudeStepPrev.addEventListener('click', () => setLongitudeStep(longitudeStep - 1));
  longitudeStepNext.addEventListener('click', () => setLongitudeStep(longitudeStep + 1));

  document.querySelectorAll('.hint-button').forEach((button) => {
    const panel = document.querySelector(`.hint-panel[data-hint-step="${button.dataset.hintStep}"]`);
    button.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
    });
  });

  const workedExampleButton = document.getElementById('show-worked-example');
  const workedExamplePanel = document.getElementById('worked-example-panel');
  workedExampleButton.addEventListener('click', () => {
    workedExamplePanel.hidden = !workedExamplePanel.hidden;
    workedExampleButton.setAttribute('aria-expanded', String(!workedExamplePanel.hidden));
  });

  const longitudeAnswerReveal = document.getElementById('longitude-answer-reveal');
  document.getElementById('show-longitude-answer').addEventListener('click', () => {
    if (!challenge) return;
    longitudeAnswerReveal.textContent = `The hidden longitude is ${formatLongitude(challenge.lon)}.`;
  });

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
    longitudeAnswerReveal.textContent = '';
    workedExamplePanel.hidden = true;
    workedExampleButton.setAttribute('aria-expanded', 'false');
    document.querySelectorAll('.hint-panel').forEach((panel) => {
      panel.hidden = true;
    });
    setLongitudeStep(1);

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
      showNoonMarker: false,
      scaleCapM: scaleCapMetres(lat, lon, dayDate, trace.solarNoonUT),
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
  const bstToggle = document.getElementById('bst-toggle');
  const breakdownSvg = document.getElementById('offset-breakdown');
  const eotGraphCanvas = document.getElementById('shadows-eot-graph');
  const eotGraphCtx = eotGraphCanvas.getContext('2d');

  // The equation of time only depends on the date (not latitude or
  // longitude — see src/solarPosition.js), so precompute the whole
  // year once rather than recalculating on every slider tick. Same
  // values sims/equation-of-time.js's own graph plots.
  const EOT_BY_DAY = [];
  for (let day = 0; day < 365; day++) {
    EOT_BY_DAY.push(SolarPosition.getSunPosition(dayOfYearToUTCDate(YEAR, day), 0, 0).equationOfTime);
  }

  const EOT_MONTH_STARTS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const EOT_MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

  function drawEotGraph(selectedDay) {
    const width = eotGraphCanvas.width;
    const height = eotGraphCanvas.height;
    const marginLeft = 36;
    const marginRight = 10;
    const marginTop = 10;
    const marginBottom = 20;
    const plotWidth = width - marginLeft - marginRight;
    const plotHeight = height - marginTop - marginBottom;
    const minY = -16;
    const maxY = 18;

    const xForDay = (day) => marginLeft + (day / 364) * plotWidth;
    const yForValue = (value) => marginTop + (1 - (value - minY) / (maxY - minY)) * plotHeight;

    eotGraphCtx.clearRect(0, 0, width, height);

    eotGraphCtx.strokeStyle = '#e5e9ee';
    eotGraphCtx.fillStyle = '#8a97a5';
    eotGraphCtx.font = '10px sans-serif';
    eotGraphCtx.textAlign = 'right';
    eotGraphCtx.textBaseline = 'middle';
    for (let v = -15; v <= 15; v += 5) {
      const y = yForValue(v);
      eotGraphCtx.beginPath();
      eotGraphCtx.moveTo(marginLeft, y);
      eotGraphCtx.lineTo(width - marginRight, y);
      eotGraphCtx.stroke();
      eotGraphCtx.fillText(String(v), marginLeft - 6, y);
    }

    eotGraphCtx.strokeStyle = '#8a97a5';
    eotGraphCtx.lineWidth = 1.5;
    eotGraphCtx.beginPath();
    eotGraphCtx.moveTo(marginLeft, yForValue(0));
    eotGraphCtx.lineTo(width - marginRight, yForValue(0));
    eotGraphCtx.stroke();

    eotGraphCtx.textAlign = 'center';
    eotGraphCtx.textBaseline = 'top';
    EOT_MONTH_STARTS.forEach((day, i) => {
      eotGraphCtx.fillText(EOT_MONTH_LABELS[i], xForDay(day), height - marginBottom + 5);
    });

    eotGraphCtx.beginPath();
    EOT_BY_DAY.forEach((value, day) => {
      const x = xForDay(day);
      const y = yForValue(value);
      if (day === 0) eotGraphCtx.moveTo(x, y);
      else eotGraphCtx.lineTo(x, y);
    });
    eotGraphCtx.strokeStyle = '#f5a623';
    eotGraphCtx.lineWidth = 2;
    eotGraphCtx.stroke();

    const markerX = xForDay(selectedDay);
    const markerY = yForValue(EOT_BY_DAY[selectedDay]);
    eotGraphCtx.beginPath();
    eotGraphCtx.arc(markerX, markerY, 5, 0, Math.PI * 2);
    eotGraphCtx.fillStyle = '#8e44ad';
    eotGraphCtx.fill();
    eotGraphCtx.strokeStyle = '#5e2d73';
    eotGraphCtx.lineWidth = 1.5;
    eotGraphCtx.stroke();
  }

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

  function drawOffsetBreakdown(lon, eotMinutes, zone, bstOffsetMinutes) {
    const longitudeCorrection = 4 * lon;
    const timeZoneDifference = -60 * zone;
    // Clocks put forward (BST) make the clock read later, so this
    // contributes the same way as timeZoneDifference above: a positive
    // bstOffsetMinutes (the clock's own +1 hour) subtracts from
    // sundial-minus-clock.
    const dstDifference = -bstOffsetMinutes;
    const total = longitudeCorrection + eotMinutes + timeZoneDifference + dstDifference;
    const maxAbs =
      Math.max(Math.abs(longitudeCorrection), Math.abs(eotMinutes), Math.abs(timeZoneDifference), Math.abs(dstDifference), Math.abs(total), 20) +
      10;
    const left = 36;
    const right = 410;
    const xForValue = (v) => left + ((v + maxAbs) / (2 * maxAbs)) * (right - left);
    const zeroX = xForValue(0);
    const totalX = xForValue(total);

    const segments = [
      { name: 'Longitude correction', value: longitudeCorrection, color: '#2a6bd6' },
      { name: 'Equation of Time', value: eotMinutes, color: '#f5a623' },
      { name: 'Time zone', value: timeZoneDifference, color: '#2e8b57' },
      { name: 'Daylight saving (BST)', value: dstDifference, color: '#c0392b' },
    ];

    let bars = '';
    segments.forEach((seg, i) => {
      const x1 = xForValue(0);
      const x2 = xForValue(seg.value);
      const y = 16 + i * 16;
      bars += `<rect x="${Math.min(x1, x2)}" y="${y}" width="${Math.max(Math.abs(x2 - x1), 1)}" height="11" fill="${seg.color}"></rect>`;
    });

    // Legend: each segment (plus the total) named with its own signed
    // value and unit, so the chart is readable without the caption text.
    const legendRows = segments.concat([{ name: 'Total', value: total, color: '#8e44ad' }]);
    let legend = '';
    legendRows.forEach((row, i) => {
      const y = 110 + i * 18;
      const label = `${row.name} ${row.value >= 0 ? '+' : ''}${row.value.toFixed(1)} min`;
      legend +=
        `<rect x="${left}" y="${y - 9}" width="12" height="12" fill="${row.color}"></rect>` +
        `<text x="${left + 18}" y="${y}" font-size="12" fill="#333" dominant-baseline="middle">${label}</text>`;
    });

    breakdownSvg.innerHTML =
      `<line x1="${zeroX}" y1="10" x2="${zeroX}" y2="80" stroke="#8a97a5" stroke-width="1"></line>` +
      bars +
      `<line x1="${totalX}" y1="10" x2="${totalX}" y2="80" stroke="#8e44ad" stroke-width="2"></line>` +
      `<text x="${zeroX}" y="94" font-size="10" fill="#555" text-anchor="middle">0 min</text>` +
      legend;

    document.getElementById('offset-breakdown-caption').textContent =
      `Longitude correction ${longitudeCorrection >= 0 ? '+' : ''}${longitudeCorrection.toFixed(1)} min, ` +
      `equation of time ${eotMinutes >= 0 ? '+' : ''}${eotMinutes.toFixed(1)} min, ` +
      `time-zone difference ${timeZoneDifference >= 0 ? '+' : ''}${timeZoneDifference.toFixed(1)} min, ` +
      `daylight saving ${dstDifference >= 0 ? '+' : ''}${dstDifference.toFixed(1)} min ` +
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
    drawEotGraph(dayIndex);

    const zone = Math.round(lon / 15);
    const bstOffsetMinutes = bstToggle.checked ? 60 : 0;
    const timeValue = document.getElementById('sundial-time-value');
    if (clockTimeToggle.checked) {
      const zoneTimeMinutes = ShadowGeometry.clockTimeMinutes(minutesUT, lon, bstOffsetMinutes);
      const zoneName = zone === 0 ? 'GMT' : `GMT${zone > 0 ? '+' : '−'}${Math.abs(zone)}`;
      const dstSuffix = bstOffsetMinutes ? ' + BST' : '';
      timeValue.textContent = `Clock (zone) time: ${formatClock(zoneTimeMinutes)} (${zoneName}${dstSuffix})`;
    } else {
      timeValue.textContent = `Sundial reading (apparent solar time): ${formatClock(apparentMinutes)}`;
    }

    drawOffsetBreakdown(lon, sun.equationOfTime, zone, bstOffsetMinutes);
  }

  // --- Wiring, coverage and quiz --------------------------------------

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  [dateSlider, latSlider, lonSlider, timeSlider, heightSlider].forEach((el) => el.addEventListener('input', updateShadowSection));
  challengeTimeSlider.addEventListener('input', updateChallengeSection);
  document.getElementById('new-challenge-button').addEventListener('click', newChallenge);
  document.getElementById('check-longitude').addEventListener('click', checkLongitudeGuess);
  clockTimeToggle.addEventListener('change', updateSundialSection);
  bstToggle.addEventListener('change', updateSundialSection);

  setEqualShadowStep(1);
  newChallenge();
  renderCoverage();

  QuizUI.mount(ShadowsAndSundialsQuestions.makeQuestions(ShadowGeometry, SolarPosition));
})();
