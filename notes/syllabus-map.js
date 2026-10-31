/**
 * notes/syllabus-map.html's own script: wires the real site data
 * (src/specPoints.js, src/curriculum.js, src/pages.js, every practice
 * question via src/allQuestions.js) into SyllabusMap.buildSyllabusMap
 * (src/syllabusMap.js), then renders the result. All the actual
 * coverage logic lives in that pure builder — this file only turns its
 * output into DOM.
 *
 * AllQuestions.getAllQuestionsBrowser() reads its many engine/question
 * modules off window globals, so every one of them has to actually be
 * <script>-tagged on this page (see notes/syllabus-map.html) — a
 * module added to src/allQuestions.js without a matching tag here
 * throws before anything on this page renders at all, which is exactly
 * what happened before this file's own rewrite (see
 * test/syllabusMap.test.js's own script-tag regression test).
 */
(function () {
  const STATUS_KEYS = ['covered', 'partlyCovered', 'notBuilt'];
  const STATUS_LABELS = { covered: 'Covered', partlyCovered: 'Partly covered', notBuilt: 'Not built' };
  const STATUS_CSS_KEY = { covered: 'covered', partlyCovered: 'partly', notBuilt: 'not-built' };

  // --- The coverage bar: a stacked bar (covered/partly/not built), used
  // both full-size for the page's own overall summary and compact
  // inside each topic's own <summary> line. Never SVG text — plain HTML
  // blocks sized by flex-grow, same convention as every other shared
  // CSS component on this site (see styles.css's own note on
  // .diagram-label and similar).
  function buildCoverageBar(counts, { compact = false } = {}) {
    const wrap = document.createElement('div');
    wrap.className = compact ? 'coverage-bar-wrap coverage-bar-wrap--compact' : 'coverage-bar-wrap';

    const bar = document.createElement('div');
    bar.className = 'coverage-bar';
    bar.setAttribute('role', 'img');
    bar.setAttribute(
      'aria-label',
      `${counts.covered} covered, ${counts.partlyCovered} partly covered, ${counts.notBuilt} not built, out of ${counts.total} spec points`
    );
    STATUS_KEYS.forEach((key) => {
      const value = counts[key];
      if (value === 0) return;
      const segment = document.createElement('div');
      segment.className = `coverage-bar-segment coverage-bar-segment--${STATUS_CSS_KEY[key]}`;
      segment.style.flexGrow = String(value);
      bar.appendChild(segment);
    });
    wrap.appendChild(bar);

    if (!compact) {
      const legend = document.createElement('div');
      legend.className = 'coverage-bar-legend';
      STATUS_KEYS.forEach((key) => {
        const item = document.createElement('span');
        item.className = 'coverage-bar-legend-item';
        const swatch = document.createElement('span');
        swatch.className = `coverage-bar-legend-swatch coverage-bar-legend-swatch--${STATUS_CSS_KEY[key]}`;
        item.appendChild(swatch);
        item.appendChild(document.createTextNode(`${STATUS_LABELS[key]}: ${counts[key]}`));
        legend.appendChild(item);
      });
      wrap.appendChild(legend);
    }

    return wrap;
  }

  function renderPointPages(pages) {
    const p = document.createElement('p');
    p.className = 'spec-point-pages';
    if (pages.length === 0) {
      p.textContent = 'Not built yet.';
      return p;
    }
    p.appendChild(document.createTextNode('Taught on: '));
    pages.forEach((page, i) => {
      if (i > 0) p.appendChild(document.createTextNode(', '));
      const a = document.createElement('a');
      a.href = `../${page.href}`;
      a.textContent = page.title;
      p.appendChild(a);
    });
    return p;
  }

  // A 'be able to' point's own practice-question line: links straight
  // to each covering page's own practice-questions section (#questions
  // — every notes/sims page has exactly one, see notesTemplate.test.js)
  // rather than just the page itself, since that's where the questions
  // this count describes actually live. null for a point this doesn't
  // apply to at all (see src/syllabusMap.js's own header comment).
  function renderPracticeQuestionsLine(point) {
    if (point.hasPracticeQuestions === null) return null;
    const p = document.createElement('p');
    p.className = 'spec-point-questions';
    if (!point.hasPracticeQuestions) {
      p.textContent = 'No practice questions yet.';
      return p;
    }
    const noun = point.questionCount === 1 ? 'question' : 'questions';
    p.appendChild(document.createTextNode(`${point.questionCount} practice ${noun}: `));
    point.pages.forEach((page, i) => {
      if (i > 0) p.appendChild(document.createTextNode(', '));
      const a = document.createElement('a');
      a.href = `../${page.href}#questions`;
      a.textContent = page.title;
      p.appendChild(a);
    });
    return p;
  }

  function renderPoint(point) {
    const li = document.createElement('li');
    li.className = 'spec-point';
    li.dataset.code = point.code;
    li.dataset.status = point.status;
    if (!point.isGroup) {
      li.dataset.depth = point.depth;
      if (point.hasPracticeQuestions !== null) li.dataset.hasQuestions = String(point.hasPracticeQuestions);
    }

    const header = document.createElement('p');
    header.className = 'spec-point-header';

    const code = document.createElement('span');
    code.className = 'spec-point-code';
    code.textContent = point.code;
    header.appendChild(code);

    const depth = document.createElement('span');
    depth.className = 'depth-tag';
    depth.dataset.depth = point.depth;
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
      const questionsLine = renderPracticeQuestionsLine(point);
      if (questionsLine) li.appendChild(questionsLine);
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
      const card = document.createElement('div');
      card.className = 'syllabus-topic syllabus-topic--unbuilt';

      const title = document.createElement('p');
      title.className = 'syllabus-topic-unbuilt-title';
      title.appendChild(document.createTextNode(`Topic ${topic.number}: ${topic.name} `));
      const badge = document.createElement('span');
      badge.className = 'syllabus-status';
      badge.dataset.status = 'not built';
      badge.textContent = 'not built';
      title.appendChild(badge);
      card.appendChild(title);

      const note = document.createElement('p');
      note.className = 'syllabus-topic-unbuilt-note';
      note.textContent = "This topic hasn't been added to the syllabus map's own registry yet, so its spec points aren't broken out individually here.";
      card.appendChild(note);

      return card;
    }

    const details = document.createElement('details');
    details.className = 'syllabus-topic';
    details.id = `topic-${topic.number}`;

    const summary = document.createElement('summary');
    const summaryText = document.createElement('span');
    summaryText.className = 'syllabus-topic-summary-text';
    summaryText.textContent =
      `Topic ${topic.number}: ${topic.name} — ${topic.summary.covered} covered, ` +
      `${topic.summary.partlyCovered} partly, ${topic.summary.notBuilt} not built (of ${topic.summary.total})`;
    summary.appendChild(summaryText);
    summary.appendChild(buildCoverageBar(topic.summary, { compact: true }));
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

  // Whether `li` (a .spec-point) itself, or at least one of its direct
  // children, matches any ACTIVE filter — the two filters are a union
  // ("show me anything needing attention"), not an intersection: a
  // point is never both not-built and missing questions at once
  // (questionCount/hasPracticeQuestions is only ever computed for a
  // covered point, see src/syllabusMap.js's own header comment), so
  // requiring both together would make checking both boxes always show
  // nothing at all. A group's own status/hasQuestions isn't meaningful
  // by itself, so this always has to look at least one level down to
  // find out whether a group is worth showing.
  function pointMatches(li, notBuiltOnly, noQuestionsOnly) {
    const matchesEither = (el) =>
      (notBuiltOnly && el.dataset.status === 'not built') || (noQuestionsOnly && el.dataset.hasQuestions === 'false');
    if (matchesEither(li)) return true;
    const children = li.querySelectorAll(':scope > .spec-point-children > .spec-point');
    return Array.from(children).some(matchesEither);
  }

  function setUpFilters(topicsHaveContent) {
    const notBuiltCheckbox = document.getElementById('filter-not-built');
    const noQuestionsCheckbox = document.getElementById('filter-no-questions');
    const statusEl = document.getElementById('filter-status');
    if (!topicsHaveContent) {
      // No registered topic actually renders a .spec-point-list (e.g. a
      // fixture or future site with every topic unbuilt) — the filters
      // would have nothing to do, so leave them be rather than firing
      // on an empty page.
      return;
    }

    function applyFilters() {
      const notBuiltOnly = notBuiltCheckbox.checked;
      const noQuestionsOnly = noQuestionsCheckbox.checked;
      const anyFilterActive = notBuiltOnly || noQuestionsOnly;

      let visibleTopics = 0;
      let visiblePoints = 0;

      document.querySelectorAll('#topics-container > details.syllabus-topic').forEach((details) => {
        let topicHasMatch = false;
        details.querySelectorAll(':scope > .syllabus-topic-body > .spec-point-list > .spec-point').forEach((li) => {
          const visible = !anyFilterActive || pointMatches(li, notBuiltOnly, noQuestionsOnly);
          li.hidden = !visible;
          if (visible) {
            topicHasMatch = true;
            visiblePoints += 1;
          }
        });

        if (anyFilterActive) {
          details.hidden = !topicHasMatch;
          if (topicHasMatch) {
            details.open = true;
            visibleTopics += 1;
          }
        } else {
          details.hidden = false;
        }
      });

      if (anyFilterActive) {
        const noun = visiblePoints === 1 ? 'point' : 'points';
        statusEl.hidden = false;
        statusEl.textContent = `Showing ${visiblePoints} matching ${noun}, across ${visibleTopics} topic${visibleTopics === 1 ? '' : 's'}.`;
      } else {
        statusEl.hidden = true;
        statusEl.textContent = '';
      }
    }

    notBuiltCheckbox.addEventListener('change', applyFilters);
    noQuestionsCheckbox.addEventListener('change', applyFilters);
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

    document.getElementById('coverage-bar-container').appendChild(buildCoverageBar(map.summary));
    renderSummaryTable(map.topics);
    renderPartlyCoveredDetail(map.topics);

    const topicsContainer = document.getElementById('topics-container');
    map.topics.forEach((topic) => topicsContainer.appendChild(renderTopic(topic)));

    const topicsHaveContent = map.topics.some((t) => t.registered && t.points.length > 0);
    setUpFilters(topicsHaveContent);

    renderExtensionPages(map.extensionPages);
    renderCoverage();
  }

  init();
})();
