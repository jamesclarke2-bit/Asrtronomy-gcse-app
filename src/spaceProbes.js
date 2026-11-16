/**
 * Space probes, for notes/space-probes.html (spec 11.26-11.28).
 *
 * The four kinds of probe the spec names (fly-by, orbiter, impactor,
 * lander), each with its advantages and disadvantages; one example
 * mission of each (two for the orbiter, as the spec names Juno or Dawn),
 * with its target and major discoveries; and the escape-velocity model
 * behind the launch-speed slider: a probe launched straight up from the
 * Earth's surface, coasting with no air resistance, rises to a height h
 * given by energy conservation,
 *
 *   h = R v² ÷ (v_esc² − v²),  with v_esc² = 2GM ÷ R,
 *
 * and never comes back once v reaches the escape velocity. GM and R are
 * the Earth's (general-knowledge values, used only inside this model);
 * the Moon's distance for comparison is the data sheet's (src/specData.js).
 */
(function () {
  const isNode = typeof require !== 'undefined' && typeof module !== 'undefined';
  const SpecData = isNode ? require('./specData') : window.SpecData;

  // The Earth's GM (km³/s²) and mean radius (km): general knowledge.
  const EARTH_GM = 398600;
  const EARTH_RADIUS_KM = 6371;
  const ESCAPE_KMS = Math.sqrt((2 * EARTH_GM) / EARTH_RADIUS_KM);
  const MOON_DISTANCE_KM = SpecData.CONSTANTS.meanEarthMoonDistanceKm;

  const TYPES = [
    {
      id: 'flyby',
      name: 'Fly-by',
      does: 'flies past its target once, measuring and photographing it on the way',
      pros: [
        'cheapest kind of visit: it needs no fuel to slow down',
        'can reach the most distant targets, and can pass several on one trip',
      ],
      cons: [
        'only a brief close look: a few hours near the target',
        'sees one side at one moment, so cannot follow changes over time',
      ],
    },
    {
      id: 'orbiter',
      name: 'Orbiter',
      does: 'slows down into orbit and goes round its target again and again',
      pros: [
        'studies the target for months or years, so can map the whole surface',
        'can follow changes over time, such as weather and seasons',
      ],
      cons: [
        'must carry extra fuel to slow down into orbit, so it is heavier and costs more',
        'observes from a distance: it cannot touch or sample the surface',
      ],
    },
    {
      id: 'impactor',
      name: 'Impactor',
      does: 'crashes into its target on purpose, so the material thrown up can be studied',
      pros: [
        'reveals what lies beneath the surface',
        'the crash can be watched by a nearby craft and by telescopes on Earth',
      ],
      cons: [
        'destroyed in the crash, so it is a one-off measurement',
        'needs a very precise aim, and the data comes in a brief burst',
      ],
    },
    {
      id: 'lander',
      name: 'Lander',
      does: 'slows down and touches down gently on the surface',
      pros: [
        'measures the surface directly: its rock, soil or ice, chemistry and close-up views',
        'can sample material and carry out experiments on the spot',
      ],
      cons: [
        'the hardest and most expensive kind: landing safely is risky and can fail',
        'studies only one small spot (unless it carries a rover that can move)',
      ],
    },
  ];

  const MISSIONS = [
    {
      id: 'new-horizons',
      name: 'New Horizons',
      type: 'flyby',
      target: 'the dwarf planet Pluto, then Arrokoth, a small icy body further out in the Kuiper belt',
      dates: 'launched 2006; flew past Pluto on 14 July 2015, and Arrokoth on 1 January 2019',
      finds: [
        'a huge, smooth, heart-shaped plain of frozen nitrogen on Pluto, with very few craters, so its surface is young',
        'mountains of water ice, and a thin, hazy atmosphere',
        'Arrokoth is two rounded lumps joined gently together',
      ],
    },
    {
      id: 'juno',
      name: 'Juno',
      type: 'orbiter',
      target: 'Jupiter, on an orbit that passes over both poles',
      dates: 'launched 2011; went into orbit round Jupiter in 2016',
      finds: [
        'clusters of giant storms (cyclones) around both of Jupiter’s poles',
        'a core that is not a small, sharp ball but spread out and mixed into the layers above it',
        'a very strong, lopsided magnetic field',
      ],
    },
    {
      id: 'dawn',
      name: 'Dawn',
      type: 'orbiter',
      target: 'the asteroid Vesta, then the dwarf planet Ceres, both in the asteroid belt',
      dates: 'launched 2007; orbited Vesta from 2011 and Ceres from 2015',
      finds: [
        'the first probe to orbit two different bodies beyond the Earth–Moon system',
        'bright spots on Ceres are salt left behind by salty water from below the surface',
      ],
    },
    {
      id: 'deep-impact',
      name: 'Deep Impact',
      type: 'impactor',
      target: 'Comet Tempel 1',
      dates: 'launched 2005; its impactor hit the comet on 4 July 2005, watched by the fly-by craft that carried it',
      finds: [
        'the crash threw out a huge cloud of very fine, powdery dust: the comet’s core is loose and porous',
        'more dust than ice: more an “icy dirtball” than a “dirty snowball”',
        'water ice and carbon-based (organic) material',
      ],
    },
    {
      id: 'philae',
      name: 'Philae',
      type: 'lander',
      target: 'Comet 67P/Churyumov–Gerasimenko, carried there by the Rosetta orbiter',
      dates: 'Rosetta launched 2004; Philae landed on 12 November 2014',
      finds: [
        'carbon-based (organic) molecules on the comet, some never found on a comet before',
        'its harpoons failed to fire, so it bounced: the surface was harder than expected beneath its dust',
        'it came to rest in shadow, so it ran out of power after about 60 hours',
      ],
    },
  ];

  function type(id) {
    const t = TYPES.find((x) => x.id === id);
    if (!t) throw new Error(`No probe type ${id}`);
    return t;
  }

  /** The missions of one type. */
  function missionsOfType(id) {
    return MISSIONS.filter((m) => m.type === id);
  }

  /**
   * Launched straight up from the surface at v km/s and coasting (no air
   * resistance): the greatest height reached (km), or Infinity at or
   * above the escape velocity.
   */
  function maxHeightKm(speedKms) {
    const v2 = speedKms * speedKms;
    const e2 = ESCAPE_KMS * ESCAPE_KMS;
    if (v2 >= e2) return Infinity;
    return (EARTH_RADIUS_KM * v2) / (e2 - v2);
  }

  /** 'falls back' below the escape velocity, 'escapes' at or above it. */
  function outcome(speedKms) {
    return Number.isFinite(maxHeightKm(speedKms)) ? 'falls back' : 'escapes';
  }

  /** The launch speed (km/s) that just reaches a height h (km) before falling back. */
  function speedToReachKm(heightKm) {
    return ESCAPE_KMS * Math.sqrt(heightKm / (EARTH_RADIUS_KM + heightKm));
  }

  const api = {
    EARTH_GM,
    EARTH_RADIUS_KM,
    ESCAPE_KMS,
    MOON_DISTANCE_KM,
    TYPES,
    MISSIONS,
    type,
    missionsOfType,
    maxHeightKm,
    outcome,
    speedToReachKm,
  };
  if (isNode && module.exports) {
    module.exports = api;
  } else {
    window.SpaceProbes = api;
  }
})();
