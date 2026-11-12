/**
 * The Hertzsprung-Russell diagram for notes/hr-diagram.html: the two
 * linked y-axes (luminosity, Sun = 1, and absolute magnitude), the
 * temperature x-axis (hottest on the left, on a log scale), the main
 * sequence band, the five regions, the ten real stars, and reading a
 * main-sequence star's absolute magnitude off the band to find its
 * distance with the data sheet's M = m + 5 - 5 log d.
 *
 * Luminosity and absolute magnitude are tied by M = 4.8 - 2.5 log10 L,
 * which counts visible light: a very hot or very cool star gives out
 * much of its energy outside the visible band, so its total output is
 * higher than this axis shows (the page says so beside the star data).
 *
 * The main-sequence centre line and its 2-magnitude thickness are
 * approximate, drawn to match standard dwarf-star sequences; star
 * temperatures and types are the ones Spectra.REAL_STARS already uses on
 * notes/spectral-types.html.
 */
(function () {
  const isNode = typeof require !== 'undefined' && typeof module !== 'undefined';
  const Spectra = isNode ? require('./spectra') : window.Spectra;
  const Magnitude = isNode ? require('./magnitude') : window.Magnitude;
  const SpecData = isNode ? require('./specData') : window.SpecData;

  // The Sun's absolute magnitude, rounded as exam diagrams give it.
  const SUN_ABSOLUTE_MAGNITUDE = 4.8;
  const SUN_TEMPERATURE_K = SpecData.CONSTANTS.photosphereTemperatureK;

  // Axis ranges: temperature 40,000 K (left) to 2,400 K (right);
  // luminosity 10^6 (top) to 10^-6 (bottom) times the Sun's.
  const AXES = { tHotK: 40000, tCoolK: 2400, logLTop: 6, logLBottom: -6 };

  function magnitudeFromLuminosity(L) {
    return SUN_ABSOLUTE_MAGNITUDE - 2.5 * Math.log10(L);
  }

  function luminosityFromMagnitude(M) {
    return Math.pow(10, 0.4 * (SUN_ABSOLUTE_MAGNITUDE - M));
  }

  AXES.mTop = magnitudeFromLuminosity(Math.pow(10, AXES.logLTop));
  AXES.mBottom = magnitudeFromLuminosity(Math.pow(10, AXES.logLBottom));

  /** Maps temperature and absolute magnitude to plot coordinates and back. */
  function makePlot({ x0, x1, yTop, yBottom, mTop = AXES.mTop, mBottom = AXES.mBottom }) {
    const logHot = Math.log10(AXES.tHotK);
    const logCool = Math.log10(AXES.tCoolK);
    const xForT = (t) => x0 + ((logHot - Math.log10(t)) / (logHot - logCool)) * (x1 - x0);
    const tForX = (x) => Math.pow(10, logHot - ((x - x0) / (x1 - x0)) * (logHot - logCool));
    const yForM = (m) => yTop + ((m - mTop) / (mBottom - mTop)) * (yBottom - yTop);
    const mForY = (y) => mTop + ((y - yTop) / (yBottom - yTop)) * (mBottom - mTop);
    const yForL = (L) => yForM(magnitudeFromLuminosity(L));
    return { x0, x1, yTop, yBottom, mTop, mBottom, xForT, tForX, yForM, mForY, yForL };
  }

  // Centre of the main sequence: [temperature (K), absolute magnitude].
  const MAIN_SEQUENCE_CENTRE = [
    [40000, -5.0],
    [30000, -3.6],
    [20000, -1.8],
    [15000, -1.0],
    [12000, 0.0],
    [10000, 0.9],
    [8500, 1.7],
    [7500, 2.4],
    [6500, 3.4],
    [6000, 4.2],
    [5800, SUN_ABSOLUTE_MAGNITUDE],
    [5200, 6.0],
    [4400, 7.4],
    [3800, 9.0],
    [3500, 10.5],
    [3200, 12.2],
    [3000, 14.6],
    [2700, 17.0],
    [2400, 19.0],
  ];

  // The band is about 2 magnitudes thick: 1 magnitude either side.
  const MAIN_SEQUENCE_HALF_WIDTH = 1.0;

  /** Absolute magnitude at the centre of the main sequence at this temperature. */
  function mainSequenceMagnitude(temperatureK) {
    const pts = MAIN_SEQUENCE_CENTRE;
    const t = Math.min(pts[0][0], Math.max(pts[pts.length - 1][0], temperatureK));
    for (let i = 1; i < pts.length; i += 1) {
      const [tHot, mHot] = pts[i - 1];
      const [tCool, mCool] = pts[i];
      if (t <= tHot && t >= tCool) {
        const f = (Math.log10(tHot) - Math.log10(t)) / (Math.log10(tHot) - Math.log10(tCool));
        return mHot + f * (mCool - mHot);
      }
    }
    return pts[pts.length - 1][1];
  }

  /** The band's brightest (most negative), centre and faintest M at this temperature. */
  function mainSequenceRange(temperatureK) {
    const centre = mainSequenceMagnitude(temperatureK);
    return { bright: centre - MAIN_SEQUENCE_HALF_WIDTH, centre, faint: centre + MAIN_SEQUENCE_HALF_WIDTH };
  }

  // Regions other than the main sequence, as ellipses in (log T, M),
  // except the supergiants' band.
  const REGIONS = [
    {
      id: 'supergiants',
      name: 'supergiants',
      where: 'across the top: the most luminous stars, at every temperature',
      // A band across the top rather than an ellipse.
      shape: { kind: 'band', tHotK: 40000, tCoolK: 3000, mBright: -9.6, mFaint: -5.4 },
    },
    {
      id: 'blue-giants',
      name: 'blue giants',
      where: 'top left, above the main sequence: hot and very luminous',
      shape: { tCentreK: 17000, logHalfWidth: 0.25, mCentre: -4.2, mHalfHeight: 1.1 },
    },
    {
      id: 'red-giants',
      name: 'red giants',
      where: 'top right, above the main sequence: cool but luminous',
      shape: { tCentreK: 4200, logHalfWidth: 0.1, mCentre: -0.5, mHalfHeight: 2.0 },
    },
    {
      id: 'white-dwarfs',
      name: 'white dwarfs',
      where: 'bottom left, below the main sequence: hot but dim',
      shape: { tCentreK: 16000, logHalfWidth: 0.3, mCentre: 12.0, mHalfHeight: 2.0 },
    },
  ];

  const MAIN_SEQUENCE = {
    id: 'main-sequence',
    name: 'main sequence',
    where: 'a diagonal band from top left (hot and bright) to bottom right (cool and dim)',
  };

  function regionById(id) {
    return id === MAIN_SEQUENCE.id ? MAIN_SEQUENCE : REGIONS.find((r) => r.id === id);
  }

  /** Is (T, M) inside this region's ellipse, scaled by `grow` (1 = as drawn)? */
  function inRegion(id, temperatureK, M, grow = 1) {
    if (id === MAIN_SEQUENCE.id) {
      const centre = mainSequenceMagnitude(temperatureK);
      return Math.abs(M - centre) <= MAIN_SEQUENCE_HALF_WIDTH * grow;
    }
    const shape = regionById(id).shape;
    if (shape.kind === 'band') {
      const mid = (shape.mBright + shape.mFaint) / 2;
      const half = ((shape.mFaint - shape.mBright) / 2) * grow;
      return temperatureK <= shape.tHotK && temperatureK >= shape.tCoolK && Math.abs(M - mid) <= half;
    }
    const { tCentreK, logHalfWidth, mCentre, mHalfHeight } = shape;
    const dx = (Math.log10(temperatureK) - Math.log10(tCentreK)) / (logHalfWidth * grow);
    const dy = (M - mCentre) / (mHalfHeight * grow);
    return dx * dx + dy * dy <= 1;
  }

  /**
   * Feedback rules for a label placed on a blank sketch (generous, as a
   * marker would be): `id` is a region id or 'sun'.
   */
  function placementCorrect(id, temperatureK, M) {
    const ms = mainSequenceMagnitude(temperatureK);
    switch (id) {
      case 'main-sequence':
        return Math.abs(M - ms) <= 1.8 && temperatureK <= 32000 && temperatureK >= 2700;
      case 'sun':
        return Math.abs(M - ms) <= 1.8 && temperatureK >= 4500 && temperatureK <= 8000;
      case 'supergiants':
        return M <= -5.0;
      case 'blue-giants':
        return temperatureK >= 9000 && M > -6.5 && M <= ms - 1.0 && M <= -1.5;
      case 'red-giants':
        return temperatureK <= 5500 && M > -5.0 && M <= ms - 3.0;
      case 'white-dwarfs':
        return temperatureK >= 5500 && M >= ms + 4.0 && M >= 7.0;
      default:
        return false;
    }
  }

  // Absolute magnitudes (to 0.1) and groups for the ten plotted stars.
  // Temperatures and types for the first eight are Spectra.REAL_STARS'.
  const EXTRA = {
    Spica: { absoluteMagnitude: -3.5, group: 'blue-giants', description: 'blue giant' },
    Rigel: { absoluteMagnitude: -7.8, group: 'supergiants', description: 'blue supergiant' },
    Vega: { absoluteMagnitude: 0.6, group: 'main-sequence', description: 'main-sequence star' },
    Sirius: { absoluteMagnitude: 1.4, group: 'main-sequence', description: 'main-sequence star' },
    Procyon: { absoluteMagnitude: 2.7, group: 'main-sequence', description: 'main-sequence star' },
    'the Sun': { absoluteMagnitude: SUN_ABSOLUTE_MAGNITUDE, group: 'main-sequence', description: 'main-sequence star' },
    Arcturus: { absoluteMagnitude: -0.3, group: 'red-giants', description: 'red giant' },
    Betelgeuse: { absoluteMagnitude: -5.9, group: 'supergiants', description: 'red supergiant' },
  };

  const STARS = [
    ...Spectra.REAL_STARS.map((s) => ({ name: s.name, type: s.type, temperatureK: s.temperatureK, ...EXTRA[s.name] })),
    { name: 'Sirius B', type: 'white dwarf', temperatureK: 25000, absoluteMagnitude: 11.2, group: 'white-dwarfs', description: 'white dwarf' },
    { name: 'Proxima Centauri', type: 'M5.5', temperatureK: 3000, absoluteMagnitude: 15.5, group: 'main-sequence', description: 'red dwarf (main sequence)' },
  ].map((s) => ({ ...s, luminosity: luminosityFromMagnitude(s.absoluteMagnitude) }));

  // Main-sequence types offered for the distance tool, at temperatures
  // inside their own spectral class on notes/spectral-types.html.
  const DISTANCE_TYPES = [
    { type: 'B5', temperatureK: 15000 },
    { type: 'A0', temperatureK: 9600 },
    { type: 'F5', temperatureK: 6500 },
    { type: 'G2', temperatureK: SUN_TEMPERATURE_K },
    { type: 'K5', temperatureK: 4400 },
    { type: 'M2', temperatureK: 3500 },
  ];

  const round1 = (x) => Math.round(x * 10) / 10;

  /**
   * Distance to a main-sequence star of this temperature and apparent
   * magnitude m: M read off the band's centre (to 0.1) gives the best
   * estimate, and the band's two edges give the range. The uncertainty
   * is half the range.
   */
  function distanceFromMainSequence(temperatureK, apparentMagnitude) {
    const range = mainSequenceRange(temperatureK);
    const M = round1(range.centre);
    const bright = round1(range.bright);
    const faint = round1(range.faint);
    const distancePc = Magnitude.distanceFromModulus(apparentMagnitude, M);
    // A fainter M means the star must be closer to look as bright.
    const nearPc = Magnitude.distanceFromModulus(apparentMagnitude, faint);
    const farPc = Magnitude.distanceFromModulus(apparentMagnitude, bright);
    return {
      M,
      bright,
      faint,
      modulus: apparentMagnitude - M,
      logD: (apparentMagnitude - M + 5) / 5,
      distancePc,
      nearPc,
      farPc,
      rangePc: farPc - nearPc,
      uncertaintyPc: (farPc - nearPc) / 2,
    };
  }

  /** Formats a signed magnitude with its own sign: +4.8, -3.5 (true minus), 0.0. */
  function signed(x, dp = 1) {
    const v = Number(x.toFixed(dp));
    if (v === 0) return (0).toFixed(dp);
    return v > 0 ? `+${v.toFixed(dp)}` : `−${Math.abs(v).toFixed(dp)}`;
  }

  /** A luminosity for display: two significant figures, plain or with commas. */
  function formatLuminosity(L) {
    if (L >= 100) return Number(L.toPrecision(2)).toLocaleString('en-GB');
    if (L >= 1) return Number(L.toPrecision(2)).toString();
    return Number(L.toPrecision(2)).toString();
  }

  const api = {
    SUN_ABSOLUTE_MAGNITUDE,
    SUN_TEMPERATURE_K,
    AXES,
    MAIN_SEQUENCE,
    MAIN_SEQUENCE_CENTRE,
    MAIN_SEQUENCE_HALF_WIDTH,
    REGIONS,
    STARS,
    DISTANCE_TYPES,
    magnitudeFromLuminosity,
    luminosityFromMagnitude,
    makePlot,
    mainSequenceMagnitude,
    mainSequenceRange,
    regionById,
    inRegion,
    placementCorrect,
    distanceFromMainSequence,
    signed,
    formatLuminosity,
  };

  if (isNode && module.exports) {
    module.exports = api;
  } else {
    window.HRDiagram = api;
  }
})();
