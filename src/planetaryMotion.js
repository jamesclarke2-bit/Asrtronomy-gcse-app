/**
 * Simplified planetary motion: circular, coplanar, uniform-angular-speed
 * orbits for Earth and Mars, at their real approximate orbital periods
 * and mean distances from the Sun. Real orbits are elliptical (Mars's
 * especially, e ~= 0.093), so this won't match a precise ephemeris —
 * it's built to show the true shape of retrograde motion and alignment
 * geometry, which falls out of the relative angular speeds and
 * distances alone, not the fine detail of elliptical orbits.
 *
 * Reference epoch is J2000.0 (2000-01-01 12:00 UTC). Earth's mean
 * longitude there is derived from the same 280.46646 degree constant
 * solarPosition.js's L0 already uses (the Sun's own mean geometric
 * longitude, viewed from Earth, is Earth's heliocentric longitude +
 * 180 degrees) — kept internally consistent with the rest of the app
 * rather than a second, independent approximation. Mars's mean
 * longitude at epoch is the standard low-precision planetary value.
 */

const DAY_MS = 86400000;
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);

const PLANETS = {
  earth: {
    name: 'Earth',
    orbitalRadiusAU: 1.0,
    orbitalPeriodDays: 365.256,
    meanLongitudeAtJ2000Deg: 280.46646 - 180,
  },
  mars: {
    name: 'Mars',
    orbitalRadiusAU: 1.52371,
    orbitalPeriodDays: 686.98,
    meanLongitudeAtJ2000Deg: 355.45332,
  },
};

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

function normalizeDeg(deg) {
  return ((deg % 360) + 360) % 360;
}

/** Heliocentric longitude (degrees, 0-360) of a planet at the given date. */
function heliocentricLongitude(planetKey, date) {
  const planet = PLANETS[planetKey];
  const daysSinceEpoch = (date.getTime() - J2000_MS) / DAY_MS;
  const degreesPerDay = 360 / planet.orbitalPeriodDays;
  return normalizeDeg(planet.meanLongitudeAtJ2000Deg + degreesPerDay * daysSinceEpoch);
}

/** Heliocentric (x, y) position in AU, in the shared orbital plane. */
function heliocentricPosition(planetKey, date) {
  const planet = PLANETS[planetKey];
  const lonRad = toRad(heliocentricLongitude(planetKey, date));
  return { x: planet.orbitalRadiusAU * Math.cos(lonRad), y: planet.orbitalRadiusAU * Math.sin(lonRad) };
}

/**
 * The planet's apparent geocentric ecliptic longitude (degrees, 0-360)
 * as seen from Earth on the given date — its position projected against
 * the background stars. Plotting this against time is what actually
 * shows retrograde motion: even though both planets' heliocentric
 * longitudes increase steadily, the apparent longitude briefly runs
 * backwards while Earth, on the faster inner orbit, overtakes the
 * planet around opposition.
 */
function apparentGeocentricLongitude(planetKey, date) {
  const earth = heliocentricPosition('earth', date);
  const planet = heliocentricPosition(planetKey, date);
  return normalizeDeg(toDeg(Math.atan2(planet.y - earth.y, planet.x - earth.x)));
}

/**
 * Elongation: the angle, as seen from Earth, between the Sun and the
 * planet. 0 = conjunction (Sun and planet in the same direction), 180 =
 * opposition (only reachable by a planet whose orbit is bigger than
 * Earth's). Computed via the dot product between the Earth->Sun and
 * Earth->planet vectors, so it's always well-defined and in [0, 180] —
 * no direction/sign ambiguity to resolve, unlike apparent longitude.
 */
function elongationDeg(planetKey, date) {
  const earth = heliocentricPosition('earth', date);
  const planet = heliocentricPosition(planetKey, date);
  const toSun = { x: -earth.x, y: -earth.y };
  const toPlanet = { x: planet.x - earth.x, y: planet.y - earth.y };
  const magProduct = Math.hypot(toSun.x, toSun.y) * Math.hypot(toPlanet.x, toPlanet.y);
  if (magProduct === 0) return 0;
  const cosAngle = (toSun.x * toPlanet.x + toSun.y * toPlanet.y) / magProduct;
  return toDeg(Math.acos(Math.max(-1, Math.min(1, cosAngle))));
}

// A live classifier only needs a window, not an exact 0/180 crossing —
// real "conjunction"/"opposition" are informally used for the weeks
// around exact alignment too (an "opposition season"), so a few
// degrees either side reads as that state rather than flicking between
// "elongation" and "opposition" on a single day.
const CONJUNCTION_THRESHOLD_DEG = 10;
const OPPOSITION_THRESHOLD_DEG = 170;

/**
 * Classifies the current Sun-Earth-planet alignment from the same
 * geometry elongationDeg already computes:
 *   - 'conjunction': planet and Sun appear in nearly the same direction.
 *     For a planet whose orbit is smaller than Earth's (an inner planet,
 *     not modelled yet), this further splits into subtype 'inferior'
 *     (the planet is nearer Earth than the Sun is — passing between
 *     Earth and the Sun) or 'superior' (behind the Sun). Mars is an
 *     outer planet and can only ever be in the latter configuration at
 *     conjunction, so its subtype stays null — "conjunction" alone is
 *     the correct, unambiguous term for it.
 *   - 'opposition': the planet is opposite the Sun in the sky — only
 *     reachable by an outer planet, since only then can elongation
 *     approach 180 degrees.
 *   - 'elongation': neither of the above; elongationDeg is the actual
 *     current angle.
 */
function classifyAlignment(planetKey, date) {
  const planet = PLANETS[planetKey];
  const elongation = elongationDeg(planetKey, date);

  if (elongation <= CONJUNCTION_THRESHOLD_DEG) {
    let subtype = null;
    if (planet.orbitalRadiusAU < PLANETS.earth.orbitalRadiusAU) {
      const earth = heliocentricPosition('earth', date);
      const planetPos = heliocentricPosition(planetKey, date);
      const earthToPlanet = Math.hypot(planetPos.x - earth.x, planetPos.y - earth.y);
      const earthToSun = Math.hypot(earth.x, earth.y);
      subtype = earthToPlanet < earthToSun ? 'inferior' : 'superior';
    }
    return { type: 'conjunction', subtype, elongationDeg: elongation };
  }

  if (elongation >= OPPOSITION_THRESHOLD_DEG) {
    return { type: 'opposition', subtype: null, elongationDeg: elongation };
  }

  return { type: 'elongation', subtype: null, elongationDeg: elongation };
}

// The traditional 12 zodiac constellations, in order starting from the
// vernal equinox direction (0 degrees ecliptic longitude — the First
// Point of Aries). Heliocentric longitude in this module is measured
// from that same direction, so this equal 30-degree-per-sign division
// lines up with it; real constellation boundaries are irregular, but
// the traditional equal division is the standard GCSE-level simplification.
const ZODIAC_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpius',
  'Sagittarius',
  'Capricornus',
  'Aquarius',
  'Pisces',
];

/** Which zodiac constellation a given ecliptic longitude (degrees) falls in. */
function zodiacSignForLongitude(deg) {
  return ZODIAC_SIGNS[Math.floor(normalizeDeg(deg) / 30) % 12];
}

const api = {
  PLANETS,
  heliocentricLongitude,
  heliocentricPosition,
  apparentGeocentricLongitude,
  elongationDeg,
  classifyAlignment,
  CONJUNCTION_THRESHOLD_DEG,
  OPPOSITION_THRESHOLD_DEG,
  ZODIAC_SIGNS,
  zodiacSignForLongitude,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
} else if (typeof window !== 'undefined') {
  window.PlanetaryMotion = api;
}
