/**
 * Exam-style practice questions for notes/galaxy-types.html (spec 15.6,
 * 15.7), each with `marks` and a full mark scheme in its feedback. The
 * "classify this galaxy" questions draw their galaxy with GalaxyDrawing
 * in the browser; classes and fork positions come from GalaxyTypes.
 */
(function () {
  function makeQuestions(T) {
    const UNITS = ['u6.6'];

    function markScheme(points) {
      return `Mark scheme: ${points.map((p) => `${p} (1)`).join('; ')}.`;
    }

    function scored(results, points) {
      const got = results.filter(Boolean).length;
      const total = results.length;
      const scheme = markScheme(points);
      return { correct: got === total, message: `${got} out of ${total} mark${total === 1 ? '' : 's'}. ${scheme}` };
    }

    function single(id, spec, prompt, options, right, point, extra = {}) {
      return {
        id,
        units: UNITS,
        spec,
        marks: 1,
        prompt,
        type: 'choice',
        options,
        ...extra,
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

    function picture(draw, description) {
      return function render(container) {
        const panelDiv = document.createElement('div');
        panelDiv.className = 'spectrum-panel gt-question-diagram';
        const wrap = document.createElement('div');
        wrap.className = 'labelled-diagram-wrap';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        [['viewBox', '0 0 240 200'], ['width', 240], ['height', 200], ['class', 'responsive-svg'], ['role', 'img'], ['aria-label', description]].forEach(([k, v]) => svg.setAttribute(k, v));
        wrap.appendChild(svg);
        panelDiv.appendChild(wrap);
        container.appendChild(panelDiv);
        window.SpectrumDrawing.panel(svg);
        window.GalaxyDrawing.drawGalaxy(svg, draw, 120, 100, 78);
      };
    }

    const NAMES = T.CLASSES.map((c) => c.name);
    function classify(id, draw, answerId, description) {
      const right = T.classById(answerId);
      return single(id, '15.6', 'Classify the galaxy in the drawing, using the Hubble classification.', NAMES, right.name, `${right.name.toLowerCase()}: ${right.clue}`, { render: picture(draw, description) });
    }

    const SPIRALS = 'Spirals (Sa, Sb, Sc)';
    const BARRED = 'Barred spirals (SBa, SBb, SBc)';
    const ELLIPS = 'Ellipticals (E0 to E7)';
    const NO = 'No: it sorts galaxies by shape; Hubble once wondered whether galaxies changed along it, but that is no longer thought true';

    return [
      // 15.6: classify drawn galaxies.
      classify('gt-classify-elliptical', { kind: 'elliptical', e: 4, angle: 25 }, 'elliptical', 'A drawn galaxy: a smooth, slightly flattened oval glow, brightest in the middle, with no arms or clumps.'),
      classify('gt-classify-barred', { kind: 'barred', sub: 'b', tilt: 0.15, angle: -20 }, 'barred', 'A drawn galaxy: a straight bright bar through the centre, with two spiral arms starting from its ends.'),
      classify('gt-classify-irregular', { kind: 'irregular', seed: 41 }, 'irregular', 'A drawn galaxy: a ragged scatter of glowing clumps with no regular shape, no centre and no arms.'),
      classify('gt-classify-spiral', { kind: 'spiral', sub: 'c', tilt: 0.25, angle: 35 }, 'spiral', 'A drawn galaxy: a small round bright centre with two loose spiral arms winding out from it, and no bar.'),
      single('gt-bar-or-not', '15.6', 'How do you tell a barred spiral from an ordinary spiral galaxy?', ['A barred spiral has a straight bar of stars through its centre, and its arms start from the ends of the bar', 'A barred spiral has more arms', 'A barred spiral is always bigger', 'A barred spiral has no central bulge at all'], 'A barred spiral has a straight bar of stars through its centre, and its arms start from the ends of the bar', 'a barred spiral has a straight bar of stars across its centre, with the arms starting from the ends of the bar; an ordinary spiral’s arms start from a round central bulge'),
      // 15.7: the tuning fork.
      multi(
        'gt-fork-parts',
        '15.7',
        'Where did Hubble place each type on his tuning fork diagram? (a) The handle (b) One prong (c) The other prong',
        [
          { key: 'handle', type: 'choice', label: '(a) The handle', options: [ELLIPS, SPIRALS, BARRED] },
          { key: 'upper', type: 'choice', label: '(b) The upper prong', options: [ELLIPS, SPIRALS, BARRED] },
          { key: 'lower', type: 'choice', label: '(c) The lower prong', options: [ELLIPS, SPIRALS, BARRED] },
        ],
        [ELLIPS, SPIRALS, BARRED],
        ['(a) ellipticals along the handle, from round E0 to the most flattened E7', '(b) ordinary spirals on one prong, Sa to Sc', '(c) barred spirals on the other prong, SBa to SBc (the two prongs meet at S0, where the handle splits)'],
      ),
      single('gt-e-number', '15.7', 'On the tuning fork, what does the number after E tell you about an elliptical galaxy?', ['How flattened (elongated) it looks: E0 is round, E7 the flattest', 'How far away it is', 'How many stars it has', 'How old it is'], 'How flattened (elongated) it looks: E0 is round, E7 the flattest', 'how flattened it looks: E0 round, rising to E7 for the most flattened ellipticals'),
      single('gt-a-to-c', '15.7', 'Along each prong, Hubble went from a to c (Sa to Sc, SBa to SBc). What changes?', ['The central bulge gets smaller and the arms more loosely wound', 'The galaxy gets further away', 'The galaxy gets older', 'The arms get more numerous and the bar longer'], 'The central bulge gets smaller and the arms more loosely wound', 'from a to c, the central bulge gets smaller and the arms more loosely wound and open'),
      single('gt-irregular-place', '15.7', 'Where are irregular galaxies on Hubble’s tuning fork?', ['They are not on the fork: Hubble placed them separately', 'At the end of the handle, after E7', 'Where the handle splits, at S0', 'At the ends of the prongs, after Sc'], 'They are not on the fork: Hubble placed them separately', 'irregulars have no regular shape, so they do not fit on the fork; Hubble put them in a separate class'),
      single('gt-evolution', '15.7', 'Does the tuning fork show galaxies changing from one type into another as they age?', [NO, 'Yes: every galaxy starts as an elliptical and becomes a spiral', 'Yes: every galaxy starts as a spiral and becomes an elliptical', 'Yes: barred spirals turn into ordinary spirals'], NO, 'no: it is a way of sorting galaxies by their shape; Hubble wondered whether galaxies might change along it, but that idea is no longer thought true'),
      single('gt-milky-way', '15.7', `The Milky Way is type ${T.MILKY_WAY_TYPE}. Where is it on the tuning fork?`, ['On the barred-spiral prong, in the middle (b)', 'On the handle, with the ellipticals', 'On the ordinary-spiral prong, at the end (c)', 'Off the fork, with the irregulars'], 'On the barred-spiral prong, in the middle (b)', 'SB means barred spiral, so it is on the barred-spiral prong, and b puts it in the middle, between SBa and SBc'),
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.GalaxyTypesQuestions = api;
  }
})();
