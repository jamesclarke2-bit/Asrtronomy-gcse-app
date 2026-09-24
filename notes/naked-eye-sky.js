(function () {
  const CURRICULUM_UNITS = ['u1.1', 'u1.2', 'u1.3'];
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const RAD = Math.PI / 180;
  const { STARS, PATTERNS } = StarPatterns;

  const SKY_LINE_COLOR = '#6f8fb8';

  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (parent) parent.appendChild(el);
    return el;
  }

  // Brighter stars (lower magnitude) get bigger dots.
  function starRadius(mag) {
    return Math.max(1.6, 5.2 - 1.05 * mag);
  }

  // Star names are HTML, never SVG text. `side` sets which way the
  // label sits from its anchor point.
  function makeLabel(wrap, className, text) {
    const el = document.createElement('span');
    el.className = className;
    el.textContent = text;
    wrap.appendChild(el);
    return el;
  }

  function placeLabel(el, x, y, width, height, side) {
    el.style.left = `${(x / width) * 100}%`;
    el.style.top = `${(y / height) * 100}%`;
    el.dataset.side = side || 'centre';
  }

  const LABEL_OFFSET = 13;
  const SIDE_OFFSETS = {
    above: [0, -LABEL_OFFSET],
    below: [0, LABEL_OFFSET],
    left: [-9, 0],
    right: [9, 0],
  };

  // --- The seven star-pattern charts --------------------------------------

  const CHART_WIDTH = 300;
  const CHART_HEIGHT = 220;
  const CHART_PADDING = 34;

  function drawPatternChart(card) {
    const pattern = PATTERNS.find((p) => p.id === card.dataset.pattern);
    const stars = pattern.stars.map((key) => STARS[key]);
    const centre = StarPatterns.centreOf(stars);
    const flat = {};
    pattern.stars.forEach((key) => { flat[key] = StarPatterns.project(STARS[key], centre); });

    // Scale each pattern to fill its chart: the Southern Cross is only
    // 6° across, the Summer Triangle 38°, so one shared scale won't do.
    const xs = Object.values(flat).map((p) => p.x);
    const ys = Object.values(flat).map((p) => p.y);
    const scale = Math.min(
      (CHART_WIDTH - 2 * CHART_PADDING) / (Math.max(...xs) - Math.min(...xs)),
      (CHART_HEIGHT - 2 * CHART_PADDING) / (Math.max(...ys) - Math.min(...ys))
    );
    const midX = (Math.max(...xs) + Math.min(...xs)) / 2;
    const midY = (Math.max(...ys) + Math.min(...ys)) / 2;
    const toScreen = (p) => ({
      x: CHART_WIDTH / 2 + (p.x - midX) * scale,
      y: CHART_HEIGHT / 2 - (p.y - midY) * scale,
    });

    const chart = card.querySelector('.pattern-chart');
    const wrap = document.createElement('div');
    wrap.className = 'labelled-diagram-wrap';
    chart.appendChild(wrap);
    const svg = svgEl('svg', {
      viewBox: `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`,
      role: 'img',
      'aria-label': `Star chart of ${pattern.name}, north up and east to the left, with its stars joined into the pattern`,
    }, wrap);

    const lines = svgEl('g', { stroke: SKY_LINE_COLOR, 'stroke-width': 1.5 }, svg);
    pattern.lines.forEach(([a, b]) => {
      const p = toScreen(flat[a]);
      const q = toScreen(flat[b]);
      svgEl('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y }, lines);
    });

    pattern.stars.forEach((key) => {
      const p = toScreen(flat[key]);
      svgEl('circle', { cx: p.x, cy: p.y, r: starRadius(STARS[key].mag) + 2.5, fill: '#10141f' }, svg);
      svgEl('circle', { cx: p.x, cy: p.y, r: starRadius(STARS[key].mag), fill: '#fdfcf5' }, svg);
    });

    pattern.labels.forEach(([key, side]) => {
      const p = toScreen(flat[key]);
      const [dx, dy] = SIDE_OFFSETS[side];
      const label = makeLabel(wrap, 'star-label', STARS[key].name);
      placeLabel(label, p.x + dx, p.y + dy, CHART_WIDTH, CHART_HEIGHT, side);
    });

    const span = StarPatterns.spanOf(stars);
    const caption = document.createElement('p');
    caption.className = 'pattern-span';
    caption.textContent = `About ${Math.round(span)}° across, roughly ${Math.round(span / 0.5)} full Moons side by side`;
    chart.appendChild(caption);

    card.querySelector('.pattern-kind').textContent = pattern.kind === 'asterism' ? 'Asterism' : 'Constellation';
  }

  // --- Finding Polaris: the northern sky through the year ----------------

  const OBSERVER_LATITUDE = 52;
  const OBSERVER_LONGITUDE = -1.5;
  const LOCAL_HOUR = 22;
  const YEAR = 2026;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const FINDER_WIDTH = 440;
  const FINDER_HEIGHT = 460;
  const FINDER_SCALE = 185;
  const POLE = { x: FINDER_WIDTH / 2, y: 182 };
  const HORIZON_Y = POLE.y + Math.tan(OBSERVER_LATITUDE * RAD) * FINDER_SCALE;

  // Local sidereal time at 10 pm GMT on the 15th of a month.
  function localSiderealTime(monthIndex) {
    return Coordinates.getLocalSiderealTime(new Date(Date.UTC(YEAR, monthIndex, 15, LOCAL_HOUR, 0)), OBSERVER_LONGITUDE);
  }

  // Facing north with the pole at the centre: straight up is towards the
  // zenith, east is to the right, and the sky turns anticlockwise. This
  // is a gnomonic projection centred on the pole, so the horizon is a
  // straight line tan(latitude) below it and the Pointers' great circle
  // is a straight line too.
  function poleView(star, lst) {
    const hourAngle = (lst - star.ra) * 15 * RAD;
    const r = Math.tan((90 - star.dec) * RAD) * FINDER_SCALE;
    return { x: POLE.x - r * Math.sin(hourAngle), y: POLE.y - r * Math.cos(hourAngle) };
  }

  const finder = {};

  function setUpPoleFinder() {
    const svg = document.getElementById('pole-finder');
    const wrap = document.getElementById('pole-finder-wrap');

    svgEl('rect', { x: 0, y: HORIZON_Y, width: FINDER_WIDTH, height: FINDER_HEIGHT - HORIZON_Y, fill: '#1d2a1f' }, svg);
    svgEl('line', { x1: 0, y1: HORIZON_Y, x2: FINDER_WIDTH, y2: HORIZON_Y, stroke: '#4d6b52', 'stroke-width': 2 }, svg);
    placeLabel(makeLabel(wrap, 'star-label finder-horizon-label', 'N'), POLE.x, HORIZON_Y + 18, FINDER_WIDTH, FINDER_HEIGHT);
    placeLabel(makeLabel(wrap, 'star-label finder-horizon-label', 'Northern horizon'), 80, HORIZON_Y + 18, FINDER_WIDTH, FINDER_HEIGHT);

    // Everything that turns with the sky is redrawn into this group.
    finder.sky = svgEl('g', {}, svg);
    finder.wrap = wrap;
    finder.labels = {
      plough: makeLabel(wrap, 'star-label finder-pattern-label', 'The Plough'),
      cassiopeia: makeLabel(wrap, 'star-label finder-pattern-label', 'Cassiopeia'),
      polaris: makeLabel(wrap, 'star-label finder-polaris-label', 'Polaris'),
      merak: makeLabel(wrap, 'star-label', 'Merak'),
      dubhe: makeLabel(wrap, 'star-label', 'Dubhe'),
    };
  }

  function drawPoleFinder(monthIndex) {
    const lst = localSiderealTime(monthIndex);
    const sky = finder.sky;
    while (sky.firstChild) sky.removeChild(sky.firstChild);
    const at = (key) => poleView(STARS[key], lst);

    // The Pointers' line, carried on past Dubhe as far as Polaris.
    const ratio = StarPatterns.angularSeparation(STARS.dubhe, STARS.polaris) /
      StarPatterns.angularSeparation(STARS.merak, STARS.dubhe);
    const merak = at('merak');
    const dubhe = at('dubhe');
    const end = poleView(StarPatterns.extendBeyond(STARS.merak, STARS.dubhe, ratio), lst);
    svgEl('line', {
      x1: merak.x, y1: merak.y, x2: end.x, y2: end.y,
      stroke: '#f5a623', 'stroke-width': 2, 'stroke-dasharray': '6 5',
    }, sky);

    const lines = svgEl('g', { stroke: SKY_LINE_COLOR, 'stroke-width': 1.5 }, sky);
    ['plough', 'cassiopeia'].forEach((id) => {
      PATTERNS.find((p) => p.id === id).lines.forEach(([a, b]) => {
        const p = at(a);
        const q = at(b);
        svgEl('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y }, lines);
      });
    });

    const shown = [...PATTERNS.find((p) => p.id === 'plough').stars, ...PATTERNS.find((p) => p.id === 'cassiopeia').stars, 'polaris'];
    shown.forEach((key) => {
      const p = at(key);
      svgEl('circle', { cx: p.x, cy: p.y, r: starRadius(STARS[key].mag) + 2.5, fill: '#10141f' }, sky);
      svgEl('circle', { cx: p.x, cy: p.y, r: starRadius(STARS[key].mag), fill: key === 'polaris' ? '#ffe9a8' : '#fdfcf5' }, sky);
    });

    // Merak's and Dubhe's labels sit off the side of the Pointers' line
    // away from the rest of the bowl; Polaris's on the side facing away
    // from the Plough's handle, so they never sit on a line.
    const along = { x: dubhe.x - merak.x, y: dubhe.y - merak.y };
    const length = Math.hypot(along.x, along.y);
    let normal = { x: -along.y / length, y: along.x / length };
    const megrez = at('megrez');
    if (normal.x * (megrez.x - merak.x) + normal.y * (megrez.y - merak.y) > 0) {
      normal = { x: -normal.x, y: -normal.y };
    }
    const offset = 34;
    placeLabel(finder.labels.merak, merak.x + normal.x * offset, merak.y + normal.y * offset, FINDER_WIDTH, FINDER_HEIGHT);
    placeLabel(finder.labels.dubhe, dubhe.x + normal.x * offset, dubhe.y + normal.y * offset, FINDER_WIDTH, FINDER_HEIGHT);
    const polaris = at('polaris');
    placeLabel(finder.labels.polaris, polaris.x + normal.x * offset, polaris.y + normal.y * offset, FINDER_WIDTH, FINDER_HEIGHT);

    // Pattern names go just beyond each pattern, on the far side from the pole.
    [['plough', 55], ['cassiopeia', 42]].forEach(([id, push]) => {
      const points = PATTERNS.find((p) => p.id === id).stars.map(at);
      const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
      const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
      const dx = cx - POLE.x;
      const dy = cy - POLE.y;
      const d = Math.hypot(dx, dy);
      // Kept clear of the frame's edges and the horizon when the pattern is near one.
      const x = Math.min(Math.max(cx + (dx / d) * push, 50), FINDER_WIDTH - 50);
      const y = Math.min(Math.max(cy + (dy / d) * push, 22), HORIZON_Y - 16);
      placeLabel(finder.labels[id], x, y, FINDER_WIDTH, FINDER_HEIGHT);
    });
  }

  function setUpMonthSlider() {
    const slider = document.getElementById('month-slider');
    const label = document.getElementById('month-label');
    function render() {
      const monthIndex = Number(slider.value);
      label.textContent = MONTHS[monthIndex];
      drawPoleFinder(monthIndex);
    }
    slider.addEventListener('input', render);
    render();
  }

  function fillFigures() {
    const pointerRatio = StarPatterns.angularSeparation(STARS.dubhe, STARS.polaris) /
      StarPatterns.angularSeparation(STARS.merak, STARS.dubhe);
    document.getElementById('pointer-ratio').textContent = String(Math.round(pointerRatio));

    const southPole = { ra: 0, dec: -90 };
    const cruxRatio = StarPatterns.angularSeparation(STARS.acrux, southPole) /
      StarPatterns.angularSeparation(STARS.gacrux, STARS.acrux);
    document.getElementById('crux-ratio').textContent = String(Math.round(cruxRatio * 2) / 2);

    const cruxStars = PATTERNS.find((p) => p.id === 'southernCross').stars.map((key) => STARS[key]);
    const latitude = Math.min(...cruxStars.map(StarPatterns.northernmostLatitudeToSee));
    document.getElementById('crux-latitude').textContent = `${Math.round(latitude)}°N`;
  }

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    twinkling:
      "Twinkling (scintillation): starlight flickering as it passes through moving pockets of air of different temperature and density. Stars are so far away they're effectively single points, so every wobble shows; a planet's tiny disc averages the wobbles out, so it shines more steadily.",
    constellation:
      'A constellation: one of the 88 regions the International Astronomical Union divides the whole sky into, each named after a traditional star pattern, such as Orion or Cassiopeia.',
    asterism:
      'An asterism: a recognisable star pattern that is not one of the 88 official constellations. It may be part of a constellation (the Plough, in Ursa Major) or use stars from several (the Summer Triangle).',
    circumpolar:
      'Circumpolar: close enough to the celestial pole that it never sets, but circles the pole all night and all year. Whether a star is circumpolar depends on your latitude.',
  };

  document.querySelectorAll('.pattern-card').forEach(drawPatternChart);
  setUpPoleFinder();
  setUpMonthSlider();
  fillFigures();
  renderCoverage();
  Glossary.init(GLOSSARY);
})();
