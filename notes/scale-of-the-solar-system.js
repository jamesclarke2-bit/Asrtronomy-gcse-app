/**
 * notes/scale-of-the-solar-system.html.
 *
 * Every "given" figure here (AU, light year and parsec in km, the
 * Earth-Moon distance, the planets' own mean distances from the Sun in
 * AU, and the speed of light) comes straight from src/specData.js, the
 * exam's own data sheet — nothing is retyped. The one distance that
 * isn't on the data sheet is the nearest star beyond the Sun (Proxima
 * Centauri, ~4.25 light years), used only to give the scale diagram and
 * slider a real sense of what lies past the planets; it's clearly
 * marked as a real-world figure, not an exam one, everywhere it's used.
 */
(function () {
  const CURRICULUM_UNITS = ['u3.3', 'u3.4'];

  const C = SpecData.CONSTANTS;
  const AU_KM = C.auKm;
  const MOON_KM = C.meanEarthMoonDistanceKm;
  const LY_KM = C.lightYearKm;
  const PARSEC_KM = C.parsecKm;
  const PARSEC_LY = C.parsecLightYears;
  const SPEED_OF_LIGHT_KM_S = C.speedOfLightMPerS / 1000;

  // Proxima Centauri, the nearest star beyond the Sun — a real-world
  // figure, not on the exam data sheet (see file header).
  const NEAREST_STAR_LY = 4.25;
  const NEAREST_STAR_KM = NEAREST_STAR_LY * LY_KM;
  const NEAREST_STAR_NAME = 'Nearest star (Proxima Centauri)';

  const PLANETS = SpecData.PLANETARY_DATA.filter((body) => body.type === 'planet');

  // Sorted by distance, nearest first: the Moon, the eight planets (by
  // their own mean distance from the Sun), then the nearest star.
  const BODIES = [
    { name: 'The Moon', km: MOON_KM },
    ...PLANETS.map((p) => ({ name: p.name, km: p.distanceAU * AU_KM })),
    { name: NEAREST_STAR_NAME, km: NEAREST_STAR_KM },
  ];

  const LOG_MIN = Math.log10(BODIES[0].km);
  const LOG_MAX = Math.log10(BODIES[BODIES.length - 1].km);

  const SUPERSCRIPT_DIGITS = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻', '+': '' };

  function toSuperscript(value) {
    return String(value)
      .split('')
      .map((ch) => SUPERSCRIPT_DIGITS[ch] ?? ch)
      .join('');
  }

  // "1.5e+8" -> "1.5 × 10⁸", matching the data sheet's own notation.
  function formatScientific(value, sigFigs) {
    const [mantissa, exponent] = value.toExponential(sigFigs).split('e');
    return `${mantissa} × 10${toSuperscript(Number(exponent))}`;
  }

  // Plain decimal for numbers in a comfortable range, scientific notation
  // once they'd otherwise run to a lot of digits either way.
  function formatNumber(value, sigFigs) {
    const abs = Math.abs(value);
    if (abs !== 0 && (abs < 1e-2 || abs >= 1e5)) return formatScientific(value, sigFigs);
    return Number(value.toPrecision(sigFigs + 1)).toLocaleString(undefined, { maximumFractionDigits: 6 });
  }

  function formatKm(km) {
    return km < 1e6 ? `${Math.round(km).toLocaleString()} km` : `${formatScientific(km, 2)} km`;
  }

  function formatDuration(seconds) {
    if (seconds < 60) return `${seconds.toFixed(1)} s`;
    const minutes = seconds / 60;
    if (minutes < 60) return `${minutes.toFixed(1)} min`;
    const hours = minutes / 60;
    if (hours < 24) return `${hours.toFixed(2)} h`;
    const days = hours / 24;
    if (days < 365) return `${days.toFixed(1)} days`;
    const years = days / 365.25;
    return `${years.toFixed(2)} years`;
  }

  const canvas = document.getElementById('distance-diagram');
  const slider = document.getElementById('distance-slider');
  const sliderLabel = document.getElementById('distance-slider-label');
  const readout = document.getElementById('distance-readout');
  const nearestEl = document.getElementById('distance-nearest');
  const lightTimeEl = document.getElementById('distance-light-time');

  const state = { km: AU_KM }; // start at Earth's own distance from the Sun

  const MARGIN = 68;

  function xForKm(km) {
    const t = (Math.log10(km) - LOG_MIN) / (LOG_MAX - LOG_MIN);
    return MARGIN + t * (canvas.width - 2 * MARGIN);
  }

  const LINE_Y = 135;
  const DECADE_LABEL_Y = 172;
  const LABEL_ANGLE = Math.PI / 2.4; // ~75°, steep enough that even Venus/Earth/Mars don't collide

  // Diagonal label reading up-and-away from its tick, so closely spaced
  // bodies (the outer planets especially) overlap far less than
  // horizontal text would. The rightmost body reads up-and-to-the-left
  // instead, so "Nearest star" doesn't run off the canvas edge.
  function drawBodyLabel(ctx, x, name, flip) {
    const tickTop = LINE_Y - 10;
    ctx.strokeStyle = '#2a6bd6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, LINE_Y);
    ctx.lineTo(x, tickTop);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, LINE_Y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#2a6bd6';
    ctx.fill();

    ctx.save();
    ctx.translate(x, tickTop - 3);
    ctx.rotate(flip ? Math.PI - LABEL_ANGLE : -LABEL_ANGLE);
    ctx.textAlign = flip ? 'right' : 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1b3a63';
    ctx.font = '11px sans-serif';
    ctx.fillText(name, 0, 0);
    ctx.restore();
  }

  function drawDiagram() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Decade gridlines (powers of ten), with small labels underneath.
    ctx.strokeStyle = '#dde5ee';
    ctx.fillStyle = '#8a97a5';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    for (let power = Math.ceil(LOG_MIN); power <= Math.floor(LOG_MAX); power += 1) {
      const x = xForKm(Math.pow(10, power));
      ctx.beginPath();
      ctx.moveTo(x, LINE_Y + 4);
      ctx.lineTo(x, DECADE_LABEL_Y - 10);
      ctx.stroke();
      ctx.fillText(`10${toSuperscript(power)}`, x, DECADE_LABEL_Y);
    }

    // The main distance line.
    ctx.strokeStyle = '#b7c3d1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xForKm(BODIES[0].km), LINE_Y);
    ctx.lineTo(xForKm(BODIES[BODIES.length - 1].km), LINE_Y);
    ctx.stroke();

    // Marked bodies: a short tick and a diagonal label (see drawBodyLabel).
    BODIES.forEach((body, i) => {
      const x = xForKm(body.km);
      const name = body.name.replace('Nearest star (Proxima Centauri)', 'Nearest star');
      drawBodyLabel(ctx, x, name, i === BODIES.length - 1);
    });

    // The slider's current position: a red marker spanning the diagram.
    const markerX = xForKm(state.km);
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(markerX, 12);
    ctx.lineTo(markerX, LINE_Y + 8);
    ctx.stroke();
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.moveTo(markerX, LINE_Y + 8);
    ctx.lineTo(markerX - 5, LINE_Y + 16);
    ctx.lineTo(markerX + 5, LINE_Y + 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#8a97a5';
    ctx.font = 'italic 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Not to scale — logarithmic distance axis, so equal steps multiply, not add', 8, canvas.height - 10);
  }

  function nearestBody(km) {
    const logKm = Math.log10(km);
    return BODIES.reduce((best, body) => (Math.abs(Math.log10(body.km) - logKm) < Math.abs(Math.log10(best.km) - logKm) ? body : best));
  }

  function updateReadout() {
    const km = state.km;
    const au = km / AU_KM;
    const ly = km / LY_KM;
    const pc = km / PARSEC_KM;

    sliderLabel.textContent = formatKm(km);
    readout.textContent = `${formatKm(km)} = ${formatNumber(au, 3)} AU = ${formatNumber(ly, 3)} ly = ${formatNumber(pc, 3)} pc`;

    const nearest = nearestBody(km);
    nearestEl.textContent = `Closest marked distance: ${nearest.name}`;

    const lightSeconds = km / SPEED_OF_LIGHT_KM_S;
    lightTimeEl.textContent = `Light takes ${formatDuration(lightSeconds)} to cross this distance`;
  }

  function update() {
    const t = Number(slider.value);
    state.km = Math.pow(10, LOG_MIN + t * (LOG_MAX - LOG_MIN));
    drawDiagram();
    updateReadout();
  }

  slider.addEventListener('input', update);

  function renderUnitsTable() {
    document.getElementById('au-value').textContent = `1 AU = ${formatScientific(AU_KM, 1)} km`;
    document.getElementById('ly-value').textContent = `1 ly = ${formatScientific(LY_KM, 1)} km`;
    document.getElementById('parsec-value').textContent = `1 pc = ${formatScientific(PARSEC_KM, 1)} km = ${PARSEC_LY} ly`;
  }

  function renderLightTimeTable() {
    const tbody = document.getElementById('light-time-body');
    tbody.innerHTML = '';

    const rows = [
      { name: 'The Moon', distanceKm: MOON_KM, distanceLabel: `${MOON_KM.toLocaleString()} km (from Earth)` },
      ...PLANETS.map((p) => ({
        name: p.name,
        distanceKm: p.distanceAU * AU_KM,
        distanceLabel: `${p.distanceAU} AU`,
      })),
    ];

    rows.forEach((row) => {
      const tr = document.createElement('tr');
      const nameCell = document.createElement('th');
      nameCell.scope = 'row';
      nameCell.textContent = row.name;
      const distanceCell = document.createElement('td');
      distanceCell.textContent = row.distanceLabel;
      const timeCell = document.createElement('td');
      timeCell.textContent = formatDuration(row.distanceKm / SPEED_OF_LIGHT_KM_S);
      tr.append(nameCell, distanceCell, timeCell);
      tbody.appendChild(tr);
    });
  }

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    au: `Astronomical unit (AU): the mean Earth-Sun distance, ${formatScientific(AU_KM, 1)} km — the standard unit for distances within the Solar System.`,
    'light-year': `Light year (ly): the distance light travels in one year, ${formatScientific(LY_KM, 1)} km — tells you directly how long ago the light you're seeing set out.`,
    parsec: `Parsec (pc): the distance at which 1 AU subtends an angle of 1 arcsecond of parallax — ${formatScientific(PARSEC_KM, 1)} km, or ${PARSEC_LY} light years, and the unit astronomers prefer for distances to other stars.`,
  };

  slider.value = String((Math.log10(state.km) - LOG_MIN) / (LOG_MAX - LOG_MIN));
  update();
  renderUnitsTable();
  renderLightTimeTable();
  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(ScaleOfSolarSystemQuestions.makeQuestions(SpecData));
})();
