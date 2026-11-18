/**
 * notes/gravity-forming-bodies.html in a real browser, at phone and iPad
 * widths: the regular-motion and Lagrange drawings, the resonance stepped
 * by its slider and button, the Roche, shape and atmosphere controls each
 * redrawing their drawing, the first-draft labels, the quiz cards (with
 * their pictures), and no label collisions.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const G = require('../src/gravityBodies');
const { makeQuestions } = require('../src/gravityBodiesQuestions');
const BANK = () => makeQuestions(G);

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'gravity-forming-bodies.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/gravityBodiesInteractive.test.js');

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
      const lag = page.locator('.question-card[data-question-id="gb-lagrange-picture"]');
      assert.equal(await lag.locator('.gb-lpoint').count(), 5);
      assert.equal(await lag.locator('.gb-lpoint-ring').count(), 1);
      assert.ok(!(await lag.locator('.diagram-label').allTextContents()).includes('L2'), 'the answer is not printed on the picture');
      assert.ok((await page.locator('.question-card[data-question-id="gb-roche-picture"] .gb-ring-piece').count()) > 20);
      assert.equal(await page.locator('.question-card[data-question-id="gb-shape-pick"] .gb-body').count(), 1);
    });
  });

  test(`${name}: loads with no console errors and no horizontal scroll`, async (t) => {
    await withPage(t, still, async (page, errors) => {
      assert.deepEqual(errors, []);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
    });
  });

  test(`${name}: regular motion shows the four inner planets with their data sheet periods, and the Lagrange drawing shows L1 to L5`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await count(page, '#regular-diagram .gb-orbit'), 4);
      assert.equal(await count(page, '#regular-diagram .gb-planet'), 4);
      const r = await labelsOf(page, 'regular-wrap');
      for (const s of ['Mercury: 0.24 years', 'Venus: 0.62 years', 'Earth: 1 year', 'Mars: 1.9 years', 'every 29.5 days']) assert.ok(r.includes(s), s);
      assert.equal(await count(page, '#lagrange-diagram .gb-lpoint'), 5);
      const l = await labelsOf(page, 'lagrange-wrap');
      for (const s of ['L1', 'L2', 'L3', 'L4', 'L5', 'Sun', 'Earth', '60° ahead', '60° behind']) assert.ok(l.includes(s), s);
    });
  });

  test(`${name}: the resonance slider and Step button move the moons, and 4 Io orbits bring the pattern back`, async (t) => {
    await withPage(t, still, async (page) => {
      const seen = new Map();
      for (const v of [0, 0.25, 1, 2, 4]) {
        await setRange(page, 'resonance-time', v);
        assert.equal(await page.locator('#resonance-diagram').getAttribute('data-time'), String(v));
        const orbits = G.resonanceOrbits(v).map((x) => +x.toFixed(3));
        assert.ok((await page.locator('#resonance-readout').textContent()).startsWith(`Io: ${orbits[0]} orbits, Europa: ${orbits[1]}, Ganymede: ${orbits[2]}.`));
        seen.set(v, await page.locator('#resonance-diagram .gb-moon').evaluateAll((els) => els.map((e) => e.outerHTML).join('')));
      }
      assert.notEqual(seen.get(0), seen.get(0.25));
      assert.notEqual(seen.get(1), seen.get(2));
      assert.equal(seen.get(0), seen.get(4), 'the moons are back where they started');
      assert.match(await page.locator('#resonance-readout').textContent(), /pattern repeats every 4 Io orbits/);
      await setRange(page, 'resonance-time', 1);
      await page.click('#resonance-step');
      assert.equal(await page.locator('#resonance-time').inputValue(), '1.25');
      const bar = Number(await page.locator('#resonance-diagram .gb-orbit-bar-io').getAttribute('width'));
      assert.ok(Math.abs(bar - (270 * 1.25) / 4) < 0.01);
    });
  });

  test(`${name}: the Roche slider turns a whole, stretched moon into a ring inside the limit`, async (t) => {
    await withPage(t, still, async (page) => {
      await setRange(page, 'roche-distance', 4);
      assert.equal(await count(page, '#roche-diagram .gb-moon-whole'), 1);
      assert.equal(await count(page, '#roche-diagram .gb-ring-piece'), 0);
      const far = Number(await page.locator('#roche-diagram .gb-moon-whole').getAttribute('rx'));
      await setRange(page, 'roche-distance', 2.6);
      const near = Number(await page.locator('#roche-diagram .gb-moon-whole').getAttribute('rx'));
      assert.ok(near > far, 'stretched more when closer');
      assert.match(await page.locator('#roche-readout').textContent(), /outside the Roche limit/);
      await setRange(page, 'roche-distance', 1.8);
      assert.equal(await page.locator('#roche-diagram').getAttribute('data-inside'), 'true');
      assert.equal(await count(page, '#roche-diagram .gb-moon-whole'), 0);
      assert.equal(await count(page, '#roche-diagram .gb-ring-piece'), 90);
      assert.match(await page.locator('#roche-readout').textContent(), /inside the Roche limit .* pulled apart into a ring/);
      const labels = await labelsOf(page, 'roche-wrap');
      for (const s of ['Roche limit (dashed)', 'Distance (planet radii)', 'pulled apart']) assert.ok(labels.includes(s), s);
    });
  });

  test(`${name}: the size slider and example buttons change the body from lumpy to round`, async (t) => {
    await withPage(t, still, async (page) => {
      const shapes = new Set();
      for (const km of [22, 525, 940]) {
        await page.click(`.gb-shape-buttons button[data-km="${km}"]`);
        assert.equal(await page.locator('#shape-size').inputValue(), String(km), 'the button value lands on the step grid');
        assert.equal(await page.locator('#shape-diagram').getAttribute('data-shape'), G.shapeVerdict(km));
        assert.equal(await page.locator(`.gb-shape-buttons button[data-km="${km}"]`).getAttribute('aria-pressed'), 'true');
        shapes.add(await page.locator('#shape-diagram .gb-body').getAttribute('d'));
      }
      assert.equal(shapes.size, 3);
      await setRange(page, 'shape-size', 1200);
      assert.equal(await count(page, '.gb-shape-buttons button[aria-pressed="true"]'), 0);
      assert.match(await page.locator('#shape-readout').textContent(), /^1200 km across: .*round/);
      const labels = await labelsOf(page, 'shape-wrap');
      for (const s of ['Diameter (km)', 'Phobos', 'Vesta', 'Ceres', 'hatched: becomes round', 'round']) assert.ok(labels.includes(s), s);
    });
  });

  test(`${name}: choosing a body and a gas redraws whether the gas is kept`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const b of G.BODIES) {
        await page.click(`.gb-body-buttons button[data-body="${b.key}"]`);
        for (const g of G.GASES) {
          await page.click(`.gb-gas-buttons button[data-gas="${g.key}"]`);
          const a = G.atmosphere(b.key, g.key);
          const svg = page.locator('#atmosphere-diagram');
          assert.equal(await svg.getAttribute('data-kept'), String(a.kept), `${b.key} ${g.key}`);
          assert.equal(await count(page, a.kept ? '#atmosphere-diagram .gb-gas-kept' : '#atmosphere-diagram .gb-gas-lost'), 16);
          const labels = await labelsOf(page, 'atmosphere-wrap');
          assert.ok(labels.includes(`Escape speed: ${b.escapeKms} km/s`), labels);
          assert.ok(labels.includes(a.kept ? `${g.name}: kept` : `${g.name}: escapes`), labels);
          assert.match(await page.locator('#atmosphere-readout').textContent(), a.kept ? /keeps/ : /escapes/);
          const where = b.key === 'moon' ? 'sunlit surface temperature' : 'upper atmosphere temperature';
          assert.ok((await page.locator('#atmosphere-readout').textContent()).includes(`${where} about ${b.temperatureK.toLocaleString('en-GB')} K`), `${b.key} says where its temperature is measured`);
          assert.ok(labels.includes(`${b.key === 'moon' ? 'surface' : 'upper air'}: ${b.temperatureK.toLocaleString('en-GB')} K`), labels);
        }
      }
    });
  });

  test(`${name}: every value is labelled first draft, and the companion pages are linked`, async (t) => {
    await withPage(t, still, async (page) => {
      const notes = (await page.locator('main .note:not(.sl-readout)').allTextContents()).map((s) => s.replace(/\s+/g, ' '));
      const all = notes.join(' || ');
      for (const s of ['29.5 days', '1.5 million km', 'Trojan', '1.8, 3.6 and 7.2 days', '2.5 planet radii', 'Saturn', '400 km', '600 km', 'Phobos', 'Vesta', 'Ceres', '6 times', '59.5', '1,000 K', 'upper-atmosphere temperatures']) assert.ok(all.includes(s), s);
      notes.filter((n) => !/Stored in this browser/.test(n)).forEach((n) => assert.match(n, /first draft, to be checked by the teacher/i, n));
      for (const href of ['../sims/kepler.html', 'space-telescopes.html#orbits', 'solar-system-bodies.html#tidal-heating', 'solar-system-bodies.html#ring-systems', 'solar-system-bodies.html#formation', 'space-probes.html#getting-there']) assert.ok((await count(page, `main a[href="${href}"]`)) >= 1, href);
    });
  });

  test(`${name}: at every setting, no diagram label overlaps another or spills outside its panel`, async (t) => {
    await withPage(t, still, async (page) => {
      const found = [];
      for (const v of [0, 1.5, 4]) {
        await setRange(page, 'resonance-time', v);
        found.push(...(await labelProblems(page, `t=${v}`)));
      }
      for (const d of [1.2, 2.4, 2.6, 5]) {
        await setRange(page, 'roche-distance', d);
        found.push(...(await labelProblems(page, `d=${d}`)));
      }
      for (const km of [10, 525, 1500]) {
        await setRange(page, 'shape-size', km);
        found.push(...(await labelProblems(page, `${km} km`)));
      }
      for (const b of G.BODIES) {
        await page.click(`.gb-body-buttons button[data-body="${b.key}"]`);
        for (const g of ['hydrogen', 'carbon-dioxide']) {
          await page.click(`.gb-gas-buttons button[data-gas="${g}"]`);
          found.push(...(await labelProblems(page, `${b.key} ${g}`)));
        }
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
