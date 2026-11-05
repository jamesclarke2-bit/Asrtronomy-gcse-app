/**
 * Guards against a sizing bug that has recurred several times on this
 * site: an inline <svg> with only a viewBox (no width/height attribute
 * and no CSS rule sizing it) has no definite containing block to resolve
 * a percentage width against once its wrapper (most often
 * .labelled-diagram-wrap, which is display:inline-block) is itself
 * shrink-to-fit — so it silently falls back to the CSS replaced-element
 * default of 300x150, rendering the diagram at roughly a third of its
 * intended size, or squashed to the wrong aspect ratio, with nothing in
 * the page source or a static check revealing it (see CLAUDE.md rule
 * 15). This has previously broken notes/earth-structure.html's
 * atmosphere charts, notes/moon-structure.html and notes/
 * earth-structure.html's "Share of the radius" diagram, and others —
 * always invisible without actually rendering the page.
 *
 * Real browser check (Playwright, same engine scripts/screenshots.js
 * already uses) at a phone width (390px, same convention as
 * test/noHorizontalScroll.test.js) and an iPad width (768px), since
 * rendered size is exactly what a DOM shim or raw-HTML parse can't see.
 *
 * Scope: every inline <svg> nested inside a .diagram,
 * .labelled-diagram-wrap, .question-diagram or <figure> that's actually
 * rendered (nonzero size) once the page has loaded and every <details>
 * element has been forced open — the same opening convention
 * test/pictureQuestions.test.js uses for its own picture-quiz panels.
 * diagramEnlarge.js's own small icon svgs (inside .diagram-enlarge-button
 * / .diagram-enlarge-close) are excluded — they're deliberately small UI
 * chrome living inside the same wrapper, not a diagram.
 * A diagram inside a reveal opened only by page-specific JS (a glossary
 * toggle, a custom "Compare with Earth's layers" button, and similar)
 * isn't exercised here, since there's no site-wide convention for
 * triggering those generically — but most of this site's diagrams, and
 * every case that's actually broken this way so far, render directly on
 * load or inside a plain <details>, which this does cover.
 *
 * A match fails this test either:
 *  - by rendering at exactly the 300x150 browser default while its own
 *    viewBox has a different aspect ratio (the precise signature of the
 *    bug itself), or
 *  - by rendering narrower than 40% of its wrapper's own width, which
 *    catches the same class of bug even where it hasn't collapsed to
 *    exactly 300x150 — unless it's on ALLOW_NARROW below with a reason
 *    (a diagram that's deliberately a small icon, not a sizing bug).
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
];

// Svgs that are genuinely meant to render narrower than 40% of their
// wrapper — a deliberately small icon, not an instance of the sizing
// bug. Keyed by page href, value is an array of the svg's identifying
// string as this test reports it (its id, or a fallback built from its
// wrapper and position — run the test and copy the exact string from a
// failure message to add an entry here).
const ALLOW_NARROW = {
  // The three down-arrows connecting the "What makes a dwarf planet?"
  // decision-flow cards — small by design (20x26, with their own
  // explicit width/height, so not the sizing bug this test guards
  // against), not a diagram in their own right.
  'notes/solar-system-bodies.html': ['#dwarf-planet-diagram svg[0]', '#dwarf-planet-diagram svg[1]', '#dwarf-planet-diagram svg[2]'],
};

const BROWSER_DEFAULT_WIDTH = 300;
const BROWSER_DEFAULT_HEIGHT = 150;
const BROWSER_DEFAULT_ASPECT = BROWSER_DEFAULT_WIDTH / BROWSER_DEFAULT_HEIGHT;
const MIN_WIDTH_FRACTION_OF_WRAPPER = 0.4;

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/svgSizing.test.js');

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

const WRAPPER_SELECTOR = '.diagram, .labelled-diagram-wrap, .question-diagram, figure';

PAGES.forEach((href) => {
  WIDTHS.forEach(({ label, width, height }) => {
    test(`${href} at ${label} width: every inline SVG in a diagram wrapper has its intended size, not the browser's 300x150 default`, async (t) => {
      if (launchError) {
        skip(t, SKIP_MESSAGE(launchError));
        return;
      }
      const page = await browser.newPage({ viewport: { width, height } });
      try {
        await page.goto('file://' + path.join(ROOT, href));
        await page.waitForTimeout(300);
        await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
        await page.waitForTimeout(100);

        const svgReports = await page.evaluate(
          (selector) =>
            [...document.querySelectorAll('svg')]
              .filter((svg) => !svg.closest('.diagram-enlarge-button, .diagram-enlarge-close'))
              .map((svg) => {
                const wrapper = svg.closest(selector);
                if (!wrapper) return null;
                const rect = svg.getBoundingClientRect();
                if (rect.width <= 0 || rect.height <= 0) return null; // not currently rendered
                const wrapperRect = wrapper.getBoundingClientRect();
                const vb = svg.viewBox && svg.viewBox.baseVal;
                let id = svg.id;
                if (!id) {
                  const siblingSvgs = [...wrapper.querySelectorAll('svg')].filter(
                    (s) => !s.closest('.diagram-enlarge-button, .diagram-enlarge-close')
                  );
                  const index = siblingSvgs.indexOf(svg);
                  const wrapperName = wrapper.id ? `#${wrapper.id}` : wrapper.className.split(' ')[0] || wrapper.tagName.toLowerCase();
                  id = `${wrapperName} svg[${index}]`;
                }
                return {
                  id,
                  width: rect.width,
                  height: rect.height,
                  viewBoxWidth: vb && vb.width > 0 ? vb.width : null,
                  viewBoxHeight: vb && vb.height > 0 ? vb.height : null,
                  wrapperWidth: wrapperRect.width,
                };
              })
              .filter(Boolean),
          WRAPPER_SELECTOR
        );

        const allowList = ALLOW_NARROW[href] || [];
        const errors = [];

        svgReports.forEach(({ id, width: w, height: h, viewBoxWidth, viewBoxHeight, wrapperWidth }) => {
          const isExactBrowserDefault = Math.abs(w - BROWSER_DEFAULT_WIDTH) < 0.5 && Math.abs(h - BROWSER_DEFAULT_HEIGHT) < 0.5;
          const viewBoxAspect = viewBoxWidth && viewBoxHeight ? viewBoxWidth / viewBoxHeight : null;
          const aspectDiffersFromDefault = viewBoxAspect !== null && Math.abs(viewBoxAspect - BROWSER_DEFAULT_ASPECT) > 0.02;
          if (isExactBrowserDefault && aspectDiffersFromDefault) {
            errors.push(
              `"${id}" rendered at exactly ${BROWSER_DEFAULT_WIDTH}x${BROWSER_DEFAULT_HEIGHT} (the browser's replaced-element ` +
                `default) even though its viewBox is ${viewBoxWidth}x${viewBoxHeight} (aspect ${viewBoxAspect.toFixed(2)}, not ` +
                `${BROWSER_DEFAULT_ASPECT.toFixed(2)}) — it's missing width/height attributes or a CSS rule (CLAUDE.md rule 15)`
            );
            return;
          }
          if (allowList.includes(id)) return;
          if (wrapperWidth > 0 && w < wrapperWidth * MIN_WIDTH_FRACTION_OF_WRAPPER) {
            errors.push(
              `"${id}" renders at ${w.toFixed(0)}px wide, under ${MIN_WIDTH_FRACTION_OF_WRAPPER * 100}% of its wrapper's ` +
                `${wrapperWidth.toFixed(0)}px — likely the same sizing bug (CLAUDE.md rule 15), or add "${id}" to ALLOW_NARROW ` +
                `for ${href} in test/svgSizing.test.js with a reason if it's deliberately small`
            );
          }
        });

        assert.deepEqual(errors, [], `${href} at ${label} width:\n${errors.join('\n')}`);
      } finally {
        await page.close();
      }
    });
  });
});
