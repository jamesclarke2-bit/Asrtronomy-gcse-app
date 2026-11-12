/**
 * Shared SVG drawing for the spectrum pages (notes/reading-a-spectrum.html
 * and notes/spectral-types.html): dark instrument panels, colour strips
 * with line ticks, wavelength axes, intensity graphs and a star's glow
 * curve. Browser-only; reads Spectra (src/spectra.js) off window.
 * Labels are HTML, positioned by percentage of the svg's viewBox (see
 * notes/TEMPLATE.md), never SVG <text>.
 */
(function () {
  const S = window.Spectra;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const PANEL_FILL = '#0f1830';
  const STRIP_EMPTY = '#1b2438';
  const INK = '#eef3fb';
  const MUTED = '#9aa7bd';
  const CURVE = '#ffe08a';

  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => el.setAttribute(key, value));
    if (parent) parent.appendChild(el);
    return el;
  }

  function clearDiagram(svg, wrap) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    wrap.querySelectorAll('.labelled-diagram-label, .diagram-label').forEach((el) => el.remove());
  }

  function viewBoxSize(svg) {
    const [, , w, h] = svg.getAttribute('viewBox').split(/\s+/).map(Number);
    return { w, h };
  }

  function addLabel(svg, wrap, text, x, y, extraClass) {
    const { w, h } = viewBoxSize(svg);
    const label = document.createElement('span');
    label.className = `diagram-label${extraClass ? ` ${extraClass}` : ''}`;
    label.style.left = `${(x / w) * 100}%`;
    label.style.top = `${(y / h) * 100}%`;
    label.textContent = text;
    wrap.appendChild(label);
    return label;
  }

  function panel(svg) {
    const { w, h } = viewBoxSize(svg);
    svgEl('rect', { x: 0, y: 0, width: w, height: h, rx: 10, fill: PANEL_FILL }, svg);
  }

  function rgbString([r, g, b], scale = 1) {
    return `rgb(${Math.round(r * scale)}, ${Math.round(g * scale)}, ${Math.round(b * scale)})`;
  }

  // Keeps the violet end bright enough that a dark line there still shows.
  function stripColour(nm) {
    const [r, g, b] = S.wavelengthToRgb(nm);
    const lift = 70;
    return [r, g, b].map((c) => lift + ((255 - lift) * c) / 255);
  }

  // Star colours are very pale in reality; push them away from white so
  // the difference between stars is visible (the colour is always named
  // in text beside it too).
  function starDisplayRgb(temperatureK) {
    return S.starRgb(temperatureK).map((c) => Math.max(0, 255 - (255 - c) * 1.5));
  }

  function makeScale(x0, x1, minNm = S.RANGE_NM.min, maxNm = S.RANGE_NM.max) {
    return (nm) => x0 + ((nm - minNm) / (maxNm - minNm)) * (x1 - x0);
  }

  /**
   * A coloured strip for a continuous, absorption or emission spectrum,
   * with a small white tick under each line so line positions never rely
   * on colour or darkness alone.
   */
  function drawStrip(svg, { x0, x1, y, h, type, lines, ticks = true, minNm = S.RANGE_NM.min, maxNm = S.RANGE_NM.max, step = 1, widthNm = 0.9 }) {
    const xFor = makeScale(x0, x1, minNm, maxNm);
    svgEl('rect', { x: x0, y, width: x1 - x0, height: h, fill: type === 'emission' || type === 'none' ? '#05070d' : STRIP_EMPTY }, svg);
    if (type === 'none') return;
    for (let nm = minNm; nm < maxNm - step / 1000; nm += step) {
      const centre = nm + step / 2;
      const brightness = S.intensityAt(centre, { type, lines, widthNm });
      if (brightness < 0.02) continue;
      svgEl('rect', {
        x: xFor(nm).toFixed(2),
        y,
        width: (xFor(nm + step) - xFor(nm) + 0.6).toFixed(2),
        height: h,
        fill: rgbString(stripColour(centre), brightness),
      }, svg);
    }
    if (ticks && type !== 'continuous') {
      lines.forEach((line) => {
        if (line.nm < minNm || line.nm > maxNm) return;
        const x = xFor(line.nm);
        svgEl('line', { x1: x, x2: x, y1: y + h + 2, y2: y + h + 4 + 8 * line.depth, stroke: INK, 'stroke-width': 1.5 }, svg);
      });
    }
  }

  function drawWavelengthAxis(svg, wrap, { x0, x1, y, ticks = [400, 500, 600, 700], minNm, maxNm, title = true, format = String }) {
    const xFor = makeScale(x0, x1, minNm, maxNm);
    svgEl('line', { x1: x0, x2: x1, y1: y, y2: y, stroke: MUTED, 'stroke-width': 1 }, svg);
    ticks.forEach((nm) => {
      const x = xFor(nm);
      svgEl('line', { x1: x, x2: x, y1: y, y2: y + 5, stroke: MUTED, 'stroke-width': 1 }, svg);
      addLabel(svg, wrap, format(nm), x, y + 14, 'diagram-label--tick');
    });
    if (title) addLabel(svg, wrap, 'Wavelength (nm)', (x0 + x1) / 2, y + 40, 'diagram-label--tick');
  }

  function drawGraph(svg, { x0, x1, yTop, yBottom, sample, minNm = S.RANGE_NM.min, maxNm = S.RANGE_NM.max, stroke = CURVE, dash, className }) {
    const xFor = makeScale(x0, x1, minNm, maxNm);
    svgEl('line', { x1: x0, x2: x0, y1: yTop - 6, y2: yBottom, stroke: MUTED, 'stroke-width': 1 }, svg);
    const points = [];
    for (let nm = minNm; nm <= maxNm; nm += 0.5) {
      const v = Math.max(0, Math.min(1, sample(nm)));
      points.push(`${xFor(nm).toFixed(1)},${(yBottom - v * (yBottom - yTop)).toFixed(1)}`);
    }
    const attrs = { points: points.join(' '), fill: 'none', stroke, 'stroke-width': 2, 'stroke-linejoin': 'round' };
    if (dash) attrs['stroke-dasharray'] = dash;
    if (className) attrs.class = className;
    svgEl('polyline', attrs, svg);
    return (nm) => ({ x: xFor(nm), y: yBottom - Math.max(0, Math.min(1, sample(nm))) * (yBottom - yTop) });
  }

  function continuumFor(temperatureK, minNm = S.RANGE_NM.min, maxNm = S.RANGE_NM.max) {
    const curve = S.blackbodyCurve(temperatureK, minNm, maxNm, maxNm - minNm);
    return (nm) => {
      const i = Math.max(0, Math.min(curve.length - 1, Math.round(nm - minNm)));
      return 0.15 + 0.8 * curve[i].value;
    };
  }

  function sampler(temperatureK, minNm, maxNm) {
    const curve = S.blackbodyCurve(temperatureK, minNm, maxNm, maxNm - minNm);
    return (nm) => curve[Math.max(0, Math.min(curve.length - 1, Math.round(nm - minNm)))].value;
  }

  /**
   * A star's glow (continuous spectrum) from minNm to maxNm, with the
   * visible band marked under the axis and the peak shown: a dashed line
   * when it is on the graph, or an arrow off the matching edge, labelled
   * with its approximate wavelength, when it is in the ultraviolet or the
   * infrared. The off-graph label sits in its own row above the graph,
   * so leave at least 60 units above yTop. Returns where the peak is.
   */
  function drawGlowCurve(svg, wrap, { temperatureK, x0, x1, yTop, yBottom, minNm = 300, maxNm = 1000, ticks = [300, 500, 700, 900] }) {
    const xFor = makeScale(x0, x1, minNm, maxNm);
    for (let nm = S.RANGE_NM.min; nm < S.RANGE_NM.max; nm += 2) {
      svgEl('rect', { x: xFor(nm), y: yBottom + 28, width: xFor(nm + 2) - xFor(nm) + 0.5, height: 7, fill: rgbString(stripColour(nm + 1)) }, svg);
    }
    drawGraph(svg, { x0, x1, yTop, yBottom, minNm, maxNm, sample: sampler(temperatureK, minNm, maxNm) });
    drawWavelengthAxis(svg, wrap, { x0, x1, y: yBottom, ticks, minNm, maxNm, title: false });
    addLabel(svg, wrap, 'visible light', (xFor(S.RANGE_NM.min) + xFor(S.RANGE_NM.max)) / 2, yBottom + 52, 'diagram-label--tick');

    const peakNm = S.peakWavelengthNm(temperatureK);
    const approx = `about ${Math.round(peakNm).toLocaleString('en-GB')} nm`;
    let where = 'on';
    if (peakNm < minNm) {
      where = 'ultraviolet';
      svgEl('line', { class: 'glow-peak-marker', x1: x0 + 40, x2: x0 + 6, y1: yTop + 6, y2: yTop + 6, stroke: INK, 'stroke-width': 2 }, svg);
      svgEl('polygon', { points: `${x0 - 2},${yTop + 6} ${x0 + 10},${yTop} ${x0 + 10},${yTop + 12}`, fill: INK }, svg);
      const label = addLabel(svg, wrap, `\u2190 peak is in the ultraviolet, off the graph (${approx})`, x0, yTop - 30, 'diagram-label--right diagram-label--tick glow-peak-label glow-peak-label--off');
      label.style.width = `${((x1 - x0) / viewBoxSize(svg).w) * 100}%`;
    } else if (peakNm > maxNm) {
      where = 'infrared';
      svgEl('line', { class: 'glow-peak-marker', x1: x1 - 40, x2: x1 - 6, y1: yTop + 6, y2: yTop + 6, stroke: INK, 'stroke-width': 2 }, svg);
      svgEl('polygon', { points: `${x1 + 2},${yTop + 6} ${x1 - 10},${yTop} ${x1 - 10},${yTop + 12}`, fill: INK }, svg);
      const label = addLabel(svg, wrap, `peak is in the infrared, off the graph (${approx}) \u2192`, x1, yTop - 30, 'diagram-label--left diagram-label--tick glow-peak-label glow-peak-label--off');
      label.style.width = `${((x1 - x0) / viewBoxSize(svg).w) * 100}%`;
    } else {
      const x = xFor(peakNm);
      svgEl('line', { class: 'glow-peak-marker', x1: x, x2: x, y1: yTop - 6, y2: yBottom, stroke: INK, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, svg);
      addLabel(svg, wrap, 'peak', x, yTop - 14, 'diagram-label--tick glow-peak-label');
    }
    svg.dataset.peak = where;
    return { peakNm, where };
  }

  const api = {
    PANEL_FILL,
    STRIP_EMPTY,
    INK,
    MUTED,
    CURVE,
    svgEl,
    clearDiagram,
    viewBoxSize,
    addLabel,
    panel,
    rgbString,
    stripColour,
    starDisplayRgb,
    makeScale,
    drawStrip,
    drawWavelengthAxis,
    drawGraph,
    continuumFor,
    sampler,
    drawGlowCurve,
  };

  window.SpectrumDrawing = api;
})();
