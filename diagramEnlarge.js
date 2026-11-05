/**
 * Gives every diagram on a notes/sims page a small "Enlarge" button in
 * its corner, so a student on a phone can see detail a cramped inline
 * diagram can't show. Self-running: load this script last on any page
 * (after that page's own diagram-drawing script, so every diagram
 * already exists) and it finds and wires up every match itself — no
 * per-page call, same convention as notesPage.js/nextPage.js.
 *
 * What counts as "a diagram": anything matching .diagram, .question-diagram
 * (the picture-quiz pictures quiz-ui.js's renderQuestions() draws for a
 * "name that feature/line/pattern" question) or a standalone
 * .labelled-diagram-wrap not already inside one of those — deduplicated so
 * nesting (a .labelled-diagram-wrap inside a .diagram or .question-diagram,
 * the usual shape) only gets ONE button, on the outer container.
 *
 * A .diagram-row made of two or more small, non-interactive .diagram
 * pictures that belong together (no <canvas> anywhere in it — an
 * interactive sim panel is never one of these) is treated as ONE figure:
 * the row itself gets the button, not each small picture inside it, so a
 * composite illustration like a row of eclipse-type icons reads as one
 * thing. A row holding an interactive <canvas> sim keeps each panel's own
 * button, since those are genuinely separate, not one picture split up.
 *
 * Pressing the button, or tapping anywhere on the diagram that isn't
 * itself an interactive control (a link, button, glossary toggle,
 * clickable diagram region, or a <canvas> — see INTERACTIVE_SELECTOR),
 * opens it in a full-screen <dialog>. Closes via its own Close button,
 * Escape (native <dialog> behaviour once open via showModal()) or a tap
 * on the backdrop outside it.
 *
 * Sizing: the enlarged copy is scaled up to fill as much of the screen as
 * it can while staying entirely on it — at most 94% of the viewport's
 * width and 88% of its height, preserving its own aspect ratio, and never
 * bigger than that even on a small phone (see MAX_WIDTH_FRACTION /
 * MAX_HEIGHT_FRACTION). Where the diagram is a single <svg> with a
 * viewBox, it's also CROPPED to that svg's own drawn content (via
 * getBBox(), plus a small margin) before scaling, so a diagram whose
 * viewBox carries a lot of blank space around the actual picture doesn't
 * just get a bigger blank margin — it gets a bigger picture. This crop
 * is applied as a CSS transform (translate + scale) on the diagram's own
 * container, not by touching the svg's viewBox or any child's own size,
 * so any absolutely-positioned overlay inside it (e.g. a moon map's
 * tap-to-reveal .diagram-region dots) is carried along in perfect sync —
 * it's the same already-correctly-laid-out subtree, just magnified. A
 * diagram that's a group of several svgs (a grouped .diagram-row) or
 * contains a <canvas> is only fit-to-screen, not cropped, for the same
 * reason: cropping only one child wouldn't make sense for either.
 *
 * A diagram that would gain little from enlarging — because it's already
 * at or above the available screen size, or scaling it up wouldn't make
 * it meaningfully bigger — doesn't get a button at all (see
 * MIN_WORTHWHILE_SCALE). A diagram inside an unopened reveal panel can't
 * be measured yet, so it defaults to getting the button rather than
 * guessing wrong; nothing re-checks it once the panel opens, since that
 * would need to track every reveal mechanism site-wide and the cost of
 * guessing wrong here is only an occasionally-unnecessary button, not a
 * missing one.
 *
 * The enlarged view is the REAL diagram element, moved into the dialog
 * (not cloned, not a static snapshot) and moved back to its exact
 * original place when closed. This is what keeps an interactive diagram
 * genuinely interactive and in sync while enlarged — it's literally the
 * same DOM node, with every event listener and bit of live state intact,
 * not a copy. The one real limitation: a diagram driven by slider/
 * checkbox controls that sit OUTSIDE the diagram container (most of this
 * site's sims) can't be adjusted while the dialog is open, since
 * showModal() makes the rest of the page inert — the enlarged view still
 * shows the real, current, correct state, just not live-adjustable until
 * closed. A <canvas> itself is treated as interactive content, never as
 * "tap the diagram to enlarge it", since several on this site respond to
 * pointerdown/drag directly (see e.g. sims/coordinates.js's
 * diurnalCanvas) — only its own dedicated button opens those.
 */
(function () {
  const INTERACTIVE_SELECTOR = [
    'a',
    'button',
    'input',
    'select',
    'textarea',
    '[role="button"]',
    '[tabindex]',
    'canvas',
    '.glossary-toggle',
    '.diagram-region',
  ].join(', ');

  // How much of the viewport the enlarged copy may fill, and how much
  // bigger enlarging has to make a diagram for the button to be worth
  // having at all.
  const MAX_WIDTH_FRACTION = 0.94;
  const MAX_HEIGHT_FRACTION = 0.88;
  // On a narrow phone, a diagram is often already close to full column
  // width in-page, so even a diagram that's genuinely worth enlarging
  // (cropping its blank margins away, going full-screen with nothing
  // else competing for attention) can compute a scale factor right
  // around 1 — going full-screen with its surrounding page content out
  // of the way is itself worth having, even with little or no
  // magnification. Only skip a diagram the enlarged copy would actually
  // come out SMALLER than, which is where there's truly nothing to gain.
  const MIN_WORTHWHILE_SCALE = 0.97;
  const CROP_MARGIN_FRACTION = 0.04;

  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Builds a small decorative icon from a fixed, hand-authored path —
  // never anything derived from page content — via createElementNS
  // rather than innerHTML.
  function buildIcon(pathD) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2.4');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
    return svg;
  }

  let dialog = null;
  let contentEl = null;
  let cropBox = null;
  let activeDiagram = null;
  let originalParent = null;
  let originalNextSibling = null;
  let previouslyFocused = null;

  function restoreDiagram() {
    if (!activeDiagram) return;
    activeDiagram.classList.remove('diagram-enlarge-active');
    activeDiagram.style.transform = '';
    activeDiagram.style.transformOrigin = '';
    if (originalNextSibling) originalParent.insertBefore(activeDiagram, originalNextSibling);
    else originalParent.appendChild(activeDiagram);
    activeDiagram = null;
    originalParent = null;
    originalNextSibling = null;
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
    previouslyFocused = null;
  }

  function buildDialog() {
    dialog = document.createElement('dialog');
    dialog.className = 'diagram-enlarge-dialog';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'diagram-enlarge-close';
    closeButton.setAttribute('aria-label', 'Close enlarged diagram');
    closeButton.appendChild(buildIcon('M5 5 L19 19 M19 5 L5 19'));
    closeButton.addEventListener('click', () => dialog.close());

    contentEl = document.createElement('div');
    contentEl.className = 'diagram-enlarge-content';

    cropBox = document.createElement('div');
    cropBox.className = 'diagram-enlarge-crop-box';
    contentEl.appendChild(cropBox);

    dialog.append(closeButton, contentEl);
    document.body.appendChild(dialog);

    // Native <dialog> gives Escape-to-close and a focus trap for free
    // once opened via showModal() — this only adds "tap outside to
    // close" (not automatic) and our own reparent-back/focus-return
    // cleanup, via the dialog's own native 'close' event so it fires
    // however the dialog closed (button, Escape, or this).
    dialog.addEventListener('click', (event) => {
      const rect = dialog.getBoundingClientRect();
      const insideDialogBox =
        event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!insideDialogBox) dialog.close();
    });
    dialog.addEventListener('close', restoreDiagram);
  }

  // --- Measuring and fitting -------------------------------------------

  // The tight bounding rect (viewport px) of what an <svg> actually
  // draws, via getBBox() (content bounds, in the svg's own user units)
  // mapped through getScreenCTM() (that element's current user-space ->
  // screen transform) — so this reflects wherever the svg currently is
  // and however it's currently sized, with no guesswork. Returns null if
  // it can't be measured (not currently rendered, or genuinely empty).
  function getSvgContentRect(svg) {
    if (!svg.getBBox || !svg.getScreenCTM) return null;
    let bbox;
    try {
      bbox = svg.getBBox();
    } catch (err) {
      return null;
    }
    if (!bbox || (bbox.width <= 0 && bbox.height <= 0)) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const corner1 = new DOMPoint(bbox.x, bbox.y).matrixTransform(ctm);
    const corner2 = new DOMPoint(bbox.x + bbox.width, bbox.y + bbox.height).matrixTransform(ctm);
    const left = Math.min(corner1.x, corner2.x);
    const top = Math.min(corner1.y, corner2.y);
    return { left, top, width: Math.abs(corner2.x - corner1.x), height: Math.abs(corner2.y - corner1.y) };
  }

  // A container is only cropped to its content when it's simple enough
  // for that to be unambiguous: exactly one <svg>, and no <canvas> (a
  // group of several pictures, or anything with a canvas, is fit to the
  // screen as a whole instead — see the file header). The enlarge
  // button's own icon is an <svg> too, appended into this same
  // container — it never counts as part of "the diagram".
  function findSingleSvg(container) {
    if (container.querySelector('canvas')) return null;
    const svgs = [...container.querySelectorAll('svg')].filter((svg) => !svg.closest('.diagram-enlarge-button'));
    return svgs.length === 1 ? svgs[0] : null;
  }

  // getBBox() only sees what the svg itself draws — a diagram whose
  // labels are HTML overlaid on top of it (e.g. the Share of the radius
  // bars' "Earth"/"Moon" row labels, or a moon map's tap-to-reveal
  // .diagram-region dots), the usual .labelled-diagram-wrap shape, would
  // otherwise get cropped as if those labels didn't exist. Widen the
  // svg's own content rect to also cover every such overlay sibling.
  function getSvgContentRectWithOverlays(svg) {
    const svgRect = getSvgContentRect(svg);
    if (!svgRect) return null;
    const wrap = svg.parentElement;
    if (!wrap || !wrap.classList.contains('labelled-diagram-wrap')) return svgRect;
    let { left, top } = svgRect;
    let right = left + svgRect.width;
    let bottom = top + svgRect.height;
    [...wrap.children].forEach((child) => {
      if (child === svg || child.classList.contains('diagram-enlarge-button')) return;
      const r = child.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      left = Math.min(left, r.left);
      top = Math.min(top, r.top);
      right = Math.max(right, r.left + r.width);
      bottom = Math.max(bottom, r.top + r.height);
    });
    return { left, top, width: right - left, height: bottom - top };
  }

  // The region (in px, relative to container's own top-left corner) to
  // crop in on — the content bbox plus a small margin, or, when there's
  // no safe single-svg content bbox to use, the container's own full
  // rendered rect as-is (no cropping, just later scaled to fit the
  // screen — the margin below is only for an actual crop; adding it to
  // an already-tight container rect would only understate how much
  // enlarging it is worth).
  function computeCropRect(container) {
    const containerRect = container.getBoundingClientRect();
    if (containerRect.width <= 0 || containerRect.height <= 0) return null;
    const svg = findSingleSvg(container);
    const contentRect = svg && getSvgContentRectWithOverlays(svg);
    if (!contentRect) {
      return { left: 0, top: 0, width: containerRect.width, height: containerRect.height };
    }
    if (contentRect.width <= 0 || contentRect.height <= 0) return null;
    const marginX = contentRect.width * CROP_MARGIN_FRACTION;
    const marginY = contentRect.height * CROP_MARGIN_FRACTION;
    return {
      left: contentRect.left - containerRect.left - marginX,
      top: contentRect.top - containerRect.top - marginY,
      width: contentRect.width + marginX * 2,
      height: contentRect.height + marginY * 2,
    };
  }

  // The crop rect plus the scale factor that fits it inside
  // MAX_WIDTH_FRACTION / MAX_HEIGHT_FRACTION of the current viewport,
  // preserving its aspect ratio — or null if the container isn't
  // currently measurable (e.g. inside an unopened reveal panel).
  function computeFit(container) {
    const crop = computeCropRect(container);
    if (!crop) return null;
    const availableWidth = window.innerWidth * MAX_WIDTH_FRACTION;
    const availableHeight = window.innerHeight * MAX_HEIGHT_FRACTION;
    const scale = Math.min(availableWidth / crop.width, availableHeight / crop.height);
    return { crop, scale };
  }

  function isCurrentlyVisible(container) {
    return container.getClientRects().length > 0;
  }

  // Would enlarging this diagram make a real difference? A diagram inside
  // a not-yet-opened reveal panel can't be measured, so it defaults to
  // "yes" rather than guessing — see the file header.
  function isWorthEnlarging(container) {
    if (!isCurrentlyVisible(container)) return true;
    const fit = computeFit(container);
    return !fit || fit.scale >= MIN_WORTHWHILE_SCALE;
  }

  function applyFit(container) {
    const fit = computeFit(container);
    if (!fit) return;
    const { crop, scale } = fit;
    cropBox.style.width = crop.width * scale + 'px';
    cropBox.style.height = crop.height * scale + 'px';
    container.style.transformOrigin = '0 0';
    container.style.transform = `translate(${-crop.left * scale}px, ${-crop.top * scale}px) scale(${scale})`;
  }

  // --- Open/close --------------------------------------------------------

  function openDiagram(diagramEl) {
    if (!dialog) buildDialog();
    previouslyFocused = document.activeElement;
    originalParent = diagramEl.parentNode;
    originalNextSibling = diagramEl.nextSibling;
    activeDiagram = diagramEl;
    diagramEl.classList.add('diagram-enlarge-active');
    cropBox.appendChild(diagramEl);
    // The dialog has to actually be open (showModal(), not just in the
    // DOM) before applyFit's measurements mean anything — an unopened
    // <dialog> isn't rendered at all, so everything inside it reads as
    // zero-sized until then.
    dialog.showModal();
    applyFit(diagramEl);
  }

  function isInteractiveTarget(target, container) {
    if (!(target instanceof Element)) return false;
    const el = target.closest(INTERACTIVE_SELECTOR);
    return el !== null && container.contains(el);
  }

  function addEnlargeButton(container) {
    if (container.querySelector(':scope > .diagram-enlarge-button')) return;
    if (!isWorthEnlarging(container)) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'diagram-enlarge-button';
    button.setAttribute('aria-label', 'Enlarge diagram');
    button.appendChild(buildIcon('M4 9V4h5 M15 4h5v5 M20 15v5h-5 M9 20H4v-5'));
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      openDiagram(container);
    });

    container.classList.add('diagram-enlarge-source');
    container.appendChild(button);

    container.addEventListener('click', (event) => {
      if (isInteractiveTarget(event.target, container)) return;
      openDiagram(container);
    });
  }

  // A .diagram-row of two or more small, non-interactive pictures reads
  // as one figure (see the file header) — group it into a single
  // container instead of collecting its .diagram children separately.
  function rowIsGroupable(row) {
    const diagrams = row.querySelectorAll(':scope > .diagram');
    if (diagrams.length < 2) return false;
    return ![...diagrams].some((d) => d.querySelector('canvas'));
  }

  function collectDiagramContainers() {
    const containers = new Set();
    const groupedRows = new Set();

    document.querySelectorAll('.diagram-row').forEach((row) => {
      if (rowIsGroupable(row)) {
        containers.add(row);
        groupedRows.add(row);
      }
    });

    document.querySelectorAll('.diagram').forEach((el) => {
      const row = el.closest('.diagram-row');
      if (row && groupedRows.has(row)) return;
      containers.add(el);
    });

    document.querySelectorAll('.question-diagram').forEach((el) => containers.add(el));

    // A .labelled-diagram-wrap nested inside a .diagram or a
    // .question-diagram (both normal shapes) shouldn't also get its own,
    // separate button — one button per visual diagram, on the outermost
    // match.
    document.querySelectorAll('.labelled-diagram-wrap').forEach((el) => {
      if (!el.closest('.diagram, .question-diagram')) containers.add(el);
    });

    return [...containers];
  }

  function init() {
    collectDiagramContainers().forEach(addEnlargeButton);
  }

  window.DiagramEnlarge = { init };
  init();
})();
