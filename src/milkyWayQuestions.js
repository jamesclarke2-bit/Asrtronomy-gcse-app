/**
 * Exam-style practice questions for notes/our-galaxy.html (spec 15.1,
 * 15.2, 15.3 and 15.8), each with `marks` and a full mark scheme in its
 * feedback. Sizes and the lettered drawing come from MilkyWay
 * (src/milkyWay.js); the picture question draws with MilkyWayDrawing in
 * the browser.
 */
(function () {
  function makeQuestions(G) {
    const UNITS = ['u4.4'];

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

    function renderQuiz(container) {
      const panelDiv = document.createElement('div');
      panelDiv.className = 'spectrum-panel mw-question-diagram';
      const wrap = document.createElement('div');
      wrap.className = 'labelled-diagram-wrap';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      [['viewBox', '0 0 400 260'], ['width', 400], ['height', 260], ['class', 'responsive-svg'], ['role', 'img'],
        ['aria-label', 'The Milky Way drawn edge-on, with four places lettered: A, a small dotted ball well above the disc; B, a ringed disc in the thin disc, about halfway from the centre to the edge; C, a point on the dark line along the middle of the disc; D, the bright bulge at the centre.']].forEach(([k, v]) => svg.setAttribute(k, v));
      wrap.appendChild(svg);
      panelDiv.appendChild(wrap);
      container.appendChild(panelDiv);
      window.SpectrumDrawing.panel(svg);
      window.MilkyWayDrawing.drawQuiz(svg, wrap);
    }

    const STARS = 'Many separate faint stars, too faint and close together to see one by one with the eye';
    const BAND = 'We are inside a flat disc of stars, and see it edge-on, along the disc';
    const DUST_LANE = 'Clouds of dust blocking the light of the stars behind them';
    const SBB = 'A barred spiral galaxy (SBb)';
    const DUST_BLOCKS = 'Dust in the disc absorbs and scatters visible light, so we see only a small part of the Galaxy';
    const RADIO_THROUGH = 'Cold hydrogen gas throughout the disc gives out 21 cm radio waves, which pass through the dust';
    const AWAY = 'Moving away from us (redshift)';
    const TOWARDS = 'Moving towards us (blueshift)';
    const STILL = 'Not moving along our line of sight';
    const DOPPLER = 'From the Doppler shift of the 21 cm line, which gives the speed of the gas in each direction';
    const width = (G.DISC_DIAMETER_KLY * 1000).toLocaleString('en-GB');
    const sunR = (G.SUN_FROM_CENTRE_KLY * 1000).toLocaleString('en-GB');
    const L = G.QUIZ_LETTERS;
    const LETTERS = ['A', 'B', 'C', 'D'];

    return [
      // 15.1: the view from Earth.
      single('gx-binoculars', '15.1', 'On a dark night the Milky Way looks like a faint, milky band. What do binoculars or a small telescope show in it?', [STARS, 'A smooth glowing cloud of gas', 'Nothing more than the eye sees', 'A few very bright planets'], STARS, 'it breaks up into many separate faint stars (and star clusters and glowing gas clouds), too faint and close together for the eye to see one by one'),
      single('gx-band', '15.1', 'Why does our Galaxy look like a band across the sky, not a spiral?', [BAND, 'The Galaxy is shaped like a long thin tube', 'Only one spiral arm gives out light', 'The Earth’s atmosphere spreads the light into a band'], BAND, 'we are inside a flat disc of stars and see it edge-on, so the disc appears as a band right round the sky'),
      single('gx-dark-lanes', '15.1', 'What are the dark lanes and patches along the Milky Way band?', [DUST_LANE, 'Gaps with no stars at all', 'Black holes', 'Shadows of the Moon'], DUST_LANE, 'clouds of dust in the disc that block the light of the stars behind them'),
      // 15.8: the type.
      single('gx-type', '15.8', 'What type of galaxy is the Milky Way?', [SBB, 'An elliptical galaxy (E0)', 'An irregular galaxy', 'A spiral galaxy with no bar (Sb)'], SBB, 'a barred spiral galaxy, type SBb: a bar of stars across the centre, with spiral arms coming off it'),
      // 15.2: size, shape and where things are.
      single('gx-size', '15.2', 'Roughly how wide is the Milky Way’s disc?', [`About ${width} light-years`, 'About 1,000 light-years', 'About 10 million light-years', 'About 4 light-years'], `About ${width} light-years`, `about ${width} light-years across, but only about 1,000 light-years thick: a flat disc`),
      multi(
        'gx-place',
        '15.2',
        'The drawing shows the Milky Way edge-on, with four lettered places. Which letter marks: (a) the Sun (b) a globular cluster (c) a dust lane?',
        [
          { key: 'sun', type: 'choice', label: '(a) The Sun', options: LETTERS },
          { key: 'cluster', type: 'choice', label: '(b) A globular cluster', options: LETTERS },
          { key: 'dust', type: 'choice', label: '(c) A dust lane', options: LETTERS },
        ],
        [L.sun, L.cluster, L.dust],
        [
          `(a) ${L.sun}: the Sun is in the thin disc, about halfway from the centre to the edge (about ${sunR} light-years from the centre)`,
          `(b) ${L.cluster}: globular clusters are in the halo, a roughly round region all round the disc, above and below it`,
          `(c) ${L.dust}: dust lies in the disc itself, along the spiral arms, seen edge-on as a dark line along its middle`,
        ],
        { render: renderQuiz },
      ),
      single('gx-star-forming', '15.2', 'Where in the Milky Way are new stars forming?', ['In the spiral arms of the disc, where there is gas and dust', 'In the globular clusters of the halo', 'Only at the very centre', 'Nowhere: star formation has stopped'], 'In the spiral arms of the disc, where there is gas and dust', 'in the spiral arms of the disc, where clouds of gas and dust collapse to form stars (globular clusters are old and have no gas left)'),
      // 15.3: mapping with 21 cm.
      single('gx-why-not-light', '15.3', 'Why can’t astronomers map the whole Milky Way using visible light?', [DUST_BLOCKS, 'The Milky Way gives out no visible light', 'Visible light is too slow to reach us', 'Visible light is blocked by the Earth’s magnetic field'], DUST_BLOCKS, 'dust in the disc absorbs and scatters visible light, so we can see only a few thousand light-years along the disc, a small part of the Galaxy'),
      single('gx-why-21cm', '15.3', 'Why are 21 cm radio waves used to map the Milky Way?', [RADIO_THROUGH, '21 cm waves come only from the Sun', '21 cm waves are absorbed by dust, showing where it is', 'Radio waves travel faster than light'], RADIO_THROUGH, 'cold hydrogen gas, spread through the whole disc and its arms, gives out radio waves of wavelength 21 cm, which pass through dust, so they reach us from right across the Galaxy'),
      multi(
        'gx-shift',
        '15.3',
        `Along one line of sight, a radio telescope finds the 21 cm line from three clouds of hydrogen: (a) at a slightly longer wavelength than ${G.H21_CM} cm (b) at a slightly shorter wavelength (c) at exactly ${G.H21_CM} cm. How is each cloud moving?`,
        [
          { key: 'a', type: 'choice', label: '(a) Longer wavelength', options: [AWAY, TOWARDS, STILL] },
          { key: 'b', type: 'choice', label: '(b) Shorter wavelength', options: [AWAY, TOWARDS, STILL] },
          { key: 'c', type: 'choice', label: '(c) Unshifted', options: [AWAY, TOWARDS, STILL] },
        ],
        [AWAY, TOWARDS, STILL],
        [
          '(a) a longer wavelength is a redshift: the cloud is moving away from us',
          '(b) a shorter wavelength is a blueshift: the cloud is moving towards us',
          '(c) no shift: the cloud is not moving towards or away from us (it may still move across our line of sight)',
        ],
      ),
      single('gx-rotation', '15.3', 'How do 21 cm observations show how fast the Milky Way rotates?', [DOPPLER, 'From how bright the 21 cm signal is', 'From how long the radio waves take to arrive', 'By photographing the spiral arms move'], DOPPLER, 'the Doppler shift of the 21 cm line gives the speed of the gas along each line of sight; many directions together give how fast the gas goes round at each distance from the centre, and, knowing that, how far away each arm is'),
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.MilkyWayQuestions = api;
  }
})();
