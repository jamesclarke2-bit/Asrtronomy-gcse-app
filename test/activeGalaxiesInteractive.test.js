/**
 * notes/active-galaxies.html in a real browser, at phone and iPad widths: the
 * AGN drawn with every part, the viewing-angle slider and power buttons
 * redrawing what you see (Seyfert, quasar, blazar), the spectrum strip,
 * the first-draft labels, the quiz cards, and no label collisions.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const A = require('../src/activeGalaxies');
const { makeQuestions } = require('../src/activeGalaxiesQuestions');
const BANK = () => makeQuestions(A);

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'active-galaxies.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/activeGalaxiesInteractive.test.js');

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

  test(`${name}: the AGN is drawn with its black hole, disc, dusty ring and two jets, each labelled`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await count(page, '#agn-diagram .agn-hole'), 1);
      assert.equal(await count(page, '#agn-diagram .agn-disc'), 1);
      assert.equal(await count(page, '#agn-diagram .agn-torus'), 2);
      assert.equal(await count(page, '#agn-diagram .agn-jet'), 2);
      const ys = await page.locator('#agn-diagram .agn-jet').evaluateAll((els) => els.map((e) => e.getBBox().y + e.getBBox().height / 2));
      assert.ok(ys[0] < 170 && ys[1] > 170, 'one jet up, one down');
      const labels = await page.locator('#agn-diagram-wrap .diagram-label').allTextContents();
      ['supermassive black hole', 'accretion disc', 'dusty ring', 'jet', 'gas falling in'].forEach((l) => assert.ok(labels.includes(l), l));
      assert.match((await page.locator('#agn').textContent()).replace(/\s+/g, ' '), /powered by matter falling onto a supermassive black hole/);
    });
  });

  test(`${name}: turning the view and changing the power redraws what you see: Seyfert, quasar, blazar`, async (t) => {
    await withPage(t, still, async (page) => {
      const kind = () => page.locator('#view-diagram').getAttribute('data-kind');
      const name = () => page.locator('#view-diagram-wrap .ag-type-name').textContent();
      assert.equal(await kind(), 'seyfert');
      assert.equal(await name(), 'Seyfert galaxy');
      assert.equal(await count(page, '#view-diagram .ag-host'), 1, 'a spiral drawn round the bright centre');
      const seyfert = await page.locator('#view-diagram').innerHTML();
      await page.click('button[data-power="huge"]');
      assert.equal(await page.locator('button[data-power="huge"]').getAttribute('aria-pressed'), 'true');
      assert.equal(await kind(), 'quasar');
      assert.equal(await name(), 'Quasar');
      assert.equal(await count(page, '#view-diagram .ag-host'), 0, 'the galaxy is outshone');
      assert.notEqual(await page.locator('#view-diagram').innerHTML(), seyfert);
      const eye45 = await page.locator('#view-diagram .ag-eye').evaluate((e) => [e.getAttribute('cx'), e.getAttribute('cy')].join());
      await setRange(page, 'view-angle', 5);
      assert.equal(await kind(), 'blazar');
      assert.equal(await name(), 'Blazar');
      assert.ok((await count(page, '#view-diagram .ag-glare')) >= 12);
      assert.notEqual(await page.locator('#view-diagram .ag-eye').evaluate((e) => [e.getAttribute('cx'), e.getAttribute('cy')].join()), eye45, 'your position moves');
      assert.match(await page.locator('#view-angle-label').textContent(), /^5°$/);
      assert.match(await page.locator('#view-readout').textContent(), /^5° from the jet, hugely powerful: a blazar/);
      await page.click('button[data-power="modest"]');
      assert.equal(await kind(), 'blazar', 'near the jet it is a blazar either way');
      await setRange(page, 'view-angle', 60);
      assert.equal(await kind(), 'seyfert');
    });
  });

  test(`${name}: the spectrum strip shows a wave and a ringed part of the AGN for every band`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await count(page, '#bands-diagram .ag-wave'), A.BANDS.length);
      for (const b of A.BANDS) assert.equal(await count(page, `#bands-diagram .ag-band-ring--${b.id}`), 1, b.id);
      const labels = await page.locator('#bands-diagram-wrap .diagram-label').allTextContents();
      A.BANDS.forEach((b) => assert.ok(labels.includes(b.name), b.name));
      for (const href of ['radio-telescopes.html#discoveries', 'space-telescopes.html#discoveries', 'black-holes.html', 'infrared-telescopes.html']) assert.ok((await count(page, `main a[href="${href}"]`)) >= 1, href);
    });
  });

  test(`${name}: every section with general knowledge labels it first draft`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const sel of ['#agn', '#types', '#spectrum']) {
        assert.match((await page.locator(`${sel} .note`).last().textContent()).replace(/\s+/g, ' '), /first draft, to be checked by the teacher/, sel);
      }
      assert.match((await page.locator('#agn .note').last().textContent()).replace(/\s+/g, ' '), /Gas heated to millions of degrees/);
      assert.match((await page.locator('#types .note').last().textContent()).replace(/\s+/g, ' '), /one kind of object, seen from different angles and with different power/);
    });
  });

  test(`${name}: the "name the parts" question draws the AGN with letters A to D`, async (t) => {
    await withPage(t, still, async (page) => {
      const card = page.locator('.question-card[data-question-id="ag-parts"]');
      assert.deepEqual((await card.locator('.ag-letter').allTextContents()).sort(), ['A', 'B', 'C', 'D']);
      assert.equal(await card.locator('.agn-jet').count(), 2);
    });
  });

  test(`${name}: in every state, no diagram label overlaps another or spills outside its panel`, async (t) => {
    await withPage(t, still, async (page) => {
      const found = [...(await labelProblems(page, 'default'))];
      for (const power of ['modest', 'huge']) {
        await page.click(`button[data-power="${power}"]`);
        for (let a = 0; a <= 90; a += 15) {
          await setRange(page, 'view-angle', a);
          found.push(...(await labelProblems(page, `${power} ${a}`)));
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
