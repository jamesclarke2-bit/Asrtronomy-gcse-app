/**
 * Every page on the site should load cleanly at a phone width (390px,
 * same convention as test/noHorizontalScroll.test.js) — no uncaught
 * exception, no console.error. A real browser check (Playwright, same
 * engine scripts/screenshots.js already uses), since this is exactly
 * the class of failure a hand-maintained sitewide check or a raw-HTML
 * parse can't catch: a page whose own script throws before rendering
 * (e.g. a missing <script> tag — see test/scriptDependencyOrder
 * .test.js, which catches that specific cause statically) still looks
 * fine as HTML text, and still "has" all its elements in the DOM
 * source, while actually rendering empty or broken for a real visitor.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');

const ROOT = path.join(__dirname, '..');

function listHtmlFiles() {
  const dirs = ['.', 'notes', 'sims'];
  const files = [];
  dirs.forEach((dir) => {
    fs.readdirSync(path.join(ROOT, dir))
      .filter((f) => f.endsWith('.html'))
      .forEach((f) => files.push(path.posix.join(dir, f).replace(/^\.\//, '')));
  });
  return files;
}

const PAGES = listHtmlFiles();

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/pageLoadErrors.test.js');

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

PAGES.forEach((href) => {
  test(`${href}: loads at 390px wide with no uncaught exceptions or console errors`, async (t) => {
    if (launchError) {
      skip(t, SKIP_MESSAGE(launchError));
      return;
    }
    const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
    const errors = [];
    page.on('pageerror', (err) => errors.push(`uncaught exception: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
    });
    try {
      await page.goto('file://' + path.join(ROOT, href));
      await page.waitForTimeout(300);
    } finally {
      await page.close();
    }
    assert.deepEqual(errors, [], `${href} should load with no console errors or uncaught exceptions`);
  });
});
