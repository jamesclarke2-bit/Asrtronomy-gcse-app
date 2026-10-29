/**
 * notes/earth-structure.html's three new original SVG diagrams
 * (composition bar, atmosphere layer ladder, transmission window chart)
 * and the nested tap-to-reveal panels added to make the page
 * diagram-first: each is JS-drawn at runtime (empty <svg> in the static
 * markup, like the globe and "Inside the Earth"), so whether they
 * actually draw, stay inside their own viewBox, and whether a
 * two-level reveal (e.g. "What latitude and longitude mean" opening to
 * reveal a further "parallel" button) actually works is runtime DOM
 * state a real browser has to check — same reasoning as
 * test/earthStructureLayers.test.js and test/pictureQuestions.test.js.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'earth-structure.html');

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/earthAtmosphereDiagrams.test.js');

async function withPage(t, viewport, run) {
  let browser;
  try {
    browser = await launchChromium();
  } catch (err) {
    skip(t, SKIP_MESSAGE(err));
    return;
  }
  try {
    const page = await browser.newPage({ viewport });
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));
    await page.goto(PAGE_URL);
    await page.waitForTimeout(200);
    await run(page, consoleErrors);
  } finally {
    await browser.close();
  }
}

const DIAGRAM_IDS = ['composition-bar', 'atmosphere-ladder', 'transmission-chart'];

[{ width: 390, height: 900, label: 'phone (390px)' }, { width: 768, height: 1024, label: 'iPad (768px)' }].forEach((viewport) => {
  test(`notes/earth-structure.html at ${viewport.label}: all three new diagrams draw content that stays inside their own viewBox, with no console errors`, async (t) => {
    await withPage(t, viewport, async (page, consoleErrors) => {
      for (const id of DIAGRAM_IDS) {
        const result = await page.evaluate((id) => {
          const svg = document.getElementById(id);
          const vb = svg.viewBox.baseVal;
          const shapes = Array.from(svg.querySelectorAll('text, rect, line'));
          let maxRight = 0;
          let maxBottom = 0;
          let minLeft = Infinity;
          let minTop = Infinity;
          shapes.forEach((el) => {
            const b = el.getBBox();
            maxRight = Math.max(maxRight, b.x + b.width);
            maxBottom = Math.max(maxBottom, b.y + b.height);
            minLeft = Math.min(minLeft, b.x);
            minTop = Math.min(minTop, b.y);
          });
          return { shapeCount: shapes.length, viewBoxWidth: vb.width, viewBoxHeight: vb.height, maxRight, maxBottom, minLeft, minTop };
        }, id);
        assert.ok(result.shapeCount > 0, `#${id} should have drawn at least one shape`);
        assert.ok(result.maxRight <= result.viewBoxWidth, `#${id}: content (right edge ${result.maxRight}) overflows its viewBox width (${result.viewBoxWidth})`);
        assert.ok(result.maxBottom <= result.viewBoxHeight, `#${id}: content (bottom edge ${result.maxBottom}) overflows its viewBox height (${result.viewBoxHeight})`);
        assert.ok(result.minLeft >= 0, `#${id}: content starts left of the viewBox (x=${result.minLeft})`);
        assert.ok(result.minTop >= 0, `#${id}: content starts above the viewBox (y=${result.minTop})`);
      }
      assert.deepEqual(consoleErrors, [], 'drawing the three diagrams should not log any console errors');
    });
  });
});

test('notes/earth-structure.html: the composition bar names all four gases from the task\'s figures', async (t) => {
  await withPage(t, { width: 1024, height: 1000 }, async (page) => {
    const text = await page.locator('#composition-bar').textContent();
    assert.match(text, /Nitrogen 78%/);
    assert.match(text, /Oxygen 21%/);
    assert.match(text, /Argon ~?1%/);
    assert.match(text, /0\.04%/);
  });
});

test('notes/earth-structure.html: the atmosphere ladder names all four layers with an altitude figure each', async (t) => {
  await withPage(t, { width: 1024, height: 1000 }, async (page) => {
    const text = await page.locator('#atmosphere-ladder').textContent();
    ['Troposphere', 'Stratosphere', 'Mesosphere', 'Thermosphere'].forEach((layer) => {
      assert.ok(text.includes(layer), `ladder should name ${layer}`);
    });
    assert.match(text, /~12 km/);
    assert.match(text, /~50 km/);
    assert.match(text, /~85 km/);
    assert.match(text, /~600 km/);
  });
});

test('notes/earth-structure.html: the transmission chart draws all six bands', async (t) => {
  await withPage(t, { width: 1024, height: 1000 }, async (page) => {
    const text = await page.locator('#transmission-chart').textContent();
    ['Gamma ray', 'X-ray', 'Ultraviolet', 'Optical', 'Infrared', 'Radio'].forEach((band) => {
      assert.ok(text.includes(band), `chart should label ${band}`);
    });
  });
});

// [buttonTerm, definitionTerm] pairs covering every top-level tap-reveal
// this task added, plus the nested term it opens up to (if any).
const REVEAL_CASES = [
  ['latLonBasics', 'latLonBasics', null],
  ['referenceLinesTable', 'referenceLinesTable', null],
  ['tropicsOrigin', 'tropicsOrigin', null],
  ['oblateSpheroid', 'oblateSpheroid', null],
  ['airComposition', 'airComposition', null],
  ['atmosphereLayerFacts', 'atmosphereLayerFacts', null],
  ['atmosphereHelps', 'atmosphereHelps', 'greenhouseEffect'],
  ['atmosphereHinders', 'atmosphereHinders', 'scintillation'],
  ['earthsMotionsDetail', 'earthsMotionsDetail', null],
];

REVEAL_CASES.forEach(([buttonTerm, defTerm, nestedTerm]) => {
  test(`notes/earth-structure.html: the "${buttonTerm}" tap-reveal opens and carries its text`, async (t) => {
    await withPage(t, { width: 1024, height: 1000 }, async (page) => {
      const definition = page.locator(`.glossary-definition[data-term="${defTerm}"]`);
      assert.equal(await definition.evaluate((el) => el.hidden), true, `${defTerm} should start hidden`);
      await page.locator(`button[data-term="${buttonTerm}"]`).click();
      assert.equal(await definition.evaluate((el) => el.hidden), false, `${defTerm} should open after its button is clicked`);
      const text = (await definition.textContent()).trim();
      assert.ok(text.length > 0, `${defTerm} should carry visible text once open`);

      if (nestedTerm) {
        const nestedDef = page.locator(`.glossary-definition[data-term="${nestedTerm}"]`);
        assert.equal(await nestedDef.evaluate((el) => el.hidden), true, `nested term ${nestedTerm} should still start hidden`);
        await page.locator(`button[data-term="${nestedTerm}"]`).click();
        assert.equal(await nestedDef.evaluate((el) => el.hidden), false, `nested term ${nestedTerm} should open after its own button is clicked`);
      }
    });
  });
});

test('notes/earth-structure.html: the reference-lines table kept all eight rows, and the globe kept all eight tap regions', async (t) => {
  await withPage(t, { width: 1024, height: 1000 }, async (page) => {
    await page.locator('button[data-term="referenceLinesTable"]').click();
    const rows = await page.locator('.glossary-definition[data-term="referenceLinesTable"] table tbody tr').count();
    assert.equal(rows, 8);
    const globeRegions = await page.locator('#globe .diagram-region').count();
    assert.equal(globeRegions, 8);
  });
});
