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
 * This same script also appends one small site-footer line after
 * #next-page, on every page that loads it, linking to
 * notes/privacy.html — the one place that link needed adding sitewide
 * without hand-editing every page's own HTML (index.html's own link to
 * it lives in its Reference section instead, rendered by home.js from
 * src/pages.js, not from here). It runs unconditionally, even on a
 * page not on RECOMMENDED_PATH at all (e.g. a reference page), unlike
 * the next-step link below, which needs a path position to work from.
 *
 * It also prepends a slim site bar (Home, Syllabus Map, Formulae and
 * Data Sheet, Privacy) as the first element inside <main>, on every
 * page — again index.html excepted, which has no reason to link back
 * to itself and builds its own "Reference" panel from the same data
 * instead (home.js). Three of the four links resolve their label from
 * Pages.PAGES by href, rather than a second hardcoded title, so a
 * renamed page can't leave the bar showing a stale label; "Home" has
 * no PAGES entry to resolve (index.html isn't registered there) so it
 * stays a literal label/href pair.
 *
 * Requires src/pages.js (for Pages.RECOMMENDED_PATH and Pages.PAGES)
 * loaded first; load this script itself last. The pure lookups below
 * are exported for Node so they're unit-testable without a DOM/
 * location; only init() touches the page.
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

  // The site bar's four links, in order. A plain {label, href} pair is
  // used as given; a {pageHref} entry is resolved against Pages.PAGES
  // at render time instead, so its label always matches that page's
  // own registered title.
  const SITE_BAR_LINKS = [
    { label: 'Home', href: '../index.html' },
    { pageHref: 'notes/syllabus-map.html' },
    { pageHref: 'notes/data-sheet.html' },
    { pageHref: 'notes/privacy.html' },
  ];

  /**
   * Resolves SITE_BAR_LINKS against a PAGES array into plain
   * {label, href} pairs, dropping (rather than throwing on) a
   * pageHref entry whose target isn't registered, so one missing
   * registration can't take down the whole bar.
   */
  function resolveSiteBarLinks(pages) {
    return SITE_BAR_LINKS.map((link) => {
      if (!link.pageHref) return { label: link.label, href: link.href };
      const page = pages.find((p) => p.href === link.pageHref);
      return page ? { label: page.title, href: `../${page.href}` } : null;
    }).filter(Boolean);
  }

  // Prepends the site bar as the first child of <main>, ahead of the
  // page's own back-link, so it reads first without disturbing
  // anything else already there. <main> rather than <body>: body is a
  // centering flex row with a single child (main) on every page today,
  // so a second direct child would sit beside main instead of above
  // it, not stack with it.
  function renderSiteBar() {
    const main = document.querySelector('main');
    if (!main || typeof Pages === 'undefined' || document.getElementById('site-bar')) return;

    const nav = document.createElement('nav');
    nav.id = 'site-bar';
    nav.className = 'site-bar';
    nav.setAttribute('aria-label', 'Site');

    resolveSiteBarLinks(Pages.PAGES).forEach(({ label, href }) => {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      nav.appendChild(a);
    });

    main.insertBefore(nav, main.firstChild);
  }

  // Appends a small "Privacy" line to <main>, after #next-page. Safe to
  // call on any page, including one not on RECOMMENDED_PATH at all.
  function renderSiteFooterNote() {
    const main = document.querySelector('main');
    if (!main || document.getElementById('site-footer-note')) return;

    const note = document.createElement('p');
    note.id = 'site-footer-note';
    note.className = 'panel-note';
    note.appendChild(document.createTextNode('This site keeps no accounts and sets no cookies — see the '));
    const link = document.createElement('a');
    link.href = '../notes/privacy.html';
    link.textContent = 'privacy notice';
    note.appendChild(link);
    note.appendChild(document.createTextNode(' for what it stores and how to clear it.'));
    main.appendChild(note);
  }

  function init() {
    renderSiteBar();
    renderSiteFooterNote();

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

  const api = { resolveNextStep, resolveSiteBarLinks };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.NextPage = api;
    init();
  }
})();
