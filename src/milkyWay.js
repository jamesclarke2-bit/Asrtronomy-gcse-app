/**
 * The Milky Way, for notes/our-galaxy.html (spec 15.1, 15.2, 15.3, 15.8).
 *
 * Sizes are rounded general knowledge, labelled a first draft on the page.
 * Distances are in thousands of light-years (kly). The face-on model puts
 * the centre at (0, 0) and the Sun at (0, -SUN_FROM_CENTRE_KLY); "up" (+y)
 * is the direction from the Sun to the centre.
 *
 * Spiral arms are drawn as logarithmic spirals starting from the ends of
 * the central bar (two major arms) and from the bar's sides (two minor
 * ones). A line of sight from the Sun at an angle `lDeg` from the
 * direction of the centre (turning left, the way the Sun moves round)
 * crosses some arms; for each crossing, gas on a flat rotation curve
 * (every orbit at about ROTATION_KMS) moves along our line of sight at
 *   v = ROTATION_KMS x sin(l) x (R0 / R - 1)
 * (R0 the Sun's distance from the centre, R the gas's): positive (moving
 * away, redshift) inside the Sun's orbit, negative (moving towards us,
 * blueshift) outside it. That Doppler shift of the 21 cm line is how radio
 * astronomers map the arms and the rotation.
 */
(function () {
  const DISC_DIAMETER_KLY = 100;
  const DISC_THICKNESS_KLY = 1;
  const SUN_FROM_CENTRE_KLY = 26;
  const BAR_HALF_LENGTH_KLY = 13;
  const ROTATION_KMS = 220;
  const GLOBULAR_CLUSTERS = 150;
  const H21_CM = 21.1;
  const HUBBLE_TYPE = 'SBb';
  // The lettered places on the "place the objects" question's drawing.
  const QUIZ_LETTERS = { cluster: 'A', sun: 'B', dust: 'C', bulge: 'D' };

  const PITCH_DEG = 12;
  const ARM_HALF_WIDTH_KLY = 1.6;
  const DISC_RADIUS_KLY = DISC_DIAMETER_KLY / 2;
  const K = Math.tan((PITCH_DEG * Math.PI) / 180);

  /** Arm start angles (radians, from +x, counter-clockwise; the bar lies along the major arms' starts) and whether major. */
  // Turned so the Sun sits between two arms, about 4 kly from the nearest.
  const ARM_TURN = 0.72;
  const ARM_STARTS = [
    { id: 'arm-1', start: ARM_TURN, major: true },
    { id: 'arm-2', start: ARM_TURN + Math.PI, major: true },
    { id: 'arm-3', start: ARM_TURN + Math.PI / 2, major: false },
    { id: 'arm-4', start: ARM_TURN + (3 * Math.PI) / 2, major: false },
  ];

  /**
   * The points along each arm, from the bar out to the disc's edge, as
   * {x, y} in kly. Arms wind anticlockwise outwards; the Galaxy turns
   * clockwise in the drawing (the Sun moves towards l = 90°), so the arms
   * trail behind the rotation, as real spiral arms do.
   */
  function armPoints(arm, step = 0.02) {
    const pts = [];
    for (let t = 0; ; t += step) {
      const r = BAR_HALF_LENGTH_KLY * Math.exp(K * t);
      if (r > DISC_RADIUS_KLY) break;
      const a = arm.start + t;
      pts.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
    }
    return pts;
  }

  const ARMS = ARM_STARTS.map((a) => ({ ...a, points: armPoints(a) }));

  function sun() {
    return { x: 0, y: -SUN_FROM_CENTRE_KLY };
  }

  /** The unit direction of a line of sight lDeg from the centre direction, turning left. */
  function direction(lDeg) {
    const l = (lDeg * Math.PI) / 180;
    return { x: -Math.sin(l), y: Math.cos(l) };
  }

  /** Line-of-sight speed (km/s) of gas at distance R (kly) from the centre, seen at longitude lDeg. */
  function radialVelocity(lDeg, R) {
    return ROTATION_KMS * Math.sin((lDeg * Math.PI) / 180) * (SUN_FROM_CENTRE_KLY / R - 1);
  }

  /** The wavelength (cm) of the 21 cm line from gas moving at v km/s along our line of sight. */
  function shiftedWavelengthCm(vKms, cMPerS) {
    return H21_CM * (1 + (vKms * 1000) / cMPerS);
  }

  /**
   * Where a line of sight crosses the spiral arms: [{d, x, y, R, v, arm,
   * letter}], nearest first, each the middle of a run of points within an
   * arm's half-width, out to the disc's edge.
   */
  function crossings(lDeg) {
    const s = sun();
    const u = direction(lDeg);
    const out = [];
    let run = null;
    for (let d = 0.25; ; d += 0.25) {
      const x = s.x + u.x * d;
      const y = s.y + u.y * d;
      const R = Math.hypot(x, y);
      if (R > DISC_RADIUS_KLY) break;
      let hit = null;
      for (const arm of ARMS) {
        for (const p of arm.points) {
          if (Math.hypot(p.x - x, p.y - y) < ARM_HALF_WIDTH_KLY) {
            hit = arm.id;
            break;
          }
        }
        if (hit) break;
      }
      if (hit && run && run.arm === hit) {
        run.end = d;
      } else {
        if (run) out.push(run);
        run = hit ? { arm: hit, start: d, end: d } : null;
      }
    }
    if (run) out.push(run);
    return out.map((c, k) => {
      const d = (c.start + c.end) / 2;
      const x = s.x + u.x * d;
      const y = s.y + u.y * d;
      const R = Math.hypot(x, y);
      return { d, x, y, R, v: radialVelocity(lDeg, R), arm: c.arm, letter: String.fromCharCode(65 + k) };
    });
  }

  const api = {
    DISC_DIAMETER_KLY,
    DISC_THICKNESS_KLY,
    DISC_RADIUS_KLY,
    SUN_FROM_CENTRE_KLY,
    BAR_HALF_LENGTH_KLY,
    ARM_TURN,
    ROTATION_KMS,
    GLOBULAR_CLUSTERS,
    H21_CM,
    HUBBLE_TYPE,
    QUIZ_LETTERS,
    ARM_HALF_WIDTH_KLY,
    ARMS,
    sun,
    direction,
    radialVelocity,
    shiftedWavelengthCm,
    crossings,
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.MilkyWay = api;
  }
})();
