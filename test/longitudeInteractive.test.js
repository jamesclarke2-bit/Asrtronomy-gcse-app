/**
 * notes/finding-longitude.html in a real browser, at phone and iPad
 * widths: the globe and Greenwich clock redrawn by the noon-time slider,
 * the Moon moving against the stars, the two clocks drifting over a
 * voyage, the timeline, the first-draft labels, the quiz cards, and no
 * label collisions.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const L = require('../src/longitude');
const { makeQuestions } = require('../src/longitudeQuestions');
const BANK = () => makeQuestions(L);

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'finding-longitude.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/longitudeInteractive.test.js');

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
          if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) out.push(`${stateName} ${wrap.id || 'quiz'}: "${labels[i].text}" overlaps "${labels[j].text}"`);
        }
      }
    });
    return out;
  }, state);
}

const count = (page, sel) => page.locator(sel).count();

async function setRange(page, id, value) {
  await page.locator(`#${id}`).evaluate((el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  assert.equal(Number(await page.locator(`#${id}`).inputValue()), value, `${id} lands on the step grid`);
}

const labelsOf = async (page, wrap) => (await page.locator(`#${wrap} .diagram-label`).allTextContents()).join(' | ');

WIDTHS.forEach(({ name, width, height }) => {
  const still = { viewport: { width, height }, reducedMotion: 'reduce' };

  test(`${name}: every quiz card carries data-question-id, marks and spec tag`, async (t) => {
    await withPage(t, still, async (page) => {
      const bank = BANK();
      const ids = await page.locator('#questions-list .question-card').evaluateAll((cards) => cards.map((c) => c.dataset.questionId));
      assert.deepEqual([...ids].sort(), bank.map((q) => q.id).sort());
      for (const q of bank) {
        const card = page.locator(`.question-card[data-question-id="${q.id}"]`);
        assert.match(await card.locator('.question-marks').textContent(), new RegExp(`\\[${q.marks} marks?\\]`));
        assert.match(await card.locator('.question-tags').textContent(), new RegExp(`Spec ${q.spec.replace('.', '\\.')}`));
      }
      const lunar = page.locator('.question-card[data-question-id="lg-lunar-read"]');
      assert.equal(await lunar.locator('.lg-moon').count(), 1);
      assert.equal(await lunar.locator('.lg-moon-ghost').count(), 0, 'the question hides the table times');
    });
  });

  test(`${name}: loads with no console errors and no horizontal scroll`, async (t) => {
    await withPage(t, still, async (page, errors) => {
      assert.deepEqual(errors, []);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
    });
  });

  test(`${name}: the noon-time slider turns Greenwich and the clock, giving east or west`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await page.locator('#globe-diagram').getAttribute('data-longitude'), '35W');
      const lines = new Set();
      for (const [m, lon, text] of [[860, '35W', /ship is 35° west/], [720, '0', /on the Greenwich meridian/], [540, '45E', /ship is 45° east/], [1000, '70W', /ship is 70° west/]]) {
        await setRange(page, 'noon-time', m);
        assert.equal(await page.locator('#globe-diagram').getAttribute('data-longitude'), lon);
        assert.match(await page.locator('#noon-readout').textContent(), text);
        assert.ok((await labelsOf(page, 'globe-wrap')).includes(`reads ${L.formatClock(m)}`));
        lines.add(await page.locator('#globe-diagram .lg-greenwich-meridian').getAttribute('x2') + await page.locator('#globe-diagram .lg-minute-hand').getAttribute('x2'));
      }
      assert.equal(lines.size, 4);
      await setRange(page, 'noon-time', 860);
      assert.match(await page.locator('#noon-readout').textContent(), /140 minutes ÷ 4 minutes per degree = 35°/);
      for (const s of ['Greenwich (dashed)', 'ship (noon)', 'Greenwich clock', 'ship: 35° W', 'sunlight']) assert.ok((await labelsOf(page, 'globe-wrap')).includes(s), s);
    });
  });

  test(`${name}: the lunar slider moves the Moon towards the star, and the readout uses the table`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await count(page, '#lunar-table-body tr'), 5);
      assert.equal(await count(page, '#lunar-diagram .lg-moon-ghost'), 5);
      const xs = [];
      for (const h of [0, 6, 12]) {
        await setRange(page, 'lunar-time', h);
        assert.equal(await page.locator('#lunar-diagram').getAttribute('data-distance'), String(L.lunarDistance(h)));
        xs.push(Number(await page.locator('#lunar-diagram .lg-moon').getAttribute('cx')));
        assert.ok((await labelsOf(page, 'lunar-wrap')).includes(`lunar distance: ${L.lunarDistance(h)}°`));
        assert.match(await page.locator('#lunar-readout').textContent(), new RegExp(`Greenwich time ${L.formatClock(h * 60)}`));
      }
      assert.ok(xs[0] > xs[1] && xs[1] > xs[2], 'the Moon closes on the star');
    });
  });

  test(`${name}: the voyage slider moves both clocks' markers, and the readout gives each error`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const d of [0, 20, 60]) {
        await setRange(page, 'voyage-days', d);
        assert.equal(await page.locator('#clocks-diagram').getAttribute('data-days'), String(d));
        const ord = L.clockErrorMinutes('ordinary', d);
        assert.match(await page.locator('#clocks-readout').textContent(), new RegExp(`ordinary clock is ${+ord.toFixed(1)} minutes out, so ${+L.longitudeErrorDeg(ord).toFixed(2)}° wrong`));
      }
      await setRange(page, 'voyage-days', 42);
      assert.match(await page.locator('#clocks-readout').textContent(), /10\.5° wrong, about 1,191 km/);
      const labels = await labelsOf(page, 'clocks-wrap');
      for (const s of ['Time at sea (days)', 'Clock error (minutes)', 'Longitude error (°)', 'ordinary clock (dashed)', 'H4 (solid, almost flat)', 'prize limit: 2 minutes (dotted)']) assert.ok(labels.includes(s), s);
      assert.equal(await count(page, '#timeline-diagram .lg-event'), 4);
    });
  });

  test(`${name}: every name, date and figure is labelled first draft, and Shadows and Sundials is linked`, async (t) => {
    await withPage(t, still, async (page) => {
      const notes = (await page.locator('main .note:not(.sl-readout)').allTextContents()).map((s) => s.replace(/\s+/g, ' '));
      const all = notes.join(' || ');
      for (const s of ['half a degree an hour', 'Jupiter', '1 minute a day', '5 seconds in 81 days', 'half a degree', '1714', '£20,000', 'Maskelyne', '1767', 'H4', '1761', 'Jamaica', '1773', '13,000 km']) assert.ok(all.includes(s), s);
      notes.filter((n) => !/Stored in this browser/.test(n)).forEach((n) => assert.match(n, /first draft, to be checked by the teacher/i, n));
      assert.ok((await count(page, 'main a[href="../sims/shadows-and-sundials.html#longitude-method"]')) >= 1);
    });
  });

  test(`${name}: at every setting, no diagram label overlaps another or spills outside its panel`, async (t) => {
    await withPage(t, still, async (page) => {
      const found = [];
      for (const m of [360, 660, 716, 720, 724, 860, 1080]) {
        await setRange(page, 'noon-time', m);
        found.push(...(await labelProblems(page, `noon ${m}`)));
      }
      for (const h of [0, 1.5, 4.5, 12]) {
        await setRange(page, 'lunar-time', h);
        found.push(...(await labelProblems(page, `lunar ${h}`)));
      }
      for (const d of [0, 30, 60]) {
        await setRange(page, 'voyage-days', d);
        found.push(...(await labelProblems(page, `day ${d}`)));
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
