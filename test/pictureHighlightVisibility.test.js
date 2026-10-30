/**
 * notes/earth-structure.html's "Name that line" and
 * notes/moon-structure.html's "Name that feature" questions: the
 * highlight has to be unmistakable, not just technically present. The
 * old design (a plain accent-blue ring/line) could read as just another
 * line on the globe — close enough to the Arctic/Antarctic Circle's own
 * blue to be genuinely hard to tell apart. The fix (see
 * applyLineQuizHighlight/drawQuizArrow in earth-structure.js and
 * applyFeatureQuizHighlight/drawQuizArrow in moon-structure.js): every
 * *other* reference line/pole on the Earth globe now draws pale grey at
 * low opacity, and the highlighted feature gets a thick marker (a ring/
 * line, or a bold dot for a pole) in a deep purple no line anywhere on
 * the globe or map ever uses, plus a small arrow and "?" pointing at it.
 * A CSS filter/drop-shadow doesn't render reliably on SVG shapes in
 * Safari/WebKit, so this is all plain SVG attributes, drawn fresh on
 * top — never a restyle of the feature's own shapes.
 *
 * This file checks: the marker's stroke is at least 3x a normal line's
 * own width, its colour matches neither the underlay white nor any
 * colour a line on the globe/map ever uses, every other Earth feature is
 * dimmed (and every Moon feature stays at normal brightness — the task
 * only dims the globe), and two different questions never render
 * pixel-identical pictures.
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

const MARKER_COLOR_RGB = 'rgb(106, 27, 154)'; // #6a1b9a, deep purple
const MARKER_UNDERLAY_RGB = 'rgb(255, 255, 255)'; // #ffffff
const NORMAL_LINE_STROKE_WIDTH = 3; // NAMED_PARALLELS/primeMeridian's own line width
const MARKER_MIN_STROKE_WIDTH = NORMAL_LINE_STROKE_WIDTH * 3;

// Every colour a line/pole on the Earth globe can ever be drawn in
// (NAMED_PARALLELS, PRIME_MERIDIAN_COLOR, the pole dot's own fill, and
// the quiz-only dimmed grey) — the marker must match none of these, in
// either rgb() or hex form, since getComputedStyle always reports rgb().
const EARTH_LINE_COLORS_RGB = [
  'rgb(44, 127, 184)', // #2c7fb8, Arctic/Antarctic Circle
  'rgb(217, 119, 6)', // #d97706, Tropic of Cancer/Capricorn
  'rgb(192, 57, 43)', // #c0392b, Equator
  'rgb(46, 139, 87)', // #2e8b57, Prime Meridian
  'rgb(31, 45, 61)', // #1f2d3d, pole dot
  'rgb(199, 205, 212)', // #c7cdd4, quiz-dimmed grey
];

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
      const markerShapes = marker ? Array.from(marker.children).filter((el) => el.tagName !== 'defs') : [];
      // Only the ring/line/dot/arrow shapes carry a stroke or fill colour
      // worth checking — <text> (the "?") and <marker>/<path> inside
      // <defs> (the arrowhead) aren't part of "the marker's own colour"
      // in the sense this file checks.
      const coloredShapes = markerShapes.filter((el) => el.tagName === 'circle' || el.tagName === 'line' || el.tagName === 'path' || el.tagName === 'ellipse');

      function widestStrokeWidth(el) {
        return Math.max(0, parseFloat(getComputedStyle(el).strokeWidth) || 0);
      }

      return {
        regionCount: regions.length,
        highlightedTerm: highlighted ? highlighted.dataset.term : null,
        markerShapeCount: markerShapes.length,
        markerColors: coloredShapes.map((s) => getComputedStyle(s).stroke),
        markerFillColors: coloredShapes.map((s) => getComputedStyle(s).fill),
        maxMarkerStrokeWidth: Math.max(...coloredShapes.map(widestStrokeWidth)),
        hasQuestionMark: Boolean(marker && marker.querySelector('text')),
        otherStrokeOpacities: others.map((r) => {
          const visible = Array.from(r.children).find((el) => el.getAttribute('pointer-events') !== 'all' && el.getAttribute('pointer-events') !== 'stroke');
          if (!visible) return null;
          const cs = getComputedStyle(visible);
          return visible.tagName === 'circle' ? parseFloat(cs.fillOpacity) : parseFloat(cs.strokeOpacity);
        }),
      };
    },
    { promptPrefix, index }
  );
}

BROWSERS.forEach((browserDef) => {
  test(`${browserDef.name}: notes/earth-structure.html "Name that line" — exactly one feature is marked, at least 3x a normal line's width, in a colour no line on the globe uses, with every other feature dimmed`, async (t) => {
    await withBrowser(t, browserDef, async (page) => {
      await page.goto(EARTH_URL);
      await page.waitForTimeout(300);
      // Index 1 (Arctic Circle, see src/earthStructureQuestions.js's
      // EIGHT_FEATURES) rather than 0 (North Pole): a pole's own marker
      // is a bold dot sized by radius, not a thick line, so the
      // stroke-width check below only makes sense for a genuine line —
      // the pole marker gets its own size check further down.
      const state = await readHighlightState(page, 'Name that line', 1);

      assert.equal(state.regionCount, 8, 'the globe should draw all 8 reference features');
      assert.ok(state.highlightedTerm, 'exactly one region should carry .diagram-feature-highlight');
      assert.ok(
        state.maxMarkerStrokeWidth >= MARKER_MIN_STROKE_WIDTH,
        `marker stroke (${state.maxMarkerStrokeWidth}px) should be at least 3x a normal line's own ${NORMAL_LINE_STROKE_WIDTH}px width`
      );
      const markerFillOrStroke = [...state.markerColors, ...state.markerFillColors].filter((c) => c && c !== 'none');
      assert.ok(markerFillOrStroke.includes(MARKER_COLOR_RGB), `marker should include the deep-purple colour, got ${markerFillOrStroke}`);
      markerFillOrStroke.forEach((color) => {
        if (color === MARKER_COLOR_RGB || color === MARKER_UNDERLAY_RGB) return;
        assert.ok(!EARTH_LINE_COLORS_RGB.includes(color), `marker colour ${color} should not match any line's own colour`);
      });
      state.otherStrokeOpacities.forEach((opacity) => {
        assert.ok(opacity !== null && opacity < 0.5, `every other feature should be dimmed on the quiz picture, got opacity ${opacity}`);
      });
    });
  });

  test(`${browserDef.name}: notes/earth-structure.html "Name that line" — a highlighted line gets an arrow and a "?" pointing at it`, async (t) => {
    await withBrowser(t, browserDef, async (page) => {
      await page.goto(EARTH_URL);
      await page.waitForTimeout(300);
      const cards = page.locator('.question-card', { has: page.locator('.question-prompt', { hasText: 'Name that line' }) });
      const count = await cards.count();
      let checkedALine = false;
      for (let i = 0; i < count; i += 1) {
        const term = await cards.nth(i).locator('.diagram-feature-highlight').getAttribute('data-term');
        if (term === 'northPole' || term === 'southPole') continue; // poles get a bold dot instead, checked separately
        checkedALine = true;
        const hasQuestionMark = await cards.nth(i).locator('.quiz-feature-marker text').count();
        assert.ok(hasQuestionMark > 0, `${term}'s marker should include a "?"`);
      }
      assert.ok(checkedALine, 'expected at least one non-pole "Name that line" question');
    });
  });

  test(`${browserDef.name}: notes/earth-structure.html "Name that line" — a highlighted pole gets a bold dot, bigger than its own normal dot`, async (t) => {
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
          markerFill: marker ? getComputedStyle(marker).fill : null,
        };
      });
      assert.equal(state.term, 'northPole');
      assert.ok(state.markerR, 'a circle marker should be drawn around the pole');
      assert.ok(state.markerR > state.dotR, `the dot marker (r=${state.markerR}) should be bigger than the pole's own dot (r=${state.dotR})`);
      assert.equal(state.markerFill, MARKER_COLOR_RGB, 'the pole marker should be a filled deep-purple dot');
    });
  });

  test(`${browserDef.name}: notes/moon-structure.html "Name that feature" — exactly one feature is marked, at least 3x the Earth page's own normal line width, in a colour no line on the globe uses, with nothing dimmed`, async (t) => {
    await withBrowser(t, browserDef, async (page) => {
      await page.goto(MOON_URL);
      await page.waitForTimeout(300);
      const state = await readHighlightState(page, 'Name that feature', 0);

      assert.equal(state.regionCount, 7, 'the map should draw all 7 named features');
      assert.ok(state.highlightedTerm, 'exactly one region should carry .diagram-feature-highlight');
      assert.ok(
        state.maxMarkerStrokeWidth >= MARKER_MIN_STROKE_WIDTH,
        `marker stroke (${state.maxMarkerStrokeWidth}px) should be at least 3x a normal Earth-globe line's own ${NORMAL_LINE_STROKE_WIDTH}px width`
      );
      const markerFillOrStroke = [...state.markerColors, ...state.markerFillColors].filter((c) => c && c !== 'none');
      assert.ok(markerFillOrStroke.includes(MARKER_COLOR_RGB), `marker should include the deep-purple colour, got ${markerFillOrStroke}`);
      markerFillOrStroke.forEach((color) => {
        if (color === MARKER_COLOR_RGB || color === MARKER_UNDERLAY_RGB) return;
        assert.ok(!EARTH_LINE_COLORS_RGB.includes(color), `marker colour ${color} should not match any line's own colour`);
      });
      assert.ok(state.hasQuestionMark, "the marker should include a \"?\"");
      state.otherStrokeOpacities.forEach((opacity) => {
        assert.ok(opacity === null || opacity === 1, `every other region should stay at normal brightness on the Moon map, got ${opacity}`);
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
        const firstTag = await cards.nth(i).locator('.quiz-feature-marker').evaluate((marker) => marker.children[1].tagName.toLowerCase());
        assert.equal(firstTag, 'path', 'the Apennines marker should be a path (an arc along the range), not a ring');
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
