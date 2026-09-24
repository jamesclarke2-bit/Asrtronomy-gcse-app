const test = require('node:test');
const assert = require('node:assert/strict');
const {
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
} = require('../src/coordinates');

function dms(deg, min) {
  return deg + min / 60;
}

function closeTo(actual, expected, tolerance, message) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message || ''} expected ${actual} to be within ${tolerance} of ${expected}`
  );
}

// --- hourAngleToDegrees -----------------------------------------------

test('hourAngleToDegrees: whole hours, minutes, seconds', () => {
  assert.equal(hourAngleToDegrees(6, 6, 0), 91.5);
  assert.equal(hourAngleToDegrees(1, 0, 0), 15);
  assert.equal(hourAngleToDegrees(0, 30, 0), 7.5);
});

test('hourAngleToDegrees: negative HA (east of meridian)', () => {
  assert.equal(hourAngleToDegrees(-6, 6, 0), -91.5);
  assert.equal(hourAngleToDegrees(0, -30, 0), -7.5);
});

// --- getLocalSiderealTime ----------------------------------------------

test('getLocalSiderealTime matches the standard J2000.0 GMST reference', () => {
  // 2000-01-01 12:00 UT at Greenwich: GMST ~= 18h41m50.5s (18.69736 h),
  // a widely cited reference value for this exact epoch.
  const lst = getLocalSiderealTime(new Date('2000-01-01T12:00:00Z'), 0);
  closeTo(lst, 18.69736, 0.001);
});

test('getLocalSiderealTime shifts by longitude/15 hours', () => {
  const greenwich = getLocalSiderealTime(new Date('2000-06-15T06:00:00Z'), 0);
  const east15 = getLocalSiderealTime(new Date('2000-06-15T06:00:00Z'), 15);
  const west15 = getLocalSiderealTime(new Date('2000-06-15T06:00:00Z'), -15);
  closeTo(((east15 - greenwich + 24) % 24), 1, 0.001);
  closeTo(((greenwich - west15 + 24) % 24), 1, 0.001);
});

// --- RA / hour angle conversion -----------------------------------------

test('raToHourAngleDegrees: RA behind LST gives positive (west, transited) HA', () => {
  closeTo(raToHourAngleDegrees(9, 10), 15, 1e-9); // 1h behind -> +15deg
});

test('raToHourAngleDegrees: RA ahead of LST gives negative (east, not yet transited) HA', () => {
  closeTo(raToHourAngleDegrees(10, 9), -15, 1e-9);
});

test('raToHourAngleDegrees handles wraparound through 24h/0h', () => {
  closeTo(raToHourAngleDegrees(23, 1), 30, 1e-9); // RA 23h, LST 1h -> transited 2h ago
});

test('raToHourAngleDegrees / hourAngleDegreesToRA round-trip', () => {
  const ra = 4.6;
  const lst = 10.7;
  const ha = raToHourAngleDegrees(ra, lst);
  closeTo(hourAngleDegreesToRA(ha, lst), ra, 1e-9);
});

// --- Validation case 1: Rome -> Oxford, Aldebaran -----------------------

test('case 1: Aldebaran HA/LST is consistent with its RA, and Oxford max altitude is 54d45m', () => {
  const lst = dms(10, 42); // 10h42m
  const ha = hourAngleToDegrees(6, 6, 0); // 6h06m, already transited (west)
  const ra = hourAngleDegreesToRA(ha, lst);
  closeTo(ra, dms(4, 36), 1 / 60); // Aldebaran's RA, ~4h36m

  const oxfordLat = dms(51, 45);
  const aldebaranDec = dms(16, 30);
  const maxAlt = getMaxAltitudeUpperTransit(oxfordLat, aldebaranDec);
  closeTo(maxAlt, dms(54, 45), 1 / 60);
});

// --- Validation case 2: Edinburgh, Polaris and Vega ----------------------

test('case 2: Polaris (treated as exactly at the NCP) reads altitude=lat, azimuth=0 for any HA', () => {
  const edinburghLat = 56;
  [0, 45, -90, 179].forEach((ha) => {
    const { altitude, azimuth } = getAltAz(90, ha, edinburghLat);
    closeTo(altitude, edinburghLat, 1e-3, `HA=${ha}`);
    closeTo(azimuth, 0, 1e-3, `HA=${ha}`);
  });
});

test('case 2: Vega near transit at Edinburgh reads altitude 72d48m, azimuth 180 (south of zenith)', () => {
  const edinburghLat = 56;
  const vegaDec = dms(38, 48);
  const { altitude, azimuth } = getAltAz(vegaDec, 0, edinburghLat);
  closeTo(altitude, dms(72, 48), 1 / 60);
  closeTo(azimuth, 180, 1e-3);
});

// --- Validation case 3: circumpolar star, transit north of zenith --------

test('case 3: NCP altitude 68 (so latitude 68), declination +70 -> upper transit altitude 88', () => {
  const lat = 68;
  const dec = 70;
  closeTo(getMaxAltitudeUpperTransit(lat, dec), 88, 1e-9);

  // getAltAz at transit (HA=0) should agree, and give azimuth 0 (north)
  // since the star transits north of the zenith (dec > lat).
  const { altitude, azimuth } = getAltAz(dec, 0, lat);
  closeTo(altitude, 88, 1e-9);
  closeTo(azimuth, 0, 1e-3);

  assert.ok(isCircumpolar(dec, lat));
});

test('case 3 reverse-solve: altitude 88 at latitude 68 gives declinations 66 and 70', () => {
  const { lower, higher } = getDeclinationFromAltitudeAndLatitude(88, 68);
  closeTo(lower, 66, 1e-9);
  closeTo(higher, 70, 1e-9);
});

test('case 3 reverse-solve: altitude 88 with declination 70 gives latitudes 68 and 72', () => {
  const { lower, higher } = getLatitudeFromAltitudeAndDeclination(88, 70);
  closeTo(lower, 68, 1e-9);
  closeTo(higher, 72, 1e-9);
});

// --- Validation case 4: Sydney, southern hemisphere -----------------------

test('case 4: Sydney (34S) at equinox noon reads altitude 56, azimuth 0 (due north)', () => {
  const sydneyLat = -34;
  const { altitude, azimuth } = getAltAz(0, 0, sydneyLat);
  closeTo(altitude, 56, 0.1);
  closeTo(azimuth, 0, 1e-3);
});

test('getAltAz general formula also holds for other southern latitudes', () => {
  // A circumpolar star for a 40S observer, near the south celestial pole.
  // Altitude must still match the general upper-transit formula, and
  // since dec (-85) < lat (-40), the transit azimuth is 180 (south of
  // the observer's zenith) by the same rule validated in case 3/4.
  const lat = -40;
  const dec = -85;
  const { altitude, azimuth } = getAltAz(dec, 0, lat);
  closeTo(altitude, getMaxAltitudeUpperTransit(lat, dec), 1e-9);
  closeTo(azimuth, 180, 1e-3);
});

// --- Validation case 5: equator ------------------------------------------

test('case 5: isCircumpolar is false for every declination at latitude 0', () => {
  [-90, -45, -1, 0, 1, 45, 89, 90].forEach((dec) => {
    assert.equal(isCircumpolar(dec, 0), false, `dec=${dec}`);
  });
});

// --- getPolarDistance -----------------------------------------------------

test('getPolarDistance', () => {
  assert.equal(getPolarDistance(90), 0);
  assert.equal(getPolarDistance(0), 90);
  assert.equal(getPolarDistance(-90), 180);
  closeTo(getPolarDistance(70), 20, 1e-9);
});

// --- isCircumpolar general sanity -----------------------------------------

test('isCircumpolar: NCP is circumpolar from any northern latitude, never visible from the south', () => {
  assert.ok(isCircumpolar(90, 51.75));
  assert.equal(isCircumpolar(-90, 51.75), false);
});

test('isCircumpolar: a star just beyond 90-lat from the pole is circumpolar, just short of it is not', () => {
  const lat = 60;
  assert.ok(isCircumpolar(31, lat)); // 90 - 60 = 30, so dec > 30 is circumpolar
  assert.equal(isCircumpolar(29, lat), false);
});

// --- getAltAz at the pole (denominator-zero guard) -------------------------

test('getAltAz at the north pole: altitude always equals declination, azimuth defaults to 0', () => {
  const { altitude, azimuth } = getAltAz(45, 30, 90);
  closeTo(altitude, 45, 1e-9);
  assert.equal(azimuth, 0);
});

// --- Sidereal day vs solar day (sims/coordinates.html's "Sidereal day
// vs solar day" section) ----------------------------------------------
// The page derives this entirely from two getLocalSiderealTime calls a
// calendar day apart, rather than any separate sidereal-rate maths of
// its own — these tests check that reuse actually produces the right,
// and date/longitude-independent, ~3m56s-4m gap.

function siderealGapHours(dateStr, lonDeg) {
  const date = new Date(dateStr);
  const nextDay = new Date(date.getTime() + 86400000);
  const lst1 = getLocalSiderealTime(date, lonDeg);
  const lst2 = getLocalSiderealTime(nextDay, lonDeg);
  return ((lst2 - lst1) % 24 + 24) % 24;
}

test('sidereal day vs solar day: LST at the same clock time gains about 3m56s (~4 min) every calendar day', () => {
  const gap = siderealGapHours('2026-06-15T06:00:00Z', 0);
  // 23h56m04s sidereal day vs 24h00m00s solar day -> ~3m56s gap, i.e.
  // 3m56s-4m00s as decimal hours (0.0654-0.0667h).
  closeTo(gap, 0.0657, 0.001, 'gap should be roughly 3m56s (0.0657h)');
  closeTo(gap * 60, 3.94, 0.06, 'gap in minutes should read as "about 4 minutes"');
});

test('sidereal day vs solar day: the gap is the same size regardless of date or longitude', () => {
  const cases = [
    ['2000-01-01T12:00:00Z', 0],
    ['2026-06-15T06:00:00Z', 0],
    ['2026-06-15T06:00:00Z', 130],
    ['2026-12-31T23:30:00Z', -45],
  ];
  const gaps = cases.map(([dateStr, lon]) => siderealGapHours(dateStr, lon));
  gaps.forEach((gap) => closeTo(gap, gaps[0], 1e-6, 'the ~4-minute gap should not depend on date or longitude'));
});
