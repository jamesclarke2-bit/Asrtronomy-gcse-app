/**
 * notes/catalogues-and-star-names.html in a real browser, at phone and iPad
 * widths: tapping Orion's stars and switching the name form, the Bayer
 * order chart, the catalogue object picker and extract table, the
 * first-draft labels, the quiz cards, and no diagram label colliding in
 * any state.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const N = require('../src/starNames');
const { makeQuestions } = require('../src/starNamesQuestions');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'catalogues-and-star-names.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/starNamesInteractive.test.js');

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
const labels = (page, id) => page.locator(`#${id}-wrap .cn-star-label`).allTextContents();

WIDTHS.forEach(({ name, width, height }) => {
  const still = { viewport: { width, height }, reducedMotion: 'reduce' };

  test(`${name}: loads with no console errors and no horizontal scroll`, async (t) => {
    await withPage(t, still, async (page, errors) => {
      assert.deepEqual(errors, []);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
    });
  });

  test(`${name}: each name form relabels every star in Orion, and tapping a star shows all its names`, async (t) => {
    await withPage(t, still, async (page) => {
      const stars = N.orionStars();
      const expect = {
        proper: stars.map((s) => s.proper),
        bayer: stars.map((s) => s.bayerShort),
        flamsteed: stars.map((s) => `${s.flamsteed} Ori`),
        hd: stars.map((s) => s.hdName),
      };
      for (const form of Object.keys(expect)) {
        await page.click(`#form-buttons button[data-form="${form}"]`);
        assert.equal((await data(page, 'orion-diagram')).form, form);
        assert.deepEqual(await labels(page, 'orion-diagram'), expect[form], form);
        assert.equal(await page.locator(`#form-buttons button[data-form="${form}"]`).getAttribute('aria-pressed'), 'true');
      }
      await page.click('#orion-diagram .cn-hit[data-star="rigel"]', { force: true });
      assert.equal((await data(page, 'orion-diagram')).chosen, 'rigel');
      assert.equal(await page.locator('dialog.diagram-enlarge-dialog[open]').count(), 0, 'tapping a star does not open Enlarge');
      const card = (await page.locator('#star-card').textContent()).replace(/\s+/g, ' ');
      assert.match(card, /Rigel/);
      assert.match(card, /Beta Orionis \(β Ori\)/);
      assert.match(card, /19 Orionis/);
      assert.match(card, /HD 34085/);
      assert.match(card, /1st brightest; its Greek letter is the 2nd letter/);
      assert.equal(await page.locator('#orion-diagram .cn-chosen-ring').count(), 1);
      // The keyboard works too.
      await page.locator('#orion-diagram .cn-hit[data-star="meissa"]').focus();
      await page.keyboard.press('Enter');
      assert.equal((await data(page, 'orion-diagram')).chosen, 'meissa');
      assert.match(await page.locator('#star-card').textContent(), /Lambda Orionis/);
    });
  });

  test(`${name}: the Greek-letter table and the order chart show the letters only roughly follow brightness`, async (t) => {
    await withPage(t, still, async (page) => {
      const rows = await page.locator('#greek-table tbody tr').allTextContents();
      assert.equal(rows.length, 8);
      assert.match(rows[0], /αAlphabrightest/);
      assert.match(rows[1], /βBeta2nd brightest/);
      assert.equal(await page.locator('#order-diagram .cn-bar').count(), 8);
      const widths = await page.locator('#order-diagram .cn-bar').evaluateAll((bars) => Object.fromEntries(bars.map((b) => [b.dataset.star, Number(b.getAttribute('width'))])));
      assert.ok(widths.rigel > widths.betelgeuse, 'beta Rigel is brighter than alpha Betelgeuse');
      const text = await page.locator('#order-diagram-wrap').textContent();
      assert.match(text, /α Betelgeuse/);
      assert.match(text, /β Rigel/);
    });
  });

  test(`${name}: choosing a catalogue object redraws its type and marks its row in the extract`, async (t) => {
    await withPage(t, still, async (page) => {
      const head = await page.locator('#catalogue-table thead th').allTextContents();
      assert.deepEqual(head, ['Messier number', 'NGC number', 'Name', 'Type', 'Constellation', 'Apparent magnitude']);
      assert.equal(await page.locator('#catalogue-table tbody tr').count(), N.DEEP_SKY.length);
      assert.match(await page.locator('#catalogue-table tbody tr[data-id="m45"]').textContent(), /M45—Pleiades/);
      const drawings = new Set();
      for (const o of N.DEEP_SKY) {
        await page.click(`#object-buttons button[data-object="${o.id}"]`);
        const d = await data(page, 'object-diagram');
        assert.equal(d.chosen, o.id);
        assert.equal(d.type, o.type);
        const text = await page.locator('#object-diagram-wrap').textContent();
        assert.ok(text.includes(`${o.name}: ${o.type}`), o.id);
        assert.ok(text.includes(`in ${o.constellation}, magnitude ${o.mag.toFixed(1)}`), o.id);
        assert.equal(await page.locator('#catalogue-table tr.cn-row--chosen').getAttribute('data-id'), o.id);
        drawings.add(await page.locator('#object-diagram-wrap').evaluate((el) => el.innerHTML));
      }
      assert.equal(drawings.size, N.DEEP_SKY.length, 'each object redraws the diagram');
      await page.click('#object-buttons button[data-object="m42"]');
      assert.match(await page.locator('#object-diagram-wrap').textContent(), /M42 = NGC 1976/);
      assert.equal(await page.locator('a[href="binaries-and-clusters.html#eyepiece"]').count(), 1);
    });
  });

  test(`${name}: every section with general knowledge labels it first draft`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const sel of ['#star-names', '#bayer', '#catalogues']) {
        assert.match((await page.locator(`${sel} .note`).last().textContent()).replace(/\s+/g, ' '), /first draft, to be checked by the teacher/, sel);
      }
    });
  });

  test(`${name}: every quiz card carries data-question-id, marks and spec tag, including decoding a Bayer name`, async (t) => {
    await withPage(t, still, async (page) => {
      const bank = makeQuestions(N);
      const ids = await page.locator('#questions-list .question-card').evaluateAll((cards) => cards.map((c) => c.dataset.questionId));
      assert.deepEqual([...ids].sort(), bank.map((q) => q.id).sort());
      assert.ok(ids.includes('cn-decode-beta-per'));
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
      for (const form of ['proper', 'bayer', 'flamsteed', 'hd']) {
        await page.click(`#form-buttons button[data-form="${form}"]`);
        for (const star of ['betelgeuse', 'alnilam', 'rigel']) {
          await page.click(`#orion-diagram .cn-hit[data-star="${star}"]`, { force: true });
          found.push(...(await labelProblems(page, `${form} ${star}`)));
        }
      }
      for (const o of N.DEEP_SKY) {
        await page.click(`#object-buttons button[data-object="${o.id}"]`);
        found.push(...(await labelProblems(page, o.id)));
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
