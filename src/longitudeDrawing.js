/**
 * The drawings for notes/finding-longitude.html, shared with its picture
 * questions (src/longitudeQuestions.js): the Earth from above the North
 * Pole with a Greenwich clock, the Moon moving against the stars, two
 * clocks drifting over a voyage, and a timeline. Labels and line styles,
 * never colour alone, tell things apart.
 */
(function () {
  const L = window.Longitude;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, CURVE, svgEl, clearDiagram, addLabel, panel } = D;
  const GRID = '#2a3550';
  const SEA = '#2f6fb3';

  function arrowHead(svg, x, y, angle, colour) {
    const s = 10;
    svgEl('path', {
      d: `M${(x - s * Math.cos(angle - 0.45)).toFixed(1)},${(y - s * Math.sin(angle - 0.45)).toFixed(1)} L${x.toFixed(1)},${y.toFixed(1)} L${(x - s * Math.cos(angle + 0.45)).toFixed(1)},${(y - s * Math.sin(angle + 0.45)).toFixed(1)}`,
      fill: 'none',
      stroke: colour || CURVE,
      'stroke-width': 2,
    }, svg);
  }

  // ------------------------------------------------------------------
  // The problem: the Earth from above the North Pole, and a Greenwich clock
  // ------------------------------------------------------------------
  function drawGlobe(svg, wrap, greenwichMinutes) {
    clearDiagram(svg, wrap);
    panel(svg);
    const cx = 160;
    const cy = 175;
    const R = 112;
    const result = L.longitudeFromNoon(greenwichMinutes);
    // Sunlight from the right.
    [-80, 80].forEach((dy) => {
      svgEl('line', { x1: 345, x2: 312, y1: cy + dy, y2: cy + dy, stroke: CURVE, 'stroke-width': 2 }, svg);
      arrowHead(svg, 312, cy + dy, Math.PI);
    });
    addLabel(svg, wrap, 'sunlight', 330, cy + 112, 'diagram-label--tick');
    // Night side (left half) and day side (right half).
    svgEl('circle', { cx, cy, r: R, fill: SEA, stroke: INK, 'stroke-width': 2 }, svg);
    svgEl('path', { d: `M${cx},${cy - R} A${R},${R} 0 0 0 ${cx},${cy + R} Z`, fill: '#05070d', opacity: 0.55 }, svg);
    svgEl('circle', { cx, cy, r: 4, fill: INK }, svg);
    addLabel(svg, wrap, 'North Pole', cx - 50, cy + 26, 'diagram-label--tick');
    addLabel(svg, wrap, 'night', cx - 62, cy - 50, 'diagram-label--tick');
    // The ship's meridian points at the Sun: local noon.
    svgEl('line', { class: 'lg-ship-meridian', x1: cx, y1: cy, x2: cx + R, y2: cy, stroke: INK, 'stroke-width': 3 }, svg);
    svgEl('path', { class: 'lg-ship', d: `M${cx + R - 18},${cy - 6} l14,0 l-3,8 l-8,0 Z`, fill: INK }, svg);
    addLabel(svg, wrap, 'ship (noon)', cx + R + 10, cy, 'diagram-label--tick diagram-label--strong diagram-label--right');
    // Greenwich has turned past the Sun by the longitude (the Earth turns
    // anticlockwise seen from above the North Pole).
    const signed = result.direction === 'W' ? result.degrees : -result.degrees;
    const a = (signed * Math.PI) / 180;
    const gx = cx + R * Math.cos(a);
    const gy = cy - R * Math.sin(a);
    svgEl('line', { class: 'lg-greenwich-meridian', x1: cx, y1: cy, x2: gx, y2: gy, stroke: CURVE, 'stroke-width': 3, 'stroke-dasharray': '7 5' }, svg);
    const lx = Math.min(Math.max(cx + (R + 26) * Math.cos(a), 110), 300);
    const ly = Math.abs(signed) < 30 ? cy - (signed >= 0 ? 62 : -62) : cy - (R + 22) * Math.sin(a);
    addLabel(svg, wrap, 'Greenwich (dashed)', lx, ly, 'diagram-label--tick diagram-label--strong');
    if (result.degrees > 0.01) {
      const r2 = 46;
      svgEl('path', { class: 'lg-angle', d: `M${cx + r2},${cy} A${r2},${r2} 0 0 ${signed > 0 ? 0 : 1} ${cx + r2 * Math.cos(a)},${cy - r2 * Math.sin(a)}`, fill: 'none', stroke: CURVE, 'stroke-width': 2 }, svg);
      if (result.degrees >= 8) addLabel(svg, wrap, `${+result.degrees.toFixed(1)}°`, cx + 70 * Math.cos(a / 2), cy - 70 * Math.sin(a / 2), 'diagram-label--tick diagram-label--strong');
    }
    // Right: the Greenwich clock.
    const kx = 515;
    const ky = 150;
    const kr = 70;
    svgEl('circle', { cx: kx, cy: ky, r: kr, fill: '#f4f6ff', stroke: INK, 'stroke-width': 3 }, svg);
    for (let h = 0; h < 12; h += 1) {
      const t = (h / 12) * 2 * Math.PI;
      svgEl('line', { x1: kx + (kr - 10) * Math.sin(t), y1: ky - (kr - 10) * Math.cos(t), x2: kx + (kr - 3) * Math.sin(t), y2: ky - (kr - 3) * Math.cos(t), stroke: '#1b2438', 'stroke-width': h % 3 === 0 ? 3 : 1.5 }, svg);
    }
    const mins = ((greenwichMinutes % 1440) + 1440) % 1440;
    const hourA = (((mins / 60) % 12) / 12) * 2 * Math.PI;
    const minA = ((mins % 60) / 60) * 2 * Math.PI;
    svgEl('line', { class: 'lg-hour-hand', x1: kx, y1: ky, x2: kx + 36 * Math.sin(hourA), y2: ky - 36 * Math.cos(hourA), stroke: '#1b2438', 'stroke-width': 5, 'stroke-linecap': 'round' }, svg);
    svgEl('line', { class: 'lg-minute-hand', x1: kx, y1: ky, x2: kx + 56 * Math.sin(minA), y2: ky - 56 * Math.cos(minA), stroke: '#1b2438', 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
    svgEl('circle', { cx: kx, cy: ky, r: 4, fill: '#1b2438' }, svg);
    addLabel(svg, wrap, 'Greenwich clock', kx, ky - kr - 22, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, `reads ${L.formatClock(greenwichMinutes)}`, kx, ky + kr + 22, 'diagram-label--tick diagram-label--strong');
    const lonText = result.direction ? `ship: ${+result.degrees.toFixed(1)}° ${result.direction}` : 'ship: 0°';
    addLabel(svg, wrap, lonText, kx, ky + kr + 54, 'diagram-label--tick');
  }

  // ------------------------------------------------------------------
  // 4.20 Lunar distance: the Moon moving against the stars
  // ------------------------------------------------------------------
  const BG_STARS = [[120, 70], [190, 205], [260, 95], [330, 230], [400, 60], [455, 190], [520, 110], [585, 220], [610, 80], [150, 240], [360, 150]];

  function drawLunar(svg, wrap, hours, options) {
    const opts = options || {};
    clearDiagram(svg, wrap);
    panel(svg);
    svgEl('rect', { x: 20, y: 30, width: 600, height: 230, rx: 8, fill: '#05070d' }, svg);
    BG_STARS.forEach(([x, y]) => svgEl('circle', { cx: x, cy: y, r: 1.6, fill: MUTED }, svg));
    const sx = 70;
    const y = 150;
    // Zoomed in: 60 units per degree from 34° to 40°, with a break between
    // the star and the zoomed part (the star is really much further away).
    const X = (deg) => 220 + (deg - 34) * 60;
    // The reference star.
    svgEl('path', { class: 'lg-ref-star', d: `M${sx},${y - 12} L${sx + 4},${y - 4} L${sx + 12},${y} L${sx + 4},${y + 4} L${sx},${y + 12} L${sx - 4},${y + 4} L${sx - 12},${y} L${sx - 4},${y - 4} Z`, fill: INK }, svg);
    addLabel(svg, wrap, 'a bright star', sx + 14, y + 34, 'diagram-label--tick diagram-label--strong');
    // Where the Moon is at each time in the table: faint outlines.
    if (!opts.hideTable) {
      L.TABLE_HOURS.forEach((h, i) => {
        const x = X(L.lunarDistance(h));
        svgEl('circle', { class: 'lg-moon-ghost', cx: x, cy: y, r: 14, fill: 'none', stroke: MUTED, 'stroke-width': 1, 'stroke-dasharray': '3 3' }, svg);
        addLabel(svg, wrap, L.formatClock(h * 60), x, i % 2 ? y + 32 : y - 32, 'diagram-label--tick');
      });
    }
    // The Moon now, and the measured angle, with a break mark: not to scale.
    const d = L.lunarDistance(hours);
    const mx = X(d);
    const by = y - 66;
    svgEl('line', { class: 'lg-distance-line', x1: sx, x2: 135, y1: by, y2: by, stroke: CURVE, 'stroke-width': 2 }, svg);
    svgEl('path', { d: `M135,${by} l6,-8 l6,16 l6,-8`, fill: 'none', stroke: CURVE, 'stroke-width': 2 }, svg);
    svgEl('line', { class: 'lg-distance-line', x1: 153, x2: mx, y1: by, y2: by, stroke: CURVE, 'stroke-width': 2 }, svg);
    svgEl('line', { x1: sx, x2: sx, y1: by - 10, y2: by + 10, stroke: CURVE, 'stroke-width': 2 }, svg);
    svgEl('line', { x1: mx, x2: mx, y1: by - 10, y2: by + 10, stroke: CURVE, 'stroke-width': 2 }, svg);
    svgEl('circle', { class: 'lg-moon', cx: mx, cy: y, r: 14, fill: '#e8e8e0', stroke: INK, 'stroke-width': 1.5 }, svg);
    addLabel(svg, wrap, opts.hideTable ? `${d}°` : `lunar distance: ${d}°`, 330, by - 24, 'diagram-label--tick diagram-label--strong');
    if (!opts.hideTable) {
      addLabel(svg, wrap, 'Moon', mx, y + 72, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'dashed rings: the Moon at the table times', 320, 284, 'diagram-label--tick');
    }
  }

  // ------------------------------------------------------------------
  // 4.21 Two clocks over a voyage
  // ------------------------------------------------------------------
  const MAX_DAYS = 60;
  const MAX_ERR_MIN = 60;

  function drawClocks(svg, wrap, days) {
    clearDiagram(svg, wrap);
    panel(svg);
    const x0 = 80;
    const x1 = 560;
    const yTop = 60;
    const yBottom = 270;
    const X = (d) => x0 + (d / MAX_DAYS) * (x1 - x0);
    const Y = (m) => yBottom - (Math.min(m, MAX_ERR_MIN) / MAX_ERR_MIN) * (yBottom - yTop);
    for (let d = 0; d <= MAX_DAYS; d += 10) {
      svgEl('line', { x1: X(d), x2: X(d), y1: yTop, y2: yBottom, stroke: GRID, 'stroke-width': 1 }, svg);
      addLabel(svg, wrap, String(d), X(d), yBottom + 14, 'diagram-label--tick');
    }
    for (let m = 0; m <= MAX_ERR_MIN; m += 20) {
      svgEl('line', { x1: x0, x2: x1, y1: Y(m), y2: Y(m), stroke: GRID, 'stroke-width': 1 }, svg);
      addLabel(svg, wrap, String(m), x0 - 8, Y(m), 'diagram-label--tick diagram-label--left');
      if (m > 0) addLabel(svg, wrap, String(L.longitudeErrorDeg(m)), x1 + 8, Y(m), 'diagram-label--tick diagram-label--right');
    }
    svgEl('line', { class: 'lg-prize-line', x1: x0, x2: x1, y1: Y(2), y2: Y(2), stroke: INK, 'stroke-width': 1.5, 'stroke-dasharray': '2 4' }, svg);
    svgEl('line', { class: 'lg-ordinary-line', x1: X(0), x2: X(MAX_DAYS), y1: Y(0), y2: Y(L.clockErrorMinutes('ordinary', MAX_DAYS)), stroke: MUTED, 'stroke-width': 2.5, 'stroke-dasharray': '9 6' }, svg);
    svgEl('line', { class: 'lg-h4-line', x1: X(0), x2: X(MAX_DAYS), y1: Y(0), y2: Y(L.clockErrorMinutes('h4', MAX_DAYS)), stroke: CURVE, 'stroke-width': 3.5 }, svg);
    svgEl('line', { class: 'lg-days-now', x1: X(days), x2: X(days), y1: yTop, y2: yBottom, stroke: INK, 'stroke-width': 1.5 }, svg);
    svgEl('circle', { class: 'lg-ordinary-now', cx: X(days), cy: Y(L.clockErrorMinutes('ordinary', days)), r: 6, fill: MUTED, stroke: INK, 'stroke-width': 1.5 }, svg);
    svgEl('rect', { class: 'lg-h4-now', x: X(days) - 6, y: Y(L.clockErrorMinutes('h4', days)) - 6, width: 12, height: 12, fill: CURVE, stroke: INK, 'stroke-width': 1.5 }, svg);
    addLabel(svg, wrap, 'ordinary clock (dashed)', X(36), Y(46), 'diagram-label--tick diagram-label--strong diagram-label--left');
    addLabel(svg, wrap, 'H4 (solid, almost flat)', X(16), Y(22), 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'prize limit: 2 minutes (dotted)', X(44), Y(2) - 18, 'diagram-label--tick diagram-label--left');
    addLabel(svg, wrap, 'Time at sea (days)', (x0 + x1) / 2, yBottom + 44, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'Clock error (minutes)', 12, 30, 'diagram-label--tick diagram-label--strong diagram-label--right');
    addLabel(svg, wrap, 'Longitude error (°)', 628, 30, 'diagram-label--tick diagram-label--strong diagram-label--left');
  }

  // ------------------------------------------------------------------
  // A timeline of the longitude problem
  // ------------------------------------------------------------------
  const EVENTS = [
    { year: 1714, text: 'Longitude Act: a prize offered' },
    { year: 1761, text: "H4's trial voyage to Jamaica" },
    { year: 1767, text: 'First Nautical Almanac (lunar tables)' },
    { year: 1773, text: 'Harrison given his prize money' },
  ];

  function drawTimeline(svg, wrap) {
    clearDiagram(svg, wrap);
    panel(svg);
    const x = 70;
    const rowY = (i) => 50 + 62 * i;
    svgEl('line', { x1: x, x2: x, y1: 30, y2: rowY(EVENTS.length - 1) + 24, stroke: INK, 'stroke-width': 2 }, svg);
    EVENTS.forEach((e, i) => {
      svgEl('circle', { class: 'lg-event', cx: x, cy: rowY(i), r: 7, fill: CURVE, stroke: INK, 'stroke-width': 1.5 }, svg);
      addLabel(svg, wrap, String(e.year), x - 18, rowY(i), 'diagram-label--tick diagram-label--strong diagram-label--left');
      addLabel(svg, wrap, e.text, x + 20, rowY(i), 'diagram-label--tick diagram-label--right');
    });
  }

  window.LongitudeDrawing = { drawGlobe, drawLunar, drawClocks, drawTimeline, EVENTS, MAX_DAYS };
})();
