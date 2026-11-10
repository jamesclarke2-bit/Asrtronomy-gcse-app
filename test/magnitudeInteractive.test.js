/**
 * notes/magnitude.html's own interactive UI: the apparent/absolute
 * distance slider, the brightness-ratio slider, and the distance
 * modulus calculator's preset buttons — each checked against
 * src/magnitude.js directly, never against hard-coded expected text.
 * Phone and iPad widths, per CLAUDE.md rule 14. Quiz questions are
 * located by their data-question-id attribute (quiz-ui.js), never by
 * text or position, per this page's own task requirement.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const Magnitude = require('../src/magnitude');
const Parallax = require('../src/parallax');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'magnitude.html');

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/magnitudeInteractive.test.js');

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

WIDTHS.forEach(({ name, width, height }) => {
  test(`${name}: loads with no console errors`, async (t) => {
    await withPage(t, { width, height }, async (page, consoleErrors) => {
      assert.deepEqual(consoleErrors, []);
    });
  });

  test(`${name}: the idea diagram's apparent-magnitude readout matches src/magnitude.js across the whole distance slider`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      for (const sliderValue of [0, 0.5, 1, 1.5, 2, 2.5, 3]) {
        await setRange(page, '#idea-distance-slider', sliderValue);
        const distancePc = Math.pow(10, sliderValue);
        const expectedM = Magnitude.apparentFromAbsolute(0, distancePc);
        const readout = await page.locator('#idea-apparent-readout').textContent();
        assert.ok(
          Math.abs(parseLeadingNumber(readout) - expectedM) < 0.015,
          `slider=${sliderValue}: readout "${readout}" vs expected ${expectedM.toFixed(2)}`
        );
      }
      const absoluteReadout = await page.locator('#idea-absolute-readout').textContent();
      assert.ok(absoluteReadout.includes('+0.00'), 'absolute magnitude should stay fixed at +0.00');
    });
  });

  test(`${name}: at exactly 10 pc, apparent and absolute magnitude readouts agree (m = M)`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      await setRange(page, '#idea-distance-slider', 1); // 10^1 = 10 pc
      const apparent = await page.locator('#idea-apparent-readout').textContent();
      assert.ok(Math.abs(parseLeadingNumber(apparent)) < 0.01, `expected ~0.00 at 10 pc, got "${apparent}"`);
    });
  });

  test(`${name}: the ratio ladder's exact and approximate readouts match src/magnitude.js across the whole slider`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      for (const deltaM of [0, 2.5, 5, 7.5, 10]) {
        await setRange(page, '#ratio-delta-m-slider', deltaM);
        const expectedExact = Magnitude.brightnessRatio(deltaM);
        const expectedApprox = Magnitude.approxBrightnessRatio(deltaM);
        const exactText = await page.locator('#ratio-exact-readout').textContent();
        const approxText = await page.locator('#ratio-approx-readout').textContent();
        const exactValue = parseLeadingNumber(exactText);
        const approxValue = parseLeadingNumber(approxText);
        assert.ok(Math.abs(exactValue - expectedExact) / Math.max(1, expectedExact) < 0.02, `Δm=${deltaM}: exact "${exactText}" vs ${expectedExact}`);
        assert.ok(Math.abs(approxValue - expectedApprox) / Math.max(1, expectedApprox) < 0.02, `Δm=${deltaM}: approx "${approxText}" vs ${expectedApprox}`);
      }
    });
  });

  test(`${name}: distance modulus calculator reproduces the Sun's and Sirius's absolute magnitudes via the preset buttons`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      await page.click('#modulus-load-sun');
      const sunM = parseFloat(await page.locator('#modulus-M-input').inputValue());
      assert.ok(Math.abs(sunM - 4.83) < 0.05, `Sun: expected M ~4.83, got ${sunM}`);

      await page.click('#modulus-load-sirius');
      const siriusM = parseFloat(await page.locator('#modulus-M-input').inputValue());
      const sirius = Parallax.STARS.find((s) => s.name === 'Sirius');
      const expectedSiriusM = Magnitude.absoluteFromApparent(-1.46, Parallax.distanceFromParallax(sirius.parallaxArcsec));
      assert.ok(Math.abs(siriusM - expectedSiriusM) < 0.05, `Sirius: expected M ~${expectedSiriusM.toFixed(2)}, got ${siriusM}`);
    });
  });

  test(`${name}: the calculator can solve for distance and for apparent magnitude too, matching the engine`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      await page.selectOption('#modulus-solve-for', 'd');
      await page.fill('#modulus-m-input', '8.2');
      await page.dispatchEvent('#modulus-m-input', 'input');
      await page.fill('#modulus-M-input', '1.2');
      await page.dispatchEvent('#modulus-M-input', 'input');
      const dValue = parseFloat(await page.locator('#modulus-d-input').inputValue());
      const expectedD = Magnitude.distanceFromModulus(8.2, 1.2);
      assert.ok(Math.abs(dValue - expectedD) / expectedD < 0.02, `expected d~${expectedD.toFixed(1)}, got ${dValue}`);

      await page.selectOption('#modulus-solve-for', 'm');
      await page.fill('#modulus-M-input', '1.2');
      await page.dispatchEvent('#modulus-M-input', 'input');
      await page.fill('#modulus-d-input', '100');
      await page.dispatchEvent('#modulus-d-input', 'input');
      const mValue = parseFloat(await page.locator('#modulus-m-input').inputValue());
      const expectedM = Magnitude.apparentFromAbsolute(1.2, 100);
      assert.ok(Math.abs(mValue - expectedM) < 0.02, `expected m~${expectedM.toFixed(2)}, got ${mValue}`);
    });
  });

  test(`${name}: no horizontal overflow at default state or at either slider's extremes`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      async function checkNoOverflow(label) {
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        assert.ok(scrollWidth <= clientWidth + 1, `${label}: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);
      }
      await checkNoOverflow('default');
      await setRange(page, '#idea-distance-slider', 0);
      await checkNoOverflow('idea-slider=min');
      await setRange(page, '#idea-distance-slider', 3);
      await checkNoOverflow('idea-slider=max');
      await setRange(page, '#ratio-delta-m-slider', 0);
      await checkNoOverflow('ratio-slider=min');
      await setRange(page, '#ratio-delta-m-slider', 10);
      await checkNoOverflow('ratio-slider=max');
    });
  });

  test(`${name}: practice questions render, located by data-question-id, and the quiz covers all three tiers`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      const expectedIds = [
        'which-brighter-sign-convention',
        'apparent-vs-absolute-words',
        'which-brighter-and-by-what-factor',
        'ratio-from-difference',
        'magnitude-difference-from-ratio',
        'mental-maths-shortcut',
        'fading-star-factor',
        'distance-from-modulus',
        'absolute-from-modulus',
        'explain-distance-modulus',
      ];
      for (const id of expectedIds) {
        const count = await page.locator(`.question-card[data-question-id="${id}"]`).count();
        assert.equal(count, 1, `expected exactly one question card for ${id}`);
      }
    });
  });

  test(`${name}: the three main diagrams each have explicit width and height attributes (rule 15)`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      for (const id of ['idea-diagram', 'ruler-diagram', 'ladder-diagram']) {
        const size = await page.locator(`#${id}`).evaluate((svg) => ({
          width: svg.getAttribute('width'),
          height: svg.getAttribute('height'),
        }));
        assert.ok(size.width && size.height, `svg#${id} is missing an explicit width/height attribute`);
      }
    });
  });
});
