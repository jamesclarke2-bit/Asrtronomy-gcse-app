/**
 * Exam-style practice questions for notes/massive-stars.html, each with
 * `marks`, a `spec` tag (13.8, 14.6, 14.7, 14.8 or 14.10) and a full mark
 * scheme in its feedback. Stages, times and limits come from MassiveStar
 * (src/massiveStar.js); the Sun-like main-sequence time from SunLikeStar.
 */
(function () {
  function makeQuestions(M, L) {
    const UNITS = ['u4.15'];

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

    const ORDER = 'Nebula → Main sequence → Red supergiant → Supernova → Neutron star or black hole';
    const ORDER_OPTIONS = [
      ORDER,
      'Nebula → Main sequence → Supernova → Red supergiant → Neutron star or black hole',
      'Nebula → Red supergiant → Main sequence → Supernova → Neutron star or black hole',
      'Nebula → Main sequence → Red supergiant → Planetary nebula → Neutron star or black hole',
    ];
    const FASTER = 'It has more fuel, but it is far more luminous, so it uses its fuel up much faster';
    const IRON = 'Fusing iron releases no energy, so fusion stops, radiation pressure fails and gravity collapses the core';
    const LIMIT = 'Whether electron pressure can hold up the dead core (a white dwarf) or the core collapses further';
    const NEUTRON = 'Neutron pressure: the neutrons are squeezed so close that they resist being squeezed any closer';
    const WD = 'A white dwarf, held up by electron pressure';
    const NS = 'A neutron star, held up by neutron pressure';
    const BH = 'A black hole: nothing can hold it up';
    const HIGHER = 'Higher up and further left: hotter and much more luminous';
    const ACROSS = 'Right across the top of the diagram, to the red supergiants';
    const DOWN = 'Down to the bottom left, to the white dwarfs';
    const DEAD = 'They are dead cores, not stars shining by fusion: a black hole gives out no light, and a neutron star lies far off the edge of the diagram';
    const msRatio = M.mainSequenceRatio().toLocaleString('en-GB');
    const lim = M.CHANDRASEKHAR_MSUN;

    return [
      // 14.10: stages and timescales.
      single('mv-order', '14.10', 'Which shows the stages of a much more massive star’s life in the right order?', ORDER_OPTIONS, ORDER, `${ORDER} (it never becomes a planetary nebula: that is a Sun-like star’s stage)`),
      single('mv-ms-shorter', '14.10', `A star of about ${M.EXAMPLE_MSUN} times the Sun’s mass spends about 10 million years on the main sequence; a Sun-like star about 10 billion years. Why is the massive star’s main sequence so much shorter?`, [FASTER, 'It has less fuel than the Sun', 'It fuses a different fuel that burns slower', 'It loses most of its mass at once'], FASTER, `it has about ${M.EXAMPLE_MSUN} times the fuel, but it is tens of thousands of times more luminous, so it uses its fuel up far faster: its main sequence is about ${msRatio} times shorter`),
      multi(
        'mv-timescales',
        '14.10',
        'Roughly how long does each stage of a star of about 20 times the Sun’s mass last? (a) Main sequence (b) Red supergiant',
        [
          { key: 'ms', type: 'choice', label: '(a) Main sequence', options: ['About 10 million years', 'About 10 billion years', 'About 10,000 years'] },
          { key: 'rsg', type: 'choice', label: '(b) Red supergiant', options: ['About 1 million years', 'About 1 billion years', 'Under a second'] },
        ],
        ['About 10 million years', 'About 1 million years'],
        [`(a) the main sequence lasts ${M.stage('main-sequence').time}`, `(b) the red supergiant stage lasts ${M.stage('red-supergiant').time}`],
      ),
      single('mv-supergiant-core', '14.10', 'In a red supergiant, what happens in the core as each fuel runs out?', ['It shrinks, heats up and fuses heavier elements in turn, up to iron', 'It cools down and stops shining', 'It turns back into hydrogen', 'It expands into a planetary nebula'], 'It shrinks, heats up and fuses heavier elements in turn, up to iron', 'the core shrinks and heats up each time a fuel runs out, and fuses heavier elements in turn: helium to carbon, then oxygen, and on up to iron'),
      // 14.6: how the balance changes.
      single('mv-supernova-why', '14.6', 'Why does the core of a massive star suddenly collapse at the end of its life?', [IRON, 'It runs out of hydrogen, like the Sun', 'Its outer layers push it inward', 'It is hit by another star'], IRON, 'once the core is iron, fusing it releases no energy, so fusion stops; with no radiation pressure to balance it, gravity collapses the core in under a second, and the rebound blasts the outer layers out as a supernova'),
      single('mv-supergiant-balance', '14.6', 'In a red supergiant, how is the balance between gravity and radiation pressure changing?', ['The core shrinks under gravity while radiation pressure pushes the outer layers out', 'Gravity and radiation pressure stay exactly balanced throughout', 'Radiation pressure pulls the outer layers inward', 'There is no gravity in the outer layers'], 'The core shrinks under gravity while radiation pressure pushes the outer layers out', 'the core shrinks under gravity each time a fuel runs out, while radiation pressure from fusion in the shells around it pushes the outer layers out, so the star swells to hundreds of times the Sun’s width'),
      // 14.7: the neutron star.
      single('mv-neutron-pressure', '14.7', 'What holds a neutron star up against gravity?', [NEUTRON, 'Radiation pressure from fusion', 'Electron pressure, as in a white dwarf', 'Its fast spin'], NEUTRON, 'neutron pressure: the neutrons are squeezed so close that they resist being squeezed any closer, balancing gravity (there is no fusion)'),
      single('mv-neutron-size', '14.7', 'Roughly how big is a neutron star?', ['About 20 km across, with more mass than the Sun', 'About the size of the Earth', 'About the size of the Sun', 'Hundreds of times wider than the Sun'], 'About 20 km across, with more mass than the Sun', 'about 20 km across, but with more mass than the Sun, so extremely dense'),
      // 14.8: the Chandrasekhar limit.
      single('mv-limit-decides', '14.8', `The Chandrasekhar limit is about ${lim} times the Sun’s mass. What does it decide?`, [LIMIT, 'How long a star stays on the main sequence', 'How bright a supernova is', 'Which constellation a star is in'], LIMIT, `it decides the dead core’s end: below about ${lim} times the Sun’s mass, electron pressure holds it up as a white dwarf; above it, electron pressure fails and the core collapses to a neutron star (or, heavier still, a black hole)`),
      multi(
        'mv-which-end',
        '14.8',
        `The Chandrasekhar limit is about ${lim} times the Sun’s mass, and a neutron star can be at most about ${M.NEUTRON_STAR_MAX_MSUN} times the Sun’s mass. What does each dead core become? (a) A core of 1.0 times the Sun’s mass (b) A core of 2.0 times (c) A core of 4.0 times`,
        [
          { key: 'a', type: 'choice', label: '(a) 1.0 times', options: [WD, NS, BH] },
          { key: 'b', type: 'choice', label: '(b) 2.0 times', options: [WD, NS, BH] },
          { key: 'c', type: 'choice', label: '(c) 4.0 times', options: [WD, NS, BH] },
        ],
        [WD, NS, BH],
        [`(a) below ${lim}: a white dwarf, held up by electron pressure`, `(b) above ${lim} but below about ${M.NEUTRON_STAR_MAX_MSUN}: a neutron star, held up by neutron pressure`, `(c) above about ${M.NEUTRON_STAR_MAX_MSUN}: a black hole, as nothing can hold it up`],
      ),
      // 13.8: the two HR tracks.
      multi(
        'mv-compare-tracks',
        '13.8',
        'Compare the paths of a Sun-like star and a much more massive star across the HR diagram. (a) Where does the massive star sit on the main sequence, compared with the Sun? (b) Where does the massive star go next? (c) Where does the Sun-like star end up?',
        [
          { key: 'start', type: 'choice', label: '(a) On the main sequence', options: [HIGHER, 'Lower down and further right: cooler and dimmer', 'In the same place as the Sun'] },
          { key: 'next', type: 'choice', label: '(b) The massive star next moves', options: [ACROSS, DOWN, 'Straight down the main sequence'] },
          { key: 'end', type: 'choice', label: '(c) The Sun-like star ends', options: [DOWN, ACROSS, 'Off the top of the diagram as a supernova'] },
        ],
        [HIGHER, ACROSS, DOWN],
        [
          '(a) higher up and further left on the main sequence: hotter and much more luminous',
          '(b) right across the top of the diagram to the red supergiants, where its track ends: it then explodes as a supernova, an explosion far too bright for the chart, not a point on it',
          '(c) the Sun-like star rises to the red giants, then ends down at the bottom left as a white dwarf',
        ],
      ),
      single('mv-off-diagram', '13.8', 'Why are a neutron star and a black hole not shown on the HR diagram with the two tracks?', [DEAD, 'They are too far away to measure', 'They are cooler than 3,000 K', 'They are on the main sequence already'], DEAD, 'they are dead cores, not stars shining by fusion: a black hole gives out no light, and a neutron star is so tiny and so hot that it lies far off the edge of the diagram'),
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.MassiveStarQuestions = api;
  }
})();
