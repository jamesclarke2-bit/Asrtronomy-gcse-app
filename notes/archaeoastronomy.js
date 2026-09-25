(function () {
  const CURRICULUM_UNITS = ['u3.5'];
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const RAD = Math.PI / 180;
  const M = MeasuringTheSky;
  const { STARS, angularSeparation } = StarPatterns;

  const SKY_LINE_COLOR = '#6f8fb8';
  const STONE_COLOR = '#9aa5b5';
  const SUN_COLOR = '#ffcf5c';

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

  function formatSep(deg) {
    return deg < 1 ? `${deg.toFixed(1)}°` : `${Math.round(deg)}°`;
  }

  // --- The pole then and now: Thuban's era and today ----------------------

  const PYRAMID_YEAR = -2560; // astronomical year numbering: -2560 = 2561 BCE, close enough
  const CURRENT_YEAR = 2026;

  const POLE_DIAGRAM = { W: 320, H: 320, cx: 160, cy: 160, degToUnits: 4.6 };

  // Same projection as measuring-the-sky.js's precession diagram: looking
  // up at the northern sky, centred on the ecliptic pole, distance from it
  // true to scale.
  function eclipticPolarView(eq) {
    const { lon, lat } = M.equatorialToEcliptic(eq);
    const { cx, cy, degToUnits } = POLE_DIAGRAM;
    const r = (90 - lat) * degToUnits;
    const a = (lon - 90) * RAD;
    return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
  }

  function poleViewAt(year) {
    return eclipticPolarView(M.celestialPoleAt(year));
  }

  function drawPoleThenNowDiagram() {
    const svg = document.getElementById('pole-then-now-diagram');
    const wrap = document.getElementById('pole-then-now-wrap');
    if (!svg || !wrap) return;
    const { W, H, cx, cy, degToUnits } = POLE_DIAGRAM;

    svgEl('rect', { x: 0, y: 0, width: W, height: H, rx: 8, fill: '#10141f' }, svg);
    svgEl('circle', { cx, cy, r: M.OBLIQUITY_DEG * degToUnits, fill: 'none', stroke: SKY_LINE_COLOR, 'stroke-width': 1.5, 'stroke-dasharray': '6 5' }, svg);
    svgEl('circle', { cx, cy, r: 2.5, fill: SKY_LINE_COLOR }, svg);
    addLabel(wrap, cx, cy - 14, W, H, 'Ecliptic pole', 'star-label finder-pattern-label');

    // The stretch of the pole's own path actually travelled since the
    // Great Pyramid was built, sampled as a polyline rather than an SVG
    // arc so the maths never has to work out which way it sweeps.
    const steps = 24;
    const points = [];
    for (let i = 0; i <= steps; i += 1) {
      const year = PYRAMID_YEAR + ((CURRENT_YEAR - PYRAMID_YEAR) * i) / steps;
      const p = poleViewAt(year);
      points.push(`${p.x},${p.y}`);
    }
    svgEl('polyline', { points: points.join(' '), fill: 'none', stroke: '#f5a623', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, svg);

    // Thuban and Polaris, in their real positions.
    ['thuban', 'polaris'].forEach((key) => {
      const star = STARS[key];
      const p = eclipticPolarView(star);
      svgEl('circle', { cx: p.x, cy: p.y, r: Math.max(2, 5.2 - 1.05 * star.mag), fill: '#fdfcf5' }, svg);
      const dx = p.x - cx;
      const dy = p.y - cy;
      const d = Math.hypot(dx, dy);
      addLabel(wrap, p.x + (dx / d) * 16, p.y + (dy / d) * 16, W, H, star.name, 'star-label');
    });

    // The pole's own position at each end of the highlighted stretch.
    [[PYRAMID_YEAR, 'Pole, ~2560 BCE'], [CURRENT_YEAR, 'Pole, today']].forEach(([year, text]) => {
      const p = poleViewAt(year);
      svgEl('circle', { cx: p.x, cy: p.y, r: 7, fill: 'none', stroke: '#ffe9a8', 'stroke-width': 2 }, svg);
      const dx = cx - p.x;
      const dy = cy - p.y;
      const d = Math.hypot(dx, dy) || 1;
      const label = addLabel(wrap, p.x - (dx / d) * 26, p.y - (dy / d) * 26, W, H, text, 'star-label finder-polaris-label');
      // Long labels near the canvas's right edge (Thuban's marker, close
      // to the ecliptic pole's 90° longitude) would otherwise overrun it.
      if (p.x > cx) label.dataset.side = 'left';
    });
  }

  function fillPoleFigures() {
    const pyramidPole = M.celestialPoleAt(PYRAMID_YEAR);
    const nowPole = M.celestialPoleAt(CURRENT_YEAR);
    document.getElementById('thuban-then-sep').textContent = formatSep(angularSeparation(pyramidPole, STARS.thuban));
    document.getElementById('polaris-then-sep').textContent = formatSep(angularSeparation(pyramidPole, STARS.polaris));
    document.getElementById('polaris-now-sep').textContent = formatSep(angularSeparation(nowPole, STARS.polaris));
    document.getElementById('thuban-now-sep').textContent = formatSep(angularSeparation(nowPole, STARS.thuban));
  }

  // --- Stonehenge: a schematic top-down plan -------------------------------

  function drawStonehengeDiagram() {
    const svg = document.getElementById('stonehenge-diagram');
    const wrap = document.getElementById('stonehenge-wrap');
    if (!svg || !wrap) return;
    const W = 320;
    const H = 320;
    const cx = W / 2;
    const cy = H / 2;
    const ringRadius = 78;
    const axisAngle = -55; // degrees from straight up, towards the north-east

    svgEl('rect', { x: 0, y: 0, width: W, height: H, rx: 8, fill: '#10141f' }, svg);

    // The sarsen circle: a ring of evenly-spaced stones.
    const stoneCount = 16;
    for (let i = 0; i < stoneCount; i += 1) {
      const angle = (i / stoneCount) * 360 * RAD;
      const x = cx + ringRadius * Math.sin(angle);
      const y = cy - ringRadius * Math.cos(angle);
      svgEl('rect', { x: x - 5, y: y - 5, width: 10, height: 10, rx: 2, fill: STONE_COLOR, transform: `rotate(${angle / RAD} ${x} ${y})` }, svg);
    }
    // The great trilithon, facing the winter-sunset end of the axis.
    const trilithonAngle = (axisAngle + 180) * RAD;
    const tx = cx + ringRadius * Math.sin(trilithonAngle);
    const ty = cy - ringRadius * Math.cos(trilithonAngle);
    svgEl('rect', { x: tx - 9, y: ty - 9, width: 18, height: 18, rx: 2, fill: '#c9cfda', transform: `rotate(${trilithonAngle / RAD} ${tx} ${ty})` }, svg);

    // The axis itself, from the winter-sunset side, through the centre, out
    // past the ring to the Heel Stone and on to the horizon.
    const a = axisAngle * RAD;
    const ux = Math.sin(a);
    const uy = -Math.cos(a);
    const axisLine = svgEl('g', { stroke: '#f5a623', 'stroke-width': 2, 'stroke-dasharray': '6 5' }, svg);
    svgEl('line', { x1: cx - ux * ringRadius, y1: cy - uy * ringRadius, x2: cx + ux * 140, y2: cy + uy * 140 }, axisLine);

    // The Heel Stone, outside the ring along the sunrise direction.
    const heelX = cx + ux * 108;
    const heelY = cy + uy * 108;
    svgEl('circle', { cx: heelX, cy: heelY, r: 6, fill: STONE_COLOR }, svg);
    addLabel(wrap, heelX, heelY - 16, W, H, 'Heel Stone', 'star-label');

    // A simple sun glyph at the midsummer sunrise end of the axis. Both
    // ends of the axis sit near a side of the canvas, so their labels are
    // anchored to grow inward rather than centred (which would overrun
    // the edge).
    const sunX = cx + ux * 140;
    const sunY = cy + uy * 140;
    svgEl('circle', { cx: sunX, cy: sunY, r: 10, fill: SUN_COLOR }, svg);
    const sunriseLabel = addLabel(wrap, sunX, sunY - 20, W, H, 'Midsummer sunrise', 'star-label finder-polaris-label');
    sunriseLabel.dataset.side = sunX < cx ? 'right' : 'left';
    const sunsetLabel = addLabel(wrap, cx - ux * 140, cy - uy * 140 + 8, W, H, 'Midwinter sunset', 'star-label finder-pattern-label');
    sunsetLabel.dataset.side = (cx - ux * 140) < cx ? 'right' : 'left';
  }

  // --- The Great Pyramid: a schematic cross-section ------------------------

  function drawPyramidShaftDiagram() {
    const svg = document.getElementById('pyramid-shaft-diagram');
    const wrap = document.getElementById('pyramid-shaft-wrap');
    if (!svg || !wrap) return;
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

    // The King's Chamber, roughly a third of the way up.
    const chamberY = baseY - (baseY - apexY) * 0.42;
    const chamberHalfWidth = 26;
    svgEl('rect', { x: apexX - chamberHalfWidth, y: chamberY - 10, width: chamberHalfWidth * 2, height: 20, fill: '#10141f', stroke: '#cdd7e1', 'stroke-width': 1.5 }, svg);
    addLabel(wrap, apexX, chamberY, W, H, "King's Chamber", 'star-label');

    // The northern shaft (towards Thuban, then near the pole) and the
    // southern shaft (towards Orion's Belt at its lowest crossing).
    const shafts = svgEl('g', { stroke: '#f5a623', 'stroke-width': 2.5 }, svg);
    const north = { x1: apexX - chamberHalfWidth, y1: chamberY - 4, angleDeg: 33 };
    const south = { x1: apexX + chamberHalfWidth, y1: chamberY - 4, angleDeg: 45 };
    [north, south].forEach((shaft, i) => {
      const dir = i === 0 ? -1 : 1;
      const run = 150;
      const x2 = shaft.x1 + dir * run * Math.cos(shaft.angleDeg * RAD);
      const y2 = shaft.y1 - run * Math.sin(shaft.angleDeg * RAD);
      svgEl('line', { x1: shaft.x1, y1: shaft.y1, x2, y2 }, shafts);
    });

    // Both shafts' labels sit near the top corners, so each is anchored to
    // grow back in towards the middle rather than centred on its point.
    const northLabel = addLabel(wrap, apexX - chamberHalfWidth - 70, chamberY - 70, W, H, 'North shaft → Thuban, then', 'star-label finder-polaris-label');
    northLabel.dataset.side = 'right';
    const southLabel = addLabel(wrap, apexX + chamberHalfWidth + 60, chamberY - 92, W, H, "South shaft → Orion's Belt, then", 'star-label finder-polaris-label');
    southLabel.dataset.side = 'left';
  }

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    precession:
      "Precession: the slow, roughly 26,000-year circling of the direction Earth's rotation axis points, caused by the Sun's and Moon's gravity acting on Earth's equatorial bulge. The tilt itself barely changes; only its direction in space does.",
  };

  drawPoleThenNowDiagram();
  drawStonehengeDiagram();
  drawPyramidShaftDiagram();
  fillPoleFigures();
  renderCoverage();
  Glossary.init(GLOSSARY);
})();
