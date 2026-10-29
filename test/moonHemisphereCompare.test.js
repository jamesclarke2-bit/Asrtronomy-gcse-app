/**
 * notes/moon-structure.html's "Near side and far side" section: two
 * original SVG illustrations in the same realistic style as the page's
 * main near-side map. #moon-near-side redraws that same map (drawMoonMap)
 * with its labels hidden, so tapping a region reveals the same named-
 * feature definitions as "Recognise the named features" above. #moon-far-side
 * is a new drawing with its own, first-draft features (the South
 * Pole-Aitken basin, Mare Moscoviense, Mare Ingenii and Tsiolkovskiy).
 * Whether each region exists, reveals the right name, and lays out
 * side-by-side at iPad width / stacked at phone width is runtime
 * DOM/layout state a real browser has to check (same reasoning as
 * test/pictureQuestions.test.js and test/noHorizontalScroll.test.js).
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

// Clicks a region by dispatching the same 'click' event glossary.js
// listens for, rather than hit-testing a pixel position: these regions
// are irregular blurred mare outlines and ray-crater shapes, so a
// bounding-box-centre click can land outside the filled shape.
async function clickRegion(page, svgId, term) {
  await page.locator(`#${svgId} [data-term="${term}"]`).evaluate((el) => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

const NEAR_SIDE_TERMS = ['tranquility', 'crises', 'storms', 'tycho', 'copernicus', 'kepler', 'apennines'];
const FAR_SIDE_TERMS = ['southPoleAitken', 'farSideMoscoviense', 'farSideIngenii', 'farSideTsiolkovskiy'];

test('notes/moon-structure.html: both hemisphere illustrations draw their regions with no console errors', async (t) => {
  await withPage(t, { width: 1024, height: 900 }, async (page, consoleErrors) => {
    const nearRegions = await page.locator('#moon-near-side .diagram-region').count();
    const farRegions = await page.locator('#moon-far-side .diagram-region').count();
    assert.equal(nearRegions, NEAR_SIDE_TERMS.length, 'near side should redraw the main map\'s named-feature regions');
    assert.equal(farRegions, FAR_SIDE_TERMS.length, 'far side should have the basin, Tsiolkovskiy, and its two named maria');
    assert.deepEqual(consoleErrors, [], 'drawing the two illustrations should not log any console errors');
  });
});

NEAR_SIDE_TERMS.forEach((term) => {
  test(`notes/moon-structure.html: tapping the ${term} region on the near-side illustration reveals its name`, async (t) => {
    await withPage(t, { width: 1024, height: 900 }, async (page) => {
      const definition = page.locator(`.glossary-definition[data-term="${term}"]`);
      assert.equal(await definition.evaluate((el) => el.hidden), true, `${term}'s definition should start hidden`);

      await clickRegion(page, 'moon-near-side', term);

      assert.equal(await definition.evaluate((el) => el.hidden), false, `${term}'s definition should be revealed after tapping its region`);
      const text = (await definition.textContent()).trim();
      assert.ok(text.length > 0, `${term}'s revealed text should not be empty`);
    });
  });
});

FAR_SIDE_TERMS.forEach((term) => {
  test(`notes/moon-structure.html: tapping the ${term} region on the far-side illustration reveals its name`, async (t) => {
    await withPage(t, { width: 1024, height: 900 }, async (page) => {
      const definition = page.locator(`.glossary-definition[data-term="${term}"]`);
      assert.equal(await definition.evaluate((el) => el.hidden), true, `${term}'s definition should start hidden`);

      await clickRegion(page, 'moon-far-side', term);

      assert.equal(await definition.evaluate((el) => el.hidden), false, `${term}'s definition should be revealed after tapping its region`);
      const text = (await definition.textContent()).trim();
      assert.ok(text.length > 0, `${term}'s revealed text should not be empty`);
      assert.match(text, /first draft, to be checked by the teacher/, `${term}'s definition should be marked first draft`);
    });
  });
});

test('notes/moon-structure.html: a region is keyboard-accessible (focus + Enter)', async (t) => {
  await withPage(t, { width: 1024, height: 900 }, async (page) => {
    const region = page.locator('#moon-near-side [data-term="tycho"]');
    await region.focus();
    await page.keyboard.press('Enter');
    const hidden = await page
      .locator('.glossary-definition[data-term="tycho"]')
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

test('notes/moon-structure.html: the near-side and far-side illustrations render at the same size as each other', async (t) => {
  await withPage(t, { width: 1024, height: 900 }, async (page) => {
    const nearBox = await page.locator('#moon-near-side').boundingBox();
    const farBox = await page.locator('#moon-far-side').boundingBox();
    assert.ok(nearBox.width > 0 && farBox.width > 0, 'both illustrations should render with non-zero width');
    assert.ok(Math.abs(nearBox.width - farBox.width) < 1, 'the two illustrations should be drawn at the same width');
    assert.ok(Math.abs(nearBox.height - farBox.height) < 1, 'the two illustrations should be drawn at the same height');
  });
});
