/**
 * Shared label geometry for a labelled concentric-ring cutaway diagram
 * (sims/sun-declination.html's Sun structure, notes/earth-structure.html's
 * and notes/moon-structure.html's Inside the Earth/Moon): works out
 * where a leader line from a given ring should end, and where the
 * label itself should sit, so every such diagram places its labels the
 * same way — a thin leader line from a dot on the layer's own ring,
 * out to a label in a neat column outside every ring, never
 * overlapping one. Every label in a diagram shares the same distance
 * from the centre (outerRadius + margin), regardless of which ring its
 * own leader line starts on, so the labels form a clean column rather
 * than tracking each ring's own radius outward.
 *
 * Pure geometry, no DOM dependency: a caller draws the actual SVG
 * line/dot with its own existing svgEl() helper, and positions its own
 * existing label element with the returned percentages — this module
 * only computes where things go.
 */
function layoutRingLabel({ cx, cy, radius, angleDeg, outerRadius, width, height, margin = 70 }) {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = -Math.sin(rad);
  const dotX = cx + dx * radius;
  const dotY = cy + dy * radius;
  const anchorDistance = outerRadius + margin;
  const leaderEndX = cx + dx * anchorDistance;
  const leaderEndY = cy + dy * anchorDistance;
  const side = Math.abs(dx) < 0.3 ? (dy < 0 ? 'top' : 'bottom') : dx < 0 ? 'left' : 'right';
  return {
    dotX,
    dotY,
    leaderEndX,
    leaderEndY,
    leftPercent: (leaderEndX / width) * 100,
    topPercent: (leaderEndY / height) * 100,
    side,
  };
}

const ringDiagramLabelsApi = { layoutRingLabel };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ringDiagramLabelsApi;
} else if (typeof window !== 'undefined') {
  window.RingDiagramLabels = ringDiagramLabelsApi;
}
