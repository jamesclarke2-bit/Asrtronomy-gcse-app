/**
 * Exam-style practice questions for notes/sun-like-star.html, each with
 * `marks`, a `spec` tag (14.3, 14.4, 14.5 or 14.9) and a full mark scheme
 * in its feedback. Stage names, times and core changes come from
 * SunLikeStar (src/sunLikeStar.js). 13.8 is not tagged here: see that
 * file's header.
 */
(function () {
  function makeQuestions(L) {
    const UNITS = ['u4.14'];

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

    const names = L.STAGES.map((s) => s.name);
    const RIGHT_ORDER = names.join(' → ');
    const swap = (arr, i, j) => {
      const a = [...arr];
      [a[i], a[j]] = [a[j], a[i]];
      return a.join(' → ');
    };
    const ORDER_OPTIONS = [RIGHT_ORDER, swap(names, 3, 4), swap(names, 0, 1), swap(names, 5, 6)];

    const FUSES_H = 'Hydrogen fuses into helium';
    const SHRINKS = 'It runs out of hydrogen, shrinks and heats up, and fusion moves to a shell around it';
    const NO_FUSION = 'No fusion: a hot carbon core about the size of the Earth';
    const NOT_HOT = 'It heats up as the cloud collapses, but is not yet hot enough for fusion';
    const RAD = 'Outward radiation pressure from the energy released by fusion in the core';
    const SHRINK = 'Gravity wins, so the star shrinks';
    const ELECTRON = 'Electron pressure: the electrons are squeezed so close that they resist being squeezed any closer';
    const NO_FUSION_WD = 'A white dwarf has no fusion, so there is no radiation pressure from its core';
    const SWELL = 'The core shrinks under gravity, but extra energy from the hotter shell pushes the outer layers out';
    const GRAVITY_WINS = 'Gravity is stronger than the gas pressure, so it keeps shrinking and heating up';
    const MAIN = 'The main sequence, about 10 billion years';
    const TOO_YOUNG = 'A white dwarf takes longer than the present age of the Universe to cool that far';
    const SHELL = 'The outer layers of a dying star, drifting away round its hot core';
    const EMISSION = 'An emission nebula glows; an absorption nebula is dark dust that blocks light from behind it';

    return [
      // 14.9: stages and timescales.
      single('sl-order', '14.9', 'Which shows the stages of a Sun-like star’s life in the right order?', ORDER_OPTIONS, RIGHT_ORDER, `${RIGHT_ORDER} (the red giant comes before the planetary nebula)`),
      multi(
        'sl-core',
        '14.9',
        'What happens to the star’s core at each stage? (a) Protostar (b) Main sequence (c) Red giant (d) White dwarf',
        [
          { key: 'protostar', type: 'choice', label: '(a) Protostar', options: [NOT_HOT, FUSES_H, SHRINKS, NO_FUSION] },
          { key: 'main', type: 'choice', label: '(b) Main sequence', options: [NOT_HOT, FUSES_H, SHRINKS, NO_FUSION] },
          { key: 'giant', type: 'choice', label: '(c) Red giant', options: [NOT_HOT, FUSES_H, SHRINKS, NO_FUSION] },
          { key: 'dwarf', type: 'choice', label: '(d) White dwarf', options: [NOT_HOT, FUSES_H, SHRINKS, NO_FUSION] },
        ],
        [NOT_HOT, FUSES_H, SHRINKS, NO_FUSION],
        [
          '(a) protostar: it heats up as the cloud collapses, but is not yet hot enough for fusion',
          '(b) main sequence: hydrogen fuses into helium in the core',
          '(c) red giant: the core runs out of hydrogen, shrinks and heats up; hydrogen fuses in a shell around it (later helium fuses into carbon in the core)',
          '(d) white dwarf: no fusion; the hot carbon core, about the size of the Earth, is all that is left',
        ],
      ),
      single('sl-longest', '14.9', 'In which stage does a Sun-like star spend most of its life shining by fusion, and for roughly how long?', [MAIN, 'The red giant, about 1 billion years', 'The protostar, about 50 million years', 'The planetary nebula, about 10,000 years'], MAIN, `the main sequence, ${L.stage('main-sequence').time}`),
      single('sl-black-dwarf', '14.9', 'Why have no black dwarfs ever been seen?', [TOO_YOUNG, 'They are too far away', 'They are hidden behind nebulae', 'Black dwarfs turn into black holes'], TOO_YOUNG, 'a white dwarf takes longer than the present age of the Universe (about 13.8 billion years) to cool into a black dwarf, so none exists yet'),
      single('sl-planetary', '14.9', 'What is a planetary nebula, such as M57, the Ring Nebula?', [SHELL, 'A cloud where planets are forming', 'A planet with a thick atmosphere', 'The cloud a star forms from'], SHELL, 'the outer layers of a dying Sun-like star, drifting away as a glowing shell round its hot core; it has nothing to do with planets'),
      single('sl-nebula-types', '14.9', 'A star forms in an emission or absorption nebula. What is the difference?', [EMISSION, 'An emission nebula is made of dust; an absorption nebula of gas', 'An absorption nebula is hotter', 'They are the same thing'], EMISSION, 'an emission nebula is glowing gas; an absorption nebula is a dark cloud of dust that blocks the light from behind it'),
      // 14.3: the main-sequence balance.
      single('sl-ms-balance', '14.3', 'In a main-sequence star, what balances the inward pull of gravity?', [RAD, 'The star’s magnetic field', 'The pull of nearby stars', 'Nothing: main-sequence stars are shrinking'], RAD, 'outward radiation pressure, from the energy released by hydrogen fusing into helium in the core, balances gravity, so the star stays the same size'),
      single('sl-ms-unbalanced', '14.3', 'If the outward pressure in a star became less than the inward pull of gravity, what would happen?', [SHRINK, 'The star would swell up', 'Nothing would change', 'The star would cool down at once'], SHRINK, 'gravity would win, so the star would shrink (until the pressure rose to balance it again)'),
      // 14.4: how the balance changes through the life cycle.
      single('sl-protostar', '14.4', 'Why does a protostar keep shrinking?', [GRAVITY_WINS, 'Radiation pressure pushes it inward', 'It is losing gas to space', 'Its core is fusing helium'], GRAVITY_WINS, 'there is no fusion yet, so gravity is stronger than the gas pressure; it shrinks and heats up until hydrogen starts to fuse'),
      single('sl-red-giant', '14.4', 'When a Sun-like star becomes a red giant, why do its outer layers swell?', [SWELL, 'Gravity becomes stronger in the outer layers', 'The star gains mass from a nebula', 'Its core stops shining'], SWELL, 'the core runs out of hydrogen and shrinks under gravity, heating up; the extra energy from fusion in the shell around it pushes the outer layers out, so the star swells and cools'),
      // 14.5: the white dwarf balance.
      single('sl-white-dwarf', '14.5', 'What holds up a white dwarf against gravity?', [ELECTRON, 'Radiation pressure from hydrogen fusion', 'The pressure of its planetary nebula', 'Nothing: it is still collapsing quickly'], ELECTRON, 'electron pressure: the electrons are squeezed so close together that they resist being squeezed any closer, which balances gravity'),
      single('sl-white-dwarf-why', '14.5', 'Why can radiation pressure not hold up a white dwarf?', [NO_FUSION_WD, 'It is too cold to give out radiation', 'Gravity is weaker in a white dwarf', 'Radiation cannot travel through carbon'], NO_FUSION_WD, 'a white dwarf has no fusion in its core, so there is no outward radiation pressure from fusion; electron pressure holds it up instead'),
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.SunLikeStarQuestions = api;
  }
})();
