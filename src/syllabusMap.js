/**
 * Maps the Edexcel GCSE Astronomy (1AS0) specification to this app's
 * own pages — built entirely from src/specPoints.js, the `spec`
 * fields on src/curriculum.js's own subtopics, and src/pages.js's own
 * `units` fields, so it can't drift from what those three files
 * actually say. Nothing here is hand-typed per spec point; change a
 * `spec` tag or a page's `units` and the map follows.
 *
 * A "covered" status means at least one non-extension page declares a
 * subtopic that tags the code; "not built" means none does — never a
 * judgement call, just whether src/pages.js says so. A grouped point
 * (e.g. "12.1", see specPoints.js's SPEC_POINT_GROUPS) is "partly
 * covered" when some but not all of its lettered children are
 * covered, listed with its children attached so the partial state is
 * visible, not just asserted.
 *
 * "Has practice questions" and the point's own `questionCount` are only
 * ever computed for a 'be able to' point that is itself covered (an
 * uncovered point has no page to carry a question in the first place)
 * — the count sums every question anywhere on the site (see
 * src/allQuestions.js) tagged with any of the point's covering
 * subtopic ids; hasPracticeQuestions is just questionCount > 0, kept
 * as its own field since both a non-applicable point (null) and an
 * applicable one with zero questions (false) need to read differently.
 *
 * The returned `summary` totals every registered topic's own summary —
 * the same one-stop figure notes/syllabus-map.html's own coverage bar
 * shows, never recomputed a second way there.
 *
 * isExtensionPage is passed in (from src/pages.js) rather than
 * imported directly, matching every other pure builder in this
 * codebase (e.g. src/pages.js's own computeUnitCoverage, nextPage.js's
 * resolveNextStep) — no hidden dependency on a particular curriculum
 * module, easy to call with small fixtures in tests.
 */
(function () {
  function pageRef(page) {
    return { href: page.href, title: page.title };
  }

  /**
   * code -> Set(subtopic ids) that tag it, from every unit's every
   * subtopic's own `spec` array.
   */
  function buildCodeToSubtopics(units) {
    const map = new Map();
    units.forEach((unit) => {
      unit.subtopics.forEach((subtopic) => {
        (subtopic.spec || []).forEach((code) => {
          if (!map.has(code)) map.set(code, new Set());
          map.get(code).add(subtopic.id);
        });
      });
    });
    return map;
  }

  /** subtopic id -> [{href, title}], from every non-extension page's `units`. */
  function buildSubtopicToPages(nonExtensionPages) {
    const map = new Map();
    nonExtensionPages.forEach((page) => {
      (page.units || []).forEach((id) => {
        if (!map.has(id)) map.set(id, []);
        const list = map.get(id);
        if (!list.some((p) => p.href === page.href)) list.push(pageRef(page));
      });
    });
    return map;
  }

  /** subtopic id -> how many questions anywhere tag it. */
  function buildSubtopicQuestionCount(allQuestions) {
    const map = new Map();
    allQuestions.forEach((question) => (question.units || []).forEach((id) => map.set(id, (map.get(id) || 0) + 1)));
    return map;
  }

  function buildSyllabusMap({ specPoints, specPointGroups, topicNames, registeredTopics, units, pages, allQuestions, isExtensionPage }) {
    const extensionPages = pages.filter((page) => isExtensionPage(page)).map(pageRef);
    const nonExtensionPages = pages.filter((page) => !isExtensionPage(page));

    const codeToSubtopics = buildCodeToSubtopics(units);
    const subtopicToPages = buildSubtopicToPages(nonExtensionPages);
    const subtopicQuestionCount = buildSubtopicQuestionCount(allQuestions);

    function pagesCoveringCode(code) {
      const subtopicIds = [...(codeToSubtopics.get(code) || [])];
      const seen = new Map();
      subtopicIds.forEach((id) => {
        (subtopicToPages.get(id) || []).forEach((page) => {
          if (!seen.has(page.href)) seen.set(page.href, page);
        });
      });
      return [...seen.values()];
    }

    function buildPoint(specPoint) {
      const coveringPages = pagesCoveringCode(specPoint.code);
      const status = coveringPages.length > 0 ? 'covered' : 'not built';
      const subtopicIds = [...(codeToSubtopics.get(specPoint.code) || [])];
      const questionsApplicable = specPoint.depth === 'be able to' && status === 'covered';
      const questionCount = questionsApplicable
        ? subtopicIds.reduce((sum, id) => sum + (subtopicQuestionCount.get(id) || 0), 0)
        : 0;
      const hasPracticeQuestions = questionsApplicable ? questionCount > 0 : null;
      return {
        code: specPoint.code,
        text: specPoint.text,
        depth: specPoint.depth,
        isGroup: false,
        status,
        pages: coveringPages,
        hasPracticeQuestions,
        questionCount,
        children: null,
      };
    }

    function groupStatus(childPoints) {
      const coveredCount = childPoints.filter((c) => c.status === 'covered').length;
      if (coveredCount === 0) return 'not built';
      if (coveredCount === childPoints.length) return 'covered';
      return 'partly covered';
    }

    function buildGroupPoint(parentCode, byCode) {
      const children = specPointGroups[parentCode].map((code) => buildPoint(byCode.get(code)));
      return {
        code: parentCode,
        text: null,
        depth: children[0] ? children[0].depth : undefined,
        isGroup: true,
        status: groupStatus(children),
        pages: [],
        hasPracticeQuestions: null,
        children,
      };
    }

    function buildTopic(topicNumber) {
      const byCode = new Map(specPoints.map((point) => [point.code, point]));
      const addedGroups = new Set();
      const entries = [];

      specPoints
        .filter((point) => point.topic === topicNumber)
        .forEach((point) => {
          if (point.group) {
            if (addedGroups.has(point.group)) return;
            addedGroups.add(point.group);
            entries.push(buildGroupPoint(point.group, byCode));
          } else {
            entries.push(buildPoint(point));
          }
        });

      const summary = entries.reduce(
        (acc, entry) => {
          if (entry.status === 'covered') acc.covered += 1;
          else if (entry.status === 'partly covered') acc.partlyCovered += 1;
          else acc.notBuilt += 1;
          return acc;
        },
        { covered: 0, partlyCovered: 0, notBuilt: 0, total: entries.length }
      );

      return { number: topicNumber, name: topicNames[topicNumber], registered: true, points: entries, summary };
    }

    const topicNumbers = Object.keys(topicNames)
      .map(Number)
      .sort((a, b) => a - b);

    const topics = topicNumbers.map((number) =>
      registeredTopics.includes(number) ? buildTopic(number) : { number, name: topicNames[number], registered: false }
    );

    // Aggregated across every registered topic's own summary — topics
    // 14-16 (not yet in the registry) contribute nothing, same as the
    // extension pages never counting towards any topic's own summary.
    const summary = topics
      .filter((topic) => topic.registered)
      .reduce(
        (acc, topic) => ({
          covered: acc.covered + topic.summary.covered,
          partlyCovered: acc.partlyCovered + topic.summary.partlyCovered,
          notBuilt: acc.notBuilt + topic.summary.notBuilt,
          total: acc.total + topic.summary.total,
        }),
        { covered: 0, partlyCovered: 0, notBuilt: 0, total: 0 }
      );

    return { topics, extensionPages, summary };
  }

  const api = { buildSyllabusMap };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.SyllabusMap = api;
  }
})();
