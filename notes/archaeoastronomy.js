(function () {
  const CURRICULUM_UNITS = ['u3.5'];
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const RAD = Math.PI / 180;
  const M = MeasuringTheSky;
  const { STARS, angularSeparation } = StarPatterns;

  const SKY_LINE_COLOR = '#6f8fb8';
  const STONE_COLOR = '#9aa5b5';
  const SUN_COLOR = '#ffcf5c';

  const CURRENT_YEAR = 2026;

  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (parent) parent.appendChild(el);
    return el;
  }

  // Labels are HTML, never SVG text, positioned as a share of the viewBox.
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

  function formatSep(deg) {
    return deg < 1 ? `${deg.toFixed(1)}°` : `${Math.round(deg)}°`;
  }

  // Every signed readout shows its own sign, rather than leaving a plain
  // "28°" to mean "28° too high" by implication.
  function formatSigned(deg) {
    const rounded = Math.round(deg);
    return `${rounded >= 0 ? '+' : ''}${rounded}°`;
  }

  // Astronomical year numbering (0 = 1 BCE) to a BCE/AD label.
  function formatYear(year) {
    return year <= 0 ? `${1 - year} BCE` : `AD ${year}`;
  }

  // --- Axial precession: the pole's ~26,000-year circle -------------------

  const PRECESSION_CIRCLE = { W: 320, H: 320, cx: 160, cy: 160, degToUnits: 3.9 };
  const MARKED_STARS = ['thuban', 'polaris', 'vega'];

  // Same projection as measuring-the-sky.js's precession diagram: looking
  // up at the northern sky, centred on the ecliptic pole, distance from it
  // true to scale.
  function eclipticPolarView(eq) {
    const { lon, lat } = M.equatorialToEcliptic(eq);
    const { cx, cy, degToUnits } = PRECESSION_CIRCLE;
    const r = (90 - lat) * degToUnits;
    const a = (lon - 90) * RAD;
    return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
  }

  function poleViewAt(year) {
    return eclipticPolarView(M.celestialPoleAt(year));
  }

  // Whichever of the three marked stars the pole currently sits nearest,
  // however far off that actually is — there are long stretches of the
  // cycle with no bright star anywhere close.
  function nearestMarkedStar(year) {
    const pole = M.celestialPoleAt(year);
    let best = null;
    MARKED_STARS.forEach((key) => {
      const sep = angularSeparation(pole, STARS[key]);
      if (!best || sep < best.sep) best = { key, name: STARS[key].name, sep };
    });
    return best;
  }

  function drawPrecessionCircleDiagram(year) {
    const svg = document.getElementById('precession-circle-diagram');
    const wrap = document.getElementById('precession-circle-wrap');
    if (!svg || !wrap) return;
    clearDiagram(svg, wrap);
    const { W, H, cx, cy, degToUnits } = PRECESSION_CIRCLE;

    svgEl('rect', { x: 0, y: 0, width: W, height: H, rx: 8, fill: '#10141f' }, svg);

    // The ecliptic pole, and the full circle the celestial pole traces
    // around it over one ~26,000-year cycle.
    svgEl('circle', { cx, cy, r: M.OBLIQUITY_DEG * degToUnits, fill: 'none', stroke: SKY_LINE_COLOR, 'stroke-width': 1.5, 'stroke-dasharray': '6 5' }, svg);
    svgEl('circle', { cx, cy, r: 2.5, fill: SKY_LINE_COLOR }, svg);
    addLabel(wrap, cx, cy - 14, W, H, 'Ecliptic pole', 'star-label finder-pattern-label');

    // The celestial pole's own position in the selected year, found first
    // so a star sitting right on top of it (as Polaris does today) can
    // share one label instead of two illegibly overlapping ones.
    const pole = poleViewAt(year);
    const COINCIDE_PX = 24;
    let coincidingStar = null;

    // Thuban, Polaris and Vega, in their real (essentially fixed) positions.
    MARKED_STARS.forEach((key) => {
      const star = STARS[key];
      const p = eclipticPolarView(star);
      svgEl('circle', { cx: p.x, cy: p.y, r: Math.max(2, 5.2 - 1.05 * star.mag), fill: '#fdfcf5' }, svg);
      if (Math.hypot(p.x - pole.x, p.y - pole.y) < COINCIDE_PX) {
        coincidingStar = star;
        return;
      }
      const dx = p.x - cx;
      const dy = p.y - cy;
      const d = Math.hypot(dx, dy) || 1;
      addLabel(wrap, p.x + (dx / d) * 16, p.y + (dy / d) * 16, W, H, star.name, 'star-label');
    });

    svgEl('circle', { cx: pole.x, cy: pole.y, r: 7, fill: 'none', stroke: '#ffe9a8', 'stroke-width': 2.5 }, svg);
    svgEl('circle', { cx: pole.x, cy: pole.y, r: 2, fill: '#ffe9a8' }, svg);
    const dx = pole.x - cx;
    const dy = pole.y - cy;
    const d = Math.hypot(dx, dy) || 1;
    const poleText = coincidingStar ? `${coincidingStar.name} — the pole, this year` : 'The pole, this year';
    const label = addLabel(wrap, pole.x + (dx / d) * 22, pole.y + (dy / d) * 22, W, H, poleText, 'star-label finder-polaris-label');
    if (pole.x > cx) label.dataset.side = 'left';
  }

  function setUpPrecessionSlider() {
    const slider = document.getElementById('precession-year-slider');
    const label = document.getElementById('precession-year-label');
    const readout = document.getElementById('precession-nearest-star');
    function render() {
      const year = Number(slider.value);
      label.textContent = formatYear(year);
      drawPrecessionCircleDiagram(year);
      const nearest = nearestMarkedStar(year);
      readout.textContent = nearest.sep < 2
        ? `${nearest.name}, about ${formatSep(nearest.sep)} from the pole — a genuinely useful pole star.`
        : `${nearest.name}, about ${formatSep(nearest.sep)} from the pole — nowhere near useful as one.`;
    }
    slider.addEventListener('input', render);
    render();
  }

  // --- How ancient civilisations used the Sun and Moon ----------------------
  // Same tappable-picture-grid convention as naked-eye-sky.html's own
  // picture grid: one SVG, one glossary-toggle region per card, its icon
  // grafted in from a small standalone SVG the same way that page's
  // icons are, so no drawing code is shared or duplicated by reference.

  const ANCIENT_ICON_WIDTH = 140;
  const ANCIENT_ICON_HEIGHT = 100;

  function ancientIconSvg() {
    const svg = svgEl('svg', { viewBox: `0 0 ${ANCIENT_ICON_WIDTH} ${ANCIENT_ICON_HEIGHT}`, role: 'img', 'aria-hidden': 'true' });
    svgEl('rect', { x: 0, y: 0, width: ANCIENT_ICON_WIDTH, height: ANCIENT_ICON_HEIGHT, rx: 10, fill: '#10141f' }, svg);
    return svg;
  }

  const ANCIENT_USE_ICONS = {
    // Three wheat stalks against a horizon, with a star just rising —
    // Sirius heliacal rising, the Egyptian flood-season marker.
    agriculture() {
      const svg = ancientIconSvg();
      svgEl('line', { x1: 8, y1: 72, x2: 132, y2: 72, stroke: '#4d6b52', 'stroke-width': 2 }, svg);
      [38, 56, 74].forEach((x, i) => {
        const topY = 44 - i * 2;
        svgEl('line', { x1: x, y1: 72, x2: x, y2: topY, stroke: '#d8c98a', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, svg);
        [-7, 0, 7].forEach((dx) => {
          svgEl('line', { x1: x, y1: topY + 6, x2: x + dx, y2: topY - 2, stroke: '#d8c98a', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, svg);
        });
      });
      const sx = 108;
      const sy = 62;
      for (let i = 0; i < 4; i += 1) {
        const a = (i / 4) * 2 * Math.PI;
        svgEl('line', {
          x1: sx + Math.cos(a) * 5, y1: sy + Math.sin(a) * 5,
          x2: sx + Math.cos(a) * 9, y2: sy + Math.sin(a) * 9,
          stroke: '#fdfcf5', 'stroke-width': 1.3, 'stroke-linecap': 'round',
        }, svg);
      }
      svgEl('circle', { cx: sx, cy: sy, r: 2.6, fill: '#fdfcf5' }, svg);
      return svg;
    },
    // A sun with rays, partly bitten into by a dark disc — a sun god,
    // and the eclipse that was read as an omen about one.
    religion() {
      const svg = ancientIconSvg();
      const cx = ANCIENT_ICON_WIDTH / 2;
      const cy = ANCIENT_ICON_HEIGHT / 2;
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * 2 * Math.PI;
        svgEl('line', {
          x1: cx + Math.cos(a) * 22, y1: cy + Math.sin(a) * 22,
          x2: cx + Math.cos(a) * 32, y2: cy + Math.sin(a) * 32,
          stroke: SUN_COLOR, 'stroke-width': 3, 'stroke-linecap': 'round',
        }, svg);
      }
      svgEl('circle', { cx, cy, r: 17, fill: SUN_COLOR }, svg);
      svgEl('circle', { cx: cx + 8, cy: cy - 4, r: 15, fill: '#10141f' }, svg);
      return svg;
    },
    // A crescent Moon beside a small grid of dots — months tallied to
    // build a calendar.
    calendar() {
      const svg = ancientIconSvg();
      svgEl('circle', { cx: 42, cy: 50, r: 20, fill: '#fdfcf5' }, svg);
      svgEl('circle', { cx: 51, cy: 43, r: 17, fill: '#10141f' }, svg);
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          svgEl('circle', { cx: 86 + col * 13, cy: 32 + row * 18, r: 2.2, fill: SKY_LINE_COLOR }, svg);
        }
      }
      return svg;
    },
    // Two uprights with a sunbeam threaded between them — a monument
    // deliberately aimed at a sunrise or sunset.
    alignments() {
      const svg = ancientIconSvg();
      svgEl('rect', { x: 30, y: 34, width: 13, height: 42, rx: 2, fill: STONE_COLOR }, svg);
      svgEl('rect', { x: 97, y: 34, width: 13, height: 42, rx: 2, fill: STONE_COLOR }, svg);
      svgEl('line', { x1: 70, y1: 22, x2: 70, y2: 76, stroke: SUN_COLOR, 'stroke-width': 2.5, 'stroke-dasharray': '4 3' }, svg);
      svgEl('circle', { cx: 70, cy: 18, r: 10, fill: SUN_COLOR }, svg);
      return svg;
    },
  };

  const ANCIENT_USES = [
    { key: 'agriculture', title: 'Agriculture', tell: 'Watching the sky to know when to plant and harvest.' },
    { key: 'religion', title: 'Religion', tell: 'Sun and Moon gods, and eclipses read as omens.' },
    { key: 'calendar', title: 'Time and calendar systems', tell: 'Counting days, months and years from the sky.' },
    { key: 'alignments', title: 'Alignments', tell: 'Buildings aimed at a sunrise, sunset or star.' },
  ];

  const ANCIENT_GRID_COLS = 2;
  const ANCIENT_GRID_CELL_W = 200;
  const ANCIENT_GRID_CELL_H = 230;
  const ANCIENT_GRID_ICON_MARGIN_X = (ANCIENT_GRID_CELL_W - ANCIENT_ICON_WIDTH) / 2;
  const ANCIENT_GRID_ICON_MARGIN_TOP = 14;

  function buildAncientUsesGrid() {
    const svg = document.getElementById('ancient-uses-grid');
    const wrap = document.getElementById('ancient-uses-grid-wrap');
    if (!svg || !wrap) return;
    const rows = Math.ceil(ANCIENT_USES.length / ANCIENT_GRID_COLS);
    const totalWidth = ANCIENT_GRID_COLS * ANCIENT_GRID_CELL_W;
    const totalHeight = rows * ANCIENT_GRID_CELL_H;
    svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);

    ANCIENT_USES.forEach((use, i) => {
      const col = i % ANCIENT_GRID_COLS;
      const row = Math.floor(i / ANCIENT_GRID_COLS);
      const cellX = col * ANCIENT_GRID_CELL_W;
      const cellY = row * ANCIENT_GRID_CELL_H;
      const iconX = cellX + ANCIENT_GRID_ICON_MARGIN_X;
      const iconY = cellY + ANCIENT_GRID_ICON_MARGIN_TOP;

      const group = svgEl('g', {
        class: 'glossary-toggle diagram-region',
        'data-term': use.key,
        tabindex: '0',
        role: 'button',
        'aria-expanded': 'false',
        'aria-label': `${use.title}: ${use.tell} Tap for an example.`,
        transform: `translate(${iconX},${iconY})`,
      }, svg);

      const generated = ANCIENT_USE_ICONS[use.key]();
      while (generated.firstChild) group.appendChild(generated.firstChild);

      const labelX = cellX + ANCIENT_GRID_CELL_W / 2;
      const titleY = iconY + ANCIENT_ICON_HEIGHT + 18;
      addLabel(wrap, labelX, titleY, totalWidth, totalHeight, use.title, 'ancient-uses-title');
      addLabel(wrap, labelX, titleY + 48, totalWidth, totalHeight, use.tell, 'ancient-uses-tell');
    });
  }

  // --- Stonehenge: the solstice-sunrise alignment --------------------------

  // The scene itself (Sun, Heel Stone, sarsen stones) never changes between
  // these two dates — that's the whole point. Only the small pole-star
  // marker updates, which is the one thing precession actually moves here.
  const STONEHENGE_ERAS = { then: -2500, now: CURRENT_YEAR };

  function drawStonehengeScene(mode) {
    const svg = document.getElementById('stonehenge-scene-diagram');
    const wrap = document.getElementById('stonehenge-scene-wrap');
    if (!svg || !wrap) return;
    clearDiagram(svg, wrap);
    const W = 320;
    const H = 260;
    const horizonY = 190;

    svgEl('rect', { x: 0, y: 0, width: W, height: H, rx: 8, fill: '#10141f' }, svg);
    svgEl('rect', { x: 0, y: horizonY, width: W, height: H - horizonY, fill: '#1c2a1e' }, svg);

    // A few sarsen stones, framing the gap the Sun rises through.
    [36, 70, 250, 284].forEach((x) => {
      svgEl('rect', { x: x - 10, y: horizonY - 46, width: 20, height: 46, rx: 2, fill: STONE_COLOR }, svg);
    });

    // Midsummer sunrise, low over the horizon.
    const sunX = 160;
    const sunY = horizonY - 18;
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * 2 * Math.PI;
      svgEl('line', {
        x1: sunX + Math.cos(angle) * 24, y1: sunY + Math.sin(angle) * 24,
        x2: sunX + Math.cos(angle) * 34, y2: sunY + Math.sin(angle) * 34,
        stroke: SUN_COLOR, 'stroke-width': 3, 'stroke-linecap': 'round',
      }, svg);
    }
    svgEl('circle', { cx: sunX, cy: sunY, r: 18, fill: SUN_COLOR }, svg);

    // The Heel Stone, just to one side of the Sun.
    const heelX = 118;
    svgEl('rect', { x: heelX - 7, y: horizonY - 38, width: 14, height: 38, rx: 2, fill: STONE_COLOR }, svg);
    addLabel(wrap, heelX, horizonY - 46, W, H, 'Heel Stone', 'star-label');
    addLabel(wrap, sunX, sunY - 44, W, H, 'Midsummer sunrise', 'star-label finder-polaris-label');

    // A small sky marker for whichever star sat nearest the pole in the
    // selected era — the one thing that has actually moved.
    const star = nearestMarkedStar(STONEHENGE_ERAS[mode]);
    svgEl('circle', { cx: 44, cy: 40, r: 16, fill: 'none', stroke: SKY_LINE_COLOR, 'stroke-width': 1.2, 'stroke-dasharray': '3 4' }, svg);
    svgEl('circle', { cx: 44, cy: 40, r: 2.4, fill: '#fdfcf5' }, svg);
    addLabel(wrap, 44, 18, W, H, `Pole star: ${star.name}`, 'star-label');

    document.getElementById('stonehenge-pole-star').textContent = star.name;
  }

  function setUpStonehengeToggle() {
    const thenButton = document.getElementById('stonehenge-then-button');
    const nowButton = document.getElementById('stonehenge-now-button');
    function render(mode) {
      thenButton.setAttribute('aria-pressed', String(mode === 'then'));
      nowButton.setAttribute('aria-pressed', String(mode === 'now'));
      drawStonehengeScene(mode);
    }
    thenButton.addEventListener('click', () => render('then'));
    nowButton.addEventListener('click', () => render('now'));
    render('then');
  }

  // --- The Great Pyramid: fixed shafts, drifting targets -------------------

  const GIZA_LATITUDE = 29.9792; // Giza, Egypt — general knowledge, not a data-sheet figure
  const PYRAMID_BUILD_YEAR = -2560;
  const NORTH_SHAFT_ANGLE = 33;
  const SOUTH_SHAFT_ANGLE = 45;

  // A star's declination as it would have been measured against the
  // celestial pole of the given year, found from its (essentially fixed)
  // position and how far that year's true pole sat from it.
  function declinationThen(starKey, year) {
    const pole = M.celestialPoleAt(year);
    return 90 - angularSeparation(pole, STARS[starKey]);
  }

  // Thuban is circumpolar from Giza throughout the years this slider
  // covers, so its lower culmination (the low point of its daily circle
  // around the pole) is a plain function of its declination and latitude.
  function thubanLowerCulmination(year) {
    return declinationThen('thuban', year) + GIZA_LATITUDE - 90;
  }

  // Alnitak is never circumpolar from Giza, so it has one meridian
  // crossing a day, due south, at this altitude.
  function alnitakTransitAltitude(year) {
    return 90 - GIZA_LATITUDE + declinationThen('alnitak', year);
  }

  function drawPyramidShaftDiagram(year) {
    const svg = document.getElementById('pyramid-shaft-diagram');
    const wrap = document.getElementById('pyramid-shaft-wrap');
    if (!svg || !wrap) return;
    clearDiagram(svg, wrap);
    const W = 320;
    const H = 260;
    const baseY = 226;
    const apexX = W / 2;
    const apexY = 26;
    const baseLeftX = 40;
    const baseRightX = W - 40;

    svgEl('rect', { x: 0, y: 0, width: W, height: H, rx: 8, fill: '#10141f' }, svg);
    svgEl('line', { x1: 0, y1: baseY, x2: W, y2: baseY, stroke: '#4d6b52', 'stroke-width': 2 }, svg);
    svgEl('polygon', {
      points: `${apexX},${apexY} ${baseLeftX},${baseY} ${baseRightX},${baseY}`,
      fill: '#2a2f3d', stroke: '#7c8aa3', 'stroke-width': 1.5,
    }, svg);

    const chamberY = baseY - (baseY - apexY) * 0.42;
    const chamberHalfWidth = 26;
    svgEl('rect', { x: apexX - chamberHalfWidth, y: chamberY - 10, width: chamberHalfWidth * 2, height: 20, fill: '#10141f', stroke: '#cdd7e1', 'stroke-width': 1.5 }, svg);
    addLabel(wrap, apexX, chamberY, W, H, "King's Chamber", 'star-label');

    // Each shaft's own fixed line, cut once and never adjustable.
    const run = 150;
    const shafts = svgEl('g', { stroke: '#f5a623', 'stroke-width': 2.5 }, svg);
    const north = { x1: apexX - chamberHalfWidth, y1: chamberY - 4, angleDeg: NORTH_SHAFT_ANGLE, dir: -1 };
    const south = { x1: apexX + chamberHalfWidth, y1: chamberY - 4, angleDeg: SOUTH_SHAFT_ANGLE, dir: 1 };
    [north, south].forEach((shaft) => {
      const x2 = shaft.x1 + shaft.dir * run * Math.cos(shaft.angleDeg * RAD);
      const y2 = shaft.y1 - run * Math.sin(shaft.angleDeg * RAD);
      svgEl('line', { x1: shaft.x1, y1: shaft.y1, x2, y2 }, shafts);
    });

    // Where each shaft's original target actually sits in the selected
    // year: a dashed line at the true current altitude, from the same
    // origin, so the gap from the fixed shaft is visible directly.
    const targetRun = 120;
    function drawTarget(shaft, altitudeDeg, label, side) {
      const x2 = shaft.x1 + shaft.dir * targetRun * Math.cos(altitudeDeg * RAD);
      const y2 = shaft.y1 - targetRun * Math.sin(altitudeDeg * RAD);
      svgEl('line', { x1: shaft.x1, y1: shaft.y1, x2, y2, stroke: SKY_LINE_COLOR, 'stroke-width': 2, 'stroke-dasharray': '5 4' }, svg);
      svgEl('circle', { cx: x2, cy: y2, r: 4, fill: '#fdfcf5' }, svg);
      const l = addLabel(wrap, x2, y2 - 12, W, H, label, 'star-label finder-polaris-label');
      l.dataset.side = side;
    }
    drawTarget(north, thubanLowerCulmination(year), 'Thuban now', 'right');
    drawTarget(south, alnitakTransitAltitude(year), 'Alnitak now', 'left');

    const northLabel = addLabel(wrap, apexX - chamberHalfWidth - 70, chamberY - 88, W, H, 'North shaft (fixed)', 'star-label finder-pattern-label');
    northLabel.dataset.side = 'right';
    const southLabel = addLabel(wrap, apexX + chamberHalfWidth + 60, chamberY - 110, W, H, 'South shaft (fixed)', 'star-label finder-pattern-label');
    southLabel.dataset.side = 'left';
  }

  function updatePyramidReadout(year) {
    const northAlt = thubanLowerCulmination(year);
    const southAlt = alnitakTransitAltitude(year);
    document.getElementById('pyramid-north-readout').textContent =
      `Thuban's lower crossing: ${formatSep(northAlt)} (${formatSigned(northAlt - NORTH_SHAFT_ANGLE)} from the shaft)`;
    document.getElementById('pyramid-south-readout').textContent =
      `Alnitak's meridian crossing: ${formatSep(southAlt)} (${formatSigned(southAlt - SOUTH_SHAFT_ANGLE)} from the shaft)`;
  }

  function setUpPyramidSlider() {
    const slider = document.getElementById('pyramid-year-slider');
    const label = document.getElementById('pyramid-year-label');
    function render() {
      const year = Number(slider.value);
      label.textContent = formatYear(year);
      drawPyramidShaftDiagram(year);
      updatePyramidReadout(year);
    }
    slider.addEventListener('input', render);
    render();
  }

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  // The then/now separations quoted in pyramidDetail, computed once here
  // rather than hand-typed, so they can never drift out of step with the
  // interactive diagrams above.
  const pyramidPole = M.celestialPoleAt(PYRAMID_BUILD_YEAR);
  const nowPole = M.celestialPoleAt(CURRENT_YEAR);
  const thubanThenSep = formatSep(angularSeparation(pyramidPole, STARS.thuban));
  const polarisThenSep = formatSep(angularSeparation(pyramidPole, STARS.polaris));
  const polarisNowSep = formatSep(angularSeparation(nowPole, STARS.polaris));
  const thubanNowSep = formatSep(angularSeparation(nowPole, STARS.thuban));

  const GLOSSARY = {
    precession:
      "Precession: the slow, roughly 26,000-year circling of the direction Earth's rotation axis points, caused by the Sun's and Moon's gravity acting on Earth's equatorial bulge. The tilt itself barely changes; only its direction does. Three knock-on effects: the pole star changes, as a different bright star happens to lie near the axis each era; the equinox points drift westward along the ecliptic by about 1° every 72 years, slowly shifting which constellation the Sun sits in at the spring equinox; and every star's right ascension and declination shift slowly too, which is why star catalogues state the epoch (e.g. J2000) their coordinates are measured for.",
    stonehengeDetail:
      'Stonehenge was built and reworked in stages from around 3000 BCE, with its sarsen circle and trilithons raised around 2500 BCE. Its main axis, running past the outlying Heel Stone, frames sunrise on the midsummer solstice; face the opposite way and the same axis frames sunset on the midwinter solstice. One axis marking both events is deliberate: the solstices are the Sun’s most extreme rising and setting points, so tracking them needs no calendar at all, just a fixed line of sight. The illustration above is schematic, not an accurate plan: the real stone-by-stone spacing is more irregular than shown.',
    pyramidDetail:
      `The Great Pyramid, built around 2560 BCE at a latitude close to 30°N, holds four narrow shafts running from the King’s and Queen’s Chambers — too narrow for ventilation, long thought to have had a symbolic, sky-facing purpose. Each is cut once, at a fixed angle, so it always points the same way. The King’s Chamber’s two shafts have long-proposed matches in the sky of 2560 BCE: the northern shaft, about 33° up, in Thuban’s lower crossing near the pole; the southern shaft, about 45° up, in Orion’s Belt star Alnitak, at its lowest meridian crossing from Giza. At that date Thuban sat about ${thubanThenSep} from the pole, with Polaris about ${polarisThenSep} away — useless for finding north. Today that’s reversed: Polaris sits about ${polarisNowSep} from the pole, Thuban about ${thubanNowSep} away. The shafts themselves haven’t moved; it’s the sky around their old targets that has.`,
    agriculture:
      "Agriculture: ancient farmers timed planting and harvest by the sky rather than a written calendar. The Egyptians watched for Sirius, the night sky's brightest star, to reappear just before dawn after weeks lost in the Sun's glare — a moment that reliably fell right as the Nile's annual flood was due, marking the start of their farming year. First draft, to be checked by the teacher.",
    religion:
      'Religion: many cultures worshipped the Sun and Moon as gods, and treated anything that disrupted their normal behaviour as deeply significant. In ancient China, a solar eclipse was believed to be a dragon devouring the Sun — court astronomers banged drums and fired arrows into the sky to frighten it off and bring the Sun back. First draft, to be checked by the teacher.',
    calendar:
      "Time and calendar systems: a (lunar) month comes from counting the Moon's phases, but twelve lunar months (about 354 days) fall short of the solar year (about 365.25 days) by roughly eleven days, so a purely lunar calendar slowly drifts against the seasons. Many cultures corrected this by adding an extra ('intercalary') month every few years; the Babylonians and Greeks eventually settled on the Metonic cycle, adding seven extra months over 19 years, since 235 lunar months and 19 solar years come out to almost exactly the same length of time. First draft, to be checked by the teacher.",
    alignments:
      "Alignments: Stonehenge's Avenue frames the midsummer sunrise (see above). Newgrange, in Ireland, is aligned so that only at the winter solstice does sunrise light reach all the way down its long entrance passage into the inner chamber. And the Maya pyramid of El Castillo at Chichen Itza is built so that, at the spring and autumn equinoxes, the Sun casts a shadow down its staircase that looks like a serpent slithering down to meet a carved snake's head at the base. First draft, to be checked by the teacher.",
  };

  setUpPrecessionSlider();
  buildAncientUsesGrid();
  setUpStonehengeToggle();
  setUpPyramidSlider();
  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(ArchaeoastronomyQuestions.makeQuestions(MoonPhase));
})();
