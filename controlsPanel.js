/**
 * On a phone, the sims' controls panel is pinned to the bottom of the
 * screen so a slider stays in reach. On a short screen that pinned panel
 * would sit on top of the page's central diagram, so on narrow screens:
 *
 * - if the panel would cover the central diagram when the page opens, it
 *   starts closed, with a "Show controls" button right under the diagram;
 * - opened, the panel's height is capped so the diagram and the panel fit
 *   on screen together, and the page scrolls the diagram to the top;
 * - a "Hide controls" button at the top of the panel closes it again.
 *
 * Wide screens keep the controls as a sidebar, with neither button shown.
 */
(function () {
  const NARROW = window.matchMedia('(max-width: 899px)');
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN_PANEL_PX = 160;
  const GAP_PX = 16;

  /** The first sizeable drawing in the layout's diagrams column. */
  function centralDiagram(layout) {
    return [...layout.querySelectorAll('.diagrams-column canvas, .diagrams-column svg')].find((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 100 && r.height > 100;
    });
  }

  function overlap(a, b) {
    const top = Math.max(a.top, b.top, 0);
    const bottom = Math.min(a.bottom, b.bottom, window.innerHeight);
    return Math.max(0, bottom - top) * (Math.min(a.right, b.right) > Math.max(a.left, b.left) ? 1 : 0);
  }

  function init(layout, index) {
    const panel = layout.querySelector(':scope > .controls');
    const diagram = centralDiagram(layout);
    if (!panel || !diagram) return;
    if (!panel.id) panel.id = `controls-panel-${index + 1}`;

    const hide = document.createElement('button');
    hide.type = 'button';
    hide.className = 'controls-toggle-button controls-hide-button';
    hide.textContent = 'Hide controls ▾';
    hide.setAttribute('aria-controls', panel.id);
    hide.setAttribute('aria-expanded', 'true');
    panel.prepend(hide);

    const show = document.createElement('button');
    show.type = 'button';
    show.className = 'controls-toggle-button controls-show-button';
    show.textContent = 'Show controls ▴';
    show.setAttribute('aria-controls', panel.id);
    show.setAttribute('aria-expanded', 'false');
    show.hidden = true;
    const anchor = diagram.closest('.diagram, .labelled-diagram-wrap, .eot-graph-section') || diagram;
    anchor.insertAdjacentElement('afterend', show);

    function capHeight() {
      if (!NARROW.matches) {
        panel.style.maxHeight = '';
        return;
      }
      const vh = window.innerHeight;
      const diagramHeight = diagram.getBoundingClientRect().height;
      // The diagram is scrolled to 8px from the top when the panel opens.
      const cap = Math.max(MIN_PANEL_PX, Math.min(0.45 * vh, vh - 8 - diagramHeight - GAP_PX));
      panel.style.maxHeight = `${Math.round(cap)}px`;
    }

    function setCollapsed(collapsed) {
      panel.classList.toggle('controls-collapsed', collapsed);
      show.hidden = !collapsed;
      hide.setAttribute('aria-expanded', String(!collapsed));
      show.setAttribute('aria-expanded', String(!collapsed));
      layout.dataset.controls = collapsed ? 'collapsed' : 'open';
    }

    show.addEventListener('click', () => {
      setCollapsed(false);
      capHeight();
      const top = diagram.getBoundingClientRect().top + window.scrollY - 8;
      window.scrollTo({ top, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
    });
    hide.addEventListener('click', () => {
      setCollapsed(true);
      show.focus({ preventScroll: true });
    });

    function decide() {
      if (!NARROW.matches) {
        setCollapsed(false);
        capHeight();
        return;
      }
      setCollapsed(false);
      capHeight();
      // Starts closed if, open, it would sit on top of the central diagram.
      if (overlap(panel.getBoundingClientRect(), diagram.getBoundingClientRect()) > 0) setCollapsed(true);
    }

    decide();
    NARROW.addEventListener('change', decide);
    window.addEventListener('resize', capHeight);
  }

  function start() {
    document.querySelectorAll('.tool-layout').forEach(init);
  }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
