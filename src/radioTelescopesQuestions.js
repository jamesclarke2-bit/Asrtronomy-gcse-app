/**
 * Exam-style practice questions for notes/radio-telescopes.html, each
 * with `marks`, a `spec` tag (13.24 to 13.27) and a full mark scheme in
 * its feedback. The dish-size calculation uses RadioTelescopes
 * (src/radioTelescopes.js), so its answer matches the page's own
 * comparison.
 */
(function () {
  function makeQuestions(R) {
    const UNITS = ['u5.5'];

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

    function pair(id, spec, prompt, fields, rights, points) {
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

    const REFLECT = 'It reflects the radio waves to one point, its focus, where the receiver is';
    const SIGNAL = 'Turns the radio waves into an electrical signal';
    const WEAK = 'The signal from space is very weak';
    const SCAN = 'It points at one small patch of sky at a time, scanning across point by point and recording the signal strength at each';
    const RATIO = 'The wavelength divided by the diameter of the dish or lens';
    const LONGER = 'Radio wavelengths are far longer than light, so the dish must be far wider to give the same wavelength ÷ diameter';
    const COARSER = 'It sees coarser detail: sources must be further apart to show as two';
    const AS_WIDE = 'A single dish as wide as the farthest-apart pair, about 30 km';
    const TURNS = 'As the Earth turns, each pair of dishes swings round and fills in more of the giant dish';
    const COMBINE = 'A computer combines the signals from all the dishes, timed exactly';
    const QUASAR = 'They were found as strong radio sources that look like faint stars';
    const DUST = 'Radio waves from hydrogen gas pass through the dust that hides much of the Galaxy';
    const JETS = 'Narrow jets shooting out from black holes at the centres of some galaxies';
    const DISCS = 'Discs of dust and gas around young stars, with gaps where planets may be forming';

    // The dish-size calculation: an optical telescope 0.10 m across in
    // yellow-green light (550 nm, the same light the page compares with),
    // against a radio dish at 21 cm.
    const OPTICAL_M = 0.1;
    const LIGHT_M = R.OPTICAL_NM * 1e-9;
    const RADIO_M = 0.21;
    const neededM = R.dishNeededM(RADIO_M, OPTICAL_M, LIGHT_M * 1e9);
    const neededKm = neededM / 1000;

    return [
      single('rt-dish-job', '13.24', 'What does the dish of a simple radio telescope do?', [REFLECT, 'It turns radio waves into light', 'It amplifies the radio waves', 'It stores the radio waves until they are needed'], REFLECT, 'the curved dish reflects the radio waves to one point, its focus, where the receiver is'),
      pair(
        'rt-receiver-amplifier',
        '13.24',
        'In a simple radio telescope: (a) what does the receiver at the focus do? (b) Why is an amplifier needed?',
        [
          { key: 'receiver', type: 'choice', label: '(a) The receiver', options: [SIGNAL, 'Turns the radio waves into visible light', 'Points the dish at the source'] },
          { key: 'amplifier', type: 'choice', label: '(b) The amplifier is needed because', options: [WEAK, 'The radio waves are too fast', 'The dish is too small to focus them'] },
        ],
        [SIGNAL, WEAK],
        ['(a) the receiver turns the radio waves into an (electrical) signal', '(b) the signal is very weak, so it must be made stronger before it is recorded'],
      ),
      single('rt-scan-picture', '13.24', 'How does a single radio dish make a picture of an area of sky?', [SCAN, 'It photographs the whole area at once, like a camera', 'It waits for the Earth to bring the whole area into focus', 'It uses a lens to spread the radio waves out'], SCAN, 'it measures one point at a time, scanning across the area, and a computer builds a map from the signal strength at each point'),
      pair(
        'rt-bigger-than-optical',
        '13.25',
        'A radio dish must be much bigger than an optical telescope to see the same detail. (a) What does the detail a telescope can see depend on? (b) Why does this make radio dishes so big?',
        [
          { key: 'depends', type: 'choice', label: '(a) The detail depends on', options: [RATIO, 'Only the magnification', 'How bright the source is'] },
          { key: 'why', type: 'choice', label: '(b) So radio dishes are big because', options: [LONGER, 'Radio waves are fainter than light', 'Radio waves travel more slowly than light'] },
        ],
        [RATIO, LONGER],
        ['(a) the wavelength divided by the diameter (aperture): smaller gives finer detail', '(b) radio wavelengths are much longer than light waves, so to keep wavelength ÷ diameter as small, the diameter must be much larger'],
      ),
      {
        id: 'rt-dish-size-calc',
        units: UNITS,
        spec: '13.25',
        marks: 2,
        prompt: `An optical telescope ${OPTICAL_M.toFixed(2)} m across observes yellow-green light of wavelength 550 nm (0.000 000 55 m). A radio telescope observes at a wavelength of 21 cm (0.21 m). The detail a telescope can see depends on wavelength ÷ diameter. How wide must the radio dish be to see the same detail as the optical telescope? Give your answer in km.`,
        type: 'number',
        unitLabel: 'km',
        check(value) {
          const v = Number(value);
          // 2% either side, inclusive (the tiny extra stops rounding error rejecting exactly 2%).
          const correct = Number.isFinite(v) && Math.abs(v - neededKm) <= 0.02 * neededKm * (1 + 1e-9);
          const scheme = markScheme([
            `same detail means the same wavelength ÷ diameter: 0.000 000 55 ÷ ${OPTICAL_M.toFixed(2)} = 0.21 ÷ diameter`,
            `diameter = 0.21 × ${OPTICAL_M.toFixed(2)} ÷ 0.000 000 55 = ${Math.round(neededM).toLocaleString('en-GB')} m ≈ ${neededKm.toFixed(0)} km (accept ${(0.98 * neededKm).toFixed(1)} to ${(1.02 * neededKm).toFixed(1)})`,
          ]);
          return { correct, message: `${correct ? 'Correct.' : 'Not quite.'} ${scheme}` };
        },
        answer: { km: neededKm },
      },
      single('rt-longer-wavelength', '13.25', 'The same radio dish is used at a longer wavelength. What happens to the detail it can see?', [COARSER, 'It sees finer detail', 'Nothing changes: only the dish size matters', 'It can no longer focus any radio waves'], COARSER, 'wavelength ÷ diameter gets bigger, so the resolution gets worse: the detail is coarser'),
      single('rt-array-acts-like', '13.26', 'An aperture synthesis array has dishes spread over an area. Its two farthest-apart dishes are 30 km apart. What single dish does it match for detail?', [AS_WIDE, 'One dish with the same total area as all its dishes added up', 'One dish the size of its largest dish', 'One dish 30 m across'], AS_WIDE, 'the array picks out detail like a single dish as wide as its farthest-apart pair of dishes: 30 km'),
      single('rt-earth-turns', '13.26', 'Why does an aperture synthesis array observe the same source for many hours?', [TURNS, 'Because radio waves arrive very slowly', 'To let the dishes cool down', 'Because each dish can only look at the source once a day'], TURNS, 'each pair of dishes fills in part of the giant dish; as the Earth turns, the pairs swing round and fill in more of it'),
      single('rt-combine', '13.26', 'How do the dishes in an aperture synthesis array work together as one?', [COMBINE, 'Each dish makes its own picture and the best one is kept', 'The dishes are moved together to make one big dish', 'Each dish observes a different source'], COMBINE, 'the signals from the dishes are combined by a computer, timed exactly, as if they came from one giant dish'),
      single('rt-quasars', '13.27', 'What part did radio astronomy play in the discovery of quasars?', [QUASAR, 'Quasars were first seen as bright patches in daytime', 'Quasars were found by their heat on nearby moons', 'Quasars were discovered by landing probes on them'], QUASAR, 'quasars were found as powerful radio sources which, in light, look like faint stars'),
      single('rt-milky-way', '13.27', "Why could radio astronomers map the Milky Way's spiral structure when optical astronomers could not?", [DUST, 'Radio telescopes are always bigger than optical ones', 'Radio waves travel faster than light', 'The spiral arms give out no light at all'], DUST, 'radio waves from hydrogen gas pass through the dust that blocks light, so radio maps traced the spiral arms'),
      pair(
        'rt-jets-discs',
        '13.27',
        'Radio astronomy helped discover two of these. (a) What do radio maps show at the centres of some galaxies? (b) What have radio arrays pictured around young stars?',
        [
          { key: 'jets', type: 'choice', label: '(a) At the centres of some galaxies', options: [JETS, 'A ring of new planets', 'Nothing: the centres are empty'] },
          { key: 'discs', type: 'choice', label: '(b) Around young stars', options: [DISCS, 'Narrow jets from black holes', 'Spiral arms like the Milky Way'] },
        ],
        [JETS, DISCS],
        ['(a) narrow jets shooting out from black holes at the centres of some galaxies', '(b) protoplanetary discs: discs of dust and gas around young stars, with gaps where planets may be forming'],
      ),
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.RadioTelescopesQuestions = api;
  }
})();
