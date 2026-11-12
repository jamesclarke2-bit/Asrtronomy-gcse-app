#!/usr/bin/env node
/**
 * npm run generate-syllabus-review
 * ---------------------------------
 * Regenerates docs/syllabus-review.md from the site's own data (never
 * hand-typed) — one row per src/specPoints.js SPEC_POINTS entry across
 * Topics 1-16, via src/syllabusReview.js's buildSyllabusReview, the
 * same builder test/syllabusReview.test.js checks and the live
 * notes/syllabus-review.html page (notes/syllabus-review.js) renders
 * from in the browser.
 *
 * Markdown has no runtime to build itself from this data at read time
 * the way the HTML page does, so this file is a committed, generated
 * snapshot instead — test/syllabusReview.test.js's own "freshness"
 * test calls renderMarkdown (exported below) with today's real data
 * and fails if it no longer matches what's on disk, so the snapshot
 * can't silently drift from src/specPoints.js/curriculum.js/pages.js.
 * Run this script again and commit the result whenever that test
 * fails.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const { SPEC_POINTS, TOPIC_NAMES } = require('../src/specPoints');
const { UNITS, getSubtopic } = require('../src/curriculum');
const { PAGES, isExtensionPage, DIAGRAM_FIRST_PAGES, TAP_REVEAL_HEAVY_PAGES } = require('../src/pages');
const { getAllQuestionsNode } = require('../src/allQuestions');
const { buildSyllabusReview } = require('../src/syllabusReview');

const ROOT = path.join(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT, 'docs', 'syllabus-review.md');

function buildReviewData() {
  return buildSyllabusReview({
    specPoints: SPEC_POINTS,
    units: UNITS,
    pages: PAGES,
    allQuestions: getAllQuestionsNode(),
    isExtensionPage: (page) => isExtensionPage(page, getSubtopic),
    diagramFirstPages: DIAGRAM_FIRST_PAGES,
    tapRevealHeavyPages: TAP_REVEAL_HEAVY_PAGES,
  });
}

function escapeCell(text) {
  return String(text).replace(/\|/g, '\\|');
}

function pagesCell(row) {
  if (row.status !== 'covered') return '*not built*';
  return row.pages.map((page) => `[${escapeCell(page.title)}](../${page.href})`).join('<br>');
}

function questionsCell(row) {
  return row.questionCount === null ? '–' : String(row.questionCount);
}

function flagsCell(row) {
  if (row.flags.length === 0) return '';
  return row.flags.map((flag) => `⚠ ${escapeCell(flag)}`).join('<br>');
}

function renderTopicTable(topicRows) {
  const lines = [
    '| Code | Depth | Spec point | Page(s) | Questions | Thin coverage | Teacher\'s verdict |',
    '|---|---|---|---|---|---|---|',
  ];
  topicRows.forEach((row) => {
    lines.push(
      `| ${row.code} | ${row.depth} | ${escapeCell(row.text)} | ${pagesCell(row)} | ${questionsCell(row)} | ${flagsCell(row)} | |`
    );
  });
  return lines.join('\n');
}

function renderSummaryTable(review) {
  const lines = [
    '| Topic | Name | Points | Covered | Not built | Flagged thin |',
    '|---|---|---|---|---|---|',
  ];
  review.topics.forEach((topic) => {
    lines.push(
      `| ${topic.number} | ${escapeCell(TOPIC_NAMES[topic.number])} | ${topic.total} | ${topic.covered} | ${topic.notBuilt} | ${topic.flagged} |`
    );
  });
  lines.push(
    `| **Total** | | **${review.summary.total}** | **${review.summary.covered}** | **${review.summary.notBuilt}** | **${review.summary.flagged}** |`
  );
  return lines.join('\n');
}

function renderMarkdown(review) {
  const sections = [];
  sections.push('# Syllabus Coverage Review');
  sections.push(
    'One row per point in the Edexcel GCSE Astronomy (1AS0) specification, Topics 1–16, built straight ' +
      'from src/specPoints.js, src/curriculum.js, src/pages.js and the site\'s own practice questions — ' +
      'regenerate with `npm run generate-syllabus-review` whenever those change ' +
      '(see test/syllabusReview.test.js\'s "docs/syllabus-review.md stays fresh" check). ' +
      'The same data, rendered live, is also at notes/syllabus-review.html.'
  );

  sections.push('## Summary by topic');
  sections.push(renderSummaryTable(review));

  sections.push('## Methodology');
  sections.push(
    [
      '- **Depth** is the spec\'s own `know` / `understand` / `be able to` tag for that point.',
      '- **Page(s)** lists every page whose curriculum subtopic(s) declare that point\'s code; *not built* means none do.',
      '- **Questions** is the number of practice questions anywhere on the site tagging a covering subtopic, only ' +
        'counted for a covered `be able to` point — shown as "–" for every other depth, and for a point that isn\'t ' +
        'built yet (there\'s no page to carry a question in the first place).',
      '- **Thin coverage** flags a covered point, automatically and conservatively, three ways (never a judgement ' +
        'call — that\'s what the blank Teacher\'s verdict column is for):',
      '  1. an `understand` point where none of its covering pages are on src/pages.js\'s DIAGRAM_FIRST_PAGES ' +
        '(pages *verified* to open with a diagram, not every page that happens to have one);',
      '  2. a `be able to` point with fewer than 2 practice questions site-wide;',
      '  3. a point covered by exactly one page, and that page is on src/pages.js\'s TAP_REVEAL_HEAVY_PAGES ' +
        '(over a third of its <main> content lives inside a tap-to-reveal panel rather than always-visible prose).',
    ].join('\n')
  );

  const topicNumbers = review.topics.map((topic) => topic.number);
  topicNumbers.forEach((number) => {
    const topicRows = review.rows.filter((row) => row.topic === number);
    sections.push(`## Topic ${number}: ${TOPIC_NAMES[number]}`);
    sections.push(renderTopicTable(topicRows));
  });

  return sections.join('\n\n') + '\n';
}

function main() {
  const review = buildReviewData();
  const markdown = renderMarkdown(review);
  fs.writeFileSync(OUTPUT_PATH, markdown);
  console.log(`Wrote ${review.rows.length} spec points across ${review.topics.length} topics to ${path.relative(ROOT, OUTPUT_PATH)}`);
}

if (require.main === module) {
  main();
}

module.exports = { buildReviewData, renderMarkdown };
