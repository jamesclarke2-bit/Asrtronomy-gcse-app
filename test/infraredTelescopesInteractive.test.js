/**
 * notes/infrared-telescopes.html in a real browser, at phone and iPad
 * widths: the shared atmosphere chart with a shape marker on every band,
 * the where-each-telescope-works diagram, the altitude slider against the
 * engine (sites on the step grid, more infrared getting through higher
 * up), the three infrared discoveries, the sharp-against-blurred star,
 * the first-draft labels, the quiz cards, and no diagram label colliding
 * in any state.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const I = require('../src/infraredSites');
const W = require('../src/atmosphereWindows');
const { makeQuestions } = require('../src/infraredTelescopesQuestions');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'infrared-telescopes.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/infraredTelescopesInteractive.test.js');

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

WIDTHS.forEach(({ name, width, height }) => {
  const still = { viewport: { width, height }, reducedMotion: 'reduce' };

  test(`${name}: loads with no console errors and no horizontal scroll`, async (t) => {
    await withPage(t, still, async (page, errors) => {
      assert.deepEqual(errors, []);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
    });
  });

  test(`${name}: the shared atmosphere chart marks every band by shape, not colour alone; 13.23 links to the radio page`, async (t) => {
    await withPage(t, still, async (page) => {
      const bars = await page.locator('#windows-chart rect[data-category]').evaluateAll((els) => els.map((el) => el.dataset.category));
      assert.deepEqual(bars, W.BANDS.map((b) => b.category));
      const marks = await page.locator('#windows-chart-wrap .ir-mark').allTextContents();
      assert.deepEqual(marks, ['✗', '✗', '✗', '✓', '∼', '✓']);
      const names = await page.locator('#windows-chart-wrap .diagram-label').allTextContents();
      for (const n of ['Gamma', 'X-ray', 'UV', 'Visible', 'Infrared', 'Radio', "Earth's surface"]) assert.ok(names.includes(n), n);
      assert.equal(await page.locator('#windows a[href="radio-telescopes.html"]').count(), 1);
      assert.equal(await page.locator('#windows a[href="earth-structure.html#transmission-window"]').count(), 1);
      // X-rays are absorbed far above the mountain-top telescope.
      const lineY = Number(await page.locator('#sites-diagram .ir-xray-line').getAttribute('y1'));
      const domeY = await page.locator('#sites-diagram .ir-site-infrared').first().evaluate((el) => Number(el.getAttribute('y')));
      assert.ok(lineY < domeY - 50, `${lineY} well above ${domeY}`);
      for (const cls of ['ir-site-optical', 'ir-radio-dish', 'ir-site-infrared', 'ir-site-xray']) assert.ok((await page.locator(`#sites-diagram .${cls}`).count()) > 0, cls);
    });
  });

  test(`${name}: higher sites let more infrared through, matching the engine; the sites land on the step grid`, async (t) => {
    await withPage(t, still, async (page) => {
      let last = -1;
      for (const tenths of [0, 10, 20, 30, 42, 50]) {
        await setRange(page, 'altitude', tenths);
        const d = await data(page, 'altitude-diagram');
        const km = tenths / 10;
        assert.equal(d.through, I.infraredThrough(km).toFixed(3));
        assert.equal(d.vapourAbove, I.waterVapourAbove(km).toFixed(3));
        assert.equal(await page.locator('#altitude-diagram .ir-arrow--through').count(), Math.round(10 * I.infraredThrough(km)));
        assert.equal(await page.locator('#altitude-diagram .ir-arrow').count(), 10);
        assert.ok(Number(d.through) > last, `${km} km`);
        last = Number(d.through);
      }
      for (const s of I.SITES) {
        await page.click(`#site-buttons button[data-site="${s.id}"]`);
        assert.equal(Number(await page.locator('#altitude').inputValue()), Math.round(s.altitudeKm * 10), s.id);
        assert.equal(await page.locator(`#site-buttons button[data-site="${s.id}"]`).getAttribute('aria-pressed'), 'true');
        assert.match(await page.locator('#altitude-readout').textContent(), new RegExp(`At ${s.altitudeKm.toFixed(1)} km`));
      }
    });
  });

  test(`${name}: each infrared discovery shows something in infrared that visible light does not`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await page.locator('#discoveries-diagram .ir-find-panel').count(), 3);
      assert.equal(await page.locator('#discoveries-diagram .ir-cloud-opaque').count(), 1);
      assert.equal(await page.locator('#discoveries-diagram .ir-protostar').count(), 6, 'three protostars, each a glow and a point');
      assert.equal(await page.locator('#discoveries-diagram .ir-wisp').count(), 3);
      assert.equal(await page.locator('#discoveries-diagram .ir-hotspot').count(), 8, 'four hotspots, each a glow and a point');
      const labels = await page.locator('#discoveries-diagram-wrap .diagram-label').allTextContents();
      assert.equal(labels.filter((l) => l === 'visible light').length, 3);
      assert.equal(labels.filter((l) => l === 'infrared').length, 3);
      assert.equal(await page.locator('.ir-finds li').count(), 3);
    });
  });

  test(`${name}: still air gives one sharp point; more turbulence a larger, broken-up blur; Twinkle moves the speckles`, async (t) => {
    await withPage(t, still, async (page) => {
      await setRange(page, 'turbulence', 0);
      let d = await data(page, 'seeing-diagram');
      assert.deepEqual([d.radius, d.speckles], [String(I.SHARP_RADIUS), '1']);
      assert.ok((await page.locator('#seeing-diagram-wrap').textContent()).includes('a sharp point'));
      let lastRadius = 0;
      for (const v of [2, 5, 8, 10]) {
        await setRange(page, 'turbulence', v);
        d = await data(page, 'seeing-diagram');
        assert.equal(d.radius, String(I.starImage(v).radius));
        assert.ok(Number(d.radius) > lastRadius);
        lastRadius = Number(d.radius);
      }
      assert.ok((await page.locator('#seeing-diagram-wrap').textContent()).includes('a larger, broken-up blur'));
      assert.equal(await page.locator('#twinkle').getAttribute('aria-pressed'), 'false', 'paused under reduced motion');
      const before = await markup(page, 'seeing-diagram');
      await page.click('#twinkle');
      await page.waitForTimeout(450);
      assert.notEqual(await markup(page, 'seeing-diagram'), before);
      await page.click('#twinkle');
    });
    await withPage(t, { viewport: { width, height } }, async (page) => {
      assert.equal(await page.locator('#twinkle').getAttribute('aria-pressed'), 'true');
    });
  });

  test(`${name}: every section using general-knowledge values or facts labels them first draft`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const section of ['windows', 'high-dry', 'discoveries', 'image-quality']) {
        const notes = (await page.locator(`#${section} .note`).allTextContents()).map((n) => n.replace(/\s+/g, ' '));
        assert.ok(notes.some((n) => /first draft, to be checked by the teacher/.test(n)), section);
      }
    });
  });

  test(`${name}: every quiz card carries data-question-id, marks and spec tag, including the X-ray and high, dry site questions`, async (t) => {
    await withPage(t, still, async (page) => {
      const bank = makeQuestions(I);
      const ids = await page.locator('#questions-list .question-card').evaluateAll((cards) => cards.map((c) => c.dataset.questionId));
      assert.deepEqual([...ids].sort(), bank.map((q) => q.id).sort());
      assert.ok(ids.includes('ir-xray-mountain') && ids.includes('ir-high-dry'));
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
      for (const tenths of [0, 25, 42, 50]) {
        await setRange(page, 'altitude', tenths);
        found.push(...(await labelProblems(page, `altitude ${tenths}`)));
      }
      for (const v of [0, 10]) {
        await setRange(page, 'turbulence', v);
        found.push(...(await labelProblems(page, `turbulence ${v}`)));
      }
      assert.deepEqual(found, []);
    });
  });

  test(`${name}: every slider visibly changes its own diagram`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const [id, diagram, value] of [['altitude', 'altitude-diagram', 35], ['turbulence', 'seeing-diagram', 9]]) {
        const before = await markup(page, diagram);
        await setRange(page, id, value);
        assert.notEqual(await markup(page, diagram), before, `${id} redraws ${diagram}`);
      }
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
