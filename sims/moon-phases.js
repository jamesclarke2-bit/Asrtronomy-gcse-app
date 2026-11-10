(function () {
  const CURRICULUM_UNITS = ['u2.3', 'u2.18', 'u2.19', 'u3.5'];
  const SYNODIC = MoonPhase.SYNODIC_MONTH_DAYS;
  const DAY_MS = 86400000;

  const modeExploreButton = document.getElementById('mode-explore-button');
  const modeCheckButton = document.getElementById('mode-check-button');
  const exploreControls = document.getElementById('explore-controls');
  const checkControls = document.getElementById('check-controls');

  const cycleSlider = document.getElementById('cycle-slider');
  const cycleLabel = document.getElementById('cycle-label');
  const playButton = document.getElementById('play-button');
  const speedSelect = document.getElementById('speed-select');

  const dateInput = document.getElementById('date-input');
  const dateLabel = document.getElementById('date-label');
  const illuminatedValue = document.getElementById('illuminated-value');
  const waxingValue = document.getElementById('waxing-value');
  const phaseNameReadout = document.getElementById('phase-name-readout');
  const distanceValue = document.getElementById('distance-value');
  const perigeeValue = document.getElementById('perigee-value');
  const supermoonFlag = document.getElementById('supermoon-flag');

  const orbitCanvas = document.getElementById('moon-orbit');
  const earthViewCanvas = document.getElementById('moon-earth-view');

  const MOON_LIT_COLOR = '#f5e8c8';
  const MOON_DARK_COLOR = '#3a3f4d';

  let mode = 'explore';
  // The single quantity both modes drive and carry across a mode switch:
  // days elapsed since New Moon, 0 up to (not including) SYNODIC.
  let currentAgeDays = 0;
  // The exact (mean) New Moon that starts the lunar cycle being shown.
  // Phase alone doesn't fix the Moon's distance — perigee drifts against
  // the phases by ~2 days a month — so Explore mode borrows a real cycle
  // for distance: the one last checked, or the current one to begin with.
  let anchorNewMoonMs = Date.now() - MoonPhase.getMoonPhase(new Date()).ageDays * DAY_MS;

  // dateInput.value is a "YYYY-MM-DD" string (native <input type="date">
  // behaviour) — parsed as UTC noon, matching the noon-anchoring the rest
  // of the app uses to sidestep local-timezone date-boundary issues.
  function parseDateInput(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12, 0));
  }

  function toDateInputValue(date) {
    const year = String(date.getFullYear()).padStart(4, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // The calendar date whose UTC noon (how parseDateInput reads a date) is
  // nearest to the given instant — so Check -> Explore -> Check returns
  // to exactly the same date.
  function nearestNoonDateValue(ms) {
    const noonOffset = 12 * 3600000;
    const nearestNoon = new Date(Math.round((ms - noonOffset) / DAY_MS) * DAY_MS + noonOffset);
    return nearestNoon.toISOString().slice(0, 10);
  }

  // Unlike the Sun's position, the Moon's phase does NOT repeat every
  // calendar year (the ~29.53-day synodic month doesn't divide evenly
  // into a year), so the year has to be shown here for the date to be a
  // real, checkable moment rather than an ambiguous "21 June".
  function formatDate(date) {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  // The Moon's disc exactly as it appears from Earth: the illuminated
  // region's boundary is one half of the true circular limb (the bright
  // limb) plus a terminator that's an ellipse of horizontal radius
  // r*cos(theta) — which degenerates to a straight line at the quarters,
  // bulges into a thin crescent near New Moon, and bulges out to the full
  // disc at Full Moon. Waxing (theta < 180) lights the right side;
  // waning (theta > 180) mirrors it onto the left.
  function drawEarthViewDisc(canvas, theta) {
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = Math.min(cx, cy) - 24;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#10141f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = MOON_DARK_COLOR;
    ctx.fill();

    const thetaRad = (theta * Math.PI) / 180;
    const e = Math.cos(thetaRad);
    const waxing = theta <= 180;
    const steps = 48;
    const points = [];

    for (let i = 0; i <= steps; i++) {
      const t = -Math.PI / 2 + (Math.PI * i) / steps;
      const y = cy - r * Math.sin(t);
      const outer = r * Math.cos(t);
      points.push([waxing ? cx + outer : cx - outer, y]);
    }
    for (let i = steps; i >= 0; i--) {
      const t = -Math.PI / 2 + (Math.PI * i) / steps;
      const y = cy - r * Math.sin(t);
      const term = e * r * Math.cos(t);
      points.push([waxing ? cx + term : cx - term, y]);
    }

    ctx.beginPath();
    points.forEach(([x, y], idx) => (idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = MOON_LIT_COLOR;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#555b6e';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function describePerigee(daysFromPerigee) {
    const days = Math.abs(daysFromPerigee).toFixed(1);
    if (days === '0.0') return 'Now';
    return daysFromPerigee > 0 ? `${days} days ago` : `In ${days} days`;
  }

  function renderSupermoonFlag(name, daysFromPerigee) {
    const atSyzygy = name === 'Full Moon' || name === 'New Moon';
    const nearPerigee = Math.abs(daysFromPerigee) <= MoonOrbitPanel.SUPERMOON_WINDOW_DAYS;
    supermoonFlag.hidden = !(atSyzygy && nearPerigee);
    if (supermoonFlag.hidden) return;

    const within = `within ${MoonOrbitPanel.SUPERMOON_WINDOW_DAYS} days of perigee`;
    supermoonFlag.textContent = name === 'Full Moon'
      ? `Supermoon! A full Moon ${within}. A full Moon at perigee can look up to about 14% larger and 30% brighter than one at apogee.`
      : `Supermoon (new Moon): ${within}. It's lost in the Sun's glare, so you can't see it, but its extra pull raises unusually large spring tides.`;
  }

  function renderDiagramsAndReadouts(phase, orbit) {
    // In the Sun-fixed frame the Moon sits at its phase angle, and it is
    // trueAnomalyDeg past perigee — which fixes where perigee points.
    const perigeeAngleDeg = phase.theta - orbit.trueAnomalyDeg;
    MoonOrbitPanel.draw(orbitCanvas, { moonAngleDeg: phase.theta, sunAngleDeg: 0, perigeeAngleDeg });
    drawEarthViewDisc(earthViewCanvas, phase.theta);

    const name = MoonPhase.phaseName(phase.theta);
    illuminatedValue.textContent = `${Math.round(phase.illuminatedFraction * 100)}%`;
    waxingValue.textContent = phase.illuminatedFraction < 0.01 || phase.illuminatedFraction > 0.99
      ? '—'
      : phase.waxing ? 'Waxing (growing)' : 'Waning (shrinking)';
    phaseNameReadout.textContent = name;
    distanceValue.textContent = `${Math.round(orbit.distanceKm).toLocaleString('en-GB')} km`;
    perigeeValue.textContent = describePerigee(orbit.daysFromPerigee);
    renderSupermoonFlag(name, orbit.daysFromPerigee);
  }

  function renderExplore() {
    const ageDays = Number(cycleSlider.value);
    currentAgeDays = ageDays;
    cycleLabel.textContent = `Day ${ageDays.toFixed(1)} of ${SYNODIC.toFixed(1)}`;
    const orbit = MoonOrbitPanel.getMoonOrbit(new Date(anchorNewMoonMs + ageDays * DAY_MS));
    renderDiagramsAndReadouts(MoonPhase.fromAgeDays(ageDays), orbit);
  }

  function renderCheck() {
    const date = parseDateInput(dateInput.value);
    dateLabel.textContent = formatDate(date);
    const phase = MoonPhase.getMoonPhase(date);
    currentAgeDays = phase.ageDays;
    anchorNewMoonMs = date.getTime() - phase.ageDays * DAY_MS;
    renderDiagramsAndReadouts(phase, MoonOrbitPanel.getMoonOrbit(date));
  }

  function render() {
    if (mode === 'explore') renderExplore();
    else renderCheck();
  }

  // --- Mode switching: both modes are driven by the same currentAgeDays,
  // so switching carries the current position across instead of
  // resetting to day 0.

  function setMode(nextMode) {
    stopAnimation();
    mode = nextMode;
    const exploring = mode === 'explore';
    modeExploreButton.setAttribute('aria-pressed', String(exploring));
    modeCheckButton.setAttribute('aria-pressed', String(!exploring));
    exploreControls.hidden = !exploring;
    checkControls.hidden = exploring;

    if (exploring) {
      cycleSlider.value = currentAgeDays;
    } else {
      // The real date in the anchored cycle closest to the current
      // position — as close as a whole calendar day allows, since
      // <input type="date"> can't represent a fraction of one.
      dateInput.value = nearestNoonDateValue(anchorNewMoonMs + currentAgeDays * DAY_MS);
    }
    render();
  }

  modeExploreButton.addEventListener('click', () => {
    if (mode !== 'explore') setMode('explore');
  });
  modeCheckButton.addEventListener('click', () => {
    if (mode !== 'check') setMode('check');
  });

  // --- Explore mode: scrub or animate through the cycle. Setting
  // cycleSlider.value programmatically doesn't fire 'input', so animation
  // can't fight with the "stop on manual drag" handler below.
  //
  // Speed is expressed per real second, not per frame — a per-frame
  // constant would run twice as fast on a 120Hz screen as on a 60Hz one.
  // The cycle slider's own step is "any" (not a fixed grid — see
  // CLAUDE.md rule 12): a fractional day advanced between two frames
  // would otherwise get silently snapped to the nearest 0.01 of a day.
  const SPEEDS_PER_SECOND = { slow: 1.2, fast: 4.8 };
  let animationFrameId = null;
  let lastFrameTime = null;

  function stopAnimation() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    lastFrameTime = null;
    playButton.textContent = '▶ Animate';
    playButton.setAttribute('aria-pressed', 'false');
  }

  function startAnimation() {
    playButton.textContent = '❚❚ Pause';
    playButton.setAttribute('aria-pressed', 'true');
    function step(now) {
      const dt = AnimationTiming.cappedElapsedSeconds(now, lastFrameTime);
      lastFrameTime = now;
      const perSecond = SPEEDS_PER_SECOND[speedSelect.value] || SPEEDS_PER_SECOND.slow;
      let next = Number(cycleSlider.value) + dt * perSecond;
      if (next > SYNODIC) next -= SYNODIC;
      cycleSlider.value = next;
      renderExplore();
      animationFrameId = requestAnimationFrame(step);
    }
    animationFrameId = requestAnimationFrame(step);
  }

  playButton.addEventListener('click', () => {
    if (animationFrameId !== null) stopAnimation();
    else startAnimation();
  });

  cycleSlider.addEventListener('input', () => {
    stopAnimation();
    render();
  });

  dateInput.addEventListener('input', render);

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const PERIGEE_DEFINITION =
    "Perigee: the point in the Moon's elliptical orbit closest to Earth, about 363,300 km away. The Moon moves fastest here.";

  const GLOSSARY = {
    lunarEclipse:
      "A lunar eclipse: Earth passing directly between the Sun and a Full Moon, so Earth's shadow falls on the Moon. Unlike an ordinary phase, this needs an almost exact Sun-Earth-Moon alignment, so it only happens a few times a year at most — not every month.",
    perigee: PERIGEE_DEFINITION,
    perigeeSection: PERIGEE_DEFINITION,
    apogee:
      "Apogee: the point in the Moon's elliptical orbit farthest from Earth, about 405,500 km away. The Moon moves slowest here.",
    supermoon:
      'A supermoon: a full (or new) Moon that falls within a few days of perigee. It is a popular term rather than a strict scientific one — the effect is real but modest.',
    crescent:
      'A crescent Moon: less than half lit, a thin curved sliver — seen shortly after New Moon (waxing) or shortly before it (waning).',
    gibbous:
      'A gibbous Moon: more than half lit but not full, a bulging shape — seen between a quarter and Full Moon.',
    terminator:
      "The terminator: the line between a Moon or planet's lit and dark sides — where the Sun is rising or setting as seen from that point on its surface.",
    earthshine:
      "Earthshine: faint light on the Moon's dark side, from sunlight reflecting off (sunlit) Earth back onto it — easiest to see as a thin crescent, within a few days of New Moon.",
  };

  // The headline ~14% / ~30% figures come from the most extreme real
  // distances; this page's fixed-shape orbit gives a slightly smaller
  // spread. Computed from the model's own constants so it can't drift.
  const sizeRatio = MoonOrbitPanel.APOGEE_KM / MoonOrbitPanel.PERIGEE_KM;
  document.getElementById('model-spread-note').textContent =
    `Those headline figures use the Moon's most extreme real distances — the Sun's pull stretches ` +
    `the orbit enough that real perigees range from about 356,500 to 370,400 km. This page keeps the ` +
    `orbit's shape fixed, so its perigee and apogee full Moons differ by a slightly smaller ` +
    `~${Math.round((sizeRatio - 1) * 100)}% in size and ~${Math.round((sizeRatio ** 2 - 1) * 100)}% in brightness.`;

  MoonPhasesDiagrams.mountEightPhases('eight-phases-grid', { MoonPhase });
  MoonPhasesDiagrams.mountEarthshine('earthshine-svg', 'earthshine-wrap');
  MoonPhasesDiagrams.mountOrbitScale('orbit-scale-svg', 'orbit-scale-wrap', { MoonOrbitPanel });

  // --- Names of the full Moons ---------------------------------------

  function setUpSpecialNamesToggle() {
    const button = document.getElementById('toggle-special-names');
    const panel = document.getElementById('special-names-panel');
    button.addEventListener('click', () => {
      const nowHidden = !panel.hidden;
      panel.hidden = nowHidden;
      button.setAttribute('aria-pressed', String(!nowHidden));
    });
  }

  FullMoonNames.mountWheel('full-moon-wheel-svg', 'full-moon-wheel-wrap');

  // The year selector covers the past 10 and next 10 years so the list
  // never goes stale, but still defaults to the current year on load.
  const fullMoonYearSelect = document.getElementById('full-moon-year-select');
  const currentYear = new Date().getUTCFullYear();
  for (let year = currentYear - 10; year <= currentYear + 10; year += 1) {
    const option = document.createElement('option');
    option.value = String(year);
    option.textContent = String(year);
    fullMoonYearSelect.appendChild(option);
  }
  fullMoonYearSelect.value = String(currentYear);

  function renderFullMoonList() {
    const year = Number(fullMoonYearSelect.value);
    document.getElementById('full-moon-list-year').textContent = String(year);
    FullMoonNames.mountFullMoonList('full-moon-list-body', year, { MoonPhase, SolarPosition });
  }

  fullMoonYearSelect.addEventListener('change', renderFullMoonList);
  renderFullMoonList();
  setUpSpecialNamesToggle();

  // --- Phase detective: reading sunrise/sunset/moonrise/moonset times ---
  // Shared maths lives in src/phaseDetective.js (PhaseDetective below), so
  // it's testable with node:test and usable from the practice questions
  // too, rather than locked inside this page's own drawing code.

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const PD = PhaseDetective;
  // A date close to the equinox (day length near 12h everywhere, so the
  // skill panel's round-number lags hold up reasonably well) but with
  // enough seasonal skew that the latitude slider still visibly shifts
  // sunrise and sunset — see this section's own "note" paragraph.
  const PHASE_DETECTIVE_DATE = new Date(Date.UTC(2026, 3, 1, 12));
  const PHASE_DETECTIVE_LON = 0;
  const PHASE_DETECTIVE_PRACTICE_LAT = 51.5;

  function pdSvgEl(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (parent) parent.appendChild(el);
    return el;
  }

  function pdAddLabel(wrap, x, y, width, height, text, className) {
    const el = document.createElement('span');
    el.className = className || 'labelled-diagram-label';
    el.style.left = `${(x / width) * 100}%`;
    el.style.top = `${(y / height) * 100}%`;
    el.textContent = text;
    wrap.appendChild(el);
    return el;
  }

  function pdClearDiagram(svg, wrap) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    wrap.querySelectorAll('.labelled-diagram-label').forEach((el) => el.remove());
  }

  const PD_STRIP = { W: 600, H: 220, plotX0: 70, plotX1: 580, sunY: 50, moonY: 120, rowHeight: 36, axisY: 190 };

  function pdMinutesToX(minutes) {
    const { plotX0, plotX1 } = PD_STRIP;
    return plotX0 + (minutes / 1440) * (plotX1 - plotX0);
  }

  // A shaded "up" band from startMinutes to endMinutes — split into two
  // pieces when it wraps past midnight (e.g. the Moon rising in the
  // evening and setting after dawn).
  function pdDrawBand(svg, y, height, startMinutes, endMinutes, fill) {
    const { plotX0, plotX1 } = PD_STRIP;
    if (endMinutes >= startMinutes) {
      pdSvgEl('rect', { x: pdMinutesToX(startMinutes), y, width: pdMinutesToX(endMinutes) - pdMinutesToX(startMinutes), height, fill }, svg);
    } else {
      pdSvgEl('rect', { x: pdMinutesToX(startMinutes), y, width: plotX1 - pdMinutesToX(startMinutes), height, fill }, svg);
      pdSvgEl('rect', { x: plotX0, y, width: pdMinutesToX(endMinutes) - plotX0, height, fill }, svg);
    }
  }

  function drawPhaseDetectiveStrip(times) {
    const svg = document.getElementById('phase-detective-strip');
    const wrap = document.getElementById('phase-detective-strip-wrap');
    if (!svg || !wrap) return;
    pdClearDiagram(svg, wrap);
    const { W, H, plotX0, plotX1, sunY, moonY, rowHeight, axisY } = PD_STRIP;

    pdSvgEl('rect', { x: 0, y: 0, width: W, height: H, rx: 8, fill: '#10141f' }, svg);

    for (let h = 0; h <= 24; h += 3) {
      const x = pdMinutesToX(h * 60);
      pdSvgEl('line', { x1: x, y1: sunY - 6, x2: x, y2: axisY, stroke: '#232c3d', 'stroke-width': 1 }, svg);
      if (h % 6 === 0) pdAddLabel(wrap, x, axisY + 14, W, H, `${String(h % 24).padStart(2, '0')}:00`, 'star-label');
    }
    pdSvgEl('line', { x1: plotX0, y1: axisY, x2: plotX1, y2: axisY, stroke: '#7c8aa3', 'stroke-width': 1.5 }, svg);

    pdAddLabel(wrap, 18, sunY + rowHeight / 2, W, H, 'Sun', 'star-label');
    pdAddLabel(wrap, 18, moonY + rowHeight / 2, W, H, 'Moon', 'star-label');

    pdSvgEl('rect', { x: plotX0, y: sunY, width: plotX1 - plotX0, height: rowHeight, rx: 4, fill: '#1c2430' }, svg);
    pdSvgEl('rect', { x: plotX0, y: moonY, width: plotX1 - plotX0, height: rowHeight, rx: 4, fill: '#1c2430' }, svg);

    pdDrawBand(svg, sunY, rowHeight, times.sunriseMinutes, times.sunsetMinutes, 'rgba(245,166,35,0.35)');
    pdDrawBand(svg, moonY, rowHeight, times.moonriseMinutes, times.moonsetMinutes, 'rgba(122,162,255,0.35)');

    const sunMidY = sunY + rowHeight / 2;
    const moonMidY = moonY + rowHeight / 2;
    SunIcon.appendSunSvg(svg, pdMinutesToX(times.sunriseMinutes), sunMidY, 9, { coronaScale: 1.5 });
    SunIcon.appendSunSvg(svg, pdMinutesToX(times.sunsetMinutes), sunMidY, 9, { coronaScale: 1.5 });

    function moonIcon(x, y) {
      const g = pdSvgEl('g', { transform: `translate(${x},${y})` }, svg);
      pdSvgEl('circle', { cx: 0, cy: 0, r: 9, fill: MOON_DARK_COLOR }, g);
      const polygon = MoonPhasesDiagrams.earthViewDiscPolygon(times.theta, 9);
      pdSvgEl('polygon', { points: polygon.map(([px, py]) => `${px},${py}`).join(' '), fill: MOON_LIT_COLOR }, g);
      pdSvgEl('circle', { cx: 0, cy: 0, r: 9, fill: 'none', stroke: '#20242e', 'stroke-width': 1 }, g);
    }
    moonIcon(pdMinutesToX(times.moonriseMinutes), moonMidY);
    moonIcon(pdMinutesToX(times.moonsetMinutes), moonMidY);
  }

  function setUpPhaseDetective() {
    const phaseSlider = document.getElementById('phase-detective-phase-slider');
    if (!phaseSlider) return;
    const latSlider = document.getElementById('phase-detective-lat-slider');
    const phaseLabel = document.getElementById('phase-detective-phase-label');
    const latLabel = document.getElementById('phase-detective-lat-label');
    const lagReadout = document.getElementById('phase-detective-lag-readout');
    const ageReadout = document.getElementById('phase-detective-age-readout');
    const tableBody = document.getElementById('phase-detective-table-body');

    function render() {
      const preset = PD.PHASE_PRESETS[Number(phaseSlider.value)];
      const lat = Number(latSlider.value);
      phaseLabel.textContent = preset.label;
      latLabel.textContent = `${lat.toFixed(1)}°N`;

      const { sunriseUT, sunsetUT } = SolarPosition.getSunriseSunset(PHASE_DETECTIVE_DATE, lat, PHASE_DETECTIVE_LON);
      const lagHours = PD.lagHoursFromTheta(preset.theta);
      const times = {
        sunriseMinutes: PD.wrapMinutes(sunriseUT),
        sunsetMinutes: PD.wrapMinutes(sunsetUT),
        moonriseMinutes: PD.addLagHours(sunriseUT, lagHours),
        moonsetMinutes: PD.addLagHours(sunsetUT, lagHours),
        theta: preset.theta,
      };

      drawPhaseDetectiveStrip(times);

      tableBody.innerHTML = '';
      [
        ['Sunrise', times.sunriseMinutes],
        ['Sunset', times.sunsetMinutes],
        ['Moonrise', times.moonriseMinutes],
        ['Moonset', times.moonsetMinutes],
      ].forEach(([label, minutes]) => {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.scope = 'row';
        th.textContent = label;
        const td = document.createElement('td');
        td.textContent = PD.formatClock(minutes);
        tr.appendChild(th);
        tr.appendChild(td);
        tableBody.appendChild(tr);
      });

      const lagH = Math.floor(lagHours);
      const lagM = Math.round((lagHours - lagH) * 60);
      lagReadout.textContent = lagHours === 0 ? '0 hours (rises with the Sun)' : `${lagH}h ${String(lagM).padStart(2, '0')}m`;
      ageReadout.textContent = `${PD.estimatedAgeDaysFromLagHours(lagHours).toFixed(1)} days`;
    }

    phaseSlider.addEventListener('input', render);
    latSlider.addEventListener('input', render);
    render();
  }

  // --- Detective practice: four random real dates, each with worked
  // reasoning for the "most likely" full/crescent/eclipse pick -------

  function pdFormatDate(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }

  function pdRandomDates(count) {
    const dates = [];
    for (let i = 0; i < count; i += 1) {
      const offsetDays = (Math.random() - 0.5) * 365 * 6;
      dates.push(new Date(Date.UTC(2024, 0, 1, 12) + offsetDays * DAY_MS));
    }
    return dates;
  }

  // Index of the row whose score (lower is better) is smallest.
  function pdBestIndex(rows, scoreFn) {
    let best = 0;
    rows.forEach((row, i) => {
      if (scoreFn(row) < scoreFn(rows[best])) best = i;
    });
    return best;
  }

  const PD_CRESCENT_THETAS = [45, 315]; // representative waxing/waning crescent points

  function pdCrescentScore(theta) {
    return Math.min(...PD_CRESCENT_THETAS.map((t) => Math.abs(theta - t)));
  }

  let phaseDetectiveRows = [];

  function renderPhaseDetectiveTable() {
    const body = document.getElementById('phase-detective-dates-body');
    if (!body) return;
    body.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    phaseDetectiveRows = pdRandomDates(4).map((date, i) => ({
      letter: letters[i],
      date,
      ...PD.riseSetTimesForDate(date, PHASE_DETECTIVE_PRACTICE_LAT, PHASE_DETECTIVE_LON),
    }));

    phaseDetectiveRows.forEach((row) => {
      const tr = document.createElement('tr');
      [
        `${row.letter}: ${pdFormatDate(row.date)}`,
        PD.formatClock(row.sunriseMinutes),
        PD.formatClock(row.sunsetMinutes),
        PD.formatClock(row.moonriseMinutes),
        PD.formatClock(row.moonsetMinutes),
      ].forEach((text, i) => {
        const cell = document.createElement(i === 0 ? 'th' : 'td');
        if (i === 0) cell.scope = 'row';
        cell.textContent = text;
        tr.appendChild(cell);
      });
      body.appendChild(tr);
    });
  }

  function pdQuestionBlock(promptText, correctLetter, explanation) {
    const step = document.createElement('div');
    step.className = 'scaffold-step';
    const prompt = document.createElement('p');
    prompt.className = 'scaffold-prompt';
    prompt.textContent = promptText;
    step.appendChild(prompt);

    const quickCheck = document.createElement('div');
    quickCheck.className = 'quick-check';
    const options = document.createElement('div');
    options.className = 'quick-check-options';
    ['A', 'B', 'C', 'D'].forEach((letter) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = letter;
      button.dataset.correct = String(letter === correctLetter);
      options.appendChild(button);
    });
    const feedback = document.createElement('p');
    feedback.className = 'question-feedback quick-check-feedback';
    feedback.setAttribute('aria-live', 'polite');
    quickCheck.appendChild(options);
    quickCheck.appendChild(feedback);
    step.appendChild(quickCheck);

    [...options.children].forEach((button) => {
      button.addEventListener('click', () => {
        if (quickCheck.dataset.answered) return;
        quickCheck.dataset.answered = 'true';
        const correct = button.dataset.correct === 'true';
        button.classList.add(correct ? 'quick-check-correct' : 'quick-check-incorrect');
        if (!correct) {
          const correctButton = [...options.children].find((b) => b.dataset.correct === 'true');
          if (correctButton) correctButton.classList.add('quick-check-correct');
        }
        feedback.className = 'question-feedback quick-check-feedback ' + (correct ? 'correct' : 'incorrect');
        feedback.textContent = `${correct ? 'Correct!' : 'Not quite.'} ${explanation}`;
      });
    });

    return step;
  }

  function renderPhaseDetectiveQuestions() {
    const container = document.getElementById('phase-detective-questions');
    if (!container) return;
    container.innerHTML = '';

    const fullIndex = pdBestIndex(phaseDetectiveRows, (r) => Math.abs(PD.lagHoursFromTheta(r.theta) - 12));
    const crescentIndex = pdBestIndex(phaseDetectiveRows, (r) => pdCrescentScore(r.theta));
    const eclipseIndex = pdBestIndex(phaseDetectiveRows, (r) => PD.distanceFromNewMoonDeg(r.theta));

    const fullRow = phaseDetectiveRows[fullIndex];
    const crescentRow = phaseDetectiveRows[crescentIndex];
    const eclipseRow = phaseDetectiveRows[eclipseIndex];

    container.appendChild(pdQuestionBlock(
      'Which date shows a full Moon?',
      fullRow.letter,
      `Date ${fullRow.letter}'s moonrise is ${PD.lagHoursFromTheta(fullRow.theta).toFixed(1)}h after sunrise — closest to the 12-hour, moonrise-at-sunset pattern of the four.`,
    ));
    container.appendChild(pdQuestionBlock(
      'Which date shows a crescent Moon?',
      crescentRow.letter,
      `Date ${crescentRow.letter}'s moonrise is ${PD.lagHoursFromTheta(crescentRow.theta).toFixed(1)}h from sunrise — the closest of the four to the Sun, the crescent pattern.`,
    ));
    container.appendChild(pdQuestionBlock(
      'Which date would a solar eclipse be most likely?',
      eclipseRow.letter,
      `Date ${eclipseRow.letter} is closest to New Moon (moonrise within ${PD.lagHoursFromTheta(eclipseRow.theta).toFixed(1)}h of sunrise) — the precondition for a solar eclipse, though most new Moons still miss (see Eclipses).`,
    ));
  }

  function renderPhaseDetectivePractice() {
    renderPhaseDetectiveTable();
    renderPhaseDetectiveQuestions();
  }

  function setUpPhaseDetectivePractice() {
    const newTableButton = document.getElementById('phase-detective-new-table-btn');
    if (!newTableButton) return;
    newTableButton.addEventListener('click', renderPhaseDetectivePractice);
    renderPhaseDetectivePractice();
  }

  setUpPhaseDetective();
  setUpPhaseDetectivePractice();
  QuizUI.mount(MoonPhasesQuestions.makeQuestions(MoonPhase));

  dateInput.value = toDateInputValue(new Date());
  render();
  renderCoverage();
  Glossary.init(GLOSSARY);
})();
