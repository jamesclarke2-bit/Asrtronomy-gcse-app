/**
 * notes/exoplanets-life.html in a real browser, at phone and iPad widths:
 * the transit, astrometry and radial-velocity panels each redrawn by their
 * own control, the habitable zone moved by the star's temperature, the
 * Drake equation's sliders and guess sets, the benefits and dangers
 * drawing, the first-draft labels, the quiz cards, and no label collisions.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const X = require('../src/exoplanets');
const { makeQuestions } = require('../src/exoplanetsQuestions');
const BANK = () => makeQuestions(X);

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'exoplanets-life.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/exoplanetsInteractive.test.js');

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

const labelsOf = async (page, wrap) => (await page.locator(`#${wrap} .diagram-label`).allTextContents()).join(' | ');

WIDTHS.forEach(({ name, width, height }) => {
  const still = { viewport: { width, height }, reducedMotion: 'reduce' };

  test(`${name}: every quiz card carries data-question-id, marks and spec tag, and the picture questions draw`, async (t) => {
    await withPage(t, still, async (page) => {
      const bank = BANK();
      const ids = await page.locator('#questions-list .question-card').evaluateAll((cards) => cards.map((c) => c.dataset.questionId));
      assert.deepEqual([...ids].sort(), bank.map((q) => q.id).sort());
      for (const q of bank) {
        const card = page.locator(`.question-card[data-question-id="${q.id}"]`);
        assert.match(await card.locator('.question-marks').textContent(), new RegExp(`\\[${q.marks} marks?\\]`));
        assert.match(await card.locator('.question-tags').textContent(), new RegExp(`Spec ${q.spec.replace('.', '\\.')}`));
      }
      const tr = page.locator('.question-card[data-question-id="ex-transit-read"]');
      assert.equal(await tr.locator('.ex-light-curve').count(), 1);
      assert.equal(await tr.locator('.ex-planet').count(), 0, 'the question shows only the light curve');
      const zp = page.locator('.question-card[data-question-id="ex-zone-picture"]');
      assert.equal(await zp.locator('.ex-zone').count(), 1);
      assert.equal(await zp.locator('.ex-key').count(), 0, 'the shape key is hidden in the question');
    });
  });

  test(`${name}: loads with no console errors and no horizontal scroll`, async (t) => {
    await withPage(t, still, async (page, errors) => {
      assert.deepEqual(errors, []);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
    });
  });

  test(`${name}: transit: the time slider moves the planet and the size buttons change the dip`, async (t) => {
    await withPage(t, still, async (page) => {
      const labels = await labelsOf(page, 'transit-wrap');
      for (const s of ['Time (hours)', 'Brightness (% of normal)', 'planet']) assert.ok(labels.includes(s), s);
      await setRange(page, 'transit-time', 0.05);
      const outside = await page.locator('#transit-diagram .ex-planet').getAttribute('cx');
      assert.match(await page.locator('#transit-readout').textContent(), /Brightness now: 100% of normal/);
      await setRange(page, 'transit-time', 0.5);
      assert.notEqual(await page.locator('#transit-diagram .ex-planet').getAttribute('cx'), outside);
      assert.match(await page.locator('#transit-readout').textContent(), /Brightness now: 99\.0000% of normal/);
      const curves = new Set();
      for (const p of X.PLANETS) {
        await page.click(`.ex-planet-buttons button[data-planet="${p.key}"]`);
        assert.equal(await page.locator('#transit-diagram').getAttribute('data-planet'), p.key);
        assert.equal(await page.locator(`.ex-planet-buttons button[data-planet="${p.key}"]`).getAttribute('aria-pressed'), 'true');
        curves.add(await page.locator('#transit-diagram .ex-light-curve').getAttribute('d'));
        assert.match(await page.locator('#transit-readout').textContent(), new RegExp(`^${p.name} planet`));
      }
      assert.equal(curves.size, 3);
      await page.click('.ex-planet-buttons button[data-planet="earth"]');
      assert.ok((await labelsOf(page, 'transit-wrap')).includes('too small to see here'));
    });
  });

  test(`${name}: astrometry and radial velocity: each slider redraws its panel`, async (t) => {
    await withPage(t, still, async (page) => {
      await setRange(page, 'astrometry-time', 0);
      const a0 = await page.locator('#astrometry-diagram .ex-top-planet').getAttribute('cx');
      await setRange(page, 'astrometry-time', 0.5);
      assert.notEqual(await page.locator('#astrometry-diagram .ex-top-planet').getAttribute('cx'), a0);
      const al = await labelsOf(page, 'astrometry-wrap');
      for (const s of ['The star on the sky', '+ centre of mass', 'From above', 'planet']) assert.ok(al.includes(s), s);
      const shifts = {};
      for (const v of [0.25, 0.5, 0.75]) {
        await setRange(page, 'rv-time', v);
        shifts[v] = await page.locator('#rv-diagram').getAttribute('data-shift');
      }
      assert.deepEqual(shifts, { 0.25: 'red', 0.5: 'none', 0.75: 'blue' });
      await setRange(page, 'rv-time', 0.75);
      assert.match(await page.locator('#rv-readout').textContent(), /towards us at 12\.5 m\/s: its lines shift towards blue/);
      assert.ok((await labelsOf(page, 'rv-wrap')).includes('moving towards us: lines shift to blue'));
      for (const s of ['Wavelength (nm)', 'laboratory', 'star', 'Earth']) assert.ok((await labelsOf(page, 'rv-wrap')).includes(s), s);
      assert.equal(await count(page, '#methods-table-body tr'), 3);
    });
  });

  test(`${name}: the star temperature slider moves the habitable zone, with planets marked by shape`, async (t) => {
    await withPage(t, still, async (page) => {
      const xs = [];
      for (const T of [3500, 5800, 7500]) {
        await setRange(page, 'star-temperature', T);
        assert.equal(await page.locator('#zone-diagram').getAttribute('data-temperature'), String(T));
        xs.push(Number(await page.locator('#zone-diagram .ex-zone').getAttribute('x')));
        const verdicts = X.PLANET_DISTANCES_AU.map((d) => X.zoneVerdict(d, T));
        assert.equal(await count(page, '#zone-diagram .ex-zone-in-the-zone'), verdicts.filter((v) => v === 'in the zone').length);
        assert.equal(await count(page, '#zone-diagram .ex-zone-too-hot'), verdicts.filter((v) => v === 'too hot').length);
        assert.equal(await count(page, '#zone-diagram .ex-zone-too-cold'), verdicts.filter((v) => v === 'too cold').length);
        assert.ok((await labelsOf(page, 'zone-wrap')).includes(`star: ${T.toLocaleString('en-GB')} K`));
      }
      assert.ok(xs[0] < xs[1] && xs[1] < xs[2], 'a hotter star pushes the zone further out');
      await setRange(page, 'star-temperature', 5800);
      assert.match(await page.locator('#zone-readout').textContent(), /about 0\.95 to 1\.67 AU.*1 AU/);
      for (const s of ['habitable zone (hatched)', 'Distance from the star (AU, log scale)', 'too hot', 'in the zone', 'too cold']) assert.ok((await labelsOf(page, 'zone-wrap')).includes(s), s);
    });
  });

  test(`${name}: the Drake equation: guess sets and sliders redraw the running total and N`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await count(page, '#drake-controls input[type="range"]'), 7);
      assert.match(await page.locator('#drake-readout').textContent(), /= 10\. About 10 civilisations/);
      const ns = {};
      for (const k of ['low', 'middle', 'high']) {
        await page.click(`.ex-drake-presets button[data-preset="${k}"]`);
        assert.equal(await page.locator(`.ex-drake-presets button[data-preset="${k}"]`).getAttribute('aria-pressed'), 'true');
        ns[k] = Number(await page.locator('#drake-diagram').getAttribute('data-n'));
        for (const f of X.DRAKE_FACTORS) assert.equal(Number(await page.locator(`#drake-${f.key}`).inputValue()), X.DRAKE_PRESETS[k][f.key], `${k} ${f.key} on the step grid`);
      }
      assert.ok(ns.low < 1 && Math.abs(ns.middle - 10) < 1e-9 && ns.high > 1e8);
      await page.click('.ex-drake-presets button[data-preset="low"]');
      assert.match(await page.locator('#drake-readout').textContent(), /Less than one/);
      const before = await page.locator('#drake-diagram .ex-drake-n').getAttribute('cx');
      await setRange(page, 'drake-L', 5);
      assert.notEqual(await page.locator('#drake-diagram .ex-drake-n').getAttribute('cx'), before);
      assert.equal(await count(page, '.ex-drake-presets button[aria-pressed="true"]'), 0);
      const labels = await labelsOf(page, 'drake-wrap');
      for (const s of ['R* = 1', '× L = 10,000,000', 'Running total (number, log scale)']) assert.ok(labels.includes(s), s);
    });
  });

  test(`${name}: SETI: benefits and dangers in two matching columns, marked by shape`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await count(page, '#seti-diagram .ex-benefit'), 4);
      assert.equal(await count(page, '#seti-diagram .ex-danger'), 4);
      const labels = await labelsOf(page, 'seti-wrap');
      for (const s of ['Benefits (+)', 'Dangers (!)', 'We are not alone', 'They might be hostile', 'Very slow replies']) assert.ok(labels.includes(s), s);
    });
  });

  test(`${name}: every name, date and figure is labelled first draft, and the companion pages are linked`, async (t) => {
    await withPage(t, still, async (page) => {
      const notes = (await page.locator('main .note:not(.sl-readout)').allTextContents()).map((s) => s.replace(/\s+/g, ' '));
      const all = notes.join(' || ');
      for (const s of ['0.9%', '3.5%', '10%', '18-hour', '12.5 m/s', '0.09 m/s', '0.95 to 1.67', '1961', 'Frank Drake', 'Project Ozma', '1960', 'Arecibo', '1974']) assert.ok(all.includes(s), s);
      notes.filter((n) => !/Stored in this browser/.test(n)).forEach((n) => assert.match(n, /first draft, to be checked by the teacher/i, n));
      assert.match(await page.locator('#methods-table caption').textContent(), /first draft, to be checked by the teacher/);
      for (const href of ['eclipsing-binaries.html', 'redshift.html', 'radio-telescopes.html']) assert.ok((await count(page, `main a[href="${href}"]`)) >= 1, href);
    });
  });

  test(`${name}: at every setting, no diagram label overlaps another or spills outside its panel`, async (t) => {
    await withPage(t, still, async (page) => {
      const found = [];
      for (const p of X.PLANETS) {
        await page.click(`.ex-planet-buttons button[data-planet="${p.key}"]`);
        for (const v of [0, 0.5, 1]) {
          await setRange(page, 'transit-time', v);
          found.push(...(await labelProblems(page, `${p.key} t=${v}`)));
        }
      }
      for (const v of [0, 0.25, 0.5, 0.75]) {
        await setRange(page, 'astrometry-time', v);
        await setRange(page, 'rv-time', v);
        found.push(...(await labelProblems(page, `orbit ${v}`)));
      }
      for (const T of [3000, 5800, 10000]) {
        await setRange(page, 'star-temperature', T);
        found.push(...(await labelProblems(page, `${T} K`)));
      }
      for (const k of ['low', 'middle', 'high']) {
        await page.click(`.ex-drake-presets button[data-preset="${k}"]`);
        found.push(...(await labelProblems(page, k)));
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
