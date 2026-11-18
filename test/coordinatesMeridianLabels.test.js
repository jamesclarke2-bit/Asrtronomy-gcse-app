/**
 * sims/coordinates.html in a real browser, at phone and desktop widths: in
 * the meridian cross-section, no label (pole, equator, the star's upper
 * and lower transit, the 30° and 60° ticks, S, N, Zenith and the
 * "transit only" note) overlaps another or leaves the canvas, at any
 * latitude and declination. The default case, Polaris from latitude 52°,
 * puts the NCP and both of the star's labels on almost the same point.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'sims', 'coordinates.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/coordinatesMeridianLabels.test.js');

async function sweep(page, cases) {
  return page.evaluate((list) => {
    const set = (id, v) => {
      const el = document.getElementById(id);
      el.value = String(v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const c = document.getElementById('meridian-diagram');
    const out = [];
    let checked = 0;
    list.forEach(([lat, dec]) => {
      set('lat-slider', lat);
      set('dec-slider', dec);
      const labels = JSON.parse(c.dataset.labels);
      checked += 1;
      labels.forEach((a, i) => {
        if (a.x < 0 || a.y < 0 || a.x + a.w > c.width || a.y + a.h > c.height) out.push(`lat ${lat}, dec ${dec}: "${a.text}" leaves the canvas`);
        labels.slice(i + 1).forEach((b) => {
          if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) out.push(`lat ${lat}, dec ${dec}: "${a.text}" overlaps "${b.text}"`);
        });
      });
    });
    return { out, checked };
  }, cases);
}

[
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
].forEach(({ name, width, height }) => {
  test(`${name}: meridian cross-section labels never overlap or leave the canvas`, async (t) => {
    let browser;
    try {
      browser = await launchChromium();
    } catch (err) {
      skip(t, SKIP_MESSAGE(err));
      return;
    }
    try {
      const page = await browser.newPage({ viewport: { width, height } });
      await page.goto(PAGE_URL);
      const labels = JSON.parse(await page.locator('#meridian-diagram').getAttribute('data-labels'));
      const texts = labels.map((l) => l.text);
      for (const s of ['NCP 52.0°', 'Upper 52.7°', 'Lower 51.3°', 'Equator 38.0°', 'Zenith']) assert.ok(texts.includes(s), `default view labels ${s}`);
      const cases = [[52, 89.26]];
      for (let lat = -90; lat <= 90; lat += 5) for (let dec = -90; dec <= 90; dec += 5) cases.push([lat, dec]);
      for (let dec = 80; dec <= 90; dec += 0.5) cases.push([52, dec]);
      const { out, checked } = await sweep(page, cases);
      assert.equal(checked, cases.length);
      assert.deepEqual(out, []);
    } finally {
      await browser.close();
    }
  });
});
