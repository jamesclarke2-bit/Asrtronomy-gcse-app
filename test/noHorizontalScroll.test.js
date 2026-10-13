/**
 * No page should scroll sideways at a 390px-wide (phone) viewport — a
 * real browser rendering/layout check, not something parseable from raw
 * HTML or CSS, so this uses Playwright (the same engine
 * scripts/screenshots.js already uses), not a DOM shim.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

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

let browser;

test.before(async () => {
  browser = await chromium.launch();
});

test.after(async () => {
  await browser.close();
});

PAGES.forEach((href) => {
  test(`${href}: no sideways scroll at 390px wide`, async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
    try {
      await page.goto('file://' + path.join(ROOT, href));
      await page.waitForTimeout(150);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(overflow <= 0, `${href} scrolls sideways by ${overflow}px at a 390px-wide viewport`);
    } finally {
      await page.close();
    }
  });
});
