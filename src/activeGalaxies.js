/**
 * Active galaxies, for notes/active-galaxies.html (spec 15.9-15.12).
 *
 * An Active Galactic Nucleus (AGN): a supermassive black hole, a hot
 * accretion disc of matter falling in, a ring (torus) of dusty gas round
 * it, and, in some, two jets along the spin axis.
 *
 * The viewing-angle model: the same kind of AGN can look like a blazar
 * (a jet pointing almost straight at us), a quasar (a very powerful,
 * usually very distant AGN seen past its dusty ring: its galaxy is
 * outshone) or a Seyfert galaxy (a less powerful, nearer AGN: we see the
 * spiral galaxy round its bright core). This "one model, different views"
 * idea is general knowledge, labelled a first draft on the page; so are the
 * angle limits and what each band shows.
 */
(function () {
  const BLAZAR_MAX_DEG = 15;

  const TYPES = [
    { id: 'seyfert', name: 'Seyfert galaxy', clue: 'a spiral galaxy, fairly near us, with an unusually bright, compact centre' },
    { id: 'quasar', name: 'Quasar', clue: 'an extremely luminous, very distant AGN that looks like a star (its galaxy is outshone)' },
    { id: 'blazar', name: 'Blazar', clue: 'an AGN with a jet pointing almost straight at us: very bright, and changing in brightness quickly' },
  ];

  /**
   * What the AGN looks like from a viewing angle (degrees between our line
   * of sight and the jet) and a power ('modest' or 'huge').
   */
  function classify(angleDeg, power) {
    if (angleDeg <= BLAZAR_MAX_DEG) return 'blazar';
    return power === 'huge' ? 'quasar' : 'seyfert';
  }

  /** Which part of the spectrum shows which part of an AGN (shortest wavelength last). */
  const BANDS = [
    { id: 'radio', name: 'Radio', shows: 'the jets and the giant clouds (lobes) at their ends', telescope: 'ground' },
    { id: 'infrared', name: 'Infrared', shows: 'the warm dusty ring round the disc', telescope: 'high, dry sites or space' },
    { id: 'visible', name: 'Visible light', shows: 'the accretion disc and the galaxy’s own stars', telescope: 'ground' },
    { id: 'ultraviolet', name: 'Ultraviolet', shows: 'the hottest parts of the accretion disc', telescope: 'space' },
    { id: 'xray', name: 'X-ray', shows: 'the hottest gas, close to the black hole', telescope: 'space' },
    { id: 'gamma', name: 'Gamma ray', shows: 'the jets, brightest when one points at us (blazars)', telescope: 'space' },
  ];

  function type(id) {
    return TYPES.find((t) => t.id === id);
  }

  function band(id) {
    return BANDS.find((b) => b.id === id);
  }

  const api = { BLAZAR_MAX_DEG, TYPES, BANDS, classify, type, band };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.ActiveGalaxies = api;
  }
})();
