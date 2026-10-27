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

  // --- Inside the Moon: crust / mantle / outer core / inner core, as ------
  // concentric rings. The ring colours reuse Earth's own .layer-dot-*
  // palette (see earth-structure.html) for a direct visual match. Each
  // ring is drawn as a full circle, smaller ones layered on top, so only
  // the outer band of each colour actually shows — the same approach
  // earth-structure.html uses for its own cutaway. The labels, not the
  // thin rings themselves, are the tap targets (a thin ring is an
  // unreliable target — see earth-structure.js's own note on this).

  const STRUCTURE_LAYERS = [
    { term: 'moonCrust', name: 'Crust', r: 225, fill: '#5b7c99', stroke: '#3f5a70', pos: [12, 50] },
    { term: 'moonMantle', name: 'Mantle', r: 205, fill: '#c17a4a', pos: [50, 94] },
    { term: 'moonOuterCore', name: 'Outer core', r: 70, fill: '#e8631a', pos: [88, 50] },
    { term: 'moonInnerCore', name: 'Inner core', r: 32, fill: '#fff2c4', pos: [50, 6] },
  ];

  function drawMoonStructure() {
    const svg = document.getElementById('moon-structure');
    const wrap = document.getElementById('moon-structure-wrap');
    const cx = 250;
    const cy = 250;

    STRUCTURE_LAYERS.forEach((layer) => {
      const attrs = { cx, cy, r: layer.r, fill: layer.fill };
      if (layer.stroke) {
        attrs.stroke = layer.stroke;
        attrs['stroke-width'] = 2;
      }
      svgEl('circle', attrs, svg);
    });

    STRUCTURE_LAYERS.forEach((layer) => {
      const label = document.createElement('span');
      label.className = 'labelled-diagram-label glossary-toggle diagram-region moon-structure-label';
      label.textContent = layer.name;
      label.style.left = `${layer.pos[0]}%`;
      label.style.top = `${layer.pos[1]}%`;
      label.tabIndex = 0;
      label.setAttribute('role', 'button');
      label.setAttribute('aria-expanded', 'false');
      label.setAttribute('aria-label', `${layer.name}: show its description`);
      label.dataset.term = layer.term;
      wrap.appendChild(label);
    });
  }

  function setUpLayerTableToggle() {
    const button = document.getElementById('toggle-layer-table');
    const panel = document.getElementById('layer-table-panel');
    button.addEventListener('click', () => {
      const nowHidden = !panel.hidden;
      panel.hidden = nowHidden;
      button.setAttribute('aria-pressed', String(!nowHidden));
    });
  }

  // --- Apollo landing sites: a toggle on the near-side map. First draft,
  // to be checked by the teacher — see the page's own note. No flight
  // paths here; those belong on the future Probes and Apollo page.

  const APOLLO_SITES = [
    { term: 'apollo11', name: 'Apollo 11', year: 1969, lat: 0.67, lon: 23.47 },
    { term: 'apollo12', name: 'Apollo 12', year: 1969, lat: -3.01, lon: -23.42 },
    { term: 'apollo14', name: 'Apollo 14', year: 1971, lat: -3.65, lon: -17.47 },
    { term: 'apollo15', name: 'Apollo 15', year: 1971, lat: 26.13, lon: 3.63 },
    { term: 'apollo16', name: 'Apollo 16', year: 1972, lat: -8.97, lon: 15.5 },
    { term: 'apollo17', name: 'Apollo 17', year: 1972, lat: 20.19, lon: 30.77 },
  ];

  function drawApolloSites(svg) {
    const group = svgEl('g', { id: 'apollo-markers', class: 'apollo-markers-hidden' }, svg);
    APOLLO_SITES.forEach((site) => {
      const p = project(site.lat, site.lon);
      const marker = makeToggle(group, site.term, `${site.name}, ${site.year}`);
      svgEl('circle', { cx: p.x, cy: p.y, r: 12, fill: 'transparent', 'pointer-events': 'all' }, marker);
      svgEl('line', { x1: p.x, y1: p.y, x2: p.x, y2: p.y - 14, stroke: '#f1efe6', 'stroke-width': 1.5 }, marker);
      svgEl('path', { d: `M${p.x},${p.y - 14} L${p.x},${p.y - 6} L${(p.x + 8).toFixed(1)},${(p.y - 10).toFixed(1)} Z`, fill: '#c0392b', stroke: '#f1efe6', 'stroke-width': 0.5 }, marker);
      svgEl('circle', { cx: p.x, cy: p.y, r: 2.5, fill: '#f1efe6' }, marker);
    });
  }

  function setUpApolloToggle() {
    const button = document.getElementById('toggle-apollo');
    const markers = document.getElementById('apollo-markers');
    button.addEventListener('click', () => {
      const showing = markers.classList.toggle('apollo-markers-hidden') === false;
      button.setAttribute('aria-pressed', String(showing));
      button.textContent = showing ? 'Hide Apollo landing sites' : 'Show Apollo landing sites';
    });
  }

  // svg/wrap default to the page's own main map so existing callers (just
  // below) don't change; renderFeatureQuizDiagram() below passes a fresh
  // svg/wrap pair instead, with idPrefix set so its <defs> ids can't
  // collide with the main map's (or another quiz instance's) when both
  // are inlined in the same document.
  function drawMoonMap(svg = document.getElementById('moon-map'), wrap = document.getElementById('moon-map-wrap'), idPrefix = '') {
    const defs = svgEl('defs', {}, svg);
    const shade = svgEl('radialGradient', { id: `${idPrefix}moon-shade`, cx: '50%', cy: '50%', r: '50%' }, defs);
    svgEl('stop', { offset: '0%', 'stop-color': '#e6e5df' }, shade);
    svgEl('stop', { offset: '85%', 'stop-color': '#d2d1ca' }, shade);
    svgEl('stop', { offset: '100%', 'stop-color': '#b5b4ad' }, shade);

    // Soft mare edges, and a clip so nothing spills off the disc.
    const soften = svgEl('filter', { id: `${idPrefix}mare-soften`, x: '-10%', y: '-10%', width: '120%', height: '120%' }, defs);
    svgEl('feGaussianBlur', { stdDeviation: '2.2' }, soften);
    const disc = svgEl('clipPath', { id: `${idPrefix}moon-disc` }, defs);
    svgEl('circle', { cx: CX, cy: CY, r: R }, disc);

    svgEl('circle', { cx: CX, cy: CY, r: R, fill: `url(#${idPrefix}moon-shade)` }, svg);

    // The blur goes on each mare's shapes, not on the clickable group,
    // so the group's hover/focus brightening (a CSS filter) can't
    // replace it.
    const mareAttrs = (lat, lon, radius) => ({
      d: sphereCirclePath(lat, lon, radius),
      fill: MARE_COLOR,
      filter: `url(#${idPrefix}mare-soften)`,
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
      'clip-path': `url(#${idPrefix}moon-disc)`,
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

    // Apollo sites are the main page's own toggle (setUpApolloToggle,
    // keyed by the fixed #apollo-markers id below) — skip them for a quiz
    // instance, which has nothing to toggle them with and would otherwise
    // collide with that id if more than one instance is on the page at once.
    if (!idPrefix) drawApolloSites(svg);
  }

  // A small, standalone copy of the map above for a "name that feature"
  // practice question: redraws the same map (drawMoonMap, unchanged) into
  // a fresh svg/wrap pair, reuses the existing hide-labels mechanism (the
  // same .labels-hidden class the page's own "Hide labels" button toggles
  // on #moon-map-wrap) so no label text renders at all, and highlights
  // just the one feature being asked about. Appends the result into
  // `container` (quiz-ui.js's own per-question <div>).
  function renderFeatureQuizDiagram(container, highlightTerm) {
    const wrap = document.createElement('div');
    wrap.className = 'labelled-diagram-wrap labels-hidden';
    const svg = svgEl('svg', {
      viewBox: `0 0 ${SIZE} ${SIZE}`,
      class: 'responsive-svg',
      role: 'img',
      'aria-label': "Map of the Moon's near side, with labels hidden and one feature highlighted to identify",
    }, wrap);

    drawMoonMap(svg, wrap, `quiz-${highlightTerm}-`);

    const target = svg.querySelector(`[data-term="${highlightTerm}"]`);
    if (target) target.classList.add('diagram-feature-highlight');

    // These toggles have no matching glossary definition in a question
    // card, so take them out of the tab order rather than leave a dead
    // keyboard stop.
    svg.querySelectorAll('.glossary-toggle').forEach((el) => el.setAttribute('tabindex', '-1'));

    container.appendChild(wrap);
  }

  // --- Libration in longitude: top-down, exaggerated ellipse. At each of
  // 8 points around the orbit, a blue marker shows the Moon's perfectly
  // steady spin and a red marker shows the true direction to Earth —
  // OrbitalMechanics.trueAnomaly() (the same equation-of-centre maths
  // behind the Equation of Time page) gives the gap between them. The
  // gap is exactly zero at perigee and apogee themselves, and largest a
  // quarter-orbit from each — correct, if easy to miss on first look.

  function drawLibrationLongitude() {
    const svg = document.getElementById('libration-longitude');
    const focus = { x: 260, y: 150 };
    const aPx = 120;
    const eVisual = 0.4; // hugely exaggerated vs the Moon's real ~0.055

    svgEl('circle', { cx: focus.x, cy: focus.y, r: 14, fill: '#2a6bd6' }, svg);

    const ellipsePoints = [];
    for (let m = 0; m <= 360; m += 6) {
      const p = OrbitalMechanics.positionAtMeanAnomaly(m * RAD, aPx, eVisual);
      ellipsePoints.push(`${(focus.x + p.x).toFixed(1)},${(focus.y + p.y).toFixed(1)}`);
    }
    svgEl('path', { d: `M${ellipsePoints.join('L')}Z`, fill: 'none', stroke: '#b7c3d1', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }, svg);

    for (let m = 0; m < 360; m += 45) {
      const M = m * RAD;
      const pos = OrbitalMechanics.positionAtMeanAnomaly(M, aPx, eVisual);
      const moon = { x: focus.x + pos.x, y: focus.y + pos.y };
      const libAngle = Math.atan2(Math.sin(pos.trueAnomalyRad - M), Math.cos(pos.trueAnomalyRad - M));

      svgEl('circle', { cx: moon.x, cy: moon.y, r: 9, fill: '#c9cdd3', stroke: '#6b7684', 'stroke-width': 1 }, svg);

      const toEarth = Math.atan2(focus.y - moon.y, focus.x - moon.x);
      const bodyDir = toEarth - libAngle;
      const markerR = 11;
      const red = { x: moon.x + markerR * Math.cos(toEarth), y: moon.y + markerR * Math.sin(toEarth) };
      const blue = { x: moon.x + markerR * Math.cos(bodyDir), y: moon.y + markerR * Math.sin(bodyDir) };
      svgEl('circle', { cx: red.x, cy: red.y, r: 3, fill: '#c0392b' }, svg);
      svgEl('circle', { cx: blue.x, cy: blue.y, r: 3, fill: '#2a6bd6' }, svg);
    }
  }

  // --- Libration in latitude: side-on. The Moon drawn at two opposite
  // points of the orbit, with its rotation axis tilted the same way in
  // space both times — so the pole we see a little way over flips from
  // north to south.

  function drawLibrationLatitude() {
    const svg = document.getElementById('libration-latitude');
    const planeY = 150;
    const earth = { x: 50, y: planeY };
    const tiltDeg = 25; // hugely exaggerated vs the Moon's real ~6.7°

    svgEl('line', { x1: 20, y1: planeY, x2: 380, y2: planeY, stroke: '#b7c3d1', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }, svg);
    svgEl('circle', { cx: earth.x, cy: earth.y, r: 16, fill: '#2a6bd6' }, svg);

    const moons = [
      { cx: 190, pole: 'north' },
      { cx: 340, pole: 'south' },
    ];

    moons.forEach((m) => {
      const r = 36;
      svgEl('line', { x1: earth.x, y1: earth.y, x2: m.cx, y2: planeY, stroke: '#cfd6df', 'stroke-width': 1, 'stroke-dasharray': '3 2' }, svg);
      svgEl('circle', { cx: m.cx, cy: planeY, r, fill: '#c9cdd3', stroke: '#6b7684', 'stroke-width': 1.5 }, svg);

      const axisLen = r + 20;
      const axisRad = tiltDeg * RAD;
      const ax = Math.sin(axisRad) * axisLen;
      const ay = Math.cos(axisRad) * axisLen;
      svgEl('line', { x1: m.cx - ax, y1: planeY - ay, x2: m.cx + ax, y2: planeY + ay, stroke: '#2f2f2f', 'stroke-width': 2, 'stroke-dasharray': '2 2' }, svg);

      const poleSign = m.pole === 'north' ? -1 : 1;
      const wedgeCenter = poleSign * 90 * RAD;
      const wedgeHalf = 18 * RAD;
      const p1 = { x: m.cx + r * Math.cos(wedgeCenter - wedgeHalf), y: planeY + r * Math.sin(wedgeCenter - wedgeHalf) };
      const p2 = { x: m.cx + r * Math.cos(wedgeCenter + wedgeHalf), y: planeY + r * Math.sin(wedgeCenter + wedgeHalf) };
      svgEl('path', {
        d: `M${m.cx},${planeY} L${p1.x.toFixed(1)},${p1.y.toFixed(1)} A${r},${r} 0 0 1 ${p2.x.toFixed(1)},${p2.y.toFixed(1)} Z`,
        fill: '#f5c542', 'fill-opacity': 0.55,
      }, svg);
    });
  }

  // --- A month of libration: the visible disc, with today's extra
  // sliver and the cumulative envelope of everything revealed so far as
  // the slider scrubs through a sidereal month. Longitude and latitude
  // libration are modelled as simple sinusoids using the amplitudes (8°,
  // 6.7°) already stated in the text above — a schematic first draft,
  // not the Moon's real, slightly different orbital cycles.

  const LIBRATION_PERIOD_DAYS = 27.3;
  const LIBRATION_LON_MAX_DEG = 8;
  const LIBRATION_LAT_MAX_DEG = 6.7;
  const MONTH_CX = 170;
  const MONTH_CY = 170;
  const MONTH_R = 130;
  const MONTH_BINS = 72;
  const MONTH_PX_PER_DEG = 3.2;
  let monthRevealed = new Array(MONTH_BINS).fill(0);
  let monthEnvelopePath;
  let monthTodayPath;

  function libAtDay(t) {
    const phase = (2 * Math.PI * t) / LIBRATION_PERIOD_DAYS;
    return { lon: LIBRATION_LON_MAX_DEG * Math.sin(phase), lat: LIBRATION_LAT_MAX_DEG * Math.cos(phase) };
  }

  // Tapered falloff from the peak direction, zero beyond a narrow arc —
  // a thin sliver round the limb, not a bulge across half the disc.
  const BULGE_HALF_WIDTH_DEG = 28;

  function bulgeAt(binDeg, peakDeg, magnitudeDeg) {
    const diff = ((binDeg - peakDeg + 540) % 360) - 180;
    if (Math.abs(diff) > BULGE_HALF_WIDTH_DEG) return 0;
    const t = diff / BULGE_HALF_WIDTH_DEG;
    return magnitudeDeg * Math.cos((t * Math.PI) / 2);
  }

  function setUpLibrationMonth() {
    const svg = document.getElementById('libration-month');
    svgEl('circle', { cx: MONTH_CX, cy: MONTH_CY, r: MONTH_R, fill: '#c9cdd3', stroke: '#6b7684', 'stroke-width': 1.5 }, svg);
    monthEnvelopePath = svgEl('path', { fill: '#a9693f', 'fill-opacity': 0.45 }, svg);
    monthTodayPath = svgEl('path', { fill: '#f5c542', 'fill-opacity': 0.6 }, svg);
  }

  function renderLibrationMonth(t) {
    const { lon, lat } = libAtDay(t);
    const peakDeg = (Math.atan2(lat, lon) * 180) / Math.PI;
    const magnitudeDeg = Math.hypot(lon, lat);

    const todayPoints = [];
    const envPoints = [];
    for (let i = 0; i <= MONTH_BINS; i += 1) {
      const bin = i % MONTH_BINS;
      const binDeg = bin * (360 / MONTH_BINS);
      const todayBulge = Math.max(0, bulgeAt(binDeg, peakDeg, magnitudeDeg));
      if (todayBulge > monthRevealed[bin]) monthRevealed[bin] = todayBulge;

      const rad = (binDeg * RAD);
      const todayR = MONTH_R + todayBulge * MONTH_PX_PER_DEG;
      const envR = MONTH_R + monthRevealed[bin] * MONTH_PX_PER_DEG;
      todayPoints.push(`${(MONTH_CX + todayR * Math.cos(rad)).toFixed(1)},${(MONTH_CY - todayR * Math.sin(rad)).toFixed(1)}`);
      envPoints.push(`${(MONTH_CX + envR * Math.cos(rad)).toFixed(1)},${(MONTH_CY - envR * Math.sin(rad)).toFixed(1)}`);
    }
    monthTodayPath.setAttribute('d', `M${todayPoints.join('L')}Z`);
    monthEnvelopePath.setAttribute('d', `M${envPoints.join('L')}Z`);

    const revealedAvg = monthRevealed.reduce((a, b) => a + b, 0) / MONTH_BINS;
    const extraPercent = 9 * (revealedAvg / LIBRATION_LON_MAX_DEG);
    const totalPercent = 50 + extraPercent;

    document.getElementById('libration-day-label').textContent = `${t.toFixed(1)} days`;
    document.getElementById('libration-coverage-readout').textContent =
      `Revealed so far this scrub: about ${totalPercent.toFixed(0)}% of the surface (50% base + ` +
      `${extraPercent.toFixed(1)}% from libration).`;
  }

  function setUpLibrationMonthControls() {
    const slider = document.getElementById('libration-day-slider');
    const resetButton = document.getElementById('libration-reset');
    slider.addEventListener('input', () => renderLibrationMonth(Number(slider.value)));
    resetButton.addEventListener('click', () => {
      monthRevealed = new Array(MONTH_BINS).fill(0);
      slider.value = '0';
      renderLibrationMonth(0);
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
    diurnalLibration:
      "Almost — there's a third, smaller cause: diurnal libration, a parallax effect from where you stand. Earth's rotation carries you across its width — about 12,742 km — between moonrise and moonset, so you view the Moon from slightly different angles: about 1° further round one edge, then the other.",
    escapeVelocity:
      "Escape velocity: the speed an object needs to coast away from a planet's gravity for good, with no further push. About 11.2 km/s for Earth.",
    giantImpact:
      'The Giant Impact Hypothesis: the idea that the Moon formed from debris thrown out when a Mars-sized body, Theia, struck the young Earth a glancing blow.',
    moonCrust:
      "Crust: the Moon's thin, rocky outer shell, about 34–43 km thick on average (GRAIL, 2013) — roughly 2–2.5% of its radius, proportionally much thicker than Earth's own crust.",
    moonMantle:
      "Mantle: most of the Moon's interior by volume, semi-solid rock beneath the crust, cooler and stiffer than Earth's own mantle.",
    moonOuterCore:
      'Outer core: a thin, partly molten layer around the inner core, inferred from Apollo seismometer data and later gravity and libration measurements — a first draft, to be checked by the teacher.',
    moonInnerCore:
      "Inner core: a small, dense, likely solid centre rich in iron. Together with the outer core it makes up under 25% of the Moon's radius, offset about 2 km towards the near side — a first draft, to be checked by the teacher.",
    apollo11: 'Apollo 11 — mission 11, 1969: the first crewed Moon landing, in the Sea of Tranquility.',
    apollo12: 'Apollo 12 — mission 12, 1969: landed in the Ocean of Storms.',
    apollo14: 'Apollo 14 — mission 14, 1971: landed near Fra Mauro.',
    apollo15: 'Apollo 15 — mission 15, 1971: landed near Hadley Rille.',
    apollo16: 'Apollo 16 — mission 16, 1972: landed in the Descartes highlands.',
    apollo17: 'Apollo 17 — mission 17, 1972: the last crewed Moon landing, at Taurus–Littrow.',
  };

  drawMoonStructure();
  setUpLayerTableToggle();
  drawMoonMap();
  setUpLabelToggle();
  setUpApolloToggle();
  drawLibrationLongitude();
  drawLibrationLatitude();
  setUpLibrationMonth();
  renderLibrationMonth(0);
  setUpLibrationMonthControls();
  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(MoonStructureQuestions.makeQuestions(SpecData, MoonPhase, { renderFeatureQuizDiagram }));
})();
