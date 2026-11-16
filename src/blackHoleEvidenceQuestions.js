/**
 * Exam-style practice questions for notes/black-holes.html (spec 14.11),
 * each with `marks` and a full mark scheme in its feedback. Values come
 * from BlackHoleEvidence (src/blackHoleEvidence.js) and the neutron-star
 * limit from MassiveStar; the calculation states its formula and every
 * value it needs, accepts 2% either side and shows the working.
 */
(function () {
  function makeQuestions(B, M) {
    const UNITS = ['u4.16'];
    const SPEC = '14.11';

    function markScheme(points) {
      return `Mark scheme: ${points.map((p) => `${p} (1)`).join('; ')}.`;
    }

    function scored(results, points) {
      const got = results.filter(Boolean).length;
      const total = results.length;
      const scheme = markScheme(points);
      return { correct: got === total, message: `${got} out of ${total} mark${total === 1 ? '' : 's'}. ${scheme}` };
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
          const scheme = markScheme([point]);
          return { correct: value === right, message: scheme };
        },
      };
    }

    function multi(id, prompt, fields, rights, points) {
      return {
        id,
        units: UNITS,
        spec: SPEC,
        marks: fields.length,
        prompt,
        fields,
        check(value) {
          return scored(fields.map((f, k) => value[f.key] === rights[k]), points);
        },
      };
    }

    const EFFECTS = 'From its effects on things nearby: gas heated as it falls in gives out X-rays, and stars orbit an unseen mass';
    const HOT_GAS = 'Gas spiralling into a disc round it is heated to millions of degrees';
    const TOO_HEAVY = `It is too heavy to be a neutron star (above about ${M.NEUTRON_STAR_MAX_MSUN} times the Sun’s mass)`;
    const SMALLER = 'The partner’s orbit is the smaller one';
    const HEAVIER = 'So the partner is the heavier';
    const DUST = 'Dust blocks visible light from the centre, but infrared passes through it';
    const FASTEST = 'When it is closest to the unseen mass';
    const SUPERMASSIVE = 'A supermassive black hole';

    const aAU = B.S2.aAU;
    const T = B.S2.periodYears;
    const massMillions = B.massFromOrbit(aAU, T) / 1e6;
    const lo = (0.98 * massMillions).toFixed(2);
    const hi = (1.02 * massMillions).toFixed(2);
    const aText = aAU.toLocaleString('en-GB');
    const cube = (aAU ** 3).toLocaleString('en-GB');
    const mText = massMillions.toFixed(2);
    const cyg = B.CYGNUS_X1.companionMsun;

    return [
      single('bh-how-know', 'A black hole gives out no light. How can astronomers know one is there?', [EFFECTS, 'They photograph it with a large optical telescope', 'They see it as a dark spot against the stars', 'They cannot: black holes are only ideas'], EFFECTS, 'from its effects on things nearby: gas falling in is heated to millions of degrees and gives out X-rays, and stars (or a companion star) orbit a mass that gives out no light'),
      single('bh-xray-why', 'Why do some black holes shine brightly in X-rays?', [HOT_GAS, 'The black hole itself glows in X-rays', 'X-rays bounce off the black hole', 'The black hole is very cold'], HOT_GAS, 'the X-rays come from gas spiralling into an accretion disc round the black hole, heated to millions of degrees, outside the black hole, not from the black hole itself'),
      single('bh-too-heavy', `In an X-ray binary, the unseen partner has about ${cyg} times the Sun’s mass. A neutron star can have at most about ${M.NEUTRON_STAR_MAX_MSUN} times the Sun’s mass. Why must the partner be a black hole?`, [TOO_HEAVY, 'It is too faint to be a star', 'It gives out X-rays', 'It is orbited by a star'], TOO_HEAVY, `at about ${cyg} times the Sun’s mass it is far above the most a neutron star can have (about ${M.NEUTRON_STAR_MAX_MSUN}), yet gives out no visible light, so it can only be a black hole`),
      multi(
        'bh-orbits',
        'A visible star and an unseen partner orbit their shared centre of mass. The visible star moves on a big orbit; the partner on a small one. (a) Which orbit is smaller? (b) What does that tell you?',
        [
          { key: 'orbit', type: 'choice', label: '(a) Smaller orbit', options: [SMALLER, 'The visible star’s orbit is the smaller one', 'They are the same size'] },
          { key: 'mass', type: 'choice', label: '(b) So', options: [HEAVIER, 'So the partner is the lighter', 'So they have the same mass'] },
        ],
        [SMALLER, HEAVIER],
        ['(a) the unseen partner’s orbit is the smaller one', '(b) the heavier body sits closer to the centre of mass, so the partner is the heavier'],
      ),
      single('bh-infrared', 'Why do astronomers use infrared, not visible light, to watch stars at the centre of the Milky Way?', [DUST, 'Infrared travels faster than visible light', 'The stars there give out only infrared', 'Visible light is absorbed by the black hole'], DUST, 'dust between us and the centre of the Galaxy blocks visible light, but infrared passes through the dust'),
      single('bh-s2-fast', 'The star S2 orbits an unseen mass at the centre of the Milky Way on a long, thin orbit. When does it move fastest?', [FASTEST, 'When it is furthest away', 'It always moves at the same speed', 'Halfway between its closest and furthest points'], FASTEST, 'it moves fastest when it is closest to the unseen mass, and slowest far out, as for any orbit (Kepler’s second law)'),
      {
        id: 'bh-mass-calc',
        units: UNITS,
        spec: SPEC,
        marks: 2,
        prompt: `The star S2 orbits the centre of the Milky Way. Half its orbit’s longest width is a = ${aText} AU and it goes round in T = ${T} years. In Solar System units, Kepler’s third law gives the central mass as M = a³ ÷ T² (M in Sun masses, a in AU, T in years). Find the mass, in millions of Sun masses.`,
        type: 'number',
        unitLabel: 'million Sun masses',
        check(value) {
          const v = Number(value);
          const tol = 0.02 * massMillions * (1 + 1e-9);
          const correct = Number.isFinite(v) && Math.abs(v - massMillions) <= tol;
          const scheme = markScheme([`M = a³ ÷ T² = ${aText}³ ÷ ${T}² = ${cube} ÷ ${T * T}`, `= ${Math.round(massMillions * 1e6).toLocaleString('en-GB')} Sun masses, about ${mText} million (accept ${lo} to ${hi})`]);
          return { correct, message: `${correct ? 'Correct.' : 'Not quite.'} ${scheme}` };
        },
        answer: { value: massMillions },
      },
      single('bh-supermassive', 'About 4 million Sun masses sit at the centre of the Milky Way, inside S2’s closest approach, yet give out no starlight. What is it?', [SUPERMASSIVE, 'A cluster of bright stars', 'A neutron star', 'A cloud of gas'], SUPERMASSIVE, 'a supermassive black hole: that much mass packed into so small a space, giving out no light, can only be a black hole'),
      single('bh-cygnus', 'Cygnus X-1 is a famous example of what?', ['An X-ray binary with a black hole', 'A planetary nebula', 'A Cepheid variable', 'A supernova remnant'], 'An X-ray binary with a black hole', 'an X-ray binary: a star losing gas to an unseen partner of about 20 times the Sun’s mass, too heavy for a neutron star, so a black hole'),
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.BlackHoleEvidenceQuestions = api;
  }
})();
