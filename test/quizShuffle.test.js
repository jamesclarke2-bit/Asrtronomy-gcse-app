/**
 * Quiz unpredictability: quiz-ui.js's renderQuestions() (shared by
 * mount() and mountGroup(), so by every quiz sitewide, including the
 * "Name that feature"/"Name that line"/"name that pattern" matching
 * games) now renders a freshly shuffled copy of its questions every
 * time, and buildSingleInput()'s 'choice' branch renders a shuffled
 * copy of the answer options — so a reload never shows the same
 * question order or answer-option layout twice, and the correct answer
 * is never pinned to one position. naked-eye-sky.html's "Which is it?"
 * game is a separate, hand-built flow (see quiz-ui.js's own header
 * comment) but uses the same shared QuizUI.shuffleAvoidingAdjacent for
 * its own round order, checked separately below.
 *
 * A real browser check (Playwright, same engine scripts/screenshots.js
 * already uses), since rendered DOM order and which radio button ends
 * up where are exactly what a raw-HTML parse can't see.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');

const MOON_URL = 'file://' + path.join(__dirname, '..', 'notes', 'moon-structure.html');
const EARTH_URL = 'file://' + path.join(__dirname, '..', 'notes', 'earth-structure.html');
const SKY_URL = 'file://' + path.join(__dirname, '..', 'notes', 'naked-eye-sky.html');

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/quizShuffle.test.js');

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

async function freshPage(url) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
  await page.goto(url);
  await page.evaluate(() => document.querySelectorAll('details.picture-quiz-panel').forEach((d) => (d.open = true)));
  await page.waitForTimeout(200);
  return page;
}

// The rendered order of a "Name that X" picture-quiz group's own
// identifying attribute: data-term for Moon/Earth's
// .diagram-feature-highlight, data-pattern for naked-eye-sky's own
// .pattern-chart (see renderPatternQuizDiagram in notes/naked-eye-sky.js).
async function renderedOrder(page, promptPrefix, identifyingSelector, dataKey) {
  return page.evaluate(
    ({ promptPrefix, identifyingSelector, dataKey }) => {
      const cards = Array.from(document.querySelectorAll('.question-card')).filter((card) =>
        card.querySelector('.question-prompt').textContent.startsWith(promptPrefix)
      );
      return cards.map((card) => card.querySelector(identifyingSelector).dataset[dataKey]);
    },
    { promptPrefix, identifyingSelector, dataKey }
  );
}

function sameSet(a, b) {
  return a.length === b.length && [...a].sort().join(',') === [...b].sort().join(',');
}

// --- "Name that feature"/"Name that line"/"name that pattern": shared
// renderQuestions() shuffle ------------------------------------------

const GROUPS = [
  { label: 'notes/moon-structure.html "Name that feature"', url: MOON_URL, promptPrefix: 'Name that feature', selector: '.diagram-feature-highlight', dataKey: 'term', expectedCount: 7 },
  { label: 'notes/earth-structure.html "Name that line"', url: EARTH_URL, promptPrefix: 'Name that line', selector: '.diagram-feature-highlight', dataKey: 'term', expectedCount: 8 },
  { label: 'notes/naked-eye-sky.html "name that pattern"', url: SKY_URL, promptPrefix: 'Name that pattern', selector: '.pattern-chart', dataKey: 'pattern', expectedCount: 7 },
];

GROUPS.forEach(({ label, url, promptPrefix, selector, dataKey, expectedCount }) => {
  test(`${label}: every item is still the answer exactly once per round`, async (t) => {
    if (launchError) {
      skip(t, SKIP_MESSAGE(launchError));
      return;
    }
    const page = await freshPage(url);
    try {
      const order = await renderedOrder(page, promptPrefix, selector, dataKey);
      assert.equal(order.length, expectedCount, `expected ${expectedCount} questions in this group`);
      assert.equal(new Set(order).size, expectedCount, `every question should be a different item, got [${order}]`);
    } finally {
      await page.close();
    }
  });

  test(`${label}: two rounds (reloads) render the questions in a different order`, async (t) => {
    if (launchError) {
      skip(t, SKIP_MESSAGE(launchError));
      return;
    }
    // Five reloads rather than two, so a shuffle that coincidentally
    // lands on the same order once (1 in ~5000+ for these group sizes)
    // doesn't make this test flaky.
    const orders = [];
    for (let i = 0; i < 5; i += 1) {
      const page = await freshPage(url);
      try {
        orders.push(await renderedOrder(page, promptPrefix, selector, dataKey));
      } finally {
        await page.close();
      }
    }
    orders.forEach((order) => assert.ok(sameSet(order, orders[0]), `every reload should still show the same set of items, got [${order}]`));
    const allIdentical = orders.every((order) => order.join(',') === orders[0].join(','));
    assert.ok(!allIdentical, `expected at least two different orders across 5 reloads, got the same order every time: [${orders[0]}]`);
  });
});

// --- "Name that feature": the correct answer's position among the
// choice options varies, not just the question order ------------------

test('notes/moon-structure.html "Name that feature": the correct answer\'s position among the choice options varies across reloads', async (t) => {
  if (launchError) {
    skip(t, SKIP_MESSAGE(launchError));
    return;
  }
  const TERM = 'tycho';
  const CORRECT_NAME = 'Tycho';
  const positions = [];
  for (let i = 0; i < 6; i += 1) {
    const page = await freshPage(MOON_URL);
    try {
      const position = await page.evaluate(
        ({ term, correctName }) => {
          const card = Array.from(document.querySelectorAll('.question-card')).find(
            (c) => c.querySelector('.diagram-feature-highlight')?.dataset.term === term
          );
          const labels = Array.from(card.querySelectorAll('.choice-option')).map((l) => l.textContent.trim());
          return labels.indexOf(correctName);
        },
        { term: TERM, correctName: CORRECT_NAME }
      );
      assert.ok(position >= 0, `expected to find "${CORRECT_NAME}" among the choice options`);
      positions.push(position);
    } finally {
      await page.close();
    }
  }
  assert.ok(new Set(positions).size > 1, `expected the correct answer's position to vary across reloads, got the same position every time: [${positions}]`);
});

// --- "Which is it?": its own round-order and per-question shuffling ---

// Plays one full "Which is it?" round by always tapping the first
// option (whichever answer that turns out to be), reading off which
// option the game marks .is-correct after each tap (always the right
// one, win or lose — see renderWhichIsItRound's answer() in
// notes/naked-eye-sky.js) and its position among that question's six
// options, then advancing. Returns the round's own sequence of correct
// titles and positions — the round's effective "question order" and
// "correct answer position" without needing to read any page-internal
// state directly.
async function playWhichIsItRound(page) {
  const correctTitles = [];
  const correctPositions = [];
  while ((await page.locator('.which-is-it-options').count()) > 0) {
    const titlesBefore = await page.locator('.which-is-it-option-title').allTextContents();
    await page.locator('.which-is-it-option').first().click();
    const correctTitle = await page.locator('.which-is-it-option.is-correct .which-is-it-option-title').textContent();
    correctTitles.push(correctTitle);
    correctPositions.push(titlesBefore.indexOf(correctTitle));
    await page.locator('.which-is-it-next').click();
  }
  return { correctTitles, correctPositions };
}

test('notes/naked-eye-sky.html "Which is it?": every picture is still the answer exactly once per round', async (t) => {
  if (launchError) {
    skip(t, SKIP_MESSAGE(launchError));
    return;
  }
  const page = await freshPage(SKY_URL);
  try {
    const { correctTitles } = await playWhichIsItRound(page);
    assert.ok(correctTitles.length > 0, 'expected at least one question in the round');
    assert.equal(new Set(correctTitles).size, correctTitles.length, `every question in a round should be a different picture, got [${correctTitles}]`);
  } finally {
    await page.close();
  }
});

test('notes/naked-eye-sky.html "Which is it?": two rounds (reloads) produce a different question order', async (t) => {
  if (launchError) {
    skip(t, SKIP_MESSAGE(launchError));
    return;
  }
  const page1 = await freshPage(SKY_URL);
  const round1 = await playWhichIsItRound(page1);
  await page1.close();

  const page2 = await freshPage(SKY_URL);
  const round2 = await playWhichIsItRound(page2);
  await page2.close();

  assert.ok(sameSet(round1.correctTitles, round2.correctTitles), 'both rounds should cover the same set of pictures');
  assert.notDeepEqual(round1.correctTitles, round2.correctTitles, `expected the two rounds to run in a different order, got the same order twice: [${round1.correctTitles}]`);
});

test('notes/naked-eye-sky.html "Which is it?": the correct answer\'s position among the six options varies within a round', async (t) => {
  if (launchError) {
    skip(t, SKIP_MESSAGE(launchError));
    return;
  }
  const page = await freshPage(SKY_URL);
  try {
    const { correctPositions } = await playWhichIsItRound(page);
    assert.ok(
      new Set(correctPositions).size > 1,
      `expected the correct answer's position to vary across a round's own questions, got the same position every time: [${correctPositions}]`
    );
  } finally {
    await page.close();
  }
});
