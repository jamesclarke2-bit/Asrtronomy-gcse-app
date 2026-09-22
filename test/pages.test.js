const test = require('node:test');
const assert = require('node:assert/strict');
const { PAGES } = require('../src/pages');
const { getSubtopic } = require('../src/curriculum');

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
