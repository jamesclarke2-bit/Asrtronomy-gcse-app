/**
 * notes/star-trails.html in a real browser, at phone and iPad widths: the
 * drawn trails growing with the exposure, the two-arm protractor and its
 * calculation, the reading tables (units in brackets, an anomaly left out,
 * half-range uncertainty) and the short-against-long comparison, the
 * sidereal-against-solar diagram from the data sheet, the first-draft
 * labels, the quiz cards, and no diagram label colliding in any state.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const S = require('../src/starTrails');
const { makeQuestions } = require('../src/starTrailsQuestions');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'star-trails.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/starTrailsInteractive.test.js');

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

  test(`${name}: a longer exposure draws longer arcs, at the data sheet sidereal day`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.ok((await page.locator('#trail-diagram .st-trail').count()) > 50);
      let last = 0;
      for (const t of [10, 60, 120, 240]) {
        await setRange(page, 'exposure', t);
        const angle = Number((await data(page, 'trail-diagram')).angle);
        assert.equal(angle.toFixed(2), S.arcAngleDeg(t).toFixed(2));
        assert.ok(angle > last);
        last = angle;
        assert.match(await page.locator('#trail-diagram-wrap').textContent(), new RegExp(`${t} min exposure`));
      }
    });
  });

  test(`${name}: lining the arms up with the arc's ends gives θ and the sidereal day from (360 ÷ θ) × t`, async (t) => {
    await withPage(t, still, async (page) => {
      await setRange(page, 'exposure', 240);
      const truth = Number((await data(page, 'measure-diagram')).trueAngle);
      assert.equal(truth.toFixed(2), S.arcAngleDeg(240).toFixed(2));
      await setRange(page, 'arm-start', 20);
      await setRange(page, 'arm-end', 80);
      assert.equal((await data(page, 'measure-diagram')).measured, '60.0');
      const text = await page.locator('#measure-readout').textContent();
      assert.match(text, /θ = 60\.0° in t = 240 min, so sidereal day = \(360 ÷ 60\.0\) × 240 = 1,440 min/);
      // The arms work either way round.
      await setRange(page, 'arm-start', 80);
      await setRange(page, 'arm-end', 20);
      assert.equal((await data(page, 'measure-diagram')).measured, '60.0');
      await setRange(page, 'arm-end', 80);
      assert.match(await page.locator('#measure-readout').textContent(), /Move the arms apart/);
      // The arc changes with the exposure slider.
      const before = await markup(page, 'measure-diagram');
      await setRange(page, 'exposure', 60);
      assert.notEqual(await markup(page, 'measure-diagram'), before);
    });
  });

  test(`${name}: the tables have units in brackets, leave out the anomaly, use half the range, and the long exposure has the smaller percentage uncertainty`, async (t) => {
    await withPage(t, still, async (page) => {
      const tables = page.locator('#reading-tables table');
      assert.equal(await tables.count(), 2);
      const heads = await page.locator('#reading-tables th').allTextContents();
      assert.ok(heads.includes('Arc angle (°)'));
      assert.ok(heads.includes('Uncertainty, half the range (°)'));
      assert.ok(heads.includes('Percentage uncertainty (%)'));
      assert.ok(heads.includes('Sidereal day (min)'));
      assert.equal(await page.locator('#reading-tables .st-anomaly').count(), 1);
      assert.match(await page.locator('#reading-tables .st-anomaly').textContent(), /anomaly: left out/);
      for (let round = 0; round < 3; round += 1) {
        const d = await data(page, 'spread-diagram');
        assert.ok(Number(d.longPercent) < Number(d.shortPercent), `round ${round}: ${d.longPercent} < ${d.shortPercent}`);
        const before = await markup(page, 'spread-diagram');
        await page.click('#new-readings');
        assert.notEqual(await markup(page, 'spread-diagram'), before, 'new readings redraw the comparison');
      }
    });
  });

  test(`${name}: the sidereal and solar days come from the data sheet, and every section using general knowledge labels it first draft`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.match(await page.locator('#day-readout').textContent(), /Sidereal day: 23 h 56 min\. Solar day: 24 h 0 min\. The difference is about 4 minutes\./);
      assert.equal(await page.locator('#day-diagram .st-earth').count(), 2);
      assert.equal(await page.locator('#day-diagram .st-day-arrow--solar').count(), 1);
      for (const section of ['star-trails', 'why-not-24']) {
        const notes = (await page.locator(`#${section} .note`).allTextContents()).map((n) => n.replace(/\s+/g, ' '));
        assert.ok(notes.some((n) => /first draft, to be checked by the teacher/.test(n)), section);
      }
      assert.match((await page.locator('#star-trails .note').textContent()).replace(/\s+/g, ' '), /A drawn image, not a photograph/);
      assert.match(await page.locator('#measure .formula').textContent(), /sidereal day = \(360 ÷ θ\) × t/);
    });
  });

  test(`${name}: the shown mean (1 dp, like the readings) is the one the day is worked from, and star trails cannot separate the two days, even over a whole night, but timing the meridian over 30 nights can`, async (t) => {
    await withPage(t, still, async (page) => {
      const shortTable = page.locator('#reading-tables table[data-exposure="30"]');
      const rows = await shortTable.locator('tfoot tr').allTextContents();
      const mean = rows.find((r) => /^Mean/.test(r)).replace('Mean (°)', '');
      assert.match(mean, /^\d+\.\d$/);
      const day = rows.find((r) => /^Sidereal day/.test(r));
      const shown = Math.round((360 / Number(mean)) * 30).toLocaleString('en-GB');
      assert.ok(day.includes(`(360 ÷ ${mean}) × 30 = ${shown} ±`), day);
      assert.match(await page.locator('#spread-diagram-wrap').textContent(), new RegExp(`30 min: θ = ${mean.replace('.', '\\.')}°`));
      const sep = await data(page, 'separate-diagram');
      assert.ok(Number(sep.longLo) <= 1436 && Number(sep.longHi) >= 1440, 'the 240-minute range holds both days');
      assert.ok(Number(sep.nightHi) > 1439.9, 'the whole-night range reaches right up to the solar day');
      assert.equal(sep.separates, 'false');
      const text = (await page.locator('#separate-readout').textContent()).replace(/\s+/g, ' ');
      assert.match(text, /For the true angle read to ±0\.5°, a 240-minute exposure gives 1,424 to 1,448 min, which holds both the sidereal day \(1,436 min\) and the solar day \(1,440 min\); the readings in the table above scatter around the true angle, so they give a slightly different range\./);
      assert.match(text, /a reading of exactly 180\.0° gives 1,440 min, the solar day itself/);
      assert.match(text, /star trails cannot reliably tell 23 h 56 min from 24 h/);
      const mer = await data(page, 'meridian-diagram');
      assert.equal(mer.shiftMin, '120');
      assert.equal(await page.locator('#meridian-diagram .st-crossing').count(), 7);
      const merText = (await page.locator('#meridian-readout').textContent()).replace(/\s+/g, ' ');
      assert.match(merText, /the shift is 120 ± 2 min/);
      assert.match(merText, /1,440 − 120 ÷ 30 = 1,436 min/);
      assert.match(await page.locator('#meridian-diagram-wrap').textContent(), /30 nights: 2 hours earlier/);
      // A fixed statement: new readings change the tables, not this section.
      const fixed = [await markup(page, 'separate-diagram'), text, merText];
      await page.click('#new-readings');
      assert.equal(await markup(page, 'separate-diagram'), fixed[0]);
      assert.equal((await page.locator('#separate-readout').textContent()).replace(/\s+/g, ' '), fixed[1]);
    });
  });

  test(`${name}: every half-range uncertainty and mean on the page has no more decimal places than the readings it comes from`, async (t) => {
    await withPage(t, still, async (page) => {
      const dp = (x) => ((x.match(/\.(\d+)/) || ['', ''])[1]).length;
      for (let k = 0; k < 6; k += 1) {
        for (const tbl of await page.locator('#reading-tables table').all()) {
          const readings = (await tbl.locator('tbody td:nth-child(2)').allTextContents()).map((s) => s.match(/[\d.]+/)[0]);
          const readingDp = Math.max(...readings.map(dp));
          const foot = await tbl.locator('tfoot tr').allTextContents();
          const unc = foot.find((r) => /^Uncertainty/.test(r)).match(/±([\d.]+)/)[1];
          const mean = foot.find((r) => /^Mean/.test(r)).replace('Mean (°)', '');
          assert.ok(dp(unc) <= readingDp, `±${unc} from readings ${readings}`);
          assert.ok(dp(mean) <= readingDp, `mean ${mean} from readings ${readings}`);
        }
        const labels = (await page.locator('#spread-diagram-wrap .diagram-label').allTextContents()).filter((s) => /θ =/.test(s));
        assert.equal(labels.length, 2);
        labels.forEach((l) => {
          const [, mean, unc] = l.match(/θ = ([\d.]+)° ± ([\d.]+)°/);
          assert.ok(dp(mean) <= 1 && dp(unc) <= 1, l);
        });
        await page.click('#new-readings');
      }
    });
  });

  test(`${name}: every quiz card carries data-question-id, marks and the 13.19 tag`, async (t) => {
    await withPage(t, still, async (page) => {
      const bank = makeQuestions(S);
      const ids = await page.locator('#questions-list .question-card').evaluateAll((cards) => cards.map((c) => c.dataset.questionId));
      assert.deepEqual([...ids].sort(), bank.map((q) => q.id).sort());
      for (const id of ['st-calc-minutes', 'st-longer-exposure', 'st-anomaly', 'st-not-24']) assert.ok(ids.includes(id), id);
      for (const q of bank) {
        const card = page.locator(`.question-card[data-question-id="${q.id}"]`);
        assert.match(await card.locator('.question-marks').textContent(), new RegExp(`\\[${q.marks} marks?\\]`));
        assert.match(await card.locator('.question-tags').textContent(), /Spec 13\.19/);
      }
    });
  });

  test(`${name}: in every state, no diagram label overlaps another or spills outside its panel`, async (t) => {
    await withPage(t, still, async (page) => {
      const found = [...(await labelProblems(page, 'default'))];
      for (const t of [10, 240]) {
        await setRange(page, 'exposure', t);
        found.push(...(await labelProblems(page, `exposure ${t}`)));
      }
      for (let k = 0; k < 3; k += 1) {
        await page.click('#new-readings');
        found.push(...(await labelProblems(page, `readings ${k}`)));
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
