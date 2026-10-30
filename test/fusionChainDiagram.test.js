/**
 * notes/sun-features.html's "The Sun's structure" core panel: the
 * proton-proton chain step-through diagram. It's JS-drawn at runtime
 * (an empty <svg> in the static markup, filled in by
 * drawFusionChainStep in notes/sun-features.js), so whether each
 * step actually draws the right number of nuclei, whether "Next step"
 * cycles correctly, and whether it stays inside its own viewBox is
 * runtime DOM state a real browser has to check — same reasoning as
 * test/earthAtmosphereDiagrams.test.js.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'sun-features.html');

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/fusionChainDiagram.test.js');

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
    await page.goto(PAGE_URL);
    await page.waitForTimeout(200);
    await page.locator('.diagram-region[data-term="core"]').first().click();
    await page.waitForTimeout(100);
    await run(page, consoleErrors);
  } finally {
    await browser.close();
  }
}

// [expected step caption substring, expected nuclei-circle count]
const EXPECTED_STEPS = [
  ['two pairs of protons fuse into two deuterium nuclei', 10],
  ['each deuterium nucleus fuses with a proton', 8],
  ['two helium-3 nuclei fuse into one helium-4 nucleus', 5],
];

test('notes/sun-features.html: the core panel opens to step 1 of 3, with no console errors', async (t) => {
  await withPage(t, { width: 1024, height: 1000 }, async (page, consoleErrors) => {
    const caption = await page.locator('#fusion-chain-step-caption').textContent();
    assert.match(caption, /two pairs of protons fuse into two deuterium nuclei/);
    const circles = await page.locator('#fusion-chain-diagram circle').count();
    assert.equal(circles, 10);
    assert.deepEqual(consoleErrors, []);
  });
});

test('notes/sun-features.html: "Next step" cycles through all three steps and loops back to step 1', async (t) => {
  await withPage(t, { width: 1024, height: 1000 }, async (page) => {
    for (const [expectedSubstring, expectedCircles] of EXPECTED_STEPS) {
      const caption = await page.locator('#fusion-chain-step-caption').textContent();
      assert.match(caption, new RegExp(expectedSubstring));
      const circles = await page.locator('#fusion-chain-diagram circle').count();
      assert.equal(circles, expectedCircles, `expected ${expectedCircles} nuclei for "${expectedSubstring}"`);
      await page.locator('#fusion-chain-next').click();
      await page.waitForTimeout(50);
    }
    // Having clicked through all 3 steps, we're back at step 1.
    const caption = await page.locator('#fusion-chain-step-caption').textContent();
    assert.match(caption, new RegExp(EXPECTED_STEPS[0][0]));
  });
});

test('notes/sun-features.html: the fusion-chain diagram stays inside its own viewBox on every step', async (t) => {
  await withPage(t, { width: 1024, height: 1000 }, async (page) => {
    for (let i = 0; i < EXPECTED_STEPS.length; i += 1) {
      const result = await page.evaluate(() => {
        const svg = document.getElementById('fusion-chain-diagram');
        const vb = svg.viewBox.baseVal;
        const shapes = Array.from(svg.querySelectorAll('circle, text, line'));
        let maxRight = 0;
        let maxBottom = 0;
        let minLeft = Infinity;
        let minTop = Infinity;
        shapes.forEach((el) => {
          const b = el.getBBox();
          maxRight = Math.max(maxRight, b.x + b.width);
          maxBottom = Math.max(maxBottom, b.y + b.height);
          minLeft = Math.min(minLeft, b.x);
          minTop = Math.min(minTop, b.y);
        });
        return { viewBoxWidth: vb.width, viewBoxHeight: vb.height, maxRight, maxBottom, minLeft, minTop };
      });
      assert.ok(result.maxRight <= result.viewBoxWidth, `step ${i}: content overflows right edge`);
      assert.ok(result.maxBottom <= result.viewBoxHeight, `step ${i}: content overflows bottom edge`);
      assert.ok(result.minLeft >= 0, `step ${i}: content overflows left edge`);
      assert.ok(result.minTop >= 0, `step ${i}: content overflows top edge`);
      await page.locator('#fusion-chain-next').click();
      await page.waitForTimeout(50);
    }
  });
});

test('notes/sun-features.html: the net-result line and first-draft note are present', async (t) => {
  await withPage(t, { width: 1024, height: 1000 }, async (page) => {
    const netResult = await page.locator('.fusion-chain-net').textContent();
    assert.match(netResult, /four protons become one helium-4 nucleus/);
    assert.match(netResult, /0\.7%/);
    const note = await page.locator('.fusion-chain .note').textContent();
    assert.match(note, /first draft, to be checked by the teacher/i);
  });
});

test('notes/sun-features.html: "Next step" is a real keyboard-operable button', async (t) => {
  await withPage(t, { width: 1024, height: 1000 }, async (page) => {
    const button = page.locator('#fusion-chain-next');
    assert.equal(await button.evaluate((el) => el.tagName), 'BUTTON');
    await button.focus();
    await page.keyboard.press('Enter');
    const caption = await page.locator('#fusion-chain-step-caption').textContent();
    assert.match(caption, /each deuterium nucleus fuses with a proton/);
  });
});

[{ width: 390, height: 900, label: 'phone (390px)' }, { width: 768, height: 1024, label: 'iPad (768px)' }].forEach((viewport) => {
  test(`notes/sun-features.html at ${viewport.label}: the core panel opens with no horizontal scroll or console errors`, async (t) => {
    await withPage(t, viewport, async (page, consoleErrors) => {
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      assert.equal(scrollWidth, clientWidth, 'no horizontal overflow');
      assert.deepEqual(consoleErrors, []);
    });
  });
});
