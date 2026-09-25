/**
 * "Next page" link, shown at the bottom of every sims/ and notes/
 * page (never index.html itself), following Pages.RECOMMENDED_PATH —
 * the same sequence index.html's own "Recommended path" section
 * renders. Never hand-written per page: add, remove or reorder a step
 * there and every page's link follows automatically.
 *
 * Renders into #next-page, expected to be the last element in <main>,
 * right after #coverage. On the path's last page there's nothing to
 * link on to, so it says so instead and points back at index.html.
 *
 * Requires src/pages.js (for Pages.RECOMMENDED_PATH and Pages.PAGES)
 * loaded first; load this script itself last. The pure lookup below
 * is exported for Node so it's unit-testable without a DOM/location;
 * only init() touches the page.
 */
(function () {
  function flattenPath(recommendedPath) {
    return recommendedPath.flatMap((phase) => phase.steps);
  }

  /**
   * Given the current page's href (repo-root-relative, e.g.
   * "sims/coordinates.html") and the site's RECOMMENDED_PATH/PAGES
   * data, returns { done: false, next: <PAGES entry> } for the page
   * one step on, { done: true } on the path's last page, or null if
   * currentHref isn't on the path at all.
   */
  function resolveNextStep(currentHref, recommendedPath, pages) {
    const steps = flattenPath(recommendedPath);
    const index = steps.findIndex((step) => step.href === currentHref);
    if (index === -1) return null;
    if (index === steps.length - 1) return { done: true };
    const next = pages.find((page) => page.href === steps[index + 1].href);
    return next ? { done: false, next } : null;
  }

  // Every registered page lives exactly one directory below the repo
  // root (sims/<file> or notes/<file>), so matching the last two path
  // segments identifies the current page regardless of how the site
  // is hosted, and a page.href always needs exactly one "../" to
  // resolve back to repo-root-relative from here.
  function currentHrefFromLocation() {
    const segments = window.location.pathname.split('/').filter(Boolean);
    return segments.slice(-2).join('/');
  }

  function init() {
    const container = document.getElementById('next-page');
    if (!container || typeof Pages === 'undefined') return;

    const result = resolveNextStep(currentHrefFromLocation(), Pages.RECOMMENDED_PATH, Pages.PAGES);
    if (!result) return;

    container.textContent = '';

    if (result.done) {
      container.appendChild(document.createTextNode("That's the last page on the recommended path — back to "));
      const link = document.createElement('a');
      link.href = '../index.html';
      link.textContent = 'all pages';
      container.appendChild(link);
      container.appendChild(document.createTextNode('.'));
      return;
    }

    container.appendChild(document.createTextNode('Next on the recommended path: '));
    const link = document.createElement('a');
    link.href = `../${result.next.href}`;
    link.textContent = result.next.title;
    container.appendChild(link);
    container.appendChild(document.createTextNode(' →'));
  }

  const api = { resolveNextStep };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.NextPage = api;
    init();
  }
})();
