/**
 * The drawings for notes/exoplanets-life.html, shared with its picture
 * questions (src/exoplanetsQuestions.js). Each function draws into an
 * <svg> and places its labels in the surrounding .labelled-diagram-wrap,
 * using src/spectrumDrawing.js's helpers. Shapes, patterns and labels,
 * never colour alone, tell things apart.
 */
(function () {
  const X = window.Exoplanets;
  const D = window.SpectrumDrawing;
  const S = window.Spectra;
  const { INK, MUTED, CURVE, svgEl, clearDiagram, addLabel, panel } = D;
  const GRID = '#2a3550';

  function star(svg, cx, cy, r, cls) {
    if (window.SunIcon) {
      const g = window.SunIcon.appendSunSvg(svg, cx, cy, r, { coronaScale: 1.25 });
      if (g && cls) g.classList.add(cls);
      return g;
    }
    return svgEl('circle', { class: cls || '', cx, cy, r, fill: CURVE }, svg);
  }

  function arrowHead(svg, x, y, angle) {
    const s = 9;
    svgEl('path', {
      d: `M${(x - s * Math.cos(angle - 0.45)).toFixed(1)},${(y - s * Math.sin(angle - 0.45)).toFixed(1)} L${x.toFixed(1)},${y.toFixed(1)} L${(x - s * Math.cos(angle + 0.45)).toFixed(1)},${(y - s * Math.sin(angle + 0.45)).toFixed(1)}`,
      fill: 'none',
      stroke: CURVE,
      'stroke-width': 2,
    }, svg);
  }

  function arrow(svg, x1, y1, x2, y2, cls) {
    svgEl('line', { class: cls || '', x1, y1, x2, y2, stroke: CURVE, 'stroke-width': 2 }, svg);
    arrowHead(svg, x2, y2, Math.atan2(y2 - y1, x2 - x1));
  }

  function hatch(svg, id) {
    const defs = svgEl('defs', {}, svg);
    const p = svgEl('pattern', { id, width: 7, height: 7, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    svgEl('rect', { width: 7, height: 7, fill: '#1b2438' }, p);
    svgEl('line', { x1: 0, y1: 0, x2: 0, y2: 7, stroke: MUTED, 'stroke-width': 3 }, p);
  }

  // ------------------------------------------------------------------
  // 12.4 Transit: the planet crossing its star, and the light curve
  // ------------------------------------------------------------------
  const TRANSIT_HOURS = 18;
  const B_MIN = 98.5;
  const B_MAX = 100.5;

  function drawTransit(svg, wrap, t, planetKey, options) {
    const opts = options || {};
    clearDiagram(svg, wrap);
    panel(svg);
    const p = X.PLANETS.find((x) => x.key === planetKey);
    if (!opts.curveOnly) {
      const cx = 150;
      const cy = 150;
      const R = 90;
      star(svg, cx, cy, R, 'ex-star');
      svgEl('line', { x1: cx - X.TRANSIT_SPAN * R, x2: cx + X.TRANSIT_SPAN * R, y1: cy, y2: cy, stroke: MUTED, 'stroke-width': 1, 'stroke-dasharray': '3 4' }, svg);
      const pr = Math.max(5, p.radius * R);
      svgEl('circle', { class: 'ex-planet', cx: cx + X.transitX(t) * R, cy, r: pr, fill: '#05070d', stroke: INK, 'stroke-width': 1.5 }, svg);
      addLabel(svg, wrap, 'planet', Math.max(50, Math.min(cx + X.transitX(t) * R, 220)), cy - 26, 'diagram-label--tick diagram-label--strong');
    }
    const x0 = opts.curveOnly ? 90 : 340;
    const x1 = 610;
    const yTop = 60;
    const yBottom = 230;
    const XT = (tt) => x0 + tt * (x1 - x0);
    const YB = (b) => yTop + ((B_MAX - b) / (B_MAX - B_MIN)) * (yBottom - yTop);
    for (let b = B_MIN; b <= B_MAX + 0.001; b += 0.5) {
      svgEl('line', { x1: x0, x2: x1, y1: YB(b), y2: YB(b), stroke: GRID, 'stroke-width': 1 }, svg);
      if (b > B_MIN + 0.01) addLabel(svg, wrap, b.toFixed(1), x0 - 6, YB(b), 'diagram-label--tick diagram-label--left');
    }
    for (let h = 0; h <= TRANSIT_HOURS; h += 6) {
      const x = XT(h / TRANSIT_HOURS);
      svgEl('line', { x1: x, x2: x, y1: yTop, y2: yBottom, stroke: GRID, 'stroke-width': 1 }, svg);
      addLabel(svg, wrap, String(h), x, yBottom + 14, 'diagram-label--tick');
    }
    let d = '';
    for (let k = 0; k <= 280; k += 1) {
      const tt = k / 280;
      d += `${k ? 'L' : 'M'}${XT(tt).toFixed(1)},${YB(100 * X.transitBrightness(tt, p.radius)).toFixed(1)} `;
    }
    svgEl('path', { class: 'ex-light-curve', d, fill: 'none', stroke: CURVE, 'stroke-width': 2.5 }, svg);
    if (!opts.curveOnly) {
      svgEl('circle', { class: 'ex-now', cx: XT(t), cy: YB(100 * X.transitBrightness(t, p.radius)), r: 6, fill: INK, stroke: CURVE, 'stroke-width': 2 }, svg);
    }
    addLabel(svg, wrap, 'Time (hours)', (x0 + x1) / 2, yBottom + 50, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'Brightness (% of normal)', x0 - 40, 28, 'diagram-label--tick diagram-label--strong diagram-label--right');
    if (!opts.curveOnly && X.transitDepthPercent(p.radius) < 0.2) {
      addLabel(svg, wrap, `dip only ${+X.transitDepthPercent(p.radius).toFixed(3)}%:`, 490, YB(99.5), 'diagram-label--tick');
      addLabel(svg, wrap, 'too small to see here', 490, YB(99.5) + 30, 'diagram-label--tick');
    }
  }

  // ------------------------------------------------------------------
  // 12.4 Astrometry: the star's wobble on the sky
  // ------------------------------------------------------------------
  function drawAstrometry(svg, wrap, t) {
    clearDiagram(svg, wrap);
    panel(svg);
    const m = X.starMotion(t, 'jupiter');
    // Left: the star's path on the sky, hugely exaggerated.
    const sx = 160;
    const sy = 160;
    const W = 60;
    svgEl('rect', { x: 30, y: 60, width: 260, height: 200, rx: 8, fill: '#05070d', stroke: MUTED, 'stroke-width': 1 }, svg);
    svgEl('circle', { class: 'ex-wobble-path', cx: sx, cy: sy, r: W, fill: 'none', stroke: MUTED, 'stroke-width': 1.2, 'stroke-dasharray': '4 4' }, svg);
    svgEl('path', { d: `M${sx - 8},${sy} L${sx + 8},${sy} M${sx},${sy - 8} L${sx},${sy + 8}`, stroke: INK, 'stroke-width': 2 }, svg);
    star(svg, sx + W * m.sky.x, sy - W * m.sky.y, 14, 'ex-wobble-star');
    addLabel(svg, wrap, 'The star on the sky', 160, 36, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, '+ centre of mass', sx, sy + W + 26, 'diagram-label--tick');
    // Right: from above, star and planet circle their shared centre.
    const cx = 470;
    const cy = 160;
    const rs = 18;
    const rp = 100;
    svgEl('circle', { cx, cy, r: rp, fill: 'none', stroke: MUTED, 'stroke-width': 1, 'stroke-dasharray': '3 4' }, svg);
    svgEl('circle', { cx, cy, r: rs, fill: 'none', stroke: MUTED, 'stroke-width': 1, 'stroke-dasharray': '3 4' }, svg);
    svgEl('path', { d: `M${cx - 6},${cy} L${cx + 6},${cy} M${cx},${cy - 6} L${cx},${cy + 6}`, stroke: INK, 'stroke-width': 2 }, svg);
    const pxS = cx + rs * m.sky.x;
    const pyS = cy - rs * m.sky.y;
    star(svg, pxS, pyS, 12, 'ex-top-star');
    const pxP = cx - rp * m.sky.x;
    const pyP = cy + rp * m.sky.y;
    svgEl('circle', { class: 'ex-top-planet', cx: pxP, cy: pyP, r: 7, fill: '#d9b38c', stroke: INK, 'stroke-width': 1.5 }, svg);
    addLabel(svg, wrap, 'From above', cx, 36, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'planet', pxP, pyP + 22, 'diagram-label--tick');
  }

  // ------------------------------------------------------------------
  // 12.4 Radial velocity: the star's lines shifting back and forth
  // ------------------------------------------------------------------
  const RV_SHIFT_NM = 9; // drawn shift at full speed, hugely exaggerated

  function drawRadialVelocity(svg, wrap, t) {
    clearDiagram(svg, wrap);
    panel(svg);
    const m = X.starMotion(t, 'jupiter');
    const frac = m.awayMs / X.PLANETS.find((p) => p.key === 'jupiter').starSpeedMs;
    const x0 = 140;
    const x1 = 610;
    const lab = S.ELEMENTS.hydrogen.lines.map((nm) => ({ nm, depth: 0.85 }));
    const shifted = lab.map((l) => ({ nm: l.nm + RV_SHIFT_NM * frac, depth: 0.85 }));
    D.drawStrip(svg, { x0, x1, y: 40, h: 28, type: 'absorption', lines: lab, minNm: 400, maxNm: 700 });
    D.drawStrip(svg, { x0, x1, y: 120, h: 28, type: 'absorption', lines: shifted, minNm: 400, maxNm: 700 });
    addLabel(svg, wrap, 'laboratory', x0 - 10, 54, 'diagram-label--tick diagram-label--left');
    addLabel(svg, wrap, 'star', x0 - 10, 134, 'diagram-label--tick diagram-label--left');
    const xFor = D.makeScale(x0, x1, 400, 700);
    lab.forEach((l, i) => svgEl('line', { class: 'ex-rv-link', x1: xFor(l.nm), x2: xFor(shifted[i].nm), y1: 82, y2: 118, stroke: CURVE, 'stroke-width': 1.5 }, svg));
    D.drawWavelengthAxis(svg, wrap, { x0, x1, y: 166, minNm: 400, maxNm: 700, title: false });
    addLabel(svg, wrap, 'Wavelength (nm)', (x0 + x1) / 2, 214, 'diagram-label--tick diagram-label--strong');
    // Below: the star moving round, seen from the side, with the Earth to the right.
    const cx = 250;
    const cy = 268;
    const r = 34;
    const ang = 2 * Math.PI * t;
    svgEl('ellipse', { cx, cy, rx: r, ry: r * 0.35, fill: 'none', stroke: MUTED, 'stroke-width': 1, 'stroke-dasharray': '3 4' }, svg);
    const px = cx + r * Math.cos(ang);
    const py = cy + r * 0.35 * Math.sin(ang);
    star(svg, px, py, 10, 'ex-rv-star');
    const vx = -Math.sin(ang);
    if (Math.abs(vx) > 0.05) arrow(svg, px + 14 * Math.sign(vx), py, px + Math.sign(vx) * (14 + 30 * Math.abs(vx)), py, 'ex-rv-arrow');
    const eye = 560;
    svgEl('path', { d: `M${eye - 14},${cy} Q${eye},${cy - 12} ${eye + 14},${cy} Q${eye},${cy + 12} ${eye - 14},${cy} Z`, fill: 'none', stroke: INK, 'stroke-width': 2 }, svg);
    svgEl('circle', { cx: eye, cy, r: 4, fill: INK }, svg);
    addLabel(svg, wrap, 'Earth', eye, cy - 26, 'diagram-label--tick');
    const word = X.lineShiftWord(m.awayMs);
    const text = word === 'red' ? 'moving away: lines shift to red' : word === 'blue' ? 'moving towards us: lines shift to blue' : 'moving across: no shift';
    addLabel(svg, wrap, text, 410, cy + 34, 'diagram-label--tick diagram-label--strong');
  }

  // ------------------------------------------------------------------
  // 12.6 The habitable zone
  // ------------------------------------------------------------------
  const ZONE_SHAPE = { 'too hot': 'triangle', 'in the zone': 'circle', 'too cold': 'square' };
  const LOG_MIN = -2;
  const LOG_MAX = Math.log10(30);

  function shape(svg, kind, x, y, s, cls) {
    const a = { class: cls, fill: INK, stroke: INK, 'stroke-width': 1.5 };
    if (kind === 'square') return svgEl('rect', { x: x - s, y: y - s, width: 2 * s, height: 2 * s, ...a }, svg);
    if (kind === 'triangle') return svgEl('path', { d: `M${x},${y - s * 1.25} L${x + s * 1.15},${y + s * 0.85} L${x - s * 1.15},${y + s * 0.85} Z`, ...a }, svg);
    return svgEl('circle', { cx: x, cy: y, r: s, ...a }, svg);
  }

  function starColour(T) {
    if (T < 3700) return '#ff9a6b';
    if (T < 5200) return '#ffc27a';
    if (T < 6500) return '#fff1c4';
    if (T < 8000) return '#f4f6ff';
    return '#cfdcff';
  }

  function drawZone(svg, wrap, temperatureK, options) {
    const opts = options || {};
    clearDiagram(svg, wrap);
    panel(svg);
    hatch(svg, 'ex-hatch');
    const x0 = 110;
    const x1 = 610;
    const y = 140;
    const XD = (au) => x0 + ((Math.log10(au) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * (x1 - x0);
    const z = X.habitableZone(temperatureK);
    const zx0 = Math.max(x0, XD(z.innerAU));
    const zx1 = Math.min(x1, XD(z.outerAU));
    if (zx1 > zx0) svgEl('rect', { class: 'ex-zone', x: zx0, y: y - 40, width: zx1 - zx0, height: 80, fill: 'url(#ex-hatch)', stroke: MUTED, 'stroke-width': 1 }, svg);
    addLabel(svg, wrap, 'habitable zone (hatched)', Math.min(Math.max((zx0 + zx1) / 2, 200), 460), y - 58, 'diagram-label--tick diagram-label--strong');
    const sr = 14 + (26 * (temperatureK - X.STAR_T_MIN)) / (X.STAR_T_MAX - X.STAR_T_MIN);
    svgEl('circle', { class: 'ex-zone-star', cx: 52, cy: y, r: sr, fill: starColour(temperatureK), stroke: INK, 'stroke-width': 1.5 }, svg);
    addLabel(svg, wrap, `star: ${temperatureK.toLocaleString('en-GB')} K`, 16, y + 48, 'diagram-label--tick diagram-label--strong diagram-label--right');
    svgEl('line', { x1: x0, x2: x1, y1: y, y2: y, stroke: MUTED, 'stroke-width': 1 }, svg);
    X.PLANET_DISTANCES_AU.forEach((au) => {
      const v = X.zoneVerdict(au, temperatureK);
      shape(svg, ZONE_SHAPE[v], XD(au), y, 7, `ex-zone-planet ex-zone-${v.replace(/ /g, '-')}`);
    });
    const ay = 214;
    svgEl('line', { x1: x0, x2: x1, y1: ay, y2: ay, stroke: INK, 'stroke-width': 1.2 }, svg);
    [0.01, 0.1, 1, 10].forEach((au) => {
      svgEl('line', { x1: XD(au), x2: XD(au), y1: ay - 5, y2: ay + 5, stroke: INK, 'stroke-width': 1 }, svg);
      addLabel(svg, wrap, String(au), XD(au), ay + 16, 'diagram-label--tick');
    });
    addLabel(svg, wrap, 'Distance from the star (AU, log scale)', (x0 + x1) / 2, ay + 52, 'diagram-label--tick diagram-label--strong');
    if (!opts.hideKey) {
      const ky = 304;
      [['triangle', 'too hot'], ['circle', 'in the zone'], ['square', 'too cold']].forEach(([k, text], i) => {
        const kx = 140 + 170 * i;
        shape(svg, k, kx, ky, 6, 'ex-key');
        addLabel(svg, wrap, text, kx + 14, ky, 'diagram-label--tick diagram-label--right');
      });
    }
  }

  // ------------------------------------------------------------------
  // 12.7 The Drake equation, as a running total on a log scale
  // ------------------------------------------------------------------
  const DRAKE_LOG_MIN = -10;
  const DRAKE_LOG_MAX = 9;

  function sup(n) {
    const map = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
    return String(n).split('').map((c) => map[c]).join('');
  }

  function formatNumber(n) {
    if (n >= 1000) return Math.round(n).toLocaleString('en-GB');
    if (n >= 1) return String(+n.toPrecision(3));
    return String(+n.toPrecision(2));
  }

  function drawDrake(svg, wrap, values) {
    clearDiagram(svg, wrap);
    panel(svg);
    const x0 = 250;
    const x1 = 610;
    const XL = (v) => x0 + ((Math.log10(v) - DRAKE_LOG_MIN) / (DRAKE_LOG_MAX - DRAKE_LOG_MIN)) * (x1 - x0);
    const rowY = (i) => 40 + 36 * i;
    const steps = X.drakeSteps(values);
    for (let e = -9; e <= 9; e += 3) {
      svgEl('line', { x1: XL(10 ** e), x2: XL(10 ** e), y1: 24, y2: rowY(6) + 16, stroke: e === 0 ? MUTED : GRID, 'stroke-width': e === 0 ? 1.5 : 1, 'stroke-dasharray': e === 0 ? '5 4' : '' }, svg);
      addLabel(svg, wrap, e === 0 ? '1' : `10${sup(e)}`, XL(10 ** e), rowY(6) + 32, 'diagram-label--tick');
    }
    addLabel(svg, wrap, 'Running total (number, log scale)', (x0 + x1) / 2, rowY(6) + 62, 'diagram-label--tick diagram-label--strong');
    let d = '';
    steps.forEach((s, i) => {
      const f = X.DRAKE_FACTORS[i];
      const text = `${i ? '× ' : ''}${f.symbol} = ${formatNumber(s.value)}`;
      addLabel(svg, wrap, text, 16, rowY(i), `diagram-label--tick diagram-label--right${i === 6 ? ' diagram-label--strong' : ''}`);
      const x = Math.min(x1, Math.max(x0, XL(s.running)));
      d += `${i ? 'L' : 'M'}${x.toFixed(1)},${rowY(i)} `;
    });
    svgEl('path', { class: 'ex-drake-line', d, fill: 'none', stroke: MUTED, 'stroke-width': 1.5 }, svg);
    steps.forEach((s, i) => {
      const x = Math.min(x1, Math.max(x0, XL(s.running)));
      svgEl('circle', { class: `ex-drake-dot${i === 6 ? ' ex-drake-n' : ''}`, cx: x, cy: rowY(i), r: i === 6 ? 8 : 5, fill: i === 6 ? CURVE : INK, stroke: INK, 'stroke-width': 1.5 }, svg);
    });
  }

  // ------------------------------------------------------------------
  // 12.8 Benefits and dangers of contact, as two matching columns
  // ------------------------------------------------------------------
  const BENEFITS = [
    ['We are not alone', 'answering an old question'],
    ['New science', 'how life works elsewhere'],
    ['New technology', 'learning from their ideas'],
    ['Seeing ourselves anew', 'our place in the Universe'],
  ];
  const DANGERS = [
    ['They might be hostile', 'older, stronger than us'],
    ['Showing where we are', 'if we send a reply'],
    ['A shock to society', 'beliefs and politics'],
    ['Very slow replies', 'years each way, or more'],
  ];

  function drawSeti(svg, wrap) {
    clearDiagram(svg, wrap);
    panel(svg);
    svgEl('line', { x1: 320, x2: 320, y1: 24, y2: 330, stroke: MUTED, 'stroke-width': 1 }, svg);
    [[BENEFITS, 0, 'Benefits (+)', 'plus'], [DANGERS, 320, 'Dangers (!)', 'warn']].forEach(([items, dx, title, badge]) => {
      addLabel(svg, wrap, title, dx + 160, 34, 'diagram-label--tick diagram-label--strong');
      items.forEach(([main, detail], i) => {
        const y = 86 + 72 * i;
        const bx = dx + 24;
        if (badge === 'plus') {
          svgEl('circle', { class: 'ex-benefit', cx: bx, cy: y + 14, r: 12, fill: 'none', stroke: INK, 'stroke-width': 2 }, svg);
          svgEl('path', { d: `M${bx - 6},${y + 14} L${bx + 6},${y + 14} M${bx},${y + 8} L${bx},${y + 20}`, stroke: INK, 'stroke-width': 2.5 }, svg);
        } else {
          svgEl('path', { class: 'ex-danger', d: `M${bx},${y} L${bx + 13},${y + 24} L${bx - 13},${y + 24} Z`, fill: 'none', stroke: INK, 'stroke-width': 2 }, svg);
          svgEl('path', { d: `M${bx},${y + 8} L${bx},${y + 16} M${bx},${y + 19} L${bx},${y + 21}`, stroke: INK, 'stroke-width': 2.5 }, svg);
        }
        addLabel(svg, wrap, main, bx + 20, y, 'diagram-label--tick diagram-label--strong diagram-label--right');
        addLabel(svg, wrap, detail, bx + 20, y + 30, 'diagram-label--tick diagram-label--right');
      });
    });
  }

  window.ExoplanetsDrawing = { drawTransit, drawAstrometry, drawRadialVelocity, drawZone, drawDrake, drawSeti, formatNumber, BENEFITS, DANGERS, TRANSIT_HOURS };
})();
