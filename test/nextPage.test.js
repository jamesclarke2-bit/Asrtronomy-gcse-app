/**
 * The "next page" link shown at the bottom of every sims/ and notes/
 * page (see nextPage.js and notes/TEMPLATE.md section 5), checked
 * three ways: the pure sequencing logic against small fixtures and
 * against the real RECOMMENDED_PATH, the shared markup every
 * registered page must carry, and (in a real browser) that the same
 * script's privacy-notice footer line and site bar actually render.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const { PAGES, RECOMMENDED_PATH } = require('../src/pages');
const { resolveNextStep, resolveSiteBarLinks } = require('../nextPage');

const ROOT = path.join(__dirname, '..');

function read(href) {
  return fs.readFileSync(path.join(ROOT, href), 'utf8');
}

// --- resolveNextStep, pure logic -------------------------------------------

test('resolveNextStep: steps through a small fixture path in order', () => {
  const recommendedPath = [
    { phase: 'A', steps: [{ href: 'sims/one.html' }, { href: 'sims/two.html' }] },
    { phase: 'B', steps: [{ href: 'notes/three.html' }] },
  ];
  const pages = [
    { href: 'sims/one.html', title: 'One' },
    { href: 'sims/two.html', title: 'Two' },
    { href: 'notes/three.html', title: 'Three' },
  ];
  assert.deepEqual(resolveNextStep('sims/one.html', recommendedPath, pages), { done: false, next: pages[1] });
  assert.deepEqual(resolveNextStep('sims/two.html', recommendedPath, pages), { done: false, next: pages[2] });
});

test('resolveNextStep: the last step on the path reports done, not a next page', () => {
  const recommendedPath = [{ phase: 'A', steps: [{ href: 'sims/one.html' }, { href: 'sims/two.html' }] }];
  const pages = [{ href: 'sims/one.html', title: 'One' }, { href: 'sims/two.html', title: 'Two' }];
  assert.deepEqual(resolveNextStep('sims/two.html', recommendedPath, pages), { done: true });
});

test('resolveNextStep: a page not on the path at all returns null', () => {
  const recommendedPath = [{ phase: 'A', steps: [{ href: 'sims/one.html' }] }];
  const pages = [{ href: 'sims/one.html', title: 'One' }];
  assert.equal(resolveNextStep('sims/unknown.html', recommendedPath, pages), null);
});

test('resolveNextStep against the real data: every page but the last resolves to the true next step', () => {
  const flat = RECOMMENDED_PATH.flatMap((phase) => phase.steps);
  assert.ok(flat.length > 1);
  flat.forEach((step, i) => {
    const result = resolveNextStep(step.href, RECOMMENDED_PATH, PAGES);
    if (i === flat.length - 1) {
      assert.deepEqual(result, { done: true }, `${step.href} should be the last page on the path`);
    } else {
      assert.ok(result && result.done === false, `${step.href} should have a next page`);
      assert.equal(result.next.href, flat[i + 1].href, `${step.href}'s next should be ${flat[i + 1].href}`);
    }
  });
});

// --- resolveSiteBarLinks, pure logic ---------------------------------------

test('resolveSiteBarLinks: a plain {label, href} entry is used as given, never resolved against PAGES', () => {
  const links = resolveSiteBarLinks([]);
  assert.deepEqual(links[0], { label: 'Home', href: '../index.html' });
});

test('resolveSiteBarLinks: a {pageHref} entry resolves its label from that page\'s own registered title', () => {
  const pages = [{ href: 'notes/syllabus-map.html', title: 'Syllabus Map' }];
  const links = resolveSiteBarLinks(pages);
  assert.deepEqual(
    links.find((l) => l.href === '../notes/syllabus-map.html'),
    { label: 'Syllabus Map', href: '../notes/syllabus-map.html' }
  );
});

test('resolveSiteBarLinks: a {pageHref} entry whose target is missing from PAGES is dropped, not thrown', () => {
  const links = resolveSiteBarLinks([]);
  assert.deepEqual(links, [{ label: 'Home', href: '../index.html' }]);
});

test('resolveSiteBarLinks against the real data: exactly Home, Syllabus Map, Formulae and Data Sheet, Privacy, in that order', () => {
  const links = resolveSiteBarLinks(PAGES);
  assert.deepEqual(links, [
    { label: 'Home', href: '../index.html' },
    { label: 'Syllabus Map', href: '../notes/syllabus-map.html' },
    { label: 'Formulae and Data Sheet', href: '../notes/data-sheet.html' },
    { label: 'Privacy', href: '../notes/privacy.html' },
  ]);
});

// --- Every registered page carries the shared markup -----------------------

PAGES.forEach((page) => {
  test(`${page.href}: has an empty #next-page paragraph as the last thing in <main>`, () => {
    const html = read(page.href);
    const main = /<main>([\s\S]*)<\/main>/.exec(html)[1];
    assert.ok(
      /<p class="next-page-link" id="next-page"><\/p>\s*$/.test(main),
      `${page.href}: #next-page should be the last element in <main>`
    );
  });

  test(`${page.href}: loads src/pages.js, and nextPage.js is the very last script`, () => {
    const html = read(page.href);
    const scripts = [...html.matchAll(/<script src="([^"?]+)/g)].map((m) => m[1]);
    assert.ok(scripts.includes('../src/pages.js'), 'loads src/pages.js');
    assert.equal(scripts.at(-1), '../nextPage.js', 'nextPage.js is the last script tag');
  });
});

// --- renderSiteFooterNote, in a real browser --------------------------

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/nextPage.test.js');

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

// A sims/ page, a notes/ page, and privacy.html itself (whose own
// footer links back to itself — harmless, and simpler than special-
// casing the one page the note is about).
['sims/kepler.html', 'notes/moon-structure.html', 'notes/privacy.html'].forEach((href) => {
  test(`${href}: loading the page adds a #site-footer-note linking to notes/privacy.html`, async (t) => {
    if (launchError) {
      skip(t, SKIP_MESSAGE(launchError));
      return;
    }
    const page = await browser.newPage();
    try {
      await page.goto('file://' + path.join(ROOT, href));
      const note = await page.$('#site-footer-note');
      assert.ok(note, '#site-footer-note should exist after the page loads');

      const linkHref = await page.$eval('#site-footer-note a', (el) => el.getAttribute('href'));
      assert.equal(linkHref, '../notes/privacy.html');

      // #site-footer-note is appended after #next-page, so it's the
      // true last element in <main> at runtime — #next-page itself
      // stays the last *static* element (checked above from raw HTML).
      const isLast = await page.evaluate(() => document.querySelector('main').lastElementChild.id === 'site-footer-note');
      assert.ok(isLast, '#site-footer-note should be the last element in <main>');
    } finally {
      await page.close();
    }
  });
});

// --- renderSiteBar, on every registered page, in a real browser -----------

PAGES.forEach((page) => {
  test(`${page.href}: shows the site bar with exactly Home, Syllabus Map, Formulae and Data Sheet and Privacy, every link resolving to a real file`, async (t) => {
    if (launchError) {
      skip(t, SKIP_MESSAGE(launchError));
      return;
    }
    const browserPage = await browser.newPage();
    try {
      await browserPage.goto('file://' + path.join(ROOT, page.href));
      const links = await browserPage.$$eval('#site-bar a', (as) => as.map((a) => ({ label: a.textContent, href: a.getAttribute('href') })));

      assert.deepEqual(
        links.map((l) => l.label),
        ['Home', 'Syllabus Map', 'Formulae and Data Sheet', 'Privacy']
      );

      links.forEach(({ href, label }) => {
        // Every link is "../<repo-root-relative path>" from this page's
        // own directory (sims/ or notes/) — resolve the same way a
        // browser would and confirm the target file actually exists.
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(page.href), href));
        assert.ok(fs.existsSync(path.join(ROOT, resolved)), `${label} (${href}) should resolve to an existing file, got ${resolved}`);
      });
    } finally {
      await browserPage.close();
    }
  });
});
