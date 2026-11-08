/**
 * Shared "Earth's orbit and seasons" diagram — pure data/geometry, no
 * DOM — used by src/seasonsDiagramView.js (the actual drawing) and
 * directly unit-testable here. Replaces the old src/orbitPanel.js
 * (deleted): that diagram drew Earth as a single tiny dot with a red
 * tick at a fixed screen angle, which (a) was too small to show the
 * lit/dark split that actually causes the seasons, and (b) being
 * screen-fixed, that tick happened to point rightwards at some orbital
 * positions in a way students could misread as "right = a particular
 * season" — March equinox, in particular, sits at the rightmost point
 * of the orbit in this same screen layout. The fix isn't a different
 * angle (the axis genuinely does keep one fixed direction in space —
 * "towards Polaris" — all year round, which is *why* the seasons
 * happen): it's drawing Earth large enough, at enough positions, with
 * explicit per-position date and hemisphere-season labels, that no one
 * has to infer anything from screen position at all.
 *
 * Earth's orbital position comes from EarthOrbit.computeEarthOrbitAngle
 * (itself derived from the day's declination, exactly as before), so
 * this diagram always agrees with whatever declination a host page's
 * own sky/meridian diagram shows for the same date.
 */
function makeSeasonsDiagram(EarthOrbit, SolarPosition) {
  const OBLIQUITY_DEG = 23.5;
  // Same arbitrary reference year src/earthOrbit.js itself uses — any
  // non-leap year works identically, since every computation here goes
  // through declination (and so ultimately real solar geometry), never
  // a literal calendar year.
  const YEAR = 2026;

  function dateForDayIndex(dayIndex) {
    const d = new Date(Date.UTC(YEAR, 0, 1, 12, 0));
    d.setUTCDate(d.getUTCDate() + dayIndex);
    return d;
  }

  // Degrees: 0 = March equinox, 90 = June solstice, 180 = September
  // equinox, 270 = December solstice — the same convention
  // EarthOrbit.computeEarthOrbitAngle itself uses. Each hemisphere's own
  // season at that exact instant: a solstice is that hemisphere's
  // longest/shortest day (summer/winter solstice), an equinox is the
  // moment its day length is swinging through equal with night (spring
  // equinox if lengthening, autumn if shortening) — never "summer" or
  // "winter" at an equinox, since neither hemisphere is at an extreme.
  const REFERENCE_POSITIONS = [
    {
      id: 'march-equinox',
      theta: 0,
      dateLabel: 'March equinox',
      northernSeason: 'Spring equinox',
      southernSeason: 'Autumn equinox',
    },
    {
      id: 'june-solstice',
      theta: 90,
      dateLabel: 'June solstice',
      northernSeason: 'Summer solstice',
      southernSeason: 'Winter solstice',
    },
    {
      id: 'september-equinox',
      theta: 180,
      dateLabel: 'September equinox',
      northernSeason: 'Autumn equinox',
      southernSeason: 'Spring equinox',
    },
    {
      id: 'december-solstice',
      theta: 270,
      dateLabel: 'December solstice',
      northernSeason: 'Winter solstice',
      southernSeason: 'Summer solstice',
    },
  ];

  /**
   * The broad (not-just-at-the-instant) season each hemisphere is in at
   * an arbitrary orbital angle: the year's divided into the four
   * quarters the solstices/equinoxes themselves bound, each quarter
   * named for the season already under way in it — e.g. [0°, 90°), the
   * quarter between March equinox and June solstice, is Northern
   * spring throughout. The Southern hemisphere is always the opposite
   * pair (spring<->autumn, summer<->winter).
   */
  function seasonsForTheta(thetaDeg) {
    const t = ((thetaDeg % 360) + 360) % 360;
    if (t < 90) return { northernSeason: 'Spring', southernSeason: 'Autumn' };
    if (t < 180) return { northernSeason: 'Summer', southernSeason: 'Winter' };
    if (t < 270) return { northernSeason: 'Autumn', southernSeason: 'Spring' };
    return { northernSeason: 'Winter', southernSeason: 'Summer' };
  }

  /** Earth's orbital angle and both hemispheres' current season, for a given day-of-year index. */
  function seasonsAtDayIndex(dayIndex) {
    const theta = EarthOrbit.computeEarthOrbitAngle(dayIndex);
    return { theta, ...seasonsForTheta(theta) };
  }

  /**
   * The Sun's altitude at solar noon (transit, hour angle 0) for a
   * given declination and observer latitude — the standard closed form
   * (zenith distance reduces to |lat - declination| exactly at transit),
   * the same formula Coordinates.getAltAz(dec, 0, lat) and
   * SolarPosition.getSunPosition both reduce to at hour angle zero, so
   * this never disagrees with either.
   */
  function noonAltitudeDeg(declinationDeg, latDeg) {
    return 90 - Math.abs(latDeg - declinationDeg);
  }

  /** Day length (sunrise to sunset) at a given latitude on a given date, straight from the engine. */
  function dayLengthMinutes(date, latDeg) {
    return SolarPosition.getSunriseSunset(date, latDeg, 0).dayLengthMinutes;
  }

  /**
   * A point on the orbit ellipse (centred at cx,cy, semi-axes rx,ry) at
   * orbital angle thetaDeg — screen coordinates (y increases downward),
   * theta measured counterclockwise from the positive x-axis, so
   * increasing theta sweeps counterclockwise on screen: the correct,
   * real-world sense for Earth's orbit viewed from above the north
   * pole.
   */
  function orbitPoint(cx, cy, rx, ry, thetaDeg) {
    const rad = (thetaDeg * Math.PI) / 180;
    return { x: cx + rx * Math.cos(rad), y: cy - ry * Math.sin(rad) };
  }

  // The fixed rotation from theta (EarthOrbit's own convention: 0 =
  // March equinox, 90 = June solstice, 180 = September equinox, 270 =
  // December solstice) to this diagram's own screen layout — the
  // standard textbook one, not an arbitrary choice: solstices on the
  // left/right (where the diagram's fixed, rightward-leaning axis
  // reads as leaning towards/away from the Sun) and equinoxes at the
  // top/bottom (where that same lean reads as sideways to the Sun).
  // orbitPoint's own angle=0/90/180/270 already sit at right/top/
  // left/bottom respectively, so adding 90 here lands March (theta=0)
  // at the top, June (90) at the left, September (180) at the bottom,
  // and December (270) back at the right — see tiltRelativeToSun below
  // for why that's the layout that actually reads correctly, and
  // test/seasonsDiagram.test.js for the four-position/anticlockwise
  // checks against it.
  const SCREEN_PHASE_SHIFT_DEG = 90;

  function screenAngleForTheta(thetaDeg) {
    return thetaDeg + SCREEN_PHASE_SHIFT_DEG;
  }

  /**
   * 'away' | 'towards' | 'sideways': how this orbital angle's Earth, in
   * this diagram's own screen layout, sits relative to the Sun — the
   * sign of its horizontal (left/right) displacement from the Sun,
   * since every Earth's axis leans the same fixed way on screen, to
   * the right (see src/seasonsDiagramView.js's own
   * AXIS_SCREEN_ANGLE_DEG). An Earth to the Sun's right has that
   * rightward lean pointing further away from the Sun ("away"); to the
   * left, the same rightward lean points back towards the Sun
   * ("towards"); directly above or below, the lean has no horizontal
   * displacement to compare against at all ("sideways").
   */
  function tiltRelativeToSun(thetaDeg) {
    const screenAngle = screenAngleForTheta(thetaDeg);
    const point = orbitPoint(0, 0, 1, 1, screenAngle);
    if (Math.abs(point.x) < 1e-9) return 'sideways';
    return point.x > 0 ? 'away' : 'towards';
  }

  /**
   * The plain-language, one-line caption shown by each reference
   * Earth — derived from its own northernSeason (already the single
   * source of truth for which broad season this position is), never a
   * second, separately-maintained lookup that could drift from it.
   * Kept deliberately short (the N:/S: labels already name the
   * hemisphere): long enough text here, at the left/right positions'
   * screen-edge-hugging label point, has previously pushed the whole
   * diagram's own measured content width well past its viewBox — see
   * test/seasonsDiagram.test.js's own length check.
   */
  function tiltCaption(position) {
    const broadSeason = position.northernSeason.split(' ')[0];
    if (broadSeason === 'Summer') return 'Tilted towards the Sun: summer';
    if (broadSeason === 'Winter') return 'Tilted away from the Sun: winter';
    return `Tilted sideways to the Sun: ${broadSeason.toLowerCase()} equinox`;
  }

  return {
    OBLIQUITY_DEG,
    REFERENCE_POSITIONS,
    dateForDayIndex,
    seasonsForTheta,
    seasonsAtDayIndex,
    noonAltitudeDeg,
    dayLengthMinutes,
    orbitPoint,
    SCREEN_PHASE_SHIFT_DEG,
    screenAngleForTheta,
    tiltRelativeToSun,
    tiltCaption,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  const EarthOrbit = require('./earthOrbit');
  const SolarPosition = require('./solarPosition');
  module.exports = { ...makeSeasonsDiagram(EarthOrbit, SolarPosition), makeSeasonsDiagram };
} else if (typeof window !== 'undefined') {
  window.SeasonsDiagram = { ...makeSeasonsDiagram(window.EarthOrbit, window.SolarPosition), makeSeasonsDiagram };
}
