/**
 * Drawing stars as seen through a telescope: each star is a blurred point
 * whose blur radius is the telescope's resolution (Rayleigh criterion,
 * from TelescopeModel), so two stars closer than that merge into one blob.
 * First written for notes/telescopes.html's double-star and star-cluster
 * views (Section 4, "Resolving power and light grasp"), and shared with
 * notes/binaries-and-clusters.html's eyepiece simulator.
 * Browser-only drawing; the blur-radius rule is plain maths.
 */
(function () {
  const TelescopeModel =
    typeof require !== 'undefined' && typeof module !== 'undefined' ? require('./telescopeModel') : window.TelescopeModel;

  // Blur radius in pixels: the resolution, capped so it never swamps the
  // whole view, and never smaller than a visible dot.
  function blurRadiusPx(resolutionArcsec, fieldArcsec, pxPerArcsec) {
    const cappedArcsec = Math.min(resolutionArcsec, fieldArcsec * 0.22);
    return Math.max(cappedArcsec * pxPerArcsec, 2.5);
  }

  /** One blurred star: bright centre fading to nothing at radiusPx. */
  function drawBlurredStar(ctx, x, y, radiusPx, alpha = 1, rgb = '255,255,255') {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radiusPx);
    gradient.addColorStop(0, `rgba(${rgb},${0.95 * alpha})`);
    gradient.addColorStop(0.3, `rgba(${rgb},${0.45 * alpha})`);
    gradient.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radiusPx, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * A small field of stars (positions in arcseconds from the centre), each
   * shown only once the aperture reaches its revealDiameterMm. Returns how
   * many are visible.
   */
  function drawStarView(canvas, stars, fieldArcsec, diameterMm, wavelengthNm) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#060a16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pxPerArcsec = canvas.width / fieldArcsec;
    const resolutionArcsec = TelescopeModel.resolutionArcsec(wavelengthNm, diameterMm);
    const radiusPx = blurRadiusPx(resolutionArcsec, fieldArcsec, pxPerArcsec);

    let visibleCount = 0;
    stars.forEach((star) => {
      if (diameterMm < star.revealDiameterMm) return;
      visibleCount += 1;
      const x = canvas.width / 2 + star.xArcsec * pxPerArcsec;
      const y = canvas.height / 2 + star.yArcsec * pxPerArcsec;
      drawBlurredStar(ctx, x, y, radiusPx);
    });

    return visibleCount;
  }

  const api = { blurRadiusPx, drawBlurredStar, drawStarView };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.StarView = api;
  }
})();
