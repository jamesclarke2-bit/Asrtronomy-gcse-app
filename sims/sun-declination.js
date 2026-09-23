(function () {
  const YEAR = 2026;
  const CURRICULUM_UNITS = ['u1.11', 'u2.9', 'u2.5', 'u2.11', 'u2.12'];

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

  const GLOSSARY = {
    solarWind:
      'Solar wind: a continuous stream of charged particles (mostly protons and electrons) escaping the corona fast enough to overcome the Sun\'s gravity, flowing outward through the whole Solar System.',
  };

  update();
  renderCoverage();
  QuizUI.mount(SunDeclinationQuestions.makeQuestions(SolarPosition, Coordinates));
  Glossary.init(GLOSSARY);
})();
