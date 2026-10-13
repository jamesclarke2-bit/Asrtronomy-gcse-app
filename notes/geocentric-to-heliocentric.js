/**
 * notes/geocentric-to-heliocentric.html's diagrams: Ptolemy's epicycle
 * (interactive), the same real positions drawn Earth-centred and
 * Sun-centred, Venus's predicted phases under each model, an animated
 * strip of Jupiter's four largest moons, and Mars's measured positions
 * fitted by an ellipse.
 *
 * The epicycle model is Ptolemy's for an outer ("superior") planet: a
 * planet rides on a small circle (the epicycle) whose own centre rides
 * on a larger circle (the deferent) around a fixed Earth. Historically,
 * the epicycle for an outer planet reproduces Earth's own heliocentric
 * motion — one full epicycle lap every year, matching the Sun's
 * apparent yearly motion — while the deferent's lap matches the
 * planet's own real orbital period. This page uses Mars's real period
 * (1.881 years) for the deferent, with the slider controlling only the
 * epicycle's size relative to the deferent. src/epicycleModel.js
 * supplies the position function and the exact condition under which
 * that produces a retrograde loop.
 *
 * The "Two models" diagram instead uses src/planetaryMotion.js's real
 * (circular-orbit) positions at one fixed illustrative date: the
 * Earth-centred view is just those same positions re-centred on Earth
 * (Earth-relative position = heliocentric position minus Earth's own),
 * not a second, independent model — exactly the point the diagram
 * makes, that re-centring the same reality is all a geocentric model
 * ever did to the data.
 */
(function () {
  const CURRICULUM_UNITS = ['u3.1', 'u3.2', 'u3.6', 'u3.7', 'u3.15'];

  // --- Epicycle diagram (Ptolemy's model for an outer planet) --------------

  const DEFERENT_RADIUS = 1; // normalised; epicycle size is a fraction of this
  const DEFERENT_RADIUS_PX = 140;
  const STAR_RING_RADIUS_PX = DEFERENT_RADIUS_PX + 35;

  const EARTH_YEAR = 1; // the epicycle's period, matching the Sun's apparent motion
  const MARS_YEAR = 1.881; // Mars's real sidereal orbital period, in years — the deferent's period
  const DEFERENT_ANGULAR_SPEED = (2 * Math.PI) / MARS_YEAR;
  const EPICYCLE_ANGULAR_SPEED = (2 * Math.PI) / EARTH_YEAR;
  const RETROGRADE_THRESHOLD = EpicycleModel.retrogradeThreshold(DEFERENT_RADIUS, DEFERENT_ANGULAR_SPEED, EPICYCLE_ANGULAR_SPEED);

  const ANIMATION_YEARS = MARS_YEAR; // one full deferent lap per animation loop
  const ANIMATION_SECONDS = 12;

  const state = {
    size: 0.3, // epicycle radius, as a fraction of the deferent radius
    t: 0, // years since the start
  };

  const canvas = document.getElementById('epicycle-diagram');
  const sizeSlider = document.getElementById('epicycle-size-slider');
  const sizeLabel = document.getElementById('epicycle-size-label');
  const playButton = document.getElementById('epicycle-play-button');
  const motionStatus = document.getElementById('motion-status');
  const loopStatus = document.getElementById('loop-status');

  function position(t, s) {
    return EpicycleModel.position(t, DEFERENT_RADIUS, DEFERENT_ANGULAR_SPEED, s, EPICYCLE_ANGULAR_SPEED);
  }

  function deferentCentre(t) {
    return EpicycleModel.deferentCentre(t, DEFERENT_RADIUS, DEFERENT_ANGULAR_SPEED);
  }

  function toScreen(x, y, cx, cy, scalePx) {
    return { x: cx + x * scalePx, y: cy - y * scalePx };
  }

  function drawStarRing(ctx, cx, cy) {
    const starCount = 36;
    ctx.fillStyle = '#b7c3d1';
    for (let i = 0; i < starCount; i += 1) {
      const angle = (2 * Math.PI * i) / starCount;
      const x = cx + STAR_RING_RADIUS_PX * Math.cos(angle);
      const y = cy + STAR_RING_RADIUS_PX * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPath(ctx, cx, cy, s) {
    ctx.beginPath();
    const steps = 720;
    for (let i = 0; i <= steps; i += 1) {
      const t = (ANIMATION_YEARS * i) / steps;
      const p = position(t, s);
      const sp = toScreen(p.x, p.y, cx, cy, DEFERENT_RADIUS_PX);
      if (i === 0) ctx.moveTo(sp.x, sp.y);
      else ctx.lineTo(sp.x, sp.y);
    }
    ctx.strokeStyle = '#2a6bd6';
    ctx.lineWidth = 1.75;
    ctx.stroke();
  }

  function render() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const s = state.size;

    drawStarRing(ctx, cx, cy);

    // Deferent (dashed).
    ctx.beginPath();
    ctx.arc(cx, cy, DEFERENT_RADIUS_PX, 0, Math.PI * 2);
    ctx.strokeStyle = '#b7c3d1';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // The full traced path the model predicts — where this loops back
    // on itself is retrograde motion, with nothing else assumed.
    drawPath(ctx, cx, cy, s);

    // Earth, fixed at the centre.
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#2a6bd6';
    ctx.fill();
    ctx.strokeStyle = '#173d75';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // The epicycle itself (dashed), centred on the deferent at the
    // current t, and the planet riding on its edge.
    const centre = deferentCentre(state.t);
    const centreScreen = toScreen(centre.x, centre.y, cx, cy, DEFERENT_RADIUS_PX);
    ctx.beginPath();
    ctx.arc(centreScreen.x, centreScreen.y, s * DEFERENT_RADIUS_PX, 0, Math.PI * 2);
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    const planet = position(state.t, s);
    const planetScreen = toScreen(planet.x, planet.y, cx, cy, DEFERENT_RADIUS_PX);
    ctx.beginPath();
    ctx.arc(planetScreen.x, planetScreen.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#c0392b';
    ctx.fill();
    ctx.strokeStyle = '#7a2015';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#8a97a5';
    ctx.font = 'italic 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Deferent = Mars’s period (1.88 yr), epicycle = 1 year', 8, canvas.height - 10);
  }

  function updateMotionStatus() {
    const numerator = EpicycleModel.angularVelocityNumerator(state.t, DEFERENT_RADIUS, DEFERENT_ANGULAR_SPEED, state.size, EPICYCLE_ANGULAR_SPEED);
    motionStatus.textContent = numerator < 0 ? 'Currently: RETROGRADE — looping backward against the stars' : 'Currently: prograde — the usual eastward drift';
    motionStatus.classList.toggle('retrograde-active', numerator < 0);
  }

  // Whether the loop appears anywhere in the cycle at the current slider
  // size — independent of where the animation currently is.
  function updateLoopStatus() {
    const loops = EpicycleModel.showsRetrograde(DEFERENT_RADIUS, DEFERENT_ANGULAR_SPEED, state.size, EPICYCLE_ANGULAR_SPEED);
    loopStatus.textContent = loops ? 'Loop: ON — this epicycle produces a retrograde loop' : 'Loop: OFF — too small to loop back on itself';
    loopStatus.classList.toggle('retrograde-active', loops);
  }

  function updateSize() {
    state.size = Number(sizeSlider.value);
    sizeLabel.textContent = state.size.toFixed(2);
    render();
    updateMotionStatus();
    updateLoopStatus();
  }

  sizeSlider.addEventListener('input', updateSize);

  let animationFrameId = null;
  let animationStart = null;

  function stopAnimation() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    animationStart = null;
    playButton.textContent = '▶ Animate';
    playButton.setAttribute('aria-pressed', 'false');
  }

  function startAnimation() {
    playButton.textContent = '❚❚ Pause';
    playButton.setAttribute('aria-pressed', 'true');
    function step(now) {
      if (animationStart === null) animationStart = now;
      const elapsed = (now - animationStart) / 1000;
      state.t = ((elapsed / ANIMATION_SECONDS) % 1) * ANIMATION_YEARS;
      render();
      updateMotionStatus();
      animationFrameId = requestAnimationFrame(step);
    }
    animationFrameId = requestAnimationFrame(step);
  }

  playButton.addEventListener('click', () => {
    if (animationFrameId !== null) stopAnimation();
    else startAnimation();
  });

  // --- Two models: the same real positions, Earth-centred vs Sun-centred ---

  // A fixed illustrative date — not "today", so the diagram always shows
  // the same clear, well-separated layout. Chosen only because Mars sits
  // at a wide, easy-to-see elongation (~126°) then, not for any other
  // reason; src/planetaryMotion.js's own reference epoch plus 550 days.
  const TWO_MODELS_DATE = new Date(Date.UTC(2000, 0, 1, 12, 0, 0) + 550 * 86400000);

  function drawOrbitDiagram(canvasEl, bodies, centreBody) {
    const ctx = canvasEl.getContext('2d');
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    const cx = canvasEl.width / 2;
    const cy = canvasEl.height / 2;

    const maxDistance = Math.max(...bodies.map((b) => Math.hypot(b.x, b.y)), 0.1);
    const scalePx = (Math.min(canvasEl.width, canvasEl.height) / 2 - 30) / maxDistance;

    // Dashed orbit circle for every non-fixed body, centred on this
    // diagram's own fixed body — the real shape only for the one body
    // whose orbit is actually a circle around what's drawn fixed here.
    bodies.forEach((b) => {
      if (b.name === centreBody) return;
      const r = Math.hypot(b.x, b.y);
      ctx.beginPath();
      ctx.arc(cx, cy, r * scalePx, 0, Math.PI * 2);
      ctx.strokeStyle = '#d7dee6';
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    bodies.forEach((b) => {
      const p = toScreen(b.x, b.y, cx, cy, scalePx);
      ctx.beginPath();
      ctx.arc(p.x, p.y, b.radiusPx, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();
      ctx.strokeStyle = b.strokeColor;
      ctx.lineWidth = 1.25;
      ctx.stroke();

      ctx.fillStyle = '#2a2a2a';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.label, p.x, p.y - b.radiusPx - 6);
    });
  }

  function drawTwoModels() {
    const earth = PlanetaryMotion.heliocentricPosition('earth', TWO_MODELS_DATE);
    const mars = PlanetaryMotion.heliocentricPosition('mars', TWO_MODELS_DATE);
    const sun = { x: 0, y: 0 };

    const heliocentricCanvas = document.getElementById('two-models-heliocentric');
    if (heliocentricCanvas) {
      drawOrbitDiagram(
        heliocentricCanvas,
        [
          { x: sun.x, y: sun.y, label: 'Sun', color: '#f5a623', strokeColor: '#ad7312', radiusPx: 10, name: 'sun' },
          { x: earth.x, y: earth.y, label: 'Earth', color: '#2a6bd6', strokeColor: '#173d75', radiusPx: 7, name: 'earth' },
          { x: mars.x, y: mars.y, label: 'Mars', color: '#c0392b', strokeColor: '#7a2015', radiusPx: 6, name: 'mars' },
        ],
        'sun'
      );
    }

    const geocentricCanvas = document.getElementById('two-models-geocentric');
    if (geocentricCanvas) {
      drawOrbitDiagram(
        geocentricCanvas,
        [
          { x: 0, y: 0, label: 'Earth', color: '#2a6bd6', strokeColor: '#173d75', radiusPx: 9, name: 'earth' },
          { x: sun.x - earth.x, y: sun.y - earth.y, label: 'Sun', color: '#f5a623', strokeColor: '#ad7312', radiusPx: 8, name: 'sun' },
          { x: mars.x - earth.x, y: mars.y - earth.y, label: 'Mars', color: '#c0392b', strokeColor: '#7a2015', radiusPx: 6, name: 'mars' },
        ],
        'earth'
      );
    }
  }

  // --- A timeline: a real time axis from 150 CE to 1700 ---------------
  //
  // Events are placed at their TRUE year on the axis itself (tick marks
  // and gridlines), so the thirteen-century gap before Copernicus and
  // the cluster of ideas after him are genuinely visible in the spacing.
  // Five of the six events fall within the axis's last ~10% (1543-1687),
  // too close together to also host a legible, individually-tappable
  // marker right on the axis — so each marker/label instead sits at a
  // hand-spaced "display" position above the axis, joined to its own
  // true position by a thin leader line. The leader lines' convergence
  // near the right-hand end is itself part of the picture: it's what a
  // burst of activity within 150 years looks like next to 1400 quiet
  // ones.
  const TIMELINE_START_YEAR = 150;
  const TIMELINE_END_YEAR = 1700;
  const TIMELINE_MARGIN_LEFT = 16;
  const TIMELINE_MARGIN_RIGHT = 16;
  const TIMELINE_VIEWBOX_WIDTH = 700;
  const TIMELINE_PLOT_WIDTH = TIMELINE_VIEWBOX_WIDTH - TIMELINE_MARGIN_LEFT - TIMELINE_MARGIN_RIGHT;
  const TIMELINE_AXIS_Y = 110;
  const TIMELINE_MARKER_Y = 40;

  function timelineTrueX(year) {
    return TIMELINE_MARGIN_LEFT + ((year - TIMELINE_START_YEAR) / (TIMELINE_END_YEAR - TIMELINE_START_YEAR)) * TIMELINE_PLOT_WIDTH;
  }

  // A small illustrative drawing of the orbital model current at each
  // event, reused across events that share one (see each event's own
  // `model` below) — Earth-centred with epicycles, Sun-centred circles,
  // or Sun-centred ellipses, the three shapes this whole page's history
  // actually passes through.
  function timelineModelIconSvg(model) {
    if (model === 'epicycles') {
      return (
        '<svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">' +
        '<circle cx="26" cy="26" r="20" fill="none" stroke="#b7c3d1" stroke-width="1.5" stroke-dasharray="3,3"></circle>' +
        '<circle cx="26" cy="26" r="3" fill="#2a6bd6"></circle>' +
        '<circle cx="41" cy="18" r="7" fill="none" stroke="#c0392b" stroke-width="1.5" stroke-dasharray="2,2"></circle>' +
        '<circle cx="45" cy="14" r="2.5" fill="#c0392b"></circle>' +
        '</svg>'
      );
    }
    if (model === 'ellipses') {
      return (
        '<svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">' +
        '<ellipse cx="28" cy="26" rx="21" ry="13" fill="none" stroke="#2a6bd6" stroke-width="1.5"></ellipse>' +
        '<circle cx="13" cy="26" r="4" fill="#f5a623"></circle>' +
        '<circle cx="45" cy="26" r="2.5" fill="#2a6bd6"></circle>' +
        '</svg>'
      );
    }
    // 'circles': Sun-centred, still circular orbits.
    return (
      '<svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">' +
      '<circle cx="26" cy="26" r="4" fill="#f5a623"></circle>' +
      '<circle cx="26" cy="26" r="13" fill="none" stroke="#2a6bd6" stroke-width="1.25"></circle>' +
      '<circle cx="26" cy="26" r="20" fill="none" stroke="#c0392b" stroke-width="1.25"></circle>' +
      '<circle cx="39" cy="26" r="2.5" fill="#2a6bd6"></circle>' +
      '<circle cx="6" cy="26" r="2" fill="#c0392b"></circle>' +
      '</svg>'
    );
  }

  const TIMELINE_EVENTS = [
    {
      id: 'ptolemy',
      year: 150,
      displayX: 50, // nudged right of its true position (the axis's own left edge) so its centred label isn't clipped
      dateLabel: 'About 150 CE',
      label: 'Ptolemy',
      model: 'epicycles',
      detail:
        'Ptolemy fixed Earth at the centre and gave each planet a small epicycle circle riding on a larger deferent — the extra loop needed to reproduce retrograde motion and brightness changes, which a single circle around a fixed Earth could not.',
    },
    {
      id: 'copernicus',
      year: 1543,
      displayX: 150,
      dateLabel: '1543',
      label: 'Copernicus',
      model: 'circles',
      detail:
        'Copernicus put the Sun at the centre instead, with Earth and the other planets on circular orbits around it. Retrograde motion now fell out naturally, from Earth overtaking (or being overtaken by) another planet on its own orbit — no epicycles needed for that — though circular orbits alone still left small errors, which Copernicus had to patch with epicycles of his own, smaller than Ptolemy’s.',
    },
    {
      id: 'brahe',
      year: 1588,
      displayX: 300,
      dateLabel: '1576 to 1601',
      label: 'Brahe’s observations',
      model: 'circles',
      detail:
        'Tycho Brahe measured planetary positions, Mars’s especially, to about one arcminute using naked-eye instruments — the most accurate data before the telescope existed. It didn’t fit a circular orbit, even Copernicus’s Sun-centred one, though the mismatch was too small to have been caught by anyone less precise.',
    },
    {
      id: 'kepler',
      year: 1609,
      displayX: 440,
      dateLabel: '1609, then 1619',
      label: 'Kepler',
      model: 'ellipses',
      detail:
        'Using Brahe’s own data after his death, Kepler found in 1609 that Mars’s orbit was an ellipse with the Sun at one focus, not a circle (his first law), and that a line from the Sun to a planet sweeps out equal areas in equal times, so a planet moves fastest nearest the Sun (his second law). In 1619 he added a third: a planet’s orbital period squared is proportional to its orbit’s size cubed, tying every planet’s period to its distance from the Sun in one relationship.',
    },
    {
      id: 'galileo',
      year: 1610,
      displayX: 560,
      dateLabel: '1610',
      label: 'Galileo',
      model: 'circles',
      detail:
        'Galileo’s telescope showed Jupiter’s four largest moons circling Jupiter, not Earth, and Venus showing a full range of phases and a changing apparent size — only possible if Venus orbits the Sun, not Earth. See "Venus: the test" and "Galileo and Jupiter" below.',
    },
    {
      id: 'newton',
      year: 1687,
      displayX: 670, // nudged left of its true position so its centred label isn't clipped at the viewBox's right edge
      dateLabel: '1687',
      label: 'Newton',
      model: 'ellipses',
      detail:
        'Newton showed that a single inverse-square law of gravity between any two masses predicts exactly Kepler’s three laws as a consequence, not a separate set of rules to assume — the same force that makes an apple fall keeps every planet in its ellipse.',
    },
  ];

  function renderTimeline() {
    const svg = document.getElementById('timeline-diagram');
    if (!svg) return;

    let gridlines = '';
    for (let year = 200; year <= 1600; year += 200) {
      const x = timelineTrueX(year);
      gridlines +=
        `<line x1="${x}" y1="${TIMELINE_AXIS_Y - 4}" x2="${x}" y2="${TIMELINE_AXIS_Y + 4}" stroke="#cdd7e1" stroke-width="1"></line>` +
        `<text x="${x}" y="${TIMELINE_AXIS_Y + 16}" font-size="9" fill="#8a97a5" text-anchor="middle">${year}</text>`;
    }

    let markers = '';
    let defs = '';
    TIMELINE_EVENTS.forEach((event) => {
      const trueX = timelineTrueX(event.year);
      const term = `timeline-${event.id}`;

      markers +=
        `<line x1="${event.displayX}" y1="${TIMELINE_MARKER_Y + 7}" x2="${trueX}" y2="${TIMELINE_AXIS_Y}" stroke="#b7c3d1" stroke-width="1"></line>` +
        `<g class="glossary-toggle diagram-region" data-term="${term}" tabindex="0" role="button" aria-expanded="false" aria-label="What changed with ${event.label}? (${event.dateLabel})">` +
        `<circle cx="${event.displayX}" cy="${TIMELINE_MARKER_Y}" r="7" fill="#2a6bd6" stroke="#173d75" stroke-width="1.5"></circle>` +
        `<text x="${event.displayX}" y="${TIMELINE_MARKER_Y - 12}" font-size="11" font-weight="600" fill="#2a2a2a" text-anchor="middle">${event.label}</text>` +
        `<text x="${event.displayX}" y="${TIMELINE_MARKER_Y + 22}" font-size="9" fill="#555" text-anchor="middle">${event.dateLabel}</text>` +
        `</g>`;

      defs +=
        '<div class="glossary-definition timeline-event-detail" data-term="' + term + '" hidden>' +
        timelineModelIconSvg(event.model) +
        `<p><strong>${event.label} — ${event.dateLabel}.</strong> ${event.detail}</p>` +
        '</div>';
    });

    svg.innerHTML =
      `<line x1="${TIMELINE_MARGIN_LEFT}" y1="${TIMELINE_AXIS_Y}" x2="${TIMELINE_VIEWBOX_WIDTH - TIMELINE_MARGIN_RIGHT}" y2="${TIMELINE_AXIS_Y}" stroke="#8a97a5" stroke-width="1.5"></line>` +
      gridlines +
      markers;

    const container = svg.closest('.diagram');
    if (container) {
      const detailWrap = document.createElement('div');
      detailWrap.id = 'timeline-event-details';
      detailWrap.innerHTML = defs;
      container.after(detailWrap);
    }
  }

  // --- Venus's phases: Earth-centred prediction vs Sun-centred/Galileo's view --

  // A simple terminator curve for an illuminated fraction (0 = fully dark,
  // 1 = fully lit), the same construction notes/moon-phases.js's Earth-view
  // disc uses — a straight diameter at 0.5, curving further toward the lit
  // side as the fraction departs from it.
  function drawPhaseDisc(ctx, cx, cy, r, illuminatedFraction, waxing) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#2a2a2a';
    ctx.fill();

    // illuminatedFraction = (1 - cos(phaseAngle)) / 2 (the same relation
    // notes/moon-phases.js's own disc uses), rearranged for the
    // terminator curve's own e = cos(phaseAngle) term directly.
    const e = 1 - 2 * illuminatedFraction;
    const steps = 32;
    const points = [];
    for (let i = 0; i <= steps; i += 1) {
      const t = -Math.PI / 2 + (Math.PI * i) / steps;
      const y = cy - r * Math.sin(t);
      const outer = r * Math.cos(t);
      points.push([waxing ? cx + outer : cx - outer, y]);
    }
    for (let i = steps; i >= 0; i -= 1) {
      const t = -Math.PI / 2 + (Math.PI * i) / steps;
      const y = cy - r * Math.sin(t);
      const term = e * r * Math.cos(t);
      points.push([waxing ? cx + term : cx - term, y]);
    }

    ctx.beginPath();
    points.forEach(([x, y], idx) => (idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = '#f0e2a3';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#8a97a5';
    ctx.lineWidth = 1.25;
    ctx.stroke();
  }

  // Both diagrams are driven by the engine, at the date the slider picks
  // — not illustrative fixed values — via PlanetaryMotion's own
  // heliocentricPosition, illuminatedFraction and distanceFromEarthAU
  // (see src/planetaryMotion.js and test/planetaryMotion.test.js for the
  // underlying geometry and its own tests).
  const VENUS_START_DATE_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
  const venusDateSlider = document.getElementById('venus-date-slider');
  const venusDateLabel = document.getElementById('venus-date-label');
  const venusOrbitCanvas = document.getElementById('venus-orbit-diagram');
  const venusEarthViewCanvas = document.getElementById('venus-earth-view');
  const venusPhaseReadout = document.getElementById('venus-phase-readout');

  // Venus's apparent disc radius scales as 1/distance (a closer object
  // looks bigger) — calibrated so the two real extremes, about 0.28 AU
  // at inferior conjunction and about 1.72 AU at superior conjunction,
  // come out close to the "about six times bigger" ratio Galileo's own
  // observations showed (1.72 / 0.28 ≈ 6.2 — see
  // test/planetaryMotion.test.js's own distance-ratio test).
  const VENUS_APPARENT_RADIUS_K = 13;

  function updateVenusSection() {
    if (!venusDateSlider) return;
    const days = Number(venusDateSlider.value);
    const date = new Date(VENUS_START_DATE_MS + days * 86400000);
    venusDateLabel.textContent = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

    if (venusOrbitCanvas) {
      const sun = { x: 0, y: 0 };
      const earth = PlanetaryMotion.heliocentricPosition('earth', date);
      const venus = PlanetaryMotion.heliocentricPosition('venus', date);
      drawOrbitDiagram(
        venusOrbitCanvas,
        [
          { x: sun.x, y: sun.y, label: 'Sun', color: '#f5a623', strokeColor: '#ad7312', radiusPx: 10, name: 'sun' },
          { x: earth.x, y: earth.y, label: 'Earth', color: '#2a6bd6', strokeColor: '#173d75', radiusPx: 7, name: 'earth' },
          { x: venus.x, y: venus.y, label: 'Venus', color: '#c0392b', strokeColor: '#7a2015', radiusPx: 6, name: 'venus' },
        ],
        'sun'
      );
    }

    const illuminatedFraction = PlanetaryMotion.illuminatedFraction('venus', date);
    const distanceAU = PlanetaryMotion.distanceFromEarthAU('venus', date);
    // A later date's own illuminated fraction, to tell whether it's
    // currently growing (waxing) or shrinking (waning) — the same
    // numerical-derivative approach src/planetaryMotion.js's own
    // retrograde-direction tests use, not a second geometric model.
    const laterFraction = PlanetaryMotion.illuminatedFraction('venus', new Date(date.getTime() + 86400000));
    const waxing = laterFraction >= illuminatedFraction;

    if (venusEarthViewCanvas) {
      const ctx = venusEarthViewCanvas.getContext('2d');
      ctx.clearRect(0, 0, venusEarthViewCanvas.width, venusEarthViewCanvas.height);
      const radiusPx = Math.min(70, VENUS_APPARENT_RADIUS_K / distanceAU);
      drawPhaseDisc(ctx, venusEarthViewCanvas.width / 2, venusEarthViewCanvas.height / 2, radiusPx, illuminatedFraction, waxing);
    }

    if (venusPhaseReadout) {
      venusPhaseReadout.textContent =
        `Illuminated: ${Math.round(illuminatedFraction * 100)}% — distance from Earth: ${distanceAU.toFixed(2)} AU`;
    }
  }

  if (venusDateSlider) venusDateSlider.addEventListener('input', updateVenusSection);

  // --- Galileo and Jupiter: an animated strip of its four largest moons ----

  const jupiterCanvas = document.getElementById('jupiter-moons-strip');
  const jupiterPlayButton = document.getElementById('jupiter-play-button');
  const jupiterNightReadout = document.getElementById('jupiter-night-readout');
  const MOON_COLORS = ['#c0392b', '#2a6bd6', '#8a97a5', '#173d75'];
  const JUPITER_PX_PER_RADIUS = 5.2; // fits Callisto's 26.4-radius swing on a 420px-wide canvas

  function drawJupiterMoons(days) {
    if (!jupiterCanvas) return;
    const ctx = jupiterCanvas.getContext('2d');
    ctx.clearRect(0, 0, jupiterCanvas.width, jupiterCanvas.height);
    const cx = jupiterCanvas.width / 2;
    const cy = jupiterCanvas.height / 2;

    ctx.strokeStyle = '#e2e6ec';
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(jupiterCanvas.width, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#d9a86c';
    ctx.fill();
    ctx.strokeStyle = '#9c6a34';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    GalileanMoons.MOONS.forEach((moon, i) => {
      const offset = GalileanMoons.xOffsetJupiterRadii(moon, days);
      const x = cx + offset * JUPITER_PX_PER_RADIUS;
      ctx.beginPath();
      ctx.arc(x, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = MOON_COLORS[i];
      ctx.fill();

      // Alternating above/below the line so four names near the same x
      // position (all moons start aligned at day 0) don't overlap.
      ctx.fillStyle = '#555';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(moon.name, x, cy + (i % 2 === 0 ? -14 : 26));
    });
  }

  // Day 0 has every moon aligned with Jupiter (GalileanMoons.MOONS's own
  // reference point), which draws all four on top of each other — start
  // the static view a little further round instead, so the four moons
  // are visibly separated before "Animate" is ever pressed.
  let jupiterDays = 2;
  let jupiterAnimationId = null;

  function updateJupiterReadout() {
    if (jupiterNightReadout) jupiterNightReadout.textContent = `Night: ${jupiterDays.toFixed(1)}`;
  }

  function stopJupiterAnimation() {
    if (jupiterAnimationId !== null) {
      cancelAnimationFrame(jupiterAnimationId);
      jupiterAnimationId = null;
    }
    if (jupiterPlayButton) {
      jupiterPlayButton.textContent = '▶ Animate';
      jupiterPlayButton.setAttribute('aria-pressed', 'false');
    }
  }

  function startJupiterAnimation() {
    if (!jupiterPlayButton) return;
    jupiterPlayButton.textContent = '❚❚ Pause';
    jupiterPlayButton.setAttribute('aria-pressed', 'true');
    let lastTime = null;
    function step(now) {
      // Capped so a tab backgrounded mid-animation (rAF pauses while
      // hidden) doesn't replay the whole missed gap as one huge jump in
      // the moons' positions the instant it's foregrounded again.
      const elapsedSeconds = AnimationTiming.cappedElapsedSeconds(now, lastTime);
      lastTime = now;
      jupiterDays = (jupiterDays + elapsedSeconds * 2.5) % (GalileanMoons.MOONS.at(-1).periodDays * 2);
      drawJupiterMoons(jupiterDays);
      updateJupiterReadout();
      jupiterAnimationId = requestAnimationFrame(step);
    }
    jupiterAnimationId = requestAnimationFrame(step);
  }

  if (jupiterPlayButton) {
    jupiterPlayButton.addEventListener('click', () => {
      if (jupiterAnimationId !== null) stopJupiterAnimation();
      else startJupiterAnimation();
    });
  }

  // --- Brahe to Kepler: Mars's measured positions, fitted by an ellipse ----

  const MARS_SEMI_MAJOR_AXIS_AU = 1.524;
  // Mars's real eccentricity is only about 0.093 — accurate, but drawn
  // true to scale it looks like a circle to the eye, which is exactly
  // why Brahe's precision mattered and why this diagram wouldn't make
  // its own point. Exaggerated here instead, reusing the same 0.3 figure
  // sims/kepler.html's own interactive diagram already uses for the same
  // reason; the caption says so.
  const MARS_ECCENTRICITY = 0.3;

  function drawMarsEllipse() {
    const canvasEl = document.getElementById('mars-ellipse-fit');
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    const a = MARS_SEMI_MAJOR_AXIS_AU;
    const e = MARS_ECCENTRICITY;
    const c = a * e; // focus-to-centre distance, in the same AU units as a
    const scalePx = (canvasEl.height / 2 - 30) / (a * (1 + e));
    const cx = canvasEl.width / 2 - c * scalePx; // ellipse centre, offset so the Sun's focus is centred
    const cy = canvasEl.height / 2;

    // The ellipse itself, traced from the general polar-ellipse formula
    // OrbitalMechanics already provides (and already tests), not a new
    // one reinvented here.
    ctx.beginPath();
    const steps = 180;
    for (let i = 0; i <= steps; i += 1) {
      const nu = (2 * Math.PI * i) / steps;
      const r = OrbitalMechanics.radiusAtTrueAnomaly(nu, a, e);
      const x = cx + c * scalePx + r * Math.cos(nu) * scalePx;
      const y = cy - r * Math.sin(nu) * scalePx;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#8a97a5';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // The Sun, at one focus — not the ellipse's own centre.
    ctx.beginPath();
    ctx.arc(cx + c * scalePx, cy, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#f5a623';
    ctx.fill();
    ctx.strokeStyle = '#ad7312';
    ctx.lineWidth = 1.25;
    ctx.stroke();

    // Several illustrative "measured" points, evenly spread by mean
    // anomaly (not true anomaly, so they bunch up near perihelion, the
    // same way real observations taken at equal time intervals would —
    // Kepler's own second law in miniature).
    for (let i = 0; i < 10; i += 1) {
      const M = (2 * Math.PI * i) / 10;
      const p = OrbitalMechanics.positionAtMeanAnomaly(M, a, e);
      const x = cx + c * scalePx + p.x * scalePx;
      const y = cy - p.y * scalePx;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#c0392b';
      ctx.fill();
      ctx.strokeStyle = '#7a2015';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // --- Coverage, glossary and questions -------------------------------------

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    deferent: 'Deferent: the main, large circle a planet’s epicycle centre travels around in Ptolemy’s geocentric model, with Earth close to its centre.',
    epicycle: 'Epicycle: a small circle a planet rides on, whose own centre travels around the deferent — the extra loop Ptolemy added to explain retrograde motion.',
    equant: 'Equant: an off-centre point Ptolemy placed near the deferent’s centre, about which a planet’s motion appeared uniform even though its distance from Earth changed.',
    'epicycle-model-details':
      'This uses Mars’s real 1.88-year orbital period for the deferent; historically, every outer planet’s epicycle took exactly one year to match the Sun’s own apparent motion. Ptolemy’s real model also offset the deferent’s centre from Earth and measured motion as uniform about the equant instead — only the epicycle itself is shown here.',
    'epicycle-coincidence':
      'In Ptolemy’s Earth-centred model, that shared one-year period is an unexplained coincidence, repeated separately for every outer planet. In Copernicus’s Sun-centred model it isn’t a coincidence at all — it’s just Earth’s own orbit, which is why every outer planet shows the same retrograde pattern.',
    'two-models-geocentric-caption':
      'Re-centred on Earth: the Sun and Mars are drawn at exactly the same real positions as the Sun-centred diagram, just measured from Earth instead of the Sun. Nothing about the actual geometry changes — only which point is fixed.',
    'two-models-heliocentric-caption':
      'The real picture: Earth and Mars both orbit the Sun on roughly circular paths. Re-centring these same positions on Earth (the other diagram) is a valid change of viewpoint, but it tempts you to also put Earth’s motion into every other body’s path — which is exactly what epicycles did.',
    'brahe-precision':
      'Tycho Brahe measured planetary positions to about one arcminute using naked-eye instruments, decades before the telescope existed — far more precise than anything before him, and precise enough to show up Mars’s small but real departure from a circular orbit.',
    'kepler-struggle':
      'Kepler spent years trying to fit Brahe’s precise Mars data to a circular orbit, as every model before his had assumed, including Copernicus’s Sun-centred one. The data wouldn’t fit — the discrepancies were small, but Brahe’s observations were accurate enough that Kepler could tell they were real. Allowing the orbit to be an ellipse instead removed the discrepancy entirely.',
    'venus-heliocentric-prediction':
      'Sun-centred prediction: as Venus goes right round the Sun, its distance from Earth changes from about 0.28 AU (inferior conjunction, nearest) to about 1.72 AU (superior conjunction, farthest) — about six times closer at the near extreme, so it should look about six times bigger as a thin crescent than it does nearly full. The full phase only happens when Venus is far away, on the Sun’s far side. Galileo saw exactly this: the full set of phases, new to full, together with Venus visibly shrinking as it fattens.',
  };

  const thresholdOption = document.getElementById('loop-threshold-option');
  if (thresholdOption) thresholdOption.value = RETROGRADE_THRESHOLD.toFixed(2);
  const thresholdLabel = document.getElementById('loop-threshold-label');
  if (thresholdLabel) thresholdLabel.textContent = RETROGRADE_THRESHOLD.toFixed(2);

  sizeLabel.textContent = state.size.toFixed(2);
  render();
  updateMotionStatus();
  updateLoopStatus();
  drawTwoModels();
  renderTimeline();
  updateVenusSection();
  drawJupiterMoons(jupiterDays);
  updateJupiterReadout();
  drawMarsEllipse();
  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(GeocentricHeliocentricQuestions.makeQuestions());
})();
