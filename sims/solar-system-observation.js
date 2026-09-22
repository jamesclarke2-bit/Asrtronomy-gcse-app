(function () {
  const CURRICULUM_UNITS = ['u1.15', 'u1.16', 'u1.17'];
  const REFERENCE_START = new Date(Date.UTC(2026, 0, 1));
  // Exactly two Mars synodic periods (~780 days each, see
  // planetaryMotion.test.js), so the retrograde loop visibly repeats
  // once within the slider's range.
  const RANGE_DAYS = 1560;

  const dateSlider = document.getElementById('date-slider');
  const dateLabel = document.getElementById('date-label');
  const playButton = document.getElementById('play-button');
  const alignmentReadout = document.getElementById('alignment-readout');
  const elongationValue = document.getElementById('elongation-value');
  const alignmentValue = document.getElementById('alignment-value');

  const solarSystemCanvas = document.getElementById('solar-system');
  const solarSystemCtx = solarSystemCanvas.getContext('2d');
  const graphCanvas = document.getElementById('retrograde-graph');
  const graphCtx = graphCanvas.getContext('2d');
  const zodiacCanvas = document.getElementById('zodiac-strip');
  const zodiacCtx = zodiacCanvas.getContext('2d');

  const EARTH_COLOR = '#2a6bd6';
  const MARS_COLOR = '#c0392b';

  function normalizeDeg(deg) {
    return ((deg % 360) + 360) % 360;
  }

  function dateForDayOffset(dayOffset) {
    return new Date(REFERENCE_START.getTime() + dayOffset * 86400000);
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }

  // --- Precompute the whole apparent-longitude curve once; only the
  // "current" marker moves as the slider/animation advances. Unwrapped
  // (not clamped to 0-360) so the retrograde dip reads as a continuous
  // bend in the line rather than a jump at the 360/0 wraparound.
  const CURVE_STEP_DAYS = 2;
  const curveDays = [];
  const curveLongitudes = [];
  (function precomputeCurve() {
    let cumulative = null;
    let prevRaw = null;
    for (let d = 0; d <= RANGE_DAYS; d += CURVE_STEP_DAYS) {
      const raw = PlanetaryMotion.apparentGeocentricLongitude('mars', dateForDayOffset(d));
      if (cumulative === null) {
        cumulative = raw;
      } else {
        let delta = raw - prevRaw;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        cumulative += delta;
      }
      prevRaw = raw;
      curveDays.push(d);
      curveLongitudes.push(cumulative);
    }
  })();

  // The exact current-day value, unwrapped onto the same branch as the
  // cached curve (the slider moves in 1-day steps; the cache is every
  // CURVE_STEP_DAYS, so this rarely lands exactly on a cached sample).
  function apparentLongitudeAtDay(dayOffset) {
    const raw = PlanetaryMotion.apparentGeocentricLongitude('mars', dateForDayOffset(dayOffset));
    const idx = Math.max(0, Math.min(curveDays.length - 1, Math.round(dayOffset / CURVE_STEP_DAYS)));
    const nearest = curveLongitudes[idx];
    let delta = raw - normalizeDeg(nearest);
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return nearest + delta;
  }

  // --- Solar system top-down view ---------------------------------

  function drawSolarSystem(dayOffset) {
    const date = dateForDayOffset(dayOffset);
    const width = solarSystemCanvas.width;
    const height = solarSystemCanvas.height;
    const cx = width / 2;
    const cy = height / 2;
    solarSystemCtx.clearRect(0, 0, width, height);

    const marsOrbitPx = 150;
    const pxPerAU = marsOrbitPx / PlanetaryMotion.PLANETS.mars.orbitalRadiusAU;
    const earthOrbitPx = pxPerAU * PlanetaryMotion.PLANETS.earth.orbitalRadiusAU;

    // Background stars ring — what the sightline below is projected onto.
    solarSystemCtx.beginPath();
    solarSystemCtx.arc(cx, cy, marsOrbitPx + 25, 0, Math.PI * 2);
    solarSystemCtx.strokeStyle = '#d6dfe8';
    solarSystemCtx.lineWidth = 1;
    solarSystemCtx.stroke();

    // Both orbits, to scale with each other
    [
      { radius: earthOrbitPx, color: EARTH_COLOR },
      { radius: marsOrbitPx, color: MARS_COLOR },
    ].forEach(({ radius, color }) => {
      solarSystemCtx.beginPath();
      solarSystemCtx.arc(cx, cy, radius, 0, Math.PI * 2);
      solarSystemCtx.strokeStyle = color;
      solarSystemCtx.lineWidth = 1.5;
      solarSystemCtx.setLineDash([4, 4]);
      solarSystemCtx.stroke();
      solarSystemCtx.setLineDash([]);
    });

    const earthAU = PlanetaryMotion.heliocentricPosition('earth', date);
    const marsAU = PlanetaryMotion.heliocentricPosition('mars', date);
    const earthPx = { x: cx + earthAU.x * pxPerAU, y: cy - earthAU.y * pxPerAU };
    const marsPx = { x: cx + marsAU.x * pxPerAU, y: cy - marsAU.y * pxPerAU };

    // Sightline from Earth through Mars, extended to the background
    // stars — this direction is exactly what apparentGeocentricLongitude
    // computes.
    const dx = marsPx.x - earthPx.x;
    const dy = marsPx.y - earthPx.y;
    const len = Math.hypot(dx, dy) || 1;
    const extended = { x: earthPx.x + (dx / len) * (marsOrbitPx * 3), y: earthPx.y + (dy / len) * (marsOrbitPx * 3) };
    solarSystemCtx.beginPath();
    solarSystemCtx.moveTo(earthPx.x, earthPx.y);
    solarSystemCtx.lineTo(extended.x, extended.y);
    solarSystemCtx.strokeStyle = '#8a97a5';
    solarSystemCtx.lineWidth = 1;
    solarSystemCtx.stroke();

    // Sightline from Earth to the Sun — the other side of the
    // elongation angle.
    solarSystemCtx.beginPath();
    solarSystemCtx.moveTo(earthPx.x, earthPx.y);
    solarSystemCtx.lineTo(cx, cy);
    solarSystemCtx.strokeStyle = '#d6c26a';
    solarSystemCtx.lineWidth = 1;
    solarSystemCtx.setLineDash([2, 3]);
    solarSystemCtx.stroke();
    solarSystemCtx.setLineDash([]);

    // Sun
    solarSystemCtx.beginPath();
    solarSystemCtx.arc(cx, cy, 9, 0, Math.PI * 2);
    solarSystemCtx.fillStyle = '#f5a623';
    solarSystemCtx.fill();
    solarSystemCtx.strokeStyle = '#c9820a';
    solarSystemCtx.lineWidth = 1.5;
    solarSystemCtx.stroke();

    // Earth
    solarSystemCtx.beginPath();
    solarSystemCtx.arc(earthPx.x, earthPx.y, 6, 0, Math.PI * 2);
    solarSystemCtx.fillStyle = EARTH_COLOR;
    solarSystemCtx.fill();
    solarSystemCtx.strokeStyle = '#173d75';
    solarSystemCtx.lineWidth = 1.5;
    solarSystemCtx.stroke();

    // Mars
    solarSystemCtx.beginPath();
    solarSystemCtx.arc(marsPx.x, marsPx.y, 6, 0, Math.PI * 2);
    solarSystemCtx.fillStyle = MARS_COLOR;
    solarSystemCtx.fill();
    solarSystemCtx.strokeStyle = '#7b2a1c';
    solarSystemCtx.lineWidth = 1.5;
    solarSystemCtx.stroke();

    // Labels
    solarSystemCtx.font = '600 12px sans-serif';
    solarSystemCtx.textBaseline = 'middle';
    solarSystemCtx.fillStyle = '#8a5b00';
    solarSystemCtx.textAlign = 'center';
    solarSystemCtx.fillText('Sun', cx, cy + 22);
    solarSystemCtx.fillStyle = EARTH_COLOR;
    solarSystemCtx.textAlign = earthPx.x >= cx ? 'left' : 'right';
    solarSystemCtx.fillText('Earth', earthPx.x + (earthPx.x >= cx ? 9 : -9), earthPx.y);
    solarSystemCtx.fillStyle = MARS_COLOR;
    solarSystemCtx.textAlign = marsPx.x >= cx ? 'left' : 'right';
    solarSystemCtx.fillText('Mars', marsPx.x + (marsPx.x >= cx ? 9 : -9), marsPx.y);
  }

  // --- Zodiac strip: Mars's current wrapped position among the 12
  // zodiac constellations along the ecliptic ------------------------

  const ZODIAC_MARKER_HEIGHT = 12;

  function drawZodiacStrip(dayOffset) {
    const width = zodiacCanvas.width;
    const height = zodiacCanvas.height;
    const stripTop = ZODIAC_MARKER_HEIGHT;
    const stripHeight = height - stripTop;
    zodiacCtx.clearRect(0, 0, width, height);

    const signs = PlanetaryMotion.ZODIAC_SIGNS;
    const segmentWidth = width / signs.length;

    signs.forEach((sign, i) => {
      zodiacCtx.fillStyle = i % 2 === 0 ? '#f7f2fb' : '#efe6f6';
      zodiacCtx.fillRect(i * segmentWidth, stripTop, segmentWidth, stripHeight);
      zodiacCtx.strokeStyle = '#ddd0e8';
      zodiacCtx.lineWidth = 1;
      zodiacCtx.strokeRect(i * segmentWidth, stripTop, segmentWidth, stripHeight);
      zodiacCtx.fillStyle = '#7a6a88';
      zodiacCtx.font = '10px sans-serif';
      zodiacCtx.textAlign = 'center';
      zodiacCtx.textBaseline = 'middle';
      zodiacCtx.fillText(sign, i * segmentWidth + segmentWidth / 2, stripTop + stripHeight / 2);
    });

    // Current-date marker: a vertical line through the strip, capped
    // with a small downward-pointing triangle above it, at Mars's
    // current wrapped apparent longitude.
    const lon = normalizeDeg(PlanetaryMotion.apparentGeocentricLongitude('mars', dateForDayOffset(dayOffset)));
    const markerX = (lon / 360) * width;
    zodiacCtx.strokeStyle = MARS_COLOR;
    zodiacCtx.lineWidth = 2;
    zodiacCtx.beginPath();
    zodiacCtx.moveTo(markerX, stripTop);
    zodiacCtx.lineTo(markerX, height);
    zodiacCtx.stroke();
    zodiacCtx.fillStyle = MARS_COLOR;
    zodiacCtx.beginPath();
    zodiacCtx.moveTo(markerX - 6, 0);
    zodiacCtx.lineTo(markerX + 6, 0);
    zodiacCtx.lineTo(markerX, stripTop);
    zodiacCtx.closePath();
    zodiacCtx.fill();
  }

  // --- Retrograde-loop graph ---------------------------------------

  const GRAPH_MARGIN = { left: 55, right: 20, top: 15, bottom: 30 };

  function graphXForDay(day) {
    const plotWidth = graphCanvas.width - GRAPH_MARGIN.left - GRAPH_MARGIN.right;
    return GRAPH_MARGIN.left + (day / RANGE_DAYS) * plotWidth;
  }

  let graphYMin = Math.min(...curveLongitudes);
  let graphYMax = Math.max(...curveLongitudes);
  (function padYRange() {
    const pad = (graphYMax - graphYMin) * 0.05;
    graphYMin -= pad;
    graphYMax += pad;
  })();

  function graphYForLongitude(lon) {
    const plotHeight = graphCanvas.height - GRAPH_MARGIN.top - GRAPH_MARGIN.bottom;
    return GRAPH_MARGIN.top + (1 - (lon - graphYMin) / (graphYMax - graphYMin)) * plotHeight;
  }

  function drawRetrogradeGraph(dayOffset) {
    const width = graphCanvas.width;
    const height = graphCanvas.height;
    graphCtx.clearRect(0, 0, width, height);

    // Y gridlines every 90 degrees, labelled with the wrapped (0-360)
    // value — the axis itself is unwrapped, but a raw 0-360 degree
    // reading is what a student can actually check against the sky.
    graphCtx.strokeStyle = '#e5e9ee';
    graphCtx.fillStyle = '#8a97a5';
    graphCtx.font = '11px sans-serif';
    graphCtx.textAlign = 'right';
    graphCtx.textBaseline = 'middle';
    const gridStart = Math.ceil(graphYMin / 90) * 90;
    for (let v = gridStart; v <= graphYMax; v += 90) {
      const y = graphYForLongitude(v);
      graphCtx.beginPath();
      graphCtx.moveTo(GRAPH_MARGIN.left, y);
      graphCtx.lineTo(width - GRAPH_MARGIN.right, y);
      graphCtx.stroke();
      graphCtx.fillText(`${Math.round(normalizeDeg(v))}°`, GRAPH_MARGIN.left - 8, y);
    }

    // X-axis date labels, every 180 days
    graphCtx.textAlign = 'center';
    graphCtx.textBaseline = 'top';
    for (let d = 0; d <= RANGE_DAYS; d += 180) {
      graphCtx.fillText(formatDate(dateForDayOffset(d)), graphXForDay(d), height - GRAPH_MARGIN.bottom + 6);
    }

    // The curve itself, colour-coded: amber for normal (prograde,
    // eastward) drift, red for the retrograde loop.
    for (let i = 1; i < curveDays.length; i++) {
      const retrograde = curveLongitudes[i] < curveLongitudes[i - 1];
      graphCtx.beginPath();
      graphCtx.moveTo(graphXForDay(curveDays[i - 1]), graphYForLongitude(curveLongitudes[i - 1]));
      graphCtx.lineTo(graphXForDay(curveDays[i]), graphYForLongitude(curveLongitudes[i]));
      graphCtx.strokeStyle = retrograde ? MARS_COLOR : '#f5a623';
      graphCtx.lineWidth = retrograde ? 3 : 2;
      graphCtx.stroke();
    }

    // Current-date marker
    const mx = graphXForDay(dayOffset);
    const my = graphYForLongitude(apparentLongitudeAtDay(dayOffset));
    graphCtx.beginPath();
    graphCtx.moveTo(mx, GRAPH_MARGIN.top);
    graphCtx.lineTo(mx, height - GRAPH_MARGIN.bottom);
    graphCtx.strokeStyle = '#b8c2cc';
    graphCtx.lineWidth = 1;
    graphCtx.stroke();
    graphCtx.beginPath();
    graphCtx.arc(mx, my, 6, 0, Math.PI * 2);
    graphCtx.fillStyle = EARTH_COLOR;
    graphCtx.fill();
    graphCtx.strokeStyle = '#173d75';
    graphCtx.lineWidth = 1.5;
    graphCtx.stroke();

    // Axis labels
    graphCtx.fillStyle = '#555';
    graphCtx.font = '11px sans-serif';
    graphCtx.textAlign = 'center';
    graphCtx.textBaseline = 'top';
    graphCtx.fillText('Date', width / 2, height - GRAPH_MARGIN.bottom + 18);
    graphCtx.save();
    graphCtx.translate(16, height / 2);
    graphCtx.rotate(-Math.PI / 2);
    graphCtx.textAlign = 'center';
    graphCtx.textBaseline = 'middle';
    graphCtx.fillText("Mars's apparent position among the stars", 0, 0);
    graphCtx.restore();
  }

  // --- Main update loop -------------------------------------------

  function alignmentText(classification) {
    if (classification.type === 'opposition') {
      return 'Opposition — Mars is opposite the Sun in the sky: at its closest, brightest, and up all night.';
    }
    if (classification.type === 'conjunction') {
      return "Conjunction — Mars is behind the Sun from Earth's point of view: lost in its glare, not visible.";
    }
    return `Elongation — Mars is ${classification.elongationDeg.toFixed(0)}° from the Sun in the sky.`;
  }

  function update() {
    const dayOffset = Number(dateSlider.value);
    const date = dateForDayOffset(dayOffset);
    dateLabel.textContent = formatDate(date);

    const classification = PlanetaryMotion.classifyAlignment('mars', date);
    elongationValue.textContent = `${classification.elongationDeg.toFixed(1)}°`;
    alignmentValue.textContent = classification.type.charAt(0).toUpperCase() + classification.type.slice(1);
    alignmentReadout.textContent = alignmentText(classification);

    drawSolarSystem(dayOffset);
    drawZodiacStrip(dayOffset);
    drawRetrogradeGraph(dayOffset);
  }

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  // --- Animation: advance the date slider automatically, looping back
  // to the start of the range. Setting .value programmatically doesn't
  // fire the slider's own 'input' event, so this can't fight with the
  // "stop on manual drag" handler below.

  const DAYS_PER_FRAME = 3;
  let animationFrameId = null;

  function stopAnimation() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    playButton.textContent = '▶ Animate';
    playButton.setAttribute('aria-pressed', 'false');
  }

  function startAnimation() {
    playButton.textContent = '❚❚ Pause';
    playButton.setAttribute('aria-pressed', 'true');
    function step() {
      let next = Number(dateSlider.value) + DAYS_PER_FRAME;
      if (next > RANGE_DAYS) next = 0;
      dateSlider.value = next;
      update();
      animationFrameId = requestAnimationFrame(step);
    }
    animationFrameId = requestAnimationFrame(step);
  }

  playButton.addEventListener('click', () => {
    if (animationFrameId !== null) {
      stopAnimation();
    } else {
      startAnimation();
    }
  });

  dateSlider.addEventListener('input', () => {
    stopAnimation();
    update();
  });

  // --- Tap-to-reveal glossary ----------------------------------------
  const GLOSSARY = {
    elongation:
      'Elongation: the angle, seen from Earth, between the Sun and a planet. 0° is conjunction, 180° is opposition — anything in between is described by its elongation angle.',
    alignment:
      "Conjunction: planet and Sun in the same direction (hidden in the Sun's glare). Opposition: planet opposite the Sun (closest, brightest, up all night) — only possible for a planet farther from the Sun than Earth. Elongation: any other angle between them.",
    retrograde:
      "Retrograde motion: a planet's apparent backward drift against the background stars, caused by Earth overtaking it on a faster, inner orbit — an illusion of relative motion, not a real reversal of the planet's own orbit.",
    opposition:
      "Opposition: the planet is opposite the Sun in Earth's sky (elongation 180°). It's then at its closest to Earth, appears biggest and brightest, and is visible all night.",
    synodic:
      "Synodic period: the time between two successive identical alignments (e.g. opposition to opposition) — longer than either planet's own orbital period, since it depends on how fast Earth catches up to the other planet.",
    ecliptic:
      "The ecliptic: the projection of Earth's orbital plane onto the sky — the path the Sun appears to trace against the background stars over a year. In this coplanar model, every body's apparent position lies exactly on it.",
    zodiac:
      'The zodiacal band: a strip of sky centred on the ecliptic, home to the twelve zodiac constellations. Because the Sun, Moon and planets all orbit close to the same plane, they are always found within this band.',
  };

  update();
  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(PlanetaryMotionQuestions.makeQuestions(PlanetaryMotion));
})();
