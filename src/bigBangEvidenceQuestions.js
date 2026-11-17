/**
 * Exam-style practice questions for notes/big-bang-evidence.html (spec
 * 16.8, 16.9), each with `marks` and a full mark scheme in its feedback:
 * one or more per piece of evidence, and one on why the CMB's
 * fluctuations matter.
 */
(function () {
  function makeQuestions(E) {
    const UNITS = ['u6.3'];

    function markScheme(points) {
      return `Mark scheme: ${points.map((p) => `${p} (1)`).join('; ')}.`;
    }

    function single(id, spec, prompt, options, right, point) {
      return {
        id,
        units: UNITS,
        spec,
        marks: 1,
        prompt,
        type: 'choice',
        options,
        check(value) {
          return { correct: value === right, message: markScheme([point]) };
        },
      };
    }

    const QUASAR = 'They are found only far away, so they existed long ago but not now: the Universe has changed';
    const CMB = 'The cooled glow of the hot, dense early Universe, stretched into microwaves by the expansion';
    const CMB_SS = 'In the Steady State theory the Universe was never hot and dense, so there is nothing to make this glow';
    const DEEP = 'Distant galaxies, seen as they were long ago, are smaller and more irregular than nearby ones';
    const LOOK = 'Their light left them long ago, so we see them as they were then';
    const SEEDS = 'Slightly denser regions that gravity grew into galaxies and clusters of galaxies';
    const TEST = 'Their pattern can be compared with what each theory predicts, testing how the Universe evolved';
    const FINER = 'They mapped the fluctuations across the whole sky in finer and finer detail';
    const SHOWS = {
      quasars: 'Something common long ago that is gone today',
      cmb: 'The Universe was once hot and dense',
      deep: 'Galaxies looked different long ago',
    };
    const SHOW_OPTIONS = Object.values(SHOWS);

    return [
      single('ev-quasars', '16.8', 'Why do quasars count as evidence for the Big Bang theory?', [QUASAR, 'They are the brightest stars in our Galaxy', 'They are found equally near and far', 'They are moving towards us'], QUASAR, 'quasars are found only far away, so long ago, and none nearby: the Universe has changed, which the Steady State theory does not allow'),
      single('ev-cmb', '16.8', 'What is the cosmic microwave background (CMB)?', [CMB, 'Microwaves given out by the Sun', 'Radio waves from the centre of the Milky Way', 'Light from the most distant stars'], CMB, 'the glow of the hot early Universe, stretched to microwaves by the expansion, arriving almost equally from every direction'),
      single('ev-cmb-steady', '16.8', 'Why is the CMB a problem for the Steady State theory?', [CMB_SS, 'Because the CMB is moving towards us', 'Because the Steady State theory says the Universe is not expanding', 'Because microwaves cannot travel through space'], CMB_SS, 'the Steady State Universe was never hot and dense, so it has no natural explanation for a glow from every direction'),
      single('ev-deep-field', '16.8', 'What does the Hubble Deep Field image show that supports the Big Bang theory?', [DEEP, 'That there are no galaxies beyond the Local Group', 'That every galaxy is a spiral', 'That the Milky Way is at the centre of the Universe'], DEEP, 'a tiny patch of sky full of faint, distant galaxies, many smaller and more irregular than nearby ones, so galaxies have changed over time'),
      single('ev-lookback', '16.8', 'Why do very distant objects tell us about the Universe in the past?', [LOOK, 'Because distant objects are older than nearby ones', 'Because light from them travels faster', 'Because they are moving towards us'], LOOK, 'light takes time to travel, so light from far away left long ago and shows the object as it was then'),
      {
        id: 'ev-match',
        units: UNITS,
        spec: '16.8',
        marks: 3,
        prompt: 'What does each piece of evidence show?',
        fields: [
          { key: 'quasars', type: 'choice', label: '(a) Quasars found only far away', options: SHOW_OPTIONS },
          { key: 'cmb', type: 'choice', label: '(b) The cosmic microwave background', options: SHOW_OPTIONS },
          { key: 'deep', type: 'choice', label: '(c) The Hubble Deep Field', options: SHOW_OPTIONS },
        ],
        check(value) {
          const keys = ['quasars', 'cmb', 'deep'];
          const got = keys.filter((k) => value[k] === SHOWS[k]).length;
          const scheme = markScheme([
            '(a) quasars: something common long ago that is gone today, so the Universe has changed',
            '(b) the CMB: the Universe was once hot and dense',
            '(c) the Hubble Deep Field: galaxies looked different long ago',
          ]);
          return { correct: got === 3, message: `${got} out of 3 marks. ${scheme}` };
        },
      },
      single('ev-seeds', '16.9', 'What are the tiny warmer and cooler patches in the CMB thought to be?', [SEEDS, 'Faults in the telescopes that measured them', 'Stars in front of the CMB', 'Places where the Universe is not expanding'], SEEDS, 'slightly denser regions of the early Universe: the seeds that gravity grew into galaxies and clusters'),
      single('ev-why-matter', '16.9', 'Why do the fluctuations in the CMB matter for theories of how the Universe evolved?', [TEST, 'They prove the Steady State theory is correct', 'They show the Universe is not expanding', 'They tell us the temperature of the Sun'], TEST, 'theories predict the sizes and strengths of the patches, so measuring them tests how the Universe evolved, including how structure grew'),
      single('ev-wmap-planck', '16.9', 'What did the WMAP and Planck spacecraft do?', [FINER, 'They landed on distant galaxies', 'They discovered the first quasar', 'They measured the distance to the Moon'], FINER, `they mapped the CMB's fluctuations across the whole sky in finer and finer detail: in the drawing, from ${E.MAP_LEVELS[0].cells} cells across to ${E.MAP_LEVELS[2].cells}`),
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.BigBangEvidenceQuestions = api;
  }
})();
