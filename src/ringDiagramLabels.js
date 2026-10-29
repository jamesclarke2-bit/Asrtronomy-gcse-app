/**
 * Shared label geometry for a labelled concentric-ring cutaway diagram
 * (sims/sun-declination.html's Sun structure, notes/earth-structure.html's
 * and notes/moon-structure.html's Inside the Earth/Moon): one design for
 * all three. The ring sits to the left of its box; every layer's name
 * sits in a single column to the right, left-aligned at a shared x,
 * ordered top to bottom from the outermost layer down to the centre,
 * evenly spaced down the ring's own height. Each label gets a thin,
 * straight leader line back to a dot inside its own layer's band (the
 * midpoint radius between that layer's own outer edge and the next
 * layer in, or the centre for the innermost layer).
 *
 * The leader line for every layer lies exactly on the straight line from
 * the ring's centre through that layer's own label — only starting
 * partway out, at the dot, rather than at the centre itself. Since
 * labels run in one evenly-spaced column, their angles-from-centre are
 * already in sorted (monotonic) order, so no two of these radial
 * segments can ever cross one another.
 *
 * Pure geometry, no DOM dependency: a caller draws the actual SVG
 * line/dot and positions its own label element with the returned
 * percentages — this module only computes where things go.
 */
function layoutRingColumn({ cx, cy, outerRadius, width, height, labelX, layers }) {
  const n = layers.length;
  const top = cy - outerRadius;
  const span = outerRadius * 2;

  return layers.map((layer, i) => {
    const bandOuter = layer.radius;
    const bandInner = i + 1 < n ? layers[i + 1].radius : 0;
    const bandRadius = (bandOuter + bandInner) / 2;

    const labelY = top + (i + 0.5) * (span / n);
    const dx = labelX - cx;
    const dy = labelY - cy;
    const dist = Math.hypot(dx, dy);
    const dotX = cx + (dx / dist) * bandRadius;
    const dotY = cy + (dy / dist) * bandRadius;

    return {
      name: layer.name,
      bandRadius,
      dotX,
      dotY,
      labelX,
      labelY,
      leftPercent: (labelX / width) * 100,
      topPercent: (labelY / height) * 100,
      dotLeftPercent: (dotX / width) * 100,
      dotTopPercent: (dotY / height) * 100,
    };
  });
}

const ringDiagramLabelsApi = { layoutRingColumn };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ringDiagramLabelsApi;
} else if (typeof window !== 'undefined') {
  window.RingDiagramLabels = ringDiagramLabelsApi;
}
