/**
 * Shared Chromium launch + skip-reporting for every browser-dependent
 * test file (glossary, nextPage, noHeadingSkip, noHorizontalScroll,
 * privacy).
 *
 * `playwright` is pinned in package.json (no caret) to the exact
 * version whose bundled Chromium build matches what's pre-installed in
 * this repo's own dev/CI sandboxes — see README.md's "Running the
 * tests" section for which version and why. A different environment
 * (a contributor's own machine, a different CI image) can still have a
 * mismatched or missing Chromium; rather than let those tests just
 * silently skip, set PLAYWRIGHT_CHROMIUM_PATH to that environment's own
 * installed Chromium executable and launchChromium() below uses it
 * directly, whatever Playwright version is actually installed.
 */
const test = require('node:test');
const { chromium } = require('playwright');

function launchChromium() {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  return chromium.launch(executablePath ? { executablePath } : {});
}

// Call once per test file, right after computing SKIP_MESSAGE. Returns
// a `skip(t, message)` to call in place of `t.skip(message)` at every
// "if (launchError)" guard — same behaviour, except this file's
// test.after also prints one unmissable warning if any of its tests
// actually skipped, instead of that only showing up as a terse
// "# skipped N" buried in node:test's own run-wide summary.
function trackSkips(fileLabel) {
  let count = 0;
  test.after(() => {
    if (count === 0) return;
    const hint = process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? `PLAYWRIGHT_CHROMIUM_PATH (${process.env.PLAYWRIGHT_CHROMIUM_PATH}) was tried and still didn't work`
      : "set PLAYWRIGHT_CHROMIUM_PATH to an installed Chromium executable's path to run them anyway";
    console.warn(
      `\n⚠  BROWSER TESTS SKIPPED — ${fileLabel}: ${count} test(s) skipped because Chromium isn't ` +
        `available to Playwright here. ${hint}. See README.md's "Running the tests" section.\n`
    );
  });
  return {
    skip(t, message) {
      count += 1;
      t.skip(message);
    },
  };
}

module.exports = { launchChromium, trackSkips };
