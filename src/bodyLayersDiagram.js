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
  function sameScaleCaption(specDiameterKm) {
    const ratio = specDiameterKm.earth / specDiameterKm.moon;
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

  // --- Browser-only: the actual drawing -----------------------------------

  const GEOMETRY = {
    width: 1200,
    height: 580,
    cy: 290,
    maxOuterRadiusPx: 150,
    earth: { key: 'earth', label: 'Earth', cx: 220, labelX: 394 },
    moon: { key: 'moon', label: 'Moon', cx: 794, labelX: 968 },
  };

  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (parent) parent.appendChild(el);
    return el;
  }

  function drawOneBody(svg, wrap, bodyGeometry, mode, specDiameterKm, RingDiagramLabels) {
    const layers = computeLayersPx(bodyGeometry.key, mode, GEOMETRY.maxOuterRadiusPx, specDiameterKm);

    // Outermost first, so each smaller ring paints over the last.
    layers.forEach((layer) => {
      const attrs = { cx: bodyGeometry.cx, cy: GEOMETRY.cy, r: layer.radiusPx, fill: layer.fill };
      if (layer.stroke) {
        attrs.stroke = layer.stroke;
        attrs['stroke-width'] = 2;
      }
      svgEl('circle', attrs, svg);
    });

    const bodyNameLabel = document.createElement('span');
    bodyNameLabel.className = 'body-layers-body-name';
    bodyNameLabel.textContent = bodyGeometry.label;
    bodyNameLabel.style.left = `${(bodyGeometry.cx / GEOMETRY.width) * 100}%`;
    bodyNameLabel.style.top = `${((GEOMETRY.cy + GEOMETRY.maxOuterRadiusPx + 22) / GEOMETRY.height) * 100}%`;
    wrap.appendChild(bodyNameLabel);

    const leaders = svgEl('g', { stroke: '#8a97a5', 'stroke-width': 1, 'stroke-dasharray': '3 2', 'pointer-events': 'none' }, svg);
    const rows = RingDiagramLabels.layoutRingColumn({
      cx: bodyGeometry.cx,
      cy: GEOMETRY.cy,
      outerRadius: GEOMETRY.maxOuterRadiusPx,
      width: GEOMETRY.width,
      height: GEOMETRY.height,
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
      svg.innerHTML = '';
      wrap.querySelectorAll('.body-layers-label, .body-layers-body-name').forEach((el) => el.remove());
      drawOneBody(svg, wrap, GEOMETRY.earth, mode, specDiameterKm, RingDiagramLabels);
      drawOneBody(svg, wrap, GEOMETRY.moon, mode, specDiameterKm, RingDiagramLabels);
      if (caption) caption.textContent = mode === 'sameScale' ? sameScaleCaption(specDiameterKm) : sameSizeCaption();
      if (sameScaleButton) sameScaleButton.setAttribute('aria-pressed', String(mode === 'sameScale'));
      if (sameSizeButton) sameSizeButton.setAttribute('aria-pressed', String(mode === 'sameSize'));
    }

    if (sameScaleButton) sameScaleButton.addEventListener('click', () => render('sameScale'));
    if (sameSizeButton) sameSizeButton.addEventListener('click', () => render('sameSize'));

    render('sameScale');
  }

  const api = {
    BODY_LAYERS_KM, LAYER_STYLE, GEOMETRY,
    layerFractions, outerRadiusPx, computeLayersPx,
    sameScaleCaption, sameSizeCaption,
    mount,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.BodyLayersDiagram = api;
  }
})();
