(function () {
  const YEAR = 2026;
  const CURRICULUM_UNITS = ['u2.10'];

  const canvas = document.getElementById('eot-graph');
  const ctx = canvas.getContext('2d');
  const analemmaCanvas = document.getElementById('analemma-graph');
  const analemmaCtx = analemmaCanvas.getContext('2d');
  const dateSlider = document.getElementById('date-slider');
  const dateLabel = document.getElementById('date-label');
  const eqTimeValue = document.getElementById('eqtime-value');

  function dayOfYearToUTCDate(year, dayIndex) {
    const d = new Date(Date.UTC(year, 0, 1, 12, 0));
    d.setUTCDate(d.getUTCDate() + dayIndex);
    return d;
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  }

  // Equation of time and declination only depend on the date, so
  // precompute the whole year once rather than recalculating on every
  // slider tick. Declination is the same getSunPosition calculation the
  // sun-path page's orbit panel uses.
  const EOT_BY_DAY = [];
  const DECL_BY_DAY = [];
  const OBLIQUITY_BY_DAY = [];
  const ECCENTRICITY_BY_DAY = [];
  for (let day = 0; day < 365; day++) {
    const sun = SolarPosition.getSunPosition(dayOfYearToUTCDate(YEAR, day), 0, 0);
    EOT_BY_DAY.push(sun.equationOfTime);
    DECL_BY_DAY.push(sun.declination);
    OBLIQUITY_BY_DAY.push(EotComponents.obliquityComponent(day));
    ECCENTRICITY_BY_DAY.push(EotComponents.eccentricityComponent(day));
  }

  const MONTH_STARTS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

  function drawGraph(selectedDay) {
    const width = canvas.width;
    const height = canvas.height;
    const marginLeft = 45;
    const marginRight = 15;
    const marginTop = 15;
    const marginBottom = 26;
    const plotWidth = width - marginLeft - marginRight;
    const plotHeight = height - marginTop - marginBottom;
    const minY = -16;
    const maxY = 18;

    const xForDay = (day) => marginLeft + (day / 364) * plotWidth;
    const yForValue = (value) => marginTop + (1 - (value - minY) / (maxY - minY)) * plotHeight;

    ctx.clearRect(0, 0, width, height);

    // Gridlines and y-axis labels
    ctx.strokeStyle = '#e5e9ee';
    ctx.fillStyle = '#8a97a5';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let v = -15; v <= 15; v += 5) {
      const y = yForValue(v);
      ctx.beginPath();
      ctx.moveTo(marginLeft, y);
      ctx.lineTo(width - marginRight, y);
      ctx.stroke();
      ctx.fillText(String(v), marginLeft - 8, y);
    }

    // Zero line, emphasised
    ctx.strokeStyle = '#8a97a5';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(marginLeft, yForValue(0));
    ctx.lineTo(width - marginRight, yForValue(0));
    ctx.stroke();

    // Month labels along the x-axis
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    MONTH_STARTS.forEach((day, i) => {
      ctx.fillText(MONTH_LABELS[i], xForDay(day), height - marginBottom + 6);
    });

    function strokeSeries(data, color, dashed) {
      ctx.beginPath();
      data.forEach((value, day) => {
        const x = xForDay(day);
        const y = yForValue(value);
        if (day === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = dashed ? 1.5 : 2;
      if (dashed) ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // The two component curves, drawn under the total so the total reads clearly
    strokeSeries(OBLIQUITY_BY_DAY, '#2a6bd6', true);
    strokeSeries(ECCENTRICITY_BY_DAY, '#2e8b57', true);
    strokeSeries(EOT_BY_DAY, '#f5a623', false);

    // Selected date marker, on the total curve
    const markerX = xForDay(selectedDay);
    const markerY = yForValue(EOT_BY_DAY[selectedDay]);
    ctx.beginPath();
    ctx.arc(markerX, markerY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#8e44ad';
    ctx.fill();
    ctx.strokeStyle = '#5e2d73';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Rotated y-axis label
    ctx.save();
    ctx.translate(14, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#555';
    ctx.font = '11px sans-serif';
    ctx.fillText('Minutes (ahead +, behind -)', 0, 0);
    ctx.restore();
  }

  const ANALEMMA_REFERENCE_POINTS = [
    { day: 0, label: 'Jan' },
    { day: 90, label: 'Apr' },
    { day: 181, label: 'Jul' },
    { day: 273, label: 'Oct' },
  ];

  function drawAnalemma(selectedDay) {
    const width = analemmaCanvas.width;
    const height = analemmaCanvas.height;
    const marginLeft = 55;
    const marginRight = 20;
    const marginTop = 20;
    const marginBottom = 40;
    const plotWidth = width - marginLeft - marginRight;
    const plotHeight = height - marginTop - marginBottom;
    const minEot = -16;
    const maxEot = 18;
    const minDecl = -25;
    const maxDecl = 25;

    const xForEot = (eot) => marginLeft + ((eot - minEot) / (maxEot - minEot)) * plotWidth;
    const yForDecl = (decl) => marginTop + (1 - (decl - minDecl) / (maxDecl - minDecl)) * plotHeight;

    analemmaCtx.clearRect(0, 0, width, height);

    // Declination gridlines (solstices and equinox)
    analemmaCtx.strokeStyle = '#e5e9ee';
    analemmaCtx.fillStyle = '#8a97a5';
    analemmaCtx.font = '11px sans-serif';
    analemmaCtx.textAlign = 'right';
    analemmaCtx.textBaseline = 'middle';
    [-23.44, 0, 23.44].forEach((decl) => {
      const y = yForDecl(decl);
      analemmaCtx.beginPath();
      analemmaCtx.moveTo(marginLeft, y);
      analemmaCtx.lineTo(width - marginRight, y);
      analemmaCtx.stroke();
      analemmaCtx.fillText(decl.toFixed(1), marginLeft - 8, y);
    });

    // EoT = 0 vertical line
    analemmaCtx.beginPath();
    analemmaCtx.moveTo(xForEot(0), marginTop);
    analemmaCtx.lineTo(xForEot(0), height - marginBottom);
    analemmaCtx.stroke();

    // The analemma curve itself, closed into a loop
    analemmaCtx.beginPath();
    for (let day = 0; day <= 365; day++) {
      const i = day % 365;
      const x = xForEot(EOT_BY_DAY[i]);
      const y = yForDecl(DECL_BY_DAY[i]);
      if (day === 0) analemmaCtx.moveTo(x, y);
      else analemmaCtx.lineTo(x, y);
    }
    analemmaCtx.strokeStyle = '#8e44ad';
    analemmaCtx.lineWidth = 2;
    analemmaCtx.stroke();

    // Month reference points, to orient the loop in time
    analemmaCtx.font = '10px sans-serif';
    ANALEMMA_REFERENCE_POINTS.forEach(({ day, label }) => {
      const x = xForEot(EOT_BY_DAY[day]);
      const y = yForDecl(DECL_BY_DAY[day]);
      analemmaCtx.beginPath();
      analemmaCtx.arc(x, y, 3, 0, Math.PI * 2);
      analemmaCtx.fillStyle = '#8a97a5';
      analemmaCtx.fill();
      analemmaCtx.textAlign = 'left';
      analemmaCtx.fillText(label, x + 6, y);
    });

    // Selected date marker
    const markerX = xForEot(EOT_BY_DAY[selectedDay]);
    const markerY = yForDecl(DECL_BY_DAY[selectedDay]);
    analemmaCtx.beginPath();
    analemmaCtx.arc(markerX, markerY, 6, 0, Math.PI * 2);
    analemmaCtx.fillStyle = '#2a6bd6';
    analemmaCtx.fill();
    analemmaCtx.strokeStyle = '#173d75';
    analemmaCtx.lineWidth = 1.5;
    analemmaCtx.stroke();

    // Axis labels
    analemmaCtx.fillStyle = '#555';
    analemmaCtx.font = '11px sans-serif';
    analemmaCtx.textAlign = 'center';
    analemmaCtx.textBaseline = 'top';
    analemmaCtx.fillText('Equation of time (minutes)', width / 2, height - marginBottom + 18);

    analemmaCtx.save();
    analemmaCtx.translate(14, height / 2);
    analemmaCtx.rotate(-Math.PI / 2);
    analemmaCtx.textAlign = 'center';
    analemmaCtx.textBaseline = 'middle';
    analemmaCtx.fillText('Declination (degrees)', 0, 0);
    analemmaCtx.restore();
  }

  // --- Local mean time and time zones ------------------------------------

  const longitudeSlider = document.getElementById('longitude-slider');

  // Clock time from minutes after midnight, wrapped into one day, to the
  // nearest minute or second.
  function formatClock(minutes, withSeconds) {
    const pad = (n) => String(n).padStart(2, '0');
    const wrapped = ((minutes % 1440) + 1440) % 1440;
    if (withSeconds) {
      const total = Math.round(wrapped * 60) % 86400;
      return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
    }
    const total = Math.round(wrapped) % 1440;
    return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
  }

  function formatLongitude(lon) {
    if (lon === 0) return '0°';
    return `${Math.abs(lon).toFixed(1)}° ${lon > 0 ? 'E' : 'W'}`;
  }

  // With GMT at 12:00: LMT is 4 minutes per degree east ahead of it, and a
  // sundial (AST) is the equation of time ahead of LMT.
  function updateTimeConverter(day) {
    const lon = Number(longitudeSlider.value);
    const noonGMT = 720;
    const lmt = noonGMT + 4 * lon;
    const ast = lmt + EOT_BY_DAY[day];
    const zone = Math.round(lon / 15);
    const zoneName = zone === 0 ? 'GMT' : `GMT${zone > 0 ? '+' : '−'}${Math.abs(zone)}`;
    document.getElementById('longitude-label').textContent = formatLongitude(lon);
    document.getElementById('lmt-value').textContent = formatClock(lmt, true);
    document.getElementById('ast-value').textContent = formatClock(ast, true);
    document.getElementById('zone-value').textContent = `${zoneName} (${formatClock(noonGMT + 60 * zone)})`;
    const eot = EOT_BY_DAY[day];
    const lmtPart = lon === 0
      ? 'At longitude 0°, LMT is GMT.'
      : `${formatLongitude(lon)} is 4 min × ${Math.abs(lon).toFixed(1)} = ${Math.abs(4 * lon).toFixed(1)} min ${lon > 0 ? 'ahead of' : 'behind'} GMT.`;
    document.getElementById('time-working').textContent =
      `${lmtPart} On this date a sundial there is a further ${Math.abs(eot).toFixed(1)} min ${eot >= 0 ? 'ahead of' : 'behind'} LMT.`;
  }

  longitudeSlider.addEventListener('input', () => updateTimeConverter(Number(dateSlider.value)));
  document.querySelectorAll('.preset-button[data-longitude]').forEach((button) => {
    button.addEventListener('click', () => {
      longitudeSlider.value = button.dataset.longitude;
      updateTimeConverter(Number(dateSlider.value));
    });
  });

  // --- Sunrise and sunset through the year -------------------------------
  // Each day's times come from SolarPosition.getSunriseSunset, which uses
  // the same getSunPosition declination and equation of time as the rest
  // of this page (and the sun-path page), at Greenwich longitude.

  const sunriseCanvas = document.getElementById('sunrise-graph');
  const sunriseCtx = sunriseCanvas.getContext('2d');
  const latitudeSlider = document.getElementById('latitude-slider');
  const SUNRISE_COLOR = '#c2610c';
  const SUNSET_COLOR = '#2a5bd7';
  const DAYLIGHT_FILL = '#fff1c2';
  const SUN_MARGIN = { left: 50, right: 15, top: 15, bottom: 26 };

  let sunTimes = [];
  let hoverDay = null;

  function computeSunTimes(lat) {
    sunTimes = [];
    for (let day = 0; day < 365; day++) {
      sunTimes.push(SolarPosition.getSunriseSunset(dayOfYearToUTCDate(YEAR, day), lat, 0));
    }
  }

  function sunPlot() {
    const width = sunriseCanvas.width;
    const height = sunriseCanvas.height;
    const plotWidth = width - SUN_MARGIN.left - SUN_MARGIN.right;
    const plotHeight = height - SUN_MARGIN.top - SUN_MARGIN.bottom;
    return {
      width,
      height,
      plotWidth,
      xForDay: (day) => SUN_MARGIN.left + (day / 364) * plotWidth,
      yForMinutes: (m) => SUN_MARGIN.top + (1 - m / 1440) * plotHeight,
    };
  }

  function describeDay(day) {
    const t = sunTimes[day];
    const date = formatDate(dayOfYearToUTCDate(YEAR, day));
    if (t.polar === 'day') return `${date}: the Sun doesn't set (midnight Sun)`;
    if (t.polar === 'night') return `${date}: the Sun doesn't rise (polar night)`;
    const len = Math.round(t.dayLengthMinutes);
    return `${date}: sunrise ${formatClock(t.sunriseUT)}, sunset ${formatClock(t.sunsetUT)} GMT, ${Math.floor(len / 60)} h ${len % 60} min of daylight`;
  }

  function drawSunrise(selectedDay) {
    const { width, height, xForDay, yForMinutes } = sunPlot();
    const ctx = sunriseCtx;
    ctx.clearRect(0, 0, width, height);

    // Daylight band between sunrise and sunset, one day-wide strip at a time
    // so midnight-Sun and polar-night days are filled correctly.
    ctx.fillStyle = DAYLIGHT_FILL;
    const strip = (xForDay(1) - xForDay(0)) + 0.6;
    sunTimes.forEach((t, day) => {
      if (t.polar === 'night') return;
      const top = t.polar === 'day' ? yForMinutes(1440) : yForMinutes(t.sunsetUT);
      const bottom = t.polar === 'day' ? yForMinutes(0) : yForMinutes(t.sunriseUT);
      ctx.fillRect(xForDay(day) - strip / 2, top, strip, bottom - top);
    });

    // Gridlines every 3 hours, recessive.
    ctx.strokeStyle = '#e5e9ee';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#8a97a5';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let h = 0; h <= 24; h += 3) {
      const y = yForMinutes(h * 60);
      ctx.beginPath();
      ctx.moveTo(SUN_MARGIN.left, y);
      ctx.lineTo(width - SUN_MARGIN.right, y);
      ctx.stroke();
      ctx.fillText(`${String(h).padStart(2, '0')}:00`, SUN_MARGIN.left - 6, y);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    MONTH_STARTS.forEach((day, i) => ctx.fillText(MONTH_LABELS[i], xForDay(day), height - SUN_MARGIN.bottom + 6));

    function strokeTimes(key, color) {
      ctx.beginPath();
      let drawing = false;
      sunTimes.forEach((t, day) => {
        if (t[key] == null) { drawing = false; return; }
        const x = xForDay(day);
        const y = yForMinutes(t[key]);
        if (drawing) ctx.lineTo(x, y);
        else { ctx.moveTo(x, y); drawing = true; }
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    strokeTimes('sunriseUT', SUNRISE_COLOR);
    strokeTimes('sunsetUT', SUNSET_COLOR);

    // Direct labels on each curve (in text ink; the legend carries the colour),
    // placed in October, clear of the midnight-Sun gap in high summer.
    const labelDay = 290;
    const labelT = sunTimes[labelDay];
    ctx.fillStyle = '#555';
    ctx.font = '600 11px sans-serif';
    ctx.textAlign = 'center';
    if (labelT.sunsetUT != null) {
      ctx.textBaseline = 'bottom';
      ctx.fillText('Sunset', xForDay(labelDay), yForMinutes(labelT.sunsetUT) - 6);
    }
    if (labelT.sunriseUT != null) {
      ctx.textBaseline = 'top';
      ctx.fillText('Sunrise', xForDay(labelDay), yForMinutes(labelT.sunriseUT) + 6);
    }

    // Selected date: a guide line and a ringed marker on each curve.
    const markX = xForDay(selectedDay);
    ctx.strokeStyle = '#8e44ad';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(markX, SUN_MARGIN.top);
    ctx.lineTo(markX, height - SUN_MARGIN.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
    const t = sunTimes[selectedDay];
    [['sunriseUT', SUNRISE_COLOR], ['sunsetUT', SUNSET_COLOR]].forEach(([key, color]) => {
      if (t[key] == null) return;
      ctx.beginPath();
      ctx.arc(markX, yForMinutes(t[key]), 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Hover crosshair and tooltip.
    if (hoverDay != null) {
      const hx = xForDay(hoverDay);
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx, SUN_MARGIN.top);
      ctx.lineTo(hx, height - SUN_MARGIN.bottom);
      ctx.stroke();
      const text = describeDay(hoverDay);
      ctx.font = '12px sans-serif';
      const boxWidth = ctx.measureText(text).width + 16;
      const boxX = Math.min(Math.max(hx - boxWidth / 2, 4), width - boxWidth - 4);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#cdd7e1';
      ctx.fillRect(boxX, SUN_MARGIN.top + 4, boxWidth, 24);
      ctx.strokeRect(boxX, SUN_MARGIN.top + 4, boxWidth, 24);
      ctx.fillStyle = '#1a1a1a';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, boxX + 8, SUN_MARGIN.top + 16);
    }

    ctx.save();
    ctx.translate(12, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#555';
    ctx.font = '11px sans-serif';
    ctx.fillText('Time of day (GMT)', 0, 0);
    ctx.restore();
  }

  function dayFromPointer(event) {
    const rect = sunriseCanvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * sunriseCanvas.width;
    const { plotWidth } = sunPlot();
    return Math.round(Math.min(Math.max((x - SUN_MARGIN.left) / plotWidth, 0), 1) * 364);
  }

  sunriseCanvas.addEventListener('pointermove', (event) => {
    hoverDay = dayFromPointer(event);
    drawSunrise(Number(dateSlider.value));
  });
  sunriseCanvas.addEventListener('pointerleave', () => {
    hoverDay = null;
    drawSunrise(Number(dateSlider.value));
  });
  sunriseCanvas.addEventListener('click', (event) => {
    dateSlider.value = String(dayFromPointer(event));
    update();
  });

  // The earliest sunset and latest sunrise fall either side of the winter
  // solstice, not on it, because the equation of time is falling then.
  function updateSolsticeNote(lat) {
    const note = document.getElementById('solstice-note');
    if (Math.abs(lat) < 15) {
      note.innerHTML =
        '<strong>Near the equator, the day barely changes length.</strong> Sunrise and ' +
        'sunset then move earlier and later together through the year, following the ' +
        'equation of time almost exactly.';
      return;
    }
    const north = lat >= 0;
    // Search a window around the winter solstice (21 December in the
    // north, 21 June in the south), crossing the year end in the north.
    const solstice = north ? Date.UTC(YEAR - 1, 11, 21, 12) : Date.UTC(YEAR, 5, 21, 12);
    let earliestSunset = null;
    let latestSunrise = null;
    for (let offset = -40; offset <= 40; offset++) {
      const date = new Date(solstice + offset * 86400000);
      const t = SolarPosition.getSunriseSunset(date, lat, 0);
      if (t.polar) continue;
      if (!earliestSunset || t.sunsetUT < earliestSunset.t.sunsetUT) earliestSunset = { date, t };
      if (!latestSunrise || t.sunriseUT > latestSunrise.t.sunriseUT) latestSunrise = { date, t };
    }
    const eotBefore = SolarPosition.getSunPosition(new Date(solstice - 5 * 86400000), 0, 0).equationOfTime;
    const eotAfter = SolarPosition.getSunPosition(new Date(solstice + 5 * 86400000), 0, 0).equationOfTime;
    const driftSeconds = Math.round(((eotBefore - eotAfter) / 10) * 60);
    if (!earliestSunset || !latestSunrise) {
      note.innerHTML = '<strong>At this latitude the Sun doesn\'t rise at all around the winter solstice</strong> (polar night).';
      return;
    }
    note.innerHTML =
      '<strong>The shortest day isn\'t the day of the earliest sunset.</strong> At this latitude ' +
      `the earliest sunset is around ${formatDate(earliestSunset.date)} ` +
      `(${formatClock(earliestSunset.t.sunsetUT)}) and the latest sunrise around ` +
      `${formatDate(latestSunrise.date)} (${formatClock(latestSunrise.t.sunriseUT)}), either side ` +
      `of the winter solstice on ${north ? '21 December' : '21 June'}. That's the equation of ` +
      `time at work: around then it's falling by about ${driftSeconds} seconds a day (see ` +
      'the equation of time graph at the top), so solar noon, and with it the whole day\'s sunrise and sunset, ' +
      'drifts later.';
  }

  function updateLatitude() {
    const lat = Number(latitudeSlider.value);
    document.getElementById('latitude-label').textContent = `${Math.abs(lat).toFixed(1)}° ${lat >= 0 ? 'N' : 'S'}`;
    computeSunTimes(lat);
    updateSolsticeNote(lat);
    update();
  }

  latitudeSlider.addEventListener('input', updateLatitude);

  function update() {
    const day = Number(dateSlider.value);
    dateLabel.textContent = formatDate(dayOfYearToUTCDate(YEAR, day));

    const eot = EOT_BY_DAY[day];
    const eotAbs = Math.abs(eot).toFixed(1);
    const direction = eot >= 0 ? 'ahead of' : 'behind';
    eqTimeValue.textContent = `Sundial reads ${eotAbs} min ${direction} clock time`;

    drawGraph(day);
    drawAnalemma(day);
    updateTimeConverter(day);
    drawSunrise(day);
    document.getElementById('sunrise-value').textContent = describeDay(day);
  }

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  // --- Tap-to-reveal glossary ----------------------------------------
  // Toggle mechanism lives in the shared glossary.js (Glossary.init) —
  // this page just supplies its own term dictionary.
  const GLOSSARY = {
    analemma: "Analemma: the figure-eight path the Sun traces across the sky over a year when photographed at the same clock time and place each day — caused by the same two effects (orbital eccentricity and axial tilt) that make up the equation of time.",
    declination: "Declination: the Sun's north-south position on the sky, in degrees from the celestial equator — the same everywhere on Earth on a given date, and the up-down component of the analemma. It also sets how long the Sun is above the horizon each day.",
  };

  dateSlider.addEventListener('input', update);
  updateLatitude();
  renderCoverage();
  Glossary.init(GLOSSARY);

  QuizUI.mount(EotQuestions.QUESTIONS);
})();
