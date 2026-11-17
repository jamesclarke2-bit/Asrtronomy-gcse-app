/**
 * Exam-style practice questions for notes/big-bang-steady-state.html
 * (spec 16.7), each with `marks` and a full mark scheme in its feedback.
 */
(function () {
  function makeQuestions(B) {
    const UNITS = ['u6.9'];
    const SPEC = '16.7';

    function markScheme(points) {
      return `Mark scheme: ${points.map((p) => `${p} (1)`).join('; ')}.`;
    }

    function single(id, prompt, options, right, point) {
      return {
        id,
        units: UNITS,
        spec: SPEC,
        marks: 1,
        prompt,
        type: 'choice',
        options,
        check(value) {
          return { correct: value === right, message: markScheme([point]) };
        },
      };
    }

    const BOTH = 'Both theories predict galaxies moving apart, faster the further away they are';
    const HOT = 'It began in a hot, dense state and has been expanding and cooling ever since';
    const NEW = 'New matter is created as the Universe expands, forming new galaxies in the gaps';
    const DOWN = 'It goes down: the same matter is spread through more space';
    const SAME = 'Just the same as it looks today';
    const CHANGE = 'Evidence that the Universe looked different long ago';
    const THEORIES = ['Big Bang', 'Steady State', 'Both theories'];
    const today = B.STEPS.length - 1;

    return [
      single('bb-expansion-alone', "Why doesn't the expansion of the Universe, on its own, decide between the Big Bang and Steady State theories?", [BOTH, 'Because the expansion has never been measured', 'Because only the Big Bang theory has galaxies moving apart', 'Because the Steady State theory says galaxies are moving towards us'], BOTH, 'both theories have galaxies moving apart, with redshift growing with distance, so the expansion fits both and cannot choose between them'),
      single('bb-start', 'What does the Big Bang theory say about the Universe?', [HOT, 'It has always existed and always looked the same', 'It is not expanding', 'It began cold and has been heating up'], HOT, 'the Universe began in a hot, dense state and has expanded and cooled ever since'),
      single('bb-new-matter', 'How does the Steady State theory keep the Universe looking the same while it expands?', [NEW, 'Galaxies stop moving apart after a while', 'Old galaxies shrink to fill less space', 'Space does not really expand'], NEW, 'new matter is created continuously as space expands, so the density stays the same'),
      single('bb-density', `In the Big Bang theory, what happens to the average density of the Universe as it expands? (In the drawing, the patch holds ${B.bigBang(B.FIRST_GALAXY_STEP).length} galaxies at step ${B.FIRST_GALAXY_STEP + 1}, when galaxies have first formed, and ${B.bigBang(today).length} today.)`, [DOWN, 'It stays the same', 'It goes up', 'It goes up, then down'], DOWN, 'it decreases, because the same matter spreads out through more and more space'),
      single('bb-past', 'Light from very distant galaxies left them long ago. According to the Steady State theory, how should the very distant Universe look?', [SAME, 'Hotter and denser than today', 'Full of quasars and young galaxies', 'Completely empty'], SAME, 'the same as today: in the Steady State theory the Universe never changes'),
      single('bb-what-decides', 'What kind of evidence is needed to choose between the two theories?', [CHANGE, 'More measurements of galaxies moving apart', 'The speed of light', 'The size of the Milky Way'], CHANGE, 'evidence that the Universe has changed over time, for example looking far away to see how it was long ago'),
      {
        id: 'bb-match',
        units: UNITS,
        spec: SPEC,
        marks: 3,
        prompt: 'Which theory, or both, does each statement belong to?',
        fields: [
          { key: 'beginning', type: 'choice', label: '(a) The Universe had a beginning', options: THEORIES },
          { key: 'created', type: 'choice', label: '(b) New matter is always being created', options: THEORIES },
          { key: 'apart', type: 'choice', label: '(c) Galaxies are moving apart', options: THEORIES },
        ],
        check(value) {
          const rights = ['Big Bang', 'Steady State', 'Both theories'];
          const keys = ['beginning', 'created', 'apart'];
          const got = keys.filter((k, i) => value[k] === rights[i]).length;
          const scheme = markScheme(['(a) Big Bang: a hot, dense beginning', '(b) Steady State: new matter keeps the density the same', '(c) both theories: the Universe is expanding in each']);
          return { correct: got === 3, message: `${got} out of 3 marks. ${scheme}` };
        },
      },
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.BigBangQuestions = api;
  }
})();
