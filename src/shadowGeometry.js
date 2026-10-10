/**
 * Shadow-stick and sundial geometry for sims/shadows-and-sundials.html.
 *
 * Deliberately narrow: every *where the Sun is* calculation (altitude,
 * azimuth, declination, the equation of time) comes from
 * src/solarPosition.js's own getSunPosition, not a second copy of it —
 * this module only turns that position into a shadow's length and
 * direction, a sundial's hour-line angles, and (the inverse of
 * getSunriseSunset's own solarNoonUT = 720 - 4*lon - EoT) a longitude
 * from an observed noon time.
 */
(function () {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  /**
   * A vertical stick's shadow length, from the classic right-triangle
   * relationship: height / tan(altitude). Returns null once the Sun is
   * at or below the horizon (altitude <= 0), where a vertical stick
   * casts no shadow at all (or an infinite one, exactly at the horizon).
   */
  function shadowLengthM(heightM, altitudeDeg) {
    if (altitudeDeg <= 0) return null;
    return heightM / Math.tan(toRad(altitudeDeg));
  }

  /**
   * The compass direction a shadow points: directly away from the Sun,
   * so 180 degrees round from the Sun's own azimuth.
   */
  function shadowAzimuthDeg(sunAzimuthDeg) {
    return (sunAzimuthDeg + 180) % 360;
  }

  /**
   * A shadow tip's position relative to the stick's base, in a flat
   * North/East metres frame (x = east, y = north) — the natural frame
   * for a top-down diagram. Null when the Sun is below the horizon
   * (shadowLengthM's own null case).
   */
  function shadowTipMetres(heightM, altitudeDeg, sunAzimuthDeg) {
    const length = shadowLengthM(heightM, altitudeDeg);
    if (length === null) return null;
    const shadowAz = shadowAzimuthDeg(sunAzimuthDeg);
    return {
      x: length * Math.sin(toRad(shadowAz)),
      y: length * Math.cos(toRad(shadowAz)),
      length,
    };
  }

  /**
   * A horizontal sundial's hour-line angle, measured from the noon
   * line (the line under the gnomon's own edge) round to the dial's
   * rim: tan(theta) = sin(latitude) * tan(15 degrees * hoursFromNoon).
   * The 15 degrees/hour is the Sun's steady apparent rotation (360
   * degrees / 24 h); sin(latitude) is what bends that even spacing into
   * the dial plate's own unequal one (equal again only at the poles,
   * latitude = +-90, where sin(latitude) = +-1 makes theta = 15 degrees
   * * hoursFromNoon exactly).
   *
   * Positive hoursFromNoon (afternoon) gives a positive angle on the
   * dial's own east side (the convention this page's drawing code
   * follows); undefined exactly at +-6 h (tan(90 degrees) is where a
   * horizontal dial's own hour lines would reach the plate's edge
   * running parallel to the noon line), where this returns null.
   */
  function sundialHourLineAngleDeg(latitudeDeg, hoursFromNoon) {
    const sunHourAngleDeg = 15 * hoursFromNoon;
    const cosSunHourAngle = Math.cos(toRad(sunHourAngleDeg));
    if (Math.abs(cosSunHourAngle) < 1e-9) return null;
    const tanTheta = Math.sin(toRad(latitudeDeg)) * Math.tan(toRad(sunHourAngleDeg));
    return toDeg(Math.atan(tanTheta));
  }

  /**
   * Longitude from an observed UT time of local (apparent) noon and
   * that date's equation of time — the same relationship src/
   * solarPosition.js's getSunriseSunset already uses in the other
   * direction (solarNoonUT = 720 - 4*lon - equationOfTime), solved here
   * for longitude instead of solarNoonUT. East positive, matching
   * getSunPosition's own lon convention.
   *
   * @param {number} equationOfTimeMinutes - AST - MST, in minutes, for the observation date
   * @param {number} noonUtMinutes - the observed UT clock time of local noon, in minutes after UT midnight
   */
  function longitudeFromNoonUTDeg(equationOfTimeMinutes, noonUtMinutes) {
    return (720 - equationOfTimeMinutes - noonUtMinutes) / 4;
  }

  /**
   * Apparent solar time (the time a sundial itself reads), in minutes
   * after its own midnight, from a UT clock time, a longitude and that
   * date's equation of time. The same relationship as src/
   * solarPosition.js's internal trueSolarTime line (utcMinutes + eqTime
   * + 4*lon, wrapped to 0-1440) — not a second model of it — so a
   * sundial's reading always agrees with getSunPosition's own hour
   * angle (equal to this value minus 720 minutes, i.e. minus 12 h).
   */
  function apparentSolarTimeMinutes(utcMinutes, longitudeDeg, equationOfTimeMinutes) {
    return (((utcMinutes + equationOfTimeMinutes + 4 * longitudeDeg) % 1440) + 1440) % 1440;
  }

  const api = {
    shadowLengthM,
    shadowAzimuthDeg,
    shadowTipMetres,
    sundialHourLineAngleDeg,
    longitudeFromNoonUTDeg,
    apparentSolarTimeMinutes,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.ShadowGeometry = api;
  }
})();
