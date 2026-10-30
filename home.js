/**
 * index.html's own script: the scope note, the journey (hero + one
 * "unit card" per phase, each with its own progress ring and steps,
 * plus coming-soon steps for the topics nothing is built for yet — see
 * src/pages.js's own header for how PAGES/COMING_SOON drive all of
 * this), the Reference panel, the collapsed extension section, and the
 * unit-grouped reference listing at the foot of the page.
 *
 * Pure logic (reading the quiz-progress tally, picking the Continue
 * step, building the list-view's flat journey order) is exported for
 * Node — see test/home.test.js — so it's checked without a browser;
 * only init() touches the page itself.
 */
(function () {
  // --- Reading the saved quiz tally (read-only; this page never writes it) --
  // Same localStorage key and shape as quiz-ui.js: { [subtopicId]:
  // {attempts, correct} }. A page "has answered questions" once at
  // least one of its own curriculum units shows up with attempts > 0 —
  // the only signal this page has for "the visitor has engaged with
  // this step", since nothing else is tracked (no page-visit log, no
  // accounts).
  const PROGRESS_STORAGE_KEY = 'astro-quiz-progress';

  function loadQuizProgress() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function pageHasAnswered(page, progress) {
    return page.units.some((id) => progress[id] && progress[id].attempts > 0);
  }

  // Built pages only (COMING_SOON has no quiz units to check), in
  // journey order.
  function journeyPages(pages) {
    return pages.filter((p) => typeof p.position === 'number').sort((a, b) => a.position - b.position);
  }

  /**
   * The href the hero's "Continue" button should point at: the first
   * journey page with no answered questions yet. If every page has
   * been answered at least once, falls back to the last page on the
   * journey (nothing left to "continue" to) rather than nowhere.
   */
  function findContinueHref(pages, progress) {
    const ordered = journeyPages(pages);
    const next = ordered.find((page) => !pageHasAnswered(page, progress));
    return (next || ordered[ordered.length - 1]).href;
  }

  // --- Per-phase progress, for each unit card's ring -------------------
  // Only built items count towards a ring's fraction — a coming-soon
  // step can't be "finished", so it's never part of the denominator.

  function phaseProgress(items, progress) {
    const built = items.filter((item) => item.type === 'built');
    const finished = built.filter((item) => pageHasAnswered(item.page, progress));
    return { finished: finished.length, total: built.length };
  }

  // --- DOM only from here down ------------------------------------------

  if (typeof window === 'undefined') {
    module.exports = { loadQuizProgress, pageHasAnswered, journeyPages, findContinueHref, phaseProgress };
    return;
  }

  const scopeNoteEl = document.getElementById('scope-note');
  const unitCardsEl = document.getElementById('unit-cards');
  const journeyListEl = document.getElementById('journey-list');
  const listToggleEl = document.getElementById('list-view-toggle');
  const continueButtonEl = document.getElementById('continue-button');
  const startButtonEl = document.getElementById('start-button');
  const extensionSectionEl = document.getElementById('extension-section');
  const extensionListEl = document.getElementById('extension-list');
  const referenceSectionEl = document.getElementById('reference-section');
  const referenceListEl = document.getElementById('reference-list');
  const referenceQuickSectionEl = document.getElementById('reference-quick-section');
  const referenceQuickListEl = document.getElementById('reference-quick-list');
  const unitListEl = document.getElementById('unit-list');

  function pagesForUnit(unitId) {
    return Pages.PAGES.filter((page) => page.units.some((u) => u.startsWith(`${unitId}.`)));
  }

  // --- Scope note ----------------------------------------------------------
  // Computed from the real data (Pages.computeUnitCoverage), not hand-typed,
  // so it can't quietly go stale as pages get added. "In depth" vs "just
  // started" is a coverage-share heuristic (3/4 of a unit's subtopics
  // having a page), not a claim about how well-taught each subtopic is —
  // stated as such below, and the per-unit numbers behind it are one
  // section down, in the unit-grouped listing.
  const IN_DEPTH_THRESHOLD = 0.75;

  function renderScopeNote() {
    const coverage = Pages.computeUnitCoverage(Curriculum.UNITS, Pages.PAGES);
    const label = (unit) => `Unit ${unit.id.slice(1)} (${unit.title})`;

    const inDepth = coverage.filter((u) => u.covered / u.total >= IN_DEPTH_THRESHOLD);
    const started = coverage.filter((u) => u.covered > 0 && u.covered / u.total < IN_DEPTH_THRESHOLD);
    const notStarted = coverage.filter((u) => u.covered === 0);

    const sentences = [];
    if (inDepth.length > 0) sentences.push(`Built out in depth: ${inDepth.map(label).join(', ')}.`);
    if (started.length > 0) sentences.push(`Just getting started: ${started.map(label).join(', ')}.`);
    if (notStarted.length > 0) sentences.push(`Not started yet: ${notStarted.map(label).join(', ')}.`);

    scopeNoteEl.textContent = '';
    const strong = document.createElement('strong');
    strong.textContent = 'Where this app stands: ';
    scopeNoteEl.appendChild(strong);
    scopeNoteEl.appendChild(document.createTextNode(sentences.join(' ')));
  }

  // --- The hero: illustration, welcome line, Continue/Start here -----------

  function renderHero(progress) {
    const ordered = journeyPages(Pages.PAGES);
    continueButtonEl.href = `${findContinueHref(Pages.PAGES, progress)}`;
    startButtonEl.href = `${ordered[0].href}`;
  }

  // --- The journey: one unit card per phase, plus a plain-list view --------
  // Both views are built from the exact same Pages.buildJourney() data in
  // the exact same order, so they can never show different steps — see
  // test/home.test.js's "list view matches the cards" check.

  const PHASE_ICON_IDS = {
    'Look up': 'phase-icon-look-up',
    'Earth, Moon and Sun': 'phase-icon-earth-moon-sun',
    Time: 'phase-icon-time',
    'The Solar System and gravity': 'phase-icon-solar-system',
    'Telescopes and exploring': 'phase-icon-telescopes',
    'Stars and the Universe': 'phase-icon-stars',
  };

  // A small ring: a grey full-circle track plus a blue arc over it,
  // the arc's length set by stroke-dasharray/offset from the finished
  // fraction. An empty ring (0 built steps yet, e.g. a phase that's
  // entirely coming-soon) draws as just the track, not a div-by-zero
  // NaN arc.
  function buildProgressRing(finished, total) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 40 40');
    svg.setAttribute('width', '40');
    svg.setAttribute('height', '40');
    svg.setAttribute('class', 'progress-ring');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `${finished} of ${total} step${total === 1 ? '' : 's'} finished`);

    const r = 16;
    const circumference = 2 * Math.PI * r;
    const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    track.setAttribute('cx', '20');
    track.setAttribute('cy', '20');
    track.setAttribute('r', String(r));
    track.setAttribute('class', 'progress-ring-track');
    svg.appendChild(track);

    if (total > 0) {
      const fraction = finished / total;
      const arc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      arc.setAttribute('cx', '20');
      arc.setAttribute('cy', '20');
      arc.setAttribute('r', String(r));
      arc.setAttribute('class', 'progress-ring-arc');
      arc.setAttribute('stroke-dasharray', `${circumference}`);
      arc.setAttribute('stroke-dashoffset', `${circumference * (1 - fraction)}`);
      svg.appendChild(arc);
    }

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', '20');
    label.setAttribute('y', '24');
    label.setAttribute('class', 'progress-ring-text');
    label.setAttribute('aria-hidden', 'true');
    label.textContent = `${finished}/${total}`;
    svg.appendChild(label);

    return svg;
  }

  function buildStepLink(page, progress) {
    const li = document.createElement('li');
    li.className = 'journey-step';
    if (pageHasAnswered(page, progress)) li.classList.add('journey-step-finished');

    const a = document.createElement('a');
    a.className = 'journey-step-link';
    a.href = page.href;
    a.textContent = page.title;
    li.appendChild(a);
    return li;
  }

  function buildComingSoonItem(step) {
    const li = document.createElement('li');
    li.className = 'journey-step journey-step-coming-soon';
    const span = document.createElement('span');
    span.className = 'journey-step-coming-soon-label';
    span.textContent = `${step.name} — coming soon`;
    li.appendChild(span);
    return li;
  }

  function renderUnitCards(journey, progress) {
    journey.forEach(({ phase, items }) => {
      const card = document.createElement('article');
      card.className = 'unit-card';

      const header = document.createElement('div');
      header.className = 'unit-card-header';

      const iconUse = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      iconUse.setAttribute('class', 'unit-card-icon');
      iconUse.setAttribute('width', '36');
      iconUse.setAttribute('height', '36');
      iconUse.setAttribute('aria-hidden', 'true');
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${PHASE_ICON_IDS[phase]}`);
      use.setAttribute('href', `#${PHASE_ICON_IDS[phase]}`);
      iconUse.appendChild(use);
      header.appendChild(iconUse);

      const heading = document.createElement('h3');
      heading.className = 'unit-card-title';
      heading.textContent = phase;
      header.appendChild(heading);

      const { finished, total } = phaseProgress(items, progress);
      header.appendChild(buildProgressRing(finished, total));

      card.appendChild(header);

      const stepsList = document.createElement('ol');
      stepsList.className = 'unit-card-steps';
      items.forEach((item) => {
        stepsList.appendChild(item.type === 'built' ? buildStepLink(item.page, progress) : buildComingSoonItem(item.step));
      });
      card.appendChild(stepsList);

      unitCardsEl.appendChild(card);
    });
  }

  function renderJourneyList(journey, progress) {
    journey.forEach(({ phase, items }) => {
      const heading = document.createElement('h3');
      heading.className = 'journey-list-phase-heading';
      heading.textContent = phase;
      journeyListEl.appendChild(heading);

      const stepsList = document.createElement('ol');
      stepsList.className = 'journey-list-steps';
      items.forEach((item) => {
        stepsList.appendChild(item.type === 'built' ? buildStepLink(item.page, progress) : buildComingSoonItem(item.step));
      });
      journeyListEl.appendChild(stepsList);
    });
  }

  function setUpListViewToggle() {
    listToggleEl.addEventListener('click', () => {
      const showingList = listToggleEl.getAttribute('aria-pressed') === 'true';
      const next = !showingList;
      listToggleEl.setAttribute('aria-pressed', String(next));
      listToggleEl.textContent = next ? 'Show as cards' : 'Show as list';
      unitCardsEl.hidden = next;
      journeyListEl.hidden = !next;
    });
  }

  function renderJourney(progress) {
    const journey = Pages.buildJourney(Pages.PAGES, Pages.COMING_SOON, Pages.PHASES);
    renderUnitCards(journey, progress);
    renderJourneyList(journey, progress);
    setUpListViewToggle();
  }

  // --- Reference quick links (top bar, right under the title) --------------
  // The same reference pages renderReferencePages lists in full, further
  // down the page — but as one compact row of links right under the
  // title, above the journey, so they're visible without scrolling.
  // Built from the same Pages.PAGES data as that full listing, so the
  // two can never show different pages; order follows PAGES itself,
  // same as renderReferencePages.

  function renderReferenceQuickLinks() {
    const referencePages = Pages.PAGES.filter((page) => Pages.isReferencePage(page));
    if (referencePages.length === 0) return;

    referenceQuickSectionEl.hidden = false;
    const links = document.createElement('p');
    links.className = 'reference-quick-links';

    referencePages.forEach((page, i) => {
      if (i > 0) links.appendChild(document.createTextNode(' · '));
      const a = document.createElement('a');
      a.href = page.href;
      a.textContent = page.title;
      links.appendChild(a);
    });

    referenceQuickListEl.appendChild(links);
  }

  // --- Reference pages ------------------------------------------------------
  // Pages marked Pages.isReferencePage cut across every unit instead of
  // teaching towards particular ones, so they sit in their own section —
  // outside every unit group, the journey (test/pages.test.js enforces
  // that) and the scope note's coverage figures (their empty `units`
  // means Pages.computeUnitCoverage already leaves them out).

  function renderReferencePages() {
    const referencePages = Pages.PAGES.filter((page) => Pages.isReferencePage(page));
    if (referencePages.length === 0) return;

    referenceSectionEl.hidden = false;
    const list = document.createElement('div');
    list.className = 'page-card-list';

    referencePages.forEach((page) => {
      const card = document.createElement('a');
      card.className = 'page-card';
      card.href = page.href;

      const title = document.createElement('h3');
      title.className = 'page-card-title';
      title.textContent = page.title;
      card.appendChild(title);

      const description = document.createElement('p');
      description.className = 'page-card-description';
      description.textContent = page.description;
      card.appendChild(description);

      list.appendChild(card);
    });

    referenceListEl.appendChild(list);
  }

  // --- Beyond GCSE: A-level extension pages ---------------------------------
  // Kept out of the journey (test/pages.test.js enforces that) and out
  // of the scope note's coverage figures (Pages.computeUnitCoverage
  // already excludes level:'extension' subtopics) — listed here instead,
  // collapsed by default since they're optional extra depth, not part of
  // the GCSE course the rest of this page is organised around.

  function renderExtensionPages() {
    const extensionPages = Pages.PAGES.filter((page) => Pages.isExtensionPage(page, Curriculum.getSubtopic));
    if (extensionPages.length === 0) return;

    extensionSectionEl.hidden = false;
    const list = document.createElement('div');
    list.className = 'page-card-list';

    extensionPages.forEach((page) => {
      const card = document.createElement('a');
      card.className = 'page-card';
      card.href = page.href;

      const title = document.createElement('h3');
      title.className = 'page-card-title';
      title.textContent = page.title;
      card.appendChild(title);

      const description = document.createElement('p');
      description.className = 'page-card-description';
      description.textContent = page.description;
      card.appendChild(description);

      list.appendChild(card);
    });

    extensionListEl.appendChild(list);
  }

  // --- Reference listing, grouped by curriculum unit ------------------------

  function renderUnitReference() {
    Curriculum.UNITS.forEach((unit) => {
      const pages = pagesForUnit(unit.id);
      if (pages.length === 0) return;

      const section = document.createElement('section');
      section.className = 'unit-section';

      const heading = document.createElement('h3');
      heading.textContent = `${unit.id} · ${unit.title}`;
      section.appendChild(heading);

      const list = document.createElement('div');
      list.className = 'page-card-list';

      pages.forEach((page) => {
        const card = document.createElement('a');
        card.className = 'page-card';
        card.href = page.href;

        const title = document.createElement('h4');
        title.className = 'page-card-title';
        title.textContent = page.title;
        card.appendChild(title);

        const description = document.createElement('p');
        description.className = 'page-card-description';
        description.textContent = page.description;
        card.appendChild(description);

        // Only the subtopics relevant to *this* unit section — the same
        // page can appear under several units, each time with just its
        // own slice of coverage rather than the page's full list repeated.
        const relevantSubtopics = page.units
          .filter((u) => u.startsWith(`${unit.id}.`))
          .map(Curriculum.getSubtopic)
          .filter(Boolean);
        if (relevantSubtopics.length > 0) {
          const coverage = document.createElement('p');
          coverage.className = 'page-card-coverage';
          coverage.textContent = 'Covers here: ' + relevantSubtopics.map((s) => `${s.id} ${s.title}`).join(', ');
          card.appendChild(coverage);
        }

        list.appendChild(card);
      });

      section.appendChild(list);
      unitListEl.appendChild(section);
    });
  }

  const progress = loadQuizProgress();
  renderScopeNote();
  renderHero(progress);
  renderReferenceQuickLinks();
  renderJourney(progress);
  renderReferencePages();
  renderExtensionPages();
  renderUnitReference();
})();
