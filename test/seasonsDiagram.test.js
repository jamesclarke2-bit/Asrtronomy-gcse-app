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

// --- The standard textbook screen layout: solstices left/right, -----------
// equinoxes top/bottom, every Earth's axis leaning the same way (to the
// right) reading correctly at each — fixed after the 8 November teacher
// review found the old layout (equinoxes left/right, solstices top/
// bottom) made September equinox, at the screen's rightmost point, read
// as if it were Northern winter.

const cx = 200;
const cy = 150;
const rx = 80;
const ry = 50;

function screenCompassPoint(positionId) {
  const position = SeasonsDiagram.REFERENCE_POSITIONS.find((p) => p.id === positionId);
  const angle = SeasonsDiagram.screenAngleForTheta(position.theta);
  return SeasonsDiagram.orbitPoint(cx, cy, rx, ry, angle);
}

test('screenAngleForTheta places December solstice at the right, March equinox at the top, June solstice at the left, and September equinox at the bottom', () => {
  const december = screenCompassPoint('december-solstice');
  const march = screenCompassPoint('march-equinox');
  const june = screenCompassPoint('june-solstice');
  const september = screenCompassPoint('september-equinox');

  assert.ok(Math.abs(december.x - (cx + rx)) < 1e-6 && Math.abs(december.y - cy) < 1e-6, 'December solstice should be at the right');
  assert.ok(Math.abs(march.x - cx) < 1e-6 && Math.abs(march.y - (cy - ry)) < 1e-6, 'March equinox should be at the top');
  assert.ok(Math.abs(june.x - (cx - rx)) < 1e-6 && Math.abs(june.y - cy) < 1e-6, 'June solstice should be at the left');
  assert.ok(Math.abs(september.x - cx) < 1e-6 && Math.abs(september.y - (cy + ry)) < 1e-6, 'September equinox should be at the bottom');
});

test('screenAngleForTheta sweeps counterclockwise in real chronological order (March, June, September, December), as Earth genuinely orbits', () => {
  const marchAngle = SeasonsDiagram.screenAngleForTheta(0);
  const juneAngle = SeasonsDiagram.screenAngleForTheta(90);
  const septemberAngle = SeasonsDiagram.screenAngleForTheta(180);
  const decemberAngle = SeasonsDiagram.screenAngleForTheta(270);
  assert.ok(marchAngle < juneAngle && juneAngle < septemberAngle && septemberAngle < decemberAngle, 'each later date should sweep to a strictly larger counterclockwise angle');
  assert.equal(juneAngle - marchAngle, 90);
  assert.equal(septemberAngle - juneAngle, 90);
  assert.equal(decemberAngle - septemberAngle, 90);
});

test('tiltRelativeToSun: away at December solstice, towards at June solstice, sideways at both equinoxes', () => {
  assert.equal(SeasonsDiagram.tiltRelativeToSun(270), 'away', 'December solstice: the right-hand Earth leans away from the Sun');
  assert.equal(SeasonsDiagram.tiltRelativeToSun(90), 'towards', 'June solstice: the left-hand Earth leans towards the Sun');
  assert.equal(SeasonsDiagram.tiltRelativeToSun(0), 'sideways', 'March equinox: the top Earth leans sideways to the Sun');
  assert.equal(SeasonsDiagram.tiltRelativeToSun(180), 'sideways', 'September equinox: the bottom Earth leans sideways to the Sun');
});

test('tiltRelativeToSun agrees with each REFERENCE_POSITIONS entry\'s own Northern season: away means winter, towards means summer, sideways means an equinox', () => {
  SeasonsDiagram.REFERENCE_POSITIONS.forEach((position) => {
    const tilt = SeasonsDiagram.tiltRelativeToSun(position.theta);
    const broadSeason = position.northernSeason.split(' ')[0];
    if (tilt === 'away') assert.equal(broadSeason, 'Winter', `${position.id}: tilted away should be Northern winter`);
    if (tilt === 'towards') assert.equal(broadSeason, 'Summer', `${position.id}: tilted towards should be Northern summer`);
    if (tilt === 'sideways') assert.ok(broadSeason === 'Spring' || broadSeason === 'Autumn', `${position.id}: sideways should be an equinox`);
  });
});

test('tiltCaption: plain-words captions for each of the four reference positions', () => {
  const byId = Object.fromEntries(SeasonsDiagram.REFERENCE_POSITIONS.map((p) => [p.id, p]));
  assert.equal(SeasonsDiagram.tiltCaption(byId['december-solstice']), 'Tilted away from the Sun: winter');
  assert.equal(SeasonsDiagram.tiltCaption(byId['june-solstice']), 'Tilted towards the Sun: summer');
  assert.equal(SeasonsDiagram.tiltCaption(byId['march-equinox']), 'Tilted sideways to the Sun: spring equinox');
  assert.equal(SeasonsDiagram.tiltCaption(byId['september-equinox']), 'Tilted sideways to the Sun: autumn equinox');
});

test('tiltCaption: stays short enough to fit beside a solstice Earth without overflowing the diagram (see src/seasonsDiagramView.js\'s own rendering)', () => {
  const MAX_CAPTION_LENGTH = 45;
  SeasonsDiagram.REFERENCE_POSITIONS.forEach((position) => {
    const caption = SeasonsDiagram.tiltCaption(position);
    assert.ok(caption.length <= MAX_CAPTION_LENGTH, `${position.id}'s caption "${caption}" is ${caption.length} characters, over the ${MAX_CAPTION_LENGTH} budget`);
  });
});
