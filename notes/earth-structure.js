(function () {
  const YEAR = 2026;
  const CURRICULUM_UNITS = ['u2.1', 'u2.9', 'u2.15', 'u2.16', 'u2.28', 'u2.33'];
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const RAD = Math.PI / 180;

  // Globe geometry, in the SVG's 660x520 viewBox. It's viewed from
  // directly above the equator, so both poles sit on the rim and every
  // parallel is a straight line; turning it to centre on 30°E puts the
  // Prime Meridian off-centre, where its curve reads as a meridian.
  const WIDTH = 660;
  const HEIGHT = 520;
  const CX = 270;
  const CY = 260;
  const R = 190;
  const CENTRE_LONGITUDE = 30;
  const AXIAL_TILT = 23.5;

  const NAMED_PARALLELS = [
    { term: 'arcticCircle', name: 'Arctic Circle', value: '66.5°N', lat: 90 - AXIAL_TILT, color: '#2c7fb8', dash: '8 5' },
    { term: 'tropicOfCancer', name: 'Tropic of Cancer', value: '23.5°N', lat: AXIAL_TILT, color: '#d97706', dash: '8 5' },
    { term: 'equator', name: 'Equator', value: '0°', lat: 0, color: '#c0392b', dash: null },
    { term: 'tropicOfCapricorn', name: 'Tropic of Capricorn', value: '23.5°S', lat: -AXIAL_TILT, color: '#d97706', dash: '8 5' },
    { term: 'antarcticCircle', name: 'Antarctic Circle', value: '66.5°S', lat: -(90 - AXIAL_TILT), color: '#2c7fb8', dash: '8 5' },
  ];
  const PRIME_MERIDIAN_COLOR = '#2e8b57';
  const LABEL_X = 585;

  // Quiz-only dimming (drawGlobe's dimLines param): every reference
  // line/pole normally draws in its own distinct colour, but in the
  // "Name that line" picture quiz every *other* feature besides the one
  // being asked about instead draws pale grey at low opacity, so the
  // highlighted feature's own marker (deep purple, well below) can't be
  // confused with any of them — unlike the old design, where the
  // marker's own accent blue was close enough to the Arctic/Antarctic
  // Circle's own blue to be genuinely hard to tell apart.
  const QUIZ_DIM_LINE_COLOR = '#c7cdd4';
  const QUIZ_DIM_LINE_OPACITY = 0.3;

  const dateSlider = document.getElementById('date-slider');
  const dateLabel = document.getElementById('date-label');
  const latSlider = document.getElementById('lat-slider');
  const latLabel = document.getElementById('lat-label');
  const seasonsContainer = document.getElementById('seasons-diagram-container');

  function dayOfYearToUTCDate(year, dayIndex) {
    const d = new Date(Date.UTC(year, 0, 1));
    d.setUTCDate(d.getUTCDate() + dayIndex);
    return d;
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  }

  function renderOrbit() {
    const dayIndex = Number(dateSlider.value);
    const lat = Number(latSlider.value);
    dateLabel.textContent = formatDate(dayOfYearToUTCDate(YEAR, dayIndex));
    latLabel.textContent = `${lat}°`;
    SeasonsDiagramView.render(seasonsContainer, { dayIndex, lat });
  }

  dateSlider.addEventListener('input', renderOrbit);
  latSlider.addEventListener('input', renderOrbit);

  // Orthographic projection, north up, east to the right.
  function project(latDeg, lonDeg) {
    const lat = latDeg * RAD;
    const lon = (lonDeg - CENTRE_LONGITUDE) * RAD;
    return { x: CX + R * Math.cos(lat) * Math.sin(lon), y: CY - R * Math.sin(lat) };
  }

  function meridianPath(lonDeg) {
    const points = [];
    for (let lat = -90; lat <= 90; lat += 5) {
      const p = project(lat, lonDeg);
      points.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    return `M${points.join('L')}`;
  }

  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (parent) parent.appendChild(el);
    return el;
  }

  function svgText(parent, attrs, content) {
    const el = svgEl('text', attrs, parent);
    el.textContent = content;
    return el;
  }

  // Same tap-to-reveal hookup as the Moon map on notes/moon-structure.html.
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

  function addLabel(wrap, x, y, name, value) {
    const labelEl = document.createElement('span');
    labelEl.className = 'labelled-diagram-label';
    labelEl.style.left = `${(x / WIDTH) * 100}%`;
    labelEl.style.top = `${(y / HEIGHT) * 100}%`;
    labelEl.textContent = name;
    const valueEl = document.createElement('span');
    valueEl.className = 'globe-label-value';
    valueEl.textContent = value;
    labelEl.appendChild(valueEl);
    wrap.appendChild(labelEl);
  }

  // svg/wrap default to the page's own main globe so existing callers
  // (just below) don't change; renderLineQuizDiagram() below passes a
  // fresh svg/wrap pair instead, with idPrefix set so its <defs> id can't
  // collide with the main globe's (or another quiz instance's) when both
  // are inlined in the same document, showLabels off so none of its
  // reference lines render a label at all, and dimLines on so every
  // named parallel/meridian/pole draws pale grey instead of its own
  // normal colour — see the quiz-marker block below for why.
  function drawGlobe(svg = document.getElementById('globe'), wrap = document.getElementById('globe-wrap'), idPrefix = '', showLabels = true, dimLines = false) {
    const defs = svgEl('defs', {}, svg);
    const shade = svgEl('radialGradient', { id: `${idPrefix}globe-shade`, cx: '42%', cy: '40%', r: '65%' }, defs);
    svgEl('stop', { offset: '0%', 'stop-color': '#e3f0fa' }, shade);
    svgEl('stop', { offset: '100%', 'stop-color': '#a9cbe6' }, shade);

    // Rotation axis, poking out past both poles; the globe covers the middle.
    svgEl('line', {
      x1: CX, y1: CY - R - 24, x2: CX, y2: CY + R + 24,
      stroke: '#555', 'stroke-width': 1.5, 'stroke-dasharray': '4 3',
    }, svg);
    svgEl('circle', { cx: CX, cy: CY, r: R, fill: `url(#${idPrefix}globe-shade)`, stroke: '#5b7c99', 'stroke-width': 2 }, svg);

    // Faint unnamed meridians every 30°, on the visible half only.
    const graticule = svgEl('g', { fill: 'none', stroke: '#7d9bb5', 'stroke-width': 1, 'stroke-opacity': 0.6 }, svg);
    for (let lon = CENTRE_LONGITUDE - 60; lon <= CENTRE_LONGITUDE + 60; lon += 30) {
      if (lon !== 0) svgEl('path', { d: meridianPath(lon) }, graticule);
    }

    const leaders = svgEl('g', { class: 'globe-leader', stroke: '#8a97a5', 'stroke-width': 1, 'stroke-dasharray': '3 2', 'pointer-events': 'none' }, svg);

    NAMED_PARALLELS.forEach((line) => {
      const west = project(line.lat, CENTRE_LONGITUDE - 90);
      const east = project(line.lat, CENTRE_LONGITUDE + 90);
      const group = makeToggle(svg, line.term, line.name);
      svgEl('line', { x1: west.x, y1: west.y, x2: east.x, y2: east.y, stroke: 'transparent', 'stroke-width': 18, 'pointer-events': 'stroke' }, group);
      const visible = {
        x1: west.x, y1: west.y, x2: east.x, y2: east.y,
        stroke: dimLines ? QUIZ_DIM_LINE_COLOR : line.color, 'stroke-width': 3, 'stroke-linecap': 'round',
      };
      if (dimLines) visible['stroke-opacity'] = QUIZ_DIM_LINE_OPACITY;
      if (line.dash) visible['stroke-dasharray'] = line.dash;
      svgEl('line', visible, group);

      if (showLabels) {
        svgEl('line', { x1: east.x + 6, y1: east.y, x2: LABEL_X - 78, y2: east.y }, leaders);
        addLabel(wrap, LABEL_X, east.y, line.name, line.value);
      }
    });

    const meridian = makeToggle(svg, 'primeMeridian', 'Prime Meridian');
    svgEl('path', { d: meridianPath(0), fill: 'none', stroke: 'transparent', 'stroke-width': 18, 'pointer-events': 'stroke' }, meridian);
    const meridianVisible = { d: meridianPath(0), fill: 'none', stroke: dimLines ? QUIZ_DIM_LINE_COLOR : PRIME_MERIDIAN_COLOR, 'stroke-width': 3 };
    if (dimLines) meridianVisible['stroke-opacity'] = QUIZ_DIM_LINE_OPACITY;
    svgEl('path', meridianVisible, meridian);
    if (showLabels) {
      const meridianPoint = project(-50, 0);
      const meridianLabel = { x: 95, y: 470 };
      svgEl('line', { x1: meridianPoint.x - 4, y1: meridianPoint.y + 4, x2: meridianLabel.x + 30, y2: meridianLabel.y - 22 }, leaders);
      addLabel(wrap, meridianLabel.x, meridianLabel.y, 'Prime Meridian', '0° longitude');
    }

    [
      { term: 'northPole', name: 'North Pole', value: '90°N', lat: 90, labelY: 24 },
      { term: 'southPole', name: 'South Pole', value: '90°S', lat: -90, labelY: 496 },
    ].forEach((pole) => {
      const p = project(pole.lat, CENTRE_LONGITUDE);
      const group = makeToggle(svg, pole.term, pole.name);
      svgEl('circle', { cx: p.x, cy: p.y, r: 16, fill: 'transparent', 'pointer-events': 'all' }, group);
      const dotAttrs = { cx: p.x, cy: p.y, r: 6, fill: dimLines ? QUIZ_DIM_LINE_COLOR : '#1f2d3d', stroke: '#fff', 'stroke-width': 1.5 };
      if (dimLines) dotAttrs['fill-opacity'] = QUIZ_DIM_LINE_OPACITY;
      svgEl('circle', dotAttrs, group);
      if (showLabels) addLabel(wrap, CX, pole.labelY, pole.name, pole.value);
    });
  }

  // A CSS filter/drop-shadow doesn't render reliably on SVG shapes in
  // Safari/WebKit, so the highlight here is real SVG attributes, added
  // as one fresh marker shape on top of the globe — never a restyle of
  // the feature's own line or dot. A plain accent-blue ring used to read
  // as just another line on the globe (close enough to the Arctic/
  // Antarctic Circle's own blue to be genuinely hard to tell apart), so
  // the marker is now about four times a normal line's own 3px width,
  // in a deep purple no line on the globe ever uses, with a small arrow
  // and a "?" pointing at it from just outside the globe — a bold dot
  // alone for a pole, since a point doesn't need an arrow to find it.
  // Every *other* reference line/pole now draws pale grey (drawGlobe's
  // dimLines) so the marker reads against all of them, not just its own
  // neighbours.
  const QUIZ_MARKER_COLOR = '#6a1b9a';
  const QUIZ_MARKER_UNDERLAY_COLOR = '#ffffff';
  const QUIZ_MARKER_STROKE_WIDTH = 12; // ~4x NAMED_PARALLELS' own 3px lines
  const QUIZ_MARKER_UNDERLAY_STROKE_WIDTH = 16;
  const QUIZ_MARKER_POLE_RADIUS = 11;
  const QUIZ_ARROW_LENGTH = 22;
  const QUIZ_ARROW_GAP = 8;

  function drawQuizMarkerShape(tag, attrs, parent) {
    svgEl(tag, { ...attrs, fill: 'none', stroke: QUIZ_MARKER_UNDERLAY_COLOR, 'stroke-width': QUIZ_MARKER_UNDERLAY_STROKE_WIDTH }, parent);
    svgEl(tag, { ...attrs, fill: 'none', stroke: QUIZ_MARKER_COLOR, 'stroke-width': QUIZ_MARKER_STROKE_WIDTH }, parent);
  }

  // A short arrow pointing in at `anchor` from just outside the globe
  // (along the line from the globe's own centre through anchor), with a
  // bold "?" beside its tail — the "what is this?" annotation for a
  // highlighted line. `idPrefix` keeps the arrowhead marker's id from
  // colliding when several quiz instances are inlined in one document.
  function drawQuizArrow(parent, anchor, idPrefix) {
    const dx = anchor.x - CX;
    const dy = anchor.y - CY;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;
    const tailX = anchor.x + ux * (QUIZ_ARROW_LENGTH + QUIZ_ARROW_GAP);
    const tailY = anchor.y + uy * (QUIZ_ARROW_LENGTH + QUIZ_ARROW_GAP);
    const headX = anchor.x + ux * QUIZ_ARROW_GAP;
    const headY = anchor.y + uy * QUIZ_ARROW_GAP;

    const defs = svgEl('defs', {}, parent);
    const markerId = `${idPrefix}quiz-arrowhead`;
    const marker = svgEl('marker', { id: markerId, markerWidth: 8, markerHeight: 8, refX: 6, refY: 4, orient: 'auto' }, defs);
    svgEl('path', { d: 'M0,0 L8,4 L0,8 Z', fill: QUIZ_MARKER_COLOR }, marker);

    svgEl('line', { x1: tailX, y1: tailY, x2: headX, y2: headY, stroke: QUIZ_MARKER_UNDERLAY_COLOR, 'stroke-width': 6, 'stroke-linecap': 'round' }, parent);
    svgEl('line', {
      x1: tailX, y1: tailY, x2: headX, y2: headY,
      stroke: QUIZ_MARKER_COLOR, 'stroke-width': 3, 'stroke-linecap': 'round', 'marker-end': `url(#${markerId})`,
    }, parent);

    const qX = anchor.x + ux * (QUIZ_ARROW_LENGTH + QUIZ_ARROW_GAP + 15);
    const qY = anchor.y + uy * (QUIZ_ARROW_LENGTH + QUIZ_ARROW_GAP + 15);
    const text = svgEl('text', {
      x: qX, y: qY, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
      'font-size': 20, 'font-weight': 700, fill: QUIZ_MARKER_COLOR,
      stroke: QUIZ_MARKER_UNDERLAY_COLOR, 'stroke-width': 3, 'paint-order': 'stroke',
    }, parent);
    text.textContent = '?';
  }

  function applyLineQuizHighlight(svg, highlightTerm, idPrefix) {
    const region = svg.querySelector(`.diagram-region[data-term="${highlightTerm}"]`);
    if (!region) return;
    region.classList.add('diagram-feature-highlight');

    const marker = svgEl('g', { class: 'quiz-feature-marker', 'pointer-events': 'none' }, svg);

    if (highlightTerm === 'northPole' || highlightTerm === 'southPole') {
      const p = project(highlightTerm === 'northPole' ? 90 : -90, CENTRE_LONGITUDE);
      svgEl('circle', { cx: p.x, cy: p.y, r: QUIZ_MARKER_POLE_RADIUS, fill: QUIZ_MARKER_COLOR, stroke: QUIZ_MARKER_UNDERLAY_COLOR, 'stroke-width': 3 }, marker);
      return;
    }

    if (highlightTerm === 'primeMeridian') {
      drawQuizMarkerShape('path', { d: meridianPath(0), 'stroke-linecap': 'round' }, marker);
      drawQuizArrow(marker, project(-50, 0), idPrefix);
      return;
    }

    const parallel = NAMED_PARALLELS.find((line) => line.term === highlightTerm);
    if (parallel) {
      const west = project(parallel.lat, CENTRE_LONGITUDE - 90);
      const east = project(parallel.lat, CENTRE_LONGITUDE + 90);
      drawQuizMarkerShape('line', { x1: west.x, y1: west.y, x2: east.x, y2: east.y, 'stroke-linecap': 'round' }, marker);
      drawQuizArrow(marker, east, idPrefix);
    }
  }

  // A small, standalone copy of the globe above for a "name that line"
  // practice question: redraws the same globe (drawGlobe, unchanged
  // geometry) into a fresh svg/wrap pair with showLabels off (so none of
  // the eight reference features render a label at all — stronger than
  // the Moon map's .labels-hidden CSS toggle, since there's no existing
  // "hide labels" button on this page to reuse the class from) and
  // dimLines on, and highlights just the one feature being asked about.
  function renderLineQuizDiagram(container, highlightTerm) {
    const wrap = document.createElement('div');
    wrap.className = 'labelled-diagram-wrap';
    const svg = svgEl('svg', {
      viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
      width: WIDTH,
      height: HEIGHT,
      class: 'responsive-svg',
      role: 'img',
      'aria-label': 'Globe with labels hidden and one reference line or point highlighted to identify',
    }, wrap);

    const idPrefix = `quiz-${highlightTerm}-`;
    drawGlobe(svg, wrap, idPrefix, false, true);
    applyLineQuizHighlight(svg, highlightTerm, idPrefix);

    svg.querySelectorAll('.glossary-toggle').forEach((el) => el.setAttribute('tabindex', '-1'));

    container.appendChild(wrap);
  }

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  // --- "Inside the Earth": drawn here (not static markup) so its ---------
  // labels can use the same ring-sits-to-the-left, labels-in-one-column-
  // to-the-right placement as notes/sun-features.html's Sun structure
  // diagram and notes/moon-structure.html's Inside the Moon — see
  // src/ringDiagramLabels.js, the geometry shared by all three.
  // Clicking a label highlights the matching ring and scrolls to the
  // matching legend entry, each other's match by the same data-layer
  // value (crust / mantle / outer-core / inner-core) — unchanged from
  // before, just wired up after the labels are drawn instead of to
  // static ones already in the HTML.

  // Outermost first, matching the top-to-bottom label order (outermost
  // layer to the centre).
  const EARTH_INTERNAL_LAYERS = [
    { layer: 'crust', name: 'Crust', radius: 200, fill: '#5b7c99', stroke: '#3f5a70' },
    { layer: 'mantle', name: 'Mantle', radius: 188, fill: '#c17a4a' },
    { layer: 'outer-core', name: 'Outer core', radius: 106, fill: '#e8631a' },
    { layer: 'inner-core', name: 'Inner core', radius: 43, fill: '#fff2c4' },
  ];
  const EARTH_LAYERS_GEOMETRY = { cx: 224, cy: 290, outerRadius: 200, width: 648, height: 580, labelX: 448 };

  function highlightEarthLayer(layer) {
    document.querySelectorAll('.earth-layer-region').forEach((region) => {
      region.classList.toggle('earth-layer-region--active', region.dataset.layer === layer);
    });
    const li = document.querySelector(`.layer-legend li[data-layer="${layer}"]`);
    document.querySelectorAll('.layer-legend li[data-layer]').forEach((item) => {
      item.classList.toggle('layer-legend-active', item === li);
    });
    if (li) li.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function drawEarthLayers() {
    const svg = document.getElementById('earth-layers');
    const wrap = document.getElementById('earth-layers-wrap');

    // EARTH_INTERNAL_LAYERS is already outermost first, so drawing it in
    // that order paints each smaller ring over the last, same nesting the
    // previous static markup relied on.
    EARTH_INTERNAL_LAYERS.forEach((layer) => {
      const attrs = {
        cx: EARTH_LAYERS_GEOMETRY.cx, cy: EARTH_LAYERS_GEOMETRY.cy, r: layer.radius, fill: layer.fill,
        class: 'earth-layer-region', 'data-layer': layer.layer,
      };
      if (layer.stroke) {
        attrs.stroke = layer.stroke;
        attrs['stroke-width'] = 2;
      }
      svgEl('circle', attrs, svg);
    });

    const leaders = svgEl('g', { stroke: '#8a97a5', 'stroke-width': 1, 'stroke-dasharray': '3 2', 'pointer-events': 'none' }, svg);
    const rows = RingDiagramLabels.layoutRingColumn({ ...EARTH_LAYERS_GEOMETRY, layers: EARTH_INTERNAL_LAYERS });
    rows.forEach((row, i) => {
      const layer = EARTH_INTERNAL_LAYERS[i];
      svgEl('line', { x1: row.dotX, y1: row.dotY, x2: row.labelX, y2: row.labelY }, leaders);
      svgEl('circle', { cx: row.dotX, cy: row.dotY, r: 4, fill: '#8a97a5' }, leaders);

      const label = document.createElement('span');
      label.className = 'ring-diagram-label earth-layer-label';
      label.dataset.layer = layer.layer;
      label.tabIndex = 0;
      label.setAttribute('role', 'button');
      label.setAttribute('aria-label', `${layer.name}: show its description`);
      label.style.left = `${row.leftPercent}%`;
      label.style.top = `${row.topPercent}%`;
      label.textContent = layer.name;
      wrap.appendChild(label);
    });

    document.querySelectorAll('.earth-layer-label').forEach((label) => {
      label.addEventListener('click', () => highlightEarthLayer(label.dataset.layer));
      label.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          highlightEarthLayer(label.dataset.layer);
        }
      });
    });
  }

  // --- The atmosphere: composition bar, layer ladder, and transmission ---
  // chart. All three are original SVG diagrams, JS-drawn for the same
  // reason the globe and "Inside the Earth" are: an empty <svg> in the
  // static markup, filled in here.

  // One horizontal bar split into nitrogen/oxygen/argon by true
  // proportion. Carbon dioxide (0.04%) and the remaining trace gases are
  // far too thin a sliver to draw at this width at all, so they're called
  // out in a label instead of a segment — the full table (kept in its own
  // tap-to-reveal in the HTML) has the exact figures.
  const AIR_COMPOSITION = [
    { name: 'Nitrogen', pct: 78, fill: '#2a6bd6', textFill: '#fff' },
    { name: 'Oxygen', pct: 21, fill: '#5ea8c7', textFill: '#1f2d3d' },
    { name: 'Argon', pct: 1, fill: '#9aa5b1', textFill: '#1f2d3d' },
  ];

  function drawCompositionBar() {
    const svg = document.getElementById('composition-bar');
    if (!svg) return;
    const barX = 20;
    const barWidth = 580;
    const barY = 45;
    const barHeight = 55;

    svgEl('text', { x: barX, y: 22, 'font-size': 15, fill: '#333' }, svg).textContent = 'Dry air, by volume';

    let x = barX;
    AIR_COMPOSITION.forEach((gas) => {
      const width = (gas.pct / 100) * barWidth;
      svgEl('rect', { x, y: barY, width, height: barHeight, fill: gas.fill }, svg);
      if (width > 40) {
        const label = svgEl('text', {
          x: x + width / 2, y: barY + barHeight / 2 + 5,
          'font-size': 13, fill: gas.textFill, 'text-anchor': 'middle',
        }, svg);
        label.textContent = `${gas.name} ${gas.pct}%`;
      } else {
        const tickX = x + width / 2;
        svgEl('line', { x1: tickX, y1: barY, x2: tickX, y2: barY - 22, stroke: '#8a97a5', 'stroke-width': 1 }, svg);
        const label = svgEl('text', {
          x: tickX, y: barY - 26, 'font-size': 12, fill: '#444', 'text-anchor': 'end',
        }, svg);
        label.textContent = `${gas.name} ${gas.pct}%`;
      }
      x += width;
    });

    const note = svgEl('text', { x: barX + barWidth / 2, y: 135, 'font-size': 12, fill: '#555', 'text-anchor': 'middle' }, svg);
    note.textContent = 'Carbon dioxide (0.04%) and trace gases are far too thin to draw to scale.';
    const note2 = svgEl('text', { x: barX + barWidth / 2, y: 152, 'font-size': 12, fill: '#555', 'text-anchor': 'middle' }, svg);
    note2.textContent = "See the full breakdown for the exact figures.";
  }

  // A schematic vertical ladder, bottom (ground) to top (edge of space):
  // the four bands are drawn the same height as each other for
  // readability (the thermosphere's real thickness dwarfs the other
  // three put together), with the real approximate altitude of each
  // boundary labelled on the side — same "schematic, not to scale"
  // convention as the Earth/Moon/Sun interior diagrams.
  const ATMOSPHERE_LAYERS = [
    { name: 'Troposphere', fill: '#8ec9e8', topAltitude: '~12 km' },
    { name: 'Stratosphere', fill: '#5ea8c7', topAltitude: '~50 km' },
    { name: 'Mesosphere', fill: '#3a6f95', topAltitude: '~85 km' },
    { name: 'Thermosphere', fill: '#1f3a5f', topAltitude: '~600 km' },
  ];

  function drawAtmosphereLadder() {
    const svg = document.getElementById('atmosphere-ladder');
    if (!svg) return;
    const bandWidth = 180;
    const bandHeight = 85;
    const bandX = 70;
    const groundY = 380;

    svgEl('text', { x: bandX, y: groundY + 18, 'font-size': 12, fill: '#4a6741', 'font-weight': 600 }, svg).textContent = "Earth's surface";
    svgEl('line', { x1: bandX - 10, y1: groundY, x2: bandX + bandWidth + 10, y2: groundY, stroke: '#4a6741', 'stroke-width': 2 }, svg);

    [...ATMOSPHERE_LAYERS].reverse().forEach((layer, i) => {
      const bottomY = groundY - i * bandHeight;
      const topY = bottomY - bandHeight;
      svgEl('rect', { x: bandX, y: topY, width: bandWidth, height: bandHeight, fill: layer.fill }, svg);
      const label = svgEl('text', {
        x: bandX + bandWidth / 2, y: topY + bandHeight / 2 + 5,
        'font-size': 13, fill: '#fff', 'text-anchor': 'middle',
      }, svg);
      label.textContent = layer.name;

      svgEl('line', { x1: bandX + bandWidth, y1: topY, x2: bandX + bandWidth + 20, y2: topY, stroke: '#8a97a5', 'stroke-width': 1, 'stroke-dasharray': '3 2' }, svg);
      const altitudeLabel = svgEl('text', {
        x: bandX + bandWidth + 26, y: topY + 4, 'font-size': 12, fill: '#333',
      }, svg);
      altitudeLabel.textContent = layer.topAltitude;
    });
  }

  // The transmission-window chart lives in src/atmosphereWindows.js,
  // shared with notes/infrared-telescopes.html.
  function drawTransmissionChart() {
    const svg = document.getElementById('transmission-chart');
    if (!svg) return;
    window.AtmosphereWindows.draw(svg);
  }

  const GLOSSARY = {
    oblateSpheroid:
      "Oblate spheroid: a sphere very slightly flattened at the poles and bulging at the equator, caused by a planet's own rotation. Earth's mean diameter is about 13,000 km (more precisely 12,742 km), and its equatorial diameter is only about 43 km more than its polar diameter.",
    tropicsOrigin:
      "The tropics and polar circles aren't arbitrary: they come from Earth's 23.5° axial tilt. The tropics are 23.5° from the equator, and the polar circles are 23.5° from the poles (90° − 23.5° = 66.5°). The Prime Meridian is different — nothing in nature picks it out; it was chosen to run through Greenwich by international agreement in 1884.",
    greenhouseEffect:
      "The greenhouse effect: infrared radiation from the ground is absorbed by certain atmospheric gases (via molecular resonance) and re-emitted in all directions, warming the surface more than sunlight alone would.",
    scintillation:
      "Scintillation: the visible 'twinkling' of stars, caused by constantly shifting pockets of different density and temperature in the atmosphere bending starlight unpredictably as it arrives.",
    parallel:
      'A parallel: a line of constant latitude, running east–west round the globe. Parallels get smaller towards the poles, and never meet.',
    meridianLine:
      'A meridian: a line of constant longitude, running from the North Pole to the South Pole. All meridians are the same length, and they all meet at the poles.',
    northPole:
      "The North Pole (90°N): where Earth's rotation axis meets the surface in the north. Polaris, the Pole Star, is almost directly overhead here.",
    arcticCircle:
      "The Arctic Circle (~66.5°N, that is 90° − 23.5°): north of it, there's at least one day around the June solstice when the Sun never sets (the midnight Sun), and one around the December solstice when it never rises (polar night).",
    tropicOfCancer:
      'The Tropic of Cancer (~23.5°N): the farthest north the Sun is ever directly overhead at noon, which happens at the June solstice. Its latitude equals Earth\'s axial tilt.',
    equator:
      'The equator (0° latitude): the circle halfway between the poles, and the longest parallel. The Sun is directly overhead here at noon at the March and September equinoxes.',
    tropicOfCapricorn:
      'The Tropic of Capricorn (~23.5°S): the farthest south the Sun is ever directly overhead at noon, which happens at the December solstice.',
    antarcticCircle:
      'The Antarctic Circle (~66.5°S): the southern match for the Arctic Circle, with a midnight Sun around the December solstice and polar night around the June solstice.',
    southPole:
      "The South Pole (90°S): where Earth's rotation axis meets the surface in the south. There's no bright southern pole star to mark the sky above it.",
    primeMeridian:
      'The Prime Meridian (0° longitude): the meridian that longitude is measured east or west from. It runs through the Royal Observatory, Greenwich, chosen by international agreement in 1884.',
    transmissionWindow:
      'An atmospheric transmission window: a range of wavelengths that passes through the atmosphere with little absorption and reaches the ground, unlike most of the electromagnetic spectrum.',
  };

  function setUpBodyLayersToggle() {
    const button = document.getElementById('toggle-body-layers');
    const panel = document.getElementById('body-layers-panel');
    if (!button || !panel) return;
    button.addEventListener('click', () => {
      const nowHidden = !panel.hidden;
      panel.hidden = nowHidden;
      button.setAttribute('aria-pressed', String(!nowHidden));
    });
  }

  // --- "Why does the tilt cause the seasons?" scaffolded section ------
  // Four tap-to-reveal steps (src/seasonsIntensity.js's own header
  // explains the physics each one draws on): a distance-myth chart, an
  // interactive torch-beam intensity diagram, a day-length readout that
  // follows the main diagram's own date/latitude sliders, and a combined
  // noon-altitude/day-length table at a latitude the student sets
  // (defaulting to Guildford, ~51°N). Each ends in a one-question quick
  // check — see wireQuickCheck below — with instant feedback, never
  // tracked in the page's QuizUI progress tally, since these are
  // comprehension checks within a step, not the page's own practice
  // questions.

  const DISTANCE_CHART_WIDTH = 640;
  const DISTANCE_CHART_HEIGHT = 280;
  const DISTANCE_CHART_PAD = { left: 64, right: 16, top: 34, bottom: 40 };

  function formatMillionKm(km) {
    return `${Math.round(km / 1e6)}M km`;
  }

  // Step 1: Earth's real distance from the Sun through the year, from
  // SeasonsIntensity.yearlyDistanceSeriesKm() — drawn once (not
  // interactive), since the point is the shape of the whole-year curve,
  // not any one date.
  function drawDistanceChart() {
    const svg = document.getElementById('distance-chart-svg');
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox', `0 0 ${DISTANCE_CHART_WIDTH} ${DISTANCE_CHART_HEIGHT}`);

    const series = SeasonsIntensity.yearlyDistanceSeriesKm();
    const distances = series.map((p) => p.distanceKm);
    const minKm = Math.min(...distances);
    const maxKm = Math.max(...distances);
    const plotLeft = DISTANCE_CHART_PAD.left;
    const plotRight = DISTANCE_CHART_WIDTH - DISTANCE_CHART_PAD.right;
    const plotTop = DISTANCE_CHART_PAD.top;
    const plotBottom = DISTANCE_CHART_HEIGHT - DISTANCE_CHART_PAD.bottom;

    function xFor(dayIndex) {
      return plotLeft + (dayIndex / (series.length - 1)) * (plotRight - plotLeft);
    }
    function yFor(km) {
      return plotTop + (1 - (km - minKm) / (maxKm - minKm)) * (plotBottom - plotTop);
    }

    svgEl('line', { x1: plotLeft, y1: plotTop, x2: plotLeft, y2: plotBottom, stroke: '#9aa5b1', 'stroke-width': 1 }, svg);
    svgEl('line', { x1: plotLeft, y1: plotBottom, x2: plotRight, y2: plotBottom, stroke: '#9aa5b1', 'stroke-width': 1 }, svg);

    svgText(svg, { x: plotLeft - 8, y: yFor(maxKm) + 4, 'text-anchor': 'end', class: 'chart-axis-label' }, formatMillionKm(maxKm));
    svgText(svg, { x: plotLeft - 8, y: yFor(minKm) + 4, 'text-anchor': 'end', class: 'chart-axis-label' }, formatMillionKm(minKm));

    const monthTicks = [
      { dayIndex: 0, label: 'Jan' },
      { dayIndex: 91, label: 'Apr' },
      { dayIndex: 182, label: 'Jul' },
      { dayIndex: 273, label: 'Oct' },
      { dayIndex: 364, label: 'Dec' },
    ];
    monthTicks.forEach(({ dayIndex, label }) => {
      svgText(svg, { x: xFor(dayIndex), y: plotBottom + 20, 'text-anchor': 'middle', class: 'chart-axis-label' }, label);
    });

    const pathD = series.map((p, i) => `${i === 0 ? 'M' : 'L'}${xFor(p.dayIndex).toFixed(1)},${yFor(p.distanceKm).toFixed(1)}`).join('');
    svgEl('path', { d: pathD, fill: 'none', stroke: '#2a6bd6', 'stroke-width': 2.5 }, svg);

    // Both marked points sit near the curve's own peak or trough, so
    // there's always empty space above them (below would crowd the
    // curve's gently-sloped shoulder either side) — the top padding
    // above leaves room for that. Anchored away from whichever
    // vertical edge the point sits nearest, so a point near the right
    // edge gets a leftward-flowing label, never one centred with no
    // room to its right.
    function markPoint(dayIndex, label) {
      const point = series[dayIndex];
      const x = xFor(point.dayIndex);
      const y = yFor(point.distanceKm);
      svgEl('circle', { cx: x, cy: y, r: 5, fill: '#c0392b' }, svg);
      const fractionAcross = (x - plotLeft) / (plotRight - plotLeft);
      const anchor = fractionAcross > 0.8 ? 'end' : fractionAcross < 0.2 ? 'start' : 'middle';
      const labelX = anchor === 'end' ? x + 10 : anchor === 'start' ? x - 10 : x;
      svgText(svg, { x: labelX, y: y - 20, 'text-anchor': anchor, class: 'chart-point-label' }, label);
    }
    markPoint(171, 'UK summer (June)');
    markPoint(355, 'UK winter (December)');
  }

  // Step 2: the "torch beam" diagram. A fixed-width parallel beam
  // (sunlight) meets flat ground at the chosen altitude; two parallel
  // rays, offset perpendicular to the beam direction by the beam's own
  // width, are extended to the ground, and the gap between where they
  // land is the lit patch — this is an exact geometric derivation of
  // width/sin(altitude) — not an approximation, exact for a beam of
  // parallel rays. Built from the ground up (fixed hit points centred
  // on TORCH_MID_X, rays extended backwards a fixed distance from
  // them) rather than from a fixed source, so the lit patch always
  // sits in the same place on screen and the rays never run off the
  // edge of the diagram at a low altitude, however far side-on the
  // real geometry would put a true point source.
  const TORCH_WIDTH = 640;
  const TORCH_HEIGHT = 320;
  const TORCH_GROUND_Y = 260;
  const TORCH_BEAM_WIDTH = 36;
  const TORCH_RAY_LENGTH = 200;
  const TORCH_MID_X = 320;

  function torchBeamGeometry(altitudeDeg) {
    const theta = (altitudeDeg * Math.PI) / 180;
    const dir = { x: Math.cos(theta), y: Math.sin(theta) };
    const patchWidth = TORCH_BEAM_WIDTH / Math.sin(theta);
    const hit1 = { x: TORCH_MID_X - patchWidth / 2, y: TORCH_GROUND_Y };
    const hit2 = { x: TORCH_MID_X + patchWidth / 2, y: TORCH_GROUND_Y };
    const start1 = { x: hit1.x - dir.x * TORCH_RAY_LENGTH, y: hit1.y - dir.y * TORCH_RAY_LENGTH };
    const start2 = { x: hit2.x - dir.x * TORCH_RAY_LENGTH, y: hit2.y - dir.y * TORCH_RAY_LENGTH };
    const mid = { x: (start1.x + start2.x) / 2, y: (start1.y + start2.y) / 2 };
    const sunPos = { x: mid.x - dir.x * 40, y: mid.y - dir.y * 40 };
    return { start1, start2, hit1, hit2, sunPos };
  }

  function drawTorchBeam(altitudeDeg) {
    const svg = document.getElementById('torch-beam-svg');
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox', `0 0 ${TORCH_WIDTH} ${TORCH_HEIGHT}`);

    svgEl('line', { x1: 20, y1: TORCH_GROUND_Y, x2: TORCH_WIDTH - 20, y2: TORCH_GROUND_Y, stroke: '#6b7684', 'stroke-width': 2 }, svg);
    svgText(svg, { x: TORCH_WIDTH - 24, y: TORCH_GROUND_Y + 20, 'text-anchor': 'end', class: 'chart-axis-label' }, 'ground');

    const geom = torchBeamGeometry(altitudeDeg);
    const intensity = SeasonsIntensity.relativeIntensity(altitudeDeg);

    const patchLeft = Math.min(geom.hit1.x, geom.hit2.x);
    const patchRight = Math.max(geom.hit1.x, geom.hit2.x);
    svgEl(
      'rect',
      {
        x: patchLeft,
        y: TORCH_GROUND_Y - 5,
        width: patchRight - patchLeft,
        height: 10,
        fill: '#f5a623',
        'fill-opacity': (0.25 + 0.65 * intensity).toFixed(2),
      },
      svg
    );

    svgEl('line', { x1: geom.start1.x, y1: geom.start1.y, x2: geom.hit1.x, y2: geom.hit1.y, stroke: '#e8a33d', 'stroke-width': 3 }, svg);
    svgEl('line', { x1: geom.start2.x, y1: geom.start2.y, x2: geom.hit2.x, y2: geom.hit2.y, stroke: '#e8a33d', 'stroke-width': 3 }, svg);

    SunIcon.appendSunSvg(svg, geom.sunPos.x, geom.sunPos.y, 20);
    svgText(svg, { x: patchLeft + (patchRight - patchLeft) / 2, y: TORCH_GROUND_Y + 36, 'text-anchor': 'middle', class: 'chart-point-label' }, 'lit patch');
  }

  function updateTorchBeam() {
    const slider = document.getElementById('altitude-slider');
    const label = document.getElementById('altitude-label');
    const readout = document.getElementById('intensity-readout');
    if (!slider) return;
    const altitudeDeg = Number(slider.value);
    label.textContent = `${altitudeDeg}°`;
    drawTorchBeam(altitudeDeg);
    const intensity = SeasonsIntensity.relativeIntensity(altitudeDeg);
    readout.textContent = `Energy on each square metre, compared with the Sun overhead: ${intensity.toFixed(2)}`;
  }

  // Step 3: day length at whatever date/latitude the main diagram's own
  // sliders are currently set to — no separate control, so dragging
  // either slider above visibly moves this readout too.
  function updateStep3Readout() {
    const readout = document.getElementById('step3-day-length-readout');
    if (!readout) return;
    const dayIndex = Number(dateSlider.value);
    const lat = Number(latSlider.value);
    const date = SeasonsDiagram.dateForDayIndex(dayIndex);
    const dayLengthMin = SeasonsDiagram.dayLengthMinutes(date, lat);
    const hours = Math.floor(dayLengthMin / 60);
    const minutes = Math.round(dayLengthMin % 60);
    readout.textContent = `Day length on ${formatDate(dayOfYearToUTCDate(YEAR, dayIndex))} at ${lat}°: ${hours}h ${minutes}m`;
  }

  // Step 4: noon altitude and day length at the three key dates
  // (equinox, June solstice, December solstice), recomputed live for
  // whatever latitude the student sets here (own slider, defaulting to
  // Guildford, ~51°N) — the same engine calls seasonsDiagramView.js's
  // own readout uses, just at three fixed reference dates instead of
  // one slider-driven date.
  const TILT_REFERENCE_DATES = [
    { dayIndex: 79, label: 'March equinox' },
    { dayIndex: 171, label: 'June solstice' },
    { dayIndex: 355, label: 'December solstice' },
  ];

  function updateTiltCombinedTable() {
    const slider = document.getElementById('tilt-lat-slider');
    const label = document.getElementById('tilt-lat-label');
    const table = document.getElementById('tilt-combined-table');
    if (!slider || !table) return;
    const lat = Number(slider.value);
    label.textContent = `${lat}°`;
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    TILT_REFERENCE_DATES.forEach(({ dayIndex, label: dateLabel }) => {
      const date = SeasonsDiagram.dateForDayIndex(dayIndex);
      const declination = SolarPosition.getSunPosition(date, 0, 0).declination;
      const noonAltitude = SeasonsDiagram.noonAltitudeDeg(declination, lat);
      const dayLengthMin = SeasonsDiagram.dayLengthMinutes(date, lat);
      const hours = Math.floor(dayLengthMin / 60);
      const minutes = Math.round(dayLengthMin % 60);
      const row = document.createElement('tr');
      const cells = [dateLabel, `${noonAltitude.toFixed(0)}°`, `${hours}h ${minutes}m`];
      cells.forEach((text) => {
        const td = document.createElement('td');
        td.textContent = text;
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
  }

  // One-question quick checks with instant feedback, inside each
  // step's own reveal panel — never fed into QuizUI's progress tally
  // (that's reserved for the page's own Practice questions section),
  // just a plain correct/incorrect message the instant a choice is
  // tapped. Every button in the same .quick-check answers the same
  // one question, so once any button is tapped, all of them lock (no
  // changing your answer after seeing the feedback) and the tapped one
  // (plus, when wrong, the correct one) is colour-coded.
  function wireQuickCheck(container) {
    const buttons = [...container.querySelectorAll('.quick-check-options button')];
    const feedback = container.querySelector('.quick-check-feedback');
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        if (container.dataset.answered) return;
        container.dataset.answered = 'true';
        const correct = button.dataset.correct === 'true';
        button.classList.add(correct ? 'quick-check-correct' : 'quick-check-incorrect');
        if (!correct) {
          const correctButton = buttons.find((b) => b.dataset.correct === 'true');
          if (correctButton) correctButton.classList.add('quick-check-correct');
        }
        feedback.className = 'question-feedback quick-check-feedback ' + (correct ? 'correct' : 'incorrect');
        feedback.textContent = correct ? 'Correct!' : 'Not quite — the highlighted answer is correct.';
      });
    });
  }

  function initWhyTiltSection() {
    drawDistanceChart();
    const altitudeSlider = document.getElementById('altitude-slider');
    if (altitudeSlider) {
      altitudeSlider.addEventListener('input', updateTorchBeam);
      updateTorchBeam();
    }
    updateStep3Readout();
    dateSlider.addEventListener('input', updateStep3Readout);
    latSlider.addEventListener('input', updateStep3Readout);
    const tiltLatSlider = document.getElementById('tilt-lat-slider');
    if (tiltLatSlider) {
      tiltLatSlider.addEventListener('input', updateTiltCombinedTable);
      updateTiltCombinedTable();
    }
    document.querySelectorAll('.quick-check').forEach(wireQuickCheck);
  }

  drawGlobe();
  drawEarthLayers();
  setUpBodyLayersToggle();
  BodyLayersDiagram.mount({
    svgId: 'body-layers-svg',
    wrapId: 'body-layers-wrap',
    sameScaleButtonId: 'body-layers-same-scale',
    sameSizeButtonId: 'body-layers-same-size',
    captionId: 'body-layers-caption',
  }, { SpecData, RingDiagramLabels });
  BodyLayersDiagram.mountShareChart('body-layers-share-svg', 'body-layers-share-wrap');
  drawCompositionBar();
  drawAtmosphereLadder();
  drawTransmissionChart();
  renderOrbit();
  renderCoverage();
  initWhyTiltSection();
  Glossary.init(GLOSSARY);
  const earthQuestions = EarthStructureQuestions.makeQuestions(SpecData, { renderLineQuizDiagram });
  const lineQuizQuestions = earthQuestions.filter((q) => q.id.startsWith('name-that-line-'));
  const textQuestions = earthQuestions.filter((q) => !q.id.startsWith('name-that-line-'));
  QuizUI.mount(textQuestions);
  QuizUI.mountGroup({
    questions: lineQuizQuestions,
    listElementId: 'line-quiz-list',
    summaryElementId: 'line-quiz-summary',
    label: 'Picture quiz: name that line',
  });
})();
