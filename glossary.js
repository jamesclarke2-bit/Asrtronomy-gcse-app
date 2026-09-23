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
 */
(function () {
  function init(definitions) {
    const dict = definitions || {};
    document.querySelectorAll('.glossary-toggle').forEach((button) => {
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
    });
  }

  window.Glossary = { init };
})();
