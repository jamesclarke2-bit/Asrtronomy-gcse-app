/**
 * tools/wordRuns.js, the rendered-page word-run counter, run on every
 * diagram-first page in a real browser: every one must stay within all
 * three limits (at most 150 words before the first visual, at most 250
 * between any two visuals, and at most 250 after the last visual). The
 * clean-up list is empty since clean-up round 2. The only pages exempt are
 * the four reference pages named below (CLAUDE.md rule 17); every other page
 * on the site must be on DIAGRAM_FIRST_PAGES, so a new teaching page can't
 * slip through unmeasured.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { launchChromium, trackSkips } = require('./browserLaunch');
const { measure, BEFORE_FIRST_LIMIT, RUN_LIMIT, NOT_COUNTED, NOT_A_VISUAL } = require('../tools/wordRuns');
const fs = require('node:fs');
const path = require('node:path');
const { DIAGRAM_FIRST_PAGES, WORD_RUN_EXEMPT_PAGES, PAGES } = require('../src/pages');

const { skip } = trackSkips('test/wordRuns.test.js');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

test('only the four reference pages are exempt from the word-run limits, and every other page is measured', () => {
  // Exempt by name: reference pages with no single central diagram (CLAUDE.md rule 17).
  assert.deepEqual([...WORD_RUN_EXEMPT_PAGES].sort(), [
    'notes/data-sheet.html',
    'notes/privacy.html',
    'notes/syllabus-map.html',
    'notes/syllabus-review.html',
  ]);
  for (const href of WORD_RUN_EXEMPT_PAGES) {
    const page = PAGES.find((p) => p.href === href);
    assert.ok(page && page.kind === 'reference', `${href} is registered as a reference page`);
    assert.ok(!DIAGRAM_FIRST_PAGES.includes(href), `${href} is exempt, so not on DIAGRAM_FIRST_PAGES`);
  }
  // Every other page, registered or not, is on DIAGRAM_FIRST_PAGES.
  const root = path.join(__dirname, '..');
  const onDisk = ['notes', 'sims'].flatMap((dir) => fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith('.html')).map((f) => `${dir}/${f}`));
  const everyPage = new Set([...onDisk, ...PAGES.map((p) => p.href)]);
  for (const href of everyPage) {
    if (WORD_RUN_EXEMPT_PAGES.includes(href)) continue;
    assert.ok(DIAGRAM_FIRST_PAGES.includes(href), `${href} is a teaching page, so it must be on DIAGRAM_FIRST_PAGES and within the word-run limits`);
  }
});

test('the counter uses the house limits and the agreed exclusions', () => {
  assert.equal(BEFORE_FIRST_LIMIT, 150);
  assert.equal(RUN_LIMIT, 250);
  for (const sel of ['.notes-toc', '#related', 'button', 'label', '#questions', '.picture-quiz-panel']) {
    assert.ok(NOT_COUNTED.split(', ').includes(sel), `${sel} is not counted`);
  }
  const skipped = NOT_COUNTED.split(', ');
  for (const sel of ['table', '.exam-tip', '.note', 'p', 'li']) {
    assert.ok(!skipped.includes(sel), `${sel} is counted`);
  }
  assert.ok(NOT_A_VISUAL.includes('#questions'), 'quiz pictures are not visuals');
});

test('rendered word runs on every diagram-first page', async (t) => {
  try {
    const b = await launchChromium();
    await b.close();
  } catch (err) {
    skip(t, SKIP_MESSAGE(err));
    return;
  }
  const results = await measure(DIAGRAM_FIRST_PAGES);
  for (const r of results) {
    await t.test(r.page, () => {
      assert.ok(r.visuals > 0, `${r.page} has no visual`);
      assert.ok(r.first <= BEFORE_FIRST_LIMIT, `${r.page}: ${r.first} words before the first visual`);
      assert.ok(r.longest <= RUN_LIMIT, `${r.page}: ${r.longest} words between two visuals`);
      assert.ok(r.final <= RUN_LIMIT, `${r.page}: ${r.final} words after the last visual`);
      assert.deepEqual(r.problems, [], `${r.page}: first ${r.first}, longest between ${r.longest}, final ${r.final}`);
    });
  }
});
