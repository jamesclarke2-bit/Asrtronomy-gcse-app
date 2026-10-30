/**
 * Shared Earth-vs-Moon internal-layers comparison, drawn once here and
 * reused identically by notes/moon-structure.html's "Compare with
 * Earth's layers" panel and notes/earth-structure.html's own "Compare
 * with the Moon's layers" panel — one picture, not two copies that
 * could drift apart. Each body is a cutaway circle (crust, mantle,
 * outer core, inner core), labelled with the same leader-line column
 * geometry as every other ring diagram on the site (see
 * src/ringDiagramLabels.js), with a toggle between two views:
 *
 *   - "Same scale": both bodies drawn to the same km-per-pixel scale,
 *     from the Formulae and Data Sheet's own mean diameters (13,000 km
 *     Earth, 3,500 km Moon — src/specData.js's CONSTANTS.meanDiameterKm),
 *     so the Moon reads as the right size relative to Earth.
 *   - "Same size": both bodies drawn at the same outer radius, so each
 *     body's own internal layers can be compared as proportions of its
 *     own radius, independent of the size difference.
 *
 * Internal layer radii are a separate, more precise tier from the
 * data-sheet diameter above (see src/specData.js's own header comment
 * on that same distinction) — BODY_LAYERS_KM below, not the data sheet,
 * which has no internal-structure figures at all. First draft, to be
 * checked by the teacher, for every figure except the Moon's crust,
 * already given elsewhere on notes/moon-structure.html (34-43 km thick
 * on average, GRAIL 2013) — this reuses that same range's midpoint
 * rather than guessing a separate figure.
 */
(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Each body's own surface radius, the radius at the base of its
  // mantle (= the top of its outer core), the radius of its inner
  // core, and its crust's thickness, all in km. Starting values as
  // given: Earth 6,371 km surface, mantle base 3,480 km, inner core
  // 1,220 km, crust about 35 km; Moon 1,737 km surface, mantle base
  // about 350 km, inner core about 240 km, crust 38.5 km (the midpoint
  // of the 34-43 km GRAIL average already on the page).
  const BODY_LAYERS_KM = {
    earth: { surfaceRadiusKm: 6371, crustThicknessKm: 35, mantleBaseRadiusKm: 3480, innerCoreRadiusKm: 1220 },
    moon: { surfaceRadiusKm: 1737, crustThicknessKm: 38.5, mantleBaseRadiusKm: 350, innerCoreRadiusKm: 240 },
  };

  // Shared fill/stroke per layer — the same palette the page's own
  // "Inside the Earth"/"Inside the Moon" diagrams already use, outermost
  // first so each smaller ring paints over the last.
  const LAYER_STYLE = [
    { key: 'crust', name: 'Crust', fill: '#5b7c99', stroke: '#3f5a70' },
    { key: 'mantle', name: 'Mantle', fill: '#c17a4a' },
    { key: 'outerCore', name: 'Outer core', fill: '#e8631a' },
    { key: 'innerCore', name: 'Inner core', fill: '#fff2c4' },
  ];

  // Every layer's own OUTER boundary, as a fraction of that body's own
  // surface radius — e.g. earth.outerCore is how far out Earth's own
  // core (outer + inner together) reaches, about 55% of its radius,
  // against about 20% for the Moon.
  function layerFractions(bodyKey) {
    const b = BODY_LAYERS_KM[bodyKey];
    return {
      crust: 1,
      mantle: (b.surfaceRadiusKm - b.crustThicknessKm) / b.surfaceRadiusKm,
      outerCore: b.mantleBaseRadiusKm / b.surfaceRadiusKm,
      innerCore: b.innerCoreRadiusKm / b.surfaceRadiusKm,
    };
  }

  // This body's own outer (crust) radius in px, for one view mode.
  // "sameSize": always maxOuterRadiusPx, so both bodies draw the same
  // size and only their internal proportions differ. "sameScale":
  // Earth draws at the full maxOuterRadiusPx, and every other body
  // scales down by the ratio of the exam data sheet's own mean
  // diameters (specDiameterKm, normally SpecData.CONSTANTS.meanDiameterKm)
  // — not the more precise radii above, which have no reference point
  // of their own to scale against.
  function outerRadiusPx(bodyKey, mode, maxOuterRadiusPx, specDiameterKm) {
    if (mode === 'sameSize') return maxOuterRadiusPx;
    return maxOuterRadiusPx * (specDiameterKm[bodyKey] / specDiameterKm.earth);
  }

  // Every layer's outer radius in px, outermost first, for one body in
  // one view mode — the numbers src/ringDiagramLabels.js's
  // layoutRingColumn and the actual <circle> elements both draw from.
  function computeLayersPx(bodyKey, mode, maxOuterRadiusPx, specDiameterKm) {
    const outerPx = outerRadiusPx(bodyKey, mode, maxOuterRadiusPx, specDiameterKm);
    const fractions = layerFractions(bodyKey);
    return LAYER_STYLE.map((style) => ({ ...style, radiusPx: fractions[style.key] * outerPx }));
  }

  // One line per body, read off to build each view's own caption.
  function sameScaleMagnification(specDiameterKm) {
    return specDiameterKm.earth / specDiameterKm.moon;
  }
  function sameScaleCaption(specDiameterKm) {
    const ratio = sameScaleMagnification(specDiameterKm);
    return (
      `At the same scale, from the exam data sheet's own diameters (${specDiameterKm.earth.toLocaleString()} km Earth, ` +
      `${specDiameterKm.moon.toLocaleString()} km Moon), the Moon is about ${ratio.toFixed(1)}× narrower than Earth.`
    );
  }
  function sameSizeCaption() {
    const earthCorePercent = Math.round(layerFractions('earth').outerCore * 100);
    const moonCorePercent = Math.round(layerFractions('moon').outerCore * 100);
    return (
      `At the same size, the Moon's core is a much smaller fraction of its radius (about ${moonCorePercent}%) ` +
      `than Earth's (about ${earthCorePercent}%).`
    );
  }
  // The label on the Same-scale view's magnified inset: the real (tiny)
  // Moon circle drawn beside a second copy, scaled up to Earth's own
  // width, so its layers are the same ones a student can actually read.
  function magnifiedMoonLabel(specDiameterKm) {
    return `Moon, magnified about ${sameScaleMagnification(specDiameterKm).toFixed(1)} times`;
  }

  // Each layer's own SHARE of the radius — the width of its own band,
  // not the cumulative boundary layerFractions() gives — found by
  // subtracting each boundary from the next one out. Telescopes to
  // exactly 1 (100%) by construction: (1 - mantle) + (mantle - outerCore)
  // + (outerCore - innerCore) + innerCore = 1.
  function layerShareFractions(bodyKey) {
    const f = layerFractions(bodyKey);
    return {
      crust: f.crust - f.mantle,
      mantle: f.mantle - f.outerCore,
      outerCore: f.outerCore - f.innerCore,
      innerCore: f.innerCore,
    };
  }

  // A share as exam-style rounded text — one decimal place under 1%
  // (Earth's crust, at ~0.5%, would otherwise round to "0%" or "1%" and
  // lose the point), the nearest whole percent otherwise.
  function formatSharePercent(fraction) {
    const percent = fraction * 100;
    return percent < 1 ? `${percent.toFixed(1)}%` : `${Math.round(percent)}%`;
  }

  // --- Browser-only: the actual drawing -----------------------------------

  // labelOuterRadius is deliberately bigger than maxOuterRadiusPx (the
  // drawn circles' own biggest radius): it only sets how far apart the
  // 4 leader-line labels fan out vertically (layoutRingColumn's own
  // `outerRadius` param), not how big either body is drawn. Two bodies
  // side by side leaves each one only a narrow label column (see
  // .body-layers-label's CSS) — on a narrow phone-width screen, a
  // longer label like "Outer core" wraps onto 2 lines in that column,
  // so each row needs enough height to hold 2 lines without touching
  // its neighbour, which this wider fan radius, plus the taller canvas
  // below, provides.
  // sameScaleHeight is taller than height: Same-scale mode adds a second
  // row below the first, the real Moon's own proportions magnified up to
  // Earth's width, since at the data sheet's real size ratio the Moon's
  // own circle is too small to read its layers or labels in. The inset
  // sits directly below the real small Moon, sharing its cx/labelX, so
  // its own label column reuses geometry already checked not to overflow
  // (see labelOuterRadius's own comment below) rather than needing new,
  // untested side-by-side spacing.
  const GEOMETRY = {
    width: 1200,
    height: 680,
    sameScaleHeight: 1300,
    cy: 340,
    maxOuterRadiusPx: 150,
    labelOuterRadius: 270,
    earth: { key: 'earth', label: 'Earth', cx: 220, labelX: 394 },
    moon: { key: 'moon', label: 'Moon', cx: 794, labelX: 968 },
    insetCy: 980,
  };

  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (parent) parent.appendChild(el);
    return el;
  }

  function drawOneBody(svg, wrap, bodyGeometry, mode, specDiameterKm, RingDiagramLabels, cy, height) {
    const layers = computeLayersPx(bodyGeometry.key, mode, GEOMETRY.maxOuterRadiusPx, specDiameterKm);

    // Outermost first, so each smaller ring paints over the last.
    layers.forEach((layer) => {
      const attrs = { cx: bodyGeometry.cx, cy, r: layer.radiusPx, fill: layer.fill };
      if (layer.stroke) {
        attrs.stroke = layer.stroke;
        attrs['stroke-width'] = 2;
      }
      svgEl('circle', attrs, svg);
    });

    // The inset's own name ("Moon, magnified about 3.7 times") is much
    // longer than "Earth" or "Moon": centred below the circle like
    // theirs, it wraps onto 2-3 lines at phone width and the wrapped
    // box — centred, so growing equally in both directions — reaches
    // sideways into the leader-line label column next to it. Put it to
    // the circle's own left instead, in the empty space below Earth's
    // row, anchored so it only ever grows further left, away from
    // everything else in the picture.
    const bodyNameLabel = document.createElement('span');
    const nameLeft = bodyGeometry.nameLeft;
    if (nameLeft) {
      bodyNameLabel.className = 'body-layers-body-name body-layers-body-name--left';
      bodyNameLabel.style.left = `${(nameLeft.x / GEOMETRY.width) * 100}%`;
      bodyNameLabel.style.top = `${(nameLeft.y / height) * 100}%`;
    } else {
      bodyNameLabel.className = 'body-layers-body-name';
      bodyNameLabel.style.left = `${(bodyGeometry.cx / GEOMETRY.width) * 100}%`;
      bodyNameLabel.style.top = `${((cy + GEOMETRY.maxOuterRadiusPx + 22) / height) * 100}%`;
    }
    bodyNameLabel.textContent = bodyGeometry.label;
    wrap.appendChild(bodyNameLabel);

    const leaders = svgEl('g', { stroke: '#8a97a5', 'stroke-width': 1, 'stroke-dasharray': '3 2', 'pointer-events': 'none' }, svg);
    const rows = RingDiagramLabels.layoutRingColumn({
      cx: bodyGeometry.cx,
      cy,
      outerRadius: GEOMETRY.labelOuterRadius,
      width: GEOMETRY.width,
      height,
      labelX: bodyGeometry.labelX,
      layers: layers.map((layer) => ({ name: layer.name, radius: layer.radiusPx })),
    });
    rows.forEach((row) => {
      svgEl('line', { x1: row.dotX, y1: row.dotY, x2: row.labelX, y2: row.labelY }, leaders);
      svgEl('circle', { cx: row.dotX, cy: row.dotY, r: 3, fill: '#8a97a5' }, leaders);

      const label = document.createElement('span');
      label.className = 'body-layers-label';
      label.textContent = row.name;
      label.style.left = `${row.leftPercent}%`;
      label.style.top = `${row.topPercent}%`;
      wrap.appendChild(label);
    });
  }

  // Same-scale only: the real Moon reads as a dot at this size ratio, so
  // a second copy — the Moon's own proportions (computeLayersPx's
  // "sameSize" case) drawn at Earth's own width — sits directly below
  // it, joined by two thin lines from the real circle's own left/right
  // edge to the magnified one's, so the "this tiny dot, blown up, looks
  // like this" relationship reads directly off the picture.
  function drawMagnifiedInset(svg, wrap, specDiameterKm, RingDiagramLabels) {
    const trueMoonR = outerRadiusPx('moon', 'sameScale', GEOMETRY.maxOuterRadiusPx, specDiameterKm);
    const { cx } = GEOMETRY.moon;
    const cy = GEOMETRY.cy;
    const insetCy = GEOMETRY.insetCy;
    const insetR = GEOMETRY.maxOuterRadiusPx;

    const joins = svgEl('g', { stroke: '#8a97a5', 'stroke-width': 1, 'pointer-events': 'none' }, svg);
    svgEl('line', { x1: cx - trueMoonR, y1: cy, x2: cx - insetR, y2: insetCy }, joins);
    svgEl('line', { x1: cx + trueMoonR, y1: cy, x2: cx + insetR, y2: insetCy }, joins);

    const insetGeometry = {
      key: 'moon', label: magnifiedMoonLabel(specDiameterKm), cx, labelX: GEOMETRY.moon.labelX,
      nameLeft: { x: cx - insetR - 14, y: insetCy },
    };
    drawOneBody(svg, wrap, insetGeometry, 'sameSize', specDiameterKm, RingDiagramLabels, insetCy, GEOMETRY.sameScaleHeight);
  }

  const ARIA_LABEL = {
    sameSize: "Earth and the Moon's internal layers compared side by side, each drawn the same width, as a labelled cutaway of its crust, mantle, outer core and inner core",
    sameScale:
      "Earth and the Moon's internal layers compared side by side, to the same scale, so the Moon reads as a much smaller circle — with a second, magnified copy of the Moon below it, drawn at Earth's own width and joined to the small circle by two lines, so its own crust, mantle, outer core and inner core can still be read",
  };

  // Renders the comparison into an existing empty <svg>/wrap pair and
  // wires the two view-toggle buttons and the caption element, all
  // found by id. `deps` injects RingDiagramLabels and SpecData (window
  // globals on every real page, passed explicitly here so this stays
  // testable without a DOM — see test/bodyLayersDiagram.test.js).
  function mount({ svgId, wrapId, sameScaleButtonId, sameSizeButtonId, captionId }, deps) {
    const svg = document.getElementById(svgId);
    const wrap = document.getElementById(wrapId);
    const sameScaleButton = document.getElementById(sameScaleButtonId);
    const sameSizeButton = document.getElementById(sameSizeButtonId);
    const caption = document.getElementById(captionId);
    if (!svg || !wrap) return;

    const specDiameterKm = deps.SpecData.CONSTANTS.meanDiameterKm;
    const RingDiagramLabels = deps.RingDiagramLabels;

    function render(mode) {
      const height = mode === 'sameScale' ? GEOMETRY.sameScaleHeight : GEOMETRY.height;
      svg.setAttribute('viewBox', `0 0 ${GEOMETRY.width} ${height}`);
      svg.setAttribute('height', height);
      svg.setAttribute('aria-label', ARIA_LABEL[mode]);
      svg.innerHTML = '';
      wrap.querySelectorAll('.body-layers-label, .body-layers-body-name').forEach((el) => el.remove());
      drawOneBody(svg, wrap, GEOMETRY.earth, mode, specDiameterKm, RingDiagramLabels, GEOMETRY.cy, height);
      drawOneBody(svg, wrap, GEOMETRY.moon, mode, specDiameterKm, RingDiagramLabels, GEOMETRY.cy, height);
      if (mode === 'sameScale') drawMagnifiedInset(svg, wrap, specDiameterKm, RingDiagramLabels);
      if (caption) caption.textContent = mode === 'sameScale' ? sameScaleCaption(specDiameterKm) : sameSizeCaption();
      if (sameScaleButton) sameScaleButton.setAttribute('aria-pressed', String(mode === 'sameScale'));
      if (sameSizeButton) sameSizeButton.setAttribute('aria-pressed', String(mode === 'sameSize'));
    }

    if (sameScaleButton) sameScaleButton.addEventListener('click', () => render('sameScale'));
    if (sameSizeButton) sameSizeButton.addEventListener('click', () => render('sameSize'));

    render('sameSize');
  }

  // --- "Share of the radius": two horizontal stacked bars --------------

  // Below this segment width (viewBox units), its own percentage label
  // can't fit inside it (Earth's crust is well under 1% of its radius —
  // a sliver a few pixels wide even in a 1,000-unit-wide bar), so that
  // label goes outside instead, under a short leader line down to the
  // segment's own centre, rather than overlapping its neighbours.
  const SHARE_CHART = {
    width: 1120,
    height: 280,
    barX: 120,
    barWidth: 1000,
    barHeight: 56,
    inlineLabelMinWidth: 70,
    rows: [
      { key: 'earth', label: 'Earth', y: 40 },
      { key: 'moon', label: 'Moon', y: 170 },
    ],
  };

  // Pale fills (inner core) need dark text; the rest read better in
  // white. Crust is never wide enough to go inline in practice (both
  // bodies' crusts are under the inline threshold above), so it has no
  // entry here — addShareLabel falls back to dark for any layer this
  // table doesn't name.
  const SHARE_INLINE_LABEL_COLOR = { mantle: '#ffffff', outerCore: '#ffffff' };

  function addShareLabel(wrap, x, y, text, extraClass) {
    const el = document.createElement('span');
    el.className = `body-layers-share-label${extraClass ? ` ${extraClass}` : ''}`;
    el.style.left = `${(x / SHARE_CHART.width) * 100}%`;
    el.style.top = `${(y / SHARE_CHART.height) * 100}%`;
    el.textContent = text;
    wrap.appendChild(el);
    return el;
  }

  // Renders the "Share of the radius" bars into an existing empty
  // <svg>/wrap pair, found by id. Unlike mount() above, this chart
  // doesn't change with the Same scale/Same size toggle — a share of
  // the radius is the same number either way — so it draws once and is
  // never re-rendered.
  function mountShareChart(svgId, wrapId) {
    const svg = document.getElementById(svgId);
    const wrap = document.getElementById(wrapId);
    if (!svg || !wrap) return;
    const { width, height, barX, barWidth, barHeight, inlineLabelMinWidth, rows } = SHARE_CHART;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.innerHTML = '';
    wrap.querySelectorAll('.body-layers-share-label').forEach((el) => el.remove());

    rows.forEach((row) => {
      const shares = layerShareFractions(row.key);
      let x = barX;
      LAYER_STYLE.forEach((style) => {
        const share = shares[style.key];
        const segmentWidth = share * barWidth;
        svgEl('rect', {
          x, y: row.y, width: segmentWidth, height: barHeight,
          fill: style.fill, stroke: '#ffffff', 'stroke-width': 1,
        }, svg);

        const text = formatSharePercent(share);
        const segmentCx = x + segmentWidth / 2;
        if (segmentWidth >= inlineLabelMinWidth) {
          const inlineLabel = addShareLabel(wrap, segmentCx, row.y + barHeight / 2, text, 'body-layers-share-label--inline');
          inlineLabel.style.color = SHARE_INLINE_LABEL_COLOR[style.key] || '#1a1a1a';
        } else {
          const leaderY1 = row.y + barHeight;
          const leaderY2 = leaderY1 + 14;
          svgEl('line', { x1: segmentCx, y1: leaderY1, x2: segmentCx, y2: leaderY2, stroke: '#8a97a5', 'stroke-width': 1 }, svg);
          addShareLabel(wrap, segmentCx, leaderY2 + 10, text, 'body-layers-share-label--outside');
        }
        x += segmentWidth;
      });
      addShareLabel(wrap, 10, row.y + barHeight / 2, row.label, 'body-layers-share-row-label');
    });
  }

  const api = {
    BODY_LAYERS_KM, LAYER_STYLE, GEOMETRY, SHARE_CHART,
    layerFractions, layerShareFractions, formatSharePercent,
    outerRadiusPx, computeLayersPx,
    sameScaleMagnification, magnifiedMoonLabel,
    sameScaleCaption, sameSizeCaption,
    mount, mountShareChart,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.BodyLayersDiagram = api;
  }
})();
