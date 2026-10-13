/**
 * Shared tap-to-reveal glossary mechanism, used by every page that has
 * `.glossary-toggle` elements next to a term (sliders, readouts, prose,
 * and — for sun-declination.html's interactive Sun-structure diagram —
 * clickable SVG shapes). A real <button> gets a tap/click for free and
 * already fires 'click' on Enter/Space itself; an SVG shape has neither,
 * so it's given tabindex/role="button" in its markup and this also
 * listens for Enter/Space on any non-<button> toggle, calling the exact
 * same toggle logic a click would. That check matters: attaching the
 * same keydown handling to a real <button> too would double-fire it,
 * since the browser already synthesises a 'click' there.
 *
 * Call Glossary.init(definitions) once per page with a plain
 * { term: 'one-sentence definition' } object. A .glossary-toggle whose
 * term is missing from that object still gets its click-to-toggle
 * handler wired up — its definition text is just left alone, for a term
 * whose wording depends on live page state rather than being fixed
 * (e.g. coordinates.html's NCP/SCP "pole" term, which the page itself
 * keeps current on every redraw).
 *
 * Idempotent per toggle: init marks every toggle it wires with
 * WIRED_ATTRIBUTE, and skips any toggle that already carries it — so
 * calling init again (a second Glossary.init on the page, or a page
 * script re-running it after changing the dict) never attaches a second
 * click handler to the same toggle. A page that wires some toggles
 * itself (e.g. notes/solar-system-bodies.js's sortable table, whose
 * per-body toggles are recreated on every sort rather than going through
 * init at all) sets the same attribute itself, via Glossary.WIRED_ATTRIBUTE,
 * so init still leaves those alone.
 */
(function () {
  const WIRED_ATTRIBUTE = 'data-glossary-wired';

  function init(definitions) {
    const dict = definitions || {};
    document.querySelectorAll('.glossary-toggle').forEach((button) => {
      if (button.hasAttribute(WIRED_ATTRIBUTE)) return;
      const term = button.dataset.term;
      const definition = document.querySelector(`.glossary-definition[data-term="${term}"]`);
      if (!definition) return;
      if (dict[term]) {
        definition.textContent = dict[term];
      }

      function toggle() {
        const isOpen = !definition.hidden;
        definition.hidden = isOpen;
        button.setAttribute('aria-expanded', String(!isOpen));
      }

      button.addEventListener('click', toggle);
      if (button.tagName.toLowerCase() !== 'button') {
        button.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggle();
          }
        });
      }
      button.setAttribute(WIRED_ATTRIBUTE, 'true');
    });
  }

  window.Glossary = { init, WIRED_ATTRIBUTE };
})();
