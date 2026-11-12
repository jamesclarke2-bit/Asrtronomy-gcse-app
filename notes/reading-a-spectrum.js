(function () {
  const S = window.Spectra;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const CURRICULUM_UNITS = ['u4.6', 'u4.7'];
  const PANEL_FILL = '#0f1830';
  const STRIP_EMPTY = '#1b2438';
  const INK = '#eef3fb';
  const MUTED = '#9aa7bd';

  const GLOSSARY = {
    spectrograph:
      'A spectrograph: an instrument fitted to a telescope that spreads light out into its separate wavelengths and records how much light arrives at each one.',
    spectrum:
      'A spectrum: light spread out in order of wavelength, from violet to red, shown either as a coloured strip or as a graph of intensity against wavelength.',
    slit:
      'The slit: a narrow opening that lets only a thin strip of light through. A wide opening would smear each wavelength into a broad band and blur the lines together.',
    grating:
      'A diffraction grating: a surface ruled with thousands of very fine, evenly spaced lines. Like a prism, it spreads light out by wavelength; most modern spectrographs use one.',
    wavelength:
      'Wavelength: the distance from one wave crest to the next. For visible light it sets the colour: violet has the shortest wavelength, red the longest.',
    nanometre: 'A nanometre (nm): one billionth of a metre (10⁻⁹ m).',
    whyLines:
      "Why only particular wavelengths: the electrons in an atom can only have certain fixed energies. A gas absorbs light only when a photon's energy exactly matches a jump between two of them, and each jump matches one wavelength. Each element has its own set of energies, so its own set of lines; a glowing thin gas gives out light at those same wavelengths as its electrons drop back down. First draft, to be checked by the teacher.",
    radialVelocity:
      "Radial velocity: the part of a star's motion directly towards or away from us, along our line of sight. Motion across the sky does not shift the lines.",
    redshift:
      'Redshift: spectral lines moved to longer wavelengths, towards the red end, because the source is moving away from us.',
    blueshift:
      'Blueshift: spectral lines moved to shorter wavelengths, towards the blue end, because the source is moving towards us.',
    pixel:
      'A pixel: one tiny light-sensitive element of a digital sensor. A sensor holds millions of them in a grid, each recording its own small part of the image.',
    photon: 'A photon: a single tiny packet of light energy.',
  };

  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => el.setAttribute(key, value));
    if (parent) parent.appendChild(el);
    return el;
  }

  function clearDiagram(svg, wrap) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    wrap.querySelectorAll('.labelled-diagram-label, .diagram-label').forEach((el) => el.remove());
  }

  function viewBoxSize(svg) {
    const [, , w, h] = svg.getAttribute('viewBox').split(/\s+/).map(Number);
    return { w, h };
  }

  // Labels are HTML, positioned by percentage of the svg's own viewBox
  // so they stay put as the diagram scales (see notes/TEMPLATE.md).
  function addLabel(svg, wrap, text, x, y, extraClass) {
    const { w, h } = viewBoxSize(svg);
    const label = document.createElement('span');
    label.className = `diagram-label${extraClass ? ` ${extraClass}` : ''}`;
    label.style.left = `${(x / w) * 100}%`;
    label.style.top = `${(y / h) * 100}%`;
    label.textContent = text;
    wrap.appendChild(label);
    return label;
  }

  function panel(svg) {
    const { w, h } = viewBoxSize(svg);
    svgEl('rect', { x: 0, y: 0, width: w, height: h, rx: 10, fill: PANEL_FILL }, svg);
  }

  function rgbString([r, g, b], scale = 1) {
    return `rgb(${Math.round(r * scale)}, ${Math.round(g * scale)}, ${Math.round(b * scale)})`;
  }

  // The strip keeps the violet end bright enough that a dark line there
  // still shows against it.
  function stripColour(nm) {
    const [r, g, b] = S.wavelengthToRgb(nm);
    const lift = 70;
    return [r, g, b].map((c) => lift + ((255 - lift) * c) / 255);
  }

  function makeScale(x0, x1, minNm = S.RANGE_NM.min, maxNm = S.RANGE_NM.max) {
    return (nm) => x0 + ((nm - minNm) / (maxNm - minNm)) * (x1 - x0);
  }

  // A coloured strip for a continuous, absorption or emission spectrum,
  // with a small white tick under each line so the line positions never
  // rely on colour or darkness alone.
  function drawStrip(svg, { x0, x1, y, h, type, lines, ticks = true }) {
    const xFor = makeScale(x0, x1);
    svgEl('rect', { x: x0, y, width: x1 - x0, height: h, fill: type === 'emission' || type === 'none' ? '#05070d' : STRIP_EMPTY }, svg);
    if (type === 'none') return;
    const step = 1;
    for (let nm = S.RANGE_NM.min; nm < S.RANGE_NM.max; nm += step) {
      const centre = nm + step / 2;
      const brightness = S.intensityAt(centre, { type, lines, widthNm: 0.9 });
      if (brightness < 0.02) continue;
      svgEl('rect', {
        x: xFor(nm).toFixed(2),
        y,
        width: (xFor(nm + step) - xFor(nm) + 0.6).toFixed(2),
        height: h,
        fill: rgbString(stripColour(centre), brightness),
      }, svg);
    }
    if (ticks && type !== 'continuous') {
      lines.forEach((line) => {
        const x = xFor(line.nm);
        svgEl('line', { x1: x, x2: x, y1: y + h + 2, y2: y + h + 4 + 8 * line.depth, stroke: INK, 'stroke-width': 1.5 }, svg);
      });
    }
  }

  function drawWavelengthAxis(svg, wrap, { x0, x1, y, ticks = [400, 500, 600, 700], minNm, maxNm, title = true }) {
    const xFor = makeScale(x0, x1, minNm, maxNm);
    svgEl('line', { x1: x0, x2: x1, y1: y, y2: y, stroke: MUTED, 'stroke-width': 1 }, svg);
    ticks.forEach((nm) => {
      const x = xFor(nm);
      svgEl('line', { x1: x, x2: x, y1: y, y2: y + 5, stroke: MUTED, 'stroke-width': 1 }, svg);
      addLabel(svg, wrap, String(nm), x, y + 14, 'diagram-label--tick');
    });
    if (title) addLabel(svg, wrap, 'Wavelength (nm)', (x0 + x1) / 2, y + 40, 'diagram-label--tick');
  }

  // Intensity against wavelength, as a single path.
  function drawGraph(svg, { x0, x1, yTop, yBottom, sample, minNm = S.RANGE_NM.min, maxNm = S.RANGE_NM.max, stroke = '#ffe08a' }) {
    const xFor = makeScale(x0, x1, minNm, maxNm);
    svgEl('line', { x1: x0, x2: x0, y1: yTop - 6, y2: yBottom, stroke: MUTED, 'stroke-width': 1 }, svg);
    const points = [];
    for (let nm = minNm; nm <= maxNm; nm += 0.5) {
      const v = Math.max(0, Math.min(1, sample(nm)));
      points.push(`${xFor(nm).toFixed(1)},${(yBottom - v * (yBottom - yTop)).toFixed(1)}`);
    }
    svgEl('polyline', { points: points.join(' '), fill: 'none', stroke, 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg);
    return (nm) => ({ x: xFor(nm), y: yBottom - Math.max(0, Math.min(1, sample(nm))) * (yBottom - yTop) });
  }

  function continuumFor(temperatureK, minNm = S.RANGE_NM.min, maxNm = S.RANGE_NM.max) {
    const curve = S.blackbodyCurve(temperatureK, minNm, maxNm, maxNm - minNm);
    return (nm) => {
      const i = Math.max(0, Math.min(curve.length - 1, Math.round(nm - minNm)));
      return 0.15 + 0.8 * curve[i].value;
    };
  }

  const SUN_STAR = S.EXAMPLE_STARS.find((s) => s.id === 'sun');
  const SUN_LINES = S.linesForStrengths(SUN_STAR.strengths);

  // ------------------------------------------------------------------
  // 1. Spectrograph schematic
  // ------------------------------------------------------------------

  function drawSpectrograph() {
    const svg = document.getElementById('spectrograph-diagram');
    const wrap = document.getElementById('spectrograph-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);

    // A few background stars, then the source star itself.
    [[30, 30], [120, 210], [250, 40], [430, 225], [610, 30], [470, 20]].forEach(([x, y]) => {
      svgEl('circle', { cx: x, cy: y, r: 1.3, fill: INK, opacity: 0.6 }, svg);
    });
    svgEl('circle', { cx: 52, cy: 125, r: 26, fill: '#fff2c0', opacity: 0.18 }, svg);
    svgEl('circle', { cx: 52, cy: 125, r: 17, fill: '#fff2c0', opacity: 0.35 }, svg);
    svgEl('circle', { cx: 52, cy: 125, r: 10, fill: '#fff7dc' }, svg);

    svgEl('polygon', { points: '64,112 170,121 170,129 64,138', fill: '#fff7dc', opacity: 0.45 }, svg);

    // Slit
    svgEl('rect', { x: 170, y: 70, width: 8, height: 50, fill: MUTED }, svg);
    svgEl('rect', { x: 170, y: 130, width: 8, height: 50, fill: MUTED }, svg);

    svgEl('polygon', { points: '178,121 296,123 298,128 178,129', fill: '#fff7dc', opacity: 0.6 }, svg);

    // Prism
    svgEl('polygon', { points: '275,182 322,86 369,182', fill: 'rgba(170, 200, 255, 0.22)', stroke: '#cfe0ff', 'stroke-width': 2 }, svg);

    // Fan of colours onto the detector: violet bends most, so it lands lowest.
    const detectorTop = 60;
    const detectorBottom = 196;
    const yFor = (nm) => detectorTop + ((S.RANGE_NM.max - nm) / (S.RANGE_NM.max - S.RANGE_NM.min)) * (detectorBottom - detectorTop);
    const isLine = (nm) => SUN_LINES.some((line) => Math.abs(line.nm - nm) < 1.6);
    for (let nm = S.RANGE_NM.min; nm <= S.RANGE_NM.max; nm += 4) {
      if (isLine(nm)) continue;
      svgEl('line', { x1: 345, y1: 130, x2: 540, y2: yFor(nm), stroke: rgbString(stripColour(nm)), 'stroke-width': 1.4, opacity: 0.55 }, svg);
    }

    // Detector, with the recorded strip running vertically.
    svgEl('rect', { x: 536, y: detectorTop - 6, width: 40, height: detectorBottom - detectorTop + 12, rx: 4, fill: '#2a3550', stroke: '#cfd8e6', 'stroke-width': 1.5 }, svg);
    for (let nm = S.RANGE_NM.min; nm < S.RANGE_NM.max; nm += 1) {
      const v = S.intensityAt(nm + 0.5, { type: 'absorption', lines: SUN_LINES, widthNm: 0.9 });
      svgEl('rect', { x: 542, y: yFor(nm + 1).toFixed(2), width: 28, height: (yFor(nm) - yFor(nm + 1) + 0.6).toFixed(2), fill: rgbString(stripColour(nm + 0.5), v) }, svg);
    }

    addLabel(svg, wrap, 'Starlight', 52, 165, 'diagram-label--tick');
    addLabel(svg, wrap, 'Slit', 174, 56, 'diagram-label--tick');
    addLabel(svg, wrap, 'Prism or grating', 322, 204, 'diagram-label--tick');
    addLabel(svg, wrap, 'Detector', 556, 230, 'diagram-label--tick');
    addLabel(svg, wrap, 'red', 528, detectorTop + 2, 'diagram-label--left diagram-label--tick');
    addLabel(svg, wrap, 'violet', 528, detectorBottom - 14, 'diagram-label--left diagram-label--tick');
  }

  // ------------------------------------------------------------------
  // 1b. Two views of the same spectrum
  // ------------------------------------------------------------------

  function drawTwoViews() {
    const svg = document.getElementById('two-views-diagram');
    const wrap = document.getElementById('two-views-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const x0 = 60;
    const x1 = 620;
    const xFor = makeScale(x0, x1);
    const continuum = continuumFor(SUN_STAR.temperatureK);

    addLabel(svg, wrap, 'As a coloured strip', x0, 16, 'diagram-label--right diagram-label--tick');
    drawStrip(svg, { x0, x1, y: 28, h: 46, type: 'absorption', lines: SUN_LINES });

    addLabel(svg, wrap, 'As a graph: intensity against wavelength', x0, 112, 'diagram-label--right diagram-label--tick');
    const at = drawGraph(svg, {
      x0, x1, yTop: 124, yBottom: 226,
      sample: (nm) => S.intensityAt(nm, { type: 'absorption', lines: SUN_LINES, continuum, widthNm: 0.9 }),
    });
    SUN_LINES.forEach((line) => {
      const dip = at(line.nm);
      svgEl('line', { x1: xFor(line.nm), x2: dip.x, y1: 86, y2: dip.y, stroke: INK, 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.5 }, svg);
    });
    drawWavelengthAxis(svg, wrap, { x0, x1, y: 230 });
  }

  // ------------------------------------------------------------------
  // 2. Three kinds of spectrum
  // ------------------------------------------------------------------

  const CLOUD_LINES = S.ELEMENTS.hydrogen.lines.map((nm) => ({ nm, depth: 0.85 }));
  const TYPE_TEXT = {
    continuous: 'Continuous spectrum: every wavelength, no lines',
    absorption: 'Absorption spectrum: dark lines where the cool hydrogen absorbs',
    emission: 'Emission spectrum: bright hydrogen lines on a dark background',
    none: 'No spectrum: no light reaches the spectrograph',
  };

  function kirchhoffState() {
    return {
      sourceOn: document.getElementById('kirchhoff-source').checked,
      cloudInFront: document.getElementById('kirchhoff-cloud').checked,
      view: document.getElementById('kirchhoff-view').value,
    };
  }

  function drawSpectrographIcon(svg, x, y, rotate) {
    const g = svgEl('g', { transform: `translate(${x} ${y}) rotate(${rotate})` }, svg);
    svgEl('rect', { x: -22, y: -14, width: 44, height: 28, rx: 4, fill: '#2a3550', stroke: '#cfd8e6', 'stroke-width': 1.5 }, g);
    svgEl('rect', { x: -26, y: -4, width: 6, height: 8, fill: '#cfd8e6' }, g);
    return g;
  }

  function drawKirchhoffSetup(state) {
    const svg = document.getElementById('kirchhoff-setup-diagram');
    const wrap = document.getElementById('kirchhoff-setup-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const sourceX = 90;
    const axisY = 130;
    const cloudX = 320;

    if (state.sourceOn) {
      svgEl('polygon', { points: `${sourceX + 24},${axisY - 18} 560,${axisY - 6} 560,${axisY + 6} ${sourceX + 24},${axisY + 18}`, fill: '#fff2c0', opacity: 0.25 }, svg);
      svgEl('circle', { cx: sourceX, cy: axisY, r: 40, fill: '#ffd27a', opacity: 0.2 }, svg);
      svgEl('circle', { cx: sourceX, cy: axisY, r: 26, fill: '#ffe2a0' }, svg);
      addLabel(svg, wrap, 'Hot, dense source (on)', 24, axisY - 62, 'diagram-label--right diagram-label--tick');
    } else {
      svgEl('circle', { cx: sourceX, cy: axisY, r: 26, fill: '#3a4357', stroke: MUTED, 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, svg);
      addLabel(svg, wrap, 'Source switched off', 24, axisY - 62, 'diagram-label--right diagram-label--tick');
    }

    if (state.cloudInFront) {
      const glowing = state.sourceOn;
      svgEl('ellipse', { cx: cloudX, cy: axisY, rx: 62, ry: 44, fill: 'rgba(140, 190, 255, 0.22)', stroke: '#9cc4ff', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, svg);
      if (glowing && state.view === 'side') {
        [-1, 1].forEach((dx) => svgEl('line', { x1: cloudX + dx * 12, x2: cloudX + dx * 12, y1: axisY - 46, y2: axisY - 74, stroke: '#9cc4ff', 'stroke-width': 2, 'stroke-dasharray': '4 3' }, svg));
      }
      addLabel(svg, wrap, 'Cooler hydrogen gas', cloudX, axisY + 58, 'diagram-label--tick');
    }

    if (state.view === 'through') {
      drawSpectrographIcon(svg, 585, axisY, 0);
      addLabel(svg, wrap, 'Spectrograph', 616, axisY + 34, 'diagram-label--left diagram-label--tick');
      svgEl('line', { x1: 470, x2: 555, y1: axisY, y2: axisY, stroke: INK, 'stroke-width': 1, 'stroke-dasharray': '2 4', opacity: 0.7 }, svg);
    } else {
      drawSpectrographIcon(svg, cloudX, 30, 90);
      addLabel(svg, wrap, 'Spectrograph (side view)', cloudX + 40, 30, 'diagram-label--right diagram-label--tick');
    }
  }

  function drawKirchhoffResult(type) {
    const svg = document.getElementById('kirchhoff-result-diagram');
    const wrap = document.getElementById('kirchhoff-result-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const x0 = 60;
    const x1 = 620;
    const continuum = continuumFor(6000);
    const titles = { continuous: 'Continuous', absorption: 'Absorption', emission: 'Emission', none: 'Nothing recorded' };
    addLabel(svg, wrap, `Recorded: ${titles[type]}`, x0, 16, 'diagram-label--right diagram-label--tick');
    drawStrip(svg, { x0, x1, y: 28, h: 40, type, lines: CLOUD_LINES });
    drawGraph(svg, {
      x0, x1, yTop: 92, yBottom: 164,
      sample: (nm) => S.intensityAt(nm, { type, lines: CLOUD_LINES, continuum, widthNm: 0.9 }),
    });
    drawWavelengthAxis(svg, wrap, { x0, x1, y: 168 });
  }

  function updateKirchhoff() {
    const state = kirchhoffState();
    const type = S.spectrumType(state);
    drawKirchhoffSetup(state);
    drawKirchhoffResult(type);
    const readout = document.getElementById('kirchhoff-result-readout');
    readout.textContent = TYPE_TEXT[type];
    readout.dataset.type = type;
  }

  function drawStarLayers() {
    const svg = document.getElementById('star-layers-diagram');
    const wrap = document.getElementById('star-layers-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const defs = svgEl('defs', {}, svg);
    const grad = svgEl('radialGradient', { id: 'star-interior-gradient' }, defs);
    svgEl('stop', { offset: '0%', 'stop-color': '#fff6d8' }, grad);
    svgEl('stop', { offset: '100%', 'stop-color': '#ffb347' }, grad);
    const clip = svgEl('clipPath', { id: 'star-layers-clip' }, defs);
    svgEl('rect', { x: 0, y: 0, width: 640, height: 200, rx: 10 }, clip);
    const g = svgEl('g', { 'clip-path': 'url(#star-layers-clip)' }, svg);
    svgEl('circle', { cx: 20, cy: 100, r: 150, fill: '#e98a3a', opacity: 0.45 }, g);
    svgEl('circle', { cx: 20, cy: 100, r: 128, fill: 'url(#star-interior-gradient)' }, g);

    svgEl('line', { x1: 175, x2: 420, y1: 100, y2: 100, stroke: '#fff2c0', 'stroke-width': 3 }, svg);
    svgEl('polygon', { points: '420,93 434,100 420,107', fill: '#fff2c0' }, svg);

    drawStrip(svg, { x0: 450, x1: 625, y: 84, h: 32, type: 'absorption', lines: SUN_LINES, ticks: false });

    addLabel(svg, wrap, 'Hot, dense inside: all wavelengths', 228, 36, 'diagram-label--right diagram-label--tick');
    svgEl('line', { x1: 226, x2: 110, y1: 36, y2: 60, stroke: INK, 'stroke-width': 1 }, svg);
    addLabel(svg, wrap, 'Cooler, thinner outer layer absorbs some', 228, 168, 'diagram-label--right diagram-label--tick');
    svgEl('line', { x1: 226, x2: 158, y1: 168, y2: 152, stroke: INK, 'stroke-width': 1 }, svg);
    addLabel(svg, wrap, 'We see dark lines', 537, 136, 'diagram-label--tick');
  }

  // ------------------------------------------------------------------
  // 3. Composition puzzle
  // ------------------------------------------------------------------

  const PUZZLE_ROWS = { starY: 24, rowH: 34, firstRefY: 92, gap: 54, x0: 92, x1: 610 };

  function puzzleStar() {
    const id = document.getElementById('puzzle-star').value;
    return S.PUZZLE_STARS.find((s) => s.id === id);
  }

  function drawComposition() {
    const svg = document.getElementById('composition-diagram');
    const wrap = document.getElementById('composition-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const { starY, rowH, firstRefY, gap, x0, x1 } = PUZZLE_ROWS;
    const xFor = makeScale(x0, x1);
    const star = puzzleStar();
    const starLines = S.linesFor(star.elements).map((nm) => ({ nm, depth: 0.85 }));

    drawStrip(svg, { x0, x1, y: starY, h: rowH, type: 'absorption', lines: starLines });
    addLabel(svg, wrap, star.label, 46, starY + rowH / 2, 'diagram-label--tick diagram-label--strong');

    S.ELEMENT_KEYS.forEach((key, i) => {
      const y = firstRefY + i * gap;
      svgEl('rect', { x: x0, y, width: x1 - x0, height: rowH, fill: '#05070d', stroke: '#2a3550' }, svg);
      S.ELEMENTS[key].lines.forEach((nm) => {
        svgEl('rect', { x: xFor(nm) - 1.25, y: y + 3, width: 2.5, height: rowH - 6, fill: INK }, svg);
      });
      addLabel(svg, wrap, S.ELEMENTS[key].symbol, 46, y + rowH / 2, 'diagram-label--tick diagram-label--strong');
    });

    if (document.getElementById('puzzle-guides').checked) {
      const bottom = firstRefY + 3 * gap + rowH;
      starLines.forEach((line) => {
        svgEl('line', { class: 'puzzle-guide', x1: xFor(line.nm), x2: xFor(line.nm), y1: starY + rowH + 12, y2: bottom, stroke: '#ffe08a', 'stroke-width': 1, 'stroke-dasharray': '4 3' }, svg);
      });
    }
    drawWavelengthAxis(svg, wrap, { x0, x1, y: 300, title: false });
  }

  function listWithAnd(items) {
    if (items.length <= 1) return items.join('');
    return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
  }

  function checkPuzzle() {
    const star = puzzleStar();
    const observed = S.linesFor(star.elements);
    const results = S.matchElements(observed);
    const chosen = new Set([...document.querySelectorAll('.puzzle-element:checked')].map((el) => el.value));
    const present = results.filter((r) => r.present).map((r) => r.key);
    const correct = present.length === chosen.size && present.every((key) => chosen.has(key));
    const names = (keys) => keys.map((key) => S.ELEMENTS[key].name.toLowerCase());
    const absent = results.filter((r) => !r.present).map((r) => `${S.ELEMENTS[r.key].name.toLowerCase()} (none of ${r.missing.join(', ')} nm all there)`);
    const feedback = document.getElementById('puzzle-feedback');
    feedback.textContent = `${correct ? 'Correct.' : 'Not quite.'} ${star.label} contains ${listWithAnd(names(present))}: every one of their lines appears. Not present: ${listWithAnd(absent)}.`;
    feedback.dataset.correct = String(correct);
  }

  function fillReferenceTable() {
    const body = document.getElementById('reference-table-body');
    body.innerHTML = '';
    S.ELEMENT_KEYS.forEach((key) => {
      const tr = document.createElement('tr');
      [`${S.ELEMENTS[key].name} (${S.ELEMENTS[key].symbol})`, S.ELEMENTS[key].lines.map((nm) => nm.toFixed(1)).join(', ')].forEach((text) => {
        const td = document.createElement('td');
        td.textContent = text;
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
  }

  // ------------------------------------------------------------------
  // 4. Temperature
  // ------------------------------------------------------------------

  const CURVE_RANGE = { min: 300, max: 1000 };

  function bandName(nm) {
    if (nm < 380) return 'ultraviolet, beyond the violet end';
    if (nm < 450) return 'violet';
    if (nm < 495) return 'blue';
    if (nm < 570) return 'green';
    if (nm < 590) return 'yellow';
    if (nm < 620) return 'orange';
    if (nm <= 700) return 'red';
    return 'infrared, beyond the red end';
  }

  function temperatureStar() {
    const id = document.getElementById('temperature-star').value;
    return S.EXAMPLE_STARS.find((s) => s.id === id);
  }

  function drawTemperatureCurve(star) {
    const svg = document.getElementById('temperature-curve-diagram');
    const wrap = document.getElementById('temperature-curve-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    // Star colours are very pale in reality; push them away from white so
    // the difference between examples is visible (the label says it too).
    const colour = S.starRgb(star.temperatureK).map((c) => Math.max(0, 255 - (255 - c) * 1.5));
    svgEl('circle', { cx: 80, cy: 94, r: 50, fill: rgbString(colour), opacity: 0.25 }, svg);
    svgEl('circle', { cx: 80, cy: 94, r: 38, fill: rgbString(colour), class: 'temperature-star-disc' }, svg);
    addLabel(svg, wrap, `Looks ${S.starColourName(star.temperatureK)}`, 14, 160, 'diagram-label--right diagram-label--tick');

    const x0 = 180;
    const x1 = 620;
    const yTop = 30;
    const yBottom = 186;
    const xFor = makeScale(x0, x1, CURVE_RANGE.min, CURVE_RANGE.max);
    for (let nm = S.RANGE_NM.min; nm < S.RANGE_NM.max; nm += 2) {
      svgEl('rect', { x: xFor(nm), y: yBottom + 28, width: xFor(nm + 2) - xFor(nm) + 0.5, height: 7, fill: rgbString(stripColour(nm + 1)) }, svg);
    }
    const curve = S.blackbodyCurve(star.temperatureK, CURVE_RANGE.min, CURVE_RANGE.max, 700);
    drawGraph(svg, {
      x0, x1, yTop, yBottom, minNm: CURVE_RANGE.min, maxNm: CURVE_RANGE.max,
      sample: (nm) => curve[Math.round(nm - CURVE_RANGE.min)].value,
    });
    const peak = S.peakWavelengthNm(star.temperatureK);
    if (peak >= CURVE_RANGE.min) {
      const x = xFor(peak);
      svgEl('line', { class: 'temperature-peak-marker', x1: x, x2: x, y1: yTop - 6, y2: yBottom, stroke: INK, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, svg);
      addLabel(svg, wrap, 'peak', x, yTop - 14, 'diagram-label--tick');
    } else {
      svgEl('polygon', { class: 'temperature-peak-marker', points: `${x0 + 4},${yTop + 8} ${x0 + 16},${yTop + 2} ${x0 + 16},${yTop + 14}`, fill: INK }, svg);
      addLabel(svg, wrap, 'peak: off to the left (ultraviolet)', x0 + 22, yTop + 8, 'diagram-label--right diagram-label--tick');
    }
    drawWavelengthAxis(svg, wrap, { x0, x1, y: yBottom, ticks: [300, 500, 700, 900], minNm: CURVE_RANGE.min, maxNm: CURVE_RANGE.max, title: false });
    addLabel(svg, wrap, 'visible light', (xFor(S.RANGE_NM.min) + xFor(S.RANGE_NM.max)) / 2, yBottom + 52, 'diagram-label--tick');
  }

  function groupLabels(lines) {
    const groups = [];
    [...lines].sort((a, b) => a.nm - b.nm).forEach((line) => {
      const last = groups[groups.length - 1];
      if (last && last.element === line.element && line.nm - last.maxNm < 10) {
        last.maxNm = line.nm;
      } else {
        groups.push({ element: line.element, minNm: line.nm, maxNm: line.nm });
      }
    });
    return groups;
  }

  function drawTemperatureLines(star) {
    const svg = document.getElementById('temperature-lines-diagram');
    const wrap = document.getElementById('temperature-lines-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const x0 = 60;
    const x1 = 620;
    const xFor = makeScale(x0, x1);
    const lines = S.linesForStrengths(star.strengths);
    const stripY = 66;
    drawStrip(svg, { x0, x1, y: stripY, h: 34, type: 'absorption', lines });
    // Neighbouring groups alternate between two label rows, so labels for
    // lines only a few nanometres apart never sit on top of each other.
    groupLabels(lines).forEach((group, i) => {
      const x = xFor((group.minNm + group.maxNm) / 2);
      const y = i % 2 === 0 ? 17 : 46;
      svgEl('line', { x1: x, x2: x, y1: y + 9, y2: stripY - 2, stroke: MUTED, 'stroke-width': 1 }, svg);
      addLabel(svg, wrap, S.ELEMENTS[group.element].symbol, x, y, 'diagram-label--tick diagram-label--strong');
    });
    drawWavelengthAxis(svg, wrap, { x0, x1, y: 120, title: false });
  }

  function updateTemperature() {
    const star = temperatureStar();
    drawTemperatureCurve(star);
    drawTemperatureLines(star);
    const peak = S.peakWavelengthNm(star.temperatureK);
    document.getElementById('temperature-peak-readout').textContent = `about ${Math.round(peak).toLocaleString('en-GB')} nm (${bandName(peak)})`;
    document.getElementById('temperature-colour-readout').textContent = S.starColourName(star.temperatureK);
    const strong = S.ELEMENT_KEYS.filter((key) => star.strengths[key] === 'strong').map((key) => S.ELEMENTS[key].name.toLowerCase());
    document.getElementById('temperature-lines-readout').textContent = listWithAnd(strong);
  }

  // ------------------------------------------------------------------
  // 5. Radial velocity
  // ------------------------------------------------------------------

  // Slider ends: 5% of the speed of light, hugely exaggerated so the
  // shift is visible at this scale.
  const MAX_EXAGGERATED_FRACTION = 0.05;
  const HYDROGEN_REST = S.ELEMENTS.hydrogen.lines;

  function exaggeratedVelocity() {
    const s = Number(document.getElementById('doppler-slider').value);
    return (s / 100) * MAX_EXAGGERATED_FRACTION * S.SPEED_OF_LIGHT_M_PER_S;
  }

  function signed(value, digits) {
    if (Math.abs(value) < 0.5 * Math.pow(10, -digits)) return `0.${'0'.repeat(digits)}`;
    return `${value > 0 ? '+' : '−'}${Math.abs(value).toFixed(digits)}`;
  }

  function updateDoppler() {
    const svg = document.getElementById('doppler-diagram');
    const wrap = document.getElementById('doppler-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const x0 = 60;
    const x1 = 620;
    const xFor = makeScale(x0, x1);
    const v = exaggeratedVelocity();
    const direction = S.shiftDirection(v);
    const restLines = HYDROGEN_REST.map((nm) => ({ nm, depth: 0.85 }));
    const shiftedLines = HYDROGEN_REST.map((nm) => ({ nm: S.dopplerShift(nm, v), depth: 0.85 }));

    addLabel(svg, wrap, 'Laboratory hydrogen (not moving)', x0, 18, 'diagram-label--right diagram-label--tick');
    drawStrip(svg, { x0, x1, y: 30, h: 34, type: 'absorption', lines: restLines });
    const starText = { redshift: 'Star (receding)', blueshift: 'Star (approaching)', none: 'Star (not moving towards or away)' }[direction];
    addLabel(svg, wrap, starText, x0, 120, 'diagram-label--right diagram-label--tick');
    drawStrip(svg, { x0, x1, y: 132, h: 34, type: 'absorption', lines: shiftedLines });

    restLines.forEach((line, i) => {
      const xa = xFor(line.nm);
      const xb = xFor(shiftedLines[i].nm);
      svgEl('line', { class: 'doppler-arrow', x1: xa, x2: xb, y1: 78, y2: 126, stroke: '#ffe08a', 'stroke-width': 1.5 }, svg);
      if (Math.abs(xb - xa) > 4) {
        const dir = Math.sign(xb - xa);
        svgEl('polygon', { points: `${xb},126 ${xb - dir * 3},${118} ${xb + dir * 4},${120}`, fill: '#ffe08a' }, svg);
      }
    });
    drawWavelengthAxis(svg, wrap, { x0, x1, y: 180 });

    const shiftHAlpha = S.dopplerShift(656.3, v) - 656.3;
    document.getElementById('doppler-shift-readout').textContent = `${signed(shiftHAlpha, 1)} nm`;
    document.getElementById('doppler-direction-readout').textContent = {
      redshift: 'Lines at longer wavelengths: redshift, the star is moving away',
      blueshift: 'Lines at shorter wavelengths: blueshift, the star is moving towards us',
      none: 'No shift: no motion towards or away from us',
    }[direction];
    document.getElementById('doppler-diagram').dataset.direction = direction;
  }

  function fillDopplerNote() {
    const realSpeed = 30000;
    const realShift = S.dopplerShift(656.3, realSpeed) - 656.3;
    const c = S.SPEED_OF_LIGHT_M_PER_S;
    document.getElementById('doppler-real-note').textContent =
      `The slider is exaggerated for visibility: its ends stand for ${Math.round(MAX_EXAGGERATED_FRACTION * 100)}% of the speed of light. ` +
      `Real shifts for ordinary stars are far smaller: a star moving away at 30 km/s shifts the 656.3 nm line by only about ${realShift.toFixed(3)} nm ` +
      `(using the data sheet's speed of light, ${(c / 1e8).toFixed(1)} × 10⁸ m/s), too small to see at this scale. ` +
      'Redshift of whole galaxies is for a later page, Redshift (coming soon).';
  }

  // ------------------------------------------------------------------
  // 6. Digital sensor
  // ------------------------------------------------------------------

  const SENSOR_RATES = [140, 190, 220, 55, 230, 215, 180, 120];
  const SENSOR_WAVELENGTHS = [420, 460, 500, 540, 580, 620, 660, 690];
  const SENSOR_FULL_SCALE = 720;

  function updateSensor() {
    const svg = document.getElementById('sensor-diagram');
    const wrap = document.getElementById('sensor-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const exposure = Number(document.getElementById('sensor-exposure').value);
    const counts = S.pixelCounts(SENSOR_RATES, exposure);
    const pitch = 44;
    const left = 20;
    const top = 76;
    const height = 104;
    const width = 30;

    addLabel(svg, wrap, 'Photons arrive', left, 14, 'diagram-label--right diagram-label--tick');
    counts.forEach((count, i) => {
      const x = left + i * pitch;
      const dots = Math.max(1, Math.round(SENSOR_RATES[i] / 45));
      for (let d = 0; d < dots; d += 1) {
        svgEl('circle', { cx: x + 8 + (d % 3) * 9, cy: 32 + Math.floor(d / 3) * 12, r: 2.6, fill: '#ffe08a' }, svg);
      }
      svgEl('line', { x1: x + width / 2, x2: x + width / 2, y1: 58, y2: top - 4, stroke: '#ffe08a', 'stroke-width': 1 }, svg);
      svgEl('rect', { x, y: top, width, height, rx: 3, fill: '#1b2438', stroke: '#cfd8e6', 'stroke-width': 1.2 }, svg);
      const fill = (count / SENSOR_FULL_SCALE) * (height - 4);
      svgEl('rect', { class: 'sensor-charge', x: x + 2, y: top + height - 2 - fill, width: width - 4, height: fill, fill: '#7fb8ff' }, svg);
      svgEl('rect', { x, y: top + height + 4, width, height: 6, fill: rgbString(stripColour(SENSOR_WAVELENGTHS[i])) }, svg);
      addLabel(svg, wrap, String(count), x + width / 2, top + height + 24, 'diagram-label--tick sensor-count');
    });
    addLabel(svg, wrap, 'Charge builds up in each pixel', left, top + height + 62, 'diagram-label--right diagram-label--tick');

    // Read-out arrow, then the stored file.
    svgEl('line', { x1: 372, x2: 430, y1: 128, y2: 128, stroke: INK, 'stroke-width': 2 }, svg);
    svgEl('polygon', { points: '430,121 444,128 430,135', fill: INK }, svg);
    addLabel(svg, wrap, 'read out', 405, 110, 'diagram-label--tick');
    svgEl('polygon', { points: '470,82 540,82 560,102 560,180 470,180', fill: '#e8eef8', stroke: '#9aa7bd', 'stroke-width': 1.5 }, svg);
    svgEl('polygon', { points: '540,82 540,102 560,102', fill: '#c3cede' }, svg);
    [100, 114, 128, 142, 156].forEach((y) => svgEl('line', { x1: 482, x2: 546, y1: y, y2: y, stroke: '#7a879c', 'stroke-width': 2 }, svg));
    addLabel(svg, wrap, 'Stored as a data file', 515, 200, 'diagram-label--tick');
  }

  // ------------------------------------------------------------------

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  drawSpectrograph();
  drawTwoViews();
  ['kirchhoff-source', 'kirchhoff-cloud', 'kirchhoff-view'].forEach((id) => document.getElementById(id).addEventListener('change', updateKirchhoff));
  updateKirchhoff();
  drawStarLayers();

  document.getElementById('puzzle-star').addEventListener('change', () => {
    drawComposition();
    document.getElementById('puzzle-feedback').textContent = '';
  });
  document.getElementById('puzzle-guides').addEventListener('change', drawComposition);
  document.getElementById('puzzle-check').addEventListener('click', checkPuzzle);
  drawComposition();
  fillReferenceTable();

  document.getElementById('temperature-star').addEventListener('change', updateTemperature);
  updateTemperature();

  document.getElementById('doppler-slider').addEventListener('input', updateDoppler);
  updateDoppler();
  fillDopplerNote();

  document.getElementById('sensor-exposure').addEventListener('change', updateSensor);
  updateSensor();

  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(SpectraQuestions.makeQuestions(S));
})();
