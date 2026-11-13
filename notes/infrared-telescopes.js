(function () {
  const I = window.InfraredSites;
  const W = window.AtmosphereWindows;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, svgEl, clearDiagram, addLabel, panel } = D;

  const CURRICULUM_UNITS = ['u5.6'];
  const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IR = '#ff9f6b';
  const ROCK = '#4a4f63';

  function seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function starfield(svg, x0, y0, w, h, n, seed) {
    const rand = seeded(seed);
    for (let i = 0; i < n; i += 1) svgEl('circle', { cx: x0 + 6 + rand() * (w - 12), cy: y0 + 6 + rand() * (h - 12), r: 0.9, fill: '#fff', opacity: 0.4 }, svg);
  }

  // ------------------------------------------------------------------
  // 1. Which telescopes can sit at sea level
  // ------------------------------------------------------------------

  const SHORT_NAMES = { 'Gamma ray': 'Gamma', 'X-ray': 'X-ray', Ultraviolet: 'UV', Optical: 'Visible', Infrared: 'Infrared', Radio: 'Radio' };
  const MARKS = { open: '✓', partial: '∼', blocked: '✗' };

  function drawWindows() {
    const svg = document.getElementById('windows-chart');
    const wrap = document.getElementById('windows-chart-wrap');
    clearDiagram(svg, wrap);
    W.draw(svg, { text: false });
    W.BANDS.forEach((band, i) => {
      const x = W.bandCentre(i);
      addLabel(svg, wrap, MARKS[band.category], x, 19, `diagram-label--tick diagram-label--strong ir-mark ir-mark--${band.category}`);
      addLabel(svg, wrap, SHORT_NAMES[band.name], x, W.GROUND_Y + 24, 'diagram-label--tick');
    });
    addLabel(svg, wrap, "Earth's surface", 320, W.GROUND_Y + 54, 'diagram-label--tick diagram-label--strong');
  }

  function dome(svg, x, groundY, cls) {
    svgEl('rect', { class: cls, x: x - 16, y: groundY - 14, width: 32, height: 14, fill: '#d7dde8' }, svg);
    svgEl('path', { class: cls, d: `M${x - 16},${groundY - 14} A16,16 0 0 1 ${x + 16},${groundY - 14} Z`, fill: '#eef3fb' }, svg);
    svgEl('rect', { x: x - 3, y: groundY - 30, width: 6, height: 10, fill: '#0f1830' }, svg);
  }

  function radioDish(svg, x, groundY) {
    svgEl('line', { x1: x, y1: groundY, x2: x, y2: groundY - 18, stroke: '#c9d3e3', 'stroke-width': 4 }, svg);
    svgEl('path', { class: 'ir-radio-dish', d: `M${x - 22},${groundY - 34} Q${x},${groundY - 6} ${x + 22},${groundY - 34}`, fill: 'none', stroke: '#c9d3e3', 'stroke-width': 5 }, svg);
  }

  function drawSites() {
    const svg = document.getElementById('sites-diagram');
    const wrap = document.getElementById('sites-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    starfield(svg, 0, 0, 640, 110, 40, 3);
    const ground = 292;
    // Where X-rays are absorbed: high up, far above any mountain.
    svgEl('line', { class: 'ir-xray-line', x1: 16, y1: 116, x2: 624, y2: 116, stroke: MUTED, 'stroke-width': 1.5, 'stroke-dasharray': '7 5' }, svg);
    // The mountain, with an infrared telescope on top.
    svgEl('polygon', { points: `220,${ground} 360,196 520,${ground}`, fill: ROCK }, svg);
    dome(svg, 360, 198, 'ir-site-infrared');
    svgEl('rect', { x: 0, y: ground, width: 640, height: 320 - ground, fill: '#1d2a20' }, svg);
    dome(svg, 70, ground, 'ir-site-optical');
    radioDish(svg, 140, ground);
    // An X-ray telescope in orbit.
    svgEl('rect', { class: 'ir-site-xray', x: 452, y: 36, width: 36, height: 18, rx: 3, fill: '#eef3fb' }, svg);
    [[426, 452], [488, 514]].forEach(([a, b]) => svgEl('rect', { x: a, y: 40, width: b - a, height: 10, fill: '#5b7bd5', stroke: '#eef3fb', 'stroke-width': 1 }, svg));
    addLabel(svg, wrap, 'not to scale', 60, 16, 'diagram-label--tick');
    addLabel(svg, wrap, 'X-ray telescope in space', 470, 76, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'X-rays absorbed up here', 170, 98, 'diagram-label--tick');
    addLabel(svg, wrap, 'infrared telescope, high and dry', 360, 164, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'optical and radio, at sea level', 200, 306, 'diagram-label--tick diagram-label--strong');
  }

  // ------------------------------------------------------------------
  // 2. Why infrared telescopes go up mountains
  // ------------------------------------------------------------------

  const ALT = { groundY: 320, topY: 120, x0: 130, peakX: 340, rightX: 490 };
  const yForKm = (km) => ALT.groundY - (km / I.ALTITUDE_RANGE_KM.max) * (ALT.groundY - ALT.topY);

  function altitudeKm() {
    return Number(document.getElementById('altitude').value) / 10;
  }

  function drawAltitude() {
    const svg = document.getElementById('altitude-diagram');
    const wrap = document.getElementById('altitude-diagram-wrap');
    const km = altitudeKm();
    clearDiagram(svg, wrap);
    panel(svg);
    // Water vapour: dots crowded near the ground, thinning out higher up.
    const rand = seeded(29);
    let placed = 0;
    while (placed < 170) {
      const x = 70 + rand() * 430;
      const y = 30 + rand() * (ALT.groundY - 30);
      const h = ((ALT.groundY - y) / (ALT.groundY - ALT.topY)) * I.ALTITUDE_RANGE_KM.max;
      if (rand() < I.waterVapourAbove(h) / 1) {
        svgEl('circle', { class: 'ir-vapour', cx: x.toFixed(1), cy: y.toFixed(1), r: 2.2, fill: '#bcd7f5', opacity: 0.75 }, svg);
        placed += 1;
      }
    }
    // The mountain covers the vapour inside it.
    svgEl('polygon', { points: `${ALT.x0},${ALT.groundY} ${ALT.peakX},${ALT.topY} ${ALT.rightX},${ALT.groundY}`, fill: ROCK }, svg);
    svgEl('rect', { x: 0, y: ALT.groundY, width: 640, height: 40, fill: '#1d2a20' }, svg);
    // The telescope, on the left slope at the chosen height.
    const tx = ALT.x0 + (ALT.peakX - ALT.x0) * (km / I.ALTITUDE_RANGE_KM.max);
    const ty = yForKm(km);
    dome(svg, tx, ty, 'ir-telescope');
    // Ten arrows of infrared: the share that gets through reaches the dome.
    const through = I.infraredThrough(km);
    const reaching = Math.round(10 * through);
    const arrowRand = seeded(41);
    const order = Array.from({ length: 10 }, (_, k) => k).sort(() => arrowRand() - 0.5);
    for (let k = 0; k < 10; k += 1) {
      const x = tx - 45 + k * 10;
      const reaches = order.indexOf(k) < reaching;
      // An absorbed arrow stops where the water vapour is: mostly just above
      // the telescope, rarely high up, where there is little vapour left.
      const span = 1 - Math.exp(-(5.6 - km) / I.WATER_VAPOUR_SCALE_HEIGHT_KM);
      const absorbedKm = km + 0.25 - I.WATER_VAPOUR_SCALE_HEIGHT_KM * Math.log(1 - arrowRand() * span);
      const endY = reaches ? ty - 32 : Math.max(30, Math.min(ty - 40, yForKm(absorbedKm)));
      svgEl('line', { class: reaches ? 'ir-arrow ir-arrow--through' : 'ir-arrow ir-arrow--absorbed', x1: x, y1: 18, x2: x, y2: endY, stroke: IR, 'stroke-width': 2.5 }, svg);
      if (reaches) {
        svgEl('path', { d: `M${x - 4},${endY - 6} L${x},${endY} L${x + 4},${endY - 6}`, fill: 'none', stroke: IR, 'stroke-width': 2.5 }, svg);
      } else {
        svgEl('path', { d: `M${x - 4},${endY - 4} L${x + 4},${endY + 4} M${x + 4},${endY - 4} L${x - 4},${endY + 4}`, stroke: '#fff', 'stroke-width': 2 }, svg);
      }
    }
    // Height ticks.
    for (let h = 0; h <= 5; h += 1) {
      svgEl('line', { x1: 8, y1: yForKm(h), x2: 16, y2: yForKm(h), stroke: MUTED, 'stroke-width': 1.5 }, svg);
      addLabel(svg, wrap, `${h} km`, 20, yForKm(h), 'diagram-label--tick diagram-label--right');
    }
    // A gauge: how much of the infrared gets through.
    const g = { x: 520, w: 40, top: 130, bottom: 320 };
    svgEl('rect', { x: g.x, y: g.top, width: g.w, height: g.bottom - g.top, fill: '#05070d', stroke: INK, 'stroke-width': 1.5 }, svg);
    const fillH = through * (g.bottom - g.top);
    svgEl('rect', { class: 'ir-gauge-fill', x: g.x, y: g.bottom - fillH, width: g.w, height: fillH, fill: IR }, svg);
    addLabel(svg, wrap, 'infrared', g.x + g.w / 2, 74, 'diagram-label--tick');
    addLabel(svg, wrap, 'getting through', g.x + g.w / 2, 106, 'diagram-label--tick');
    addLabel(svg, wrap, `${Math.round(through * 100)}%`, g.x + g.w / 2, Math.min(g.bottom - fillH - 12, g.bottom - 14), 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'dots: water vapour', 520, 341, 'diagram-label--tick');

    svg.dataset.through = through.toFixed(3);
    svg.dataset.reaching = String(reaching);
    svg.dataset.vapourAbove = I.waterVapourAbove(km).toFixed(3);
    document.getElementById('altitude-label').textContent = `${km.toFixed(1)} km`;
    document.getElementById('altitude-readout').textContent =
      `At ${km.toFixed(1)} km, about ${Math.round(I.waterVapourAbove(km) * 100)}% of the water vapour is still above the telescope, ` +
      `and about ${Math.round(through * 100)}% of the infrared it absorbs gets through (${reaching} of the 10 arrows).`;
    document.querySelectorAll('#site-buttons button').forEach((b) => {
      const on = Math.round(I.site(b.dataset.site).altitudeKm * 10) === Math.round(km * 10);
      b.classList.toggle('preset-button-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function wireAltitude() {
    const holder = document.getElementById('site-buttons');
    I.SITES.forEach((s) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset-button';
      b.dataset.site = s.id;
      b.textContent = s.name;
      b.addEventListener('click', () => {
        // Heights are in tenths of a km, so each lands on the slider's step grid.
        document.getElementById('altitude').value = String(Math.round(s.altitudeKm * 10));
        drawAltitude();
      });
      holder.appendChild(b);
    });
    document.getElementById('altitude').addEventListener('input', drawAltitude);
    drawAltitude();
  }

  // ------------------------------------------------------------------
  // 3. What infrared astronomy found
  // ------------------------------------------------------------------

  function cloudPath(cx, cy, s) {
    return `M${cx - 70 * s},${cy} C${cx - 80 * s},${cy - 40 * s} ${cx - 20 * s},${cy - 50 * s} ${cx},${cy - 34 * s} ` +
      `C${cx + 30 * s},${cy - 56 * s} ${cx + 86 * s},${cy - 30 * s} ${cx + 70 * s},${cy + 4 * s} ` +
      `C${cx + 84 * s},${cy + 40 * s} ${cx + 10 * s},${cy + 46 * s} ${cx - 10 * s},${cy + 32 * s} ` +
      `C${cx - 50 * s},${cy + 48 * s} ${cx - 90 * s},${cy + 30 * s} ${cx - 70 * s},${cy} Z`;
  }

  function glowStar(svg, x, y, r, cls) {
    svgEl('circle', { class: cls, cx: x, cy: y, r: r * 2.6, fill: IR, opacity: 0.3 }, svg);
    svgEl('circle', { class: cls, cx: x, cy: y, r, fill: '#fff' }, svg);
  }

  function drawDiscoveries() {
    const svg = document.getElementById('discoveries-diagram');
    const wrap = document.getElementById('discoveries-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const rows = ['Protostars hidden in dust', 'Dust and molecular clouds', 'Hotspots on a moon'];
    rows.forEach((title, r) => {
      const y0 = 10 + r * 170;
      svgEl('rect', { class: 'ir-find-panel', x: 10, y: y0, width: 620, height: 160, rx: 8, fill: '#05070d', stroke: MUTED }, svg);
      svgEl('line', { x1: 320, y1: y0 + 30, x2: 320, y2: y0 + 150, stroke: MUTED, 'stroke-dasharray': '4 4' }, svg);
      starfield(svg, 20, y0 + 28, 290, 104, r === 1 ? 40 : 16, 50 + r);
      starfield(svg, 330, y0 + 28, 290, 104, r === 1 ? 40 : 16, 50 + r);
      addLabel(svg, wrap, title, 320, y0 + 16, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'visible light', 165, y0 + 146, 'diagram-label--tick');
      addLabel(svg, wrap, 'infrared', 475, y0 + 146, 'diagram-label--tick');
    });
    // Protostars: hidden by the dust cloud in visible light, seen through it in infrared.
    let cy = 10 + 80;
    svgEl('path', { class: 'ir-cloud-opaque', d: cloudPath(165, cy, 0.9), fill: '#1d1712', stroke: '#3a2f25', 'stroke-width': 2 }, svg);
    svgEl('path', { class: 'ir-cloud-clear', d: cloudPath(475, cy, 0.9), fill: IR, 'fill-opacity': 0.08, stroke: IR, 'stroke-opacity': 0.5, 'stroke-dasharray': '5 4' }, svg);
    [[450, cy - 8], [490, cy + 10], [470, cy - 22]].forEach(([x, y]) => glowStar(svg, x, y, 3.5, 'ir-protostar'));
    // Dust and molecular clouds: a dark gap in visible light, glowing wisps in infrared.
    cy = 180 + 80;
    svgEl('ellipse', { class: 'ir-dark-patch', cx: 165, cy, rx: 92, ry: 40, fill: '#000', stroke: '#3a2f25', 'stroke-width': 2, 'stroke-dasharray': '5 4' }, svg);
    [[-1, 0], [0, 1], [1, -1]].forEach(([a, b], k) => {
      svgEl('path', { class: 'ir-wisp', d: `M${390 + k * 10},${cy + 30 + b * 10} C${440},${cy - 40 + a * 12} ${510},${cy + 40} ${565 - k * 10},${cy - 26 + a * 10}`, fill: 'none', stroke: IR, 'stroke-width': 9 - k * 2, 'stroke-linecap': 'round', opacity: 0.55 }, svg);
    });
    // Hotspots on a moon: a plain disc in visible light, bright spots in infrared.
    cy = 350 + 78;
    svgEl('circle', { class: 'ir-moon', cx: 165, cy, r: 46, fill: '#e9dca0' }, svg);
    [[150, cy - 14, 9], [182, cy + 10, 7], [160, cy + 22, 6]].forEach(([x, y, r]) => svgEl('circle', { cx: x, cy: y, r, fill: '#d6c483' }, svg));
    svgEl('circle', { class: 'ir-moon', cx: 475, cy, r: 46, fill: '#3b2c27' }, svg);
    [[458, cy - 16], [494, cy + 6], [470, cy + 24], [500, cy - 22]].forEach(([x, y]) => glowStar(svg, x, y, 4, 'ir-hotspot'));
  }

  // ------------------------------------------------------------------
  // 4. How the atmosphere spoils images
  // ------------------------------------------------------------------

  const seeingState = { frame: 0, timer: null };

  function drawSeeing() {
    const svg = document.getElementById('seeing-diagram');
    const wrap = document.getElementById('seeing-diagram-wrap');
    const t = Number(document.getElementById('turbulence').value);
    clearDiagram(svg, wrap);
    panel(svg);
    [10, 330].forEach((x) => svgEl('rect', { x, y: 40, width: 300, height: 196, rx: 8, fill: '#05070d', stroke: MUTED }, svg));
    // Above the atmosphere: one sharp point.
    const sharp = I.starImage(0);
    svgEl('circle', { class: 'ir-sharp-star', cx: 160, cy: 138, r: sharp.radius, fill: '#fff' }, svg);
    [[0, 12], [12, 0], [0, -12], [-12, 0]].forEach(([dx, dy]) => svgEl('line', { x1: 160, y1: 138, x2: 160 + dx, y2: 138 + dy, stroke: '#fff', 'stroke-width': 1.2 }, svg));
    // Through the air: a larger blob, broken into speckles.
    const img = I.starImage(t, seeingState.frame);
    svgEl('circle', { class: 'ir-blur-outline', cx: 480, cy: 138, r: img.radius, fill: '#fff', 'fill-opacity': t ? 0.08 : 0, stroke: t ? MUTED : 'none', 'stroke-dasharray': '4 4' }, svg);
    img.speckles.forEach((s) => svgEl('circle', { class: 'ir-speckle', cx: (480 + s.dx).toFixed(1), cy: (138 + s.dy).toFixed(1), r: s.r.toFixed(1), fill: '#fff', opacity: 0.85 }, svg));
    svg.dataset.radius = String(img.radius);
    svg.dataset.speckles = String(img.speckles.length);
    addLabel(svg, wrap, 'above the atmosphere', 160, 20, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'through the air', 480, 20, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'a sharp point', 160, 256, 'diagram-label--tick');
    addLabel(svg, wrap, t ? 'a larger, broken-up blur' : 'a sharp point', 480, 256, 'diagram-label--tick');

    const labels = ['still', 'very calm', 'calm', 'calm', 'a little turbulent', 'turbulent', 'turbulent', 'very turbulent', 'very turbulent', 'very turbulent', 'extremely turbulent'];
    document.getElementById('turbulence-label').textContent = `${t} of 10 (${labels[t]})`;
    document.getElementById('seeing-readout').textContent = t
      ? `Through this air the star's image is about ${Math.round(img.radius / sharp.radius)} times as wide as the sharp point, broken into ${img.speckles.length} speckles that keep moving.`
      : 'With no turbulence, the star is the same sharp point either way.';
  }

  function setTwinkling(on) {
    const btn = document.getElementById('twinkle');
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? 'Stop' : 'Twinkle';
    if (seeingState.timer) clearInterval(seeingState.timer);
    seeingState.timer = null;
    if (!on) return;
    seeingState.timer = setInterval(() => {
      seeingState.frame += 1;
      drawSeeing();
    }, 140);
  }

  function wireSeeing() {
    document.getElementById('turbulence').addEventListener('input', drawSeeing);
    document.getElementById('twinkle').addEventListener('click', (e) => {
      e.stopPropagation();
      setTwinkling(document.getElementById('twinkle').getAttribute('aria-pressed') !== 'true');
    });
    drawSeeing();
  }

  // ------------------------------------------------------------------

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }

  drawWindows();
  drawSites();
  wireAltitude();
  drawDiscoveries();
  wireSeeing();
  renderCoverage();
  QuizUI.mount(InfraredTelescopesQuestions.makeQuestions(I));
  if (!REDUCED_MOTION) setTwinkling(true);
})();
