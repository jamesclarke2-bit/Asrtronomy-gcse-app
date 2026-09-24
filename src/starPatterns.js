/**
 * Star patterns for the naked-eye sky
 * -----------------------------------
 * Real positions (J2000 right ascension in hours, declination in
 * degrees) and apparent magnitudes for the stars in the constellations
 * and asterisms taught on notes/naked-eye-sky.html, and the past and
 * future pole stars on notes/measuring-the-sky.html, so every diagram
 * is drawn from the sky itself rather than by hand.
 *
 * Positions are J2000 values as catalogued in SIMBAD (Hipparcos
 * astrometry), rounded to the nearest arcminute; magnitudes are
 * V-band, to 0.01 mag. Variable stars (Betelgeuse, Gamma Cassiopeiae)
 * use a typical value, and double stars (Albireo, Meissa, Mizar,
 * Acrux) their combined naked-eye brightness.
 *
 * Wrapped in a function so its helpers don't leak into the shared
 * global scope of the page's other plain <script> tags.
 */
(function () {
  const RAD = Math.PI / 180;

  function ra(h, m, s) {
    return h + m / 60 + s / 3600;
  }

  function dec(sign, d, m) {
    return sign * (d + m / 60);
  }

  const STARS = {
    // Cassiopeia
    caph: { name: 'Caph', ra: ra(0, 9, 11), dec: dec(1, 59, 9), mag: 2.27 },
    schedar: { name: 'Schedar', ra: ra(0, 40, 30), dec: dec(1, 56, 32), mag: 2.24 },
    gammaCas: { name: 'Gamma Cas', ra: ra(0, 56, 43), dec: dec(1, 60, 43), mag: 2.15 },
    ruchbah: { name: 'Ruchbah', ra: ra(1, 25, 49), dec: dec(1, 60, 14), mag: 2.68 },
    segin: { name: 'Segin', ra: ra(1, 54, 24), dec: dec(1, 63, 40), mag: 3.37 },

    // Cygnus (and the Summer Triangle)
    deneb: { name: 'Deneb', ra: ra(20, 41, 26), dec: dec(1, 45, 17), mag: 1.25 },
    sadr: { name: 'Sadr', ra: ra(20, 22, 14), dec: dec(1, 40, 15), mag: 2.23 },
    albireo: { name: 'Albireo', ra: ra(19, 30, 43), dec: dec(1, 27, 58), mag: 3.05 },
    aljanah: { name: 'Aljanah', ra: ra(20, 46, 13), dec: dec(1, 33, 58), mag: 2.48 },
    deltaCyg: { name: 'Delta Cyg', ra: ra(19, 44, 58), dec: dec(1, 45, 8), mag: 2.87 },
    vega: { name: 'Vega', ra: ra(18, 36, 56), dec: dec(1, 38, 47), mag: 0.03 },
    altair: { name: 'Altair', ra: ra(19, 50, 47), dec: dec(1, 8, 52), mag: 0.77 },

    // Orion
    betelgeuse: { name: 'Betelgeuse', ra: ra(5, 55, 10), dec: dec(1, 7, 24), mag: 0.5 },
    rigel: { name: 'Rigel', ra: ra(5, 14, 32), dec: dec(-1, 8, 12), mag: 0.13 },
    bellatrix: { name: 'Bellatrix', ra: ra(5, 25, 8), dec: dec(1, 6, 21), mag: 1.64 },
    saiph: { name: 'Saiph', ra: ra(5, 47, 45), dec: dec(-1, 9, 40), mag: 2.06 },
    alnitak: { name: 'Alnitak', ra: ra(5, 40, 46), dec: dec(-1, 1, 57), mag: 1.77 },
    alnilam: { name: 'Alnilam', ra: ra(5, 36, 13), dec: dec(-1, 1, 12), mag: 1.69 },
    mintaka: { name: 'Mintaka', ra: ra(5, 32, 0), dec: dec(-1, 0, 18), mag: 2.23 },
    meissa: { name: 'Meissa', ra: ra(5, 35, 8), dec: dec(1, 9, 56), mag: 3.39 },

    // The Plough (in Ursa Major), and Polaris
    dubhe: { name: 'Dubhe', ra: ra(11, 3, 44), dec: dec(1, 61, 45), mag: 1.79 },
    merak: { name: 'Merak', ra: ra(11, 1, 50), dec: dec(1, 56, 23), mag: 2.37 },
    phecda: { name: 'Phecda', ra: ra(11, 53, 50), dec: dec(1, 53, 42), mag: 2.44 },
    megrez: { name: 'Megrez', ra: ra(12, 15, 26), dec: dec(1, 57, 2), mag: 3.31 },
    alioth: { name: 'Alioth', ra: ra(12, 54, 2), dec: dec(1, 55, 58), mag: 1.77 },
    mizar: { name: 'Mizar', ra: ra(13, 23, 55), dec: dec(1, 54, 56), mag: 2.23 },
    alkaid: { name: 'Alkaid', ra: ra(13, 47, 32), dec: dec(1, 49, 19), mag: 1.86 },
    polaris: { name: 'Polaris', ra: ra(2, 31, 49), dec: dec(1, 89, 16), mag: 1.98 },

    // The Southern Cross (Crux)
    acrux: { name: 'Acrux', ra: ra(12, 26, 36), dec: dec(-1, 63, 6), mag: 0.76 },
    mimosa: { name: 'Mimosa', ra: ra(12, 47, 43), dec: dec(-1, 59, 41), mag: 1.25 },
    gacrux: { name: 'Gacrux', ra: ra(12, 31, 10), dec: dec(-1, 57, 7), mag: 1.63 },
    imai: { name: 'Imai', ra: ra(12, 15, 9), dec: dec(-1, 58, 45), mag: 2.79 },
    epsilonCru: { name: 'Epsilon Cru', ra: ra(12, 21, 22), dec: dec(-1, 60, 24), mag: 3.58 },

    // Past and future pole stars, for precession on notes/measuring-the-sky.html
    // (Polaris, Deneb and Vega are listed above).
    thuban: { name: 'Thuban', ra: ra(14, 4, 23), dec: dec(1, 64, 23), mag: 3.67 },
    kochab: { name: 'Kochab', ra: ra(14, 50, 42), dec: dec(1, 74, 9), mag: 2.08 },
    errai: { name: 'Errai', ra: ra(23, 39, 21), dec: dec(1, 77, 38), mag: 3.21 },
    alderamin: { name: 'Alderamin', ra: ra(21, 18, 35), dec: dec(1, 62, 35), mag: 2.46 },

    // The Square of Pegasus (three corners in Pegasus, one in Andromeda)
    markab: { name: 'Markab', ra: ra(23, 4, 46), dec: dec(1, 15, 12), mag: 2.49 },
    scheat: { name: 'Scheat', ra: ra(23, 3, 46), dec: dec(1, 28, 5), mag: 2.42 },
    algenib: { name: 'Algenib', ra: ra(0, 13, 14), dec: dec(1, 15, 11), mag: 2.83 },
    alpheratz: { name: 'Alpheratz', ra: ra(0, 8, 23), dec: dec(1, 29, 5), mag: 2.06 },
  };

  // `kind` is what the pattern officially is: one of the IAU's 88
  // constellations, or an asterism (a recognisable pattern that is only
  // part of a constellation, or spans several). `labels` lists the stars
  // named on the diagram, each with the side its label sits on.
  const PATTERNS = [
    {
      id: 'plough',
      name: 'The Plough',
      kind: 'asterism',
      stars: ['dubhe', 'merak', 'phecda', 'megrez', 'alioth', 'mizar', 'alkaid'],
      lines: [['dubhe', 'merak'], ['merak', 'phecda'], ['phecda', 'megrez'], ['megrez', 'dubhe'], ['megrez', 'alioth'], ['alioth', 'mizar'], ['mizar', 'alkaid']],
      labels: [['dubhe', 'above'], ['merak', 'below'], ['alkaid', 'below']],
    },
    {
      id: 'cassiopeia',
      name: 'Cassiopeia',
      kind: 'constellation',
      stars: ['caph', 'schedar', 'gammaCas', 'ruchbah', 'segin'],
      lines: [['caph', 'schedar'], ['schedar', 'gammaCas'], ['gammaCas', 'ruchbah'], ['ruchbah', 'segin']],
      labels: [['caph', 'below'], ['schedar', 'below'], ['segin', 'above']],
    },
    {
      id: 'orion',
      name: 'Orion',
      kind: 'constellation',
      stars: ['betelgeuse', 'rigel', 'bellatrix', 'saiph', 'alnitak', 'alnilam', 'mintaka', 'meissa'],
      lines: [
        ['meissa', 'betelgeuse'], ['meissa', 'bellatrix'],
        ['betelgeuse', 'alnitak'], ['bellatrix', 'mintaka'],
        ['mintaka', 'alnilam'], ['alnilam', 'alnitak'],
        ['alnitak', 'saiph'], ['mintaka', 'rigel'],
      ],
      labels: [['betelgeuse', 'left'], ['bellatrix', 'right'], ['rigel', 'below'], ['saiph', 'below']],
    },
    {
      id: 'cygnus',
      name: 'Cygnus',
      kind: 'constellation',
      stars: ['deneb', 'sadr', 'albireo', 'aljanah', 'deltaCyg'],
      lines: [['deneb', 'sadr'], ['sadr', 'albireo'], ['deltaCyg', 'sadr'], ['sadr', 'aljanah']],
      labels: [['deneb', 'above'], ['albireo', 'below'], ['sadr', 'right']],
    },
    {
      id: 'summerTriangle',
      name: 'The Summer Triangle',
      kind: 'asterism',
      stars: ['vega', 'deneb', 'altair'],
      lines: [['vega', 'deneb'], ['deneb', 'altair'], ['altair', 'vega']],
      labels: [['vega', 'above'], ['deneb', 'above'], ['altair', 'below']],
    },
    {
      id: 'squareOfPegasus',
      name: 'The Square of Pegasus',
      kind: 'asterism',
      stars: ['markab', 'scheat', 'algenib', 'alpheratz'],
      lines: [['markab', 'scheat'], ['scheat', 'alpheratz'], ['alpheratz', 'algenib'], ['algenib', 'markab']],
      labels: [['markab', 'below'], ['scheat', 'above'], ['alpheratz', 'above'], ['algenib', 'below']],
    },
    {
      id: 'southernCross',
      name: 'The Southern Cross',
      kind: 'constellation',
      stars: ['acrux', 'mimosa', 'gacrux', 'imai', 'epsilonCru'],
      lines: [['gacrux', 'acrux'], ['imai', 'mimosa']],
      labels: [['acrux', 'below'], ['gacrux', 'above'], ['mimosa', 'left'], ['imai', 'right']],
    },
  ];

  function toVector(star) {
    const a = star.ra * 15 * RAD;
    const d = star.dec * RAD;
    return [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)];
  }

  // Angle between two stars on the sky, in degrees.
  function angularSeparation(a, b) {
    const u = toVector(a);
    const v = toVector(b);
    const dot = u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    return Math.acos(Math.min(1, Math.max(-1, dot))) / RAD;
  }

  // Gnomonic projection onto a flat chart centred on (ra0, dec0), as the
  // sky looks overhead or on a star chart: north up and east to the
  // LEFT. Returns x to the right and y upwards, in radians of tangent.
  function project(star, centre) {
    const da = (star.ra - centre.ra) * 15 * RAD;
    const d = star.dec * RAD;
    const d0 = centre.dec * RAD;
    const cosC = Math.sin(d0) * Math.sin(d) + Math.cos(d0) * Math.cos(d) * Math.cos(da);
    const xi = (Math.cos(d) * Math.sin(da)) / cosC;
    const eta = (Math.cos(d0) * Math.sin(d) - Math.sin(d0) * Math.cos(d) * Math.cos(da)) / cosC;
    return { x: -xi, y: eta };
  }

  // The middle of a group of stars, found by averaging their direction
  // vectors (so a group straddling RA 0h, like the Square, isn't split).
  function centreOf(stars) {
    const sum = stars.map(toVector).reduce((acc, v) => [acc[0] + v[0], acc[1] + v[1], acc[2] + v[2]], [0, 0, 0]);
    const r = Math.hypot(sum[0], sum[1], sum[2]);
    const decDeg = Math.asin(sum[2] / r) / RAD;
    const raDeg = ((Math.atan2(sum[1], sum[0]) / RAD) + 360) % 360;
    return { ra: raDeg / 15, dec: decDeg };
  }

  // The widest angle between any two stars of a pattern, in degrees.
  function spanOf(stars) {
    let widest = 0;
    stars.forEach((a, i) => stars.slice(i + 1).forEach((b) => {
      widest = Math.max(widest, angularSeparation(a, b));
    }));
    return widest;
  }

  // The most southerly latitude a star is ever above the horizon from
  // (+ north): anywhere north of 90° + dec it never rises. Ignores
  // atmospheric refraction, which lifts stars by about half a degree.
  function northernmostLatitudeToSee(star) {
    return 90 + star.dec;
  }

  // Follow the great circle from `from` through `to`, carrying on
  // `multiple` times their separation beyond `to`. Used to check the
  // pointer-star rules of thumb against the real sky.
  function extendBeyond(from, to, multiple) {
    const u = toVector(from);
    const v = toVector(to);
    const theta = angularSeparation(from, to) * RAD;
    const target = theta * (1 + multiple);
    // Unit vector along the great circle, perpendicular to u, towards v.
    const dot = u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    const w = [v[0] - dot * u[0], v[1] - dot * u[1], v[2] - dot * u[2]];
    const wl = Math.hypot(w[0], w[1], w[2]);
    const p = [0, 1, 2].map((i) => Math.cos(target) * u[i] + Math.sin(target) * (w[i] / wl));
    return {
      ra: (((Math.atan2(p[1], p[0]) / RAD) + 360) % 360) / 15,
      dec: Math.asin(p[2]) / RAD,
    };
  }

  const api = {
    STARS,
    PATTERNS,
    angularSeparation,
    project,
    centreOf,
    spanOf,
    northernmostLatitudeToSee,
    extendBeyond,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.StarPatterns = api;
  }
})();
