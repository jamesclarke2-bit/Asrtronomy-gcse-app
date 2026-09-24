/**
 * Moon phase calculation.
 * -------------------------
 * A mean-synodic-month model: the Moon's phase repeats every
 * 29.53058867 days (the average New Moon to New Moon interval), counted
 * from a single known reference New Moon. Real new/full moons wander by
 * up to roughly half a day either side of this mean cycle (orbital
 * eccentricity, etc.), but that error doesn't accumulate over time — it
 * stays bounded — so this stays accurate to well within a day even many
 * years from the reference date. See test/moonPhase.test.js, which
 * checks it against real, independently-checkable full/new moon dates.
 *
 * theta (0-360 degrees) is the Moon's orbital position relative to the
 * Sun as seen from Earth: 0 = New Moon (between Earth and Sun),
 * 180 = Full Moon (opposite the Sun). Illuminated fraction follows
 * directly from theta alone — the same angle drives both the top-down
 * orbit diagram and the Earth-view disc, so they can never disagree.
 */
function makeMoonPhase() {
  const SYNODIC_MONTH_DAYS = 29.53058867;

  // A known New Moon, used purely as a reference point for counting
  // whole cycles from — not itself the subject of any claim here.
  const REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

  // The part of getMoonPhase that depends only on theta, not on any real
  // date — shared with fromAgeDays below, so a raw cycle position (as
  // used by moon-phases.html's "Explore the cycle" mode) and a real
  // calendar date always agree on illuminated fraction and waxing/waning,
  // rather than keeping two copies of the same formula.
  function fromTheta(theta) {
    const illuminatedFraction = (1 - Math.cos((theta * Math.PI) / 180)) / 2;
    const waxing = theta < 180;
    return { theta, illuminatedFraction, waxing };
  }

  function getMoonPhase(date) {
    const daysSinceReference = (date.getTime() - REFERENCE_NEW_MOON_MS) / 86400000;
    const cycles = daysSinceReference / SYNODIC_MONTH_DAYS;
    const cycleFraction = ((cycles % 1) + 1) % 1;
    const ageDays = cycleFraction * SYNODIC_MONTH_DAYS;
    const theta = cycleFraction * 360;

    return { ageDays, ...fromTheta(theta) };
  }

  // Same shape as getMoonPhase, but driven directly by an elapsed-days
  // position in the cycle (0 to SYNODIC_MONTH_DAYS) rather than a real
  // date — for exploring the cycle in the abstract, not checking a
  // specific moment.
  function fromAgeDays(ageDays) {
    const wrappedAge = ((ageDays % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
    const theta = (wrappedAge / SYNODIC_MONTH_DAYS) * 360;
    return { ageDays: wrappedAge, ...fromTheta(theta) };
  }

  function phaseName(theta) {
    const NEAR = 6; // degrees either side counted as the exact named phase
    if (theta <= NEAR || theta >= 360 - NEAR) return 'New Moon';
    if (Math.abs(theta - 90) <= NEAR) return 'First Quarter';
    if (Math.abs(theta - 180) <= NEAR) return 'Full Moon';
    if (Math.abs(theta - 270) <= NEAR) return 'Last Quarter';
    if (theta < 90) return 'Waxing Crescent';
    if (theta < 180) return 'Waxing Gibbous';
    if (theta < 270) return 'Waning Gibbous';
    return 'Waning Crescent';
  }

  return { getMoonPhase, fromAgeDays, phaseName, SYNODIC_MONTH_DAYS };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = makeMoonPhase();
} else if (typeof window !== 'undefined') {
  window.MoonPhase = makeMoonPhase();
}
