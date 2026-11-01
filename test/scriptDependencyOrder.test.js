/**
 * Prevents the exact bug that left notes/syllabus-map.html rendering
 * nearly empty in every browser for days: a page script (or a module
 * it loads, like src/allQuestions.js or quiz-ui.js) reads another
 * module's global — AllQuestions.js's own `window.X` dependency list,
 * or the far more common bare `Curriculum.getSubtopic(...)`-style
 * usage most page scripts rely on — and the page's own <script> tag
 * list doesn't load that module's file before it. The read throws
 * (undefined has no property X) and kills the whole script, which
 * looks fine as raw HTML (every element is right there in the DOM
 * source) while actually rendering empty for a real visitor.
 *
 * Nothing here is a hand-typed list of "page X needs scripts A, B, C":
 * every required global is derived straight from each script file's
 * own source, two ways —
 *
 *   1. `window.Name` read anywhere in the file (not a `window.Name =`
 *      write) — unambiguous, can't be a local variable shadowing it.
 *      This is exactly src/allQuestions.js's own
 *      getAllQuestionsBrowser() pattern.
 *   2. A bare `Name.foo`/`Name(` reference anywhere in the file, for
 *      any `Name` some OTHER file exports as `window.Name = ...` —
 *      the much more common page-script style (`Curriculum
 *      .getSubtopic(id)`, `Glossary.init(...)`, `QuizUI.mount(...)`).
 *      Skipped entirely for a file where `Name` is ALSO ever used as a
 *      function/arrow parameter or a destructured binding — e.g.
 *      src/allQuestions.js's own pure getAllQuestions({ SpecData, ...
 *      }) destructures SpecData as a local parameter in one function,
 *      while its getAllQuestionsBrowser() separately reads the real
 *      window.SpecData — signal 1 already catches that real dependency
 *      correctly, so signal 2 staying silent there costs nothing.
 *      Critically, a *call site* like `Thing.makeQuestions(SpecData,
 *      MoonPhase)` must NOT be mistaken for a parameter declaration —
 *      only text actually inside a `function f(...)`/`(...) =>`
 *      parameter list counts (see paramListsOf) — otherwise a page
 *      script passing a real dependency as a bare call argument (which
 *      several do) would be invisible to this check entirely.
 *
 * Comments and string/template-literal contents are blanked out before
 * any of this runs, so a docstring that merely *mentions* another
 * module's name (e.g. "see Pages.computeUnitCoverage") can't be read
 * as a real dependency.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function listJsFiles() {
  const files = [];
  fs.readdirSync(ROOT).filter((f) => f.endsWith('.js')).forEach((f) => files.push(f));
  ['src', 'notes', 'sims'].forEach((dir) => {
    fs.readdirSync(path.join(ROOT, dir))
      .filter((f) => f.endsWith('.js'))
      .forEach((f) => files.push(path.posix.join(dir, f)));
  });
  return files;
}

function listHtmlFiles() {
  const files = [];
  ['.', 'notes', 'sims'].forEach((dir) => {
    fs.readdirSync(path.join(ROOT, dir))
      .filter((f) => f.endsWith('.html'))
      .forEach((f) => files.push(path.posix.join(dir, f).replace(/^\.\//, '')));
  });
  return files;
}

// --- The static-analysis helpers, exercised directly by fixture ------------

function stripCommentsAndStrings(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const two = src.slice(i, i + 2);
    if (two === '//') {
      while (i < src.length && src[i] !== '\n') {
        out += ' ';
        i += 1;
      }
      continue;
    }
    if (two === '/*') {
      out += '  ';
      i += 2;
      while (i < src.length && src.slice(i, i + 2) !== '*/') {
        out += src[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      out += '  ';
      i += 2;
      continue;
    }
    const ch = src[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      out += ' ';
      i += 1;
      while (i < src.length && src[i] !== quote) {
        if (src[i] === '\\') {
          out += '  ';
          i += 2;
          continue;
        }
        out += src[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      out += ' ';
      i += 1;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function windowReads(src) {
  const names = new Set();
  const re = /window\.(\w+)/g;
  let m;
  while ((m = re.exec(src))) {
    const after = src.slice(m.index + m[0].length);
    if (!/^\s*=(?!=)/.test(after)) names.add(m[1]);
  }
  return names;
}

function windowWrites(src) {
  const names = new Set();
  const re = /window\.(\w+)\s*=\s*(?!=)/g;
  let m;
  while ((m = re.exec(src))) names.add(m[1]);
  return names;
}

// Text of every function/arrow PARAMETER LIST in the file — never an
// ordinary call site's arguments, which look identical at a shallow
// glance (`foo(SpecData, MoonPhase)` is a call; only
// `function foo(SpecData, MoonPhase) {` or `(SpecData, MoonPhase) =>`
// is a declaration).
function paramListsOf(src) {
  const lists = [];
  let m;
  const funcRe = /function\s*\w*\s*\(([^)]*)\)/g;
  while ((m = funcRe.exec(src))) lists.push(m[1]);
  const arrowRe = /\(([^)]*)\)\s*=>/g;
  while ((m = arrowRe.exec(src))) lists.push(m[1]);
  const singleArrowRe = /(?:^|[^.\w])(\w+)\s*=>/g;
  while ((m = singleArrowRe.exec(src))) lists.push(m[1]);
  return lists;
}

function isEverBoundLocally(src, name) {
  const esc = escapeRegex(name);
  const inParamList = paramListsOf(src).some((list) => new RegExp(`(^|[,{\\s])${esc}(\\s*[,}:=]|\\s*$)`).test(list));
  const destructurePattern = new RegExp(`\\{[^{}]*\\b${esc}\\b[^{}]*\\}\\s*=`);
  return inParamList || destructurePattern.test(src);
}

function bareUsages(src, name) {
  const esc = escapeRegex(name);
  return new RegExp(`(?<!\\.)\\b${esc}\\b(?!\\s*:)`).test(src);
}

// --- Registry + per-file required-module computation, built once -----------

const jsFiles = listJsFiles();
const rawCache = new Map();
function readRaw(rel) {
  if (!rawCache.has(rel)) rawCache.set(rel, fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  return rawCache.get(rel);
}
const cleanCache = new Map();
function readClean(rel) {
  if (!cleanCache.has(rel)) cleanCache.set(rel, stripCommentsAndStrings(readRaw(rel)));
  return cleanCache.get(rel);
}

const exporterOf = new Map(); // module name -> file that exports it
jsFiles.forEach((rel) => {
  windowWrites(readClean(rel)).forEach((name) => exporterOf.set(name, rel));
});
const knownModules = [...exporterOf.keys()];

const requiredModulesCache = new Map();
function requiredModulesOf(rel) {
  if (requiredModulesCache.has(rel)) return requiredModulesCache.get(rel);
  const src = readClean(rel);
  const ownName = [...exporterOf.entries()].find(([, f]) => f === rel)?.[0] ?? null;
  const required = new Set();
  windowReads(src).forEach((n) => {
    if (knownModules.includes(n) && n !== ownName) required.add(n);
  });
  knownModules.forEach((name) => {
    if (name === ownName || required.has(name)) return;
    if (isEverBoundLocally(src, name)) return;
    if (bareUsages(src, name)) required.add(name);
  });
  requiredModulesCache.set(rel, required);
  return required;
}

// Pure, disk-independent: given an ordered list of {file, required,
// exports}, returns one violation string per (script, missing module)
// pair where `required` isn't satisfied by an earlier entry's `exports`
// — this is what actually walks "page load order", so it's unit-tested
// directly against synthetic data below, independent of real files.
function loadOrderViolations(scriptEntries) {
  const violations = [];
  const loaded = new Set();
  scriptEntries.forEach(({ file, required, exports: exported }) => {
    required.forEach((mod) => {
      if (!loaded.has(mod)) violations.push(`${file} needs ${mod}, not yet loaded`);
    });
    if (exported) loaded.add(exported);
  });
  return violations;
}

function scriptsOf(href) {
  const html = readRaw(href);
  const dir = path.posix.dirname(href);
  const scripts = [];
  const re = /<script\s+src="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    const src = m[1].split('?')[0];
    if (/^https?:\/\//.test(src)) continue;
    scripts.push(path.posix.normalize(path.posix.join(dir, src)).replace(/^\.\//, ''));
  }
  return scripts;
}

// --- Unit tests for the helpers ---------------------------------------------

test('stripCommentsAndStrings blanks line comments, block comments and string/template contents, leaving real code intact', () => {
  const src = [
    '// mentions Pages.computeUnitCoverage, not real code',
    '/* also mentions Curriculum.UNITS inside a block comment */',
    "const label = 'references StarPatterns too, just a string';",
    'const real = Glossary.init(X);',
  ].join('\n');
  const cleaned = stripCommentsAndStrings(src);
  assert.ok(!/Pages/.test(cleaned), 'line comment content should be gone');
  assert.ok(!/Curriculum/.test(cleaned), 'block comment content should be gone');
  assert.ok(!/StarPatterns/.test(cleaned), 'string literal content should be gone');
  assert.ok(/Glossary\.init\(X\)/.test(cleaned), 'real code should survive untouched');
});

test('windowReads finds a read but not the matching write on the same name', () => {
  const src = 'const a = window.SpecData; window.MyModule = { a };';
  assert.deepEqual(windowReads(src), new Set(['SpecData']));
});

test('isEverBoundLocally recognizes a real function/arrow parameter and a destructured binding, but not a call-site argument of the same name', () => {
  assert.equal(isEverBoundLocally('function makeQuestions(SpecData, MoonPhase) { return SpecData; }', 'SpecData'), true);
  assert.equal(isEverBoundLocally('const build = (SpecData) => SpecData.CONSTANTS;', 'SpecData'), true);
  assert.equal(isEverBoundLocally('function f(deps) { const { SpecData, MoonPhase } = deps; return SpecData; }', 'SpecData'), true);
  // The exact shape that originally slipped past a naive "name inside
  // parens" check: a CALL passing a real dependency as a bare argument,
  // which must NOT be treated as a local parameter declaration.
  assert.equal(isEverBoundLocally('Thing.makeQuestions(SpecData, MoonPhase, { render });', 'SpecData'), false);
});

test('bareUsages finds Name.prop and Name( but not obj.Name or a {Name: ...} object key', () => {
  assert.equal(bareUsages('Curriculum.getSubtopic(id)', 'Curriculum'), true);
  assert.equal(bareUsages('callback(Curriculum)', 'Curriculum'), true);
  assert.equal(bareUsages('foo.Curriculum.bar', 'Curriculum'), false, 'property access on something ELSE named Curriculum should not count');
  assert.equal(bareUsages('const x = { Curriculum: something };', 'Curriculum'), false, 'an object literal KEY named Curriculum is not a usage');
});

test('loadOrderViolations: flags a script whose required module has no earlier exporter, clears once it is placed before', () => {
  const broken = [
    { file: 'a.js', required: new Set(['Missing']), exports: null },
  ];
  assert.deepEqual(loadOrderViolations(broken), ['a.js needs Missing, not yet loaded']);

  const fixed = [
    { file: 'missing.js', required: new Set(), exports: 'Missing' },
    { file: 'a.js', required: new Set(['Missing']), exports: null },
  ];
  assert.deepEqual(loadOrderViolations(fixed), []);
});

test('loadOrderViolations: this is the exact 11-module shape the real notes/syllabus-map.html bug had — every one reported, in page order', () => {
  const entries = [
    { file: 'curriculum.js', required: new Set(), exports: 'Curriculum' },
    { file: 'allQuestions.js', required: new Set(['Curriculum', 'StarPatterns', 'TidesQuestions']), exports: 'AllQuestions' },
    { file: 'syllabus-map.js', required: new Set(['AllQuestions']), exports: null },
  ];
  assert.deepEqual(loadOrderViolations(entries), [
    'allQuestions.js needs StarPatterns, not yet loaded',
    'allQuestions.js needs TidesQuestions, not yet loaded',
  ]);
});

// --- Real data: the helpers against real, known files -----------------------

test('real data: quiz-ui.js is found to depend on Curriculum (the bare Curriculum.getSubtopic(id) style, not window.X)', () => {
  assert.ok(requiredModulesOf('quiz-ui.js').has('Curriculum'));
});

test('real data: src/allQuestions.js is found to depend on every module its own getAllQuestionsBrowser() reads off window', () => {
  const src = readClean('src/allQuestions.js');
  const browserFnMatch = /function getAllQuestionsBrowser\(\) \{([\s\S]*?)\n  \}/.exec(src);
  assert.ok(browserFnMatch, 'getAllQuestionsBrowser not found — has src/allQuestions.js been restructured?');
  const expected = [...browserFnMatch[1].matchAll(/window\.(\w+)/g)].map((m) => m[1]);
  assert.ok(expected.length > 20, `expected several dozen window reads, found ${expected.length}`);
  const required = requiredModulesOf('src/allQuestions.js');
  expected.forEach((name) => assert.ok(required.has(name), `${name} should be a detected dependency`));
});

test('real data: notes/moon-structure.js depends on SpecData and MoonPhase (passed as bare call arguments to MoonStructureQuestions.makeQuestions, not just dot-accessed)', () => {
  const required = requiredModulesOf('notes/moon-structure.js');
  assert.ok(required.has('SpecData'));
  assert.ok(required.has('MoonPhase'));
});

test('real data: src/curriculum.js does not depend on Pages, even though a doc comment mentions "Pages.computeUnitCoverage"', () => {
  assert.equal(requiredModulesOf('src/curriculum.js').has('Pages'), false);
});

// --- The actual sitewide check ----------------------------------------------

const htmlFiles = listHtmlFiles();

htmlFiles.forEach((href) => {
  test(`${href}: every loaded script's required globals are provided by an earlier script tag on this page`, () => {
    const scripts = scriptsOf(href);
    scripts.forEach((scriptPath) => {
      assert.ok(jsFiles.includes(scriptPath), `${href} references ${scriptPath}, which doesn't exist on disk`);
    });
    const entries = scripts.map((file) => ({
      file,
      required: requiredModulesOf(file),
      exports: [...exporterOf.entries()].find(([, f]) => f === file)?.[0] ?? null,
    }));
    const violations = loadOrderViolations(entries).map((v) => `${href}: ${v}`);
    assert.deepEqual(violations, []);
  });
});
