/**
 * notes/privacy.html's own "Clear my saved progress" button: the pure
 * clearing logic against a fake storage object, a cross-check that it
 * targets the same key quiz-ui.js itself reads and writes, and (in a
 * real browser) the full click -> localStorage cleared -> confirmation
 * flow.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');
const { STORAGE_KEY, clearSavedProgress } = require('../notes/privacy');

const ROOT = path.join(__dirname, '..');

// --- clearSavedProgress, pure logic -----------------------------------

function fakeStorage(initial) {
  const data = { ...initial };
  return {
    removeItem(key) {
      delete data[key];
    },
    getItem(key) {
      return key in data ? data[key] : null;
    },
  };
}

test('clearSavedProgress removes exactly the astro-quiz-progress entry', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: '{"u1.1":{"attempts":3,"correct":2}}' });
  clearSavedProgress(storage);
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test('clearSavedProgress leaves any other localStorage entry untouched', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: '{}', somethingElse: 'kept' });
  clearSavedProgress(storage);
  assert.equal(storage.getItem('somethingElse'), 'kept');
});

test('clearSavedProgress on an already-empty storage does not throw', () => {
  const storage = fakeStorage({});
  assert.doesNotThrow(() => clearSavedProgress(storage));
});

test("STORAGE_KEY matches quiz-ui.js's own storage key, so this page clears what that one actually writes", () => {
  const quizUiSource = fs.readFileSync(path.join(ROOT, 'quiz-ui.js'), 'utf8');
  assert.match(
    quizUiSource,
    new RegExp(`STORAGE_KEY\\s*=\\s*'${STORAGE_KEY}'`),
    "quiz-ui.js's own STORAGE_KEY constant should equal notes/privacy.js's STORAGE_KEY"
  );
});

// --- The button, in a real browser -------------------------------------

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/privacy.test.js');

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

test('the Clear my saved progress button removes the real localStorage entry and shows a confirmation', async (t) => {
  if (launchError) {
    skip(t, SKIP_MESSAGE(launchError));
    return;
  }
  const page = await browser.newPage();
  try {
    await page.goto('file://' + path.join(ROOT, 'notes/privacy.html'));
    await page.evaluate((key) => window.localStorage.setItem(key, '{"u1.1":{"attempts":1,"correct":1}}'), STORAGE_KEY);

    const before = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
    assert.ok(before, 'sanity check: the entry exists before clicking');

    const statusBefore = await page.$eval('#clear-progress-status', (el) => el.textContent);
    assert.equal(statusBefore, '', 'sanity check: no confirmation shown yet');

    await page.click('#clear-progress-button');

    const after = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
    assert.equal(after, null, 'the entry should be gone after clicking');

    const statusAfter = await page.$eval('#clear-progress-status', (el) => el.textContent);
    assert.match(statusAfter, /removed/i, 'the button should confirm the clear');
  } finally {
    await page.close();
  }
});

test('clicking the button when there was nothing saved still shows the confirmation, without throwing', async (t) => {
  if (launchError) {
    skip(t, SKIP_MESSAGE(launchError));
    return;
  }
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err));
  try {
    await page.goto('file://' + path.join(ROOT, 'notes/privacy.html'));
    await page.click('#clear-progress-button');
    const statusAfter = await page.$eval('#clear-progress-status', (el) => el.textContent);
    assert.match(statusAfter, /removed/i);
    assert.deepEqual(pageErrors, []);
  } finally {
    await page.close();
  }
});
