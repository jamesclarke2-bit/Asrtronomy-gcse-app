/**
 * notes/space-probes.html in a real browser, at phone and iPad widths: the
 * four kinds of probe, each redrawing the central diagram; the mission
 * drawings and their facts against the engine; the launch-speed slider
 * against the escape-velocity model; the rocket drawing; the first-draft
 * labels; the quiz cards; and no diagram label colliding in any state.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const P = require('../src/spaceProbes');
const { makeQuestions } = require('../src/spaceProbesQuestions');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'space-probes.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/spaceProbesInteractive.test.js');

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
const squash = (s) => s.replace(/\s+/g, ' ').trim();

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

  test(`${name}: each kind of probe redraws the central diagram with its own path, and marks its own card`, async (t) => {
    await withPage(t, still, async (page) => {
      const buttons = await page.locator('#type-buttons button').allTextContents();
      assert.deepEqual(buttons, P.TYPES.map((x) => x.name));
      const seen = new Set();
      for (const type of P.TYPES) {
        await page.click(`#type-buttons button[data-type="${type.id}"]`);
        assert.equal((await data(page, 'types-diagram')).type, type.id);
        assert.equal(await page.locator(`#types-diagram .pr-path--${type.id}`).count(), 1, type.id);
        for (const other of P.TYPES.filter((o) => o.id !== type.id)) {
          assert.equal(await page.locator(`#types-diagram .pr-path--${other.id}`).count(), 0, `${type.id} hides ${other.id}`);
        }
        assert.equal(await page.locator(`#type-buttons button[data-type="${type.id}"]`).getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('#type-cards .pr-type-card--chosen').getAttribute('data-type'), type.id);
        seen.add(await markup(page, 'types-diagram'));
      }
      assert.equal(seen.size, 4, 'four different drawings');
      assert.equal(await page.locator('#types-diagram .pr-lander').count(), 1, 'the lander is drawn standing on the surface');
      await page.click('#type-buttons button[data-type="impactor"]');
      assert.ok((await page.locator('#types-diagram .pr-plume').count()) > 10, 'the impactor throws up material');
    });
  });

  test(`${name}: each card has two advantages (✓) and two disadvantages (✗), and every mission's facts match the engine`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const type of P.TYPES) {
        const items = await page.locator(`.pr-type-card[data-type="${type.id}"] li`).allTextContents();
        assert.equal(items.filter((i) => i.startsWith('✓')).length, 2, type.id);
        assert.equal(items.filter((i) => i.startsWith('✗')).length, 2, type.id);
      }
      const text = squash(await page.locator('#missions').textContent());
      for (const m of P.MISSIONS) {
        assert.ok(text.includes(m.name), m.name);
        m.finds.forEach((f) => assert.ok(text.toLowerCase().includes(f.toLowerCase()), `${m.name}: ${f}`));
      }
      for (const id of ['nh-diagram', 'juno-diagram', 'di-diagram', 'philae-diagram']) {
        assert.ok((await page.locator(`#${id} > *`).count()) > 5, `${id} is drawn`);
      }
      assert.equal(await page.locator('#nh-diagram .pr-heart').count(), 1);
      assert.equal(await page.locator('#juno-diagram .pr-cyclone').count(), 5);
      assert.ok((await page.locator('#di-diagram .pr-plume').count()) > 10);
      assert.equal(await page.locator('#philae-diagram .pr-touch').count(), 2, 'two bounces');
    });
  });

  test(`${name}: the launch speed slider follows the escape-velocity model, and only a rocket works in space`, async (t) => {
    await withPage(t, still, async (page) => {
      let before = await markup(page, 'launch-diagram');
      for (const v of [4, 6.5, 8, 10, 11.1]) {
        await setRange(page, 'launch-speed', v);
        const d = await data(page, 'launch-diagram');
        assert.equal(d.outcome, 'falls back', `${v}`);
        assert.ok(Math.abs(Number(d.heightKm) - P.maxHeightKm(v)) < 1, `${v}`);
        assert.match(await page.locator('#launch-readout').textContent(), /then gravity pulls it back/);
        const now = await markup(page, 'launch-diagram');
        assert.notEqual(now, before, `${v} redraws`);
        before = now;
      }
      assert.match(await page.locator('#launch-diagram-wrap').textContent(), /rises to about 410,000 km/);
      await setRange(page, 'launch-speed', 11.2);
      assert.equal((await data(page, 'launch-diagram')).outcome, 'escapes');
      assert.match(await page.locator('#launch-diagram-wrap').textContent(), /never comes back/);
      assert.match(await page.locator('#launch-readout').textContent(), /at least the escape velocity \(about 11\.2 km\/s\)/);
      assert.equal(await page.locator('#launch-speed-label').textContent(), '11.2 km/s');
      assert.equal(await page.locator('#rocket-diagram .pr-tank--oxidiser').count(), 1);
      assert.equal(await page.locator('#rocket-diagram .pr-cross').count(), 1);
      assert.match(await page.locator('#rocket-diagram-wrap').textContent(), /✗ no use in space/);
      assert.match(await page.locator('#rocket-diagram-wrap').textContent(), /✓ works in space/);
    });
  });

  test(`${name}: every section with general knowledge labels it first draft; the Moon distance is the data sheet's`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const sel of ['#probe-types', '#probes-or-telescopes', '#getting-there']) {
        assert.match(squash(await page.locator(`${sel} .note`).last().textContent()), /first draft, to be checked by the teacher/, sel);
      }
      const missions = await page.locator('#missions .pr-mission').count();
      assert.equal(missions, 4);
      assert.equal(await page.locator('#missions .pr-mission .note', { hasText: 'first draft, to be checked by the teacher' }).count(), 4);
      assert.match(squash(await page.locator('#getting-there').textContent()), /data sheet’s 380,000 km/);
    });
  });

  test(`${name}: every quiz card carries data-question-id, marks and spec tag`, async (t) => {
    await withPage(t, still, async (page) => {
      const bank = makeQuestions(P);
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
      for (const type of P.TYPES) {
        await page.click(`#type-buttons button[data-type="${type.id}"]`);
        found.push(...(await labelProblems(page, type.id)));
      }
      for (const v of [4, 5, 7.5, 9, 10.5, 11, 11.1, 12]) {
        await setRange(page, 'launch-speed', v);
        found.push(...(await labelProblems(page, `${v} km/s`)));
      }
      assert.deepEqual(found, []);
    });
  });

  test(`${name}: the probe moves only without reduced motion`, async (t) => {
    await withPage(t, still, async (page) => {
      const a = await markup(page, 'types-diagram');
      await page.waitForTimeout(300);
      assert.equal(await markup(page, 'types-diagram'), a, 'still under reduced motion');
    });
    await withPage(t, { viewport: { width, height } }, async (page) => {
      const a = await markup(page, 'types-diagram');
      await page.waitForTimeout(400);
      assert.notEqual(await markup(page, 'types-diagram'), a, 'moving otherwise');
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
