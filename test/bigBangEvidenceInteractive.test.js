/**
 * notes/big-bang-evidence.html in a real browser, at phone and iPad widths:
 * the quasar chart, the CMB drawing and graph, the deep-field rings, the
 * coarse-to-fine map with symbols as well as shading, the first-draft
 * labels, the quiz cards, and no label collisions.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const E = require('../src/bigBangEvidence');
const { makeQuestions } = require('../src/bigBangEvidenceQuestions');
const BANK = () => makeQuestions(E);

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'big-bang-evidence.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/bigBangEvidenceInteractive.test.js');

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

  test(`${name}: the quasar chart has none nearby, and the CMB graph has its axes and peak`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await count(page, '#quasar-diagram .ev-quasar'), E.QUASAR_BINS.reduce((s, b) => s + b.count, 0));
      const q = (await page.locator('#quasar-diagram-wrap .diagram-label').allTextContents()).join(' | ');
      for (const s of ['none nearby', 'Distance (billion light-years)', 'Number of quasars']) assert.ok(q.includes(s), s);
      assert.equal(await count(page, '#cmb-diagram .ev-cmb-ray'), 8);
      assert.equal(await count(page, '#cmb-diagram .ev-cmb-curve'), 1);
      const c = (await page.locator('#cmb-diagram-wrap .diagram-label').allTextContents()).join(' | ');
      for (const s of ['Wavelength (mm)', 'Brightness (relative units)', 'peak near 1 mm', 'every direction']) assert.ok(c.includes(s), s);
    });
  });

  test(`${name}: the deep-field button rings the distant galaxies and the drawing changes`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await count(page, '#deep-field-diagram .ev-far-galaxy'), E.DEEP_FIELD.far.length);
      assert.equal(await count(page, '#deep-field-diagram .ev-near-galaxy'), E.DEEP_FIELD.near.length);
      assert.equal(await count(page, '#deep-field-diagram .ev-ring'), 0);
      await page.click('#df-ring');
      assert.equal(await page.locator('#df-ring').getAttribute('aria-pressed'), 'true');
      assert.equal(await count(page, '#deep-field-diagram .ev-ring'), E.DEEP_FIELD.far.length);
      assert.match(await page.locator('#df-ring').textContent(), new RegExp(`^${E.DEEP_FIELD.far.length} distant galaxies ringed`));
      await page.click('#df-ring');
      assert.equal(await count(page, '#deep-field-diagram .ev-ring'), 0);
      assert.match(await page.locator('#deep-field + .diagram-caption, #deep-field .diagram-caption').first().textContent(), /A drawing, not the real image/);
    });
  });

  test(`${name}: the detail slider redraws the map finer, with + and − symbols as well as shading`, async (t) => {
    await withPage(t, still, async (page) => {
      const seen = new Set();
      for (let level = 0; level < E.MAP_LEVELS.length; level += 1) {
        await setRange(page, 'cmb-detail', level);
        const svg = page.locator('#cmb-map');
        assert.equal(await svg.getAttribute('data-level'), E.MAP_LEVELS[level].id);
        const m = E.mapCells(level);
        assert.equal(await count(page, '#cmb-map .ev-cell'), m.nx * m.ny);
        assert.ok((await count(page, '#cmb-map .ev-plus')) > 0 && (await count(page, '#cmb-map .ev-minus')) > 0, `level ${level} has both symbols`);
        assert.match(await page.locator('#cmb-map-readout').textContent(), new RegExp(`^${E.MAP_LEVELS[level].name.replace(/[()]/g, '\\$&')}: ${m.nx} cells across`));
        seen.add(await svg.innerHTML());
      }
      assert.equal(seen.size, 3);
      const labels = (await page.locator('#cmb-map-wrap .diagram-label').allTextContents()).join(' | ');
      assert.match(labels, /\+ lighter: slightly warmer/);
      assert.match(labels, /− darker: slightly cooler/);
    });
  });

  test(`${name}: every name, date and figure is labelled first draft, and the companion pages are linked`, async (t) => {
    await withPage(t, still, async (page) => {
      const notes = (await page.locator('main .note:not(.sl-readout)').allTextContents()).map((s) => s.replace(/\s+/g, ' '));
      const all = notes.join(' || ');
      for (const s of ['Penzias', 'Wilson', '1965', '2.7 K', '1995', '10 days', '3,000 galaxies', '1 part in 100,000', 'COBE', '2001', '2009', 'billions of light-years']) assert.ok(all.includes(s), s);
      notes.filter((n) => !/Stored in this browser/.test(n)).forEach((n) => assert.match(n, /first draft, to be checked by the teacher/i, n));
      for (const href of ['active-galaxies.html#types', 'galaxy-formation.html#bottom-up']) assert.ok((await count(page, `main a[href="${href}"]`)) >= 1, href);
    });
  });

  test(`${name}: at every map level and with the rings on, no diagram label overlaps another or spills outside its panel`, async (t) => {
    await withPage(t, still, async (page) => {
      const found = [];
      for (let level = 0; level < E.MAP_LEVELS.length; level += 1) {
        await setRange(page, 'cmb-detail', level);
        found.push(...(await labelProblems(page, `level ${level}`)));
      }
      await page.click('#df-ring');
      found.push(...(await labelProblems(page, 'rings')));
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
