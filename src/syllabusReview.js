/**
 * A flat, one-row-per-spec-point review of the whole specification
 * (Topics 1-13), for a teacher to check by eye — deliberately not the
 * same shape as src/syllabusMap.js's own report, which rolls a grouped
 * point's lettered sub-codes (see specPoints.js's SPEC_POINT_GROUPS) up
 * under their shared parent so a progress bar reads sensibly. This
 * file instead lists every raw src/specPoints.js SPEC_POINTS entry
 * exactly once, sub-codes included, since a teacher checking coverage
 * point by point needs to see each lettered part on its own row, not
 * folded into a parent that could read as "covered" when only one part
 * actually is.
 *
 * Reuses the same code -> covering-subtopics -> covering-pages -> by
 * questions chain src/syllabusMap.js builds (buildCodeToSubtopics /
 * buildSubtopicToPages / buildSubtopicQuestionCount below are the same
 * logic, kept separate rather than imported since syllabusMap.js
 * doesn't export those closures and this file's own per-point shape
 * — no grouping, a different flag set — isn't a fit for its buildPoint
 * either).
 *
 * Three automated "thin coverage" flags, each a deliberately
 * conservative, cheaply-computed proxy rather than a perfect verdict
 * (hence the report's own blank "Teacher's verdict" column):
 *
 *  - An 'understand' point is flagged when none of its covering pages
 *    appear in src/pages.js's DIAGRAM_FIRST_PAGES — a page missing from
 *    that list might still open with a diagram, just not yet verified
 *    against the house diagram-first rule, so this reads as "no
 *    *verified* diagram", not "definitely no diagram".
 *  - A 'be able to' point is flagged when its question count (summed
 *    across every covering subtopic, the same way syllabusMap.js's own
 *    questionCount does) is below THIN_QUESTION_THRESHOLD.
 *  - Any point is flagged when it has exactly one covering page and
 *    that page is in src/pages.js's TAP_REVEAL_HEAVY_PAGES — pages
 *    where over a third of the words inside <main> live inside a
 *    .glossary-definition tap-to-reveal panel rather than always-visible
 *    prose (computeTapRevealRatio below computes that ratio from a
 *    page's raw HTML; TAP_REVEAL_HEAVY_PAGES is the hand-maintained
 *    result, re-checked for drift by test/syllabusReview.test.js). A
 *    point covered by more than one page is never flagged this way,
 *    since "covered only on" a reveal-heavy page can't be true once a
 *    second page covers it too.
 *
 * None of these three apply to a point that isn't covered at all
 * ('not built' already says so) — a flag here means "covered, but
 * thinly", never a second way of saying "not covered".
 */
(function () {
  function pageRef(page) {
    return { href: page.href, title: page.title };
  }

  /** code -> Set(subtopic ids) that tag it, from every unit's every subtopic's own `spec` array. */
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

  const THIN_QUESTION_THRESHOLD = 2;

  function buildSyllabusReview({ specPoints, units, pages, allQuestions, isExtensionPage, diagramFirstPages, tapRevealHeavyPages }) {
    const nonExtensionPages = pages.filter((page) => !isExtensionPage(page));
    const codeToSubtopics = buildCodeToSubtopics(units);
    const subtopicToPages = buildSubtopicToPages(nonExtensionPages);
    const subtopicQuestionCount = buildSubtopicQuestionCount(allQuestions);
    const diagramFirstSet = new Set(diagramFirstPages || []);
    const tapRevealHeavySet = new Set(tapRevealHeavyPages || []);

    function pagesCoveringCode(code) {
      const subtopicIds = [...(codeToSubtopics.get(code) || [])];
      const seen = new Map();
      subtopicIds.forEach((id) => {
        (subtopicToPages.get(id) || []).forEach((page) => {
          if (!seen.has(page.href)) seen.set(page.href, page);
        });
      });
      return { coveringPages: [...seen.values()], subtopicIds };
    }

    function buildRow(specPoint) {
      const { coveringPages, subtopicIds } = pagesCoveringCode(specPoint.code);
      const status = coveringPages.length > 0 ? 'covered' : 'not built';
      const questionsApplicable = specPoint.depth === 'be able to' && status === 'covered';
      const questionCount = questionsApplicable
        ? subtopicIds.reduce((sum, id) => sum + (subtopicQuestionCount.get(id) || 0), 0)
        : null;

      const flags = [];
      if (status === 'covered') {
        if (specPoint.depth === 'understand' && coveringPages.every((p) => !diagramFirstSet.has(p.href))) {
          flags.push('understand point, no page covering it is a verified diagram-first page');
        }
        if (questionsApplicable && questionCount < THIN_QUESTION_THRESHOLD) {
          flags.push(`be able to point, only ${questionCount} practice question${questionCount === 1 ? '' : 's'} site-wide`);
        }
        if (coveringPages.length === 1 && tapRevealHeavySet.has(coveringPages[0].href)) {
          flags.push('covered only on a page where tap-to-reveal content outweighs visible prose');
        }
      }

      return {
        code: specPoint.code,
        topic: specPoint.topic,
        depth: specPoint.depth,
        text: specPoint.text,
        group: specPoint.group || null,
        status,
        pages: coveringPages,
        questionCount,
        flags,
      };
    }

    const rows = specPoints.map(buildRow);

    const topicNumbers = [...new Set(rows.map((row) => row.topic))].sort((a, b) => a - b);
    const topics = topicNumbers.map((number) => {
      const topicRows = rows.filter((row) => row.topic === number);
      return {
        number,
        total: topicRows.length,
        covered: topicRows.filter((row) => row.status === 'covered').length,
        notBuilt: topicRows.filter((row) => row.status === 'not built').length,
        flagged: topicRows.filter((row) => row.flags.length > 0).length,
      };
    });

    const summary = topics.reduce(
      (acc, topic) => ({
        total: acc.total + topic.total,
        covered: acc.covered + topic.covered,
        notBuilt: acc.notBuilt + topic.notBuilt,
        flagged: acc.flagged + topic.flagged,
      }),
      { total: 0, covered: 0, notBuilt: 0, flagged: 0 }
    );

    return { rows, topics, summary };
  }

  // --- Tap-to-reveal ratio, from a page's raw HTML ------------------------

  function wordCount(fragment) {
    const text = fragment.replace(/<[^>]+>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ');
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }

  /**
   * The share (0-1) of all the words inside a page's <main> that live
   * inside a .glossary-definition tap-to-reveal panel (both the <span>
   * and <div> forms this site uses) rather than always-visible prose.
   * 0 when <main> is missing or has no words at all. See this file's
   * own header for how src/pages.js's TAP_REVEAL_HEAVY_PAGES, and this
   * report's "covered only in a tap-to-reveal" flag, use this.
   */
  function computeTapRevealRatio(html) {
    const mainMatch = /<main>([\s\S]*?)<\/main>/.exec(html);
    const main = mainMatch ? mainMatch[1] : '';
    const revealMatches = [...main.matchAll(/<(span|div)[^>]*class="[^"]*glossary-definition[^"]*"[^>]*>([\s\S]*?)<\/\1>/g)];
    let revealWords = 0;
    revealMatches.forEach((match) => (revealWords += wordCount(match[2])));
    let withoutReveal = main;
    revealMatches.forEach((match) => {
      withoutReveal = withoutReveal.replace(match[0], '');
    });
    const visibleWords = wordCount(withoutReveal);
    const total = visibleWords + revealWords;
    return total > 0 ? revealWords / total : 0;
  }

  const api = { buildSyllabusReview, computeTapRevealRatio, THIN_QUESTION_THRESHOLD };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.SyllabusReview = api;
  }
})();
