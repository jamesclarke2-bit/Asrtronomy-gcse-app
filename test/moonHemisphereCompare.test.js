/**
 * notes/moon-structure.html's "Near side and far side" section: the two
 * original SVG illustrations (#moon-near-side, #moon-far-side) and
 * their tap-to-reveal regions are JS-drawn, so whether each region
 * exists, reveals the right name, and lays out side-by-side at iPad
 * width / stacked at phone width is runtime DOM/layout state a real
 * browser has to check (same reasoning as test/pictureQuestions.test.js
 * and test/noHorizontalScroll.test.js).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');

const MOON_PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'moon-structure.html');

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/moonHemisphereCompare.test.js');

async function withPage(t, viewport, run) {
  let browser;
  try {
    browser = await launchChromium();
  } catch (err) {
    skip(t, SKIP_MESSAGE(err));
    return;
  }
  try {
    const page = await browser.newPage({ viewport });
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));
    await page.goto(MOON_PAGE_URL);
    await page.waitForTimeout(200);
    await run(page, consoleErrors);
  } finally {
    await browser.close();
  }
}

// [svgId, term, position fraction of the 0-300 viewBox] for each
// tappable region in the two illustrations.
const REGIONS = [
  ['moon-near-side', 'nearSideHighlands', 150, 20],
  ['moon-near-side', 'nearSideMaria', 95, 150],
  ['moon-far-side', 'farSideHighlands', 150, 20],
  ['moon-far-side', 'southPoleAitken', 150, 232],
  ['moon-far-side', 'farSideMaria', 190, 72],
];

test('notes/moon-structure.html: both hemisphere illustrations draw their regions with no console errors', async (t) => {
  await withPage(t, { width: 1024, height: 900 }, async (page, consoleErrors) => {
    const nearRegions = await page.locator('#moon-near-side .diagram-region').count();
    const farRegions = await page.locator('#moon-far-side .diagram-region').count();
    assert.equal(nearRegions, 2, 'near side should have a highlands region and a maria region');
    assert.equal(farRegions, 3, 'far side should have a highlands region, the Aitken basin, and a maria region');
    assert.deepEqual(consoleErrors, [], 'drawing the two illustrations should not log any console errors');
  });
});

REGIONS.forEach(([svgId, term, vx, vy]) => {
  test(`notes/moon-structure.html: tapping the ${term} region reveals its name`, async (t) => {
    await withPage(t, { width: 1024, height: 900 }, async (page) => {
      const definition = page.locator(`.glossary-definition[data-term="${term}"]`);
      assert.equal(await definition.evaluate((el) => el.hidden), true, `${term}'s definition should start hidden`);

      const svg = page.locator(`#${svgId}`);
      const box = await svg.boundingBox();
      await svg.click({ position: { x: box.width * (vx / 300), y: box.height * (vy / 300) } });

      assert.equal(await definition.evaluate((el) => el.hidden), false, `${term}'s definition should be revealed after tapping its region`);
      const text = (await definition.textContent()).trim();
      assert.ok(text.length > 0, `${term}'s revealed text should not be empty`);
    });
  });
});

test('notes/moon-structure.html: a region is keyboard-accessible (focus + Enter)', async (t) => {
  await withPage(t, { width: 1024, height: 900 }, async (page) => {
    const region = page.locator('#moon-near-side .diagram-region[data-term="nearSideHighlands"]');
    await region.focus();
    await page.keyboard.press('Enter');
    const hidden = await page
      .locator('.glossary-definition[data-term="nearSideHighlands"]')
      .evaluate((el) => el.hidden);
    assert.equal(hidden, false, 'Enter on a focused region should reveal its definition, same as a click');
  });
});

test('notes/moon-structure.html at iPad width (768px): the two illustrations sit side by side', async (t) => {
  await withPage(t, { width: 768, height: 1024 }, async (page) => {
    const figures = page.locator('.moon-hemisphere-figure');
    const firstBox = await figures.nth(0).boundingBox();
    const secondBox = await figures.nth(1).boundingBox();
    assert.equal(firstBox.y, secondBox.y, 'both illustrations should be on the same row at iPad width');
    assert.ok(secondBox.x > firstBox.x, 'the far-side figure should be to the right of the near-side one');
  });
});

test('notes/moon-structure.html at phone width (390px): the two illustrations stack', async (t) => {
  await withPage(t, { width: 390, height: 900 }, async (page) => {
    const figures = page.locator('.moon-hemisphere-figure');
    const firstBox = await figures.nth(0).boundingBox();
    const secondBox = await figures.nth(1).boundingBox();
    assert.ok(secondBox.y > firstBox.y, 'the far-side figure should be below the near-side one at phone width');
  });
});

test('notes/moon-structure.html: the near/far-side captions state the maria-coverage figures, marked first draft', async (t) => {
  await withPage(t, { width: 1024, height: 900 }, async (page) => {
    const captions = await page.locator('.moon-hemisphere-figure figcaption').allTextContents();
    assert.equal(captions.length, 2);
    assert.match(captions[0], /31%/);
    assert.match(captions[1], /2%/);
    captions.forEach((caption) => {
      assert.match(caption, /first draft, to be checked by the teacher/);
    });
  });
});
