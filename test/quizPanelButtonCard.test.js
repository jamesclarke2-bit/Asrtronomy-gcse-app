/**
 * Every folded practice-question panel (notes/earth-structure.html's
 * "name that line", notes/moon-structure.html's "name that feature",
 * notes/naked-eye-sky.html's "name that pattern", and the "More
 * practice" panels on sims/coordinates.html and
 * sims/equation-of-time.html) shares one button-card <summary> style
 * (see styles.css's .quiz-panel-summary) instead of a quiet line of
 * text: an icon, a bold title, a live "X/N correct" pill, and a
 * chevron that turns when the panel opens. Checked as actually
 * rendered, since the live pill text and the chevron's rotation are
 * runtime facts a real browser has to compute.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');

const { skip } = trackSkips('test/quizPanelButtonCard.test.js');

const PAGES = [
  { label: 'earth-structure', url: 'file://' + path.join(__dirname, '..', 'notes', 'earth-structure.html') },
  { label: 'moon-structure', url: 'file://' + path.join(__dirname, '..', 'notes', 'moon-structure.html') },
  { label: 'naked-eye-sky', url: 'file://' + path.join(__dirname, '..', 'notes', 'naked-eye-sky.html') },
  { label: 'coordinates', url: 'file://' + path.join(__dirname, '..', 'sims', 'coordinates.html') },
  { label: 'equation-of-time', url: 'file://' + path.join(__dirname, '..', 'sims', 'equation-of-time.html') },
];

async function withPage(t, run) {
  let browser;
  try {
    browser = await launchChromium();
  } catch (err) {
    skip(t, `Chromium isn't available in this environment (${err.message})`);
    return;
  }
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    await run(page);
  } finally {
    await browser.close();
  }
}

PAGES.forEach((pageDef) => {
  test(`${pageDef.label}: the folded panel's summary is a button-card at least 44px tall, with an icon, a bold title, and a live correct-count pill`, async (t) => {
    await withPage(t, async (page) => {
      await page.goto(pageDef.url);
      await page.waitForTimeout(200);

      const summary = page.locator('.quiz-panel-summary').first();
      await assert.doesNotReject(summary.waitFor({ state: 'attached' }));

      const state = await summary.evaluate((el) => {
        const icon = el.querySelector('.quiz-panel-icon');
        const title = el.querySelector('.quiz-panel-title');
        const count = el.querySelector('.quiz-panel-count');
        const chevron = el.querySelector('.quiz-panel-chevron');
        const cs = getComputedStyle(el);
        return {
          height: el.getBoundingClientRect().height,
          hasIcon: Boolean(icon),
          titleText: title ? title.textContent.trim() : null,
          titleWeight: title ? Number(getComputedStyle(title).fontWeight) : null,
          countText: count ? count.textContent.trim() : null,
          hasChevron: Boolean(chevron),
          borderWidth: parseFloat(cs.borderTopWidth),
          cursor: cs.cursor,
        };
      });

      assert.ok(state.height >= 44, `summary should be at least 44px tall, got ${state.height}`);
      assert.ok(state.hasIcon, 'summary should contain a .quiz-panel-icon');
      assert.ok(state.titleText && state.titleText.length > 0, 'summary should contain a non-empty .quiz-panel-title');
      assert.ok(state.titleWeight >= 600, `title should read as bold (font-weight >= 600), got ${state.titleWeight}`);
      assert.match(state.countText, /^\d+\/\d+ correct$/, `count pill should read "X/N correct", got "${state.countText}"`);
      assert.ok(state.hasChevron, 'summary should contain a .quiz-panel-chevron');
      assert.ok(state.borderWidth > 0, 'summary should have a visible border');
      assert.equal(state.cursor, 'pointer');
    });
  });

  test(`${pageDef.label}: the chevron turns when the panel opens`, async (t) => {
    await withPage(t, async (page) => {
      await page.goto(pageDef.url);
      await page.waitForTimeout(200);

      const chevron = page.locator('.quiz-panel-chevron').first();
      const closedTransform = await chevron.evaluate((el) => getComputedStyle(el).transform);

      await page.locator('.quiz-panel-summary').first().click();
      await page.waitForTimeout(250);
      const openTransform = await chevron.evaluate((el) => getComputedStyle(el).transform);

      assert.notEqual(openTransform, closedTransform, 'chevron transform should change once the panel is open');
    });
  });

  test(`${pageDef.label}: the summary has a visible focus state`, async (t) => {
    await withPage(t, async (page) => {
      await page.goto(pageDef.url);
      await page.waitForTimeout(200);

      const summary = page.locator('.quiz-panel-summary').first();
      const before = await summary.evaluate((el) => getComputedStyle(el).outlineStyle);
      await summary.focus();
      const after = await summary.evaluate((el) => getComputedStyle(el).outlineStyle);

      assert.equal(before, 'none', 'no visible outline before focus');
      assert.notEqual(after, 'none', 'a visible outline should appear on keyboard focus');
    });
  });
});
