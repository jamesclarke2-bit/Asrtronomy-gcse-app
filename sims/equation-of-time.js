(function () {
  const YEAR = 2026;
  const CURRICULUM_UNITS = ['u2.10'];

  const canvas = document.getElementById('eot-graph');
  const ctx = canvas.getContext('2d');
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

  // Equation of time only depends on the date, so precompute the whole
  // year once rather than recalculating on every slider tick.
  const EOT_BY_DAY = [];
  for (let day = 0; day < 365; day++) {
    EOT_BY_DAY.push(SolarPosition.getSunPosition(dayOfYearToUTCDate(YEAR, day), 0, 0).equationOfTime);
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

    // The curve
    ctx.beginPath();
    EOT_BY_DAY.forEach((value, day) => {
      const x = xForDay(day);
      const y = yForValue(value);
      if (day === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#f5a623';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Selected date marker
    const markerX = xForDay(selectedDay);
    const markerY = yForValue(EOT_BY_DAY[selectedDay]);
    ctx.beginPath();
    ctx.arc(markerX, markerY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#2a6bd6';
    ctx.fill();
    ctx.strokeStyle = '#173d75';
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

  function update() {
    const day = Number(dateSlider.value);
    dateLabel.textContent = formatDate(dayOfYearToUTCDate(YEAR, day));

    const eot = EOT_BY_DAY[day];
    const eotAbs = Math.abs(eot).toFixed(1);
    const direction = eot >= 0 ? 'ahead of' : 'behind';
    eqTimeValue.textContent = `Sundial reads ${eotAbs} min ${direction} clock time`;

    drawGraph(day);
  }

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  dateSlider.addEventListener('input', update);
  update();
  renderCoverage();

  QuizUI.mount(EotQuestions.QUESTIONS);
})();
