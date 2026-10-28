/**
 * notes/earth-structure.html's "Name that line" and
 * notes/moon-structure.html's "Name that feature" questions: the
 * highlight has to actually be visible in a real browser, Safari
 * included — a CSS filter/drop-shadow on an SVG shape doesn't render
 * reliably in Safari/WebKit, so the fix (see applyLineQuizHighlight in
 * earth-structure.js and applyFeatureQuizHighlight in moon-structure.js)
 * is plain stroke-width/colour/opacity attributes instead. This file
 * checks the three concrete guarantees that fix is supposed to give:
 * the highlighted shape's own computed stroke width is well above
 * every other shape's, the other shapes are clearly dimmed, and two
 * different questions' diagrams actually render differently.
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

// Reads the stroke width / opacity state of one question's diagram
// (the Nth .question-diagram whose prompt starts with `promptPrefix`),
// scoped to just that diagram so a page with several such questions
// can't bleed state from one into another.
async function readHighlightState(page, promptPrefix, index) {
  return page.evaluate(
    ({ promptPrefix, index }) => {
      const cards = Array.from(document.querySelectorAll('.question-card')).filter((card) =>
        card.querySelector('.question-prompt').textContent.startsWith(promptPrefix)
      );
      const diagram = cards[index].querySelector('.question-diagram');
      const regions = Array.from(diagram.querySelectorAll('.diagram-region'));

      function visibleShapeOf(region) {
        return Array.from(region.children).find((el) => !el.hasAttribute('pointer-events'));
      }

      const highlighted = regions.find((r) => r.classList.contains('diagram-feature-highlight'));
      const dimmed = regions.filter((r) => r !== highlighted);

      return {
        highlightedStrokeWidth: parseFloat(getComputedStyle(visibleShapeOf(highlighted)).strokeWidth),
        dimmedStrokeWidths: dimmed.map((r) => parseFloat(getComputedStyle(visibleShapeOf(r)).strokeWidth)),
        dimmedOpacities: dimmed.map((r) => parseFloat(getComputedStyle(r).opacity)),
        regionCount: regions.length,
      };
    },
    { promptPrefix, index }
  );
}

BROWSERS.forEach((browserDef) => {
  test(`${browserDef.name}: notes/earth-structure.html "Name that line" — highlighted stroke is at least 3x every other, others are dimmed to <= 0.35 opacity`, async (t) => {
    await withBrowser(t, browserDef, async (page) => {
      await page.goto(EARTH_URL);
      await page.waitForTimeout(300);
      const state = await readHighlightState(page, 'Name that line', 0);

      assert.equal(state.regionCount, 8, 'the globe should draw all 8 reference features');
      assert.ok(state.dimmedStrokeWidths.length > 0);
      const widestOther = Math.max(...state.dimmedStrokeWidths);
      assert.ok(
        state.highlightedStrokeWidth >= 3 * widestOther,
        `highlighted stroke width ${state.highlightedStrokeWidth} should be >= 3x the widest other (${widestOther})`
      );
      state.dimmedOpacities.forEach((opacity) => {
        assert.ok(opacity <= 0.35, `dimmed region opacity ${opacity} should be <= 0.35`);
      });
    });
  });

  test(`${browserDef.name}: notes/earth-structure.html "Name that line" — a highlighted pole is a large bold dot (bigger radius, not just a thicker line)`, async (t) => {
    await withBrowser(t, browserDef, async (page) => {
      await page.goto(EARTH_URL);
      await page.waitForTimeout(300);
      const radii = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.question-card')).filter((card) =>
          card.querySelector('.question-prompt').textContent.startsWith('Name that line')
        );
        // North Pole is the first EIGHT_FEATURES entry (see src/earthStructureQuestions.js)
        const diagram = cards[0].querySelector('.question-diagram');
        const highlighted = diagram.querySelector('.diagram-feature-highlight');
        const dimmedPoleCard = cards.find((card) => card !== cards[0]);
        const otherPoleLikeRegion = dimmedPoleCard.querySelector('.question-diagram .diagram-region[data-term="southPole"]');
        const visibleShapeOf = (region) => Array.from(region.children).find((el) => !el.hasAttribute('pointer-events'));
        return {
          highlightedR: parseFloat(visibleShapeOf(highlighted).getAttribute('r')),
          dimmedOtherPoleR: parseFloat(visibleShapeOf(otherPoleLikeRegion).getAttribute('r')),
        };
      });
      assert.ok(
        radii.highlightedR > radii.dimmedOtherPoleR * 2,
        `a highlighted pole's dot (r=${radii.highlightedR}) should be noticeably bigger than an un-highlighted pole's (r=${radii.dimmedOtherPoleR})`
      );
    });
  });

  test(`${browserDef.name}: notes/moon-structure.html "Name that feature" — highlighted outline is at least 3x every other, others are dimmed to <= 0.35 opacity`, async (t) => {
    await withBrowser(t, browserDef, async (page) => {
      await page.goto(MOON_URL);
      await page.waitForTimeout(300);
      const state = await readHighlightState(page, 'Name that feature', 0);

      assert.equal(state.regionCount, 7, 'the map should draw all 7 named features');
      const widestOther = Math.max(...state.dimmedStrokeWidths);
      assert.ok(
        state.highlightedStrokeWidth >= 3 * widestOther,
        `highlighted stroke width ${state.highlightedStrokeWidth} should be >= 3x the widest other (${widestOther})`
      );
      state.dimmedOpacities.forEach((opacity) => {
        assert.ok(opacity <= 0.35, `dimmed region opacity ${opacity} should be <= 0.35`);
      });
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
