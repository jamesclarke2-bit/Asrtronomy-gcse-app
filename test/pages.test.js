const test = require('node:test');
const assert = require('node:assert/strict');
const { PAGES, RECOMMENDED_PATH, computeUnitCoverage } = require('../src/pages');
const { getSubtopic, UNITS } = require('../src/curriculum');

test('every page has a title, description and href', () => {
  PAGES.forEach((page) => {
    assert.ok(page.title && page.title.trim(), `page missing title: ${JSON.stringify(page)}`);
    assert.ok(page.description && page.description.trim(), `page missing description: ${page.title}`);
    assert.ok(page.href && page.href.trim(), `page missing href: ${page.title}`);
  });
});

test('every page has at least one curriculum unit', () => {
  PAGES.forEach((page) => {
    assert.ok(Array.isArray(page.units) && page.units.length > 0, `page has no units: ${page.title}`);
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

test('RECOMMENDED_PATH covers every page in PAGES exactly once — no page missing, none duplicated', () => {
  const pathHrefs = RECOMMENDED_PATH.flatMap((phase) => phase.steps.map((step) => step.href));
  assert.equal(new Set(pathHrefs).size, pathHrefs.length, 'a page appears more than once in RECOMMENDED_PATH');
  const missing = PAGES.map((page) => page.href).filter((href) => !pathHrefs.includes(href));
  assert.deepEqual(missing, [], 'pages missing from RECOMMENDED_PATH');
  assert.equal(pathHrefs.length, PAGES.length, 'RECOMMENDED_PATH and PAGES should be the same length');
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

test('computeUnitCoverage against the real data: every unit resolves, and total matches its subtopic count', () => {
  const coverage = computeUnitCoverage(UNITS, PAGES);
  assert.equal(coverage.length, UNITS.length);
  coverage.forEach((entry, i) => {
    assert.equal(entry.id, UNITS[i].id);
    assert.equal(entry.total, UNITS[i].subtopics.length);
    assert.ok(entry.covered >= 0 && entry.covered <= entry.total, `${entry.id}: covered (${entry.covered}) out of range for total (${entry.total})`);
  });
});
