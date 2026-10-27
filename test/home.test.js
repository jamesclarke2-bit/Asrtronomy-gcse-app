/**
 * index.html's own script (home.js): the pure quiz-progress/journey
 * logic against fixtures and the real data, then — in a real browser —
 * the hero illustration's accessible title/description, every journey
 * step being a real link (and every coming-soon step never being one),
 * the "Show as list" toggle actually showing the same steps as the
 * cards, and that the star/rocket animation stops under reduced
 * motion. The <noscript> fallback is checked separately, by parsing its
 * raw markup against Pages.buildJourney directly (see the bottom of
 * this file) — Playwright always runs with scripting on, so it can
 * never render that block itself.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const { loadQuizProgress, pageHasAnswered, journeyPages, findContinueHref, phaseProgress } = require('../home');
const { PAGES, PHASES, COMING_SOON, buildJourney } = require('../src/pages');

const ROOT = path.join(__dirname, '..');

// --- Pure logic, fixture-based -----------------------------------------

test('pageHasAnswered: true once any of the page\'s units has at least one attempt', () => {
  const page = { units: ['u1.1', 'u1.2'] };
  assert.equal(pageHasAnswered(page, {}), false);
  assert.equal(pageHasAnswered(page, { 'u1.3': { attempts: 5, correct: 5 } }), false);
  assert.equal(pageHasAnswered(page, { 'u1.2': { attempts: 0, correct: 0 } }), false);
  assert.equal(pageHasAnswered(page, { 'u1.2': { attempts: 1, correct: 0 } }), true);
});

test('journeyPages: only built (positioned) pages, sorted by position', () => {
  const pages = [
    { href: 'b.html', position: 2 },
    { href: 'ref.html' }, // no position: reference/extension, excluded
    { href: 'a.html', position: 1 },
  ];
  assert.deepEqual(journeyPages(pages).map((p) => p.href), ['a.html', 'b.html']);
});

test('findContinueHref: the first journey page with no answered questions', () => {
  const pages = [
    { href: 'a.html', position: 1, units: ['u1.1'] },
    { href: 'b.html', position: 2, units: ['u1.2'] },
    { href: 'c.html', position: 3, units: ['u1.3'] },
  ];
  const progress = { 'u1.1': { attempts: 2, correct: 1 } };
  assert.equal(findContinueHref(pages, progress), 'b.html');
});

test('findContinueHref: every page answered falls back to the last page, not nowhere', () => {
  const pages = [
    { href: 'a.html', position: 1, units: ['u1.1'] },
    { href: 'b.html', position: 2, units: ['u1.2'] },
  ];
  const progress = { 'u1.1': { attempts: 1, correct: 1 }, 'u1.2': { attempts: 1, correct: 0 } };
  assert.equal(findContinueHref(pages, progress), 'b.html');
});

test('findContinueHref: no progress at all points at the very first journey page', () => {
  const pages = [{ href: 'a.html', position: 1, units: ['u1.1'] }, { href: 'b.html', position: 2, units: ['u1.2'] }];
  assert.equal(findContinueHref(pages, {}), 'a.html');
});

test('phaseProgress: counts only built items, coming-soon steps never in the denominator', () => {
  const items = [
    { type: 'built', page: { units: ['u1.1'] } },
    { type: 'built', page: { units: ['u1.2'] } },
    { type: 'comingSoon', step: { name: 'Not built' } },
  ];
  const progress = { 'u1.1': { attempts: 3, correct: 2 } };
  assert.deepEqual(phaseProgress(items, progress), { finished: 1, total: 2 });
});

test('phaseProgress: a phase with no built items yet reads as 0 of 0, not an error', () => {
  const items = [{ type: 'comingSoon', step: { name: 'Not built' } }];
  assert.deepEqual(phaseProgress(items, {}), { finished: 0, total: 0 });
});

test('loadQuizProgress: no localStorage (Node) returns {} rather than throwing', () => {
  assert.deepEqual(loadQuizProgress(), {});
});

// --- Pure logic against the real data -----------------------------------

test('findContinueHref against the real data: resolves to a real, built journey page', () => {
  const href = findContinueHref(PAGES, {});
  const page = PAGES.find((p) => p.href === href);
  assert.ok(page, `${href} should be a real PAGES entry`);
  assert.equal(typeof page.position, 'number', `${href} should be a built journey page, not a reference/extension one`);
});

// --- The <noscript> fallback matches Pages.buildJourney exactly -----------
// Playwright always runs with scripting on, so this is checked by
// parsing the raw markup instead of ever actually rendering it.

function parseNoscriptJourney(html) {
  const noscriptMatch = /<noscript>([\s\S]*?)<\/noscript>/.exec(html);
  assert.ok(noscriptMatch, 'index.html should have a <noscript> fallback');
  const block = noscriptMatch[1];

  const phaseBlocks = [...block.matchAll(/<h3 class="journey-list-phase-heading">([^<]+)<\/h3>\s*<ol class="journey-list-steps">([\s\S]*?)<\/ol>/g)];
  assert.ok(phaseBlocks.length > 0, 'the noscript fallback should list at least one phase');

  return phaseBlocks.map(([, phase, stepsHtml]) => {
    const items = [...stepsHtml.matchAll(/<li class="journey-step(?: journey-step-coming-soon)?">([\s\S]*?)<\/li>/g)].map(([, inner]) => {
      const link = /<a class="journey-step-link" href="([^"]+)">([^<]+)<\/a>/.exec(inner);
      if (link) return { type: 'built', href: link[1], title: link[2] };
      const comingSoon = /<span class="journey-step-coming-soon-label">([^<]+) — coming soon<\/span>/.exec(inner);
      assert.ok(comingSoon, `unrecognised noscript step markup: ${inner}`);
      return { type: 'comingSoon', name: comingSoon[1] };
    });
    return { phase: phase.trim(), items };
  });
}

test('the <noscript> fallback names exactly the same phases, steps and order as Pages.buildJourney', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const noscriptJourney = parseNoscriptJourney(html);
  const realJourney = buildJourney(PAGES, COMING_SOON, PHASES);

  assert.deepEqual(noscriptJourney.map((p) => p.phase), realJourney.map((p) => p.phase), 'phases, in order');

  realJourney.forEach((realPhase, i) => {
    const noscriptPhase = noscriptJourney[i];
    assert.equal(noscriptPhase.items.length, realPhase.items.length, `"${realPhase.phase}": step count`);
    realPhase.items.forEach((realItem, j) => {
      const noscriptItem = noscriptPhase.items[j];
      if (realItem.type === 'built') {
        assert.equal(noscriptItem.type, 'built', `"${realPhase.phase}" step ${j + 1} should be a real link`);
        assert.equal(noscriptItem.href, realItem.page.href);
        assert.equal(noscriptItem.title, realItem.page.title);
      } else {
        assert.equal(noscriptItem.type, 'comingSoon', `"${realPhase.phase}" step ${j + 1} should be a coming-soon label`);
        assert.equal(noscriptItem.name, realItem.step.name);
      }
    });
  });
});

test('every built href in the noscript fallback resolves to a real file', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  parseNoscriptJourney(html).forEach(({ items }) => {
    items.filter((i) => i.type === 'built').forEach((item) => {
      assert.ok(fs.existsSync(path.join(ROOT, item.href)), `${item.href} should exist`);
    });
  });
});

// --- In a real browser ---------------------------------------------------

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/home.test.js');

let browser;
let launchError;

test.before(async () => {
  try {
    browser = await launchChromium();
  } catch (err) {
    launchError = err;
  }
});

test.after(async () => {
  if (browser) await browser.close();
});

test('index.html loads with no console or page errors', async (t) => {
  if (launchError) return skip(t, SKIP_MESSAGE(launchError));
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(String(err)));
  try {
    await page.goto('file://' + path.join(ROOT, 'index.html'));
    await page.waitForTimeout(200);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test('the hero illustration is an accessible <svg> with a non-empty title and description', async (t) => {
  if (launchError) return skip(t, SKIP_MESSAGE(launchError));
  const page = await browser.newPage();
  try {
    await page.goto('file://' + path.join(ROOT, 'index.html'));
    const info = await page.evaluate(() => {
      const svg = document.querySelector('.hero-illustration svg');
      if (!svg) return null;
      const titleId = svg.getAttribute('aria-labelledby')?.split(' ')[0];
      const descId = svg.getAttribute('aria-labelledby')?.split(' ')[1];
      return {
        role: svg.getAttribute('role'),
        title: titleId && document.getElementById(titleId)?.textContent.trim(),
        desc: descId && document.getElementById(descId)?.textContent.trim(),
      };
    });
    assert.ok(info, 'the hero illustration should be an <svg>');
    assert.equal(info.role, 'img');
    assert.ok(info.title && info.title.length > 0, 'the illustration should have a non-empty title');
    assert.ok(info.desc && info.desc.length > 0, 'the illustration should have a non-empty description');
  } finally {
    await page.close();
  }
});

test('the hero illustration is under about 180px tall at phone width', async (t) => {
  if (launchError) return skip(t, SKIP_MESSAGE(launchError));
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await page.goto('file://' + path.join(ROOT, 'index.html'));
    const height = await page.locator('.hero-illustration svg').evaluate((el) => el.getBoundingClientRect().height);
    assert.ok(height < 180, `hero illustration is ${height}px tall at phone width, expected under ~180px`);
  } finally {
    await page.close();
  }
});

test('reduced motion stops the hero\'s star-twinkle and rocket-drift animation', async (t) => {
  if (launchError) return skip(t, SKIP_MESSAGE(launchError));
  const page = await browser.newPage();
  try {
    await page.goto('file://' + path.join(ROOT, 'index.html'));

    const normalNames = await page.evaluate(() => [
      getComputedStyle(document.querySelector('.hero-star')).animationName,
      getComputedStyle(document.querySelector('.hero-rocket-drift')).animationName,
    ]);
    assert.ok(normalNames.every((n) => n !== 'none'), 'animations should run normally without reduced motion');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reducedNames = await page.evaluate(() => [
      getComputedStyle(document.querySelector('.hero-star')).animationName,
      getComputedStyle(document.querySelector('.hero-rocket-drift')).animationName,
    ]);
    assert.deepEqual(reducedNames, ['none', 'none'], 'animations should stop under prefers-reduced-motion: reduce');
  } finally {
    await page.close();
  }
});

test('every journey step in the card view is a real <a href>, reachable by keyboard, in journey order; coming-soon steps are never links', async (t) => {
  if (launchError) return skip(t, SKIP_MESSAGE(launchError));
  const page = await browser.newPage();
  try {
    await page.goto('file://' + path.join(ROOT, 'index.html'));

    const cardSteps = await page.$$eval('#unit-cards .journey-step', (lis) => lis.map((li) => {
      const a = li.querySelector('a.journey-step-link');
      return {
        comingSoon: li.classList.contains('journey-step-coming-soon'),
        href: a ? a.getAttribute('href') : null,
        text: (a ? a.textContent : li.querySelector('.journey-step-coming-soon-label')?.textContent || '').trim(),
        tag: a ? a.tagName : null,
      };
    }));

    assert.ok(cardSteps.length > 0);
    cardSteps.forEach((step) => {
      assert.ok(step.text.length > 0, 'every step should have a non-empty text label');
      if (step.comingSoon) {
        assert.equal(step.href, null, `coming-soon step "${step.text}" should not be a link`);
      } else {
        assert.equal(step.tag, 'A', `step "${step.text}" should be a real <a>`);
        assert.ok(step.href && step.href.length > 0, `step "${step.text}" should have a real href`);
        assert.ok(fs.existsSync(path.join(ROOT, step.href)), `${step.href} should resolve to an existing file`);
      }
    });

    // Keyboard reachability: every built step's link is a plain <a href>
    // with no explicit tabindex override, so it's in the natural tab
    // order — confirmed by tabbing from the page start and checking the
    // first journey link reached is the very first card's first step.
    const firstCardHref = cardSteps.find((s) => !s.comingSoon).href;
    let reachedFirstLink = false;
    for (let i = 0; i < 60 && !reachedFirstLink; i += 1) {
      await page.keyboard.press('Tab');
      reachedFirstLink = await page.evaluate(
        (href) => document.activeElement?.tagName === 'A' && document.activeElement.getAttribute('href') === href,
        firstCardHref
      );
    }
    assert.ok(reachedFirstLink, 'the first journey step should be reachable by tabbing from the top of the page');
  } finally {
    await page.close();
  }
});

test('"Show as list" toggles to the list view, and the list view shows exactly the same steps, in the same order, as the cards', async (t) => {
  if (launchError) return skip(t, SKIP_MESSAGE(launchError));
  const page = await browser.newPage();
  try {
    await page.goto('file://' + path.join(ROOT, 'index.html'));

    const cardHrefs = await page.$$eval('#unit-cards .journey-step-link', (as) => as.map((a) => a.getAttribute('href')));
    const cardComingSoon = await page.$$eval('#unit-cards .journey-step-coming-soon-label', (els) => els.map((el) => el.textContent.trim()));

    const cardsVisibleBefore = await page.locator('#unit-cards').isVisible();
    const listVisibleBefore = await page.locator('#journey-list').isVisible();
    assert.equal(cardsVisibleBefore, true);
    assert.equal(listVisibleBefore, false);

    await page.locator('#list-view-toggle').click();

    assert.equal(await page.locator('#unit-cards').isVisible(), false);
    assert.equal(await page.locator('#journey-list').isVisible(), true);
    assert.equal(await page.locator('#list-view-toggle').getAttribute('aria-pressed'), 'true');

    const listHrefs = await page.$$eval('#journey-list .journey-step-link', (as) => as.map((a) => a.getAttribute('href')));
    const listComingSoon = await page.$$eval('#journey-list .journey-step-coming-soon-label', (els) => els.map((el) => el.textContent.trim()));

    assert.deepEqual(listHrefs, cardHrefs, 'list view should show the same built steps, in the same order, as the cards');
    assert.deepEqual(listComingSoon, cardComingSoon, 'list view should show the same coming-soon steps, in the same order, as the cards');

    // Toggling back restores the card view.
    await page.locator('#list-view-toggle').click();
    assert.equal(await page.locator('#unit-cards').isVisible(), true);
    assert.equal(await page.locator('#journey-list').isVisible(), false);
  } finally {
    await page.close();
  }
});

test('the hero Continue and Start here buttons are real links to real, built journey pages', async (t) => {
  if (launchError) return skip(t, SKIP_MESSAGE(launchError));
  const page = await browser.newPage();
  try {
    await page.goto('file://' + path.join(ROOT, 'index.html'));
    const [continueHref, startHref] = await Promise.all([
      page.locator('#continue-button').getAttribute('href'),
      page.locator('#start-button').getAttribute('href'),
    ]);
    assert.ok(fs.existsSync(path.join(ROOT, continueHref)), `Continue (${continueHref}) should resolve to a real file`);
    assert.ok(fs.existsSync(path.join(ROOT, startHref)), `Start here (${startHref}) should resolve to a real file`);
    assert.equal(startHref, journeyPages(PAGES)[0].href, 'Start here should always point at the very first journey page');
  } finally {
    await page.close();
  }
});
