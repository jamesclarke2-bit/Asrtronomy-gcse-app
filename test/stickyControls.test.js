/**
 * On short phone screens the sims' pinned controls panel must never sit on
 * top of the page's central diagram (the first sizeable drawing in the
 * tool layout). At 390x664 and 375x667: when the page opens, the panel,
 * if shown, doesn't overlap the diagram; if it starts closed, "Show
 * controls" (right under the diagram) opens it with the whole diagram on
 * screen and still clear of the panel, and "Hide controls" closes it. On a
 * wide screen the controls stay a sidebar with neither button shown.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/stickyControls.test.js');
const ROOT = path.join(__dirname, '..');
const SIMS = fs.readdirSync(path.join(ROOT, 'sims')).filter((f) => f.endsWith('.html')).map((f) => `sims/${f}`)
  .filter((p) => fs.readFileSync(path.join(ROOT, p), 'utf8').includes('tool-layout'));

function measure(page) {
  return page.evaluate(() => {
    const layout = document.querySelector('.tool-layout');
    const panel = layout.querySelector(':scope > .controls');
    const diagram = [...layout.querySelectorAll('.diagrams-column canvas, .diagrams-column svg')].find((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 100 && r.height > 100;
    });
    const shown = getComputedStyle(panel).display !== 'none';
    const p = panel.getBoundingClientRect();
    const d = diagram.getBoundingClientRect();
    const covered = shown ? Math.max(0, Math.min(d.bottom, p.bottom, innerHeight) - Math.max(d.top, p.top, 0)) : 0;
    return { state: layout.dataset.controls, shown, covered, diagTop: d.top, diagBottom: d.bottom, vh: innerHeight };
  });
}

test('every sim with a pinned controls panel loads the panel script', () => {
  assert.ok(SIMS.length >= 10, SIMS.join(', '));
  for (const p of SIMS) assert.match(fs.readFileSync(path.join(ROOT, p), 'utf8'), /controlsPanel\.js\?v=\d{12}/, p);
});

for (const [width, height] of [[390, 664], [375, 667]]) {
  test(`${width}x${height}: no sim's controls panel covers its central diagram, closed or opened`, async (t) => {
    let browser;
    try {
      browser = await launchChromium();
    } catch (err) {
      skip(t, SKIP_MESSAGE(err));
      return;
    }
    try {
      const collapsed = [];
      for (const sim of SIMS) {
        const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
        await page.goto('file://' + path.join(ROOT, sim));
        await page.waitForTimeout(400);
        const load = await measure(page);
        assert.equal(load.covered, 0, `${sim}: ${load.covered}px of the diagram covered when the page opens`);
        const show = page.locator('.controls-show-button');
        if (load.state === 'collapsed') {
          collapsed.push(sim);
          assert.ok(await show.isVisible(), `${sim}: "Show controls" is offered`);
          const box = await show.boundingBox();
          assert.ok(box.y >= load.diagBottom - 1, `${sim}: the button sits under the diagram`);
          await show.click();
          await page.waitForTimeout(150);
          const open = await measure(page);
          assert.equal(open.state, 'open');
          assert.ok(open.shown, `${sim}: the panel opens`);
          assert.ok(open.diagTop >= -1 && open.diagBottom <= open.vh + 1, `${sim}: the whole diagram is on screen`);
          assert.equal(open.covered, 0, `${sim}: ${open.covered}px covered once the controls are open`);
          await page.locator('.controls-hide-button').click();
          assert.equal((await measure(page)).state, 'collapsed', `${sim}: "Hide controls" closes the panel`);
        } else {
          assert.equal(await show.isVisible(), false, `${sim}: no "Show controls" while the panel is open`);
        }
        await page.close();
      }
      // The pages where the pinned panel used to sit on the diagram as they opened.
      for (const sim of ['sims/kepler.html', 'sims/sun-path.html', 'sims/moon-phases.html', 'sims/orbits-gravity.html', 'sims/shadows-and-sundials.html']) {
        assert.ok(collapsed.includes(sim), `${sim} starts with its controls closed`);
      }
    } finally {
      await browser.close();
    }
  });
}

test('wide screen: the controls are a sidebar, with neither button shown', async (t) => {
  let browser;
  try {
    browser = await launchChromium();
  } catch (err) {
    skip(t, SKIP_MESSAGE(err));
    return;
  }
  try {
    for (const sim of ['sims/kepler.html', 'sims/sun-path.html']) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await page.goto('file://' + path.join(ROOT, sim));
      await page.waitForTimeout(300);
      assert.equal(await page.locator('.controls-show-button').isVisible(), false, sim);
      assert.equal(await page.locator('.controls-hide-button').isVisible(), false, sim);
      assert.equal((await measure(page)).state, 'open', sim);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
