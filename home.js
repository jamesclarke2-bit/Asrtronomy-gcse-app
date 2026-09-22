(function () {
  const container = document.getElementById('unit-list');

  function pagesForUnit(unitId) {
    return Pages.PAGES.filter((page) => page.units.some((u) => u.startsWith(`${unitId}.`)));
  }

  Curriculum.UNITS.forEach((unit) => {
    const pages = pagesForUnit(unit.id);
    if (pages.length === 0) return;

    const section = document.createElement('section');
    section.className = 'unit-section';

    const heading = document.createElement('h2');
    heading.textContent = `${unit.id} · ${unit.title}`;
    section.appendChild(heading);

    const list = document.createElement('div');
    list.className = 'page-card-list';

    pages.forEach((page) => {
      const card = document.createElement('a');
      card.className = 'page-card';
      card.href = page.href;

      const title = document.createElement('h3');
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
    container.appendChild(section);
  });
})();
