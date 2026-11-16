/**
 * notes/black-holes.html in a real browser, at phone and iPad widths: the
 * three drawings; the year slider moving S2 round its orbit (fast and close
 * in 2002/2018, slow and far in 2010); the mass check; the first-draft
 * labels; the quiz cards; and no diagram label colliding in any state.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const B = require('../src/blackHoleEvidence');
const M = require('../src/massiveStar');
const { makeQuestions } = require('../src/blackHoleEvidenceQuestions');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'black-holes.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/blackHoleEvidenceInteractive.test.js');

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
const nowPos = (page) => page.locator('#s2-diagram .bh-s2-now').evaluate((el) => [Number(el.getAttribute('cx')), Number(el.getAttribute('cy'))]);

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

  test(`${name}: the X-ray binary drawing shows the star, the gas stream, the disc, the hidden black hole and X-rays`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const cls of ['bh-star', 'bh-stream', 'bh-disc', 'bh-hole']) {
        assert.ok((await page.locator(`#xrb-diagram .${cls}`).count()) >= 1, cls);
      }
      assert.ok((await page.locator('#xrb-diagram-wrap .diagram-label').allTextContents()).some((s) => /X-rays/.test(s)));
    });
  });

  test(`${name}: the mass check picks out the black hole for a partner of about 20 Sun masses`, async (t) => {
    await withPage(t, still, async (page) => {
      const d = await data(page, 'companion-diagram');
      assert.equal(Number(d.companion), B.CYGNUS_X1.companionMsun);
      assert.equal(d.verdict, 'black-hole');
      assert.equal(await page.locator('#companion-diagram .bh-check--yes').count(), 1);
      assert.equal(await page.locator('#companion-diagram .bh-check--black-hole.bh-check--yes').count(), 1);
      // The ticked row is told apart by a solid, thicker border and a tick, not colour alone.
      assert.equal(await page.locator('#companion-diagram .bh-check--yes').getAttribute('stroke-dasharray'), 'none');
      assert.match(await page.locator('#companion-readout').textContent(), /far more than any neutron star can have \(about 3\)/);
    });
  });

  test(`${name}: the year slider moves S2 round its orbit, fast and close in 2018, slow and far in 2010`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(Number(await page.locator('#s2-year').inputValue()), 2010);
      const far = await data(page, 's2-diagram');
      assert.equal(Math.round(Number(far.distanceAu)), 1880);
      const farPos = await nowPos(page);
      const farDots = await page.locator('#s2-diagram .bh-s2-past').count();
      await setRange(page, 's2-year', 2018);
      const near = await data(page, 's2-diagram');
      assert.equal(Math.round(Number(near.distanceAu)), 120);
      assert.ok(Number(near.speedKms) > 10 * Number(far.speedKms));
      const nearPos = await nowPos(page);
      assert.ok(Math.hypot(nearPos[0] - farPos[0], nearPos[1] - farPos[1]) > 100, 'the star moves on the drawing');
      assert.ok((await page.locator('#s2-diagram .bh-s2-past').count()) > farDots, 'more past-year dots are drawn');
      assert.match(await page.locator('#s2-readout').textContent(), /2018: S2 is about 120 AU from the unseen mass, moving at about 7,400 km\/s/);
      assert.match(await page.locator('#s2-year-label').textContent(), /2018/);
      await setRange(page, 's2-year', 2006.25);
      assert.match(await page.locator('#s2-readout').textContent(), /^2006/);
    });
  });

  test(`${name}: the mass from S2’s orbit is shown with its working`, async (t) => {
    await withPage(t, still, async (page) => {
      const text = (await page.locator('#galactic-centre').textContent()).replace(/\s+/g, ' ');
      assert.match(text, /M = a³ ÷ T²/);
      assert.match(text, /1,000³ ÷ 16² ≈ 3\.9 million Suns/);
      assert.match(text, /supermassive black hole/);
    });
  });

  test(`${name}: every section with general knowledge labels it first draft, and links rather than repeats`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const sel of ['#x-ray-binaries', '#galactic-centre']) {
        assert.match((await page.locator(`${sel} .note`).last().textContent()).replace(/\s+/g, ' '), /first draft, to be checked by the teacher/, sel);
      }
      assert.equal(await page.locator('#invisible a[href="massive-stars.html"]').count(), 1);
      assert.equal(await page.locator('#x-ray-binaries a[href="space-telescopes.html#discoveries"]').count(), 1);
    });
  });

  test(`${name}: every quiz card carries data-question-id, marks and spec tag`, async (t) => {
    await withPage(t, still, async (page) => {
      const bank = makeQuestions(B, M);
      const ids = await page.locator('#questions-list .question-card').evaluateAll((cards) => cards.map((c) => c.dataset.questionId));
      assert.deepEqual([...ids].sort(), bank.map((q) => q.id).sort());
      for (const q of bank) {
        const card = page.locator(`.question-card[data-question-id="${q.id}"]`);
        assert.match(await card.locator('.question-marks').textContent(), new RegExp(`\\[${q.marks} marks?\\]`));
        assert.match(await card.locator('.question-tags').textContent(), /Spec 14\.11/);
      }
    });
  });

  test(`${name}: in every state, no diagram label overlaps another or spills outside its panel`, async (t) => {
    await withPage(t, still, async (page) => {
      const found = [...(await labelProblems(page, 'default'))];
      for (const y of [2002, 2004, 2008, 2012, 2016, 2017.5, 2018]) {
        await setRange(page, 's2-year', y);
        found.push(...(await labelProblems(page, `year ${y}`)));
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
