/**
 * notes/space-telescopes.html in a real browser, at phone and iPad widths:
 * the shared atmosphere chart with its "need space" bracket and shape
 * markers, the low-against-far orbit toggle, the balance for each kind of
 * wave against the engine, the three discoveries, the first-draft labels,
 * the quiz cards, and no diagram label colliding in any state.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const T = require('../src/spaceTelescopes');
const W = require('../src/atmosphereWindows');
const { makeQuestions } = require('../src/spaceTelescopesQuestions');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'space-telescopes.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/spaceTelescopesInteractive.test.js');

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

async function labelProblems(page, state) {
  return page.evaluate((stateName) => {
    const out = [];
    document.querySelectorAll('.labelled-diagram-wrap').forEach((wrap) => {
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

  test(`${name}: the shared chart marks the bands that need space by shape and a bracket; 13.23 is left to the Infrared page`, async (t) => {
    await withPage(t, still, async (page) => {
      const bars = await page.locator('#space-chart rect[data-category]').evaluateAll((els) => els.map((el) => el.dataset.category));
      assert.deepEqual(bars, W.BANDS.map((b) => b.category));
      assert.deepEqual(await page.locator('#space-chart-wrap .sp-mark').allTextContents(), ['✗', '✗', '✗', '✓', '∼', '✓']);
      assert.equal((await data(page, 'space-chart')).spaceOnly, T.spaceOnlyBands().join(','));
      assert.equal(await page.locator('#space-chart .sp-space-bracket').count(), 1);
      assert.ok((await page.locator('#space-chart-wrap .diagram-label').allTextContents()).includes('need space'));
      assert.equal(await page.locator('#above-the-air a[href="infrared-telescopes.html"]').count(), 1);
    });
  });

  test(`${name}: choosing an orbit redraws the diagram and its facts; the far orbit is compared with the data sheet Moon distance`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal((await data(page, 'orbit-diagram')).chosen, 'low');
      assert.equal(await page.locator('#orbit-diagram .sp-orbit--chosen.sp-orbit--low').count(), 1);
      assert.match(await page.locator('#orbit-facts').textContent(), /about 540 km up, going round the Earth in about 95 minutes/i);
      const before = await markup(page, 'orbit-diagram');
      await page.click('#orbit-buttons button[data-orbit="far"]');
      assert.notEqual(await markup(page, 'orbit-diagram'), before);
      assert.equal((await data(page, 'orbit-diagram')).chosen, 'far');
      assert.equal(await page.locator('#orbit-diagram .sp-orbit--chosen.sp-orbit--far').count(), 1);
      assert.equal(await page.locator('#orbit-buttons button[data-orbit="far"]').getAttribute('aria-pressed'), 'true');
      assert.match(await page.locator('#orbit-facts').textContent(), new RegExp(`about ${Math.round(T.farOrbitInMoonDistances())} times as far as the Moon`));
      assert.match(await page.locator('#orbit-facts').textContent(), /too far away to repair/);
    });
  });

  test(`${name}: the balance tips to space for gamma rays, X-rays and ultraviolet, stays level for visible light, and tips to the ground for radio`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal((await data(page, 'balance-diagram')).band, 'X-ray');
      for (const band of W.BANDS) {
        // The whole diagram, caption included: gamma rays and X-rays tip the
        // balance the same way, and differ only in the caption naming them.
        const before = await markup(page, 'balance-diagram-wrap');
        await page.click(`#band-buttons button[data-band="${band.name}"]`);
        const d = await data(page, 'balance-diagram');
        assert.equal(d.band, band.name);
        assert.equal(Number(d.tilt), T.verdict(band.name).tilt, band.name);
        if (band.name !== 'X-ray') assert.notEqual(await markup(page, 'balance-diagram-wrap'), before, `${band.name} redraws the balance`);
        assert.match(await page.locator('#balance-readout').textContent(), new RegExp(T.verdict(band.name).where.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      }
      // The heavier side hangs lower: compare the two pans' heights.
      const panY = async (side) => page.locator(`#balance-diagram .sp-pan--${side}`).evaluate((el) => el.getBBox().y);
      await page.click('#band-buttons button[data-band="X-ray"]');
      assert.ok((await panY('space')) > (await panY('ground')), 'X-rays: the space pan hangs lower');
      await page.click('#band-buttons button[data-band="Radio"]');
      assert.ok((await panY('ground')) > (await panY('space')), 'radio: the ground pan hangs lower');
      await page.click('#band-buttons button[data-band="Optical"]');
      assert.ok(Math.abs((await panY('ground')) - (await panY('space'))) < 0.5, 'visible light: level');
    });
  });

  test(`${name}: the three discoveries are drawn and listed`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await page.locator('#discoveries-diagram .sp-find-panel').count(), 3);
      assert.ok((await page.locator('#discoveries-diagram .sp-burst').count()) > 0);
      assert.equal(await page.locator('#discoveries-diagram .sp-burst-curve').count(), 1);
      assert.equal(await page.locator('#discoveries-diagram .sp-black-hole').count(), 1);
      assert.equal(await page.locator('#discoveries-diagram .sp-xray').count(), 3);
      assert.equal(await page.locator('#discoveries-diagram .sp-chromosphere').count(), 1);
      assert.equal(await page.locator('#discoveries-diagram .sp-corona-loop').count(), 4);
      const labels = await page.locator('#discoveries-diagram-wrap .diagram-label').allTextContents();
      for (const l of ['Gamma-ray bursts', 'A black hole accretion disc', 'chromosphere', 'corona']) assert.ok(labels.includes(l), l);
      assert.equal(await page.locator('.sp-finds li').count(), 3);
      assert.equal(await page.locator('#discoveries a[href="sun-features.html"]').count(), 1);
    });
  });

  test(`${name}: every section using general-knowledge values or facts labels them first draft`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const section of ['above-the-air', 'orbits', 'trade-offs', 'discoveries']) {
        const notes = (await page.locator(`#${section} .note`).allTextContents()).map((n) => n.replace(/\s+/g, ' '));
        assert.ok(notes.some((n) => /first draft, to be checked by the teacher/.test(n)), section);
      }
      assert.match((await page.locator('#discoveries .note').textContent()).replace(/\s+/g, ' '), /Vela satellites \(1967\) and Cygnus X-1: first draft/);
    });
  });

  test(`${name}: every quiz card carries data-question-id, marks and spec tag, including the space-against-mountain weigh-up`, async (t) => {
    await withPage(t, still, async (page) => {
      const bank = makeQuestions(T);
      const ids = await page.locator('#questions-list .question-card').evaluateAll((cards) => cards.map((c) => c.dataset.questionId));
      assert.deepEqual([...ids].sort(), bank.map((q) => q.id).sort());
      assert.ok(ids.includes('sp-weigh-infrared'));
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
      await page.click('#orbit-buttons button[data-orbit="far"]');
      found.push(...(await labelProblems(page, 'far orbit')));
      for (const band of W.BANDS) {
        await page.click(`#band-buttons button[data-band="${band.name}"]`);
        found.push(...(await labelProblems(page, band.name)));
      }
      assert.deepEqual(found, []);
    });
  });

  test(`${name}: the orbit moves only without reduced motion`, async (t) => {
    await withPage(t, still, async (page) => {
      const a = await markup(page, 'orbit-diagram');
      await page.waitForTimeout(300);
      assert.equal(await markup(page, 'orbit-diagram'), a, 'still under reduced motion');
    });
    await withPage(t, { viewport: { width, height } }, async (page) => {
      const a = await markup(page, 'orbit-diagram');
      await page.waitForTimeout(400);
      assert.notEqual(await markup(page, 'orbit-diagram'), a, 'moving otherwise');
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
