/**
 * Gives every diagram on a notes/sims page a small "Enlarge" button in
 * its corner, so a student on a phone can see detail a cramped inline
 * diagram can't show. Self-running: load this script last on any page
 * (after that page's own diagram-drawing script, so every diagram
 * already exists) and it finds and wires up every match itself — no
 * per-page call, same convention as notesPage.js/nextPage.js.
 *
 * What counts as "a diagram": anything matching .diagram,
 * .labelled-diagram-wrap or .question-diagram (the picture-quiz
 * pictures quiz-ui.js's renderQuestions() draws for a "name that
 * feature/line/pattern" question) — deduplicated so a
 * .labelled-diagram-wrap nested inside a .diagram (the usual shape)
 * only gets ONE button, on the outer .diagram, not two.
 *
 * Pressing the button, or tapping anywhere on the diagram that isn't
 * itself an interactive control (a link, button, glossary toggle,
 * clickable diagram region, or a <canvas> — see INTERACTIVE_SELECTOR),
 * opens it in a full-screen <dialog>, scaled up as large as the screen
 * allows. Closes via its own Close button, Escape (native <dialog>
 * behaviour once open via showModal()) or a tap on the backdrop
 * outside it.
 *
 * The enlarged view is the REAL diagram element, moved into the dialog
 * (not cloned, not a static snapshot) and moved back to its exact
 * original place when closed. This is what keeps an interactive
 * diagram genuinely interactive and in sync while enlarged — it's
 * literally the same DOM node, with every event listener and bit of
 * live state intact, not a copy — rather than a separate mechanism
 * only some diagrams would get. The one real limitation: a diagram
 * driven by slider/checkbox controls that sit OUTSIDE the diagram
 * container (most of this site's sims) can't be adjusted while the
 * dialog is open, since showModal() makes the rest of the page inert —
 * the enlarged view still shows the real, current, correct state
 * (never stale or a separate snapshot), just not live-adjustable until
 * closed. A <canvas> itself is treated as interactive content, never
 * as "tap the diagram to enlarge it", since several on this site
 * respond to pointerdown/drag directly (see e.g. sims/coordinates.js's
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

  let dialog = null;
  let contentEl = null;
  let activeDiagram = null;
  let originalParent = null;
  let originalNextSibling = null;
  let previouslyFocused = null;

  function restoreDiagram() {
    if (!activeDiagram) return;
    activeDiagram.classList.remove('diagram-enlarge-active');
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
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => dialog.close());

    contentEl = document.createElement('div');
    contentEl.className = 'diagram-enlarge-content';

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

  function openDiagram(diagramEl) {
    if (!dialog) buildDialog();
    previouslyFocused = document.activeElement;
    originalParent = diagramEl.parentNode;
    originalNextSibling = diagramEl.nextSibling;
    activeDiagram = diagramEl;
    diagramEl.classList.add('diagram-enlarge-active');
    contentEl.appendChild(diagramEl);
    dialog.showModal();
  }

  function isInteractiveTarget(target, container) {
    if (!(target instanceof Element)) return false;
    const el = target.closest(INTERACTIVE_SELECTOR);
    return el !== null && container.contains(el);
  }

  function addEnlargeButton(container) {
    if (container.querySelector(':scope > .diagram-enlarge-button')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'diagram-enlarge-button';
    button.textContent = 'Enlarge';
    button.setAttribute('aria-label', 'Enlarge diagram');
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

  // A .labelled-diagram-wrap nested inside a .diagram (the normal
  // shape) shouldn't also get its own, separate button — one button
  // per visual diagram, on the outermost match.
  function collectDiagramContainers() {
    const containers = new Set();
    document.querySelectorAll('.diagram').forEach((el) => containers.add(el));
    document.querySelectorAll('.labelled-diagram-wrap').forEach((el) => {
      if (!el.closest('.diagram')) containers.add(el);
    });
    document.querySelectorAll('.question-diagram').forEach((el) => containers.add(el));
    return [...containers];
  }

  function init() {
    collectDiagramContainers().forEach(addEnlargeButton);
  }

  window.DiagramEnlarge = { init };
  init();
})();
