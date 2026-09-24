(function () {
  const scopeNoteEl = document.getElementById('scope-note');
  const pathListEl = document.getElementById('path-list');
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

  // --- Recommended path ----------------------------------------------------

  function pageByHref(href) {
    const page = Pages.PAGES.find((p) => p.href === href);
    if (!page) throw new Error(`Recommended path references a page not in PAGES: ${href}`);
    return page;
  }

  function renderPath() {
    let stepNumber = 1;
    Pages.RECOMMENDED_PATH.forEach((phase) => {
      const phaseSection = document.createElement('div');
      phaseSection.className = 'path-phase';

      const heading = document.createElement('h3');
      heading.className = 'path-phase-heading';
      heading.textContent = phase.phase;
      phaseSection.appendChild(heading);

      const stepsList = document.createElement('ol');
      stepsList.className = 'path-steps';
      stepsList.start = stepNumber;

      phase.steps.forEach((step) => {
        const page = pageByHref(step.href);

        const li = document.createElement('li');
        li.className = 'path-step';

        const card = document.createElement('a');
        card.className = 'page-card path-step-card';
        card.href = page.href;

        const title = document.createElement('h4');
        title.className = 'page-card-title';
        title.textContent = page.title;
        card.appendChild(title);

        const description = document.createElement('p');
        description.className = 'page-card-description';
        description.textContent = page.description;
        card.appendChild(description);

        const why = document.createElement('p');
        why.className = 'path-step-why';
        why.textContent = step.why;
        card.appendChild(why);

        li.appendChild(card);
        stepsList.appendChild(li);
        stepNumber += 1;
      });

      phaseSection.appendChild(stepsList);
      pathListEl.appendChild(phaseSection);
    });
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

  renderScopeNote();
  renderPath();
  renderUnitReference();
})();
