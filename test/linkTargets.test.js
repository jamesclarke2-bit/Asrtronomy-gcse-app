/**
 * Every internal link with a #fragment, on every page, should point to
 * an element id that actually exists on its target page — same-page
 * ("#epicycles") or cross-page ("../notes/data-sheet.html#planet-data").
 * Parsed from the raw HTML (same convention as the rest of this repo's
 * tests), not a DOM, since this repo has no DOM-simulation dependency.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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

const htmlCache = new Map();
function readHtml(href) {
  if (!htmlCache.has(href)) {
    htmlCache.set(href, fs.readFileSync(path.join(ROOT, href), 'utf8'));
  }
  return htmlCache.get(href);
}

const idsCache = new Map();
function idsOnPage(href) {
  if (!idsCache.has(href)) {
    const html = readHtml(href);
    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
    idsCache.set(href, ids);
  }
  return idsCache.get(href);
}

// Resolves an href found on `fromHref` to { targetHref, fragment }, or
// null if it isn't an internal #fragment link at all (no fragment, an
// empty fragment, or an external URL with its own scheme).
function resolveFragmentLink(fromHref, link) {
  const hashIndex = link.indexOf('#');
  if (hashIndex === -1) return null;
  const pathPart = link.slice(0, hashIndex);
  const fragment = link.slice(hashIndex + 1);
  if (!fragment) return null;

  if (/^[a-z][a-z0-9+.-]*:/i.test(pathPart) || pathPart.startsWith('//')) return null; // external

  if (!pathPart) return { targetHref: fromHref, fragment };

  const fromDir = path.posix.dirname(fromHref);
  const targetHref = path.posix.normalize(path.posix.join(fromDir, pathPart));
  return { targetHref, fragment };
}

PAGES.forEach((fromHref) => {
  const html = readHtml(fromHref);
  const hrefs = [...html.matchAll(/\bhref="([^"]*)"/g)].map((m) => m[1]);
  const links = hrefs.map((link) => resolveFragmentLink(fromHref, link)).filter(Boolean);

  if (links.length === 0) return;

  test(`${fromHref}: every internal #fragment link points to an id that exists on its target page`, () => {
    links.forEach(({ targetHref, fragment }) => {
      assert.ok(
        PAGES.includes(targetHref),
        `${fromHref} links to "${targetHref}#${fragment}", but "${targetHref}" isn't one of this site's pages`
      );
      const ids = idsOnPage(targetHref);
      assert.ok(
        ids.has(fragment),
        `${fromHref} links to "${targetHref}#${fragment}", but ${targetHref} has no element with id="${fragment}"`
      );
    });
  });
});
