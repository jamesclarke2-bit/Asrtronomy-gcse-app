/**
 * The life of a Sun-like star, for notes/sun-like-star.html (spec 14.3,
 * 14.4, 14.5 and 14.9).
 *
 * STAGES: the seven stages in order, each with roughly how long it lasts,
 * what happens to the core, and which push balances gravity (or doesn't),
 * as `balance`: the relative sizes of the outward push and the inward
 * pull that the page draws as force arrows.
 *
 * TRACKS: a star's path across the HR diagram, as points of surface
 * temperature (K) and luminosity (Sun = 1). Only `sunLike` exists so far.
 * 13.8 HOOK: the "Massive stars and their ends" page adds a `massive`
 * track here (main sequence, red supergiant, supernova) and draws both
 * with the same drawTrack() in notes/sun-like-star.js; 13.8 ("for
 * Sun-like stars and for much more massive ones") is tagged there, on
 * its own curriculum subtopic, once both tracks exist, not on u4.14.
 *
 * The Sun's surface temperature is the data sheet's (src/specData.js).
 * Every other value, time and mass is general knowledge, labelled a
 * first draft on the page.
 */
(function () {
  const isNode = typeof require !== 'undefined' && typeof module !== 'undefined';
  const SpecData = isNode ? require('./specData') : window.SpecData;

  const SUN_T = SpecData.CONSTANTS.photosphereTemperatureK;

  const STAGES = [
    {
      id: 'nebula',
      name: 'Nebula',
      time: 'millions of years, before part of it collapses',
      years: 1e6,
      core: 'There is no star yet: a cold cloud of gas (mostly hydrogen) and dust.',
      balance: { out: 0.6, in: 0.6, outName: 'gas pressure', inName: 'gravity', verdict: 'Gas pressure holds the cloud up until part of it is squeezed, and gravity starts to win.' },
    },
    {
      id: 'protostar',
      name: 'Protostar',
      time: 'tens of millions of years (about 50 million for the Sun)',
      years: 5e7,
      core: 'The collapsing cloud heats up its centre, but it is not yet hot enough for fusion.',
      balance: { out: 0.45, in: 1, outName: 'gas pressure', inName: 'gravity', verdict: 'Gravity wins: the protostar keeps shrinking and heating up until hydrogen starts to fuse.' },
    },
    {
      id: 'main-sequence',
      name: 'Main sequence',
      time: 'about 10 billion years (the Sun is about 4.6 billion years in)',
      years: 1e10,
      core: 'Hydrogen fuses into helium, releasing energy.',
      balance: { out: 1, in: 1, outName: 'radiation pressure', inName: 'gravity', verdict: 'Balanced: the outward radiation pressure from fusion in the core equals the inward pull of gravity, so the star stays the same size.' },
    },
    {
      id: 'red-giant',
      name: 'Red giant',
      time: 'about 1 billion years',
      years: 1e9,
      core: 'The core runs out of hydrogen, shrinks and heats up; hydrogen fuses in a shell around it, and later helium fuses into carbon in the core.',
      balance: { out: 1.3, in: 0.7, outName: 'radiation pressure', inName: 'gravity', verdict: 'Out of balance: the core shrinks under gravity, while extra energy from the hotter shell pushes the outer layers out, so the star swells about 100 times wider and cools to red.' },
    },
    {
      id: 'planetary-nebula',
      name: 'Planetary nebula',
      time: 'about 10,000 years',
      years: 1e4,
      core: 'Fusion stops. The outer layers drift away into space as a glowing shell, leaving the hot core exposed.',
      balance: { out: 1.2, in: 0.4, outName: 'radiation pressure', inName: 'gravity', verdict: 'The outer layers escape: gravity can no longer hold them, while the bare core shrinks.' },
    },
    {
      id: 'white-dwarf',
      name: 'White dwarf',
      time: 'cools for many billions of years',
      years: 1e10,
      core: 'No fusion. What is left is the hot carbon core, about the size of the Earth.',
      balance: { out: 1, in: 1, outName: 'electron pressure', inName: 'gravity', verdict: 'Balanced again, but by electron pressure: the electrons are squeezed so close that they resist being squeezed any closer, and that holds up the star against gravity without any fusion.' },
    },
    {
      id: 'black-dwarf',
      name: 'Black dwarf',
      time: 'none yet: cooling this far takes longer than the age of the Universe (about 13.8 billion years)',
      years: null,
      core: 'A cold, dark white dwarf that gives out no light.',
      balance: { out: 1, in: 1, outName: 'electron pressure', inName: 'gravity', verdict: 'Still held up by electron pressure, but now cold and dark.' },
    },
  ];

  // HR-diagram tracks: [surface temperature (K), luminosity (Sun = 1)].
  // Each stage's point is where its marker sits; `path` joins them in order.
  const TRACKS = {
    sunLike: {
      name: 'a Sun-like star',
      points: {
        protostar: [4200, 10],
        'main-sequence': [SUN_T, 1],
        'red-giant': [3900, 1000],
        'planetary-nebula': [40000, 3000],
        'white-dwarf': [25000, 0.01],
        'black-dwarf': [3000, 1e-5],
      },
      path: [
        [4200, 10], [4600, 3], [SUN_T, 1], [5200, 2.5], [4500, 20], [3900, 1000],
        [10000, 3000], [40000, 3000], [40000, 0.3], [25000, 0.01], [8000, 0.0006], [3000, 1e-5],
      ],
    },
  };

  function stage(id) {
    const s = STAGES.find((x) => x.id === id);
    if (!s) throw new Error(`No stage ${id}`);
    return s;
  }

  /** The stage after this one, or null at the end. */
  function nextStage(id) {
    const k = STAGES.findIndex((x) => x.id === id);
    return STAGES[k + 1] || null;
  }

  /** Which way the star is changing: 'shrinking', 'swelling' or 'steady'. */
  function trend(id) {
    const b = stage(id).balance;
    if (Math.abs(b.out - b.in) < 1e-9) return 'steady';
    return b.out > b.in ? 'swelling' : 'shrinking';
  }

  /** The longest-lasting stage with a known timescale. */
  function longestStage() {
    return STAGES.filter((s) => s.years).reduce((a, b) => (b.years > a.years ? b : a));
  }

  const api = { STAGES, TRACKS, stage, nextStage, trend, longestStage };
  if (isNode && module.exports) {
    module.exports = api;
  } else {
    window.SunLikeStar = api;
  }
})();
