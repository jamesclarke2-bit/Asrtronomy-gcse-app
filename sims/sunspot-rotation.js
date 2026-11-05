(function () {
  const CURRICULUM_UNITS = ['u2.5'];

  const MAX_DAYS = 20;
  const DISC_R = 160;
  const DISC_CX = 200;
  const DISC_CY = 200;

  const SPOTS = [
    { lat: 0, color: '#c0392b' },
    { lat: 30, color: '#2a6bd6' },
    { lat: 60, color: '#173d75' },
  ];
  // Every spot starts at the east limb (longitude -90°) at day 0, so
  // watching them cross together makes differential rotation visible:
  // the equatorial spot visibly overtakes the higher-latitude ones.
  const START_LONGITUDE_DEG = -90;

  const daySlider = document.getElementById('day-slider');
  const dayLabel = document.getElementById('day-label');
  const prevDayButton = document.getElementById('prev-day-button');
  const nextDayButton = document.getElementById('next-day-button');
  const dayVisibilityNote = document.getElementById('day-visibility-note');
  const playButton = document.getElementById('play-button');
  const discCanvas = document.getElementById('sun-disc');
  const discCtx = discCanvas.getContext('2d');

  const latitudeSelect = document.getElementById('latitude-select');
  const recordButton = document.getElementById('record-button');
  const undoButton = document.getElementById('undo-button');
  const clearButton = document.getElementById('clear-button');
  const recordFeedback = document.getElementById('record-feedback');
  const readingsTbody = document.getElementById('readings-tbody');
  const plotCanvas = document.getElementById('sunspot-plot');
  const plotCtx = plotCanvas.getContext('2d');
  const limbToLimbReadout = document.getElementById('limb-to-limb-readout');
  const stretchEstimateReadout = document.getElementById('stretch-estimate-readout');

  // readings[latitude] = [{ day, x }, ...] in the order they were
  // recorded (not sorted by day), kept separately per latitude so
  // switching the select doesn't lose a student's earlier work. Kept in
  // recording order — not sorted — so "undo" can always remove exactly
  // the last thing the student did; render functions sort a copy for
  // display instead (see sortedReadings).
  const readings = { 0: [], 30: [], 60: [] };

  function currentLatitude() {
    return Number(latitudeSelect.value);
  }

  function sortedReadings(latDeg) {
    return readings[latDeg].slice().sort((a, b) => a.day - b.day);
  }

  function apparentLongitude(latDeg, day) {
    return SunRotation.apparentLongitudeAtDay(latDeg, START_LONGITUDE_DEG, day);
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
      discCtx.beginPath();
      discCtx.arc(x, y, 7, 0, Math.PI * 2);
      discCtx.fillStyle = spot.color;
      discCtx.fill();
      discCtx.strokeStyle = '#fff';
      discCtx.lineWidth = 1.5;
      discCtx.stroke();
    });
  }

  // Everything that depends on "which day, at which latitude, are we
  // looking at right now": redraws the disc, updates the day readout and
  // the Previous/Next day buttons' disabled state, and lets the student
  // know up front (rather than only after clicking Record) whether
  // today's spot is even on the visible disc to record.
  function updateDayDependentUI() {
    const day = Number(daySlider.value);
    dayLabel.textContent = String(day);
    drawSunDisc(day);

    const lat = currentLatitude();
    const visible = SunRotation.isOnVisibleDisc(apparentLongitude(lat, day));
    recordButton.disabled = !visible;
    dayVisibilityNote.textContent = visible
      ? ''
      : `This spot isn't on the visible disc on day ${day} — it's beyond the limb. Move to a different day to record it.`;

    prevDayButton.disabled = day <= 0;
    nextDayButton.disabled = day >= MAX_DAYS;
  }

  function setDay(day) {
    daySlider.value = Math.max(0, Math.min(MAX_DAYS, day));
    updateDayDependentUI();
  }

  // --- Recording a sunspot's position ---------------------------------------

  function renderReadingsTable() {
    const rows = sortedReadings(currentLatitude());
    readingsTbody.innerHTML = '';
    rows.forEach(({ day, x }) => {
      const tr = document.createElement('tr');
      const dayTd = document.createElement('td');
      dayTd.textContent = String(day);
      const xTd = document.createElement('td');
      xTd.textContent = x.toFixed(1);
      tr.appendChild(dayTd);
      tr.appendChild(xTd);
      readingsTbody.appendChild(tr);
    });
  }

  function renderPlot() {
    const width = plotCanvas.width;
    const height = plotCanvas.height;
    const marginLeft = 50;
    const marginRight = 15;
    const marginTop = 15;
    const marginBottom = 30;
    const plotWidth = width - marginLeft - marginRight;
    const plotHeight = height - marginTop - marginBottom;

    plotCtx.clearRect(0, 0, width, height);

    const xForDay = (day) => marginLeft + (day / MAX_DAYS) * plotWidth;
    const yForX = (x) => marginTop + (1 - (x + DISC_R) / (2 * DISC_R)) * plotHeight;

    plotCtx.strokeStyle = '#e5e9ee';
    plotCtx.fillStyle = '#8a97a5';
    plotCtx.font = '11px sans-serif';
    plotCtx.textAlign = 'right';
    plotCtx.textBaseline = 'middle';
    [-DISC_R, -DISC_R / 2, 0, DISC_R / 2, DISC_R].forEach((xVal) => {
      const y = yForX(xVal);
      plotCtx.beginPath();
      plotCtx.moveTo(marginLeft, y);
      plotCtx.lineTo(width - marginRight, y);
      plotCtx.stroke();
      plotCtx.fillText(xVal.toFixed(0), marginLeft - 8, y);
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

    const rows = sortedReadings(currentLatitude());
    const color = SPOTS.find((s) => s.lat === currentLatitude()).color;
    rows.forEach(({ day, x }) => {
      plotCtx.beginPath();
      plotCtx.arc(xForDay(day), yForX(x), 4, 0, Math.PI * 2);
      plotCtx.fillStyle = color;
      plotCtx.fill();
    });

    plotCtx.fillStyle = '#555';
    plotCtx.font = '11px sans-serif';
    plotCtx.textAlign = 'center';
    plotCtx.textBaseline = 'top';
    plotCtx.fillText('Day', width / 2, height - marginBottom + 18);
    plotCtx.save();
    plotCtx.translate(14, height / 2);
    plotCtx.rotate(-Math.PI / 2);
    plotCtx.textBaseline = 'bottom';
    plotCtx.fillText('x position', 0, 0);
    plotCtx.restore();
  }

  // Method 2, the two-reading "stretch": needs two readings on different
  // days (any two — the earliest and latest recorded, by day) to recover
  // the angle moved and scale it up to a full rotation.
  function renderStretchEstimate() {
    const rows = sortedReadings(currentLatitude());
    if (rows.length < 2) {
      stretchEstimateReadout.textContent = `Record at least two readings, on different days, to see an estimate here (you have ${rows.length} so far).`;
      return;
    }
    const first = rows[0];
    const last = rows[rows.length - 1];
    if (first.day === last.day) {
      stretchEstimateReadout.textContent = 'Record readings on two different days to see an estimate here.';
      return;
    }
    const estimate = SunRotation.periodFromTwoReadings(currentLatitude(), first.day, first.x, last.day, last.x, DISC_R);
    stretchEstimateReadout.textContent =
      `From your day-${first.day} and day-${last.day} readings: an estimated period of about ${Math.abs(estimate).toFixed(1)} days.`;
  }

  // Method 1, limb-to-limb doubling: unlocked once the student has
  // recorded at least one reading of this spot — a plain gate, since the
  // model is deterministic (no measurement noise), so the limb-to-limb
  // day count it reports is the same whichever reading unlocked it.
  function renderLimbToLimbReadout() {
    const lat = currentLatitude();
    if (readings[lat].length === 0) {
      limbToLimbReadout.textContent = 'Record at least one reading to see this estimate.';
      return;
    }
    const synodic = SunRotation.synodicPeriodDays(SunRotation.siderealPeriodDays(lat));
    const halfSynodic = synodic / 2;
    const doubled = SunRotation.synodicPeriodFromLimbToLimbDays(halfSynodic);
    limbToLimbReadout.textContent =
      `Based on your own readings so far, this spot crosses from limb to limb in about ${halfSynodic.toFixed(1)} days — doubling that gives an estimated period of about ${doubled.toFixed(1)} days.`;
  }

  function updateReadingButtonsDisabled() {
    const hasReadings = readings[currentLatitude()].length > 0;
    undoButton.disabled = !hasReadings;
    clearButton.disabled = !hasReadings;
  }

  function renderRecording() {
    renderReadingsTable();
    renderPlot();
    renderStretchEstimate();
    renderLimbToLimbReadout();
    updateReadingButtonsDisabled();
  }

  recordButton.addEventListener('click', () => {
    const lat = currentLatitude();
    const day = Number(daySlider.value);
    const lon = apparentLongitude(lat, day);
    if (!SunRotation.isOnVisibleDisc(lon)) {
      recordFeedback.textContent = `This spot isn't on the visible disc on day ${day} — move the day control to a day when it's still visible.`;
      return;
    }
    const x = SunRotation.spotXPosition(lat, lon, DISC_R);
    readings[lat].push({ day, x });
    recordFeedback.textContent = `Recorded day ${day}, x = ${x.toFixed(1)}.`;
    renderRecording();
    setDay(day + 1); // move on automatically, so recording a run of days is just repeated clicks
  });

  undoButton.addEventListener('click', () => {
    const lat = currentLatitude();
    if (readings[lat].length === 0) return;
    readings[lat].pop();
    recordFeedback.textContent = 'Removed your last reading.';
    renderRecording();
  });

  clearButton.addEventListener('click', () => {
    readings[currentLatitude()] = [];
    recordFeedback.textContent = 'Cleared your readings for this spot.';
    renderRecording();
  });

  latitudeSelect.addEventListener('change', () => {
    updateDayDependentUI();
    renderRecording();
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
  // time (the day control is now a whole-day grid — see CLAUDE.md rule
  // 12 — so this ticks on an interval rather than a smooth per-frame
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
