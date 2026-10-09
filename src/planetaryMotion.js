/**
 * Simplified planetary motion: circular, coplanar, uniform-angular-speed
 * orbits for Mercury, Venus, Earth and Mars, at their real approximate
 * orbital periods and mean distances from the Sun. Real orbits are
 * elliptical (Mars's especially, e ~= 0.093, and Mercury's even more
 * so, e ~= 0.206), so this won't match a precise ephemeris — it's
 * built to show the true shape of retrograde motion and alignment
 * geometry, which falls out of the relative angular speeds and
 * distances alone, not the fine detail of elliptical orbits.
 *
 * Reference epoch is J2000.0 (2000-01-01 12:00 UTC). Earth's mean
 * longitude there is derived from the same 280.46646 degree constant
 * solarPosition.js's L0 already uses (the Sun's own mean geometric
 * longitude, viewed from Earth, is Earth's heliocentric longitude +
 * 180 degrees) — kept internally consistent with the rest of the app
 * rather than a second, independent approximation. Mars's, Mercury's
 * and Venus's mean longitudes at epoch are the standard low-precision
 * planetary values.
 */

const DAY_MS = 86400000;
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);

const PLANETS = {
  mercury: {
    name: 'Mercury',
    orbitalRadiusAU: 0.387,
    orbitalPeriodDays: 0.241 * 365.25, // ~88.1 days
    meanLongitudeAtJ2000Deg: 252.25,
  },
  venus: {
    name: 'Venus',
    orbitalRadiusAU: 0.723,
    orbitalPeriodDays: 0.615 * 365.25, // ~224.6 days
    meanLongitudeAtJ2000Deg: 181.98,
  },
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

/**
 * Signed elongation: the same angle elongationDeg computes, but signed
 * to say which side of the Sun the planet is on — positive east
 * (follows the Sun across the sky, so it sets after sunset: an evening
 * object), negative west (leads the Sun, rising before it: a morning
 * object). Ecliptic longitude increases eastward, so this is just the
 * signed difference between the planet's and the Sun's own apparent
 * geocentric longitudes, wrapped to (-180, 180].
 */
function signedElongationDeg(planetKey, date) {
  const planetLon = apparentGeocentricLongitude(planetKey, date);
  const sunLon = normalizeDeg(heliocentricLongitude('earth', date) + 180);
  const diff = planetLon - sunLon;
  return (((diff + 180) % 360) + 360) % 360 - 180;
}

/** 'inferior' (orbit smaller than Earth's — Mercury, Venus) or 'superior' (bigger — Mars and beyond). */
function planetType(planetKey) {
  return PLANETS[planetKey].orbitalRadiusAU < PLANETS.earth.orbitalRadiusAU ? 'inferior' : 'superior';
}

/**
 * The greatest possible elongation (degrees) an inferior planet's
 * circular orbit allows — the geometric limit reached when the
 * Earth-planet sightline is tangent to the planet's own orbit (a right
 * angle at the planet), giving the classic arcsin(a) result (a = the
 * planet's orbital radius in AU, Earth's own radius being 1 AU). Not
 * meaningful for a superior planet (no such limit — it can reach a
 * full 180 degrees, at opposition).
 */
function greatestElongationDeg(planetKey) {
  return toDeg(Math.asin(PLANETS[planetKey].orbitalRadiusAU));
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

// How close signed elongation needs to be to the geometric maximum
// (greatestElongationDeg) to count as actually being at that peak,
// rather than just "between" — elongation changes very slowly near the
// true peak (its rate of change is zero exactly there), so even a
// narrow degree window already spans several real days either side.
const GREATEST_ELONGATION_THRESHOLD_DEG = 1.5;

/**
 * Names the Sun-Earth-planet configuration on a given date, using the
 * vocabulary that actually matches which kind of planet it is (see
 * sims/solar-system-observation.html's "Alignments" section):
 *   - inferior planet (Mercury, Venus): 'inferior conjunction' (passing
 *     between Earth and the Sun), 'superior conjunction' (behind the
 *     Sun), 'greatest eastern elongation', 'greatest western
 *     elongation', or 'between' — opposition is geometrically
 *     impossible for it (elongation can never reach past
 *     greatestElongationDeg).
 *   - superior planet (Mars and beyond): 'conjunction' (behind the
 *     Sun — the only kind it can have), 'opposition', or 'between'.
 */
function configurationName(planetKey, date) {
  const elongation = elongationDeg(planetKey, date);

  if (planetType(planetKey) === 'inferior') {
    if (elongation <= CONJUNCTION_THRESHOLD_DEG) {
      const earth = heliocentricPosition('earth', date);
      const planetPos = heliocentricPosition(planetKey, date);
      const earthToPlanet = Math.hypot(planetPos.x - earth.x, planetPos.y - earth.y);
      const earthToSun = Math.hypot(earth.x, earth.y);
      return earthToPlanet < earthToSun ? 'inferior conjunction' : 'superior conjunction';
    }
    const maxElongation = greatestElongationDeg(planetKey);
    const signed = signedElongationDeg(planetKey, date);
    if (signed >= maxElongation - GREATEST_ELONGATION_THRESHOLD_DEG) return 'greatest eastern elongation';
    if (signed <= -(maxElongation - GREATEST_ELONGATION_THRESHOLD_DEG)) return 'greatest western elongation';
    return 'between';
  }

  if (elongation <= CONJUNCTION_THRESHOLD_DEG) return 'conjunction';
  if (elongation >= OPPOSITION_THRESHOLD_DEG) return 'opposition';
  return 'between';
}

/**
 * When the planet is actually worth looking for, derived from the
 * signed elongation (see sims/solar-system-observation.html's "When to
 * view" section): opposition means it's up all night; any conjunction
 * means it's lost in the Sun's glare; otherwise, east of the Sun
 * (positive signed elongation) is an evening object, west (negative) a
 * morning one.
 */
function bestSeen(planetKey, date) {
  const configuration = configurationName(planetKey, date);
  if (configuration === 'opposition') return 'all night';
  if (configuration === 'conjunction' || configuration === 'inferior conjunction' || configuration === 'superior conjunction') {
    return "lost in the Sun's glare";
  }
  return signedElongationDeg(planetKey, date) >= 0 ? 'evening sky' : 'morning sky';
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
  signedElongationDeg,
  planetType,
  greatestElongationDeg,
  classifyAlignment,
  configurationName,
  bestSeen,
  CONJUNCTION_THRESHOLD_DEG,
  OPPOSITION_THRESHOLD_DEG,
  GREATEST_ELONGATION_THRESHOLD_DEG,
  ZODIAC_SIGNS,
  zodiacSignForLongitude,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
} else if (typeof window !== 'undefined') {
  window.PlanetaryMotion = api;
}
