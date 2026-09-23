/**
 * Moon-orbits-Earth schematic diagram — shared by sims/moon-phases.html
 * and sims/sidereal-vs-synodic.html, so both draw the exact same
 * component from one place. Earth sits at the centre, sunlight arrives
 * from sunAngleDeg (0 = screen right, increasing counterclockwise, same
 * convention as src/orbitPanel.js), and the Moon icon sits at
 * moonAngleDeg on its orbit, always shaded half-lit on the side facing
 * sunAngleDeg — a real geometric fact, not a simplification, since the
 * Sun is far enough away that its rays arrive effectively parallel
 * wherever the Moon is on its orbit.
 *
 * moon-phases.html always passes sunAngleDeg = 0 (a fixed snapshot, one
 * date at a time). sidereal-vs-synodic.html passes a slowly-rotating
 * sunAngleDeg, since over the ~30 days it animates, Earth's own orbital
 * motion measurably shifts the Sun's true direction against the fixed
 * stars — exactly the effect that page exists to show.
 *
 * Browser-only UI component (draws to a canvas), so — like orbitPanel.js
 * — there's no Node/module.exports path.
 */
(function () {
  const EARTH_COLOR = '#2a6bd6';
  const SUN_COLOR = '#f5a623';
  const MOON_LIT_COLOR = '#f5e8c8';
  const MOON_DARK_COLOR = '#3a3f4d';

  // A half-lit circle: bright on the side facing sunDirectionDeg (canvas
  // math convention: 0 = +x/right, increasing counterclockwise), dark on
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

  // Draws Earth, its orbit and a Sun direction indicator at sunAngleDeg,
  // then the Moon icon at moonAngleDeg. Returns the diagram's geometry
  // (centre and orbit radius) so a caller can add its own extra markers
  // — e.g. sidereal-vs-synodic.html's fixed reference-star marker — at a
  // consistent scale without needing to know the drawing internals.
  function draw(canvas, { moonAngleDeg, sunAngleDeg }) {
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const R = Math.min(cx, cy) - 55;
    const sunMarkerR = Math.min(cx, cy) - 20;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = '#b7c3d1';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fillStyle = EARTH_COLOR;
    ctx.fill();
    ctx.strokeStyle = '#173d75';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const moonPoint = pointAt(cx, cy, R, moonAngleDeg);
    drawMoonIcon(ctx, moonPoint.x, moonPoint.y, 11, sunAngleDeg);

    ctx.fillStyle = '#8a97a5';
    ctx.font = 'italic 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Not to scale', 8, canvas.height - 10);

    return { cx, cy, R: sunMarkerR };
  }

  window.MoonOrbitPanel = { drawMoonIcon, draw, pointAt };
})();
