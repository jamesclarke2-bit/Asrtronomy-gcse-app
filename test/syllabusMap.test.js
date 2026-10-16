/**
 * src/syllabusMap.js: fixture-based tests for the core build logic,
 * then checks against the real site data — every spec point in the
 * registry appears exactly once, every page link resolves to a
 * registered page, and the counts match curriculum.js/pages.js
 * independently recomputed, not just internally self-consistent.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSyllabusMap } = require('../src/syllabusMap');
const { SPEC_POINTS, SPEC_POINT_GROUPS, TOPIC_NAMES, REGISTERED_TOPICS } = require('../src/specPoints');
const { UNITS, getSubtopic } = require('../src/curriculum');
const { PAGES, isExtensionPage } = require('../src/pages');
const { getAllQuestionsNode } = require('../src/allQuestions');

// --- Fixture-based: the core build logic, isolated from real data ---------

function fixtureMap(overrides = {}) {
  const specPoints = overrides.specPoints || [
    { code: '1.1', topic: 1, depth: 'know', text: 'Point one' },
    { code: '1.2', topic: 1, depth: 'be able to', text: 'Point two' },
    { code: '1.3a', topic: 1, depth: 'be able to', text: 'Part a', group: '1.3' },
    { code: '1.3b', topic: 1, depth: 'be able to', text: 'Part b', group: '1.3' },
  ];
  const specPointGroups = overrides.specPointGroups || { '1.3': ['1.3a', '1.3b'] };
  const topicNames = overrides.topicNames || { 1: 'Fixture topic', 2: 'Unregistered topic' };
  const registeredTopics = overrides.registeredTopics || [1];
  const units = overrides.units || [
    {
      id: 'uA',
      title: 'Unit A',
      subtopics: [
        { id: 'uA.1', title: 'Sub 1', depth: 'know', spec: ['1.1'] },
        { id: 'uA.2', title: 'Sub 2', depth: 'be able to', spec: ['1.2', '1.3a'] },
      ],
    },
  ];
  const pages = overrides.pages || [
    { title: 'Page A', href: 'notes/a.html', units: ['uA.1'] },
    { title: 'Page B', href: 'sims/b.html', units: ['uA.2'] },
  ];
  const allQuestions = overrides.allQuestions || [{ id: 'q1', units: ['uA.2'] }];
  const isExtPage = overrides.isExtensionPage || (() => false);

  return buildSyllabusMap({ specPoints, specPointGroups, topicNames, registeredTopics, units, pages, allQuestions, isExtensionPage: isExtPage });
}

test('buildSyllabusMap: a covered atomic point lists its page and depth/text verbatim', () => {
  const map = fixtureMap();
  const topic1 = map.topics.find((t) => t.number === 1);
  const point = topic1.points.find((p) => p.code === '1.1');
  assert.equal(point.status, 'covered');
  assert.equal(point.text, 'Point one');
  assert.equal(point.depth, 'know');
  assert.deepEqual(point.pages, [{ href: 'notes/a.html', title: 'Page A' }]);
});

test('buildSyllabusMap: an uncovered point is "not built", with no pages', () => {
  const map = fixtureMap({
    units: [{ id: 'uA', title: 'Unit A', subtopics: [{ id: 'uA.1', title: 'Sub 1', depth: 'know', spec: ['1.1'] }] }],
  });
  const topic1 = map.topics.find((t) => t.number === 1);
  const point = topic1.points.find((p) => p.code === '1.2');
  assert.equal(point.status, 'not built');
  assert.deepEqual(point.pages, []);
});

test("buildSyllabusMap: 'be able to' + covered shows hasPracticeQuestions; 'know'/'understand' and uncovered points show null", () => {
  const map = fixtureMap();
  const topic1 = map.topics.find((t) => t.number === 1);
  const know = topic1.points.find((p) => p.code === '1.1');
  const beAbleTo = topic1.points.find((p) => p.code === '1.2');
  assert.equal(know.hasPracticeQuestions, null, "'know' points never show a practice-questions flag");
  assert.equal(beAbleTo.hasPracticeQuestions, true, 'uA.2 is tagged on q1');
});

test('buildSyllabusMap: a be-able-to point with no practice questions reports false, not null', () => {
  const map = fixtureMap({ allQuestions: [] });
  const topic1 = map.topics.find((t) => t.number === 1);
  const beAbleTo = topic1.points.find((p) => p.code === '1.2');
  assert.equal(beAbleTo.hasPracticeQuestions, false);
});

test('buildSyllabusMap: a group point is covered only when every child is, partly when some are, not built when none are', () => {
  const allCovered = fixtureMap({
    units: [
      {
        id: 'uA',
        title: 'Unit A',
        subtopics: [
          { id: 'uA.2', title: 'Sub 2', depth: 'be able to', spec: ['1.3a'] },
          { id: 'uA.3', title: 'Sub 3', depth: 'be able to', spec: ['1.3b'] },
        ],
      },
    ],
    pages: [
      { title: 'Page B', href: 'sims/b.html', units: ['uA.2'] },
      { title: 'Page C', href: 'sims/c.html', units: ['uA.3'] },
    ],
  });
  const group = allCovered.topics[0].points.find((p) => p.code === '1.3');
  assert.equal(group.status, 'covered');
  assert.equal(group.isGroup, true);
  assert.equal(group.children.length, 2);
  assert.ok(group.children.every((c) => c.status === 'covered'));

  const partly = fixtureMap(); // only 1.3a covered (via uA.2), 1.3b untagged anywhere
  const partlyGroup = partly.topics[0].points.find((p) => p.code === '1.3');
  assert.equal(partlyGroup.status, 'partly covered');
  assert.equal(partlyGroup.children.find((c) => c.code === '1.3a').status, 'covered');
  assert.equal(partlyGroup.children.find((c) => c.code === '1.3b').status, 'not built');

  const noneCovered = fixtureMap({ units: [] });
  const noneGroup = noneCovered.topics[0].points.find((p) => p.code === '1.3');
  assert.equal(noneGroup.status, 'not built');
});

test('buildSyllabusMap: a topic summary counts covered/partly/not-built points, treating a group as exactly one point', () => {
  const map = fixtureMap();
  const topic1 = map.topics.find((t) => t.number === 1);
  assert.equal(topic1.summary.total, 3, '1.1, 1.2 and the 1.3 group count as 3 points, not 4');
  assert.equal(topic1.summary.covered, 2, '1.1 and 1.2');
  assert.equal(topic1.summary.partlyCovered, 1, '1.3 (only 1.3a covered)');
  assert.equal(topic1.summary.notBuilt, 0);
});

test('buildSyllabusMap: an unregistered topic reports registered:false and no points', () => {
  const map = fixtureMap();
  const topic2 = map.topics.find((t) => t.number === 2);
  assert.deepEqual(topic2, { number: 2, name: 'Unregistered topic', registered: false });
});

test('buildSyllabusMap: an extension page never counts as covering a point, and is listed separately', () => {
  const map = fixtureMap({
    pages: [
      { title: 'Page A', href: 'notes/a.html', units: ['uA.1'] },
      { title: 'Extension Page', href: 'sims/ext.html', units: ['uA.2'] },
    ],
    isExtensionPage: (page) => page.href === 'sims/ext.html',
  });
  const topic1 = map.topics.find((t) => t.number === 1);
  const point = topic1.points.find((p) => p.code === '1.2');
  assert.equal(point.status, 'not built', "an extension page covering uA.2 shouldn't count");
  assert.deepEqual(map.extensionPages, [{ href: 'sims/ext.html', title: 'Extension Page' }]);
});

test('buildSyllabusMap: two pages covering the same point are both listed, each exactly once', () => {
  const map = fixtureMap({
    units: [{ id: 'uA', title: 'Unit A', subtopics: [{ id: 'uA.1', title: 'Sub 1', depth: 'know', spec: ['1.1'] }] }],
    pages: [
      { title: 'Page A', href: 'notes/a.html', units: ['uA.1'] },
      { title: 'Page A2', href: 'notes/a2.html', units: ['uA.1'] },
    ],
  });
  const point = map.topics[0].points.find((p) => p.code === '1.1');
  assert.deepEqual(
    point.pages.map((p) => p.href).sort(),
    ['notes/a.html', 'notes/a2.html']
  );
});

// --- Against the real site data --------------------------------------------

function realMap() {
  return buildSyllabusMap({
    specPoints: SPEC_POINTS,
    specPointGroups: SPEC_POINT_GROUPS,
    topicNames: TOPIC_NAMES,
    registeredTopics: REGISTERED_TOPICS,
    units: UNITS,
    pages: PAGES,
    allQuestions: getAllQuestionsNode(),
    isExtensionPage: (page) => isExtensionPage(page, getSubtopic),
  });
}

test('real data: every topic 1-16 appears exactly once, in order, with the right registered flag', () => {
  const map = realMap();
  assert.deepEqual(
    map.topics.map((t) => t.number),
    Array.from({ length: 16 }, (_, i) => i + 1)
  );
  map.topics.forEach((t) => {
    assert.equal(t.registered, REGISTERED_TOPICS.includes(t.number));
    assert.equal(t.name, TOPIC_NAMES[t.number]);
  });
});

test('real data: every SPEC_POINTS entry appears exactly once on the map — standalone, or as exactly one group child', () => {
  const map = realMap();
  const seen = [];
  map.topics.forEach((topic) => {
    if (!topic.registered) return;
    topic.points.forEach((point) => {
      if (point.isGroup) {
        point.children.forEach((child) => seen.push(child.code));
      } else {
        seen.push(point.code);
      }
    });
  });
  assert.deepEqual(seen.sort(), SPEC_POINTS.map((p) => p.code).sort());
  assert.equal(new Set(seen).size, seen.length, 'no spec point code appears twice');
});

test('real data: every page link on the map is a page actually registered in src/pages.js, and never an extension page', () => {
  const map = realMap();
  const registeredHrefs = new Set(PAGES.map((p) => p.href));
  const extensionHrefs = new Set(PAGES.filter((p) => isExtensionPage(p, getSubtopic)).map((p) => p.href));

  function checkPoint(point) {
    point.pages.forEach((page) => {
      assert.ok(registeredHrefs.has(page.href), `${point.code} links to unregistered page ${page.href}`);
      assert.ok(!extensionHrefs.has(page.href), `${point.code} links to extension page ${page.href}, which should never count`);
      const registered = PAGES.find((p) => p.href === page.href);
      assert.equal(page.title, registered.title, `${point.code}'s link title for ${page.href} should match the registry`);
    });
    if (point.children) point.children.forEach(checkPoint);
  }

  map.topics.forEach((topic) => {
    if (topic.registered) topic.points.forEach(checkPoint);
  });
});

test('real data: a topic summary matches an independent recount of its own points', () => {
  const map = realMap();
  map.topics.forEach((topic) => {
    if (!topic.registered) return;
    let covered = 0;
    let partlyCovered = 0;
    let notBuilt = 0;
    topic.points.forEach((point) => {
      if (point.status === 'covered') covered += 1;
      else if (point.status === 'partly covered') partlyCovered += 1;
      else notBuilt += 1;
    });
    assert.deepEqual(
      topic.summary,
      { covered, partlyCovered, notBuilt, total: topic.points.length },
      `Topic ${topic.number}'s summary should match its own points`
    );
  });
});

test('real data: a point is "covered" exactly when at least one registered, non-extension page declares a subtopic tagging its code', () => {
  const map = realMap();
  const extensionHrefs = new Set(PAGES.filter((p) => isExtensionPage(p, getSubtopic)).map((p) => p.href));

  function codeIsActuallyCovered(code) {
    return UNITS.some((unit) =>
      unit.subtopics.some(
        (subtopic) =>
          (subtopic.spec || []).includes(code) &&
          PAGES.some((page) => !extensionHrefs.has(page.href) && (page.units || []).includes(subtopic.id))
      )
    );
  }

  function checkPoint(point) {
    if (!point.isGroup) {
      assert.equal(point.status === 'covered', codeIsActuallyCovered(point.code), `${point.code} covered status mismatch`);
    } else {
      point.children.forEach(checkPoint);
    }
  }

  map.topics.forEach((topic) => {
    if (topic.registered) topic.points.forEach(checkPoint);
  });
});

test('real data: extensionPages is exactly the set of pages src/pages.js itself calls extension pages', () => {
  const map = realMap();
  const expected = PAGES.filter((p) => isExtensionPage(p, getSubtopic)).map((p) => ({ href: p.href, title: p.title }));
  assert.deepEqual(
    map.extensionPages.slice().sort((a, b) => a.href.localeCompare(b.href)),
    expected.slice().sort((a, b) => a.href.localeCompare(b.href))
  );
});

test("real data: hasPracticeQuestions is only ever set (true or false) for a covered 'be able to' point, never for 'know'/'understand' or an uncovered point", () => {
  const map = realMap();

  function checkPoint(point) {
    if (!point.isGroup) {
      if (point.depth === 'be able to' && point.status === 'covered') {
        assert.equal(typeof point.hasPracticeQuestions, 'boolean', `${point.code} should report true/false`);
      } else {
        assert.equal(point.hasPracticeQuestions, null, `${point.code} (depth ${point.depth}, ${point.status}) should not report a practice-questions flag`);
      }
    } else {
      point.children.forEach(checkPoint);
    }
  }

  map.topics.forEach((topic) => {
    if (topic.registered) topic.points.forEach(checkPoint);
  });
});
