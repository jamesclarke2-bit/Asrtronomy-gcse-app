/**
 * Engine for sims/sunspot-rotation.html: where a sunspot sits on the
 * visible disc, how fast different latitudes rotate (differential
 * rotation), and the sidereal/synodic period relationship — same
 * dependency-free, Node-and-browser pattern as src/coordinates.js.
 *
 * Simplification, stated here and on the page itself: the Sun's own
 * axial tilt (as seen from Earth, a few degrees, varying through the
 * year) is ignored throughout. A sunspot's apparent x position is
 * computed as if the Sun's rotation axis pointed straight out of the
 * page, which keeps the geometry a single cosine/sine projection
 * instead of a full 3D rotation — the right level of detail for
 * estimating a rotation period from day-to-day tracking, not for
 * precise limb-geometry work.
 */
(function () {
  const RAD = Math.PI / 180;
  const EARTH_YEAR_DAYS = 365.25;

  /**
   * A sunspot at latitude `latDeg` and longitude `lonDeg` from the
   * Sun's central meridian (0° at the centre of the visible disc,
   * negative = east limb side, positive = west limb side) projects to
   * this x position across a disc of radius R, measured from the
   * centre: x = R cos(latitude) sin(longitude). Ignores the tilt of
   * the Sun's rotation axis as seen from Earth (see file header).
   */
  function spotXPosition(latDeg, lonDeg, R) {
    return R * Math.cos(latDeg * RAD) * Math.sin(lonDeg * RAD);
  }

  /**
   * A sunspot's y position (screen-vertical, north positive) depends
   * only on its latitude in this same face-on, axis-untilted
   * projection — unlike x, it doesn't shift with longitude as the Sun
   * rotates, which is what makes it useful for drawing the disc
   * itself alongside spotXPosition.
   */
  function spotYPosition(latDeg, R) {
    return R * Math.sin(latDeg * RAD);
  }

  /**
   * The differential rotation law: sidereal angular velocity in
   * degrees per day, as a function of latitude. Rotates fastest at
   * the equator, slowest towards the poles — real sunspots are rarely
   * seen much past about 40° either way, so this is reported as
   * approximate beyond that range (the page says so, and flags the
   * whole law as first draft, to be checked by the teacher against
   * the notes' simpler ~25 days at the equator / ~35 days near the
   * poles figures).
   */
  function siderealAngularVelocityDegPerDay(latDeg) {
    const sin2 = Math.sin(latDeg * RAD) ** 2;
    return 14.71 - 2.4 * sin2 - 1.79 * sin2 * sin2;
  }

  /** Sidereal rotation period at a given latitude, in days. */
  function siderealPeriodDays(latDeg) {
    return 360 / siderealAngularVelocityDegPerDay(latDeg);
  }

  /**
   * The synodic (observed-from-Earth) period, longer than the
   * sidereal one because Earth itself orbits the Sun in the same
   * direction the Sun spins, the same relation as the Moon's synodic
   * vs sidereal month: 1/synodic = 1/sidereal - 1/year.
   */
  function synodicPeriodDays(siderealDays, earthYearDays = EARTH_YEAR_DAYS) {
    return 1 / (1 / siderealDays - 1 / earthYearDays);
  }

  /** The synodic angular velocity implied by a sidereal period, in degrees per day. */
  function synodicAngularVelocityDegPerDay(latDeg) {
    return 360 / synodicPeriodDays(siderealPeriodDays(latDeg));
  }

  /**
   * A sunspot's longitude from the central meridian at elapsed day
   * `dayT`, given its longitude at day 0 — advancing at the *synodic*
   * rate, since that's the rate actually observed from Earth (what a
   * day-by-day tracking exercise measures), not the true sidereal
   * rate the Sun itself rotates at.
   */
  function apparentLongitudeAtDay(latDeg, lon0Deg, dayT) {
    return lon0Deg + synodicAngularVelocityDegPerDay(latDeg) * dayT;
  }

  /** True once a longitude (from the central meridian) is on the visible disc. */
  function isOnVisibleDisc(lonDeg) {
    return Math.abs(lonDeg) <= 90;
  }

  /**
   * The "double the limb-to-limb time" method: a spot crossing from
   * the east limb (-90°) to the west limb (+90°) sweeps exactly half
   * a synodic rotation, so doubling that elapsed time estimates the
   * full synodic period.
   */
  function synodicPeriodFromLimbToLimbDays(limbToLimbDays) {
    return limbToLimbDays * 2;
  }

  /**
   * The "two readings" method: from a spot's x position on two
   * different days (at a known latitude), recover how far it moved in
   * longitude and scale up to a full 360° rotation —
   * period = 360 x (day2 - day1) / (longitude2 - longitude1).
   * Inverts spotXPosition via asin, so x values must be within the
   * ±R cos(latitude) range actually reachable at that latitude
   * (clamped defensively against floating-point overshoot at the
   * limb itself).
   */
  function longitudeFromXPosition(latDeg, x, R) {
    const maxX = R * Math.cos(latDeg * RAD);
    const ratio = Math.max(-1, Math.min(1, x / maxX));
    return Math.asin(ratio) / RAD;
  }

  function periodFromTwoReadings(latDeg, day1, x1, day2, x2, R) {
    const lon1 = longitudeFromXPosition(latDeg, x1, R);
    const lon2 = longitudeFromXPosition(latDeg, x2, R);
    const angleMoved = lon2 - lon1;
    const daysElapsed = day2 - day1;
    return (360 * daysElapsed) / angleMoved;
  }

  const api = {
    EARTH_YEAR_DAYS,
    spotXPosition,
    spotYPosition,
    siderealAngularVelocityDegPerDay,
    siderealPeriodDays,
    synodicPeriodDays,
    synodicAngularVelocityDegPerDay,
    apparentLongitudeAtDay,
    isOnVisibleDisc,
    synodicPeriodFromLimbToLimbDays,
    longitudeFromXPosition,
    periodFromTwoReadings,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.SunRotation = api;
  }
})();
