/**
 * notes/binaries-and-clusters.html in a real browser, at phone and iPad
 * widths: the binary orbit and its spectral lines against the engine, the
 * play/pause control and reduced motion, the cluster table, every object
 * and instrument in the eyepiece simulator against the engine, every
 * toggle visibly redrawing the view, the quiz cards, and no diagram label
 * colliding in any state.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const B = require('../src/binariesClusters');
const { makeQuestions } = require('../src/binariesClustersQuestions');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'binaries-and-clusters.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/binariesClustersInteractive.test.js');

const WIDTHS = [
  { name: 'phone', width: 390, height: 2600 },
  { name: 'iPad', width: 768, height: 2600 },
];

const INSTRUMENTS = { eye: [7, 1], binoculars: [50, 10], small: [80, 40], large: [250, 150] };

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
          if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) out.push(`${stateName} ${wrap.id}: "${labels[i].text}" overlaps "${labels[j].text}"`);
        }
      }
    });
    return out;
  }, state);
}

const eyeData = (page) => page.locator('#eyepiece-view').evaluate((el) => ({ ...el.dataset }));
const eyePixels = (page) => page.locator('#eyepiece-view').evaluate((el) => el.toDataURL());

async function choose(page, objectId, instrument) {
  await page.click(`#object-buttons button[data-object="${objectId}"]`);
  if (instrument) {
    await page.click(`#instrument-buttons button[data-instrument="${instrument}"]`);
    const [d, m] = INSTRUMENTS[instrument];
    assert.equal(Number(await page.locator('#aperture-slider').inputValue()), d, 'preset aperture lands on the step grid');
    assert.equal(Number(await page.locator('#magnification-slider').inputValue()), m, 'preset magnification lands on the step grid');
  }
}

WIDTHS.forEach(({ name, width, height }) => {
  const still = { viewport: { width, height }, reducedMotion: 'reduce' };

  test(`${name}: loads with no console errors and no horizontal scroll`, async (t) => {
    await withPage(t, still, async (page, errors) => {
      assert.deepEqual(errors, []);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
    });
  });

  test(`${name}: with reduced motion the orbit starts paused; Play animates it; otherwise it plays by itself`, async (t) => {
    await withPage(t, still, async (page) => {
      const button = page.locator('#orbit-play');
      assert.equal(await button.getAttribute('aria-pressed'), 'false');
      const before = await page.locator('#orbit-phase-slider').inputValue();
      await page.waitForTimeout(300);
      assert.equal(await page.locator('#orbit-phase-slider').inputValue(), before, 'nothing moves until asked');
      await button.click();
      await page.waitForTimeout(400);
      assert.notEqual(await page.locator('#orbit-phase-slider').inputValue(), before);
      await button.click();
      assert.equal(await button.getAttribute('aria-pressed'), 'false');
    });
    await withPage(t, { viewport: { width, height } }, async (page) => {
      assert.equal(await page.locator('#orbit-play').getAttribute('aria-pressed'), 'true');
      const a = await page.locator('#orbit-phase-slider').inputValue();
      await page.waitForTimeout(400);
      assert.notEqual(await page.locator('#orbit-phase-slider').inputValue(), a);
    });
  });

  test(`${name}: the orbits and line shifts match the engine; the heavier star moves less`, async (t) => {
    await withPage(t, still, async (page) => {
      let last = null;
      for (const tenths of [10, 20, 35, 40]) {
        await setRange(page, 'mass-ratio-slider', tenths);
        const q = tenths / 10;
        for (const phase of [0, 90, 180, 300]) {
          await setRange(page, 'orbit-phase-slider', phase);
          const d = await page.locator('#orbit-diagram').evaluate((el) => ({ ...el.dataset }));
          const pos = B.binaryPositions(q, 170, phase);
          assert.equal(d.r1, pos.r1.toFixed(2));
          assert.equal(d.r2, pos.r2.toFixed(2));
          assert.ok(Number(d.r1) <= Number(d.r2), 'A, the heavier star, is on the smaller orbit');
          const v = B.radialVelocities(q, phase, 60);
          // Each line moves the way its star moves: longer when receding.
          if (Math.abs(v.star1) > 1) assert.equal(Math.sign(Number(d.shiftA)), Math.sign(v.star1), `A at ${phase}`);
          if (Math.abs(v.star2) > 1) assert.equal(Math.sign(Number(d.shiftB)), Math.sign(v.star2), `B at ${phase}`);
          assert.ok(Number(d.shiftA) * Number(d.shiftB) <= 0, 'the two lines shift opposite ways');
          const markup = await page.locator('#orbit-diagram').evaluate((el) => el.innerHTML);
          if (last) assert.notEqual(markup, last, 'every change redraws the diagram');
          last = markup;
        }
        assert.match(await page.locator('#orbit-size-readout').textContent(), new RegExp(`${q.toFixed(1)} times smaller`));
      }
    });
  });

  test(`${name}: the cluster table has its five rows, with units in brackets in the heading`, async (t) => {
    await withPage(t, still, async (page) => {
      const rows = await page.locator('#cluster-table-body th').allTextContents();
      assert.deepEqual(rows, B.CLUSTER_TABLE.map((r) => r.feature));
      assert.ok(rows.includes('Typical age (years)'));
    });
  });

  test(`${name}: every object through every instrument matches the engine`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const obj of B.OBJECTS) {
        for (const inst of Object.keys(INSTRUMENTS)) {
          await choose(page, obj.id, inst);
          const [apertureMm, magnification] = INSTRUMENTS[inst];
          const view = B.viewOf(obj.id, { apertureMm, magnification });
          const d = await eyeData(page);
          assert.equal(d.object, obj.id);
          assert.equal(d.brightness, view.surfaceBrightness.toFixed(4), `${obj.id} ${inst}`);
          if (obj.kind === 'double') assert.equal(d.status, view.status, `${obj.id} ${inst}`);
          if (obj.kind === 'globular') assert.equal(d.edgeResolved, String(view.edgeStarsResolved), `${obj.id} ${inst}`);
          if (obj.kind === 'nebula') assert.equal(d.colours, 'false');
          const seen = await page.locator('#eyepiece-seen-readout').textContent();
          assert.ok(seen.length > 20, `${obj.id} ${inst} has a description`);
          if (obj.id === 'binary') assert.match(seen, /one look cannot tell a binary from a double star/);
        }
      }
      // Mizar: one star to the eye, two in binoculars.
      await choose(page, 'mizar', 'eye');
      assert.equal((await eyeData(page)).split, 'false');
      await choose(page, 'mizar', 'binoculars');
      assert.equal((await eyeData(page)).split, 'true');
      // An open cluster resolves in binoculars.
      await choose(page, 'pleiades', 'binoculars');
      assert.ok(Number((await eyeData(page)).members) > 10);
      assert.match(await page.locator('#eyepiece-seen-readout').textContent(), /Separate stars, even in binoculars/);
      // A globular's edges resolve in a large telescope, but never its core.
      await choose(page, 'm13', 'binoculars');
      assert.match(await page.locator('#eyepiece-seen-readout').textContent(), /fuzzy ball/);
      await choose(page, 'm13', 'large');
      assert.ok(Number((await eyeData(page)).resolvedStars) > 20);
      assert.match(await page.locator('#eyepiece-seen-readout').textContent(), /core stays a crowded glow/);
    });
  });

  test(`${name}: a bigger aperture shows fainter stars; stars stay points; more magnification dims an extended object`, async (t) => {
    await withPage(t, still, async (page) => {
      await choose(page, 'star');
      await setRange(page, 'magnification-slider', 40);
      await setRange(page, 'aperture-slider', 30);
      const few = Number((await eyeData(page)).visibleStars);
      await setRange(page, 'aperture-slider', 250);
      const many = Number((await eyeData(page)).visibleStars);
      assert.ok(many > few, `${many} > ${few}`);
      assert.match(await page.locator('#eyepiece-seen-readout').textContent(), /no magnification makes them bigger/);

      await choose(page, 'm42');
      await setRange(page, 'aperture-slider', 150);
      const bright = [];
      for (const m of [25, 50, 100, 200]) {
        await setRange(page, 'magnification-slider', m);
        bright.push(Number((await eyeData(page)).brightness));
      }
      for (let i = 1; i < bright.length; i += 1) assert.ok(bright[i] < bright[i - 1], `dimmer at higher magnification: ${bright}`);
      assert.match(await page.locator('#eyepiece-seen-readout').textContent(), /looks dimmer/);
    });
  });

  test(`${name}: the nebula's colours and the galaxy's arms appear only in a photograph; every toggle visibly redraws the view`, async (t) => {
    await withPage(t, still, async (page) => {
      await choose(page, 'm42', 'small');
      assert.match(await page.locator('#eyepiece-seen-readout').textContent(), /grey-green/);
      await page.check('#photograph');
      assert.equal((await eyeData(page)).colours, 'true');
      await page.uncheck('#photograph');

      await setRange(page, 'aperture-slider', 300);
      await setRange(page, 'magnification-slider', 30);
      await choose(page, 'm31');
      assert.equal((await eyeData(page)).spiralArms, 'false');
      assert.equal((await eyeData(page)).disc, 'true');
      await page.uncheck('#dark-sky');
      assert.equal((await eyeData(page)).disc, 'false', 'a town sky hides the faint disc');
      await page.check('#dark-sky');
      await page.check('#photograph');
      assert.equal((await eyeData(page)).spiralArms, 'true');
      await page.uncheck('#photograph');
      await choose(page, 'm31', 'binoculars');
      assert.match(await page.locator('#eyepiece-seen-readout').textContent(), /faint smudge: mainly the bright core/);

      for (const obj of B.OBJECTS) {
        await choose(page, obj.id, 'small');
        for (const id of ['dark-sky', 'photograph']) {
          const before = await eyePixels(page);
          await page.click(`#${id}`);
          assert.notEqual(await eyePixels(page), before, `${id} changes the view of ${obj.id}`);
          await page.click(`#${id}`);
        }
      }
    });
  });

  test(`${name}: every quiz card carries data-question-id, marks and spec tag`, async (t) => {
    await withPage(t, still, async (page) => {
      const bank = makeQuestions(B);
      const ids = await page.locator('#questions-list .question-card').evaluateAll((cards) => cards.map((c) => c.dataset.questionId));
      assert.deepEqual([...ids].sort(), bank.map((q) => q.id).sort());
      for (const q of bank) {
        const card = page.locator(`.question-card[data-question-id="${q.id}"]`);
        assert.match(await card.locator('.question-marks').textContent(), new RegExp(`\\[${q.marks} marks?\\]`));
        assert.match(await card.locator('.question-tags').textContent(), new RegExp(`Spec ${q.spec.replace('.', '\\.')}`));
      }
    });
  });

  test(`${name}: in every orbit state, no diagram label overlaps another or spills outside its panel`, async (t) => {
    await withPage(t, still, async (page) => {
      const found = [...(await labelProblems(page, 'default'))];
      for (const tenths of [10, 25, 40]) {
        await setRange(page, 'mass-ratio-slider', tenths);
        for (let phase = 0; phase < 360; phase += 30) {
          await setRange(page, 'orbit-phase-slider', phase);
          found.push(...(await labelProblems(page, `q=${tenths / 10} phase=${phase}`)));
        }
      }
      assert.deepEqual(found, []);
    });
  });
});

test('the Telescopes page still draws its double star and cluster with the shared star view', async (t) => {
  let browser;
  try {
    browser = await launchChromium();
  } catch (err) {
    skip(t, SKIP_MESSAGE(err));
    return;
  }
  try {
    const page = await browser.newPage({ viewport: { width: 768, height: 1200 } });
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('file://' + path.join(__dirname, '..', 'notes', 'telescopes.html'));
    assert.deepEqual(errors, []);
    assert.match(await page.locator('#double-star-status').textContent(), /resolved/i);
    assert.match(await page.locator('#cluster-status').textContent(), /of 15 stars visible/);
    const nonBlank = await page.locator('#double-star-view').evaluate((c) => {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      for (let i = 0; i < d.length; i += 4) if (d[i] > 100) return true;
      return false;
    });
    assert.ok(nonBlank, 'the double star is drawn');
  } finally {
    await browser.close();
  }
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
