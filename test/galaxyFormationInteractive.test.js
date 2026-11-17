/**
 * notes/galaxy-formation.html in a real browser, at phone and iPad widths: each
 * theory's four step buttons redrawing its picture, the first-draft
 * labels, the quiz cards, and no label collisions.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const F = require('../src/galaxyFormation');
const { makeQuestions } = require('../src/galaxyFormationQuestions');
const BANK = () => makeQuestions(F);

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'galaxy-formation.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/galaxyFormationInteractive.test.js');

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

  test(`${name}: every theory's step buttons redraw its picture, and the readout follows`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const th of F.THEORIES) {
        const seen = new Set();
        for (let step = 1; step <= F.STEPS; step += 1) {
          await page.click(`button[data-theory="${th.id}"][data-step="${step}"]`);
          assert.equal(await page.locator(`#${th.id}-diagram`).getAttribute('data-step'), String(step));
          assert.equal(await page.locator(`button[data-theory="${th.id}"][data-step="${step}"]`).getAttribute('aria-pressed'), 'true');
          assert.equal(await count(page, `.gf-step-buttons[data-theory="${th.id}"] button[aria-pressed="true"]`), 1);
          assert.equal(await page.locator(`#${th.id}-readout`).textContent(), `Step ${step}: ${th.steps[step - 1]}`);
          seen.add(await page.locator(`#${th.id}-diagram`).innerHTML());
        }
        assert.equal(seen.size, F.STEPS, `${th.id}: each step draws something different`);
      }
    });
  });

  test(`${name}: what each theory ends with is drawn: a spiral (top-down), a big galaxy swallowing a small one (bottom-up), an elliptical (mergers)`, async (t) => {
    await withPage(t, still, async (page) => {
      await page.click('button[data-theory="top-down"][data-step="4"]');
      assert.equal(await count(page, '#top-down-diagram .gx-spiral'), 1);
      assert.ok((await count(page, '#top-down-diagram .gf-cluster')) >= 5);
      await page.click('button[data-theory="bottom-up"][data-step="1"]');
      assert.ok((await count(page, '#bottom-up-diagram .gf-clump')) >= 20);
      await page.click('button[data-theory="bottom-up"][data-step="4"]');
      assert.ok((await count(page, '#bottom-up-diagram .gf-stream')) > 10);
      await page.click('button[data-theory="mergers"][data-step="2"]');
      assert.ok((await count(page, '#mergers-diagram .gf-tail')) > 40);
      assert.ok((await count(page, '#mergers-diagram .gf-new-stars')) >= 3);
      await page.click('button[data-theory="mergers"][data-step="4"]');
      assert.equal(await count(page, '#mergers-diagram .gx-elliptical'), 1);
    });
  });

  test(`${name}: the theories, the evidence and the Milky Way and Andromeda merger are labelled first draft`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.match((await page.locator('#draft .note').textContent()).replace(/\s+/g, ' '), /Both theories.*stars almost never hit each other.*Milky Way and Andromeda are expected to merge in about 4 to 5 billion years: first draft, to be checked by the teacher/);
      for (const href of ['galaxy-types.html', 'local-group.html', 'our-galaxy.html#shape']) assert.ok((await count(page, `main a[href="${href}"]`)) >= 1, href);
    });
  });

  test(`${name}: at every step, no diagram label overlaps another or spills outside its panel`, async (t) => {
    await withPage(t, still, async (page) => {
      const found = [];
      for (const th of F.THEORIES) {
        for (let step = 1; step <= F.STEPS; step += 1) {
          await page.click(`button[data-theory="${th.id}"][data-step="${step}"]`);
          found.push(...(await labelProblems(page, `${th.id} ${step}`)));
        }
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
