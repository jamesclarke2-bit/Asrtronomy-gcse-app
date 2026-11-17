/**
 * notes/local-group.html in a real browser, at phone and iPad widths: the
 * Local Group map with each galaxy marked by shape, the distance table,
 * the zoom-out buttons redrawing the picture, the first-draft labels, the
 * quiz cards, and no diagram label colliding in any state.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const L = require('../src/localGroup');
const { makeQuestions } = require('../src/localGroupQuestions');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'local-group.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/localGroupInteractive.test.js');

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

  test(`${name}: the map marks each galaxy by shape and label, with scale bars and a close-up of the Magellanic Clouds`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const cls of ['lg-mw', 'lg-m31', 'lg-m33', 'lg-lmc', 'lg-smc']) assert.equal(await count(page, `#map-diagram .${cls}`), 1, cls);
      assert.ok((await count(page, '#map-diagram .lg-mw.gx-barred')) === 1);
      assert.ok((await count(page, '#map-diagram .lg-m31.gx-spiral')) === 1);
      assert.ok((await count(page, '#map-diagram .lg-lmc.gx-irregular')) === 1);
      assert.ok((await count(page, '#map-diagram .lg-dwarf')) > 15);
      assert.equal(await count(page, '#map-diagram .lg-scale'), 2);
      const labels = await page.locator('#map-diagram-wrap .diagram-label').allTextContents();
      ['Milky Way', 'Andromeda (M31)', 'Triangulum (M33)', 'LMC', 'SMC', '1 million pc', '50,000 pc', 'barred spiral', 'spiral', 'irregular', 'dwarf galaxy'].forEach((l) => assert.ok(labels.includes(l), l));
    });
  });

  test(`${name}: the distance table gives pc and light-years, with units in its headings, and the LMC at 50,000 pc`, async (t) => {
    await withPage(t, still, async (page) => {
      const heads = await page.locator('.lg-table thead th').allTextContents();
      assert.deepEqual(heads, ['Galaxy', 'Type', 'Distance from us (pc)', 'Distance from us (light-years)']);
      const rows = await page.locator('#members-body tr').evaluateAll((trs) => trs.map((tr) => [...tr.children].map((c) => c.textContent)));
      assert.equal(rows.length, 4);
      assert.deepEqual(rows.find((r) => /LMC/.test(r[0])), ['Large Magellanic Cloud (LMC)', 'Irregular', 'about 50,000', 'about 160,000']);
      assert.deepEqual(rows.find((r) => /M31/.test(r[0])), ['Andromeda Galaxy (M31)', 'Spiral', 'about 760,000', 'about 2,500,000']);
      for (const href of ['variable-stars.html#distance', 'catalogues-and-star-names.html#catalogues', 'our-galaxy.html']) assert.equal(await count(page, `#local-group a[href="${href}"]`), 1, href);
    });
  });

  test(`${name}: each zoom button redraws the picture at a bigger scale`, async (t) => {
    await withPage(t, still, async (page) => {
      const seen = new Set();
      for (const lv of L.LEVELS) {
        await page.click(`button[data-level="${lv.id}"]`);
        assert.equal(await page.locator('#zoom-diagram').getAttribute('data-level'), lv.id);
        assert.equal(await page.locator(`button[data-level="${lv.id}"]`).getAttribute('aria-pressed'), 'true');
        assert.equal(await count(page, '.lg-zoom-buttons button[aria-pressed="true"]'), 1);
        seen.add(await page.locator('#zoom-diagram').innerHTML());
        assert.match(await page.locator('#zoom-readout').textContent(), new RegExp(`^${lv.name}: about`));
        if (lv.id !== 'group') assert.equal(await count(page, '#zoom-diagram .lg-prev-box'), 1, `${lv.id} shows the previous view's size`);
      }
      assert.equal(seen.size, L.LEVELS.length);
      const web = await page.locator('#zoom-diagram-wrap .diagram-label').allTextContents();
      assert.ok(web.includes('void') && web.includes('filament'));
      assert.ok((await count(page, '#zoom-diagram .lg-filament')) > 10);
    });
  });

  test(`${name}: every section with general knowledge labels it first draft`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const [sel, re] of [['#local-group', /About 50 galaxies.*first draft, to be checked by the teacher.*1 pc = 3\.26 light-years/], ['#bigger', /10 million, 20 million, 300 million and 3 billion light-years.*first draft, to be checked by the teacher/]]) {
        assert.match((await page.locator(`${sel} .note`).last().textContent()).replace(/\s+/g, ' '), re, sel);
      }
    });
  });

  test(`${name}: every quiz card carries data-question-id, marks and spec tag`, async (t) => {
    await withPage(t, still, async (page) => {
      const bank = makeQuestions(L);
      const ids = await page.locator('#questions-list .question-card').evaluateAll((cards) => cards.map((c) => c.dataset.questionId));
      assert.deepEqual([...ids].sort(), bank.map((q) => q.id).sort());
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
      for (const lv of L.LEVELS) {
        await page.click(`button[data-level="${lv.id}"]`);
        found.push(...(await labelProblems(page, lv.id)));
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
