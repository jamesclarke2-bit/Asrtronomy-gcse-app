/**
 * Exam-style practice questions for notes/binaries-and-clusters.html, each
 * with `marks`, a `spec` tag (13.17 or 13.34a-g) and a full mark scheme in
 * its feedback. Object facts and cluster figures come from
 * BinariesClusters (src/binariesClusters.js), never typed separately.
 */
(function () {
  function makeQuestions(B) {
    const UNITS = ['u4.10'];

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

    const row = (feature) => B.CLUSTER_TABLE.find((r) => r.feature === feature);
    const mizar = B.objectById('mizar');
    const closePair = B.objectById('binary');

    // A worked resolution comparison: which apertures split the 2.0 arcsecond pair?
    const APERTURES = [50, 80, 150];
    const resText = APERTURES.map((d) => `${d} mm: ${B.resolutionArcsec(d).toFixed(1)} arcseconds`).join('; ');
    const smallestSplitting = APERTURES.find((d) => B.resolutionArcsec(d) < closePair.separationArcsec);

    const OPTICAL = 'An optical double is a chance line-up of two stars at very different distances; a binary is two stars orbiting each other';
    const HEAVIER_SMALLER = 'The heavier star, on the smaller orbit';
    const LINES_SHIFT = 'Its spectral lines shift back and forth regularly';
    const LINES_WHY = 'Each star moves towards us then away from us as they orbit (the Doppler effect)';
    const STARS_POINTS = 'They stay as points of light';
    const FAINTER = 'More, fainter stars become visible';
    const BINARY_HOW = 'Watch over years for orbital motion, or measure both stars’ distances';
    const OPEN_SEEN = 'Separate stars can be seen even in binoculars';
    const GLOB_SMALL = 'A fuzzy ball of light';
    const GLOB_LARGE = 'Its edges resolve into stars, but the core stays crowded';
    const NEB_EYE = 'A faint grey-green glow';
    const NEB_WHY = 'Long exposures collect enough light for colour to show';
    const GAL_SEEN = 'A faint smudge, mainly its bright core';
    const GAL_ARMS = 'A large aperture, a dark sky or a long-exposure photograph';
    const BIGGER = 'Bigger';
    const DIMMER = 'Dimmer';

    return [
      single(
        'optical-double-vs-binary',
        '13.17',
        'What is the difference between an optical double and a binary star?',
        [OPTICAL, 'An optical double has two stars of the same colour; a binary has two different colours', 'A binary is always brighter than an optical double', 'They are the same thing'],
        OPTICAL,
        'optical double: chance alignment, stars at very different distances, not connected; binary: two stars bound by gravity, orbiting each other'
      ),
      {
        id: 'centre-of-mass',
        units: UNITS,
        spec: '13.17',
        marks: 2,
        prompt: 'In a binary, star A has three times the mass of star B. (a) Which star moves on the smaller orbit? (b) How do the sizes of their orbits compare?',
        fields: [
          { key: 'which', type: 'choice', label: '(a) Smaller orbit', options: [HEAVIER_SMALLER, 'The lighter star, B', 'Both orbits are the same size'] },
          { key: 'ratio', type: 'choice', label: "(b) A's orbit compared with B's", options: ['One third the size', 'Three times the size', 'The same size', 'Nine times smaller'] },
        ],
        check(value) {
          return scored([value.which === HEAVIER_SMALLER, value.ratio === 'One third the size'], [
            '(a) the heavier star, A: it is closer to the centre of mass',
            "(b) one third the size: each star's distance from the centre of mass is inversely proportional to its mass",
          ]);
        },
      },
      {
        id: 'spectroscopic-binary',
        units: UNITS,
        spec: '13.17',
        marks: 2,
        prompt: 'A star looks single in every telescope, yet astronomers say it is a spectroscopic binary. (a) What do they see in its spectrum? (b) Why does this happen?',
        fields: [
          { key: 'see', type: 'choice', label: '(a) In the spectrum', options: [LINES_SHIFT, 'Its lines get darker every night', 'It has no spectral lines', 'Its lines are all in the infrared'] },
          { key: 'why', type: 'choice', label: '(b) Why', options: [LINES_WHY, 'The star is cooling down', 'Clouds on Earth move across it', 'The telescope wobbles'] },
        ],
        check(value) {
          return scored([value.see === LINES_SHIFT, value.why === LINES_WHY], [
            '(a) the spectral lines shift back and forth (or double and merge) with a regular period',
            '(b) as the stars orbit, each moves alternately towards and away from us, so its lines are blueshifted then redshifted',
          ]);
        },
      },
      {
        id: 'open-vs-globular',
        units: UNITS,
        spec: '13.17',
        marks: 2,
        prompt: 'Compare open and globular clusters: (a) how many stars each has, and (b) where each is found in our Galaxy.',
        fields: [
          { key: 'number', type: 'choice', label: '(a) Number of stars', options: [`Open: ${row('Number of stars').open}; globular: ${row('Number of stars').globular}`, `Open: ${row('Number of stars').globular}; globular: ${row('Number of stars').open}`] },
          { key: 'where', type: 'choice', label: '(b) Where found', options: ['Open: in the disc; globular: in the halo', 'Open: in the halo; globular: in the disc', 'Both only in the central bulge'] },
        ],
        check(value) {
          return scored([value.number.startsWith('Open: tens'), value.where === 'Open: in the disc; globular: in the halo'], [
            `(a) open: ${row('Number of stars').open}; globular: ${row('Number of stars').globular}`,
            '(b) open clusters in the disc; globular clusters in the halo around the Galaxy',
          ]);
        },
      },
      single(
        'globular-age',
        '13.17',
        'Which describes a globular cluster such as M13?',
        ['Very old, dense and spherical', 'Young, loose and irregular', 'A cloud of gas where stars are forming', 'Two stars orbiting each other'],
        'Very old, dense and spherical',
        `very old (${row('Typical age (years)').globular.replace('very old: ', '')} years), dense and spherical`
      ),
      {
        id: 'star-through-telescope',
        units: UNITS,
        spec: '13.34a',
        marks: 2,
        prompt: 'An observer looks at a field of stars through a telescope. (a) What happens to the stars when the magnification is increased? (b) What changes when a telescope with a larger aperture is used?',
        fields: [
          { key: 'mag', type: 'choice', label: '(a) More magnification', options: [STARS_POINTS, 'They become discs showing surface detail', 'They change colour'] },
          { key: 'ap', type: 'choice', label: '(b) Larger aperture', options: [FAINTER, 'The stars become discs', 'Fewer stars are visible'] },
        ],
        check(value) {
          return scored([value.mag === STARS_POINTS, value.ap === FAINTER], [
            '(a) they stay as points: stars are too far away to show a disc',
            '(b) more light is gathered, so fainter stars become visible',
          ]);
        },
      },
      {
        id: 'double-star-split',
        units: UNITS,
        spec: '13.34b',
        marks: 1,
        prompt: `Two stars are ${closePair.separationArcsec.toFixed(1)} arcseconds apart. The resolution of three telescopes is: ${resText}. Which is the smallest telescope that can split the pair into two stars?`,
        type: 'choice',
        options: APERTURES.map((d) => `${d} mm`),
        check(value) {
          const scheme = markScheme([`${smallestSplitting} mm: its resolution is smaller than the ${closePair.separationArcsec.toFixed(1)} arcsecond separation`]);
          return { correct: value === `${smallestSplitting} mm`, message: scheme };
        },
      },
      single(
        'mizar-small-telescope',
        '13.34b',
        `Mizar's two stars are about ${mizar.separationArcsec} arcseconds apart. Why do they look like one star to the naked eye but two in a small telescope?`,
        ['The telescope’s larger aperture and magnification resolve the gap', 'The telescope makes each star bigger', 'The stars move apart at night', 'The telescope filters out one star'],
        'The telescope’s larger aperture and magnification resolve the gap',
        'the eye cannot resolve so small a gap; the telescope resolves it and magnifies it enough to see'
      ),
      single(
        'binary-looks-like-double',
        '13.34c',
        'Through a telescope, a binary star looks exactly like a double star that is just a chance line-up. How could an astronomer find out which it is?',
        [BINARY_HOW, 'Look at it once with a higher magnification', 'Use a coloured filter', 'Look at it through binoculars instead'],
        BINARY_HOW,
        'one look cannot tell them apart: watch over years for orbital motion (or measure both distances, or look for spectral line shifts)'
      ),
      single(
        'open-cluster-view',
        '13.34d',
        'What does an open cluster such as the Pleiades look like through binoculars?',
        [OPEN_SEEN, 'A fuzzy ball with no stars visible', 'A faint grey-green glow', 'A spiral shape'],
        OPEN_SEEN,
        'its stars are far enough apart to be seen separately, even in binoculars'
      ),
      {
        id: 'globular-cluster-view',
        units: UNITS,
        spec: '13.34e',
        marks: 2,
        prompt: 'How does the globular cluster M13 look (a) through a small aperture and (b) through a large aperture?',
        fields: [
          { key: 'small', type: 'choice', label: '(a) Small aperture', options: [GLOB_SMALL, 'Dozens of separate bright stars', 'A spiral'] },
          { key: 'large', type: 'choice', label: '(b) Large aperture', options: [GLOB_LARGE, 'Every star is separate, right to the centre', 'It disappears'] },
        ],
        check(value) {
          return scored([value.small === GLOB_SMALL, value.large === GLOB_LARGE], [
            '(a) a fuzzy ball: its stars are too faint and close together to separate',
            '(b) the outer stars resolve, but the dense core stays a crowded glow',
          ]);
        },
      },
      {
        id: 'nebula-colour',
        units: UNITS,
        spec: '13.34f',
        marks: 2,
        prompt: 'The Orion Nebula is red and pink in photographs. (a) How does it look to the eye through a telescope? (b) Why do photographs show colour?',
        fields: [
          { key: 'eye', type: 'choice', label: '(a) To the eye', options: [NEB_EYE, 'Bright red', 'A single point of light'] },
          { key: 'why', type: 'choice', label: '(b) Why', options: [NEB_WHY, 'The camera adds paint', 'The nebula changes colour at night'] },
        ],
        check(value) {
          return scored([value.eye === NEB_EYE, value.why === NEB_WHY], [
            '(a) a faint grey-green glow: the eye cannot see colour in faint light',
            '(b) a long exposure collects much more light, so the colours show',
          ]);
        },
      },
      {
        id: 'magnification-dims-extended',
        units: UNITS,
        spec: '13.34f',
        marks: 2,
        prompt: 'An observer doubles the magnification while looking at a nebula, keeping the same telescope. How does the nebula look: (a) bigger or smaller, and (b) brighter or dimmer?',
        fields: [
          { key: 'size', type: 'choice', label: '(a) Size', options: [BIGGER, 'Smaller', 'The same'] },
          { key: 'bright', type: 'choice', label: '(b) Brightness', options: [DIMMER, 'Brighter', 'The same'] },
        ],
        check(value) {
          return scored([value.size === BIGGER, value.bright === DIMMER], [
            '(a) bigger: it fills more of the view',
            '(b) dimmer: the same light is spread over a larger area',
          ]);
        },
      },
      {
        id: 'galaxy-view',
        units: UNITS,
        spec: '13.34g',
        marks: 2,
        prompt: 'The Andromeda Galaxy is a spiral galaxy. (a) What does it look like through a small telescope? (b) What is needed to see its spiral arms?',
        fields: [
          { key: 'seen', type: 'choice', label: '(a) Small telescope', options: [GAL_SEEN, 'Clear spiral arms', 'Thousands of separate stars'] },
          { key: 'arms', type: 'choice', label: '(b) Spiral arms need', options: [GAL_ARMS, 'Higher magnification only', 'A red filter'] },
        ],
        check(value) {
          return scored([value.seen === GAL_SEEN, value.arms === GAL_ARMS], [
            '(a) a faint smudge, mainly the bright core',
            '(b) a large aperture, dark skies, or long-exposure photographs',
          ]);
        },
      },
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.BinariesClustersQuestions = api;
  }
})();
