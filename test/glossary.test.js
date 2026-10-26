/**
 * glossary.js's tap-to-reveal mechanism, in a real browser (Playwright
 * — the same engine scripts/screenshots.js already uses), since this
 * repo has no DOM-simulation dependency and what's under test here
 * (how many click listeners actually fire on one click) isn't
 * observable from parsing the raw script's source text, unlike this
 * repo's usual regex-over-raw-HTML tests.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');

const FIXTURE_HTML = `<!DOCTYPE html>
<html>
<body>
  <button type="button" class="glossary-toggle" data-term="demo" aria-expanded="false">Demo</button>
  <span class="glossary-definition" data-term="demo" hidden></span>
</body>
</html>`;

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/glossary.test.js');

async function withGlossaryPage(t, run) {
  let browser;
  try {
    browser = await launchChromium();
  } catch (err) {
    skip(t, SKIP_MESSAGE(err));
    return;
  }
  try {
    const page = await browser.newPage();
    await page.setContent(FIXTURE_HTML);
    await page.addScriptTag({ path: path.join(__dirname, '..', 'glossary.js') });
    await run(page);
  } finally {
    await browser.close();
  }
}

test('Glossary.init wires a toggle: one click opens its definition', async (t) => {
  await withGlossaryPage(t, async (page) => {
    await page.evaluate(() => window.Glossary.init({ demo: 'A demo term.' }));
    await page.click('.glossary-toggle');
    const hidden = await page.$eval('.glossary-definition', (el) => el.hidden);
    assert.equal(hidden, false, 'one click should open the definition');
  });
});

test('calling Glossary.init a second time on the same toggle attaches exactly one handler: one click still only opens it, not opens-then-closes', async (t) => {
  await withGlossaryPage(t, async (page) => {
    await page.evaluate(() => window.Glossary.init({ demo: 'A demo term.' }));
    await page.evaluate(() => window.Glossary.init({ demo: 'A demo term.' }));
    await page.click('.glossary-toggle');
    const hidden = await page.$eval('.glossary-definition', (el) => el.hidden);
    assert.equal(hidden, false, 'a second init() should not add a second handler that immediately re-closes the definition on the same click');

    const ariaExpanded = await page.$eval('.glossary-toggle', (el) => el.getAttribute('aria-expanded'));
    assert.equal(ariaExpanded, 'true');
  });
});

test('Glossary.init marks every toggle it wires with its own WIRED_ATTRIBUTE, so other code can set the same mark to opt out', async (t) => {
  await withGlossaryPage(t, async (page) => {
    const attrName = await page.evaluate(() => window.Glossary.WIRED_ATTRIBUTE);
    assert.ok(attrName, 'Glossary.WIRED_ATTRIBUTE should be exported');

    await page.evaluate(() => window.Glossary.init({ demo: 'A demo term.' }));
    const hasAttr = await page.$eval('.glossary-toggle', (el, attr) => el.hasAttribute(attr), attrName);
    assert.ok(hasAttr, 'a wired toggle should carry the WIRED_ATTRIBUTE mark');
  });
});

test('a toggle pre-marked with Glossary.WIRED_ATTRIBUTE (e.g. wired directly by a page script) is skipped by init, even though its own term is in the dict', async (t) => {
  await withGlossaryPage(t, async (page) => {
    // Simulate notes/solar-system-bodies.js's table: it wires its own
    // click handler directly, then sets the same mark glossary.js uses,
    // so a later Glossary.init() call leaves that handler alone.
    const manualClicks = await page.evaluate(() => {
      const button = document.querySelector('.glossary-toggle');
      const definition = document.querySelector('.glossary-definition');
      let clicks = 0;
      button.addEventListener('click', () => {
        clicks += 1;
        definition.hidden = !definition.hidden;
      });
      button.setAttribute(window.Glossary.WIRED_ATTRIBUTE, 'true');
      window.Glossary.init({ demo: 'A demo term that init should never apply, since this toggle is pre-wired.' });
      return clicks;
    });
    assert.equal(manualClicks, 0, 'sanity check: no click yet');

    await page.click('.glossary-toggle');
    const hidden = await page.$eval('.glossary-definition', (el) => el.hidden);
    assert.equal(hidden, false, 'the manually-wired handler alone should have opened it — init must not have attached a second one');

    // init should also have left the definition's text alone (it never
    // got as far as checking the dict, since the toggle was skipped).
    const text = await page.$eval('.glossary-definition', (el) => el.textContent);
    assert.equal(text, '', "init should not touch a pre-wired toggle's definition text");
  });
});
