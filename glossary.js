/**
 * Shared tap-to-reveal glossary mechanism, used by every page that has
 * `.glossary-toggle` buttons next to a term (sliders, readouts, prose).
 * Every toggle is a real <button>, so a tap fires the same 'click' event
 * a mouse click would — no separate touch handling needed, and nothing
 * here relies on :hover.
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
      button.addEventListener('click', () => {
        const isOpen = !definition.hidden;
        definition.hidden = isOpen;
        button.setAttribute('aria-expanded', String(!isOpen));
      });
    });
  }

  window.Glossary = { init };
})();
