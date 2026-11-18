/**
 * notes/redshift.html in a real browser, at phone and iPad widths: the speed
 * slider moving the galaxy's lines, the receding-waves drawing, the practice
 * galaxies and checker, the first-draft label, the quiz cards, and no label
 * collisions.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const R = require('../src/redshift');
const { makeQuestions } = require('../src/redshiftQuestions');
const BANK = () => makeQuestions(R);

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'redshift.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/redshiftInteractive.test.js');

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

  test(`${name}: the speed slider moves the galaxy's lines, and the readouts follow`, async (t) => {
    await withPage(t, still, async (page) => {
      const seen = new Set();
      for (const v of [0, 6000, 12500, 20000]) {
        await setRange(page, 'redshift-speed', v);
        assert.equal(await page.locator('#redshift-diagram').getAttribute('data-speed'), String(v));
        assert.equal(await page.locator('#rs-observed-readout').textContent(), `${R.observedWavelength(656.3, v).toFixed(1)} nm`);
        const shift = await page.locator('#rs-shift-readout').textContent();
        if (v === 0) assert.match(shift, /^0\.0 nm/);
        else assert.match(shift, new RegExp(`^\\+${R.wavelengthShift(656.3, v).toFixed(1).replace('.', '\\.')} nm: every line moves to a longer wavelength`));
        seen.add(await page.locator('#redshift-diagram').innerHTML());
      }
      assert.equal(seen.size, 4, 'each speed draws the galaxy lines in a different place');
      assert.equal(await count(page, '#redshift-diagram .rs-arrow'), 4);
      assert.equal(await count(page, '#redshift-diagram .gx-galaxy'), 1);
    });
  });

  test(`${name}: the receding drawing shows a longer wavelength for the galaxy moving away`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await count(page, '#receding-diagram .rs-galaxy-still'), 1);
      assert.equal(await count(page, '#receding-diagram .rs-galaxy-moving'), 1);
      assert.equal(await count(page, '#receding-diagram .rs-away-arrow'), 1);
      const labels = (await page.locator('#receding-diagram-wrap .diagram-label').allTextContents()).join(' | ');
      assert.match(labels, /longer wavelength: redshift/);
      assert.match(labels, /galaxy moving away/);
    });
  });

  test(`${name}: the data sheet's c is shown, the worked example has every step, and the practice buttons redraw`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await page.locator('#rs-c-value').textContent(), '3.0 × 10⁸ m/s = 300,000 km/s');
      const steps = await page.locator('#rs-worked-example li').allTextContents();
      assert.equal(steps.length, 5);
      assert.match(steps[1], /669\.4 − 656\.3 = 13\.1 nm/);
      assert.match(steps[3], /v = c × 0\.0200 = 300,000 km\/s × 0\.0200 = 5,988 km\/s/);
      const seen = new Set();
      for (const g of R.PRACTICE_GALAXIES) {
        await page.click(`.rs-galaxy-buttons button[data-galaxy="${g.id}"]`);
        assert.equal(await page.locator('#practice-diagram').getAttribute('data-galaxy'), g.id);
        assert.equal(await count(page, '.rs-galaxy-buttons button[aria-pressed="true"]'), 1);
        const labels = (await page.locator('#practice-diagram-wrap .diagram-label').allTextContents()).join(' | ');
        assert.match(labels, new RegExp(`emitted: ${g.lineNm.toFixed(1).replace('.', '\\.')} nm`));
        assert.match(labels, new RegExp(`observed: ${g.observedNm.toFixed(1).replace('.', '\\.')} nm`));
        seen.add(await page.locator('#practice-diagram').innerHTML());
        await page.fill('#rs-answer', String(Math.round(g.answerKmPerS)));
        await page.click('#rs-check');
        assert.match(await page.locator('#rs-feedback').textContent(), /^Correct\. Working: Wavelength shift =/);
        await page.fill('#rs-answer', String(Math.round(g.answerKmPerS * 1.05)));
        await page.click('#rs-check');
        assert.match(await page.locator('#rs-feedback').textContent(), /^Not quite\./);
      }
      assert.equal(seen.size, 3);
    });
  });

  test(`${name}: the Local Group note is labelled first draft, and the companion pages are linked`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.match((await page.locator('#shifted .note').textContent()).replace(/\s+/g, ' '), /Andromeda Galaxy is moving towards us, showing a blueshift\. Hydrogen's four laboratory lines are drawn at 656\.3, 486\.1, 434\.0 and 410\.2 nm\. First draft, to be checked by the teacher\./);
      for (const href of ['reading-a-spectrum.html#composition', 'reading-a-spectrum.html#radial-velocity', 'local-group.html#local-group', 'our-galaxy.html#radio-map']) {
        assert.ok((await count(page, `main a[href="${href}"]`)) >= 1, href);
      }
      assert.doesNotMatch(await page.locator('main').textContent(), /triangle/i);
    });
  });

  test(`${name}: no diagram label overlaps another or spills outside its panel, at any speed or practice galaxy`, async (t) => {
    await withPage(t, still, async (page) => {
      const found = [];
      for (const v of [0, 6000, 20000]) {
        await setRange(page, 'redshift-speed', v);
        found.push(...(await labelProblems(page, `speed ${v}`)));
      }
      for (const g of R.PRACTICE_GALAXIES) {
        await page.click(`.rs-galaxy-buttons button[data-galaxy="${g.id}"]`);
        found.push(...(await labelProblems(page, `galaxy ${g.id}`)));
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
