/**
 * Exam-style practice questions for notes/local-group.html (spec 15.4,
 * 15.5, 15.13), each with `marks` and a full mark scheme in its feedback.
 * Distances come from LocalGroup (src/localGroup.js), whose LMC and
 * Andromeda distances come from the Variable stars page's Cepheids; the
 * light-year conversion uses the data sheet's 1 pc = 3.26 ly.
 */
(function () {
  function makeQuestions(L) {
    const UNITS = ['u6.5'];

    function markScheme(points) {
      return `Mark scheme: ${points.map((p) => `${p} (1)`).join('; ')}.`;
    }

    function scored(results, points) {
      const got = results.filter(Boolean).length;
      const total = results.length;
      const scheme = markScheme(points);
      return { correct: got === total, message: `${got} out of ${total} mark${total === 1 ? '' : 's'}. ${scheme}` };
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
          const scheme = markScheme([point]);
          return { correct: value === right, message: scheme };
        },
      };
    }

    function multi(id, spec, prompt, fields, rights, points) {
      return {
        id,
        units: UNITS,
        spec,
        marks: fields.length,
        prompt,
        fields,
        check(value) {
          return scored(fields.map((f, k) => value[f.key] === rights[k]), points);
        },
      };
    }

    const BOUND = 'A group of more than 50 galaxies, including the Milky Way, held together by their gravity';
    const GRAVITY = 'Gravity pulls galaxies towards each other, so they gather into groups, clusters and superclusters';
    const SATELLITES = 'The Large and Small Magellanic Clouds';
    const lmcPc = L.LMC_PC;
    const lmcPcText = lmcPc.toLocaleString('en-GB');
    const lyPerPc = L.PC_TO_LY;
    const lmcLy = lmcPc * lyPerPc;
    const lo = Math.round(0.98 * lmcLy).toLocaleString('en-GB');
    const hi = Math.round(1.02 * lmcLy).toLocaleString('en-GB');
    const m31 = L.distanceText(L.M31_PC);
    const POSITIONS = ['1st (smallest)', '2nd', '3rd', '4th', '5th (largest)'];

    return [
      // 15.4
      single('lg-what', '15.4', 'What is the Local Group?', [BOUND, 'All the stars near the Sun', 'The galaxies we can see with the naked eye', 'Every galaxy in the Universe'], BOUND, 'the group of galaxies, including the Milky Way, gravitationally linked (held together by their gravity): more than 50 galaxies (about 80 known), most of them dwarfs'),
      single('lg-held', '15.4', 'What holds the galaxies of the Local Group together?', ['Their gravity', 'A cloud of gas round them all', 'Magnetic fields', 'Nothing: they are just in the same direction in the sky'], 'Their gravity', 'their gravity: the galaxies are gravitationally linked, so they stay together instead of moving apart with the expanding Universe'),
      // 15.5
      single('lg-largest', '15.5', 'Which is the largest galaxy in the Local Group?', ['The Andromeda Galaxy (M31)', 'The Triangulum Galaxy (M33)', 'The Large Magellanic Cloud', 'The Small Magellanic Cloud'], 'The Andromeda Galaxy (M31)', 'the Andromeda Galaxy (M31), a spiral a little bigger than the Milky Way'),
      single('lg-satellites', '15.5', 'Which two small irregular galaxies orbit close to the Milky Way?', [SATELLITES, 'Andromeda and Triangulum', 'M31 and M33', 'The Pleiades and the Hyades'], SATELLITES, 'the Large and Small Magellanic Clouds (LMC and SMC), small irregular galaxies close to the Milky Way, seen from the southern hemisphere'),
      multi(
        'lg-types',
        '15.5',
        'What type of galaxy is each of these Local Group members? (a) The Andromeda Galaxy (M31) (b) The Triangulum Galaxy (M33) (c) The Large Magellanic Cloud',
        [
          { key: 'a', type: 'choice', label: '(a) M31', options: ['Spiral', 'Irregular', 'Elliptical'] },
          { key: 'b', type: 'choice', label: '(b) M33', options: ['Spiral', 'Irregular', 'Elliptical'] },
          { key: 'c', type: 'choice', label: '(c) LMC', options: ['Spiral', 'Irregular', 'Elliptical'] },
        ],
        ['Spiral', 'Spiral', 'Irregular'],
        ['(a) M31 is a spiral', '(b) M33 is a spiral, smaller than M31', '(c) the LMC is a small irregular galaxy'],
      ),
      single('lg-m31-distance', '15.5', 'Roughly how far away is the Andromeda Galaxy?', [`About 2.5 million light-years`, 'About 2.5 thousand light-years', 'About 25 light-years', 'About 25 billion light-years'], 'About 2.5 million light-years', `${m31}, the most distant thing most people can see with the naked eye`),
      {
        id: 'lg-lmc-ly',
        units: UNITS,
        spec: '15.5',
        marks: 2,
        prompt: `A Cepheid in the Large Magellanic Cloud puts it about ${lmcPcText} pc away. Using 1 pc = ${lyPerPc} light-years, how far away is it in light-years?`,
        type: 'number',
        unitLabel: 'light-years',
        check(value) {
          const v = Number(String(value).replace(/,/g, ''));
          const tol = 0.02 * lmcLy * (1 + 1e-9);
          const correct = Number.isFinite(v) && Math.abs(v - lmcLy) <= tol;
          const scheme = markScheme([`distance = ${lmcPcText} × ${lyPerPc}`, `= ${Math.round(lmcLy).toLocaleString('en-GB')} light-years, about 160,000 (accept ${lo} to ${hi})`]);
          return { correct, message: `${correct ? 'Correct.' : 'Not quite.'} ${scheme}` };
        },
        answer: { value: lmcLy },
      },
      // 15.13
      single('lg-why-clusters', '15.13', 'Why are galaxies found in groups, clusters and superclusters, not spread out evenly?', [GRAVITY, 'They were all made in one place and have not moved', 'Dust hides the galaxies between the clusters', 'Light from galaxies attracts other galaxies'], GRAVITY, 'gravity pulls galaxies towards each other; over billions of years it has gathered them into groups and clusters, and clusters into superclusters'),
      multi(
        'lg-ladder',
        '15.13',
        'Put these in order of size, from smallest to largest: (a) Cluster (b) Galaxy (c) Supercluster (d) Group',
        [
          { key: 'a', type: 'choice', label: '(a) Cluster', options: POSITIONS.slice(0, 4) },
          { key: 'b', type: 'choice', label: '(b) Galaxy', options: POSITIONS.slice(0, 4) },
          { key: 'c', type: 'choice', label: '(c) Supercluster', options: POSITIONS.slice(0, 4) },
          { key: 'd', type: 'choice', label: '(d) Group', options: POSITIONS.slice(0, 4) },
        ],
        ['3rd', '1st (smallest)', '4th', '2nd'],
        [`(a) cluster 3rd`, `(b) galaxy 1st (smallest)`, `(c) supercluster 4th (largest of these; the cosmic web of filaments and voids is bigger still)`, `(d) group 2nd`],
      ),
      single('lg-voids', '15.13', 'On the very largest scales, how are superclusters arranged?', ['Along long filaments, round huge, nearly empty voids, like a web', 'In a single sphere centred on the Milky Way', 'Evenly spaced, like a grid', 'In one flat disc'], 'Along long filaments, round huge, nearly empty voids, like a web', 'superclusters lie along long filaments and sheets, round huge, nearly empty voids: a cosmic web'),
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.LocalGroupQuestions = api;
  }
})();
