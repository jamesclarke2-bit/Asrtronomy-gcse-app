/**
 * notes/spectral-types.html in a real browser, at phone and iPad widths:
 * the temperature slider moves every clue together, the sorting board
 * redraws as stars are placed and checked, every quiz card is found by
 * data-question-id, and no diagram label collides in any state.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const Spectra = require('../src/spectra');
const { makeQuestions } = require('../src/spectralTypesQuestions');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'spectral-types.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/spectralTypesInteractive.test.js');

const WIDTHS = [
  { name: 'phone', width: 390, height: 2600 },
  { name: 'iPad', width: 768, height: 2600 },
];

// The slider is logarithmic: value s (0-1000) means 2,500 x 16^(s/1000) K.
const tempFor = (s) => 2500 * Math.pow(16, s / 1000);

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

async function setSlider(page, value) {
  await page.locator('#temperature-slider').evaluate((el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  assert.equal(Number(await page.locator('#temperature-slider').inputValue()), value, 'value lands on the step grid');
}

async function labelProblems(page, state) {
  return page.evaluate((stateName) => {
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
}

const starKey = (star) => star.name.replace(/^the /, '').toLowerCase();

WIDTHS.forEach(({ name, width, height }) => {
  test(`${name}: loads with no console errors and no horizontal scroll`, async (t) => {
    await withPage(t, { width, height }, async (page, errors) => {
      assert.deepEqual(errors, []);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
    });
  });

  test(`${name}: the class strip shows the seven classes hottest first, and the table gives every range with units in the heading`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      const letters = await page.locator('#class-strip-diagram .class-box').evaluateAll((els) => els.map((el) => el.dataset.class));
      assert.deepEqual(letters, Spectra.CLASS_LETTERS);
      const headings = await page.locator('#class-table th').allTextContents();
      assert.ok(headings.includes('Surface temperature (K)'));
      const rows = await page.locator('#class-table-body tr').count();
      assert.equal(rows, 7);
    });
  });

  test(`${name}: the slider moves class, colour, lines, pointer and peak together, matching the engine`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      // Default: the Sun's temperature.
      assert.equal(await page.locator('#sim-class-readout').getAttribute('data-class'), 'G');
      let lastPointer = null;
      let lastMarkup = null;
      for (const s of [0, 120, 250, 304, 370, 440, 700, 1000]) {
        await setSlider(page, s);
        const t = tempFor(s);
        const cls = Spectra.classForTemperature(t);
        assert.equal(await page.locator('#sim-class-readout').getAttribute('data-class'), cls.letter, `s=${s}`);
        assert.equal(await page.locator('#sim-colour-readout').textContent(), cls.colour);
        const peak = Spectra.peakWavelengthNm(t);
        const where = peak < 300 ? 'ultraviolet' : peak > 1000 ? 'infrared' : 'on';
        assert.equal(await page.locator('#sim-diagram').getAttribute('data-peak'), where, `s=${s}`);
        assert.equal(await page.locator('#sim-lines-diagram').getAttribute('data-bands'), String(cls.molecules ? Spectra.MOLECULE_BANDS_NM.length : 0));
        const pointer = await page.locator('#sim-diagram .sim-pointer').getAttribute('points');
        const x = parseFloat(pointer);
        if (lastPointer !== null) assert.ok(x < lastPointer, `pointer moves towards the hot end as s rises (s=${s})`);
        lastPointer = x;
        const markup = await page.locator('#sim-diagram').evaluate((el) => el.innerHTML);
        if (lastMarkup) assert.notEqual(markup, lastMarkup);
        lastMarkup = markup;
      }
      await setSlider(page, 0);
      assert.match(await page.locator('#sim-diagram-wrap .glow-peak-label').textContent(), /infrared, off the graph/);
      await setSlider(page, 1000);
      assert.match(await page.locator('#sim-diagram-wrap .glow-peak-label').textContent(), /ultraviolet, off the graph/);
    });
  });

  test(`${name}: sorting the eight stars correctly scores 8, one wrong scores 7 and shows a cross; the clue toggle shows all three clues`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      for (const star of Spectra.REAL_STARS) {
        assert.equal(await page.locator(`.sort-star[data-star="${starKey(star)}"] .sort-star-clues li`).count(), 1);
        await page.locator(`.sort-star[data-star="${starKey(star)}"] select`).selectOption(star.type[0]);
      }
      assert.equal(await page.locator('#sort-board-diagram .sort-board-star').count(), 8);
      await page.click('#sort-check');
      assert.equal(await page.locator('#sort-feedback').getAttribute('data-score'), '8');
      assert.equal(await page.locator('#sort-board-diagram-wrap .diagram-label', { hasText: '✗' }).count(), 0);

      const vega = Spectra.REAL_STARS.find((s) => s.name === 'Vega');
      await page.locator(`.sort-star[data-star="vega"] select`).selectOption('M');
      await page.click('#sort-check');
      assert.equal(await page.locator('#sort-feedback').getAttribute('data-score'), '7');
      assert.equal(await page.locator('#sort-board-diagram-wrap .diagram-label', { hasText: `Vega ✗` }).count(), 1);
      assert.ok(vega);

      await page.check('#sort-all-clues');
      for (const star of Spectra.REAL_STARS) {
        assert.equal(await page.locator(`.sort-star[data-star="${starKey(star)}"] .sort-star-clues li`).count(), 3);
      }
      // Choices survive the clue toggle.
      assert.equal(await page.locator(`.sort-star[data-star="vega"] select`).inputValue(), 'M');
    });
  });

  test(`${name}: every quiz card carries data-question-id, its marks and its spec tag`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      const bank = makeQuestions(Spectra);
      const ids = await page.locator('#questions-list .question-card').evaluateAll((cards) => cards.map((c) => c.dataset.questionId));
      assert.deepEqual([...ids].sort(), bank.map((q) => q.id).sort());
      for (const q of bank) {
        const card = page.locator(`.question-card[data-question-id="${q.id}"]`);
        assert.match(await card.locator('.question-marks').textContent(), new RegExp(`\\[${q.marks} marks?\\]`));
        assert.match(await card.locator('.question-tags').textContent(), new RegExp(`Spec ${q.spec.replace('.', '\\.')}`));
      }
    });
  });

  test(`${name}: in every slider and sorting state, no diagram label overlaps another or spills outside its panel`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      const found = [...(await labelProblems(page, 'default'))];
      for (const s of [0, 60, 150, 250, 304, 360, 420, 500, 650, 800, 1000]) {
        await setSlider(page, s);
        found.push(...(await labelProblems(page, `s=${s}`)));
      }
      for (const star of Spectra.REAL_STARS) await page.locator(`.sort-star[data-star="${starKey(star)}"] select`).selectOption(star.type[0]);
      await page.click('#sort-check');
      found.push(...(await labelProblems(page, 'sorted')));
      assert.deepEqual(found, []);
    });
  });
});

test('the quiz order is shuffled across loads', async (t) => {
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
