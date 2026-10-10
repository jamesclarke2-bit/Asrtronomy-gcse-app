/**
 * Io's tidal-heating diagram: Io on an elliptical orbit around Jupiter,
 * drawn with a visibly flexed shape (stretched toward/away from Jupiter)
 * that grows at closest approach and shrinks at the far side of the
 * orbit. Reusable: first used by notes/solar-system-bodies.html, meant
 * to be reused as-is by the Topic 12 gravity page once it exists —
 * nothing here is specific to the host page, only the host canvas and
 * the (eccentricity, trueAnomalyRad) state it's told to draw.
 *
 * heatingFraction is deliberately qualitative, not a real tidal-force
 * law (that's beyond GCSE): it's linear in distance between the orbit's
 * own two extremes, 1 at periapsis (closest, most flexed) and 0 at
 * apoapsis (farthest, least), so it stays well-defined and bounded for
 * any eccentricity without claiming a formula this page doesn't teach.
 *
 * Io's real eccentricity is only about 0.004 — far too small to draw or
 * see flex at — so the host page's slider range is deliberately
 * exaggerated for visibility, the same way notes/geocentric-to-
 * heliocentric.js's Mars-ellipse diagram exaggerates Mars's. What keeps
 * Io's own eccentricity non-zero at all despite tidal forces constantly
 * trying to circularise it is its orbital resonance with Europa and
 * Ganymede (periods in a 1:2:4 ratio — see src/galileanMoons.js), not
 * modelled here (this diagram only draws one orbit), just explained in
 * the host page's own text.
 */
function makeTidalHeatingDiagram(OM) {
  const SEMI_MAJOR_AXIS = 1; // normalised; draw() alone maps this to pixels

  // Distance from Jupiter (the focus), in the same normalised units as
  // SEMI_MAJOR_AXIS, at a given true anomaly — periapsis (closest) at
  // trueAnomalyRad = 0, apoapsis (farthest) at trueAnomalyRad = PI.
  function distanceAt(trueAnomalyRad, eccentricity) {
    return OM.radiusAtTrueAnomaly(trueAnomalyRad, SEMI_MAJOR_AXIS, eccentricity);
  }

  function heatingFraction(trueAnomalyRad, eccentricity) {
    if (eccentricity <= 0) return 0;
    const distance = distanceAt(trueAnomalyRad, eccentricity);
    const peri = OM.perihelionDistance(SEMI_MAJOR_AXIS, eccentricity);
    const apo = OM.aphelionDistance(SEMI_MAJOR_AXIS, eccentricity);
    return (apo - distance) / (apo - peri);
  }

  function drawJupiter(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#d9a86c';
    ctx.fill();
    ctx.strokeStyle = '#9c6a34';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#6b4423';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Jupiter', x, y + 36);
  }

  // Io's own shape: a circle stretched into an ellipse along the
  // Jupiter-Io line, more stretched the more heat right now (the
  // "flexing" this diagram exists to show) — and squashed slightly on
  // the perpendicular axis, so it visibly changes shape, not just size.
  function drawIo(ctx, ioX, ioY, jupiterX, jupiterY, heat) {
    const baseRadius = 10;
    const stretch = 1 + heat * 0.6;
    const squash = 1 - heat * 0.25;
    const angleToJupiter = Math.atan2(jupiterY - ioY, jupiterX - ioX);

    ctx.save();
    ctx.translate(ioX, ioY);
    ctx.rotate(angleToJupiter);
    ctx.beginPath();
    ctx.ellipse(0, 0, baseRadius * stretch, baseRadius * squash, 0, 0, Math.PI * 2);
    ctx.fillStyle = heat > 0.66 ? '#c0392b' : heat > 0.33 ? '#d9823d' : '#d9b36c';
    ctx.fill();
    ctx.strokeStyle = '#7a2015';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#555';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Io', ioX, ioY - baseRadius * stretch - 9);
  }

  function draw(canvas, { eccentricity, trueAnomalyRad }) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const e = eccentricity;
    const a = Math.min(canvas.width, canvas.height) / 2 - 40;

    // Jupiter sits at one focus of the orbit, offset from the drawing's
    // own centre by a*e — the orbit is centred here (not on Jupiter) so
    // the whole ellipse stays on screen at any eccentricity.
    const jupiterX = cx - a * e;
    const jupiterY = cy;

    // Orbit path, traced focus-relative (the same technique notes/
    // geocentric-to-heliocentric.js's Mars-ellipse diagram uses), not
    // with canvas's own centre-based ellipse() primitive — which would
    // put periapsis at the wrong side once Jupiter is off-centre.
    ctx.beginPath();
    const steps = 180;
    for (let i = 0; i <= steps; i += 1) {
      const nu = (2 * Math.PI * i) / steps;
      const r = distanceAt(nu, e) * a;
      const x = jupiterX + r * Math.cos(nu);
      const y = jupiterY - r * Math.sin(nu);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#b7c3d1';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    drawJupiter(ctx, jupiterX, jupiterY);

    const r = distanceAt(trueAnomalyRad, e) * a;
    const ioX = jupiterX + r * Math.cos(trueAnomalyRad);
    const ioY = jupiterY - r * Math.sin(trueAnomalyRad);
    drawIo(ctx, ioX, ioY, jupiterX, jupiterY, heatingFraction(trueAnomalyRad, e));
  }

  return { distanceAt, heatingFraction, draw };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ...makeTidalHeatingDiagram(require('./orbitalMechanics')), makeTidalHeatingDiagram };
} else if (typeof window !== 'undefined') {
  window.TidalHeatingDiagram = { ...makeTidalHeatingDiagram(window.OrbitalMechanics), makeTidalHeatingDiagram };
}
