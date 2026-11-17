/**
 * Theories of how galaxies form and change, for
 * notes/galaxy-formation.html (spec 15.14): top-down (one huge gas cloud
 * collapses into a galaxy), bottom-up (small clumps form first and merge
 * over time) and mergers (collisions change galaxy types, e.g. two spirals
 * into an elliptical). Each theory has four drawn steps. General knowledge,
 * labelled a first draft on the page.
 */
(function () {
  const THEORIES = [
    {
      id: 'top-down',
      name: 'Top-down',
      steps: [
        'A huge cloud of gas, the size of a whole galaxy or more.',
        'Gravity pulls it in. The first stars form, many in globular clusters, in what becomes the halo.',
        'It spins faster as it shrinks, and flattens into a disc.',
        'A spiral galaxy: old stars in the round halo, gas and young stars in the disc.',
      ],
    },
    {
      id: 'bottom-up',
      name: 'Bottom-up',
      steps: [
        'Many small clumps of gas and stars form first.',
        'Gravity pulls the clumps together, and they merge into small dwarf galaxies.',
        'Dwarf galaxies merge into bigger galaxies.',
        'Big galaxies keep growing by pulling in and swallowing smaller ones.',
      ],
    },
    {
      id: 'mergers',
      name: 'Mergers',
      steps: [
        'Two spiral galaxies are pulled towards each other by gravity.',
        'As they pass close, long tails of stars are flung out, and colliding gas clouds set off bursts of new stars.',
        'The two centres sink together and merge.',
        'One elliptical galaxy, with little gas left to make new stars.',
      ],
    },
  ];

  function theory(id) {
    return THEORIES.find((t) => t.id === id);
  }

  const api = { THEORIES, theory, STEPS: 4 };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.GalaxyFormation = api;
  }
})();
