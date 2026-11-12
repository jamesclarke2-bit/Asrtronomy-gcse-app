/**
 * notes/hr-diagram.html in a real browser, at phone and iPad widths: the
 * main diagram's axes and regions, tapping the ten real stars, the
 * sketch-it practice (axes, placing labels by tap, drag and keyboard,
 * feedback, the answer), the distance tool against the engine, the quiz
 * cards, and no diagram label colliding in any state.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const H = require('../src/hrDiagram');
const { makeQuestions } = require('../src/hrDiagramQuestions');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'hr-diagram.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/hrDiagramInteractive.test.js');

const WIDTHS = [
  { name: 'phone', width: 390, height: 2600 },
  { name: 'iPad', width: 768, height: 2600 },
];

// The full diagrams' plot area, in viewBox units (640 x 536).
const plot = H.makePlot({ x0: 78, x1: 562, yTop: 56, yBottom: 436 });
const CENTRES = {
  'main-sequence': [12000, 0.0],
  sun: [5800, 4.8],
  supergiants: [10000, -7.5],
  'blue-giants': [17000, -4.0],
  'red-giants': [4200, -0.5],
  'white-dwarfs': [16000, 12],
};
const starKey = (star) => star.name.replace(/^the /, '').toLowerCase().replace(/\s+/g, '-');

async function withPage(t, viewport, run) {
  let browser;
  try {
    browser = await launchChromium();
  } catch (err) {
    skip(t, SKIP_MESSAGE(err));
    return;
  }
  try {
    const page = await browser.newPage({ viewport });
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
    document.querySelectorAll('.spectrum-panel .labelled-diagram-wrap').forEach((wrap) => {
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
          if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) out.push(`${stateName} ${wrap.id || 'question'}: "${labels[i].text}" overlaps "${labels[j].text}"`);
        }
      }
    });
    return out;
  }, state);
}

async function chooseAxes(page, { xq = 'temperature', xd = 'hot-left', yq = 'luminosity', yd = 'bright-top' } = {}) {
  await page.selectOption('#sketch-x-quantity', xq);
  await page.selectOption('#sketch-x-direction', xd);
  await page.selectOption('#sketch-y-quantity', yq);
  await page.selectOption('#sketch-y-direction', yd);
  await page.click('#sketch-axes-check');
}

async function placeByTap(page, chip, t, m) {
  await page.click(`#sketch-chips button[data-chip="${chip}"]`);
  const svg = page.locator('#hr-sketch-diagram');
  const box = await svg.boundingBox();
  await svg.click({ position: { x: (plot.xForT(t) / 640) * box.width, y: (plot.yForM(m) / 536) * box.height } });
}

async function setM(page, tenths) {
  await page.locator('#distance-m').evaluate((el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, tenths);
  assert.equal(Number(await page.locator('#distance-m').inputValue()), tenths, 'value lands on the step grid');
}

WIDTHS.forEach(({ name, width, height }) => {
  test(`${name}: loads with no console errors and no horizontal scroll`, async (t) => {
    await withPage(t, { width, height }, async (page, errors) => {
      assert.deepEqual(errors, []);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
    });
  });

  test(`${name}: the diagram has both y-axes, hottest on the left with O to M, and all five regions plus the Sun`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      const wrap = page.locator('#hr-main-diagram-wrap');
      const titles = await wrap.locator('.hr-axis-title').allTextContents();
      assert.ok(titles.includes('Luminosity (Sun = 1)'));
      assert.ok(titles.includes('Absolute magnitude'));
      assert.ok(titles.some((x) => /hotter.*Surface temperature \(K\).*cooler/.test(x)));
      assert.equal(await wrap.locator('.hr-tick-l').count(), 7);
      assert.deepEqual(await wrap.locator('.hr-tick-m').allTextContents(), ['−10', '−5', '0', '+5', '+10', '+15']);
      // Brightest at the top on both axes.
      const yOf = async (sel, text) => (await wrap.locator(sel, { hasText: new RegExp(`^${text}$`) }).boundingBox()).y;
      assert.ok((await yOf('.hr-tick-m', '−10')) < (await yOf('.hr-tick-m', '\\+15')));
      assert.ok((await yOf('.hr-tick-l', '10⁶')) < (await yOf('.hr-tick-l', '1')));
      // Class letters left to right O B A F G K M.
      const letters = await wrap.locator('.hr-class-letter').evaluateAll((els) => els.map((el) => [el.dataset.class, el.getBoundingClientRect().x]).sort((a, b) => a[1] - b[1]).map((a) => a[0]));
      assert.deepEqual(letters, ['O', 'B', 'A', 'F', 'G', 'K', 'M']);
      const regions = await wrap.locator('.hr-region-label').evaluateAll((els) => els.map((el) => el.dataset.region).sort());
      assert.deepEqual(regions, ['blue-giants', 'main-sequence', 'red-giants', 'supergiants', 'white-dwarfs']);
      assert.equal(await page.locator('#hr-main-diagram .hr-region').count(), 5);
      assert.equal(await wrap.locator('.hr-sun-label').textContent(), 'the Sun');
    });
  });

  test(`${name}: tapping each of the ten stars shows its own details, matching the engine`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      assert.equal(await page.locator('#hr-stars-diagram .hr-star').count(), 10);
      assert.equal(await page.locator('#hr-star-table-body tr').count(), 10);
      let lastMarkup = await page.locator('#hr-stars-diagram').evaluate((el) => el.innerHTML);
      for (const star of H.STARS) {
        if (star.name === 'the Sun') continue;
        await page.locator(`#hr-stars-diagram .hr-star-hit[data-star="${starKey(star)}"]`).click({ force: true });
        const card = page.locator('#hr-star-card');
        assert.equal(await card.getAttribute('data-star'), starKey(star));
        const text = await card.textContent();
        assert.ok(text.includes(star.temperatureK.toLocaleString('en-GB')), star.name);
        assert.ok(text.includes(H.signed(star.absoluteMagnitude)), star.name);
        assert.ok(text.includes(H.formatLuminosity(star.luminosity)), star.name);
        const markup = await page.locator('#hr-stars-diagram').evaluate((el) => el.innerHTML);
        assert.notEqual(markup, lastMarkup, `selecting ${star.name} redraws the ring`);
        lastMarkup = markup;
      }
      // The buttons under the diagram do the same.
      await page.click('#hr-star-buttons button[data-star="sun"]');
      assert.equal(await page.locator('#hr-star-card').getAttribute('data-star'), 'sun');
      assert.equal(await page.locator('#hr-star-buttons button[data-star="sun"]').getAttribute('aria-pressed'), 'true');
    });
  });

  test(`${name}: sketch it — axes first, with each choice redrawing the axes; wrong axes keep the labels locked`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      assert.equal(await page.locator('#sketch-chips button:disabled').count(), 6);
      const markups = new Set();
      const snap = async () => markups.add(await page.locator('#hr-sketch-diagram-wrap').evaluate((el) => el.innerHTML));
      await snap();
      await page.selectOption('#sketch-x-quantity', 'temperature');
      await snap();
      await page.selectOption('#sketch-x-direction', 'hot-right');
      await snap();
      await page.selectOption('#sketch-x-direction', 'hot-left');
      await snap();
      await page.selectOption('#sketch-y-quantity', 'absolute');
      await snap();
      await page.selectOption('#sketch-y-direction', 'bright-bottom');
      await snap();
      assert.equal(markups.size, 6, 'every axis choice visibly changes the diagram');
      await page.click('#sketch-axes-check');
      assert.equal(await page.locator('#sketch-axes-feedback').getAttribute('data-correct'), 'false');
      assert.match(await page.locator('#sketch-axes-feedback').textContent(), /✗ The brightest stars go at the top/);
      assert.equal(await page.locator('#sketch-chips button:disabled').count(), 6);
      await chooseAxes(page, { yq: 'absolute' });
      assert.equal(await page.locator('#sketch-axes-feedback').getAttribute('data-correct'), 'true');
      assert.equal(await page.locator('#sketch-chips button:disabled').count(), 0);
      // Luminosity is equally right.
      await chooseAxes(page, { yq: 'luminosity' });
      assert.equal(await page.locator('#sketch-axes-feedback').getAttribute('data-correct'), 'true');
    });
  });

  test(`${name}: sketch it — every label placed in its region gets a tick; a wrong place gets a cross and says where it goes`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      await chooseAxes(page);
      for (const [chip, [tK, m]] of Object.entries(CENTRES)) await placeByTap(page, chip, tK, m);
      const fb = page.locator('#sketch-feedback');
      assert.equal(await fb.getAttribute('data-placed'), '6');
      assert.equal(await fb.getAttribute('data-score'), '6');
      assert.equal(await page.locator('#hr-sketch-diagram-wrap .hr-placed-label', { hasText: '✓' }).count(), 6);

      await placeByTap(page, 'white-dwarfs', 4000, -1);
      assert.equal(await fb.getAttribute('data-score'), '5');
      assert.match(await fb.locator('li[data-chip="white-dwarfs"]').textContent(), /✗ White dwarfs: not there\. It goes bottom left/);
      assert.equal(await page.locator('#hr-sketch-diagram-wrap .hr-placed-label[data-chip="white-dwarfs"]').textContent(), 'white dwarfs ✗');

      // Show the answer: the regions are drawn and named; hide it again.
      await page.click('#sketch-show-answer');
      assert.equal(await page.locator('#hr-sketch-diagram').getAttribute('data-answer'), 'shown');
      assert.equal(await page.locator('#hr-sketch-diagram-wrap .hr-region-label').count(), 5);
      await page.click('#sketch-show-answer');
      assert.equal(await page.locator('#hr-sketch-diagram').getAttribute('data-answer'), 'hidden');
      assert.equal(await page.locator('#hr-sketch-diagram-wrap .hr-region-label').count(), 0);
    });
  });

  test(`${name}: sketch it — a label can be dragged onto the diagram, or placed with the keyboard`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      await chooseAxes(page);
      const chip = page.locator('#sketch-chips button[data-chip="red-giants"]');
      await chip.scrollIntoViewIfNeeded();
      const c = await chip.boundingBox();
      const svg = page.locator('#hr-sketch-diagram');
      await svg.scrollIntoViewIfNeeded();
      const s = await svg.boundingBox();
      const [tK, m] = CENTRES['red-giants'];
      await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
      await page.mouse.down();
      await page.mouse.move(c.x + c.width / 2 + 20, c.y + c.height / 2 + 20, { steps: 3 });
      await page.mouse.move(s.x + (plot.xForT(tK) / 640) * s.width, s.y + (plot.yForM(m) / 536) * s.height, { steps: 8 });
      await page.mouse.up();
      assert.equal(await page.locator('#sketch-feedback li[data-chip="red-giants"]').getAttribute('data-correct'), 'true');
      assert.equal(await chip.getAttribute('aria-pressed'), 'false', 'a drop does not leave the chip selected');

      // Keyboard: the cross starts in the middle; the main sequence crosses the middle of the diagram.
      await page.click('#sketch-chips button[data-chip="supergiants"]');
      await svg.focus();
      for (let i = 0; i < 16; i += 1) await page.keyboard.press('ArrowUp');
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#sketch-feedback li[data-chip="supergiants"]').getAttribute('data-correct'), 'true');
    });
  });

  test(`${name}: the distance tool matches the engine for every type, with the slider always on its step grid`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      // Default: the worked example.
      assert.equal(await page.locator('#hr-distance-diagram').getAttribute('data-distance'), '100.000');
      const working = await page.locator('#distance-working').textContent();
      assert.match(working, /M ≈ \+4\.8/);
      assert.match(working, /\+9\.8 − \(\+4\.8\) \+ 5 = 10\.0/);
      assert.match(working, /about ±48 pc/);
      assert.match(working, /63 pc/);
      assert.match(working, /158 pc/);
      let lastMarkup = null;
      for (const { type, temperatureK } of H.DISTANCE_TYPES) {
        await page.selectOption('#distance-type', type);
        const slider = page.locator('#distance-m');
        const min = Number(await slider.getAttribute('min'));
        const max = Number(await slider.getAttribute('max'));
        const r0 = H.distanceFromMainSequence(temperatureK, 10);
        assert.ok(Math.pow(10, (min / 10 - r0.faint + 5) / 5) >= 0.999, `${type}: near end on the scale`);
        assert.ok(Math.pow(10, (max / 10 - r0.bright + 5) / 5) <= 100001, `${type}: far end on the scale`);
        for (const v of [min, Math.round((min + max) / 2), max]) {
          await setM(page, v);
          const r = H.distanceFromMainSequence(temperatureK, v / 10);
          assert.equal(await page.locator('#hr-distance-diagram').getAttribute('data-distance'), r.distancePc.toFixed(3), `${type} m=${v / 10}`);
          assert.equal(await page.locator('#hr-distance-diagram').getAttribute('data-type'), type);
          const markup = await page.locator('#hr-distance-diagram').evaluate((el) => el.innerHTML);
          if (lastMarkup) assert.notEqual(markup, lastMarkup, 'every change visibly redraws the diagram');
          lastMarkup = markup;
        }
      }
    });
  });

  test(`${name}: every quiz card carries data-question-id, marks and spec tag; the read-off questions draw their own diagram`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      const bank = makeQuestions(H);
      const ids = await page.locator('#questions-list .question-card').evaluateAll((cards) => cards.map((c) => c.dataset.questionId));
      assert.deepEqual([...ids].sort(), bank.map((q) => q.id).sort());
      for (const q of bank) {
        const card = page.locator(`.question-card[data-question-id="${q.id}"]`);
        assert.match(await card.locator('.question-marks').textContent(), new RegExp(`\\[${q.marks} marks?\\]`));
        assert.match(await card.locator('.question-tags').textContent(), new RegExp(`Spec ${q.spec.replace('.', '\\.')}`));
        if (q.render) {
          assert.equal(await card.locator('.hr-question-diagram svg').count(), 1, q.id);
          const svgBox = await card.locator('.hr-question-diagram svg').boundingBox();
          assert.ok(svgBox.width > 250 && svgBox.height > 100, `${q.id} diagram is properly sized`);
        }
      }
    });
  });

  test(`${name}: in every state, no diagram label overlaps another or spills outside its panel`, async (t) => {
    await withPage(t, { width, height }, async (page) => {
      const found = [...(await labelProblems(page, 'default'))];
      for (const star of H.STARS) {
        await page.locator(`#hr-star-buttons button[data-star="${starKey(star)}"]`).click();
        found.push(...(await labelProblems(page, `star ${star.name}`)));
      }
      await page.selectOption('#sketch-x-quantity', 'temperature');
      await page.selectOption('#sketch-x-direction', 'hot-right');
      await page.selectOption('#sketch-y-quantity', 'absolute');
      await page.selectOption('#sketch-y-direction', 'bright-bottom');
      found.push(...(await labelProblems(page, 'wrong axes')));
      await chooseAxes(page);
      for (const [chip, [tK, m]] of Object.entries(CENTRES)) await placeByTap(page, chip, tK, m);
      found.push(...(await labelProblems(page, 'all placed')));
      await page.click('#sketch-show-answer');
      found.push(...(await labelProblems(page, 'answer shown')));
      for (const { type } of H.DISTANCE_TYPES) {
        await page.selectOption('#distance-type', type);
        const slider = page.locator('#distance-m');
        for (const v of [Number(await slider.getAttribute('min')), Number(await slider.getAttribute('max'))]) {
          await setM(page, v);
          found.push(...(await labelProblems(page, `${type} m=${v / 10}`)));
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
    const page = await browser.newPage({ viewport: { width: 768, height: 1200 } });
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
