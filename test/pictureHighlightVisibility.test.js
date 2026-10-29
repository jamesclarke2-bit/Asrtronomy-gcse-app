/**
 * notes/earth-structure.html's "Name that line" and
 * notes/moon-structure.html's "Name that feature" questions: the
 * highlight has to actually be visible in a real browser, Safari
 * included — a CSS filter/drop-shadow on an SVG shape doesn't render
 * reliably in Safari/WebKit, so the fix (see applyLineQuizHighlight in
 * earth-structure.js and applyFeatureQuizHighlight in moon-structure.js)
 * is a single marker shape (a ring/ellipse, or a short arc for a
 * line-like feature) drawn fresh on top of the picture, in plain SVG
 * attributes: the site's own accent blue with a white stroke
 * underneath for contrast. The rest of the picture is left at normal
 * brightness — no dimming — so the surface/globe stays readable. This
 * file checks: the marker is actually there with the right colours,
 * every other region is left at full opacity, and two different
 * questions' diagrams actually render differently.
 *
 * Run in both Chromium and WebKit (Safari's engine) where available —
 * see test/browserLaunch.js's trackSkips for how a missing browser is
 * reported as a skip, not silently dropped.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const { trackSkips } = require('./browserLaunch');

const EARTH_URL = 'file://' + path.join(__dirname, '..', 'notes', 'earth-structure.html');
const MOON_URL = 'file://' + path.join(__dirname, '..', 'notes', 'moon-structure.html');

const { skip } = trackSkips('test/pictureHighlightVisibility.test.js');

const MARKER_COLOR_RGB = 'rgb(42, 107, 214)'; // #2a6bd6
const MARKER_UNDERLAY_RGB = 'rgb(255, 255, 255)'; // #ffffff

const BROWSERS = [
  { name: 'Chromium', launch: () => chromium.launch() },
  { name: 'WebKit', launch: () => webkit.launch() },
];

async function withBrowser(t, browserDef, run) {
  let browser;
  try {
    browser = await browserDef.launch();
  } catch (err) {
    skip(t, `${browserDef.name} isn't available in this environment (${err.message})`);
    return;
  }
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    // The picture questions live inside a collapsed <details> panel; open
    // it so getComputedStyle/screenshot see the real rendered state, not a
    // display:none subtree.
    const originalGoto = page.goto.bind(page);
    page.goto = async (url) => {
      const response = await originalGoto(url);
      await page.evaluate(() => document.querySelectorAll('details.picture-quiz-panel').forEach((d) => (d.open = true)));
      return response;
    };
    await run(page);
  } finally {
    await browser.close();
  }
}

// Reads the marker/region state of one question's diagram (the Nth
// .question-diagram whose prompt starts with `promptPrefix`), scoped to
// just that diagram so a page with several such questions can't bleed
// state from one into another.
async function readHighlightState(page, promptPrefix, index) {
  return page.evaluate(
    ({ promptPrefix, index }) => {
      const cards = Array.from(document.querySelectorAll('.question-card')).filter((card) =>
        card.querySelector('.question-prompt').textContent.startsWith(promptPrefix)
      );
      const diagram = cards[index].querySelector('.question-diagram');
      const regions = Array.from(diagram.querySelectorAll('.diagram-region'));
      const highlighted = regions.find((r) => r.classList.contains('diagram-feature-highlight'));
      const others = regions.filter((r) => r !== highlighted);

      const marker = diagram.querySelector('.quiz-feature-marker');
      const markerShapes = marker ? Array.from(marker.children) : [];

      return {
        regionCount: regions.length,
        highlightedTerm: highlighted ? highlighted.dataset.term : null,
        markerShapeCount: markerShapes.length,
        markerColors: markerShapes.map((s) => getComputedStyle(s).stroke),
        markerFills: markerShapes.map((s) => getComputedStyle(s).fill),
        otherOpacities: others.map((r) => parseFloat(getComputedStyle(r).opacity)),
      };
    },
    { promptPrefix, index }
  );
}

BROWSERS.forEach((browserDef) => {
  test(`${browserDef.name}: notes/earth-structure.html "Name that line" — exactly one feature is marked, with a white-underlay accent-blue ring/arc, and nothing else is dimmed`, async (t) => {
    await withBrowser(t, browserDef, async (page) => {
      await page.goto(EARTH_URL);
      await page.waitForTimeout(300);
      const state = await readHighlightState(page, 'Name that line', 0);

      assert.equal(state.regionCount, 8, 'the globe should draw all 8 reference features');
      assert.ok(state.highlightedTerm, 'exactly one region should carry .diagram-feature-highlight');
      assert.equal(state.markerShapeCount, 2, 'the marker is drawn as two shapes: a white underlay, then the accent-blue ring/arc');
      assert.ok(state.markerColors.includes(MARKER_UNDERLAY_RGB), `marker should include a white underlay stroke, got ${state.markerColors}`);
      assert.ok(state.markerColors.includes(MARKER_COLOR_RGB), `marker should include the accent-blue stroke, got ${state.markerColors}`);
      state.markerFills.forEach((fill) => assert.equal(fill, 'none', 'the marker ring/arc should be unfilled (an outline, not a blob)'));
      state.otherOpacities.forEach((opacity) => {
        assert.equal(opacity, 1, `every other region should stay at normal brightness (opacity 1), got ${opacity}`);
      });
    });
  });

  test(`${browserDef.name}: notes/earth-structure.html "Name that line" — a highlighted pole gets a ring marker, not a resized dot`, async (t) => {
    await withBrowser(t, browserDef, async (page) => {
      await page.goto(EARTH_URL);
      await page.waitForTimeout(300);
      const state = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.question-card')).filter((card) =>
          card.querySelector('.question-prompt').textContent.startsWith('Name that line')
        );
        // North Pole is the first EIGHT_FEATURES entry (see src/earthStructureQuestions.js)
        const diagram = cards[0].querySelector('.question-diagram');
        const highlighted = diagram.querySelector('.diagram-feature-highlight');
        const marker = diagram.querySelector('.quiz-feature-marker circle');
        const visibleShapeOf = (region) => Array.from(region.children).find((el) => !el.hasAttribute('pointer-events'));
        return {
          term: highlighted.dataset.term,
          dotR: parseFloat(visibleShapeOf(highlighted).getAttribute('r')),
          markerR: marker ? parseFloat(marker.getAttribute('r')) : null,
        };
      });
      assert.equal(state.term, 'northPole');
      assert.ok(state.markerR, 'a circle marker should be drawn around the pole');
      assert.ok(state.markerR > state.dotR, `the ring marker (r=${state.markerR}) should be bigger than the pole's own dot (r=${state.dotR})`);
    });
  });

  test(`${browserDef.name}: notes/moon-structure.html "Name that feature" — exactly one feature is marked, with a white-underlay accent-blue ring/ellipse, and nothing else is dimmed`, async (t) => {
    await withBrowser(t, browserDef, async (page) => {
      await page.goto(MOON_URL);
      await page.waitForTimeout(300);
      const state = await readHighlightState(page, 'Name that feature', 0);

      assert.equal(state.regionCount, 7, 'the map should draw all 7 named features');
      assert.ok(state.highlightedTerm, 'exactly one region should carry .diagram-feature-highlight');
      assert.equal(state.markerShapeCount, 2, 'the marker is drawn as two shapes: a white underlay, then the accent-blue ring/ellipse');
      assert.ok(state.markerColors.includes(MARKER_UNDERLAY_RGB), `marker should include a white underlay stroke, got ${state.markerColors}`);
      assert.ok(state.markerColors.includes(MARKER_COLOR_RGB), `marker should include the accent-blue stroke, got ${state.markerColors}`);
      state.otherOpacities.forEach((opacity) => {
        assert.equal(opacity, 1, `every other region should stay at normal brightness (opacity 1), got ${opacity}`);
      });
    });
  });

  test(`${browserDef.name}: notes/moon-structure.html "Name that feature" — the Apennine Mountains get a short arc, not a ring`, async (t) => {
    await withBrowser(t, browserDef, async (page) => {
      await page.goto(MOON_URL);
      await page.waitForTimeout(300);
      const cards = page.locator('.question-card', { has: page.locator('.question-prompt', { hasText: 'Name that feature' }) });
      const count = await cards.count();
      let found = false;
      for (let i = 0; i < count; i += 1) {
        const term = await cards.nth(i).locator('.diagram-feature-highlight').getAttribute('data-term');
        if (term !== 'apennines') continue;
        found = true;
        const markerTag = await cards.nth(i).locator('.quiz-feature-marker').evaluate((marker) => marker.lastElementChild.tagName.toLowerCase());
        assert.equal(markerTag, 'path', 'the Apennines marker should be a path (an arc along the range), not a ring');
      }
      assert.ok(found, 'expected an Apennine Mountains question among the picture quiz cards');
    });
  });

  test(`${browserDef.name}: two different "Name that line" questions render visibly different pictures`, async (t) => {
    await withBrowser(t, browserDef, async (page) => {
      await page.goto(EARTH_URL);
      await page.waitForTimeout(300);
      const cards = page.locator('.question-card', { has: page.locator('.question-prompt', { hasText: 'Name that line' }) });
      const shot1 = await cards.nth(0).locator('.question-diagram').screenshot();
      const shot2 = await cards.nth(1).locator('.question-diagram').screenshot();
      assert.ok(!shot1.equals(shot2), 'two different highlighted lines should not render pixel-identical pictures');
    });
  });

  test(`${browserDef.name}: two different "Name that feature" questions render visibly different pictures`, async (t) => {
    await withBrowser(t, browserDef, async (page) => {
      await page.goto(MOON_URL);
      await page.waitForTimeout(300);
      const cards = page.locator('.question-card', { has: page.locator('.question-prompt', { hasText: 'Name that feature' }) });
      const shot1 = await cards.nth(0).locator('.question-diagram').screenshot();
      const shot2 = await cards.nth(1).locator('.question-diagram').screenshot();
      assert.ok(!shot1.equals(shot2), 'two different highlighted features should not render pixel-identical pictures');
    });
  });
});
