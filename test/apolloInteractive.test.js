/**
 * notes/crewed-missions-apollo.html in a real browser, at phone and iPad
 * widths: the task buttons boxing the deciding advantages or
 * disadvantages, the module buttons, the stepped mission profile (slider
 * and Next button), the missions, the laser readout, the first-draft
 * labels, the links, the quiz cards, and no label collisions.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const A = require('../src/apollo');
const { makeQuestions } = require('../src/apolloQuestions');
const BANK = () => makeQuestions(A);

const PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'crewed-missions-apollo.html');
const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;
const { skip } = trackSkips('test/apolloInteractive.test.js');

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


async function profileSignature(page) {
  return page.evaluate(() => {
    const svg = document.getElementById('profile-diagram');
    const on = [...svg.querySelectorAll('.am-path-on')].map((el) => el.getAttribute('class'));
    const craft = [...svg.querySelectorAll('.am-craft')].map((el) => JSON.stringify(el.getBBox && [Math.round(el.getBBox().x), Math.round(el.getBBox().y)]));
    const extras = ['.am-lm-marker', '.am-capsule', '.am-parachute', '.am-launch-arc'].filter((s) => svg.querySelector(s));
    const lm = svg.querySelector('.am-lm-marker');
    return JSON.stringify({ on, craft, extras, lm: lm && lm.getAttribute('y') });
  });
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

  test(`${name}: each task button boxes the points that decide it, marked by symbol and label, and gives the verdict`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await count(page, '#pros-cons-diagram .am-advantage'), 4);
      assert.equal(await count(page, '#pros-cons-diagram .am-disadvantage'), 4);
      const labels = await labelsOf(page, 'pros-cons-wrap');
      assert.ok(labels.includes('Advantages of a crew (+)') && labels.includes('Disadvantages (!)'));
      const seen = new Set();
      for (const task of A.TASKS) {
        await page.locator(`.am-task-buttons button[data-task="${task.key}"]`).click();
        assert.equal(await page.locator('#pros-cons-diagram').getAttribute('data-task'), task.key);
        assert.equal(await page.locator(`.am-task-buttons button[data-task="${task.key}"]`).getAttribute('aria-pressed'), 'true');
        const boxed = await page.locator('#pros-cons-diagram .am-highlight').evaluateAll((els) => els.map((e) => e.getAttribute('class').match(/am-highlight-(\S+)/)[1]).sort());
        assert.deepEqual(boxed, [...task.highlight].sort(), task.key);
        seen.add(boxed.join(','));
        assert.match(await page.locator('#task-readout').textContent(), new RegExp(`send ${task.verdict === 'crewed' ? 'a crew' : 'a probe'}`));
      }
      assert.equal(seen.size, A.TASKS.length, 'every task draws a different box');
    });
  });

  test(`${name}: the Saturn V is drawn with its parts labelled and its height`, async (t) => {
    await withPage(t, still, async (page) => {
      const labels = await labelsOf(page, 'saturn-wrap');
      for (const s of ['launch escape tower', 'Command Module', 'Service Module', 'Lunar Module (folded inside)', 'first stage: lift-off', 'about', '110 m']) assert.ok(labels.includes(s), s);
      assert.equal(await count(page, '#saturn-diagram .am-saturn-stage'), 3);
    });
  });

  test(`${name}: each module button moves the box and changes the readout`, async (t) => {
    await withPage(t, still, async (page) => {
      const boxes = new Set();
      for (const m of A.MODULES) {
        await page.locator(`.am-module-buttons button[data-module="${m.key}"]`).click();
        assert.equal(await page.locator('#modules-diagram').getAttribute('data-module'), m.key);
        assert.equal(await count(page, '#modules-diagram .am-module-chosen'), 1);
        boxes.add(await page.locator('#modules-diagram .am-module-chosen').getAttribute('x'));
        assert.equal(await page.locator('#module-readout').textContent(), `${m.name}: ${m.job}.`);
      }
      assert.equal(boxes.size, 3);
    });
  });

  test(`${name}: the step slider and Next button redraw the mission profile, all eight steps different`, async (t) => {
    await withPage(t, still, async (page) => {
      const sigs = new Set();
      for (let s = 1; s <= 8; s += 1) {
        await setRange(page, 'profile-step', s);
        assert.equal(await page.locator('#profile-diagram').getAttribute('data-step'), String(s));
        const p = A.PROFILE[s - 1];
        assert.ok((await labelsOf(page, 'profile-wrap')).includes(`Step ${s} of 8: ${p.name}`));
        assert.equal(await page.locator('#profile-readout').textContent(), `${s}. ${p.name}: ${p.text}`);
        sigs.add(await profileSignature(page));
      }
      assert.equal(sigs.size, 8, 'every step looks different');
      await setRange(page, 'profile-step', 3);
      assert.ok((await labelsOf(page, 'profile-wrap')).includes('about 3 days'));
      assert.equal(await count(page, '#profile-diagram .am-path-out.am-path-on'), 1);
      await page.locator('#profile-next').click();
      assert.equal(await page.locator('#profile-step').inputValue(), '4');
      assert.equal(await count(page, '#profile-diagram .am-path-lunar.am-path-on'), 1);
      await setRange(page, 'profile-step', 5);
      assert.ok((await labelsOf(page, 'profile-wrap')).includes('two land; one stays in orbit'));
      await setRange(page, 'profile-step', 8);
      assert.ok((await labelsOf(page, 'profile-wrap')).includes('only the Command Module returns'));
      await page.locator('#profile-next').click();
      assert.equal(await page.locator('#profile-step').inputValue(), '1', 'Next wraps round to the start');
    });
  });

  test(`${name}: four mission cards and list items; the laser readout works the round trip`, async (t) => {
    await withPage(t, still, async (page) => {
      assert.equal(await count(page, '#missions-diagram .am-mission'), 4);
      const items = await page.locator('#missions-list li').allTextContents();
      assert.deepEqual(items.map((s) => s.split(' (')[0]), ['Apollo 8', 'Apollo 11', 'Apollo 13', 'Apollo 17']);
      const labels = await labelsOf(page, 'missions-wrap');
      for (const s of ['Apollo 8', 'Apollo 17', '1968', '1969', '1970', '1972', 'first', 'safe', 'return', 'last']) assert.ok(labels.includes(s), s);
      assert.match(await page.locator('#laser-readout').textContent(), /2 × 380,000 km = 760,000 km = 7\.6 × 10⁸ m.*≈ 2\.53 s/);
      assert.ok((await labelsOf(page, 'laser-wrap')).includes('round trip: about 2.5 s'));
    });
  });

  test(`${name}: every name, date and figure is labelled first draft, and the linked pages are linked, not repeated`, async (t) => {
    await withPage(t, still, async (page) => {
      const notes = (await page.locator('main .note:not(.sl-readout)').allTextContents()).map((s) => s.replace(/\s+/g, ' '));
      const all = notes.join(' || ');
      for (const s of ['Hubble', 'no further than the Moon', 'Gagarin, 1961', 'Kennedy', '$25 billion at the time', '110 m', 'three stages', 'crew of three', 'About 3 days', 'Twelve people', 'six landings', 'years', 'Armstrong', 'Aldrin', 'Collins', 'Schmitt', 'centimetres or better', '382 kg', 'extremely dry']) assert.ok(all.includes(s), s);
      notes.filter((n) => !/Stored in this browser/.test(n)).forEach((n) => assert.match(n, /first draft, to be checked by the teacher/i, n));
      for (const href of ['space-probes.html#probe-types', 'big-bang-evidence.html#deep-field', 'moon-structure.html#named-features', 'moon-structure.html#origin']) {
        assert.ok((await count(page, `main a[href="${href}"]`)) >= 1, href);
      }
      const text = await page.locator('main').textContent();
      assert.ok(!/no water/i.test(text), 'the rocks are extremely dry, not waterless');
      assert.ok(!/isotope/i.test(text), 'origin evidence is linked, not restated');
      assert.ok(!/a few centimetres/i.test(text));
    });
  });

  test(`${name}: at every setting, no diagram label overlaps another or spills outside its panel`, async (t) => {
    await withPage(t, still, async (page) => {
      const found = [];
      for (const task of A.TASKS) {
        await page.locator(`.am-task-buttons button[data-task="${task.key}"]`).click();
        found.push(...(await labelProblems(page, `task ${task.key}`)));
      }
      for (const m of A.MODULES) {
        await page.locator(`.am-module-buttons button[data-module="${m.key}"]`).click();
        found.push(...(await labelProblems(page, `module ${m.key}`)));
      }
      for (let s = 1; s <= 8; s += 1) {
        await setRange(page, 'profile-step', s);
        found.push(...(await labelProblems(page, `step ${s}`)));
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
