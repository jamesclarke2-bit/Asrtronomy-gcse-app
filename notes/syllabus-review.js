/**
 * notes/syllabus-review.html's own script: wires the real site data
 * (src/specPoints.js, src/curriculum.js, src/pages.js, every practice
 * question via src/allQuestions.js) into
 * SyllabusReview.buildSyllabusReview (src/syllabusReview.js), then
 * renders the result as one flat, printable table per topic. All the
 * actual build logic lives in that pure builder — this file only
 * turns its output into DOM, the same split as notes/syllabus-map.js
 * and its own src/syllabusMap.js.
 *
 * AllQuestions.getAllQuestionsBrowser() reads its many engine/question
 * modules off window globals, so every one of them has to actually be
 * <script>-tagged on this page before this file runs (see
 * notes/syllabus-review.html, which copies notes/syllabus-map.html's
 * own full list) — test/scriptDependencyOrder.test.js enforces this
 * generically, for every page on the site.
 */
(function () {
  function textCell(tag, text) {
    const cell = document.createElement(tag);
    cell.textContent = text;
    return cell;
  }

  function renderSummaryTable(review) {
    const tbody = document.getElementById('summary-tbody');
    review.topics.forEach((topic) => {
      const tr = document.createElement('tr');
      const nameTh = document.createElement('th');
      nameTh.scope = 'row';
      const a = document.createElement('a');
      a.href = `#topic-${topic.number}`;
      a.textContent = `${topic.number}. ${SpecPoints.TOPIC_NAMES[topic.number]}`;
      nameTh.appendChild(a);
      tr.appendChild(nameTh);
      [String(topic.total), String(topic.covered), String(topic.notBuilt), String(topic.flagged)].forEach((text) => {
        tr.appendChild(textCell('td', text));
      });
      tbody.appendChild(tr);
    });

    const tfoot = document.getElementById('summary-tfoot');
    const totalRow = document.createElement('tr');
    const totalTh = document.createElement('th');
    totalTh.scope = 'row';
    totalTh.textContent = 'Total';
    totalRow.appendChild(totalTh);
    [review.summary.total, review.summary.covered, review.summary.notBuilt, review.summary.flagged].forEach((n) => {
      totalRow.appendChild(textCell('td', String(n)));
    });
    tfoot.appendChild(totalRow);
  }

  const TABLE_HEADERS = ['Code', 'Depth', 'Spec point', 'Page(s)', 'Questions', 'Thin coverage', "Teacher's verdict"];

  function buildPagesCell(row) {
    const td = document.createElement('td');
    if (row.status !== 'covered') {
      const span = document.createElement('em');
      span.textContent = 'not built';
      td.appendChild(span);
      return td;
    }
    row.pages.forEach((page, index) => {
      if (index > 0) td.appendChild(document.createElement('br'));
      const a = document.createElement('a');
      const prefix = page.href.startsWith('notes/') ? '' : '../';
      a.href = prefix + page.href.replace(/^notes\//, '');
      a.textContent = page.title;
      td.appendChild(a);
    });
    return td;
  }

  function buildFlagsCell(row) {
    const td = document.createElement('td');
    td.className = 'spec-review-flags';
    row.flags.forEach((flag, index) => {
      if (index > 0) td.appendChild(document.createElement('br'));
      td.appendChild(document.createTextNode(`⚠ ${flag}`));
    });
    return td;
  }

  function buildRow(row) {
    const tr = document.createElement('tr');
    if (row.flags.length > 0) tr.className = 'spec-review-row--flagged';

    const codeTh = document.createElement('th');
    codeTh.scope = 'row';
    codeTh.textContent = row.code;
    tr.appendChild(codeTh);

    tr.appendChild(textCell('td', row.depth));
    tr.appendChild(textCell('td', row.text));
    tr.appendChild(buildPagesCell(row));
    tr.appendChild(textCell('td', row.questionCount === null ? '–' : String(row.questionCount)));
    tr.appendChild(buildFlagsCell(row));
    tr.appendChild(textCell('td', '')).className = 'spec-review-verdict';

    return tr;
  }

  function renderTopicSection(topicNumber, topicRows) {
    const section = document.createElement('section');
    section.className = 'notes-section';
    section.id = `topic-${topicNumber}`;

    const heading = document.createElement('h2');
    heading.textContent = `Topic ${topicNumber}: ${SpecPoints.TOPIC_NAMES[topicNumber]}`;
    section.appendChild(heading);

    // .table-scroll (same as the summary table above) keeps this wide,
    // long-text table from forcing the whole page to scroll sideways on
    // a phone-width screen; styles.css's own @media print rule lifts
    // that scroll back off when the page is actually printed, so every
    // column still comes out on paper.
    const wrap = document.createElement('div');
    wrap.className = 'table-scroll';
    const table = document.createElement('table');
    table.className = 'shower-table spec-review-table';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    TABLE_HEADERS.forEach((label) => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    topicRows.forEach((row) => tbody.appendChild(buildRow(row)));
    table.appendChild(tbody);

    wrap.appendChild(table);
    section.appendChild(wrap);
    return section;
  }

  function renderTopics(review) {
    const container = document.getElementById('topics-container');
    review.topics.forEach((topic) => {
      const topicRows = review.rows.filter((row) => row.topic === topic.number);
      container.appendChild(renderTopicSection(topic.number, topicRows));
    });
  }

  function renderCoverage() {
    document.getElementById('coverage').textContent =
      'A reference page: maps the whole specification at once, so it sits outside the per-unit coverage figures elsewhere on the site.';
  }

  function init() {
    const review = SyllabusReview.buildSyllabusReview({
      specPoints: SpecPoints.SPEC_POINTS,
      units: Curriculum.UNITS,
      pages: Pages.PAGES,
      allQuestions: AllQuestions.getAllQuestionsBrowser(),
      isExtensionPage: (page) => Pages.isExtensionPage(page, Curriculum.getSubtopic),
      diagramFirstPages: Pages.DIAGRAM_FIRST_PAGES,
      tapRevealHeavyPages: Pages.TAP_REVEAL_HEAVY_PAGES,
    });
    renderSummaryTable(review);
    renderTopics(review);
    renderCoverage();
  }

  init();
})();
