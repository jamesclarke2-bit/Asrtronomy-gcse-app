const test = require('node:test');
const assert = require('node:assert/strict');
const { PAGES, RECOMMENDED_PATH, computeUnitCoverage, isExtensionPage, isReferencePage } = require('../src/pages');
const { getSubtopic, UNITS } = require('../src/curriculum');

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
