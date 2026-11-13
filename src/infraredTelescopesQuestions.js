/**
 * Exam-style practice questions for notes/infrared-telescopes.html, each
 * with `marks`, a `spec` tag (13.23, 13.28, 13.29 or 13.30) and a full
 * mark scheme in its feedback.
 */
(function () {
  function makeQuestions(I) {
    const UNITS = ['u5.6'];

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

    const OPTICAL_RADIO = 'Optical and radio telescopes';
    const WINDOWS = 'Visible light and radio waves';
    const XRAY_HIGH = 'X-rays are absorbed high in the atmosphere, far above the top of any mountain';
    const XRAY_SPACE = 'In space, above the atmosphere';
    const VAPOUR = 'Water vapour';
    const ABOVE = 'It is above most of the water vapour, so more infrared gets through';
    const LOW = 'In the lowest few kilometres of the atmosphere';
    const MORE = 'More infrared gets through, because there is less water vapour above it';
    const THROUGH_DUST = 'Infrared passes through the dust that hides them in visible light';
    const COOL_GLOW = 'They are too cool to glow in visible light, but they do glow in infrared';
    const HOTSPOTS = 'Hot volcanic spots, such as those on Jupiter’s moon Io';
    const TURBULENCE = 'Moving pockets of warmer and cooler air bend the starlight by different amounts';
    const BLUR = 'It spreads into a larger, moving blur, so fine detail is lost';
    const CLOUDS = 'Clouds block the light completely';
    const SCATTER = 'Scattered light, such as light pollution, brightens the sky and hides faint objects';

    return [
      single('ir-sea-level', '13.23', 'Which kinds of telescope work well at sea level?', [OPTICAL_RADIO, 'Infrared and X-ray telescopes', 'Ultraviolet and gamma-ray telescopes', 'All kinds of telescope'], OPTICAL_RADIO, 'only optical and radio telescopes, because only visible light and radio waves get through the atmosphere to the ground'),
      pair(
        'ir-xray-mountain',
        '13.23',
        "Why can't an X-ray telescope work on a mountain top? (a) What happens to X-rays from space? (b) So where must an X-ray telescope be?",
        [
          { key: 'absorbed', type: 'choice', label: '(a) X-rays from space', options: [XRAY_HIGH, 'X-rays reach the ground, but only at night', 'X-rays are blocked only by clouds'] },
          { key: 'where', type: 'choice', label: '(b) An X-ray telescope must be', options: [XRAY_SPACE, 'On the highest mountain possible', 'At sea level, away from cities'] },
        ],
        [XRAY_HIGH, XRAY_SPACE],
        ['(a) X-rays are absorbed high in the atmosphere, far above even the highest mountain', '(b) so the telescope must be in space, above the atmosphere'],
      ),
      single('ir-windows', '13.23', 'Which waves from space get through the atmosphere to the ground?', [WINDOWS, 'Gamma rays and X-rays', 'Ultraviolet and infrared only', 'All of them'], WINDOWS, 'visible light and radio waves get through; the atmosphere absorbs most other wavelengths'),
      pair(
        'ir-high-dry',
        '13.28',
        'Why is a high, dry site better for infrared? (a) What in the atmosphere absorbs much of the infrared from space? (b) How does a high, dry site help?',
        [
          { key: 'absorber', type: 'choice', label: '(a) Infrared is absorbed by', options: [VAPOUR, 'Ozone only', 'Dust from space'] },
          { key: 'helps', type: 'choice', label: '(b) A high, dry site helps because', options: [ABOVE, 'It is closer to the stars', 'It is warmer, so infrared is stronger'] },
        ],
        [VAPOUR, ABOVE],
        ['(a) water vapour absorbs much of the infrared', '(b) a high, dry site is above most of the water vapour, so more infrared reaches the telescope'],
      ),
      single('ir-vapour-low', '13.28', "Where is most of the atmosphere's water vapour?", [LOW, 'Evenly spread through the whole atmosphere', 'At the very top of the atmosphere', 'Only above the clouds'], LOW, 'most water vapour is in the lowest few kilometres, so a telescope a few kilometres up a mountain is above most of it'),
      single('ir-move-higher', '13.28', 'An infrared telescope is moved from sea level to a site 4 km up a dry mountain. What happens to the infrared reaching it?', [MORE, 'Less infrared gets through, because the air is colder', 'Nothing changes: infrared is not absorbed by air', 'All infrared is now blocked'], MORE, 'more infrared reaches the telescope, because there is less water vapour above it to absorb it'),
      single('ir-protostars', '13.29', 'Why did infrared astronomy reveal protostars (stars still forming) that visible light could not?', [THROUGH_DUST, 'Protostars are brighter in visible light', 'Infrared telescopes are always bigger', 'Protostars only exist in the infrared'], THROUGH_DUST, 'protostars are hidden inside clouds of dust; infrared passes through the dust, so they can be seen'),
      single('ir-dust-clouds', '13.29', 'Why are cold dust and molecular clouds seen in infrared but not in visible light?', [COOL_GLOW, 'They are too hot to see in visible light', 'They reflect only infrared from the Sun', 'They are too far away for visible light'], COOL_GLOW, 'cold dust and molecular clouds give out infrared but are too cool to glow in visible light'),
      single('ir-hotspots', '13.29', 'What did infrared astronomy discover on some moons?', [HOTSPOTS, 'Oceans of liquid water on their surfaces', 'Rings around them', 'That they give out radio waves'], HOTSPOTS, 'hotspots on moons, such as volcanoes on Io, show up as bright spots in infrared'),
      single('ir-twinkle', '13.30', 'Why do stars twinkle?', [TURBULENCE, 'Stars change brightness every few seconds', 'The Earth’s rotation makes them flicker', 'Clouds pass in front of them'], TURBULENCE, 'turbulent air: moving pockets of warmer and cooler air bend the starlight by different amounts, so the star seems to flicker and move'),
      single('ir-blur', '13.30', "What does turbulent air do to a star's image in a telescope?", [BLUR, 'It makes the image sharper', 'It changes the star’s colour only', 'It has no effect on the image'], BLUR, 'the sharp point spreads into a larger blur that moves about, so fine detail is lost'),
      pair(
        'ir-other-effects',
        '13.30',
        "Besides turbulence, give two ways the atmosphere spoils astronomers' images. (a) A way light from space is blocked: (b) A way the sky is made brighter:",
        [
          { key: 'block', type: 'choice', label: '(a) Light is blocked when', options: [CLOUDS, 'The Moon is full', 'The telescope is too big'] },
          { key: 'bright', type: 'choice', label: '(b) The sky is made brighter by', options: [SCATTER, 'Water vapour absorbing infrared', 'Stars twinkling'] },
        ],
        [CLOUDS, SCATTER],
        ['(a) clouds block the light completely', '(b) the air scatters light (sunlight in the day; street lighting at night, light pollution), brightening the sky and hiding faint objects'],
      ),
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.InfraredTelescopesQuestions = api;
  }
})();
