(function () {
  const CURRICULUM_UNITS = ['u2.5'];

  const MAX_DAYS = 20;
  const DISC_R = 160;
  const DISC_CX = 200;
  const DISC_CY = 200;
  const RECORD_14_COUNT = 14;

  // One marker shape per latitude, on top of its own colour — never
  // colour alone (see styles.css's .spot-marker-0/30/60, drawn with the
  // same shapes) — plus the table-column/estimate key each uses.
  const SPOTS = [
    { lat: 0, color: '#c0392b', shape: 'circle', key: 'x0', label: '0°' },
    { lat: 30, color: '#2a6bd6', shape: 'square', key: 'x30', label: '30°' },
    { lat: 60, color: '#173d75', shape: 'triangle', key: 'x60', label: '60°' },
  ];
  // Every spot starts at the east limb (longitude -90°) at day 0, so
  // watching them cross together makes differential rotation visible:
  // the equatorial spot visibly overtakes the higher-latitude ones.
  const START_LONGITUDE_DEG = -90;

  const daySlider = document.getElementById('day-slider');
  const dayLabel = document.getElementById('day-label');
  const prevDayButton = document.getElementById('prev-day-button');
  const nextDayButton = document.getElementById('next-day-button');
  const dayStatusNote = document.getElementById('day-status-note');
  const playButton = document.getElementById('play-button');
  const discCanvas = document.getElementById('sun-disc');
  const discCtx = discCanvas.getContext('2d');

  const recordNextButton = document.getElementById('record-next-button');
  const record14Button = document.getElementById('record-14-button');
  const undoButton = document.getElementById('undo-button');
  const clearButton = document.getElementById('clear-button');
  const recordFeedback = document.getElementById('record-feedback');
  const readingsTbody = document.getElementById('readings-tbody');
  const plotCanvas = document.getElementById('sunspot-plot');
  const plotCtx = plotCanvas.getContext('2d');
  const revealButton = document.getElementById('reveal-button');
  const truePeriodRow = document.getElementById('true-period-row');

  // Every recorded row, in the order they were clicked (not sorted) —
  // so Undo always removes exactly the last thing the student did, and
  // can restore the day control to it. { day, x0, x30, x60 }, each x
  // either a number or null (that spot was behind the limb that day).
  let rows = [];
  let revealed = false;

  function apparentLongitude(latDeg, day) {
    return SunRotation.apparentLongitudeAtDay(latDeg, START_LONGITUDE_DEG, day);
  }

  function xForSpotOnDay(latDeg, day) {
    const lon = apparentLongitude(latDeg, day);
    return SunRotation.isOnVisibleDisc(lon) ? SunRotation.spotXPosition(latDeg, lon, DISC_R) : null;
  }

  // This spot's own recorded (day, x) pairs — only where it was
  // actually visible — sorted by day, regardless of the order rows
  // were clicked in.
  function spotPoints(latDeg) {
    const key = 'x' + latDeg;
    return rows
      .filter((r) => r[key] !== null)
      .map((r) => ({ day: r.day, x: r[key] }))
      .sort((a, b) => a.day - b.day);
  }

  // --- Shared marker drawing: the disc and the plot both draw every
  // spot as its own colour + shape, never colour alone. ---------------

  function drawMarker(ctx, x, y, r, shape, fillColor, strokeColor) {
    ctx.beginPath();
    if (shape === 'circle') {
      ctx.arc(x, y, r, 0, Math.PI * 2);
    } else if (shape === 'square') {
      ctx.rect(x - r, y - r, r * 2, r * 2);
    } else {
      // triangle, apex up
      ctx.moveTo(x, y - r * 1.15);
      ctx.lineTo(x - r, y + r * 0.85);
      ctx.lineTo(x + r, y + r * 0.85);
      ctx.closePath();
    }
    ctx.fillStyle = fillColor;
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // --- The Sun's disc, with three spots crossing it ------------------------

  function drawSunDisc(day) {
    discCtx.clearRect(0, 0, discCanvas.width, discCanvas.height);

    const gradient = discCtx.createRadialGradient(DISC_CX - 40, DISC_CY - 40, 10, DISC_CX, DISC_CY, DISC_R);
    gradient.addColorStop(0, '#ffe3a0');
    gradient.addColorStop(1, '#f5a623');
    discCtx.beginPath();
    discCtx.arc(DISC_CX, DISC_CY, DISC_R, 0, Math.PI * 2);
    discCtx.fillStyle = gradient;
    discCtx.fill();
    discCtx.strokeStyle = '#c97f1e';
    discCtx.lineWidth = 2;
    discCtx.stroke();

    // Central meridian: the line facing Earth directly.
    discCtx.strokeStyle = '#8a97a5';
    discCtx.lineWidth = 1;
    discCtx.setLineDash([4, 3]);
    discCtx.beginPath();
    discCtx.moveTo(DISC_CX, DISC_CY - DISC_R);
    discCtx.lineTo(DISC_CX, DISC_CY + DISC_R);
    discCtx.stroke();
    discCtx.setLineDash([]);

    SPOTS.forEach((spot) => {
      const lon = apparentLongitude(spot.lat, day);
      if (!SunRotation.isOnVisibleDisc(lon)) return;
      const x = DISC_CX + SunRotation.spotXPosition(spot.lat, lon, DISC_R);
      const y = DISC_CY - SunRotation.spotYPosition(spot.lat, DISC_R);
      drawMarker(discCtx, x, y, 7, spot.shape, spot.color, '#fff');
    });
  }

  // Everything that depends on "which day are we looking at right
  // now": redraws the disc, the day readout, the Previous/Next day
  // buttons' disabled state, and a live note on which of the three
  // spots are actually visible today (the disc already shows this
  // visually — a spot just isn't drawn — but it's stated for anyone
  // not reading the picture).
  function updateDayDependentUI() {
    const day = Number(daySlider.value);
    dayLabel.textContent = String(day);
    drawSunDisc(day);

    const statuses = SPOTS.map((spot) => {
      const visible = SunRotation.isOnVisibleDisc(apparentLongitude(spot.lat, day));
      return `${spot.label} ${visible ? 'visible' : 'hidden'}`;
    });
    dayStatusNote.textContent = `Day ${day}: ${statuses.join(', ')}.`;

    prevDayButton.disabled = day <= 0;
    nextDayButton.disabled = day >= MAX_DAYS;
  }

  function setDay(day) {
    daySlider.value = Math.max(0, Math.min(MAX_DAYS, day));
    updateDayDependentUI();
  }

  // --- Recording all three spots at once ------------------------------------

  function renderReadingsTable() {
    readingsTbody.innerHTML = '';
    rows.forEach((row) => {
      const tr = document.createElement('tr');
      const dayTd = document.createElement('td');
      dayTd.textContent = String(row.day);
      tr.appendChild(dayTd);
      SPOTS.forEach((spot) => {
        const td = document.createElement('td');
        const x = row[spot.key];
        if (x === null) {
          td.textContent = 'hidden';
          td.className = 'hidden-cell';
        } else {
          td.textContent = x.toFixed(1);
        }
        tr.appendChild(td);
      });
      readingsTbody.appendChild(tr);
    });
  }

  function renderPlot() {
    const width = plotCanvas.width;
    const height = plotCanvas.height;
    const marginLeft = 58;
    const marginRight = 46;
    const marginTop = 15;
    const marginBottom = 40;
    const plotWidth = width - marginLeft - marginRight;
    const plotHeight = height - marginTop - marginBottom;

    plotCtx.clearRect(0, 0, width, height);

    const xForDay = (day) => marginLeft + (day / MAX_DAYS) * plotWidth;
    const yForX = (x) => marginTop + (1 - (x + DISC_R) / (2 * DISC_R)) * plotHeight;

    // Gridlines, y-axis labelled as a fraction of the solar radius —
    // the x position itself has no physical scale here (the disc is a
    // schematic radius, not kilometres), but "how far across the disc"
    // does, and reads the same way real observers quote a sunspot's
    // position.
    plotCtx.strokeStyle = '#e5e9ee';
    plotCtx.fillStyle = '#8a97a5';
    plotCtx.font = '11px sans-serif';
    plotCtx.textAlign = 'right';
    plotCtx.textBaseline = 'middle';
    [-1, -0.5, 0, 0.5, 1].forEach((frac) => {
      const y = yForX(frac * DISC_R);
      plotCtx.beginPath();
      plotCtx.moveTo(marginLeft, y);
      plotCtx.lineTo(width - marginRight, y);
      plotCtx.stroke();
      plotCtx.fillText(frac.toFixed(1), marginLeft - 8, y);
    });
    plotCtx.strokeStyle = '#b8c2cc';
    plotCtx.lineWidth = 1.5;
    plotCtx.beginPath();
    plotCtx.moveTo(marginLeft, yForX(0));
    plotCtx.lineTo(width - marginRight, yForX(0));
    plotCtx.stroke();
    plotCtx.lineWidth = 1;

    plotCtx.textAlign = 'center';
    plotCtx.textBaseline = 'top';
    for (let day = 0; day <= MAX_DAYS; day += 5) {
      plotCtx.fillText(String(day), xForDay(day), height - marginBottom + 6);
    }

    plotCtx.fillStyle = '#555';
    plotCtx.font = '11px sans-serif';
    plotCtx.textAlign = 'center';
    plotCtx.textBaseline = 'top';
    plotCtx.fillText('Day (since day 0)', width / 2, height - marginBottom + 20);
    plotCtx.save();
    plotCtx.translate(16, height / 2);
    plotCtx.rotate(-Math.PI / 2);
    plotCtx.textBaseline = 'bottom';
    plotCtx.fillText('x position (fraction of solar radius)', 0, 0);
    plotCtx.restore();

    // One coloured, shaped series per spot, connected in day order, so
    // the slope itself — not just the scattered points — shows the
    // equatorial spot crossing fastest and the 60° spot slowest.
    SPOTS.forEach((spot) => {
      const points = spotPoints(spot.lat);
      if (points.length === 0) return;

      plotCtx.strokeStyle = spot.color;
      plotCtx.lineWidth = 2;
      plotCtx.beginPath();
      points.forEach((p, i) => {
        const px = xForDay(p.day);
        const py = yForX(p.x);
        if (i === 0) plotCtx.moveTo(px, py);
        else plotCtx.lineTo(px, py);
      });
      plotCtx.stroke();

      points.forEach((p) => {
        drawMarker(plotCtx, xForDay(p.day), yForX(p.x), 4.5, spot.shape, spot.color, '#fff');
      });

      // Labelled directly on the plot, by its own last point, rather
      // than only in a separate legend.
      const last = points[points.length - 1];
      plotCtx.fillStyle = spot.color;
      plotCtx.font = '600 12px sans-serif';
      plotCtx.textAlign = 'left';
      plotCtx.textBaseline = 'middle';
      plotCtx.fillText(spot.label, xForDay(last.day) + 8, yForX(last.x));
    });
  }

  // How many more readings (and on how many different days) this
  // spot's own estimates still need — null once there's enough.
  function estimateGateMessage(points) {
    if (points.length < 2) {
      const more = 2 - points.length;
      return `Need ${more} more reading${more === 1 ? '' : 's'}`;
    }
    const distinctDays = new Set(points.map((p) => p.day)).size;
    if (distinctDays < 2) return 'Need readings on 2 different days';
    return null;
  }

  // Method 2, the two-reading "stretch": the angle moved between the
  // earliest and latest recorded reading, scaled up to a full rotation.
  function stretchEstimateDays(latDeg, points) {
    const first = points[0];
    const last = points[points.length - 1];
    return SunRotation.periodFromTwoReadings(latDeg, first.day, first.x, last.day, last.x, DISC_R);
  }

  // Method 1, limb-to-limb doubling: fits the same earliest/latest
  // readings to a straight line of longitude against day (the model's
  // own longitude-vs-day relationship truly is linear, so any two
  // readings fix it exactly), then interpolates the day that line
  // crosses each limb (±90°) and doubles the gap between them.
  function limbToLimbEstimateDays(latDeg, points) {
    const first = points[0];
    const last = points[points.length - 1];
    const lon1 = SunRotation.longitudeFromXPosition(latDeg, first.x, DISC_R);
    const lon2 = SunRotation.longitudeFromXPosition(latDeg, last.x, DISC_R);
    const rate = (lon2 - lon1) / (last.day - first.day); // degrees per day
    if (rate === 0) return null;
    const dayAtEastLimb = first.day + (-90 - lon1) / rate;
    const dayAtWestLimb = first.day + (90 - lon1) / rate;
    return SunRotation.synodicPeriodFromLimbToLimbDays(Math.abs(dayAtWestLimb - dayAtEastLimb));
  }

  function renderEstimatesTable() {
    SPOTS.forEach((spot) => {
      const points = spotPoints(spot.lat);
      const gate = estimateGateMessage(points);
      const limbCell = document.getElementById(`limb-estimate-${spot.lat}`);
      const stretchCell = document.getElementById(`stretch-estimate-${spot.lat}`);

      if (gate) {
        limbCell.textContent = gate;
        limbCell.className = 'estimate-pending';
        stretchCell.textContent = gate;
        stretchCell.className = 'estimate-pending';
      } else {
        const limb = limbToLimbEstimateDays(spot.lat, points);
        const stretch = stretchEstimateDays(spot.lat, points);
        limbCell.textContent = limb === null ? 'Need more spread-out readings' : `${Math.abs(limb).toFixed(1)} days`;
        limbCell.className = '';
        stretchCell.textContent = `${Math.abs(stretch).toFixed(1)} days`;
        stretchCell.className = '';
      }

      if (revealed) {
        const truePeriod = SunRotation.synodicPeriodDays(SunRotation.siderealPeriodDays(spot.lat));
        document.getElementById(`true-period-${spot.lat}`).textContent = `${truePeriod.toFixed(1)} days`;
      }
    });
  }

  function updateReadingButtonsDisabled() {
    const hasRows = rows.length > 0;
    undoButton.disabled = !hasRows;
    clearButton.disabled = !hasRows;
  }

  function renderRecording() {
    renderReadingsTable();
    renderPlot();
    renderEstimatesTable();
    updateReadingButtonsDisabled();
  }

  // Records every spot's x position for the current day (or "hidden"
  // if it's behind the limb), adds one row, then moves on a day — so a
  // run of readings really is just clicking the same button again.
  function recordCurrentDay() {
    const day = Number(daySlider.value);
    const row = { day };
    SPOTS.forEach((spot) => {
      row[spot.key] = xForSpotOnDay(spot.lat, day);
    });
    rows.push(row);
    const visibleCount = SPOTS.filter((spot) => row[spot.key] !== null).length;
    recordFeedback.textContent = `Recorded day ${day} (${visibleCount} of 3 spots visible).`;
    renderRecording();
    setDay(day + 1);
  }

  recordNextButton.addEventListener('click', recordCurrentDay);

  record14Button.addEventListener('click', () => {
    for (let i = 0; i < RECORD_14_COUNT; i += 1) recordCurrentDay();
    recordFeedback.textContent = `Recorded ${RECORD_14_COUNT} days.`;
  });

  undoButton.addEventListener('click', () => {
    if (rows.length === 0) return;
    const removed = rows.pop();
    recordFeedback.textContent = 'Removed your last row.';
    renderRecording();
    setDay(removed.day);
  });

  clearButton.addEventListener('click', () => {
    rows = [];
    recordFeedback.textContent = 'Cleared your readings.';
    renderRecording();
  });

  revealButton.addEventListener('click', () => {
    revealed = !revealed;
    truePeriodRow.hidden = !revealed;
    revealButton.textContent = revealed ? 'Hide true period' : 'Reveal true period';
    revealButton.setAttribute('aria-pressed', String(revealed));
    renderEstimatesTable();
  });

  prevDayButton.addEventListener('click', () => {
    stopAnimation();
    setDay(Number(daySlider.value) - 1);
  });

  nextDayButton.addEventListener('click', () => {
    stopAnimation();
    setDay(Number(daySlider.value) + 1);
  });

  daySlider.addEventListener('input', () => {
    stopAnimation();
    updateDayDependentUI();
  });

  // --- Animation: step the day on automatically, one whole day at a
  // time (the day control is a whole-day grid — see CLAUDE.md rule 12
  // — so this ticks on an interval rather than a smooth per-frame
  // delta), looping back to the start.
  let playIntervalId = null;
  const PLAY_TICK_MS = 450;

  function stopAnimation() {
    if (playIntervalId !== null) {
      clearInterval(playIntervalId);
      playIntervalId = null;
    }
    playButton.textContent = '▶ Play';
    playButton.setAttribute('aria-pressed', 'false');
  }

  function startAnimation() {
    playButton.textContent = '❚❚ Pause';
    playButton.setAttribute('aria-pressed', 'true');
    playIntervalId = setInterval(() => {
      const day = Number(daySlider.value);
      setDay(day >= MAX_DAYS ? 0 : day + 1);
    }, PLAY_TICK_MS);
  }

  playButton.addEventListener('click', () => {
    if (playIntervalId !== null) stopAnimation();
    else startAnimation();
  });

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  updateDayDependentUI();
  renderRecording();
  renderCoverage();
  QuizUI.mount(SunspotRotationQuestions.makeQuestions(SunRotation));
})();
