/**
 * Guards the two licence files this repo splits code and content under
 * (see README.md's "Licence" section): LICENSE (MIT, for the HTML/CSS/JS)
 * and LICENSE-CONTENT.md (CC BY-NC-SA 4.0, for the notes, diagrams and
 * practice questions, with the Pearson exam-spec exclusion), plus the
 * plain-text mention of both on notes/privacy.html.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

test('LICENSE exists and is the MIT licence, naming the 2026 copyright holder', () => {
  const text = fs.readFileSync(path.join(ROOT, 'LICENSE'), 'utf8');
  assert.match(text, /MIT License/);
  assert.match(text, /Copyright \(c\) 2026 James Clarke/);
});

test('LICENSE-CONTENT.md exists and covers CC BY-NC-SA 4.0, with the Pearson exclusion', () => {
  const text = fs.readFileSync(path.join(ROOT, 'LICENSE-CONTENT.md'), 'utf8');
  assert.match(text, /Attribution-NonCommercial-ShareAlike 4\.0 International/);
  assert.match(text, /creativecommons\.org\/licenses\/by-nc-sa\/4\.0\/legalcode/);
  assert.match(text, /Pearson/);
  assert.match(text, /1AS0/);
});

test('notes/privacy.html mentions both licences in plain text, with no new external link', () => {
  const html = fs.readFileSync(path.join(ROOT, 'notes/privacy.html'), 'utf8');
  assert.match(html, /MIT\s+licence/i);
  assert.match(html, /Creative Commons Attribution-NonCommercial-ShareAlike 4\.0 International/);
  assert.match(html, /Pearson/);
  // The security test's one allowed external link belongs to
  // notes/moon-structure.html, not this page — the licence text must name
  // the CC URL as plain text, never a clickable anchor.
  assert.doesNotMatch(html, /<a\s[^>]*href="https:\/\/creativecommons\.org[^"]*"/i);
});
