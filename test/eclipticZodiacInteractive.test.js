/**
 * notes/ecliptic-zodiac.html's own interactive UI: the date slider,
 * the Sun/midnight constellation readouts (checked against
 * src/eclipticZodiac.js directly), and the astrology/astronomy date
 * tables (checked for row counts and that only the astronomy one ever
 * lists Ophiuchus). Phone and iPad widths, per CLAUDE.md rule 14.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const EclipticZodiac = require('../src/eclipticZodiac');
const SolarPosition = require('../src/solarPosition');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'ecliptic-zodiac.html');
const DEPS = { SolarPosition };

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/eclipticZodiacInteractive.test.js');

const WIDTHS = [
  { name: 'phone', width: 390, height: 2400 },
  { name: 'iPad', width: 768, height: 2400 },
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

async function setDay(page, dayOfYear) {
  await page.locator('#date-slider').evaluate((el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, dayOfYear);
}

function dateForDay(dayOfYear) {
  return new Date(Date.UTC(EclipticZodiac.REFERENCE_YEAR, 0, 1, 12) + dayOfYear * 86400000);
}

WIDTHS.forEach(({ name, width, height }) => {
  test(`${name}: loads with no console errors`, async (t) => {
    await withPage(t, { width, height }, async (page, consoleErrors) => {
      assert.deepEqual(consoleErrors, []);
    });
  });

  test(`${name}: the Sun/midnight constellation readouts match src/eclipticZodiac.js for several dates, including the Ophiuchus window`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      const daysToCheck = [0, 78, 170, 265, 330, 335, 345, 360];
      for (const day of daysToCheck) {
        await setDay(page, day);
        const date = dateForDay(day);
        const expectedSun = EclipticZodiac.sunConstellation(date, DEPS);
        const expectedMidnight = EclipticZodiac.midnightConstellation(date, DEPS);
        const sunText = await page.locator('#sun-constellation-readout').textContent();
        const midnightText = await page.locator('#midnight-constellation-readout').textContent();
        assert.equal(sunText, expectedSun, `day ${day}`);
        assert.equal(midnightText, expectedMidnight, `day ${day}`);
      }
    });
  });

  test(`${name}: the astrology table has 12 rows and never lists Ophiuchus; the astronomy table has 13 rows and does`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      await page.click('#toggle-astrology-dates');
      await page.click('#toggle-astronomy-dates');

      const astrologyNames = await page.locator('#astrology-dates-tbody th').allTextContents();
      const astronomyNames = await page.locator('#astronomy-dates-tbody th').allTextContents();

      assert.equal(astrologyNames.length, 12);
      assert.equal(astronomyNames.length, 13);
      assert.ok(!astrologyNames.includes('Ophiuchus'), 'astrology table should never list Ophiuchus');
      assert.ok(astronomyNames.includes('Ophiuchus'), 'astronomy table should list Ophiuchus');
    });
  });

  test(`${name}: no horizontal overflow anywhere on the page`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      await page.click('#toggle-astrology-dates');
      await page.click('#toggle-astronomy-dates');
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      assert.ok(scrollWidth <= clientWidth + 1, `scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);
    });
  });

  test(`${name}: practice questions render`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      const count = await page.locator('#questions-list button, #questions-list input, #questions-list .quiz-question').count();
      assert.ok(count > 0, 'expected the questions list to render some interactive content');
    });
  });
});

test('dragging the date slider across a whole year never shows a constellation name outside src/eclipticZodiac.js\'s own 13, and the readouts stay internally consistent (opposite by construction)', async (t) => {
  await withPage(t, { width: 1024, height: 2400 }, async (page) => {
    const validNames = new Set(EclipticZodiac.IAU_BOUNDARY_DATES.map((b) => b.name));
    for (let day = 0; day < 365; day += 23) {
      await setDay(page, day);
      const sunText = await page.locator('#sun-constellation-readout').textContent();
      const midnightText = await page.locator('#midnight-constellation-readout').textContent();
      assert.ok(validNames.has(sunText), `day ${day}: "${sunText}" not a real constellation`);
      assert.ok(validNames.has(midnightText), `day ${day}: "${midnightText}" not a real constellation`);
      const date = dateForDay(day);
      assert.equal(midnightText, EclipticZodiac.midnightConstellation(date, DEPS), `day ${day}: midnight readout should match the engine`);
    }
  });
});
