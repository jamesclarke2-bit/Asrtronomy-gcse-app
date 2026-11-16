(function () {
  const S = window.StarTrails;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, svgEl, clearDiagram, addLabel, panel } = D;

  const CURRICULUM_UNITS = ['u2.34'];
  const ARC = '#cfe3ff';
  const HILLS = '#121a12';

  function seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  const rad = (deg) => (deg * Math.PI) / 180;
  /** A point at angle (degrees, anticlockwise from the right) and radius r round (cx, cy). */
  const at = (cx, cy, r, deg) => ({ x: cx + r * Math.cos(rad(deg)), y: cy - r * Math.sin(rad(deg)) });

  /** An arc round (cx, cy) from angle a0 anticlockwise through `sweep` degrees. */
  function arcPath(cx, cy, r, a0, sweep) {
    const p0 = at(cx, cy, r, a0);
    const p1 = at(cx, cy, r, a0 + sweep);
    return `M${p0.x.toFixed(1)},${p0.y.toFixed(1)} A${r},${r} 0 ${sweep > 180 ? 1 : 0} 0 ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
  }

  function exposureMin() {
    return Number(document.getElementById('exposure').value);
  }

  // ------------------------------------------------------------------
  // 1. What a star trail is
  // ------------------------------------------------------------------

  const POLE = { x: 330, y: 160 };

  function drawTrails() {
    const svg = document.getElementById('trail-diagram');
    const wrap = document.getElementById('trail-diagram-wrap');
    const t = exposureMin();
    const theta = S.arcAngleDeg(t);
    clearDiagram(svg, wrap);
    panel(svg);
    svgEl('rect', { x: 0, y: 0, width: 640, height: 400, rx: 10, fill: '#070b1a' }, svg);
    const rand = seeded(17);
    for (let k = 0; k < 90; k += 1) {
      const r = 14 + Math.sqrt(rand()) * 330;
      const a0 = rand() * 360;
      const width = 0.8 + rand() * 1.8;
      const shade = 200 + Math.round(rand() * 55);
      svgEl('path', { class: 'st-trail', d: arcPath(POLE.x, POLE.y, r, a0, theta), fill: 'none', stroke: `rgb(${shade - 20}, ${shade - 5}, 255)`, 'stroke-width': width.toFixed(1), 'stroke-linecap': 'round', opacity: 0.85 }, svg);
    }
    // The Pole Star, very close to the pole, draws a tiny arc.
    svgEl('path', { d: arcPath(POLE.x, POLE.y, 5, 0, theta), fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
    svgEl('circle', { class: 'st-pole', cx: POLE.x, cy: POLE.y, r: 2, fill: '#ffe08a' }, svg);
    // Hills and a tree in front.
    svgEl('path', { d: 'M0,340 Q90,300 180,330 T360,320 T520,310 T640,330 L640,400 L0,400 Z', fill: HILLS }, svg);
    svgEl('rect', { x: 106, y: 260, width: 8, height: 70, fill: HILLS }, svg);
    svgEl('path', { d: 'M110,200 L140,262 L80,262 Z M110,230 L146,292 L74,292 Z', fill: HILLS }, svg);
    svg.dataset.angle = theta.toFixed(2);
    addLabel(svg, wrap, 'celestial pole', POLE.x + 16, POLE.y + 24, 'diagram-label--tick diagram-label--strong diagram-label--right');
    addLabel(svg, wrap, `${t} min exposure: every arc ${theta.toFixed(1)}°`, 320, 376, 'diagram-label--tick diagram-label--strong');
    document.getElementById('exposure-label').textContent = `${t} min`;
  }

  // ------------------------------------------------------------------
  // 2. Measure the angle
  // ------------------------------------------------------------------

  const M = { x: 320, y: 200, scaleR: 150, arcR: 120, start: 20 };

  function measuredAngle() {
    const a = Number(document.getElementById('arm-start').value);
    const b = Number(document.getElementById('arm-end').value);
    const d = Math.abs(b - a) % 360;
    return Math.min(d, 360 - d);
  }

  function drawMeasure() {
    const svg = document.getElementById('measure-diagram');
    const wrap = document.getElementById('measure-diagram-wrap');
    const t = exposureMin();
    const theta = S.arcAngleDeg(t);
    clearDiagram(svg, wrap);
    panel(svg);
    // The angle scale: a tick every 5 degrees, a longer one every 10.
    svgEl('circle', { cx: M.x, cy: M.y, r: M.scaleR, fill: 'none', stroke: MUTED, 'stroke-width': 1 }, svg);
    for (let a = 0; a < 360; a += 5) {
      const long = a % 10 === 0;
      const p0 = at(M.x, M.y, M.scaleR, a);
      const p1 = at(M.x, M.y, M.scaleR - (long ? 10 : 5), a);
      svgEl('line', { x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y, stroke: MUTED, 'stroke-width': long ? 1.5 : 1 }, svg);
    }
    for (let a = 0; a < 360; a += 30) {
      const p = at(M.x, M.y, M.scaleR + 22, a);
      addLabel(svg, wrap, `${a}°`, p.x, p.y, 'diagram-label--tick');
    }
    // The star's arc, with a dot at each end.
    svgEl('path', { class: 'st-measure-arc', d: arcPath(M.x, M.y, M.arcR, M.start, theta), fill: 'none', stroke: ARC, 'stroke-width': 5, 'stroke-linecap': 'round' }, svg);
    [M.start, M.start + theta].forEach((a) => {
      const p = at(M.x, M.y, M.arcR, a);
      svgEl('circle', { class: 'st-arc-end', cx: p.x, cy: p.y, r: 4, fill: '#fff' }, svg);
    });
    // The two arms.
    ['arm-start', 'arm-end'].forEach((id, k) => {
      const a = Number(document.getElementById(id).value);
      const p = at(M.x, M.y, M.scaleR, a);
      svgEl('line', { class: `st-arm st-arm--${k ? 'end' : 'start'}`, x1: M.x, y1: M.y, x2: p.x, y2: p.y, stroke: k ? '#ffd36b' : '#9fd3ff', 'stroke-width': 2.5, 'stroke-dasharray': k ? '8 4' : 'none' }, svg);
      document.getElementById(`${id}-label`).textContent = `${a.toFixed(1)}°`;
    });
    svgEl('circle', { cx: M.x, cy: M.y, r: 4, fill: '#ffe08a' }, svg);
    const measured = measuredAngle();
    svg.dataset.trueAngle = theta.toFixed(2);
    svg.dataset.measured = measured.toFixed(1);
    addLabel(svg, wrap, `θ = ${measured.toFixed(1)}°`, 72, 30, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, `t = ${t} min`, 568, 30, 'diagram-label--tick diagram-label--strong');
    const out = document.getElementById('measure-readout');
    if (measured < 0.5) {
      out.textContent = 'Move the arms apart, one to each end of the arc.';
    } else {
      const day = S.siderealDayFrom(measured, t);
      out.textContent = `Your reading: θ = ${measured.toFixed(1)}° in t = ${t} min, so sidereal day = (360 ÷ ${measured.toFixed(1)}) × ${t} = ${Math.round(day).toLocaleString('en-GB')} min, which is ${S.hoursAndMinutes(day)}.`;
    }
  }

  // ------------------------------------------------------------------
  // 3. How sure is the answer?
  // ------------------------------------------------------------------

  const SHORT = 30;
  const LONG = 240;
  const readingState = { seed: 7 };

  function readingSets() {
    return {
      short: S.readings(SHORT, { seed: readingState.seed, anomaly: { index: 3, offsetDeg: 5 } }),
      // The same seed: the same reading spread on both arcs.
      long: S.readings(LONG, { seed: readingState.seed }),
    };
  }

  function fmt(x, dp) {
    return x.toFixed(dp);
  }

  function el(tag, text, attrs = {}) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
  }

  function table(caption, t, values) {
    const r = S.result(values, t);
    const tbl = el('table', undefined, { class: 'shower-table st-table', 'data-exposure': String(t) });
    tbl.appendChild(el('caption', caption));
    const head = el('thead');
    const hr = el('tr');
    hr.append(el('th', 'Student', { scope: 'col' }), el('th', 'Arc angle (\u00b0)', { scope: 'col' }));
    head.appendChild(hr);
    const body = el('tbody');
    values.forEach((v, k) => {
      const anomalous = r.anomalies.includes(k);
      const tr = el('tr', undefined, anomalous ? { class: 'st-anomaly' } : {});
      tr.append(el('td', String(k + 1)), el('td', `${fmt(v, 1)}${anomalous ? ' (anomaly: left out)' : ''}`));
      body.appendChild(tr);
    });
    const foot = el('tfoot');
    const day = Math.round(r.dayMin).toLocaleString('en-GB');
    const dayWorking = `(360 \u00f7 ${fmt(r.mean, 2)}) \u00d7 ${t} = ${day} \u00b1 ${Math.round(r.dayUncertaintyMin)}`;
    [
      ['Mean (\u00b0)', fmt(r.mean, 2)],
      ['Uncertainty, half the range (\u00b0)', `\u00b1${fmt(r.uncertainty, 2)}`],
      ['Percentage uncertainty (%)', fmt(r.percent, 1)],
      ['Sidereal day (min)', dayWorking],
    ].forEach(([label, value]) => {
      const tr = el('tr');
      tr.append(el('th', label, { scope: 'row' }), el('td', value));
      foot.appendChild(tr);
    });
    tbl.append(head, body, foot);
    return tbl;
  }

  function drawSpread() {
    const sets = readingSets();
    const short = S.result(sets.short, SHORT);
    const long = S.result(sets.long, LONG);
    const holder = document.getElementById('reading-tables');
    holder.innerHTML = '';
    holder.append(table(`Short exposure: t = ${SHORT} min`, SHORT, sets.short), table(`Long exposure: t = ${LONG} min`, LONG, sets.long));

    const svg = document.getElementById('spread-diagram');
    const wrap = document.getElementById('spread-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    // Each arc as a wedge, with its uncertainty band hatched either side of the far edge.
    const defs = svgEl('defs', {}, svg);
    const hatch = svgEl('pattern', { id: 'st-hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    svgEl('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: '#ffd36b', 'stroke-width': 3 }, hatch);
    [[short, 40, 'short'], [long, 340, 'long']].forEach(([r, x0, id]) => {
      const c = { x: x0, y: 170 };
      const R = 130;
      const wedge = (a0, a1, cls, fill) => {
        const p0 = at(c.x, c.y, R, a0);
        const p1 = at(c.x, c.y, R, a1);
        svgEl('path', { class: cls, d: `M${c.x},${c.y} L${p0.x.toFixed(1)},${p0.y.toFixed(1)} A${R},${R} 0 0 0 ${p1.x.toFixed(1)},${p1.y.toFixed(1)} Z`, fill, stroke: INK, 'stroke-width': 1 }, svg);
      };
      wedge(0, r.mean, `st-wedge st-wedge--${id}`, '#25345a');
      wedge(r.mean - r.uncertainty, r.mean + r.uncertainty, `st-band st-band--${id}`, 'url(#st-hatch)');
    });
    addLabel(svg, wrap, `${SHORT} min: θ = ${fmt(short.mean, 2)}° ± ${fmt(short.uncertainty, 2)}°`, 24, 30, 'diagram-label--tick diagram-label--right');
    addLabel(svg, wrap, `${LONG} min: θ = ${fmt(long.mean, 2)}° ± ${fmt(long.uncertainty, 2)}°`, 340, 30, 'diagram-label--tick diagram-label--right');
    // Bars: percentage uncertainty, longer bar = less certain.
    const scale = 90;
    [[short, SHORT, 200], [long, LONG, 232]].forEach(([r, t, y]) => {
      const len = Math.min(380, r.percent * scale);
      svgEl('rect', { class: `st-bar st-bar--${t}`, x: 110, y: y - 9, width: len.toFixed(1), height: 18, fill: '#ffd36b' }, svg);
      addLabel(svg, wrap, `${t} min`, 16, y, 'diagram-label--tick diagram-label--right');
      addLabel(svg, wrap, `±${fmt(r.percent, 1)}%`, 118 + len, y, 'diagram-label--tick diagram-label--strong diagram-label--right');
    });
    svg.dataset.shortPercent = short.percent.toFixed(2);
    svg.dataset.longPercent = long.percent.toFixed(2);
    drawSeparate(long);
  }

  // ------------------------------------------------------------------
  // 3b. Can a measurement tell the sidereal and solar days apart?
  // ------------------------------------------------------------------

  const NIGHT = 720;

  function drawSeparate(long) {
    const svg = document.getElementById('separate-diagram');
    const wrap = document.getElementById('separate-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const defs = svgEl('defs', {}, svg);
    const hatch = svgEl('pattern', { id: 'st-sep-hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    svgEl('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: '#ffd36b', 'stroke-width': 3 }, hatch);
    const LO = 1410;
    const HI = 1470;
    const x = (m) => 60 + ((Math.min(HI, Math.max(LO, m)) - LO) / (HI - LO)) * 540;
    const num = (m) => Math.round(m).toLocaleString('en-GB');
    // The axis, in minutes.
    svgEl('line', { x1: 60, y1: 220, x2: 600, y2: 220, stroke: INK, 'stroke-width': 1.5 }, svg);
    for (let m = LO; m <= HI; m += 10) {
      svgEl('line', { x1: x(m), y1: 220, x2: x(m), y2: 228, stroke: INK }, svg);
      addLabel(svg, wrap, num(m), x(m), 240, 'diagram-label--tick');
    }
    addLabel(svg, wrap, 'sidereal day (min)', 320, 272, 'diagram-label--tick');
    // The two days, told apart by line style and label, not colour.
    svgEl('line', { class: 'st-sep-sidereal', x1: x(S.SIDEREAL_DAY_MIN), y1: 34, x2: x(S.SIDEREAL_DAY_MIN), y2: 220, stroke: INK, 'stroke-width': 2 }, svg);
    svgEl('line', { class: 'st-sep-solar', x1: x(S.SOLAR_DAY_MIN), y1: 34, x2: x(S.SOLAR_DAY_MIN), y2: 220, stroke: INK, 'stroke-width': 2, 'stroke-dasharray': '6 4' }, svg);
    addLabel(svg, wrap, `sidereal ${num(S.SIDEREAL_DAY_MIN)}`, x(S.SIDEREAL_DAY_MIN) - 4, 24, 'diagram-label--tick diagram-label--strong diagram-label--left');
    addLabel(svg, wrap, `solar ${num(S.SOLAR_DAY_MIN)}`, x(S.SOLAR_DAY_MIN) + 4, 24, 'diagram-label--tick diagram-label--strong diagram-label--right');
    // Each measurement's range, as a bar with end caps and its mean marked.
    const night = S.dayRange(NIGHT, long.uncertainty);
    const rows = [
      { id: 'long', y: 92, lo: long.shortestMin, hi: long.longestMin, mid: long.dayMin, unc: long.dayUncertaintyMin, text: `${LONG} min: ${num(long.dayMin)} ± ${num(long.dayUncertaintyMin)}` },
      { id: 'night', y: 172, lo: night.shortestMin, hi: night.longestMin, mid: (night.shortestMin + night.longestMin) / 2, unc: night.uncertaintyMin, text: `${NIGHT} min (whole night): ${num((night.shortestMin + night.longestMin) / 2)} ± ${num(night.uncertaintyMin)}` },
    ];
    rows.forEach((r) => {
      svgEl('rect', { class: `st-sep-bar st-sep-bar--${r.id}`, x: x(r.lo), y: r.y - 8, width: (x(r.hi) - x(r.lo)).toFixed(1), height: 16, fill: 'url(#st-sep-hatch)', stroke: INK }, svg);
      svgEl('circle', { cx: x(r.mid), cy: r.y, r: 5, fill: INK }, svg);
      addLabel(svg, wrap, r.text, 70, r.y - 26, 'diagram-label--tick diagram-label--right');
    });
    svg.dataset.longLo = long.shortestMin.toFixed(1);
    svg.dataset.longHi = long.longestMin.toFixed(1);
    svg.dataset.nightLo = night.shortestMin.toFixed(3);
    svg.dataset.nightHi = night.longestMin.toFixed(3);
    const holdsBoth = long.shortestMin <= S.SIDEREAL_DAY_MIN && long.longestMin >= S.SOLAR_DAY_MIN;
    const longPc = ((100 * long.uncertainty) / long.mean).toFixed(2);
    document.getElementById('separate-readout').textContent =
      `The ${LONG}-minute exposure gives ${num(long.dayMin)} ± ${num(long.dayUncertaintyMin)} min: a range from ${num(long.shortestMin)} to ${num(long.longestMin)} min, ${holdsBoth ? 'holds both' : `is ${num(2 * long.dayUncertaintyMin)} min wide, far wider than the gap between`} the sidereal day (${num(S.SIDEREAL_DAY_MIN)} min) and the solar day (${num(S.SOLAR_DAY_MIN)} min), so it cannot tell them apart. ` +
      `A whole night, about ${NIGHT} min, turns the trail through about ${night.thetaDeg.toFixed(1)}°. Read to the same ±${long.uncertainty.toFixed(2)}°, that is ±${night.percent.toFixed(2)}% instead of ±${longPc}%, so the day comes out at ${num(night.shortestMin)} to ${num(night.longestMin)} min. ` +
      (S.separatesFromSolar(night)
        ? `That range holds the sidereal day and stops just short of the solar day: only just enough to tell them apart.`
        : `That is narrower, but with this spread of readings it still reaches the solar day.`);
  }

  // ------------------------------------------------------------------
  // 4. Why not exactly 24 hours?
  // ------------------------------------------------------------------

  function drawDay() {
    const svg = document.getElementById('day-diagram');
    const wrap = document.getElementById('day-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const sun = { x: 320, y: 236 };
    const R = 190;
    svgEl('circle', { cx: sun.x, cy: sun.y, r: 26, fill: '#ffd36b' }, svg);
    svgEl('path', { d: arcPath(sun.x, sun.y, R, 25, 130), fill: 'none', stroke: MUTED, 'stroke-dasharray': '4 5' }, svg);
    const e1 = at(sun.x, sun.y, R, 140);
    const e2 = at(sun.x, sun.y, R, 40);
    // The direction to the Sun (and to a far-off star straight beyond it) from day 1.
    const ux = (sun.x - e1.x) / Math.hypot(sun.x - e1.x, sun.y - e1.y);
    const uy = (sun.y - e1.y) / Math.hypot(sun.x - e1.x, sun.y - e1.y);
    const arrow = (p, dx, dy, cls, dash) => {
      const q = { x: p.x + dx * 70, y: p.y + dy * 70 };
      svgEl('line', { class: cls, x1: p.x, y1: p.y, x2: q.x, y2: q.y, stroke: INK, 'stroke-width': 2.5, 'stroke-dasharray': dash || 'none' }, svg);
      const a = Math.atan2(dy, dx);
      svgEl('path', { d: `M${q.x},${q.y} L${q.x - 10 * Math.cos(a - 0.4)},${q.y - 10 * Math.sin(a - 0.4)} M${q.x},${q.y} L${q.x - 10 * Math.cos(a + 0.4)},${q.y - 10 * Math.sin(a + 0.4)}`, stroke: INK, 'stroke-width': 2.5 }, svg);
    };
    [e1, e2].forEach((e) => svgEl('circle', { class: 'st-earth', cx: e.x, cy: e.y, r: 18, fill: '#3d7bd6' }, svg));
    arrow(e1, ux, uy, 'st-day-arrow');
    // One sidereal day later: the same direction (to the far-off star)...
    arrow(e2, ux, uy, 'st-day-arrow');
    // ...but the Sun is now a little further round.
    const vx = (sun.x - e2.x) / Math.hypot(sun.x - e2.x, sun.y - e2.y);
    const vy = (sun.y - e2.y) / Math.hypot(sun.x - e2.x, sun.y - e2.y);
    arrow(e2, vx, vy, 'st-day-arrow st-day-arrow--solar', '6 4');
    addLabel(svg, wrap, 'day 1', e1.x, e1.y - 34, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'a sidereal day later', e2.x - 20, e2.y - 34, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'extra turn to face the Sun', e2.x - 30, e2.y + 62, 'diagram-label--tick');
    addLabel(svg, wrap, 'Sun', sun.x + 46, sun.y, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'not to scale: the move along the orbit is exaggerated', 320, 284, 'diagram-label--tick');
    document.getElementById('day-readout').textContent =
      `Sidereal day: ${S.hoursAndMinutes(S.SIDEREAL_DAY_MIN)}. Solar day: ${S.hoursAndMinutes(S.SOLAR_DAY_MIN)}. The difference is about ${S.SOLAR_DAY_MIN - S.SIDEREAL_DAY_MIN} minutes.`;
  }

  // ------------------------------------------------------------------

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }

  document.getElementById('exposure').addEventListener('input', () => {
    drawTrails();
    drawMeasure();
  });
  ['arm-start', 'arm-end'].forEach((id) => document.getElementById(id).addEventListener('input', drawMeasure));
  document.getElementById('new-readings').addEventListener('click', (e) => {
    e.stopPropagation();
    readingState.seed += 1;
    drawSpread();
  });
  drawTrails();
  drawMeasure();
  drawSpread();
  drawDay();
  renderCoverage();
  Glossary.init({
    celestialPole:
      "The celestial pole: the point in the sky directly above the Earth's North (or South) Pole. As the Earth turns, the whole sky seems to turn about it, so stars near it never set. More on Star Coordinates.",
  });
  QuizUI.mount(StarTrailsQuestions.makeQuestions(S));
})();
