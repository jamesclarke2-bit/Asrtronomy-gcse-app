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

// The one warning a test file prints when any of its browser tests
// skipped, naming each browser that was missing and how many of its tests
// skipped. `counts` maps a browser name ('Chromium', 'WebKit', ...) to a
// skip count. PLAYWRIGHT_CHROMIUM_PATH only ever helps Chromium, so its
// hint is given only when Chromium tests skipped.
function skipWarning(fileLabel, counts, chromiumPath) {
  const browsers = Object.keys(counts).filter((name) => counts[name] > 0);
  if (browsers.length === 0) return null;
  const parts = browsers.map((name) => {
    let part = `${counts[name]} ${name} test(s) skipped because ${name} isn't available to Playwright here`;
    if (name === 'Chromium') {
      part += chromiumPath
        ? ` (PLAYWRIGHT_CHROMIUM_PATH (${chromiumPath}) was tried and still didn't work)`
        : " (set PLAYWRIGHT_CHROMIUM_PATH to an installed Chromium executable's path to run them anyway)";
    }
    return part;
  });
  return `\n⚠  BROWSER TESTS SKIPPED — ${fileLabel}: ${parts.join('; ')}. See README.md's "Running the tests" section.\n`;
}

// Call once per test file, right after computing SKIP_MESSAGE. Returns
// a `skip(t, message, browser)` to call in place of `t.skip(message)` at
// every "if (launchError)" guard — same behaviour, except this file's
// test.after also prints one unmissable warning if any of its tests
// actually skipped, instead of that only showing up as a terse
// "# skipped N" buried in node:test's own run-wide summary. `browser`
// names the browser that was missing; it defaults to 'Chromium', which
// is what every file but test/pictureHighlightVisibility.test.js
// launches.
function trackSkips(fileLabel) {
  const counts = {};
  test.after(() => {
    const warning = skipWarning(fileLabel, counts, process.env.PLAYWRIGHT_CHROMIUM_PATH);
    if (warning) console.warn(warning);
  });
  return {
    skip(t, message, browser = 'Chromium') {
      counts[browser] = (counts[browser] || 0) + 1;
      t.skip(message);
    },
  };
}

module.exports = { launchChromium, trackSkips, skipWarning };
