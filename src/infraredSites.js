/**
 * Infrared telescopes and high-altitude sites, for
 * notes/infrared-telescopes.html.
 *
 * A simple teaching model, not a measured atmosphere: the share of the
 * atmosphere's water vapour still above a telescope halves roughly every
 * 1.4 km up (a scale height of 2 km), and the infrared that water vapour
 * absorbs gets through as exp(-3 x that share), so about 5% at sea level
 * and most of it on a high mountain. The page labels the model and its
 * numbers as a first draft.
 *
 * Also here: a star's image through turbulent air, as a sharp point that
 * spreads into a larger, broken-up blob as the turbulence grows.
 */
(function () {
  const WATER_VAPOUR_SCALE_HEIGHT_KM = 2;
  const SEA_LEVEL_ABSORPTION = 3;
  const ALTITUDE_RANGE_KM = { min: 0, max: 5 };

  /** Share (0-1) of the atmosphere's water vapour still above this height. */
  function waterVapourAbove(altitudeKm) {
    return Math.exp(-altitudeKm / WATER_VAPOUR_SCALE_HEIGHT_KM);
  }

  /** Share (0-1) of the infrared that water vapour absorbs still getting through. */
  function infraredThrough(altitudeKm) {
    return Math.exp(-SEA_LEVEL_ABSORPTION * waterVapourAbove(altitudeKm));
  }

  /** Example sites, heights in km above sea level. */
  const SITES = [
    { id: 'sea-level', name: 'Sea level', altitudeKm: 0 },
    { id: 'mauna-kea', name: 'Mauna Kea, Hawaii', altitudeKm: 4.2 },
    { id: 'chajnantor', name: 'Chajnantor plateau, Chile', altitudeKm: 5.0 },
  ];

  function site(id) {
    return SITES.find((s) => s.id === id);
  }

  // ---- A star seen through turbulent air ------------------------------

  const TURBULENCE_RANGE = { min: 0, max: 10 };
  const SHARP_RADIUS = 5;

  function seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  /**
   * A star's image at this turbulence (0 = above the atmosphere, 10 = very
   * turbulent air): its overall radius (in the page's drawing units) and
   * the bright speckles it breaks into. At 0 it is one sharp point; the
   * image grows and breaks up as the turbulence grows. `frame` changes the
   * speckles' positions, for twinkling.
   */
  function starImage(turbulence, frame = 0) {
    const t = Math.max(TURBULENCE_RANGE.min, Math.min(TURBULENCE_RANGE.max, turbulence));
    const radius = SHARP_RADIUS + 6 * t;
    if (t === 0) return { radius, speckles: [{ dx: 0, dy: 0, r: SHARP_RADIUS }] };
    const rand = seeded(1 + Math.round(t * 10) * 97 + frame * 13);
    const count = 2 + Math.round(t * 1.5);
    const speckles = [];
    for (let k = 0; k < count; k += 1) {
      const a = rand() * 2 * Math.PI;
      const d = Math.sqrt(rand()) * (radius - SHARP_RADIUS);
      speckles.push({ dx: d * Math.cos(a), dy: d * Math.sin(a), r: SHARP_RADIUS * (0.6 + 0.6 * rand()) });
    }
    return { radius, speckles };
  }

  const api = {
    WATER_VAPOUR_SCALE_HEIGHT_KM,
    SEA_LEVEL_ABSORPTION,
    ALTITUDE_RANGE_KM,
    SITES,
    TURBULENCE_RANGE,
    SHARP_RADIUS,
    waterVapourAbove,
    infraredThrough,
    site,
    starImage,
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.InfraredSites = api;
  }
})();
