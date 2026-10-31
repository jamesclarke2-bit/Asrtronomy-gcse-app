/**
 * notes/naked-eye-sky.html's two phenomena-grid UI pieces, both needing
 * a real browser (same reasoning as test/pictureQuestions.test.js):
 *
 * 1. The tappable picture grid's own explanation card: opens beneath the
 *    tapped tile's row (a bottom sheet fixed to the screen on a phone),
 *    highlights the selected tile, steps through all 14 with Previous/
 *    Next, and is keyboard/screen-reader operable.
 * 2. The "Which is it?" picture-tap game: a clue, six tappable pictures,
 *    instant feedback, and a shared tally — a full round makes every
 *    picture the correct answer exactly once.
 *
 * Checked at a phone width (390px, matching test/noHorizontalScroll
 * .test.js's convention) and an iPad width (768px), since the task that
 * added this asked for both explicitly.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'naked-eye-sky.html');

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/nakedEyeSkyPhenomenaUI.test.js');

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
    await page.goto(PAGE_URL);
    await page.waitForTimeout(150);
    await run(page);
  } finally {
    await browser.close();
  }
}

function hasHorizontalScroll(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
}

// --- The phenomena picture grid's explanation card ------------------------

VIEWPORTS.forEach((viewport) => {
  test(`notes/naked-eye-sky.html phenomena card at ${viewport.label}: opens beneath the tapped tile's own row, highlights it, and causes no horizontal scroll`, async (t) => {
    await withPage(t, viewport, async (page) => {
      assert.equal(await hasHorizontalScroll(page), false, 'no horizontal scroll before opening the card');

      const tile = page.locator('.phenomena-tile[data-key="planets"]');
      await tile.click();
      await page.waitForTimeout(150);

      assert.equal(await hasHorizontalScroll(page), false, 'no horizontal scroll after opening the card');
      await assert.doesNotReject(page.locator('#phenomena-card').waitFor({ state: 'visible' }));
      assert.equal(await page.locator('#phenomena-card-title').textContent(), 'Planet');
      assert.match(await page.locator('.phenomena-card-tell').textContent(), /drifting slowly against the stars/);
      assert.match(await page.locator('.phenomena-card-body').textContent(), /zodiacal band/);
      assert.ok(await tile.evaluate((el) => el.classList.contains('is-selected')), 'the tapped tile should be highlighted');
      assert.equal(await tile.getAttribute('aria-expanded'), 'true');

      // The card should be a sibling of the grid tiles, inserted right
      // after the last tile in the tapped tile's own row — not appended
      // at the very end of the whole 14-tile grid.
      const cardIsLastChild = await page.evaluate(() => {
        const grid = document.getElementById('phenomena-grid');
        return grid.lastElementChild.id === 'phenomena-card';
      });
      assert.equal(cardIsLastChild, false, "the card shouldn't land after every tile — 'planets' isn't in the grid's last row");

      // On a phone this becomes a bottom sheet fixed to the viewport;
      // on the iPad width it stays a normal row inside the grid.
      const position = await page.locator('#phenomena-card').evaluate((el) => getComputedStyle(el).position);
      if (viewport.width <= 600) {
        assert.equal(position, 'fixed', 'a phone should get the card as a fixed bottom sheet');
      } else {
        assert.equal(position, 'static', 'the iPad width should keep the card inline in the grid');
      }
    });
  });

  test(`notes/naked-eye-sky.html phenomena card at ${viewport.label}: Previous/Next step through all 14, Close returns focus to the tile`, async (t) => {
    await withPage(t, viewport, async (page) => {
      await page.locator('.phenomena-tile[data-key="sun"]').click();
      await page.waitForTimeout(100);
      assert.equal(await page.locator('#phenomena-card-title').textContent(), 'The Sun');
      assert.ok(await page.locator('.phenomena-card-prev').isDisabled(), 'Previous should be disabled on the first picture');

      await page.locator('.phenomena-card-next').click();
      await page.waitForTimeout(100);
      assert.equal(await page.locator('#phenomena-card-title').textContent(), 'The Moon');
      assert.equal(await page.locator('.phenomena-card-position').textContent(), '2 of 14');
      assert.ok(await page.locator('.phenomena-tile[data-key="moon"]').evaluate((el) => el.classList.contains('is-selected')));
      assert.equal(await page.locator('.phenomena-tile[data-key="sun"]').evaluate((el) => el.classList.contains('is-selected')), false);

      await page.locator('.phenomena-card-prev').click();
      await page.waitForTimeout(100);
      assert.equal(await page.locator('#phenomena-card-title').textContent(), 'The Sun');

      await page.locator('.phenomena-card-close').click();
      await page.waitForTimeout(100);
      assert.equal(await page.locator('#phenomena-card').count(), 0, 'the card should be gone after Close');
      const focused = await page.evaluate(() => document.activeElement.dataset.key);
      assert.equal(focused, 'sun', 'focus should return to the tile that opened the card');
    });
  });

  test(`notes/naked-eye-sky.html phenomena card at ${viewport.label}: keyboard-only (Enter opens, Escape closes and returns focus)`, async (t) => {
    await withPage(t, viewport, async (page) => {
      await page.locator('.phenomena-tile[data-key="comets"]').focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);
      assert.equal(await page.locator('#phenomena-card-title').textContent(), 'Comet');

      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
      assert.equal(await page.locator('#phenomena-card').count(), 0, 'Escape should close the card');
      const focused = await page.evaluate(() => document.activeElement.dataset.key);
      assert.equal(focused, 'comets');
    });
  });
});

// --- The "Which is it?" picture-tap game ----------------------------------

async function openWhichIsItPanel(page) {
  await page.locator('#which-is-it-quiz-summary').click();
  await page.waitForTimeout(100);
}

VIEWPORTS.forEach((viewport) => {
  test(`notes/naked-eye-sky.html "Which is it?" at ${viewport.label}: tapping a picture gives instant feedback, causes no horizontal scroll`, async (t) => {
    await withPage(t, viewport, async (page) => {
      await openWhichIsItPanel(page);
      assert.equal(await hasHorizontalScroll(page), false, 'no horizontal scroll with the panel open');

      assert.equal(await page.locator('.which-is-it-option').count(), 6, 'should offer six tappable pictures');
      await page.locator('.which-is-it-option').first().click();
      await page.waitForTimeout(100);

      assert.equal(await hasHorizontalScroll(page), false, 'no horizontal scroll after answering');
      assert.equal(await page.locator('.which-is-it-option:is(.is-correct, .is-incorrect)').count() >= 1, true, 'at least the correct option should be marked');
      assert.equal(await page.locator('.which-is-it-option.is-correct').count(), 1, 'exactly one option should be marked correct');
      const feedback = await page.locator('.which-is-it-feedback').textContent();
      assert.match(feedback, /^(Correct!|Not quite\.)/);
      assert.ok(await page.locator('.which-is-it-option').first().isDisabled(), 'options should be locked after answering');
      await assert.doesNotReject(page.locator('.which-is-it-next').waitFor({ state: 'visible' }));
    });
  });

  test(`notes/naked-eye-sky.html "Which is it?" at ${viewport.label}: keyboard-only play (Tab to an option, Enter to answer)`, async (t) => {
    await withPage(t, viewport, async (page) => {
      await openWhichIsItPanel(page);
      await page.locator('.which-is-it-option').first().focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);
      assert.equal(await page.locator('.which-is-it-option.is-correct').count(), 1);
      // Focus should have moved onto the Next-question button, so a
      // keyboard-only student can keep going with Enter alone.
      const focusedClass = await page.evaluate(() => document.activeElement.className);
      assert.match(focusedClass, /which-is-it-next/);
    });
  });
});

test('notes/naked-eye-sky.html "Which is it?": a full round makes every one of the 14 pictures the correct answer exactly once, and the shared tally updates', async (t) => {
  await withPage(t, VIEWPORTS[0], async (page) => {
    await openWhichIsItPanel(page);

    const progressBefore = await page.locator('#progress-list li', { hasText: 'u1.1 ' }).first().textContent();
    const attemptsBefore = Number(progressBefore.match(/(\d+)\/(\d+) correct/)[2]);

    const correctTitles = [];
    for (let i = 0; i < 14; i += 1) {
      await assert.doesNotReject(page.locator('.which-is-it-clue').waitFor({ state: 'visible' }));
      await page.locator('.which-is-it-option').first().click();
      await page.waitForTimeout(80);
      const correctTitle = await page.locator('.which-is-it-option.is-correct .which-is-it-option-title').textContent();
      correctTitles.push(correctTitle);
      const next = page.locator('.which-is-it-next');
      if (await next.count()) {
        await next.click();
        await page.waitForTimeout(80);
      }
    }

    assert.equal(new Set(correctTitles).size, 14, 'every correct picture across the round should be distinct');

    await assert.doesNotReject(page.locator('.which-is-it-feedback', { hasText: 'Round complete' }).waitFor({ state: 'visible' }));

    const progressAfter = await page.locator('#progress-list li', { hasText: 'u1.1 ' }).first().textContent();
    const attemptsAfter = Number(progressAfter.match(/(\d+)\/(\d+) correct/)[2]);
    assert.equal(attemptsAfter, attemptsBefore + 14, 'u1.1 attempts should have gone up by 14 over the round');

    const badge = (await page.locator('#which-is-it-quiz-summary .quiz-panel-count').textContent()).trim();
    assert.match(badge, /^\d+\/14 correct$/, 'the panel\'s own live badge should reflect the round out of 14');
  });
});
