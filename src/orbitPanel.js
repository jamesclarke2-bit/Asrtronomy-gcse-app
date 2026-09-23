/**
 * Earth-orbit / axial-tilt schematic diagram — shared by
 * sims/sun-path.html and sims/sun-declination.html, so both draw the
 * exact same component from one place rather than keeping two copies
 * in sync by hand. Earth's orbital position comes entirely from
 * EarthOrbit.computeEarthOrbitAngle (itself derived from the day's
 * declination), so this diagram always agrees with whatever
 * declination the host page's own sky/meridian diagram shows for the
 * same date.
 *
 * Browser-only UI component (draws to a canvas), so — like quiz-ui.js
 * and glossary.js — there's no Node/module.exports path.
 */
(function () {
  // Earth's axial tilt, in degrees. The tick mark is drawn at this fixed
  // screen angle for every orbital position — the axis keeps pointing the
  // same direction in space through the year, which is the mechanism
  // behind the seasons, not distance from the Sun.
  const EARTH_AXIS_SCREEN_ANGLE_DEG = 66.6;

  const REFERENCE_POINTS = [
    { theta: 90, label: 'Jun sol.' },
    { theta: 0, label: 'Mar eq.' },
    { theta: 270, label: 'Dec sol.' },
    { theta: 180, label: 'Sep eq.' },
  ];

  function orbitPoint(cx, cy, radius, thetaDeg) {
    const rad = (thetaDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  }

  function textAlignFor(dx) {
    if (Math.abs(dx) < 5) return 'center';
    return dx > 0 ? 'left' : 'right';
  }

  function draw(canvas, dayIndex) {
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const R = Math.min(cx, cy) - 80;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textBaseline = 'middle';

    // Orbit path
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = '#b7c3d1';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Reference points around the orbit
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#8a97a5';
    REFERENCE_POINTS.forEach(({ theta, label }) => {
      const p = orbitPoint(cx, cy, R, theta);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();

      const labelPoint = orbitPoint(cx, cy, R + 16, theta);
      ctx.textAlign = textAlignFor(labelPoint.x - cx);
      ctx.fillText(label, labelPoint.x, labelPoint.y);
    });

    // The Sun, at the centre
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#ffb703';
    ctx.fill();
    ctx.strokeStyle = '#e08e00';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#8a5b00';
    ctx.font = '600 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sun', cx, cy + 24);

    // Earth's current position
    const theta = EarthOrbit.computeEarthOrbitAngle(dayIndex);
    const earth = orbitPoint(cx, cy, R, theta);

    // Fixed-direction axis tick: same screen angle at every position
    const axisRad = (EARTH_AXIS_SCREEN_ANGLE_DEG * Math.PI) / 180;
    const axisDx = Math.cos(axisRad);
    const axisDy = -Math.sin(axisRad);
    ctx.beginPath();
    ctx.moveTo(earth.x - axisDx * 9, earth.y - axisDy * 9);
    ctx.lineTo(earth.x + axisDx * 16, earth.y + axisDy * 16);
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(earth.x + axisDx * 16, earth.y + axisDy * 16, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#c0392b';
    ctx.fill();

    // Earth marker
    ctx.beginPath();
    ctx.arc(earth.x, earth.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#2a6bd6';
    ctx.fill();
    ctx.strokeStyle = '#173d75';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#8a97a5';
    ctx.font = 'italic 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Not to scale', 8, canvas.height - 10);
  }

  window.OrbitPanel = { draw };
})();
