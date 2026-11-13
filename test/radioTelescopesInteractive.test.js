/**
 * notes/radio-telescopes.html in a real browser, at phone and iPad widths:
 * the dish diagram's four steps (and its waves, still under reduced
 * motion), the scan building a map point by point, the two sources
 * merging or separating with dish size and wavelength (against the
 * engine), the array filling in its giant dish as the hours go by, the
 * four discoveries, the first-draft labels, the quiz cards, and no
 * diagram label colliding in any state.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const R = require('../src/radioTelescopes');
const { makeQuestions } = require('../src/radioTelescopesQuestions');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'radio-telescopes.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/radioTelescopesInteractive.test.js');

const WIDTHS = [
  { name: 'phone', width: 390, height: 2600 },
  { name: 'iPad', width: 768, height: 2600 },
];

async function withPage(t, options, run) {
  let browser;
  try {
    browser = await launchChromium();
  } catch (err) {
    skip(t, SKIP_MESSAGE(err));
    return;
  }
  try {
    const page = await browser.newPage(options);
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

async function setRange(page, id, value) {
  await page.locator(`#${id}`).evaluate((el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  assert.equal(Number(await page.locator(`#${id}`).inputValue()), value, `${id} lands on the step grid`);
}

async function labelProblems(page, state) {
  return page.evaluate((stateName) => {
    const out = [];
    document.querySelectorAll('.spectrum-panel .labelled-diagram-wrap').forEach((wrap) => {
      const w = wrap.getBoundingClientRect();
      if (!w.width) return;
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

const data = (page, id) => page.locator(`#${id}`).evaluate((el) => ({ ...el.dataset }));
const markup = (page, id) => page.locator(`#${id}`).evaluate((el) => el.innerHTML);

WIDTHS.forEach(({ name, width, height }) => {
  const still = { viewport: { width, height }, reducedMotion: 'reduce' };

  test(`${name}: loads with no console errors and no horizontal scroll`, async (t) => {
    await withPage(t, still, async (page, errors) => {
      assert.deepEqual(errors, []);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
    });
  });

  test(`${name}: the dish diagram shows dish, receiver at the focus, amplifier and computer as steps 1 to 4; its waves move only without reduced motion`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const cls of ['rt-dish', 'rt-receiver', 'rt-amplifier', 'rt-computer']) assert.equal(await page.locator(`#dish-diagram .${cls}`).count(), 1, cls);
      assert.equal(await page.locator('#dish-diagram .rt-reflected').count(), 4);
      const labels = await page.locator('#dish-diagram-wrap .diagram-label').allTextContents();
      for (const word of ['1', '2', '3', '4', 'dish', 'receiver', 'amplifier', 'computer']) assert.ok(labels.includes(word), word);
      assert.equal(await page.locator('.rt-key li').count(), 4);
      const still = await page.locator('#dish-diagram .rt-wave').first().evaluate((el) => getComputedStyle(el).animationName);
      assert.equal(still, 'none');
    });
    await withPage(t, { viewport: { width, height } }, async (page) => {
      const moving = await page.locator('#dish-diagram .rt-wave').first().evaluate((el) => getComputedStyle(el).animationName);
      assert.equal(moving, 'rt-wave-flow');
    });
  });

  test(`${name}: scanning fills the map one point at a time, row by row; Play advances it`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const n of [0, 1, 17, 160]) {
        await setRange(page, 'scan', n);
        assert.equal((await data(page, 'scan-diagram')).scanned, String(n));
        assert.equal(await page.locator('#scan-diagram .rt-map-cell').count(), n);
        assert.equal(await page.locator('#scan-diagram .rt-beam').count(), n > 0 ? 1 : 0);
        assert.equal(await page.locator('#scan-diagram .rt-scan-path').count(), Math.ceil(n / 16));
      }
      // The brightest point on the finished map is the centre of the patch.
      const brightest = await page.locator('#scan-diagram .rt-map-cell').evaluateAll((cells) => {
        const v = (c) => Number(/rgb\((\d+)/.exec(c.getAttribute('fill'))[1]);
        return cells.reduce((a, b) => (v(b) > v(a) ? b : a)).getAttribute('x');
      });
      assert.ok(Math.abs(Number(brightest) - (352 + 7.5 * 16)) <= 16, `brightest column at x ${brightest}`);
      await setRange(page, 'scan', 10);
      await page.click('#scan-play');
      await page.waitForTimeout(500);
      assert.ok(Number((await data(page, 'scan-diagram')).scanned) > 10);
      await page.click('#scan-play');
      assert.equal(await page.locator('#scan-play').getAttribute('aria-pressed'), 'false');
    });
  });

  test(`${name}: two sources merge for a 76 m dish at 21 cm and separate for a big enough dish; the readouts match the engine`, async (t) => {
    await withPage(t, still, async (page) => {
      const d = R.DIAMETER_RANGE_M;
      const w = R.WAVELENGTH_RANGE_M;
      const read = async () => {
        const diameterM = R.logSlider(Number(await page.locator('#diameter').inputValue()), d.min, d.max);
        const wavelengthM = R.logSlider(Number(await page.locator('#wavelength').inputValue()), w.min, w.max);
        return { diameterM, wavelengthM, shown: await data(page, 'sources-diagram') };
      };
      let s = await read();
      assert.match(await page.locator('#diameter-label').textContent(), /^76 m$/);
      assert.match(await page.locator('#wavelength-label').textContent(), /^21 cm$/);
      assert.equal(s.shown.separates, 'false');
      assert.equal(s.shown.resolutionArcsec, R.resolutionArcsec(s.wavelengthM, s.diameterM).toFixed(1));
      assert.ok((await page.locator('#sources-diagram-wrap').textContent()).includes('merged into one blob'));
      assert.match(await page.locator('#optical-readout').textContent(), /0\.2 mm across/);
      const blurs = [];
      for (const pos of [44, 60, 80, 100]) {
        await setRange(page, 'diameter', pos);
        s = await read();
        blurs.push(Number(s.shown.blur));
        assert.equal(s.shown.separates, String(R.separates(s.wavelengthM, s.diameterM)), `diameter position ${pos}`);
      }
      for (let i = 1; i < blurs.length; i += 1) assert.ok(blurs[i] <= blurs[i - 1], `bigger dish, smaller blur: ${blurs}`);
      assert.equal(s.shown.separates, 'true');
      assert.ok((await page.locator('#sources-diagram-wrap').textContent()).includes('two separate sources'));
      // A longer wavelength on the same dish blurs them together again.
      await setRange(page, 'diameter', 50);
      await setRange(page, 'wavelength', 0);
      assert.equal((await data(page, 'sources-diagram')).separates, 'true');
      await setRange(page, 'wavelength', 100);
      assert.equal((await data(page, 'sources-diagram')).separates, 'false');
      assert.match(await page.locator('#separate-readout').textContent(), /cannot tell there are two/);
      assert.equal((await data(page, 'compare-diagram')).neededKm, (R.dishNeededM(0.21, 0.1) / 1000).toFixed(1));
    });
  });

  test(`${name}: as the hours go by, the array's pairs fill in more of the giant dish, matching the engine`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await page.locator('#array-diagram .rt-array-dish').count(), R.DEMO_ARRAY_KM.length);
      assert.match(await page.locator('#array-diagram-wrap').textContent(), /farthest apart: 23 km/);
      let last = -1;
      for (const h of [0, 1, 3, 6, 12]) {
        await setRange(page, 'hours', h);
        const c = Number((await data(page, 'array-diagram')).coverage);
        assert.equal(c.toFixed(3), R.coverageFraction(R.DEMO_ARRAY_KM, h).toFixed(3));
        assert.ok(c > last, `${h} hours`);
        last = c;
        assert.match(await page.locator('#array-readout').textContent(), new RegExp(`After ${h} hours?`));
      }
      assert.match(await page.locator('#array-readout').textContent(), /about 920 times finer than one of their own 25 m dishes/);
    });
  });

  test(`${name}: the four discoveries are drawn and listed, and every general-knowledge note carries the first-draft label`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await page.locator('#discoveries-diagram .rt-find-panel').count(), 4);
      const titles = await page.locator('#discoveries-diagram-wrap .diagram-label').allTextContents();
      assert.deepEqual(titles, ['Quasar', 'Black-hole jets', 'Milky Way structure', 'Protoplanetary disc']);
      assert.equal(await page.locator('.rt-finds li').count(), 4);
      // Each section that uses general-knowledge values or facts labels them.
      for (const section of ['big-dishes', 'arrays', 'discoveries']) {
        const notes = (await page.locator(`#${section} .note`).allTextContents()).map((n) => n.replace(/\s+/g, ' '));
        assert.ok(notes.some((n) => /first draft, to be checked by the teacher/.test(n)), section);
      }
    });
  });

  test(`${name}: every quiz card carries data-question-id, marks and spec tag, including why a radio dish must be bigger than an optical one`, async (t) => {
    await withPage(t, still, async (page) => {
      const bank = makeQuestions(R);
      const ids = await page.locator('#questions-list .question-card').evaluateAll((cards) => cards.map((c) => c.dataset.questionId));
      assert.deepEqual([...ids].sort(), bank.map((q) => q.id).sort());
      assert.ok(ids.includes('rt-bigger-than-optical'));
      for (const q of bank) {
        const card = page.locator(`.question-card[data-question-id="${q.id}"]`);
        assert.match(await card.locator('.question-marks').textContent(), new RegExp(`\\[${q.marks} marks?\\]`));
        assert.match(await card.locator('.question-tags').textContent(), new RegExp(`Spec ${q.spec.replace('.', '\\.')}`));
      }
    });
  });

  test(`${name}: in every state, no diagram label overlaps another or spills outside its panel`, async (t) => {
    await withPage(t, still, async (page) => {
      const found = [...(await labelProblems(page, 'default'))];
      await setRange(page, 'diameter', 100);
      found.push(...(await labelProblems(page, 'separate')));
      for (const h of [0, 12]) {
        await setRange(page, 'hours', h);
        found.push(...(await labelProblems(page, `${h} hours`)));
      }
      for (const n of [0, 160]) {
        await setRange(page, 'scan', n);
        found.push(...(await labelProblems(page, `scan ${n}`)));
      }
      assert.deepEqual(found, []);
    });
  });

  test(`${name}: every slider visibly changes its own diagram`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const [id, diagram, value] of [['scan', 'scan-diagram', 120], ['diameter', 'sources-diagram', 90], ['wavelength', 'sources-diagram', 10], ['hours', 'array-diagram', 9]]) {
        const before = await markup(page, diagram);
        await setRange(page, id, value);
        assert.notEqual(await markup(page, diagram), before, `${id} redraws ${diagram}`);
      }
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
    const page = await browser.newPage({ viewport: { width: 768, height: 1200 }, reducedMotion: 'reduce' });
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
