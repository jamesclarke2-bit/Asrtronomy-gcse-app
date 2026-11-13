/**
 * notes/eclipsing-binaries.html in a real browser, at phone and iPad
 * widths: the four positions linked to the light curve, the why-diagram,
 * the build-your-own sim against the engine (presets on the step grid,
 * every slider redrawing the curve, tilt removing the dips), the period
 * markers and the deep-to-shallow trap, the quiz cards, and no diagram
 * label colliding in any state.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const E = require('../src/eclipsingBinaries');
const { makeQuestions } = require('../src/eclipsingBinariesQuestions');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'eclipsing-binaries.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/eclipsingBinariesInteractive.test.js');

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
        if (r.left < w.left - 0.5 || r.right > w.right + 0.5 || r.top < w.top - 0.5 || r.bottom > w.bottom + 0.5) out.push(`${stateName} ${wrap.id || 'question'}: "${text}" outside`);
      });
      for (let i = 0; i < labels.length; i += 1) {
        for (let j = i + 1; j < labels.length; j += 1) {
          const a = labels[i].r;
          const b = labels[j].r;
          if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) out.push(`${stateName} ${wrap.id || 'question'}: "${labels[i].text}" overlaps "${labels[j].text}"`);
        }
      }
    });
    return out;
  }, state);
}

const curveData = (page) => page.locator('#curve-diagram').evaluate((el) => ({ ...el.dataset }));

WIDTHS.forEach(({ name, width, height }) => {
  const still = { viewport: { width, height }, reducedMotion: 'reduce' };

  test(`${name}: loads with no console errors and no horizontal scroll`, async (t) => {
    await withPage(t, still, async (page, errors) => {
      assert.deepEqual(errors, []);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
    });
  });

  test(`${name}: the four positions sit on the light curve: 2 at the deep dip, 4 at the shallow one, 1 and 3 at full brightness`, async (t) => {
    await withPage(t, still, async (page) => {
      const points = await page.locator('#intro-diagram .eb-step-point').evaluateAll((els) => els.map((el) => Number(el.getAttribute('cy'))));
      assert.equal(points.length, 4);
      const [p1, p2, p3, p4] = points;
      assert.ok(p2 > p4 && p4 > p1, `deep dip lowest, then shallow: ${points}`);
      assert.ok(Math.abs(p1 - p3) < 0.5, 'positions 1 and 3 are both at full brightness');
      const labels = await page.locator('#intro-diagram-wrap .diagram-label').allTextContents();
      assert.ok(labels.includes('deep dip: primary eclipse'));
      assert.ok(labels.includes('shallow dip: secondary eclipse'));
      assert.equal(await page.locator('.eb-key li').count(), 4);
      // In panel 2 the hotter, smaller star A is behind B: only B shows.
      const why = await page.locator('#why-diagram').evaluate((el) => [Number(el.dataset.totalDepth), Number(el.dataset.partialDepth)]);
      assert.ok(why[0] > why[1], 'the edge-on (total) dip is deeper than the tilted (partial) one');
      const bars = await page.locator('#why-diagram .eb-why-bar').evaluateAll((els) => els.map((el) => Number(el.getAttribute('width'))));
      assert.ok(bars[0] > 3 * bars[1], 'far more light lost when the hotter star is hidden');
    });
  });

  test(`${name}: the sim matches the engine; presets land on the step grid; every slider redraws the curve`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const id of ['demo', 'algol']) {
        await page.click(`#preset-buttons button[data-preset="${id}"]`);
        const p = E.PRESETS[id];
        assert.equal(Number(await page.locator('#a-radius').inputValue()), Math.round(p.A.radius * 10));
        assert.equal(Number(await page.locator('#a-temp').inputValue()), Math.round(p.A.temperatureK / 100));
        assert.equal(Number(await page.locator('#b-radius').inputValue()), Math.round(p.B.radius * 10));
        assert.equal(Number(await page.locator('#b-temp').inputValue()), Math.round(p.B.temperatureK / 100));
        assert.equal(Number(await page.locator('#tilt').inputValue()), Math.round(p.inclinationDeg * 10));
        const d = E.dips(p);
        const c = await curveData(page);
        assert.equal(c.primaryDepth, d.primaryDepth.toFixed(4), id);
        assert.equal(c.secondaryDepth, d.secondaryDepth.toFixed(4), id);
        assert.equal(c.hiddenAtPrimary, d.hiddenAtPrimary, id);
      }
      assert.match(await page.locator('#preset-facts').textContent(), /Period: 2\.87 days/);
      let last = await page.locator('#curve-diagram').evaluate((el) => el.innerHTML);
      for (const [id, v] of [['a-radius', 20], ['a-temp', 200], ['b-radius', 45], ['b-temp', 40], ['tilt', 850]]) {
        await setRange(page, id, v);
        const now = await page.locator('#curve-diagram').evaluate((el) => el.innerHTML);
        assert.notEqual(now, last, `${id} redraws the light curve`);
        last = now;
      }
    });
  });

  test(`${name}: the hotter star's eclipse is always the deep dip, and tilting the orbit shrinks the dips until they vanish`, async (t) => {
    await withPage(t, still, async (page) => {
      await page.click('#preset-buttons button[data-preset="demo"]');
      assert.equal((await curveData(page)).hiddenAtPrimary, 'A');
      await setRange(page, 'a-temp', 50);
      await setRange(page, 'b-temp', 150);
      assert.equal((await curveData(page)).hiddenAtPrimary, 'B', 'make B the hotter: the deep dip is now B hidden');
      assert.match(await page.locator('#deep-readout').textContent(), /B is the hotter star/);
      await page.click('#preset-buttons button[data-preset="demo"]');
      const depths = [];
      for (const tenths of [900, 820, 740, 660, 500]) {
        await setRange(page, 'tilt', tenths);
        depths.push(Number((await curveData(page)).primaryDepth));
      }
      for (let i = 1; i < depths.length - 1; i += 1) assert.ok(depths[i] < depths[i - 1], `${depths}`);
      assert.equal(depths[depths.length - 1], 0);
      assert.equal((await curveData(page)).hiddenAtPrimary, 'none');
      assert.match(await page.locator('#deep-readout').textContent(), /never pass in front of each other/);
      await setRange(page, 'tilt', 900);
      assert.match(await page.locator('#deep-readout').textContent(), /flat-bottomed/);
    });
  });

  test(`${name}: with reduced motion the orbit starts paused; Play moves the stars`, async (t) => {
    await withPage(t, still, async (page) => {
      const play = page.locator('#play');
      assert.equal(await play.getAttribute('aria-pressed'), 'false');
      const before = await page.locator('#sky-diagram').evaluate((el) => el.innerHTML);
      await play.click();
      await page.waitForTimeout(400);
      assert.notEqual(await page.locator('#sky-diagram').evaluate((el) => el.innerHTML), before);
      await play.click();
    });
    await withPage(t, { viewport: { width, height } }, async (page) => {
      assert.equal(await page.locator('#play').getAttribute('aria-pressed'), 'true');
    });
  });

  test(`${name}: timing deep dip to deep dip gives the period; a marker on a shallow dip is flagged; more cycles, smaller percentage uncertainty`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const id of ['demo', 'algol']) {
        await page.selectOption('#period-system', id);
        const P = Number(await page.locator('#period-diagram').getAttribute('data-period'));
        assert.ok(Math.abs(P - E.PRESETS[id].periodDays) < 0.03, `${id}: ${P}`);
        assert.equal(await page.locator('#period-diagram').getAttribute('data-trap'), 'false');
      }
      await page.selectOption('#period-system', 'demo');
      // Deep dip at day 1.0, shallow dip at day 2.8: the trap.
      await setRange(page, 'm1', 10);
      await setRange(page, 'm2', 28);
      await page.selectOption('#cycles', '1');
      assert.equal(await page.locator('#period-readout').getAttribute('data-trap'), 'true');
      assert.match(await page.locator('#period-readout').textContent(), /only half the period/);
      const pct = async () => Number(/\(±([\d.]+)%\)/.exec(await page.locator('#period-readout').textContent())[1]);
      await setRange(page, 'm2', 46);
      assert.equal(await page.locator('#period-readout').getAttribute('data-trap'), 'false');
      const one = await pct();
      await setRange(page, 'm2', 154);
      await page.selectOption('#cycles', '4');
      const four = await pct();
      assert.ok(four < one, `${four} < ${one}`);
      assert.match(await page.locator('#period-readout').textContent(), /3\.48 to 3\.73 days/);
    });
  });

  test(`${name}: every quiz card carries data-question-id, marks and spec tag; the period questions draw their own curve`, async (t) => {
    await withPage(t, still, async (page) => {
      const bank = makeQuestions(E);
      const ids = await page.locator('#questions-list .question-card').evaluateAll((cards) => cards.map((c) => c.dataset.questionId));
      assert.deepEqual([...ids].sort(), bank.map((q) => q.id).sort());
      for (const q of bank) {
        const card = page.locator(`.question-card[data-question-id="${q.id}"]`);
        assert.match(await card.locator('.question-marks').textContent(), new RegExp(`\\[${q.marks} marks?\\]`));
        assert.match(await card.locator('.question-tags').textContent(), new RegExp(`Spec ${q.spec.replace('.', '\\.')}`));
        if (q.render) {
          assert.equal(await card.locator('.hr-question-diagram svg').count(), 1, q.id);
          const box = await card.locator('.hr-question-diagram svg').boundingBox();
          assert.ok(box.width > 250 && box.height > 150, `${q.id} curve is properly sized`);
        }
      }
    });
  });

  test(`${name}: in every state, no diagram label overlaps another or spills outside its panel`, async (t) => {
    await withPage(t, still, async (page) => {
      const found = [...(await labelProblems(page, 'default'))];
      for (const id of ['demo', 'algol']) {
        await page.click(`#preset-buttons button[data-preset="${id}"]`);
        for (const ph of [0, 25, 50, 75]) {
          await setRange(page, 'phase', ph);
          found.push(...(await labelProblems(page, `${id} phase ${ph}`)));
        }
      }
      await setRange(page, 'tilt', 400);
      found.push(...(await labelProblems(page, 'no eclipses')));
      await setRange(page, 'a-temp', 40);
      await setRange(page, 'b-temp', 250);
      await setRange(page, 'tilt', 900);
      found.push(...(await labelProblems(page, 'B hotter')));
      await page.selectOption('#period-system', 'algol');
      found.push(...(await labelProblems(page, 'algol period')));
      await setRange(page, 'm2', Number(await page.locator('#m1').inputValue()) + 20);
      found.push(...(await labelProblems(page, 'markers close')));
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
