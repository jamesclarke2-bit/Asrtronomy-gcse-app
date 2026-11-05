/**
 * The picture-based "name that feature/line/pattern" questions on
 * notes/moon-structure.html, notes/earth-structure.html and
 * notes/naked-eye-sky.html: each one's render(container) redraws the
 * real map/globe/chart, so whether the right element actually gets
 * highlighted and whether the diagram leaks any label text is runtime
 * DOM state a real browser has to check — not something parseable from
 * the raw HTML or from the question files alone (same reasoning as
 * test/tidesPage.test.js and test/noHorizontalScroll.test.js).
 *
 * Checked at both a phone width (390px, matching
 * test/noHorizontalScroll.test.js's convention) and an iPad width
 * (768px, the classic iPad portrait CSS width), since the task that
 * added this quiz asked for both explicitly.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');

const MOON_PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'moon-structure.html');
const EARTH_PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'earth-structure.html');
const NAKED_EYE_SKY_PAGE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'naked-eye-sky.html');

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/pictureQuestions.test.js');

const VIEWPORTS = [
  { label: 'phone (390px)', width: 390, height: 800 },
  { label: 'iPad (768px)', width: 768, height: 1024 },
];

const MOON_FEATURES = [
  ['tranquility', 'Sea of Tranquility'],
  ['storms', 'Ocean of Storms'],
  ['crises', 'Sea of Crises'],
  ['tycho', 'Tycho'],
  ['copernicus', 'Copernicus'],
  ['kepler', 'Kepler'],
  ['apennines', 'Apennine Mountains'],
];

const EARTH_FEATURES = [
  ['northPole', 'North Pole'],
  ['arcticCircle', 'Arctic Circle'],
  ['tropicOfCancer', 'Tropic of Cancer'],
  ['equator', 'Equator'],
  ['tropicOfCapricorn', 'Tropic of Capricorn'],
  ['antarcticCircle', 'Antarctic Circle'],
  ['southPole', 'South Pole'],
  ['primeMeridian', 'Prime Meridian'],
];

const STAR_PATTERNS = [
  ['cassiopeia', 'Cassiopeia'],
  ['cygnus', 'Cygnus'],
  ['orion', 'Orion'],
  ['plough', 'The Plough'],
  ['southernCross', 'The Southern Cross'],
  ['summerTriangle', 'The Summer Triangle'],
  ['squareOfPegasus', 'The Square of Pegasus'],
];

async function withPage(t, url, viewport, run) {
  let browser;
  try {
    browser = await launchChromium();
  } catch (err) {
    skip(t, SKIP_MESSAGE(err));
    return;
  }
  try {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    await page.goto(url);
    // The picture questions live inside a collapsed <details> panel (see
    // notes/earth-structure.html's "Picture quiz: name that line" and
    // notes/moon-structure.html's "Picture quiz: name that feature") —
    // open it so the questions inside are actually visible/interactable.
    await page.evaluate(() => document.querySelectorAll('details.picture-quiz-panel').forEach((d) => (d.open = true)));
    await page.waitForTimeout(200);
    await run(page);
  } finally {
    await browser.close();
  }
}

// Finds the .question-card that highlights `term` (the moon/earth pages'
// .diagram-feature-highlight[data-term]) — identifies a question by its
// content rather than its position, since quiz-ui.js now renders
// questions in a shuffled order every time.
function questionDiagramLocatorByTerm(page, term) {
  return page.locator(`.question-card:has(.diagram-feature-highlight[data-term="${term}"])`).locator('.question-diagram');
}

// Same idea for "name that pattern" cards, identified by the pattern id
// on their .pattern-chart (see renderPatternQuizDiagram in
// notes/naked-eye-sky.js) rather than render position.
function questionDiagramLocatorByPattern(page, patternId) {
  return page.locator(`.question-card:has(.pattern-chart[data-pattern="${patternId}"])`).locator('.question-diagram');
}

// The diagram's own visible text, same as innerText(), but with
// diagramEnlarge.js's "Enlarge" button text left out — that button is
// unrelated UI chrome every diagram gets, not a label the quiz drew, so
// it shouldn't count as a spoiler leak below.
async function visibleQuizDiagramText(diagram) {
  return (
    await diagram.evaluate((el) => {
      const buttons = [...el.querySelectorAll('.diagram-enlarge-button')];
      const prevDisplay = buttons.map((b) => b.style.display);
      buttons.forEach((b) => (b.style.display = 'none'));
      const text = el.innerText;
      buttons.forEach((b, i) => (b.style.display = prevDisplay[i]));
      return text;
    })
  ).trim();
}

VIEWPORTS.forEach((viewport) => {
  test(`notes/moon-structure.html "name that feature" at ${viewport.label}: every feature's diagram highlights exactly that feature, with no visible label text`, async (t) => {
    await withPage(t, MOON_PAGE_URL, viewport, async (page) => {
      for (let i = 0; i < MOON_FEATURES.length; i += 1) {
        const [term, name] = MOON_FEATURES[i];
        const diagram = questionDiagramLocatorByTerm(page, term);
        await assert.doesNotReject(diagram.waitFor({ state: 'attached' }), `no diagram found for feature #${i} (${name})`);

        const highlighted = diagram.locator('.diagram-feature-highlight');
        assert.equal(await highlighted.count(), 1, `expected exactly one highlighted element for ${name}`);
        assert.equal(await highlighted.getAttribute('data-term'), term, `highlighted element should be ${term}`);

        // The only text the quiz marker itself is allowed to add is its
        // own "?" (see applyFeatureQuizHighlight/drawQuizArrow) — never
        // the feature's actual name, which would spoil the question.
        const visibleText = await visibleQuizDiagramText(diagram);
        const markerText = await diagram.evaluate((el) => {
          const text = el.querySelector('.quiz-feature-marker text');
          return text ? text.textContent.trim() : '';
        });
        assert.equal(visibleText, markerText, `diagram for ${name} should carry no visible label text beyond the marker's own "?", got "${visibleText}"`);
      }
    });
  });

  test(`notes/earth-structure.html "name that line" at ${viewport.label}: every feature's diagram highlights exactly that feature, with no visible label text`, async (t) => {
    await withPage(t, EARTH_PAGE_URL, viewport, async (page) => {
      for (let i = 0; i < EARTH_FEATURES.length; i += 1) {
        const [term, name] = EARTH_FEATURES[i];
        const diagram = questionDiagramLocatorByTerm(page, term);
        await assert.doesNotReject(diagram.waitFor({ state: 'attached' }), `no diagram found for feature #${i} (${name})`);

        const highlighted = diagram.locator('.diagram-feature-highlight');
        assert.equal(await highlighted.count(), 1, `expected exactly one highlighted element for ${name}`);
        assert.equal(await highlighted.getAttribute('data-term'), term, `highlighted element should be ${term}`);

        // The only text the quiz marker itself is allowed to add is its
        // own "?" (see applyLineQuizHighlight/drawQuizArrow) — never the
        // feature's actual name, which would spoil the question.
        const visibleText = await visibleQuizDiagramText(diagram);
        const markerText = await diagram.evaluate((el) => {
          const text = el.querySelector('.quiz-feature-marker text');
          return text ? text.textContent.trim() : '';
        });
        assert.equal(visibleText, markerText, `diagram for ${name} should carry no visible label text beyond the marker's own "?", got "${visibleText}"`);
      }
    });
  });

  test(`notes/naked-eye-sky.html "name that pattern" at ${viewport.label}: every pattern's own chart is drawn (stars, but no star-name labels)`, async (t) => {
    await withPage(t, NAKED_EYE_SKY_PAGE_URL, viewport, async (page) => {
      for (let i = 0; i < STAR_PATTERNS.length; i += 1) {
        const [patternId, name] = STAR_PATTERNS[i];
        const diagram = questionDiagramLocatorByPattern(page, patternId);
        await assert.doesNotReject(diagram.waitFor({ state: 'attached' }), `no diagram found for pattern #${i} (${name})`);

        const starCount = await diagram.locator('circle').count();
        assert.ok(starCount > 0, `diagram for pattern #${i} should draw at least one star`);

        const visibleText = await visibleQuizDiagramText(diagram);
        assert.equal(visibleText, '', `diagram for pattern #${i} should carry no visible label text, got "${visibleText}"`);
      }
    });
  });
});

test('notes/moon-structure.html: answering a "name that feature" question correctly checks out, and is recorded in the usual u2.20 tally', async (t) => {
  await withPage(t, MOON_PAGE_URL, VIEWPORTS[0], async (page) => {
    const card = page.locator('.question-card', { has: page.locator('.question-prompt', { hasText: 'Name that feature' }) }).first();
    const term = await card.locator('.diagram-feature-highlight').getAttribute('data-term');
    const name = MOON_FEATURES.find(([t]) => t === term)[1];

    const progressBefore = await page.locator('#progress-list li', { hasText: 'u2.20' }).textContent();
    const attemptsBefore = Number(progressBefore.match(/(\d+)\/(\d+) correct/)[2]);

    await card.locator('label.choice-option', { hasText: name }).locator('input[type="radio"]').check();
    await card.locator('button', { hasText: 'Check answer' }).click();

    const feedback = (await card.locator('.question-feedback').textContent()).trim();
    assert.match(feedback, /^Correct!/);

    const progressAfter = await page.locator('#progress-list li', { hasText: 'u2.20' }).textContent();
    const attemptsAfter = Number(progressAfter.match(/(\d+)\/(\d+) correct/)[2]);
    assert.equal(attemptsAfter, attemptsBefore + 1, 'u2.20 attempts should have gone up by one');
  });
});

test('notes/earth-structure.html: answering a "name that line" question correctly checks out, and is recorded in the usual u2.1 tally', async (t) => {
  await withPage(t, EARTH_PAGE_URL, VIEWPORTS[0], async (page) => {
    const card = page.locator('.question-card', { has: page.locator('.question-prompt', { hasText: 'Name that line' }) }).first();
    const term = await card.locator('.diagram-feature-highlight').getAttribute('data-term');
    const name = EARTH_FEATURES.find(([t]) => t === term)[1];

    const progressBefore = await page.locator('#progress-list li', { hasText: 'u2.1 ' }).first().textContent();
    const attemptsBefore = Number(progressBefore.match(/(\d+)\/(\d+) correct/)[2]);

    await card.locator('label.choice-option', { hasText: name }).locator('input[type="radio"]').check();
    await card.locator('button', { hasText: 'Check answer' }).click();

    const feedback = (await card.locator('.question-feedback').textContent()).trim();
    assert.match(feedback, /^Correct!/);

    const progressAfter = await page.locator('#progress-list li', { hasText: 'u2.1 ' }).first().textContent();
    const attemptsAfter = Number(progressAfter.match(/(\d+)\/(\d+) correct/)[2]);
    assert.equal(attemptsAfter, attemptsBefore + 1, 'u2.1 attempts should have gone up by one');
  });
});

test('notes/naked-eye-sky.html: answering a "name that pattern" question correctly checks out, and is recorded in the usual u1.2 tally', async (t) => {
  await withPage(t, NAKED_EYE_SKY_PAGE_URL, VIEWPORTS[0], async (page) => {
    const [patternId, name] = STAR_PATTERNS.find(([id]) => id === 'orion');
    const card = page.locator(`.question-card:has(.pattern-chart[data-pattern="${patternId}"])`);

    const progressBefore = await page.locator('#progress-list li', { hasText: 'u1.2 ' }).first().textContent();
    const attemptsBefore = Number(progressBefore.match(/(\d+)\/(\d+) correct/)[2]);

    await card.locator('label.choice-option', { hasText: name }).locator('input[type="radio"]').check();
    await card.locator('button', { hasText: 'Check answer' }).click();

    const feedback = (await card.locator('.question-feedback').textContent()).trim();
    assert.match(feedback, /^Correct!/);

    const progressAfter = await page.locator('#progress-list li', { hasText: 'u1.2 ' }).first().textContent();
    const attemptsAfter = Number(progressAfter.match(/(\d+)\/(\d+) correct/)[2]);
    assert.equal(attemptsAfter, attemptsBefore + 1, 'u1.2 attempts should have gone up by one');
  });
});
