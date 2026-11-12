/**
 * notes/reading-a-spectrum.html in a real browser, at phone and iPad
 * widths: every toggle and slider redraws its diagram (not just a
 * readout), and the readouts agree with src/spectra.js. Quiz cards are
 * found by data-question-id, never by text or position.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const Spectra = require('../src/spectra');
const { makeQuestions } = require('../src/spectraQuestions');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'reading-a-spectrum.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/spectraInteractive.test.js');

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
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(PAGE_URL);
    await page.waitForTimeout(200);
    await run(page, errors);
  } finally {
    await browser.close();
  }
}

const markup = (page, id) => page.locator(`#${id}`).evaluate((el) => el.innerHTML);

async function setRange(page, selector, value) {
  await page.locator(selector).evaluate((el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

WIDTHS.forEach(({ name, width, height }) => {
  test(`${name}: loads with no console errors and no horizontal scroll`, async (t) => {
    await withPage(t, { width, height }, async (page, errors) => {
      assert.deepEqual(errors, []);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(scrollWidth <= width, `scrollWidth ${scrollWidth}`);
    });
  });

  test(`${name}: the three-spectra sim gives continuous, absorption, emission and none exactly as spectrumType does, and every change redraws both diagrams`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      const steps = [
        { label: 'start', act: async () => {}, state: { sourceOn: true, cloudInFront: false, view: 'through' } },
        { label: 'cloud in', act: () => page.check('#kirchhoff-cloud'), state: { sourceOn: true, cloudInFront: true, view: 'through' } },
        { label: 'side view', act: () => page.selectOption('#kirchhoff-view', 'side'), state: { sourceOn: true, cloudInFront: true, view: 'side' } },
        { label: 'source off', act: () => page.uncheck('#kirchhoff-source'), state: { sourceOn: false, cloudInFront: true, view: 'side' } },
      ];
      let previous = null;
      for (const step of steps) {
        await step.act();
        const type = await page.locator('#kirchhoff-result-readout').getAttribute('data-type');
        assert.equal(type, Spectra.spectrumType(step.state), step.label);
        const now = { setup: await markup(page, 'kirchhoff-setup-diagram'), result: await markup(page, 'kirchhoff-result-diagram') };
        if (previous) assert.notEqual(now.setup, previous.setup, `${step.label}: set-up diagram unchanged`);
        if (previous && step.label !== 'source off') assert.notEqual(now.result, previous.result, `${step.label}: result diagram unchanged`);
        previous = now;
      }
      const seen = new Set();
      for (const state of [
        { sourceOn: true, cloudInFront: false, view: 'through' },
        { sourceOn: true, cloudInFront: true, view: 'through' },
        { sourceOn: true, cloudInFront: true, view: 'side' },
      ]) seen.add(Spectra.spectrumType(state));
      assert.deepEqual([...seen], ['continuous', 'absorption', 'emission']);
    });
  });

  test(`${name}: the composition puzzle marks the right element sets for Star X and Star Y, and the guide toggle draws one guide per line`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      for (const star of Spectra.PUZZLE_STARS) {
        await page.selectOption('#puzzle-star', star.id);
        const expected = Spectra.elementsPresent(Spectra.linesFor(star.elements));
        for (const key of Spectra.ELEMENT_KEYS) {
          const box = page.locator(`.puzzle-element[value="${key}"]`);
          if (expected.includes(key)) await box.check();
          else await box.uncheck();
        }
        await page.click('#puzzle-check');
        assert.equal(await page.locator('#puzzle-feedback').getAttribute('data-correct'), 'true', star.id);

        await page.locator('.puzzle-element[value="helium"]').setChecked(!expected.includes('helium'));
        await page.click('#puzzle-check');
        assert.equal(await page.locator('#puzzle-feedback').getAttribute('data-correct'), 'false', star.id);

        await page.uncheck('#puzzle-guides');
        assert.equal(await page.locator('#composition-diagram .puzzle-guide').count(), 0);
        await page.check('#puzzle-guides');
        assert.equal(await page.locator('#composition-diagram .puzzle-guide').count(), Spectra.linesFor(star.elements).length);
      }
    });
  });

  test(`${name}: the puzzle's zoomed view separates helium 587.6 nm from sodium, and sodium's two lines from each other, by clearly visible gaps`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      const centres = await page.evaluate(() => {
        const svg = document.getElementById('composition-zoom-diagram');
        const k = svg.getBoundingClientRect().width / 640;
        return [...svg.querySelectorAll('.reference-mark')].map((r) => (Number(r.getAttribute('x')) + Number(r.getAttribute('width')) / 2) * k);
      });
      assert.equal(centres.length, 3, 'helium 587.6 and sodium 589.0, 589.6 are the only reference lines in 580-600 nm');
      const [he, na1, na2] = centres;
      assert.ok(na1 - he >= 15, `helium to sodium gap ${na1 - he}px`);
      assert.ok(na2 - na1 >= 6, `sodium doublet gap ${na2 - na1}px`);
      const labels = await page.locator('#composition-zoom-diagram-wrap .zoom-line-label').allTextContents();
      assert.deepEqual(labels, ['587.6 nm', '589.0 and 589.6 nm']);
      // On the full-range view, sodium's pair is drawn as a double mark.
      assert.equal(await page.locator('#composition-diagram .reference-mark--doublet').count(), 2);
    });
  });

  test(`${name}: a star whose peak is off the temperature graph gets an "off the graph" arrow and label`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      for (const star of Spectra.EXAMPLE_STARS) {
        await page.selectOption('#temperature-star', star.id);
        const peak = Spectra.peakWavelengthNm(star.temperatureK);
        const where = await page.locator('#temperature-curve-diagram').getAttribute('data-peak');
        assert.equal(where, peak < 300 ? 'ultraviolet' : 'on', star.id);
        const label = await page.locator('#temperature-curve-diagram-wrap .glow-peak-label').textContent();
        if (where === 'ultraviolet') assert.match(label, new RegExp(`peak is in the ultraviolet, off the graph \\(about ${Math.round(peak)} nm\\)`));
        else assert.equal(label, 'peak');
      }
    });
  });

  test(`${name}: choosing a hotter star moves the peak marker to a shorter wavelength and redraws the lines; readouts match the engine`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      let lastPeakNm = Infinity;
      let lastLines = null;
      for (const star of Spectra.EXAMPLE_STARS) {
        await page.selectOption('#temperature-star', star.id);
        const peak = Spectra.peakWavelengthNm(star.temperatureK);
        assert.ok(peak < lastPeakNm);
        lastPeakNm = peak;
        const readout = await page.locator('#temperature-peak-readout').textContent();
        assert.match(readout, new RegExp(`about ${Math.round(peak).toLocaleString('en-GB')} nm`));
        assert.equal(await page.locator('#temperature-colour-readout').textContent(), Spectra.starColourName(star.temperatureK));
        assert.equal(await page.locator('#temperature-curve-diagram .glow-peak-marker').count(), 1);
        const lines = await markup(page, 'temperature-lines-diagram');
        if (lastLines) assert.notEqual(lines, lastLines, `${star.id}: line strip unchanged`);
        lastLines = lines;
      }
    });
  });

  test(`${name}: the Doppler slider shifts lines right when receding, left when approaching, not at all at zero, with a signed readout`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      const label = await page.locator('label[for="doppler-slider"]').textContent();
      assert.match(label, /exaggerated for visibility/);
      for (const [value, direction, sign] of [[60, 'redshift', '+'], [-60, 'blueshift', '−'], [0, 'none', '']]) {
        await setRange(page, '#doppler-slider', value);
        assert.equal(Number(await page.locator('#doppler-slider').inputValue()), value, 'value lands on the step grid');
        assert.equal(await page.locator('#doppler-diagram').getAttribute('data-direction'), direction);
        const arrows = await page.locator('#doppler-diagram .doppler-arrow').evaluateAll((els) => els.map((el) => Number(el.getAttribute('x2')) - Number(el.getAttribute('x1'))));
        assert.equal(arrows.length, Spectra.ELEMENTS.hydrogen.lines.length);
        arrows.forEach((dx) => {
          if (direction === 'redshift') assert.ok(dx > 0);
          else if (direction === 'blueshift') assert.ok(dx < 0);
          else assert.ok(Math.abs(dx) < 1e-9);
        });
        const shift = await page.locator('#doppler-shift-readout').textContent();
        if (sign) assert.ok(shift.startsWith(sign), shift);
        else assert.equal(shift, '0.0 nm');
      }
      // A bigger slider value means a bigger shift.
      await setRange(page, '#doppler-slider', 30);
      const small = parseFloat((await page.locator('#doppler-shift-readout').textContent()).replace(/[^\d.]/g, ''));
      await setRange(page, '#doppler-slider', 90);
      const big = parseFloat((await page.locator('#doppler-shift-readout').textContent()).replace(/[^\d.]/g, ''));
      assert.ok(big > small);
    });
  });

  test(`${name}: a longer exposure triples every pixel count and fills every pixel further`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      const read = async () => ({
        counts: (await page.locator('#sensor-diagram-wrap .sensor-count').allTextContents()).map(Number),
        fills: await page.locator('#sensor-diagram .sensor-charge').evaluateAll((els) => els.map((el) => Number(el.getAttribute('height')))),
      });
      await page.selectOption('#sensor-exposure', '1');
      const short = await read();
      await page.selectOption('#sensor-exposure', '3');
      const long = await read();
      assert.equal(short.counts.length, 8);
      long.counts.forEach((c, i) => assert.equal(c, 3 * short.counts[i]));
      long.fills.forEach((f, i) => assert.ok(f > short.fills[i]));
    });
  });

  test(`${name}: in every toggle state, no diagram label overlaps another or spills outside its panel`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      const problems = async (state) => page.evaluate((stateName) => {
        const out = [];
        document.querySelectorAll('.spectrum-panel .labelled-diagram-wrap').forEach((wrap) => {
          const w = wrap.getBoundingClientRect();
          const labels = [...wrap.querySelectorAll('.diagram-label')].map((l) => ({ text: l.textContent, r: l.getBoundingClientRect() }));
          labels.forEach(({ text, r }) => {
            if (r.left < w.left - 0.5 || r.right > w.right + 0.5 || r.top < w.top - 0.5 || r.bottom > w.bottom + 0.5) out.push(`${stateName} ${wrap.id}: "${text}" outside`);
          });
          for (let i = 0; i < labels.length; i += 1) {
            for (let j = i + 1; j < labels.length; j += 1) {
              const a = labels[i].r;
              const b = labels[j].r;
              if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) out.push(`${stateName} ${wrap.id}: "${labels[i].text}" overlaps "${labels[j].text}"`);
            }
          }
        });
        return out;
      }, state);
      const found = [...(await problems('default'))];
      await page.check('#kirchhoff-cloud');
      found.push(...(await problems('cloud')));
      await page.selectOption('#kirchhoff-view', 'side');
      found.push(...(await problems('side view')));
      await page.uncheck('#kirchhoff-source');
      found.push(...(await problems('source off')));
      await page.check('#puzzle-guides');
      for (const star of Spectra.PUZZLE_STARS) {
        await page.selectOption('#puzzle-star', star.id);
        found.push(...(await problems(`puzzle ${star.id}`)));
      }
      for (const star of Spectra.EXAMPLE_STARS) {
        await page.selectOption('#temperature-star', star.id);
        found.push(...(await problems(`temperature ${star.id}`)));
      }
      for (const v of [-100, 0, 100]) {
        await setRange(page, '#doppler-slider', v);
        found.push(...(await problems(`doppler ${v}`)));
      }
      await page.selectOption('#sensor-exposure', '3');
      found.push(...(await problems('exposure 3 s')));
      assert.deepEqual(found, []);
    });
  });

  test(`${name}: every quiz card carries data-question-id, shows its marks and spec tag, and answering shows the mark scheme`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      const bank = makeQuestions(Spectra);
      const ids = await page.locator('#questions-list .question-card').evaluateAll((cards) => cards.map((c) => c.dataset.questionId));
      assert.deepEqual([...ids].sort(), bank.map((q) => q.id).sort());
      for (const q of bank) {
        const card = page.locator(`.question-card[data-question-id="${q.id}"]`);
        assert.match(await card.locator('.question-marks').textContent(), new RegExp(`\\[${q.marks} marks?\\]`));
        assert.match(await card.locator('.question-tags').textContent(), new RegExp(`Spec ${q.spec.replace('.', '\\.')}`));
      }
      const card = page.locator('.question-card[data-question-id="blueshift-meaning"]');
      await card.locator('input[value="The star is moving towards us (blueshift)"]').check();
      await card.locator('button').click();
      assert.match(await card.locator('.question-feedback').textContent(), /^Correct! Mark scheme:/);
    });
  });
});

test('the quiz order is shuffled: several loads do not all give the same order', async (t) => {
  let browser;
  try {
    browser = await launchChromium();
  } catch (err) {
    skip(t, SKIP_MESSAGE(err));
    return;
  }
  try {
    const page = await browser.newPage({ viewport: { width: 768, height: 1200 } });
    const orders = new Set();
    for (let i = 0; i < 4; i += 1) {
      await page.goto(PAGE_URL);
      orders.add((await page.locator('#questions-list .question-card').evaluateAll((cards) => cards.map((c) => c.dataset.questionId))).join(','));
    }
    assert.ok(orders.size > 1);
  } finally {
    await browser.close();
  }
});
