/**
 * notes/variable-stars.html in a real browser, at phone and iPad widths:
 * the upside-down magnitude axis, the match-the-curve gallery, the
 * pulsation sim, the four-step Cepheid distance interactive against the
 * engine, the quiz cards, and no diagram label colliding in any state.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const V = require('../src/variableStars');
const { makeQuestions } = require('../src/variableStarsQuestions');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'variable-stars.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/variableStarsInteractive.test.js');

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

const CARD_IDS = ['delta-cephei', 'nova', 'algol', 'mira', 'supernova', 'rr-lyrae'];

WIDTHS.forEach(({ name, width, height }) => {
  const still = { viewport: { width, height }, reducedMotion: 'reduce' };

  test(`${name}: loads with no console errors and no horizontal scroll`, async (t) => {
    await withPage(t, still, async (page, errors) => {
      assert.deepEqual(errors, []);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
    });
  });

  test(`${name}: the light curve's magnitude axis runs upside down: smaller numbers, brighter, at the top`, async (t) => {
    await withPage(t, still, async (page) => {
      const wrap = page.locator('#intro-diagram-wrap');
      const y = async (text) => (await wrap.locator('.diagram-label', { hasText: new RegExp(`^${text}$`) }).boundingBox()).y;
      assert.ok((await y('3\\.5')) < (await y('4\\.5')));
      assert.ok((await wrap.locator('.diagram-label', { hasText: 'Apparent magnitude' }).count()) === 1);
      assert.ok((await wrap.locator('.diagram-label', { hasText: 'Time (days)' }).count()) === 1);
      assert.match(await page.locator('#light-curve').textContent(), /upside down/);
    });
  });

  test(`${name}: matching the six curves scores 6; a wrong match gets a cross and keeps its facts hidden; answers reveal every name`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await page.locator('.vs-card').count(), 6);
      for (const id of CARD_IDS) await page.selectOption(`.vs-card[data-star="${id}"] select`, id);
      await page.click('#gallery-check');
      assert.equal(await page.locator('#gallery-feedback').getAttribute('data-score'), '6');
      for (const id of CARD_IDS) {
        assert.equal(await page.locator(`#card-${id}`).getAttribute('data-result'), 'right', id);
        assert.equal(await page.locator(`.vs-card[data-star="${id}"] .vs-card-facts`).isVisible(), true, id);
      }
      await page.selectOption('.vs-card[data-star="mira"] select', 'rr-lyrae');
      await page.click('#gallery-check');
      assert.equal(await page.locator('#gallery-feedback').getAttribute('data-score'), '5');
      assert.equal(await page.locator('#card-mira').getAttribute('data-result'), 'wrong');
      assert.match(await page.locator('.vs-card[data-star="mira"] h3').textContent(), /✗/);
      assert.equal(await page.locator('.vs-card[data-star="mira"] .vs-card-facts').isVisible(), false);
      const before = await page.locator('#card-mira-wrap').evaluate((el) => el.innerHTML);
      await page.check('#gallery-answers');
      assert.notEqual(await page.locator('#card-mira-wrap').evaluate((el) => el.innerHTML), before, 'showing answers redraws the curve');
      assert.equal(await page.locator('.vs-answer-label').count(), 6);
      assert.equal(await page.locator('.vs-card[data-star="mira"] .vs-card-facts').isVisible(), true);
      const heads = await page.locator('#gallery-table th').allTextContents();
      assert.ok(heads.includes('Period (days)'));
      assert.equal(await page.locator('#gallery-table-body tr').count(), 6);
    });
  });

  test(`${name}: the pulsation starts paused with reduced motion; the slider and Play change the star's size and brightness`, async (t) => {
    await withPage(t, still, async (page) => {
      const play = page.locator('#pulse-play');
      assert.equal(await play.getAttribute('aria-pressed'), 'false');
      const read = () => page.locator('#pulse-diagram').evaluate((el) => [el.dataset.radius, el.dataset.brightness]);
      const a = await read();
      await setRange(page, 'pulse-slider', 50);
      const b = await read();
      assert.notEqual(a[0], b[0]);
      assert.notEqual(a[1], b[1]);
      await play.click();
      await page.waitForTimeout(500);
      assert.notEqual(Number(await page.locator('#pulse-slider').inputValue()), 50);
      await play.click();
    });
    await withPage(t, { viewport: { width, height } }, async (page) => {
      assert.equal(await page.locator('#pulse-play').getAttribute('aria-pressed'), 'true');
    });
  });

  test(`${name}: the distance steps match the engine for every Cepheid, with markers on the step grid`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const c of V.CEPHEIDS) {
        await page.selectOption('#cepheid-select', c.id);
        const peaks = V.maximaBetween(c, 0, c.spanDays);
        assert.equal(Number(await page.locator('#t1-slider').inputValue()), Math.round(peaks[0] * 10), `${c.id} first peak on the grid`);
        assert.equal(Number(await page.locator('#t2-slider').inputValue()), Math.round(peaks[peaks.length - 1] * 10), `${c.id} last peak on the grid`);
        const P = Number(await page.locator('#period-diagram').getAttribute('data-period'));
        assert.ok(Math.abs(P - c.periodDays) < 0.05, `${c.id}: ${P}`);
        const avg = V.averageMagnitude(c.brightest, c.faintest);
        assert.equal(await page.locator('#period-diagram').getAttribute('data-average'), avg.toFixed(2));
        const r = V.cepheidDistance(P, avg);
        assert.equal(Number(await page.locator('#pl-diagram').getAttribute('data-m')), r.M);
        assert.equal(await page.locator('#distance-working').getAttribute('data-distance'), r.distancePc.toFixed(1));
      }
      // The worked example.
      await page.selectOption('#cepheid-select', 'lmc');
      const working = await page.locator('#distance-working').textContent();
      assert.match(working, /M ≈ −4\.0/);
      assert.match(working, /m = \+14\.50/);
      assert.match(working, /d ≈ 50,000 pc/);
      assert.match(working, /45,700 to 55,000 pc/);
      assert.match(working, /±4,600 pc/);
    });
  });

  test(`${name}: timing more cycles gives a smaller percentage uncertainty; moving a marker redraws both graphs`, async (t) => {
    await withPage(t, still, async (page) => {
      await page.selectOption('#cepheid-select', 'lmc');
      await setRange(page, 't1-slider', 18);
      await setRange(page, 't2-slider', 118);
      await page.selectOption('#cycles-select', '1');
      const one = await page.locator('#period-readout').textContent();
      await setRange(page, 't2-slider', 618);
      await page.selectOption('#cycles-select', '6');
      const six = await page.locator('#period-readout').textContent();
      const pct = (s) => Number(/±([\d.]+)% of the time measured/.exec(s)[1]);
      assert.ok(pct(six) < pct(one), `${pct(six)} < ${pct(one)}`);
      assert.match(six, /10\.00 days/);
      const pl = await page.locator('#pl-diagram').evaluate((el) => el.innerHTML);
      const curve = await page.locator('#period-diagram').evaluate((el) => el.innerHTML);
      await setRange(page, 't2-slider', 518);
      assert.notEqual(await page.locator('#pl-diagram').evaluate((el) => el.innerHTML), pl, 'a wrong timing moves the P-L reading');
      assert.notEqual(await page.locator('#period-diagram').evaluate((el) => el.innerHTML), curve);
    });
  });

  test(`${name}: every quiz card carries data-question-id, marks and spec tag; the reading questions draw their own graph`, async (t) => {
    await withPage(t, still, async (page) => {
      const bank = makeQuestions(V);
      const ids = await page.locator('#questions-list .question-card').evaluateAll((cards) => cards.map((c) => c.dataset.questionId));
      assert.deepEqual([...ids].sort(), bank.map((q) => q.id).sort());
      for (const q of bank) {
        const card = page.locator(`.question-card[data-question-id="${q.id}"]`);
        assert.match(await card.locator('.question-marks').textContent(), new RegExp(`\\[${q.marks} marks?\\]`));
        assert.match(await card.locator('.question-tags').textContent(), new RegExp(`Spec ${q.spec.replace('.', '\\.')}`));
        if (q.render) {
          assert.equal(await card.locator('.hr-question-diagram svg').count(), 1, q.id);
          const box = await card.locator('.hr-question-diagram svg').boundingBox();
          assert.ok(box.width > 250 && box.height > 150, `${q.id} graph is properly sized`);
        }
      }
    });
  });

  test(`${name}: in every state, no diagram label overlaps another or spills outside its panel`, async (t) => {
    await withPage(t, still, async (page) => {
      const found = [...(await labelProblems(page, 'default'))];
      await page.check('#gallery-answers');
      found.push(...(await labelProblems(page, 'answers')));
      for (const v of [0, 25, 50, 75]) {
        await setRange(page, 'pulse-slider', v);
        found.push(...(await labelProblems(page, `pulse ${v}`)));
      }
      for (const c of V.CEPHEIDS) {
        await page.selectOption('#cepheid-select', c.id);
        found.push(...(await labelProblems(page, c.id)));
        await setRange(page, 't2-slider', Number(await page.locator('#t1-slider').inputValue()) + 20);
        found.push(...(await labelProblems(page, `${c.id} markers close`)));
      }
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
