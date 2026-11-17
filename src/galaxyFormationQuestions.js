/**
 * Exam-style practice questions for notes/galaxy-formation.html (spec
 * 15.14), each with `marks` and a full mark scheme in its feedback.
 */
(function () {
  function makeQuestions(F) {
    const UNITS = ['u6.8'];
    const SPEC = '15.14';

    function markScheme(points) {
      return `Mark scheme: ${points.map((p) => `${p} (1)`).join('; ')}.`;
    }

    function scored(results, points) {
      const got = results.filter(Boolean).length;
      const total = results.length;
      const scheme = markScheme(points);
      return { correct: got === total, message: `${got} out of ${total} mark${total === 1 ? '' : 's'}. ${scheme}` };
    }

    function single(id, prompt, options, right, point) {
      return {
        id,
        units: UNITS,
        spec: SPEC,
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

    function multi(id, prompt, fields, rights, points) {
      return {
        id,
        units: UNITS,
        spec: SPEC,
        marks: fields.length,
        prompt,
        fields,
        check(value) {
          return scored(fields.map((f, k) => value[f.key] === rights[k]), points);
        },
      };
    }

    const TD = 'One huge cloud of gas collapses under gravity to form a whole galaxy';
    const BU = 'Small clumps form first and merge, over time, into bigger galaxies';
    const OPTS = [TD, BU, 'Galaxies have always existed and never change'];
    const SPIN = 'It spins faster as it shrinks, and the spin flattens it into a disc';
    const EVIDENCE = 'Very distant galaxies, seen as they were long ago, are smaller and more irregular than nearby ones';
    const ELLIPTICAL = 'One elliptical galaxy';
    const TAILS = 'Long tails of stars are flung out and colliding gas clouds set off bursts of new stars';
    const GRAVITY = 'Gravity';
    const MW = 'They are moving towards each other and may merge in the next few billion years';
    const steps = (id) => F.theory(id).steps;

    return [
      multi(
        'gf-theories',
        'Match each theory of galaxy formation to its idea. (a) Top-down (b) Bottom-up',
        [
          { key: 'top', type: 'choice', label: '(a) Top-down', options: OPTS },
          { key: 'bottom', type: 'choice', label: '(b) Bottom-up', options: OPTS },
        ],
        [TD, BU],
        ['(a) top-down: one huge gas cloud collapses under gravity into a whole galaxy', '(b) bottom-up: small clumps form first and merge over time into bigger and bigger galaxies'],
      ),
      single('gf-gravity', 'What drives galaxy formation in both the top-down and the bottom-up theories?', [GRAVITY, 'Magnetism', 'Light pressure from stars', 'The heat of the Big Bang'], GRAVITY, 'gravity: it pulls a gas cloud in (top-down) or pulls small clumps together (bottom-up)'),
      single('gf-disc', 'In the top-down theory, why does a collapsing cloud end up as a flat disc?', [SPIN, 'Its stars are pushed flat by light', 'Other galaxies squash it', 'Gas cannot form a round shape'], SPIN, `${steps('top-down')[2].toLowerCase().replace(/\.$/, '')}: the spin flattens the collapsing cloud into a disc`),
      single('gf-halo', 'In the top-down theory, why are the oldest stars and globular clusters found in the halo?', ['They formed early, while the cloud was still big and round, before it flattened', 'They were thrown out of the disc later', 'They are visitors from other galaxies', 'The halo is where new stars form today'], 'They formed early, while the cloud was still big and round, before it flattened', 'they formed early, while the collapsing cloud was still big and round, so they stayed spread round it in the halo; the gas went on to flatten into the disc'),
      single('gf-evidence', 'Which observation supports the bottom-up theory?', [EVIDENCE, 'All galaxies are the same size', 'The Milky Way is a barred spiral', 'There are no galaxies in voids'], EVIDENCE, 'very distant galaxies (seen as they were long ago, because their light took so long to reach us) are smaller and more irregular, as if big galaxies were still being built from smaller pieces'),
      single('gf-merger-result', 'Two large spiral galaxies collide and merge. What kind of galaxy is the result, most likely?', [ELLIPTICAL, 'A bigger spiral', 'An irregular galaxy for ever', 'A barred spiral'], ELLIPTICAL, 'an elliptical galaxy: the merger scrambles the stars’ orbits into a round or oval shape and uses up or drives out most of the gas'),
      single('gf-collision', 'What happens while two galaxies collide?', [TAILS, 'Nearly all their stars crash into each other', 'Both galaxies stop shining', 'Nothing at all changes'], TAILS, 'long tails of stars are flung out by gravity, and colliding gas clouds set off bursts of new stars; the stars themselves almost never hit each other, as they are so far apart'),
      single('gf-milky-way', 'What may happen to the Milky Way and the Andromeda Galaxy?', [MW, 'They are moving apart for ever', 'Andromeda will swallow the Sun next year', 'Nothing: they are not affected by each other'], MW, 'they are moving towards each other under gravity and may merge in the next few billion years, though it is not certain (a recent study put the chance at about one in two within 10 billion years); if they do, the result would probably be an elliptical galaxy'),
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.GalaxyFormationQuestions = api;
  }
})();
