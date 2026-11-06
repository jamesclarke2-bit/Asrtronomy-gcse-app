/**
 * src/syllabusReview.js: fixture-based tests for the core build logic
 * and computeTapRevealRatio, then checks against the real site data —
 * every SPEC_POINTS entry appears exactly once, every page link and
 * question count matches an independent recount, src/pages.js's
 * TAP_REVEAL_HEAVY_PAGES hasn't drifted from the real HTML, and
 * docs/syllabus-review.md (scripts/generate-syllabus-review.js's own
 * output) is still fresh against today's data.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildSyllabusReview, computeTapRevealRatio, THIN_QUESTION_THRESHOLD } = require('../src/syllabusReview');
const { SPEC_POINTS, TOPIC_NAMES } = require('../src/specPoints');
const { UNITS, getSubtopic } = require('../src/curriculum');
const { PAGES, isExtensionPage, DIAGRAM_FIRST_PAGES, TAP_REVEAL_HEAVY_PAGES } = require('../src/pages');
const { getAllQuestionsNode } = require('../src/allQuestions');

const ROOT = path.join(__dirname, '..');

// --- Fixture-based: the core build logic, isolated from real data ---------

function fixtureReview(overrides = {}) {
  const specPoints = overrides.specPoints || [
    { code: '1.1', topic: 1, depth: 'understand', text: 'Point one' },
    { code: '1.2', topic: 1, depth: 'be able to', text: 'Point two' },
    { code: '1.3', topic: 1, depth: 'know', text: 'Point three' },
  ];
  const units = overrides.units || [
    {
      id: 'uA',
      title: 'Unit A',
      subtopics: [
        { id: 'uA.1', title: 'Sub 1', depth: 'understand', spec: ['1.1'] },
        { id: 'uA.2', title: 'Sub 2', depth: 'be able to', spec: ['1.2'] },
      ],
    },
  ];
  const pages = overrides.pages || [
    { title: 'Page A', href: 'notes/a.html', units: ['uA.1'] },
    { title: 'Page B', href: 'sims/b.html', units: ['uA.2'] },
  ];
  const allQuestions = overrides.allQuestions || [{ id: 'q1', units: ['uA.2'] }, { id: 'q2', units: ['uA.2'] }];
  const isExtPage = overrides.isExtensionPage || (() => false);
  const diagramFirstPages = overrides.diagramFirstPages || ['notes/a.html', 'sims/b.html'];
  const tapRevealHeavyPages = overrides.tapRevealHeavyPages || [];

  return buildSyllabusReview({ specPoints, units, pages, allQuestions, isExtensionPage: isExtPage, diagramFirstPages, tapRevealHeavyPages });
}

test('buildSyllabusReview: one row per raw specPoints entry, text/depth/topic verbatim', () => {
  const review = fixtureReview();
  assert.equal(review.rows.length, 3);
  const row = review.rows.find((r) => r.code === '1.1');
  assert.equal(row.text, 'Point one');
  assert.equal(row.depth, 'understand');
  assert.equal(row.topic, 1);
});

test('buildSyllabusReview: a covered point lists its page(s); an uncovered one is "not built" with none', () => {
  const review = fixtureReview();
  const covered = review.rows.find((r) => r.code === '1.1');
  assert.equal(covered.status, 'covered');
  assert.deepEqual(covered.pages, [{ href: 'notes/a.html', title: 'Page A' }]);

  const notBuilt = review.rows.find((r) => r.code === '1.3'); // no subtopic tags 1.3
  assert.equal(notBuilt.status, 'not built');
  assert.deepEqual(notBuilt.pages, []);
});

test('buildSyllabusReview: questionCount is null unless the point is a covered be-able-to point', () => {
  const review = fixtureReview();
  assert.equal(review.rows.find((r) => r.code === '1.1').questionCount, null, "'understand' is never applicable");
  assert.equal(review.rows.find((r) => r.code === '1.3').questionCount, null, "'know' is never applicable");
  assert.equal(review.rows.find((r) => r.code === '1.2').questionCount, 2, 'be able to + covered sums tagging questions');
});

test('buildSyllabusReview: an uncovered be-able-to point has a null questionCount even if a question happens to tag its subtopic', () => {
  const review = fixtureReview({
    units: [{ id: 'uA', title: 'Unit A', subtopics: [{ id: 'uA.1', title: 'Sub 1', depth: 'understand', spec: ['1.1'] }] }],
    allQuestions: [{ id: 'q1', units: ['uA.2'] }],
  });
  const point = review.rows.find((r) => r.code === '1.2');
  assert.equal(point.status, 'not built');
  assert.equal(point.questionCount, null);
});

test(`buildSyllabusReview: flags a be-able-to point with fewer than ${THIN_QUESTION_THRESHOLD} questions, not one with enough`, () => {
  const thin = fixtureReview({ allQuestions: [{ id: 'q1', units: ['uA.2'] }] });
  const thinPoint = thin.rows.find((r) => r.code === '1.2');
  assert.equal(thinPoint.questionCount, 1);
  assert.ok(thinPoint.flags.some((f) => f.includes('practice question')));

  const plenty = fixtureReview(); // 2 questions, meets the threshold
  const plentyPoint = plenty.rows.find((r) => r.code === '1.2');
  assert.deepEqual(plentyPoint.flags, []);
});

test('buildSyllabusReview: never flags questions on a "know" or "understand" point, however few questions tag it', () => {
  const review = fixtureReview({
    units: [{ id: 'uA', title: 'Unit A', subtopics: [{ id: 'uA.1', title: 'Sub 1', depth: 'understand', spec: ['1.1'] }] }],
    allQuestions: [],
  });
  assert.deepEqual(review.rows.find((r) => r.code === '1.1').flags, []);
});

test('buildSyllabusReview: flags an understand point when none of its covering pages are diagram-first, not when at least one is', () => {
  const noDiagram = fixtureReview({ diagramFirstPages: ['sims/b.html'] }); // 1.1 covered only by notes/a.html
  assert.ok(noDiagram.rows.find((r) => r.code === '1.1').flags.some((f) => f.includes('diagram-first')));

  const hasDiagram = fixtureReview({ diagramFirstPages: ['notes/a.html'] });
  assert.deepEqual(hasDiagram.rows.find((r) => r.code === '1.1').flags, []);
});

test('buildSyllabusReview: never flags "no diagram" for a know or be-able-to point', () => {
  const review = fixtureReview({ diagramFirstPages: [] });
  assert.deepEqual(review.rows.find((r) => r.code === '1.2').flags, [], "be able to point's only flag path is thin questions, which it has enough of");
  assert.deepEqual(review.rows.find((r) => r.code === '1.3').flags, [], "'1.3' isn't even covered, so carries no flags at all");
});

test('buildSyllabusReview: flags a point covered by exactly one tap-reveal-heavy page, never when a second page also covers it', () => {
  const soleHeavy = fixtureReview({ tapRevealHeavyPages: ['notes/a.html'] });
  assert.ok(soleHeavy.rows.find((r) => r.code === '1.1').flags.some((f) => f.includes('tap-to-reveal')));

  const alsoCoveredElsewhere = fixtureReview({
    units: [
      {
        id: 'uA',
        title: 'Unit A',
        subtopics: [
          { id: 'uA.1', title: 'Sub 1', depth: 'understand', spec: ['1.1'] },
          { id: 'uA.3', title: 'Sub 3', depth: 'understand', spec: ['1.1'] },
        ],
      },
    ],
    pages: [
      { title: 'Page A', href: 'notes/a.html', units: ['uA.1'] },
      { title: 'Page C', href: 'notes/c.html', units: ['uA.3'] },
    ],
    tapRevealHeavyPages: ['notes/a.html'],
  });
  assert.deepEqual(
    alsoCoveredElsewhere.rows.find((r) => r.code === '1.1').flags.filter((f) => f.includes('tap-to-reveal')),
    [],
    'covered by a second page too, so never "covered only on" the heavy one'
  );
});

test('buildSyllabusReview: never flags a point that is not built', () => {
  const review = fixtureReview({ diagramFirstPages: [], tapRevealHeavyPages: ['notes/a.html', 'sims/b.html'] });
  assert.deepEqual(review.rows.find((r) => r.code === '1.3').flags, []);
});

test('buildSyllabusReview: topic and overall summaries count total/covered/notBuilt/flagged correctly', () => {
  const review = fixtureReview({ diagramFirstPages: ['sims/b.html'], allQuestions: [{ id: 'q1', units: ['uA.2'] }] });
  // 1.1: covered, flagged (no diagram-first page). 1.2: covered, flagged (1 question). 1.3: not built.
  const topic1 = review.topics.find((t) => t.number === 1);
  assert.deepEqual(topic1, { number: 1, total: 3, covered: 2, notBuilt: 1, flagged: 2 });
  assert.deepEqual(review.summary, { total: 3, covered: 2, notBuilt: 1, flagged: 2 });
});

// --- computeTapRevealRatio --------------------------------------------------

test('computeTapRevealRatio: 0 for a page with no <main> at all, or none of it inside glossary-definition', () => {
  assert.equal(computeTapRevealRatio('<html><body>no main here</body></html>'), 0);
  assert.equal(computeTapRevealRatio('<main><p>one two three four five</p></main>'), 0);
});

test('computeTapRevealRatio: 1 when every word inside <main> is inside a glossary-definition panel', () => {
  const html = '<main><span class="glossary-definition" data-term="x" hidden>one two three</span></main>';
  assert.equal(computeTapRevealRatio(html), 1);
});

test('computeTapRevealRatio: the share of total words that sit inside glossary-definition panels, span and div alike', () => {
  const html =
    '<main><p>one two three four</p>' +
    '<div class="glossary-definition timeline-event-detail" data-term="y" hidden>five six</div></main>';
  // 4 visible words, 2 reveal words -> 2 / 6
  assert.equal(computeTapRevealRatio(html), 2 / 6);
});

test('computeTapRevealRatio: content outside <main> never counts either way', () => {
  const html =
    '<header><span class="glossary-definition" data-term="z" hidden>ignored entirely</span></header>' +
    '<main><p>one two</p></main>';
  assert.equal(computeTapRevealRatio(html), 0);
});

// --- Against the real site data --------------------------------------------

function realReview() {
  return buildSyllabusReview({
    specPoints: SPEC_POINTS,
    units: UNITS,
    pages: PAGES,
    allQuestions: getAllQuestionsNode(),
    isExtensionPage: (page) => isExtensionPage(page, getSubtopic),
    diagramFirstPages: DIAGRAM_FIRST_PAGES,
    tapRevealHeavyPages: TAP_REVEAL_HEAVY_PAGES,
  });
}

test('real data: every Topics 1-12 SPEC_POINTS entry appears exactly once', () => {
  const review = realReview();
  const seen = review.rows.map((row) => row.code);
  assert.deepEqual(seen.sort(), SPEC_POINTS.map((p) => p.code).sort());
  assert.equal(new Set(seen).size, seen.length, 'no spec code appears twice');
  assert.equal(review.rows.length, SPEC_POINTS.length);
});

test('real data: every topic 1-12 appears exactly once in the summary, named from TOPIC_NAMES', () => {
  const review = realReview();
  assert.deepEqual(
    review.topics.map((t) => t.number),
    Array.from({ length: 12 }, (_, i) => i + 1)
  );
  review.topics.forEach((topic) => assert.ok(TOPIC_NAMES[topic.number], `topic ${topic.number} should have a name`));
});

test('real data: every page link resolves to a real, non-extension page in src/pages.js', () => {
  const review = realReview();
  const registeredHrefs = new Set(PAGES.map((p) => p.href));
  const extensionHrefs = new Set(PAGES.filter((p) => isExtensionPage(p, getSubtopic)).map((p) => p.href));
  review.rows.forEach((row) => {
    row.pages.forEach((page) => {
      assert.ok(registeredHrefs.has(page.href), `${row.code} links to unregistered page ${page.href}`);
      assert.ok(!extensionHrefs.has(page.href), `${row.code} links to extension page ${page.href}`);
      const registered = PAGES.find((p) => p.href === page.href);
      assert.equal(page.title, registered.title, `${row.code}'s link title for ${page.href} should match the registry`);
    });
  });
});

test('real data: a covered be-able-to point\'s questionCount matches an independent recount from getAllQuestionsNode', () => {
  const review = realReview();
  const allQuestions = getAllQuestionsNode();
  review.rows.forEach((row) => {
    if (row.depth !== 'be able to' || row.status !== 'covered') return;
    const subtopicIds = new Set();
    UNITS.forEach((unit) =>
      unit.subtopics.forEach((sub) => {
        if ((sub.spec || []).includes(row.code)) subtopicIds.add(sub.id);
      })
    );
    const independentCount = allQuestions.filter((q) => (q.units || []).some((id) => subtopicIds.has(id))).length;
    assert.equal(row.questionCount, independentCount, `${row.code}'s questionCount should match an independent recount`);
  });
});

test('real data: topic and overall summaries match an independent recount of the rows', () => {
  const review = realReview();
  review.topics.forEach((topic) => {
    const topicRows = review.rows.filter((row) => row.topic === topic.number);
    assert.deepEqual(topic, {
      number: topic.number,
      total: topicRows.length,
      covered: topicRows.filter((row) => row.status === 'covered').length,
      notBuilt: topicRows.filter((row) => row.status === 'not built').length,
      flagged: topicRows.filter((row) => row.flags.length > 0).length,
    });
  });
  const expected = review.topics.reduce(
    (acc, topic) => ({
      total: acc.total + topic.total,
      covered: acc.covered + topic.covered,
      notBuilt: acc.notBuilt + topic.notBuilt,
      flagged: acc.flagged + topic.flagged,
    }),
    { total: 0, covered: 0, notBuilt: 0, flagged: 0 }
  );
  assert.deepEqual(review.summary, expected);
});

test('real data: no flag ever appears on a "not built" row', () => {
  const review = realReview();
  review.rows.forEach((row) => {
    if (row.status === 'not built') assert.deepEqual(row.flags, [], `${row.code} is not built, so should carry no flags`);
  });
});

// --- src/pages.js's TAP_REVEAL_HEAVY_PAGES, checked against real HTML ------

test("real data: TAP_REVEAL_HEAVY_PAGES names exactly the teaching pages whose real <main> is over a third tap-to-reveal by word count", () => {
  const TAP_REVEAL_RATIO_THRESHOLD = 1 / 3;
  const teachingPages = PAGES.filter((page) => !isExtensionPage(page, getSubtopic) && (page.units || []).length > 0);
  const actuallyHeavy = teachingPages
    .filter((page) => computeTapRevealRatio(fs.readFileSync(path.join(ROOT, page.href), 'utf8')) >= TAP_REVEAL_RATIO_THRESHOLD)
    .map((page) => page.href)
    .sort();
  assert.deepEqual(
    actuallyHeavy,
    [...TAP_REVEAL_HEAVY_PAGES].sort(),
    'src/pages.js\'s TAP_REVEAL_HEAVY_PAGES has drifted from the real page content — update it to match'
  );
});

// --- docs/syllabus-review.md, checked for freshness against today's data --

test('docs/syllabus-review.md stays fresh against today\'s specPoints.js/curriculum.js/pages.js/questions', () => {
  const { buildReviewData, renderMarkdown } = require('../scripts/generate-syllabus-review');
  const freshMarkdown = renderMarkdown(buildReviewData());
  const onDisk = fs.readFileSync(path.join(ROOT, 'docs', 'syllabus-review.md'), 'utf8');
  assert.equal(
    onDisk,
    freshMarkdown,
    'docs/syllabus-review.md is stale — run `npm run generate-syllabus-review` and commit the result'
  );
});
