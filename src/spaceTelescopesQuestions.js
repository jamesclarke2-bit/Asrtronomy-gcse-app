/**
 * Exam-style practice questions for notes/space-telescopes.html, each with
 * `marks`, a `spec` tag (13.31, 13.32 or 13.33) and a full mark scheme in
 * its feedback. One question weighs up a space telescope against a
 * mountain-top telescope for a given wavelength.
 */
(function () {
  function makeQuestions(T) {
    const UNITS = ['u5.7'];

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

    const ABSORBED = 'They are absorbed high in the atmosphere and never reach the ground';
    const ABOVE = 'Above the atmosphere, in space';
    const XRAY = 'An X-ray telescope';
    const UV_HIGH = 'Most ultraviolet is absorbed far above the top of any mountain';
    const SHARP = 'No turbulence, so its images are sharper';
    const ALL_WAVES = 'Every wavelength reaches it, because nothing is absorbed';
    const REPAIR = 'It is hard or impossible to repair if something goes wrong';
    const PLATFORM = 'A telescope or detector carried in orbit, above the atmosphere';
    const MOUNTAIN_PLUS = 'It can be much bigger for the same cost, and it can be repaired and upgraded';
    const SPACE_PLUS = 'It gets all of the infrared, with no water vapour absorbing any, and has no turbulence';
    const ONLY_SPACE = 'Only the space telescope can work: X-rays never reach the mountain top';
    const GRB = 'Brief, extremely powerful flashes of gamma rays from very distant galaxies';
    const HOT_GAS = 'Gas spiralling into the disc is heated to millions of degrees, so it gives out X-rays';
    const ACTIVE = 'Their hot chromospheres and coronae, far more active than the Sun’s, shine strongly in ultraviolet and X-rays';

    const xray = T.verdict('X-ray');

    return [
      multi(
        'sp-why-space',
        '13.31',
        'Gamma-ray and X-ray telescopes, and most ultraviolet telescopes, cannot work on the ground. (a) What happens to these waves from space? (b) So where must these telescopes be?',
        [
          { key: 'happens', type: 'choice', label: '(a) These waves', options: [ABSORBED, 'They pass straight through the Earth', 'They are too faint to detect anywhere'] },
          { key: 'where', type: 'choice', label: '(b) The telescopes must be', options: [ABOVE, 'On the highest mountains', 'Underground, away from light pollution'] },
        ],
        [ABSORBED, ABOVE],
        ['(a) they are absorbed high in the atmosphere and never reach the ground (for ultraviolet, all but the near ultraviolet)', '(b) so the telescopes must be above the atmosphere, in space'],
      ),
      single('sp-which-needs-space', '13.31', 'Which of these must be in space to work at all?', [XRAY, 'A radio telescope', 'An optical telescope', 'A telescope for visible light from the Moon'], XRAY, `an X-ray telescope (${xray.where}): X-rays are absorbed high in the atmosphere, far above any mountain; visible light and radio waves reach the ground`),
      single('sp-uv-mountain', '13.31', 'Why does building an ultraviolet telescope on a high mountain not help?', [UV_HIGH, 'Mountains are too cold for ultraviolet', 'Ultraviolet is blocked only by clouds', 'All ultraviolet reaches the ground anyway'], UV_HIGH, 'most ultraviolet is absorbed high in the atmosphere, far above the top of any mountain (only the near ultraviolet, down to about 300 nm, reaches the ground), so the telescope must be in space'),
      multi(
        'sp-advantages',
        '13.32',
        'Give two advantages of putting a telescope in space. (a) An advantage for image quality: (b) An advantage for which waves it can see:',
        [
          { key: 'image', type: 'choice', label: '(a) Image quality', options: [SHARP, 'It is closer to the stars, so they look bigger', 'Its mirror can be larger than any on the ground'] },
          { key: 'waves', type: 'choice', label: '(b) Which waves', options: [ALL_WAVES, 'It can see only visible light', 'It sees radio waves best'] },
        ],
        [SHARP, ALL_WAVES],
        ['(a) no turbulence, so images are sharper (also: no weather, no day and night)', '(b) every wavelength reaches it, because none is absorbed'],
      ),
      single('sp-disadvantage', '13.32', 'Which is a disadvantage of a space telescope?', [REPAIR, 'Its images are blurred by turbulence', 'It can only observe at night', 'Clouds block its view'], REPAIR, 'it is hard or impossible to repair (also: cost, launch risk, size limited by the rocket, limited lifetime)'),
      single('sp-platform', '13.32', 'What is an orbital observing platform?', [PLATFORM, 'A telescope on a high mountain', 'A radio dish on a ship', 'A balloon that stays at one height'], PLATFORM, 'a telescope or detector carried in orbit round the Earth (or the Sun), above the atmosphere'),
      multi(
        'sp-weigh-infrared',
        '13.32',
        'Astronomers want to observe infrared from a distant galaxy. They can use a telescope on a high, dry mountain, or a space telescope. Weigh them up. (a) An advantage of the space telescope: (b) An advantage of the mountain-top telescope: (c) What to choose for X-rays from the same galaxy instead:',
        [
          { key: 'space', type: 'choice', label: '(a) The space telescope', options: [SPACE_PLUS, 'It is cheaper to build', 'It can be visited easily for repairs'] },
          { key: 'mountain', type: 'choice', label: '(b) The mountain-top telescope', options: [MOUNTAIN_PLUS, 'It is above all of the water vapour', 'It has no turbulence at all'] },
          { key: 'xray', type: 'choice', label: '(c) For X-rays', options: [ONLY_SPACE, 'The mountain-top telescope, because it is cheaper', 'Either: both receive X-rays'] },
        ],
        [SPACE_PLUS, MOUNTAIN_PLUS, ONLY_SPACE],
        [
          '(a) the space telescope gets all of the infrared (no water vapour absorbing any) and has no turbulence',
          '(b) the mountain-top telescope can be much bigger for the same cost, and can be repaired and upgraded',
          '(c) for X-rays only a space telescope works, because X-rays are absorbed far above any mountain',
        ],
      ),
      single('sp-grb', '13.33', 'What are gamma-ray bursts, found by detectors in space?', [GRB, 'Steady gamma rays from the Sun', 'Gamma rays from nuclear power stations', 'Radio signals from pulsars'], GRB, 'brief, extremely powerful flashes of gamma rays from very distant galaxies, which can only be detected above the atmosphere'),
      single('sp-accretion', '13.33', 'Why are black hole accretion discs seen with X-ray telescopes?', [HOT_GAS, 'Black holes give out X-rays from inside them', 'The discs are cold, so they glow in X-rays', 'X-rays pass through the black hole'], HOT_GAS, 'gas spiralling into the disc round the black hole is heated to millions of degrees, so it gives out X-rays'),
      single('sp-young-stars', '13.33', 'What did ultraviolet and X-ray astronomy show about young stars?', [ACTIVE, 'That young stars give out no ultraviolet', 'That young stars have no atmosphere', 'That young stars are cooler than the Sun throughout'], ACTIVE, 'the structure of their chromospheres and coronae, which are hot and very active, so they shine strongly in ultraviolet and X-rays'),
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.SpaceTelescopesQuestions = api;
  }
})();
