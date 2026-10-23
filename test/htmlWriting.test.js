/**
 * A standing guard against unsafe HTML writing, turning the 16 October
 * 2026 audit into a check that fails automatically on any new instance:
 * every .js file the site itself ships (not test/) must never use
 * outerHTML, insertAdjacentHTML, document.write, eval( or new Function,
 * and may only assign innerHTML to a bare empty string ('' or "") —
 * anything else needs that exact file on the ALLOWED_NON_EMPTY_INNER_HTML
 * allow-list below, with a comment proving every value the write
 * interpolates is this app's own static or slider/engine-derived data,
 * never something typed into a text/number/time answer box.
 *
 * Checked from the raw source text, not a DOM, the same convention as
 * test/security.test.js and test/studentFacingText.test.js.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

// Every directory the site's own .js files live in. Deliberately excludes
// test/ (this suite) and node_modules (not our code).
const JS_DIRS = ['.', 'notes', 'sims', 'src', 'scripts'];

function listSiteJsFiles() {
  const files = [];
  JS_DIRS.forEach((dir) => {
    fs.readdirSync(path.join(ROOT, dir))
      .filter((f) => f.endsWith('.js'))
      .forEach((f) => files.push(path.posix.join(dir, f).replace(/^\.\//, '')));
  });
  return files;
}

const JS_FILES = listSiteJsFiles();

// Each entry here is one file this audit has already traced end to end:
// every innerHTML write it contains interpolates only hardcoded data or
// a Number()-coerced slider/engine value, never a value read from a
// text/number/time input box, and the write only ever lands via
// textContent-style rendering elsewhere — never a round trip through a
// typed answer. Adding a file here is a security decision: do it only
// after tracing every value the new write interpolates back to its
// source, the way this audit did, and say so in the comment.
const ALLOWED_NON_EMPTY_INNER_HTML = {
  'notes/syllabus-map.js':
    'Both writes (the summary table header, a "Partly covered points" caption) are bare hardcoded string literals with no interpolation at all.',
  'notes/geocentric-to-heliocentric.js':
    'The timeline SVG and its detail panels interpolate only fields of the hardcoded TIMELINE_EVENTS const array (year/id/label/dateLabel/detail/model) — never a value read from any input.',
  'sims/equation-of-time.js':
    'The solstice note interpolates only Number(latitudeSlider.value) and values computed from it (formatted dates/clock times, a drift-seconds count) — fed by a range slider, never a text box.',
  'sims/shadows-and-sundials.js':
    "The offset-breakdown SVG interpolates only Number(lonSlider.value) and values computed from it — fed by a range slider. The page's separate free-text longitude-guess box is graded in a different function (checkLongitudeGuess) that only ever writes feedback.textContent, never this SVG.",
};

// Finds every `x.innerHTML = ...;` assignment (not `==`/`===` comparisons)
// and returns the 1-indexed line number of each one whose right-hand side
// isn't a bare '' or "" — i.e. every write that isn't just clearing the
// element.
function findNonEmptyInnerHtmlWrites(source) {
  const assignRe = /\.innerHTML\s*=(?!=)\s*/g;
  const lines = [];
  let m;
  while ((m = assignRe.exec(source))) {
    const after = source.slice(m.index + m[0].length);
    const isBareEmptyString = /^(['"])\1\s*;/.test(after);
    if (!isBareEmptyString) {
      lines.push(source.slice(0, m.index).split('\n').length);
    }
  }
  return lines;
}

test('the site .js file walk finds a plausible number of files, as a sanity check on the walk itself', () => {
  assert.ok(JS_FILES.length > 20, `expected several dozen site .js files, found ${JS_FILES.length}`);
});

test('the innerHTML scanner correctly tells a clear apart from a real write', () => {
  assert.deepEqual(findNonEmptyInnerHtmlWrites("el.innerHTML = '';"), []);
  assert.deepEqual(findNonEmptyInnerHtmlWrites('el.innerHTML = "";'), []);
  assert.deepEqual(findNonEmptyInnerHtmlWrites('if (el.innerHTML === "") return;'), []);
  assert.deepEqual(findNonEmptyInnerHtmlWrites("el.innerHTML = '<b>x</b>';"), [1]);
  assert.deepEqual(findNonEmptyInnerHtmlWrites('el.innerHTML = someVar;'), [1]);
  assert.deepEqual(findNonEmptyInnerHtmlWrites('a.innerHTML = \'\';\nb.innerHTML = x;'), [2]);
});

JS_FILES.forEach((relPath) => {
  const source = fs.readFileSync(path.join(ROOT, relPath), 'utf8');

  test(`${relPath}: never uses outerHTML, insertAdjacentHTML, document.write, eval(, or new Function`, () => {
    assert.doesNotMatch(source, /\.outerHTML\s*=/, `${relPath} assigns outerHTML`);
    assert.doesNotMatch(source, /\.insertAdjacentHTML\s*\(/, `${relPath} calls insertAdjacentHTML`);
    assert.doesNotMatch(source, /document\.write\s*\(/, `${relPath} calls document.write`);
    assert.doesNotMatch(source, /(?<![\w$.])eval\s*\(/, `${relPath} calls eval(`);
    assert.doesNotMatch(source, /new\s+Function\s*\(/, `${relPath} calls new Function`);
  });

  test(`${relPath}: only clears innerHTML, unless it's on the allow-list for a documented reason`, () => {
    const nonEmptyLines = findNonEmptyInnerHtmlWrites(source);
    if (nonEmptyLines.length === 0) return;
    assert.ok(
      Object.prototype.hasOwnProperty.call(ALLOWED_NON_EMPTY_INNER_HTML, relPath),
      `${relPath} assigns innerHTML to something other than '' at line(s) ${nonEmptyLines.join(', ')}, ` +
        "but isn't on this test's allow-list. Either change it to build the DOM with createElement/" +
        'textContent instead, or add it to ALLOWED_NON_EMPTY_INNER_HTML with a comment tracing every ' +
        'interpolated value back to its source.'
    );
  });
});
