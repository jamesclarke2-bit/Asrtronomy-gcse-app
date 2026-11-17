#!/usr/bin/env node
/**
 * Word runs on the RENDERED page: how many words a student reads before
 * the first visual, between visuals, and after the last one. House limits:
 * at most 150 before the first visual, and at most 250 in any other run
 * (between two visuals, or after the last).
 *
 * Usage:
 *   node tools/wordRuns.js                      every diagram-first page
 *   node tools/wordRuns.js notes/tides.html     just these pages
 *   node tools/wordRuns.js --json ...           machine-readable output
 *   node tools/wordRuns.js --detail ...         what fills each run, by section
 * Uses Playwright's Chromium (PLAYWRIGHT_CHROMIUM_PATH if set), at a
 * 768 x 1200 viewport, after the page's own scripts have run.
 *
 * COUNTING RULES
 *
 * Counted (inside <main>, in document order):
 *   - prose: headings, paragraphs and list items in the page's sections,
 *     including the h1 and subtitle;
 *   - notes, including every "first draft, to be checked by the teacher"
 *     label;
 *   - exam tips;
 *   - tables (caption, headings and cells);
 *   - glossary or key terms on show (the terms in the text, and any
 *     key-term list or definition that is visible without tapping);
 *   - readouts that scripts fill in.
 *
 * Not counted:
 *   - the "On this page" contents list (and the sims' "jump to" list);
 *   - the Related pages section and its cards;
 *   - the site bar and the site privacy footer;
 *   - button and control labels (buttons, form labels, sliders, selects);
 *   - anything inside the quiz: the practice questions, the progress list,
 *     picture quizzes and their panels;
 *   - labels drawn on a diagram (they belong to the visual);
 *   - the coverage line and the next-page link;
 *   - anything not on show until tapped: a closed tap-to-reveal panel or
 *     <details> block, or anything hidden. House rule 1 puts detail in
 *     tap-to-reveal panels; the other side of that rule is that text is
 *     never moved into a panel just to get under a limit.
 *
 * The rendered count can differ from test/notesTemplate.test.js, which
 * reads the HTML source: that test can't see text scripts fill in, and it
 * doesn't check the run after the last visual.
 *
 * Visuals: SVG and canvas diagrams, at least 40 x 40 px as rendered
 * (smaller ones are icons), not inside the quiz, the Enlarge button or a
 * picture-quiz panel. Tables are not visuals. A word counts as one when it
 * contains a letter or digit.
 */
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const BEFORE_FIRST_LIMIT = 150;
const RUN_LIMIT = 250;

const NOT_COUNTED = [
  '.notes-toc', '.jump-to', '#related', '.site-bar', '.panel-note', '.back-link',
  'button', 'label', 'select', 'input', 'summary',
  '#questions', '.progress', '.picture-quiz-panel', '.question-diagram', '#which-is-it-game',
  '.labelled-diagram-wrap .diagram-label', '.labelled-diagram-label', '.diagram-enlarge-button',
  '#coverage', '#next-page', 'script', 'style', 'noscript',
].join(', ');
const NOT_A_VISUAL = '#questions, .progress, .picture-quiz-panel, .question-diagram, #which-is-it-game, .diagram-enlarge-button';

function pageRuns(sel) {
  const { NOT_COUNTED: skipSel, NOT_A_VISUAL: noVisualSel } = sel;
  const main = document.querySelector('main');
  const runs = [0];
  const visuals = [];
  const detail = [{}];
  const isVisual = (el) => {
    if (el.tagName !== 'CANVAS' && !(el.tagName.toLowerCase() === 'svg' && el.parentElement.closest('svg') === null)) return false;
    if (el.closest(noVisualSel)) return false;
    const r = el.getBoundingClientRect();
    return r.width >= 40 && r.height >= 40;
  };
  // Not on show: hidden, display: none, or inside a closed <details>.
  const notOnShow = (el) => !el.checkVisibility({ contentVisibilityAuto: true, visibilityProperty: true });
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    if (n.nodeType === 1) {
      if (isVisual(n)) {
        visuals.push(n.id || n.getAttribute('aria-label')?.slice(0, 40) || n.tagName);
        runs.push(0);
        detail.push({});
      }
      continue;
    }
    const el = n.parentElement;
    if (!el || el.closest('svg') || el.closest(skipSel) || notOnShow(el)) continue;
    const words = n.textContent.trim().split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
    if (!words) continue;
    runs[runs.length - 1] += words;
    const sec = el.closest('section');
    const h = sec && sec.querySelector('h2');
    let kind = 'prose';
    if (el.closest('.glossary-definition, .glossary-toggle, [class*="glossary"], [class*="flashcard"]')) kind = 'glossary';
    else if (el.closest('.exam-tip')) kind = 'exam tip';
    else if (el.closest('table')) kind = 'table';
    else if (el.closest('.note')) kind = 'note';
    else if (el.closest('dl, [aria-live]')) kind = 'readout';
    const key = `${h ? h.textContent.trim() : '(top of page)'} | ${kind}`;
    const d = detail[detail.length - 1];
    d[key] = (d[key] || 0) + words;
  }
  return { runs, visuals, detail };
}

function summarise(page, { runs, visuals, detail }) {
  const first = runs[0];
  const final = runs[runs.length - 1];
  const between = runs.slice(1, -1);
  const longest = between.length ? Math.max(...between) : 0;
  const problems = [];
  if (!visuals.length) problems.push('no visual');
  if (first > BEFORE_FIRST_LIMIT) problems.push(`first ${first} > ${BEFORE_FIRST_LIMIT}`);
  if (longest > RUN_LIMIT) problems.push(`between ${longest} > ${RUN_LIMIT}`);
  if (visuals.length && final > RUN_LIMIT) problems.push(`final ${final} > ${RUN_LIMIT}`);
  return { page, first, longest, final, runs, visuals: visuals.length, visualIds: visuals, detail, problems };
}

async function measure(pages, launchOptions = {}) {
  const browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}), ...launchOptions });
  const tab = await browser.newPage({ viewport: { width: 768, height: 1200 }, reducedMotion: 'reduce' });
  const out = [];
  try {
    for (const page of pages) {
      await tab.goto('file://' + path.join(ROOT, page));
      await tab.waitForTimeout(250);
      out.push(summarise(page, await tab.evaluate(pageRuns, { NOT_COUNTED, NOT_A_VISUAL })));
    }
  } finally {
    await browser.close();
  }
  return out;
}

module.exports = { measure, BEFORE_FIRST_LIMIT, RUN_LIMIT, NOT_COUNTED, NOT_A_VISUAL };

if (require.main === module) {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const showDetail = args.includes('--detail');
  let pages = args.filter((a) => !a.startsWith('--'));
  if (!pages.length) pages = require('../src/pages.js').DIAGRAM_FIRST_PAGES;
  measure(pages).then((results) => {
    if (json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      results.forEach((r) => {
        console.log(`${r.problems.length ? 'OVER' : 'ok  '}  ${r.page}  first ${r.first}, longest between ${r.longest}, final ${r.final}  [${r.runs.join(', ')}]${r.problems.length ? `  <- ${r.problems.join('; ')}` : ''}`);
        if (showDetail) {
          r.detail.forEach((d, k) => {
            console.log(`    run ${k + 1} (${r.runs[k]} words)${k ? ` after ${r.visualIds[k - 1]}` : ''}`);
            Object.entries(d).forEach(([key, w]) => console.log(`      ${String(w).padStart(4)}  ${key}`));
          });
        }
      });
      const over = results.filter((r) => r.problems.length);
      console.log(`\n${over.length} of ${results.length} page(s) over a limit.`);
    }
  });
}
