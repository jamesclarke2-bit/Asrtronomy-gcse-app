/**
 * notes/observing-techniques.html's three new teacher-review additions:
 * the light-pollution + dark-adaptation star field (limiting magnitude,
 * approx. star count), and the day/night zodiac-at-midnight wheel
 * (midnight direction). Checks that the page's own readouts match
 * src/lightPollution.js and src/dayAndNight.js directly, at phone and
 * iPad widths.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const LightPollution = require('../src/lightPollution');
const DayAndNight = require('../src/dayAndNight');
const PlanetaryMotion = require('../src/planetaryMotion');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'observing-techniques.html');
const DEPS = { PlanetaryMotion };

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/observingTechniquesInteractive.test.js');

const WIDTHS = [
  { name: 'phone', width: 390, height: 2600 },
  { name: 'iPad', width: 768, height: 2600 },
];

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
    await page.waitForTimeout(250);
    await run(page, consoleErrors);
  } finally {
    await browser.close();
  }
}

async function setSlider(page, id, value) {
  await page.locator(`#${id}`).evaluate((el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

WIDTHS.forEach(({ name, width, height }) => {
  test(`${name}: loads with no console errors`, async (t) => {
    await withPage(t, { width, height }, async (page, consoleErrors) => {
      assert.deepEqual(consoleErrors, []);
    });
  });

  test(`${name}: limiting magnitude and star count readouts match src/lightPollution.js for several darkness/adaptation combinations`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      const cases = [
        { scale: 1, minutes: 0 },
        { scale: 1, minutes: 30 },
        { scale: 5, minutes: 15 },
        { scale: 9, minutes: 0 },
        { scale: 9, minutes: 30 },
      ];
      for (const { scale, minutes } of cases) {
        await setSlider(page, 'darkness-slider', scale);
        await setSlider(page, 'adaptation-slider', minutes);
        const expectedMagnitude = LightPollution.currentLimitingMagnitude(scale, minutes);
        const expectedCount = LightPollution.approxVisibleStarCount(expectedMagnitude);

        const magnitudeText = await page.locator('#limiting-magnitude-readout').textContent();
        const countText = await page.locator('#star-count-readout').textContent();

        assert.equal(magnitudeText, `magnitude ${expectedMagnitude.toFixed(1)}`, `scale ${scale}, ${minutes} min`);
        assert.ok(
          countText.includes(expectedCount.toLocaleString('en-GB')),
          `scale ${scale}, ${minutes} min: expected ${expectedCount} stars in "${countText}"`
        );
      }
    });
  });

  test(`${name}: a darker site and more adaptation time always shows at least as many stars drawn on the canvas`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      async function countDrawnStars(scale, minutes) {
        await setSlider(page, 'darkness-slider', scale);
        await setSlider(page, 'adaptation-slider', minutes);
        return LightPollution.STAR_CATALOG.filter((s) => s.magnitude <= LightPollution.currentLimitingMagnitude(scale, minutes)).length;
      }
      const cityUnadapted = await countDrawnStars(9, 0);
      const darkAdapted = await countDrawnStars(1, 30);
      assert.ok(darkAdapted > cityUnadapted, `expected more stars visible at a dark, adapted site (${darkAdapted}) than an unadapted city one (${cityUnadapted})`);
    });
  });

  test(`${name}: the zodiac readout matches src/dayAndNight.js for several months`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      for (const month of [0, 2, 5, 8, 11]) {
        await setSlider(page, 'month-slider', month);
        const date = DayAndNight.dateForMonth(month, new Date().getUTCFullYear());
        const expectedSign = DayAndNight.zodiacVisibleAtMidnight(date, DEPS);
        const monthLabel = await page.locator('#month-label').textContent();
        const readoutText = await page.locator('#zodiac-readout').textContent();
        assert.equal(monthLabel, DayAndNight.MONTH_NAMES[month]);
        assert.ok(readoutText.includes(expectedSign), `month ${month}: expected "${expectedSign}" in "${readoutText}"`);
      }
    });
  });

  test(`${name}: the day/night diagram and zodiac wheel render without horizontal overflow`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      await page.locator('#day-and-night').scrollIntoViewIfNeeded();
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      assert.ok(scrollWidth <= clientWidth + 1, `page should not scroll horizontally (scrollWidth=${scrollWidth}, clientWidth=${clientWidth})`);
    });
  });
});

test('darkness-slider at scale 9 (city centre) makes dark-adaptation time visibly pointless, matching the engine', async (t) => {
  await withPage(t, { width: 1024, height: 2600 }, async (page) => {
    await setSlider(page, 'darkness-slider', 9);
    await setSlider(page, 'adaptation-slider', 0);
    const at0 = await page.locator('#limiting-magnitude-readout').textContent();
    await setSlider(page, 'adaptation-slider', 30);
    const at30 = await page.locator('#limiting-magnitude-readout').textContent();
    assert.equal(at0, at30, 'a city-centre sky should show the same limiting magnitude at 0 and 30 minutes');
    assert.equal(at0, `magnitude ${LightPollution.LIMITING_MAGNITUDE_CITY.toFixed(1)}`);
  });
});

test('the adaptation Play button advances the slider and stops automatically at 30 minutes', async (t) => {
  await withPage(t, { width: 1024, height: 2600 }, async (page) => {
    await setSlider(page, 'adaptation-slider', 0);
    await page.click('#adaptation-play-button');
    await page.waitForTimeout(400);
    const midValue = Number(await page.locator('#adaptation-slider').evaluate((el) => el.value));
    assert.ok(midValue > 0, 'slider should have advanced while playing');
    assert.equal(await page.locator('#adaptation-play-button').textContent(), '❚❚ Pause');

    await page.waitForFunction(
      () => Number(document.getElementById('adaptation-slider').value) >= 30,
      { timeout: 20000 }
    );
    await page.waitForTimeout(100);
    assert.equal(await page.locator('#adaptation-play-button').textContent(), '▶ Play');
    assert.equal(Number(await page.locator('#adaptation-slider').evaluate((el) => el.value)), 30);
  });
});
