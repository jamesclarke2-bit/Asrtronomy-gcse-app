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

  function update() {
    const day = Number(dateSlider.value);
    dateLabel.textContent = formatDate(dayOfYearToUTCDate(YEAR, day));

    const eot = EOT_BY_DAY[day];
    const eotAbs = Math.abs(eot).toFixed(1);
    const direction = eot >= 0 ? 'ahead of' : 'behind';
    eqTimeValue.textContent = `Sundial reads ${eotAbs} min ${direction} clock time`;

    drawGraph(day);
    drawAnalemma(day);
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
    declination: "Declination: the Sun's north-south position on the sky, in degrees from the celestial equator — the same everywhere on Earth on a given date, and the up-down component of the analemma.",
  };

  dateSlider.addEventListener('input', update);
  update();
  renderCoverage();
  Glossary.init(GLOSSARY);

  QuizUI.mount(EotQuestions.QUESTIONS);
})();
