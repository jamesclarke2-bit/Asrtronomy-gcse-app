/**
 * Exam-style practice questions for notes/catalogues-and-star-names.html,
 * each with `marks`, a `spec` tag (14.1 or 14.2) and a full mark scheme
 * in its feedback. Catalogue questions quote the extract rows they need
 * in their own text; names and numbers come from StarNames
 * (src/starNames.js).
 */
(function () {
  function makeQuestions(N) {
    const UNITS = ['u4.13'];

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

    const ext = (ids) => ids.map((id) => N.rowText(N.DEEP_SKY.find((o) => o.id === id))).join('; ');
    const EXTRACT = ['m1', 'm13', 'm31', 'm42', 'm57'];
    const extractText = ext(EXTRACT);

    const PERSEUS = 'Perseus';
    const SECOND = 'Probably the second-brightest star in Perseus';
    const THIRD = 'Probably the third-brightest star in Cygnus';
    const BRIGHTEST = 'The brightest star in the constellation';
    const ROUGHLY = 'Bayer letters only roughly follow brightness: they are usually, not always, in order';
    const SIRIUS = N.bayerName('Alpha', 'Canis Major');
    const LYRA = 'Lyra';
    const DELTA = 'Delta (δ)';
    const COMETS = 'So he would not mistake these fuzzy objects for comets';
    const NUMBER_31 = 'It is number 31 in Messier’s catalogue';
    const M13 = 'M13';
    const M57 = 'M57';
    const NGC1976 = 'NGC 1976';
    const SMALLER = 'Messier’s list is short (about 110 objects); the NGC is far bigger (7,840), so many objects are only in the NGC';
    const FLAMSTEED = '58 Orionis';

    const betel = N.orionStars().find((s) => s.key === 'betelgeuse');
    const rigel = N.orionStars().find((s) => s.key === 'rigel');

    return [
      // 14.2: the Bayer system.
      multi(
        'cn-decode-beta-per',
        '14.2',
        'A star is called Beta Persei (β Per). In the Bayer system: (a) Which constellation is it in? (b) Roughly how bright is it?',
        [
          { key: 'where', type: 'choice', label: '(a) Constellation', options: [PERSEUS, 'Pegasus', 'Pisces', 'It cannot be told from the name'] },
          { key: 'bright', type: 'choice', label: '(b) How bright', options: [SECOND, 'Exactly magnitude 2', 'The brightest star in Perseus', 'The second star found in Perseus'] },
        ],
        [PERSEUS, SECOND],
        ['(a) Perseus: Persei is the genitive ("of Perseus")', '(b) beta is the second Greek letter, so it is probably the second-brightest star in Perseus (usually, not always)'],
      ),
      single('cn-decode-gamma-cyg', '14.2', 'What does the Bayer name Gamma Cygni (γ Cyg) tell you about the star?', [THIRD, 'It is the third star discovered in Cygnus', 'It is a gamma-ray source in Cygnus', 'It is exactly magnitude 3'], THIRD, 'it is in Cygnus (Cygni, "of Cygnus") and gamma is the third Greek letter, so it is probably the third-brightest star there'),
      single('cn-alpha', '14.2', 'In the Bayer system, which star in a constellation is usually given the letter alpha (α)?', [BRIGHTEST, 'The star nearest the celestial pole', 'The first star to rise each night', 'The closest star to the Earth'], BRIGHTEST, 'the brightest star in the constellation (usually: the letters only roughly follow brightness)'),
      single('cn-orion-exception', '14.2', `In Orion, Betelgeuse is Alpha Orionis (magnitude ${betel.mag.toFixed(2)}) and Rigel is Beta Orionis (magnitude ${rigel.mag.toFixed(2)}). A smaller magnitude means a brighter star. What does this show?`, [ROUGHLY, 'Rigel’s name must be wrong', 'Magnitudes are measured backwards in Orion', 'Alpha always means the biggest star'], ROUGHLY, `Rigel (${rigel.mag.toFixed(2)}) is brighter than Betelgeuse (${betel.mag.toFixed(2)}), yet Betelgeuse has alpha: Bayer letters only roughly follow brightness`),
      single('cn-name-sirius', '14.2', 'Sirius is the brightest star in Canis Major. The genitive of Canis Major is Canis Majoris. What is its Bayer name?', [SIRIUS, 'Beta Canis Majoris', 'Alpha Canis Major', 'Canis Majoris 1'], SIRIUS, `${SIRIUS} (α CMa): alpha for the brightest star, then the genitive of the constellation`),
      single('cn-decode-vega', '14.2', 'Vega is Alpha Lyrae (α Lyr). Which constellation is it in?', [LYRA, 'Leo', 'Lynx', 'Libra'], LYRA, 'Lyra: Lyrae is the genitive of Lyra, so Alpha Lyrae is "Alpha of Lyra", its brightest star'),
      single('cn-greek-order', '14.2', 'In the Bayer system, the letters go alpha, beta, gamma, ... Which letter usually marks the fourth-brightest star?', [DELTA, 'Epsilon (ε)', 'Zeta (ζ)', 'Omega (ω)'], DELTA, 'delta (δ), the fourth Greek letter: alpha, beta, gamma, delta'),
      single('cn-flamsteed', '14.2', 'Betelgeuse is Alpha Orionis in the Bayer system. Which of these is its Flamsteed name?', [FLAMSTEED, 'HD 39801', 'M42', 'Orion 1'], FLAMSTEED, '58 Orionis: a Flamsteed name is a number plus the constellation (HD 39801 is its Henry Draper Catalogue number; M42 is the Orion Nebula)'),
      // 14.1: using the Messier and NGC catalogues.
      single('cn-messier-why', '14.1', 'Why did Charles Messier, a comet hunter, make his catalogue?', [COMETS, 'To name the brightest stars', 'To measure the distances of galaxies', 'To list every star he could see'], COMETS, 'so he would not mistake these fuzzy objects (nebulae, clusters, galaxies) for the comets he was searching for'),
      single('cn-m31-means', '14.1', 'What does the name M31 mean?', [NUMBER_31, 'It is 31 light years away', 'It has magnitude 31', 'It is the 31st brightest galaxy'], NUMBER_31, 'it is entry number 31 in Messier’s catalogue (the Andromeda Galaxy); the number is a place in the list, not a distance or a brightness'),
      single('cn-find-globular', '14.1', `A catalogue extract: ${extractText}. Which object is a globular cluster?`, ['M1', M13, 'M31', 'M42', M57], M13, 'M13 (NGC 6205), in Hercules, is listed as a globular cluster'),
      single('cn-ngc-of-m42', '14.1', `A catalogue extract: ${extractText}. What is the NGC number of the Orion Nebula?`, [NGC1976, 'NGC 1952', 'NGC 224', 'NGC 6205'], NGC1976, 'NGC 1976: read across the Orion Nebula’s row, M42 = NGC 1976'),
      multi(
        'cn-use-extract',
        '14.1',
        `A catalogue extract: ${extractText}. (a) Which object is the faintest? (b) Which object is a galaxy?`,
        [
          { key: 'faint', type: 'choice', label: '(a) Faintest', options: ['M1', 'M13', 'M31', 'M42', M57] },
          { key: 'galaxy', type: 'choice', label: '(b) A galaxy', options: ['M1', 'M13', 'M31', 'M42', 'M57'] },
        ],
        [M57, 'M31'],
        ['(a) M57, the Ring Nebula: magnitude 8.8 is the biggest magnitude, so the faintest', '(b) M31 (NGC 224), the Andromeda Galaxy, listed as a spiral galaxy'],
      ),
      single('cn-ngc-only', '14.1', 'The Double Cluster in Perseus has the number NGC 869 but no M number. Why?', [SMALLER, 'It is too faint to see', 'It is a star, not a cluster', 'NGC numbers are only for galaxies'], SMALLER, 'Messier listed only about 110 objects; the New General Catalogue (1888) lists 7,840, so many objects, such as the Double Cluster, have an NGC number but no M number'),
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.StarNamesQuestions = api;
  }
})();
