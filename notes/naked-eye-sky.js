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

  // The actual star-chart drawing (lines, stars, optionally labels),
  // shared by the main page's own cards (drawPatternChart, below) and
  // by a "name that pattern" quiz question's render(container)
  // (renderPatternQuizDiagram, below) — the same real chart either way,
  // never a separately hand-drawn or hand-described copy. Returns the
  // pattern's own angular span, which only drawPatternChart's own
  // caption needs.
  function drawPatternStars(svg, wrap, pattern, showLabels = true) {
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

    if (showLabels) {
      pattern.labels.forEach(([key, side]) => {
        const p = toScreen(flat[key]);
        const [dx, dy] = SIDE_OFFSETS[side];
        const label = makeLabel(wrap, 'star-label', STARS[key].name);
        placeLabel(label, p.x + dx, p.y + dy, CHART_WIDTH, CHART_HEIGHT, side);
      });
    }

    return { span: StarPatterns.spanOf(stars) };
  }

  function drawPatternChart(card) {
    const pattern = PATTERNS.find((p) => p.id === card.dataset.pattern);
    const chart = card.querySelector('.pattern-chart');
    const wrap = chart.querySelector('.labelled-diagram-wrap');
    const svg = wrap.querySelector('svg');

    const { span } = drawPatternStars(svg, wrap, pattern, true);

    const caption = document.createElement('p');
    caption.className = 'pattern-span';
    caption.textContent = `About ${Math.round(span)}° across, roughly ${Math.round(span / 0.5)} full Moons side by side`;
    chart.appendChild(caption);

    card.classList.add(`pattern-card--${pattern.kind}`);
    card.querySelector('.pattern-kind').textContent = pattern.kind === 'asterism' ? 'Asterism' : 'Constellation';
  }

  // A small, standalone copy of one pattern's chart for a "name that
  // pattern" practice question: the same drawPatternStars used above,
  // just with its labels left off and built into a fresh svg/wrap pair
  // instead of an existing .pattern-card.
  function renderPatternQuizDiagram(container, patternId) {
    const pattern = PATTERNS.find((p) => p.id === patternId);
    const chart = document.createElement('div');
    chart.className = 'pattern-chart';
    const wrap = document.createElement('div');
    wrap.className = 'labelled-diagram-wrap';
    chart.appendChild(wrap);
    const svg = svgEl('svg', {
      viewBox: `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`,
      role: 'img',
      'aria-label': 'Star chart with labels hidden, for you to identify',
    }, wrap);

    drawPatternStars(svg, wrap, pattern, false);

    container.appendChild(chart);
  }

  // A scale-to-fit projection, shared by every star-hop diagram below: fits
  // a set of already-projected (gnomonic) points into a pixel canvas, the
  // same way drawPatternChart does for a single pattern.
  function fitProjectedPoints(points, width, height, padding) {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const scale = Math.min(
      (width - 2 * padding) / (Math.max(...xs) - Math.min(...xs)),
      (height - 2 * padding) / (Math.max(...ys) - Math.min(...ys))
    );
    const midX = (Math.max(...xs) + Math.min(...xs)) / 2;
    const midY = (Math.max(...ys) + Math.min(...ys)) / 2;
    return (p) => ({
      x: width / 2 + (p.x - midX) * scale,
      y: height / 2 - (p.y - midY) * scale,
    });
  }

  function drawArrowhead(svg, from, to, color) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const size = 9;
    const a1 = angle + Math.PI * 0.82;
    const a2 = angle - Math.PI * 0.82;
    const p1 = { x: to.x + size * Math.cos(a1), y: to.y + size * Math.sin(a1) };
    const p2 = { x: to.x + size * Math.cos(a2), y: to.y + size * Math.sin(a2) };
    svgEl('polygon', { points: `${to.x},${to.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`, fill: color }, svg);
  }

  // A star cluster (the Pleiades): a loose knot of small dots, not one point.
  function drawClusterGlyph(svg, centre) {
    const offsets = [[0, -6], [7, -3], [5, 5], [-5, 6], [-7, -2], [1, 1]];
    offsets.forEach(([dx, dy]) => {
      svgEl('circle', { cx: centre.x + dx, cy: centre.y + dy, r: 3.2, fill: '#10141f' }, svg);
      svgEl('circle', { cx: centre.x + dx, cy: centre.y + dy, r: 1.8, fill: '#fdfcf5' }, svg);
    });
  }

  // A galaxy (Andromeda): a small, faint, elongated smudge, not one point.
  function drawGalaxyGlyph(svg, centre, angleDeg) {
    svgEl('ellipse', {
      cx: centre.x, cy: centre.y, rx: 15, ry: 5.5,
      transform: `rotate(${angleDeg} ${centre.x} ${centre.y})`,
      fill: '#8fa3c9', opacity: 0.5,
    }, svg);
    svgEl('ellipse', {
      cx: centre.x, cy: centre.y, rx: 7, ry: 2.6,
      transform: `rotate(${angleDeg} ${centre.x} ${centre.y})`,
      fill: '#c9d4e8', opacity: 0.8,
    }, svg);
  }

  // --- Star-hopping from Orion's Belt: Sirius, Aldebaran, the Pleiades ---

  const ORION_HOP_WIDTH = 380;
  const ORION_HOP_HEIGHT = 380;
  const HOP_PADDING = 38;

  function drawOrionHopDiagram() {
    const svg = document.getElementById('orion-hop');
    const wrap = document.getElementById('orion-hop-wrap');
    const orion = PATTERNS.find((p) => p.id === 'orion');

    const gap = StarPatterns.angularSeparation(STARS.mintaka, STARS.alnilam);
    const siriusRatio = StarPatterns.angularSeparation(STARS.alnilam, STARS.sirius) / gap;
    const pleiadesRatio = StarPatterns.angularSeparation(STARS.mintaka, STARS.alcyone) / gap;

    const allKeys = [...orion.stars, 'sirius', 'aldebaran', 'alcyone'];
    const centre = StarPatterns.centreOf(allKeys.map((key) => STARS[key]));
    const flat = {};
    allKeys.forEach((key) => { flat[key] = StarPatterns.project(STARS[key], centre); });
    const siriusEndRaw = StarPatterns.project(StarPatterns.extendBeyond(STARS.mintaka, STARS.alnilam, siriusRatio), centre);
    const pleiadesEndRaw = StarPatterns.project(StarPatterns.extendBeyond(STARS.alnilam, STARS.mintaka, pleiadesRatio), centre);
    const toScreen = fitProjectedPoints([...Object.values(flat), siriusEndRaw, pleiadesEndRaw], ORION_HOP_WIDTH, ORION_HOP_HEIGHT, HOP_PADDING);

    // Orion's own outline, for context.
    const lines = svgEl('g', { stroke: SKY_LINE_COLOR, 'stroke-width': 1.5 }, svg);
    orion.lines.forEach(([a, b]) => {
      const p = toScreen(flat[a]);
      const q = toScreen(flat[b]);
      svgEl('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y }, lines);
    });

    // One pointer line through the Belt's two innermost stars, extended
    // past Alnilam to Sirius and past Mintaka to Aldebaran and the Pleiades.
    const pointerLines = svgEl('g', { stroke: '#f5a623', 'stroke-width': 2, 'stroke-dasharray': '6 5' }, svg);
    const siriusEnd = toScreen(siriusEndRaw);
    const pleiadesEnd = toScreen(pleiadesEndRaw);
    const mintakaPt = toScreen(flat.mintaka);
    const alnilamPt = toScreen(flat.alnilam);
    svgEl('line', { x1: alnilamPt.x, y1: alnilamPt.y, x2: siriusEnd.x, y2: siriusEnd.y }, pointerLines);
    svgEl('line', { x1: mintakaPt.x, y1: mintakaPt.y, x2: pleiadesEnd.x, y2: pleiadesEnd.y }, pointerLines);

    orion.stars.concat(['sirius', 'aldebaran']).forEach((key) => {
      const p = toScreen(flat[key]);
      const highlight = key === 'sirius' || key === 'aldebaran';
      svgEl('circle', { cx: p.x, cy: p.y, r: starRadius(STARS[key].mag) + 2.5, fill: '#10141f' }, svg);
      svgEl('circle', { cx: p.x, cy: p.y, r: starRadius(STARS[key].mag), fill: highlight ? '#ffe9a8' : '#fdfcf5' }, svg);
    });
    drawClusterGlyph(svg, toScreen(flat.alcyone));

    const beltLabel = makeLabel(wrap, 'star-label', "Orion's Belt");
    placeLabel(beltLabel, alnilamPt.x, alnilamPt.y, ORION_HOP_WIDTH, ORION_HOP_HEIGHT, 'left');
    const siriusPt = toScreen(flat.sirius);
    placeLabel(makeLabel(wrap, 'star-label hop-target-label', 'Sirius'), siriusPt.x + 6, siriusPt.y, ORION_HOP_WIDTH, ORION_HOP_HEIGHT, 'right');
    const aldebaranPt = toScreen(flat.aldebaran);
    placeLabel(makeLabel(wrap, 'star-label hop-target-label', 'Aldebaran'), aldebaranPt.x, aldebaranPt.y - 8, ORION_HOP_WIDTH, ORION_HOP_HEIGHT, 'above');
    const pleiadesPt = toScreen(flat.alcyone);
    placeLabel(makeLabel(wrap, 'star-label hop-target-label', 'The Pleiades'), pleiadesPt.x, pleiadesPt.y - 8, ORION_HOP_WIDTH, ORION_HOP_HEIGHT, 'left');
  }

  // --- Star-hopping from the Square of Pegasus: Fomalhaut, Andromeda -----

  const PEGASUS_HOP_WIDTH = 340;
  const PEGASUS_HOP_HEIGHT = 560;

  function drawPegasusHopDiagram() {
    const svg = document.getElementById('pegasus-hop');
    const wrap = document.getElementById('pegasus-hop-wrap');
    const square = PATTERNS.find((p) => p.id === 'squareOfPegasus');

    const andromedaGap = StarPatterns.angularSeparation(STARS.markab, STARS.alpheratz);
    const andromedaRatio = StarPatterns.angularSeparation(STARS.alpheratz, STARS.andromedaGalaxy) / andromedaGap;

    const centre = StarPatterns.centreOf(square.stars.map((key) => STARS[key]));
    const flat = {};
    square.stars.forEach((key) => { flat[key] = StarPatterns.project(STARS[key], centre); });
    flat.andromedaGalaxy = StarPatterns.project(STARS.andromedaGalaxy, centre);

    // Fomalhaut is much further away than the diagram can show to scale
    // (see the note below it): the arrow just continues the Scheat-Markab
    // line one more gap's length beyond Markab, in the right direction.
    const arrowTip = {
      x: flat.markab.x + (flat.markab.x - flat.scheat.x),
      y: flat.markab.y + (flat.markab.y - flat.scheat.y),
    };

    const andEndRaw = StarPatterns.project(StarPatterns.extendBeyond(STARS.markab, STARS.alpheratz, andromedaRatio), centre);

    const toScreen = fitProjectedPoints(
      [...Object.values(flat), arrowTip, andEndRaw],
      PEGASUS_HOP_WIDTH, PEGASUS_HOP_HEIGHT, HOP_PADDING
    );

    const lines = svgEl('g', { stroke: SKY_LINE_COLOR, 'stroke-width': 1.5 }, svg);
    square.lines.forEach(([a, b]) => {
      const p = toScreen(flat[a]);
      const q = toScreen(flat[b]);
      svgEl('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y }, lines);
    });

    const pointerLines = svgEl('g', { stroke: '#f5a623', 'stroke-width': 2, 'stroke-dasharray': '6 5' }, svg);
    const markabPt = toScreen(flat.markab);
    const scheatPt = toScreen(flat.scheat);
    const arrowTipPt = toScreen(arrowTip);
    svgEl('line', { x1: scheatPt.x, y1: scheatPt.y, x2: arrowTipPt.x, y2: arrowTipPt.y }, pointerLines);
    drawArrowhead(svg, markabPt, arrowTipPt, '#f5a623');

    const andEnd = toScreen(andEndRaw);
    svgEl('line', { x1: markabPt.x, y1: markabPt.y, x2: andEnd.x, y2: andEnd.y }, pointerLines);

    square.stars.forEach((key) => {
      const p = toScreen(flat[key]);
      svgEl('circle', { cx: p.x, cy: p.y, r: starRadius(STARS[key].mag) + 2.5, fill: '#10141f' }, svg);
      svgEl('circle', { cx: p.x, cy: p.y, r: starRadius(STARS[key].mag), fill: '#fdfcf5' }, svg);
    });
    const andromedaPt = toScreen(flat.andromedaGalaxy);
    drawGalaxyGlyph(svg, andromedaPt, -35);

    square.labels.forEach(([key, side]) => {
      const p = toScreen(flat[key]);
      const [dx, dy] = SIDE_OFFSETS[side];
      const label = makeLabel(wrap, 'star-label', STARS[key].name);
      placeLabel(label, p.x + dx, p.y + dy, PEGASUS_HOP_WIDTH, PEGASUS_HOP_HEIGHT, side);
    });
    placeLabel(makeLabel(wrap, 'star-label hop-target-label', 'Andromeda Galaxy'), andromedaPt.x, andromedaPt.y + 16, PEGASUS_HOP_WIDTH, PEGASUS_HOP_HEIGHT, 'right');
    placeLabel(makeLabel(wrap, 'star-label hop-target-label', 'Fomalhaut →'), arrowTipPt.x, arrowTipPt.y, PEGASUS_HOP_WIDTH, PEGASUS_HOP_HEIGHT, 'below');
  }

  // --- Flashcards: naked-eye phenomena, patterns and pointer routes ------
  //
  // FlashCards.mount() (flashcards.js) is content-agnostic — it just
  // flips and shuffles whatever { front, back } cards it's given. All
  // the astronomy, including every icon, lives here.

  const ICON_WIDTH = 140;
  const ICON_HEIGHT = 100;
  const ICON_BG = '#10141f';

  function iconSvg() {
    const svg = svgEl('svg', { viewBox: `0 0 ${ICON_WIDTH} ${ICON_HEIGHT}`, role: 'img', 'aria-hidden': 'true' });
    svgEl('rect', { x: 0, y: 0, width: ICON_WIDTH, height: ICON_HEIGHT, rx: 10, fill: ICON_BG }, svg);
    return svg;
  }

  const PHENOMENA_ICONS = {
    sun() {
      const svg = iconSvg();
      const cx = ICON_WIDTH / 2;
      const cy = ICON_HEIGHT / 2;
      for (let i = 0; i < 8; i += 1) {
        const angle = (i / 8) * 2 * Math.PI;
        svgEl('line', {
          x1: cx + Math.cos(angle) * 23, y1: cy + Math.sin(angle) * 23,
          x2: cx + Math.cos(angle) * 34, y2: cy + Math.sin(angle) * 34,
          stroke: '#ffcf5c', 'stroke-width': 3, 'stroke-linecap': 'round',
        }, svg);
      }
      svgEl('circle', { cx, cy, r: 18, fill: '#ffcf5c' }, svg);
      return svg;
    },
    moon() {
      const svg = iconSvg();
      const cx = ICON_WIDTH / 2;
      const cy = ICON_HEIGHT / 2;
      svgEl('circle', { cx, cy, r: 22, fill: '#fdfcf5' }, svg);
      svgEl('circle', { cx: cx + 11, cy: cy - 5, r: 20, fill: ICON_BG }, svg);
      return svg;
    },
    stars() {
      const svg = iconSvg();
      [[30, 28, 2.8], [58, 20, 2], [86, 32, 2.4], [104, 55, 1.7], [42, 62, 1.9], [66, 44, 1.4], [22, 50, 1.5]]
        .forEach(([x, y, r]) => svgEl('circle', { cx: x, cy: y, r, fill: '#fdfcf5' }, svg));
      // A close pair, to show what a double star looks like.
      svgEl('circle', { cx: 92, cy: 74, r: 2.2, fill: '#fdfcf5' }, svg);
      svgEl('circle', { cx: 98, cy: 76, r: 1.6, fill: '#fdfcf5' }, svg);
      return svg;
    },
    starClusters() {
      const svg = iconSvg();
      drawClusterGlyph(svg, { x: ICON_WIDTH / 2, y: ICON_HEIGHT / 2 });
      return svg;
    },
    galaxiesNebulae() {
      const svg = iconSvg();
      drawGalaxyGlyph(svg, { x: 52, y: 38 }, -25);
      svgEl('circle', { cx: 96, cy: 66, r: 16, fill: '#c97b8a', opacity: 0.35 }, svg);
      svgEl('circle', { cx: 96, cy: 66, r: 8, fill: '#e3a6b0', opacity: 0.55 }, svg);
      return svg;
    },
    planets() {
      const svg = iconSvg();
      const cx = ICON_WIDTH / 2;
      const cy = ICON_HEIGHT / 2;
      svgEl('ellipse', {
        cx, cy, rx: 32, ry: 8, fill: 'none', stroke: '#d8c98a', 'stroke-width': 3,
        transform: `rotate(-18 ${cx} ${cy})`,
      }, svg);
      svgEl('circle', { cx, cy, r: 15, fill: '#e8b878' }, svg);
      return svg;
    },
    comets() {
      const svg = iconSvg();
      svgEl('path', { d: 'M 98 32 L 38 74 L 62 52 Z', fill: '#bcd4f0', opacity: 0.6 }, svg);
      svgEl('circle', { cx: 98, cy: 32, r: 8, fill: '#eaf2fb' }, svg);
      return svg;
    },
    meteors() {
      const svg = iconSvg();
      svgEl('line', {
        x1: 38, y1: 76, x2: 102, y2: 24, stroke: '#ffe9a8', 'stroke-width': 3,
        'stroke-linecap': 'round', opacity: 0.85,
      }, svg);
      svgEl('circle', { cx: 102, cy: 24, r: 4, fill: '#fff6d9' }, svg);
      return svg;
    },
    aurorae() {
      const svg = iconSvg();
      svgEl('path', {
        d: 'M 12 70 Q 40 18 68 54 T 128 32', stroke: '#4fd39a', 'stroke-width': 5,
        fill: 'none', opacity: 0.7, 'stroke-linecap': 'round',
      }, svg);
      svgEl('path', {
        d: 'M 12 84 Q 40 36 68 68 T 128 46', stroke: '#8a6fd8', 'stroke-width': 5,
        fill: 'none', opacity: 0.55, 'stroke-linecap': 'round',
      }, svg);
      return svg;
    },
    supernovae() {
      const svg = iconSvg();
      const cx = ICON_WIDTH / 2;
      const cy = ICON_HEIGHT / 2;
      for (let i = 0; i < 10; i += 1) {
        const angle = (i / 10) * 2 * Math.PI;
        const len = i % 2 === 0 ? 38 : 22;
        svgEl('line', {
          x1: cx, y1: cy, x2: cx + Math.cos(angle) * len, y2: cy + Math.sin(angle) * len,
          stroke: '#ffd27a', 'stroke-width': 2.5, 'stroke-linecap': 'round',
        }, svg);
      }
      svgEl('circle', { cx, cy, r: 9, fill: '#fff3d6' }, svg);
      return svg;
    },
    satellites() {
      const svg = iconSvg();
      const cx = ICON_WIDTH / 2;
      const cy = ICON_HEIGHT / 2;
      svgEl('rect', { x: cx - 34, y: cy - 10, width: 22, height: 20, fill: '#4a7fc9' }, svg);
      svgEl('rect', { x: cx + 12, y: cy - 10, width: 22, height: 20, fill: '#4a7fc9' }, svg);
      svgEl('line', { x1: cx - 12, y1: cy, x2: cx - 6, y2: cy, stroke: '#cdd7e1', 'stroke-width': 2 }, svg);
      svgEl('line', { x1: cx + 6, y1: cy, x2: cx + 12, y2: cy, stroke: '#cdd7e1', 'stroke-width': 2 }, svg);
      svgEl('rect', { x: cx - 6, y: cy - 6, width: 12, height: 12, fill: '#cdd7e1' }, svg);
      return svg;
    },
    aircraft() {
      const svg = iconSvg();
      svgEl('path', { d: 'M 28 50 L 90 42 L 112 50 L 90 58 Z', fill: '#cdd7e1' }, svg);
      svgEl('path', { d: 'M 58 42 L 68 18 L 75 42 Z', fill: '#cdd7e1' }, svg);
      svgEl('path', { d: 'M 58 58 L 68 82 L 75 58 Z', fill: '#cdd7e1' }, svg);
      svgEl('circle', { cx: 63, cy: 44, r: 3, fill: '#e05a4e' }, svg);
      svgEl('circle', { cx: 63, cy: 56, r: 3, fill: '#4fd39a' }, svg);
      return svg;
    },
    doubleStar() {
      const svg = iconSvg();
      const cy = ICON_HEIGHT / 2;
      svgEl('circle', { cx: 56, cy, r: 7, fill: '#fdfcf5' }, svg);
      svgEl('circle', { cx: 80, cy: cy - 6, r: 4.5, fill: '#ffe9a8' }, svg);
      return svg;
    },
    milkyWay() {
      const svg = iconSvg();
      const band = svgEl('g', { opacity: 0.6 }, svg);
      for (let i = 0; i < 6; i += 1) {
        const t = i / 5;
        const x = 14 + t * 112;
        const y = 86 - t * 72;
        svgEl('ellipse', { cx: x, cy: y, rx: 26, ry: 10, fill: '#cfd9ec', transform: `rotate(-35 ${x} ${y})` }, band);
      }
      [[18, 68], [46, 52], [78, 34], [108, 18], [30, 28], [100, 68], [58, 84], [120, 52], [12, 14]].forEach(([x, y]) => {
        svgEl('circle', { cx: x, cy: y, r: 1.3, fill: '#fdfcf5' }, svg);
      });
      return svg;
    },
  };

  const PHENOMENA_CARDS = [
    {
      icon: 'sun',
      title: 'The Sun',
      tell: 'By far the brightest object in the sky.',
      body: 'By far the brightest object in the sky. Never look at it directly, even briefly.',
    },
    {
      icon: 'moon',
      title: 'The Moon',
      tell: 'The brightest thing at night; changes phase.',
      body: "Our only natural satellite. Goes through a full cycle of phases roughly every 29.5 days.",
    },
    {
      icon: 'stars',
      title: 'Stars',
      tell: 'Twinkling points of light in fixed patterns.',
      body: 'Distant suns that twinkle and keep fixed patterns. A double star is two stars that appear close together — a different idea entirely from a constellation or asterism.',
    },
    {
      icon: 'starClusters',
      title: 'Star cluster',
      tell: 'A tight knot or fuzzy patch, not just one point.',
      body: 'A group of stars born together, still close enough to look like a tight knot or fuzzy patch, e.g. the Pleiades.',
    },
    {
      icon: 'galaxiesNebulae',
      title: 'Galaxy / nebula',
      tell: 'A smudge: a whole galaxy, or a closer gas cloud.',
      body: 'A galaxy is an entire separate star system, like the Andromeda Galaxy. A nebula is a closer cloud of gas and dust inside our own Galaxy, like the Orion Nebula.',
    },
    {
      icon: 'planets',
      title: 'Planet',
      tell: 'Shines steady, drifting slowly against the stars.',
      body: 'Shines with a steadier light than stars, stays within the zodiacal band, and drifts slowly against the background stars.',
    },
    {
      icon: 'comets',
      title: 'Comet',
      tell: 'A fuzzy tail, always pointing away from the Sun.',
      body: 'A fuzzy coma with a faint tail that always points away from the Sun. Drifts slowly against the stars from one night to the next.',
    },
    {
      icon: 'meteors',
      title: 'Meteor',
      tell: 'A single streak under a second, gone in a blink.',
      body: '"Shooting stars": a brief streak of light under a second long, as a grain of dust burns up in the atmosphere.',
    },
    {
      icon: 'aurorae',
      title: 'Aurora',
      tell: 'Rippling green curtains or arcs, low in the north.',
      body: 'Glowing curtains, arcs or rays of light, mostly green, caused by solar wind particles striking the upper atmosphere near the poles.',
    },
    {
      icon: 'supernovae',
      title: 'Supernova',
      tell: 'A "new star" — briefly dazzling, vanishingly rare.',
      body: "A dying star's catastrophic explosion, briefly outshining its whole galaxy. A naked-eye one in our own Galaxy is extremely rare.",
    },
    {
      icon: 'doubleStar',
      title: 'Double star',
      tell: 'Two stars sitting right next to each other.',
      body: 'Two stars that appear close together in the sky. Some are a true binary, genuinely orbiting each other, like Albireo in Cygnus; others just happen to lie in nearly the same direction from Earth, at very different real distances.',
    },
    {
      icon: 'satellites',
      title: 'Satellite trail',
      tell: 'Glides steadily in a straight line, no flashing lights.',
      body: 'A star-like point that glides steadily in a straight line for a few minutes, with no flashing lights.',
    },
    {
      icon: 'aircraft',
      title: 'Aircraft lights',
      tell: 'Flashing lights, unlike a satellite’s steady glide.',
      body: "Not an astronomical object at all — but it blinks with steady or flashing coloured lights, unlike a satellite's steady glide.",
    },
    {
      icon: 'milkyWay',
      title: 'The Milky Way',
      tell: 'A faint band across the sky, not one object.',
      body: "A faint, diffuse band of light arching across the sky on a dark, moonless night — the combined glow of billions of stars in our Galaxy's disc, seen edge-on from inside it. Dark lanes across it, like the Great Rift through Cygnus, are dust clouds blocking the light behind them. Needs a genuinely dark site: even moderate light pollution hides it completely.",
    },
  ];

  // The order shown in the tappable picture grid and the "Which is it?"
  // game: the Sun, Moon and ordinary stars first, then everything else a
  // beginner might mistake for one of those three. Shared with
  // src/nakedEyeSkyQuestions.js (its which-is-it-* questions quiz
  // exactly these 14 keys), rather than kept as a second copy here that
  // could drift from it.
  const PHENOMENA_GRID_ORDER = NakedEyeSkyQuestions.PHENOMENA_GRID_ORDER;

  // --- The phenomena picture grid, and its tap-to-open explanation card -
  // Real <button>s (keyboard/screen-reader friendly for free; see
  // notes/naked-eye-sky.html), each filled with the same PHENOMENA_ICONS
  // icon the flashcards use. Tapping one opens a single shared
  // .phenomena-card, inserted as a full-width row directly under the
  // tapped tile's own row (a CSS Grid item spanning every column lands
  // on its own row, breaking the grid there) rather than a glossary
  // definition appearing far below the whole grid — see
  // insertPhenomenonCardAfterRow. A phone instead gets it as a bottom
  // sheet fixed to the screen's bottom edge (see styles.css's own
  // @media rule on .phenomena-card) — same element, same JS, CSS alone
  // changes how it's presented.

  let openPhenomenonKey = null;

  function phenomenonCard(key) {
    return PHENOMENA_CARDS.find((c) => c.icon === key);
  }

  // The grid's own current column count, read back from its computed
  // style rather than assumed, so this still finds the right row
  // whatever width (and so column count) the page is actually at.
  function gridColumnCount(grid) {
    const tracks = getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).filter(Boolean);
    return tracks.length || 1;
  }

  function insertPhenomenonCardAfterRow(cardEl, key) {
    const grid = document.getElementById('phenomena-grid');
    const tiles = Array.from(grid.querySelectorAll('.phenomena-tile'));
    const tileIndex = tiles.findIndex((t) => t.dataset.key === key);
    const cols = gridColumnCount(grid);
    const rowEndIndex = Math.min(tiles.length - 1, tileIndex - (tileIndex % cols) + (cols - 1));
    const rowEndTile = tiles[rowEndIndex];
    if (rowEndTile.nextSibling) {
      grid.insertBefore(cardEl, rowEndTile.nextSibling);
    } else {
      grid.appendChild(cardEl);
    }
  }

  function closePhenomenonCard() {
    const existing = document.getElementById('phenomena-card');
    if (existing) existing.remove();
    if (openPhenomenonKey) {
      const tile = document.querySelector(`.phenomena-tile[data-key="${openPhenomenonKey}"]`);
      if (tile) {
        tile.classList.remove('is-selected');
        tile.setAttribute('aria-expanded', 'false');
      }
    }
    openPhenomenonKey = null;
  }

  // aria-live="polite" so a screen reader announces the new title/tell/
  // body when Previous or Next changes them, even though keyboard focus
  // deliberately stays on the Previous/Next button itself rather than
  // jumping every time (see openPhenomenonCard's `focus` option).
  function buildPhenomenonCard(key) {
    const card = phenomenonCard(key);
    const index = PHENOMENA_GRID_ORDER.indexOf(key);

    const root = document.createElement('div');
    root.className = 'phenomena-card';
    root.id = 'phenomena-card';
    root.setAttribute('role', 'region');
    root.setAttribute('aria-labelledby', 'phenomena-card-title');
    root.setAttribute('aria-live', 'polite');
    root.tabIndex = -1;

    const header = document.createElement('div');
    header.className = 'phenomena-card-header';
    const title = document.createElement('h3');
    title.className = 'phenomena-card-title';
    title.id = 'phenomena-card-title';
    title.textContent = card.title;
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'phenomena-card-close';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.textContent = '×';
    header.append(title, closeButton);

    const tell = document.createElement('p');
    tell.className = 'phenomena-card-tell';
    tell.textContent = card.tell;

    const body = document.createElement('p');
    body.className = 'phenomena-card-body';
    body.textContent = card.body;

    const nav = document.createElement('div');
    nav.className = 'phenomena-card-nav';
    const prevButton = document.createElement('button');
    prevButton.type = 'button';
    prevButton.className = 'secondary-button phenomena-card-prev';
    prevButton.textContent = 'Previous';
    prevButton.disabled = index === 0;
    const position = document.createElement('span');
    position.className = 'phenomena-card-position';
    position.textContent = `${index + 1} of ${PHENOMENA_GRID_ORDER.length}`;
    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.className = 'secondary-button phenomena-card-next';
    nextButton.textContent = 'Next';
    nextButton.disabled = index === PHENOMENA_GRID_ORDER.length - 1;
    nav.append(prevButton, position, nextButton);

    function returnFocusAndClose() {
      const tile = document.querySelector(`.phenomena-tile[data-key="${key}"]`);
      closePhenomenonCard();
      if (tile) tile.focus();
    }

    closeButton.addEventListener('click', returnFocusAndClose);
    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') returnFocusAndClose();
    });
    prevButton.addEventListener('click', () => {
      if (index > 0) openPhenomenonCard(PHENOMENA_GRID_ORDER[index - 1], { focus: 'prev' });
    });
    nextButton.addEventListener('click', () => {
      if (index < PHENOMENA_GRID_ORDER.length - 1) openPhenomenonCard(PHENOMENA_GRID_ORDER[index + 1], { focus: 'next' });
    });

    root.append(header, tell, body, nav);
    return root;
  }

  function openPhenomenonCard(key, options = {}) {
    if (openPhenomenonKey) {
      const previousTile = document.querySelector(`.phenomena-tile[data-key="${openPhenomenonKey}"]`);
      if (previousTile) {
        previousTile.classList.remove('is-selected');
        previousTile.setAttribute('aria-expanded', 'false');
      }
    }
    const existing = document.getElementById('phenomena-card');
    if (existing) existing.remove();

    const cardEl = buildPhenomenonCard(key);
    insertPhenomenonCardAfterRow(cardEl, key);
    openPhenomenonKey = key;

    const tile = document.querySelector(`.phenomena-tile[data-key="${key}"]`);
    tile.classList.add('is-selected');
    tile.setAttribute('aria-expanded', 'true');

    cardEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

    if (options.focus === 'prev') cardEl.querySelector('.phenomena-card-prev').focus();
    else if (options.focus === 'next') cardEl.querySelector('.phenomena-card-next').focus();
    else cardEl.focus();
  }

  function buildPhenomenaGrid() {
    const grid = document.getElementById('phenomena-grid');
    if (!grid) return;
    grid.querySelectorAll('.phenomena-tile').forEach((tile) => {
      const key = tile.dataset.key;
      const card = phenomenonCard(key);
      const artSvg = tile.querySelector('.phenomena-tile-art');
      const generated = PHENOMENA_ICONS[key]();
      while (generated.firstChild) artSvg.appendChild(generated.firstChild);
      tile.querySelector('.phenomena-tile-title').textContent = card.title;
      tile.querySelector('.phenomena-tile-tell').textContent = card.tell;
      tile.setAttribute('aria-label', `${card.title}: ${card.tell}`);
      tile.addEventListener('click', () => {
        if (openPhenomenonKey === key) {
          closePhenomenonCard();
          return;
        }
        openPhenomenonCard(key);
      });
    });
  }

  // --- "Which is it?" picture-tap game --------------------------------
  // A folded picture-quiz panel (see notes/naked-eye-sky.html): one
  // question at a time, a short clue (src/nakedEyeSkyQuestions.js's own
  // which-is-it-* questions), and six tappable pictures — the correct
  // one plus five random decoys — with feedback the instant one is
  // tapped, not after a separate "Check answer" button, so it isn't
  // built from quiz-ui.js's own renderQuestions/mount at all (see
  // quiz-ui.js's header comment on QuizUI.recordResult/
  // registerGroupSummary, added for exactly this). A full round steps
  // through all 14 questions, each picture correct exactly once, in a
  // freshly shuffled order every round.

  function shuffled(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // The correct picture plus five random decoys, in random order.
  function whichIsItOptions(correctKey) {
    const decoys = shuffled(PHENOMENA_GRID_ORDER.filter((key) => key !== correctKey)).slice(0, 5);
    return shuffled([correctKey, ...decoys]);
  }

  let whichIsItQuestions = [];
  let whichIsItRoundOrder = [];
  let whichIsItRoundIndex = 0;
  let whichIsItRoundCorrect = 0;

  function whichIsItQuestionFor(key) {
    return whichIsItQuestions.find((q) => q.correctKey === key);
  }

  function renderWhichIsItRound() {
    const container = document.getElementById('which-is-it-game');
    if (!container) return;
    container.innerHTML = '';

    if (whichIsItRoundIndex >= whichIsItRoundOrder.length) {
      const done = document.createElement('div');
      done.id = 'which-is-it-question';
      done.tabIndex = -1;
      const summary = document.createElement('p');
      summary.className = 'which-is-it-feedback';
      summary.setAttribute('aria-live', 'polite');
      summary.textContent = `Round complete: ${whichIsItRoundCorrect} out of ${whichIsItRoundOrder.length} correct.`;
      const again = document.createElement('button');
      again.type = 'button';
      again.className = 'secondary-button';
      again.textContent = 'Play again';
      again.addEventListener('click', startWhichIsItRound);
      done.append(summary, again);
      container.appendChild(done);
      done.focus();
      return;
    }

    const key = whichIsItRoundOrder[whichIsItRoundIndex];
    const question = whichIsItQuestionFor(key);
    const card = phenomenonCard(key);

    const wrap = document.createElement('div');
    wrap.id = 'which-is-it-question';
    wrap.tabIndex = -1;

    const progress = document.createElement('p');
    progress.className = 'which-is-it-progress';
    progress.textContent = `Question ${whichIsItRoundIndex + 1} of ${whichIsItRoundOrder.length}`;

    const clue = document.createElement('p');
    clue.className = 'which-is-it-clue';
    clue.textContent = `Which picture is this: "${question.prompt}"?`;

    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'which-is-it-options';
    optionsGrid.setAttribute('role', 'list');

    const feedback = document.createElement('p');
    feedback.className = 'which-is-it-feedback';
    feedback.setAttribute('aria-live', 'polite');

    const buttonsByKey = {};
    function answer(optionKey) {
      Object.values(buttonsByKey).forEach((b) => { b.disabled = true; });
      const result = question.check(optionKey);
      QuizUI.recordResult(question, result.correct);
      if (result.correct) whichIsItRoundCorrect += 1;
      buttonsByKey[optionKey].classList.add(result.correct ? 'is-correct' : 'is-incorrect');
      if (!result.correct) buttonsByKey[key].classList.add('is-correct');
      feedback.textContent = `${result.correct ? 'Correct! ' : 'Not quite. '}${card.title}: ${card.body}`;

      const next = document.createElement('button');
      next.type = 'button';
      next.className = 'secondary-button which-is-it-next';
      next.textContent = whichIsItRoundIndex + 1 < whichIsItRoundOrder.length ? 'Next question' : 'See round score';
      next.addEventListener('click', () => {
        whichIsItRoundIndex += 1;
        renderWhichIsItRound();
      });
      wrap.appendChild(next);
      next.focus();
    }

    whichIsItOptions(key).forEach((optionKey) => {
      const optionCard = phenomenonCard(optionKey);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'which-is-it-option';
      button.setAttribute('role', 'listitem');
      button.setAttribute('aria-label', optionCard.title);
      const art = PHENOMENA_ICONS[optionKey]();
      art.classList.add('which-is-it-option-art');
      art.setAttribute('aria-hidden', 'true');
      const title = document.createElement('span');
      title.className = 'which-is-it-option-title';
      title.textContent = optionCard.title;
      button.append(art, title);
      button.addEventListener('click', () => answer(optionKey));
      buttonsByKey[optionKey] = button;
      optionsGrid.appendChild(button);
    });

    wrap.append(progress, clue, optionsGrid, feedback);
    container.appendChild(wrap);
    wrap.focus();
  }

  function startWhichIsItRound() {
    whichIsItRoundOrder = shuffled(PHENOMENA_GRID_ORDER);
    whichIsItRoundIndex = 0;
    whichIsItRoundCorrect = 0;
    renderWhichIsItRound();
  }

  function setUpWhichIsItGame(questions) {
    whichIsItQuestions = questions;
    QuizUI.registerGroupSummary({
      questions,
      summaryEl: document.getElementById('which-is-it-quiz-summary'),
      label: 'Picture quiz: which is it?',
    });
    startWhichIsItRound();
  }

  // A small SVG of just one pattern's stars and lines, unlabelled — the
  // same real positions as its full pattern-card chart, cropped down to
  // flashcard size.
  function patternIcon(patternId) {
    const svg = iconSvg();
    const pattern = PATTERNS.find((p) => p.id === patternId);
    const stars = pattern.stars.map((key) => STARS[key]);
    const centre = StarPatterns.centreOf(stars);
    const flat = {};
    pattern.stars.forEach((key) => { flat[key] = StarPatterns.project(STARS[key], centre); });
    const toScreen = fitProjectedPoints(Object.values(flat), ICON_WIDTH, ICON_HEIGHT, 16);
    pattern.lines.forEach(([a, b]) => {
      const p = toScreen(flat[a]);
      const q = toScreen(flat[b]);
      svgEl('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y, stroke: SKY_LINE_COLOR, 'stroke-width': 1.5 }, svg);
    });
    pattern.stars.forEach((key) => {
      const p = toScreen(flat[key]);
      svgEl('circle', { cx: p.x, cy: p.y, r: starRadius(STARS[key].mag), fill: '#fdfcf5' }, svg);
    });
    return svg;
  }

  const PATTERN_CARDS = [
    { id: 'cassiopeia', body: 'Five stars in a distinctive W (or M), circumpolar from the UK.' },
    { id: 'orion', body: 'The Hunter — look for the three-star Belt.' },
    { id: 'cygnus', body: 'The Swan, flying down the Milky Way; its cross shape is also called the Northern Cross.' },
    { id: 'southernCross', body: 'Crux, the smallest of all 88 constellations — a kite-shaped cross too far south to see from the UK.' },
    { id: 'plough', body: "Part of Ursa Major. A seven-star 'saucepan'; its Pointers lead to Polaris." },
    { id: 'summerTriangle', body: 'Spans three constellations: Vega (Lyra), Deneb (Cygnus) and Altair (Aquila).' },
    { id: 'squareOfPegasus', body: 'Spans Pegasus and Andromeda. A large, near-empty square of four stars.' },
  ];

  // A generic "follow these two stars on to a target" glyph, rotated a
  // little differently per card just so a run of them doesn't look
  // identical — the direction isn't meant to match the real sky.
  function pointerIcon(rotationDeg) {
    const svg = iconSvg();
    const cx = ICON_WIDTH / 2;
    const cy = ICON_HEIGHT / 2;
    const group = svgEl('g', { transform: `rotate(${rotationDeg} ${cx} ${cy})` }, svg);
    svgEl('line', { x1: cx - 32, y1: cy, x2: cx - 8, y2: cy, stroke: '#8fa3c9', 'stroke-width': 2 }, group);
    svgEl('line', {
      x1: cx - 8, y1: cy, x2: cx + 32, y2: cy, stroke: '#f5a623', 'stroke-width': 2.5, 'stroke-dasharray': '5 4',
    }, group);
    svgEl('circle', { cx: cx - 32, cy, r: 3.5, fill: '#fdfcf5' }, group);
    svgEl('circle', { cx: cx - 8, cy, r: 3.5, fill: '#fdfcf5' }, group);
    svgEl('circle', { cx: cx + 32, cy, r: 6, fill: '#ffe9a8' }, group);
    return svg;
  }

  // Ratios are computed the same way fillFigures() computes them for the
  // page's own text, so a flashcard can never disagree with the page.
  function pointerCards() {
    const beltGap = StarPatterns.angularSeparation(STARS.mintaka, STARS.alnilam);
    const siriusRatio = Math.round(StarPatterns.angularSeparation(STARS.alnilam, STARS.sirius) / beltGap);
    const aldebaranRatio = Math.round(StarPatterns.angularSeparation(STARS.mintaka, STARS.aldebaran) / beltGap);
    const pleiadesRatio = Math.round(StarPatterns.angularSeparation(STARS.mintaka, STARS.alcyone) / beltGap);

    const pointerRatio = Math.round(StarPatterns.angularSeparation(STARS.dubhe, STARS.polaris) /
      StarPatterns.angularSeparation(STARS.merak, STARS.dubhe));

    const southPole = { ra: 0, dec: -90 };
    const cruxRatio = Math.round(StarPatterns.angularSeparation(STARS.acrux, southPole) /
      StarPatterns.angularSeparation(STARS.gacrux, STARS.acrux) * 2) / 2;

    const fomalhautGap = StarPatterns.angularSeparation(STARS.scheat, STARS.markab);
    const fomalhautRatio = Math.round(StarPatterns.angularSeparation(STARS.markab, STARS.fomalhaut) / fomalhautGap * 2) / 2;
    const andromedaGap = StarPatterns.angularSeparation(STARS.markab, STARS.alpheratz);
    const andromedaRatio = Math.round(StarPatterns.angularSeparation(STARS.alpheratz, STARS.andromedaGalaxy) / andromedaGap * 10) / 10;

    return [
      { title: 'Polaris', body: `Follow Merak through Dubhe (the Plough's Pointers) about ${pointerRatio}× their gap to find Polaris, and so due north.` },
      { title: 'The south celestial pole', body: `Follow Gacrux through Acrux (the Southern Cross's long axis) about ${cruxRatio}× its length to reach the south celestial pole.` },
      { title: 'Sirius', body: `Follow Mintaka through Alnilam (Orion's Belt) about ${siriusRatio}× their gap to reach Sirius, the brightest star in the sky.` },
      { title: 'Aldebaran', body: `Follow the Belt the other way, about ${aldebaranRatio}× the Mintaka-Alnilam gap, to reach orange Aldebaran.` },
      { title: 'The Pleiades', body: `Continue further along the same line, about ${pleiadesRatio}× the gap in total, to reach the Pleiades star cluster.` },
      { title: 'Fomalhaut', body: `Follow Scheat through Markab (the Square of Pegasus's western side) about ${fomalhautRatio}× their gap, continuing south, to reach Fomalhaut.` },
      { title: 'The Andromeda Galaxy', body: `Follow the diagonal from Markab through Alpheratz about ${andromedaRatio}× its length to reach the Andromeda Galaxy.` },
    ];
  }

  function buildFlashcards() {
    const container = document.getElementById('flashcard-deck');
    if (!container || typeof FlashCards === 'undefined') return;

    const phenomenaCards = PHENOMENA_CARDS.map((c) => ({
      id: `phenomenon-${c.icon}`,
      category: 'Naked-eye phenomena',
      front: PHENOMENA_ICONS[c.icon](),
      back: { title: c.title, body: c.body },
    }));

    const patternCards = PATTERN_CARDS.map((c) => {
      const pattern = PATTERNS.find((p) => p.id === c.id);
      return {
        id: `pattern-${c.id}`,
        category: pattern.kind === 'asterism' ? 'Asterism' : 'Constellation',
        front: patternIcon(c.id),
        back: { title: pattern.name, body: c.body },
      };
    });

    const pointerCardsData = pointerCards().map((c, i) => ({
      id: `pointer-${i}`,
      category: 'Pointer stars',
      front: pointerIcon((i * 47) % 360),
      back: { title: c.title, body: c.body },
    }));

    FlashCards.mount(container, [...phenomenaCards, ...patternCards, ...pointerCardsData]);
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

    const beltGap = StarPatterns.angularSeparation(STARS.mintaka, STARS.alnilam);
    const siriusRatio = StarPatterns.angularSeparation(STARS.alnilam, STARS.sirius) / beltGap;
    document.getElementById('sirius-ratio').textContent = String(Math.round(siriusRatio));
    const aldebaranRatio = StarPatterns.angularSeparation(STARS.mintaka, STARS.aldebaran) / beltGap;
    document.getElementById('aldebaran-ratio').textContent = String(Math.round(aldebaranRatio));
    const pleiadesRatio = StarPatterns.angularSeparation(STARS.mintaka, STARS.alcyone) / beltGap;
    document.getElementById('pleiades-ratio').textContent = String(Math.round(pleiadesRatio));

    const fomalhautGap = StarPatterns.angularSeparation(STARS.scheat, STARS.markab);
    const fomalhautRatio = StarPatterns.angularSeparation(STARS.markab, STARS.fomalhaut) / fomalhautGap;
    document.getElementById('fomalhaut-ratio').textContent = String(Math.round(fomalhautRatio * 2) / 2);
    const andromedaGap = StarPatterns.angularSeparation(STARS.markab, STARS.alpheratz);
    const andromedaRatio = StarPatterns.angularSeparation(STARS.alpheratz, STARS.andromedaGalaxy) / andromedaGap;
    document.getElementById('andromeda-ratio').textContent = String(Math.round(andromedaRatio * 10) / 10);
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
    patternKinds:
      'Cassiopeia, Orion, Cygnus and the Southern Cross are official constellations; the Plough, the Summer Triangle and the Square of Pegasus are asterisms — the Plough is part of the constellation Ursa Major, the Square is part of Pegasus and Andromeda, and the Summer Triangle spans three separate constellations altogether.',
  };

  buildPhenomenaGrid();
  document.querySelectorAll('.pattern-card').forEach(drawPatternChart);
  setUpPoleFinder();
  setUpMonthSlider();
  drawOrionHopDiagram();
  drawPegasusHopDiagram();
  buildFlashcards();
  fillFigures();
  renderCoverage();
  Glossary.init(GLOSSARY);
  const nakedEyeSkyQuestions = NakedEyeSkyQuestions.makeQuestions(StarPatterns, { renderPatternQuizDiagram });
  const patternQuizQuestions = nakedEyeSkyQuestions.filter((q) => q.id.startsWith('name-that-pattern-'));
  const whichIsItQuizQuestions = nakedEyeSkyQuestions.filter((q) => q.id.startsWith('which-is-it-'));
  const nakedEyeSkyTextQuestions = nakedEyeSkyQuestions.filter(
    (q) => !q.id.startsWith('name-that-pattern-') && !q.id.startsWith('which-is-it-')
  );
  QuizUI.mount(nakedEyeSkyTextQuestions);
  QuizUI.mountGroup({
    questions: patternQuizQuestions,
    listElementId: 'pattern-quiz-list',
    summaryElementId: 'pattern-quiz-summary',
    label: 'Picture quiz: name that pattern',
  });
  setUpWhichIsItGame(whichIsItQuizQuestions);
})();
