/**
 * notes/hubble-law.html in a real browser, at phone and iPad widths: the
 * evidence drawing, the Hubble graph (data-set and line buttons, slider and
 * drag, the reasonable lines and the uncertainty as half the range, the
 * nearby-only set's bigger percentage uncertainty), the age steps and size,
 * the first-draft labels, the quiz cards, and no label collisions.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const H = require('../src/hubbleLaw');
const { makeQuestions } = require('../src/hubbleLawQuestions');
const BANK = () => makeQuestions(H);

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'hubble-law.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/hubbleLawInteractive.test.js');

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

  test(`${name}: the evidence drawing shows bigger shifts further away, on a line through the origin`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await count(page, '#evidence-diagram .hb-evidence-galaxy'), 3);
      assert.equal(await count(page, '#evidence-diagram .hb-evidence-point'), 3);
      assert.equal(await count(page, '#evidence-diagram .hb-evidence-line'), 1);
      const labels = (await page.locator('#evidence-diagram-wrap .diagram-label').allTextContents()).join(' | ');
      for (const t2 of ['20 Mpc', '1,360 km/s', '120 Mpc', '8,160 km/s', 'Distance (Mpc)', 'velocity (km/s)']) assert.ok(labels.includes(t2), t2);
      assert.match((await page.locator('#evidence .note').textContent()).replace(/\s+/g, ' '), /Slipher.*1929\. First draft, to be checked by the teacher\./);
    });
  });

  test(`${name}: the data-set buttons redraw the graph with its own axes and points`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await page.locator('#hubble-graph').getAttribute('data-set'), 'wide');
      assert.equal(await count(page, '#hubble-graph .hb-point'), H.DATA_SETS.wide.galaxies.length);
      assert.equal(await count(page, '#hubble-graph .hb-error-bar'), H.DATA_SETS.wide.galaxies.length);
      const wideHtml = await page.locator('#hubble-graph').innerHTML();
      await page.click('.hb-set-buttons button[data-set="near"]');
      assert.equal(await page.locator('#hubble-graph').getAttribute('data-set'), 'near');
      assert.equal(await count(page, '#hubble-graph .hb-point'), H.DATA_SETS.near.galaxies.length);
      assert.notEqual(await page.locator('#hubble-graph').innerHTML(), wideHtml);
      const ticks = await page.locator('#hubble-graph-wrap .diagram-label').allTextContents();
      assert.ok(ticks.includes('40') && !ticks.includes('200'));
      assert.ok(ticks.includes('Distance (Mpc)') && ticks.includes('Recession velocity (km/s)'));
    });
  });

  test(`${name}: the line buttons choose which line the slider and a drag move`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const key of ['best', 'steep', 'shallow']) {
        await page.click(`.hb-line-buttons button[data-line="${key}"]`);
        assert.equal(await page.locator('#hubble-graph').getAttribute('data-active'), key);
        assert.equal(await count(page, `#hubble-graph .hb-line-${key}.hb-line-active`), 1);
        assert.equal(await count(page, '#hubble-graph .hb-line-active'), 1);
        assert.equal(await count(page, '.hb-line-buttons button[aria-pressed="true"]'), 1);
        const before = await page.locator('#hubble-graph').innerHTML();
        await setRange(page, 'hb-gradient', 72.5);
        assert.equal(await page.locator('#hubble-graph').getAttribute('data-gradient'), '72.5');
        assert.notEqual(await page.locator('#hubble-graph').innerHTML(), before);
      }
      // A drag on the graph sets the active line through the pointer.
      await page.click('.hb-line-buttons button[data-line="best"]');
      const box = await page.locator('#hubble-graph').boundingBox();
      const sx = box.width / 640;
      const sy = box.height / 440;
      // (100 Mpc, 6000 km/s) on the wide axes: gradient 60.
      const x = box.x + (90 + (100 / 200) * 520) * sx;
      const y = box.y + (370 - (6000 / 14000) * 314) * sy;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.up();
      const g = Number(await page.locator('#hubble-graph').getAttribute('data-gradient'));
      assert.ok(Math.abs(g - 60) <= 1, `drag gave ${g}`);
      assert.equal(Number(await page.locator('#hb-gradient').inputValue()), g, 'the slider follows the drag, on its step grid');
    });
  });

  test(`${name}: the reasonable lines pass every error bar; the uncertainty is half the range; nearby-only gives a bigger percentage`, async (t) => {
    await withPage(t, still, async (page) => {
      const percent = {};
      for (const set of ['wide', 'near']) {
        await page.click(`.hb-set-buttons button[data-set="${set}"]`);
        await page.click('#hb-show-lines');
        for (const id of ['best', 'steep', 'shallow']) assert.match(await page.locator(`#hb-${id}-readout`).textContent(), /passes through every error bar/, `${set} ${id}`);
        const u = await page.locator('#hb-uncertainty-readout').textContent();
        const m = u.match(/^\((\d+\.\d) − (\d+\.\d)\) ÷ 2 = ±(\d+\.\d) km\/s per Mpc, which is ±(\d+)% of/);
        assert.ok(m, u);
        assert.ok(Math.abs((Number(m[1]) - Number(m[2])) / 2 - Number(m[3])) < 0.051);
        percent[set] = Number(m[4]);
      }
      assert.ok(percent.near > 2 * percent.wide, JSON.stringify(percent));
      // Steepest made shallower than shallowest: no nonsense uncertainty.
      await page.click('.hb-line-buttons button[data-line="steep"]');
      await setRange(page, 'hb-gradient', 30);
      assert.match(await page.locator('#hb-uncertainty-readout').textContent(), /Make the steepest line steeper/);
      await page.click('.hb-line-buttons button[data-line="best"]');
      await setRange(page, 'hb-gradient', 140);
      assert.match(await page.locator('#hb-best-readout').textContent(), /misses at least one error bar/);
    });
  });

  test(`${name}: the age steps convert every unit, your H0 gives your own age, and the estimates are labelled first draft`, async (t) => {
    await withPage(t, still, async (page) => {
      const steps = await page.locator('#hb-age-steps li').allTextContents();
      assert.equal(steps.length, 4);
      assert.match(steps[0], /1 Mpc = 1,000,000 pc = 1,000,000 × 3\.1 × 10¹³ km = 3\.1 × 10¹⁹ km/);
      assert.match(steps[1], /68 ÷ \(3\.1 × 10¹⁹\) per second = 2\.19 × 10⁻¹⁸ per second/);
      assert.match(steps[2], /= 4\.56 × 10¹⁷ s/);
      assert.match(steps[3], /365 × 24 × 3600 s = 3\.15 × 10⁷ s.*about 14\.5 billion years/);
      assert.equal(await page.locator('#hb-h0-value').textContent(), 'H₀ = 68 km/s per Mpc');
      assert.match(await page.locator('#hb-size-value').textContent(), /about 14\.5 billion light-years/);
      await setRange(page, 'hb-gradient', 70);
      assert.match(await page.locator('#hb-your-age').textContent(), /70\.0 km\/s per Mpc.*about 14\.0 billion years/);
      assert.match((await page.locator('#age .note:not(.sl-readout)').textContent()).replace(/\s+/g, ' '), /simple estimates.*13\.8 billion years.*46 billion light-years away\. First draft, to be checked by the teacher\./);
      assert.match((await page.locator('#graph .note').textContent()).replace(/\s+/g, ' '), /made-up practice data.*first draft, to be checked by the teacher/);
      assert.equal(await count(page, '#rewind-diagram .hb-us'), 2);
      assert.equal(await count(page, '#rewind-diagram .hb-start'), 1);
      assert.equal(await count(page, '#size-diagram .hb-horizon'), 1);
      const text = await page.locator('main').textContent();
      assert.doesNotMatch(text, /triangle/i);
      assert.doesNotMatch(text, /repeat/i);
    });
  });

  test(`${name}: no diagram label overlaps another or spills outside its panel, for either data set and every line`, async (t) => {
    await withPage(t, still, async (page) => {
      const found = [];
      for (const set of ['wide', 'near']) {
        await page.click(`.hb-set-buttons button[data-set="${set}"]`);
        for (const key of ['best', 'steep', 'shallow']) {
          await page.click(`.hb-line-buttons button[data-line="${key}"]`);
          found.push(...(await labelProblems(page, `${set} ${key}`)));
        }
        await page.click('#hb-show-lines');
        found.push(...(await labelProblems(page, `${set} shown`)));
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
