/**
 * notes/tides.html's rendered timing and Sun-vs-Moon figures: these are
 * filled in by notes/tides.js at runtime (the raw HTML only has empty
 * <strong id="..."> placeholders), so checking them needs a real browser
 * rather than a regex over the static file, unlike this repo's usual
 * template tests. Every expected value is computed here from src/tides.js
 * directly, so a question can never quote a number the page itself would
 * disagree with.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const T = require('../src/tides');
const { launchChromium, trackSkips } = require('./browserLaunch');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'tides.html');

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/tidesPage.test.js');

function formatHoursMinutes(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h} hours ${m} minutes`;
}

async function withTidesPage(t, run) {
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

test('the lunar-day paragraph states the lunar day, the gap between high tides, and the daily lag — all three live-computed, never hand-typed', async (t) => {
  await withTidesPage(t, async (page) => {
    const lunarDay = await page.$eval('#lunar-day', (el) => el.textContent);
    const halfLunarDay = await page.$eval('#half-lunar-day', (el) => el.textContent);
    const dailyLag = await page.$eval('#daily-lag', (el) => el.textContent);

    assert.equal(lunarDay, formatHoursMinutes(T.LUNAR_DAY_HOURS));
    assert.equal(halfLunarDay, formatHoursMinutes(T.LUNAR_DAY_HOURS / 2));
    assert.equal(dailyLag, `${Math.round((T.LUNAR_DAY_HOURS - 24) * 60)} minutes`);
    assert.equal(lunarDay, '24 hours 50 minutes');
    assert.equal(halfLunarDay, '12 hours 25 minutes');
    assert.equal(dailyLag, '50 minutes');
  });
});

test('the page never claims high tides are "24 hours 50 minutes apart" (that is the lunar day, not the gap between high tides)', async (t) => {
  await withTidesPage(t, async (page) => {
    const bodyText = await page.evaluate(() => document.body.innerText);
    assert.ok(!/24\s*hours?\s*50\s*minutes?\s*apart/i.test(bodyText), 'page text should not say "24 hours 50 minutes apart"');
  });
});

test('the Sun-vs-Moon heading, step list and diagram captions quote the live pull and stretch ratios', async (t) => {
  await withTidesPage(t, async (page) => {
    const pullRounded = String(Math.round(T.sunToMoonPullRatio() / 10) * 10);
    const tideRatioText = T.TIDE_RATIO.toFixed(2);
    const distanceRatio = String(Math.round(T.SUN_DISTANCE_KM / T.MOON_DISTANCE_KM / 10) * 10);

    assert.equal(await page.$eval('#pull-ratio-heading', (el) => el.textContent), pullRounded);
    assert.equal(await page.$eval('#pull-ratio-caption', (el) => el.textContent), pullRounded);
    assert.equal(await page.$eval('#tide-ratio-step', (el) => el.textContent), tideRatioText);
    assert.equal(await page.$eval('#tide-ratio-caption', (el) => el.textContent), tideRatioText);
    assert.equal(await page.$eval('#distance-ratio', (el) => el.textContent), distanceRatio);
  });
});

test('the whyMoonWins tap-to-reveal is relabelled, and the beach panels and pull/stretch diagram render without console errors', async (t) => {
  await withTidesPage(t, async (page) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    const toggleLabel = await page.$eval('[data-term="whyMoonWins"].glossary-toggle', (el) => el.textContent.trim());
    assert.equal(toggleLabel, 'Why does the Moon beat the Sun at making tides?');

    const beachHighVisuals = await page.$eval('#beach-high', (el) => el.childElementCount);
    const beachLowVisuals = await page.$eval('#beach-low', (el) => el.childElementCount);
    assert.ok(beachHighVisuals > 0, 'beach-high svg should have drawn content');
    assert.ok(beachLowVisuals > 0, 'beach-low svg should have drawn content');

    const pullStretchVisuals = await page.$eval('#pull-stretch-diagram', (el) => el.childElementCount);
    assert.ok(pullStretchVisuals > 0, 'pull-stretch-diagram svg should have drawn content');

    await page.waitForTimeout(100);
    assert.deepEqual(errors, []);
  });
});
