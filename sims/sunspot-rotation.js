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
  const playButton = document.getElementById('play-button');
  const discCanvas = document.getElementById('sun-disc');
  const discCtx = discCanvas.getContext('2d');

  const latitudeSelect = document.getElementById('latitude-select');
  const recordButton = document.getElementById('record-button');
  const clearButton = document.getElementById('clear-button');
  const recordFeedback = document.getElementById('record-feedback');
  const readingsTbody = document.getElementById('readings-tbody');
  const plotCanvas = document.getElementById('sunspot-plot');
  const plotCtx = plotCanvas.getContext('2d');
  const limbToLimbReadout = document.getElementById('limb-to-limb-readout');
  const stretchEstimateReadout = document.getElementById('stretch-estimate-readout');

  // readings[latitude] = [{ day, x }, ...], kept separately per latitude
  // so switching the select doesn't lose a student's earlier work.
  const readings = { 0: [], 30: [], 60: [] };

  function currentLatitude() {
    return Number(latitudeSelect.value);
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

  function render() {
    const day = Number(daySlider.value);
    dayLabel.textContent = `${day.toFixed(1)}`;
    drawSunDisc(day);
  }

  // --- Recording a sunspot's position ---------------------------------------

  function renderReadingsTable() {
    const rows = readings[currentLatitude()];
    readingsTbody.innerHTML = '';
    rows.forEach(({ day, x }) => {
      const tr = document.createElement('tr');
      const dayTd = document.createElement('td');
      dayTd.textContent = day.toFixed(1);
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

    const rows = readings[currentLatitude()];
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

  function renderStretchEstimate() {
    const rows = readings[currentLatitude()];
    if (rows.length < 2) {
      stretchEstimateReadout.textContent = 'Record at least two readings to see an estimate here.';
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
      `From your day-${first.day.toFixed(1)} and day-${last.day.toFixed(1)} readings: an estimated period of about ${Math.abs(estimate).toFixed(1)} days.`;
  }

  function renderLimbToLimbReadout() {
    const lat = currentLatitude();
    const synodic = SunRotation.synodicPeriodDays(SunRotation.siderealPeriodDays(lat));
    const halfSynodic = synodic / 2;
    limbToLimbReadout.textContent =
      `At latitude ${lat}°, this spot crosses from limb to limb in about ${halfSynodic.toFixed(1)} days — doubling that gives an estimated period of about ${synodic.toFixed(1)} days.`;
  }

  function renderRecording() {
    renderReadingsTable();
    renderPlot();
    renderStretchEstimate();
    renderLimbToLimbReadout();
  }

  recordButton.addEventListener('click', () => {
    const lat = currentLatitude();
    const day = Number(daySlider.value);
    const lon = apparentLongitude(lat, day);
    if (!SunRotation.isOnVisibleDisc(lon)) {
      recordFeedback.textContent = `This spot isn't on the visible disc on day ${day.toFixed(1)} — move the day slider to a day when it's still visible.`;
      return;
    }
    const x = SunRotation.spotXPosition(lat, lon, DISC_R);
    readings[lat].push({ day, x });
    readings[lat].sort((a, b) => a.day - b.day);
    recordFeedback.textContent = `Recorded day ${day.toFixed(1)}, x = ${x.toFixed(1)}.`;
    renderRecording();
  });

  clearButton.addEventListener('click', () => {
    readings[currentLatitude()] = [];
    recordFeedback.textContent = '';
    renderRecording();
  });

  latitudeSelect.addEventListener('change', renderRecording);

  // --- Animation: advance the day slider automatically, looping back to
  // the start. See sims/sidereal-vs-synodic.js for the same pattern.
  let animationFrameId = null;
  let lastFrameTime = null;
  const DAYS_PER_SECOND = 1.2;

  function stopAnimation() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    lastFrameTime = null;
    playButton.textContent = '▶ Play';
    playButton.setAttribute('aria-pressed', 'false');
  }

  function startAnimation() {
    playButton.textContent = '❚❚ Pause';
    playButton.setAttribute('aria-pressed', 'true');
    function step(now) {
      const dt = AnimationTiming.cappedElapsedSeconds(now, lastFrameTime);
      lastFrameTime = now;
      let next = Number(daySlider.value) + dt * DAYS_PER_SECOND;
      if (next > MAX_DAYS) next = 0;
      daySlider.value = next;
      render();
      animationFrameId = requestAnimationFrame(step);
    }
    animationFrameId = requestAnimationFrame(step);
  }

  playButton.addEventListener('click', () => {
    if (animationFrameId !== null) stopAnimation();
    else startAnimation();
  });

  daySlider.addEventListener('input', () => {
    stopAnimation();
    render();
  });

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  render();
  renderRecording();
  renderCoverage();
  QuizUI.mount(SunspotRotationQuestions.makeQuestions(SunRotation));
})();
