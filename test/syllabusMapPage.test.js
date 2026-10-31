/**
 * notes/syllabus-map.html's actual rendered page — checks that
 * test/syllabusMap.test.js's own pure-builder tests can't catch, since
 * they never load a browser: whether the page's <script> tags actually
 * give AllQuestions.getAllQuestionsBrowser() every global it reads
 * (the real bug found on this page — it crashed before rendering
 * anything, in every browser, not just Safari/iPad: see
 * src/allQuestions.js's own getAllQuestionsBrowser), and whether every
 * topic/spec point/status chip the real data implies actually shows up
 * in the DOM once that's fixed.
 *
 * Checked at a phone width (390px, matching test/noHorizontalScroll
 * .test.js's convention) and an iPad width (768px), since the task
 * that rewrote this page found it "nearly empty" there specifically.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');

const PAGE_PATH = path.join(__dirname, '..', 'notes', 'syllabus-map.html');
const PAGE_URL = 'file://' + PAGE_PATH;
const ALL_QUESTIONS_SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'allQuestions.js'), 'utf8');
const PAGE_HTML = fs.readFileSync(PAGE_PATH, 'utf8');

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/syllabusMapPage.test.js');

const VIEWPORTS = [
  { label: 'phone (390px)', width: 390, height: 844 },
  { label: 'iPad (768px)', width: 768, height: 1024 },
];

async function withPage(t, viewport, run) {
  let browser;
  try {
    browser = await launchChromium();
  } catch (err) {
    skip(t, SKIP_MESSAGE(err));
    return;
  }
  try {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    const pageErrors = [];
    const consoleErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.goto(PAGE_URL);
    await page.waitForTimeout(200);
    await run(page, { pageErrors, consoleErrors });
  } finally {
    await browser.close();
  }
}

// --- Regression guard: every window global getAllQuestionsBrowser() reads
// is actually loaded as a <script> on this page. Pure string/regex work,
// no browser needed — this is the exact gap that let the real bug (the
// page crashing in every browser, Safari included) through unnoticed.

test("getAllQuestionsBrowser's window globals: every one has a matching <script> tag on notes/syllabus-map.html", () => {
  const browserFnMatch = /function getAllQuestionsBrowser\(\) \{([\s\S]*?)\n  \}/.exec(ALL_QUESTIONS_SRC);
  assert.ok(browserFnMatch, 'could not find getAllQuestionsBrowser in src/allQuestions.js — has it been renamed?');
  const globalNames = [...browserFnMatch[1].matchAll(/window\.(\w+)/g)].map((m) => m[1]);
  assert.ok(globalNames.length > 20, `expected several dozen window globals, found ${globalNames.length} — did the regex break?`);

  const missing = globalNames.filter((name) => {
    // PascalCase global -> its own camelCase filename.js, the naming
    // convention every module here follows (StarPatterns ->
    // starPatterns.js, EotQuestions -> eotQuestions.js, ...).
    const fileName = name.charAt(0).toLowerCase() + name.slice(1) + '.js';
    return !PAGE_HTML.includes(`src/${fileName}?`);
  });
  assert.deepEqual(missing, [], `notes/syllabus-map.html is missing a <script> tag for: ${missing.join(', ')}`);
});

// --- The real page -----------------------------------------------------

VIEWPORTS.forEach((viewport) => {
  test(`notes/syllabus-map.html at ${viewport.label}: loads with no console or page errors, and no horizontal scroll`, async (t) => {
    await withPage(t, viewport, async (page, { pageErrors, consoleErrors }) => {
      assert.deepEqual(pageErrors, [], 'no uncaught page errors');
      assert.deepEqual(consoleErrors, [], 'no console.error calls');
      const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      assert.equal(hasHorizontalScroll, false);
    });
  });
});

test('notes/syllabus-map.html: every topic 1-16 appears exactly once, registered ones as an expandable card, 13-16 clearly marked not built', async (t) => {
  await withPage(t, VIEWPORTS[0], async (page) => {
    const { SPEC_POINTS, TOPIC_NAMES, REGISTERED_TOPICS } = require('../src/specPoints');

    for (let number = 1; number <= 16; number += 1) {
      const name = TOPIC_NAMES[number];
      const registered = REGISTERED_TOPICS.includes(number);
      if (registered) {
        const details = page.locator(`#topic-${number}`);
        await assert.doesNotReject(details.waitFor({ state: 'attached' }), `Topic ${number} should render as an expandable card`);
        assert.equal(await details.evaluate((el) => el.tagName), 'DETAILS');
        const summaryText = await details.locator('summary').textContent();
        assert.match(summaryText, new RegExp(`Topic ${number}:\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
      } else {
        const card = page.locator('.syllabus-topic--unbuilt', { hasText: `Topic ${number}: ${name}` });
        await assert.doesNotReject(card.waitFor({ state: 'attached' }), `Topic ${number} (unregistered) should render as a clearly-marked card`);
        const badge = card.locator('.syllabus-status[data-status="not built"]');
        assert.equal(await badge.count(), 1, `Topic ${number} should carry a visible "not built" status chip`);
      }
    }

    // Exactly 16 topic headings/cards, not more, not fewer.
    const registeredCount = await page.locator('#topics-container > details.syllabus-topic').count();
    const unbuiltCount = await page.locator('#topics-container > .syllabus-topic--unbuilt').count();
    assert.equal(registeredCount, REGISTERED_TOPICS.length);
    assert.equal(unbuiltCount, 16 - REGISTERED_TOPICS.length);
    assert.equal(registeredCount + unbuiltCount, 16);
    void SPEC_POINTS; // referenced only for the module to be required once, above
  });
});

test('notes/syllabus-map.html: every SPEC_POINTS code in the registry appears exactly once in the DOM, with a status chip matching the real data', async (t) => {
  await withPage(t, VIEWPORTS[0], async (page) => {
    // Open every registered topic so its points actually render into
    // the accessibility tree / are queryable the same as always — a
    // <details> hides its body visually when closed, but the elements
    // and their dataset attributes are still present in the DOM either
    // way, so this doesn't need the open state for the assertions
    // below; it's done anyway so a human re-running this visually sees
    // the full page, matching how a reviewer would actually check it.
    await page.evaluate(() => document.querySelectorAll('details.syllabus-topic').forEach((d) => (d.open = true)));

    const { buildSyllabusMap } = require('../src/syllabusMap');
    const { SPEC_POINTS, SPEC_POINT_GROUPS, TOPIC_NAMES, REGISTERED_TOPICS } = require('../src/specPoints');
    const { UNITS, getSubtopic } = require('../src/curriculum');
    const { PAGES, isExtensionPage } = require('../src/pages');
    const { getAllQuestionsNode } = require('../src/allQuestions');

    const map = buildSyllabusMap({
      specPoints: SPEC_POINTS,
      specPointGroups: SPEC_POINT_GROUPS,
      topicNames: TOPIC_NAMES,
      registeredTopics: REGISTERED_TOPICS,
      units: UNITS,
      pages: PAGES,
      allQuestions: getAllQuestionsNode(),
      isExtensionPage: (p) => isExtensionPage(p, getSubtopic),
    });

    const expectedStatusByCode = new Map();
    function collect(point) {
      if (point.isGroup) {
        point.children.forEach(collect);
      } else {
        expectedStatusByCode.set(point.code, point.status);
      }
    }
    map.topics.forEach((topic) => {
      if (topic.registered) topic.points.forEach(collect);
    });

    assert.equal(expectedStatusByCode.size, SPEC_POINTS.length, 'sanity check: the real map should cover every SPEC_POINTS entry');

    // [data-depth] picks out atomic points only — a group's own .spec-
    // point also carries data-code (its parent code, e.g. "1.6"), but
    // that parent code is never itself a SPEC_POINTS entry (see
    // src/specPoints.js's own header comment on SPEC_POINT_GROUPS).
    const domCodes = await page.locator('.spec-point[data-depth]').evaluateAll((els) => els.map((el) => el.dataset.code));
    assert.deepEqual(domCodes.slice().sort(), SPEC_POINTS.map((p) => p.code).sort(), 'the DOM should render exactly one .spec-point per registry code, no more, no fewer');
    assert.equal(new Set(domCodes).size, domCodes.length, 'no code should be rendered twice');

    // Spot-check every point's own status chip against the real data —
    // not just that the code is present, but that what it claims is
    // true.
    for (const [code, expectedStatus] of expectedStatusByCode) {
      const li = page.locator(`.spec-point[data-code="${code}"]`);
      const chipStatus = await li.locator('> .spec-point-header > .syllabus-status').first().textContent();
      assert.equal(chipStatus.trim(), expectedStatus, `${code}'s status chip should read "${expectedStatus}"`);
      assert.equal(await li.getAttribute('data-status'), expectedStatus);
    }
  });
});

test('notes/syllabus-map.html: the coverage bar\'s legend numbers match the real overall summary', async (t) => {
  await withPage(t, VIEWPORTS[0], async (page) => {
    const { buildSyllabusMap } = require('../src/syllabusMap');
    const { SPEC_POINTS, SPEC_POINT_GROUPS, TOPIC_NAMES, REGISTERED_TOPICS } = require('../src/specPoints');
    const { UNITS, getSubtopic } = require('../src/curriculum');
    const { PAGES, isExtensionPage } = require('../src/pages');
    const { getAllQuestionsNode } = require('../src/allQuestions');
    const map = buildSyllabusMap({
      specPoints: SPEC_POINTS,
      specPointGroups: SPEC_POINT_GROUPS,
      topicNames: TOPIC_NAMES,
      registeredTopics: REGISTERED_TOPICS,
      units: UNITS,
      pages: PAGES,
      allQuestions: getAllQuestionsNode(),
      isExtensionPage: (p) => isExtensionPage(p, getSubtopic),
    });

    // Legend items run together with no separator between them in
    // .textContent ("Covered: 130Partly covered: 2..."), so a trailing
    // \b (a word/non-word boundary) wouldn't fire between a digit and
    // the next item's leading letter — both are \w. (?!\d) checks what
    // actually matters here: no more digits follow, so this isn't a
    // partial match against a longer number.
    const legendText = await page.locator('#coverage-bar-container .coverage-bar-legend').textContent();
    assert.match(legendText, new RegExp(`Covered:\\s*${map.summary.covered}(?!\\d)`));
    assert.match(legendText, new RegExp(`Partly covered:\\s*${map.summary.partlyCovered}(?!\\d)`));
    assert.match(legendText, new RegExp(`Not built:\\s*${map.summary.notBuilt}(?!\\d)`));

    const ariaLabel = await page.locator('#coverage-bar-container .coverage-bar').getAttribute('aria-label');
    assert.match(ariaLabel, new RegExp(`${map.summary.covered} covered`));
    assert.match(ariaLabel, new RegExp(`out of ${map.summary.total} spec points`));
  });
});

// Checks that every visible top-level .spec-point (standalone atomic
// point, or group) is legitimately visible under `predicate`: a
// standalone point must match `predicate` itself; a group only needs
// one child to (its other children render too, as context for the
// partial/not-built state — see notes/syllabus-map.js's own comment on
// pointMatches) — so a non-matching sibling inside a matching group is
// never an "offender".
function findFilterOffenders(page, predicateSource) {
  return page.evaluate((src) => {
    // eslint-disable-next-line no-new-func
    const predicate = new Function('el', `return (${src})(el);`);
    const topLevel = Array.from(
      document.querySelectorAll('#topics-container > details.syllabus-topic > .syllabus-topic-body > .spec-point-list > .spec-point')
    ).filter((li) => li.offsetParent !== null);

    const offenders = [];
    topLevel.forEach((li) => {
      if (li.dataset.depth) {
        // Standalone atomic point.
        if (!predicate(li)) offenders.push(li.dataset.code);
        return;
      }
      // A group: legitimate as long as at least one child matches.
      const children = Array.from(li.querySelectorAll(':scope > .spec-point-children > .spec-point'));
      if (!children.some(predicate)) offenders.push(li.dataset.code);
    });
    return offenders;
  }, predicateSource);
}

test('notes/syllabus-map.html: "show me what isn\'t built" hides every fully-covered topic and only shows genuinely not-built points (or groups containing one)', async (t) => {
  await withPage(t, VIEWPORTS[1], async (page) => {
    await page.locator('#filter-not-built').check();
    await page.waitForTimeout(100);

    const status = await page.locator('#filter-status').textContent();
    assert.match(status, /^Showing \d+ matching points?, across \d+ topics?\.$/);

    // Topic 2 (The lunar disc) is fully covered in the real data — it
    // should be hidden entirely under this filter.
    assert.equal(await page.locator('#topic-2').isVisible(), false);

    const offenders = await findFilterOffenders(page, "el => el.dataset.status === 'not built'");
    assert.deepEqual(offenders, [], 'every visible top-level point should itself be not-built, or be a group containing one');
  });
});

test('notes/syllabus-map.html: "show me points without questions" only surfaces covered be-able-to points with zero questions (or groups containing one)', async (t) => {
  await withPage(t, VIEWPORTS[1], async (page) => {
    await page.locator('#filter-no-questions').check();
    await page.waitForTimeout(100);

    const offenders = await findFilterOffenders(page, "el => el.dataset.hasQuestions === 'false'");
    assert.deepEqual(offenders, [], 'every visible top-level point should itself have hasQuestions "false", or be a group containing one');
  });
});

test('notes/syllabus-map.html: combining both filters shows the union — anything not-built OR missing questions — and surfaces more than either filter alone', async (t) => {
  await withPage(t, VIEWPORTS[1], async (page) => {
    // Not-built and "missing questions" are mutually exclusive states
    // (a question count is only ever computed for a covered point), so
    // an AND between the two filters would always show nothing at all
    // — the filters are a union instead ("anything needing attention").
    await page.locator('#filter-not-built').check();
    await page.locator('#filter-no-questions').check();
    await page.waitForTimeout(100);

    const offenders = await findFilterOffenders(page, "el => el.dataset.status === 'not built' || el.dataset.hasQuestions === 'false'");
    assert.deepEqual(offenders, []);

    const bothCount = Number((await page.locator('#filter-status').textContent()).match(/Showing (\d+)/)[1]);
    await page.locator('#filter-no-questions').uncheck();
    await page.waitForTimeout(100);
    const notBuiltOnlyCount = Number((await page.locator('#filter-status').textContent()).match(/Showing (\d+)/)[1]);
    assert.ok(bothCount > notBuiltOnlyCount, 'checking both boxes should surface more points than "not built" alone');
  });
});
