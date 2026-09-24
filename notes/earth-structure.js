(function () {
  const YEAR = 2026;
  const CURRICULUM_UNITS = ['u2.1', 'u2.9', 'u2.15', 'u2.16'];
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

  function drawGlobe() {
    const svg = document.getElementById('globe');
    const wrap = document.getElementById('globe-wrap');

    const defs = svgEl('defs', {}, svg);
    const shade = svgEl('radialGradient', { id: 'globe-shade', cx: '42%', cy: '40%', r: '65%' }, defs);
    svgEl('stop', { offset: '0%', 'stop-color': '#e3f0fa' }, shade);
    svgEl('stop', { offset: '100%', 'stop-color': '#a9cbe6' }, shade);

    // Rotation axis, poking out past both poles; the globe covers the middle.
    svgEl('line', {
      x1: CX, y1: CY - R - 24, x2: CX, y2: CY + R + 24,
      stroke: '#555', 'stroke-width': 1.5, 'stroke-dasharray': '4 3',
    }, svg);
    svgEl('circle', { cx: CX, cy: CY, r: R, fill: 'url(#globe-shade)', stroke: '#5b7c99', 'stroke-width': 2 }, svg);

    // Faint unnamed meridians every 30°, on the visible half only.
    const graticule = svgEl('g', { fill: 'none', stroke: '#7d9bb5', 'stroke-width': 1, 'stroke-opacity': 0.6 }, svg);
    for (let lon = CENTRE_LONGITUDE - 60; lon <= CENTRE_LONGITUDE + 60; lon += 30) {
      if (lon !== 0) svgEl('path', { d: meridianPath(lon) }, graticule);
    }

    const leaders = svgEl('g', { stroke: '#8a97a5', 'stroke-width': 1, 'stroke-dasharray': '3 2', 'pointer-events': 'none' }, svg);

    NAMED_PARALLELS.forEach((line) => {
      const west = project(line.lat, CENTRE_LONGITUDE - 90);
      const east = project(line.lat, CENTRE_LONGITUDE + 90);
      const group = makeToggle(svg, line.term, line.name);
      svgEl('line', { x1: west.x, y1: west.y, x2: east.x, y2: east.y, stroke: 'transparent', 'stroke-width': 18, 'pointer-events': 'stroke' }, group);
      const visible = { x1: west.x, y1: west.y, x2: east.x, y2: east.y, stroke: line.color, 'stroke-width': 3, 'stroke-linecap': 'round' };
      if (line.dash) visible['stroke-dasharray'] = line.dash;
      svgEl('line', visible, group);

      svgEl('line', { x1: east.x + 6, y1: east.y, x2: LABEL_X - 78, y2: east.y }, leaders);
      addLabel(wrap, LABEL_X, east.y, line.name, line.value);
    });

    const meridian = makeToggle(svg, 'primeMeridian', 'Prime Meridian');
    svgEl('path', { d: meridianPath(0), fill: 'none', stroke: 'transparent', 'stroke-width': 18, 'pointer-events': 'stroke' }, meridian);
    svgEl('path', { d: meridianPath(0), fill: 'none', stroke: PRIME_MERIDIAN_COLOR, 'stroke-width': 3 }, meridian);
    const meridianPoint = project(-50, 0);
    const meridianLabel = { x: 95, y: 470 };
    svgEl('line', { x1: meridianPoint.x - 4, y1: meridianPoint.y + 4, x2: meridianLabel.x + 30, y2: meridianLabel.y - 22 }, leaders);
    addLabel(wrap, meridianLabel.x, meridianLabel.y, 'Prime Meridian', '0° longitude');

    [
      { term: 'northPole', name: 'North Pole', value: '90°N', lat: 90, labelY: 24 },
      { term: 'southPole', name: 'South Pole', value: '90°S', lat: -90, labelY: 496 },
    ].forEach((pole) => {
      const p = project(pole.lat, CENTRE_LONGITUDE);
      const group = makeToggle(svg, pole.term, pole.name);
      svgEl('circle', { cx: p.x, cy: p.y, r: 16, fill: 'transparent', 'pointer-events': 'all' }, group);
      svgEl('circle', { cx: p.x, cy: p.y, r: 6, fill: '#1f2d3d', stroke: '#fff', 'stroke-width': 1.5 }, group);
      addLabel(wrap, CX, pole.labelY, pole.name, pole.value);
    });
  }

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    oblateSpheroid:
      "Oblate spheroid: a sphere very slightly flattened at the poles and bulging at the equator, caused by a planet's own rotation. Earth's equatorial diameter is only about 43 km more than its polar diameter.",
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
  render();
  renderCoverage();
  Glossary.init(GLOSSARY);
})();
