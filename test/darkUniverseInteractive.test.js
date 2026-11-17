/**
 * notes/dark-universe.html in a real browser, at phone and iPad widths:
 * the rotation curve and its axes, the make-up bar told apart by pattern,
 * the detection drawing, the futures graph redrawn by each button, the
 * first-draft labels, the quiz cards, and no label collisions.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const U = require('../src/darkUniverse');
const { makeQuestions } = require('../src/darkUniverseQuestions');
const BANK = () => makeQuestions(U);

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'dark-universe.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/darkUniverseInteractive.test.js');

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
      const readCard = page.locator('.question-card[data-question-id="du-read-curve"]');
      assert.equal(await readCard.locator('svg path[stroke-dasharray]').count(), 1, 'the graph question draws the dashed visible-matter curve');
      const qLabels = (await readCard.locator('.diagram-label').allTextContents()).join(' | ');
      for (const s of ['Distance from centre (thousand light-years)', 'Orbital speed (km/s)']) assert.ok(qLabels.includes(s), s);
    });
  });

  test(`${name}: loads with no console errors and no horizontal scroll`, async (t) => {
    await withPage(t, still, async (page, errors) => {
      assert.deepEqual(errors, []);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
    });
  });

  test(`${name}: the rotation curve shows measured (solid, flat at 220 km/s) against visible matter (dashed), with both axes titled`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await count(page, '#rotation-graph .du-measured-curve'), 1);
      assert.equal(await count(page, '#rotation-graph .du-visible-curve'), 1);
      assert.equal(await page.locator('#rotation-graph .du-measured-curve').getAttribute('stroke-dasharray'), null);
      assert.ok(await page.locator('#rotation-graph .du-visible-curve').getAttribute('stroke-dasharray'));
      assert.equal(await count(page, '#rotation-graph .du-point'), 8);
      assert.equal(await count(page, '#rotation-graph .du-sun'), 1);
      const labels = (await page.locator('#rotation-graph-wrap .diagram-label').allTextContents()).join(' | ');
      for (const s of ['Distance from centre (thousand light-years)', 'Orbital speed (km/s)', 'measured: flat at about 220 km/s (solid)', 'visible matter alone (dashed)', 'Sun']) assert.ok(labels.includes(s), s);
    });
  });

  test(`${name}: the make-up bar tells its three parts apart by pattern and label, not colour alone`, async (t) => {
    await withPage(t, still, async (page) => {
      const fills = await page.locator('#make-up-bar .du-share').evaluateAll((els) => els.map((e) => [e.getAttribute('class'), e.getAttribute('fill')]));
      assert.equal(fills.length, 3);
      assert.match(fills[1][1], /url\(#du-hatch\)/);
      assert.match(fills[2][1], /url\(#du-dots\)/);
      assert.equal(new Set(fills.map((f) => f[1])).size, 3);
      const widths = await page.locator('#make-up-bar .du-share').evaluateAll((els) => els.map((e) => Number(e.getAttribute('width'))));
      assert.ok(widths[0] < widths[1] && widths[1] < widths[2]);
      const labels = (await page.locator('#make-up-wrap .diagram-label').allTextContents()).join(' | ');
      for (const s of ['Ordinary matter: about 5% (plain)', 'Dark matter: about 27%', '(stripes)', 'Dark energy: about 68%', '(dots)']) assert.ok(labels.includes(s), s);
    });
  });

  test(`${name}: the detection drawing shows light given out, light absorbed, and dark matter only bending light`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const sel of ['.du-star', '.du-cloud', '.du-far-galaxy', '.du-dark-matter']) assert.equal(await count(page, `#detect-diagram ${sel}`), 1, sel);
      assert.equal(await count(page, '#detect-diagram .du-bent-light'), 2);
      const labels = (await page.locator('#detect-wrap .diagram-label').allTextContents()).join(' | ');
      for (const s of ['gives out light', 'absorbs some light', 'no light: only gravity,', 'which bends light']) assert.ok(labels.includes(s), s);
    });
  });

  test(`${name}: each balance button redraws the futures graph with its own future in bold`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await page.locator('#future-graph').getAttribute('data-future'), U.FAVOURED);
      const labels = (await page.locator('#future-graph-wrap .diagram-label').allTextContents()).join(' | ');
      for (const s of ['Time from now (billion years)', 'Size of the Universe (today = 1)', 'today']) assert.ok(labels.includes(s), s);
      const seen = new Set();
      for (const f of U.FUTURES) {
        await page.click(`.du-future-buttons button[data-future="${f.key}"]`);
        assert.equal(await page.locator('#future-graph').getAttribute('data-future'), f.key);
        assert.equal(await page.locator(`.du-future-buttons button[data-future="${f.key}"]`).getAttribute('aria-pressed'), 'true');
        assert.equal(await count(page, '.du-future-buttons button[aria-pressed="true"]'), 1);
        assert.equal(await count(page, '#future-graph .du-future'), 4);
        assert.equal(await count(page, `#future-graph .du-future-${f.key}.du-future-chosen`), 1);
        assert.equal(await count(page, '#future-graph .du-future-chosen'), 1);
        const l = (await page.locator('#future-graph-wrap .diagram-label').allTextContents()).join(' | ');
        assert.ok(l.includes(`${f.name} (bold)`), f.key);
        const readout = await page.locator('#future-readout').textContent();
        assert.ok(readout.startsWith(`${f.name}: ${f.balance}.`), readout);
        assert.match(readout, f.key === 'speeding' ? /speeding up/ : /slowing/);
        if (f.key === 'crunch') assert.match(readout, /collapses back to nothing about 41 billion years from now/);
        assert.equal(/current measurements favour/.test(readout), f.key === U.FAVOURED, f.key);
        seen.add(await page.locator('#future-graph').innerHTML());
      }
      assert.equal(seen.size, 4, 'every button changes the drawing');
    });
  });

  test(`${name}: every name, date and figure is labelled first draft, and the companion pages are linked`, async (t) => {
    await withPage(t, still, async (page) => {
      const notes = (await page.locator('main .note:not(.sl-readout)').allTextContents()).map((s) => s.replace(/\s+/g, ' '));
      const all = notes.join(' || ');
      for (const s of ['schematic', 'lensing', 'unknown particles', 'late 1990s', '5%', '27%', '68%', 'underground', 'favour', 'Big Crunch']) assert.ok(all.includes(s), s);
      notes.filter((n) => !/Stored in this browser/.test(n)).forEach((n) => assert.match(n, /first draft, to be checked by the teacher/i, n));
      for (const href of ['our-galaxy.html#radio-map', 'hubble-law.html#graph', 'galaxy-formation.html#bottom-up', 'reading-a-spectrum.html#three-spectra', 'big-bang-evidence.html']) assert.ok((await count(page, `main a[href="${href}"]`)) >= 1, href);
    });
  });

  test(`${name}: for every future, no diagram label overlaps another or spills outside its panel`, async (t) => {
    await withPage(t, still, async (page) => {
      const found = [];
      for (const f of U.FUTURES) {
        await page.click(`.du-future-buttons button[data-future="${f.key}"]`);
        found.push(...(await labelProblems(page, f.key)));
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
