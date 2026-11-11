(function () {
  const CURRICULUM_UNITS = ['u4.5', 'u3.4'];
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const P = Parallax;

  const SKY_LINE_COLOR = '#6f8fb8';
  const STAR_COLOR = '#f5e8c8';
  const BACKGROUND_STAR_COLOR = '#b7c3d1';
  const E1_COLOR = '#4fb3ff';
  const E2_COLOR = '#ff9d4f';

  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (parent) parent.appendChild(el);
    return el;
  }

  // Always carries the base 'diagram-label' class (styles.css's own
  // positioning rule) plus whatever modifier (e.g. 'diagram-label--left')
  // is passed in — never just the modifier alone, which has no
  // position:absolute of its own to anchor by.
  function addLabel(wrap, x, y, width, height, text, className) {
    const el = document.createElement('span');
    el.className = `diagram-label${className ? ` ${className}` : ''}`;
    el.style.left = `${(x / width) * 100}%`;
    el.style.top = `${(y / height) * 100}%`;
    el.textContent = text;
    wrap.appendChild(el);
    return el;
  }

  function clearDiagram(svg, wrap) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    wrap.querySelectorAll('.diagram-label').forEach((el) => el.remove());
  }

  function formatArcsec(p) {
    return `${p.toFixed(3)}″`;
  }

  function formatDistance(pc) {
    return `${pc.toFixed(2)} pc (${P.parsecToLightYears(pc).toFixed(2)} ly)`;
  }

  function pointAt(cx, cy, radius, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  }

  // Which way a label anchored at this horizontal fraction of its diagram
  // should grow, so it always grows back toward the middle rather than off
  // the edge of a narrow phone screen (see notes/magnitude.js's own
  // identical helper and its test/noHorizontalScroll.test.js motivation).
  function sideClassForFraction(fraction) {
    return fraction >= 0.5 ? 'diagram-label--left' : 'diagram-label--right';
  }

  // --- Shared month/geometry maths for the orbit + sky panels ----------
  // A fixed sky direction (and, doubling as the sinusoid's phase) from the
  // Sun to the reference "near" star — 0° places it due "east" in the
  // orbit panel and puts the parallax displacement's zero-crossings at
  // month 0 (January) and month 6 (July), with its two extremes (the
  // widest possible shift, and so the two positions actually used to
  // measure it) at month 3 (April) and month 9 (October), six months
  // apart by construction — matching PART 1's own requirement to mark
  // them, without needing a second, separately-tuned pair of months.

  const PHI_DEG = 0;
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const EXTREME_MONTHS = [3, 9];

  function monthAngleDeg(month) {
    return (month / 12) * 360;
  }

  // The signed parallax displacement at a given (possibly fractional)
  // month, in arcseconds — amplitude from the real engine
  // (P.parallaxFromDistance), the sin(θ-φ) swing a purely geometric,
  // presentation-only factor (see this page's own exam tip: p itself,
  // the angle at the star, is the AMPLITUDE this reaches at its peak,
  // not the month-to-month value itself).
  function parallaxDisplacementArcsec(distancePc, month) {
    const pMax = P.parallaxFromDistance(distancePc);
    const thetaRad = ((monthAngleDeg(month) - PHI_DEG) * Math.PI) / 180;
    return pMax * Math.sin(thetaRad);
  }

  // --- Panel 1: "Earth's orbit from above" ------------------------------

  const ORBIT_W = 280;
  const ORBIT_H = 280;
  const ORBIT_CX = 140;
  const ORBIT_CY = 140;
  const ORBIT_R = 70;
  const ORBIT_STAR_R = 115;

  let orbitParts = null;

  function drawOrbitOnce() {
    if (orbitParts) return orbitParts;
    const svg = document.getElementById('orbit-diagram');
    const wrap = document.getElementById('orbit-diagram-wrap');
    clearDiagram(svg, wrap);

    svgEl('rect', { x: 0, y: 0, width: ORBIT_W, height: ORBIT_H, rx: 8, fill: '#10141f' }, svg);
    svgEl('circle', { cx: ORBIT_CX, cy: ORBIT_CY, r: ORBIT_R, fill: 'none', stroke: SKY_LINE_COLOR, 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, svg);
    SunIcon.appendSunSvg(svg, ORBIT_CX, ORBIT_CY, 11, { coronaScale: 1.6 });

    const star = pointAt(ORBIT_CX, ORBIT_CY, ORBIT_STAR_R, PHI_DEG);
    const earthLine = svgEl('line', { class: 'orbit-earth-part', x1: ORBIT_CX, y1: ORBIT_CY, x2: star.x, y2: star.y, stroke: E1_COLOR, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, svg);
    svgEl('circle', { cx: star.x, cy: star.y, r: 4, fill: STAR_COLOR }, svg);
    addLabel(wrap, star.x, star.y - 14, ORBIT_W, ORBIT_H, 'Nearby star', sideClassForFraction(star.x / ORBIT_W));

    const earthDot = svgEl('circle', { class: 'orbit-earth-part', cx: ORBIT_CX, cy: ORBIT_CY, r: 5, fill: E1_COLOR }, svg);
    const earthLabel = addLabel(wrap, ORBIT_CX, ORBIT_CY, ORBIT_W, ORBIT_H, 'Earth');
    earthLabel.classList.add('orbit-earth-part');

    orbitParts = { earthLine, earthDot, earthLabel };
    return orbitParts;
  }

  function updateOrbit(month) {
    const parts = drawOrbitOnce();
    const earth = pointAt(ORBIT_CX, ORBIT_CY, ORBIT_R, monthAngleDeg(month));
    parts.earthLine.setAttribute('x1', earth.x);
    parts.earthLine.setAttribute('y1', earth.y);
    parts.earthDot.setAttribute('cx', earth.x);
    parts.earthDot.setAttribute('cy', earth.y);
    const fraction = earth.x / ORBIT_W;
    parts.earthLabel.style.left = `${fraction * 100}%`;
    parts.earthLabel.style.top = `${((earth.y + 16) / ORBIT_H) * 100}%`;
    parts.earthLabel.classList.remove('diagram-label--left', 'diagram-label--right');
    parts.earthLabel.classList.add(sideClassForFraction(fraction));
  }

  // --- Panel 2: "What you see in the night sky" -------------------------

  const SKY_W = 280;
  const SKY_H = 280;
  const SKY_CX = 140;
  const REFERENCE_DISTANCE_PC = 2;
  const PIXELS_AT_REFERENCE = 55; // the on-screen swing at the "near" preset — magnified so it's visible at all (see the page's own note)
  const THREE_STAR_DISTANCES = [
    { key: 'near', pc: 2, color: '#ff9d4f', laneY: 95 },
    { key: 'medium', pc: 5, color: '#7fd4a0', laneY: 140 },
    { key: 'far', pc: 10, color: '#4fb3ff', laneY: 185 },
  ];

  function skyOffsetPx(distancePc, month) {
    const refPeak = P.parallaxFromDistance(REFERENCE_DISTANCE_PC);
    return (parallaxDisplacementArcsec(distancePc, month) / refPeak) * PIXELS_AT_REFERENCE;
  }

  function buildTracePoints(distancePc, laneY) {
    const steps = 48;
    const points = [];
    for (let i = 0; i <= steps; i += 1) {
      const month = (i / steps) * 12;
      points.push(`${(SKY_CX + skyOffsetPx(distancePc, month)).toFixed(1)},${laneY}`);
    }
    return points.join(' ');
  }

  let skyBackgroundDrawn = false;
  let skyForeground = null;

  function drawSkyBackgroundOnce() {
    if (skyBackgroundDrawn) return;
    const svg = document.getElementById('sky-diagram');
    const wrap = document.getElementById('sky-diagram-wrap');
    clearDiagram(svg, wrap);
    svgEl('rect', { x: 0, y: 0, width: SKY_W, height: SKY_H, rx: 8, fill: '#0f1830' }, svg);
    // Fixed background stars — truly static, drawn once and never
    // touched again, however the month, distance or "show all three"
    // toggle change: the whole point is that they never move.
    const bgStars = [
      [25, 30], [60, 18], [100, 40], [160, 20], [210, 35], [250, 25], [265, 55],
      [30, 230], [70, 250], [120, 240], [180, 255], [230, 245], [255, 220],
      [20, 130], [45, 160], [255, 130], [230, 165], [140, 25], [140, 255],
    ];
    const starsGroup = svgEl('g', {}, svg);
    bgStars.forEach(([x, y]) => svgEl('circle', { cx: x, cy: y, r: 1.2, fill: '#9fb3d9', opacity: 0.6 }, starsGroup));
    skyForeground = svgEl('g', { id: 'sky-foreground-group' }, svg);
    skyBackgroundDrawn = true;
  }

  // Lanes/traces depend on distance and the "all three" toggle, so they're
  // rebuilt (not updated in place) whenever either changes; only the
  // current-month marker(s) inside them are then kept persistent across a
  // month-only change, for the same smooth-transition reason as the orbit
  // panel's own Earth marker.
  let skyMarkers = [];

  function rebuildSkyForeground(showAllThree, distancePc) {
    drawSkyBackgroundOnce();
    while (skyForeground.firstChild) skyForeground.removeChild(skyForeground.firstChild);
    document.querySelectorAll('#sky-diagram-wrap .sky-lane-label').forEach((el) => el.remove());
    skyMarkers = [];

    const wrap = document.getElementById('sky-diagram-wrap');
    const lanes = showAllThree ? THREE_STAR_DISTANCES : [{ key: 'single', pc: distancePc, color: STAR_COLOR, laneY: 140 }];

    lanes.forEach((lane) => {
      svgEl('polyline', {
        points: buildTracePoints(lane.pc, lane.laneY),
        fill: 'none', stroke: lane.color, 'stroke-width': 1, 'stroke-dasharray': '2 3', opacity: 0.65,
      }, skyForeground);

      // The two positions six months apart (the widest possible shift —
      // see this file's own PHI_DEG comment for why these are always
      // months 3 and 9).
      EXTREME_MONTHS.forEach((m) => {
        const x = SKY_CX + skyOffsetPx(lane.pc, m);
        svgEl('circle', { cx: x, cy: lane.laneY, r: 3, fill: 'none', stroke: lane.color, 'stroke-width': 1.5 }, skyForeground);
      });

      const marker = svgEl('circle', { class: 'sky-marker-part', cy: lane.laneY, r: 4.5, fill: lane.color }, skyForeground);
      skyMarkers.push({ el: marker, pc: lane.pc, laneY: lane.laneY });

      if (showAllThree) {
        const label = document.createElement('span');
        label.className = 'diagram-label diagram-label--right sky-lane-label';
        label.style.left = '2%';
        label.style.top = `${(lane.laneY / SKY_H) * 100}%`;
        label.textContent = `${lane.pc} pc`;
        wrap.appendChild(label);
      }
    });
  }

  function updateSkyMarkers(month) {
    skyMarkers.forEach(({ el, pc, laneY }) => {
      el.setAttribute('cx', SKY_CX + skyOffsetPx(pc, month));
      el.setAttribute('cy', laneY);
    });
  }

  // --- Wiring: month slider/nav/play, distance slider/presets, toggle --

  function setUpOrbitAndSkyDiagrams() {
    const monthSlider = document.getElementById('month-slider');
    const monthLabel = document.getElementById('month-label');
    const monthPrev = document.getElementById('month-prev');
    const monthNext = document.getElementById('month-next');
    const monthPlay = document.getElementById('month-play');
    const distanceSlider = document.getElementById('parallax-distance-slider');
    const distanceLabel = document.getElementById('parallax-distance-label');
    const angleReadout = document.getElementById('parallax-angle-readout');
    const distanceReadout = document.getElementById('parallax-distance-readout');
    const comparisonSentence = document.getElementById('parallax-comparison-sentence');
    const showAllThreeToggle = document.getElementById('show-all-three-toggle');
    const presetButtons = [...document.querySelectorAll('[data-distance-pc]')];

    function currentMonth() {
      return Number(monthSlider.value);
    }

    function renderMonth() {
      const month = currentMonth();
      monthLabel.textContent = MONTH_NAMES[month];
      updateOrbit(month);
      updateSkyMarkers(month);
      const distancePc = Number(distanceSlider.value);
      const p = Math.abs(parallaxDisplacementArcsec(distancePc, month));
      angleReadout.textContent = `${formatArcsec(p)} (peak: ${formatArcsec(P.parallaxFromDistance(distancePc))})`;
    }

    function renderDistance() {
      const distancePc = Number(distanceSlider.value);
      distanceLabel.textContent = `${distancePc} pc`;
      distanceReadout.textContent = formatDistance(distancePc);
      rebuildSkyForeground(showAllThreeToggle.checked, distancePc);
      renderMonth();

      const refPc = REFERENCE_DISTANCE_PC;
      const ratio = distancePc / refPc;
      const parallaxRatio = P.parallaxFromDistance(distancePc) / P.parallaxFromDistance(refPc);
      comparisonSentence.textContent =
        ratio === 1
          ? `At ${refPc} pc, this star IS the near reference star.`
          : `${ratio.toFixed(1)}× as far as the near (${refPc} pc) star, so ${parallaxRatio.toFixed(2)}× its parallax angle.`;
    }

    monthSlider.addEventListener('input', renderMonth);
    distanceSlider.addEventListener('input', renderDistance);
    showAllThreeToggle.addEventListener('change', renderDistance);

    monthPrev.addEventListener('click', () => {
      monthSlider.value = (currentMonth() + 11) % 12;
      renderMonth();
    });
    monthNext.addEventListener('click', () => {
      monthSlider.value = (currentMonth() + 1) % 12;
      renderMonth();
    });

    presetButtons.forEach((button) => {
      button.addEventListener('click', () => {
        distanceSlider.value = button.dataset.distancePc;
        renderDistance();
      });
    });

    // A plain step timer, not a continuous rAF animation: each tick just
    // jumps the slider one month on, exactly like clicking Next — so
    // "reduced motion safe" falls straight out of styles.css's own
    // .idea-star-part-style guard (see .orbit-earth-part/.sky-marker-part
    // below): under prefers-reduced-motion, the per-step CSS transition is
    // disabled and each step simply jumps, rather than this needing its
    // own separate reduced-motion branch.
    let playIntervalId = null;
    function stopPlaying() {
      if (playIntervalId === null) return;
      clearInterval(playIntervalId);
      playIntervalId = null;
      monthPlay.textContent = '▶ Play';
      monthPlay.setAttribute('aria-pressed', 'false');
    }
    function startPlaying() {
      monthPlay.textContent = '❚❚ Pause';
      monthPlay.setAttribute('aria-pressed', 'true');
      playIntervalId = setInterval(() => {
        monthSlider.value = (currentMonth() + 1) % 12;
        renderMonth();
      }, 900);
    }
    monthPlay.addEventListener('click', () => {
      if (playIntervalId === null) startPlaying();
      else stopPlaying();
    });

    renderDistance();
  }

  // --- "What exactly is the parallax angle?": the Sun-Earth-star triangle

  const TRI_W = 380;
  const TRI_H = 260;
  const TRI_SUN = { x: 60, y: 210 };
  const TRI_EARTH = { x: 60, y: 60 };
  const TRI_STAR_X = 330;

  function drawTriangleOnce() {
    const svg = document.getElementById('triangle-diagram');
    const wrap = document.getElementById('triangle-diagram-wrap');
    clearDiagram(svg, wrap);
    svgEl('rect', { x: 0, y: 0, width: TRI_W, height: TRI_H, rx: 8, fill: '#f7f7f5' }, svg);

    const star = { x: TRI_STAR_X, y: TRI_SUN.y };
    // The right angle at the Sun, the 1 AU side, the (not-to-scale) long
    // side to the star, and the hypotenuse from Earth to the star.
    svgEl('rect', { x: TRI_SUN.x, y: TRI_SUN.y - 14, width: 14, height: 14, fill: 'none', stroke: '#444', 'stroke-width': 1.5 }, svg);
    svgEl('line', { x1: TRI_SUN.x, y1: TRI_SUN.y, x2: TRI_EARTH.x, y2: TRI_EARTH.y, stroke: E1_COLOR, 'stroke-width': 2 }, svg);
    svgEl('line', { x1: TRI_SUN.x, y1: TRI_SUN.y, x2: star.x, y2: star.y, stroke: '#444', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, svg);
    svgEl('line', { x1: TRI_EARTH.x, y1: TRI_EARTH.y, x2: star.x, y2: star.y, stroke: '#444', 'stroke-width': 1.5 }, svg);

    SunIcon.appendSunSvg(svg, TRI_SUN.x, TRI_SUN.y, 10, { coronaScale: 1.5 });
    svgEl('circle', { cx: TRI_EARTH.x, cy: TRI_EARTH.y, r: 5, fill: E1_COLOR }, svg);
    svgEl('circle', { cx: star.x, cy: star.y, r: 4, fill: '#8a5b00' }, svg);

    addLabel(wrap, (TRI_SUN.x + TRI_EARTH.x) / 2 - 16, (TRI_SUN.y + TRI_EARTH.y) / 2, TRI_W, TRI_H, '1 AU', 'diagram-label--right');
    addLabel(wrap, TRI_SUN.x, TRI_SUN.y + 18, TRI_W, TRI_H, 'Sun', 'diagram-label--right');
    addLabel(wrap, TRI_EARTH.x, TRI_EARTH.y - 16, TRI_W, TRI_H, 'Earth', 'diagram-label--right');
    addLabel(wrap, star.x, star.y - 16, TRI_W, TRI_H, 'Star', 'diagram-label--left');

    // The angle p, marked at the star, between its own directions to the
    // Sun and to Earth — a small arc plus an arrow, not the full triangle.
    const arcR = 26;
    const toSunAngle = (Math.atan2(-(TRI_SUN.y - star.y), TRI_SUN.x - star.x) * 180) / Math.PI;
    const toEarthAngle = (Math.atan2(-(TRI_EARTH.y - star.y), TRI_EARTH.x - star.x) * 180) / Math.PI;
    const arcStart = pointAt(star.x, star.y, arcR, toSunAngle);
    const arcEnd = pointAt(star.x, star.y, arcR, toEarthAngle);
    svgEl('path', {
      d: `M ${arcStart.x} ${arcStart.y} A ${arcR} ${arcR} 0 0 1 ${arcEnd.x} ${arcEnd.y}`,
      fill: 'none', stroke: '#c0392b', 'stroke-width': 2,
    }, svg);
    const arcMid = pointAt(star.x, star.y, arcR + 16, (toSunAngle + toEarthAngle) / 2);
    addLabel(wrap, arcMid.x, arcMid.y, TRI_W, TRI_H, 'p', 'diagram-label--left');
  }

  function setUpGeometryDiagram() {
    const slider = document.getElementById('geometry-distance-slider');
    const label = document.getElementById('geometry-distance-label');
    const readout = document.getElementById('geometry-angle-readout');
    drawTriangleOnce();
    function render() {
      const d = Number(slider.value);
      label.textContent = `${d} pc`;
      readout.textContent = formatArcsec(P.parallaxFromDistance(d));
    }
    slider.addEventListener('input', render);
    render();
  }

  // --- The units: arcseconds and parsecs ------------------------------

  function renderUnits() {
    document.getElementById('units-au-per-parsec').textContent = Math.round(P.AU_PER_PARSEC).toLocaleString('en-GB');
    document.getElementById('units-ly-per-parsec').textContent = P.PARSEC_LIGHT_YEARS.toFixed(2);
    document.getElementById('units-m-per-parsec').textContent = `${(P.METRES_PER_PARSEC / 1e16).toFixed(2)} × 10¹⁶`;
    document.getElementById('units-ly-factor').textContent = P.PARSEC_LIGHT_YEARS.toFixed(2);

    const body = document.getElementById('units-example-table-body');
    body.innerHTML = '';
    [1, 0.5, 0.2, 0.1, 0.01].forEach((p) => {
      const pc = P.distanceFromParallax(p);
      const ly = P.parsecToLightYears(pc);
      const tr = document.createElement('tr');
      [p.toFixed(3), pc.toFixed(2), ly.toFixed(1)].forEach((text) => {
        const td = document.createElement('td');
        td.textContent = text;
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
  }

  // --- Limits: ground telescopes, Hipparcos, Gaia ----------------------

  const GROUND_LIMIT_ARCSEC = 0.01;

  // First draft, to be checked by the teacher — approximate real
  // figures for each mission's best parallax precision.
  const SATELLITE_LIMITS = [
    { method: 'Ground-based telescope', arcsec: 0.01 },
    { method: 'Hipparcos satellite (1989-93)', arcsec: 0.001 },
    { method: 'Gaia satellite (bright stars)', arcsec: 0.00003 },
  ];

  function renderLimits() {
    document.getElementById('limits-ground-arcsec').textContent = GROUND_LIMIT_ARCSEC.toFixed(2);
    document.getElementById('limits-ground-pc').textContent = Math.round(P.distanceFromParallax(GROUND_LIMIT_ARCSEC));

    const body = document.getElementById('limits-satellite-table-body');
    body.innerHTML = '';
    SATELLITE_LIMITS.forEach(({ method, arcsec }) => {
      const pc = P.distanceFromParallax(arcsec);
      const tr = document.createElement('tr');
      [method, arcsec.toString(), Math.round(pc).toLocaleString('en-GB')].forEach((text) => {
        const td = document.createElement('td');
        td.textContent = text;
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
  }

  // --- Uncertainty: a small p with an uncertainty gives a wide range --

  const UNCERTAINTY_BAR_MAX_PC = 250;
  const UNCERTAINTY_AXIS_TICKS_PC = [0, 50, 100, 150, 200, 250];

  function renderUncertaintyAxis() {
    const axis = document.getElementById('uncertainty-bar-axis');
    axis.innerHTML = '';
    UNCERTAINTY_AXIS_TICKS_PC.forEach((pc) => {
      const tick = document.createElement('span');
      tick.className = 'uncertainty-bar-axis-tick';
      tick.style.left = `${(pc / UNCERTAINTY_BAR_MAX_PC) * 100}%`;
      tick.textContent = pc;
      axis.appendChild(tick);
    });
  }

  function setUpUncertaintyDemo() {
    const parallaxInput = document.getElementById('uncertainty-parallax-input');
    const uncertaintyInput = document.getElementById('uncertainty-input');
    const explanation = document.getElementById('uncertainty-explanation');
    const barFill = document.getElementById('uncertainty-bar-fill');
    const barBest = document.getElementById('uncertainty-bar-best');

    renderUncertaintyAxis();

    function render() {
      const p = Number(parallaxInput.value);
      const unc = Number(uncertaintyInput.value);
      const { nearPc, farPc } = P.parallaxUncertaintyToDistanceRange(p, unc);
      const bestPc = P.distanceFromParallax(p);
      const lowerP = p - unc;
      const upperP = p + unc;

      explanation.textContent =
        `Measured parallax p = ${p.toFixed(3)} arcsec, uncertainty ±${unc.toFixed(3)} arcsec, so the true p is ` +
        `between ${lowerP > 0 ? lowerP.toFixed(3) : 0} and ${upperP.toFixed(3)} arcsec. The nearest the star could ` +
        `be (largest p, ${upperP.toFixed(3)}) is ${nearPc.toFixed(1)} pc; the furthest ` +
        (farPc === null
          ? `(smallest p, ${lowerP.toFixed(3)} or below zero) has no upper bound at all.`
          : `(smallest p, ${lowerP.toFixed(3)}) is ${farPc.toFixed(1)} pc.`);

      const farForBar = Math.min(farPc === null ? UNCERTAINTY_BAR_MAX_PC : farPc, UNCERTAINTY_BAR_MAX_PC);
      const nearPercent = Math.min(100, (nearPc / UNCERTAINTY_BAR_MAX_PC) * 100);
      const farPercent = Math.min(100, (farForBar / UNCERTAINTY_BAR_MAX_PC) * 100);
      barFill.style.left = `${nearPercent}%`;
      barFill.style.width = `${Math.max(0, farPercent - nearPercent)}%`;
      barBest.style.left = `${Math.min(100, (bestPc / UNCERTAINTY_BAR_MAX_PC) * 100)}%`;
      barBest.setAttribute('aria-label', `Best single estimate: ${bestPc.toFixed(1)} pc`);
    }
    parallaxInput.addEventListener('input', render);
    uncertaintyInput.addEventListener('input', render);
    render();
  }

  // --- Real stars, real parallaxes ------------------------------------
  // Every parallax figure is the one first-draft datum per star (see
  // src/parallax.js's own STARS array, now shared with
  // notes/magnitude.html's distance-modulus tier); the distance (pc and
  // ly) is always computed from it, never a second, separately-typed
  // figure that could drift out of step.

  function setUpStarList() {
    const select = document.getElementById('star-select');
    const parallaxReadout = document.getElementById('star-parallax-readout');
    const distanceReadout = document.getElementById('star-distance-readout');

    P.STARS.forEach((star) => {
      const option = document.createElement('option');
      option.value = star.name;
      option.textContent = star.name;
      select.appendChild(option);
    });

    function render() {
      const star = P.STARS.find((s) => s.name === select.value) || P.STARS[0];
      parallaxReadout.textContent = formatArcsec(star.parallaxArcsec);
      distanceReadout.textContent = formatDistance(P.distanceFromParallax(star.parallaxArcsec));
    }
    select.addEventListener('change', render);
    render();
  }

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    arcminute: "Arcminute ('): 1/60 of a degree. 1 degree is 60 arcminutes.",
    arcsecond: 'Arcsecond ("): 1/60 of an arcminute, or 1/3600 of a degree — the unit parallax angles are measured in, since they are far too small for whole degrees to be useful.',
    parsec:
      "Parsec (pc): the distance at which 1 AU subtends an angle of exactly 1 arcsecond of parallax — about 206,265 AU, or about 3.26 light years. Astronomers' preferred unit for distances to other stars, defined directly from the parallax method itself.",
    lightYear:
      'Light year (ly): the distance light travels in one year — about 9.5 × 10¹² km. A unit of distance, not time, despite the name.',
  };

  setUpOrbitAndSkyDiagrams();
  setUpGeometryDiagram();
  renderUnits();
  renderLimits();
  setUpUncertaintyDemo();
  setUpStarList();
  QuizUI.mount(ParallaxQuestions.makeQuestions(Parallax));
  renderCoverage();
  Glossary.init(GLOSSARY);
})();
