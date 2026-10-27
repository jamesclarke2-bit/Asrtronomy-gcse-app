const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PAGES, PHASES, COMING_SOON, RECOMMENDED_PATH,
  buildJourney, buildRecommendedPath,
  computeUnitCoverage, isExtensionPage, isReferencePage,
} = require('../src/pages');
const { getSubtopic, UNITS } = require('../src/curriculum');
const { buildSyllabusMap } = require('../src/syllabusMap');
const { SPEC_POINTS, SPEC_POINT_GROUPS, TOPIC_NAMES, REGISTERED_TOPICS } = require('../src/specPoints');
const { getAllQuestionsNode } = require('../src/allQuestions');

test('every page has a title, description and href', () => {
  PAGES.forEach((page) => {
    assert.ok(page.title && page.title.trim(), `page missing title: ${JSON.stringify(page)}`);
    assert.ok(page.description && page.description.trim(), `page missing description: ${page.title}`);
    assert.ok(page.href && page.href.trim(), `page missing href: ${page.title}`);
  });
});

test('every page has at least one curriculum unit, unless it is a reference page', () => {
  PAGES.forEach((page) => {
    assert.ok(Array.isArray(page.units), `page.units is not an array: ${page.title}`);
    if (isReferencePage(page)) {
      assert.equal(page.units.length, 0, `reference page should have no units: ${page.title}`);
    } else {
      assert.ok(page.units.length > 0, `page has no units: ${page.title}`);
    }
  });
});

test('every declared unit id resolves to a real curriculum subtopic', () => {
  PAGES.forEach((page) => {
    page.units.forEach((unitId) => {
      const subtopic = getSubtopic(unitId);
      assert.ok(subtopic, `${page.title} declares unknown unit "${unitId}"`);
    });
  });
});

test('hrefs are unique — no two pages point at the same file', () => {
  const hrefs = PAGES.map((page) => page.href);
  assert.equal(new Set(hrefs).size, hrefs.length, 'duplicate href found in PAGES');
});

test('hrefs point into sims/ or notes/ (every entry is a sub-page, not the landing page itself)', () => {
  PAGES.forEach((page) => {
    assert.ok(
      page.href.startsWith('sims/') || page.href.startsWith('notes/'),
      `${page.title} href should live under sims/ or notes/: ${page.href}`
    );
  });
});

// --- RECOMMENDED_PATH (index.html's "Recommended path" section) ----------

test('every RECOMMENDED_PATH phase has a label and at least one step', () => {
  assert.ok(RECOMMENDED_PATH.length > 0, 'RECOMMENDED_PATH is empty');
  RECOMMENDED_PATH.forEach((phase) => {
    assert.ok(phase.phase && phase.phase.trim(), `phase missing a label: ${JSON.stringify(phase)}`);
    assert.ok(Array.isArray(phase.steps) && phase.steps.length > 0, `"${phase.phase}" has no steps`);
  });
});

test('every RECOMMENDED_PATH step names a real page and gives a reason', () => {
  const hrefs = new Set(PAGES.map((page) => page.href));
  RECOMMENDED_PATH.flatMap((phase) => phase.steps).forEach((step) => {
    assert.ok(hrefs.has(step.href), `RECOMMENDED_PATH references an unknown page: ${step.href}`);
    assert.ok(step.why && step.why.trim(), `${step.href} has no "why" reason`);
  });
});

test('RECOMMENDED_PATH covers every non-extension, non-reference page in PAGES exactly once — no page missing, none duplicated, and no extension or reference page included', () => {
  const pathHrefs = RECOMMENDED_PATH.flatMap((phase) => phase.steps.map((step) => step.href));
  assert.equal(new Set(pathHrefs).size, pathHrefs.length, 'a page appears more than once in RECOMMENDED_PATH');

  // Extension pages (beyond the GCSE spec) live in index.html's
  // collapsed "Beyond GCSE" section instead — see isExtensionPage below
  // and home.js's own rendering. Reference pages (isReferencePage) live
  // in their own "Reference" section, outside the Recommended path too.
  const pathEligiblePages = PAGES.filter((page) => !isExtensionPage(page, getSubtopic) && !isReferencePage(page));
  const missing = pathEligiblePages.map((page) => page.href).filter((href) => !pathHrefs.includes(href));
  assert.deepEqual(missing, [], 'pages missing from RECOMMENDED_PATH');
  assert.equal(pathHrefs.length, pathEligiblePages.length, 'RECOMMENDED_PATH and path-eligible PAGES should be the same length');

  const extensionPages = PAGES.filter((page) => isExtensionPage(page, getSubtopic));
  extensionPages.forEach((page) => {
    assert.ok(!pathHrefs.includes(page.href), `extension page "${page.title}" should not be in RECOMMENDED_PATH`);
  });

  const referencePages = PAGES.filter((page) => isReferencePage(page));
  referencePages.forEach((page) => {
    assert.ok(!pathHrefs.includes(page.href), `reference page "${page.title}" should not be in RECOMMENDED_PATH`);
  });
});

test('isReferencePage: true only for pages marked kind: \'reference\'', () => {
  assert.equal(isReferencePage({ kind: 'reference' }), true);
  assert.equal(isReferencePage({ kind: 'extension' }), false);
  assert.equal(isReferencePage({}), false);
});

test('isExtensionPage: true only when every declared unit is a level:\'extension\' subtopic', () => {
  const extensionSubtopic = { id: 'x.1', level: 'extension' };
  const gcseSubtopic = { id: 'x.2' };
  const lookup = (id) => ({ 'x.1': extensionSubtopic, 'x.2': gcseSubtopic }[id]);

  assert.equal(isExtensionPage({ units: ['x.1'] }, lookup), true);
  assert.equal(isExtensionPage({ units: ['x.1', 'x.2'] }, lookup), false, 'mixing in a GCSE-spec unit should not count as extension');
  assert.equal(isExtensionPage({ units: ['x.2'] }, lookup), false);
  assert.equal(isExtensionPage({ units: [] }, lookup), false, 'a page with no units is not extension content');
});

// --- computeUnitCoverage (index.html's scope note) -------------------------

test('computeUnitCoverage: total is the unit\'s subtopic count, covered counts distinct ids only once', () => {
  const units = [{ id: 'u1', title: 'Observations', subtopics: [{ id: 'u1.1' }, { id: 'u1.2' }, { id: 'u1.3' }] }];
  const pages = [
    { units: ['u1.1'] },
    { units: ['u1.1', 'u1.2'] }, // u1.1 repeated across pages, and alongside u1.2 on one page
  ];
  const [coverage] = computeUnitCoverage(units, pages);
  assert.equal(coverage.total, 3);
  assert.equal(coverage.covered, 2); // u1.1 and u1.2 each counted once; u1.3 uncovered
});

test('computeUnitCoverage: a unit with no covering pages reads as 0 covered, not an error', () => {
  const units = [{ id: 'u4', title: 'Stars', subtopics: [{ id: 'u4.1' }, { id: 'u4.2' }] }];
  const [coverage] = computeUnitCoverage(units, PAGES);
  assert.equal(coverage.covered, 0);
  assert.equal(coverage.total, 2);
});

test("computeUnitCoverage: unit id prefix matching doesn't collide across units (u1 vs a hypothetical u10)", () => {
  const units = [
    { id: 'u1', title: 'Observations', subtopics: [{ id: 'u1.1' }] },
    { id: 'u10', title: 'Not a real unit', subtopics: [{ id: 'u10.1' }] },
  ];
  const pages = [{ units: ['u10.1'] }];
  const [u1Coverage, u10Coverage] = computeUnitCoverage(units, pages);
  assert.equal(u1Coverage.covered, 0, 'u10.1 must not be counted as covering u1');
  assert.equal(u10Coverage.covered, 1);
});

test('computeUnitCoverage against the real data: every unit resolves, and total matches its non-extension subtopic count', () => {
  const coverage = computeUnitCoverage(UNITS, PAGES);
  assert.equal(coverage.length, UNITS.length);
  coverage.forEach((entry, i) => {
    const gcseSubtopicCount = UNITS[i].subtopics.filter((s) => s.level !== 'extension').length;
    assert.equal(entry.id, UNITS[i].id);
    assert.equal(entry.total, gcseSubtopicCount);
    assert.ok(entry.covered >= 0 && entry.covered <= entry.total, `${entry.id}: covered (${entry.covered}) out of range for total (${entry.total})`);
  });
});

test('computeUnitCoverage: extension subtopics are excluded from both total and covered', () => {
  const units = [
    {
      id: 'u9',
      title: 'Test unit',
      subtopics: [{ id: 'u9.1' }, { id: 'u9.2', level: 'extension' }],
    },
  ];
  const pages = [{ units: ['u9.1', 'u9.2'] }];
  const [coverage] = computeUnitCoverage(units, pages);
  assert.equal(coverage.total, 1, 'the extension subtopic should not count towards total');
  assert.equal(coverage.covered, 1, 'the extension subtopic should not count towards covered, even though a page declares it');
});

// --- The journey: phase, position, why on PAGES; COMING_SOON ---------------

test('every non-reference, non-extension page has a phase (one of PHASES), an integer position and a why', () => {
  PAGES.forEach((page) => {
    if (isReferencePage(page) || isExtensionPage(page, getSubtopic)) return;
    assert.ok(PHASES.includes(page.phase), `${page.title}: phase "${page.phase}" is not one of PHASES`);
    assert.ok(Number.isInteger(page.position), `${page.title}: position should be an integer, got ${page.position}`);
    assert.ok(page.why && page.why.trim(), `${page.title}: missing a "why"`);
  });
});

test('a reference or extension page carries no phase, position or why — it is not reachable from the journey', () => {
  PAGES.forEach((page) => {
    if (!isReferencePage(page) && !isExtensionPage(page, getSubtopic)) return;
    assert.equal(page.phase, undefined, `${page.title}: reference/extension pages should not have a phase`);
    assert.equal(page.position, undefined, `${page.title}: reference/extension pages should not have a position`);
    assert.equal(page.why, undefined, `${page.title}: reference/extension pages should not have a why`);
  });
});

test('every COMING_SOON step has a name, a phase (one of PHASES), an integer position, a why, and exactly one of specPoints/topics', () => {
  COMING_SOON.forEach((step) => {
    assert.ok(step.name && step.name.trim(), `coming-soon step missing a name: ${JSON.stringify(step)}`);
    assert.ok(PHASES.includes(step.phase), `"${step.name}": phase "${step.phase}" is not one of PHASES`);
    assert.ok(Number.isInteger(step.position), `"${step.name}": position should be an integer`);
    assert.ok(step.why && step.why.trim(), `"${step.name}": missing a why`);
    const hasSpecPoints = Array.isArray(step.specPoints) && step.specPoints.length > 0;
    const hasTopics = Array.isArray(step.topics) && step.topics.length > 0;
    assert.ok(hasSpecPoints !== hasTopics, `"${step.name}": should name specPoints or topics, not both or neither`);
  });
});

test('every position (PAGES and COMING_SOON together) is unique, and the whole set runs 1..N with no gaps', () => {
  const positions = [
    ...PAGES.filter((p) => typeof p.position === 'number').map((p) => p.position),
    ...COMING_SOON.map((s) => s.position),
  ];
  assert.equal(new Set(positions).size, positions.length, 'a position is reused');
  const sorted = [...positions].sort((a, b) => a - b);
  sorted.forEach((pos, i) => assert.equal(pos, i + 1, `position sequence should run 1..N with no gaps; got ${sorted.join(',')}`));
});

test('journey cross-references its real neighbours, not a stale one: a "why" naming another page by title names a page that actually comes earlier, and a why using "just"/"next" to claim immediacy names one that is actually adjacent', () => {
  // A loose, mechanical check (not NLP), not a full language parse.
  // Direction always holds: a page's why should never cite a later
  // page as if already covered. The stronger "immediacy" check (catches
  // the exact kind of drift this page rebuild fixed — a why claiming a
  // page "just" did something that had actually moved two steps
  // earlier) only applies when the wording itself claims immediacy.
  const journeyPages = PAGES.filter((p) => typeof p.position === 'number');
  journeyPages.forEach((page) => {
    const claimsImmediacy = /\bjust\b/i.test(page.why);
    journeyPages.forEach((other) => {
      if (other === page) return;
      if (!page.why.includes(other.title)) return;
      assert.ok(
        other.position < page.position,
        `"${page.title}"'s why mentions "${other.title}", which actually comes later on the journey`
      );
      if (claimsImmediacy) {
        const gap = page.position - other.position;
        assert.ok(gap <= 1, `"${page.title}"'s why uses "just" of "${other.title}" but it is ${gap} positions earlier, not immediately before`);
      }
    });
  });
});

test('buildJourney: merges built and coming-soon steps, grouped by phase and ordered by position', () => {
  const pages = [
    { href: 'notes/a.html', title: 'A', phase: 'P1', position: 1 },
    { href: 'notes/b.html', title: 'B', phase: 'P1', position: 3 },
    { href: 'notes/c.html', title: 'C', phase: 'P2', position: 4 },
  ];
  const comingSoon = [{ name: 'Coming', phase: 'P1', position: 2, why: 'because', specPoints: ['1.1'] }];
  const journey = buildJourney(pages, comingSoon, ['P1', 'P2']);

  assert.equal(journey.length, 2);
  assert.equal(journey[0].phase, 'P1');
  assert.deepEqual(journey[0].items.map((i) => (i.type === 'built' ? i.page.href : i.step.name)), ['notes/a.html', 'Coming', 'notes/b.html']);
  assert.equal(journey[1].items.length, 1);
  assert.equal(journey[1].items[0].type, 'built');
});

test('buildJourney: a phase with no built pages and no coming-soon steps is left out entirely', () => {
  const pages = [{ href: 'notes/a.html', phase: 'P1', position: 1 }];
  const journey = buildJourney(pages, [], ['P1', 'P2 (empty)']);
  assert.equal(journey.length, 1);
  assert.equal(journey[0].phase, 'P1');
});

test('buildJourney against the real data: every phase appears, items are position-ordered, and a coming-soon item never carries an href', () => {
  const journey = buildJourney(PAGES, COMING_SOON, PHASES);
  assert.equal(journey.map((j) => j.phase).join('|'), PHASES.join('|'));

  journey.forEach(({ items }) => {
    for (let i = 1; i < items.length; i += 1) {
      assert.ok(items[i].position > items[i - 1].position, 'items within a phase should be position-ordered');
    }
    items.forEach((item) => {
      if (item.type === 'comingSoon') {
        assert.equal(item.step.href, undefined, `coming-soon step "${item.step.name}" should not carry an href`);
      } else {
        assert.ok(PAGES.includes(item.page), 'a built item should reference a real PAGES entry');
      }
    });
  });

  const totalItems = journey.reduce((sum, j) => sum + j.items.length, 0);
  assert.equal(totalItems, PAGES.filter((p) => typeof p.position === 'number').length + COMING_SOON.length);
});

test('buildRecommendedPath reproduces the precomputed RECOMMENDED_PATH exactly', () => {
  assert.deepEqual(buildRecommendedPath(PAGES, PHASES), RECOMMENDED_PATH);
});

// --- COMING_SOON accounts for every spec point the syllabus map marks ------
// "not built yet", for the topics it actually claims to speak for (11's
// probe/Apollo points and 12's formation/exoplanet points — not the
// handful of small, scattered not-built points elsewhere, e.g. 1.6 or
// 6.20, which don't belong to any of the four named coming-soon topics
// and are pre-existing gaps outside this rebuild's scope), plus Topics
// 13-16, which have no SPEC_POINTS registry entries at all yet.

function notBuiltLeafCodes(points, topicNumber, out) {
  points.forEach((point) => {
    if (!point.isGroup && point.status === 'not built') out.push({ code: point.code, topic: topicNumber });
    if (point.children) notBuiltLeafCodes(point.children, topicNumber, out);
  });
  return out;
}

test('every spec point Topics 11 and 12 mark "not built yet" is named in some coming-soon step', () => {
  const map = buildSyllabusMap({
    specPoints: SPEC_POINTS,
    specPointGroups: SPEC_POINT_GROUPS,
    topicNames: TOPIC_NAMES,
    registeredTopics: REGISTERED_TOPICS,
    units: UNITS,
    pages: PAGES,
    allQuestions: getAllQuestionsNode(),
    isExtensionPage: (page) => isExtensionPage(page, getSubtopic),
  });

  const namedSpecPoints = new Set(COMING_SOON.flatMap((step) => step.specPoints || []));

  [11, 12].forEach((topicNumber) => {
    const topic = map.topics.find((t) => t.number === topicNumber);
    assert.ok(topic && topic.registered, `Topic ${topicNumber} should be registered`);
    const notBuilt = notBuiltLeafCodes(topic.points, topicNumber, []);
    assert.ok(notBuilt.length > 0, `Topic ${topicNumber} should have at least one not-built point to check against (test fixture assumption)`);
    notBuilt.forEach(({ code }) => {
      assert.ok(namedSpecPoints.has(code), `${code} (Topic ${topicNumber}, not built) is not named in any coming-soon step`);
    });
  });
});

test('every unregistered topic (13-16, no SPEC_POINTS entries at all) is named in some coming-soon step\'s topics list', () => {
  const namedTopics = new Set(COMING_SOON.flatMap((step) => step.topics || []));
  const unregistered = Object.keys(TOPIC_NAMES).map(Number).filter((n) => !REGISTERED_TOPICS.includes(n));
  assert.ok(unregistered.length > 0, 'there should be at least one unregistered topic to check against (test fixture assumption)');
  unregistered.forEach((topicNumber) => {
    assert.ok(namedTopics.has(topicNumber), `Topic ${topicNumber} (${TOPIC_NAMES[topicNumber]}, unregistered) is not named in any coming-soon step`);
  });
});
