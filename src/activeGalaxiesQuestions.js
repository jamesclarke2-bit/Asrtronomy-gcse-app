/**
 * Exam-style practice questions for notes/active-galaxies.html (spec
 * 15.9-15.12), each with `marks` and a full mark scheme in its feedback.
 * Types and bands come from ActiveGalaxies; the "name the parts" question
 * draws the AGN with the page's own drawing (ActiveGalaxyDrawing) in the
 * browser.
 */
(function () {
  function makeQuestions(A) {
    const UNITS = ['u6.7'];

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

    function multi(id, spec, prompt, fields, rights, points, extra = {}) {
      return {
        id,
        units: UNITS,
        spec,
        marks: fields.length,
        prompt,
        fields,
        ...extra,
        check(value) {
          return scored(fields.map((f, k) => value[f.key] === rights[k]), points);
        },
      };
    }

    function renderParts(container) {
      const panelDiv = document.createElement('div');
      panelDiv.className = 'spectrum-panel ag-question-diagram';
      const wrap = document.createElement('div');
      wrap.className = 'labelled-diagram-wrap';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      [['viewBox', '0 0 400 260'], ['width', 400], ['height', 260], ['class', 'responsive-svg'], ['role', 'img'],
        ['aria-label', 'An active galactic nucleus drawn side-on, with four parts lettered: A, the tiny black centre; B, the flat glowing disc round it; C, the thick dark ring round the disc; D, the narrow beam shooting out along the axis.']].forEach(([k, v]) => svg.setAttribute(k, v));
      wrap.appendChild(svg);
      panelDiv.appendChild(wrap);
      container.appendChild(panelDiv);
      window.SpectrumDrawing.panel(svg);
      window.ActiveGalaxyDrawing.drawAgn(svg, wrap, { cx: 200, cy: 130, scale: 0.8, letters: true });
    }

    const POWER = 'Matter falling onto a supermassive black hole, heated as it spirals in through an accretion disc';
    const BEYOND = 'It gives out huge amounts of radiation beyond visible light, such as radio and X-rays, from its tiny centre';
    const T = Object.fromEntries(A.TYPES.map((t) => [t.id, t]));
    const D_SEY = 'A spiral galaxy with an unusually bright, compact centre';
    const D_QSO = 'Looks like a star: so distant and luminous that its galaxy is outshone';
    const D_BLZ = 'A jet points almost straight at us, so it is very bright and flickers quickly';
    const DESCS = [D_SEY, D_QSO, D_BLZ];
    const PARTS = ['Supermassive black hole', 'Accretion disc', 'Dusty ring (torus)', 'Jet'];
    const RADIO_JETS = 'The jets and the lobes at their ends';
    const IR_DUST = 'The warm dusty ring';
    const XRAY_HOT = 'The hottest gas, close to the black hole';
    const BAND_OPTS = [RADIO_JETS, IR_DUST, XRAY_HOT];
    const MANY = 'Each part of the spectrum shows a different part of the AGN, so only together do they show the whole thing';

    return [
      // 15.9
      single('ag-beyond', '15.9', 'What makes an active galaxy different from an ordinary galaxy like ours?', [BEYOND, 'It has more stars', 'It is closer to us', 'It gives out only visible light'], BEYOND, 'an active galaxy gives out huge amounts of radiation beyond visible light (radio, infrared, X-rays, gamma rays) from a tiny region at its centre, its active nucleus'),
      // 15.10
      single('ag-power', '15.10', 'What powers an Active Galactic Nucleus (AGN)?', [POWER, 'Nuclear fusion in one giant star', 'A supernova that never stops', 'Light from all the galaxy’s stars added up'], POWER, 'matter falling onto a supermassive black hole: gas spirals in through an accretion disc and is heated to millions of degrees, giving out huge amounts of energy before it falls in'),
      multi(
        'ag-parts',
        '15.10',
        'The drawing shows an AGN side-on with four lettered parts. Name each part: (a) A (b) B (c) C (d) D',
        ['A', 'B', 'C', 'D'].map((k) => ({ key: k, type: 'choice', label: `(${k.toLowerCase()}) ${k}`, options: PARTS })),
        PARTS,
        ['(a) A: the supermassive black hole at the centre', '(b) B: the accretion disc of hot gas spiralling in', '(c) C: the ring (torus) of dusty gas round the disc', '(d) D: a jet of particles fired out along the axis'],
        { render: renderParts },
      ),
      // 15.11
      multi(
        'ag-match',
        '15.11',
        'Match each type of active galaxy to its description. (a) Seyfert galaxy (b) Quasar (c) Blazar',
        [
          { key: 'seyfert', type: 'choice', label: '(a) Seyfert galaxy', options: DESCS },
          { key: 'quasar', type: 'choice', label: '(b) Quasar', options: DESCS },
          { key: 'blazar', type: 'choice', label: '(c) Blazar', options: DESCS },
        ],
        DESCS,
        [`(a) ${T.seyfert.name}: ${T.seyfert.clue}`, `(b) ${T.quasar.name}: ${T.quasar.clue}`, `(c) ${T.blazar.name}: ${T.blazar.clue}`],
      ),
      single('ag-quasar-name', '15.11', 'Quasars were named “quasi-stellar objects”. Why do they look like stars?', ['They are so far away that only their brilliant centre shows, as a point', 'They are stars in our own Galaxy', 'They are small and cool', 'They have no light of their own'], 'They are so far away that only their brilliant centre shows, as a point', 'they are so far away, and their centres so bright, that only a point of light shows: the galaxy round it is outshone'),
      single('ag-blazar', '15.11', 'Why are blazars especially bright and quick to change in brightness?', ['One of their jets points almost straight at us', 'They are the closest galaxies to us', 'They have no dust at all', 'They are made of very hot stars'], 'One of their jets points almost straight at us', 'one jet points almost straight at us, so we look down the jet: very bright, and changing quickly'),
      // 15.12
      multi(
        'ag-bands',
        '15.12',
        'Which part of an AGN does each part of the spectrum mainly show? (a) Radio (b) Infrared (c) X-ray',
        [
          { key: 'radio', type: 'choice', label: '(a) Radio', options: BAND_OPTS },
          { key: 'ir', type: 'choice', label: '(b) Infrared', options: BAND_OPTS },
          { key: 'xray', type: 'choice', label: '(c) X-ray', options: BAND_OPTS },
        ],
        BAND_OPTS,
        ['(a) radio: the jets and the giant lobes at their ends', '(b) infrared: the warm dusty ring round the disc', '(c) X-ray: the hottest gas close to the black hole, seen with space telescopes'],
      ),
      single('ag-why-many', '15.12', 'Why do astronomers study AGNs in many parts of the electromagnetic spectrum, not just visible light?', [MANY, 'Visible light from AGNs is too bright to look at', 'It is cheaper', 'AGNs give out no visible light at all'], MANY, 'each part of the spectrum shows a different part of the AGN (radio the jets, infrared the dust, X-rays the hottest gas), so information from many regions is combined; some bands need telescopes in space'),
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.ActiveGalaxiesQuestions = api;
  }
})();
