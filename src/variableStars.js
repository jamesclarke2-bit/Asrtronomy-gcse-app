/**
 * Variable stars and Cepheid distances, for notes/variable-stars.html.
 *
 * Light curves are smooth teaching models, shaped to match each star's
 * period, brightness range and rise/fall shape; the nova and supernova
 * are generic one-off outbursts, not particular events.
 *
 * Period-luminosity relation for classical Cepheids, V band:
 *   M = -2.43 log10(P) - 1.62   (P in days)
 * This is Benedict et al. (2007), Astronomical Journal 133, 1810, from
 * Hubble Space Telescope parallaxes of ten Galactic Cepheids, there
 * written M_V = -2.43 (log P - 1) - 4.05; expanding gives the form above.
 *
 * Distances use the data sheet's distance modulus, M = m + 5 - 5 log d,
 * through Magnitude (src/magnitude.js), exactly as notes/magnitude.html.
 */
(function () {
  const isNode = typeof require !== 'undefined' && typeof module !== 'undefined';
  const Magnitude = isNode ? require('./magnitude') : window.Magnitude;

  // ---- Light-curve shapes ---------------------------------------------

  const smooth = (x) => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, x)))) / 2;

  /**
   * A pulsating star's brightness, 1 at maximum and 0 at minimum, at
   * phase 0-1 measured from maximum: a fall lasting (1 - riseFraction) of
   * the cycle, then a rise lasting riseFraction.
   */
  function pulsation(phase, riseFraction) {
    const p = ((phase % 1) + 1) % 1;
    const fall = 1 - riseFraction;
    return p < fall ? 1 - smooth(p / fall) : smooth((p - fall) / riseFraction);
  }

  /** An eclipse dip of depth (magnitudes) and half-width w (phase), centred on phase c. */
  function dip(phase, c, depth, w) {
    let d = Math.abs((((phase - c) % 1) + 1.5) % 1 - 0.5);
    if (d >= w) return 0;
    return depth * Math.pow(Math.cos((Math.PI / 2) * (d / w)), 2);
  }

  // ---- The six example light curves ------------------------------------

  const GALLERY = [
    {
      id: 'rr-lyrae',
      spec: '13.14a',
      kind: 'short period',
      name: 'RR Lyrae',
      periodDays: 0.567,
      periodText: 'about 0.57',
      brightest: 7.1,
      faintest: 8.1,
      riseFraction: 0.15,
      spanDays: 1.5,
      facts: [
        'Short period: about 0.57 days (13.6 hours).',
        'Varies by about 1 magnitude, from about 7.1 to 8.1.',
        'A pulsating star: a quick rise, then a slower fall.',
      ],
    },
    {
      id: 'mira',
      spec: '13.14a',
      kind: 'long period',
      name: 'Mira',
      periodDays: 332,
      periodText: 'about 330',
      rangeText: 'about 3.5 to 9',
      brightest: 3.5,
      faintest: 9.0,
      riseFraction: 0.45,
      spanDays: 1000,
      facts: [
        'Long period: about 330 days.',
        'Changes by several magnitudes, typically from about 3.5 to 9: well over 100 times in brightness.',
        'A pulsating red giant.',
      ],
    },
    {
      id: 'algol',
      spec: '13.14b',
      kind: 'eclipsing binary',
      name: 'Algol',
      periodDays: 2.87,
      periodText: 'about 2.9',
      brightest: 2.1,
      faintest: 3.4,
      primaryHalfWidth: 0.073,
      secondaryDepth: 0.06,
      spanDays: 8,
      facts: [
        'Period: about 2.9 days.',
        'Flat for most of the time, with a sharp dip from about 2.1 to 3.4 lasting about 10 hours, and a much smaller dip halfway between.',
        'Two stars orbiting each other, seen nearly edge-on.',
      ],
    },
    {
      id: 'delta-cephei',
      spec: '13.14c',
      kind: 'Cepheid',
      name: 'Delta Cephei',
      periodDays: 5.37,
      periodText: 'about 5.4',
      brightest: 3.5,
      faintest: 4.4,
      riseFraction: 0.3,
      spanDays: 16,
      facts: [
        'Period: about 5.4 days.',
        'Varies from about 3.5 to 4.4: a quick rise (about 1.6 days), then a slower fall (about 3.8 days).',
        'A pulsating yellow supergiant: the star the Cepheids are named after.',
      ],
    },
    {
      id: 'nova',
      spec: '13.14d',
      kind: 'nova',
      name: 'A nova',
      outburst: { startDay: 10, riseDays: 2, quiet: 15, peak: 5, fadeDays: 60 },
      rangeText: 'rises by about 10 in a day or two',
      spanDays: 200,
      facts: [
        'A one-off outburst, not a regular cycle.',
        'A sudden rise of about 10 magnitudes (10,000 times brighter) in a day or two, then a fade over weeks to months.',
        'It happens on a white dwarf in a close binary: the white dwarf pulls gas from its companion, and the gas builds up on its surface until it explodes.',
      ],
    },
    {
      id: 'supernova',
      spec: '13.14d',
      kind: 'supernova',
      name: 'A supernova',
      outburst: { startDay: 20, riseDays: 18, quiet: 22, peak: 11.5, galaxy: 12.0, fadeFast: 3, fastDays: 30, fadeSlowPerDay: 0.015 },
      rangeText: 'a huge rise: briefly brighter than its whole galaxy',
      spanDays: 300,
      facts: [
        'A one-off explosion that destroys or transforms the star, not a regular cycle.',
        'A huge rise over two to three weeks, then a fade over months.',
        'For a few weeks it can outshine its whole galaxy of billions of stars.',
      ],
    },
  ];

  function galleryById(id) {
    return GALLERY.find((s) => s.id === id);
  }

  /** Apparent magnitude of a gallery star (or Cepheid) at time t, in days. */
  function magnitudeAt(star, t) {
    if (star.outburst) return outburstMagnitude(star.outburst, t);
    const phase = ((t / star.periodDays) % 1 + 1) % 1;
    const amp = star.faintest - star.brightest;
    if (star.primaryHalfWidth) {
      return star.brightest + dip(phase, 0.25, amp, star.primaryHalfWidth) + dip(phase, 0.75, star.secondaryDepth, star.primaryHalfWidth);
    }
    const phase0 = star.phaseOffset || 0;
    return star.brightest + amp * (1 - pulsation(phase - phase0, star.riseFraction));
  }

  function outburstMagnitude(o, t) {
    if (t <= o.startDay) return o.quiet;
    const peakDay = o.startDay + o.riseDays;
    if (t <= peakDay) return o.quiet - (o.quiet - o.peak) * smooth((t - o.startDay) / o.riseDays);
    const since = t - peakDay;
    if (o.fadeDays) return o.peak + (o.quiet - 1 - o.peak) * (1 - Math.exp(-since / o.fadeDays));
    if (since <= o.fastDays) return o.peak + o.fadeFast * smooth(since / o.fastDays);
    return o.peak + o.fadeFast + o.fadeSlowPerDay * (since - o.fastDays);
  }

  /** Times of maximum brightness of a periodic star between t0 and t1. */
  function maximaBetween(star, t0, t1) {
    const offset = (star.phaseOffset || 0) * star.periodDays;
    const out = [];
    for (let k = Math.ceil((t0 - offset) / star.periodDays); offset + k * star.periodDays <= t1; k += 1) out.push(offset + k * star.periodDays);
    return out;
  }

  // ---- Cepheid distances -------------------------------------------------

  const PL = { slope: -2.43, intercept: -1.62 };
  // How closely M can be read off the period-luminosity graph: either way.
  const PL_READING_HALF_WIDTH = 0.2;
  // How closely a time can be read off a light curve, in days, at each end.
  const TIME_READING_DAYS = 0.25;

  function absoluteMagnitudeFromPeriod(periodDays) {
    return PL.slope * Math.log10(periodDays) + PL.intercept;
  }

  /** M as read off the graph: to the nearest 0.1 (float noise removed first). */
  function readAbsoluteMagnitude(periodDays) {
    const exact = Number(absoluteMagnitudeFromPeriod(periodDays).toFixed(3));
    return Math.round(exact * 10) / 10;
  }

  /** The period from timing n whole cycles between t1 and t2, with its percentage uncertainty. */
  function periodFromTiming(t1, t2, cycles) {
    const span = Math.abs(t2 - t1);
    const period = span / cycles;
    // Each end is read to TIME_READING_DAYS, so the span is uncertain by twice that.
    const uncertaintyDays = (2 * TIME_READING_DAYS) / cycles;
    return { span, period, uncertaintyDays, percent: span > 0 ? ((2 * TIME_READING_DAYS) / span) * 100 : Infinity };
  }

  /** Average apparent magnitude: halfway between brightest and faintest. */
  function averageMagnitude(brightest, faintest) {
    return (brightest + faintest) / 2;
  }

  /**
   * A Cepheid's distance: M read off the P-L graph (with its reading
   * range), then the distance modulus. The uncertainty is half the range.
   */
  function cepheidDistance(periodDays, m) {
    const M = readAbsoluteMagnitude(periodDays);
    const bright = Math.round((M - PL_READING_HALF_WIDTH) * 10) / 10;
    const faint = Math.round((M + PL_READING_HALF_WIDTH) * 10) / 10;
    const distancePc = Magnitude.distanceFromModulus(m, M);
    const nearPc = Magnitude.distanceFromModulus(m, faint);
    const farPc = Magnitude.distanceFromModulus(m, bright);
    return {
      M,
      bright,
      faint,
      modulus: m - M,
      logD: (m - M + 5) / 5,
      distancePc,
      nearPc,
      farPc,
      rangePc: farPc - nearPc,
      uncertaintyPc: (farPc - nearPc) / 2,
    };
  }

  // Cepheids for the distance interactive. Delta Cephei is real; the other
  // two are simulated stars with the period and brightness a Cepheid
  // would have at the distance of the LMC and of the Andromeda Galaxy.
  const CEPHEIDS = [
    { id: 'lmc', name: 'A Cepheid in the Large Magellanic Cloud', periodDays: 10, brightest: 14.0, faintest: 15.0, riseFraction: 0.3, phaseOffset: 0.18, spanDays: 63 },
    { id: 'delta-cephei', name: 'Delta Cephei, in our Galaxy', periodDays: 5.37, brightest: 3.5, faintest: 4.4, riseFraction: 0.3, phaseOffset: 0.3, spanDays: 34 },
    { id: 'andromeda', name: 'A Cepheid in the Andromeda Galaxy', periodDays: 30, brightest: 18.7, faintest: 19.7, riseFraction: 0.3, phaseOffset: 0.1, spanDays: 190 },
  ];

  function cepheidById(id) {
    return CEPHEIDS.find((c) => c.id === id);
  }

  /** Signed magnitude with its own sign and a true minus: +14.5, -4.0. */
  function signed(x, dp = 1) {
    const v = Number(x.toFixed(dp));
    if (v === 0) return (0).toFixed(dp);
    return v > 0 ? `+${v.toFixed(dp)}` : `−${Math.abs(v).toFixed(dp)}`;
  }

  const api = {
    pulsation,
    GALLERY,
    galleryById,
    magnitudeAt,
    maximaBetween,
    PL,
    PL_READING_HALF_WIDTH,
    TIME_READING_DAYS,
    absoluteMagnitudeFromPeriod,
    readAbsoluteMagnitude,
    periodFromTiming,
    averageMagnitude,
    cepheidDistance,
    CEPHEIDS,
    cepheidById,
    signed,
  };

  if (isNode && module.exports) {
    module.exports = api;
  } else {
    window.VariableStars = api;
  }
})();
