/**
 * Coordinate conversions: hour angle, sidereal time, and horizontal
 * (altitude/azimuth) coordinates from equatorial (declination/hour
 * angle) ones.
 *
 * Conventions used throughout:
 *  - Latitude: degrees, north positive (matches solarPosition.js).
 *  - Longitude: degrees, east positive (matches solarPosition.js).
 *  - Hour angle: degrees, measured westward from the meridian.
 *    Negative HA = object is east of the meridian and hasn't
 *    transited (crossed the meridian) yet; positive HA = object is
 *    west of the meridian and has already transited.
 *  - RA and LST: decimal hours, 0-24.
 *  - Azimuth: degrees, measured from north, clockwise (matches
 *    solarPosition.js).
 *
 * Wrapped in an IIFE — not left as top-level declarations — because
 * classic (non-module) <script> tags share one global lexical scope
 * in the browser, and this file's trig helpers (toRad etc.) would
 * otherwise collide with solarPosition.js's own top-level helpers of
 * the same name when both are loaded on the same page. (This bit an
 * earlier version of eotComponents.js — see its own comment.)
 */
(function () {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const sinD = (deg) => Math.sin(toRad(deg));
  const cosD = (deg) => Math.cos(toRad(deg));
  const asinD = (x) => toDeg(Math.asin(Math.max(-1, Math.min(1, x))));
  const acosD = (x) => toDeg(Math.acos(Math.max(-1, Math.min(1, x))));
  const tanD = (deg) => Math.tan(toRad(deg));

  function mod(value, modulus) {
    return ((value % modulus) + modulus) % modulus;
  }

  /**
   * Convert an hour angle given in hours/minutes/seconds of time into
   * degrees (15 degrees per hour). The sign of the whole hour angle is
   * taken from whichever of h, m, s is the first nonzero component, so
   * a negative HA under a full hour can be passed as e.g. (0, -30, 0).
   */
  function hourAngleToDegrees(h, m = 0, s = 0) {
    const sign = h !== 0 ? Math.sign(h) : m !== 0 ? Math.sign(m) : Math.sign(s) || 1;
    return sign * (Math.abs(h) + Math.abs(m) / 60 + Math.abs(s) / 3600) * 15;
  }

  // Julian Day at 0h UT for the calendar date (UTC) of `date`, ignoring
  // its time-of-day — the sidereal time formula below needs the two
  // separately. Reuses the same epoch-based JD approach as
  // solarPosition.js's toJulianDay rather than reimplementing calendar
  // arithmetic.
  function julianDayAt0hUT(date) {
    const midnightUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return midnightUTC / 86400000 + 2440587.5;
  }

  /**
   * Local sidereal time, in decimal hours (0-24), for a given moment
   * (JS Date, UTC-based) and observer longitude (degrees, east
   * positive). Standard method (Meeus / Duffett-Smith): Greenwich
   * Mean Sidereal Time at 0h UT from a polynomial in Julian centuries,
   * advanced by the sidereal rate (1.0027379093 sidereal hours per
   * solar hour) to the actual time of day, then shifted by longitude.
   */
  function getLocalSiderealTime(date, longitudeDeg) {
    const jd0 = julianDayAt0hUT(date);
    const T = (jd0 - 2451545.0) / 36525;
    const H = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

    const gmst0 = mod(6.697374558 + 2400.051336 * T + 0.000025862 * T * T, 24);
    const gst = mod(gmst0 + H * 1.0027379093, 24);

    return mod(gst + longitudeDeg / 15, 24);
  }

  /**
   * Hour angle (degrees) of an object with right ascension `raHours`
   * at local sidereal time `lstHours`: HA = LST - RA. Returned in
   * (-180, 180] degrees — negative (east, not yet transited) through
   * positive (west, already transited).
   */
  function raToHourAngleDegrees(raHours, lstHours) {
    const haHours = mod(lstHours - raHours + 12, 24) - 12;
    return haHours * 15;
  }

  /**
   * Right ascension (decimal hours, 0-24) of an object with the given
   * hour angle (degrees) at local sidereal time `lstHours`: RA = LST - HA.
   */
  function hourAngleDegreesToRA(hourAngleDegrees, lstHours) {
    return mod(lstHours - hourAngleDegrees / 15, 24);
  }

  /**
   * Altitude and azimuth (degrees) of an object from its declination,
   * hour angle (degrees) and the observer's latitude. Valid for any
   * latitude, including the southern hemisphere and the equator, and
   * correctly gives azimuth 0 (due north, for a northern-hemisphere
   * observer) rather than 180 when the object transits north of the
   * zenith (declination beyond latitude, poleward of the observer's
   * zenith) — this falls out of the standard spherical-trig identities
   * without needing a special case.
   */
  function getAltAz(dec, hourAngleDegrees, lat) {
    const cosZenithDistance = sinD(lat) * sinD(dec) + cosD(lat) * cosD(dec) * cosD(hourAngleDegrees);
    const zenithDistance = acosD(cosZenithDistance);
    const altitude = 90 - zenithDistance;

    const sinZenithDistance = sinD(zenithDistance);
    const denominator = cosD(lat) * sinZenithDistance;

    let azimuth;
    if (Math.abs(denominator) < 1e-9) {
      // Object at the zenith/nadir, or observer exactly at a pole:
      // azimuth is undefined by the formula. Default to 0 (north).
      azimuth = 0;
    } else {
      azimuth = acosD((sinD(dec) - sinD(lat) * cosD(zenithDistance)) / denominator);
      if (hourAngleDegrees > 0) azimuth = 360 - azimuth;
    }

    return { altitude, azimuth: mod(azimuth, 360) };
  }

  /** Angular distance from the north celestial pole: 90 - declination. */
  function getPolarDistance(dec) {
    return 90 - dec;
  }

  /**
   * Whether an object at declination `dec` is circumpolar (never sets)
   * for an observer at latitude `lat`. An object never crosses the
   * horizon when |tan(dec) * tan(lat)| > 1; whether that means
   * "always up" (circumpolar) or "never rises" is given by the sign of
   * tan(dec) * tan(lat) — positive means the object is on the same
   * side as the observer's elevated pole, so always up.
   *
   * This is a single formula with no north/south branching, so it
   * naturally handles the southern hemisphere (negative lat) and
   * gives false for every declination at the equator (tan(0) = 0,
   * so the product is 0 for any dec, which never exceeds 1).
   */
  function isCircumpolar(dec, lat) {
    return tanD(dec) * tanD(lat) > 1;
  }

  /**
   * Altitude (degrees) of an object at upper transit (crossing the
   * meridian), for an observer at latitude `lat` and an object at
   * declination `dec`: 90 - |lat - dec|. This holds whether the
   * object transits south of the zenith (dec < lat) or north of it
   * (dec > lat) — only the transit azimuth (see getAltAz) differs
   * between those two cases, not this altitude.
   */
  function getMaxAltitudeUpperTransit(lat, dec) {
    return 90 - Math.abs(lat - dec);
  }

  /**
   * Given an upper-transit altitude and an observer's latitude, the
   * two declinations consistent with it: from altitude = 90 - |lat - dec|,
   * dec = lat - (90 - altitude) or dec = lat + (90 - altitude) — one
   * for each side of the observer's zenith the object could transit
   * on. `lower` <= `higher` whenever altitude <= 90.
   */
  function getDeclinationFromAltitudeAndLatitude(altitude, lat) {
    const offset = 90 - altitude;
    return { lower: lat - offset, higher: lat + offset };
  }

  /**
   * Given an upper-transit altitude and an object's declination, the
   * two observer latitudes consistent with it: from
   * altitude = 90 - |lat - dec|, lat = dec - (90 - altitude) or
   * lat = dec + (90 - altitude). `lower` <= `higher` whenever
   * altitude <= 90.
   */
  function getLatitudeFromAltitudeAndDeclination(altitude, dec) {
    const offset = 90 - altitude;
    return { lower: dec - offset, higher: dec + offset };
  }

  const api = {
    hourAngleToDegrees,
    getLocalSiderealTime,
    raToHourAngleDegrees,
    hourAngleDegreesToRA,
    getAltAz,
    getPolarDistance,
    isCircumpolar,
    getMaxAltitudeUpperTransit,
    getDeclinationFromAltitudeAndLatitude,
    getLatitudeFromAltitudeAndDeclination,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.Coordinates = api;
  }
})();
