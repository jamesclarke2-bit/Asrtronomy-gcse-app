/**
 * Shared behaviour for notes/ pages built to notes/TEMPLATE.md.
 *
 * Adds an "On this page" table of contents after the page's
 * .subtitle, generated from the h2 of every section.notes-section[id],
 * but only when the page is long enough to need one: at least
 * TOC_WORD_THRESHOLD words of text in <main>. Nothing on the page has
 * to be kept in sync by hand; add or rename a section and the contents
 * follow.
 *
 * Load it as the last script on the page, after the page's own script,
 * so any content that script generates is counted too. Pure helpers are
 * exported for Node so the rule can be unit-tested without a DOM.
 */
(function () {
  const TOC_WORD_THRESHOLD = 800;

  function countWords(text) {
    return text.split(/\s+/).filter(Boolean).length;
  }

  function shouldShowToc(wordCount) {
    return wordCount >= TOC_WORD_THRESHOLD;
  }

  function buildToc(main) {
    const sections = [...main.querySelectorAll('section.notes-section[id]')]
      .map((section) => ({ id: section.id, heading: section.querySelector('h2') }))
      .filter((entry) => entry.heading);
    if (sections.length === 0) return null;

    const nav = document.createElement('nav');
    nav.className = 'notes-toc';
    nav.setAttribute('aria-labelledby', 'notes-toc-heading');

    const heading = document.createElement('h2');
    heading.id = 'notes-toc-heading';
    heading.textContent = 'On this page';
    nav.appendChild(heading);

    const list = document.createElement('ol');
    list.className = 'tip-list';
    sections.forEach(({ id, heading: h2 }) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${id}`;
      link.textContent = h2.textContent.trim();
      item.appendChild(link);
      list.appendChild(item);
    });
    nav.appendChild(list);
    return nav;
  }

  function init() {
    const main = document.querySelector('main');
    const subtitle = main && main.querySelector('.subtitle');
    if (!subtitle || !shouldShowToc(countWords(main.innerText))) return;
    const toc = buildToc(main);
    if (toc) subtitle.insertAdjacentElement('afterend', toc);
  }

  const api = { TOC_WORD_THRESHOLD, countWords, shouldShowToc };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.NotesPage = api;
    init();
  }
})();
