/**
 * Moon-orbits-Earth model and schematic diagram — shared by
 * sims/moon-phases.html and sims/sidereal-vs-synodic.html.
 *
 * The orbit model is a real Keplerian ellipse: eccentricity 0.0549 and
 * mean distance (semi-major axis) 384,400 km, giving perigee ~363,300 km
 * and apogee ~405,500 km. The Moon's distance comes from its TRUE
 * anomaly (its actual angle from perigee), found by solving Kepler's
 * equation from the mean anomaly — not from the uniform phase angle used
 * elsewhere, since the Moon moves faster near perigee and slower near
 * apogee. The mean anomaly itself is the standard (Meeus) formula;
 * test/moonOrbitPanel.test.js checks it against real, widely-published
 * perigee and apogee dates.
 *
 * Simplification worth knowing: the real orbit's shape wobbles under the
 * Sun's pull, so real perigees range from ~356,500 to ~370,400 km. This
 * model keeps the shape fixed, so every perigee here is ~363,300 km.
 *
 * Drawing: Earth sits at the centre, sunlight arrives from sunAngleDeg
 * (0 = screen right, increasing counterclockwise, same convention as
 * src/orbitPanel.js), and the Moon icon sits at moonAngleDeg, always
 * shaded half-lit on the side facing sunAngleDeg. Pass perigeeAngleDeg
 * to draw the orbit as an ellipse with Earth at one focus; leave it out
 * for a plain circle (sidereal-vs-synodic.html, where orbit shape isn't
 * the point).
 */
(function () {
  const SEMI_MAJOR_AXIS_KM = 384400;
  const ECCENTRICITY = 0.0549;
  const PERIGEE_KM = SEMI_MAJOR_AXIS_KM * (1 - ECCENTRICITY);
  const APOGEE_KM = SEMI_MAJOR_AXIS_KM * (1 + ECCENTRICITY);

  // Standard mean anomaly of the Moon (Meeus, Astronomical Algorithms),
  // in degrees, with T in Julian centuries since J2000.0.
  const MEAN_ANOMALY_AT_J2000_DEG = 134.9633964;
  const MEAN_ANOMALY_DEG_PER_CENTURY = 477198.8675055;
  const ANOMALISTIC_MONTH_DAYS = (360 / MEAN_ANOMALY_DEG_PER_CENTURY) * 36525;

  // "A few days" either side of perigee. At 3 days out, this model's Moon
  // is ~368,000 km away — close to the commonly used definition of a
  // supermoon as being within 90% of its closest approach.
  const SUPERMOON_WINDOW_DAYS = 3;

  // The real eccentricity is too small to see at this diagram's size
  // (perigee and apogee would differ by ~10 pixels), so the drawn ellipse
  // is exaggerated. Distances reported by the model are never affected.
  const VISUAL_EXAGGERATION = 3;

  function normalizeDeg(deg) {
    return ((deg % 360) + 360) % 360;
  }

  function meanAnomalyAt(date) {
    const julianDay = date.getTime() / 86400000 + 2440587.5;
    const T = (julianDay - 2451545.0) / 36525;
    return normalizeDeg(
      MEAN_ANOMALY_AT_J2000_DEG + MEAN_ANOMALY_DEG_PER_CENTURY * T + 0.0087414 * T * T
    );
  }

  // Kepler's equation, M = E - e sin E, solved for E by Newton's method.
  // With e this small it converges to machine precision in a few steps.
  function eccentricAnomalyRad(meanAnomalyDeg) {
    const M = (normalizeDeg(meanAnomalyDeg) * Math.PI) / 180;
    let E = M;
    for (let i = 0; i < 8; i++) {
      E -= (E - ECCENTRICITY * Math.sin(E) - M) / (1 - ECCENTRICITY * Math.cos(E));
    }
    return E;
  }

  function trueAnomalyFromMean(meanAnomalyDeg) {
    const E = eccentricAnomalyRad(meanAnomalyDeg);
    const nu = 2 * Math.atan2(
      Math.sqrt(1 + ECCENTRICITY) * Math.sin(E / 2),
      Math.sqrt(1 - ECCENTRICITY) * Math.cos(E / 2)
    );
    return normalizeDeg((nu * 180) / Math.PI);
  }

  // The polar equation of an ellipse measured from its focus (Earth).
  function distanceAtTrueAnomaly(trueAnomalyDeg, eccentricity = ECCENTRICITY, semiMajor = SEMI_MAJOR_AXIS_KM) {
    const nu = (trueAnomalyDeg * Math.PI) / 180;
    return (semiMajor * (1 - eccentricity * eccentricity)) / (1 + eccentricity * Math.cos(nu));
  }

  function getMoonOrbit(date) {
    const meanAnomalyDeg = meanAnomalyAt(date);
    const trueAnomalyDeg = trueAnomalyFromMean(meanAnomalyDeg);
    const signedMeanDeg = meanAnomalyDeg > 180 ? meanAnomalyDeg - 360 : meanAnomalyDeg;
    return {
      meanAnomalyDeg,
      trueAnomalyDeg,
      distanceKm: distanceAtTrueAnomaly(trueAnomalyDeg),
      // Negative = perigee still to come, positive = perigee already passed.
      daysFromPerigee: (signedMeanDeg / 360) * ANOMALISTIC_MONTH_DAYS,
    };
  }

  // --- Drawing -------------------------------------------------------

  const EARTH_COLOR = '#2a6bd6';
  const SUN_COLOR = '#f5a623';
  const MOON_LIT_COLOR = '#f5e8c8';
  const MOON_DARK_COLOR = '#3a3f4d';

  // A half-lit circle: bright on the side facing sunDirectionDeg, dark on
  // the other side. Achieved by clipping to a half-plane rotated to face
  // that direction, then filling the full circle underneath it.
  function drawMoonIcon(ctx, x, y, r, sunDirectionDeg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = MOON_DARK_COLOR;
    ctx.fill();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((-sunDirectionDeg * Math.PI) / 180);
    ctx.beginPath();
    ctx.rect(0, -(r + 2), r + 2, (r + 2) * 2);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = MOON_LIT_COLOR;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#20242e';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function pointAt(cx, cy, radius, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  }

  function drawApsisMarker(ctx, cx, cy, radius, angleDeg, label) {
    const dot = pointAt(cx, cy, radius, angleDeg);
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#8a97a5';
    ctx.fill();

    const text = pointAt(cx, cy, radius - 22, angleDeg);
    ctx.fillStyle = '#6b7684';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, text.x, text.y);
  }

  // Returns the diagram's geometry (centre, and the Sun marker's radius)
  // so a caller can add its own extra markers at a consistent scale —
  // e.g. sidereal-vs-synodic.html's fixed reference-star marker.
  function draw(canvas, { moonAngleDeg, sunAngleDeg, perigeeAngleDeg }) {
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const R = Math.min(cx, cy) - 55;
    const sunMarkerR = Math.min(cx, cy) - 20;
    const elliptical = typeof perigeeAngleDeg === 'number';

    // With an ellipse, scale it so apogee sits where the old circle was,
    // keeping the Moon clear of the Sun marker at every orientation.
    const visualE = elliptical ? ECCENTRICITY * VISUAL_EXAGGERATION : 0;
    const visualA = R / (1 + visualE);
    const orbitRadiusAt = (screenAngleDeg) =>
      elliptical ? distanceAtTrueAnomaly(screenAngleDeg - perigeeAngleDeg, visualE, visualA) : R;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textBaseline = 'alphabetic';

    const sunPoint = pointAt(cx, cy, sunMarkerR, sunAngleDeg);
    const rayDx = Math.cos((sunAngleDeg * Math.PI) / 180);
    const rayDy = -Math.sin((sunAngleDeg * Math.PI) / 180);
    const rayLen = sunMarkerR + 15;

    ctx.strokeStyle = '#f0d38a';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    [-30, -15, 0, 15, 30].forEach((offset) => {
      const perpX = -rayDy * offset;
      const perpY = rayDx * offset;
      ctx.beginPath();
      ctx.moveTo(cx + rayDx * rayLen + perpX, cy + rayDy * rayLen + perpY);
      ctx.lineTo(cx - rayDx * 15 + perpX, cy - rayDy * 15 + perpY);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(sunPoint.x, sunPoint.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = SUN_COLOR;
    ctx.fill();
    ctx.strokeStyle = '#c9820a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    for (let deg = 0; deg <= 360; deg += 3) {
      const p = pointAt(cx, cy, orbitRadiusAt(deg), deg);
      if (deg === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#b7c3d1';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    if (elliptical) {
      drawApsisMarker(ctx, cx, cy, orbitRadiusAt(perigeeAngleDeg), perigeeAngleDeg, 'Perigee');
      drawApsisMarker(ctx, cx, cy, orbitRadiusAt(perigeeAngleDeg + 180), perigeeAngleDeg + 180, 'Apogee');
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fillStyle = EARTH_COLOR;
    ctx.fill();
    ctx.strokeStyle = '#173d75';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const moonPoint = pointAt(cx, cy, orbitRadiusAt(moonAngleDeg), moonAngleDeg);
    drawMoonIcon(ctx, moonPoint.x, moonPoint.y, 11, sunAngleDeg);

    ctx.fillStyle = '#8a97a5';
    ctx.font = 'italic 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Not to scale', 8, canvas.height - 10);

    return { cx, cy, R: sunMarkerR };
  }

  const moonOrbitPanelApi = {
    SEMI_MAJOR_AXIS_KM,
    ECCENTRICITY,
    PERIGEE_KM,
    APOGEE_KM,
    ANOMALISTIC_MONTH_DAYS,
    SUPERMOON_WINDOW_DAYS,
    VISUAL_EXAGGERATION,
    meanAnomalyAt,
    trueAnomalyFromMean,
    distanceAtTrueAnomaly,
    getMoonOrbit,
    drawMoonIcon,
    draw,
    pointAt,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = moonOrbitPanelApi;
  } else if (typeof window !== 'undefined') {
    window.MoonOrbitPanel = moonOrbitPanelApi;
  }
})();
