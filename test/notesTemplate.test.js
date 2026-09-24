/**
 * Checks notes pages against notes/TEMPLATE.md. Only pages listed in
 * CONFORMING_PAGES are checked; the older notes pages join the list as
 * they're retrofitted.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PAGES } = require('../src/pages');
const NotesPage = require('../notesPage');

const ROOT = path.join(__dirname, '..');

const CONFORMING_PAGES = ['notes/naked-eye-sky.html', 'notes/measuring-the-sky.html', 'notes/tides.html'];

function read(href) {
  return fs.readFileSync(path.join(ROOT, href), 'utf8');
}

// Resolve a link found on `fromHref` to a repo-root-relative path, without its #fragment.
function resolveLink(fromHref, link) {
  const withoutHash = link.split('#')[0];
  return path.posix.normalize(path.posix.join(path.posix.dirname(fromHref), withoutHash));
}

function sectionsOf(html) {
  const sections = [];
  const re = /<section class="notes-section"( id="([^"]*)")?>([\s\S]*?)<\/section>/g;
  let match;
  while ((match = re.exec(html))) {
    const h2 = /<h2>([^<]*)<\/h2>/.exec(match[3]);
    sections.push({ id: match[2], body: match[3], heading: h2 && h2[1], index: match.index });
  }
  return sections;
}

function stripTags(s) {
  return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

test('the contents list appears only on pages long enough to need one', () => {
  assert.equal(NotesPage.TOC_WORD_THRESHOLD, 800);
  assert.equal(NotesPage.shouldShowToc(799), false);
  assert.equal(NotesPage.shouldShowToc(800), true);
  assert.equal(NotesPage.countWords('  one two\n three  '), 3);
});

CONFORMING_PAGES.forEach((href) => {
  const html = read(href);
  const main = /<main>([\s\S]*)<\/main>/.exec(html)[1];
  const sections = sectionsOf(main);
  const page = PAGES.find((p) => p.href === href);

  test(`${href}: is registered, and its <title>, h1 and registry title agree`, () => {
    assert.ok(page, 'registered in src/pages.js');
    const title = /<title>([^<]*)<\/title>/.exec(html)[1];
    const h1 = /<h1>([^<]*)<\/h1>/.exec(main)[1];
    assert.equal(title, page.title);
    assert.equal(h1, page.title);
  });

  test(`${href}: overview is the h1 then a link-free subtitle`, () => {
    const overview = /<\/h1>\s*<p class="subtitle">([\s\S]*?)<\/p>\s*<section/.exec(main);
    assert.ok(overview, 'h1 is followed directly by p.subtitle, then the first section');
    assert.ok(!/<a\b/.test(overview[1]), 'no links in the subtitle');
  });

  test(`${href}: sections run core -> exam tips -> related, each with an id and an h2`, () => {
    sections.forEach((s) => {
      assert.ok(s.id, `section "${s.heading}" has an id`);
      assert.ok(s.heading, `section #${s.id} opens with an h2`);
      assert.ok(!/<h2/.test(s.body.replace(/<h2>[^<]*<\/h2>/, '')), `#${s.id} has only one h2`);
    });
    const ids = sections.map((s) => s.id);
    assert.ok(ids.length >= 3, 'at least one core section');
    assert.deepEqual(ids.slice(-2), ['exam-tips', 'related']);
    assert.equal(sections.at(-2).heading, 'Exam tips');
    assert.equal(sections.at(-1).heading, 'Related pages');
    assert.equal(new Set(ids).size, ids.length, 'section ids are unique');
  });

  test(`${href}: the coverage line comes last in <main>`, () => {
    assert.ok(/<\/section>\s*<p class="coverage" id="coverage"><\/p>\s*$/.test(main));
  });

  test(`${href}: every exam tip sits in #exam-tips, with a lead-in and a link back to its section`, () => {
    const tipsSection = sections.find((s) => s.id === 'exam-tips');
    const everywhere = (main.match(/class="exam-tip"/g) || []).length;
    const tips = tipsSection.body.match(/<p class="exam-tip">[\s\S]*?<\/p>/g) || [];
    assert.ok(tips.length >= 1);
    assert.equal(everywhere, tips.length, 'no exam tips outside #exam-tips');
    const ids = sections.map((s) => s.id);
    tips.forEach((tip) => {
      assert.ok(/^<p class="exam-tip">\s*<strong>Common exam (confusion|link):<\/strong>/.test(tip), `lead-in: ${stripTags(tip).slice(0, 50)}`);
      const back = /<a href="#([^"]+)">([^<]*) &uarr;<\/a>\s*<\/p>$/.exec(tip);
      assert.ok(back, `ends with a back-link: ${stripTags(tip).slice(0, 50)}`);
      assert.ok(ids.includes(back[1]), `back-link #${back[1]} targets a section on the page`);
    });
  });

  test(`${href}: every glossary toggle has exactly one definition`, () => {
    const toggles = [...main.matchAll(/class="glossary-toggle[^"]*" data-term="([^"]+)"/g)].map((m) => m[1]);
    const definitions = [...main.matchAll(/class="glossary-definition[^"]*" data-term="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(new Set(definitions).size, definitions.length, 'definition terms are unique');
    assert.equal(new Set(toggles).size, toggles.length, 'each term has one toggle');
    toggles.forEach((term) => assert.ok(definitions.includes(term), `definition for "${term}"`));
  });

  test(`${href}: related-pages cards are registered pages with matching titles`, () => {
    const related = sections.find((s) => s.id === 'related');
    assert.ok(/<div class="page-card-list">/.test(related.body));
    const cards = [...related.body.matchAll(/<a class="page-card" href="([^"]+)">\s*<h3>([^<]*)<\/h3>\s*<p class="page-card-description">([^<]+)<\/p>\s*<\/a>/g)];
    const anchors = (related.body.match(/<a\b/g) || []).length;
    assert.ok(cards.length >= 1);
    assert.equal(cards.length, anchors, 'every link in the footer is a well-formed page card');
    const targets = cards.map(([, link]) => resolveLink(href, link));
    assert.equal(new Set(targets).size, targets.length, 'no duplicate cards');
    cards.forEach(([, link, title], i) => {
      assert.ok(!link.includes('#'), `${link}: cards link to whole pages`);
      assert.notEqual(targets[i], href, 'no card links to the page itself');
      assert.ok(fs.existsSync(path.join(ROOT, targets[i])), `${targets[i]} exists`);
      const registered = PAGES.find((p) => p.href === targets[i]);
      assert.ok(registered, `${targets[i]} is registered in src/pages.js`);
      assert.equal(title.replace(/&amp;/g, '&'), registered.title, `card title for ${targets[i]}`);
    });
  });

  test(`${href}: every page linked inline also appears in Related pages`, () => {
    const related = sections.find((s) => s.id === 'related');
    const footerTargets = new Set([...related.body.matchAll(/href="([^"]+)"/g)].map((m) => resolveLink(href, m[1])));
    const body = main.replace(/<p class="back-link">[\s\S]*?<\/p>/, '').replace(related.body, '');
    const inline = [...body.matchAll(/<a href="([^"#][^"]*)"/g)].map((m) => resolveLink(href, m[1]));
    inline.forEach((target) => {
      assert.ok(fs.existsSync(path.join(ROOT, target)), `${target} exists`);
      assert.ok(footerTargets.has(target), `${target} is linked inline, so it must be in Related pages`);
    });
  });

  test(`${href}: loads glossary.js, and notesPage.js as the last script`, () => {
    const scripts = [...html.matchAll(/<script src="([^"?]+)/g)].map((m) => m[1]);
    assert.ok(scripts.includes('../glossary.js'));
    assert.equal(scripts.at(-1), '../notesPage.js');
  });
});
