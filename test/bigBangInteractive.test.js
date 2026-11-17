/**
 * notes/big-bang-steady-state.html in a real browser, at phone and iPad
 * widths: the step buttons driving both panels together, the looking-back
 * drawing, the first-draft label, the quiz cards, and no label collisions.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const B = require('../src/bigBang');
const { makeQuestions } = require('../src/bigBangQuestions');
const BANK = () => makeQuestions(B);

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'big-bang-steady-state.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/bigBangInteractive.test.js');

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
    });
  });

  test(`${name}: loads with no console errors and no horizontal scroll`, async (t) => {
    await withPage(t, still, async (page, errors) => {
      assert.deepEqual(errors, []);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
    });
  });

  test(`${name}: the step buttons drive both panels together: the Big Bang thins out, the Steady State keeps its count with new galaxies`, async (t) => {
    await withPage(t, still, async (page) => {
      const seen = new Set();
      for (let s = 1; s <= 4; s += 1) {
        await page.click(`.bb-step-buttons button[data-step="${s}"]`);
        const svg = page.locator('#theories-diagram');
        assert.equal(await svg.getAttribute('data-step'), String(s));
        assert.equal(await count(page, '.bb-step-buttons button[aria-pressed="true"]'), 1);
        assert.equal(Number(await svg.getAttribute('data-big-bang-count')), B.bigBang(s - 1).length);
        assert.equal(Number(await svg.getAttribute('data-steady-state-count')), B.TODAY_COUNT);
        assert.equal(await count(page, '#theories-diagram .bb-new'), s === 1 ? 0 : B.steadyState(s - 1).filter((g) => g.created === s - 1).length);
        assert.equal(await count(page, '#theories-diagram .bb-pair'), s === 1 ? 0 : 4);
        assert.equal(await count(page, '#theories-diagram .bb-gas'), s === 1 ? 70 : 0, 'hot gas only at step 1');
        const readout = await page.locator('#theories-readout').textContent();
        assert.match(readout, new RegExp(`^Step ${s}, ${B.STEPS[s - 1].label}:`));
        if (s === 1) {
          assert.equal(B.bigBang(0).length, 0);
          assert.match(readout, /Big Bang: no galaxies yet, only hot, dense, glowing gas\./);
        } else assert.match(readout, new RegExp(`Big Bang: ${B.bigBang(s - 1).length} galaxies`));
        seen.add(await svg.innerHTML());
      }
      assert.equal(seen.size, 4);
      const labels = (await page.locator('#theories-diagram-wrap .diagram-label').allTextContents()).join(' | ');
      assert.match(labels, /Big Bang/);
      assert.match(labels, /Steady State/);
    });
  });

  test(`${name}: the looking-back drawing contrasts the two predictions, and the evidence page is linked`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.ok((await count(page, '#looking-back-diagram .bb-quasar')) >= 3);
      assert.equal(await count(page, '#looking-back-diagram .bb-ss-galaxy'), 5);
      const labels = (await page.locator('#looking-back-diagram-wrap .diagram-label').allTextContents()).join(' | ');
      assert.match(labels, /Big Bang predicts/);
      assert.match(labels, /the same mix at every distance/);
      const deciding = (await page.locator('#deciding').textContent()).replace(/\s+/g, ' ');
      assert.match(deciding, /measuring the expansion cannot tell them apart/);
      for (const href of ['big-bang-evidence.html', 'hubble-law.html#evidence', 'hubble-law.html#age']) assert.ok((await count(page, `main a[href="${href}"]`)) >= 1, href);
      assert.match((await page.locator('#two-theories .note:not(.sl-readout)').textContent()).replace(/\s+/g, ' '), /Bondi, Thomas Gold and Fred Hoyle.*1948.*First draft, to be checked by the teacher\./);
    });
  });

  test(`${name}: at every step, no diagram label overlaps another or spills outside its panel`, async (t) => {
    await withPage(t, still, async (page) => {
      const found = [];
      for (let s = 1; s <= 4; s += 1) {
        await page.click(`.bb-step-buttons button[data-step="${s}"]`);
        found.push(...(await labelProblems(page, `step ${s}`)));
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
