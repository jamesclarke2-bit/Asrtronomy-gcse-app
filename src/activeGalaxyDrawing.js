/**
 * Draws an Active Galactic Nucleus side-on, our own artwork, for
 * notes/active-galaxies.html and its "name the parts" question. Each part
 * is told apart by shape as well as colour: the black hole a small black
 * disc ringed in light; the accretion disc a thin flat glowing ellipse;
 * the dusty ring (torus) two thick dark hatched lumps either side, as cut
 * through; the jets two long narrow cones along the axis. Browser only.
 */
(function () {
  const D = window.SpectrumDrawing;
  const { INK, svgEl, addLabel } = D;

  let count = 0;

  function defs(svg) {
    count += 1;
    const id = `agn-${count}`;
    let d = svg.querySelector('defs');
    if (!d) d = svgEl('defs', {}, svg);
    const g = svgEl('radialGradient', { id: `${id}-disc` }, d);
    svgEl('stop', { offset: '0%', 'stop-color': '#ffffff' }, g);
    svgEl('stop', { offset: '40%', 'stop-color': '#ffd59a' }, g);
    svgEl('stop', { offset: '100%', 'stop-color': '#ff9a4d', 'stop-opacity': 0.2 }, g);
    const hatch = svgEl('pattern', { id: `${id}-hatch`, width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, d);
    svgEl('rect', { width: 6, height: 6, fill: '#3b2a1c' }, hatch);
    svgEl('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: '#7a5a3a', 'stroke-width': 2 }, hatch);
    return id;
  }

  /**
   * Draws the AGN with its jet axis vertical, centred at (cx, cy). With
   * `labels`, names each part; with `letters`, marks A-D instead (black
   * hole, disc, ring, jet). Returns the group.
   */
  function drawAgn(svg, wrap, { cx, cy, scale = 1, labels = false, letters = false, jets = true, jetLength = 125 }) {
    const id = defs(svg);
    const s = scale;
    const g = svgEl('g', { class: 'agn' }, svg);
    if (jets) {
      [-1, 1].forEach((dir) => {
        const tip = cy + dir * jetLength * s;
        const base = cy + dir * 8 * s;
        svgEl('path', { class: 'agn-jet', d: `M${cx - 4 * s},${base} L${cx - 13 * s},${tip} L${cx + 13 * s},${tip} L${cx + 4 * s},${base} Z`, fill: '#cfe0ff', opacity: 0.7 }, g);
      });
    }
    // The dusty ring, cut through: a thick dark lump either side.
    [-1, 1].forEach((side) => {
      svgEl('ellipse', { class: 'agn-torus', cx: cx + side * 92 * s, cy, rx: 40 * s, ry: 28 * s, fill: `url(#${id}-hatch)`, stroke: '#a07850', 'stroke-width': 1.5 }, g);
    });
    svgEl('ellipse', { class: 'agn-disc', cx, cy, rx: 58 * s, ry: 7 * s, fill: `url(#${id}-disc)` }, g);
    svgEl('circle', { class: 'agn-hole', cx, cy, r: 7 * s, fill: '#000', stroke: '#fff1c9', 'stroke-width': 1.5 }, g);
    if (labels) {
      svgEl('line', { x1: cx - 6 * s, y1: cy - 5 * s, x2: cx - 70 * s, y2: cy - 55 * s, stroke: INK, 'stroke-width': 1 }, g);
      addLabel(svg, wrap, 'supermassive black hole', cx - 110 * s, cy - 66 * s, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, 'accretion disc', cx - 62 * s, cy + 30 * s, 'diagram-label--tick');
      addLabel(svg, wrap, 'dusty ring', cx + 92 * s, cy + 44 * s, 'diagram-label--tick');
      addLabel(svg, wrap, 'jet', cx + 34 * s, cy - 100 * s, 'diagram-label--tick diagram-label--strong');
    }
    if (letters) {
      const spots = [
        ['A', cx, cy, -18, -26],
        ['B', cx + 40 * s, cy, 6, 26],
        ['C', cx + 92 * s, cy, 0, -46],
        ['D', cx, cy - 95 * s, 30, 0],
      ];
      spots.forEach(([l, x, y, dx, dy]) => {
        svgEl('line', { x1: x, y1: y, x2: x + dx * 0.7, y2: y + dy * 0.7, stroke: INK, 'stroke-width': 1 }, g);
        addLabel(svg, wrap, l, x + dx, y + dy, 'diagram-label--tick diagram-label--strong ag-letter');
      });
    }
    return g;
  }

  window.ActiveGalaxyDrawing = { drawAgn };
})();
