/**
 * The site's one shared Sun symbol, in two variants, used everywhere
 * the Sun is drawn (canvas or SVG, static or JS-generated) instead of
 * each page hand-rolling its own flat circle or cartoon rays:
 *
 *  - Full-colour: a radial-gradient disc (warm white centre, through
 *    amber, to a deep-orange edge) with a soft corona glow behind it.
 *    No triangle/line rays — the gradient and glow alone read as the
 *    Sun.
 *  - Monochrome: a single flat deep-orange circle, for a legend dot,
 *    a tiny sprite icon, or any other context too small for a visible
 *    gradient to read.
 *
 * EDGE_COLOR (the gradient's outer stop, the full-colour disc's own
 * stroke, and the monochrome fill) is chosen to hold at least 3:1
 * contrast against both the site's light panel backgrounds and its
 * dark night-sky ones — see test/sunIcon.test.js's own contrast
 * checks, run against the same WCAG relative-luminance formula used
 * there.
 *
 * Canvas pages call drawSunDiscCanvas/drawSunMonoCanvas directly.
 * JS-generated SVG (a page script building its own diagram with
 * document.createElementNS) calls appendSunSvg/appendSunMonoSvg.
 * Static hand-written SVG marks its Sun circle(s) with class="sun-disc"
 * (or "sun-disc-mono") and calls enhanceStaticSuns(document) once on
 * load — see notes/observing-techniques.js for a worked example.
 */
(function () {
  const GRADIENT_STOPS = [
    { offset: 0, color: '#fff8e3' },
    { offset: 0.55, color: '#ffb703' },
    { offset: 1, color: '#c9540a' },
  ];
  const EDGE_COLOR = '#c9540a';
  const MONO_COLOR = '#c9540a';
  const CORONA_RGB = '255, 183, 3';

  // --- Canvas ------------------------------------------------------------

  function drawSunDiscCanvas(ctx, cx, cy, r, options) {
    const opts = options || {};
    if (opts.corona !== false) {
      const coronaScale = opts.coronaScale === undefined ? 1.8 : opts.coronaScale;
      const glow = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * coronaScale);
      glow.addColorStop(0, `rgba(${CORONA_RGB}, 0.3)`);
      glow.addColorStop(1, `rgba(${CORONA_RGB}, 0)`);
      ctx.save();
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r * coronaScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const gradient = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.05, cx, cy, r);
    GRADIENT_STOPS.forEach((stop) => gradient.addColorStop(stop.offset, stop.color));

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    if (opts.stroke !== false) {
      ctx.strokeStyle = EDGE_COLOR;
      ctx.lineWidth = opts.strokeWidth === undefined ? Math.max(1, r * 0.06) : opts.strokeWidth;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSunMonoCanvas(ctx, cx, cy, r, options) {
    const opts = options || {};
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = opts.color || MONO_COLOR;
    ctx.fill();
    ctx.restore();
  }

  // --- JS-generated SVG ----------------------------------------------

  const SVG_NS = 'http://www.w3.org/2000/svg';
  let gradientCounter = 0;

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  }

  // Ensures svgRoot has a <defs><radialGradient> for the full-colour
  // disc, reusing one already created on this same svgRoot rather than
  // adding a duplicate — returns its id.
  function ensureGradientDef(svgRoot) {
    let defs = svgRoot.querySelector('defs');
    if (!defs) {
      defs = svgEl('defs', {});
      svgRoot.insertBefore(defs, svgRoot.firstChild);
    }
    const existing = defs.querySelector('[data-sun-icon-gradient]');
    if (existing) return existing.getAttribute('id');
    gradientCounter += 1;
    const id = `sun-icon-gradient-${gradientCounter}`;
    const gradient = svgEl('radialGradient', {
      id, cx: '35%', cy: '35%', r: '70%', 'data-sun-icon-gradient': 'true',
    });
    GRADIENT_STOPS.forEach((stop) => {
      gradient.appendChild(svgEl('stop', { offset: `${stop.offset * 100}%`, 'stop-color': stop.color }));
    });
    defs.appendChild(gradient);
    return id;
  }

  /** Appends a full-colour Sun (corona + gradient disc) to svgRoot at (cx, cy) with radius r. Returns the <g>. */
  function appendSunSvg(svgRoot, cx, cy, r, options) {
    const opts = options || {};
    const gradientId = ensureGradientDef(svgRoot);
    const g = svgEl('g', { class: 'sun-icon' });
    if (opts.corona !== false) {
      const coronaScale = opts.coronaScale === undefined ? 1.8 : opts.coronaScale;
      [[coronaScale, 0.06], [1 + (coronaScale - 1) * 0.55, 0.1], [1 + (coronaScale - 1) * 0.2, 0.16]].forEach(([scale, opacity]) => {
        g.appendChild(svgEl('circle', { cx, cy, r: r * scale, fill: `rgba(${CORONA_RGB}, ${opacity})` }));
      });
    }
    g.appendChild(svgEl('circle', {
      cx, cy, r, fill: `url(#${gradientId})`,
      stroke: opts.stroke === false ? 'none' : EDGE_COLOR,
      'stroke-width': opts.strokeWidth === undefined ? Math.max(1, r * 0.06) : opts.strokeWidth,
    }));
    svgRoot.appendChild(g);
    return g;
  }

  function appendSunMonoSvg(svgRoot, cx, cy, r, options) {
    const opts = options || {};
    const g = svgEl('g', { class: 'sun-icon-mono' });
    g.appendChild(svgEl('circle', { cx, cy, r, fill: opts.color || MONO_COLOR }));
    svgRoot.appendChild(g);
    return g;
  }

  // --- Static, hand-written SVG ----------------------------------------

  // Upgrades every <circle class="sun-disc"> (full-colour) and
  // <circle class="sun-disc-mono"> (monochrome) already in the page's
  // own markup: adds the corona glow and switches the fill to the
  // shared gradient (or flat colour), in place, reading each circle's
  // own cx/cy/r rather than requiring them to be passed in — so the
  // page's static SVG stays the single source of truth for layout,
  // and this just swaps in the shared paint.
  function enhanceStaticSuns(root) {
    (root || document).querySelectorAll('circle.sun-disc').forEach((circle) => {
      const svgRoot = circle.closest('svg');
      if (!svgRoot || circle.dataset.sunIconEnhanced) return;
      const cx = Number(circle.getAttribute('cx'));
      const cy = Number(circle.getAttribute('cy'));
      const r = Number(circle.getAttribute('r'));
      const gradientId = ensureGradientDef(svgRoot);
      const coronaScale = Number(circle.dataset.sunCoronaScale) || 1.8;
      if (circle.dataset.sunCorona !== 'false') {
        [[coronaScale, 0.06], [1 + (coronaScale - 1) * 0.55, 0.1], [1 + (coronaScale - 1) * 0.2, 0.16]].forEach(([scale, opacity]) => {
          const glow = svgEl('circle', { cx, cy, r: r * scale, fill: `rgba(${CORONA_RGB}, ${opacity})` });
          svgRoot.insertBefore(glow, circle);
        });
      }
      circle.setAttribute('fill', `url(#${gradientId})`);
      if (circle.dataset.sunStroke !== 'false') {
        circle.setAttribute('stroke', EDGE_COLOR);
        circle.setAttribute('stroke-width', circle.dataset.sunStrokeWidth || String(Math.max(1, r * 0.06)));
      }
      circle.dataset.sunIconEnhanced = 'true';
    });
    (root || document).querySelectorAll('circle.sun-disc-mono').forEach((circle) => {
      if (circle.dataset.sunIconEnhanced) return;
      circle.setAttribute('fill', circle.dataset.sunColor || MONO_COLOR);
      circle.dataset.sunIconEnhanced = 'true';
    });
  }

  const api = {
    GRADIENT_STOPS,
    EDGE_COLOR,
    MONO_COLOR,
    CORONA_RGB,
    drawSunDiscCanvas,
    drawSunMonoCanvas,
    ensureGradientDef,
    appendSunSvg,
    appendSunMonoSvg,
    enhanceStaticSuns,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.SunIcon = api;
  }
})();
