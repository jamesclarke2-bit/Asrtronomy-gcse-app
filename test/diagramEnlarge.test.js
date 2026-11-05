/**
 * diagramEnlarge.js gives each worth-enlarging diagram (or a grouped row
 * of small ones — see that file's own header) a small "Enlarge" button,
 * opening it in a full-screen <dialog> cropped and scaled to fit the
 * screen. A real browser check (Playwright, same engine
 * scripts/screenshots.js already uses), since button wiring, <dialog>
 * open/close behaviour and rendered size are exactly what a DOM shim or
 * raw-HTML parse can't see.
 *
 * Checked at a phone width (390px, same convention as
 * test/noHorizontalScroll.test.js), an iPad width (768px) and a laptop
 * width (1280px, the task's own third size).
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
  { label: '1280', width: 1280, height: 900 },
];

// At least one of the enlarged picture's two dimensions must fill this
// much of its dialog — the dialog sizes itself to the picture (see
// styles.css's .diagram-enlarge-dialog), so a picture that only fills a
// sliver of it would mean the sizing math is off, not that the dialog
// has legitimate extra chrome.
const MIN_DIALOG_FILL_FRACTION = 0.7;

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

// --- Every figure has exactly one button — including after grouping ----

PAGES.forEach((href) => {
  test(`${href}: every figure has exactly one Enlarge button, including grouped rows`, async (t) => {
    if (launchError) {
      skip(t, SKIP_MESSAGE(launchError));
      return;
    }
    const page = await openPage(href, 390, 800);
    try {
      const result = await page.evaluate(() => {
        const sources = [...document.querySelectorAll('.diagram-enlarge-source')];
        const multiButtonSources = sources.filter((el) => el.querySelectorAll(':scope > .diagram-enlarge-button').length > 1);
        // A grouped .diagram-row (one that itself is a source) must be
        // the ONLY place its own small .diagram children's buttons
        // live — none of them should also carry their own.
        const groupedRows = sources.filter((el) => el.classList.contains('diagram-row'));
        const leakedChildButtons = groupedRows.flatMap((row) =>
          [...row.querySelectorAll('.diagram')].filter((d) => d.querySelector(':scope > .diagram-enlarge-button'))
        ).length;
        return {
          sourceCount: sources.length,
          buttonCount: document.querySelectorAll('.diagram-enlarge-button').length,
          multiButtonSourceCount: multiButtonSources.length,
          leakedChildButtons,
        };
      });
      assert.equal(result.multiButtonSourceCount, 0, `${href}: a diagram source should never carry more than one button`);
      assert.equal(result.leakedChildButtons, 0, `${href}: a grouped row's own small pictures shouldn't also carry their own button`);
      assert.equal(result.buttonCount, result.sourceCount, `${href}: every button should belong to exactly one source, and vice versa`);
    } finally {
      await page.close();
    }
  });
});

// --- Open/close behaviour, and fit-to-screen sizing, per diagram --------

PAGES.forEach((href) => {
  WIDTHS.forEach(({ label, width, height }) => {
    test(`${href} at ${label} width: every enlarged diagram fits the viewport and fills most of its dialog`, async (t) => {
      if (launchError) {
        skip(t, SKIP_MESSAGE(launchError));
        return;
      }
      const page = await openPage(href, width, height);
      try {
        const buttons = await page.locator('.diagram-enlarge-button:visible').all();
        if (buttons.length === 0) {
          t.skip(`${href} has no visible, worth-enlarging diagram at ${label} width`);
          return;
        }
        const dialog = page.locator('dialog.diagram-enlarge-dialog');
        for (let i = 0; i < buttons.length; i += 1) {
          const button = buttons[i];
          await button.click();
          await dialog.waitFor({ state: 'visible' });

          const metrics = await page.evaluate(() => {
            const d = document.querySelector('dialog.diagram-enlarge-dialog').getBoundingClientRect();
            const c = document.querySelector('.diagram-enlarge-crop-box').getBoundingClientRect();
            return {
              dialog: { left: d.left, top: d.top, right: d.right, bottom: d.bottom, width: d.width, height: d.height },
              crop: { width: c.width, height: c.height },
              viewportWidth: window.innerWidth,
              viewportHeight: window.innerHeight,
            };
          });

          assert.ok(
            metrics.dialog.left >= -0.5 &&
              metrics.dialog.top >= -0.5 &&
              metrics.dialog.right <= metrics.viewportWidth + 0.5 &&
              metrics.dialog.bottom <= metrics.viewportHeight + 0.5,
            `${href} at ${label} (diagram #${i}): dialog (${JSON.stringify(metrics.dialog)}) should fit inside the ${metrics.viewportWidth}x${metrics.viewportHeight} viewport with no overflow`
          );

          const fillWidth = metrics.crop.width / metrics.dialog.width;
          const fillHeight = metrics.crop.height / metrics.dialog.height;
          assert.ok(
            fillWidth >= MIN_DIALOG_FILL_FRACTION || fillHeight >= MIN_DIALOG_FILL_FRACTION,
            `${href} at ${label} (diagram #${i}): the enlarged picture should fill at least ${MIN_DIALOG_FILL_FRACTION * 100}% of its dialog's width or height — got ${(fillWidth * 100).toFixed(1)}% width, ${(fillHeight * 100).toFixed(1)}% height`
          );

          await page.locator('.diagram-enlarge-close').click();
          await dialog.waitFor({ state: 'hidden' });
        }
      } finally {
        await page.close();
      }
    });
  });
});

// --- Close behaviour (button, Escape, outside tap) on one representative
// diagram per page — exercised at every width in the sizing test above
// already covers "opens correctly"; this covers all three ways to close.

PAGES.forEach((href) => {
  test(`${href}: Enlarge closes by its own button, by Escape, and by tapping outside`, async (t) => {
    if (launchError) {
      skip(t, SKIP_MESSAGE(launchError));
      return;
    }
    const page = await openPage(href, 390, 800);
    try {
      const buttonCount = await page.locator('.diagram-enlarge-button:visible').count();
      if (buttonCount === 0) {
        t.skip(`${href} has no visible, worth-enlarging diagram`);
        return;
      }
      const button = page.locator('.diagram-enlarge-button:visible').first();
      const dialog = page.locator('dialog.diagram-enlarge-dialog');

      await button.click();
      await dialog.waitFor({ state: 'visible' });
      assert.equal(await page.evaluate(() => document.querySelector('dialog.diagram-enlarge-dialog').open), true);
      await page.locator('.diagram-enlarge-close').click();
      await dialog.waitFor({ state: 'hidden' });
      assert.equal(await page.evaluate(() => document.querySelector('dialog.diagram-enlarge-dialog').open), false);

      await button.click();
      await dialog.waitFor({ state: 'visible' });
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
      assert.equal(await page.evaluate(() => document.querySelector('dialog.diagram-enlarge-dialog').open), false);

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
