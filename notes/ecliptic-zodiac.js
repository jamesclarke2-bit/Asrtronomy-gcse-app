(function () {
  const CURRICULUM_UNITS = ['u1.16', 'u2.29', 'u3.23'];
  const DEPS = { SolarPosition };

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  // --- The ecliptic band diagram -------------------------------------

  const canvas = document.getElementById('ecliptic-canvas');
  const ctx = canvas.getContext('2d');
  const dateSlider = document.getElementById('date-slider');
  const dateLabel = document.getElementById('date-label');
  const sunConstellationReadout = document.getElementById('sun-constellation-readout');
  const midnightConstellationReadout = document.getElementById('midnight-constellation-readout');

  const MARGIN = 20;
  const USABLE_WIDTH = canvas.width - 2 * MARGIN;
  const BAND_Y = 118;
  const BAND_HALF_HEIGHT = 15;
  const TILT_DEG = 23.5;
  const SEGMENT_FILLS = ['#eaf2fb', '#dfe9f6'];

  function longitudeToX(longitudeDeg) {
    return MARGIN + (longitudeDeg / 360) * USABLE_WIDTH;
  }

  function dateForDayOfYear(dayOfYear) {
    return new Date(Date.UTC(EclipticZodiac.REFERENCE_YEAR, 0, 1, 12, 0, 0) + dayOfYear * 86400000);
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  }

  // Four or five small, fixed, purely illustrative dots near the band —
  // not computed positions, just a picture of "wanders close to the
  // ecliptic", as the canvas's own aria-label already says in words.
  const DECORATIVE_WANDERERS = [0.12, 0.3, 0.47, 0.63, 0.8, 0.92].map((frac, i) => ({
    xFrac: frac,
    yOffset: i % 2 === 0 ? -9 : 7,
  }));

  function drawEclipticBand(dayOfYear) {
    const date = dateForDayOfYear(dayOfYear);
    const sunLongitude = SolarPosition.getSunPosition(date, 0, 0).apparentLongitude;
    const sunName = EclipticZodiac.sunConstellation(date, DEPS);
    const midnightName = EclipticZodiac.midnightConstellation(date, DEPS);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f7f9fc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- The 13 IAU segments, alternately shaded, with a tick + label
    // in one of two staggered rows above the band (room for narrow
    // segments like Scorpius, whose own width can't fit its own label).
    const boundaries = EclipticZodiac.boundariesByLongitude(DEPS);
    const segments = boundaries.map((b, i) => {
      const start = b.longitudeDeg;
      const end = i + 1 < boundaries.length ? boundaries[i + 1].longitudeDeg : boundaries[0].longitudeDeg + 360;
      return { name: b.name, start, end };
    });

    segments.forEach((seg, i) => {
      ctx.fillStyle = SEGMENT_FILLS[i % 2];
      if (seg.end <= 360) {
        ctx.fillRect(longitudeToX(seg.start), BAND_Y - BAND_HALF_HEIGHT, longitudeToX(seg.end) - longitudeToX(seg.start), BAND_HALF_HEIGHT * 2);
      } else {
        ctx.fillRect(longitudeToX(seg.start), BAND_Y - BAND_HALF_HEIGHT, longitudeToX(360) - longitudeToX(seg.start), BAND_HALF_HEIGHT * 2);
        ctx.fillRect(longitudeToX(0), BAND_Y - BAND_HALF_HEIGHT, longitudeToX(seg.end - 360) - longitudeToX(0), BAND_HALF_HEIGHT * 2);
      }
    });

    ctx.strokeStyle = '#8a97a5';
    ctx.lineWidth = 1;
    ctx.strokeRect(MARGIN, BAND_Y - BAND_HALF_HEIGHT, USABLE_WIDTH, BAND_HALF_HEIGHT * 2);

    // Celestial equator: a schematic wave crossing the ecliptic band's
    // centre line exactly at the two equinoxes (longitude 0 and 180).
    ctx.beginPath();
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 3]);
    const equatorAmplitude = BAND_HALF_HEIGHT * 1.4;
    for (let lon = 0; lon <= 360; lon += 2) {
      const x = longitudeToX(lon);
      const y = BAND_Y - equatorAmplitude * Math.sin((lon * Math.PI) / 180);
      if (lon === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Decorative Moon/planet wanderers, close to the band.
    ctx.fillStyle = 'rgba(90, 100, 120, 0.55)';
    DECORATIVE_WANDERERS.forEach((w) => {
      const x = MARGIN + w.xFrac * USABLE_WIDTH;
      ctx.beginPath();
      ctx.arc(x, BAND_Y + w.yOffset, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Segment ticks + staggered labels.
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#2c3e50';
    ctx.textAlign = 'center';
    segments.forEach((seg, i) => {
      const wraps = seg.end > 360;
      const widthA = (wraps ? 360 : seg.end) - seg.start;
      const widthB = wraps ? seg.end - 360 : 0;
      const mid = widthA >= widthB ? seg.start + widthA / 2 : (seg.end - 360) / 2;
      const x = longitudeToX(((mid % 360) + 360) % 360);
      const rowY = i % 2 === 0 ? 40 : 58;
      ctx.beginPath();
      ctx.strokeStyle = '#8a97a5';
      ctx.lineWidth = 1;
      ctx.moveTo(x, rowY + 4);
      ctx.lineTo(x, BAND_Y - BAND_HALF_HEIGHT);
      ctx.stroke();
      ctx.fillStyle = seg.name === sunName ? '#8a6a1a' : '#2c3e50';
      ctx.font = seg.name === sunName ? 'bold 10px sans-serif' : '10px sans-serif';
      ctx.fillText(seg.name, x, rowY);
    });

    // Sun marker, above the band, and the midnight marker, opposite it.
    const sunX = longitudeToX(sunLongitude);
    const midnightX = longitudeToX((sunLongitude + 180) % 360);

    ctx.beginPath();
    ctx.moveTo(sunX, BAND_Y - BAND_HALF_HEIGHT);
    ctx.lineTo(sunX, BAND_Y + BAND_HALF_HEIGHT + 22);
    ctx.strokeStyle = SunIcon.EDGE_COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();
    SunIcon.drawSunDiscCanvas(ctx, sunX, BAND_Y + BAND_HALF_HEIGHT + 30, 8, { coronaScale: 1.6 });
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#8a6a1a';
    ctx.fillText('Sun', sunX, BAND_Y + BAND_HALF_HEIGHT + 52);

    ctx.beginPath();
    ctx.moveTo(midnightX, BAND_Y - BAND_HALF_HEIGHT);
    ctx.lineTo(midnightX, BAND_Y - BAND_HALF_HEIGHT - 18);
    ctx.strokeStyle = '#2a6bd6';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(midnightX, BAND_Y - BAND_HALF_HEIGHT - 24, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#2a6bd6';
    ctx.fill();

    dateLabel.textContent = formatDate(date);
    sunConstellationReadout.textContent = sunName;
    midnightConstellationReadout.textContent = midnightName;
  }

  dateSlider.addEventListener('input', () => drawEclipticBand(Number(dateSlider.value)));
  drawEclipticBand(Number(dateSlider.value));

  // --- Astrology / astronomy date tables ------------------------------

  function formatShortDate(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  }

  function previousDay(date) {
    return new Date(date.getTime() - 86400000);
  }

  function mountAstrologyDatesTable() {
    const tbody = document.getElementById('astrology-dates-tbody');
    const year = EclipticZodiac.REFERENCE_YEAR;
    let prevSign = null;
    let signStartDate = null;
    const rows = [];
    for (let day = 0; day <= 365; day += 1) {
      const date = new Date(Date.UTC(year, 0, 1, 12) + day * 86400000);
      const longitude = SolarPosition.getSunPosition(date, 0, 0).apparentLongitude;
      const sign = PlanetaryMotion.zodiacSignForLongitude(longitude);
      if (sign !== prevSign) {
        if (prevSign !== null) rows.push({ name: prevSign, start: signStartDate, end: previousDay(date) });
        prevSign = sign;
        signStartDate = date;
      }
    }
    rows.forEach(({ name, start, end }) => {
      const row = document.createElement('tr');
      const nameCell = document.createElement('th');
      nameCell.scope = 'row';
      nameCell.textContent = name;
      const dateCell = document.createElement('td');
      dateCell.textContent = `${formatShortDate(start)} – ${formatShortDate(end)}`;
      row.append(nameCell, dateCell);
      tbody.appendChild(row);
    });
  }

  function mountAstronomyDatesTable() {
    const tbody = document.getElementById('astronomy-dates-tbody');
    const boundaries = EclipticZodiac.IAU_BOUNDARY_DATES;
    boundaries.forEach(({ name, month, day }, i) => {
      const start = new Date(Date.UTC(EclipticZodiac.REFERENCE_YEAR, month, day, 12));
      const next = boundaries[(i + 1) % boundaries.length];
      const nextYear = i + 1 < boundaries.length ? EclipticZodiac.REFERENCE_YEAR : EclipticZodiac.REFERENCE_YEAR + 1;
      const end = previousDay(new Date(Date.UTC(nextYear, next.month, next.day, 12)));
      const row = document.createElement('tr');
      const nameCell = document.createElement('th');
      nameCell.scope = 'row';
      nameCell.textContent = name;
      const dateCell = document.createElement('td');
      dateCell.textContent = `${formatShortDate(start)} – ${formatShortDate(end)}`;
      row.append(nameCell, dateCell);
      tbody.appendChild(row);
    });
  }

  function setUpPanelToggle(buttonId, panelId) {
    const button = document.getElementById(buttonId);
    const panel = document.getElementById(panelId);
    button.addEventListener('click', () => {
      const nowHidden = !panel.hidden;
      panel.hidden = nowHidden;
      button.setAttribute('aria-pressed', String(!nowHidden));
    });
  }

  mountAstrologyDatesTable();
  mountAstronomyDatesTable();
  setUpPanelToggle('toggle-astrology-dates', 'astrology-dates-panel');
  setUpPanelToggle('toggle-astronomy-dates', 'astronomy-dates-panel');

  // --- Glossary --------------------------------------------------------

  const GLOSSARY = {
    eclipticOrigin:
      "Most of the Solar System's material — the planets, the asteroid belt and the Kuiper Belt — formed from, and still roughly orbits within, the same flattened disc the young Sun was born inside. Seen from Earth (itself part of that same disc), the other planets' orbits all appear close to one line across the sky: the ecliptic. The Moon's orbit is tilted only about 5° to the ecliptic — far more than the planets, but still close enough that it's always found within a narrow band either side of it, never far from the zodiac constellations.",
    astrologyDrift:
      "Astrology's twelve 30° signs were fixed against the stars over 2,000 years ago. Since then, precession — the ~26,000-year wobble in the direction Earth's axis points — has slowly shifted where the equinoxes fall against the background stars, by roughly a whole sign's width (close to 30°) over that time. The signs themselves never moved to follow; they're still defined by their original fixed calendar dates, which is why a \"sign\" and its namesake constellation no longer line up in the real sky.",
  };

  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(EclipticZodiacQuestions.makeQuestions(EclipticZodiac, SolarPosition, PlanetaryMotion));
})();
