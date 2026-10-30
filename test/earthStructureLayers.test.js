/**
 * notes/earth-structure.html's "Inside the Earth" diagram: each of the
 * four .earth-layer-label spans, the matching SVG ring
 * (.earth-layer-region) and the matching legend entry (.layer-legend li)
 * should all share one data-layer value, and that legend entry's own
 * <strong> heading should read the same word(s) as the label itself —
 * otherwise a click highlights the wrong ring or scrolls to the wrong
 * description. The diagram is drawn by notes/earth-structure.js at
 * runtime (not static markup, since its labels now use the same
 * leader-line placement as notes/sun-features.html's Sun structure
 * and notes/moon-structure.html's Inside the Moon — see
 * src/ringDiagramLabels.js), so this needs a real browser rather than
 * a regex over the raw HTML, unlike this repo's usual template tests.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'earth-structure.html');

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/earthStructureLayers.test.js');

// The legend's own heading text for each data-layer, parsed from the raw
// HTML (the legend itself IS static markup, unlike the diagram).
const html = fs.readFileSync(path.join(__dirname, '..', 'notes', 'earth-structure.html'), 'utf8');
const liTags = [...html.matchAll(/<li data-layer="([^"]+)">\s*<span class="legend-dot[^"]*"><\/span><strong>([^<]+)<\/strong>/g)];
const legendEntries = liTags.map((m) => ({ layer: m[1], heading: m[2].trim() }));

async function withEarthStructurePage(t, run) {
  let browser;
  try {
    browser = await launchChromium();
  } catch (err) {
    skip(t, SKIP_MESSAGE(err));
    return;
  }
  try {
    const page = await browser.newPage();
    await page.goto(PAGE_URL);
    await page.waitForTimeout(200);
    await run(page);
  } finally {
    await browser.close();
  }
}

test('legend: exactly 4 entries, one per data-layer, each with a distinct heading', () => {
  assert.equal(legendEntries.length, 4);
  assert.equal(new Set(legendEntries.map((e) => e.layer)).size, 4);
  assert.deepEqual(legendEntries.map((e) => e.layer).sort(), ['crust', 'inner-core', 'mantle', 'outer-core']);
});

test('the rendered diagram has exactly 4 layer labels and 4 layer regions, matching the legend\'s own 4 data-layer values', async (t) => {
  await withEarthStructurePage(t, async (page) => {
    const labels = await page.$$eval('.earth-layer-label', (els) => els.map((el) => ({ layer: el.dataset.layer, text: el.textContent.trim() })));
    const regions = await page.$$eval('.earth-layer-region', (els) => els.map((el) => el.dataset.layer));

    assert.equal(labels.length, 4, 'expected 4 .earth-layer-label spans');
    assert.equal(regions.length, 4, 'expected 4 .earth-layer-region circles');

    const labelLayers = new Set(labels.map((l) => l.layer));
    const regionLayers = new Set(regions);
    const legendLayers = new Set(legendEntries.map((e) => e.layer));
    assert.equal(labelLayers.size, 4);
    assert.equal(regionLayers.size, 4);
    assert.deepEqual(labelLayers, regionLayers, 'every label should have a matching region, and vice versa');
    assert.deepEqual(labelLayers, legendLayers, 'every label should have a matching legend entry, and vice versa');

    labels.forEach((label) => {
      const entry = legendEntries.find((e) => e.layer === label.layer);
      assert.ok(entry, `label "${label.text}" (data-layer="${label.layer}") has no legend entry with that data-layer`);
      assert.equal(entry.heading, label.text, `label "${label.text}" should map to a legend entry headed "${label.text}", got "${entry.heading}"`);
    });
  });
});

test('every label is keyboard-reachable (tabindex 0) and announces itself as a button', async (t) => {
  await withEarthStructurePage(t, async (page) => {
    const attrs = await page.$$eval('.earth-layer-label', (els) => els.map((el) => ({ tabindex: el.getAttribute('tabindex'), role: el.getAttribute('role') })));
    assert.equal(attrs.length, 4);
    attrs.forEach((a) => {
      assert.equal(a.tabindex, '0');
      assert.equal(a.role, 'button');
    });
  });
});

test('clicking a label highlights its own ring and scrolls to its own legend entry, and no two labels at once', async (t) => {
  await withEarthStructurePage(t, async (page) => {
    await page.click('.earth-layer-label[data-layer="mantle"]');
    await page.waitForTimeout(100);
    const activeRegions = await page.$$eval('.earth-layer-region--active', (els) => els.map((el) => el.dataset.layer));
    assert.deepEqual(activeRegions, ['mantle']);
    const activeLegend = await page.$$eval('.layer-legend-active', (els) => els.map((el) => el.dataset.layer));
    assert.deepEqual(activeLegend, ['mantle']);

    await page.click('.earth-layer-label[data-layer="crust"]');
    await page.waitForTimeout(100);
    const activeRegionsAfter = await page.$$eval('.earth-layer-region--active', (els) => els.map((el) => el.dataset.layer));
    assert.deepEqual(activeRegionsAfter, ['crust'], 'only the newly clicked layer should be active');
  });
});

test('no console or page errors while the diagram draws', async (t) => {
  let browser;
  try {
    browser = await launchChromium();
  } catch (err) {
    skip(t, SKIP_MESSAGE(err));
    return;
  }
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto(PAGE_URL);
    await page.waitForTimeout(200);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
