/**
 * Exam-style practice questions for notes/space-probes.html, each with
 * `marks`, a `spec` tag (11.26, 11.27 or 11.28) and a full mark scheme in
 * its feedback. Mission facts come from SpaceProbes (src/spaceProbes.js).
 */
(function () {
  function makeQuestions(P) {
    const UNITS = ['u5.3'];

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

    const FLYBY_PLUS = 'It needs no fuel to slow down, so it can reach the most distant targets';
    const ORBIT_PLUS = 'It can study the target for months or years and map its whole surface';
    const ORBIT_MINUS = 'It must carry extra fuel to slow down into orbit, so it is heavier and costs more';
    const UNDER = 'To study material from beneath the surface, thrown up by the crash';
    const LAND_MINUS = 'Landing safely is difficult and risky, and it studies only one spot';
    const ORBITER = 'An orbiter';
    const PROBE_PLUS = 'It sees far more detail from close up, and can measure things such as a magnetic field';
    const SCOPE_PLUS = 'It can study many targets for years, at far less cost per target, and can be repaired';
    const PLUTO = 'Pluto';
    const FLYBY = 'Fly-by';
    const POLES = 'Clusters of giant storms around both of Jupiter’s poles';
    const POROUS = 'The core is loose and porous, with more dust than ice';
    const ORGANIC = 'Carbon-based (organic) molecules on the comet';
    const ESCAPE = 'The speed needed to coast away from a planet’s gravity for good, with no further push';
    const NO_AIR = 'There is no air in space: a jet needs air for oxygen to burn its fuel';
    const OWN_OX = 'It carries its own oxidiser, and throws exhaust out backwards, which pushes it forwards';
    const FALLS = 'It rises, slows down, and falls back to the Earth';

    const ESC = 11.2;
    const kmh = ESC * 3600;
    const kmhText = Math.round(kmh).toLocaleString('en-GB');
    const lo = Math.round(0.98 * kmh).toLocaleString('en-GB');
    const hi = Math.round(1.02 * kmh).toLocaleString('en-GB');
    const nh = P.MISSIONS.find((m) => m.id === 'new-horizons');
    const juno = P.MISSIONS.find((m) => m.id === 'juno');
    const di = P.MISSIONS.find((m) => m.id === 'deep-impact');
    const philae = P.MISSIONS.find((m) => m.id === 'philae');
    const TYPE_NAMES = P.TYPES.map((t) => t.name);
    const below8 = (Math.round(P.maxHeightKm(8) / 100) * 100).toLocaleString('en-GB');

    return [
      // 11.26: advantages and disadvantages of each kind of probe.
      single('pr-flyby-plus', '11.26', 'Give an advantage of a fly-by probe.', [FLYBY_PLUS, 'It can study its target for years', 'It can collect samples of the surface', 'It shows what lies beneath the surface'], FLYBY_PLUS, 'it needs no fuel to slow down, so it is the cheapest kind of visit and can reach the most distant targets (or pass several on one trip); only a brief close look'),
      multi(
        'pr-orbiter',
        '11.26',
        'An orbiter is sent to a planet. (a) Give an advantage of an orbiter. (b) Give a disadvantage.',
        [
          { key: 'plus', type: 'choice', label: '(a) An advantage', options: [ORBIT_PLUS, 'It is destroyed, so it costs nothing to run', 'It can reach the most distant targets fastest'] },
          { key: 'minus', type: 'choice', label: '(b) A disadvantage', options: [ORBIT_MINUS, 'It can only see the target for a few hours', 'It must land safely on the surface'] },
        ],
        [ORBIT_PLUS, ORBIT_MINUS],
        ['(a) it studies the target for months or years, mapping the whole surface and following changes such as weather', '(b) it must carry extra fuel to slow down into orbit, so it is heavier and costs more (also: it cannot touch or sample the surface)'],
      ),
      single('pr-impactor-why', '11.26', 'Why would scientists crash a probe into a comet on purpose?', [UNDER, 'To push the comet into a new orbit', 'To stop the comet’s tail forming', 'To land more cheaply'], UNDER, 'to study the material from beneath the surface that the crash throws up (it is destroyed, so it is a one-off measurement)'),
      single('pr-lander-minus', '11.26', 'Give a disadvantage of a lander.', [LAND_MINUS, 'It can only take a brief look as it passes', 'It cannot touch the surface', 'It is destroyed when it arrives'], LAND_MINUS, 'it is the hardest and most expensive kind: slowing down and landing safely is risky and can fail, and it studies only one small spot'),
      single('pr-which-type', '11.26', 'Scientists want to map the whole surface of a planet and watch its weather change over several years. Which kind of probe should they send?', [ORBITER, 'A fly-by', 'An impactor', 'A lander'], ORBITER, 'an orbiter: it goes round the planet again and again for months or years, so it can map the whole surface and follow changes such as weather'),
      multi(
        'pr-vs-telescope',
        '11.26',
        'Compare a space probe with a telescope on Earth. (a) An advantage of the probe: (b) An advantage of the telescope:',
        [
          { key: 'probe', type: 'choice', label: '(a) The probe', options: [PROBE_PLUS, 'It is cheaper per target', 'It gives results straight away'] },
          { key: 'scope', type: 'choice', label: '(b) The telescope', options: [SCOPE_PLUS, 'It sees the far side of every planet', 'It can touch the surface'] },
        ],
        [PROBE_PLUS, SCOPE_PLUS],
        ['(a) the probe sees far more detail from close up, and can measure things a telescope cannot, such as a magnetic field', '(b) the telescope can study many targets for years, at far less cost per target, starts straight away and can be repaired'],
      ),
      // 11.27: an example of each, with its target and major discoveries.
      multi(
        'pr-new-horizons',
        '11.27',
        'New Horizons visited the outer Solar System. (a) What was its main target? (b) What kind of probe was it?',
        [
          { key: 'target', type: 'choice', label: '(a) Its main target', options: [PLUTO, 'Jupiter', 'Comet Tempel 1', 'Comet 67P'] },
          { key: 'kind', type: 'choice', label: '(b) Kind of probe', options: TYPE_NAMES },
        ],
        [PLUTO, FLYBY],
        ['(a) the dwarf planet Pluto (then Arrokoth, in the Kuiper belt)', '(b) a fly-by: it flew past Pluto once, on 14 July 2015, and carried on outwards'],
      ),
      single('pr-juno', '11.27', 'The orbiter Juno studies Jupiter. Which was one of its major discoveries?', [POLES, 'Bright salt spots on the surface', 'A heart-shaped plain of nitrogen ice', 'Organic molecules on a comet'], POLES, `clusters of giant storms (cyclones) around both of Jupiter’s poles (also: a core spread out and mixed into the layers above; a very strong, lopsided magnetic field). Juno: ${juno.dates}`),
      single('pr-deep-impact', '11.27', 'Deep Impact crashed an impactor into Comet Tempel 1. What did the cloud it threw up show?', [POROUS, 'The comet is solid rock all the way through', 'The comet is made of pure ice', 'The comet has a thick atmosphere'], POROUS, 'a huge cloud of very fine, powdery dust: the comet’s core is loose and porous, with more dust than ice (an “icy dirtball”)'),
      single('pr-philae', '11.27', 'The lander Philae, carried by the Rosetta orbiter, landed on Comet 67P. What did it find?', [ORGANIC, 'Liquid water flowing on the surface', 'A thick layer of soft snow everywhere', 'A magnetic field stronger than Jupiter’s'], ORGANIC, `carbon-based (organic) molecules on the comet (it also bounced, as its harpoons failed: the surface was harder than expected). ${philae.dates}`),
      multi(
        'pr-match',
        '11.27',
        'Match each mission to its kind of probe. (a) New Horizons (b) Juno (c) Deep Impact (d) Philae',
        [nh, juno, di, philae].map((m, k) => ({ key: m.id, type: 'choice', label: `(${'abcd'[k]}) ${m.name}`, options: TYPE_NAMES })),
        [nh, juno, di, philae].map((m) => P.type(m.type).name),
        [nh, juno, di, philae].map((m, k) => `(${'abcd'[k]}) ${m.name}: ${P.type(m.type).name.toLowerCase()}, to ${m.target.split(',')[0]}`),
      ),
      // 11.28: escape velocity, and why it takes a rocket.
      single('pr-escape-what', '11.28', 'What is escape velocity?', [ESCAPE, 'The top speed of a rocket', 'The speed of a probe in orbit', 'The speed at which a probe hits a planet'], ESCAPE, 'the speed something needs to coast away from a planet’s gravity for good, with no further push'),
      {
        id: 'pr-escape-kmh',
        units: UNITS,
        spec: '11.28',
        marks: 2,
        prompt: `The Earth's escape velocity is ${ESC} km/s. There are 3,600 seconds in an hour. What is the escape velocity in km/h?`,
        type: 'number',
        unitLabel: 'km/h',
        check(value) {
          const v = Number(value);
          const tol = 0.02 * kmh * (1 + 1e-9);
          const correct = Number.isFinite(v) && Math.abs(v - kmh) <= tol;
          const scheme = markScheme(['km/h = km/s × 3,600 (seconds in an hour)', `= ${ESC} × 3,600 = ${kmhText} km/h (accept ${lo} to ${hi})`]);
          return { correct, message: `${correct ? 'Correct.' : 'Not quite.'} ${scheme}` };
        },
        answer: { value: kmh },
      },
      single('pr-below-escape', '11.28', 'A probe is launched straight up from the Earth at 8 km/s, below the escape velocity of 11.2 km/s, and then coasts. Ignore air resistance. What happens?', [FALLS, 'It escapes, but more slowly', 'It stays still at a fixed height', 'It keeps speeding up'], FALLS, `it rises, slowing down as gravity pulls back on it, to about ${below8} km, then falls back: below the escape velocity it cannot get away`),
      multi(
        'pr-rocket',
        '11.28',
        'A probe must reach escape velocity, which needs a rocket. (a) Why can a jet engine not do it? (b) How does a rocket work in space?',
        [
          { key: 'jet', type: 'choice', label: '(a) A jet engine', options: [NO_AIR, 'It is too heavy to lift', 'It works only at night'] },
          { key: 'rocket', type: 'choice', label: '(b) A rocket', options: [OWN_OX, 'It pushes against the air behind it', 'It is pulled up by the Moon’s gravity'] },
        ],
        [NO_AIR, OWN_OX],
        ['(a) a jet engine takes in air: it needs the air’s oxygen to burn its fuel, and the air itself to throw out backwards; space has no air', '(b) a rocket carries its own oxidiser as well as its fuel, and throws hot exhaust out backwards, which pushes it forwards, so it needs nothing to push against'],
      ),
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.SpaceProbesQuestions = api;
  }
})();
