/**
 * notes/massive-stars.html in a real browser, at phone and iPad widths: the
 * stage buttons redrawing the stage drawing, the force-arrow balance and the
 * two HR tracks; the core-mass slider against the Chandrasekhar limit; the
 * stage table and timeline; the first-draft labels; the quiz cards; and no
 * diagram label colliding in any state.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const L = require('../src/sunLikeStar');
const M = require('../src/massiveStar');
const { makeQuestions } = require('../src/massiveStarQuestions');

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'massive-stars.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/massiveStarInteractive.test.js');

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

  test(`${name}: each stage button redraws the stage, the balance and the tracks, and says what happens to the core`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.deepEqual(await page.locator('#stage-buttons button').allTextContents(), ['1. Nebula', '2. Main sequence', '3. Red supergiant', '4. Supernova', '5a. Neutron star', '5b. Black hole']);
      const seen = { stage: new Set(), balance: new Set(), track: new Set() };
      for (const s of M.STAGES) {
        await page.click(`#stage-buttons button[data-stage="${s.id}"]`);
        assert.equal((await data(page, 'stage-diagram')).stage, s.id);
        assert.equal((await data(page, 'balance-diagram')).trend, M.trend(s.id), s.id);
        assert.equal((await data(page, 'track-diagram')).stage, s.id);
        assert.ok((await page.locator('#stage-readout').textContent()).includes(s.core), s.id);
        assert.ok((await page.locator('#balance-readout').textContent()).includes(s.balance.verdict), s.id);
        assert.equal(await page.locator('#stage-table tr.sl-row--chosen').getAttribute('data-stage'), s.id);
        seen.stage.add(await wrapHtml(page, 'stage-diagram'));
        seen.balance.add(await wrapHtml(page, 'balance-diagram'));
        seen.track.add(await wrapHtml(page, 'track-diagram'));
      }
      assert.equal(seen.stage.size, 6);
      assert.equal(seen.balance.size, 6);
      assert.equal(seen.track.size, 6);
      assert.equal(await page.locator('a[href="sun-like-star.html"]').count() >= 1, true, 'links the Sun-like page for the nebula and protostar');
    });
  });

  test(`${name}: the arrows use the Sun-like page's conventions, label neutron pressure, and show the supernova collapse`, async (t) => {
    await withPage(t, still, async (page) => {
      const lengths = async () => page.locator('#balance-diagram').evaluate((svg) => {
        const len = (cls) => [...svg.querySelectorAll(`line.${cls}`)].map((l) => Math.hypot(l.x2.baseVal.value - l.x1.baseVal.value, l.y2.baseVal.value - l.y1.baseVal.value));
        const dashed = [...svg.querySelectorAll('line.sl-arrow-out')].every((l) => l.getAttribute('stroke-dasharray') !== 'none');
        const solid = [...svg.querySelectorAll('line.sl-arrow-in')].every((l) => l.getAttribute('stroke-dasharray') === 'none');
        return { inward: len('sl-arrow-in'), outward: len('sl-arrow-out'), dashed, solid };
      });
      await page.click('#stage-buttons button[data-stage="main-sequence"]');
      let l = await lengths();
      assert.ok(l.solid && l.dashed, 'solid inward, dashed outward');
      assert.ok(Math.abs(l.inward[0] - l.outward[0]) < 12);
      await page.click('#stage-buttons button[data-stage="neutron-star"]');
      assert.match(await page.locator('#balance-diagram-wrap').textContent(), /neutron pressure \(outward\)/);
      await page.click('#stage-buttons button[data-stage="supernova"]');
      l = await lengths();
      assert.ok(l.inward[0] > l.outward[0] + 30, 'gravity far stronger');
      assert.match(await page.locator('#balance-diagram-wrap').textContent(), /the core collapses/);
      await page.click('#stage-buttons button[data-stage="black-hole"]');
      assert.equal((await lengths()).outward.length, 0, 'nothing pushes outward');
      assert.match(await page.locator('#balance-diagram-wrap').textContent(), /nothing pushes outward/);
    });
  });

  test(`${name}: the core-mass slider crosses the Chandrasekhar limit from white dwarf to neutron star to black hole`, async (t) => {
    await withPage(t, still, async (page) => {
      const cases = [[0.5, 'white-dwarf', /electron pressure/], [1.3, 'white-dwarf', /below the Chandrasekhar limit/], [1.4, 'neutron-star', /neutron pressure/], [2.9, 'neutron-star', /neutron star/], [3, 'black-hole', /black hole/], [5, 'black-hole', /nothing can stop the collapse/]];
      let before = await wrapHtml(page, 'core-diagram');
      for (const [m, end, text] of cases) {
        await setRange(page, 'core-mass', m);
        const d = await data(page, 'core-diagram');
        assert.equal(d.end, end, `${m}`);
        assert.equal(d.end, M.coreEnd(m).id, `${m} matches the engine`);
        assert.match(await page.locator('#core-readout').textContent(), text, `${m}`);
        assert.equal(await page.locator(`#core-diagram .ms-remnant--${end}`).count(), 1, `${m} draws the ${end}`);
        assert.equal(await page.locator(`#core-diagram .ms-zone--chosen.ms-zone--${end}`).count(), 1, `${m} marks the zone`);
        const now = await wrapHtml(page, 'core-diagram');
        assert.notEqual(now, before, `${m} redraws`);
        before = now;
      }
      assert.match(await page.locator('#core-diagram-wrap').textContent(), /Chandrasekhar limit/);
    });
  });

  test(`${name}: both HR tracks on one diagram, told apart by line style, marker shape and labels`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await page.locator('#track-diagram .sl-track--sun-like').getAttribute('stroke-dasharray'), '8 5');
      assert.equal(await page.locator('#track-diagram .sl-track--massive').getAttribute('stroke-dasharray'), 'none');
      assert.ok((await page.locator('#track-diagram rect.sl-track-point[data-track="massive"]').count()) === 3, 'squares for the massive star');
      assert.ok((await page.locator('#track-diagram circle.sl-track-point[data-track="sunLike"]').count()) >= 5, 'circles for the Sun-like star');
      const text = await page.locator('#track-diagram-wrap').textContent();
      ['Main sequence', 'Red supergiant', 'the Sun', 'Red giant', 'White dwarf', 'massive star (about 20 times the Sun’s mass)', 'Sun-like star'].forEach((s) => assert.ok(text.includes(s), s));
      const pt = async (track, id) => page.locator(`#track-diagram .sl-track-point[data-track="${track}"][data-stage="${id}"]`).evaluate((e) => {
        const r = e.getBBox();
        return [r.x + r.width / 2, r.y + r.height / 2];
      });
      const ms = await pt('massive', 'main-sequence');
      const sun = await pt('sunLike', 'main-sequence');
      assert.ok(ms[0] < sun[0] && ms[1] < sun[1], 'the massive star starts hotter (left) and brighter (up)');
      await page.click('#stage-buttons button[data-stage="neutron-star"]');
      assert.equal((await data(page, 'track-diagram')).onDiagram, 'false');
      assert.match(await page.locator('#track-diagram-wrap').textContent(), /a neutron star is not on the diagram/);
    });
  });

  test(`${name}: the timescales table and timeline, with the Sun-like main sequence for comparison`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.deepEqual(await page.locator('#stage-table thead th').allTextContents(), ['Stage', 'Roughly how long (years)', 'What happens to the core']);
      assert.equal(await page.locator('#stage-table tbody tr').count(), 6);
      const widths = await page.locator('#timeline-diagram .sl-time-bar').evaluateAll((bars) => Object.fromEntries(bars.map((b) => [b.dataset.stage, Number(b.getAttribute('width'))])));
      assert.ok(widths['sun-like-main-sequence'] > widths['main-sequence'], 'the Sun-like main sequence is far longer');
      assert.match(await page.locator('#timeline-diagram-wrap').textContent(), /under a second to months/);
    });
  });

  test(`${name}: every section with general knowledge labels it first draft`, async (t) => {
    await withPage(t, still, async (page) => {
      for (const sel of ['#balance', '#chandrasekhar', '#hr-tracks', '#timescales']) {
        assert.match((await page.locator(`${sel} .note`).last().textContent()).replace(/\s+/g, ' '), /first draft, to be checked by the teacher/, sel);
      }
    });
  });

  test(`${name}: every quiz card carries data-question-id, marks and spec tag`, async (t) => {
    await withPage(t, still, async (page) => {
      const bank = makeQuestions(M, L);
      const ids = await page.locator('#questions-list .question-card').evaluateAll((cards) => cards.map((c) => c.dataset.questionId));
      assert.deepEqual([...ids].sort(), bank.map((q) => q.id).sort());
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
      for (const s of M.STAGES) {
        await page.click(`#stage-buttons button[data-stage="${s.id}"]`);
        found.push(...(await labelProblems(page, s.id)));
      }
      for (const m of [0.5, 1.3, 1.4, 2.5, 3, 5]) {
        await setRange(page, 'core-mass', m);
        found.push(...(await labelProblems(page, `core ${m}`)));
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
