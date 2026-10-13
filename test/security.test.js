/**
 * Sitewide hardening, checked from the raw HTML (same convention as
 * test/studentFacingText.test.js), not a DOM, since this repo has no
 * DOM-simulation dependency: every page carries the same
 * Content-Security-Policy and Referrer-Policy meta tags, and nothing on
 * the site points at another origin except the one doi.org citation on
 * notes/moon-structure.html (which must itself carry
 * rel="noopener noreferrer").
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

const EXPECTED_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; form-action 'none'; base-uri 'self'";

// The one deliberate exception this whole file enforces against: a
// citation link that has to point off-site by its very nature.
const ALLOWED_EXTERNAL_URL = 'https://doi.org/10.1126/science.1231530';
const ALLOWED_EXTERNAL_PAGE = 'notes/moon-structure.html';

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

test('every page lists at least one page, as a sanity check on the file walk itself', () => {
  assert.ok(PAGES.length > 20, `expected a few dozen pages, found ${PAGES.length}`);
});

PAGES.forEach((href) => {
  const html = fs.readFileSync(path.join(ROOT, href), 'utf8');

  test(`${href}: carries the sitewide Content-Security-Policy meta tag, before the head's closing tag`, () => {
    const headMatch = /<head>([\s\S]*?)<\/head>/.exec(html);
    assert.ok(headMatch, `${href} has no <head> section`);
    const head = headMatch[1];
    const cspMatch = /<meta http-equiv="Content-Security-Policy" content="([^"]*)"/.exec(head);
    assert.ok(cspMatch, `${href}'s <head> has no Content-Security-Policy meta tag`);
    assert.equal(cspMatch[1], EXPECTED_CSP, `${href}'s CSP content doesn't match the sitewide policy`);

    // "before any script" — this page loads none in <head> (every page's
    // own scripts load at the end of <body>, checked elsewhere), so the
    // meaningful check here is that the tag precedes every <script> in
    // the whole document, head or body.
    const firstScriptIndex = html.indexOf('<script');
    if (firstScriptIndex !== -1) {
      assert.ok(cspMatch.index < firstScriptIndex, `${href}'s CSP meta tag should come before its first <script> tag`);
    }
  });

  test(`${href}: carries a referrer-policy meta tag`, () => {
    const headMatch = /<head>([\s\S]*?)<\/head>/.exec(html);
    const head = headMatch[1];
    assert.match(head, /<meta name="referrer" content="no-referrer" \/>/, `${href}'s <head> has no referrer-policy meta tag`);
  });

  test(`${href}: every src/href either stays on this origin, or is the one allowed doi.org citation`, () => {
    const urls = [...html.matchAll(/\b(?:src|href)="([^"]*)"/g)].map((m) => m[1]);
    urls.forEach((url) => {
      // A scheme prefix (http:, https:, //, mailto:, etc.) means it
      // leaves this page's own origin; a bare path, a #fragment or a
      // ?query does not.
      const isExternal = /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(url);
      if (!isExternal) return;

      assert.equal(url, ALLOWED_EXTERNAL_URL, `${href} links off-site to "${url}", which isn't the one allowed citation link`);
      assert.equal(href, ALLOWED_EXTERNAL_PAGE, `the allowed citation link should only appear on ${ALLOWED_EXTERNAL_PAGE}, not ${href}`);
    });
  });
});

test('the one allowed external link carries rel="noopener noreferrer"', () => {
  const html = fs.readFileSync(path.join(ROOT, ALLOWED_EXTERNAL_PAGE), 'utf8');
  const linkMatch = new RegExp(`<a href="${ALLOWED_EXTERNAL_URL.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}"[^>]*>`).exec(html);
  assert.ok(linkMatch, `expected to find the citation link on ${ALLOWED_EXTERNAL_PAGE}`);
  assert.match(linkMatch[0], /rel="noopener noreferrer"/, 'the citation link should carry rel="noopener noreferrer"');
});
