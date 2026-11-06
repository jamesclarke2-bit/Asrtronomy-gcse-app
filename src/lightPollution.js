/**
 * notes/observing-techniques.html's "Light pollution and dark adaptation"
 * star field: how many stars a naked-eye observer can actually see,
 * given (1) how dark the site is and (2) how long their eyes have had
 * to dark-adapt (spec 6.6/6.19, u1.5/u1.22).
 *
 * Two independent, first-draft (general-knowledge, not spec-given)
 * models, combined into one "what can you see right now" figure:
 *
 *  - Site darkness (DARKNESS_SCALE 1-9, a dark-sky site to a city
 *    centre) sets a ceiling on limiting magnitude: the faintest star
 *    the site's own sky brightness could ever let you see, however
 *    long you've dark-adapted. Linearly interpolated between the two
 *    given endpoints (6.5 at the darkest, 3.0 in a city centre).
 *  - Dark adaptation (0-30 minutes) sets how close to that ceiling
 *    your eyes currently are: an unadapted eye (0 minutes, e.g. just
 *    stepped outside from a lit room) sees down to only about
 *    magnitude 3 whatever the site, rising smoothly to the site's full
 *    ceiling by about 30 minutes — fast at first, slower as it
 *    approaches the ceiling, the shape of a real dark-adaptation curve.
 *
 * approxVisibleStarCount turns a limiting magnitude into an
 * approximate whole-sky star count, calibrated (also first draft) at
 * the same two endpoints: about 9,000 stars visible down to magnitude
 * 6.5, about 250 down to magnitude 3 — close to the commonly-quoted
 * "roughly triples per magnitude" rule of thumb for naked-eye star
 * counts, derived here rather than hard-coded per magnitude.
 */
(function () {
  const DARKNESS_SCALE_MIN = 1;
  const DARKNESS_SCALE_MAX = 9;
  const LIMITING_MAGNITUDE_DARK_SITE = 6.5;
  const LIMITING_MAGNITUDE_CITY = 3.0;

  const STAR_COUNT_AT_DARK_SITE = 9000;
  const STAR_COUNT_AT_CITY = 250;

  const ADAPTATION_MIN_MINUTES = 0;
  const ADAPTATION_MAX_MINUTES = 30;
  // An unadapted eye's own limiting magnitude, whatever the site — a
  // city sky is already at this ceiling, so adaptation time makes no
  // visible difference there, which is itself a real, teachable point.
  const UNADAPTED_LIMITING_MAGNITUDE = LIMITING_MAGNITUDE_CITY;

  function clamp(value, lo, hi) {
    return Math.max(lo, Math.min(hi, value));
  }

  /** Limiting magnitude (faintest visible star) for a darkness-scale value (1 darkest, 9 brightest). */
  function limitingMagnitudeForScale(scale) {
    const clamped = clamp(scale, DARKNESS_SCALE_MIN, DARKNESS_SCALE_MAX);
    const t = (clamped - DARKNESS_SCALE_MIN) / (DARKNESS_SCALE_MAX - DARKNESS_SCALE_MIN);
    return LIMITING_MAGNITUDE_DARK_SITE + (LIMITING_MAGNITUDE_CITY - LIMITING_MAGNITUDE_DARK_SITE) * t;
  }

  // Exponential growth per magnitude, derived from the two calibration
  // points rather than assumed — solving n1 * g^(m2-m1) = n2 for g.
  const STAR_COUNT_GROWTH_PER_MAGNITUDE = Math.pow(
    STAR_COUNT_AT_DARK_SITE / STAR_COUNT_AT_CITY,
    1 / (LIMITING_MAGNITUDE_DARK_SITE - LIMITING_MAGNITUDE_CITY)
  );

  /** Approximate number of naked-eye stars visible down to a given limiting magnitude. */
  function approxVisibleStarCount(limitingMagnitude) {
    const exponent = limitingMagnitude - LIMITING_MAGNITUDE_CITY;
    return Math.round(STAR_COUNT_AT_CITY * Math.pow(STAR_COUNT_GROWTH_PER_MAGNITUDE, exponent));
  }

  // Fast at first, slower as it nears the ceiling (1 - (1-t)^2): about
  // 89% of the way there at 20 minutes, exactly there at 30 — matching
  // "rods take about 20 to 30 minutes" without pretending it's linear.
  function adaptationFraction(minutes) {
    const clamped = clamp(minutes, ADAPTATION_MIN_MINUTES, ADAPTATION_MAX_MINUTES);
    const t = clamped / ADAPTATION_MAX_MINUTES;
    return 1 - (1 - t) * (1 - t);
  }

  /** The limiting magnitude actually available right now, given site darkness and minutes dark-adapted. */
  function currentLimitingMagnitude(darknessScale, minutes) {
    const ceiling = limitingMagnitudeForScale(darknessScale);
    const unadapted = Math.min(UNADAPTED_LIMITING_MAGNITUDE, ceiling);
    return unadapted + (ceiling - unadapted) * adaptationFraction(minutes);
  }

  // --- A fixed, deterministic star catalog for the canvas illustration ---
  // A small seeded PRNG (mulberry32) rather than Math.random, so the
  // field is identical on every load and in every test run.
  function mulberry32(seed) {
    let a = seed;
    return function next() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const STAR_CATALOG_SIZE = 260;
  const STAR_CATALOG_SEED = 20261106;

  // Magnitudes skew faint (real skies have far more faint stars than
  // bright ones) — rand^(1/1.8) biases a uniform [0,1) draw toward 1,
  // i.e. toward LIMITING_MAGNITUDE_DARK_SITE (faint), before scaling
  // into the full [0.5, 6.5] range.
  function buildStarCatalog() {
    const rand = mulberry32(STAR_CATALOG_SEED);
    const stars = [];
    for (let i = 0; i < STAR_CATALOG_SIZE; i += 1) {
      const magnitude = 0.5 + Math.pow(rand(), 1 / 1.8) * (LIMITING_MAGNITUDE_DARK_SITE - 0.5);
      stars.push({ xFrac: rand(), yFrac: rand(), magnitude });
    }
    return stars;
  }

  const STAR_CATALOG = buildStarCatalog();

  const api = {
    DARKNESS_SCALE_MIN,
    DARKNESS_SCALE_MAX,
    LIMITING_MAGNITUDE_DARK_SITE,
    LIMITING_MAGNITUDE_CITY,
    ADAPTATION_MIN_MINUTES,
    ADAPTATION_MAX_MINUTES,
    UNADAPTED_LIMITING_MAGNITUDE,
    limitingMagnitudeForScale,
    approxVisibleStarCount,
    adaptationFraction,
    currentLimitingMagnitude,
    STAR_CATALOG,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.LightPollution = api;
  }
})();
