/**
 * The drawings for notes/gravity-forming-bodies.html, shared with its
 * picture questions (src/gravityBodiesQuestions.js): each function draws
 * into an <svg> and places its labels in the surrounding
 * .labelled-diagram-wrap, using src/spectrumDrawing.js's helpers. Shapes
 * and labels, never colour alone, tell things apart.
 */
(function () {
  const G = window.GravityBodies;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, CURVE, svgEl, clearDiagram, addLabel, panel } = D;
  const GRID = '#2a3550';
  const ROCK = '#9aa7bd';

  function sun(svg, cx, cy, r) {
    if (window.SunIcon) window.SunIcon.appendSunSvg(svg, cx, cy, r, { coronaScale: 1.5 });
    else svgEl('circle', { cx, cy, r, fill: CURVE }, svg);
  }

  // A small shape marker: circle, square, triangle or diamond.
  function marker(svg, shape, x, y, size, attrs) {
    const a = { fill: INK, stroke: INK, 'stroke-width': 1.5, ...attrs };
    if (shape === 'square') return svgEl('rect', { x: x - size, y: y - size, width: 2 * size, height: 2 * size, ...a }, svg);
    if (shape === 'triangle') return svgEl('path', { d: `M${x},${y - size * 1.2} L${x + size * 1.1},${y + size * 0.8} L${x - size * 1.1},${y + size * 0.8} Z`, ...a }, svg);
    if (shape === 'diamond') return svgEl('path', { d: `M${x},${y - size * 1.3} L${x + size},${y} L${x},${y + size * 1.3} L${x - size},${y} Z`, ...a }, svg);
    return svgEl('circle', { cx: x, cy: y, r: size, ...a }, svg);
  }

  function arrowHead(svg, x, y, angle, attrs) {
    const s = 9;
    const p1 = [x - s * Math.cos(angle - 0.45), y - s * Math.sin(angle - 0.45)];
    const p2 = [x - s * Math.cos(angle + 0.45), y - s * Math.sin(angle + 0.45)];
    svgEl('path', { d: `M${p1[0].toFixed(1)},${p1[1].toFixed(1)} L${x.toFixed(1)},${y.toFixed(1)} L${p2[0].toFixed(1)},${p2[1].toFixed(1)}`, fill: 'none', stroke: CURVE, 'stroke-width': 2, ...attrs }, svg);
  }

  function arrow(svg, x1, y1, x2, y2, attrs) {
    svgEl('line', { x1, y1, x2, y2, stroke: CURVE, 'stroke-width': 2, ...attrs }, svg);
    arrowHead(svg, x2, y2, Math.atan2(y2 - y1, x2 - x1), attrs);
  }

  // A Moon phase icon: 'new', 'first', 'full', 'last'.
  function phaseIcon(svg, phase, x, y, r) {
    svgEl('circle', { cx: x, cy: y, r, fill: GRID, stroke: MUTED, 'stroke-width': 1.5 }, svg);
    if (phase === 'full') svgEl('circle', { cx: x, cy: y, r, fill: INK }, svg);
    if (phase === 'first') svgEl('path', { d: `M${x},${y - r} A${r},${r} 0 0 1 ${x},${y + r} Z`, fill: INK }, svg);
    if (phase === 'last') svgEl('path', { d: `M${x},${y - r} A${r},${r} 0 0 0 ${x},${y + r} Z`, fill: INK }, svg);
  }

  // ------------------------------------------------------------------
  // 12.1a Regular motion: the inner planets, and the Moon's phases
  // ------------------------------------------------------------------
  function drawRegular(svg, wrap) {
    clearDiagram(svg, wrap);
    panel(svg);
    const cx = 175;
    const cy = 185;
    const scale = (au) => 45 + 72 * au;
    const SHAPES = ['circle', 'square', 'triangle', 'diamond'];
    sun(svg, cx, cy, 18);
    addLabel(svg, wrap, 'Sun', cx, cy + 34, 'diagram-label--tick diagram-label--strong');
    G.INNER_PLANETS.forEach((p, i) => {
      const r = scale(p.distanceAU);
      svgEl('circle', { class: 'gb-orbit', cx, cy, r, fill: 'none', stroke: MUTED, 'stroke-width': 1.2, 'stroke-dasharray': '4 4' }, svg);
      const ang = (-60 - 38 * i) * (Math.PI / 180);
      const x = cx + r * Math.cos(ang);
      const y = cy + r * Math.sin(ang);
      marker(svg, SHAPES[i], x, y, 6, { class: `gb-planet gb-planet-${p.name.toLowerCase()}` });
      // A short arrow along the orbit, showing the direction of travel.
      const a2 = ang - 0.32;
      arrowHead(svg, cx + r * Math.cos(a2), cy + r * Math.sin(a2), a2 - Math.PI / 2);
    });
    const kx = 380;
    addLabel(svg, wrap, 'Same time, every orbit:', kx, 40, 'diagram-label--tick diagram-label--strong diagram-label--right');
    G.INNER_PLANETS.forEach((p, i) => {
      const y = 78 + 32 * i;
      marker(svg, SHAPES[i], kx + 8, y, 6, {});
      addLabel(svg, wrap, `${p.name}: ${p.periodYears} ${p.periodYears === 1 ? 'year' : 'years'}`, kx + 24, y, 'diagram-label--tick diagram-label--right');
    });
    const phases = ['new', 'first', 'full', 'last', 'new'];
    phases.forEach((ph, i) => {
      const x = 400 + 50 * i;
      phaseIcon(svg, ph, x, 236, 14);
      if (i < phases.length - 1) arrow(svg, x + 18, 236, x + 32, 236, { 'stroke-width': 1.5 });
    });
    addLabel(svg, wrap, "Moon's phases repeat", 500, 282, 'diagram-label--tick');
    addLabel(svg, wrap, `every ${G.MOON_PHASE_CYCLE_DAYS} days`, 500, 314, 'diagram-label--tick');
  }

  // ------------------------------------------------------------------
  // 12.1c Lagrange points of the Sun and the Earth
  // ------------------------------------------------------------------
  function drawLagrange(svg, wrap, options) {
    const opts = options || {};
    clearDiagram(svg, wrap);
    panel(svg);
    const cx = 300;
    const cy = 210;
    const R = 150;
    const at = (p) => ({ x: cx + p.r * R * Math.cos((p.angleDeg * Math.PI) / 180), y: cy - p.r * R * Math.sin((p.angleDeg * Math.PI) / 180) });
    svgEl('circle', { class: 'gb-earth-orbit', cx, cy, r: R, fill: 'none', stroke: MUTED, 'stroke-width': 1.2, 'stroke-dasharray': '5 5' }, svg);
    sun(svg, cx, cy, 22);
    addLabel(svg, wrap, 'Sun', cx, cy + 40, 'diagram-label--tick diagram-label--strong');
    const ex = cx + R;
    svgEl('circle', { class: 'gb-earth', cx: ex, cy, r: 9, fill: '#7fb2ff', stroke: INK, 'stroke-width': 1.5 }, svg);
    addLabel(svg, wrap, 'Earth', ex, cy + 30, 'diagram-label--tick diagram-label--strong');
    // Direction of the Earth's orbit: an arrowhead just ahead of the Earth.
    const a = 0.22;
    arrowHead(svg, cx + R * Math.cos(a), cy - R * Math.sin(a), -a - Math.PI / 2);
    addLabel(svg, wrap, "Earth's orbit (dashed)", cx - R * 0.7, cy + R * 0.71 + 26, 'diagram-label--tick');
    G.LAGRANGE_POINTS.forEach((p) => {
      const pos = at(G.LAGRANGE_DRAWING[p.id]);
      const on = opts.highlight === p.id;
      marker(svg, 'diamond', pos.x, pos.y, 7, { class: `gb-lpoint gb-lpoint-${p.id}`, fill: on ? CURVE : INK, stroke: on ? CURVE : INK });
      if (on) svgEl('circle', { class: 'gb-lpoint-ring', cx: pos.x, cy: pos.y, r: 17, fill: 'none', stroke: CURVE, 'stroke-width': 3 }, svg);
      if (!opts.hideNames || on) {
        const label = opts.hideNames ? '?' : p.id;
        const dy = p.id === 'L5' ? 30 : -26;
        addLabel(svg, wrap, label, pos.x, pos.y + dy, 'diagram-label--tick diagram-label--strong');
      }
    });
    if (!opts.hideNames) {
      const l4 = at(G.LAGRANGE_DRAWING.L4);
      addLabel(svg, wrap, '60° ahead', l4.x + 16, l4.y + 2, 'diagram-label--tick diagram-label--right');
      const l5 = at(G.LAGRANGE_DRAWING.L5);
      addLabel(svg, wrap, '60° behind', l5.x + 16, l5.y - 2, 'diagram-label--tick diagram-label--right');
    }
  }

  // ------------------------------------------------------------------
  // 12.1c A resonance: Io, Europa and Ganymede, 1 : 2 : 4
  // ------------------------------------------------------------------
  const MOON_SHAPES = ['circle', 'square', 'triangle'];

  function drawResonance(svg, wrap, ioOrbits) {
    clearDiagram(svg, wrap);
    panel(svg);
    const cx = 170;
    const cy = 175;
    const radii = G.RESONANCE_MOONS.map((m) => m.distanceJupiterRadii * 9);
    svgEl('circle', { class: 'gb-jupiter', cx, cy, r: 24, fill: '#d9b38c', stroke: INK, 'stroke-width': 1.5 }, svg);
    [-8, 0, 8].forEach((dy) => svgEl('line', { x1: cx - 22, x2: cx + 22, y1: cy + dy, y2: cy + dy, stroke: '#8a6a4a', 'stroke-width': 2 }, svg));
    addLabel(svg, wrap, 'Jupiter', cx, cy + 40, 'diagram-label--tick diagram-label--strong');
    const angles = G.resonanceAngles(ioOrbits);
    radii.forEach((r, i) => {
      svgEl('circle', { cx, cy, r, fill: 'none', stroke: MUTED, 'stroke-width': 1, 'stroke-dasharray': '3 4' }, svg);
      const t = (angles[i] * Math.PI) / 180;
      marker(svg, MOON_SHAPES[i], cx + r * Math.cos(t), cy - r * Math.sin(t), 7, { class: `gb-moon gb-moon-${G.RESONANCE_MOONS[i].name.toLowerCase()}` });
    });
    // Right: each moon's completed orbits, as a bar per moon.
    const orbits = G.resonanceOrbits(ioOrbits);
    const bx = 330;
    const bw = 270;
    addLabel(svg, wrap, `After ${ioOrbits} Io orbits:`, bx, 46, 'diagram-label--tick diagram-label--strong diagram-label--right');
    G.RESONANCE_MOONS.forEach((m, i) => {
      const y = 92 + 72 * i;
      marker(svg, MOON_SHAPES[i], bx + 7, y, 7, {});
      addLabel(svg, wrap, `${m.name}: ${+orbits[i].toFixed(3)} orbits`, bx + 22, y, 'diagram-label--tick diagram-label--right');
      svgEl('rect', { x: bx, y: y + 16, width: bw, height: 14, fill: 'none', stroke: MUTED, 'stroke-width': 1 }, svg);
      svgEl('rect', { class: `gb-orbit-bar gb-orbit-bar-${m.name.toLowerCase()}`, x: bx, y: y + 16, width: (bw * orbits[i]) / 4, height: 14, fill: CURVE }, svg);
      for (let k = 1; k < 4; k += 1) svgEl('line', { x1: bx + (bw * k) / 4, x2: bx + (bw * k) / 4, y1: y + 14, y2: y + 32, stroke: MUTED, 'stroke-width': 1 }, svg);
    });
    addLabel(svg, wrap, 'Each bar: 4 orbits long', bx, 318, 'diagram-label--tick diagram-label--right');
  }

  // ------------------------------------------------------------------
  // 12.2a The Roche limit
  // ------------------------------------------------------------------
  function drawRoche(svg, wrap, distance, options) {
    const opts = options || {};
    clearDiagram(svg, wrap);
    panel(svg);
    const cx = 70;
    const cy = 150;
    const R = 55;
    const state = G.rocheState(distance);
    svgEl('circle', { class: 'gb-planet-big', cx, cy, r: R, fill: '#d9b38c', stroke: INK, 'stroke-width': 1.5 }, svg);
    if (!opts.hideLimit) {
      svgEl('circle', { class: 'gb-roche-line', cx, cy, r: G.ROCHE_PLANET_RADII * R, fill: 'none', stroke: INK, 'stroke-width': 1.5, 'stroke-dasharray': '6 5' }, svg);
      addLabel(svg, wrap, 'Roche limit (dashed)', cx + G.ROCHE_PLANET_RADII * R + 8, 28, 'diagram-label--tick diagram-label--strong diagram-label--right');
    }
    const mx = cx + distance * R;
    if (state.inside) {
      // Pieces spread into a ring round the planet.
      for (let k = 0; k < 90; k += 1) {
        const t = (2 * Math.PI * k) / 90;
        const rr = distance * R + ((k * 37) % 11) - 5;
        svgEl('circle', { class: 'gb-ring-piece', cx: cx + rr * Math.cos(t), cy: cy + rr * 0.32 * Math.sin(t), r: 2.2, fill: ROCK }, svg);
      }
    } else {
      svgEl('ellipse', { class: 'gb-moon-whole', cx: mx, cy, rx: 14 * state.stretch, ry: 14 / Math.sqrt(state.stretch), fill: ROCK, stroke: INK, 'stroke-width': 1.5 }, svg);
    }
    if (!opts.hideScale) {
      const y0 = 268;
      svgEl('line', { x1: cx, x2: cx + G.ROCHE_MAX * R, y1: y0, y2: y0, stroke: MUTED, 'stroke-width': 1 }, svg);
      for (let d = 1; d <= G.ROCHE_MAX; d += 1) {
        svgEl('line', { x1: cx + d * R, x2: cx + d * R, y1: y0 - 5, y2: y0 + 5, stroke: MUTED, 'stroke-width': 1 }, svg);
        addLabel(svg, wrap, String(d), cx + d * R, y0 + 16, 'diagram-label--tick');
      }
      svgEl('path', { class: 'gb-moon-pointer', d: `M${mx},${y0 - 8} l-6,-10 l12,0 Z`, fill: CURVE }, svg);
      addLabel(svg, wrap, 'Distance (planet radii)', cx + 2.5 * R, y0 + 48, 'diagram-label--tick');
    }
    if (!opts.hideInset) {
      // Close-up: the planet pulls the near side harder than the far side.
      const ix = 520;
      const iy = 150;
      addLabel(svg, wrap, 'Close-up', ix, 70, 'diagram-label--tick diagram-label--strong');
      if (state.inside) {
        [[-30, -12], [-6, 10], [18, -8], [36, 14], [-20, 22]].forEach(([dx, dy]) => svgEl('circle', { class: 'gb-inset-piece', cx: ix + dx, cy: iy + dy, r: 7, fill: ROCK, stroke: INK, 'stroke-width': 1 }, svg));
        addLabel(svg, wrap, 'pulled apart', ix, iy + 64, 'diagram-label--tick diagram-label--strong');
      } else {
        svgEl('ellipse', { cx: ix, cy: iy, rx: 34 * Math.min(state.stretch, 1.6), ry: 34 / Math.sqrt(Math.min(state.stretch, 1.6)), fill: ROCK, stroke: INK, 'stroke-width': 1.5 }, svg);
        const pull = 2.5 / distance;
        // Longer arrows nearer the planet (to the left).
        arrow(svg, ix - 30, iy, ix - 30 - 40 * pull, iy, { class: 'gb-pull' });
        arrow(svg, ix, iy - 46, ix - 28 * pull, iy - 46, { class: 'gb-pull' });
        arrow(svg, ix + 30, iy, ix + 30 - 18 * pull, iy, { class: 'gb-pull' });
        addLabel(svg, wrap, 'near side: pulled most', ix, iy + 62, 'diagram-label--tick');
        addLabel(svg, wrap, 'far side: pulled least', ix, iy + 92, 'diagram-label--tick');
      }
    }
  }

  // ------------------------------------------------------------------
  // 12.2b Round or lumpy
  // ------------------------------------------------------------------
  function bodyPath(cx, cy, r, roundness) {
    const lump = 0.28 * (1 - roundness);
    let d = '';
    for (let k = 0; k <= 72; k += 1) {
      const t = (2 * Math.PI * k) / 72;
      const f = 1 + lump * (0.55 * Math.sin(2 * t + 0.6) + 0.3 * Math.sin(3 * t + 2.1) + 0.2 * Math.sin(5 * t + 1.3));
      const x = cx + r * f * Math.cos(t) * (1 + 0.25 * (1 - roundness));
      const y = cy + r * f * Math.sin(t);
      d += `${k ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)} `;
    }
    return `${d}Z`;
  }

  function drawShape(svg, wrap, diameterKm, options) {
    const opts = options || {};
    clearDiagram(svg, wrap);
    panel(svg);
    const round = G.roundness(diameterKm);
    svgEl('path', { class: 'gb-body', d: bodyPath(170, 140, 80, round), fill: ROCK, stroke: INK, 'stroke-width': 2 }, svg);
    if (round < 1) {
      [[-30, -20, 9], [25, 18, 12], [10, -40, 6]].forEach(([dx, dy, r]) => svgEl('circle', { class: 'gb-crater', cx: 170 + dx, cy: 140 + dy, r, fill: 'none', stroke: '#5b6680', 'stroke-width': 2 }, svg));
    }
    if (opts.hideScale) return;
    addLabel(svg, wrap, `${G.shapeVerdict(diameterKm)}`, 170, 262, 'diagram-label--tick diagram-label--strong');
    const x0 = 360;
    const x1 = 610;
    const y0 = 170;
    const X = (km) => x0 + ((km - G.SHAPE_MIN_KM) / (G.SHAPE_MAX_KM - G.SHAPE_MIN_KM)) * (x1 - x0);
    defsHatch(svg);
    svgEl('rect', { class: 'gb-round-zone', x: X(G.ROUND_FROM_KM), y: y0 - 16, width: X(G.ROUND_BY_KM) - X(G.ROUND_FROM_KM), height: 32, fill: 'url(#gb-hatch)', stroke: MUTED, 'stroke-width': 1 }, svg);
    svgEl('line', { x1: x0, x2: x1, y1: y0, y2: y0, stroke: INK, 'stroke-width': 1.5 }, svg);
    [10, 500, 1000, 1500].forEach((km) => {
      svgEl('line', { x1: X(km), x2: X(km), y1: y0 - 5, y2: y0 + 5, stroke: INK, 'stroke-width': 1 }, svg);
      addLabel(svg, wrap, String(km), X(km), y0 + 30, 'diagram-label--tick');
    });
    addLabel(svg, wrap, 'Diameter (km)', (x0 + x1) / 2, y0 + 62, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'hatched: becomes round', X(500), y0 - 66, 'diagram-label--tick');
    G.SHAPE_EXAMPLES.forEach((e) => {
      const x = X(e.diameterKm);
      svgEl('line', { x1: x, x2: x, y1: y0 - 16, y2: y0 + 16, stroke: MUTED, 'stroke-width': 1, 'stroke-dasharray': '2 2' }, svg);
      addLabel(svg, wrap, e.name, x, y0 - 32, 'diagram-label--tick');
    });
    svgEl('path', { class: 'gb-size-pointer', d: `M${X(diameterKm)},${y0 - 4} l-8,-14 l16,0 Z`, fill: CURVE, stroke: INK, 'stroke-width': 1 }, svg);
  }

  function defsHatch(svg) {
    const defs = svgEl('defs', {}, svg);
    const p = svgEl('pattern', { id: 'gb-hatch', width: 7, height: 7, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    svgEl('rect', { width: 7, height: 7, fill: '#1b2438' }, p);
    svgEl('line', { x1: 0, y1: 0, x2: 0, y2: 7, stroke: MUTED, 'stroke-width': 3 }, p);
  }

  // ------------------------------------------------------------------
  // 12.2c Holding an atmosphere
  // ------------------------------------------------------------------
  function drawAtmosphere(svg, wrap, bodyKey, gasKey) {
    clearDiagram(svg, wrap);
    panel(svg);
    const a = G.atmosphere(bodyKey, gasKey);
    const cx = 160;
    const cy = 300;
    const R = 140;
    svgEl('circle', { class: 'gb-body', cx, cy, r: R, fill: '#5b6680', stroke: INK, 'stroke-width': 2 }, svg);
    addLabel(svg, wrap, a.body.name, cx, cy - 70, 'diagram-label--tick diagram-label--strong');
    for (let k = 0; k < 16; k += 1) {
      const t = Math.PI * (0.12 + (0.76 * k) / 15);
      if (a.kept) {
        const rr = R + 12 + ((k * 7) % 4) * 6;
        svgEl('circle', { class: 'gb-gas gb-gas-kept', cx: cx - rr * Math.cos(t), cy: cy - rr * Math.sin(t), r: 3.5, fill: INK }, svg);
      } else {
        const r1 = R + 26 + ((k * 7) % 3) * 22;
        const x = cx - r1 * Math.cos(t);
        const y = cy - r1 * Math.sin(t);
        svgEl('circle', { class: 'gb-gas gb-gas-lost', cx: x, cy: y, r: 3.5, fill: INK }, svg);
        if (k % 2 === 0) arrow(svg, x - 6 * Math.cos(t), y - 6 * Math.sin(t), x - 30 * Math.cos(t), y - 30 * Math.sin(t), { 'stroke-width': 1.5 });
      }
    }
    addLabel(svg, wrap, a.kept ? `${a.gas.name}: kept` : `${a.gas.name}: escapes`, cx, 40, 'diagram-label--tick diagram-label--strong');
    // Bars: escape speed against 6 × the gas speed.
    const x0 = 360;
    const x1 = 600;
    const top = Math.max(a.body.escapeKms, a.needed) * 1.1;
    const X = (v) => x0 + (v / top) * (x1 - x0);
    defsHatch(svg);
    const rows = [
      { cls: 'gb-bar-escape', text: `Escape speed: ${a.body.escapeKms} km/s`, v: a.body.escapeKms, fill: CURVE, y: 90 },
      { cls: 'gb-bar-gas', text: `${G.KEEP_FACTOR} × gas speed: ${a.needed.toFixed(1)} km/s`, v: a.needed, fill: 'url(#gb-hatch)', y: 170 },
    ];
    rows.forEach((row) => {
      addLabel(svg, wrap, row.text, x0, row.y - 22, 'diagram-label--tick diagram-label--right');
      svgEl('rect', { class: row.cls, x: x0, y: row.y, width: X(row.v) - x0, height: 26, fill: row.fill, stroke: INK, 'stroke-width': 1.5 }, svg);
    });
    svgEl('line', { x1: x0, x2: x1, y1: 228, y2: 228, stroke: MUTED, 'stroke-width': 1 }, svg);
    addLabel(svg, wrap, 'Speed (km/s), 0 at the left', (x0 + x1) / 2, 248, 'diagram-label--tick');
  }

  const api = { drawRegular, drawLagrange, drawResonance, drawRoche, drawShape, drawAtmosphere, bodyPath };
  window.GravityBodiesDrawing = api;
})();
