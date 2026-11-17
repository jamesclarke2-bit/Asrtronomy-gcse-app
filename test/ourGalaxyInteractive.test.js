/**
 * notes/our-galaxy.html in a real browser, at phone and iPad widths: the
 * night-sky drawing with its binocular view; the face-on/edge-on toggle
 * redrawing the Galaxy; the line-of-sight slider moving the 21 cm peaks;
 * the first-draft labels; the quiz cards and lettered picture; and no
 * diagram label colliding in any state.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const G = require('../src/milkyWay');
const { makeQuestions } = require('../src/milkyWayQuestions');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'our-galaxy.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/ourGalaxyInteractive.test.js');

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

  test(`${name}: loads with no console errors and no horizontal scroll`, async (t) => {
    await withPage(t, still, async (page, errors) => {
      assert.deepEqual(errors, []);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
    });
  });

  test(`${name}: the night sky shows the band, dark dust lanes and a binocular view full of stars`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await count(page, '#sky-diagram .mw-band'), 1);
      assert.ok((await count(page, '#sky-diagram .mw-sky-dust')) >= 3);
      assert.ok((await count(page, '#sky-diagram .mw-bino-star')) > 100);
      const labels = await page.locator('#sky-diagram-wrap .diagram-label').allTextContents();
      assert.ok(labels.includes('dark dust lane') && labels.includes('binoculars: many stars'));
    });
  });

  test(`${name}: the face-on/edge-on toggle redraws the Galaxy, each feature marked by shape and label`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await page.locator('#galaxy-diagram').getAttribute('data-view'), 'face');
      assert.equal(await count(page, '#galaxy-diagram .mw-arm'), G.ARMS.length);
      assert.equal(await count(page, '#galaxy-diagram .mw-bar'), 1);
      assert.equal(await count(page, '#galaxy-diagram .mw-halo'), 0);
      const face = await page.locator('#galaxy-diagram').innerHTML();
      for (const cls of ['mw-sun', 'mw-sfr', 'mw-cluster', 'mw-dust']) assert.ok((await count(page, `#galaxy-diagram .${cls}`)) >= 1, cls);
      const legend = await page.locator('#galaxy-diagram-wrap .diagram-label').allTextContents();
      ['the Sun', 'star-forming region', 'globular cluster', 'dust lane (dark)', 'central bar', 'spiral arms', 'about 100,000 light-years across'].forEach((l) => assert.ok(legend.includes(l), l));
      await page.click('button[data-view="edge"]');
      assert.equal(await page.locator('#galaxy-diagram').getAttribute('data-view'), 'edge');
      assert.equal(await page.locator('button[data-view="edge"]').getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('button[data-view="face"]').getAttribute('aria-pressed'), 'false');
      assert.notEqual(await page.locator('#galaxy-diagram').innerHTML(), face);
      assert.equal(await count(page, '#galaxy-diagram .mw-arm'), 0);
      assert.equal(await count(page, '#galaxy-diagram .mw-halo'), 1);
      assert.equal(await count(page, '#galaxy-diagram .mw-bulge'), 1);
      const edge = await page.locator('#galaxy-diagram-wrap .diagram-label').allTextContents();
      ['Sun, in the disc', 'halo', 'bulge and bar'].forEach((l) => assert.ok(edge.includes(l), l));
      // Globular clusters are spread above and below the disc.
      const ys = await page.locator('#galaxy-diagram .mw-cluster').evaluateAll((els) => els.map((e) => Number(e.getAttribute('cy'))));
      assert.ok(ys.some((y) => y < 180) && ys.some((y) => y > 240));
    });
  });

  test(`${name}: SBb, the halo and the links stand in the text`, async (t) => {
    await withPage(t, still, async (page) => {
      const text = (await page.locator('#shape').textContent()).replace(/\s+/g, ' ');
      assert.match(text, /barred spiral galaxy, type SBb/);
      for (const href of ['binaries-and-clusters.html#clusters', 'black-holes.html#galactic-centre']) assert.equal(await count(page, `#shape a[href="${href}"]`), 1, href);
      for (const href of ['radio-telescopes.html#discoveries', 'infrared-telescopes.html#discoveries']) assert.equal(await count(page, `#radio-map a[href="${href}"]`), 1, href);
    });
  });

  test(`${name}: turning the line of sight moves it across different arms and redraws the 21 cm peaks with signed speeds`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(Number(await page.locator('#look-angle').inputValue()), 50);
      const before = await page.locator('#radio-diagram').getAttribute('data-peaks');
      const expected50 = G.crossings(50).map((c) => `${c.letter}:${Math.round(c.v)}`).join(',');
      assert.equal(before, expected50);
      assert.equal(await count(page, '#radio-diagram .mw-crossing'), G.crossings(50).length);
      const sight50 = await page.locator('#radio-diagram .mw-sight').evaluate((el) => [el.getAttribute('x2'), el.getAttribute('y2')].join(','));
      const readout50 = await page.locator('#radio-readout').textContent();
      assert.match(readout50, /\+\d+ km\/s \(moving away: redshift\)/);
      assert.match(readout50, /−\d+ km\/s \(moving towards us: blueshift\)/);
      await setRange(page, 'look-angle', 120);
      assert.equal(await page.locator('#radio-diagram').getAttribute('data-peaks'), G.crossings(120).map((c) => `${c.letter}:${Math.round(c.v)}`).join(','));
      assert.notEqual(await page.locator('#radio-diagram .mw-sight').evaluate((el) => [el.getAttribute('x2'), el.getAttribute('y2')].join(',')), sight50);
      assert.match(await page.locator('#look-angle-label').textContent(), /120°/);
      const readout120 = await page.locator('#radio-readout').textContent();
      assert.doesNotMatch(readout120, /moving away/, 'beyond 90°, every arm crossed moves towards us');
      assert.equal(await count(page, '#radio-diagram-wrap .mw-peak-letter'), G.crossings(120).length);
    });
  });

  test(`${name}: every section with general knowledge labels it first draft`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const [sel, re] of [['#shape', /About 100,000 light-years across.*26,000 light-years from the centre.*first draft, to be checked by the teacher/], ['#radio-map', /21\.1 cm.*220 km\/s.*first draft, to be checked by the teacher/]]) {
        assert.match((await page.locator(`${sel} .note`).last().textContent()).replace(/\s+/g, ' '), re, sel);
      }
    });
  });

  test(`${name}: every quiz card carries data-question-id, marks and spec tag; the placing question shows the lettered drawing`, async (t) => {
    await withPage(t, still, async (page) => {
      const bank = makeQuestions(G);
      const ids = await page.locator('#questions-list .question-card').evaluateAll((cards) => cards.map((c) => c.dataset.questionId));
      assert.deepEqual([...ids].sort(), bank.map((q) => q.id).sort());
      for (const q of bank) {
        const card = page.locator(`.question-card[data-question-id="${q.id}"]`);
        assert.match(await card.locator('.question-marks').textContent(), new RegExp(`\\[${q.marks} marks?\\]`));
        assert.match(await card.locator('.question-tags').textContent(), new RegExp(`Spec ${q.spec.replace('.', '\\.')}`));
      }
      const place = page.locator('.question-card[data-question-id="gx-place"]');
      assert.deepEqual((await place.locator('.mw-quiz-letter').allTextContents()).sort(), ['A', 'B', 'C', 'D']);
      assert.equal(await place.locator('.mw-sun').count(), 1);
      assert.equal(await place.locator('.diagram-label').filter({ hasText: /Sun|cluster|dust/ }).count(), 0, 'no giveaway labels');
    });
  });

  test(`${name}: in every state, no diagram label overlaps another or spills outside its panel`, async (t) => {
    await withPage(t, still, async (page) => {
      const found = [...(await labelProblems(page, 'default'))];
      await page.click('button[data-view="edge"]');
      found.push(...(await labelProblems(page, 'edge')));
      for (let l = 40; l <= 160; l += 10) {
        await setRange(page, 'look-angle', l);
        found.push(...(await labelProblems(page, `look ${l}`)));
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
