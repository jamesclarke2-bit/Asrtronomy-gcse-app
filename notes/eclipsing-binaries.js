(function () {
  const E = window.EclipsingBinaries;
  const D = window.SpectrumDrawing;
  const L = window.LightCurveDrawing;
  const { INK, MUTED, svgEl, clearDiagram, addLabel, panel, rgbString } = D;

  const CURRICULUM_UNITS = ['u4.12'];
  const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fmtK = (t) => `${Math.round(t).toLocaleString('en-GB')} K`;
  const fmt2 = (x) => x.toFixed(2);

  function capitalise(t) {
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  function seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function starfield(svg, w, h, n, seed) {
    const rand = seeded(seed);
    for (let i = 0; i < n; i += 1) svgEl('circle', { cx: 8 + rand() * (w - 16), cy: 8 + rand() * (h - 16), r: 0.8, fill: '#fff', opacity: 0.35 }, svg);
  }

  /** Both stars as we see them, the further one drawn first so the nearer one covers it. */
  function drawPair(svg, sys, phase, cx, cy, scale, cls = '') {
    const pos = E.skyPositions(sys, phase);
    ['A', 'B']
      .map((id) => ({ id, p: pos[id], star: sys[id] }))
      .sort((a, b) => b.p.z - a.p.z)
      .forEach(({ id, p, star }) => {
        svgEl('circle', {
          class: `eb-star eb-star--${id} ${cls}`,
          'data-star': id,
          cx: (cx + p.x * scale).toFixed(1),
          cy: (cy - p.y * scale).toFixed(1),
          r: (star.radius * scale).toFixed(1),
          fill: rgbString(D.starDisplayRgb(star.temperatureK)),
          stroke: '#0f1830',
          'stroke-width': 1.5,
        }, svg);
      });
    return pos;
  }

  // ------------------------------------------------------------------
  // 1. Eclipses make the dips
  // ------------------------------------------------------------------

  function drawIntro() {
    const svg = document.getElementById('intro-diagram');
    const wrap = document.getElementById('intro-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    starfield(svg, 640, 470, 40, 3);
    const sys = { ...E.preset('demo'), zeroDay: 1.5 };
    const P = sys.periodDays;
    const steps = [
      { n: '1', phase: 0.75, t: sys.zeroDay - 0.25 * P },
      { n: '2', phase: 0, t: sys.zeroDay },
      { n: '3', phase: 0.25, t: sys.zeroDay + 0.25 * P },
      { n: '4', phase: 0.5, t: sys.zeroDay + 0.5 * P },
    ];
    const g = { x0: 70, x1: 610, yTop: 206, yBottom: 386, tMin: 0, tMax: 6, mTop: 5.9, mBottom: 7.25 };
    const { xFor, yFor } = L.drawLightCurve(svg, wrap, { ...g, fn: (t) => E.magnitudeAt(sys, t), mTicks: [6.0, 6.5, 7.0], tTicks: [0, 1, 2, 3, 4, 5, 6], brighterNote: false });
    addLabel(svg, wrap, 'Apparent magnitude', 8, 152, 'diagram-label--tick diagram-label--right');
    addLabel(svg, wrap, '\u2191 brighter', g.x1 - 6, g.yTop + 26, 'diagram-label--tick diagram-label--left');
    addLabel(svg, wrap, 'Time (days)', (g.x0 + g.x1) / 2, g.yBottom + 42, 'diagram-label--tick');

    steps.forEach((s, i) => {
      const cx = 80 + i * 160;
      svgEl('rect', { x: cx - 74, y: 12, width: 148, height: 112, rx: 8, fill: '#05070d', stroke: MUTED }, svg);
      const pos = drawPair(svg, sys, s.phase, cx + 10, 66, 5.4, 'eb-intro-star');
      svgEl('circle', { cx: cx - 60, cy: 26, r: 11, fill: '#0f1830', stroke: INK, 'stroke-width': 1.5 }, svg);
      addLabel(svg, wrap, s.n, cx - 60, 26, 'diagram-label--tick diagram-label--strong eb-step-number');
      if (s.n === '1' || s.n === '3') {
        ['A', 'B'].forEach((id) => addLabel(svg, wrap, id, cx + 10 + pos[id].x * 5.4, 112, 'diagram-label--tick diagram-label--strong'));
      }
      // From the picture down to its moment on the light curve.
      const x = xFor(s.t);
      const y = yFor(E.magnitudeAt(sys, s.t));
      svgEl('path', { d: `M${cx},124 L${x},${y - 8}`, stroke: INK, 'stroke-width': 1, 'stroke-dasharray': '3 4', fill: 'none', opacity: 0.7 }, svg);
      svgEl('circle', { class: 'eb-step-point', cx: x, cy: y, r: 5, fill: INK }, svg);
      if (s.n === '1' || s.n === '3') addLabel(svg, wrap, s.n, x + 14, y - 14, 'diagram-label--tick diagram-label--strong');
      else addLabel(svg, wrap, s.n, x - 12, y - 4, 'diagram-label--tick diagram-label--strong diagram-label--left');
    });
    const t2 = steps[1].t;
    const t4 = steps[3].t;
    addLabel(svg, wrap, 'deep dip: primary eclipse', xFor(t2) + 12, g.yBottom - 12, 'diagram-label--tick diagram-label--right');
    addLabel(svg, wrap, 'shallow dip: secondary eclipse', xFor(t4), yFor(E.magnitudeAt(sys, t4)) + 34, 'diagram-label--tick');
  }

  // ------------------------------------------------------------------
  // 2. Why the dips differ
  // ------------------------------------------------------------------

  function drawWhy() {
    const svg = document.getElementById('why-diagram');
    const wrap = document.getElementById('why-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const demo = E.preset('demo');
    const hotT = demo.A.temperatureK;
    const coolT = demo.B.temperatureK;
    const ratio = E.surfaceBrightness(hotT) / E.surfaceBrightness(coolT);
    // Same-sized stars, overlapping by the same area: only which one is behind changes.
    [{ cx: 160, back: hotT, front: coolT, title: 'Hotter star hidden', lost: ratio }, { cx: 480, back: coolT, front: hotT, title: 'Cooler star hidden', lost: 1 }].forEach((p) => {
      svgEl('circle', { class: 'eb-why-back', cx: p.cx - 22, cy: 82, r: 42, fill: rgbString(D.starDisplayRgb(p.back)), stroke: '#0f1830', 'stroke-width': 1.5 }, svg);
      svgEl('circle', { class: 'eb-why-front', cx: p.cx + 22, cy: 82, r: 42, fill: rgbString(D.starDisplayRgb(p.front)), stroke: '#0f1830', 'stroke-width': 1.5 }, svg);
      addLabel(svg, wrap, p.title, p.cx, 20, 'diagram-label--tick diagram-label--strong');
      const w = 220 * (p.lost / ratio);
      svgEl('rect', { x: p.cx - 110, y: 140, width: 220, height: 16, rx: 3, fill: 'none', stroke: MUTED }, svg);
      svgEl('rect', { class: 'eb-why-bar', 'data-lost': p.lost.toFixed(3), x: p.cx - 110, y: 140, width: w, height: 16, rx: 3, fill: '#ffe08a' }, svg);
      addLabel(svg, wrap, p.lost === 1 ? 'light lost: a little' : `light lost: about ${Math.round(ratio)} times as much`, p.cx, 176, 'diagram-label--tick');
    });
    addLabel(svg, wrap, `${fmtK(hotT)} and ${fmtK(coolT)} stars, the same size`, 320, 204, 'diagram-label--tick');

    // Bottom: a flat-bottomed (total) dip and a V-shaped (partial) dip.
    [{ x0: 40, x1: 290, incl: 90, title: 'Flat bottom: total eclipse' }, { x0: 360, x1: 610, incl: 76, title: 'V-shaped: partial eclipse' }].forEach((box) => {
      const sys = { ...demo, inclinationDeg: box.incl, zeroDay: 0.5 };
      const depth = E.dips(sys).whenAHidden;
      L.drawLightCurve(svg, wrap, {
        x0: box.x0, x1: box.x1, yTop: 262, yBottom: 372, tMin: 0, tMax: 1,
        mTop: sys.brightestMag - 0.1, mBottom: sys.brightestMag + 1.25, fn: (t) => E.magnitudeAt(sys, t), brighterNote: false,
      });
      addLabel(svg, wrap, box.title, (box.x0 + box.x1) / 2, 244, 'diagram-label--tick diagram-label--strong');
      svg.dataset[box.incl === 90 ? 'totalDepth' : 'partialDepth'] = depth.toFixed(3);
      // How the stars sit at mid-eclipse.
      const mid = { x: (box.x0 + box.x1) / 2, y: 402 };
      drawPair(svg, sys, 0, mid.x, mid.y, 4.2, 'eb-why-mini');
    });
  }

  // ------------------------------------------------------------------
  // 3. Build an eclipsing binary
  // ------------------------------------------------------------------

  const state = { sys: E.preset('demo'), presetId: 'demo' };
  let playing = false;
  let lastTime = null;

  // Built from the Algol preset itself, so the facts and the model agree.
  const ALGOL = E.PRESETS.algol;
  const ALGOL_FACTS = [
    `Period: ${ALGOL.periodDays} days.`,
    `Star A: a hot blue-white star, about ${fmtK(ALGOL.A.temperatureK)}, about ${ALGOL.A.radius} times the Sun\u2019s radius.`,
    `Star B: a larger, cooler, dimmer companion, about ${fmtK(ALGOL.B.temperatureK)}, about ${ALGOL.B.radius} times the Sun\u2019s radius.`,
    `The stars are about ${ALGOL.separation} times the Sun\u2019s radius apart, with the orbit tilted about ${Math.round(ALGOL.inclinationDeg)}\u00b0: nearly edge-on.`,
    `Normally magnitude ${ALGOL.brightestMag}; at the deep dip about ${(ALGOL.brightestMag + E.dips(ALGOL).primaryDepth).toFixed(1)}. The shallow dip is so slight it is hard to see at all.`,
  ];

  const SLIDERS = {
    'a-radius': { get: () => state.sys.A.radius * 10, set: (v) => { state.sys.A.radius = v / 10; } },
    'a-temp': { get: () => state.sys.A.temperatureK / 100, set: (v) => { state.sys.A.temperatureK = v * 100; } },
    'b-radius': { get: () => state.sys.B.radius * 10, set: (v) => { state.sys.B.radius = v / 10; } },
    'b-temp': { get: () => state.sys.B.temperatureK / 100, set: (v) => { state.sys.B.temperatureK = v * 100; } },
    tilt: { get: () => state.sys.inclinationDeg * 10, set: (v) => { state.sys.inclinationDeg = v / 10; } },
  };

  // Every preset value is a whole number of slider steps (tenths of a
  // radius, hundreds of kelvin, tenths of a degree), so it lands on the grid.
  function loadPreset(id) {
    state.sys = E.preset(id);
    state.presetId = id;
    Object.entries(SLIDERS).forEach(([sliderId, s]) => {
      document.getElementById(sliderId).value = String(Math.round(s.get()));
    });
    document.querySelectorAll('#preset-buttons button').forEach((b) => {
      const on = b.dataset.preset === id;
      b.classList.toggle('preset-button-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    const facts = document.getElementById('preset-facts');
    facts.innerHTML = '';
    if (id === 'algol') {
      const h = document.createElement('h3');
      h.textContent = 'Algol';
      const ul = document.createElement('ul');
      ALGOL_FACTS.forEach((f) => {
        const li = document.createElement('li');
        li.textContent = f;
        ul.appendChild(li);
      });
      facts.append(h, ul);
    }
    drawSim();
  }

  function phase() {
    return Number(document.getElementById('phase').value) / 100;
  }

  function typeWords(type) {
    return {
      total: 'a total eclipse, so a flat-bottomed dip',
      annular: 'the smaller star wholly in front, so a flat-bottomed dip',
      partial: 'a partial eclipse, so a rounded, V-shaped dip',
      none: 'no eclipse at this tilt',
    }[type];
  }

  function drawSky() {
    const svg = document.getElementById('sky-diagram');
    const wrap = document.getElementById('sky-diagram-wrap');
    const sys = state.sys;
    clearDiagram(svg, wrap);
    panel(svg);
    starfield(svg, 640, 240, 40, 21);
    const cx = 320;
    const cy = 120;
    const scale = 13;
    const cosI = Math.abs(Math.cos((sys.inclinationDeg * Math.PI) / 180));
    const p0 = E.skyPositions(sys, 0.25);
    [['A', Math.abs(p0.A.x)], ['B', Math.abs(p0.B.x)]].forEach(([id, r]) => {
      svgEl('ellipse', { class: `eb-path eb-path--${id}`, cx, cy, rx: r * scale, ry: Math.max(0.5, r * scale * cosI), fill: 'none', stroke: MUTED, 'stroke-dasharray': id === 'A' ? '6 4' : '2 4' }, svg);
    });
    svgEl('path', { d: `M${cx - 5},${cy} h10 M${cx},${cy - 5} v10`, stroke: INK, 'stroke-width': 1.5 }, svg);
    const pos = drawPair(svg, sys, phase(), cx, cy, scale, 'eb-sim-star');
    const ax = cx + pos.A.x * scale;
    const ay = cy - pos.A.y * scale;
    const bx = cx + pos.B.x * scale;
    const by = cy - pos.B.y * scale;
    addLabel(svg, wrap, 'A', ax, Math.max(12, ay - sys.A.radius * scale - 10), 'diagram-label--tick diagram-label--strong eb-sky-label');
    addLabel(svg, wrap, 'B', bx, Math.min(228, by + sys.B.radius * scale + 12), 'diagram-label--tick diagram-label--strong eb-sky-label');
    addLabel(svg, wrap, `A: ${fmtK(sys.A.temperatureK)}`, 8, 16, 'diagram-label--tick diagram-label--right');
    addLabel(svg, wrap, `B: ${fmtK(sys.B.temperatureK)}`, 8, 46, 'diagram-label--tick diagram-label--right');
    svg.dataset.behind = pos.A.z > pos.B.z ? 'A' : 'B';
  }

  function drawCurve() {
    const svg = document.getElementById('curve-diagram');
    const wrap = document.getElementById('curve-diagram-wrap');
    const sys = { ...state.sys, zeroDay: 0.25 * state.sys.periodDays };
    const P = sys.periodDays;
    const d = E.dips(sys);
    clearDiagram(svg, wrap);
    panel(svg);
    const depth = Math.max(0.3, d.primaryDepth * 1.15);
    const mTop = sys.brightestMag - 0.08;
    const mBottom = sys.brightestMag + depth;
    const g = { x0: 70, x1: 610, yTop: 30, yBottom: 220, tMin: 0, tMax: 2 * P, mTop, mBottom };
    const { xFor, yFor } = L.drawLightCurve(svg, wrap, {
      ...g,
      fn: (t) => E.magnitudeAt(sys, t),
      samples: 900,
      mTicks: L.niceTicks(mTop + 0.02, mBottom - 0.12 * (mBottom - mTop), 3),
      tTicks: L.niceTicks(0, 2 * P, 5),
    });
    addLabel(svg, wrap, 'Apparent magnitude', 8, 12, 'diagram-label--tick diagram-label--right');
    addLabel(svg, wrap, 'Time (days)', (g.x0 + g.x1) / 2, g.yBottom + 42, 'diagram-label--tick');
    const t = phase() * P + sys.zeroDay;
    const tm = t > 2 * P ? t - P : t;
    svgEl('line', { class: 'eb-now', x1: xFor(tm), x2: xFor(tm), y1: g.yTop, y2: g.yBottom, stroke: '#9fd3ff', 'stroke-width': 2 }, svg);
    if (d.primaryDepth < 0.001) {
      addLabel(svg, wrap, 'no eclipses: the orbit is tilted too far from edge-on', 340, g.yBottom - 40, 'diagram-label--tick diagram-label--strong eb-curve-label');
    } else {
      const tDeep = sys.zeroDay + (d.hiddenAtPrimary === 'A' ? 0 : 0.5 * P);
      const tShallow = tDeep + 0.5 * P;
      const other = d.hiddenAtPrimary === 'A' ? 'B' : 'A';
      addLabel(svg, wrap, `deep dip: ${d.hiddenAtPrimary} hidden`, xFor(tDeep) + 10, g.yBottom - 14, 'diagram-label--tick diagram-label--right eb-curve-label');
      if (d.secondaryDepth >= 0.001) addLabel(svg, wrap, `shallow dip: ${other} hidden`, xFor(tShallow) + 10, Math.min(g.yBottom - 40, yFor(sys.brightestMag + d.secondaryDepth) + 20), 'diagram-label--tick diagram-label--right eb-curve-label');
    }
    svg.dataset.primaryDepth = d.primaryDepth.toFixed(4);
    svg.dataset.secondaryDepth = d.secondaryDepth.toFixed(4);
    svg.dataset.hiddenAtPrimary = d.primaryDepth < 0.001 ? 'none' : d.hiddenAtPrimary;
    return d;
  }

  function renderReadouts(d) {
    const sys = state.sys;
    const hotter = d.hotter;
    const deep = d.primaryDepth < 0.001
      ? 'none: the stars never pass in front of each other at this tilt.'
      : `${d.hiddenAtPrimary} hidden: ${fmt2(d.primaryDepth)} magnitudes fainter; ${typeWords(d.hiddenAtPrimary === 'A' ? d.typeA : d.typeB)}. ${
        d.hiddenAtPrimary === hotter ? `${d.hiddenAtPrimary} is the hotter star, so hiding it loses more light.` : 'The stars are the same temperature.'}`;
    const other = d.hiddenAtPrimary === 'A' ? 'B' : 'A';
    const shallow = d.secondaryDepth < 0.001
      ? 'none at this tilt.'
      : `${other} hidden: ${fmt2(d.secondaryDepth)} magnitudes fainter; ${typeWords(other === 'A' ? d.typeA : d.typeB)}.`;
    document.getElementById('deep-readout').textContent = deep;
    document.getElementById('shallow-readout').textContent = shallow;
    document.getElementById('tilt-readout').textContent =
      `only if tilted more than ${E.minimumInclinationDeg(sys).toFixed(1)}° from face-on; now ${sys.inclinationDeg.toFixed(1)}°.`;
    document.getElementById('a-radius-label').textContent = `${sys.A.radius.toFixed(1)} × the Sun’s`;
    document.getElementById('b-radius-label').textContent = `${sys.B.radius.toFixed(1)} × the Sun’s`;
    document.getElementById('a-temp-label').textContent = fmtK(sys.A.temperatureK);
    document.getElementById('b-temp-label').textContent = fmtK(sys.B.temperatureK);
    document.getElementById('tilt-label').textContent = `${sys.inclinationDeg.toFixed(1)}°`;
    document.getElementById('phase-label').textContent = `day ${(phase() * sys.periodDays).toFixed(2)} of ${sys.periodDays.toFixed(2)}`;
  }

  function drawSim() {
    drawSky();
    const d = drawCurve();
    renderReadouts(d);
  }

  function tick(time) {
    if (!playing) return;
    if (lastTime === null || time - lastTime > 50) {
      const s = document.getElementById('phase');
      s.value = String((Number(s.value) + 1) % 100);
      drawSim();
      lastTime = time;
    }
    requestAnimationFrame(tick);
  }

  function setPlaying(on) {
    playing = on;
    lastTime = null;
    const b = document.getElementById('play');
    b.setAttribute('aria-pressed', String(on));
    b.textContent = on ? 'Pause' : 'Play';
    if (on) requestAnimationFrame(tick);
  }

  function wireSim() {
    const box = document.getElementById('preset-buttons');
    [['demo', 'A simulated pair'], ['algol', 'Algol']].forEach(([id, name]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset-button';
      b.dataset.preset = id;
      b.textContent = name;
      b.addEventListener('click', () => loadPreset(id));
      box.appendChild(b);
    });
    Object.entries(SLIDERS).forEach(([id, s]) => {
      document.getElementById(id).addEventListener('input', (e) => {
        s.set(Number(e.target.value));
        drawSim();
      });
    });
    document.getElementById('phase').addEventListener('input', drawSim);
    document.getElementById('play').addEventListener('click', () => setPlaying(!playing));
    loadPreset('demo');
  }

  // ------------------------------------------------------------------
  // 4. Finding the period
  // ------------------------------------------------------------------

  const PERIOD_SYSTEMS = {
    demo: { ...E.preset('demo'), zeroDay: 1.0, spanDays: 16 },
    algol: { ...E.preset('algol'), zeroDay: 0.8, spanDays: 16 },
  };

  function periodSystem() {
    return PERIOD_SYSTEMS[document.getElementById('period-system').value];
  }

  function resetPeriodMarkers() {
    const sys = periodSystem();
    const { primary } = E.dipTimes(sys, 0, sys.spanDays);
    document.getElementById('m1').value = String(Math.round(primary[0] * 10));
    document.getElementById('m2').value = String(Math.round(primary[primary.length - 1] * 10));
    const sel = document.getElementById('cycles');
    sel.innerHTML = '';
    for (let n = 1; n <= 2 * primary.length; n += 1) {
      const o = document.createElement('option');
      o.value = String(n);
      o.textContent = String(n);
      sel.appendChild(o);
    }
    sel.value = String(primary.length - 1);
  }

  function nearestDipKind(sys, t) {
    const { primary, secondary } = E.dipTimes(sys, -sys.periodDays, sys.spanDays + sys.periodDays);
    const near = (list) => Math.min(...list.map((x) => Math.abs(x - t)));
    return near(primary) <= near(secondary) ? 'deep' : 'shallow';
  }

  function drawPeriod() {
    const sys = periodSystem();
    const svg = document.getElementById('period-diagram');
    const wrap = document.getElementById('period-diagram-wrap');
    const t1 = Number(document.getElementById('m1').value) / 10;
    const t2 = Number(document.getElementById('m2').value) / 10;
    const n = Number(document.getElementById('cycles').value);
    clearDiagram(svg, wrap);
    panel(svg);
    const d = E.dips(sys);
    const mTop = sys.brightestMag - 0.1;
    const mBottom = sys.brightestMag + d.primaryDepth * 1.15;
    const g = { x0: 64, x1: 610, yTop: 30, yBottom: 210, tMin: 0, tMax: sys.spanDays, mTop, mBottom };
    const { xFor } = L.drawLightCurve(svg, wrap, { ...g, fn: (t) => E.magnitudeAt(sys, t), samples: 1200, tGrid: 1, mTicks: L.niceTicks(mTop + 0.05, mBottom - 0.12 * (mBottom - mTop), 3), tTicks: [0, 2, 4, 6, 8, 10, 12, 14, 16] });
    addLabel(svg, wrap, 'Apparent magnitude', 8, 12, 'diagram-label--tick diagram-label--right');
    addLabel(svg, wrap, 'Time (days)', (g.x0 + g.x1) / 2, g.yBottom + 72, 'diagram-label--tick');
    const x1 = xFor(t1);
    const x2 = xFor(t2);
    [x1, x2].forEach((x) => svgEl('line', { class: 'eb-marker', x1: x, x2: x, y1: g.yTop, y2: g.yBottom + 26, stroke: '#9fd3ff', 'stroke-width': 2 }, svg));
    if (Math.abs(x2 - x1) >= 70) {
      addLabel(svg, wrap, 'start', Math.min(x1, x2), g.yBottom + 44, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'end', Math.max(x1, x2), g.yBottom + 44, 'diagram-label--tick diagram-label--strong');
    } else {
      addLabel(svg, wrap, 'start and end', (x1 + x2) / 2, g.yBottom + 44, 'diagram-label--tick diagram-label--strong');
    }
    const r = E.periodFromDips(t1, t2, n);
    const kinds = [nearestDipKind(sys, t1), nearestDipKind(sys, t2)];
    const trap = kinds.includes('shallow');
    svg.dataset.period = r.period.toFixed(3);
    svg.dataset.trap = String(trap);
    document.getElementById('m1-label').textContent = `day ${t1.toFixed(1)}`;
    document.getElementById('m2-label').textContent = `day ${t2.toFixed(1)}`;
    const oneCycle = ((2 * 0.25) / sys.periodDays) * 100;
    const readout = document.getElementById('period-readout');
    readout.dataset.trap = String(trap);
    readout.textContent =
      (trap ? 'Careful: a marker is on a shallow dip. Time from a deep dip to a deep dip; deep to shallow is only half the period. ' : '') +
      `Timed: ${r.span.toFixed(1)} days for ${n} cycle${n === 1 ? '' : 's'}, so the period is ${r.span.toFixed(1)} ÷ ${n} = ${fmt2(r.period)} days. ` +
      `Reading each marker to about ±0.25 days gives ${fmt2(r.low)} to ${fmt2(r.high)} days; half that range is the uncertainty: about ±${fmt2(r.uncertaintyDays)} days ` +
      `(±${r.percent < 100 ? r.percent.toFixed(1) : '100+'}%). One cycle alone would give about ±${oneCycle.toFixed(0)}%, so timing more cycles shrinks the percentage uncertainty.`;
  }

  function wirePeriod() {
    const sel = document.getElementById('period-system');
    [['demo', 'A simulated eclipsing binary'], ['algol', 'Algol']].forEach(([id, name]) => {
      const o = document.createElement('option');
      o.value = id;
      o.textContent = name;
      sel.appendChild(o);
    });
    sel.value = 'demo';
    sel.addEventListener('change', () => {
      resetPeriodMarkers();
      drawPeriod();
    });
    ['m1', 'm2'].forEach((id) => document.getElementById(id).addEventListener('input', drawPeriod));
    document.getElementById('cycles').addEventListener('change', drawPeriod);
    resetPeriodMarkers();
    drawPeriod();
  }

  // ------------------------------------------------------------------

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }

  drawIntro();
  drawWhy();
  wireSim();
  wirePeriod();
  renderCoverage();
  Glossary.init({
    lightCurve:
      "A light curve: a graph of a star's brightness (its apparent magnitude) against time, with the magnitude axis upside down so brighter is higher. Covered in full on Variable stars and Cepheids.",
  });
  QuizUI.mount(EclipsingBinariesQuestions.makeQuestions(E));
  if (!REDUCED_MOTION) setPlaying(true);
})();
