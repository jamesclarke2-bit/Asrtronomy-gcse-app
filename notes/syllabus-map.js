/**
 * notes/syllabus-map.html's own script: wires the real site data
 * (src/specPoints.js, src/curriculum.js, src/pages.js, every practice
 * question via src/allQuestions.js) into SyllabusMap.buildSyllabusMap
 * (src/syllabusMap.js), then renders the result. All the actual
 * coverage logic lives in that pure builder — this file only turns its
 * output into DOM.
 */
(function () {
  function renderPointPages(pages) {
    const p = document.createElement('p');
    p.className = 'spec-point-pages';
    if (pages.length === 0) {
      p.textContent = 'Not built yet.';
      return p;
    }
    p.appendChild(document.createTextNode('Covered by: '));
    pages.forEach((page, i) => {
      if (i > 0) p.appendChild(document.createTextNode(', '));
      const a = document.createElement('a');
      a.href = `../${page.href}`;
      a.textContent = page.title;
      p.appendChild(a);
    });
    return p;
  }

  function renderPoint(point) {
    const li = document.createElement('li');
    li.className = 'spec-point';
    li.dataset.code = point.code;

    const header = document.createElement('p');
    header.className = 'spec-point-header';

    const code = document.createElement('span');
    code.className = 'spec-point-code';
    code.textContent = point.code;
    header.appendChild(code);

    const depth = document.createElement('span');
    depth.className = 'depth-tag';
    depth.textContent = point.depth;
    header.appendChild(depth);

    const status = document.createElement('span');
    status.className = 'syllabus-status';
    status.dataset.status = point.status;
    status.textContent = point.status;
    header.appendChild(status);

    li.appendChild(header);

    if (point.text) {
      const text = document.createElement('p');
      text.className = 'spec-point-text';
      text.textContent = point.text;
      li.appendChild(text);
    }

    // Groups carry no pages of their own — each child reports its own
    // coverage below, so a group-level "not built yet"/"covered by"
    // line here would just repeat what's already shown per child.
    if (!point.isGroup) {
      li.appendChild(renderPointPages(point.pages));
    }

    if (point.hasPracticeQuestions !== null) {
      const q = document.createElement('p');
      q.className = 'spec-point-questions';
      q.textContent = point.hasPracticeQuestions ? 'Has practice questions.' : 'No questions yet.';
      li.appendChild(q);
    }

    if (point.children) {
      const childList = document.createElement('ul');
      childList.className = 'spec-point-children';
      point.children.forEach((child) => childList.appendChild(renderPoint(child)));
      li.appendChild(childList);
    }

    return li;
  }

  function renderTopic(topic) {
    if (!topic.registered) {
      const p = document.createElement('p');
      p.className = 'syllabus-unregistered-topic';
      p.textContent = `Topic ${topic.number}: ${topic.name} — not yet added to the registry.`;
      return p;
    }

    const details = document.createElement('details');
    details.className = 'syllabus-topic';
    details.id = `topic-${topic.number}`;

    const summary = document.createElement('summary');
    summary.textContent = `Topic ${topic.number}: ${topic.name} — ${topic.summary.covered} of ${topic.summary.total} points covered`;
    details.appendChild(summary);

    const body = document.createElement('div');
    body.className = 'syllabus-topic-body';
    const list = document.createElement('ul');
    list.className = 'spec-point-list';
    topic.points.forEach((point) => list.appendChild(renderPoint(point)));
    body.appendChild(list);
    details.appendChild(body);

    return details;
  }

  function renderSummaryTable(topics) {
    const container = document.getElementById('summary-table-container');

    const wrap = document.createElement('div');
    wrap.className = 'table-scroll';
    const table = document.createElement('table');
    table.className = 'shower-table syllabus-summary-table';

    const thead = document.createElement('thead');
    thead.innerHTML =
      '<tr><th scope="col">Topic</th><th scope="col">Covered</th><th scope="col">Partly covered</th><th scope="col">Not built</th></tr>';
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    topics.forEach((topic) => {
      const tr = document.createElement('tr');

      const nameTh = document.createElement('th');
      nameTh.scope = 'row';
      if (topic.registered) {
        const a = document.createElement('a');
        a.href = `#topic-${topic.number}`;
        a.textContent = `${topic.number}. ${topic.name}`;
        nameTh.appendChild(a);
      } else {
        nameTh.textContent = `${topic.number}. ${topic.name}`;
      }
      tr.appendChild(nameTh);

      if (topic.registered) {
        [topic.summary.covered, topic.summary.partlyCovered, topic.summary.notBuilt].forEach((n) => {
          const td = document.createElement('td');
          td.textContent = String(n);
          tr.appendChild(td);
        });
      } else {
        const td = document.createElement('td');
        td.colSpan = 3;
        td.className = 'syllabus-not-registered';
        td.textContent = 'Not yet added to the registry';
        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    wrap.appendChild(table);
    container.appendChild(wrap);
  }

  // One line per partly-covered point, naming which lettered sub-parts
  // are covered and which aren't — e.g. "12.1: b, d, e covered; a, c
  // not built yet." Nothing to show (no partly-covered point anywhere)
  // just renders no list at all.
  function renderPartlyCoveredDetail(topics) {
    const items = [];
    topics.forEach((topic) => {
      if (!topic.registered) return;
      topic.points.forEach((point) => {
        if (point.status !== 'partly covered') return;
        const suffix = (child) => child.code.slice(point.code.length);
        const covered = point.children.filter((c) => c.status === 'covered').map(suffix);
        const notCovered = point.children.filter((c) => c.status !== 'covered').map(suffix);
        items.push(`${point.code}: ${covered.join(', ')} covered; ${notCovered.join(', ')} not built yet.`);
      });
    });
    if (items.length === 0) return;

    const container = document.getElementById('summary-table-container');
    const heading = document.createElement('p');
    heading.className = 'syllabus-partly-detail';
    heading.innerHTML = '<strong>Partly covered points, by sub-part:</strong>';
    container.appendChild(heading);

    const ul = document.createElement('ul');
    ul.className = 'tip-list';
    items.forEach((text) => {
      const li = document.createElement('li');
      li.textContent = text;
      ul.appendChild(li);
    });
    container.appendChild(ul);
  }

  function renderExtensionPages(pages) {
    const container = document.getElementById('extension-pages-container');
    if (pages.length === 0) {
      container.textContent = 'None currently.';
      return;
    }
    const list = document.createElement('div');
    list.className = 'page-card-list';
    pages.forEach((page) => {
      const a = document.createElement('a');
      a.className = 'page-card';
      a.href = `../${page.href}`;
      const h3 = document.createElement('h3');
      h3.textContent = page.title;
      a.appendChild(h3);
      list.appendChild(a);
    });
    container.appendChild(list);
  }

  function renderCoverage() {
    document.getElementById('coverage').textContent =
      'A reference page: maps the whole specification at once, so it sits outside the per-unit coverage figures elsewhere on the site.';
  }

  function init() {
    const map = SyllabusMap.buildSyllabusMap({
      specPoints: SpecPoints.SPEC_POINTS,
      specPointGroups: SpecPoints.SPEC_POINT_GROUPS,
      topicNames: SpecPoints.TOPIC_NAMES,
      registeredTopics: SpecPoints.REGISTERED_TOPICS,
      units: Curriculum.UNITS,
      pages: Pages.PAGES,
      allQuestions: AllQuestions.getAllQuestionsBrowser(),
      isExtensionPage: (page) => Pages.isExtensionPage(page, Curriculum.getSubtopic),
    });

    renderSummaryTable(map.topics);
    renderPartlyCoveredDetail(map.topics);

    const topicsContainer = document.getElementById('topics-container');
    map.topics.forEach((topic) => topicsContainer.appendChild(renderTopic(topic)));

    renderExtensionPages(map.extensionPages);
    renderCoverage();
  }

  init();
})();
