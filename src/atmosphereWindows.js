/**
 * The atmospheric transmission-window chart: how far each part of the
 * electromagnetic spectrum gets down through the atmosphere before being
 * absorbed. Moved here unchanged from notes/earth-structure.js so that
 * notes/earth-structure.html (13.22) and notes/infrared-telescopes.html
 * (13.23) draw the same chart from the same data.
 *
 * draw(svg) draws it exactly as the Earth page always has, band names
 * and all, in SVG text. draw(svg, { text: false }) leaves the text out,
 * for a page that adds its own HTML labels using bandCentre().
 */
(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (parent) parent.appendChild(el);
    return el;
  }

  // How far each part of the spectrum penetrates (bar height) and whether
  // it's open, partly absorbed, or blocked (colour) before reaching the
  // ground.
  const BANDS = [
    { name: 'Gamma ray', heightPct: 10, category: 'blocked' },
    { name: 'X-ray', heightPct: 16, category: 'blocked' },
    { name: 'Ultraviolet', heightPct: 32, category: 'blocked' },
    { name: 'Optical', heightPct: 100, category: 'open' },
    { name: 'Infrared', heightPct: 60, category: 'partial' },
    { name: 'Radio', heightPct: 100, category: 'open' },
  ];
  const COLORS = { open: '#2a6bd6', partial: '#e8a23a', blocked: '#c0392b' };

  const GEOMETRY = { wellHeight: 160, wellY: 30, bandWidth: 80, gap: 20, startX: 30 };
  const GROUND_Y = GEOMETRY.wellY + GEOMETRY.wellHeight;

  /** The x of a band's centre, and the ground line's y, in the chart's 640 x 260 viewBox. */
  function bandCentre(i) {
    return GEOMETRY.startX + i * (GEOMETRY.bandWidth + GEOMETRY.gap) + GEOMETRY.bandWidth / 2;
  }

  function draw(svg, options = {}) {
    const text = options.text !== false;
    const { wellHeight, wellY, bandWidth, gap, startX } = GEOMETRY;
    const groundY = GROUND_Y;
    const lastBandRight = startX + (BANDS.length - 1) * (bandWidth + gap) + bandWidth;

    svgEl('line', { x1: startX - 10, y1: groundY, x2: lastBandRight + 10, y2: groundY, stroke: '#4a6741', 'stroke-width': 3 }, svg);
    if (text) {
      svgEl('text', {
        x: (startX + lastBandRight) / 2, y: groundY + 22,
        'font-size': 13, fill: '#4a6741', 'font-weight': 600, 'text-anchor': 'middle',
      }, svg).textContent = "Earth's surface";
    }

    BANDS.forEach((band, i) => {
      const x = startX + i * (bandWidth + gap);
      const barHeight = (band.heightPct / 100) * wellHeight;
      const barY = groundY - barHeight;
      svgEl('rect', { x, y: wellY, width: bandWidth, height: wellHeight, fill: '#eef1f4', rx: 4 }, svg);
      svgEl('rect', { x, y: barY, width: bandWidth, height: barHeight, fill: COLORS[band.category], 'data-band': band.name, 'data-category': band.category }, svg);
      if (text) {
        const label = svgEl('text', {
          x: x + bandWidth / 2, y: groundY + 40, 'font-size': 12, fill: '#444', 'text-anchor': 'middle',
        }, svg);
        label.textContent = band.name;
      }
    });
  }

  const api = { BANDS, COLORS, GROUND_Y, bandCentre, draw };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.AtmosphereWindows = api;
  }
})();
