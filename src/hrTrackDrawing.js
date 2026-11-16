/**
 * Draws stars' life tracks on an HR diagram, shared by
 * notes/sun-like-star.html (the Sun-like track alone) and
 * notes/massive-stars.html (both tracks together, for 13.8). Tracks come
 * from SunLikeStar.TRACKS (src/sunLikeStar.js).
 *
 * Each track is told apart by line style (dashed for the Sun-like star,
 * solid and thicker for the massive star) and by its own labels, never by
 * colour alone.
 *
 *   const T = HrTrackDrawing.make(HrDiagram, SpectrumDrawing);
 *   T.drawAxes(svg, wrap);
 *   T.drawTrack(svg, SunLikeStar.TRACKS.sunLike, 'sl-track--sun-like', T.STYLES.sunLike);
 *   T.drawPoints(svg, wrap, track, chosenId, labelFor);
 */
(function () {
  const STYLES = {
    sunLike: { dash: '8 5', width: 2.5, marker: 'circle' },
    massive: { dash: 'none', width: 4, marker: 'square' },
  };

  /** opts.yTop / opts.yBottom move the plot down, to leave room above it (e.g. for an arrow off the chart). */
  function make(H, D, opts = {}) {
    const { INK, MUTED, svgEl, addLabel } = D;
    const GEOM = { x0: 92, x1: 590, yTop: opts.yTop || 40, yBottom: opts.yBottom || 370 };
    const plot = H.makePlot(GEOM);
    const L_TICKS = [[1e4, '10⁴'], [1e2, '10²'], [1, '1'], [1e-2, '10⁻²'], [1e-4, '10⁻⁴']];
    const T_TICKS = [40000, 20000, 10000, 5000, 3000];

    /** The frame, the ticks, the axis titles and the main sequence band. */
    function drawAxes(svg, wrap) {
      svgEl('rect', { x: GEOM.x0, y: GEOM.yTop, width: GEOM.x1 - GEOM.x0, height: GEOM.yBottom - GEOM.yTop, fill: 'none', stroke: MUTED }, svg);
      L_TICKS.forEach(([lum, text]) => {
        const y = plot.yForL(lum);
        svgEl('line', { x1: GEOM.x0 - 6, y1: y, x2: GEOM.x0, y2: y, stroke: MUTED }, svg);
        addLabel(svg, wrap, text, GEOM.x0 - 10, y, 'diagram-label--tick diagram-label--left');
      });
      T_TICKS.forEach((t) => {
        const x = plot.xForT(t);
        svgEl('line', { x1: x, y1: GEOM.yBottom, x2: x, y2: GEOM.yBottom + 6, stroke: MUTED }, svg);
        addLabel(svg, wrap, t.toLocaleString('en-GB'), x, GEOM.yBottom + 18, 'diagram-label--tick');
      });
      addLabel(svg, wrap, 'surface temperature (K), hottest on the left', 340, GEOM.yBottom + 44, 'diagram-label--tick');
      addLabel(svg, wrap, 'luminosity (Sun = 1)', GEOM.x0 + 6, 20, 'diagram-label--tick diagram-label--right');
      const upper = [];
      const lower = [];
      for (let lt = Math.log10(40000); lt >= Math.log10(3000); lt -= 0.02) {
        const t = 10 ** lt;
        const r = H.mainSequenceRange(t);
        upper.push([plot.xForT(t), plot.yForM(r.bright)]);
        lower.unshift([plot.xForT(t), plot.yForM(r.faint)]);
      }
      svgEl('polygon', { class: 'sl-ms-band', points: [...upper, ...lower].map(([x, y]) => `${x.toFixed(1)},${Math.max(GEOM.yTop, Math.min(GEOM.yBottom, y)).toFixed(1)}`).join(' '), fill: 'rgba(255, 224, 138, 0.16)', stroke: '#ffe08a', 'stroke-dasharray': '6 4' }, svg);
    }

    /** One track's path, with direction arrows along it. */
    function drawTrack(svg, track, cls, style) {
      const pts = track.path.map(([t, lum]) => [plot.xForT(t), Math.max(GEOM.yTop, plot.yForL(lum))]);
      svgEl('polyline', { class: `sl-track ${cls}`, points: pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '), fill: 'none', stroke: INK, 'stroke-width': style.width, 'stroke-dasharray': style.dash, 'stroke-linejoin': 'round' }, svg);
      for (let k = 1; k < pts.length; k += 3) {
        const [xa, ya] = pts[k - 1];
        const [xb, yb] = pts[k];
        const mx = (xa + xb) / 2;
        const my = (ya + yb) / 2;
        const a = Math.atan2(yb - ya, xb - xa);
        svgEl('path', { d: `M${(mx + 7 * Math.cos(a)).toFixed(1)},${(my + 7 * Math.sin(a)).toFixed(1)} L${(mx - 7 * Math.cos(a - 0.5)).toFixed(1)},${(my - 7 * Math.sin(a - 0.5)).toFixed(1)} M${(mx + 7 * Math.cos(a)).toFixed(1)},${(my + 7 * Math.sin(a)).toFixed(1)} L${(mx - 7 * Math.cos(a + 0.5)).toFixed(1)},${(my - 7 * Math.sin(a + 0.5)).toFixed(1)}`, stroke: INK, 'stroke-width': 2.5, fill: 'none' }, svg);
      }
      return pts;
    }

    /**
     * A marker at every stage point of a track (circles for one style,
     * squares for the other), a ring on the chosen one, and each point's
     * label from labelFor(id) → [text, dx, dy, side] (or null for none).
     */
    function drawPoints(svg, wrap, track, style, chosenId, labelFor, trackKey) {
      Object.entries(track.points).forEach(([id, [t, lum]]) => {
        const x = plot.xForT(t);
        const y = Math.max(GEOM.yTop, plot.yForL(lum));
        const chosen = id === chosenId;
        const attrs = { class: `sl-track-point${chosen ? ' sl-track-point--chosen' : ''}`, 'data-stage': id, 'data-track': trackKey || '', fill: INK };
        if (style.marker === 'square') svgEl('rect', { ...attrs, x: (x - 5.5).toFixed(1), y: (y - 5.5).toFixed(1), width: 11, height: 11 }, svg);
        else svgEl('circle', { ...attrs, cx: x.toFixed(1), cy: y.toFixed(1), r: 5 }, svg);
        if (chosen) svgEl('circle', { class: 'sl-track-ring', cx: x.toFixed(1), cy: y.toFixed(1), r: 12, fill: 'none', stroke: INK, 'stroke-width': 2.5 }, svg);
        const label = labelFor(id);
        if (label) {
          const [text, dx, dy, side] = label;
          addLabel(svg, wrap, text, x + dx, y + dy, `diagram-label--tick${chosen ? ' diagram-label--strong' : ''} diagram-label--${side}`);
        }
      });
    }

    return { GEOM, plot, drawAxes, drawTrack, drawPoints };
  }

  const api = { STYLES, make };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.HrTrackDrawing = api;
  }
})();
