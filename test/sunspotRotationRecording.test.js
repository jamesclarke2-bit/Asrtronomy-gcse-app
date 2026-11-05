/**
 * sims/sunspot-rotation.html's recording flow: a day control (slider +
 * Previous/Next day buttons) drives both the disc diagram and which
 * day "Record this position" reads, recording auto-advances the day so
 * a run of readings is just repeated clicks, the plot and both period
 * estimates (limb-to-limb doubling, two-reading stretch) update live as
 * rows are added, and Undo removes the last one. A real browser check
 * (Playwright, same engine scripts/screenshots.js already uses), since
 * this is all runtime DOM/canvas state a raw-HTML parse can't see.
 *
 * Checked at a phone width (390px, same convention as
 * test/noHorizontalScroll.test.js) and an iPad width (768px).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'sims', 'sunspot-rotation.html');

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/sunspotRotationRecording.test.js');

const WIDTHS = [
  { label: 'phone', width: 390, height: 1400 },
  { label: 'iPad', width: 768, height: 1400 },
];

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

async function recordedRowCount(page) {
  return page.locator('#readings-tbody tr').count();
}

WIDTHS.forEach(({ label, width, height }) => {
  test(`${label}: recording on three days adds three rows, auto-advancing the day each time`, async (t) => {
    await withPage(t, width, height, async (page) => {
      assert.equal(await page.locator('#day-label').textContent(), '0', 'should start on day 0');

      for (let i = 0; i < 3; i += 1) {
        await page.locator('#record-button').click();
        await page.waitForTimeout(30);
      }

      assert.equal(await recordedRowCount(page), 3, 'should have 3 recorded rows');
      assert.equal(await page.locator('#day-label').textContent(), '3', 'day should have auto-advanced to 3 after 3 records');

      const days = await page.locator('#readings-tbody tr td:first-child').allTextContents();
      assert.deepEqual(days, ['0', '1', '2'], 'should have recorded days 0, 1 and 2, in order');
    });
  });

  test(`${label}: both period estimates say what's needed before enough readings exist, then update once they do`, async (t) => {
    await withPage(t, width, height, async (page) => {
      const limbReadout = page.locator('#limb-to-limb-readout');
      const stretchReadout = page.locator('#stretch-estimate-readout');

      // Before any readings: both say what's needed, neither shows a number.
      assert.match(await limbReadout.textContent(), /record at least one reading/i);
      assert.match(await stretchReadout.textContent(), /record at least two readings/i);

      // After one reading: limb-to-limb has enough, stretch still doesn't.
      await page.locator('#record-button').click();
      await page.waitForTimeout(30);
      assert.doesNotMatch(await limbReadout.textContent(), /record at least/i);
      assert.match(await limbReadout.textContent(), /\d+(\.\d+)? days/);
      assert.match(await stretchReadout.textContent(), /record at least two readings/i);

      // After three readings (on three different days): both show a live estimate.
      await page.locator('#record-button').click();
      await page.waitForTimeout(30);
      await page.locator('#record-button').click();
      await page.waitForTimeout(30);
      assert.doesNotMatch(await stretchReadout.textContent(), /record at least/i);
      assert.match(await stretchReadout.textContent(), /day-0 and day-2 readings.*estimated period of about \d+(\.\d+)? days/);
    });
  });

  test(`${label}: undo removes exactly the last reading and updates the table, plot readiness and estimates`, async (t) => {
    await withPage(t, width, height, async (page) => {
      for (let i = 0; i < 3; i += 1) {
        await page.locator('#record-button').click();
        await page.waitForTimeout(30);
      }
      assert.equal(await recordedRowCount(page), 3);
      assert.equal(await page.locator('#undo-button').isDisabled(), false);

      await page.locator('#undo-button').click();
      await page.waitForTimeout(30);
      assert.equal(await recordedRowCount(page), 2, 'undo should remove exactly one row');
      const remainingDays = await page.locator('#readings-tbody tr td:first-child').allTextContents();
      assert.deepEqual(remainingDays, ['0', '1'], 'should have removed the day-2 reading (the last one recorded), not an arbitrary one');

      // Two readings on different days is still enough for the stretch estimate.
      assert.doesNotMatch(await page.locator('#stretch-estimate-readout').textContent(), /record at least/i);

      // Undo down to zero: both estimates revert to "not enough readings" and the buttons disable.
      await page.locator('#undo-button').click();
      await page.waitForTimeout(30);
      await page.locator('#undo-button').click();
      await page.waitForTimeout(30);
      assert.equal(await recordedRowCount(page), 0);
      assert.equal(await page.locator('#undo-button').isDisabled(), true, 'undo should disable once there is nothing left to undo');
      assert.equal(await page.locator('#clear-button').isDisabled(), true);
      assert.match(await page.locator('#limb-to-limb-readout').textContent(), /record at least one reading/i);
      assert.match(await page.locator('#stretch-estimate-readout').textContent(), /record at least two readings/i);
    });
  });

  test(`${label}: the day control (slider, Previous/Next buttons) stays in sync and disables at the ends of its range`, async (t) => {
    await withPage(t, width, height, async (page) => {
      assert.equal(await page.locator('#prev-day-button').isDisabled(), true, 'Previous day should be disabled on day 0');

      await page.locator('#next-day-button').click();
      assert.equal(await page.locator('#day-label').textContent(), '1');
      assert.equal(await page.locator('#day-slider').inputValue(), '1');
      assert.equal(await page.locator('#prev-day-button').isDisabled(), false);

      await page.locator('#prev-day-button').click();
      assert.equal(await page.locator('#day-label').textContent(), '0');
      assert.equal(await page.locator('#prev-day-button').isDisabled(), true);

      // Jump to the last day via the slider itself: Next day should disable.
      await page.locator('#day-slider').evaluate((el) => {
        el.value = el.max;
        el.dispatchEvent(new Event('input'));
      });
      assert.equal(await page.locator('#next-day-button').isDisabled(), true);
    });
  });

  test(`${label}: a spot that's beyond the limb disables Record and explains why, instead of only erroring after the click`, async (t) => {
    await withPage(t, width, height, async (page) => {
      // The equatorial spot (the default selection) has left the visible
      // disc well before day 20 — see src/sunRotation.js's own synodic
      // period at latitude 0.
      await page.locator('#day-slider').evaluate((el) => {
        el.value = el.max;
        el.dispatchEvent(new Event('input'));
      });
      assert.equal(await page.locator('#record-button').isDisabled(), true);
      assert.match(await page.locator('#day-visibility-note').textContent(), /isn't on the visible disc/);
    });
  });
});
