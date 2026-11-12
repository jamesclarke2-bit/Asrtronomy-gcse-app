(function () {
  const H = window.HrDiagram;
  const SpecData = window.SpecData;
  const S = window.Spectra;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, svgEl, clearDiagram, addLabel, panel, rgbString } = D;

  const CURRICULUM_UNITS = ['u4.9'];

  // 3.1e13 -> "3.1 × 10¹³", with real superscript digits.
  function standardForm(x) {
    const [mant, exp] = x.toExponential(1).split('e');
    const sup = { '-': '\u207b', 0: '\u2070', 1: '\u00b9', 2: '\u00b2', 3: '\u00b3', 4: '\u2074', 5: '\u2075', 6: '\u2076', 7: '\u2077', 8: '\u2078', 9: '\u2079' };
    return `${mant} \u00d7 10${String(Number(exp)).split('').map((c) => sup[c]).join('')}`;
  }

  const GLOSSARY = {
    luminosity:
      "Luminosity: how much light a star actually gives out, whatever its distance. On an HR diagram it is compared with the Sun's, so the Sun's luminosity is 1.",
    absoluteMagnitude:
      'Absolute magnitude (M): how bright a star would look from a standard distance of 10 parsecs. Like all magnitudes it runs backwards: the more negative the number, the brighter the star. Covered in full on Magnitude: how bright is a star?',
    mainSequence:
      'The main sequence: the diagonal band where a star spends most of its life, steadily turning hydrogen into helium in its core. Hotter main-sequence stars are more luminous.',
    giant:
      'A giant: a star that has swollen to many times the Sun\'s size near the end of its life. Being so big, it is very luminous even when cool (a red giant); hot, luminous giants are blue giants.',
    supergiant:
      'A supergiant: the largest and most luminous kind of star, up to hundreds of thousands of times the Sun\'s luminosity, at any temperature from blue to red.',
    apparentMagnitude:
      'Apparent magnitude (m): how bright a star looks from Earth. It depends on both the star\'s luminosity and its distance.',
    parsec: `A parsec (pc): a unit of distance used for stars, about ${SpecData.CONSTANTS.parsecLightYears} light years (${standardForm(SpecData.CONSTANTS.parsecKm)} km on the data sheet). Covered in full on Parallax and the Parsec.`,
    whiteDwarf:
      'A white dwarf: the hot, Earth-sized core left behind when a Sun-like star dies. It is hot but so small that it gives out very little light.',
  };

  // Every full diagram (640 x 536) uses the same plot area.
  const GEOM = { x0: 78, x1: 562, yTop: 56, yBottom: 436 };
  const plot = H.makePlot(GEOM);

  const REGION_STYLE = {
    'main-sequence': { fill: 'rgba(255, 224, 138, 0.20)', stroke: '#ffe08a' },
    supergiants: { fill: 'rgba(214, 170, 255, 0.16)', stroke: '#d6aaff' },
    'blue-giants': { fill: 'rgba(140, 190, 255, 0.22)', stroke: '#8cbeff' },
    'red-giants': { fill: 'rgba(255, 140, 110, 0.22)', stroke: '#ff8c6e' },
    'white-dwarfs': { fill: 'rgba(235, 240, 255, 0.20)', stroke: '#ebf0ff' },
  };

  // Where each region's own label sits: [temperature (K), M].
  const REGION_LABEL_AT = {
    supergiants: [10000, -7.6],
    'blue-giants': [17000, -4.2],
    'red-giants': [4200, -0.5],
    'white-dwarfs': [16000, 12],
  };

  const L_TICKS = [
    [1e6, '10⁶'],
    [1e4, '10⁴'],
    [1e2, '10²'],
    [1, '1'],
    [1e-2, '10⁻²'],
    [1e-4, '10⁻⁴'],
    [1e-6, '10⁻⁶'],
  ];
  const M_TICKS = [-10, -5, 0, 5, 10, 15];
  const T_TICKS = [40000, 20000, 10000, 5000, 2500];

  const fmtInt = (n) => Math.round(n).toLocaleString('en-GB');
  const signed = (m) => H.signed(m);
  const signedTick = (m) => (m === 0 ? '0' : m > 0 ? `+${m}` : `−${Math.abs(m)}`);

  function capitalise(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  // A deterministic scatter of faint background stars, so every redraw
  // looks the same.
  function starField(svg, count, seed, box) {
    let s = seed;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    for (let i = 0; i < count; i += 1) {
      svgEl('circle', {
        cx: (box.x0 + rand() * (box.x1 - box.x0)).toFixed(1),
        cy: (box.yTop + rand() * (box.yBottom - box.yTop)).toFixed(1),
        r: (0.5 + rand() * 0.8).toFixed(2),
        fill: '#ffffff',
        opacity: (0.15 + rand() * 0.35).toFixed(2),
      }, svg);
    }
  }

  function glowDefs(svg) {
    const defs = svgEl('defs', {}, svg);
    const grad = svgEl('radialGradient', { id: `${svg.id}-glow` }, defs);
    svgEl('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': '0.55' }, grad);
    svgEl('stop', { offset: '100%', 'stop-color': '#ffffff', 'stop-opacity': '0' }, grad);
  }

  /** A star disc in its own colour, with a soft halo. */
  function starDisc(svg, temperatureK, cx, cy, r, extra) {
    svgEl('circle', { cx, cy, r: r * 2.2, fill: `url(#${svg.id}-glow)` }, svg);
    return svgEl('circle', { cx, cy, r, fill: rgbString(D.starDisplayRgb(temperatureK)), stroke: '#0f1830', 'stroke-width': 1, ...(extra || {}) }, svg);
  }

  /**
   * Panel, background stars, plot border, and (when `ticks`) every scale:
   * luminosity on the left, absolute magnitude on the right, temperature
   * and the spectral classes along the bottom.
   */
  function drawFrame(svg, wrap, p, { ticks = true, titles = true } = {}) {
    clearDiagram(svg, wrap);
    panel(svg);
    glowDefs(svg);
    starField(svg, 70, 7, p);
    svgEl('rect', { x: p.x0, y: p.yTop, width: p.x1 - p.x0, height: p.yBottom - p.yTop, fill: 'none', stroke: MUTED, 'stroke-width': 1 }, svg);
    if (!ticks) return;

    L_TICKS.forEach(([L, text]) => {
      const y = p.yForL(L);
      svgEl('line', { x1: p.x0, x2: p.x1, y1: y, y2: y, stroke: MUTED, 'stroke-width': 0.5, opacity: 0.35 }, svg);
      svgEl('line', { x1: p.x0 - 5, x2: p.x0, y1: y, y2: y, stroke: MUTED }, svg);
      addLabel(svg, wrap, text, p.x0 - 8, y, 'diagram-label--tick diagram-label--left hr-tick-l');
    });
    M_TICKS.forEach((m) => {
      const y = p.yForM(m);
      svgEl('line', { x1: p.x1, x2: p.x1 + 5, y1: y, y2: y, stroke: MUTED }, svg);
      addLabel(svg, wrap, signedTick(m), p.x1 + 8, y, 'diagram-label--tick diagram-label--right hr-tick-m');
    });
    T_TICKS.forEach((t) => {
      const x = p.xForT(t);
      svgEl('line', { x1: x, x2: x, y1: p.yBottom, y2: p.yBottom + 5, stroke: MUTED }, svg);
      addLabel(svg, wrap, fmtInt(t), x, p.yBottom + 48, 'diagram-label--tick hr-tick-t');
    });
    // Spectral class letters, matching the strip on Colour, temperature and spectral type.
    S.SPECTRAL_CLASSES.forEach((c) => {
      const hot = Math.min(c.maxK || H.AXES.tHotK, H.AXES.tHotK);
      const cool = Math.max(c.minK, H.AXES.tCoolK);
      const xHot = p.xForT(hot);
      const xCool = p.xForT(cool);
      svgEl('line', { x1: xCool, x2: xCool, y1: p.yBottom + 8, y2: p.yBottom + 24, stroke: MUTED, 'stroke-width': 1 }, svg);
      const label = addLabel(svg, wrap, c.letter, (xHot + xCool) / 2, p.yBottom + 16, 'diagram-label--tick diagram-label--strong hr-class-letter');
      label.dataset.class = c.letter;
    });
    if (titles) {
      addLabel(svg, wrap, 'Luminosity (Sun = 1), approximate', 8, 26, 'diagram-label--tick diagram-label--right hr-axis-title');
      addLabel(svg, wrap, 'Absolute magnitude', 596, 26, 'diagram-label--tick diagram-label--left hr-axis-title');
      addLabel(svg, wrap, '← hotter   Surface temperature (K)   cooler →', (p.x0 + p.x1) / 2, p.yBottom + 78, 'diagram-label--tick hr-axis-title');
    }
  }

  function bandPoints(p, offset) {
    const pts = [];
    const logHot = Math.log10(H.AXES.tHotK);
    const logCool = Math.log10(H.AXES.tCoolK);
    for (let i = 0; i <= 80; i += 1) {
      const t = Math.pow(10, logHot - (i / 80) * (logHot - logCool));
      const m = H.mainSequenceMagnitude(t) + offset;
      pts.push([p.xForT(t), Math.max(p.yTop, Math.min(p.yBottom, p.yForM(m)))]);
    }
    return pts;
  }

  function drawMainSequenceBand(svg, p, style, className) {
    const upper = bandPoints(p, -H.MAIN_SEQUENCE_HALF_WIDTH);
    const lower = bandPoints(p, H.MAIN_SEQUENCE_HALF_WIDTH).reverse();
    const points = [...upper, ...lower].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    return svgEl('polygon', { class: className || 'hr-region', 'data-region': 'main-sequence', points, fill: style.fill, stroke: style.stroke, 'stroke-width': 1.2, 'stroke-dasharray': '6 4' }, svg);
  }

  function drawRegionShape(svg, p, region, style) {
    const s = region.shape;
    if (s.kind === 'band') {
      const xa = p.xForT(s.tHotK);
      const xb = p.xForT(s.tCoolK);
      const ya = p.yForM(s.mBright);
      const yb = p.yForM(s.mFaint);
      return svgEl('rect', { class: 'hr-region', 'data-region': region.id, x: xa + 4, y: ya, width: xb - xa - 8, height: yb - ya, rx: 18, fill: style.fill, stroke: style.stroke, 'stroke-width': 1.2, 'stroke-dasharray': '6 4' }, svg);
    }
    const cx = p.xForT(s.tCentreK);
    const rx = Math.abs(p.xForT(Math.pow(10, Math.log10(s.tCentreK) + s.logHalfWidth)) - cx);
    const cy = p.yForM(s.mCentre);
    const ry = Math.abs(p.yForM(s.mCentre + s.mHalfHeight) - cy);
    return svgEl('ellipse', { class: 'hr-region', 'data-region': region.id, cx, cy, rx, ry, fill: style.fill, stroke: style.stroke, 'stroke-width': 1.2, 'stroke-dasharray': '6 4' }, svg);
  }

  /** The five regions, optionally named, with the main sequence's label on a leader line. */
  function drawRegions(svg, wrap, p, { labels = true } = {}) {
    drawMainSequenceBand(svg, p, REGION_STYLE['main-sequence']);
    H.REGIONS.forEach((r) => drawRegionShape(svg, p, r, REGION_STYLE[r.id]));
    if (!labels) return;
    H.REGIONS.forEach((r) => {
      const [t, m] = REGION_LABEL_AT[r.id];
      const label = addLabel(svg, wrap, r.name, p.xForT(t), p.yForM(m), 'diagram-label--tick diagram-label--strong hr-region-label');
      label.dataset.region = r.id;
    });
    // "main sequence" sits below the band, with a leader line up to it.
    const tBand = 8000;
    const bx = p.xForT(tBand);
    const by = p.yForM(H.mainSequenceMagnitude(tBand) + H.MAIN_SEQUENCE_HALF_WIDTH);
    const lx = p.xForT(13000);
    const ly = p.yForM(5.2);
    svgEl('line', { x1: lx + 40, y1: ly - 8, x2: bx - 2, y2: by + 2, stroke: INK, 'stroke-width': 1 }, svg);
    const label = addLabel(svg, wrap, 'main sequence', lx, ly, 'diagram-label--tick diagram-label--strong hr-region-label');
    label.dataset.region = 'main-sequence';
  }

  function drawSun(svg, wrap, p, withLabel = true) {
    const x = p.xForT(H.SUN_TEMPERATURE_K);
    const y = p.yForM(H.SUN_ABSOLUTE_MAGNITUDE);
    svgEl('circle', { cx: x, cy: y, r: 13, fill: `url(#${svg.id}-glow)` }, svg);
    svgEl('circle', { class: 'hr-sun', cx: x, cy: y, r: 6.5, fill: '#ffd84d', stroke: '#10131c', 'stroke-width': 1.5 }, svg);
    svgEl('circle', { cx: x, cy: y, r: 2, fill: '#10131c' }, svg);
    if (withLabel) addLabel(svg, wrap, 'the Sun', x + 12, y + 2, 'diagram-label--tick diagram-label--strong diagram-label--right hr-sun-label');
  }

  // ------------------------------------------------------------------
  // 1. The diagram
  // ------------------------------------------------------------------

  // Decorative stars in each region, sized roughly as the stars are.
  const DECORATION = [
    [30000, -8.2, 12], [5000, -7.0, 11], [3400, -8.0, 14],
    [26000, -4.3, 8],
    [3800, -2.6, 8], [4700, 1.4, 6],
    [33000, -4.0, 6.5], [15000, -1.0, 5.5], [9000, 1.3, 4.5], [6800, 2.9, 4], [4400, 7.4, 3.2], [3500, 10.5, 2.6], [3100, 13.2, 2],
    [22000, 10.6, 1.8], [11000, 13.2, 1.6],
  ];

  function drawMain() {
    const svg = document.getElementById('hr-main-diagram');
    const wrap = document.getElementById('hr-main-diagram-wrap');
    drawFrame(svg, wrap, plot);
    drawRegions(svg, wrap, plot);
    DECORATION.forEach(([t, m, r]) => starDisc(svg, t, plot.xForT(t), plot.yForM(m), r, { class: 'hr-decoration' }));
    drawSun(svg, wrap, plot);
  }

  // ------------------------------------------------------------------
  // 2. Ten real stars
  // ------------------------------------------------------------------

  // Label placement per star: [dx, dy, side]; side 'left' grows leftwards
  // from the point, 'right' rightwards, 'above' centred. A leader line is
  // drawn when the label is moved more than a few units.
  const STAR_LABEL = {
    Rigel: [12, 0, 'right'],
    Betelgeuse: [-12, 0, 'left'],
    Spica: [-12, 0, 'left'],
    Arcturus: [0, -17, 'above'],
    Vega: [-24, -17, 'left'],
    Sirius: [-24, 12, 'left'],
    Procyon: [12, -8, 'right'],
    'the Sun': [12, 6, 'right'],
    'Sirius B': [12, 0, 'right'],
    'Proxima Centauri': [-12, 0, 'left'],
  };

  let selectedStar = 'the Sun';
  const starKey = (star) => star.name.replace(/^the /, '').toLowerCase().replace(/\s+/g, '-');

  function starRadius(star) {
    if (star.group === 'supergiants') return 8;
    if (star.group === 'white-dwarfs') return 3.5;
    if (star.group === 'blue-giants' || star.group === 'red-giants') return 6.5;
    return star.name === 'Proxima Centauri' ? 3.5 : 5;
  }

  function drawStars() {
    const svg = document.getElementById('hr-stars-diagram');
    const wrap = document.getElementById('hr-stars-diagram-wrap');
    drawFrame(svg, wrap, plot);
    drawRegions(svg, wrap, plot, { labels: false });
    H.STARS.forEach((star) => {
      const x = plot.xForT(star.temperatureK);
      const y = plot.yForM(star.absoluteMagnitude);
      const [dx, dy, side] = STAR_LABEL[star.name];
      if (Math.abs(dy) > 10) {
        svgEl('line', { x1: x, y1: y, x2: x + dx * 0.7, y2: y + dy * 0.7, stroke: INK, 'stroke-width': 0.8, opacity: 0.8 }, svg);
      }
      const selected = star.name === selectedStar;
      if (selected) svgEl('circle', { class: 'hr-star-selected', cx: x, cy: y, r: starRadius(star) + 6, fill: 'none', stroke: INK, 'stroke-width': 2 }, svg);
      if (star.name === 'the Sun') {
        svgEl('circle', { cx: x, cy: y, r: 13, fill: `url(#${svg.id}-glow)` }, svg);
        svgEl('circle', { class: 'hr-star', 'data-star': starKey(star), cx: x, cy: y, r: 6, fill: '#ffd84d', stroke: '#10131c', 'stroke-width': 1.5 }, svg);
      } else {
        starDisc(svg, star.temperatureK, x, y, starRadius(star), { class: 'hr-star', 'data-star': starKey(star) });
      }
      const sideClass = side === 'left' ? 'diagram-label--left' : side === 'right' ? 'diagram-label--right' : '';
      const label = addLabel(svg, wrap, star.name === 'the Sun' ? star.name : capitalise(star.name), x + dx, y + dy, `diagram-label--tick ${sideClass} hr-star-label${selected ? ' diagram-label--strong' : ''}`);
      label.dataset.star = starKey(star);
    });
    // Invisible tap targets, drawn last so they sit on top of every
    // star's glow. Selecting redraws the diagram, so the click must stop
    // here rather than reach the diagram's own tap-to-enlarge.
    H.STARS.forEach((star) => {
      const hit = svgEl('circle', { class: 'hr-star-hit', 'data-star': starKey(star), cx: plot.xForT(star.temperatureK), cy: plot.yForM(star.absoluteMagnitude), r: hitRadius(star), fill: 'transparent', tabindex: 0, role: 'button', 'aria-label': `${capitalise(star.name)}: show details` }, svg);
      hit.addEventListener('click', (e) => {
        e.stopPropagation();
        selectStar(star.name);
      });
      hit.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectStar(star.name);
          const again = document.querySelector(`#hr-stars-diagram .hr-star-hit[data-star="${starKey(star)}"]`);
          if (again) again.focus();
        }
      });
    });
  }

  // As big a tap target as possible without overlapping a neighbour's.
  function hitRadius(star) {
    const x = plot.xForT(star.temperatureK);
    const y = plot.yForM(star.absoluteMagnitude);
    const nearest = Math.min(...H.STARS.filter((o) => o !== star).map((o) => Math.hypot(plot.xForT(o.temperatureK) - x, plot.yForM(o.absoluteMagnitude) - y)));
    return Math.min(14, nearest / 2);
  }

  function groupName(star) {
    return star.description;
  }

  function renderStarCard() {
    const star = H.STARS.find((s) => s.name === selectedStar);
    const card = document.getElementById('hr-star-card');
    card.dataset.star = starKey(star);
    card.innerHTML = '';
    const h = document.createElement('h3');
    h.textContent = capitalise(star.name);
    card.appendChild(h);
    const dl = document.createElement('dl');
    dl.className = 'readout';
    const rows = [
      ['Type', star.type === 'white dwarf' ? 'white dwarf' : `${star.type}, ${groupName(star)}`],
      ['Surface temperature', `${fmtInt(star.temperatureK)} K`],
      ['Absolute magnitude', signed(star.absoluteMagnitude)],
      ['Luminosity (Sun = 1), approximate', H.luminosityText(star)],
    ];
    rows.forEach(([k, v]) => {
      const dt = document.createElement('dt');
      dt.textContent = k;
      const dd = document.createElement('dd');
      dd.textContent = v;
      dd.dataset.field = k;
      dl.append(dt, dd);
    });
    card.appendChild(dl);
    document.querySelectorAll('#hr-star-buttons button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.star === starKey(star))));
  }

  function selectStar(name) {
    selectedStar = name;
    drawStars();
    renderStarCard();
  }

  function buildStarButtons() {
    const box = document.getElementById('hr-star-buttons');
    H.STARS.forEach((star) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'secondary-button hr-star-button';
      b.dataset.star = starKey(star);
      b.textContent = capitalise(star.name);
      b.addEventListener('click', () => selectStar(star.name));
      box.appendChild(b);
    });
  }

  function fillStarTable() {
    const body = document.getElementById('hr-star-table-body');
    H.STARS.forEach((star) => {
      const tr = document.createElement('tr');
      [capitalise(star.name), star.type, fmtInt(star.temperatureK), signed(star.absoluteMagnitude), H.luminosityText(star)].forEach((v) => {
        const td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
  }

  // ------------------------------------------------------------------
  // 3. Sketch it
  // ------------------------------------------------------------------

  const CHIPS = [
    { id: 'main-sequence', name: 'main sequence', where: H.MAIN_SEQUENCE.where },
    { id: 'red-giants', name: 'red giants', where: H.regionById('red-giants').where },
    { id: 'blue-giants', name: 'blue giants', where: H.regionById('blue-giants').where },
    { id: 'supergiants', name: 'supergiants', where: H.regionById('supergiants').where },
    { id: 'white-dwarfs', name: 'white dwarfs', where: H.regionById('white-dwarfs').where },
    { id: 'sun', name: 'the Sun', where: 'in the middle of the main sequence' },
  ];

  const sketch = {
    axesCorrect: false,
    selected: null,
    placements: {},
    showAnswer: false,
    cursor: null,
  };

  const AXIS_TEXT = {
    temperature: 'Surface temperature (K)',
    luminosity: 'Luminosity (Sun = 1)',
    apparent: 'Apparent magnitude',
    distance: 'Distance (pc)',
    absolute: 'Absolute magnitude',
  };

  function axisChoices() {
    const v = (id) => document.getElementById(id).value;
    return { xq: v('sketch-x-quantity'), xd: v('sketch-x-direction'), yq: v('sketch-y-quantity'), yd: v('sketch-y-direction') };
  }

  function clampLabelInside(label, wrap) {
    const w = wrap.getBoundingClientRect();
    const r = label.getBoundingClientRect();
    if (!w.width) return;
    let shift = 0;
    if (r.left < w.left + 2) shift = w.left + 2 - r.left;
    else if (r.right > w.right - 2) shift = w.right - 2 - r.right;
    if (shift) label.style.left = `${parseFloat(label.style.left) + (shift / w.width) * 100}%`;
  }

  function drawSketch() {
    const svg = document.getElementById('hr-sketch-diagram');
    const wrap = document.getElementById('hr-sketch-diagram-wrap');
    drawFrame(svg, wrap, plot, { ticks: false });
    const c = axisChoices();
    svg.dataset.xAxis = c.xq || 'none';
    svg.dataset.yAxis = c.yq || 'none';
    if (c.xq) addLabel(svg, wrap, AXIS_TEXT[c.xq], (plot.x0 + plot.x1) / 2, plot.yBottom + 22, 'diagram-label--tick diagram-label--strong hr-sketch-axis').dataset.axis = 'x';
    if (c.xd) {
      const text = c.xd === 'hot-left' ? '← hotter' : 'hotter →';
      const x = c.xd === 'hot-left' ? plot.x0 : plot.x1;
      const side = c.xd === 'hot-left' ? 'diagram-label--right' : 'diagram-label--left';
      addLabel(svg, wrap, text, x, plot.yBottom + 52, `diagram-label--tick ${side} hr-sketch-direction`).dataset.axis = 'x';
    }
    if (c.yq) addLabel(svg, wrap, AXIS_TEXT[c.yq], 8, 26, 'diagram-label--tick diagram-label--strong diagram-label--right hr-sketch-axis').dataset.axis = 'y';
    if (c.yd) {
      const text = c.yd === 'bright-top' ? '↑ brighter' : '↓ brighter';
      const y = c.yd === 'bright-top' ? plot.yTop + 14 : plot.yBottom - 14;
      addLabel(svg, wrap, text, plot.x0 + 6, y, 'diagram-label--tick diagram-label--right hr-sketch-direction').dataset.axis = 'y';
    }

    if (sketch.showAnswer) {
      drawRegions(svg, wrap, plot);
      drawSun(svg, wrap, plot);
      svg.dataset.answer = 'shown';
    } else {
      svg.dataset.answer = 'hidden';
      CHIPS.forEach((chip) => {
        const placed = sketch.placements[chip.id];
        if (!placed) return;
        const x = plot.xForT(placed.t);
        const y = plot.yForM(placed.m);
        svgEl('line', { class: 'hr-placed-mark', x1: x - 6, x2: x + 6, y1: y, y2: y, stroke: INK, 'stroke-width': 2 }, svg);
        svgEl('line', { x1: x, x2: x, y1: y - 6, y2: y + 6, stroke: INK, 'stroke-width': 2 }, svg);
        const label = addLabel(svg, wrap, `${chip.name} ${placed.correct ? '✓' : '✗'}`, x, y - 16, 'diagram-label--tick diagram-label--strong hr-placed-label');
        label.dataset.chip = chip.id;
        clampLabelInside(label, wrap);
      });
    }
    if (sketch.cursor && sketch.selected) {
      const { x, y } = sketch.cursor;
      svgEl('circle', { class: 'hr-cursor', cx: x, cy: y, r: 9, fill: 'none', stroke: '#ffe08a', 'stroke-width': 2, 'stroke-dasharray': '3 3' }, svg);
    }
  }

  function checkAxes() {
    const c = axisChoices();
    const parts = [
      c.xq === 'temperature' ? '✓ Across: surface temperature.' : '✗ Across: the x-axis is surface temperature (or spectral type).',
      c.xd === 'hot-left' ? '✓ Hottest on the left.' : '✗ The standard way round is hottest on the left.',
      c.yq === 'luminosity' || c.yq === 'absolute' ? '✓ Up: luminosity or absolute magnitude, either is fine.' : '✗ Up: luminosity (Sun = 1) or absolute magnitude, not apparent magnitude or temperature.',
      c.yd === 'bright-top' ? '✓ Brightest at the top.' : '✗ The brightest stars go at the top.',
    ];
    sketch.axesCorrect = parts.every((p) => p.startsWith('✓'));
    const fb = document.getElementById('sketch-axes-feedback');
    fb.dataset.correct = String(sketch.axesCorrect);
    fb.textContent = parts.join(' ') + (sketch.axesCorrect ? ' Now place the labels.' : ' Step 2 unlocks once both axes are right.');
    document.querySelectorAll('#sketch-chips button').forEach((b) => { b.disabled = !sketch.axesCorrect; });
  }

  function renderChips() {
    document.querySelectorAll('#sketch-chips button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.chip === sketch.selected)));
  }

  function renderSketchFeedback() {
    const list = document.getElementById('sketch-feedback');
    list.innerHTML = '';
    let right = 0;
    CHIPS.forEach((chip) => {
      const placed = sketch.placements[chip.id];
      if (!placed) return;
      if (placed.correct) right += 1;
      const li = document.createElement('li');
      li.dataset.chip = chip.id;
      li.dataset.correct = String(placed.correct);
      li.textContent = placed.correct
        ? `✓ ${capitalise(chip.name)}: right, ${chip.where}.`
        : `✗ ${capitalise(chip.name)}: not there. It goes ${chip.where}.`;
      list.appendChild(li);
    });
    list.dataset.score = String(right);
    list.dataset.placed = String(Object.keys(sketch.placements).length);
  }

  function place(chipId, x, y) {
    if (!sketch.axesCorrect || !chipId) return false;
    if (x < plot.x0 || x > plot.x1 || y < plot.yTop || y > plot.yBottom) return false;
    const t = plot.tForX(x);
    const m = plot.mForY(y);
    sketch.placements[chipId] = { t, m, correct: H.placementCorrect(chipId, t, m) };
    sketch.selected = null;
    sketch.showAnswer = false;
    document.getElementById('sketch-show-answer').setAttribute('aria-pressed', 'false');
    renderChips();
    renderSketchFeedback();
    drawSketch();
    return true;
  }

  function svgPoint(svg, clientX, clientY) {
    const r = svg.getBoundingClientRect();
    const { w, h } = D.viewBoxSize(svg);
    return { x: ((clientX - r.left) / r.width) * w, y: ((clientY - r.top) / r.height) * h, inside: clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom };
  }

  function wireSketch() {
    const svg = document.getElementById('hr-sketch-diagram');
    const box = document.getElementById('sketch-chips');
    let drag = null;
    let ghost = null;
    let suppressClick = false;

    CHIPS.forEach((chip) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'secondary-button hr-chip';
      b.dataset.chip = chip.id;
      b.textContent = chip.name;
      b.disabled = true;
      b.addEventListener('click', () => {
        if (suppressClick) {
          suppressClick = false;
          return;
        }
        sketch.selected = sketch.selected === chip.id ? null : chip.id;
        renderChips();
        drawSketch();
      });
      b.addEventListener('pointerdown', (e) => {
        if (b.disabled) return;
        drag = { id: chip.id, startX: e.clientX, startY: e.clientY, moved: false };
      });
      box.appendChild(b);
    });

    document.addEventListener('pointermove', (e) => {
      if (!drag) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 8) {
        drag.moved = true;
        ghost = document.createElement('div');
        ghost.className = 'hr-drag-ghost';
        ghost.textContent = CHIPS.find((c) => c.id === drag.id).name;
        document.body.appendChild(ghost);
      }
      if (ghost) {
        ghost.style.left = `${e.clientX}px`;
        ghost.style.top = `${e.clientY}px`;
      }
    });
    document.addEventListener('pointerup', (e) => {
      if (!drag) return;
      const { id, moved } = drag;
      drag = null;
      if (ghost) {
        ghost.remove();
        ghost = null;
      }
      if (!moved) return;
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
      const pt = svgPoint(svg, e.clientX, e.clientY);
      if (pt.inside) place(id, pt.x, pt.y);
    });
    document.addEventListener('pointercancel', () => {
      drag = null;
      if (ghost) ghost.remove();
      ghost = null;
    });

    svg.addEventListener('click', (e) => {
      if (!sketch.selected) return;
      // Placing redraws the diagram, so stop the click reaching its tap-to-enlarge.
      e.stopPropagation();
      const pt = svgPoint(svg, e.clientX, e.clientY);
      place(sketch.selected, pt.x, pt.y);
    });
    svg.addEventListener('keydown', (e) => {
      if (!sketch.selected) return;
      const step = 10;
      const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (!sketch.cursor) sketch.cursor = { x: (plot.x0 + plot.x1) / 2, y: (plot.yTop + plot.yBottom) / 2 };
      if (moves[e.key]) {
        e.preventDefault();
        sketch.cursor.x = Math.max(plot.x0, Math.min(plot.x1, sketch.cursor.x + moves[e.key][0]));
        sketch.cursor.y = Math.max(plot.yTop, Math.min(plot.yBottom, sketch.cursor.y + moves[e.key][1]));
        drawSketch();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        place(sketch.selected, sketch.cursor.x, sketch.cursor.y);
      }
    });

    ['sketch-x-quantity', 'sketch-x-direction', 'sketch-y-quantity', 'sketch-y-direction'].forEach((id) =>
      document.getElementById(id).addEventListener('change', drawSketch)
    );
    document.getElementById('sketch-axes-check').addEventListener('click', checkAxes);
    document.getElementById('sketch-show-answer').addEventListener('click', (e) => {
      sketch.showAnswer = !sketch.showAnswer;
      e.currentTarget.setAttribute('aria-pressed', String(sketch.showAnswer));
      e.currentTarget.textContent = sketch.showAnswer ? 'Hide the answer' : 'Show the answer';
      drawSketch();
    });
  }

  // ------------------------------------------------------------------
  // 4. Distances
  // ------------------------------------------------------------------

  const DGEOM = { x0: 78, x1: 562, yTop: 40, yBottom: 220, mTop: -6, mBottom: 16 };
  const dplot = H.makePlot(DGEOM);
  const DIST = { x0: 78, x1: 562, y: 344, minPc: 1, maxPc: 100000 };
  const xForPc = (d) => DIST.x0 + (Math.log10(d) / Math.log10(DIST.maxPc)) * (DIST.x1 - DIST.x0);

  function formatPc(d) {
    const v = d >= 100 ? Number(d.toPrecision(3)) : Number(d.toPrecision(2));
    return v.toLocaleString('en-GB');
  }

  function currentType() {
    const type = document.getElementById('distance-type').value;
    return H.DISTANCE_TYPES.find((d) => d.type === type);
  }

  // The slider holds m in tenths (integers, so every value is on the step
  // grid); its range keeps both ends of the distance range on the scale.
  function setSliderRange() {
    const slider = document.getElementById('distance-m');
    const { bright, faint } = H.distanceFromMainSequence(currentType().temperatureK, 10);
    const min = Math.max(0, Math.ceil((faint - 5) * 10));
    const max = Math.min(200, Math.floor((bright + 20) * 10));
    slider.min = String(min);
    slider.max = String(max);
    const v = Math.max(min, Math.min(max, Number(slider.value)));
    slider.value = String(v);
  }

  function apparent() {
    return Number(document.getElementById('distance-m').value) / 10;
  }

  function drawDistance() {
    const svg = document.getElementById('hr-distance-diagram');
    const wrap = document.getElementById('hr-distance-diagram-wrap');
    const { type, temperatureK } = currentType();
    const m = apparent();
    const r = H.distanceFromMainSequence(temperatureK, m);
    clearDiagram(svg, wrap);
    panel(svg);
    glowDefs(svg);
    starField(svg, 30, 11, dplot);
    const p = dplot;
    svgEl('rect', { x: p.x0, y: p.yTop, width: p.x1 - p.x0, height: p.yBottom - p.yTop, fill: 'none', stroke: MUTED }, svg);
    [-5, 0, 5, 10].forEach((mm) => {
      const y = p.yForM(mm);
      svgEl('line', { x1: p.x0, x2: p.x1, y1: y, y2: y, stroke: MUTED, 'stroke-width': 0.5, opacity: 0.35 }, svg);
      addLabel(svg, wrap, signedTick(mm), p.x0 - 8, y, 'diagram-label--tick diagram-label--left');
    });
    addLabel(svg, wrap, 'Absolute magnitude M', 8, 18, 'diagram-label--tick diagram-label--right');
    T_TICKS.forEach((t) => {
      const x = p.xForT(t);
      svgEl('line', { x1: x, x2: x, y1: p.yBottom, y2: p.yBottom + 5, stroke: MUTED }, svg);
      addLabel(svg, wrap, fmtInt(t), x, p.yBottom + 16, 'diagram-label--tick');
    });
    addLabel(svg, wrap, '← hotter   Surface temperature (K)   cooler →', (p.x0 + p.x1) / 2, p.yBottom + 42, 'diagram-label--tick');

    drawMainSequenceBand(svg, p, REGION_STYLE['main-sequence']);
    const x = p.xForT(temperatureK);
    const yB = p.yForM(r.bright);
    const yC = p.yForM(r.M);
    const yF = p.yForM(r.faint);
    svgEl('line', { x1: x, x2: x, y1: p.yBottom, y2: yF, stroke: INK, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, svg);
    svgEl('line', { class: 'hr-read-line', x1: p.x0, x2: x, y1: yC, y2: yC, stroke: INK, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, svg);
    svgEl('line', { x1: x, x2: x, y1: yB, y2: yF, stroke: INK, 'stroke-width': 2.5 }, svg);
    svgEl('line', { x1: x - 8, x2: x + 8, y1: yB, y2: yB, stroke: INK, 'stroke-width': 2.5 }, svg);
    svgEl('line', { x1: x - 8, x2: x + 8, y1: yF, y2: yF, stroke: INK, 'stroke-width': 2.5 }, svg);
    starDisc(svg, temperatureK, x, yC, 5, { class: 'hr-distance-star' });
    addLabel(svg, wrap, `M ≈ ${signed(r.M)}`, p.x0 + 8, yC - 12, 'diagram-label--tick diagram-label--strong diagram-label--right hr-read-label');
    const typeLabel = addLabel(svg, wrap, `${type} (${fmtInt(temperatureK)} K)`, x, p.yBottom - 12, 'diagram-label--tick hr-type-label');
    clampLabelInside(typeLabel, wrap);

    // Distance scale, log, 1 to 100,000 pc.
    const yL = DIST.y;
    svgEl('line', { x1: DIST.x0, x2: DIST.x1, y1: yL, y2: yL, stroke: MUTED }, svg);
    [1, 10, 100, 1000, 10000, 100000].forEach((d) => {
      const xd = xForPc(d);
      svgEl('line', { x1: xd, x2: xd, y1: yL, y2: yL + 6, stroke: MUTED }, svg);
      addLabel(svg, wrap, fmtInt(d), xd, yL + 24, 'diagram-label--tick');
    });
    addLabel(svg, wrap, 'Distance (pc), log scale', (DIST.x0 + DIST.x1) / 2, yL + 52, 'diagram-label--tick');
    const xn = xForPc(r.nearPc);
    const xf = xForPc(r.farPc);
    const xb = xForPc(r.distancePc);
    svgEl('rect', { class: 'hr-range-bar', x: xn, y: yL - 7, width: xf - xn, height: 14, rx: 4, fill: 'rgba(255, 224, 138, 0.35)', stroke: '#ffe08a', 'stroke-width': 1.5 }, svg);
    svgEl('polygon', { class: 'hr-best-marker', points: `${xb},${yL - 2} ${xb - 7},${yL - 16} ${xb + 7},${yL - 16}`, fill: INK }, svg);
    svg.dataset.distance = r.distancePc.toFixed(3);
    svg.dataset.type = type;
    const clampX = (v) => Math.max(150, Math.min(490, v));
    addLabel(svg, wrap, `range ${formatPc(r.nearPc)} to ${formatPc(r.farPc)} pc`, clampX((xn + xf) / 2), yL - 54, 'diagram-label--tick hr-range-label');
    addLabel(svg, wrap, `best estimate ${formatPc(r.distancePc)} pc`, clampX(xb), yL - 24, 'diagram-label--tick diagram-label--strong hr-best-label');
    return r;
  }

  function renderWorking(r) {
    const { type, temperatureK } = currentType();
    const m = apparent();
    const list = document.getElementById('distance-working');
    const minusM = `(${signed(r.M)})`;
    const fiveLogD = m - r.M + 5;
    const steps = [
      `A ${type} star on the main sequence: read the band at ${fmtInt(temperatureK)} K. Its middle gives M ≈ ${signed(r.M)}; the band runs from ${signed(r.bright)} to ${signed(r.faint)}.`,
      `M = m + 5 − 5 log d, so 5 log d = m − M + 5 = ${signed(m)} − ${minusM} + 5 = ${fiveLogD.toFixed(1)}.`,
      `log d = ${fiveLogD.toFixed(1)} ÷ 5 = ${(fiveLogD / 5).toFixed(2)}, so d = 10 to the power ${(fiveLogD / 5).toFixed(2)} ≈ ${formatPc(r.distancePc)} pc.`,
      `The band's edges: M = ${signed(r.faint)} gives d ≈ ${formatPc(r.nearPc)} pc, and M = ${signed(r.bright)} gives d ≈ ${formatPc(r.farPc)} pc.`,
      `Range = ${formatPc(r.farPc)} − ${formatPc(r.nearPc)} ≈ ${formatPc(r.rangePc)} pc, so the uncertainty is half the range: about ±${formatPc(r.uncertaintyPc)} pc. Answer: about ${formatPc(r.distancePc)} pc ± ${formatPc(r.uncertaintyPc)} pc.`,
    ];
    list.innerHTML = '';
    steps.forEach((s) => {
      const li = document.createElement('li');
      li.textContent = s;
      list.appendChild(li);
    });
  }

  function updateDistance() {
    document.getElementById('distance-m-label').textContent = signed(apparent());
    const r = drawDistance();
    renderWorking(r);
  }

  function wireDistance() {
    const select = document.getElementById('distance-type');
    H.DISTANCE_TYPES.forEach(({ type }) => {
      const o = document.createElement('option');
      o.value = type;
      o.textContent = type;
      select.appendChild(o);
    });
    select.value = 'G2';
    select.addEventListener('change', () => {
      setSliderRange();
      updateDistance();
    });
    document.getElementById('distance-m').addEventListener('input', updateDistance);
    setSliderRange();
    updateDistance();
  }

  // ------------------------------------------------------------------

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  drawMain();
  buildStarButtons();
  drawStars();
  renderStarCard();
  fillStarTable();
  wireSketch();
  drawSketch();
  wireDistance();
  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(HrDiagramQuestions.makeQuestions(H));
})();
