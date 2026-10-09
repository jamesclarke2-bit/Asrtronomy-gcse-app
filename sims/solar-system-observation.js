(function () {
  const CURRICULUM_UNITS = ['u1.15', 'u1.16', 'u1.17'];
  const REFERENCE_START = new Date(Date.UTC(2026, 0, 1));
  const RANGE_DAYS = 1560;

  const dateSlider = document.getElementById('date-slider');
  const dateLabel = document.getElementById('date-label');
  const playButton = document.getElementById('play-button');
  const alignmentReadout = document.getElementById('alignment-readout');
  const elongationValue = document.getElementById('elongation-value');
  const alignmentValue = document.getElementById('alignment-value');
  const bestSeenValue = document.getElementById('best-seen-value');
  const planetOrbitSwatch = document.getElementById('planet-orbit-swatch');
  const planetOrbitLegendLabel = document.getElementById('planet-orbit-legend-label');
  const planetSelectorButtons = document.querySelectorAll('#planet-selector [data-planet]');
  const inferiorConfigsGrid = document.getElementById('inferior-configs');
  const superiorConfigsGrid = document.getElementById('superior-configs');
  const viewingSentence = document.getElementById('viewing-sentence');

  const solarSystemCanvas = document.getElementById('solar-system');
  const solarSystemCtx = solarSystemCanvas.getContext('2d');
  const graphCanvas = document.getElementById('retrograde-graph');
  const graphCtx = graphCanvas.getContext('2d');
  const zodiacCanvas = document.getElementById('zodiac-strip');
  const zodiacCtx = zodiacCanvas.getContext('2d');
  const horizonCanvas = document.getElementById('horizon-strip');
  const horizonCtx = horizonCanvas.getContext('2d');

  const EARTH_COLOR = '#2a6bd6';
  const SUN_COLOR = '#f5a623';
  const PLANET_COLORS = {
    mercury: '#8a97a5',
    venus: '#d6c26a',
    mars: '#c0392b',
  };
  const PLANET_LABELS = {
    mercury: 'Mercury',
    venus: 'Venus',
    mars: 'Mars',
  };

  const state = {
    planet: 'mars',
  };

  function planetColor() {
    return PLANET_COLORS[state.planet];
  }

  function normalizeDeg(deg) {
    return ((deg % 360) + 360) % 360;
  }

  function dateForDayOffset(dayOffset) {
    return new Date(REFERENCE_START.getTime() + dayOffset * 86400000);
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }

  // --- Precompute the whole apparent-longitude curve for the selected
  // planet; only the "current" marker moves as the slider/animation
  // advances. Unwrapped (not clamped to 0-360) so a retrograde dip reads
  // as a continuous bend in the line rather than a jump at the 360/0
  // wraparound. Recomputed whenever the selected planet changes.
  const CURVE_STEP_DAYS = 2;
  let curveDays = [];
  let curveLongitudes = [];
  let graphYMin = 0;
  let graphYMax = 360;

  function precomputeCurve() {
    curveDays = [];
    curveLongitudes = [];
    let cumulative = null;
    let prevRaw = null;
    for (let d = 0; d <= RANGE_DAYS; d += CURVE_STEP_DAYS) {
      const raw = PlanetaryMotion.apparentGeocentricLongitude(state.planet, dateForDayOffset(d));
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
    graphYMin = Math.min(...curveLongitudes);
    graphYMax = Math.max(...curveLongitudes);
    const pad = (graphYMax - graphYMin) * 0.05;
    graphYMin -= pad;
    graphYMax += pad;
  }

  // The exact current-day value, unwrapped onto the same branch as the
  // cached curve (the slider moves in 1-day steps; the cache is every
  // CURVE_STEP_DAYS, so this rarely lands exactly on a cached sample).
  function apparentLongitudeAtDay(dayOffset) {
    const raw = PlanetaryMotion.apparentGeocentricLongitude(state.planet, dateForDayOffset(dayOffset));
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

    const outerOrbitAU = Math.max(PlanetaryMotion.PLANETS[state.planet].orbitalRadiusAU, PlanetaryMotion.PLANETS.earth.orbitalRadiusAU);
    const outerOrbitPx = 150;
    const pxPerAU = outerOrbitPx / (outerOrbitAU * 1.08);
    const earthOrbitPx = pxPerAU * PlanetaryMotion.PLANETS.earth.orbitalRadiusAU;
    const planetOrbitPx = pxPerAU * PlanetaryMotion.PLANETS[state.planet].orbitalRadiusAU;

    // Background stars ring — what the sightline below is projected onto.
    solarSystemCtx.beginPath();
    solarSystemCtx.arc(cx, cy, outerOrbitPx * 1.08 + 25, 0, Math.PI * 2);
    solarSystemCtx.strokeStyle = '#d6dfe8';
    solarSystemCtx.lineWidth = 1;
    solarSystemCtx.stroke();

    // Both orbits, to scale with each other
    [
      { radius: earthOrbitPx, color: EARTH_COLOR },
      { radius: planetOrbitPx, color: planetColor() },
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
    const planetAU = PlanetaryMotion.heliocentricPosition(state.planet, date);
    const earthPx = { x: cx + earthAU.x * pxPerAU, y: cy - earthAU.y * pxPerAU };
    const planetPx = { x: cx + planetAU.x * pxPerAU, y: cy - planetAU.y * pxPerAU };

    // Sightline from Earth through the planet, extended to the
    // background stars — this direction is exactly what
    // apparentGeocentricLongitude computes.
    const dx = planetPx.x - earthPx.x;
    const dy = planetPx.y - earthPx.y;
    const len = Math.hypot(dx, dy) || 1;
    const extended = { x: earthPx.x + (dx / len) * (outerOrbitPx * 1.6), y: earthPx.y + (dy / len) * (outerOrbitPx * 1.6) };
    solarSystemCtx.beginPath();
    solarSystemCtx.moveTo(earthPx.x, earthPx.y);
    solarSystemCtx.lineTo(extended.x, extended.y);
    solarSystemCtx.strokeStyle = '#8a97a5';
    solarSystemCtx.lineWidth = 1;
    solarSystemCtx.stroke();

    // Sightline from Earth to the Sun — the other side of the
    // elongation angle.
    const sunDx = cx - earthPx.x;
    const sunDy = cy - earthPx.y;
    const sunLen = Math.hypot(sunDx, sunDy) || 1;
    const sunExtended = { x: earthPx.x + (sunDx / sunLen) * (outerOrbitPx * 1.6), y: earthPx.y + (sunDy / sunLen) * (outerOrbitPx * 1.6) };
    solarSystemCtx.beginPath();
    solarSystemCtx.moveTo(earthPx.x, earthPx.y);
    solarSystemCtx.lineTo(sunExtended.x, sunExtended.y);
    solarSystemCtx.strokeStyle = '#d6c26a';
    solarSystemCtx.lineWidth = 1;
    solarSystemCtx.setLineDash([2, 3]);
    solarSystemCtx.stroke();
    solarSystemCtx.setLineDash([]);

    // Elongation angle: a small arc at Earth's own vertex, between the
    // Sun sightline and the planet sightline. atan2 alone doesn't say
    // which way is the *short* way round — e.g. sun at 179° and planet
    // at -179° are only 2° apart, not 358° — so the signed short delta
    // is found explicitly first, and canvas's own arc() sweep direction
    // (anticlockwise, i.e. decreasing angle) is set to match its sign.
    const sunAngle = Math.atan2(sunDy, sunDx);
    const planetAngle = Math.atan2(dy, dx);
    let deltaAngle = planetAngle - sunAngle;
    while (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
    while (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;
    const planetAngleShort = sunAngle + deltaAngle;
    const arcRadius = 26;
    solarSystemCtx.beginPath();
    solarSystemCtx.arc(earthPx.x, earthPx.y, arcRadius, sunAngle, planetAngleShort, deltaAngle < 0);
    solarSystemCtx.strokeStyle = '#7a4fa3';
    solarSystemCtx.lineWidth = 2;
    solarSystemCtx.stroke();
    const elongation = PlanetaryMotion.elongationDeg(state.planet, date);
    const midAngle = sunAngle + deltaAngle / 2;
    solarSystemCtx.fillStyle = '#7a4fa3';
    solarSystemCtx.font = '600 11px sans-serif';
    solarSystemCtx.textAlign = 'center';
    solarSystemCtx.textBaseline = 'middle';
    solarSystemCtx.fillText(`${elongation.toFixed(0)}°`, earthPx.x + Math.cos(midAngle) * (arcRadius + 16), earthPx.y + Math.sin(midAngle) * (arcRadius + 16));

    // Sun
    solarSystemCtx.beginPath();
    solarSystemCtx.arc(cx, cy, 9, 0, Math.PI * 2);
    solarSystemCtx.fillStyle = SUN_COLOR;
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

    // Planet
    solarSystemCtx.beginPath();
    solarSystemCtx.arc(planetPx.x, planetPx.y, 6, 0, Math.PI * 2);
    solarSystemCtx.fillStyle = planetColor();
    solarSystemCtx.fill();
    solarSystemCtx.strokeStyle = '#2c2c2c';
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
    solarSystemCtx.fillStyle = '#444';
    solarSystemCtx.textAlign = planetPx.x >= cx ? 'left' : 'right';
    solarSystemCtx.fillText(PLANET_LABELS[state.planet], planetPx.x + (planetPx.x >= cx ? 9 : -9), planetPx.y);
  }

  // --- Zodiac strip: the selected planet's current wrapped position
  // among the 12 zodiac constellations along the ecliptic -------------

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

    const lon = normalizeDeg(PlanetaryMotion.apparentGeocentricLongitude(state.planet, dateForDayOffset(dayOffset)));
    const markerX = (lon / 360) * width;
    zodiacCtx.strokeStyle = planetColor();
    zodiacCtx.lineWidth = 2;
    zodiacCtx.beginPath();
    zodiacCtx.moveTo(markerX, stripTop);
    zodiacCtx.lineTo(markerX, height);
    zodiacCtx.stroke();
    zodiacCtx.fillStyle = planetColor();
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

  function graphYForLongitude(lon) {
    const plotHeight = graphCanvas.height - GRAPH_MARGIN.top - GRAPH_MARGIN.bottom;
    return GRAPH_MARGIN.top + (1 - (lon - graphYMin) / (graphYMax - graphYMin)) * plotHeight;
  }

  function drawRetrogradeGraph(dayOffset) {
    const width = graphCanvas.width;
    const height = graphCanvas.height;
    graphCtx.clearRect(0, 0, width, height);

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

    graphCtx.textAlign = 'center';
    graphCtx.textBaseline = 'top';
    for (let d = 0; d <= RANGE_DAYS; d += 180) {
      graphCtx.fillText(formatDate(dateForDayOffset(d)), graphXForDay(d), height - GRAPH_MARGIN.bottom + 6);
    }

    for (let i = 1; i < curveDays.length; i++) {
      const retrograde = curveLongitudes[i] < curveLongitudes[i - 1];
      graphCtx.beginPath();
      graphCtx.moveTo(graphXForDay(curveDays[i - 1]), graphYForLongitude(curveLongitudes[i - 1]));
      graphCtx.lineTo(graphXForDay(curveDays[i]), graphYForLongitude(curveLongitudes[i]));
      graphCtx.strokeStyle = retrograde ? planetColor() : '#f5a623';
      graphCtx.lineWidth = retrograde ? 3 : 2;
      graphCtx.stroke();
    }

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
    graphCtx.fillText(`${PLANET_LABELS[state.planet]}'s apparent position among the stars`, 0, 0);
    graphCtx.restore();
  }

  // --- Horizon strip: Sun and planet positions at sunset, midnight
  // and sunrise, for the selected date, driven by bestSeen() ----------

  function drawHorizonPanel(panelIndex, label, sunAboveHorizon, sunSide, planetAboveHorizon, planetSide, planetHigh) {
    const panelWidth = horizonCanvas.width / 3;
    const left = panelIndex * panelWidth;
    const groundY = 120;
    const skyTop = 20;

    horizonCtx.save();
    horizonCtx.translate(left, 0);

    horizonCtx.fillStyle = '#eaf2fb';
    horizonCtx.fillRect(4, skyTop, panelWidth - 8, groundY - skyTop);
    horizonCtx.fillStyle = '#e4e0d4';
    horizonCtx.fillRect(4, groundY, panelWidth - 8, 150 - groundY);
    horizonCtx.strokeStyle = '#8a97a5';
    horizonCtx.lineWidth = 1.5;
    horizonCtx.beginPath();
    horizonCtx.moveTo(4, groundY);
    horizonCtx.lineTo(panelWidth - 4, groundY);
    horizonCtx.stroke();

    horizonCtx.fillStyle = '#7a8699';
    horizonCtx.font = '10px sans-serif';
    horizonCtx.textAlign = 'left';
    horizonCtx.fillText('W', 10, groundY - 4);
    horizonCtx.textAlign = 'right';
    horizonCtx.fillText('E', panelWidth - 10, groundY - 4);

    function markerXForSide(side) {
      if (side === 'west') return panelWidth * 0.22;
      if (side === 'east') return panelWidth * 0.78;
      return panelWidth * 0.5;
    }

    // Sun
    const sunX = markerXForSide(sunSide);
    const sunY = sunAboveHorizon ? groundY - 22 : groundY + 16;
    horizonCtx.beginPath();
    horizonCtx.arc(sunX, sunY, 8, 0, Math.PI * 2);
    horizonCtx.fillStyle = sunAboveHorizon ? SUN_COLOR : 'rgba(245,166,35,0.35)';
    horizonCtx.fill();

    // Planet
    const planetX = markerXForSide(planetSide);
    const planetY = planetAboveHorizon ? (planetHigh ? skyTop + 14 : groundY - 22) : groundY + 16;
    horizonCtx.beginPath();
    horizonCtx.arc(planetX, planetY, 5, 0, Math.PI * 2);
    horizonCtx.fillStyle = planetAboveHorizon ? planetColor() : 'rgba(0,0,0,0.25)';
    horizonCtx.fill();

    horizonCtx.fillStyle = '#444';
    horizonCtx.font = '600 11px sans-serif';
    horizonCtx.textAlign = 'center';
    horizonCtx.fillText(label, panelWidth / 2, 12);

    horizonCtx.restore();
  }

  function drawHorizonStrip(dayOffset) {
    horizonCtx.clearRect(0, 0, horizonCanvas.width, horizonCanvas.height);
    const date = dateForDayOffset(dayOffset);
    const seen = PlanetaryMotion.bestSeen(state.planet, date);

    // Schematic only — not computed from real altitude/azimuth. Each
    // category tells a simple, consistent story across the three times:
    let sunset, midnight, sunrise;
    if (seen === 'all night') {
      sunset = { planetAbove: true, planetSide: 'east', planetHigh: false };
      midnight = { planetAbove: true, planetSide: 'center', planetHigh: true };
      sunrise = { planetAbove: true, planetSide: 'west', planetHigh: false };
    } else if (seen === 'evening sky') {
      // Higher up than the Sun's own horizon position, not stacked on
      // top of it — an inferior planet near greatest elongation is
      // noticeably above the horizon by the time the Sun has set.
      sunset = { planetAbove: true, planetSide: 'west', planetHigh: true };
      midnight = { planetAbove: false, planetSide: 'west', planetHigh: false };
      sunrise = { planetAbove: false, planetSide: 'west', planetHigh: false };
    } else if (seen === 'morning sky') {
      sunset = { planetAbove: false, planetSide: 'east', planetHigh: false };
      midnight = { planetAbove: false, planetSide: 'east', planetHigh: false };
      sunrise = { planetAbove: true, planetSide: 'east', planetHigh: true };
    } else {
      sunset = { planetAbove: false, planetSide: 'west', planetHigh: false };
      midnight = { planetAbove: false, planetSide: 'center', planetHigh: false };
      sunrise = { planetAbove: false, planetSide: 'east', planetHigh: false };
    }

    drawHorizonPanel(0, 'Sunset', true, 'west', sunset.planetAbove, sunset.planetSide, sunset.planetHigh);
    drawHorizonPanel(1, 'Midnight', false, 'center', midnight.planetAbove, midnight.planetSide, midnight.planetHigh);
    drawHorizonPanel(2, 'Sunrise', true, 'east', sunrise.planetAbove, sunrise.planetSide, sunrise.planetHigh);
  }

  function viewingSentenceText(seen) {
    const name = PLANET_LABELS[state.planet];
    if (seen === 'all night') return `${name} is at opposition: visible all night, highest around midnight.`;
    if (seen === 'evening sky') return `${name} is in the evening sky: look west after sunset.`;
    if (seen === 'morning sky') return `${name} is in the morning sky: look east before sunrise.`;
    return `${name} is too close to the Sun to see.`;
  }

  // --- Main update loop -------------------------------------------

  function alignmentText(configuration, elongation) {
    if (configuration === 'opposition') {
      return `Opposition — ${PLANET_LABELS[state.planet]} is opposite the Sun in the sky: at its closest, brightest, and up all night.`;
    }
    if (configuration === 'inferior conjunction') {
      return `Inferior conjunction — ${PLANET_LABELS[state.planet]} is passing between Earth and the Sun: lost in its glare.`;
    }
    if (configuration === 'superior conjunction') {
      return `Superior conjunction — ${PLANET_LABELS[state.planet]} is behind the Sun from Earth's point of view: lost in its glare.`;
    }
    if (configuration === 'conjunction') {
      return `Conjunction — ${PLANET_LABELS[state.planet]} is behind the Sun from Earth's point of view: lost in its glare.`;
    }
    if (configuration === 'greatest eastern elongation') {
      return `Greatest eastern elongation — ${PLANET_LABELS[state.planet]} is as far east of the Sun as its orbit allows.`;
    }
    if (configuration === 'greatest western elongation') {
      return `Greatest western elongation — ${PLANET_LABELS[state.planet]} is as far west of the Sun as its orbit allows.`;
    }
    return `${PLANET_LABELS[state.planet]} is ${elongation.toFixed(0)}° from the Sun in the sky.`;
  }

  function update() {
    const dayOffset = Number(dateSlider.value);
    const date = dateForDayOffset(dayOffset);
    dateLabel.textContent = formatDate(date);

    const elongation = PlanetaryMotion.elongationDeg(state.planet, date);
    const configuration = PlanetaryMotion.configurationName(state.planet, date);
    const seen = PlanetaryMotion.bestSeen(state.planet, date);

    elongationValue.textContent = `${elongation.toFixed(1)}°`;
    alignmentValue.textContent = configuration.charAt(0).toUpperCase() + configuration.slice(1);
    bestSeenValue.textContent = seen.charAt(0).toUpperCase() + seen.slice(1);
    alignmentReadout.textContent = alignmentText(configuration, elongation);
    viewingSentence.textContent = viewingSentenceText(seen);

    drawSolarSystem(dayOffset);
    drawZodiacStrip(dayOffset);
    drawRetrogradeGraph(dayOffset);
    drawHorizonStrip(dayOffset);
  }

  // --- Planet selector ------------------------------------------------

  function setPlanet(planetKey) {
    state.planet = planetKey;
    planetSelectorButtons.forEach((button) => {
      const active = button.dataset.planet === planetKey;
      button.classList.toggle('preset-button-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    planetOrbitSwatch.style.background = planetColor();
    planetOrbitLegendLabel.textContent = `${PLANET_LABELS[planetKey]}'s orbit`;

    const inferior = PlanetaryMotion.planetType(planetKey) === 'inferior';
    inferiorConfigsGrid.hidden = !inferior;
    superiorConfigsGrid.hidden = inferior;

    precomputeCurve();
    update();
  }

  planetSelectorButtons.forEach((button) => {
    button.addEventListener('click', () => {
      stopAnimation();
      setPlanet(button.dataset.planet);
    });
  });

  // --- "Jump to next occurrence" on each configuration card -----------
  //
  // Searches forward in absolute calendar days from the current slider
  // position for the next date classifyAlignment/configurationName
  // would call this configuration, then wraps the result back into the
  // slider's own [0, RANGE_DAYS] window by stepping back whole synodic
  // periods — the pattern repeats exactly on that period in this
  // circular model, so that's always a valid equivalent date.
  function synodicPeriodDaysFor(planetKey) {
    const planet = PlanetaryMotion.PLANETS[planetKey];
    const earth = PlanetaryMotion.PLANETS.earth;
    return 1 / Math.abs(1 / planet.orbitalPeriodDays - 1 / earth.orbitalPeriodDays);
  }

  function jumpToNextConfiguration(configurationName) {
    const startDay = Number(dateSlider.value);
    const maxSearchDays = Math.ceil(synodicPeriodDaysFor(state.planet) * 2) + 10;
    let foundDay = null;
    for (let offset = 1; offset <= maxSearchDays; offset += 1) {
      const day = startDay + offset;
      if (PlanetaryMotion.configurationName(state.planet, dateForDayOffset(day)) === configurationName) {
        foundDay = day;
        break;
      }
    }
    if (foundDay === null) return;

    const synodic = synodicPeriodDaysFor(state.planet);
    while (foundDay > RANGE_DAYS) foundDay -= synodic;
    while (foundDay < 0) foundDay += synodic;
    foundDay = Math.max(0, Math.min(RANGE_DAYS, Math.round(foundDay)));

    stopAnimation();
    dateSlider.value = foundDay;
    update();
  }

  document.querySelectorAll('.concept-card-button[data-jump]').forEach((button) => {
    button.addEventListener('click', () => jumpToNextConfiguration(button.dataset.jump));
  });

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
    retrograde:
      "Retrograde motion: a planet's apparent backward drift against the background stars, caused by Earth overtaking (or being overtaken by) it on a different orbit — an illusion of relative motion, not a real reversal of the planet's own orbit.",
    opposition:
      "Opposition: the planet is opposite the Sun in Earth's sky (elongation 180°). It's then at its closest to Earth, appears biggest and brightest, and is visible all night. Only a superior planet can reach it.",
    synodic:
      "Synodic period: the time between two successive identical alignments (e.g. opposition to opposition, or inferior conjunction to inferior conjunction) — different from either planet's own orbital period, since it depends on how fast Earth and the planet change places relative to each other.",
    ecliptic:
      "The ecliptic: the projection of Earth's orbital plane onto the sky — the path the Sun appears to trace against the background stars over a year. In this coplanar model, every body's apparent position lies exactly on it.",
    zodiac:
      'The zodiacal band: a strip of sky centred on the ecliptic, home to the twelve zodiac constellations. Because the Sun, Moon and planets all orbit close to the same plane, they are always found within this band.',
    'inferior-planet':
      "Inferior planet: a planet whose orbit lies inside Earth's — Mercury or Venus. It's always seen relatively close to the Sun in the sky, and can never reach opposition.",
    'superior-planet':
      "Superior planet: a planet whose orbit lies outside Earth's — Mars and beyond. It can reach any elongation from 0° up to 180° (opposition), unlike an inferior planet.",
  };

  setPlanet(state.planet);
  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(PlanetaryMotionQuestions.makeQuestions(PlanetaryMotion));
})();
