/**
 * sims/sunspot-rotation.html's recording flow: "Record and next day"
 * captures all three tracked spots (0°, 30°, 60°) for the current day
 * in one row, shows "hidden" for any spot behind the limb that day,
 * and auto-advances — so building a full table back is just repeated
 * clicks of the same button, the same "click many times and the
 * pattern appears" feel the single-spot flow lost. "Record 14 days"
 * does the same thing fourteen times in one go. The plot and the
 * per-latitude estimates table update live from the recorded rows,
 * never a hardcoded answer, and a "Reveal" toggle shows the engine's
 * own true period only once the student's made an estimate.
 *
 * A real browser check (Playwright, same engine scripts/screenshots.js
 * already uses), since the table, canvas plot and live estimates are
 * all runtime DOM/canvas state a raw-HTML parse can't see.
 *
 * Checked at a phone width (390px, same convention as
 * test/noHorizontalScroll.test.js) and an iPad width (768px).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const SunRotation = require('../src/sunRotation');
const { launchChromium, trackSkips } = require('./browserLaunch');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'sims', 'sunspot-rotation.html');

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/sunspotRotationRecording.test.js');

const WIDTHS = [
  { label: 'phone', width: 390, height: 1600 },
  { label: 'iPad', width: 768, height: 1600 },
];

const LATS = [0, 30, 60];
const START_LONGITUDE_DEG = -90;
const SPOT_COLORS = { 0: '#c0392b', 30: '#2a6bd6', 60: '#173d75' };
// The model is exactly deterministic (no measurement noise — see
// sims/sunspot-rotation.js), so a two-reading estimate should land
// essentially exactly on the engine's own period; half a day is a
// generous, clearly-stated tolerance rather than requiring bit-exact
// floating point agreement.
const ESTIMATE_TOLERANCE_DAYS = 0.5;

async function withPage(t, width, height, run) {
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
    await page.waitForTimeout(200);
    await run(page);
  } finally {
    await browser.close();
  }
}

async function recordClicks(page, n) {
  for (let i = 0; i < n; i += 1) {
    await page.locator('#record-next-button').click();
    await page.waitForTimeout(15);
  }
}

async function readRows(page) {
  return page.locator('#readings-tbody tr').evaluateAll((trs) => trs.map((tr) => [...tr.children].map((td) => td.textContent)));
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Scans a canvas for any solid, opaque pixel close to the given colour
// — the most direct way to check a canvas-drawn series actually got
// drawn, short of a full pixel-diff image comparison.
async function canvasContainsColor(page, selector, hex, tolerance = 12) {
  const [r, g, b] = hexToRgb(hex);
  return page.$eval(
    selector,
    (canvas, [rr, gg, bb, tol]) => {
      const ctx = canvas.getContext('2d');
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 200 && Math.abs(data[i] - rr) <= tol && Math.abs(data[i + 1] - gg) <= tol && Math.abs(data[i + 2] - bb) <= tol) {
          return true;
        }
      }
      return false;
    },
    [r, g, b, tolerance]
  );
}

function parseDaysValue(text) {
  const m = text.match(/^(-?\d+(?:\.\d+)?) days$/);
  return m ? Number(m[1]) : null;
}

WIDTHS.forEach(({ label, width, height }) => {
  // --- (a) ---------------------------------------------------------

  test(`${label}: (a) 14 clicks of 'Record and next day' gives 14 rows, each day's cell filled or 'hidden' exactly as the engine says`, async (t) => {
    await withPage(t, width, height, async (page) => {
      await recordClicks(page, 14);
      const rows = await readRows(page);
      assert.equal(rows.length, 14, 'expected exactly 14 rows after 14 clicks');

      rows.forEach(([dayStr, x0, x30, x60], i) => {
        assert.equal(Number(dayStr), i, 'rows should be day 0, 1, 2, ... in order');
        const cells = { 0: x0, 30: x30, 60: x60 };
        LATS.forEach((lat) => {
          const lon = SunRotation.apparentLongitudeAtDay(lat, START_LONGITUDE_DEG, i);
          const visible = SunRotation.isOnVisibleDisc(lon);
          if (visible) assert.match(cells[lat], /^-?\d+\.\d$/, `lat ${lat} day ${i} should show a number, got "${cells[lat]}"`);
          else assert.equal(cells[lat], 'hidden', `lat ${lat} day ${i} should show "hidden"`);
        });
      });
    });
  });

  test(`${label}: (a) recording for longer genuinely shows 'hidden' once a spot goes behind the limb, while the other columns stay filled`, async (t) => {
    await withPage(t, width, height, async (page) => {
      await recordClicks(page, 20);
      const rows = await readRows(page);
      assert.equal(rows.length, 20);
      const anyHidden = rows.some((r) => r.includes('hidden'));
      assert.ok(anyHidden, 'expected at least one spot to be behind the limb within 20 days');
      // The slower (higher-latitude) spots should stay visible at least
      // as long as the faster ones — 0° is never visible on a day 30°
      // or 60° is hidden, and 30° is never visible on a day 60° is
      // hidden, matching differential rotation (never the reverse).
      rows.forEach(([, x0, x30, x60]) => {
        if (x0 !== 'hidden') assert.notEqual(x30, 'hidden', '0° visible should imply 30° is too (0° crosses fastest)');
        if (x30 !== 'hidden') assert.notEqual(x60, 'hidden', '30° visible should imply 60° is too (30° crosses faster than 60°)');
      });
    });
  });

  // --- (b) ---------------------------------------------------------

  test(`${label}: (b) all three coloured series appear on the plot once recorded`, async (t) => {
    await withPage(t, width, height, async (page) => {
      await recordClicks(page, 8);
      for (const lat of LATS) {
        const present = await canvasContainsColor(page, '#sunspot-plot', SPOT_COLORS[lat]);
        assert.ok(present, `expected the ${lat}° series' own colour (${SPOT_COLORS[lat]}) to appear on the plot`);
      }
    });
  });

  // --- (c) ---------------------------------------------------------

  test(`${label}: (c) both estimates land within half a day of the engine's true period for each latitude, and 60° is slower than 30° is slower than 0°`, async (t) => {
    await withPage(t, width, height, async (page) => {
      await recordClicks(page, 8);

      const estimates = {};
      for (const lat of LATS) {
        const limbText = await page.locator(`#limb-estimate-${lat}`).textContent();
        const stretchText = await page.locator(`#stretch-estimate-${lat}`).textContent();
        const limb = parseDaysValue(limbText);
        const stretch = parseDaysValue(stretchText);
        assert.ok(limb !== null, `limb-to-limb estimate at ${lat}° should be a number by now, got "${limbText}"`);
        assert.ok(stretch !== null, `stretch estimate at ${lat}° should be a number by now, got "${stretchText}"`);

        const truePeriod = SunRotation.synodicPeriodDays(SunRotation.siderealPeriodDays(lat));
        assert.ok(
          Math.abs(limb - truePeriod) <= ESTIMATE_TOLERANCE_DAYS,
          `${lat}° limb-to-limb estimate ${limb} should be within ${ESTIMATE_TOLERANCE_DAYS} days of the true ${truePeriod.toFixed(2)}`
        );
        assert.ok(
          Math.abs(stretch - truePeriod) <= ESTIMATE_TOLERANCE_DAYS,
          `${lat}° stretch estimate ${stretch} should be within ${ESTIMATE_TOLERANCE_DAYS} days of the true ${truePeriod.toFixed(2)}`
        );
        estimates[lat] = { limb, stretch };
      }

      assert.ok(estimates[0].limb < estimates[30].limb, '0° should rotate faster (shorter period) than 30°');
      assert.ok(estimates[30].limb < estimates[60].limb, '30° should rotate faster (shorter period) than 60°');
      assert.ok(estimates[0].stretch < estimates[30].stretch, '0° should rotate faster (shorter period) than 30° (stretch method)');
      assert.ok(estimates[30].stretch < estimates[60].stretch, '30° should rotate faster (shorter period) than 60° (stretch method)');
    });
  });

  test(`${label}: estimate cells say what's still needed before there's enough data, per spot`, async (t) => {
    await withPage(t, width, height, async (page) => {
      assert.match(await page.locator('#limb-estimate-0').textContent(), /need/i);
      assert.match(await page.locator('#stretch-estimate-0').textContent(), /need/i);

      await recordClicks(page, 1);
      // One reading still isn't enough for either method, for any spot.
      for (const lat of LATS) {
        assert.match(await page.locator(`#limb-estimate-${lat}`).textContent(), /need/i);
      }

      await recordClicks(page, 1);
      // Two readings, on two different days, is enough.
      for (const lat of LATS) {
        assert.doesNotMatch(await page.locator(`#limb-estimate-${lat}`).textContent(), /need/i);
      }
    });
  });

  // --- Reveal toggle -------------------------------------------------

  test(`${label}: the true period stays hidden until 'Reveal' is clicked, then matches the engine for every latitude`, async (t) => {
    await withPage(t, width, height, async (page) => {
      await recordClicks(page, 4);
      assert.equal(await page.locator('#true-period-row').isHidden(), true);

      await page.locator('#reveal-button').click();
      assert.equal(await page.locator('#true-period-row').isHidden(), false);

      for (const lat of LATS) {
        const text = await page.locator(`#true-period-${lat}`).textContent();
        const value = parseDaysValue(text);
        const truePeriod = SunRotation.synodicPeriodDays(SunRotation.siderealPeriodDays(lat));
        assert.ok(value !== null && Math.abs(value - truePeriod) < 0.05, `true period at ${lat}° should match the engine exactly, got "${text}"`);
      }
    });
  });

  // --- (d) ---------------------------------------------------------

  test(`${label}: (d) Undo removes the last row and restores the day control to that row's day`, async (t) => {
    await withPage(t, width, height, async (page) => {
      await recordClicks(page, 5);
      assert.equal((await readRows(page)).length, 5);
      assert.equal(await page.locator('#day-label').textContent(), '5');

      await page.locator('#undo-button').click();
      const rows = await readRows(page);
      assert.equal(rows.length, 4, 'Undo should remove exactly one row');
      assert.deepEqual(
        rows.map((r) => r[0]),
        ['0', '1', '2', '3']
      );
      assert.equal(await page.locator('#day-label').textContent(), '4', 'the day control should go back to the removed row\'s own day');
      assert.equal(await page.locator('#day-slider').inputValue(), '4');
    });
  });

  // --- (e) ---------------------------------------------------------

  test(`${label}: (e) Clear resets the table, plot readiness and estimates`, async (t) => {
    await withPage(t, width, height, async (page) => {
      await recordClicks(page, 6);
      assert.equal((await readRows(page)).length, 6);
      assert.equal(await page.locator('#undo-button').isDisabled(), false);

      await page.locator('#clear-button').click();
      assert.equal((await readRows(page)).length, 0);
      assert.equal(await page.locator('#undo-button').isDisabled(), true);
      assert.equal(await page.locator('#clear-button').isDisabled(), true);
      for (const lat of LATS) {
        assert.match(await page.locator(`#limb-estimate-${lat}`).textContent(), /need/i);
        assert.match(await page.locator(`#stretch-estimate-${lat}`).textContent(), /need/i);
      }
    });
  });

  // --- (f) ---------------------------------------------------------

  test(`${label}: (f) 'Record 14 days' produces exactly the same rows as 14 individual clicks`, async (t) => {
    let singleRows;
    let singleDay;
    await withPage(t, width, height, async (page) => {
      await recordClicks(page, 14);
      singleRows = await readRows(page);
      singleDay = await page.locator('#day-label').textContent();
    });
    if (singleRows === undefined) return; // withPage already skipped (no Chromium)

    let bulkRows;
    let bulkDay;
    await withPage(t, width, height, async (page) => {
      await page.locator('#record-14-button').click();
      await page.waitForTimeout(50);
      bulkRows = await readRows(page);
      bulkDay = await page.locator('#day-label').textContent();
    });

    assert.deepEqual(bulkRows, singleRows, "'Record 14 days' should produce the exact same rows as 14 separate clicks");
    assert.equal(bulkDay, singleDay);
  });

  // --- Marker shapes (colour-blind-safe encoding) ---------------------

  test(`${label}: each spot's legend marker carries a distinct shape class, not colour alone`, async (t) => {
    await withPage(t, width, height, async (page) => {
      assert.equal(await page.locator('.spot-marker-0').count(), 1);
      assert.equal(await page.locator('.spot-marker-30').count(), 1);
      assert.equal(await page.locator('.spot-marker-60').count(), 1);
      const borderRadius0 = await page.locator('.spot-marker-0').evaluate((el) => getComputedStyle(el).borderRadius);
      const borderRadius30 = await page.locator('.spot-marker-30').evaluate((el) => getComputedStyle(el).borderRadius);
      assert.notEqual(borderRadius0, borderRadius30, '0° (circle) and 30° (square) should render with different shapes');
    });
  });
});
