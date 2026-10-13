/**
 * No page's heading outline should skip a level (e.g. an h2 followed
 * directly by an h4, with no h3 in between) — a real accessibility bug:
 * screen-reader users navigating by heading jump straight from one to
 * the next, so a skipped level reads as a missing section. Checked in a
 * real browser (Playwright), on the rendered DOM, since several pages
 * (index.html's page-card lists among them) generate their own headings
 * from JavaScript rather than writing them in the HTML.
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
  test(`${href}: heading levels never skip (no hN directly followed by h(N+2) or deeper)`, async () => {
    const page = await browser.newPage();
    try {
      await page.goto('file://' + path.join(ROOT, href));
      await page.waitForTimeout(150);
      const headings = await page.evaluate(() =>
        [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({
          level: Number(h.tagName[1]),
          text: h.textContent.trim().slice(0, 60),
        }))
      );

      let previousLevel = 0;
      headings.forEach((heading) => {
        if (previousLevel !== 0) {
          assert.ok(
            heading.level <= previousLevel + 1,
            `${href}: an h${previousLevel} is directly followed by an h${heading.level} ("${heading.text}"), skipping a level`
          );
        }
        previousLevel = heading.level;
      });
    } finally {
      await page.close();
    }
  });
});
