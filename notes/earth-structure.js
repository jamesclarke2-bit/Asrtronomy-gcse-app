(function () {
  const YEAR = 2026;
  const CURRICULUM_UNITS = ['u2.1', 'u2.9', 'u2.15', 'u2.16', 'u2.28'];
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

  const dateSlider = document.getElementById('date-slider');
  const dateLabel = document.getElementById('date-label');
  const orbitCanvas = document.getElementById('orbit');

  function dayOfYearToUTCDate(year, dayIndex) {
    const d = new Date(Date.UTC(year, 0, 1));
    d.setUTCDate(d.getUTCDate() + dayIndex);
    return d;
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  }

  function render() {
    const dayIndex = Number(dateSlider.value);
    dateLabel.textContent = formatDate(dayOfYearToUTCDate(YEAR, dayIndex));
    OrbitPanel.draw(orbitCanvas, dayIndex);
  }

  dateSlider.addEventListener('input', render);

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
  // are inlined in the same document, and showLabels off so none of its
  // reference lines render a label at all.
  function drawGlobe(svg = document.getElementById('globe'), wrap = document.getElementById('globe-wrap'), idPrefix = '', showLabels = true) {
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
      const visible = { x1: west.x, y1: west.y, x2: east.x, y2: east.y, stroke: line.color, 'stroke-width': 3, 'stroke-linecap': 'round' };
      if (line.dash) visible['stroke-dasharray'] = line.dash;
      svgEl('line', visible, group);

      if (showLabels) {
        svgEl('line', { x1: east.x + 6, y1: east.y, x2: LABEL_X - 78, y2: east.y }, leaders);
        addLabel(wrap, LABEL_X, east.y, line.name, line.value);
      }
    });

    const meridian = makeToggle(svg, 'primeMeridian', 'Prime Meridian');
    svgEl('path', { d: meridianPath(0), fill: 'none', stroke: 'transparent', 'stroke-width': 18, 'pointer-events': 'stroke' }, meridian);
    svgEl('path', { d: meridianPath(0), fill: 'none', stroke: PRIME_MERIDIAN_COLOR, 'stroke-width': 3 }, meridian);
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
      svgEl('circle', { cx: p.x, cy: p.y, r: 6, fill: '#1f2d3d', stroke: '#fff', 'stroke-width': 1.5 }, group);
      if (showLabels) addLabel(wrap, CX, pole.labelY, pole.name, pole.value);
    });
  }

  // A CSS filter/drop-shadow doesn't render reliably on SVG shapes in
  // Safari/WebKit, so the highlight here is real SVG attributes, added
  // as one fresh marker shape on top of the globe — never a restyle of
  // the feature's own line or dot — in the site's own accent blue with
  // a thin white stroke underneath for contrast, same approach and same
  // colours as notes/moon-structure.html's own quiz markers. The rest
  // of the globe stays at normal brightness (no dimming); the marker
  // alone shows which feature is being asked about.
  const QUIZ_MARKER_COLOR = '#2a6bd6';
  const QUIZ_MARKER_UNDERLAY_COLOR = '#ffffff';
  const QUIZ_MARKER_STROKE_WIDTH = 4;
  const QUIZ_MARKER_UNDERLAY_STROKE_WIDTH = 8;
  const QUIZ_MARKER_POLE_RADIUS = 16;

  function drawQuizMarkerShape(tag, attrs, parent) {
    svgEl(tag, { ...attrs, fill: 'none', stroke: QUIZ_MARKER_UNDERLAY_COLOR, 'stroke-width': QUIZ_MARKER_UNDERLAY_STROKE_WIDTH }, parent);
    svgEl(tag, { ...attrs, fill: 'none', stroke: QUIZ_MARKER_COLOR, 'stroke-width': QUIZ_MARKER_STROKE_WIDTH }, parent);
  }

  function applyLineQuizHighlight(svg, highlightTerm) {
    const region = svg.querySelector(`.diagram-region[data-term="${highlightTerm}"]`);
    if (!region) return;
    region.classList.add('diagram-feature-highlight');

    const marker = svgEl('g', { class: 'quiz-feature-marker', 'pointer-events': 'none' }, svg);

    if (highlightTerm === 'northPole' || highlightTerm === 'southPole') {
      const p = project(highlightTerm === 'northPole' ? 90 : -90, CENTRE_LONGITUDE);
      drawQuizMarkerShape('circle', { cx: p.x, cy: p.y, r: QUIZ_MARKER_POLE_RADIUS }, marker);
      return;
    }

    if (highlightTerm === 'primeMeridian') {
      drawQuizMarkerShape('path', { d: meridianPath(0), 'stroke-linecap': 'round' }, marker);
      return;
    }

    const parallel = NAMED_PARALLELS.find((line) => line.term === highlightTerm);
    if (parallel) {
      const west = project(parallel.lat, CENTRE_LONGITUDE - 90);
      const east = project(parallel.lat, CENTRE_LONGITUDE + 90);
      drawQuizMarkerShape('line', { x1: west.x, y1: west.y, x2: east.x, y2: east.y, 'stroke-linecap': 'round' }, marker);
    }
  }

  // A small, standalone copy of the globe above for a "name that line"
  // practice question: redraws the same globe (drawGlobe, unchanged
  // geometry) into a fresh svg/wrap pair with showLabels off (so none of
  // the eight reference features render a label at all — stronger than
  // the Moon map's .labels-hidden CSS toggle, since there's no existing
  // "hide labels" button on this page to reuse the class from), and
  // highlights just the one feature being asked about.
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

    drawGlobe(svg, wrap, `quiz-${highlightTerm}-`, false);
    applyLineQuizHighlight(svg, highlightTerm);

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

  // Mirrors the original div-based bar chart one-for-one: how far each
  // part of the spectrum penetrates (bar height) and whether it's open,
  // partly absorbed, or blocked (colour) before reaching the ground.
  const TRANSMISSION_BANDS = [
    { name: 'Gamma ray', heightPct: 10, category: 'blocked' },
    { name: 'X-ray', heightPct: 16, category: 'blocked' },
    { name: 'Ultraviolet', heightPct: 32, category: 'blocked' },
    { name: 'Optical', heightPct: 100, category: 'open' },
    { name: 'Infrared', heightPct: 60, category: 'partial' },
    { name: 'Radio', heightPct: 100, category: 'open' },
  ];
  const TRANSMISSION_COLORS = { open: '#2a6bd6', partial: '#e8a23a', blocked: '#c0392b' };

  function drawTransmissionChart() {
    const svg = document.getElementById('transmission-chart');
    if (!svg) return;
    const wellHeight = 160;
    const wellY = 30;
    const groundY = wellY + wellHeight;
    const bandWidth = 80;
    const gap = 20;
    const startX = 30;
    const lastBandRight = startX + (TRANSMISSION_BANDS.length - 1) * (bandWidth + gap) + bandWidth;

    svgEl('line', { x1: startX - 10, y1: groundY, x2: lastBandRight + 10, y2: groundY, stroke: '#4a6741', 'stroke-width': 3 }, svg);
    svgEl('text', {
      x: (startX + lastBandRight) / 2, y: groundY + 22,
      'font-size': 13, fill: '#4a6741', 'font-weight': 600, 'text-anchor': 'middle',
    }, svg).textContent = "Earth's surface";

    TRANSMISSION_BANDS.forEach((band, i) => {
      const x = startX + i * (bandWidth + gap);
      const barHeight = (band.heightPct / 100) * wellHeight;
      const barY = groundY - barHeight;
      svgEl('rect', { x, y: wellY, width: bandWidth, height: wellHeight, fill: '#eef1f4', rx: 4 }, svg);
      svgEl('rect', { x, y: barY, width: bandWidth, height: barHeight, fill: TRANSMISSION_COLORS[band.category] }, svg);
      const label = svgEl('text', {
        x: x + bandWidth / 2, y: groundY + 40, 'font-size': 12, fill: '#444', 'text-anchor': 'middle',
      }, svg);
      label.textContent = band.name;
    });
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

  drawGlobe();
  drawEarthLayers();
  drawCompositionBar();
  drawAtmosphereLadder();
  drawTransmissionChart();
  render();
  renderCoverage();
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
