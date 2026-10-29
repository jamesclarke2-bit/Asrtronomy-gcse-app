/**
 * How much atmosphere a target's light has to pass through, depending
 * on its altitude above the horizon — used by notes/observing-techniques.html's
 * "What decides whether you can see it?" section (spec 6.20, u1.25).
 *
 * Models the atmosphere as a single flat layer of uniform thickness, so
 * the path length through it scales as 1 / sin(altitude): 1 at the
 * zenith (straight up), rising toward the horizon. This is the standard
 * airmass approximation — it's only approximate, and overstates the
 * true path length as altitude approaches 0 (a real, curved atmosphere
 * of finite extent caps the multiplier well below what a flat layer
 * predicts there).
 */
(function () {
  function pathLengthMultiplier(altitudeDeg) {
    const altitudeRad = (altitudeDeg * Math.PI) / 180;
    return 1 / Math.sin(altitudeRad);
  }

  const api = { pathLengthMultiplier };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.VisibilityFactors = api;
  }
})();
