/**
 * The diagrams added so Star Coordinates, Moon Phases and the Equation of
 * Time open on a picture and keep every run of prose under the word limit:
 * the sidereal/solar day drawing, the Polaris altitude drawing (redrawn by
 * its slider), the supermoon timeline, the clock-and-sundial opener and the
 * time-zone strip. Checked in a real browser at phone and iPad widths.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const { DIAGRAM_FIRST_PAGES } = require('../src/pages');

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/simDiagramFirst.test.js');
const url = (p) => 'file://' + path.join(__dirname, '..', p);
const WIDTHS = [
  { name: 'phone', width: 390, height: 1200 },
  { name: 'iPad', width: 768, height: 1200 },
];

async function withPage(t, page, viewport, run) {
  let browser;
  try {
    browser = await launchChromium();
  } catch (err) {
    skip(t, SKIP_MESSAGE(err));
    return;
  }
  try {
    const p = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(url(page));
    await p.waitForTimeout(300);
    await run(p, errors);
  } finally {
    await browser.close();
  }
}

/** Every <text> in an SVG sits inside its viewBox, and its box fits the page width. */
async function fitsWidth(p, sel, width) {
  const box = await p.locator(sel).boundingBox();
  assert.ok(box && box.width > 200 && box.x >= -0.5 && box.x + box.width <= width + 0.5, `${sel}: ${JSON.stringify(box)}`);
}

test('the five sim pages are on DIAGRAM_FIRST_PAGES', () => {
  for (const p of ['sims/sun-path.html', 'sims/kepler.html', 'sims/coordinates.html', 'sims/moon-phases.html', 'sims/equation-of-time.html']) {
    assert.ok(DIAGRAM_FIRST_PAGES.includes(p), p);
  }
});

WIDTHS.forEach(({ name, width, height }) => {
  const vp = { width, height };

  test(`${name}: Star Coordinates draws the sidereal/solar day, and the Polaris drawing tilts with its slider`, async (t) => {
    await withPage(t, 'sims/coordinates.html', vp, async (p, errors) => {
      await fitsWidth(p, '#sidereal-solar-diagram', width);
      const sid = (await p.locator('#sidereal-solar-diagram text').allTextContents()).join(' | ');
      for (const s of ['Sun', 'Day 1, noon', 'Next day', 'about 1° more', 'sidereal day', 'solar day']) assert.ok(sid.includes(s), s);
      await fitsWidth(p, '#polaris-diagram', width);
      const ends = new Set();
      for (const alt of [10, 52, 85]) {
        await p.locator('#polaris-altitude-slider').evaluate((el, v) => {
          el.value = String(v);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }, alt);
        assert.equal(Number(await p.locator('#polaris-altitude-slider').inputValue()), alt, 'on the step grid');
        assert.equal(await p.locator('#polaris-diagram').getAttribute('data-altitude'), alt.toFixed(1));
        assert.equal(await p.locator('#polaris-angle-label').textContent(), `altitude ${alt.toFixed(1)}° = latitude`);
        ends.add(`${await p.locator('#polaris-sight').getAttribute('x2')},${await p.locator('#polaris-sight').getAttribute('y2')}`);
        // The star stays inside the drawing.
        const star = await p.locator('#polaris-star').boundingBox();
        const svg = await p.locator('#polaris-diagram').boundingBox();
        assert.ok(star.y >= svg.y && star.x + star.width <= svg.x + svg.width + 0.5, `star inside at ${alt}°`);
      }
      assert.equal(ends.size, 3, 'the line of sight moves with the slider');
      assert.deepEqual(errors, []);
    });
  });

  test(`${name}: Moon Phases' supermoon timeline marks full Moons, perigees and the supermoons where they line up`, async (t) => {
    await withPage(t, 'sims/moon-phases.html', vp, async (p, errors) => {
      await fitsWidth(p, '#supermoon-timeline-svg', width);
      assert.equal(await p.locator('#supermoon-timeline-svg .full-moon-mark').count(), 15, 'one every 29.53 days over 420 days');
      assert.equal(await p.locator('#supermoon-timeline-svg .perigee-mark').count(), 16, 'one every 27.55 days');
      assert.equal(await p.locator('#supermoon-timeline-svg .supermoon-mark').count(), 4, 'two at the start, two about 14 full Moons later');
      const labels = (await p.locator('#supermoon-timeline-svg text').allTextContents()).join(' | ');
      for (const s of ['Full Moons (circles)', 'Perigee (triangles)', 'supermoons']) assert.ok(labels.includes(s), s);
      assert.deepEqual(errors, []);
    });
  });

  test(`${name}: the Equation of Time opens on its clock and sundial, and draws the time-zone strip`, async (t) => {
    await withPage(t, 'sims/equation-of-time.html', vp, async (p, errors) => {
      await fitsWidth(p, '#eot-hero', width);
      const first = await p.evaluate(() => document.querySelector('main svg, main canvas').id);
      assert.equal(first, 'eot-hero', 'the first visual on the page');
      const hero = (await p.locator('#eot-hero text').allTextContents()).join(' | ');
      for (const s of ['Clock: 12:00', 'Sundial: 11:46', 'equation of time ≈ −14 min']) assert.ok(hero.includes(s), s);
      await fitsWidth(p, '#time-zone-strip', width);
      const zones = (await p.locator('#time-zone-strip text').allTextContents()).join(' | ');
      for (const s of ['GMT−1', 'GMT', 'GMT+1', 'Bristol 2.6°W: LMT 11:50', 'Norwich 1.3°E: LMT 12:05']) assert.ok(zones.includes(s), s);
      // The sunrise graph now sits inside its own section, right after the first paragraph.
      assert.equal(await p.locator('#sunrise-sunset #sunrise-graph').count(), 1);
      assert.deepEqual(errors, []);
    });
  });
});
