(function () {
  const CURRICULUM_UNITS = ['u2.2', 'u2.20', 'u2.21', 'u2.22', 'u2.23', 'u2.24', 'u2.25', 'u2.26', 'u2.27'];
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const RAD = Math.PI / 180;

  // Map geometry, in the SVG's 600x600 viewBox.
  const SIZE = 600;
  const CX = 300;
  const CY = 300;
  const R = 190;

  const MARE_COLOR = '#7f8188';

  // Selenographic coordinates: latitude north +, longitude east +
  // (towards the Sea of Crises). Each mare is one or more circles on the
  // sphere, [lat, lon, angular radius], with radius = half its diameter
  // divided by the Moon's radius (1,737 km).
  const BACKGROUND_MARIA = [
    [32.8, -15.6, 18.9], // Mare Imbrium, Sea of Rains
    [28.0, 17.5, 11.7], // Mare Serenitatis, Sea of Serenity
    [-5, 50, 10], // Mare Fecunditatis, Sea of Fertility
    [-12, 53, 7.5],
    [-15.2, 35.5, 5.5], // Mare Nectaris, Sea of Nectar
    [-20, -15, 9], // Mare Nubium, Sea of Clouds
    [-26, -20, 6],
    [-24.4, -38.6, 6.4], // Mare Humorum, Sea of Moisture
    [13.3, 3.6, 4], // Mare Vaporum
    [7.5, -30.9, 8.5], // Mare Insularum
    [-10, -23, 4], // Mare Cognitum
    [16, 25, 7], // where Tranquility runs into Serenity...
    [0, 40, 7], // ...and into Fertility
    // Mare Frigoris, a thin band in the far north
    ...[-40, -32, -24, -16, -8, 0, 8, 16, 24, 32].map((lon) => [57, lon, 4.5]),
  ];

  const NAMED_MARIA = [
    { term: 'tranquility', name: 'Sea of Tranquility', circles: [[8.5, 31.4, 13], [4, 23, 8]], point: [8.5, 29] },
    { term: 'crises', name: 'Sea of Crises', circles: [[17, 59.1, 9.2]], point: [17, 59.1] },
    {
      term: 'storms',
      name: 'Ocean of Storms',
      circles: [
        [40, -48, 7], [35, -52, 9], [30, -48, 10], [25, -56, 11], [18, -50, 12],
        [14, -58, 11], [8, -48, 10], [4, -53, 10], [-2, -43, 9], [-6, -46, 9],
        [12, -40, 9], [26, -40, 8], [20, -42, 8], [-8, -38, 7], [-12, -52, 6], [2, -40, 7],
      ],
      point: [20, -54],
    },
  ];

  // Craters: [lat, lon], true diameter in km, and ray length in pixels.
  const CRATERS = [
    { term: 'tycho', name: 'Tycho', lat: -43.3, lon: -11.4, diameterKm: 85, rays: 150, rayCount: 14 },
    { term: 'copernicus', name: 'Copernicus', lat: 9.6, lon: -20.1, diameterKm: 93, rays: 55, rayCount: 10 },
    { term: 'kepler', name: 'Kepler', lat: 8.1, lon: -38.0, diameterKm: 31, rays: 35, rayCount: 8 },
  ];

  // The Apennines curve along the south-eastern rim of Mare Imbrium.
  const APENNINES = [[14.5, -11.3], [17.5, -6.5], [20, -3], [23, 0.5], [26.5, 4.7]];

  // Where each label sits (viewBox units): off the disc even on a narrow
  // phone (so light text never lands on the pale Moon), with leader lines
  // that don't cross.
  const LABEL_ANCHORS = {
    apennines: [300, 36],
    crises: [534, 168],
    tranquility: [534, 404],
    kepler: [72, 96],
    storms: [72, 420],
    copernicus: [72, 522],
    tycho: [300, 566],
  };

  // Orthographic projection of the near side, north up, east to the right.
  function project(latDeg, lonDeg) {
    const lat = latDeg * RAD;
    const lon = lonDeg * RAD;
    return { x: CX + R * Math.cos(lat) * Math.sin(lon), y: CY - R * Math.sin(lat) };
  }

  // A small circle on the sphere, as a projected outline.
  function sphereCirclePath(latDeg, lonDeg, radiusDeg) {
    const lat1 = latDeg * RAD;
    const lon1 = lonDeg * RAD;
    const rho = radiusDeg * RAD;
    const points = [];
    for (let i = 0; i < 48; i++) {
      const bearing = (i / 48) * 2 * Math.PI;
      const lat2 = Math.asin(Math.sin(lat1) * Math.cos(rho) + Math.cos(lat1) * Math.sin(rho) * Math.cos(bearing));
      const lon2 = lon1 + Math.atan2(
        Math.sin(bearing) * Math.sin(rho) * Math.cos(lat1),
        Math.cos(rho) - Math.sin(lat1) * Math.sin(lat2)
      );
      const p = project(lat2 / RAD, lon2 / RAD);
      points.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    return `M${points.join('L')}Z`;
  }

  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (parent) parent.appendChild(el);
    return el;
  }

  // Same tap-to-reveal hookup as sims/sun-declination.html's layers:
  // glossary.js pairs each toggle with the definition sharing its term.
  function makeToggle(parent, term, name) {
    return svgEl('g', {
      class: 'glossary-toggle diagram-region',
      'data-term': term,
      tabindex: '0',
      role: 'button',
      'aria-expanded': 'false',
      'aria-label': name,
    }, parent);
  }

  function drawMoonMap() {
    const svg = document.getElementById('moon-map');
    const wrap = document.getElementById('moon-map-wrap');

    const defs = svgEl('defs', {}, svg);
    const shade = svgEl('radialGradient', { id: 'moon-shade', cx: '50%', cy: '50%', r: '50%' }, defs);
    svgEl('stop', { offset: '0%', 'stop-color': '#e6e5df' }, shade);
    svgEl('stop', { offset: '85%', 'stop-color': '#d2d1ca' }, shade);
    svgEl('stop', { offset: '100%', 'stop-color': '#b5b4ad' }, shade);

    // Soft mare edges, and a clip so nothing spills off the disc.
    const soften = svgEl('filter', { id: 'mare-soften', x: '-10%', y: '-10%', width: '120%', height: '120%' }, defs);
    svgEl('feGaussianBlur', { stdDeviation: '2.2' }, soften);
    const disc = svgEl('clipPath', { id: 'moon-disc' }, defs);
    svgEl('circle', { cx: CX, cy: CY, r: R }, disc);

    svgEl('circle', { cx: CX, cy: CY, r: R, fill: 'url(#moon-shade)' }, svg);

    // The blur goes on each mare's shapes, not on the clickable group,
    // so the group's hover/focus brightening (a CSS filter) can't
    // replace it.
    const mareAttrs = (lat, lon, radius) => ({
      d: sphereCirclePath(lat, lon, radius),
      fill: MARE_COLOR,
      filter: 'url(#mare-soften)',
    });
    BACKGROUND_MARIA.forEach(([lat, lon, radius]) => svgEl('path', mareAttrs(lat, lon, radius), svg));

    NAMED_MARIA.forEach((mare) => {
      const group = makeToggle(svg, mare.term, mare.name);
      mare.circles.forEach(([lat, lon, radius]) => svgEl('path', mareAttrs(lat, lon, radius), group));
    });

    // Bright rays of ejecta splashed out from the young craters, drawn
    // over the maria as they are on the real Moon.
    const rays = svgEl('g', {
      stroke: '#f4f3ee',
      'stroke-linecap': 'round',
      'pointer-events': 'none',
      'clip-path': 'url(#moon-disc)',
    }, svg);
    CRATERS.forEach((crater) => {
      const c = project(crater.lat, crater.lon);
      for (let i = 0; i < crater.rayCount; i++) {
        const angle = (i / crater.rayCount) * 2 * Math.PI + crater.lat;
        const length = crater.rays * (0.55 + 0.45 * Math.abs(Math.sin(i * 2.3)));
        svgEl('line', {
          x1: c.x, y1: c.y,
          x2: (c.x + Math.cos(angle) * length).toFixed(1),
          y2: (c.y + Math.sin(angle) * length).toFixed(1),
          'stroke-width': 2.2,
          'stroke-opacity': 0.35,
        }, rays);
      }
    });

    const apennines = makeToggle(svg, 'apennines', 'Apennine Mountains');
    const ridge = APENNINES.map(([lat, lon]) => project(lat, lon));
    const ridgePath = `M${ridge.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L')}`;
    svgEl('path', { d: ridgePath, fill: 'none', stroke: 'transparent', 'stroke-width': 20, 'pointer-events': 'stroke' }, apennines);
    svgEl('path', { d: ridgePath, fill: 'none', stroke: '#f1efe6', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-dasharray': '2 4' }, apennines);
    svgEl('path', { d: ridgePath, fill: 'none', stroke: '#9c9a91', 'stroke-width': 1.5, 'stroke-linecap': 'round' }, apennines);

    // The craters are far smaller than a fingertip at this scale, so each
    // is drawn at least a few pixels across with a larger invisible tap target.
    CRATERS.forEach((crater) => {
      const c = project(crater.lat, crater.lon);
      const trueRadiusPx = (crater.diameterKm / 2 / 1737.4) * R;
      const group = makeToggle(svg, crater.term, crater.name);
      svgEl('circle', { cx: c.x, cy: c.y, r: 15, fill: 'transparent', 'pointer-events': 'all' }, group);
      svgEl('circle', { cx: c.x, cy: c.y, r: Math.max(trueRadiusPx, 5), fill: '#f7f6f1', stroke: '#8c8a82', 'stroke-width': 1 }, group);
      svgEl('circle', { cx: c.x, cy: c.y, r: Math.max(trueRadiusPx, 5) * 0.45, fill: '#b9b7af' }, group);
    });

    // Leader lines (in the SVG) and labels (plain HTML, never SVG text).
    const features = [
      ...NAMED_MARIA.map((m) => ({ term: m.term, name: m.name, point: project(...m.point) })),
      ...CRATERS.map((c) => ({ term: c.term, name: c.name, point: project(c.lat, c.lon) })),
      { term: 'apennines', name: 'Apennine Mountains', point: project(20, -3) },
    ];
    const leaders = svgEl('g', { class: 'moon-map-leader', stroke: '#cfd6df', 'stroke-width': 1, 'stroke-dasharray': '3 2', 'pointer-events': 'none' }, svg);
    features.forEach(({ term, name, point }) => {
      const [ax, ay] = LABEL_ANCHORS[term];
      const dx = ax - point.x;
      const dy = ay - point.y;
      const length = Math.hypot(dx, dy);
      const stop = Math.max(length - 24, 0) / length;
      svgEl('line', { x1: point.x, y1: point.y, x2: point.x + dx * stop, y2: point.y + dy * stop }, leaders);

      const labelEl = document.createElement('span');
      labelEl.className = 'labelled-diagram-label';
      labelEl.style.left = `${(ax / SIZE) * 100}%`;
      labelEl.style.top = `${(ay / SIZE) * 100}%`;
      labelEl.textContent = name;
      wrap.appendChild(labelEl);
    });
  }

  function setUpLabelToggle() {
    const button = document.getElementById('toggle-labels');
    const wrap = document.getElementById('moon-map-wrap');
    button.addEventListener('click', () => {
      const hidden = wrap.classList.toggle('labels-hidden');
      button.setAttribute('aria-pressed', String(hidden));
      button.textContent = hidden ? 'Show labels' : 'Hide labels — test yourself';
    });
  }

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    tranquility:
      'The Sea of Tranquility (Mare Tranquillitatis): a dark lava plain just right of centre, north of the equator. Apollo 11 landed here in 1969.',
    storms:
      "The Ocean of Storms (Oceanus Procellarum): the largest mare by far, a huge dark expanse covering much of the Moon's western (left-hand) side.",
    crises:
      'The Sea of Crises (Mare Crisium): an isolated oval mare near the right-hand edge — easy to spot because it stands apart from the other maria.',
    tycho:
      'Tycho: a young, sharp-edged crater (~85 km across) in the southern highlands, with bright rays of splashed-out rock stretching across much of the Moon. Most striking at full Moon.',
    copernicus:
      'Copernicus: a large crater (~93 km across) on the dark maria west of centre, with terraced walls and its own bright ray system.',
    kepler:
      'Kepler: a smaller bright-rayed crater (~31 km across) further west than Copernicus, out in the Ocean of Storms.',
    apennines:
      'The Apennine Mountains (Montes Apenninus): a curved range along the south-eastern edge of the Sea of Rains (Mare Imbrium) — the uplifted rim of the giant impact that made that basin.',
    libration:
      "Libration: the Moon's slight apparent rocking and nodding as seen from Earth, which lets us see about 59% of its surface over time.",
    escapeVelocity:
      "Escape velocity: the speed an object needs to coast away from a planet's gravity for good, with no further push. About 11.2 km/s for Earth.",
    giantImpact:
      'The Giant Impact Hypothesis: the idea that the Moon formed from debris thrown out when a Mars-sized body, Theia, struck the young Earth a glancing blow.',
  };

  drawMoonMap();
  setUpLabelToggle();
  renderCoverage();
  Glossary.init(GLOSSARY);
})();
