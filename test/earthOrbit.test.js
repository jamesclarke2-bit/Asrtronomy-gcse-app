const test = require('node:test');
const assert = require('node:assert/strict');
const { computeEarthOrbitAngle } = require('../src/earthOrbit');

function angleDiff(a, b) {
  const diff = Math.abs(a - b) % 360;
  return Math.min(diff, 360 - diff);
}

test('June solstice (day 171, 2026-06-21) is near 90 degrees', () => {
  assert.ok(angleDiff(computeEarthOrbitAngle(171), 90) < 1);
});

test('December solstice (day 354, 2026-12-21) is near 270 degrees', () => {
  assert.ok(angleDiff(computeEarthOrbitAngle(354), 270) < 1);
});

test('March equinox (day 79, 2026-03-21) is near 0/360 degrees', () => {
  assert.ok(angleDiff(computeEarthOrbitAngle(79), 0) < 2);
});

test('September equinox (day 264, 2026-09-22) is near 180 degrees', () => {
  assert.ok(angleDiff(computeEarthOrbitAngle(264), 180) < 2);
});

test('a shared declination before and after the June solstice resolves to different angles', () => {
  // Both ~1 month either side of the solstice have similar declination
  // magnitude; only the day-to-day trend tells them apart.
  const beforeSolstice = computeEarthOrbitAngle(140); // ~May 21, declination rising
  const afterSolstice = computeEarthOrbitAngle(202); // ~July 22, declination falling
  assert.ok(beforeSolstice < 90);
  assert.ok(afterSolstice > 90);
});

test('angle stays within [0, 360) across the whole year', () => {
  for (let day = 0; day < 365; day += 7) {
    const angle = computeEarthOrbitAngle(day);
    assert.ok(angle >= 0 && angle < 360, `day ${day} produced out-of-range angle ${angle}`);
  }
});
