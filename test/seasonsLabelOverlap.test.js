/**
 * src/seasonsDiagramView.js's shared seasons diagram, on every page that
 * uses it, at phone and desktop widths and across the year: no label
 * overlaps another, no date or tilt caption (or the takeaway line) sits
 * on an Earth, and every label stays inside the diagram.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');

const PAGES = ['notes/earth-structure.html', 'sims/sun-path.html', 'sims/sun-declination.html', 'sims/sidereal-vs-synodic.html'];
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/seasonsLabelOverlap.test.js');

function problems(page, label) {
  return page.evaluate((stateName) => {
    const container = document.getElementById('seasons-diagram-container');
    const svg = container.querySelector('svg');
    const box = svg.getBoundingClientRect();
    const texts = [...svg.querySelectorAll('text')].map((t) => ({ text: t.textContent, cls: t.getAttribute('class'), r: t.getBoundingClientRect() }));
    const earths = [...svg.querySelectorAll('.seasons-earth-sphere')].map((c) => c.getBoundingClientRect());
    const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const out = [];
    texts.forEach((a, i) => {
      if (a.r.left < box.left - 0.5 || a.r.right > box.right + 0.5 || a.r.top < box.top - 0.5 || a.r.bottom > box.bottom + 0.5) out.push(`${stateName}: "${a.text}" leaves the diagram`);
      texts.slice(i + 1).forEach((b) => {
        if (hit(a.r, b.r)) out.push(`${stateName}: "${a.text}" overlaps "${b.text}"`);
      });
      if (['seasons-date-label', 'seasons-tilt-caption', 'seasons-takeaway'].includes(a.cls)) {
        earths.forEach((e) => {
          if (hit(a.r, e)) out.push(`${stateName}: "${a.text}" runs over an Earth`);
        });
      }
    });
    return out;
  }, label);
}

PAGES.forEach((pagePath) => {
  [
    { name: 'phone', width: 390, height: 844 },
    { name: 'desktop', width: 1280, height: 900 },
  ].forEach(({ name, width, height }) => {
    test(`${pagePath}, ${name}: no seasons-diagram label overlaps another, sits on an Earth, or leaves the diagram`, async (t) => {
      let browser;
      try {
        browser = await launchChromium();
      } catch (err) {
        skip(t, SKIP_MESSAGE(err));
        return;
      }
      try {
        const page = await browser.newPage({ viewport: { width, height } });
        await page.goto('file://' + path.join(__dirname, '..', pagePath));
        await page.waitForTimeout(200);
        const found = await problems(page, 'as loaded');
        const captions = await page.locator('#seasons-diagram-container .seasons-tilt-caption').allTextContents();
        assert.ok(captions.includes('Tilted towards the Sun: summer') && captions.includes('Tilted sideways to the Sun: autumn equinox'));
        for (const dayIndex of [0, 80, 172, 266, 355]) {
          await page.evaluate((d) => window.SeasonsDiagramView.render(document.getElementById('seasons-diagram-container'), { dayIndex: d, lat: 52 }), dayIndex);
          found.push(...(await problems(page, `day ${dayIndex}`)));
        }
        assert.deepEqual(found, []);
      } finally {
        await browser.close();
      }
    });
  });
});
