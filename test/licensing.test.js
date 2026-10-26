/**
 * Guards the site's interim "licensing to be confirmed" state while a
 * content-ownership question is settled (see README.md's Licence
 * section): no LICENSE/LICENSE-CONTENT.md files exist yet, and both
 * README.md and notes/privacy.html's "About this site" paragraph carry
 * the same holding wording, so neither page implies a licence that
 * hasn't actually been granted.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

const INTERIM_WORDING = 'All rights reserved for now; licensing to be confirmed.';

test('no LICENSE file exists while licensing is unresolved', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'LICENSE')), false);
});

test('no LICENSE-CONTENT.md file exists while licensing is unresolved', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'LICENSE-CONTENT.md')), false);
});

test("README.md's Licence section says only that licensing is to be confirmed", () => {
  const text = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  assert.match(text, /## Licence/);
  assert.match(text, new RegExp(INTERIM_WORDING.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test("notes/privacy.html's About this site paragraph says only that licensing is to be confirmed", () => {
  const html = fs.readFileSync(path.join(ROOT, 'notes/privacy.html'), 'utf8');
  assert.match(html, /About this site/);
  assert.match(html, new RegExp(INTERIM_WORDING.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
