(function () {
  const V = window.VariableStars;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, svgEl, clearDiagram, addLabel, panel, rgbString } = D;

  const CURRICULUM_UNITS = ['u4.11'];

  const GLOSSARY = {
    lightCurve:
      "A light curve: a graph of a star's brightness (usually its apparent magnitude) against time. Its shape and repeat time tell you what kind of variable star it is.",
    apparentMagnitude:
      'Apparent magnitude (m): how bright a star looks from Earth. Smaller numbers are brighter. Covered in full on Magnitude: how bright is a star?',
    standardCandle:
      'A standard candle: an object whose luminosity we can know without knowing its distance. Comparing how bright it really is with how bright it looks gives its distance.',
  };

  const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const signed = V.signed;
  const fmt1 = (x) => x.toFixed(1);

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

  function glowDefs(svg) {
    const defs = svgEl('defs', {}, svg);
    const grad = svgEl('radialGradient', { id: `${svg.id}-glow` }, defs);
    svgEl('stop', { offset: '0%', 'stop-color': '#fff6d8', 'stop-opacity': '0.9' }, grad);
    svgEl('stop', { offset: '100%', 'stop-color': '#fff6d8', 'stop-opacity': '0' }, grad);
  }

  // Shared with notes/eclipsing-binaries.html.
  const { drawLightCurve, niceTicks } = window.LightCurveDrawing;

  // ------------------------------------------------------------------
  // 1. What a light curve is
  // ------------------------------------------------------------------

  function drawIntro() {
    const svg = document.getElementById('intro-diagram');
    const wrap = document.getElementById('intro-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    glowDefs(svg);
    const star = V.galleryById('delta-cephei');
    const g = { x0: 90, x1: 610, yTop: 120, yBottom: 290, tMin: 0, tMax: 15.5, mTop: 3.3, mBottom: 4.6 };
    const { xFor, yFor } = drawLightCurve(svg, wrap, { ...g, fn: (t) => V.magnitudeAt(star, t), mTicks: [3.5, 4.0, 4.5], tTicks: [0, 5, 10, 15] });
    addLabel(svg, wrap, 'Apparent magnitude', 8, 88, 'diagram-label--tick diagram-label--right');
    addLabel(svg, wrap, 'Time (days)', (g.x0 + g.x1) / 2, g.yBottom + 42, 'diagram-label--tick');
    // The star drawn above each peak and each dip, bright or dim.
    const peaks = [0, star.periodDays, 2 * star.periodDays];
    const dips = peaks.map((t) => t + (1 - star.riseFraction) * star.periodDays).filter((t) => t <= g.tMax);
    [...peaks.map((t) => [t, true]), ...dips.map((t) => [t, false])].forEach(([t, bright]) => {
      const x = xFor(t);
      svgEl('line', { x1: x, x2: x, y1: 74, y2: yFor(V.magnitudeAt(star, t)) - 6, stroke: MUTED, 'stroke-width': 0.8, 'stroke-dasharray': '2 4' }, svg);
      svgEl('circle', { cx: x, cy: 52, r: bright ? 22 : 12, fill: `url(#${svg.id}-glow)` }, svg);
      svgEl('circle', { class: bright ? 'vs-star-bright' : 'vs-star-dim', cx: x, cy: 52, r: 9, fill: bright ? '#fff1c4' : '#8a7f62', stroke: '#0f1830' }, svg);
    });
    addLabel(svg, wrap, 'brightest', xFor(peaks[1]), 18, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'faintest', xFor(dips[1]), 18, 'diagram-label--tick diagram-label--strong');
  }

  // ------------------------------------------------------------------
  // 2. The gallery and the matching activity
  // ------------------------------------------------------------------

  // A fixed scrambled order, lettered A to F.
  const CARD_ORDER = ['delta-cephei', 'nova', 'algol', 'mira', 'supernova', 'rr-lyrae'];
  const KIND_LABEL = {
    'rr-lyrae': 'short period (RR Lyrae)',
    mira: 'long period (Mira)',
    algol: 'eclipsing binary (Algol)',
    'delta-cephei': 'Cepheid (Delta Cephei)',
    nova: 'nova',
    supernova: 'supernova',
  };
  const gallery = { checked: false };

  function cardLetter(i) {
    return String.fromCharCode(65 + i);
  }

  function drawCard(id, i) {
    const star = V.galleryById(id);
    const svg = document.getElementById(`card-${id}`);
    const wrap = document.getElementById(`card-${id}-wrap`);
    clearDiagram(svg, wrap);
    panel(svg);
    const lo = star.outburst ? star.outburst.peak - 0.5 : star.brightest - 0.2 * (star.faintest - star.brightest) - 0.05;
    const hi = star.outburst ? (star.outburst.quiet + star.outburst.peak) / 2 + 3 : star.faintest + 0.2 * (star.faintest - star.brightest) + 0.05;
    const mTicks = niceTicks(lo, hi, 3);
    const tTicks = niceTicks(0, star.spanDays, 5);
    const g = { x0: 52, x1: 286, yTop: 14, yBottom: 150, tMin: 0, tMax: star.spanDays, mTop: lo, mBottom: hi };
    const { yFor } = drawLightCurve(svg, wrap, { ...g, fn: (t) => V.magnitudeAt(star, t), mTicks, tTicks, mFormat: (m) => (Math.abs(m) >= 10 || Number.isInteger(m) ? String(m) : fmt1(m)) });
    addLabel(svg, wrap, 'Time (days)', (g.x0 + g.x1) / 2, g.yBottom + 36, 'diagram-label--tick');
    if (star.outburst && star.outburst.galaxy) {
      const y = yFor(star.outburst.galaxy);
      svgEl('line', { class: 'vs-galaxy-line', x1: g.x0, x2: g.x1, y1: y, y2: y, stroke: INK, 'stroke-dasharray': '4 4', opacity: 0.8 }, svg);
      addLabel(svg, wrap, 'whole galaxy', g.x1 - 4, y + 11, 'diagram-label--tick diagram-label--left');
    }
    const showAnswer = document.getElementById('gallery-answers').checked;
    const select = document.querySelector(`.vs-card[data-star="${id}"] select`);
    const mark = gallery.checked && select.value ? (select.value === id ? ' ✓' : ' ✗') : '';
    const card = document.querySelector(`.vs-card[data-star="${id}"]`);
    card.querySelector('h3').textContent = `Curve ${cardLetter(i)}${mark}${showAnswer ? `: ${star.name}` : ''}`;
    if (showAnswer) addLabel(svg, wrap, star.name, (g.x0 + g.x1) / 2, g.yTop + 11, 'diagram-label--tick diagram-label--strong vs-answer-label');
    const facts = card.querySelector('.vs-card-facts');
    facts.hidden = !(showAnswer || (gallery.checked && select.value === id));
    svg.dataset.result = mark.includes('✓') ? 'right' : mark.includes('✗') ? 'wrong' : 'none';
  }

  function drawGallery() {
    CARD_ORDER.forEach((id, i) => drawCard(id, i));
  }

  function buildGallery() {
    const box = document.getElementById('gallery-cards');
    CARD_ORDER.forEach((id, i) => {
      const star = V.galleryById(id);
      const card = document.createElement('div');
      card.className = 'vs-card';
      card.dataset.star = id;
      card.innerHTML = '';
      const h = document.createElement('h3');
      h.textContent = `Curve ${cardLetter(i)}`;
      const panelDiv = document.createElement('div');
      panelDiv.className = 'diagram spectrum-panel vs-card-panel';
      const wrap = document.createElement('div');
      wrap.className = 'labelled-diagram-wrap';
      wrap.id = `card-${id}-wrap`;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      [['id', `card-${id}`], ['class', 'responsive-svg'], ['width', '300'], ['height', '200'], ['viewBox', '0 0 300 200'], ['role', 'img'],
        ['aria-label', `Curve ${cardLetter(i)}: apparent magnitude against time in days, brighter at the top.`]].forEach(([k, v]) => svg.setAttribute(k, v));
      wrap.appendChild(svg);
      panelDiv.appendChild(wrap);
      const label = document.createElement('label');
      label.textContent = 'This is: ';
      const select = document.createElement('select');
      const blank = document.createElement('option');
      blank.value = '';
      blank.textContent = 'Choose…';
      select.appendChild(blank);
      V.GALLERY.forEach((s) => {
        const o = document.createElement('option');
        o.value = s.id;
        o.textContent = KIND_LABEL[s.id];
        select.appendChild(o);
      });
      select.addEventListener('change', () => drawCard(id, i));
      label.appendChild(select);
      const facts = document.createElement('ul');
      facts.className = 'vs-card-facts';
      facts.hidden = true;
      star.facts.forEach((f) => {
        const li = document.createElement('li');
        li.textContent = f;
        facts.appendChild(li);
      });
      card.append(h, panelDiv, label, facts);
      box.appendChild(card);
    });
    document.getElementById('gallery-check').addEventListener('click', () => {
      gallery.checked = true;
      const right = CARD_ORDER.filter((id) => document.querySelector(`.vs-card[data-star="${id}"] select`).value === id).length;
      const fb = document.getElementById('gallery-feedback');
      fb.dataset.score = String(right);
      fb.textContent = right === CARD_ORDER.length
        ? `All ${right} right.`
        : `${right} of ${CARD_ORDER.length} right. A cross marks a curve to look at again: check its period on the time axis, and its shape.`;
      drawGallery();
    });
    document.getElementById('gallery-answers').addEventListener('change', drawGallery);
  }

  function fillGalleryTable() {
    const body = document.getElementById('gallery-table-body');
    V.GALLERY.forEach((s) => {
      const tr = document.createElement('tr');
      const period = s.periodText || 'none: a one-off outburst';
      const range = s.rangeText || `${fmt1(s.brightest)} to ${fmt1(s.faintest)}`;
      [s.name, capitalise(s.kind), period, range].forEach((v) => {
        const td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
  }

  // ------------------------------------------------------------------
  // 3. Why Cepheids vary
  // ------------------------------------------------------------------

  let pulsePlaying = false;
  let pulseLast = null;

  // Over one pulsation: size largest at phase 0, smallest at 0.5; the
  // light (Delta Cephei's own curve shape) peaks just after the smallest size.
  const sizeAt = (phase) => Math.cos(2 * Math.PI * phase);
  const lightAt = (phase) => V.pulsation(phase - 0.55, 0.3);

  function drawPulse() {
    const svg = document.getElementById('pulse-diagram');
    const wrap = document.getElementById('pulse-diagram-wrap');
    const phase = Number(document.getElementById('pulse-slider').value) / 100;
    clearDiagram(svg, wrap);
    panel(svg);
    glowDefs(svg);
    const rand = seeded(9);
    for (let i = 0; i < 30; i += 1) svgEl('circle', { cx: 10 + rand() * 270, cy: 10 + rand() * 260, r: 0.8, fill: '#fff', opacity: 0.35 }, svg);
    const r = 62 + 16 * sizeAt(phase);
    const b = lightAt(phase);
    svgEl('circle', { cx: 145, cy: 135, r: r * (1.5 + 0.6 * b), fill: `url(#${svg.id}-glow)`, opacity: 0.35 + 0.65 * b }, svg);
    const lit = [255, 220 + 25 * b, 150 + 80 * b];
    svgEl('circle', { class: 'vs-pulse-star', cx: 145, cy: 135, r, fill: rgbString(lit, 0.55 + 0.45 * b), stroke: '#0f1830', 'stroke-width': 1.5 }, svg);
    svgEl('circle', { cx: 145, cy: 135, r: 78, fill: 'none', stroke: MUTED, 'stroke-dasharray': '3 4' }, svg);
    svgEl('circle', { cx: 145, cy: 135, r: 46, fill: 'none', stroke: MUTED, 'stroke-dasharray': '3 4' }, svg);
    addLabel(svg, wrap, 'largest and smallest size', 145, 258, 'diagram-label--tick');
    svg.dataset.radius = r.toFixed(2);
    svg.dataset.brightness = b.toFixed(3);

    // Two traces against phase, with a marker at the chosen moment.
    const x0 = 330;
    const x1 = 620;
    const traces = [
      { title: 'Size', note: '↑ bigger', top: 30, bottom: 110, f: (p) => (sizeAt(p) + 1) / 2 },
      { title: 'Brightness', note: '↑ brighter', top: 160, bottom: 240, f: lightAt },
    ];
    traces.forEach((tr) => {
      svgEl('rect', { x: x0, y: tr.top, width: x1 - x0, height: tr.bottom - tr.top, fill: 'none', stroke: MUTED }, svg);
      const pts = [];
      for (let i = 0; i <= 100; i += 1) {
        const p = i / 100;
        pts.push(`${(x0 + p * (x1 - x0)).toFixed(1)},${(tr.bottom - tr.f(p) * (tr.bottom - tr.top - 8) - 4).toFixed(1)}`);
      }
      svgEl('polyline', { points: pts.join(' '), fill: 'none', stroke: '#ffe08a', 'stroke-width': 2 }, svg);
      addLabel(svg, wrap, tr.title, x0, tr.top - 12, 'diagram-label--tick diagram-label--strong diagram-label--right');
      addLabel(svg, wrap, tr.note, x1, tr.top - 12, 'diagram-label--tick diagram-label--left');
      const mx = x0 + phase * (x1 - x0);
      svgEl('line', { class: 'vs-pulse-marker', x1: mx, x2: mx, y1: tr.top, y2: tr.bottom, stroke: INK, 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, svg);
    });
    addLabel(svg, wrap, 'one pulsation →', (x0 + x1) / 2, 258, 'diagram-label--tick');
    document.getElementById('pulse-label').textContent = `day ${(phase * V.galleryById('delta-cephei').periodDays).toFixed(1)} of ${V.galleryById('delta-cephei').periodDays.toFixed(1)}`;
  }

  function pulseTick(time) {
    if (!pulsePlaying) return;
    if (pulseLast !== null && time - pulseLast > 60) {
      const s = document.getElementById('pulse-slider');
      s.value = String((Number(s.value) + 1) % 100);
      drawPulse();
      pulseLast = time;
    } else if (pulseLast === null) {
      pulseLast = time;
    }
    requestAnimationFrame(pulseTick);
  }

  function setPulsePlaying(on) {
    pulsePlaying = on;
    pulseLast = null;
    const b = document.getElementById('pulse-play');
    b.setAttribute('aria-pressed', String(on));
    b.textContent = on ? 'Pause' : 'Play';
    if (on) requestAnimationFrame(pulseTick);
  }

  // ------------------------------------------------------------------
  // 4. Measuring distance with a Cepheid
  // ------------------------------------------------------------------

  const PERIOD_G = { x0: 64, x1: 500, yTop: 30, yBottom: 240 };
  const PL_G = { x0: 90, x1: 600, yTop: 46, yBottom: 260, mTop: -7, mBottom: -1, pMin: 1, pMax: 100 };

  function currentCepheid() {
    return V.cepheidById(document.getElementById('cepheid-select').value);
  }

  const tenths = (id) => Number(document.getElementById(id).value) / 10;

  function measurement() {
    const c = currentCepheid();
    const t1 = tenths('t1-slider');
    const t2 = tenths('t2-slider');
    const cycles = Number(document.getElementById('cycles-select').value);
    return { c, t1, t2, cycles, timing: V.periodFromTiming(t1, t2, cycles) };
  }

  // Sliders hold tenths of a day (whole numbers, so every value is on the
  // step grid); the markers start on the first and last peaks in view.
  function resetMarkers() {
    const c = currentCepheid();
    const max = Math.round(c.spanDays * 10);
    const t1 = document.getElementById('t1-slider');
    const t2 = document.getElementById('t2-slider');
    t1.max = String(max);
    t2.max = String(max);
    const peaks = V.maximaBetween(c, 0, c.spanDays);
    t1.value = String(Math.round(peaks[0] * 10));
    t2.value = String(Math.round(peaks[peaks.length - 1] * 10));
    const sel = document.getElementById('cycles-select');
    sel.innerHTML = '';
    for (let n = 1; n <= peaks.length; n += 1) {
      const o = document.createElement('option');
      o.value = String(n);
      o.textContent = String(n);
      sel.appendChild(o);
    }
    sel.value = String(peaks.length - 1);
  }

  function drawPeriod() {
    const { c, t1, t2, cycles, timing } = measurement();
    const svg = document.getElementById('period-diagram');
    const wrap = document.getElementById('period-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const mTop = c.brightest - 0.3;
    const mBottom = c.faintest + 0.3;
    const g = { ...PERIOD_G, tMin: 0, tMax: c.spanDays, mTop, mBottom };
    const { xFor, yFor } = drawLightCurve(svg, wrap, { ...g, fn: (t) => V.magnitudeAt(c, t), mTicks: niceTicks(mTop + 0.1, mBottom - 0.15, 3), tTicks: niceTicks(0, c.spanDays, 5), brighterNote: true });
    addLabel(svg, wrap, 'Apparent magnitude', 8, 12, 'diagram-label--tick diagram-label--right');
    addLabel(svg, wrap, 'Time (days)', (g.x0 + g.x1) / 2, g.yBottom + 72, 'diagram-label--tick');
    const avg = V.averageMagnitude(c.brightest, c.faintest);
    [[c.brightest, 'brightest'], [avg, 'average'], [c.faintest, 'faintest']].forEach(([m, word]) => {
      const y = yFor(m);
      svgEl('line', { class: `vs-level vs-level--${word}`, x1: g.x0, x2: g.x1, y1: y, y2: y, stroke: word === 'average' ? INK : MUTED, 'stroke-width': word === 'average' ? 1.6 : 1, 'stroke-dasharray': '6 4' }, svg);
      addLabel(svg, wrap, word === 'average' ? 'average m' : word, g.x1 + 6, y, 'diagram-label--tick diagram-label--right vs-level-label');
    });
    // Markers.
    const x1 = xFor(t1);
    const x2 = xFor(t2);
    [x1, x2].forEach((x) => svgEl('line', { class: 'vs-marker', x1: x, x2: x, y1: g.yTop, y2: g.yBottom + 26, stroke: '#9fd3ff', 'stroke-width': 2 }, svg));
    const yb = g.yBottom - 12;
    svgEl('path', { d: `M${Math.min(x1, x2)},${yb} H${Math.max(x1, x2)}`, stroke: '#9fd3ff', 'stroke-width': 1.5, 'marker-end': '' }, svg);
    if (Math.abs(x2 - x1) >= 70) {
      addLabel(svg, wrap, 'start', Math.min(x1, x2), g.yBottom + 44, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'end', Math.max(x1, x2), g.yBottom + 44, 'diagram-label--tick diagram-label--strong');
    } else {
      addLabel(svg, wrap, 'start and end', (x1 + x2) / 2, g.yBottom + 44, 'diagram-label--tick diagram-label--strong');
    }
    svg.dataset.period = timing.period.toFixed(3);
    svg.dataset.average = avg.toFixed(2);
    document.getElementById('t1-label').textContent = `day ${fmt1(t1)}`;
    document.getElementById('t2-label').textContent = `day ${fmt1(t2)}`;
    const oneCycle = ((2 * V.TIME_READING_DAYS) / c.periodDays) * 100;
    document.getElementById('period-readout').textContent =
      `Timed: ${fmt1(timing.span)} days for ${cycles} cycle${cycles === 1 ? '' : 's'}, so the period is ${fmt1(timing.span)} ÷ ${cycles} = ${timing.period.toFixed(2)} days. ` +
      `Each marker is read to about ±${V.TIME_READING_DAYS} days, so the timing is uncertain by about ±${(2 * V.TIME_READING_DAYS).toFixed(1)} days: ` +
      `±${timing.percent < 100 ? timing.percent.toFixed(1) : '100+'}% of the time measured. Timing just one cycle would give about ±${oneCycle.toFixed(0)}%; ` +
      'more cycles means a longer measurement with the same reading uncertainty, so a smaller percentage uncertainty.';
    return { c, timing, avg };
  }

  function drawPL(periodDays) {
    const svg = document.getElementById('pl-diagram');
    const wrap = document.getElementById('pl-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const g = PL_G;
    const lg = (p) => Math.log10(p);
    const xFor = (p) => g.x0 + ((lg(p) - lg(g.pMin)) / (lg(g.pMax) - lg(g.pMin))) * (g.x1 - g.x0);
    const yFor = (M) => g.yTop + ((M - g.mTop) / (g.mBottom - g.mTop)) * (g.yBottom - g.yTop);
    svgEl('rect', { x: g.x0, y: g.yTop, width: g.x1 - g.x0, height: g.yBottom - g.yTop, fill: 'none', stroke: MUTED }, svg);
    for (let M = g.mTop; M <= g.mBottom; M += 1) {
      const y = yFor(M);
      svgEl('line', { x1: g.x0, x2: g.x1, y1: y, y2: y, stroke: MUTED, 'stroke-width': 0.5, opacity: 0.35 }, svg);
      addLabel(svg, wrap, signed(M, 0), g.x0 - 8, y, 'diagram-label--tick diagram-label--left');
    }
    [1, 3, 10, 30, 100].forEach((p) => {
      const x = xFor(p);
      svgEl('line', { x1: x, x2: x, y1: g.yTop, y2: g.yBottom + 5, stroke: MUTED, 'stroke-width': 0.5, opacity: 0.5 }, svg);
      addLabel(svg, wrap, String(p), x, g.yBottom + 16, 'diagram-label--tick');
    });
    addLabel(svg, wrap, 'Absolute magnitude M', 8, 12, 'diagram-label--tick diagram-label--right');
    addLabel(svg, wrap, 'Period (days), log scale', (g.x0 + g.x1) / 2, g.yBottom + 44, 'diagram-label--tick');
    addLabel(svg, wrap, '↑ more luminous', g.x0 + 6, g.yTop + 11, 'diagram-label--tick diagram-label--right');
    // The relation, drawn as a band as wide as the graph can be read.
    const band = [];
    const line = [];
    for (let i = 0; i <= 50; i += 1) {
      const p = Math.pow(10, (2 * i) / 50);
      const M = V.absoluteMagnitudeFromPeriod(p);
      band.push([xFor(p), yFor(M - V.PL_READING_HALF_WIDTH)]);
      line.push(`${xFor(p).toFixed(1)},${yFor(M).toFixed(1)}`);
    }
    const lower = [];
    for (let i = 50; i >= 0; i -= 1) {
      const p = Math.pow(10, (2 * i) / 50);
      lower.push([xFor(p), yFor(V.absoluteMagnitudeFromPeriod(p) + V.PL_READING_HALF_WIDTH)]);
    }
    svgEl('polygon', { points: [...band, ...lower].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '), fill: 'rgba(255,224,138,0.25)', stroke: 'none' }, svg);
    svgEl('polyline', { points: line.join(' '), fill: 'none', stroke: '#ffe08a', 'stroke-width': 2 }, svg);
    // The reading.
    const p = Math.min(g.pMax, Math.max(g.pMin, periodDays));
    const M = V.readAbsoluteMagnitude(p);
    const x = xFor(p);
    const y = yFor(M);
    svgEl('line', { class: 'vs-pl-up', x1: x, x2: x, y1: g.yBottom, y2: y, stroke: INK, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, svg);
    svgEl('line', { class: 'vs-pl-across', x1: g.x0, x2: x, y1: y, y2: y, stroke: INK, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, svg);
    svgEl('circle', { cx: x, cy: y, r: 5, fill: INK }, svg);
    const label = addLabel(svg, wrap, `M ≈ ${signed(M)}`, g.x0 + 8, y + 13, 'diagram-label--tick diagram-label--strong diagram-label--right vs-pl-reading');
    label.dataset.m = String(M);
    svg.dataset.m = String(M);
    return M;
  }

  function renderWorking(c, timing, avg) {
    const P = timing.period;
    const r = V.cepheidDistance(P, avg);
    // Best estimate and uncertainty to 2 significant figures; the range's ends to 3.
    const fmtPc = (d, sf = 2) => Number(d.toPrecision(sf)).toLocaleString('en-GB');
    const steps = [
      `Period: ${timing.period.toFixed(2)} days (from Step 1).`,
      `The period-luminosity graph gives M ≈ ${signed(r.M)}; read as ${signed(r.bright)} to ${signed(r.faint)}.`,
      `Average apparent magnitude: halfway between brightest ${signed(c.brightest)} and faintest ${signed(c.faintest)}, so m = ${signed(avg, 2)}.`,
      `M = m + 5 − 5 log d, so 5 log d = m − M + 5 = ${signed(avg, 2)} − (${signed(r.M)}) + 5 = ${(avg - r.M + 5).toFixed(2)}, log d = ${r.logD.toFixed(2)}, and d ≈ ${fmtPc(r.distancePc)} pc.`,
      `Using M = ${signed(r.faint)} and ${signed(r.bright)} gives ${fmtPc(r.nearPc, 3)} to ${fmtPc(r.farPc, 3)} pc, so the uncertainty is half that range: about ±${fmtPc(r.uncertaintyPc)} pc.`,
    ];
    const list = document.getElementById('distance-working');
    list.innerHTML = '';
    steps.forEach((s) => {
      const li = document.createElement('li');
      li.textContent = s;
      list.appendChild(li);
    });
    list.dataset.distance = r.distancePc.toFixed(1);
  }

  function updateDistance() {
    const { c, timing, avg } = drawPeriod();
    drawPL(timing.period);
    renderWorking(c, timing, avg);
  }

  function wireDistance() {
    const sel = document.getElementById('cepheid-select');
    V.CEPHEIDS.forEach((c) => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.name;
      sel.appendChild(o);
    });
    sel.value = 'lmc';
    sel.addEventListener('change', () => {
      resetMarkers();
      updateDistance();
    });
    ['t1-slider', 't2-slider'].forEach((id) => document.getElementById(id).addEventListener('input', updateDistance));
    document.getElementById('cycles-select').addEventListener('change', updateDistance);
    resetMarkers();
    updateDistance();
  }

  // ------------------------------------------------------------------
  // 5. Standard candles
  // ------------------------------------------------------------------

  function drawCandles() {
    const svg = document.getElementById('candle-diagram');
    const wrap = document.getElementById('candle-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    glowDefs(svg);
    [[110, 1, '1 unit away', 'full brightness'], [320, 2, '2 units away', '¼ as bright'], [530, 4, '4 units away', '1/16 as bright']].forEach(([x, d, dist, bright]) => {
      const s = 1 / Math.sqrt(d);
      const alpha = 1 / (d * d);
      svgEl('circle', { cx: x, cy: 70, r: 46 * s + 10, fill: `url(#${svg.id}-glow)`, opacity: Math.max(0.15, alpha) }, svg);
      svgEl('rect', { class: 'vs-candle', x: x - 10 * s, y: 80, width: 20 * s, height: 70 * s, rx: 3, fill: '#f2ead6', stroke: '#0f1830' }, svg);
      svgEl('path', { d: `M${x},${80 - 22 * s} q${7 * s},${12 * s} 0,${20 * s} q${-7 * s},${-8 * s} 0,${-20 * s} Z`, fill: '#ffd166', opacity: Math.max(0.3, Math.sqrt(alpha)) }, svg);
      addLabel(svg, wrap, dist, x, 172, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, bright, x, 204, 'diagram-label--tick');
    });
  }

  // ------------------------------------------------------------------

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }

  drawIntro();
  buildGallery();
  drawGallery();
  fillGalleryTable();
  document.getElementById('pulse-slider').addEventListener('input', drawPulse);
  document.getElementById('pulse-play').addEventListener('click', () => setPulsePlaying(!pulsePlaying));
  drawPulse();
  wireDistance();
  drawCandles();
  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(VariableStarsQuestions.makeQuestions(V));
  if (!REDUCED_MOTION) setPulsePlaying(true);
})();
