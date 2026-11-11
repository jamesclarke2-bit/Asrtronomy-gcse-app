/**
 * notes/parallax.html's own interactive UI: the orbit/sky month slider
 * (plus Previous/Next/Play), the distance slider/presets and "show all
 * three" toggle, the geometry diagram's distance slider, and the
 * uncertainty reveal's p/uncertainty inputs — each checked against
 * src/parallax.js directly, never against hard-coded expected text.
 * Phone and iPad widths, per CLAUDE.md rule 14.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const Parallax = require('../src/parallax');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'parallax.html');

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/parallaxInteractive.test.js');

const WIDTHS = [
  { name: 'phone', width: 390, height: 2800 },
  { name: 'iPad', width: 768, height: 2800 },
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

async function setRange(page, selector, value) {
  await page.locator(selector).evaluate((el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

function parseLeadingNumber(text) {
  const match = /-?\d+(\.\d+)?/.exec(text.replace(/,/g, ''));
  return match ? parseFloat(match[0]) : NaN;
}

function monthAngleDeg(month) {
  return (month / 12) * 360;
}

const PHI_DEG = 0;
function parallaxDisplacementArcsec(distancePc, month) {
  const pMax = Parallax.parallaxFromDistance(distancePc);
  const thetaRad = ((monthAngleDeg(month) - PHI_DEG) * Math.PI) / 180;
  return pMax * Math.sin(thetaRad);
}

WIDTHS.forEach(({ name, width, height }) => {
  test(`${name}: loads with no console errors`, async (t) => {
    await withPage(t, { width, height }, async (page, consoleErrors) => {
      assert.deepEqual(consoleErrors, []);
    });
  });

  test(`${name}: the month slider's angle readout matches src/parallax.js across the whole year, at every distance preset`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      for (const distancePc of [2, 5, 10]) {
        await page.click(`[data-distance-pc="${distancePc}"]`);
        for (const month of [0, 3, 6, 9]) {
          await setRange(page, '#month-slider', month);
          const expectedP = Math.abs(parallaxDisplacementArcsec(distancePc, month));
          const expectedPeak = Parallax.parallaxFromDistance(distancePc);
          const readout = await page.locator('#parallax-angle-readout').textContent();
          const parts = readout.split('(');
          assert.ok(
            Math.abs(parseLeadingNumber(parts[0]) - expectedP) < 0.001,
            `distance=${distancePc}pc month=${month}: readout "${readout}" vs expected p=${expectedP.toFixed(3)}`
          );
          assert.ok(
            Math.abs(parseLeadingNumber(parts[1]) - expectedPeak) < 0.001,
            `distance=${distancePc}pc month=${month}: readout "${readout}" vs expected peak=${expectedPeak.toFixed(3)}`
          );
        }
      }
    });
  });

  test(`${name}: Previous and Next buttons step the month slider by one, wrapping Dec↔Jan`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      await setRange(page, '#month-slider', 0);
      await page.click('#month-prev');
      assert.equal(await page.locator('#month-slider').inputValue(), '11');
      assert.equal(await page.locator('#month-label').textContent(), 'Dec');
      await page.click('#month-next');
      assert.equal(await page.locator('#month-slider').inputValue(), '0');
      assert.equal(await page.locator('#month-label').textContent(), 'Jan');
      await setRange(page, '#month-slider', 11);
      await page.click('#month-next');
      assert.equal(await page.locator('#month-slider').inputValue(), '0');
    });
  });

  test(`${name}: Play advances the month slider automatically, and Pause stops it`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      await setRange(page, '#month-slider', 0);
      await page.click('#month-play');
      assert.equal(await page.locator('#month-play').getAttribute('aria-pressed'), 'true');
      await page.waitForFunction(() => document.getElementById('month-slider').value !== '0', null, { timeout: 5000 });
      const advancedValue = await page.locator('#month-slider').inputValue();
      assert.notEqual(advancedValue, '0');
      await page.click('#month-play');
      assert.equal(await page.locator('#month-play').getAttribute('aria-pressed'), 'false');
      const afterPause = await page.locator('#month-slider').inputValue();
      await page.waitForTimeout(1200);
      assert.equal(await page.locator('#month-slider').inputValue(), afterPause, 'slider should not keep moving once paused');
    });
  });

  test(`${name}: the distance slider and comparison sentence match src/parallax.js`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      for (const distancePc of [1, 4, 10, 20]) {
        await setRange(page, '#parallax-distance-slider', distancePc);
        const distanceReadout = await page.locator('#parallax-distance-readout').textContent();
        const expectedPc = distancePc;
        const expectedLy = Parallax.parsecToLightYears(expectedPc);
        assert.ok(Math.abs(parseLeadingNumber(distanceReadout) - expectedPc) < 0.01, `distance readout: "${distanceReadout}"`);
        assert.ok(distanceReadout.includes(expectedLy.toFixed(2)), `distance readout should include ly figure: "${distanceReadout}" vs ${expectedLy.toFixed(2)}`);

        const sentence = await page.locator('#parallax-comparison-sentence').textContent();
        const refPc = 2;
        if (distancePc === refPc) {
          assert.ok(sentence.includes('IS the near reference star'));
        } else {
          const ratio = distancePc / refPc;
          const parallaxRatio = Parallax.parallaxFromDistance(distancePc) / Parallax.parallaxFromDistance(refPc);
          assert.ok(sentence.includes(ratio.toFixed(1)), `comparison sentence distance ratio: "${sentence}"`);
          assert.ok(sentence.includes(parallaxRatio.toFixed(2)), `comparison sentence parallax ratio: "${sentence}"`);
        }
      }
    });
  });

  test(`${name}: the three preset buttons set the distance slider to 2, 5 and 10 pc`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      for (const pc of [2, 5, 10]) {
        await page.click(`[data-distance-pc="${pc}"]`);
        assert.equal(await page.locator('#parallax-distance-slider').inputValue(), String(pc));
        assert.equal(await page.locator('#parallax-distance-label').textContent(), `${pc} pc`);
      }
    });
  });

  test(`${name}: "Show all three together" visibly changes the sky diagram to three lanes with labels`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      const singleLaneCount = await page.locator('#sky-diagram-wrap .sky-lane-label').count();
      assert.equal(singleLaneCount, 0, 'no lane labels before toggling on');
      const markersBefore = await page.locator('#sky-diagram .sky-marker-part').count();
      assert.equal(markersBefore, 1, 'exactly one marker when showing a single star');

      await page.check('#show-all-three-toggle');
      const lanLabels = await page.locator('#sky-diagram-wrap .sky-lane-label').allTextContents();
      assert.deepEqual(lanLabels.sort(), ['10 pc', '2 pc', '5 pc'].sort());
      const markersAfter = await page.locator('#sky-diagram .sky-marker-part').count();
      assert.equal(markersAfter, 3, 'exactly three markers when showing all three');

      await page.uncheck('#show-all-three-toggle');
      const markersUnchecked = await page.locator('#sky-diagram .sky-marker-part').count();
      assert.equal(markersUnchecked, 1, 'back to one marker once unchecked');
    });
  });

  test(`${name}: the geometry diagram's distance slider and angle readout match p = 1/d`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      for (const d of [1, 4, 25, 100]) {
        await setRange(page, '#geometry-distance-slider', d);
        const label = await page.locator('#geometry-distance-label').textContent();
        assert.equal(label, `${d} pc`);
        const readout = await page.locator('#geometry-angle-readout').textContent();
        const expectedP = Parallax.parallaxFromDistance(d);
        assert.ok(Math.abs(parseLeadingNumber(readout) - expectedP) < 0.0005, `d=${d}pc: readout "${readout}" vs expected ${expectedP.toFixed(3)}`);
      }
    });
  });

  test(`${name}: the uncertainty reveal's axis ticks, best-estimate marker and explanation match src/parallax.js`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      await page.click('[data-term="uncertaintyStretch"].glossary-toggle');

      const ticks = await page.locator('.uncertainty-bar-axis-tick').allTextContents();
      assert.deepEqual(ticks, ['0', '50', '100', '150', '200', '250']);

      for (const [p, unc] of [
        [0.01, 0.005],
        [0.02, 0.002],
        [0.05, 0.01],
      ]) {
        await page.fill('#uncertainty-parallax-input', String(p));
        await page.dispatchEvent('#uncertainty-parallax-input', 'input');
        await page.fill('#uncertainty-input', String(unc));
        await page.dispatchEvent('#uncertainty-input', 'input');

        const { nearPc, farPc } = Parallax.parallaxUncertaintyToDistanceRange(p, unc);
        const bestPc = Parallax.distanceFromParallax(p);

        const explanation = await page.locator('#uncertainty-explanation').textContent();
        assert.ok(explanation.includes(p.toFixed(3)), `explanation should state p: "${explanation}"`);
        assert.ok(explanation.includes(unc.toFixed(3)), `explanation should state uncertainty: "${explanation}"`);
        assert.ok(explanation.includes(nearPc.toFixed(1)), `explanation should state near distance: "${explanation}" vs ${nearPc.toFixed(1)}`);
        if (farPc !== null) {
          assert.ok(explanation.includes(farPc.toFixed(1)), `explanation should state far distance: "${explanation}" vs ${farPc.toFixed(1)}`);
        }

        const bestLeft = await page.locator('#uncertainty-bar-best').evaluate((el) => parseFloat(el.style.left));
        assert.ok(Math.abs(bestLeft - Math.min(100, (bestPc / 250) * 100)) < 0.5, `best marker position for p=${p}`);
        const bestLabel = await page.locator('#uncertainty-bar-best').getAttribute('aria-label');
        assert.ok(bestLabel.includes(bestPc.toFixed(1)), `best marker aria-label: "${bestLabel}" vs ${bestPc.toFixed(1)}`);
      }
    });
  });

  test(`${name}: no horizontal overflow at default state or at any slider's extremes`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      async function checkNoOverflow(label) {
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        assert.ok(scrollWidth <= clientWidth + 1, `${label}: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);
      }
      await checkNoOverflow('default');
      await setRange(page, '#month-slider', 11);
      await checkNoOverflow('month-slider=max');
      await setRange(page, '#parallax-distance-slider', 20);
      await checkNoOverflow('distance-slider=max');
      await page.check('#show-all-three-toggle');
      await checkNoOverflow('show-all-three checked');
      await setRange(page, '#geometry-distance-slider', 100);
      await checkNoOverflow('geometry-slider=max');
      await page.click('[data-term="uncertaintyStretch"].glossary-toggle');
      await checkNoOverflow('uncertainty reveal open');
    });
  });

  test(`${name}: practice questions render, located by data-question-id`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      const expectedIds = [
        'distance-from-parallax',
        'parallax-from-distance',
        'parsecs-to-light-years',
        'comparing-two-stars',
        'why-six-months-apart',
        'why-only-nearby-stars',
        'explain-the-geometry',
        'degrees-to-arcseconds',
      ];
      for (const id of expectedIds) {
        const count = await page.locator(`.question-card[data-question-id="${id}"]`).count();
        assert.equal(count, 1, `expected exactly one question card for ${id}`);
      }
    });
  });

  test(`${name}: the four main diagrams each have explicit width and height attributes (rule 15)`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      for (const id of ['orbit-diagram', 'sky-diagram', 'triangle-diagram']) {
        const size = await page.locator(`#${id}`).evaluate((svg) => ({
          width: svg.getAttribute('width'),
          height: svg.getAttribute('height'),
        }));
        assert.ok(size.width && size.height, `svg#${id} is missing an explicit width/height attribute`);
      }
    });
  });
});
