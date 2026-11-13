/**
 * diagramEnlarge.js gives each worth-enlarging diagram (or a grouped row
 * of small ones — see that file's own header) a small "Enlarge" button,
 * opening it in a full-screen <dialog> cropped and scaled to fit the
 * screen. A real browser check (Playwright, same engine
 * scripts/screenshots.js already uses), since button wiring, <dialog>
 * open/close behaviour and rendered size are exactly what a DOM shim or
 * raw-HTML parse can't see.
 *
 * Checked at a phone width (390px, same convention as
 * test/noHorizontalScroll.test.js), an iPad width (768px) and a laptop
 * width (1280px, the task's own third size).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { launchChromium, trackSkips } = require('./browserLaunch');

const ROOT = path.join(__dirname, '..');

function listHtmlFiles() {
  const dirs = ['notes', 'sims'];
  const files = [];
  dirs.forEach((dir) => {
    fs.readdirSync(path.join(ROOT, dir))
      .filter((f) => f.endsWith('.html'))
      .forEach((f) => files.push(path.posix.join(dir, f)));
  });
  return files;
}

const PAGES = listHtmlFiles();
const WIDTHS = [
  { label: 'phone', width: 390, height: 800 },
  { label: 'iPad', width: 768, height: 1024 },
  { label: '1280', width: 1280, height: 900 },
];

// At least one of the enlarged picture's two dimensions must fill this
// much of its dialog — the dialog sizes itself to the picture (see
// styles.css's .diagram-enlarge-dialog), so a picture that only fills a
// sliver of it would mean the sizing math is off, not that the dialog
// has legitimate extra chrome.
const MIN_DIALOG_FILL_FRACTION = 0.7;

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/diagramEnlarge.test.js');

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

async function openPage(href, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto('file://' + path.join(ROOT, href));
  await page.waitForTimeout(300);
  return page;
}

// --- Every figure has exactly one button — including after grouping ----

PAGES.forEach((href) => {
  test(`${href}: every figure has exactly one Enlarge button, including grouped rows`, async (t) => {
    if (launchError) {
      skip(t, SKIP_MESSAGE(launchError));
      return;
    }
    const page = await openPage(href, 390, 800);
    try {
      const result = await page.evaluate(() => {
        const sources = [...document.querySelectorAll('.diagram-enlarge-source')];
        const multiButtonSources = sources.filter((el) => el.querySelectorAll(':scope > .diagram-enlarge-button').length > 1);
        // A grouped .diagram-row (one that itself is a source) must be
        // the ONLY place its own small .diagram children's buttons
        // live — none of them should also carry their own.
        const groupedRows = sources.filter((el) => el.classList.contains('diagram-row'));
        const leakedChildButtons = groupedRows.flatMap((row) =>
          [...row.querySelectorAll('.diagram')].filter((d) => d.querySelector(':scope > .diagram-enlarge-button'))
        ).length;
        return {
          sourceCount: sources.length,
          buttonCount: document.querySelectorAll('.diagram-enlarge-button').length,
          multiButtonSourceCount: multiButtonSources.length,
          leakedChildButtons,
        };
      });
      assert.equal(result.multiButtonSourceCount, 0, `${href}: a diagram source should never carry more than one button`);
      assert.equal(result.leakedChildButtons, 0, `${href}: a grouped row's own small pictures shouldn't also carry their own button`);
      assert.equal(result.buttonCount, result.sourceCount, `${href}: every button should belong to exactly one source, and vice versa`);
    } finally {
      await page.close();
    }
  });
});

// --- Open/close behaviour, and fit-to-screen sizing, per diagram --------

PAGES.forEach((href) => {
  WIDTHS.forEach(({ label, width, height }) => {
    test(`${href} at ${label} width: every enlarged diagram fits the viewport and fills most of its dialog`, async (t) => {
      if (launchError) {
        skip(t, SKIP_MESSAGE(launchError));
        return;
      }
      const page = await openPage(href, width, height);
      try {
        const buttons = await page.locator('.diagram-enlarge-button:visible').all();
        if (buttons.length === 0) {
          t.skip(`${href} has no visible, worth-enlarging diagram at ${label} width`);
          return;
        }
        const dialog = page.locator('dialog.diagram-enlarge-dialog');
        for (let i = 0; i < buttons.length; i += 1) {
          const button = buttons[i];
          await button.click();
          await dialog.waitFor({ state: 'visible' });

          const metrics = await page.evaluate(() => {
            const d = document.querySelector('dialog.diagram-enlarge-dialog').getBoundingClientRect();
            const c = document.querySelector('.diagram-enlarge-crop-box').getBoundingClientRect();
            return {
              dialog: { left: d.left, top: d.top, right: d.right, bottom: d.bottom, width: d.width, height: d.height },
              crop: { width: c.width, height: c.height },
              viewportWidth: window.innerWidth,
              viewportHeight: window.innerHeight,
            };
          });

          assert.ok(
            metrics.dialog.left >= -0.5 &&
              metrics.dialog.top >= -0.5 &&
              metrics.dialog.right <= metrics.viewportWidth + 0.5 &&
              metrics.dialog.bottom <= metrics.viewportHeight + 0.5,
            `${href} at ${label} (diagram #${i}): dialog (${JSON.stringify(metrics.dialog)}) should fit inside the ${metrics.viewportWidth}x${metrics.viewportHeight} viewport with no overflow`
          );

          const fillWidth = metrics.crop.width / metrics.dialog.width;
          const fillHeight = metrics.crop.height / metrics.dialog.height;
          assert.ok(
            fillWidth >= MIN_DIALOG_FILL_FRACTION || fillHeight >= MIN_DIALOG_FILL_FRACTION,
            `${href} at ${label} (diagram #${i}): the enlarged picture should fill at least ${MIN_DIALOG_FILL_FRACTION * 100}% of its dialog's width or height — got ${(fillWidth * 100).toFixed(1)}% width, ${(fillHeight * 100).toFixed(1)}% height`
          );

          await page.locator('.diagram-enlarge-close').click();
          await dialog.waitFor({ state: 'hidden' });
        }
      } finally {
        await page.close();
      }
    });
  });
});

// --- Close behaviour (button, Escape, outside tap), on EVERY diagram on
// the page, and — the actual bug this guards against (see diagramEnlarge.js's
// own openDiagram comment) — that the diagram is genuinely restored
// afterwards: back in <main>, not stranded inside the now-closed (display:
// none) dialog, and visibly rendered rather than collapsed to nothing.
// Deliberately NOT compared pixel-for-pixel against an earlier snapshot: a
// handful of this site's diagrams (a variable-height year wheel, an
// autoplaying sim's clock) legitimately redraw at a different size between
// one measurement and the next for reasons that have nothing to do with
// enlarging — the actual bug's own signature (collapsed to 0, reparented
// into the dialog) is unambiguous enough not to need that comparison. ------

// A diagram reparented back into the closed dialog (the bug) still reports
// a non-null parent and isConnected: true — only its place in the tree and
// its rendered size (collapsed to 0, since its ancestor dialog has no
// `open` attribute and so is display:none) give it away.
async function captureDiagramState(page, button) {
  return button.evaluate((btn) => {
    const container = btn.closest('.diagram-enlarge-source');
    const rect = container.getBoundingClientRect();
    return { inMain: !!container.closest('main'), inDialog: !!container.closest('dialog'), width: rect.width, height: rect.height };
  });
}

// A minimum that's obviously not "collapsed to 0" (the bug's own
// signature) but well under any diagram's real rendered size on this site.
const MIN_VISIBLE_SIZE_PX = 20;

// Reported per close method (button, Escape, tap outside — double-fired
// click has its own dedicated test further down) via node:test's nested
// subtests, so "which pages were tested vs skipped" and "pass vs fail" can
// be read off per method, not only per page. A page's skip reason here is
// ALWAYS "this page has no Enlarge button to test at all" (buttonCount ===
// 0) — never anything to do with a slider: closing, restoring and
// redrawing have nothing to do with how many sliders share a diagram's
// section, so that ambiguity (which the slider-redraw test further below
// legitimately can hit) must never leak into this one. Every close method
// subtest runs (or explicitly skips, for the same buttonCount === 0
// reason) on every page, so the per-method tallies always cover the same
// set of pages.
const CLOSE_METHODS = [
  { name: 'button', run: (page) => page.locator('.diagram-enlarge-close').click() },
  { name: 'Escape', run: (page) => page.keyboard.press('Escape') },
  { name: 'tap outside', run: (page) => page.mouse.click(1, 1) },
];

PAGES.forEach((href) => {
  test(`${href}: every Enlarge closes correctly, restoring the diagram each time`, async (t) => {
    if (launchError) {
      skip(t, SKIP_MESSAGE(launchError));
      return;
    }
    const page = await openPage(href, 390, 800);
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    try {
      const buttonCount = await page.locator('.diagram-enlarge-button:visible').count();
      const dialog = page.locator('dialog.diagram-enlarge-dialog');

      for (const { name, run } of CLOSE_METHODS) {
        await t.test(`close via ${name}`, async (st) => {
          if (buttonCount === 0) {
            st.skip(`${href} has no visible, worth-enlarging diagram at phone width`);
            return;
          }
          for (let i = 0; i < buttonCount; i += 1) {
            const button = page.locator('.diagram-enlarge-button:visible').nth(i);

            await button.click();
            await dialog.waitFor({ state: 'visible' });
            assert.equal(await page.evaluate(() => document.querySelector('dialog.diagram-enlarge-dialog').open), true);

            await run(page);
            await dialog.waitFor({ state: 'hidden' });
            assert.equal(await page.evaluate(() => document.querySelector('dialog.diagram-enlarge-dialog').open), false);

            const after = await captureDiagramState(page, button);
            assert.ok(after.inMain, `${href} diagram #${i} (close via ${name}): should be back inside <main>, not left in the dialog`);
            assert.ok(!after.inDialog, `${href} diagram #${i} (close via ${name}): should no longer be inside the dialog`);
            assert.ok(
              after.width > MIN_VISIBLE_SIZE_PX && after.height > MIN_VISIBLE_SIZE_PX,
              `${href} diagram #${i} (close via ${name}): should be visible again, not collapsed (got ${after.width}x${after.height})`
            );
          }
        });
      }
      assert.deepEqual(pageErrors, [], `${href}: no uncaught page errors during open/close`);
    } finally {
      await page.close();
    }
  });
});

// --- The actual bug: a fast tap (or anything else) firing the enlarge
// button's click handler twice in quick succession, before the first
// showModal() has settled, used to re-capture originalParent/
// originalNextSibling as the dialog's own crop box — so closing afterwards
// reinserted the diagram into the (now display:none) dialog instead of
// restoring it to the page, and it simply vanished. Guarded in
// diagramEnlarge.js's openDiagram by ignoring a second open request while
// the dialog is already open. -----------------------------------------------

PAGES.forEach((href) => {
  test(`${href}: a double-fired click on Enlarge (e.g. a fast tap) doesn't strand the diagram in the dialog`, async (t) => {
    if (launchError) {
      skip(t, SKIP_MESSAGE(launchError));
      return;
    }
    const page = await openPage(href, 390, 800);
    try {
      const buttonCount = await page.locator('.diagram-enlarge-button:visible').count();
      if (buttonCount === 0) {
        t.skip(`${href} has no visible, worth-enlarging diagram at phone width`);
        return;
      }
      const button = page.locator('.diagram-enlarge-button:visible').first();

      await button.evaluate((btn) => {
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      });
      await page.locator('dialog.diagram-enlarge-dialog').waitFor({ state: 'visible' });
      await page.locator('.diagram-enlarge-close').click();
      await page.locator('dialog.diagram-enlarge-dialog').waitFor({ state: 'hidden' });

      const after = await captureDiagramState(page, button);
      assert.ok(after.inMain, `${href}: the double-clicked diagram should be back inside <main>, not stranded in the dialog`);
      assert.ok(!after.inDialog, `${href}: the double-clicked diagram should no longer be inside the dialog`);
      assert.ok(
        after.width > MIN_VISIBLE_SIZE_PX && after.height > MIN_VISIBLE_SIZE_PX,
        `${href}: the double-clicked diagram should be visible again, not collapsed (got ${after.width}x${after.height})`
      );
    } finally {
      await page.close();
    }
  });
});

// --- Interactivity survives restore: for a diagram with its own slider,
// moving it after a close still redraws — a generic DOM-diff check (not
// pixel comparison, so it also catches a <canvas>-based diagram, whose
// content never shows up in any DOM diff at all, and skips those instead of
// false-failing on them; see diagramEnlarge.js's own header on treating a
// canvas as its own interactive content, never "the diagram"). -------------

// A diagram container's own control(s) — the <div class="control">/
// .control-panel block(s) holding its slider(s) — are its immediate
// following siblings, ending as soon as another .diagram/.question-diagram/
// .diagram-row sibling starts (that marks the START of a DIFFERENT
// diagram's own controls). A slider placed anywhere else (above the
// diagram, say, or in a shared control block) also counts as the diagram's
// own when its aria-controls names the diagram or something inside it. This
// correctly tells apart, say,
// notes/magnitude.html's "bright but far" two-panel row (whose own next
// siblings are its Swap button and readouts, with no slider, before the
// NEXT diagram begins) from that same section's idea-diagram three
// siblings later (whose own next sibling IS its slider) — both in the
// very same <section>, sharing nothing in common except that section.
// Defined identically inside each evaluate() callback below (not shared
// via closure, and never via eval/new Function — every page's own CSP,
// script-src 'self' with no unsafe-eval, would block that) since each
// callback runs inside the browser with no access to this file's scope.

// Every (non-canvas) enlargeable diagram that has a slider OF ITS OWN
// this way is checked — not just one page-wide "unambiguous" pick, and a
// second diagram merely sharing the same <section> no longer excuses
// skipping either. The ONLY legitimate reason to skip is that NO
// enlargeable diagram on the page has a slider of its own this way —
// never "a slider exists somewhere in the same section".
PAGES.forEach((href) => {
  test(`${href}: after Enlarge closes, a diagram's own slider (if it has one, and isn't canvas-based) still redraws it`, async (t) => {
    if (launchError) {
      skip(t, SKIP_MESSAGE(launchError));
      return;
    }
    // Phone width first. A wide, short diagram gains nothing from Enlarge
    // on a phone, so gets no Enlarge button there; if no diagram has one
    // with a slider of its own at phone width, try again at iPad width
    // before skipping.
    let page = null;
    let candidateIndices = [];
    for (const [width, height] of [[390, 800], [768, 1024]]) {
      if (page) await page.close();
      page = await openPage(href, width, height);
      candidateIndices = await page.evaluate(() => {
        function ownSliders(container) {
          const sliders = [];
          let sibling = container.nextElementSibling;
          while (sibling) {
            if (sibling.matches('.diagram, .question-diagram, .diagram-row')) break;
            sliders.push(...sibling.querySelectorAll('input[type="range"]'));
            if (sibling.matches('input[type="range"]')) sliders.push(sibling);
            sibling = sibling.nextElementSibling;
          }
          // Wherever it sits, a slider whose aria-controls names this diagram
          // (or anything inside it) is one of its own too.
          const ids = [container, ...container.querySelectorAll('[id]')].map((el) => el.id).filter(Boolean);
          document.querySelectorAll('input[type="range"][aria-controls]').forEach((slider) => {
            const named = slider.getAttribute('aria-controls').split(/\s+/);
            if (named.some((id) => ids.includes(id)) && !sliders.includes(slider)) sliders.push(slider);
          });
          return sliders;
        }
        const buttons = [...document.querySelectorAll('.diagram-enlarge-button')].filter((b) => b.getClientRects().length > 0);
        const indices = [];
        buttons.forEach((btn, index) => {
          const container = btn.closest('.diagram-enlarge-source');
          if (container.querySelector('canvas')) return; // a canvas is its own interactive content, never "the diagram" a slider redraws
          if (ownSliders(container).length === 0) return;
          indices.push(index);
        });
        return indices;
      });
      if (candidateIndices.length > 0) break;
    }
    try {
      if (candidateIndices.length === 0) {
        t.skip(`${href} has no non-canvas enlargeable diagram with a slider of its own`);
        return;
      }
      const dialog = page.locator('dialog.diagram-enlarge-dialog');

      for (const index of candidateIndices) {
        const button = page.locator('.diagram-enlarge-button:visible').nth(index);

        await button.click();
        await dialog.waitFor({ state: 'visible' });
        await page.locator('.diagram-enlarge-close').click();
        await dialog.waitFor({ state: 'hidden' });

        // Captured, dispatched and re-read as three separate round trips
        // (not one single evaluate()), with a short settle wait in
        // between — not because the 'input' handlers run asynchronously
        // (they don't), but so a slow repaint/reflow under a heavily
        // loaded browser (this file opens and closes several hundred
        // tabs in one run) has a moment to finish before outerHTML is
        // read, rather than racing it.
        const before = await button.evaluate((btn) => btn.closest('.diagram-enlarge-source').outerHTML);
        await button.evaluate((btn) => {
          function ownSliders(container) {
            const sliders = [];
            let sibling = container.nextElementSibling;
            while (sibling) {
              if (sibling.matches('.diagram, .question-diagram, .diagram-row')) break;
              sliders.push(...sibling.querySelectorAll('input[type="range"]'));
              if (sibling.matches('input[type="range"]')) sliders.push(sibling);
              sibling = sibling.nextElementSibling;
            }
            // Wherever it sits, a slider whose aria-controls names this diagram
            // (or anything inside it) is one of its own too.
            const ids = [container, ...container.querySelectorAll('[id]')].map((el) => el.id).filter(Boolean);
            document.querySelectorAll('input[type="range"][aria-controls]').forEach((slider) => {
              const named = slider.getAttribute('aria-controls').split(/\s+/);
              if (named.some((id) => ids.includes(id)) && !sliders.includes(slider)) sliders.push(slider);
            });
            return sliders;
          }
          const container = btn.closest('.diagram-enlarge-source');
          ownSliders(container).forEach((slider) => {
            const min = Number(slider.min) || 0;
            const max = Number(slider.max) || 100;
            const current = Number(slider.value);
            const target = Math.abs(current - min) > Math.abs(max - current) ? min : max;
            slider.value = String(target);
            slider.dispatchEvent(new Event('input', { bubbles: true }));
          });
        });
        await page.waitForTimeout(100);
        const after = await button.evaluate((btn) => btn.closest('.diagram-enlarge-source').outerHTML);
        assert.ok(
          before !== after,
          `${href} diagram #${index}: moving its own slider(s) to their far end after a close should still redraw it`
        );
      }
    } finally {
      await page.close();
    }
  });
});
