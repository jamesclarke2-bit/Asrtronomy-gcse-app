/**
 * Drawing a light curve: apparent magnitude against time, with the
 * magnitude axis running "upside down" (the smallest, brightest number at
 * the top). First written for notes/variable-stars.html and shared with
 * notes/eclipsing-binaries.html. Browser-only; draws with
 * SpectrumDrawing's SVG and label helpers (src/spectrumDrawing.js).
 */
(function () {
  const D = window.SpectrumDrawing;
  const { MUTED, svgEl, addLabel } = D;
  const fmt1 = (x) => x.toFixed(1);

  /**
   * A light curve: magnitude against time, with the magnitude axis running
   * "upside down" (mTop, the smallest number, at the top). Options: box
   * (x0, x1, yTop, yBottom), ranges (tMin, tMax, mTop, mBottom), fn(t) ->
   * magnitude, mTicks, tTicks, tGrid (grid-line spacing in days),
   * mFormat, stroke, samples, brighterNote (false to leave it off).
   */
  function drawLightCurve(svg, wrap, o) {
    const xFor = (t) => o.x0 + ((t - o.tMin) / (o.tMax - o.tMin)) * (o.x1 - o.x0);
    const yFor = (m) => o.yTop + ((m - o.mTop) / (o.mBottom - o.mTop)) * (o.yBottom - o.yTop);
    svgEl('rect', { x: o.x0, y: o.yTop, width: o.x1 - o.x0, height: o.yBottom - o.yTop, fill: 'none', stroke: MUTED }, svg);
    (o.mTicks || []).forEach((m) => {
      const y = yFor(m);
      svgEl('line', { x1: o.x0, x2: o.x1, y1: y, y2: y, stroke: MUTED, 'stroke-width': 0.5, opacity: 0.35 }, svg);
      addLabel(svg, wrap, o.mFormat ? o.mFormat(m) : fmt1(m), o.x0 - 6, y, 'diagram-label--tick diagram-label--left');
    });
    // Optional faint vertical grid lines, e.g. every day, for reading times.
    if (o.tGrid) {
      for (let t = Math.ceil(o.tMin / o.tGrid) * o.tGrid; t <= o.tMax + 1e-9; t += o.tGrid) {
        const x = xFor(t);
        svgEl('line', { x1: x, x2: x, y1: o.yTop, y2: o.yBottom, stroke: MUTED, 'stroke-width': 0.5, opacity: 0.35 }, svg);
      }
    }
    (o.tTicks || []).forEach((t) => {
      const x = xFor(t);
      svgEl('line', { x1: x, x2: x, y1: o.yBottom, y2: o.yBottom + 5, stroke: MUTED }, svg);
      addLabel(svg, wrap, String(t), x, o.yBottom + 16, 'diagram-label--tick');
    });
    const pts = [];
    const n = o.samples || 600;
    for (let i = 0; i <= n; i += 1) {
      const t = o.tMin + ((o.tMax - o.tMin) * i) / n;
      const m = Math.max(o.mTop, Math.min(o.mBottom, o.fn(t)));
      pts.push(`${xFor(t).toFixed(1)},${yFor(m).toFixed(1)}`);
    }
    svgEl('polyline', { class: 'vs-curve', points: pts.join(' '), fill: 'none', stroke: o.stroke || '#ffe08a', 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, svg);
    if (o.brighterNote !== false) addLabel(svg, wrap, '↑ brighter', o.x0 + 6, o.yTop + 11, 'diagram-label--tick diagram-label--right');
    return { xFor, yFor };
  }

  function niceTicks(lo, hi, count) {
    const raw = (hi - lo) / count;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 5, 10].map((k) => k * pow).find((s) => s >= raw);
    const out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Number(v.toFixed(6)));
    return out;
  }

  const api = { drawLightCurve, niceTicks };
  window.LightCurveDrawing = api;
})();
