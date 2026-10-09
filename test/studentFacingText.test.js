/**
 * A sitewide guard: nothing shown to a student — rendered HTML text, an
 * aria-label/alt/title attribute, or a string literal inside one of the
 * site's own .js files (a question prompt, a worked answer, a glossary
 * definition, a readout) — should ever mention a test file, an npm/
 * node:test invocation, a bare .js filename, or a camelCase code
 * identifier being called. Those belong in commit messages, code
 * comments and reports back to the person building the page, never in
 * copy a student reads (see CLAUDE.md's house rules).
 *
 * Deliberately conservative about what counts as "visible text": .js
 * files are scanned only inside their own string literals (comments and
 * real code — a genuine function call like drawArrow(ctx, x, y) — are
 * never shown to anyone, so flagging them would just be noise), and a
 * template literal's ${...} interpolations are stripped before
 * scanning, since those hold expressions (often real method calls like
 * .toFixed(2)), not literal text.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

const FORBIDDEN_PATTERNS = [
  { label: 'a "test/" path', re: /test\// },
  { label: 'a ".test.js" filename', re: /\.test\.js\b/i },
  { label: '"npm"', re: /\bnpm\b/i },
  { label: '"node:test"', re: /\bnode:test\b/ },
  { label: 'a ".js" filename', re: /\b[\w-]+\.js\b/i },
  { label: 'a camelCase code identifier being called, like classifyOrbit(', re: /\b[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*\(/ },
];

function findViolations(text) {
  const found = [];
  FORBIDDEN_PATTERNS.forEach(({ label, re }) => {
    const match = re.exec(text);
    if (match) found.push(`${label} ("${match[0]}")`);
  });
  return found;
}

// --- HTML pages: the rendered text a student actually sees -----------------

function htmlVisibleText(html) {
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const attributeText = [...withoutScripts.matchAll(/\b(?:aria-label|alt|title)="([^"]*)"/g)].map((m) => m[1]);
  const bodyText = withoutScripts.replace(/<[^>]*>/g, ' ');
  return [bodyText, ...attributeText].join('\n');
}

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

listHtmlFiles().forEach((href) => {
  test(`${href}: no code/test/npm references in the rendered page text`, () => {
    const html = fs.readFileSync(path.join(ROOT, href), 'utf8');
    const violations = findViolations(htmlVisibleText(html));
    assert.deepEqual(violations, [], `${href} shows: ${violations.join(', ')}`);
  });
});

// --- .js files: only their own string-literal content ----------------------

// A reasonable, not fully general, JS string-literal extractor. Comments
// and string/template literals are matched as one pass, in source order,
// so a stray apostrophe inside a // or /* */ comment (routine English
// prose — "doesn't", "Pages'") is consumed as part of that comment
// rather than misread as a string delimiter that then swallows every-
// thing up to some unrelated quote mark much further down the file.
// Comments are discarded; literals are kept, with a template literal's
// ${...} interpolations (code, not display text — often a built-in
// method call like .toFixed(2)) stripped before being handed back.
function extractStringLiterals(source) {
  const re = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|`(?:\\.|\$\{[^{}]*\}|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g;
  const literals = [];
  let m;
  while ((m = re.exec(source))) {
    const token = m[0];
    if (token.startsWith('//') || token.startsWith('/*')) continue;
    const quote = token[0];
    let inner = token.slice(1, -1);
    if (quote === '`') inner = inner.replace(/\$\{[^{}]*\}/g, ' ');
    literals.push(inner);
  }
  return literals.join('\n');
}

// src/curriculum.js's own `notes` field is internal documentation for
// whoever is building the next page from a subtopic — every page that
// reads a subtopic (via Curriculum.getSubtopic) only ever renders its
// `id` and `title`, never `notes` — so it's the one file genuinely
// exempt from this scan rather than something to reword.
const JS_SCAN_EXCLUDE = new Set(['src/curriculum.js']);

function listJsFiles() {
  const dirs = ['.', 'notes', 'sims', 'src'];
  const files = [];
  dirs.forEach((dir) => {
    fs.readdirSync(path.join(ROOT, dir))
      .filter((f) => f.endsWith('.js'))
      .forEach((f) => files.push(path.posix.join(dir, f).replace(/^\.\//, '')));
  });
  return files.filter((f) => !JS_SCAN_EXCLUDE.has(f));
}

listJsFiles().forEach((href) => {
  test(`${href}: no code/test/npm references in its own string literals`, () => {
    const source = fs.readFileSync(path.join(ROOT, href), 'utf8');
    const violations = findViolations(extractStringLiterals(source));
    assert.deepEqual(violations, [], `${href} shows: ${violations.join(', ')}`);
  });
});

// --- The guard itself: confirm it actually catches what it should ----------

test('findViolations catches every forbidden pattern, and leaves ordinary words (like "function") alone', () => {
  assert.deepEqual(findViolations('see test/foo.test.js for the check'), ['a "test/" path ("test/")', 'a ".test.js" filename (".test.js")', 'a ".js" filename ("test.js")']);
  assert.deepEqual(findViolations('run npm test to check'), ['"npm" ("npm")']);
  assert.deepEqual(findViolations('this uses node:test under the hood'), ['"node:test" ("node:test")']);
  assert.deepEqual(findViolations('see gravityField.js for the source'), ['a ".js" filename ("gravityField.js")']);
  assert.deepEqual(findViolations("classifyOrbit(total, potential) returns 'bound'"), ['a camelCase code identifier being called, like classifyOrbit( ("classifyOrbit(")']);
  assert.deepEqual(findViolations('a mathematical function of distance, like g(r)'), []);
  assert.deepEqual(findViolations('this is perfectly ordinary prose about escape speed'), []);
});
