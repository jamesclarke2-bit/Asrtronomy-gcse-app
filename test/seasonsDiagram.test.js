const test = require('node:test');
const assert = require('node:assert/strict');
const SeasonsDiagram = require('../src/seasonsDiagram');
const SolarPosition = require('../src/solarPosition');

// Same reference day indices test/earthOrbit.test.js already establishes
// land within ~1-2 degrees of the four key angles.
const JUNE_SOLSTICE_DAY = 171;
const DECEMBER_SOLSTICE_DAY = 354;
const MARCH_EQUINOX_DAY = 79;
const SEPTEMBER_EQUINOX_DAY = 264;

test('REFERENCE_POSITIONS has exactly the four key positions, each with the correct date and hemisphere-season labels', () => {
  const byId = Object.fromEntries(SeasonsDiagram.REFERENCE_POSITIONS.map((p) => [p.id, p]));
  assert.equal(SeasonsDiagram.REFERENCE_POSITIONS.length, 4);

  assert.equal(byId['march-equinox'].theta, 0);
  assert.equal(byId['march-equinox'].dateLabel, 'March equinox');
  assert.equal(byId['march-equinox'].northernSeason, 'Spring equinox');
  assert.equal(byId['march-equinox'].southernSeason, 'Autumn equinox');

  assert.equal(byId['june-solstice'].theta, 90);
  assert.equal(byId['june-solstice'].dateLabel, 'June solstice');
  assert.equal(byId['june-solstice'].northernSeason, 'Summer solstice');
  assert.equal(byId['june-solstice'].southernSeason, 'Winter solstice');

  assert.equal(byId['september-equinox'].theta, 180);
  assert.equal(byId['september-equinox'].dateLabel, 'September equinox');
  assert.equal(byId['september-equinox'].northernSeason, 'Autumn equinox');
  assert.equal(byId['september-equinox'].southernSeason, 'Spring equinox');

  assert.equal(byId['december-solstice'].theta, 270);
  assert.equal(byId['december-solstice'].dateLabel, 'December solstice');
  assert.equal(byId['december-solstice'].northernSeason, 'Winter solstice');
  assert.equal(byId['december-solstice'].southernSeason, 'Summer solstice');
});

test('the two hemispheres are always opposite seasons, never both summer/winter or both spring/autumn, at every reference position', () => {
  const OPPOSITE = { Spring: 'Autumn', Summer: 'Winter', Autumn: 'Spring', Winter: 'Summer' };
  SeasonsDiagram.REFERENCE_POSITIONS.forEach((p) => {
    const northernBroad = p.northernSeason.split(' ')[0];
    const southernBroad = p.southernSeason.split(' ')[0];
    assert.equal(southernBroad, OPPOSITE[northernBroad], `${p.id}: ${p.northernSeason} / ${p.southernSeason} should be opposite seasons`);
  });
});

test('seasonsForTheta agrees with REFERENCE_POSITIONS at each exact reference angle', () => {
  SeasonsDiagram.REFERENCE_POSITIONS.forEach((p) => {
    const { northernSeason, southernSeason } = SeasonsDiagram.seasonsForTheta(p.theta);
    assert.ok(p.northernSeason.startsWith(northernSeason), `${p.id}: broad season "${northernSeason}" should prefix "${p.northernSeason}"`);
    assert.ok(p.southernSeason.startsWith(southernSeason), `${p.id}: broad season "${southernSeason}" should prefix "${p.southernSeason}"`);
  });
});

test('seasonsForTheta: the four quarters are correctly bounded, including wraparound past 360', () => {
  assert.deepEqual(SeasonsDiagram.seasonsForTheta(0), { northernSeason: 'Spring', southernSeason: 'Autumn' });
  assert.deepEqual(SeasonsDiagram.seasonsForTheta(45), { northernSeason: 'Spring', southernSeason: 'Autumn' });
  assert.deepEqual(SeasonsDiagram.seasonsForTheta(90), { northernSeason: 'Summer', southernSeason: 'Winter' });
  assert.deepEqual(SeasonsDiagram.seasonsForTheta(180), { northernSeason: 'Autumn', southernSeason: 'Spring' });
  assert.deepEqual(SeasonsDiagram.seasonsForTheta(270), { northernSeason: 'Winter', southernSeason: 'Summer' });
  assert.deepEqual(SeasonsDiagram.seasonsForTheta(359), { northernSeason: 'Winter', southernSeason: 'Summer' });
  assert.deepEqual(SeasonsDiagram.seasonsForTheta(360), { northernSeason: 'Spring', southernSeason: 'Autumn' });
  assert.deepEqual(SeasonsDiagram.seasonsForTheta(-10), SeasonsDiagram.seasonsForTheta(350));
});

test('seasonsAtDayIndex at the four real reference dates gives the broad season the 4-position table itself expects', () => {
  assert.equal(SeasonsDiagram.seasonsAtDayIndex(JUNE_SOLSTICE_DAY).northernSeason, 'Summer');
  assert.equal(SeasonsDiagram.seasonsAtDayIndex(DECEMBER_SOLSTICE_DAY).northernSeason, 'Winter');
  assert.equal(SeasonsDiagram.seasonsAtDayIndex(MARCH_EQUINOX_DAY).northernSeason, 'Spring');
  // A couple of days past the equinox itself (computeEarthOrbitAngle(264)
  // lands at ~179.5°, a hair before the 180° boundary — so day 264 is
  // still technically the tail end of "Summer" by this function's own
  // correct quarter-boundary logic; day 266 is safely inside Autumn).
  assert.equal(SeasonsDiagram.seasonsAtDayIndex(SEPTEMBER_EQUINOX_DAY + 2).northernSeason, 'Autumn');
});

test('noonAltitudeDeg: the standard 90 - |lat - declination| transit formula', () => {
  assert.equal(SeasonsDiagram.noonAltitudeDeg(0, 51.5), 38.5);
  assert.equal(SeasonsDiagram.noonAltitudeDeg(23.5, 51.5), 62);
  assert.equal(SeasonsDiagram.noonAltitudeDeg(-23.5, 51.5), 15);
  assert.equal(SeasonsDiagram.noonAltitudeDeg(0, 0), 90, 'the Sun is overhead at the equator on an equinox');
});

test('noonAltitudeDeg matches SolarPosition.getSunPosition at exact transit (hour angle 0)', () => {
  const date = new Date(Date.UTC(2026, 5, 21, 12, 0)); // near June solstice
  const lat = 40;
  const { declination, altitude } = SolarPosition.getSunPosition(date, lat, 0);
  assert.ok(Math.abs(SeasonsDiagram.noonAltitudeDeg(declination, lat) - altitude) < 0.5);
});

test('dayLengthMinutes matches SolarPosition.getSunriseSunset directly, for several dates and latitudes', () => {
  const cases = [
    { dayIndex: JUNE_SOLSTICE_DAY, lat: 51.5 },
    { dayIndex: DECEMBER_SOLSTICE_DAY, lat: 51.5 },
    { dayIndex: MARCH_EQUINOX_DAY, lat: 0 },
    { dayIndex: JUNE_SOLSTICE_DAY, lat: 70 }, // polar day territory
  ];
  cases.forEach(({ dayIndex, lat }) => {
    const date = new Date(Date.UTC(2026, 0, 1, 12, 0));
    date.setUTCDate(date.getUTCDate() + dayIndex);
    const expected = SolarPosition.getSunriseSunset(date, lat, 0).dayLengthMinutes;
    assert.equal(SeasonsDiagram.dayLengthMinutes(date, lat), expected);
  });
});

test('June solstice gives the Northern hemisphere its longest day and the Southern its shortest, at a mid latitude', () => {
  const date = new Date(Date.UTC(2026, 0, 1, 12, 0));
  date.setUTCDate(date.getUTCDate() + JUNE_SOLSTICE_DAY);
  const northernDayLength = SeasonsDiagram.dayLengthMinutes(date, 51.5);
  const southernDayLength = SeasonsDiagram.dayLengthMinutes(date, -51.5);
  assert.ok(northernDayLength > 12 * 60, 'Northern hemisphere day should be longer than 12 hours at the June solstice');
  assert.ok(southernDayLength < 12 * 60, 'Southern hemisphere day should be shorter than 12 hours at the June solstice');
});

test('orbitPoint places the four reference angles at the expected screen compass points (counterclockwise, viewed from the north)', () => {
  const cx = 100;
  const cy = 100;
  const rx = 50;
  const ry = 30;
  const right = SeasonsDiagram.orbitPoint(cx, cy, rx, ry, 0);
  const top = SeasonsDiagram.orbitPoint(cx, cy, rx, ry, 90);
  const left = SeasonsDiagram.orbitPoint(cx, cy, rx, ry, 180);
  const bottom = SeasonsDiagram.orbitPoint(cx, cy, rx, ry, 270);

  assert.ok(Math.abs(right.x - (cx + rx)) < 1e-6 && Math.abs(right.y - cy) < 1e-6);
  assert.ok(Math.abs(top.x - cx) < 1e-6 && Math.abs(top.y - (cy - ry)) < 1e-6);
  assert.ok(Math.abs(left.x - (cx - rx)) < 1e-6 && Math.abs(left.y - cy) < 1e-6);
  assert.ok(Math.abs(bottom.x - cx) < 1e-6 && Math.abs(bottom.y - (cy + ry)) < 1e-6);
});
