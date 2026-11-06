/**
 * sims/moon-phases.html's "Full Moons in a chosen year" year selector: a
 * <select> covering the past 10 and next 10 years (defaulting to the
 * current year) that recomputes the Full Moon list, its Blue Moon
 * markers, and the Harvest/Hunter's names for whichever year is picked —
 * all driven by src/fullMoonNames.js's own engine, never hard-coded.
 * Also covers the "Special names" panel's table styling (row lines and
 * padding, same .shower-table convention as the rest of the site).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const FullMoonNames = require('../src/fullMoonNames');
const MoonPhase = require('../src/moonPhase');
const SolarPosition = require('../src/solarPosition');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'sims', 'moon-phases.html');
const DEPS = { MoonPhase, SolarPosition };

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/moonPhasesYearSelector.test.js');

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

const YEARS_TO_CHECK = [2020, 2023, 2026, 2030];

test('the year select offers exactly the past 10 and next 10 years, defaulting to the current year', async (t) => {
  await withPage(t, { width: 1024, height: 900 }, async (page) => {
    const currentYear = new Date().getUTCFullYear();
    const options = await page.locator('#full-moon-year-select option').allTextContents();
    assert.equal(options.length, 21, 'should offer 21 years: current year plus 10 either side');
    assert.equal(Number(options[0]), currentYear - 10);
    assert.equal(Number(options[options.length - 1]), currentYear + 10);

    const selected = await page.locator('#full-moon-year-select').inputValue();
    assert.equal(Number(selected), currentYear, 'should default to the current year');

    const captionYear = await page.locator('#full-moon-list-year').textContent();
    assert.equal(Number(captionYear), currentYear, 'the table caption should also show the current year on load');
  });
});

YEARS_TO_CHECK.forEach((year) => {
  test(`picking ${year} recomputes the Full Moon list, Blue Moon markers and Harvest/Hunter's names to match the engine`, async (t) => {
    await withPage(t, { width: 1024, height: 900 }, async (page, consoleErrors) => {
      await page.selectOption('#full-moon-year-select', String(year));
      await page.waitForTimeout(100);

      const captionYear = await page.locator('#full-moon-list-year').textContent();
      assert.equal(Number(captionYear), year, 'caption should update to the picked year');

      const expected = FullMoonNames.buildFullMoonList(year, DEPS);
      const rows = page.locator('#full-moon-list-body tr');
      assert.equal(await rows.count(), expected.length, `${year}: row count should match the engine's own Full Moon count`);

      const names = await page.locator('#full-moon-list-body tr td:nth-child(2)').allTextContents();
      const flags = await page.locator('#full-moon-list-body tr').evaluateAll((trs) =>
        trs.map((tr) => tr.querySelector('.blue-moon-flag') !== null)
      );

      expected.forEach((moon, i) => {
        assert.equal(names[i], `${moon.name} Moon`, `${year}: row ${i}'s name should match the engine`);
        assert.equal(flags[i], moon.isBlueMoon, `${year}: row ${i}'s Blue Moon flag should match the engine`);
      });

      assert.ok(expected.some((m) => m.name === 'Harvest'), `${year}: engine should name one Full Moon Harvest`);
      assert.ok(expected.some((m) => m.name === "Hunter's"), `${year}: engine should name one Full Moon Hunter's`);
      assert.ok(names.some((n) => n === 'Harvest Moon'), `${year}: list should show a Harvest Moon row`);
      assert.ok(names.some((n) => n === "Hunter's Moon"), `${year}: list should show a Hunter's Moon row`);

      assert.deepEqual(consoleErrors, [], `${year}: recomputing the list should not log any console errors`);
    });
  });
});

test('switching year repeatedly lands on consistent state (no stale rows left over from a previous year)', async (t) => {
  await withPage(t, { width: 1024, height: 900 }, async (page) => {
    for (const year of [2020, 2030, 2023]) {
      await page.selectOption('#full-moon-year-select', String(year));
      await page.waitForTimeout(100);
      const expectedLength = FullMoonNames.buildFullMoonList(year, DEPS).length;
      assert.equal(await page.locator('#full-moon-list-body tr').count(), expectedLength, `${year}: row count should match after switching years`);
    }
  });
});

test('the "Special names" panel is a real table with row lines and padding, matching the site\'s other tables', async (t) => {
  await withPage(t, { width: 1024, height: 900 }, async (page) => {
    await page.click('#toggle-special-names');
    const table = page.locator('#special-names-panel table.shower-table');
    assert.equal(await table.count(), 1, 'special names should be a .shower-table, same as the rest of the site');

    const rows = table.locator('tbody tr');
    assert.equal(await rows.count(), 4, 'should list Harvest, Hunter\'s, Supermoon/Micromoon and Blood Moon');

    const firstCell = table.locator('td').first();
    const borderBottom = await firstCell.evaluate((el) => getComputedStyle(el).borderBottomWidth);
    const paddingTop = await firstCell.evaluate((el) => getComputedStyle(el).paddingTop);
    assert.notEqual(borderBottom, '0px', 'cells should have a row-separating border, not run together');
    assert.notEqual(paddingTop, '0px', 'cells should have padding separating the text');
  });
});

test('at phone width (390px), the year select and special names table render without horizontal overflow', async (t) => {
  await withPage(t, { width: 390, height: 1600 }, async (page) => {
    await page.click('#toggle-special-names');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    assert.ok(scrollWidth <= clientWidth + 1, `page should not scroll horizontally at phone width (scrollWidth=${scrollWidth}, clientWidth=${clientWidth})`);
  });
});
