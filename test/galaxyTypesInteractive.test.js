/**
 * notes/galaxy-types.html in a real browser, at phone and iPad widths: the
 * sorting activity (each answer shown in the picture and in words), the
 * tuning fork, the first-draft label, the quiz cards with their drawn
 * galaxies, and no diagram label colliding in any state.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const T = require('../src/galaxyTypes');
const { makeQuestions } = require('../src/galaxyTypesQuestions');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'galaxy-types.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/galaxyTypesInteractive.test.js');

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

  test(`${name}: loads with no console errors and no horizontal scroll`, async (t) => {
    await withPage(t, still, async (page, errors) => {
      assert.deepEqual(errors, []);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
    });
  });

  test(`${name}: every sorting tile draws its galaxy by shape, with four class buttons and no Enlarge button`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await count(page, '.gt-tile'), T.SORT_SET.length);
      for (const item of T.SORT_SET) {
        assert.equal(await count(page, `#tile-${item.id} .gx-${item.draw.kind}`), 1, item.id);
        assert.equal(await count(page, `button[data-item="${item.id}"]`), 4);
      }
      assert.equal(await count(page, '#sort-grid .diagram-enlarge-button'), 0);
    });
  });

  test(`${name}: choosing a class marks the tile, in the picture and in words, right or wrong, and keeps score`, async (t) => {
    await withPage(t, still, async (page) => {
      await page.click('button[data-item="g1"][data-choice="elliptical"]');
      assert.equal(await page.locator('#tile-g1').getAttribute('data-answered'), 'right');
      assert.equal(await page.locator('.gt-tile', { has: page.locator('#tile-g1') }).locator('.gt-tile-answer').textContent(), '✓ Elliptical');
      assert.match(await page.locator('#feedback-g1').textContent(), /^✓ Correct: elliptical/);
      assert.equal(await page.locator('button[data-item="g1"][data-choice="elliptical"]').getAttribute('aria-pressed'), 'true');
      await page.click('button[data-item="g3"][data-choice="spiral"]');
      assert.equal(await page.locator('#tile-g3').getAttribute('data-answered'), 'wrong');
      assert.equal(await page.locator('.gt-tile', { has: page.locator('#tile-g3') }).locator('.gt-tile-answer').textContent(), '✗ Barred spiral');
      assert.match(await page.locator('#feedback-g3').textContent(), /^✗ Not spiral\. Look again: it is barred spiral/);
      assert.match(await page.locator('#sort-score').textContent(), /Sorted correctly: 1 of 2 tried/);
      // Changing the answer redraws the tile.
      await page.click('button[data-item="g3"][data-choice="barred"]');
      assert.equal(await page.locator('#tile-g3').getAttribute('data-answered'), 'right');
      assert.match(await page.locator('#sort-score').textContent(), /Sorted correctly: 2 of 2 tried/);
    });
  });

  test(`${name}: the tuning fork places every type, rings the Milky Way at SBb, and keeps irregulars apart`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await count(page, '#fork-diagram .gt-fork-galaxy'), T.FORK.length + 1);
      assert.equal(await count(page, '#fork-diagram .gt-fork'), 1);
      const labels = await page.locator('#fork-diagram-wrap .diagram-label').allTextContents();
      T.FORK.forEach((f) => assert.ok(labels.includes(f.label), f.label));
      ['ellipticals', 'spirals', 'barred spirals', 'Milky Way', 'irregulars: not on the fork'].forEach((l) => assert.ok(labels.includes(l), l));
      const ring = await page.locator('#fork-diagram .gt-mw-ring').evaluate((el) => [Number(el.getAttribute('cx')), Number(el.getAttribute('cy'))]);
      assert.deepEqual(ring, [T.forkSpot('SBb').x, T.forkSpot('SBb').y]);
      assert.equal(await count(page, '#tuning-fork a[href="our-galaxy.html#shape"]'), 1);
    });
  });

  test(`${name}: the evolution idea is said to be no longer thought true, labelled first draft`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.match((await page.locator('#tuning-fork .note').last().textContent()).replace(/\s+/g, ' '), /no longer thought true.*first draft, to be checked by the teacher/);
    });
  });

  test(`${name}: every quiz card carries data-question-id, marks and spec tag; the classify questions draw the right kind of galaxy`, async (t) => {
    await withPage(t, still, async (page) => {
      const bank = makeQuestions(T);
      const ids = await page.locator('#questions-list .question-card').evaluateAll((cards) => cards.map((c) => c.dataset.questionId));
      assert.deepEqual([...ids].sort(), bank.map((q) => q.id).sort());
      for (const q of bank) {
        const card = page.locator(`.question-card[data-question-id="${q.id}"]`);
        assert.match(await card.locator('.question-marks').textContent(), new RegExp(`\\[${q.marks} marks?\\]`));
        assert.match(await card.locator('.question-tags').textContent(), new RegExp(`Spec ${q.spec.replace('.', '\\.')}`));
      }
      const kinds = { 'gt-classify-elliptical': 'elliptical', 'gt-classify-barred': 'barred', 'gt-classify-irregular': 'irregular', 'gt-classify-spiral': 'spiral' };
      for (const [id, kind] of Object.entries(kinds)) {
        assert.equal(await page.locator(`.question-card[data-question-id="${id}"] .gx-${kind}`).count(), 1, id);
      }
    });
  });

  test(`${name}: in every state, no diagram label overlaps another or spills outside its panel`, async (t) => {
    await withPage(t, still, async (page) => {
      const found = [...(await labelProblems(page, 'default'))];
      for (const item of T.SORT_SET) await page.click(`button[data-item="${item.id}"][data-choice="${item.answer}"]`);
      found.push(...(await labelProblems(page, 'all sorted')));
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
