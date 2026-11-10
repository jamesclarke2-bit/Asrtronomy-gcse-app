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

  function addLabel(wrap, x, y, width, height, text, className) {
    const el = document.createElement('span');
    el.className = className || 'labelled-diagram-label';
    el.style.left = `${(x / width) * 100}%`;
    el.style.top = `${(y / height) * 100}%`;
    el.textContent = text;
    wrap.appendChild(el);
    return el;
  }

  function clearDiagram(svg, wrap) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    wrap.querySelectorAll('.labelled-diagram-label, .star-label').forEach((el) => el.remove());
  }

  function formatArcsec(p) {
    return `${p.toFixed(3)}″`;
  }

  function formatDistance(pc) {
    return `${pc.toFixed(2)} pc (${P.parsecToLightYears(pc).toFixed(2)} ly)`;
  }

  // --- The opening diagram: plan view, Sun, two Earth positions, a
  // nearby star, and a background star field --------------------------

  const PLAN = {
    W: 380,
    H: 400,
    sunX: 190,
    sunY: 230,
    orbitR: 45,
    backgroundR: 160,
    starAngleDeg: 125, // measured the normal maths way: 0=right, 90=up
  };

  // Maps the slider's real distance (1-100 pc) onto an artistic,
  // compressed on-screen radius — real stellar distances are many
  // millions of times the Sun-Earth distance, far too large to draw to
  // scale, so this only has to shrink monotonically with distance, not
  // match it.
  function starScreenRadius(distancePc) {
    return 95 + 55 * Math.sqrt((distancePc - 1) / 99);
  }

  function pointAt(cx, cy, radius, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  }

  function drawParallaxPlan(distancePc) {
    const svg = document.getElementById('parallax-plan-diagram');
    const wrap = document.getElementById('parallax-plan-wrap');
    if (!svg || !wrap) return;
    clearDiagram(svg, wrap);
    const { W, H, sunX, sunY, orbitR, backgroundR, starAngleDeg } = PLAN;

    svgEl('rect', { x: 0, y: 0, width: W, height: H, rx: 8, fill: '#10141f' }, svg);

    // A scattering of fixed background stars, far enough away that
    // neither Earth position shifts them at all.
    const bgStars = svgEl('g', { fill: BACKGROUND_STAR_COLOR }, svg);
    for (let i = 0; i < 24; i += 1) {
      const angle = 60 + (i * 137.5) % 300; // a simple spread, not a grid
      const radius = backgroundR + 10 + ((i * 53) % 55);
      const p = pointAt(sunX, sunY, radius, angle);
      if (p.x < 4 || p.x > W - 4 || p.y < 4 || p.y > H - 4) continue;
      svgEl('circle', { cx: p.x, cy: p.y, r: 1.3, fill: BACKGROUND_STAR_COLOR, opacity: 0.6 }, bgStars);
    }

    // Earth's orbit (schematic) and the Sun at its centre.
    svgEl('circle', { cx: sunX, cy: sunY, r: orbitR, fill: 'none', stroke: SKY_LINE_COLOR, 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, svg);
    SunIcon.appendSunSvg(svg, sunX, sunY, 12, { coronaScale: 1.6 });

    const e1 = pointAt(sunX, sunY, orbitR, 0);
    const e2 = pointAt(sunX, sunY, orbitR, 180);
    svgEl('circle', { cx: e1.x, cy: e1.y, r: 5, fill: E1_COLOR }, svg);
    svgEl('circle', { cx: e2.x, cy: e2.y, r: 5, fill: E2_COLOR }, svg);
    addLabel(wrap, e1.x + 10, e1.y - 4, W, H, 'Earth, June', 'star-label');
    addLabel(wrap, e2.x - 10, e2.y - 4, W, H, 'Earth, December', 'star-label finder-polaris-label');

    // 1 AU baseline label, between the Sun and Earth's June position.
    const baselineMid = pointAt(sunX, sunY, orbitR / 2, 0);
    addLabel(wrap, baselineMid.x, baselineMid.y + 14, W, H, '1 AU', 'star-label');

    // The nearby star, at an artistic (not to-scale) distance.
    const starR = starScreenRadius(distancePc);
    const star = pointAt(sunX, sunY, starR, starAngleDeg);
    svgEl('circle', { cx: star.x, cy: star.y, r: 4, fill: STAR_COLOR }, svg);
    addLabel(wrap, star.x, star.y - 12, W, H, 'Nearby star', 'star-label finder-pattern-label');

    // Sight lines from each Earth position to the star, extended on to
    // the background star field — the two different directions the
    // star appears from, which is the whole parallax effect.
    function sightLineAndProjection(earthPoint, color) {
      svgEl('line', { x1: earthPoint.x, y1: earthPoint.y, x2: star.x, y2: star.y, stroke: color, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, svg);
      const angleFromEarth = (Math.atan2(-(star.y - earthPoint.y), star.x - earthPoint.x) * 180) / Math.PI;
      const projected = pointAt(sunX, sunY, backgroundR, angleFromEarth);
      svgEl('line', { x1: star.x, y1: star.y, x2: projected.x, y2: projected.y, stroke: color, 'stroke-width': 1, 'stroke-dasharray': '2 3', opacity: 0.6 }, svg);
      svgEl('circle', { cx: projected.x, cy: projected.y, r: 3.5, fill: 'none', stroke: color, 'stroke-width': 2 }, svg);
      return projected;
    }
    const p1 = sightLineAndProjection(e1, E1_COLOR);
    const p2 = sightLineAndProjection(e2, E2_COLOR);
    const midProjected = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    addLabel(wrap, midProjected.x, midProjected.y - 14, W, H, 'Apparent shift', 'star-label');
  }

  function setUpParallaxDiagram() {
    const slider = document.getElementById('parallax-distance-slider');
    const label = document.getElementById('parallax-distance-label');
    const angleReadout = document.getElementById('parallax-angle-readout');
    const distanceReadout = document.getElementById('parallax-distance-readout');

    function render() {
      const distancePc = Number(slider.value);
      label.textContent = `${distancePc} pc`;
      drawParallaxPlan(distancePc);
      const p = P.parallaxFromDistance(distancePc);
      angleReadout.textContent = formatArcsec(p);
      distanceReadout.textContent = formatDistance(distancePc);
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

  const UNCERTAINTY_BAR_MAX_PC = 220;

  function setUpUncertaintyDemo() {
    const parallaxInput = document.getElementById('uncertainty-parallax-input');
    const uncertaintyInput = document.getElementById('uncertainty-input');
    const readout = document.getElementById('uncertainty-range-readout');
    const barFill = document.getElementById('uncertainty-bar-fill');

    function render() {
      const p = Number(parallaxInput.value);
      const unc = Number(uncertaintyInput.value);
      const { nearPc, farPc } = P.parallaxUncertaintyToDistanceRange(p, unc);
      readout.textContent = farPc === null
        ? `at least ${nearPc.toFixed(1)} pc (no upper bound — the uncertainty reaches zero parallax)`
        : `about ${nearPc.toFixed(1)} to ${farPc.toFixed(1)} pc`;

      const farForBar = Math.min(farPc === null ? UNCERTAINTY_BAR_MAX_PC : farPc, UNCERTAINTY_BAR_MAX_PC);
      const nearPercent = Math.min(100, (nearPc / UNCERTAINTY_BAR_MAX_PC) * 100);
      const farPercent = Math.min(100, (farForBar / UNCERTAINTY_BAR_MAX_PC) * 100);
      barFill.style.left = `${nearPercent}%`;
      barFill.style.width = `${Math.max(0, farPercent - nearPercent)}%`;
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

  setUpParallaxDiagram();
  renderUnits();
  renderLimits();
  setUpUncertaintyDemo();
  setUpStarList();
  QuizUI.mount(ParallaxQuestions.makeQuestions(Parallax));
  renderCoverage();
  Glossary.init(GLOSSARY);
})();
