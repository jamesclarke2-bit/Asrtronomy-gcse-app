/**
 * Star names and deep-sky catalogues, for notes/catalogues-and-star-names.html
 * (spec 14.1 and 14.2).
 *
 * - The Bayer system (14.2): a Greek letter, usually given in order of
 *   brightness (alpha the brightest), plus the Latin genitive ("of
 *   Orion") of the constellation, e.g. Alpha Orionis, α Ori.
 * - The other forms a star's name can take: its proper name, its
 *   Flamsteed number (numbered west to east across the constellation)
 *   and a catalogue number (the Henry Draper, HD, catalogue).
 * - A Messier and NGC catalogue extract (14.1) to look objects up in.
 *
 * Star positions and magnitudes for Orion come from StarPatterns
 * (src/starPatterns.js). Every name, number and magnitude here is
 * general knowledge, labelled a first draft on the page.
 */
(function () {
  const isNode = typeof require !== 'undefined' && typeof module !== 'undefined';
  const StarPatterns = isNode ? require('./starPatterns') : window.StarPatterns;

  const GREEK = [
    ['alpha', 'α'], ['beta', 'β'], ['gamma', 'γ'], ['delta', 'δ'], ['epsilon', 'ε'], ['zeta', 'ζ'],
    ['eta', 'η'], ['theta', 'θ'], ['iota', 'ι'], ['kappa', 'κ'], ['lambda', 'λ'], ['mu', 'μ'],
    ['nu', 'ν'], ['xi', 'ξ'], ['omicron', 'ο'], ['pi', 'π'], ['rho', 'ρ'], ['sigma', 'σ'],
    ['tau', 'τ'], ['upsilon', 'υ'], ['phi', 'φ'], ['chi', 'χ'], ['psi', 'ψ'], ['omega', 'ω'],
  ].map(([name, symbol], k) => ({ name: name[0].toUpperCase() + name.slice(1), symbol, order: k + 1 }));

  // Constellation, its Latin genitive ("of ...") and its three-letter abbreviation.
  const CONSTELLATIONS = [
    { name: 'Orion', genitive: 'Orionis', abbr: 'Ori' },
    { name: 'Canis Major', genitive: 'Canis Majoris', abbr: 'CMa' },
    { name: 'Lyra', genitive: 'Lyrae', abbr: 'Lyr' },
    { name: 'Cygnus', genitive: 'Cygni', abbr: 'Cyg' },
    { name: 'Perseus', genitive: 'Persei', abbr: 'Per' },
    { name: 'Taurus', genitive: 'Tauri', abbr: 'Tau' },
    { name: 'Ursa Major', genitive: 'Ursae Majoris', abbr: 'UMa' },
    { name: 'Cassiopeia', genitive: 'Cassiopeiae', abbr: 'Cas' },
    { name: 'Centaurus', genitive: 'Centauri', abbr: 'Cen' },
    { name: 'Hercules', genitive: 'Herculis', abbr: 'Her' },
    { name: 'Andromeda', genitive: 'Andromedae', abbr: 'And' },
    { name: 'Cancer', genitive: 'Cancri', abbr: 'Cnc' },
  ];

  // Orion's named stars: Bayer letter, Flamsteed number and Henry Draper (HD) number.
  const ORION = [
    { key: 'betelgeuse', bayer: 'Alpha', flamsteed: 58, hd: 39801 },
    { key: 'rigel', bayer: 'Beta', flamsteed: 19, hd: 34085 },
    { key: 'bellatrix', bayer: 'Gamma', flamsteed: 24, hd: 35468 },
    { key: 'mintaka', bayer: 'Delta', flamsteed: 34, hd: 36486 },
    { key: 'alnilam', bayer: 'Epsilon', flamsteed: 46, hd: 37128 },
    { key: 'alnitak', bayer: 'Zeta', flamsteed: 50, hd: 37742 },
    { key: 'saiph', bayer: 'Kappa', flamsteed: 53, hd: 38771 },
    { key: 'meissa', bayer: 'Lambda', flamsteed: 39, hd: 36861 },
  ].map((s) => ({ ...s, ...StarPatterns.STARS[s.key] }));

  function greek(name) {
    const g = GREEK.find((x) => x.name.toLowerCase() === String(name).toLowerCase() || x.symbol === name);
    if (!g) throw new Error(`No Greek letter ${name}`);
    return g;
  }

  function constellation(nameOrGenitiveOrAbbr) {
    const c = CONSTELLATIONS.find((x) => [x.name, x.genitive, x.abbr].includes(nameOrGenitiveOrAbbr));
    if (!c) throw new Error(`No constellation ${nameOrGenitiveOrAbbr}`);
    return c;
  }

  /** A Bayer name in full ("Alpha Orionis"), with the symbol ("α Orionis") or short ("α Ori"). */
  function bayerName(letter, constellationName, form = 'full') {
    const g = greek(letter);
    const c = constellation(constellationName);
    if (form === 'symbol') return `${g.symbol} ${c.genitive}`;
    if (form === 'short') return `${g.symbol} ${c.abbr}`;
    return `${g.name} ${c.genitive}`;
  }

  /**
   * Decode a Bayer name such as "Beta Persei", "β Persei" or "β Per": the
   * constellation, and the brightness rank its letter usually means.
   */
  function decode(name) {
    const [first, ...rest] = String(name).trim().split(/\s+/);
    const g = greek(first);
    const c = constellation(rest.join(' '));
    return { letter: g, constellation: c.name, usualRank: g.order };
  }

  /** "1st", "2nd", "3rd", "4th"... */
  function ordinal(n) {
    const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
    return `${n}${s}`;
  }

  /** Each Orion star's names, with its brightness rank among these eight (1 = brightest). */
  function orionStars() {
    const byBrightness = [...ORION].sort((a, b) => a.mag - b.mag);
    return ORION.map((s) => ({
      ...s,
      proper: s.name,
      bayerFull: bayerName(s.bayer, 'Orion', 'full'),
      bayerShort: bayerName(s.bayer, 'Orion', 'short'),
      flamsteedName: `${s.flamsteed} Orionis`,
      hdName: `HD ${s.hd}`,
      letterOrder: greek(s.bayer).order,
      brightnessRank: byBrightness.indexOf(s) + 1,
    }));
  }

  // A Messier and NGC catalogue extract. Magnitudes for M13, M31 and M42
  // match the ones notes/binaries-and-clusters.html uses (a test checks).
  const DEEP_SKY = [
    { messier: 1, ngc: 1952, name: 'Crab Nebula', type: 'supernova remnant', constellation: 'Taurus', mag: 8.4 },
    { messier: 13, ngc: 6205, name: 'Hercules Globular Cluster', type: 'globular cluster', constellation: 'Hercules', mag: 5.8 },
    { messier: 31, ngc: 224, name: 'Andromeda Galaxy', type: 'spiral galaxy', constellation: 'Andromeda', mag: 3.4 },
    { messier: 42, ngc: 1976, name: 'Orion Nebula', type: 'nebula', constellation: 'Orion', mag: 4.0 },
    { messier: 44, ngc: 2632, name: 'Beehive Cluster', type: 'open cluster', constellation: 'Cancer', mag: 3.7 },
    { messier: 45, ngc: null, name: 'Pleiades', type: 'open cluster', constellation: 'Taurus', mag: 1.6 },
    { messier: 57, ngc: 6720, name: 'Ring Nebula', type: 'planetary nebula', constellation: 'Lyra', mag: 8.8 },
    { messier: 81, ngc: 3031, name: 'Bode’s Galaxy', type: 'spiral galaxy', constellation: 'Ursa Major', mag: 6.9 },
    { messier: null, ngc: 869, name: 'Double Cluster (western half)', type: 'open cluster', constellation: 'Perseus', mag: 5.3 },
  ].map((o) => ({ ...o, id: o.messier ? `m${o.messier}` : `ngc${o.ngc}`, label: o.messier ? `M${o.messier}` : `NGC ${o.ngc}` }));

  const CATALOGUES = {
    messier: { name: 'Messier catalogue', count: 110 },
    ngc: { name: 'New General Catalogue (NGC)', count: 7840, published: 1888 },
  };

  /** Look an object up by "M42", "NGC 1976" or its name. */
  function lookUp(query) {
    const q = String(query).replace(/\s+/g, '').toLowerCase();
    return DEEP_SKY.find((o) => (o.messier && `m${o.messier}` === q) || (o.ngc && `ngc${o.ngc}` === q) || o.name.replace(/\s+/g, '').toLowerCase() === q);
  }

  /** One extract row as text, e.g. "M42 = NGC 1976: Orion Nebula, nebula, Orion, magnitude 4.0". */
  function rowText(o) {
    const ids = [o.messier ? `M${o.messier}` : null, o.ngc ? `NGC ${o.ngc}` : null].filter(Boolean).join(' = ');
    return `${ids}: ${o.name}, ${o.type}, in ${o.constellation}, magnitude ${o.mag.toFixed(1)}`;
  }

  const api = {
    GREEK,
    CONSTELLATIONS,
    ORION,
    DEEP_SKY,
    CATALOGUES,
    greek,
    constellation,
    bayerName,
    decode,
    ordinal,
    orionStars,
    lookUp,
    rowText,
  };
  if (isNode && module.exports) {
    module.exports = api;
  } else {
    window.StarNames = api;
  }
})();
