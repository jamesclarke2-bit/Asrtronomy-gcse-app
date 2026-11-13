/**
 * The "BROWSER TESTS SKIPPED" warning from test/browserLaunch.js names the
 * browser that was actually missing: a WebKit skip says WebKit, never
 * Chromium, and the PLAYWRIGHT_CHROMIUM_PATH hint (which only ever helps
 * Chromium) appears only when Chromium tests skipped.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { skipWarning } = require('./browserLaunch');

test('skipWarning: no skips, no warning', () => {
  assert.equal(skipWarning('test/x.test.js', {}, undefined), null);
  assert.equal(skipWarning('test/x.test.js', { WebKit: 0 }, undefined), null);
});

test('skipWarning: WebKit-only skips name WebKit and never Chromium', () => {
  const w = skipWarning('test/x.test.js', { WebKit: 7 }, '/opt/pw-browsers/chromium');
  assert.match(w, /BROWSER TESTS SKIPPED — test\/x\.test\.js: 7 WebKit test\(s\) skipped because WebKit isn't available/);
  assert.doesNotMatch(w, /Chromium/);
});

test('skipWarning: Chromium skips name Chromium and give the PLAYWRIGHT_CHROMIUM_PATH hint', () => {
  const tried = skipWarning('test/x.test.js', { Chromium: 3 }, '/opt/pw-browsers/chromium');
  assert.match(tried, /3 Chromium test\(s\) skipped because Chromium isn't available/);
  assert.match(tried, /PLAYWRIGHT_CHROMIUM_PATH \(\/opt\/pw-browsers\/chromium\) was tried/);
  const unset = skipWarning('test/x.test.js', { Chromium: 3 }, undefined);
  assert.match(unset, /set PLAYWRIGHT_CHROMIUM_PATH/);
});

test('skipWarning: both browsers skipped are each named with their own count', () => {
  const w = skipWarning('test/x.test.js', { Chromium: 2, WebKit: 5 }, undefined);
  assert.match(w, /2 Chromium test\(s\) skipped/);
  assert.match(w, /5 WebKit test\(s\) skipped because WebKit isn't available/);
});

test('trackSkips: a file whose WebKit tests skip prints a warning naming WebKit, not Chromium', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skip-warning-'));
  const fixture = path.join(dir, 'webkitSkip.test.js');
  fs.writeFileSync(
    fixture,
    [
      "const test = require('node:test');",
      `const { trackSkips } = require(${JSON.stringify(path.join(__dirname, 'browserLaunch.js'))});`,
      "const { skip } = trackSkips('fixture.test.js');",
      "test('one', (t) => skip(t, 'WebKit missing', 'WebKit'));",
      "test('two', (t) => skip(t, 'WebKit missing', 'WebKit'));",
    ].join('\n')
  );
  // NODE_TEST_CONTEXT would make the inner run report to this runner
  // instead of printing normally.
  const env = { ...process.env, PLAYWRIGHT_CHROMIUM_PATH: '/opt/pw-browsers/chromium' };
  delete env.NODE_TEST_CONTEXT;
  try {
    const run = spawnSync(process.execPath, ['--test', fixture], { env, encoding: 'utf8' });
    const out = `${run.stdout}\n${run.stderr}`;
    assert.match(out, /BROWSER TESTS SKIPPED — fixture\.test\.js: 2 WebKit test\(s\) skipped because WebKit isn't available/);
    assert.doesNotMatch(out, /Chromium/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("pictureHighlightVisibility's skips say which browser was missing", () => {
  const src = fs.readFileSync(path.join(__dirname, 'pictureHighlightVisibility.test.js'), 'utf8');
  assert.match(src, /skip\(t, `\$\{browserDef\.name\} isn't available[^`]*`, browserDef\.name\)/);
});
