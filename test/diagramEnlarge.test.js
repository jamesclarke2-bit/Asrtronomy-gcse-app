/**
 * diagramEnlarge.js gives every .diagram, .labelled-diagram-wrap and
 * .question-diagram on a notes/sims page a small "Enlarge" button. A
 * real browser check (Playwright, same engine scripts/screenshots.js
 * already uses), since button wiring, <dialog> open/close behaviour and
 * rendered size are exactly what a DOM shim or raw-HTML parse can't see.
 *
 * Checked at both a phone width (390px, same convention as
 * test/noHorizontalScroll.test.js) and an iPad width (768px).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');

const ROOT = path.join(__dirname, '..');

function listHtmlFiles() {
  const dirs = ['notes', 'sims'];
  const files = [];
  dirs.forEach((dir) => {
    fs.readdirSync(path.join(ROOT, dir))
      .filter((f) => f.endsWith('.html'))
      .forEach((f) => files.push(path.posix.join(dir, f)));
  });
  return files;
}

const PAGES = listHtmlFiles();
const WIDTHS = [
  { label: 'phone', width: 390, height: 800 },
  { label: 'iPad', width: 768, height: 1024 },
];

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/diagramEnlarge.test.js');

let browser;
let launchError;

test.before(async () => {
  try {
    browser = await launchChromium();
  } catch (err) {
    launchError = err;
  }
});

test.after(async () => {
  if (browser) await browser.close();
});

async function openPage(href, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto('file://' + path.join(ROOT, href));
  await page.waitForTimeout(300);
  return page;
}

PAGES.forEach((href) => {
  test(`${href}: every diagram has exactly one Enlarge button, no duplicates`, async (t) => {
    if (launchError) {
      skip(t, SKIP_MESSAGE(launchError));
      return;
    }
    const page = await openPage(href, 390, 800);
    try {
      const counts = await page.evaluate(() => ({
        rawDiagrams: document.querySelectorAll('.diagram, .labelled-diagram-wrap, .question-diagram').length,
        sources: document.querySelectorAll('.diagram-enlarge-source').length,
        buttons: document.querySelectorAll('.diagram-enlarge-button').length,
      }));
      assert.equal(counts.buttons, counts.sources, `${href}: every .diagram-enlarge-source should have exactly one button`);
      if (counts.rawDiagrams > 0) {
        assert.ok(counts.sources > 0, `${href}: has a diagram but no .diagram-enlarge-source was wired up`);
      } else {
        assert.equal(counts.sources, 0, `${href}: has no diagram but somehow has an enlarge source`);
      }
    } finally {
      await page.close();
    }
  });
});

PAGES.forEach((href) => {
  WIDTHS.forEach(({ label, width, height }) => {
    test(`${href} at ${label} width: Enlarge opens a bigger dialog, closes by button/Escape/outside tap`, async (t) => {
      if (launchError) {
        skip(t, SKIP_MESSAGE(launchError));
        return;
      }
      const page = await openPage(href, width, height);
      try {
        const buttonCount = await page.locator('.diagram-enlarge-button:visible').count();
        if (buttonCount === 0) {
          t.skip(`${href} has no visible diagram at ${label} width`);
          return;
        }
        const button = page.locator('.diagram-enlarge-button:visible').first();
        const source = page.locator('.diagram-enlarge-source:visible').first();
        const originalBox = await source.boundingBox();
        assert.ok(originalBox && originalBox.width > 0, `${href}: diagram should have a nonzero original size`);

        // Close via its own Close button.
        await button.click();
        const dialog = page.locator('dialog.diagram-enlarge-dialog');
        await dialog.waitFor({ state: 'visible' });
        assert.equal(await page.evaluate(() => document.querySelector('dialog.diagram-enlarge-dialog').open), true);
        const enlargedBox = await page.locator('.diagram-enlarge-active').boundingBox();
        assert.ok(enlargedBox, `${href}: enlarged diagram should be visible inside the dialog`);
        assert.ok(
          enlargedBox.width * enlargedBox.height > originalBox.width * originalBox.height,
          `${href}: enlarged diagram (${enlargedBox.width}x${enlargedBox.height}) should be bigger than the original (${originalBox.width}x${originalBox.height})`
        );
        await page.locator('.diagram-enlarge-close').click();
        await dialog.waitFor({ state: 'hidden' });
        assert.equal(await page.evaluate(() => document.querySelector('dialog.diagram-enlarge-dialog').open), false);

        // Close via Escape.
        await button.click();
        await dialog.waitFor({ state: 'visible' });
        await page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'hidden' });
        assert.equal(await page.evaluate(() => document.querySelector('dialog.diagram-enlarge-dialog').open), false);

        // Close via a tap outside the dialog box (near the viewport corner).
        await button.click();
        await dialog.waitFor({ state: 'visible' });
        await page.mouse.click(1, 1);
        await dialog.waitFor({ state: 'hidden' });
        assert.equal(await page.evaluate(() => document.querySelector('dialog.diagram-enlarge-dialog').open), false);
      } finally {
        await page.close();
      }
    });
  });
});
