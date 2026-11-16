/**
 * notes/sun-like-star.html in a real browser, at phone and iPad widths: the
 * stage buttons redrawing the stage drawing, the force-arrow balance and the
 * HR track; the stage table and timeline; the first-draft labels; the quiz
 * cards; and no diagram label colliding in any state.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const L = require('../src/sunLikeStar');
const { makeQuestions } = require('../src/sunLikeStarQuestions');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'sun-like-star.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/sunLikeStarInteractive.test.js');

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
const wrapHtml = (page, id) => page.locator(`#${id}-wrap`).evaluate((el) => el.innerHTML);

WIDTHS.forEach(({ name, width, height }) => {
  const still = { viewport: { width, height }, reducedMotion: 'reduce' };

  test(`${name}: loads with no console errors and no horizontal scroll`, async (t) => {
    await withPage(t, still, async (page, errors) => {
      assert.deepEqual(errors, []);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
    });
  });

  test(`${name}: each stage button redraws the stage, the balance and the HR track, and says what happens to the core`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.deepEqual(await page.locator('#stage-buttons button').allTextContents(), L.STAGES.map((s, k) => `${k + 1}. ${s.name}`));
      const seen = { stage: new Set(), balance: new Set(), track: new Set() };
      for (const [k, s] of L.STAGES.entries()) {
        await page.click(`#stage-buttons button[data-stage="${s.id}"]`);
        assert.equal((await data(page, 'stage-diagram')).stage, s.id);
        assert.equal((await data(page, 'balance-diagram')).trend, L.trend(s.id), s.id);
        assert.equal((await data(page, 'balance-diagram')).outName, s.balance.outName, s.id);
        assert.equal((await data(page, 'track-diagram')).stage, s.id);
        const readout = await page.locator('#stage-readout').textContent();
        assert.ok(readout.startsWith(`Stage ${k + 1} of 7: ${s.name}.`), readout);
        assert.ok(readout.includes(s.core), s.id);
        assert.ok((await page.locator('#balance-readout').textContent()).includes(s.balance.verdict), s.id);
        assert.equal(await page.locator(`#stage-buttons button[data-stage="${s.id}"]`).getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('#stage-table tr.sl-row--chosen').getAttribute('data-stage'), s.id);
        seen.stage.add(await wrapHtml(page, 'stage-diagram'));
        seen.balance.add(await wrapHtml(page, 'balance-diagram'));
        seen.track.add(await wrapHtml(page, 'track-diagram'));
      }
      assert.equal(seen.stage.size, 7, 'seven different stage drawings');
      assert.equal(seen.balance.size, 7, 'the balance redraws for every stage');
      assert.equal(seen.track.size, 7, 'the track marks every stage');
    });
  });

  test(`${name}: the balance arrows: equal on the main sequence and in a white dwarf, gravity longer for a protostar`, async (t) => {
    await withPage(t, still, async (page) => {
      const lengths = async () => page.locator('#balance-diagram').evaluate((svg) => {
        const len = (cls) => [...svg.querySelectorAll(`line.${cls}`)].map((l) => Math.hypot(l.x2.baseVal.value - l.x1.baseVal.value, l.y2.baseVal.value - l.y1.baseVal.value));
        return { inward: len('sl-arrow-in'), outward: len('sl-arrow-out') };
      });
      await page.click('#stage-buttons button[data-stage="main-sequence"]');
      let l = await lengths();
      assert.equal(l.inward.length, 4);
      assert.equal(l.outward.length, 4);
      assert.ok(Math.abs(l.inward[0] - l.outward[0]) < 12, 'about equal');
      assert.match(await page.locator('#balance-diagram-wrap').textContent(), /radiation pressure \(outward\)/);
      assert.match(await page.locator('#balance-diagram-wrap').textContent(), /gravity \(inward\)/);
      await page.click('#stage-buttons button[data-stage="protostar"]');
      l = await lengths();
      assert.ok(l.inward[0] > l.outward[0] + 10, 'gravity wins');
      await page.click('#stage-buttons button[data-stage="white-dwarf"]');
      assert.match(await page.locator('#balance-diagram-wrap').textContent(), /electron pressure \(outward\)/);
      assert.match(await page.locator('#balance-readout').textContent(), /without any fusion/);
    });
  });

  test(`${name}: the HR track runs from the main-sequence Sun up to the red giants and down to the white dwarfs; a nebula is not on it`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await page.locator('#track-diagram .sl-track--sun-like').count(), 1);
      const pts = await page.locator('#track-diagram .sl-track-point').evaluateAll((cs) => Object.fromEntries(cs.map((c) => [c.dataset.stage, [Number(c.getAttribute('cx')), Number(c.getAttribute('cy'))]])));
      assert.ok(pts['red-giant'][1] < pts['main-sequence'][1] && pts['red-giant'][0] > pts['main-sequence'][0], 'up and right');
      assert.ok(pts['white-dwarf'][1] > pts['main-sequence'][1] && pts['white-dwarf'][0] < pts['main-sequence'][0], 'down and left');
      await page.click('#stage-buttons button[data-stage="nebula"]');
      assert.equal((await data(page, 'track-diagram')).onDiagram, 'false');
      assert.match(await page.locator('#track-diagram-wrap').textContent(), /not on the diagram/);
      assert.equal(await page.locator('#track-diagram .sl-track-ring').count(), 0);
      await page.click('#stage-buttons button[data-stage="red-giant"]');
      assert.equal(await page.locator('#track-diagram .sl-track-ring').count(), 1);
    });
  });

  test(`${name}: the timescales table has units in its heading, the timeline has a bar for each timed stage, and M57 is linked`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.deepEqual(await page.locator('#stage-table thead th').allTextContents(), ['Stage', 'Roughly how long (years)', 'What happens to the core']);
      assert.equal(await page.locator('#stage-table tbody tr').count(), 7);
      assert.equal(await page.locator('#timeline-diagram .sl-time-bar').count(), L.STAGES.filter((s) => s.years).length);
      const widths = await page.locator('#timeline-diagram .sl-time-bar').evaluateAll((bars) => Object.fromEntries(bars.map((b) => [b.dataset.stage, Number(b.getAttribute('width'))])));
      assert.ok(widths['main-sequence'] > widths['red-giant'] && widths['red-giant'] > widths['planetary-nebula']);
      assert.equal(await page.locator('a[href="catalogues-and-star-names.html#catalogues"]').count(), 1);
      assert.equal(await page.locator('a[href="hr-diagram.html"]').count() >= 1, true);
    });
  });

  test(`${name}: every section with general knowledge labels it first draft`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const sel of ['#balance', '#hr-track', '#timescales']) {
        assert.match((await page.locator(`${sel} .note`).last().textContent()).replace(/\s+/g, ' '), /first draft, to be checked by the teacher/, sel);
      }
    });
  });

  test(`${name}: every quiz card carries data-question-id, marks and spec tag, including the stage order and the core at each stage`, async (t) => {
    await withPage(t, still, async (page) => {
      const bank = makeQuestions(L);
      const ids = await page.locator('#questions-list .question-card').evaluateAll((cards) => cards.map((c) => c.dataset.questionId));
      assert.deepEqual([...ids].sort(), bank.map((q) => q.id).sort());
      assert.ok(ids.includes('sl-order') && ids.includes('sl-core'));
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
      for (const s of L.STAGES) {
        await page.click(`#stage-buttons button[data-stage="${s.id}"]`);
        found.push(...(await labelProblems(page, s.id)));
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
