/**
 * Exam-style practice questions for notes/gravity-forming-bodies.html
 * (spec 12.1a, 12.1c, 12.2a, 12.2b, 12.2c), each with `marks` and a mark
 * scheme in its feedback. These are "be able to identify" points, so most
 * questions give a described situation or a drawing and ask which gravity
 * effect is at work.
 */
(function () {
  function makeQuestions(G) {
    const UNITS = ['u3.32'];

    function markScheme(points) {
      return `Mark scheme: ${points.map((p) => `${p} (1)`).join('; ')}.`;
    }

    function single(id, spec, prompt, options, right, point, render) {
      const q = {
        id,
        units: UNITS,
        spec,
        marks: 1,
        prompt,
        type: 'choice',
        options,
        check(value) {
          return { correct: value === right, message: markScheme([point]) };
        },
      };
      if (render) q.render = render;
      return q;
    }

    // A drawing for a picture question, using the page's own drawings.
    function picture(label, width, height, draw) {
      return (container) => {
        const panelDiv = document.createElement('div');
        panelDiv.className = 'spectrum-panel hr-question-diagram';
        const wrap = document.createElement('div');
        wrap.className = 'labelled-diagram-wrap';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        [['viewBox', `0 0 ${width} ${height}`], ['width', width], ['height', height], ['class', 'responsive-svg'], ['role', 'img'], ['aria-label', label]].forEach(([k, v]) => svg.setAttribute(k, v));
        wrap.appendChild(svg);
        panelDiv.appendChild(wrap);
        container.appendChild(panelDiv);
        draw(svg, wrap);
      };
    }

    const E = Object.fromEntries(G.EFFECTS.map((e) => [e.key, e.name]));
    const EFFECT_NAMES = G.EFFECTS.map((e) => e.name);
    const ROCHE = G.ROCHE_PLANET_RADII;

    return [
      // --- 12.1a Regular motion -------------------------------------------
      single(
        'gb-eclipse-predict',
        '12.1a',
        'Astronomers can say today exactly when a solar eclipse will happen 50 years from now. Identify the gravity effect that makes this possible.',
        [E.regular, E.roche, E.atmosphere, E.lagrange],
        E.regular,
        "regular, predictable motion: gravity keeps the Moon and the Earth moving in the same orbits in the same times, so their positions can be worked out far ahead",
      ),
      single(
        'gb-why-regular',
        '12.1a',
        'The data sheet gives Mars an orbital period of 1.9 years. Why does Mars take the same time to go round the Sun every orbit?',
        [
          "The Sun's gravity keeps it moving in the same orbit, time after time",
          'Mars has an engine that keeps its speed steady',
          'Nothing pulls on Mars, so it keeps going in a straight line',
          'Mars is pushed round by the solar wind',
        ],
        "The Sun's gravity keeps it moving in the same orbit, time after time",
        "the Sun's gravity keeps Mars in the same orbit, so each orbit takes the same time",
      ),

      // --- 12.1c Multi-body interactions ---------------------------------
      single(
        'gb-lagrange-picture',
        '12.1c',
        'The drawing shows the Sun, the Earth and its orbit. A space telescope is parked at the ringed point, just beyond the Earth, and goes round the Sun in step with the Earth. What is this point?',
        ['A Lagrange point (L2)', 'The Roche limit', "The Earth's escape speed", 'A resonance'],
        'A Lagrange point (L2)',
        'a Lagrange point, L2: the Sun and the Earth together let a small object keep pace with the Earth there',
        picture('The Sun and the Earth on its orbit, with five unnamed diamond markers; the one just beyond the Earth, away from the Sun, is ringed.', 640, 400, (svg, wrap) => window.GravityBodiesDrawing.drawLagrange(svg, wrap, { highlight: 'L2', hideNames: true })),
      ),
      single(
        'gb-resonance-identify',
        '12.1c',
        "Io goes round Jupiter in about 1.8 days, Europa in about 3.6 days and Ganymede in about 7.2 days. Identify the effect these three moons show.",
        [E.resonance, E.roche, E.shape, E.atmosphere],
        E.resonance,
        'a resonance: the periods fit a 1 : 2 : 4 whole-number pattern, so the moons tug on each other at the same places again and again',
      ),
      {
        id: 'gb-resonance-count',
        units: UNITS,
        spec: '12.1c',
        marks: 1,
        prompt: 'Io, Europa and Ganymede orbit Jupiter in a 1 : 2 : 4 pattern of periods (Ganymede takes 4 times as long as Io). While Ganymede goes round 3 times, how many times does Io go round?',
        type: 'number',
        unitLabel: 'orbits',
        check(value) {
          const correct = Math.abs(Number(value) - 12) <= 0.24;
          return { correct, message: markScheme(['Io goes round 4 times for each Ganymede orbit, so 3 × 4 = 12 orbits']) };
        },
        answer: 12,
      },
      single(
        'gb-chaos',
        '12.1c',
        "Computer models can show where the planets will be in 1,000 years, but not exactly where they will be in 100 million years. Which effect explains this?",
        [
          'Chaos: tiny pulls between the planets add up, so exact positions far ahead cannot be predicted',
          'The Roche limit pulls the planets apart',
          'The planets lose their atmospheres',
          'Gravity stops working over long times',
        ],
        'Chaos: tiny pulls between the planets add up, so exact positions far ahead cannot be predicted',
        'chaos: the small pulls of the planets on each other add up over time, so tiny uncertainties grow too big to predict exact positions',
      ),
      single(
        'gb-shifting',
        '12.1c',
        "The giant planets are thought to have formed in different places from where they orbit now. Which effect is this?",
        ['Shifting orbits, from the pulls of other bodies', 'The Roche limit', 'A Lagrange point', 'Holding an atmosphere'],
        'Shifting orbits, from the pulls of other bodies',
        'shifting orbits: pulls between the planets (and the early disc) can move an orbit over time',
      ),

      // --- 12.2a Roche limit ----------------------------------------------
      single(
        'gb-roche-picture',
        '12.2a',
        'The drawing shows what is left of a moon that drifted too close to its planet: a ring of pieces. Identify the effect that did this.',
        [E.roche, E.lagrange, E.atmosphere, E.regular],
        E.roche,
        "the Roche limit: inside it, the planet's tidal stretch beats the moon's own gravity, pulling the moon apart into a ring",
        picture('A planet with a ring of small pieces going round it, close in.', 640, 300, (svg, wrap) => window.GravityBodiesDrawing.drawRoche(svg, wrap, 1.8, { hideLimit: true, hideScale: true, hideInset: true })),
      ),
      single(
        'gb-roche-inside',
        '12.2a',
        `A planet's Roche limit is about ${ROCHE} planet radii from its centre. A moon orbits at 2 planet radii. What happens to it?`,
        [
          "It is pulled apart, because it is inside the Roche limit",
          'Nothing: it is outside the Roche limit',
          'It loses its atmosphere but stays whole',
          'It becomes perfectly round',
        ],
        'It is pulled apart, because it is inside the Roche limit',
        `2 planet radii is less than ${ROCHE}, so the moon is inside the Roche limit and the tidal stretch pulls it apart`,
      ),

      // --- 12.2b Round or lumpy -------------------------------------------
      single(
        'gb-shape-why',
        '12.2b',
        'Ceres, about 940 km across, is round. Phobos, about 22 km across, is lumpy. Explain the difference.',
        [
          "Ceres has enough mass for its own gravity to pull its rock into a sphere; Phobos's gravity is too weak",
          'Ceres spins faster, which rounds it off',
          'Phobos is closer to the Sun, which melts its edges',
          'Lumpy bodies are always made of ice',
        ],
        "Ceres has enough mass for its own gravity to pull its rock into a sphere; Phobos's gravity is too weak",
        "the bigger body's own gravity is strong enough to pull its rock into a sphere; a small body's gravity is too weak, so it keeps a lumpy shape",
      ),
      single(
        'gb-shape-pick',
        '12.2b',
        'Bodies become round from about 400 to 600 km across. Which of these rocky bodies is most likely to be round?',
        ['A body 1,200 km across', 'A body 300 km across', 'A body 60 km across', 'A body 5 km across'],
        'A body 1,200 km across',
        '1,200 km is well above the size where gravity pulls rock into a sphere',
        picture('A small lumpy body, potato-shaped, with craters.', 640, 300, (svg, wrap) => window.GravityBodiesDrawing.drawShape(svg, wrap, 60, { hideScale: true })),
      ),

      // --- 12.2c Holding an atmosphere ------------------------------------
      single(
        'gb-moon-no-air',
        '12.2c',
        'The Moon and the Earth are the same distance from the Sun, but the Moon has almost no atmosphere. Identify why.',
        [
          "The Moon's escape speed is too low: its gas particles move fast enough to escape its weaker gravity",
          'The Moon is too far from the Sun to have air',
          'The Moon is inside the Roche limit',
          'The Moon is in a resonance with the Earth',
        ],
        "The Moon's escape speed is too low: its gas particles move fast enough to escape its weaker gravity",
        "the Moon's small mass gives it a low escape speed, so gas particles escape: gravity holding an atmosphere depends on escape speed against gas speed",
      ),
      single(
        'gb-lightest-lost',
        '12.2c',
        'A planet has gases of all four kinds below, all at the same temperature. Which is it most likely to lose first?',
        ['Hydrogen', 'Helium', 'Nitrogen', 'Carbon dioxide'],
        'Hydrogen',
        'hydrogen: the lightest gas has the fastest particles at the same temperature, so they reach escape speed most easily',
      ),
      single(
        'gb-hotter-faster',
        '12.2c',
        'Two planets have the same escape speed. One is much hotter. Which is more likely to lose its atmosphere, and why?',
        [
          'The hotter one: its gas particles move faster',
          'The colder one: cold gas is lighter',
          'Neither: only escape speed matters',
          'The hotter one: heat makes its gravity weaker',
        ],
        'The hotter one: its gas particles move faster',
        'the hotter planet: hotter gas particles move faster, so more of them can reach escape speed',
      ),

      // --- Identify the effect: one question across all five points -------
      {
        id: 'gb-match-effects',
        units: UNITS,
        spec: '12.1c',
        marks: 3,
        prompt: 'Identify the gravity effect in each situation.',
        fields: [
          { key: 'trojans', type: 'choice', label: '(a) Asteroids that stay 60° ahead of Jupiter on its orbit', options: EFFECT_NAMES },
          { key: 'titan', type: 'choice', label: '(b) Titan, a large cold moon, has a thick nitrogen atmosphere', options: EFFECT_NAMES },
          { key: 'vesta', type: 'choice', label: '(c) Small asteroids are potato-shaped, but Ceres is a sphere', options: EFFECT_NAMES },
        ],
        check(value) {
          const ok = [value.trojans === E.lagrange, value.titan === E.atmosphere, value.vesta === E.shape];
          const got = ok.filter(Boolean).length;
          const scheme = markScheme([`(a) ${E.lagrange.toLowerCase()} (L4)`, `(b) ${E.atmosphere.toLowerCase()}: big and cold, so its escape speed beats its gas speed`, `(c) ${E.shape.toLowerCase()}: only a big enough body is pulled round`]);
          return { correct: ok.every(Boolean), message: `${got} out of 3 marks. ${scheme}` };
        },
      },
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.GravityBodiesQuestions = api;
  }
})();
