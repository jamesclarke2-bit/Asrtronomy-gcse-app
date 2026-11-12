(function () {
  const S = window.Spectra;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, svgEl, clearDiagram, addLabel, panel, rgbString, makeScale, drawStrip, drawWavelengthAxis } = D;

  const CURRICULUM_UNITS = ['u4.8'];

  const GLOSSARY = {
    spectralType:
      "A spectral type: a star's class, O, B, A, F, G, K or M, given by the pattern of lines in its spectrum. Because those lines depend on temperature, the classes run from hottest (O) to coolest (M).",
    subclass:
      'A subclass: a finer step inside one class, numbered 0 (hottest) to 9 (coolest). A G2 star is slightly hotter than a G5 star.',
    kelvin:
      'A kelvin (K): the unit of temperature astronomers use. It starts from absolute zero, so a temperature in kelvin is about 273 more than the same temperature in degrees Celsius.',
  };

  // A temperature for drawing each class's colour box: the middle of its
  // range (O, with no upper limit, drawn at 40,000 K).
  const CLASS_DRAW_K = { O: 40000, B: 20000, A: 8750, F: 6750, G: 5600, K: 4450, M: 3050 };

  function formatK(t) {
    return `${(Math.round(t / 100) * 100).toLocaleString('en-GB')} K`;
  }

  function rangeText(cls) {
    if (cls.maxK === null) return `above ${cls.minK.toLocaleString('en-GB')}`;
    return `${cls.minK.toLocaleString('en-GB')} to ${cls.maxK.toLocaleString('en-GB')}`;
  }

  function capitalise(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  // ------------------------------------------------------------------
  // 1. The class strip and table
  // ------------------------------------------------------------------

  function drawClassStrip() {
    const svg = document.getElementById('class-strip-diagram');
    const wrap = document.getElementById('class-strip-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const x0 = 20;
    const x1 = 600;
    const top = 40;
    const height = 92;
    const w = (x1 - x0) / S.SPECTRAL_CLASSES.length;

    addLabel(svg, wrap, '← hotter', x0, 20, 'diagram-label--right diagram-label--tick');
    addLabel(svg, wrap, 'cooler →', x1, 20, 'diagram-label--left diagram-label--tick');

    S.SPECTRAL_CLASSES.forEach((cls, i) => {
      const x = x0 + i * w;
      svgEl('rect', { class: 'class-box', 'data-class': cls.letter, x: x + 1, y: top, width: w - 2, height, rx: 4, fill: rgbString(D.starDisplayRgb(CLASS_DRAW_K[cls.letter])) }, svg);
      addLabel(svg, wrap, cls.letter, x + w / 2, top + 20, 'class-box-letter');
      const colour = addLabel(svg, wrap, cls.colour, x + w / 2, top + 68, 'class-box-colour');
      colour.style.width = `${((w - 6) / 640) * 100}%`;
      if (i < S.SPECTRAL_CLASSES.length - 1) {
        const edge = x + w;
        svgEl('line', { x1: edge, x2: edge, y1: top + height + 2, y2: top + height + 9, stroke: MUTED, 'stroke-width': 1 }, svg);
        addLabel(svg, wrap, cls.minK.toLocaleString('en-GB'), edge, top + height + 20, 'diagram-label--tick');
      }
    });
    const last = S.SPECTRAL_CLASSES[S.SPECTRAL_CLASSES.length - 1];
    svgEl('line', { x1, x2: x1, y1: top + height + 2, y2: top + height + 9, stroke: MUTED, 'stroke-width': 1 }, svg);
    addLabel(svg, wrap, last.minK.toLocaleString('en-GB'), x1, top + height + 20, 'diagram-label--tick');
    addLabel(svg, wrap, 'Approximate surface temperature at each boundary (K)', 310, top + height + 46, 'diagram-label--tick');
  }

  function fillClassTable() {
    const body = document.getElementById('class-table-body');
    body.innerHTML = '';
    S.SPECTRAL_CLASSES.forEach((cls) => {
      const tr = document.createElement('tr');
      [cls.letter, cls.colour, rangeText(cls), cls.strongest].forEach((text) => {
        const td = document.createElement('td');
        td.textContent = text;
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
  }

  // ------------------------------------------------------------------
  // 2. Temperature slider
  // ------------------------------------------------------------------

  const T_MIN = 2500;
  const T_MAX = 40000;

  // The slider is logarithmic: equal steps multiply the temperature by
  // the same factor, so the cool classes get as much room as the hot.
  function sliderTemperature() {
    const s = Number(document.getElementById('temperature-slider').value);
    return T_MIN * Math.pow(T_MAX / T_MIN, s / 1000);
  }

  function logX(t, x0, x1) {
    return x0 + ((Math.log(T_MAX) - Math.log(t)) / (Math.log(T_MAX) - Math.log(T_MIN))) * (x1 - x0);
  }

  function drawSim(t) {
    const svg = document.getElementById('sim-diagram');
    const wrap = document.getElementById('sim-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const current = S.classForTemperature(t);

    // Mini class strip on a log-temperature axis, with a pointer.
    const sx0 = 180;
    const sx1 = 620;
    S.SPECTRAL_CLASSES.forEach((cls) => {
      const hot = Math.min(T_MAX, cls.maxK === null ? T_MAX : cls.maxK);
      const cool = Math.max(T_MIN, cls.minK);
      const xa = logX(hot, sx0, sx1);
      const xb = logX(cool, sx0, sx1);
      const isCurrent = cls === current;
      svgEl('rect', { class: isCurrent ? 'sim-class-box sim-class-box--current' : 'sim-class-box', x: xa, y: 14, width: xb - xa, height: 26, fill: rgbString(D.starDisplayRgb(CLASS_DRAW_K[cls.letter])), stroke: isCurrent ? INK : '#0f1830', 'stroke-width': isCurrent ? 3 : 1 }, svg);
      addLabel(svg, wrap, cls.letter, (xa + xb) / 2, 27, 'class-box-letter class-box-letter--small');
    });
    const px = logX(t, sx0, sx1);
    svgEl('polygon', { class: 'sim-pointer', points: `${px},44 ${px - 7},56 ${px + 7},56`, fill: INK }, svg);
    addLabel(svg, wrap, 'class', 150, 27, 'diagram-label--left diagram-label--tick');

    // The star itself.
    const colour = D.starDisplayRgb(t);
    svgEl('circle', { cx: 80, cy: 164, r: 50, fill: rgbString(colour), opacity: 0.25 }, svg);
    svgEl('circle', { class: 'sim-star-disc', cx: 80, cy: 164, r: 38, fill: rgbString(colour) }, svg);
    addLabel(svg, wrap, `Looks ${S.starColourName(t)}`, 14, 226, 'diagram-label--right diagram-label--tick');

    return D.drawGlowCurve(svg, wrap, { temperatureK: t, x0: 180, x1: 620, yTop: 136, yBottom: 250 });
  }

  function groupLabels(lines) {
    const groups = [];
    [...lines].sort((a, b) => a.nm - b.nm).forEach((line) => {
      const last = groups[groups.length - 1];
      if (last && last.element === line.element && line.nm - last.maxNm < 10) last.maxNm = line.nm;
      else groups.push({ element: line.element, minNm: line.nm, maxNm: line.nm });
    });
    return groups;
  }

  function drawSimLines(t) {
    const svg = document.getElementById('sim-lines-diagram');
    const wrap = document.getElementById('sim-lines-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const x0 = 60;
    const x1 = 620;
    const xFor = makeScale(x0, x1);
    const all = S.linesForTemperature(t);
    const lines = all.filter((l) => l.kind !== 'band');
    const stripY = 66;
    drawStrip(svg, { x0, x1, y: stripY, h: 34, type: 'absorption', lines: all, ticks: false });
    lines.forEach((line) => {
      const x = xFor(line.nm);
      svgEl('line', { x1: x, x2: x, y1: stripY + 36, y2: stripY + 38 + 8 * line.depth, stroke: INK, 'stroke-width': 1.5 }, svg);
    });
    groupLabels(lines).forEach((group, i) => {
      const x = xFor((group.minNm + group.maxNm) / 2);
      const y = i % 2 === 0 ? 17 : 46;
      svgEl('line', { x1: x, x2: x, y1: y + 9, y2: stripY - 2, stroke: MUTED, 'stroke-width': 1 }, svg);
      addLabel(svg, wrap, S.ELEMENTS[group.element].symbol, x, y, 'diagram-label--tick diagram-label--strong');
    });
    all.filter((l) => l.kind === 'band').forEach((band) => {
      svgEl('rect', { class: 'sim-band-marker', x: xFor(band.nm), y: stripY + 38, width: xFor(band.nm + 12) - xFor(band.nm), height: 4, fill: MUTED }, svg);
    });
    drawWavelengthAxis(svg, wrap, { x0, x1, y: 120, title: false });
    svg.dataset.bands = String(all.length - lines.length);
  }

  function updateSim() {
    const t = sliderTemperature();
    document.getElementById('temperature-slider-label').textContent = formatK(t);
    const { peakNm, where } = drawSim(t);
    drawSimLines(t);
    const cls = S.classForTemperature(t);
    const classReadout = document.getElementById('sim-class-readout');
    classReadout.textContent = `${cls.letter} (about ${rangeText(cls)} K)`;
    classReadout.dataset.class = cls.letter;
    document.getElementById('sim-colour-readout').textContent = cls.colour;
    document.getElementById('sim-lines-readout').textContent = capitalise(cls.strongest);
    const place = { on: 'on the graph', ultraviolet: 'in the ultraviolet, off the graph', infrared: 'in the infrared, off the graph' }[where];
    document.getElementById('sim-peak-readout').textContent = `about ${Math.round(peakNm).toLocaleString('en-GB')} nm, ${place}`;
  }

  // ------------------------------------------------------------------
  // 3. Three glow curves
  // ------------------------------------------------------------------

  // Told apart by line style and a key, not by colour.
  const THREE_STARS = [
    { label: 'hot star, 20,000 K', t: 20000, dash: null, keyX: 60, keyY: 254 },
    { label: 'Sun-like star, 5,800 K', t: 5800, dash: '8 5', keyX: 60, keyY: 286 },
    { label: 'cool star, 3,000 K', t: 3000, dash: '2 4', keyX: 350, keyY: 254 },
  ];

  function drawThreeCurves() {
    const svg = document.getElementById('three-curves-diagram');
    const wrap = document.getElementById('three-curves-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const x0 = 60;
    const x1 = 620;
    const yTop = 30;
    const yBottom = 180;
    const minNm = 300;
    const maxNm = 1000;
    const xFor = makeScale(x0, x1, minNm, maxNm);
    for (let nm = S.RANGE_NM.min; nm < S.RANGE_NM.max; nm += 2) {
      svgEl('rect', { x: xFor(nm), y: yTop, width: xFor(nm + 2) - xFor(nm) + 0.5, height: yBottom - yTop, fill: rgbString(D.stripColour(nm + 1)), opacity: 0.18 }, svg);
    }
    THREE_STARS.forEach((star) => {
      D.drawGraph(svg, { x0, x1, yTop, yBottom, minNm, maxNm, sample: D.sampler(star.t, minNm, maxNm), dash: star.dash, className: 'three-curve' });
      const key = { x1: star.keyX, x2: star.keyX + 30, y1: star.keyY, y2: star.keyY, stroke: D.CURVE, 'stroke-width': 2 };
      if (star.dash) key['stroke-dasharray'] = star.dash;
      svgEl('line', key, svg);
      addLabel(svg, wrap, star.label, star.keyX + 38, star.keyY, 'diagram-label--right diagram-label--tick');
    });
    svgEl('rect', { x: 350, y: 279, width: 30, height: 14, fill: rgbString(D.stripColour(550)), opacity: 0.35 }, svg);
    addLabel(svg, wrap, 'visible band (shaded)', 388, 286, 'diagram-label--right diagram-label--tick');
    drawWavelengthAxis(svg, wrap, { x0, x1, y: yBottom, ticks: [300, 500, 700, 900], minNm, maxNm });
  }

  // ------------------------------------------------------------------
  // 4. Sort the stars
  // ------------------------------------------------------------------

  const chosen = {};
  let checked = false;

  function clueText(star, kind) {
    const cls = S.classForTemperature(star.temperatureK);
    if (kind === 'colour') return `Looks ${cls.colour}`;
    if (kind === 'temperature') return `Surface temperature about ${star.temperatureK.toLocaleString('en-GB')} K`;
    return `Strongest lines: ${cls.strongest}`;
  }

  function starId(star) {
    return star.name.replace(/^the /, '').toLowerCase();
  }

  function buildStarList() {
    const list = document.getElementById('sort-star-list');
    list.innerHTML = '';
    const showAll = document.getElementById('sort-all-clues').checked;
    S.REAL_STARS.forEach((star) => {
      const card = document.createElement('div');
      card.className = 'sort-star';
      card.dataset.star = starId(star);
      const name = document.createElement('p');
      name.className = 'sort-star-name';
      name.textContent = capitalise(star.name);
      card.appendChild(name);
      const clues = document.createElement('ul');
      clues.className = 'sort-star-clues';
      (showAll ? ['colour', 'temperature', 'lines'] : [star.clue]).forEach((kind) => {
        const li = document.createElement('li');
        li.textContent = clueText(star, kind);
        clues.appendChild(li);
      });
      card.appendChild(clues);
      const label = document.createElement('label');
      label.textContent = 'Class ';
      const select = document.createElement('select');
      select.className = 'sort-star-select';
      ['', ...S.CLASS_LETTERS].forEach((letter) => {
        const option = document.createElement('option');
        option.value = letter;
        option.textContent = letter || 'Choose';
        select.appendChild(option);
      });
      select.value = chosen[star.name] || '';
      select.addEventListener('change', () => {
        chosen[star.name] = select.value;
        checked = false;
        document.getElementById('sort-feedback').textContent = '';
        drawBoard();
      });
      label.appendChild(select);
      card.appendChild(label);
      list.appendChild(card);
    });
  }

  function drawBoard() {
    const svg = document.getElementById('sort-board-diagram');
    const wrap = document.getElementById('sort-board-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    S.SPECTRAL_CLASSES.forEach((cls, i) => {
      const y = 12 + i * 40;
      svgEl('rect', { x: 10, y, width: 620, height: 34, rx: 4, fill: '#1b2438' }, svg);
      svgEl('rect', { x: 44, y: y + 7, width: 20, height: 20, rx: 3, fill: rgbString(D.starDisplayRgb(CLASS_DRAW_K[cls.letter])) }, svg);
      addLabel(svg, wrap, cls.letter, 26, y + 17, 'diagram-label--tick diagram-label--strong');
      const here = S.REAL_STARS.filter((star) => chosen[star.name] === cls.letter);
      const spacing = Math.min(150, 540 / Math.max(1, here.length));
      here.forEach((star, k) => {
        const x = 90 + k * spacing;
        const right = S.classForTemperature(star.temperatureK).letter === cls.letter;
        svgEl('circle', { class: 'sort-board-star', 'data-star': starId(star), cx: x, cy: y + 17, r: 8, fill: rgbString(D.starDisplayRgb(star.temperatureK)) }, svg);
        const mark = checked ? (right ? ' ✓' : ' ✗') : '';
        addLabel(svg, wrap, `${capitalise(star.name)}${mark}`, x + 13, y + 17, 'diagram-label--right diagram-label--tick');
      });
    });
  }

  function checkSorting() {
    checked = true;
    const right = S.REAL_STARS.filter((star) => chosen[star.name] === S.classForTemperature(star.temperatureK).letter);
    const feedback = document.getElementById('sort-feedback');
    feedback.dataset.score = String(right.length);
    const answers = S.REAL_STARS.map((star) => `${capitalise(star.name)} ${star.type[0]}`).join(', ');
    feedback.textContent = right.length === S.REAL_STARS.length
      ? `All ${S.REAL_STARS.length} right: ${answers}.`
      : `${right.length} of ${S.REAL_STARS.length} right so far. A cross on the board marks a star in the wrong row: try "Show all three clues".`;
    drawBoard();
  }

  // ------------------------------------------------------------------

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  drawClassStrip();
  fillClassTable();
  document.getElementById('temperature-slider').addEventListener('input', updateSim);
  updateSim();
  drawThreeCurves();
  document.getElementById('sort-all-clues').addEventListener('change', buildStarList);
  document.getElementById('sort-check').addEventListener('click', checkSorting);
  buildStarList();
  drawBoard();
  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(SpectralTypesQuestions.makeQuestions(S));
})();
