/**
 * tools/wordRuns.js, the rendered-page word-run counter, run on every
 * diagram-first page in a real browser: every page not on the clean-up list
 * below stays within the limits (at most 150 words before the first visual,
 * at most 250 in any other run, the run after the last visual included).
 * Each page still on the clean-up list must still be over, so the list
 * shrinks as pages are fixed rather than hiding a page that has slipped back.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { launchChromium, trackSkips } = require('./browserLaunch');
const { measure, BEFORE_FIRST_LIMIT, RUN_LIMIT, NOT_COUNTED, NOT_A_VISUAL } = require('../tools/wordRuns');
const { DIAGRAM_FIRST_PAGES } = require('../src/pages');

const { skip } = trackSkips('test/wordRuns.test.js');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

// Still over a limit after clean-up round 1; due in clean-up round 2.
const STILL_OVER = [
  'sims/sunspot-rotation.html',
  'notes/observing-techniques.html',
  'sims/sun-declination.html',
  'notes/ecliptic-zodiac.html',
  'notes/parallax.html',
  'notes/magnitude.html',
];

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

test('every page on the clean-up list is a diagram-first page', () => {
  STILL_OVER.forEach((p) => assert.ok(DIAGRAM_FIRST_PAGES.includes(p), p));
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
      if (STILL_OVER.includes(r.page)) {
        assert.ok(r.problems.length > 0, `${r.page} is now within the limits: take it off STILL_OVER`);
      } else {
        assert.deepEqual(r.problems, [], `${r.page}: first ${r.first}, longest between ${r.longest}, final ${r.final}`);
      }
    });
  }
});
