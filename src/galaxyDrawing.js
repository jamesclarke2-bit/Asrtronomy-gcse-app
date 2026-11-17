/**
 * Draws galaxies of each Hubble type, our own artwork, told apart by shape
 * alone (every type uses the same pale colours):
 *   elliptical (E0-E7): a smooth oval, rounder for E0, flatter for E7;
 *   lenticular (S0): a bright bulge in a smooth disc, no arms;
 *   spiral (Sa-Sc): a round bulge with two arms, big bulge and tight arms
 *     for Sa, small bulge and loose arms for Sc;
 *   barred spiral (SBa-SBc): the same, but the arms start from the ends of
 *     a straight bar through the centre;
 *   irregular: a ragged scatter of clumps, no regular shape.
 * Used by notes/galaxy-types.html and notes/local-group.html. Browser only.
 */
(function () {
  const D = window.SpectrumDrawing;
  const { svgEl } = D;

  const GLOW = '#e4ebff';
  const CORE = '#fff4dc';
  const ARM = '#c9d6ff';

  const SUB = {
    a: { bulge: 0.4, pitchDeg: 9, turns: 1.25 },
    b: { bulge: 0.27, pitchDeg: 15, turns: 0.95 },
    c: { bulge: 0.15, pitchDeg: 24, turns: 0.7 },
  };

  function seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  let gradientCount = 0;
  function glowGradient(svg) {
    gradientCount += 1;
    const id = `gx-glow-${gradientCount}`;
    let defs = svg.querySelector('defs');
    if (!defs) defs = svgEl('defs', {}, svg);
    const g = svgEl('radialGradient', { id }, defs);
    svgEl('stop', { offset: '0%', 'stop-color': CORE, 'stop-opacity': 1 }, g);
    svgEl('stop', { offset: '45%', 'stop-color': GLOW, 'stop-opacity': 0.75 }, g);
    svgEl('stop', { offset: '100%', 'stop-color': GLOW, 'stop-opacity': 0 }, g);
    return `url(#${id})`;
  }

  /** Two spiral arms from radius r0 out to r, as SVG paths, for a face-on disc. */
  function armPaths(r0, r, sub, startAngle) {
    const { pitchDeg } = SUB[sub];
    const k = Math.tan((pitchDeg * Math.PI) / 180);
    const tMax = Math.log(r / r0) / k;
    return [0, Math.PI].map((off) => {
      const pts = [];
      for (let t = 0; t <= tMax; t += tMax / 40) {
        const rr = r0 * Math.exp(k * t);
        const a = startAngle + off + t;
        pts.push([rr * Math.cos(a), rr * Math.sin(a)]);
      }
      return pts;
    });
  }

  /**
   * Draws one galaxy into `svg`, centred at (cx, cy), radius r, as a
   * group with class `gx-galaxy gx-<kind>`. spec: { kind: 'elliptical' |
   * 'lenticular' | 'spiral' | 'barred' | 'irregular', e (0-7, ellipticals),
   * sub ('a' | 'b' | 'c', spirals), tilt (0 face-on to 0.8 nearly edge-on,
   * spirals), angle (degrees), seed (irregulars) }.
   */
  function drawGalaxy(svg, spec, cx, cy, r) {
    const angle = spec.angle || 0;
    const g = svgEl('g', { class: `gx-galaxy gx-${spec.kind}`, transform: `translate(${cx} ${cy}) rotate(${angle})` }, svg);
    const fill = glowGradient(svg);
    if (spec.kind === 'elliptical') {
      const e = spec.e || 0;
      svgEl('ellipse', { cx: 0, cy: 0, rx: r, ry: r * (1 - e / 10), fill }, g);
      svgEl('ellipse', { cx: 0, cy: 0, rx: r * 0.25, ry: r * 0.25 * (1 - e / 10), fill: CORE, opacity: 0.8 }, g);
      return g;
    }
    if (spec.kind === 'lenticular') {
      svgEl('ellipse', { cx: 0, cy: 0, rx: r, ry: r * 0.32, fill }, g);
      svgEl('ellipse', { cx: 0, cy: 0, rx: r * 0.32, ry: r * 0.24, fill: CORE, opacity: 0.85 }, g);
      return g;
    }
    if (spec.kind === 'irregular') {
      const rand = seeded(spec.seed || 7);
      for (let i = 0; i < 9; i += 1) {
        const a = rand() * Math.PI * 2;
        const d = rand() * r * 0.7;
        const rr = r * (0.18 + rand() * 0.25);
        svgEl('ellipse', { class: 'gx-clump', cx: (d * Math.cos(a)).toFixed(1), cy: (d * Math.sin(a) * 0.8).toFixed(1), rx: rr.toFixed(1), ry: (rr * (0.5 + rand() * 0.5)).toFixed(1), fill, opacity: 0.9 }, g);
      }
      for (let i = 0; i < 6; i += 1) {
        const a = rand() * Math.PI * 2;
        const d = rand() * r * 0.75;
        svgEl('circle', { cx: (d * Math.cos(a)).toFixed(1), cy: (d * Math.sin(a) * 0.8).toFixed(1), r: Math.max(1.2, r * 0.05).toFixed(1), fill: CORE }, g);
      }
      return g;
    }
    // Spirals and barred spirals, face-on, then squashed by the tilt.
    const sub = spec.sub || 'b';
    const tilt = spec.tilt || 0;
    const disc = svgEl('g', { transform: `scale(1 ${1 - tilt})` }, g);
    svgEl('circle', { cx: 0, cy: 0, r: r * 1.02, fill, opacity: 0.55 }, disc);
    const barred = spec.kind === 'barred';
    const barHalf = r * 0.5;
    const r0 = barred ? barHalf : r * SUB[sub].bulge * 0.95;
    armPaths(r0, r, sub, 0).forEach((pts) => {
      const d = pts.map(([x, y], k) => `${k ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
      svgEl('path', { class: 'gx-arm', d, fill: 'none', stroke: ARM, 'stroke-width': Math.max(1.5, r * 0.12), 'stroke-linecap': 'round', opacity: 0.85 }, disc);
    });
    if (barred) svgEl('rect', { class: 'gx-bar', x: -barHalf, y: -r * 0.11, width: 2 * barHalf, height: r * 0.22, rx: r * 0.11, fill: CORE, opacity: 0.95 }, disc);
    svgEl('circle', { class: 'gx-bulge', cx: 0, cy: 0, r: r * SUB[sub].bulge * (barred ? 0.8 : 1), fill: CORE, opacity: 0.9 }, disc);
    return g;
  }

  window.GalaxyDrawing = { drawGalaxy, SUB };
})();
