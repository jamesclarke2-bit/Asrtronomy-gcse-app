(function () {
  const YEAR = 2026;
  const CURRICULUM_UNITS = ['u1.11', 'u2.9', 'u2.5', 'u2.11', 'u2.12', 'u2.13', 'u2.14', 'u5.4'];

  const dateSlider = document.getElementById('date-slider');
  const dateLabel = document.getElementById('date-label');
  const latSlider = document.getElementById('lat-slider');
  const latLabel = document.getElementById('lat-label');
  const declinationReadout = document.getElementById('declination-readout');

  const poleLegendLabel = document.getElementById('pole-legend-label');
  const poleAltitudeValue = document.getElementById('pole-altitude-value');
  const equatorAltitudeValue = document.getElementById('equator-altitude-value');
  const sunAltitudeValue = document.getElementById('sun-altitude-value');

  const meridianCanvas = document.getElementById('sun-meridian');
  const meridianCtx = meridianCanvas.getContext('2d');
  const orbitCanvas = document.getElementById('orbit');

  const butterflyCanvas = document.getElementById('butterfly-graph');
  const butterflyCtx = butterflyCanvas.getContext('2d');
  const butterflyYearSlider = document.getElementById('butterfly-year-slider');
  const butterflyYearLabel = document.getElementById('butterfly-year-label');
  const butterflyReadout = document.getElementById('butterfly-readout');

  // Same colour convention as coordinates.html: blue for facts that
  // depend on the observer (pole, equator), amber for facts that depend
  // on the Sun (here, its declination and transit position).
  const OBSERVER_COLOR = '#2a6bd6';
  const SUN_COLOR = '#f5a623';

  // Same rule as coordinates.js's getElevatedPole: whichever celestial
  // pole is actually above the horizon from this latitude.
  function getElevatedPole(lat) {
    if (lat >= 0) {
      return { altitude: lat, azimuth: 0, code: 'NCP' };
    }
    return { altitude: -lat, azimuth: 180, code: 'SCP' };
  }

  function dayOfYearToUTCDate(year, dayIndex) {
    const d = new Date(Date.UTC(year, 0, 1));
    d.setUTCDate(d.getUTCDate() + dayIndex);
    return d;
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  }

  // --- Meridian cross-section: pole, equator and the Sun at transit ----
  // Exactly the same rendering approach as coordinates.js's meridian
  // diagram (a side-on view of the S-zenith-N great circle), with the
  // Sun's declination standing in for a star's — there's no lower-transit
  // branch here since this page isn't about circumpolarity, and no hour
  // angle input, since the Sun is always shown at transit (HA 0).

  const MERIDIAN_CX = meridianCanvas.width / 2;
  const MERIDIAN_CY = 185;
  const MERIDIAN_R = 140;

  function meridianSide(azimuth) {
    return azimuth > 90 && azimuth < 270 ? 'S' : 'N';
  }

  function meridianPoint(altitude, azimuth) {
    const side = meridianSide(azimuth);
    const phiDeg = side === 'N' ? altitude : 180 - altitude;
    const phi = (phiDeg * Math.PI) / 180;
    return {
      x: MERIDIAN_CX + MERIDIAN_R * Math.cos(phi),
      y: Math.min(MERIDIAN_CY - MERIDIAN_R * Math.sin(phi), meridianCanvas.height - 10),
    };
  }

  function drawMeridianFeature(altitude, azimuth, color, labelText) {
    const point = meridianPoint(altitude, azimuth);
    meridianCtx.beginPath();
    meridianCtx.moveTo(MERIDIAN_CX, MERIDIAN_CY);
    meridianCtx.lineTo(point.x, point.y);
    meridianCtx.strokeStyle = color;
    meridianCtx.lineWidth = 1.5;
    meridianCtx.setLineDash([4, 3]);
    meridianCtx.stroke();
    meridianCtx.setLineDash([]);

    meridianCtx.beginPath();
    meridianCtx.arc(point.x, point.y, 6, 0, Math.PI * 2);
    meridianCtx.fillStyle = color;
    meridianCtx.fill();
    meridianCtx.strokeStyle = '#222';
    meridianCtx.lineWidth = 1;
    meridianCtx.stroke();

    if (labelText) {
      meridianCtx.fillStyle = color;
      meridianCtx.font = '600 10px sans-serif';
      meridianCtx.textAlign = 'center';
      meridianCtx.textBaseline = 'bottom';
      meridianCtx.fillText(labelText, point.x, point.y - 9);
    }
  }

  function drawMeridian(dec, lat) {
    const width = meridianCanvas.width;
    const height = meridianCanvas.height;
    meridianCtx.clearRect(0, 0, width, height);

    meridianCtx.fillStyle = '#efe9dc';
    meridianCtx.fillRect(0, MERIDIAN_CY, width, height - MERIDIAN_CY);

    [30, 60].forEach((alt) => {
      ['N', 'S'].forEach((side) => {
        const azimuth = side === 'N' ? 0 : 180;
        const { x, y } = meridianPoint(alt, azimuth);
        meridianCtx.beginPath();
        meridianCtx.arc(x, y, 2, 0, Math.PI * 2);
        meridianCtx.fillStyle = '#b8c2cc';
        meridianCtx.fill();
        meridianCtx.fillStyle = '#8a97a5';
        meridianCtx.font = '10px sans-serif';
        meridianCtx.textAlign = side === 'N' ? 'left' : 'right';
        meridianCtx.textBaseline = 'middle';
        meridianCtx.fillText(`${alt}°`, x + (side === 'N' ? 7 : -7), y);
      });
    });

    meridianCtx.beginPath();
    meridianCtx.arc(MERIDIAN_CX, MERIDIAN_CY, MERIDIAN_R, Math.PI, 2 * Math.PI, false);
    meridianCtx.strokeStyle = '#8a97a5';
    meridianCtx.lineWidth = 1.5;
    meridianCtx.stroke();

    meridianCtx.beginPath();
    meridianCtx.moveTo(MERIDIAN_CX - MERIDIAN_R - 20, MERIDIAN_CY);
    meridianCtx.lineTo(MERIDIAN_CX + MERIDIAN_R + 20, MERIDIAN_CY);
    meridianCtx.strokeStyle = '#555';
    meridianCtx.lineWidth = 2;
    meridianCtx.stroke();

    meridianCtx.fillStyle = '#333';
    meridianCtx.font = '600 14px sans-serif';
    meridianCtx.textBaseline = 'middle';
    meridianCtx.textAlign = 'right';
    meridianCtx.fillText('S', MERIDIAN_CX - MERIDIAN_R - 26, MERIDIAN_CY);
    meridianCtx.textAlign = 'left';
    meridianCtx.fillText('N', MERIDIAN_CX + MERIDIAN_R + 26, MERIDIAN_CY);
    // Extra vertical clearance (not just the usual 8px) — a feature very
    // close to the zenith (the Sun near 90° altitude, exactly the
    // Tropic-of-Capricorn-at-solstice case this page is built around)
    // gets its own label centred just above that same point, and the two
    // would otherwise overlap illegibly.
    meridianCtx.textAlign = 'center';
    meridianCtx.textBaseline = 'bottom';
    meridianCtx.fillText('Zenith', MERIDIAN_CX, MERIDIAN_CY - MERIDIAN_R - 22);

    const pole = getElevatedPole(lat);
    drawMeridianFeature(pole.altitude, pole.azimuth, OBSERVER_COLOR, `${pole.code} ${pole.altitude.toFixed(1)}°`);
    const equator = Coordinates.getAltAz(0, 0, lat);
    drawMeridianFeature(equator.altitude, equator.azimuth, OBSERVER_COLOR, `Equator ${equator.altitude.toFixed(1)}°`);

    const sunTransit = Coordinates.getAltAz(dec, 0, lat);
    drawMeridianFeature(sunTransit.altitude, sunTransit.azimuth, SUN_COLOR, `Sun ${sunTransit.altitude.toFixed(1)}°`);

    poleLegendLabel.textContent = pole.code;
    poleAltitudeValue.textContent = `${pole.altitude.toFixed(1)}°`;
    equatorAltitudeValue.textContent = `${equator.altitude.toFixed(1)}°`;
    sunAltitudeValue.textContent = `${sunTransit.altitude.toFixed(1)}°${sunTransit.altitude < 0 ? ' (below horizon)' : ''}`;
  }

  // --- Butterfly diagram --------------------------------------------
  // Three successive cycles (schematic — see src/butterflyDiagram.js for
  // the shared start-latitude/cycle-length model this and the practice
  // questions both use), each with a scatter of sunspots in both
  // hemispheres, randomly jittered around the smooth envelope so the
  // plot reads as an actual scatter rather than a clean curve.
  const BUTTERFLY_CYCLE_COUNT = 3;
  const BUTTERFLY_MAX_YEAR = BUTTERFLY_CYCLE_COUNT * ButterflyDiagram.CYCLE_LENGTH_YEARS;
  const BUTTERFLY_POINTS_PER_CYCLE = 90;

  function seededRandom(seed) {
    // Deterministic (not Math.random()) so the scatter doesn't
    // reshuffle itself on every reload.
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  const BUTTERFLY_POINTS = (function precomputeButterflyPoints() {
    const points = [];
    const rand = seededRandom(42);
    for (let cycle = 0; cycle < BUTTERFLY_CYCLE_COUNT; cycle++) {
      const cycleStartYear = cycle * ButterflyDiagram.CYCLE_LENGTH_YEARS;
      for (let i = 0; i < BUTTERFLY_POINTS_PER_CYCLE; i++) {
        const t = rand() * ButterflyDiagram.CYCLE_LENGTH_YEARS;
        const envelope = ButterflyDiagram.latitudeEnvelopeDeg(t);
        const jitter = (rand() - 0.5) * 6;
        const hemisphere = rand() < 0.5 ? 1 : -1;
        points.push({ year: cycleStartYear + t, latitude: hemisphere * Math.max(1, envelope + jitter) });
      }
    }
    return points;
  })();

  function drawButterfly(selectedYear) {
    const width = butterflyCanvas.width;
    const height = butterflyCanvas.height;
    const marginLeft = 45;
    const marginRight = 15;
    const marginTop = 15;
    const marginBottom = 30;
    const plotWidth = width - marginLeft - marginRight;
    const plotHeight = height - marginTop - marginBottom;
    const minLat = -40;
    const maxLat = 40;

    const xForYear = (year) => marginLeft + (year / BUTTERFLY_MAX_YEAR) * plotWidth;
    const yForLat = (lat) => marginTop + (1 - (lat - minLat) / (maxLat - minLat)) * plotHeight;

    butterflyCtx.clearRect(0, 0, width, height);

    // Gridlines: latitude every 10 degrees, years at each cycle boundary
    butterflyCtx.strokeStyle = '#e5e9ee';
    butterflyCtx.fillStyle = '#8a97a5';
    butterflyCtx.font = '11px sans-serif';
    butterflyCtx.textAlign = 'right';
    butterflyCtx.textBaseline = 'middle';
    for (let lat = minLat; lat <= maxLat; lat += 10) {
      const y = yForLat(lat);
      butterflyCtx.beginPath();
      butterflyCtx.moveTo(marginLeft, y);
      butterflyCtx.lineTo(width - marginRight, y);
      butterflyCtx.stroke();
      butterflyCtx.fillText(`${lat}°`, marginLeft - 8, y);
    }
    butterflyCtx.strokeStyle = '#b8c2cc';
    butterflyCtx.lineWidth = 1.5;
    butterflyCtx.beginPath();
    butterflyCtx.moveTo(marginLeft, yForLat(0));
    butterflyCtx.lineTo(width - marginRight, yForLat(0));
    butterflyCtx.stroke();
    butterflyCtx.lineWidth = 1;

    butterflyCtx.textAlign = 'center';
    butterflyCtx.textBaseline = 'top';
    for (let cycle = 0; cycle <= BUTTERFLY_CYCLE_COUNT; cycle++) {
      const year = cycle * ButterflyDiagram.CYCLE_LENGTH_YEARS;
      butterflyCtx.fillText(String(year), xForYear(year), height - marginBottom + 6);
    }

    // The scatter itself
    BUTTERFLY_POINTS.forEach(({ year, latitude }) => {
      butterflyCtx.beginPath();
      butterflyCtx.arc(xForYear(year), yForLat(latitude), 2.3, 0, Math.PI * 2);
      butterflyCtx.fillStyle = latitude >= 0 ? '#f5a623' : '#c0674a';
      butterflyCtx.fill();
    });

    // Selected-year marker, following the smooth envelope in both
    // hemispheres so it's easy to read a value straight off it.
    const yearsIntoCycle = selectedYear % ButterflyDiagram.CYCLE_LENGTH_YEARS;
    const envelope = ButterflyDiagram.latitudeEnvelopeDeg(yearsIntoCycle);
    const markerX = xForYear(selectedYear);
    butterflyCtx.strokeStyle = '#173d75';
    butterflyCtx.lineWidth = 1.5;
    butterflyCtx.setLineDash([4, 3]);
    butterflyCtx.beginPath();
    butterflyCtx.moveTo(markerX, marginTop);
    butterflyCtx.lineTo(markerX, height - marginBottom);
    butterflyCtx.stroke();
    butterflyCtx.setLineDash([]);
    [envelope, -envelope].forEach((lat) => {
      butterflyCtx.beginPath();
      butterflyCtx.arc(markerX, yForLat(lat), 5, 0, Math.PI * 2);
      butterflyCtx.fillStyle = '#2a6bd6';
      butterflyCtx.fill();
      butterflyCtx.strokeStyle = '#173d75';
      butterflyCtx.lineWidth = 1.5;
      butterflyCtx.stroke();
    });

    butterflyCtx.fillStyle = '#555';
    butterflyCtx.font = '11px sans-serif';
    butterflyCtx.textAlign = 'center';
    butterflyCtx.textBaseline = 'top';
    butterflyCtx.fillText('Year', width / 2, height - marginBottom + 18);
    butterflyCtx.save();
    butterflyCtx.translate(14, height / 2);
    butterflyCtx.rotate(-Math.PI / 2);
    butterflyCtx.textAlign = 'center';
    butterflyCtx.textBaseline = 'middle';
    butterflyCtx.fillText('Latitude', 0, 0);
    butterflyCtx.restore();
  }

  function updateButterfly() {
    const selectedYear = Number(butterflyYearSlider.value);
    butterflyYearLabel.textContent = String(selectedYear);
    const yearsIntoCycle = selectedYear % ButterflyDiagram.CYCLE_LENGTH_YEARS;
    const cycleNumber = Math.floor(selectedYear / ButterflyDiagram.CYCLE_LENGTH_YEARS) + 1;
    const envelope = ButterflyDiagram.latitudeEnvelopeDeg(yearsIntoCycle);
    butterflyReadout.textContent =
      `Cycle ${cycleNumber}, ${yearsIntoCycle} year${yearsIntoCycle === 1 ? '' : 's'} in: sunspots typically near ±${envelope.toFixed(0)}° latitude.`;
    drawButterfly(selectedYear);
  }

  // --- Main update loop -------------------------------------------------

  function update() {
    const dayIndex = Number(dateSlider.value);
    const lat = Number(latSlider.value);

    dateLabel.textContent = formatDate(dayOfYearToUTCDate(YEAR, dayIndex));
    latLabel.textContent = `${lat}°`;

    const date = dayOfYearToUTCDate(YEAR, dayIndex);
    // Declination depends only on the date, not the observer — lat/lon
    // here only affect the altitude/azimuth this function also returns,
    // which we don't use (Coordinates.getMaxAltitudeUpperTransit and
    // getAltAz below compute those properly, from the real latitude).
    const { declination } = SolarPosition.getSunPosition(date, 0, 0);
    declinationReadout.textContent = `Declination: ${declination >= 0 ? '+' : ''}${declination.toFixed(1)}°`;

    drawMeridian(declination, lat);
    OrbitPanel.draw(orbitCanvas, dayIndex);
  }

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  [dateSlider, latSlider].forEach((el) => el.addEventListener('input', update));
  butterflyYearSlider.addEventListener('input', updateButterfly);

  const GLOSSARY = {
    solarWind:
      "Solar wind: a continuous stream of charged particles (electrons, protons and alpha particles) escaping the corona at roughly 300-800 km/s, fast enough to overcome the Sun's gravity, flowing outward through the whole Solar System.",
    vanAllenBelts:
      "Van Allen belts: two doughnut-shaped regions where Earth's magnetic field traps charged particles from the solar wind — an inner belt (mostly protons) and an outer belt (mostly electrons).",
    core: 'Core: where nuclear fusion turns hydrogen into helium, releasing the Sun\'s energy at around 15 million °C.',
    radiative:
      'Radiative zone: energy moves outward as radiation, bouncing between particles so slowly it can take over 100,000 years to cross.',
    convective:
      'Convective zone: cooler, less dense plasma carries energy the rest of the way outward by convection currents, like water boiling in a pan.',
    photosphere: 'Photosphere: the visible "surface", about 5,500°C, where sunspots appear.',
    chromosphere: 'Chromosphere: a thin, hotter, reddish layer above the photosphere.',
    corona:
      'Corona: the Sun\'s outer atmosphere, a faint, wispy halo of gas at over a million °C, visible to the naked eye only during a total solar eclipse.',
    coronaHeating:
      "Beyond the spec — the coronal heating problem: the corona (over a million °C) is far hotter than the photosphere beneath it (about 5,500°C), even though it's further from the Sun's fusion-powered core. Two mechanisms are thought to contribute: wave heating, where magnetohydrodynamic (MHD) waves carry energy up along the Sun's magnetic field lines and dump it in the corona; and nanoflares, tiny, constant bursts of energy released when tangled magnetic field lines suddenly reconnect. Which mechanism dominates — or whether both do, in different regions — is still an open question in solar physics, not a single settled answer.",
  };

  update();
  updateButterfly();
  renderCoverage();
  QuizUI.mount([
    ...SunDeclinationQuestions.makeQuestions(SolarPosition, Coordinates),
    ...SolarActivityQuestions.makeQuestions(ButterflyDiagram),
  ]);
  Glossary.init(GLOSSARY);
})();
