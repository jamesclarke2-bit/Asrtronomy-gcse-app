(function () {
  const YEAR = 2026;
  const SIDEREAL_RATE = 1.0027379093; // sidereal hours per solar hour
  const CURRICULUM_UNITS = ['u1.7', 'u1.8', 'u1.9', 'u1.10', 'u1.11', 'u1.12', 'u1.13', 'u1.14'];

  const STAR_PRESETS = [
    { name: 'Polaris (Ursa Minor)', ra: 2.53, dec: 89.26 },
    { name: 'Dubhe (Ursa Major)', ra: 11.06, dec: 61.75 },
    { name: 'Schedar (Cassiopeia)', ra: 0.68, dec: 56.54 },
    { name: 'Betelgeuse (Orion)', ra: 5.92, dec: 7.41 },
    { name: 'Sirius (Canis Major)', ra: 6.75, dec: -16.72 },
    { name: 'Vega (Lyra)', ra: 18.62, dec: 38.78 },
    { name: 'Aldebaran (Taurus)', ra: 4.6, dec: 16.51 },
    { name: 'Acrux (Crux)', ra: 12.44, dec: -63.1 },
  ];

  const raSlider = document.getElementById('ra-slider');
  const decSlider = document.getElementById('dec-slider');
  const latSlider = document.getElementById('lat-slider');
  const lonSlider = document.getElementById('lon-slider');
  const dateSlider = document.getElementById('date-slider');
  const timeSlider = document.getElementById('time-slider');
  const starSelect = document.getElementById('star-select');

  const raLabel = document.getElementById('ra-label');
  const decLabel = document.getElementById('dec-label');
  const latLabel = document.getElementById('lat-label');
  const lonLabel = document.getElementById('lon-label');
  const dateLabel = document.getElementById('date-label');
  const timeLabel = document.getElementById('time-label');

  const lstValue = document.getElementById('lst-value');
  const haValue = document.getElementById('ha-value');
  const altitudeValue = document.getElementById('altitude-value');
  const azimuthValue = document.getElementById('azimuth-value');
  const polarDistanceValue = document.getElementById('polar-distance-value');
  const haExplainer = document.getElementById('ha-explainer');
  const circumpolarIndicator = document.getElementById('circumpolar-indicator');

  const skyCanvas = document.getElementById('star-sky');
  const skyCtx = skyCanvas.getContext('2d');
  const diurnalCanvas = document.getElementById('diurnal-graph');
  const diurnalCtx = diurnalCanvas.getContext('2d');

  const polarisAltitudeSlider = document.getElementById('polaris-altitude-slider');
  const polarisAltitudeLabel = document.getElementById('polaris-altitude-label');
  const polarisLatitudeResult = document.getElementById('polaris-latitude-result');

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

  function formatHours(hoursDecimal) {
    let h = Math.floor(hoursDecimal);
    let m = Math.round((hoursDecimal - h) * 60);
    if (m === 60) {
      m = 0;
      h += 1;
    }
    return `${h}h ${String(m).padStart(2, '0')}m`;
  }

  function formatHA(haDegrees) {
    if (Math.abs(haDegrees) < 0.05) {
      return '0.0° (0h 00m) — on the meridian (transiting now)';
    }
    const sign = haDegrees < 0 ? '−' : '+';
    const label = haDegrees < 0 ? 'east of meridian, not yet transited' : 'west of meridian, already transited';
    return `${sign}${Math.abs(haDegrees).toFixed(1)}° (${sign}${formatHours(Math.abs(haDegrees) / 15)}) — ${label}`;
  }

  // Rounding a raw azimuth to 1dp can land exactly on 360.0 when the
  // true value is e.g. 359.98 (common right around transit) — wrap
  // that back to 0.0 so the reading never displays "360.0°".
  function formatAzimuth(azimuth) {
    let rounded = Math.round(azimuth * 10) / 10;
    if (rounded >= 360) rounded -= 360;
    return `${rounded.toFixed(1)}°`;
  }

  function polarPoint(cx, cy, radius, altitude, azimuth) {
    const r = (radius * (90 - altitude)) / 90;
    const rad = (azimuth * Math.PI) / 180;
    return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
  }

  function drawSky(dec, lat, current) {
    const cx = skyCanvas.width / 2;
    const cy = skyCanvas.height / 2;
    const R = Math.min(cx, cy) - 40;

    skyCtx.clearRect(0, 0, skyCanvas.width, skyCanvas.height);

    [0, 30, 60].forEach((ring) => {
      const r = (R * (90 - ring)) / 90;
      skyCtx.beginPath();
      skyCtx.arc(cx, cy, r, 0, Math.PI * 2);
      skyCtx.strokeStyle = ring === 0 ? '#8a97a5' : '#d6dfe8';
      skyCtx.lineWidth = ring === 0 ? 2 : 1;
      skyCtx.stroke();
    });

    skyCtx.fillStyle = '#333';
    skyCtx.font = '600 15px sans-serif';
    skyCtx.textAlign = 'center';
    skyCtx.textBaseline = 'middle';
    skyCtx.fillText('N', cx, cy - R - 16);
    skyCtx.fillText('S', cx, cy + R + 16);
    skyCtx.fillText('E', cx + R + 16, cy);
    skyCtx.fillText('W', cx - R - 16, cy);

    // The star's diurnal path (above the horizon only), analogous to
    // the sun-path page's day arc.
    skyCtx.beginPath();
    let drawing = false;
    for (let haDeg = -180; haDeg <= 180; haDeg += 2) {
      const { altitude, azimuth } = Coordinates.getAltAz(dec, haDeg, lat);
      if (altitude < 0) {
        drawing = false;
        continue;
      }
      const { x, y } = polarPoint(cx, cy, R, altitude, azimuth);
      if (!drawing) {
        skyCtx.moveTo(x, y);
        drawing = true;
      } else {
        skyCtx.lineTo(x, y);
      }
    }
    skyCtx.strokeStyle = '#f5a623';
    skyCtx.lineWidth = 2;
    skyCtx.stroke();

    const aboveHorizon = current.altitude >= 0;
    const point = aboveHorizon
      ? polarPoint(cx, cy, R, current.altitude, current.azimuth)
      : polarPoint(cx, cy, R, 0, current.azimuth);

    skyCtx.beginPath();
    skyCtx.arc(point.x, point.y, 8, 0, Math.PI * 2);
    skyCtx.fillStyle = aboveHorizon ? '#2a6bd6' : '#9aa5b1';
    skyCtx.fill();
    skyCtx.strokeStyle = '#333';
    skyCtx.lineWidth = 1.5;
    skyCtx.stroke();
  }

  // --- Diurnal motion graph: altitude vs hour angle, draggable --------

  const DIURNAL_MARGIN = { left: 50, right: 20, top: 15, bottom: 30 };
  const DIURNAL_ALT_RANGE = { min: -40, max: 90 };

  function diurnalXForHA(haHours) {
    const plotWidth = diurnalCanvas.width - DIURNAL_MARGIN.left - DIURNAL_MARGIN.right;
    return DIURNAL_MARGIN.left + ((haHours + 12) / 24) * plotWidth;
  }

  function diurnalYForAltitude(altitude) {
    const plotHeight = diurnalCanvas.height - DIURNAL_MARGIN.top - DIURNAL_MARGIN.bottom;
    const clamped = Math.max(DIURNAL_ALT_RANGE.min, Math.min(DIURNAL_ALT_RANGE.max, altitude));
    return (
      DIURNAL_MARGIN.top +
      (1 - (clamped - DIURNAL_ALT_RANGE.min) / (DIURNAL_ALT_RANGE.max - DIURNAL_ALT_RANGE.min)) * plotHeight
    );
  }

  function drawDiurnalMotion(dec, lat, currentHADegrees) {
    const width = diurnalCanvas.width;
    const height = diurnalCanvas.height;
    const plotWidth = width - DIURNAL_MARGIN.left - DIURNAL_MARGIN.right;

    diurnalCtx.clearRect(0, 0, width, height);

    // Below-horizon shading
    diurnalCtx.fillStyle = '#eef2f6';
    diurnalCtx.fillRect(
      DIURNAL_MARGIN.left,
      diurnalYForAltitude(0),
      plotWidth,
      diurnalYForAltitude(DIURNAL_ALT_RANGE.min) - diurnalYForAltitude(0)
    );

    // Altitude gridlines
    diurnalCtx.strokeStyle = '#e5e9ee';
    diurnalCtx.fillStyle = '#8a97a5';
    diurnalCtx.font = '11px sans-serif';
    diurnalCtx.textAlign = 'right';
    diurnalCtx.textBaseline = 'middle';
    for (let alt = -30; alt <= 90; alt += 30) {
      const y = diurnalYForAltitude(alt);
      diurnalCtx.beginPath();
      diurnalCtx.moveTo(DIURNAL_MARGIN.left, y);
      diurnalCtx.lineTo(width - DIURNAL_MARGIN.right, y);
      diurnalCtx.stroke();
      diurnalCtx.fillText(String(alt), DIURNAL_MARGIN.left - 8, y);
    }

    // Horizon line, emphasised
    diurnalCtx.strokeStyle = '#8a97a5';
    diurnalCtx.lineWidth = 1.5;
    diurnalCtx.beginPath();
    diurnalCtx.moveTo(DIURNAL_MARGIN.left, diurnalYForAltitude(0));
    diurnalCtx.lineTo(width - DIURNAL_MARGIN.right, diurnalYForAltitude(0));
    diurnalCtx.stroke();

    // Hour-angle ticks
    diurnalCtx.textAlign = 'center';
    diurnalCtx.textBaseline = 'top';
    for (let haH = -12; haH <= 12; haH += 3) {
      diurnalCtx.fillText(String(haH), diurnalXForHA(haH), height - DIURNAL_MARGIN.bottom + 6);
    }

    // The altitude curve
    diurnalCtx.beginPath();
    for (let haH = -12; haH <= 12; haH += 0.05) {
      const { altitude } = Coordinates.getAltAz(dec, haH * 15, lat);
      const x = diurnalXForHA(haH);
      const y = diurnalYForAltitude(altitude);
      if (haH === -12) diurnalCtx.moveTo(x, y);
      else diurnalCtx.lineTo(x, y);
    }
    diurnalCtx.strokeStyle = '#f5a623';
    diurnalCtx.lineWidth = 2;
    diurnalCtx.stroke();

    // Axis labels
    diurnalCtx.fillStyle = '#555';
    diurnalCtx.font = '11px sans-serif';
    diurnalCtx.textAlign = 'center';
    diurnalCtx.textBaseline = 'top';
    diurnalCtx.fillText('Hour angle (hours)', width / 2, height - DIURNAL_MARGIN.bottom + 18);
    diurnalCtx.save();
    diurnalCtx.translate(14, height / 2);
    diurnalCtx.rotate(-Math.PI / 2);
    diurnalCtx.textAlign = 'center';
    diurnalCtx.textBaseline = 'middle';
    diurnalCtx.fillText('Altitude (degrees)', 0, 0);
    diurnalCtx.restore();

    // Draggable marker at the current hour angle
    const markerHAHours = currentHADegrees / 15;
    const markerAltitude = Coordinates.getAltAz(dec, currentHADegrees, lat).altitude;
    const mx = diurnalXForHA(markerHAHours);
    const my = diurnalYForAltitude(markerAltitude);
    diurnalCtx.beginPath();
    diurnalCtx.arc(mx, my, 7, 0, Math.PI * 2);
    diurnalCtx.fillStyle = '#2a6bd6';
    diurnalCtx.fill();
    diurnalCtx.strokeStyle = '#173d75';
    diurnalCtx.lineWidth = 1.5;
    diurnalCtx.stroke();
  }

  function haDegreesFromPointerEvent(evt) {
    const rect = diurnalCanvas.getBoundingClientRect();
    const scaleX = diurnalCanvas.width / rect.width;
    const x = (evt.clientX - rect.left) * scaleX;
    const plotWidth = diurnalCanvas.width - DIURNAL_MARGIN.left - DIURNAL_MARGIN.right;
    const frac = (x - DIURNAL_MARGIN.left) / plotWidth;
    const haHours = Math.max(-12, Math.min(12, -12 + frac * 24));
    return haHours * 15;
  }

  // Given a target LST (hours) on the currently selected date and
  // longitude, find the UTC time-of-day (hours) that produces it.
  // Uses only the public getLocalSiderealTime — evaluated at 0h UT on
  // the same date gives LST0, and LST grows from there at the fixed
  // sidereal rate as the day's clock time advances.
  function utcHoursForTargetLST(targetLSTHours, dayIndex, lonDeg) {
    const midnight = buildDateTime(dayIndex, 0);
    const lst0 = Coordinates.getLocalSiderealTime(midnight, lonDeg);
    const deltaLST = ((targetLSTHours - lst0) % 24 + 24) % 24;
    return deltaLST / SIDEREAL_RATE;
  }

  function applyDraggedHA(haDegrees) {
    const ra = Number(raSlider.value);
    const targetLST = ((ra + haDegrees / 15) % 24 + 24) % 24;
    const dayIndex = Number(dateSlider.value);
    const lon = Number(lonSlider.value);
    const utcHours = utcHoursForTargetLST(targetLST, dayIndex, lon);
    const minutesOfDay = Math.max(0, Math.min(1439, Math.round(utcHours * 60)));
    timeSlider.value = minutesOfDay;
    update();
  }

  let dragging = false;
  diurnalCanvas.addEventListener('pointerdown', (evt) => {
    dragging = true;
    diurnalCanvas.setPointerCapture(evt.pointerId);
    applyDraggedHA(haDegreesFromPointerEvent(evt));
  });
  diurnalCanvas.addEventListener('pointermove', (evt) => {
    if (!dragging) return;
    applyDraggedHA(haDegreesFromPointerEvent(evt));
  });
  diurnalCanvas.addEventListener('pointerup', () => {
    dragging = false;
  });
  diurnalCanvas.addEventListener('pointercancel', () => {
    dragging = false;
  });

  // --- Main update loop -------------------------------------------------

  function update() {
    const ra = Number(raSlider.value);
    const dec = Number(decSlider.value);
    const lat = Number(latSlider.value);
    const lon = Number(lonSlider.value);
    const dayIndex = Number(dateSlider.value);
    const minutesOfDay = Number(timeSlider.value);

    raLabel.textContent = formatHours(ra);
    decLabel.textContent = `${dec.toFixed(1)}°`;
    latLabel.textContent = `${lat}°`;
    lonLabel.textContent = `${lon}°`;
    dateLabel.textContent = formatDate(dayOfYearToUTCDate(YEAR, dayIndex));
    timeLabel.textContent = formatTime(minutesOfDay);

    const date = buildDateTime(dayIndex, minutesOfDay);
    const lst = Coordinates.getLocalSiderealTime(date, lon);
    const haDegrees = Coordinates.raToHourAngleDegrees(ra, lst);
    const { altitude, azimuth } = Coordinates.getAltAz(dec, haDegrees, lat);
    const polarDistance = Coordinates.getPolarDistance(dec);

    lstValue.textContent = formatHours(lst);
    haValue.textContent = formatHA(haDegrees);
    altitudeValue.textContent = `${altitude.toFixed(1)}°${altitude < 0 ? ' (below horizon)' : ''}`;
    azimuthValue.textContent = formatAzimuth(azimuth);
    polarDistanceValue.textContent = `${polarDistance.toFixed(1)}°`;
    haExplainer.textContent =
      haDegrees < 0
        ? "Negative hour angle: the star is east of the meridian and hasn't transited (crossed north-south) yet."
        : "Positive hour angle: the star is west of the meridian — it's already transited.";

    const decRad = (dec * Math.PI) / 180;
    const latRad = (lat * Math.PI) / 180;
    const product = Math.tan(decRad) * Math.tan(latRad);
    let circumpolarText;
    if (product > 1) {
      circumpolarText = 'Always above the horizon — circumpolar.';
    } else if (product < -1) {
      circumpolarText = 'Never rises above the horizon from here.';
    } else {
      circumpolarText = 'Rises and sets normally.';
    }
    circumpolarIndicator.textContent = circumpolarText;

    drawSky(dec, lat, { altitude, azimuth });
    drawDiurnalMotion(dec, lat, haDegrees);
  }

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  // For the "read the diagram" question: whatever the diurnal-motion
  // graph is showing right now, freshly recomputed each time it's
  // called (not memoised), so it always reflects the live sliders.
  function getLiveState() {
    const dec = Number(decSlider.value);
    const lat = Number(latSlider.value);
    const lon = Number(lonSlider.value);
    const dayIndex = Number(dateSlider.value);
    const minutesOfDay = Number(timeSlider.value);
    const ra = Number(raSlider.value);
    const date = buildDateTime(dayIndex, minutesOfDay);
    const lst = Coordinates.getLocalSiderealTime(date, lon);
    const haDegrees = Coordinates.raToHourAngleDegrees(ra, lst);
    return { dec, lat, haDegrees };
  }

  function updatePolarisFinder() {
    const alt = Number(polarisAltitudeSlider.value);
    polarisAltitudeLabel.textContent = `${alt.toFixed(1)}°`;
    polarisLatitudeResult.textContent = `Estimated latitude: ${alt.toFixed(1)}°N`;
  }

  // --- Chained multi-part question ---------------------------------------
  // Bespoke renderer (not QuizUI.mount) since each part's check() takes
  // the student's own prior-part answers for error-carried-forward
  // grading, which the flat single-question quiz model doesn't support.

  function buildPartInput(part, form) {
    if (part.fields) {
      const getters = {};
      part.fields.forEach((field) => {
        const group = document.createElement('div');
        group.className = 'question-field';
        const label = document.createElement('span');
        label.className = 'question-field-label';
        label.textContent = field.label;
        group.appendChild(label);
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '0.1';
        group.appendChild(input);
        if (field.unitLabel) {
          const unit = document.createElement('span');
          unit.textContent = field.unitLabel;
          group.appendChild(unit);
        }
        getters[field.key] = () => parseFloat(input.value);
        form.appendChild(group);
      });
      return () => {
        const values = {};
        part.fields.forEach((field) => {
          values[field.key] = getters[field.key]();
        });
        return values;
      };
    }

    if (part.type === 'choice') {
      part.options.forEach((option) => {
        const label = document.createElement('label');
        label.className = 'choice-option';
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = part.id;
        radio.value = option;
        label.appendChild(radio);
        label.appendChild(document.createTextNode(option));
        form.appendChild(label);
      });
      return () => {
        const checked = form.querySelector(`input[name="${part.id}"]:checked`);
        return checked ? checked.value : null;
      };
    }

    if (part.type === 'text') {
      const input = document.createElement('input');
      input.type = 'text';
      form.appendChild(input);
      return () => input.value;
    }

    // number
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.1';
    form.appendChild(input);
    if (part.unitLabel) {
      const unit = document.createElement('span');
      unit.textContent = part.unitLabel;
      form.appendChild(unit);
    }
    return () => parseFloat(input.value);
  }

  function isPartUnanswered(value) {
    if (value && typeof value === 'object') {
      return Object.values(value).some(isPartUnanswered);
    }
    return value === null || value === '' || (typeof value === 'number' && Number.isNaN(value));
  }

  function renderChainedQuestion(container, params) {
    container.innerHTML = '';
    const chained = CoordinatesQuestions.generateChainedQuestion(Coordinates, params);
    const priorAnswers = {};

    chained.parts.forEach((part, index) => {
      const card = document.createElement('div');
      card.className = 'question-card';

      const partLabel = document.createElement('div');
      partLabel.className = 'question-tags';
      partLabel.textContent = `Part ${index + 1} of ${chained.parts.length}`;
      card.appendChild(partLabel);

      const prompt = document.createElement('p');
      prompt.className = 'question-prompt';
      prompt.textContent = part.prompt;
      card.appendChild(prompt);

      const form = document.createElement('div');
      form.className = 'question-form';
      const getValue = buildPartInput(part, form);
      card.appendChild(form);

      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `Check part ${index + 1}`;
      card.appendChild(button);

      const feedback = document.createElement('p');
      feedback.className = 'question-feedback';
      card.appendChild(feedback);

      button.addEventListener('click', () => {
        const value = getValue();
        if (isPartUnanswered(value)) {
          feedback.className = 'question-feedback';
          feedback.textContent = 'Enter an answer first.';
          return;
        }
        const result = part.check(value, priorAnswers);
        priorAnswers[part.id] = value;
        feedback.className = 'question-feedback ' + (result.correct ? 'correct' : 'incorrect');
        feedback.textContent = result.correct ? 'Correct! ' + result.message : result.message;
      });

      container.appendChild(card);
    });
  }

  STAR_PRESETS.forEach((star, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = star.name;
    starSelect.appendChild(option);
  });
  const customOption = document.createElement('option');
  customOption.value = 'custom';
  customOption.textContent = 'Custom (use sliders)';
  starSelect.appendChild(customOption);
  starSelect.value = '0';

  starSelect.addEventListener('change', () => {
    if (starSelect.value === 'custom') return;
    const star = STAR_PRESETS[Number(starSelect.value)];
    raSlider.value = star.ra;
    decSlider.value = star.dec;
    update();
  });

  raSlider.addEventListener('input', () => {
    starSelect.value = 'custom';
    update();
  });
  decSlider.addEventListener('input', () => {
    starSelect.value = 'custom';
    update();
  });
  [latSlider, lonSlider, dateSlider, timeSlider].forEach((el) => el.addEventListener('input', update));

  polarisAltitudeSlider.addEventListener('input', updatePolarisFinder);

  const chainedContainer = document.getElementById('chained-question-container');
  const regenerateButton = document.getElementById('regenerate-chained');
  regenerateButton.addEventListener('click', () => {
    renderChainedQuestion(chainedContainer, CoordinatesQuestions.pickRandomChainedParams());
  });

  update();
  renderCoverage();
  updatePolarisFinder();
  QuizUI.mount(CoordinatesQuestions.makeQuestions(Coordinates, getLiveState));
  renderChainedQuestion(chainedContainer, CoordinatesQuestions.pickRandomChainedParams());
})();
