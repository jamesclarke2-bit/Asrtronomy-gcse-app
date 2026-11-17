/**
 * The Local Group and the larger structures beyond it, for
 * notes/local-group.html (spec 15.4, 15.5, 15.13).
 *
 * The LMC's and the Andromeda Galaxy's distances are not typed here: they
 * come from the Cepheids on the Variable stars page (VariableStars.CEPHEIDS
 * and cepheidDistance), so the two pages always agree (the LMC about
 * 50,000 pc). Light-years use the data sheet's 1 pc = 3.26 ly
 * (SpecData.CONSTANTS.parsecLightYears). The other distances, counts and
 * sizes are rounded general knowledge, labelled a first draft on the page.
 *
 * The map is top-down in parsecs, with the Milky Way at (0, 0) and the
 * Andromeda Galaxy along +x.
 */
(function () {
  const isNode = typeof require !== 'undefined' && typeof module !== 'undefined';
  const VariableStars = isNode ? require('./variableStars') : window.VariableStars;
  const SpecData = isNode ? require('./specData') : window.SpecData;

  const PC_TO_LY = SpecData.CONSTANTS.parsecLightYears;

  function cepheidPc(id) {
    const c = VariableStars.cepheidById(id);
    return VariableStars.cepheidDistance(c.periodDays, (c.brightest + c.faintest) / 2).distancePc;
  }

  /** Round to `sig` significant figures. */
  function roundSig(x, sig = 2) {
    if (x === 0) return 0;
    const p = 10 ** (Math.floor(Math.log10(Math.abs(x))) - sig + 1);
    return Math.round(x / p) * p;
  }

  const LMC_PC = roundSig(cepheidPc('lmc'), 1); // 50,000 pc, as on Variable stars.
  const M31_PC = roundSig(cepheidPc('andromeda'), 2); // 760,000 pc.

  /**
   * The galaxies marked on the map. `shape` says how each is drawn:
   * barred spiral, spiral or irregular. `pc` is the distance from the Milky
   * Way; `angleDeg` where it sits round the Milky Way on the map (for M33,
   * placed near M31 at its own distance from us). `fromCepheid` marks the
   * distances taken from the Variable stars page.
   */
  const MEMBERS = [
    { id: 'mw', name: 'Milky Way', shape: 'barred-spiral', pc: 0, angleDeg: 0, size: 'large' },
    { id: 'm31', name: 'Andromeda Galaxy (M31)', shape: 'spiral', pc: M31_PC, angleDeg: 0, size: 'largest', fromCepheid: true },
    { id: 'm33', name: 'Triangulum Galaxy (M33)', shape: 'spiral', pc: 850000, angleDeg: -14, size: 'medium' },
    { id: 'lmc', name: 'Large Magellanic Cloud (LMC)', shape: 'irregular', pc: LMC_PC, angleDeg: 190, size: 'small', fromCepheid: true },
    { id: 'smc', name: 'Small Magellanic Cloud (SMC)', shape: 'irregular', pc: 62000, angleDeg: 165, size: 'small' },
  ];

  const GROUP = {
    galaxies: 80, // "more than 50" (about 80 known), most of them dwarf galaxies
    acrossPc: 3000000, // about 3 million pc (about 10 million ly)
  };

  /**
   * The zoom-out levels for 15.13: each about ten times bigger than the
   * last (rounded), with what it holds.
   */
  const LEVELS = [
    { id: 'group', name: 'Our Local Group', acrossLy: 10e6, holds: 'more than 50 galaxies, most of them dwarfs' },
    { id: 'cluster', name: 'A galaxy cluster', acrossLy: 20e6, holds: 'hundreds to thousands of galaxies' },
    { id: 'supercluster', name: 'A supercluster', acrossLy: 300e6, holds: 'many groups and clusters' },
    { id: 'web', name: 'The cosmic web', acrossLy: 3e9, holds: 'superclusters strung along filaments, round huge empty voids' },
  ];

  function member(id) {
    return MEMBERS.find((m) => m.id === id);
  }

  function lightYears(pc) {
    return pc * PC_TO_LY;
  }

  /** Map position (pc) of a member, the Milky Way at the origin. */
  function position(m) {
    const a = (m.angleDeg * Math.PI) / 180;
    return { x: m.pc * Math.cos(a), y: m.pc * Math.sin(a) };
  }

  /** "about 50,000 pc (about 160,000 light-years)" */
  function distanceText(pc) {
    const ly = roundSig(lightYears(pc), 2);
    const lyText = ly >= 1e6 ? `${(ly / 1e6).toLocaleString('en-GB')} million` : ly.toLocaleString('en-GB');
    return `about ${roundSig(pc, 2).toLocaleString('en-GB')} pc (about ${lyText} light-years)`;
  }

  const api = { PC_TO_LY, LMC_PC, M31_PC, MEMBERS, GROUP, LEVELS, member, lightYears, position, distanceText, roundSig };
  if (isNode && module.exports) {
    module.exports = api;
  } else {
    window.LocalGroup = api;
  }
})();
