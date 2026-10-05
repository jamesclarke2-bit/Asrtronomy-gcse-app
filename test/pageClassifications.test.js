/**
 * Both pages that classify an orbit as bound/parabolic/hyperbolic do it
 * through GravityField.classifyOrbit with its potential-energy argument
 * (the tolerance-aware form), specifically so that a launch at exactly
 * escape speed reads as the marginal "parabolic" case rather than
 * tipping either way on floating-point noise. These tests pin that
 * behaviour down using each page's own constants — not just the generic
 * classifyOrbit checks in test/gravityField.test.js — so a future change
 * to either page can't quietly drift away from the engine it's built on.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const GravityField = require('../src/gravityField');
const OrbitalMechanics = require('../src/orbitalMechanics');

const { EARTH_MASS_KG, EARTH_RADIUS_M } = OrbitalMechanics;

// --- sims/gravitational-potential.html's escape panel -----------------------

test('gravitational-potential.html: launching at exactly escape speed from the surface classifies as parabolic', () => {
  const speed = GravityField.escapeSpeedFromEnergy(EARTH_MASS_KG, EARTH_RADIUS_M);
  const total = GravityField.totalEnergyPerMass(EARTH_MASS_KG, EARTH_RADIUS_M, speed);
  const potential = GravityField.potentialEnergyPerMass(EARTH_MASS_KG, EARTH_RADIUS_M);
  assert.equal(GravityField.classifyOrbit(total, potential), 'parabolic');
});

test('gravitational-potential.html: a little under or over escape speed still classifies as bound / hyperbolic', () => {
  const escapeSpeed = GravityField.escapeSpeedFromEnergy(EARTH_MASS_KG, EARTH_RADIUS_M);
  const potential = GravityField.potentialEnergyPerMass(EARTH_MASS_KG, EARTH_RADIUS_M);

  const totalBelow = GravityField.totalEnergyPerMass(EARTH_MASS_KG, EARTH_RADIUS_M, escapeSpeed * 0.99);
  assert.equal(GravityField.classifyOrbit(totalBelow, potential), 'bound');

  const totalAbove = GravityField.totalEnergyPerMass(EARTH_MASS_KG, EARTH_RADIUS_M, escapeSpeed * 1.01);
  assert.equal(GravityField.classifyOrbit(totalAbove, potential), 'hyperbolic');
});

// --- sims/orbits-gravity.html's Newton's cannon ------------------------------

// Mirrors orbits-gravity.js's own TOWER_HEIGHT_M/LAUNCH_RADIUS_M exactly —
// the cannon launches from 10 km above the surface, not the surface
// itself (see that file's own comment on why).
const TOWER_HEIGHT_M = 10000;
const LAUNCH_RADIUS_M = EARTH_RADIUS_M + TOWER_HEIGHT_M;

function cannonEnergyClassification(launchSpeedMPerS) {
  const total = GravityField.totalEnergyPerMass(EARTH_MASS_KG, LAUNCH_RADIUS_M, launchSpeedMPerS);
  const potential = GravityField.potentialEnergyPerMass(EARTH_MASS_KG, LAUNCH_RADIUS_M);
  return GravityField.classifyOrbit(total, potential);
}

test('orbits-gravity.html: firing Newton\'s cannon at exactly escape speed from the tower classifies as parabolic', () => {
  const escapeSpeed = OrbitalMechanics.escapeSpeed(LAUNCH_RADIUS_M, EARTH_MASS_KG);
  assert.equal(cannonEnergyClassification(escapeSpeed), 'parabolic');

  // The same check GravityField.escapeSpeedFromEnergy's own tests make
  // elsewhere: two independently-derived escape speeds for the same
  // radius should agree, so this test isn't accidentally classifying
  // the wrong speed as "escape".
  const escapeSpeedFromEnergy = GravityField.escapeSpeedFromEnergy(EARTH_MASS_KG, LAUNCH_RADIUS_M);
  const relativeError = Math.abs(escapeSpeed - escapeSpeedFromEnergy) / escapeSpeed;
  assert.ok(relativeError < 1e-9, `the two escape speeds should agree, got a relative difference of ${relativeError}`);
});

test('orbits-gravity.html: a little under or over escape speed from the tower still classifies as bound / hyperbolic', () => {
  const escapeSpeed = OrbitalMechanics.escapeSpeed(LAUNCH_RADIUS_M, EARTH_MASS_KG);
  assert.equal(cannonEnergyClassification(escapeSpeed * 0.99), 'bound');
  assert.equal(cannonEnergyClassification(escapeSpeed * 1.01), 'hyperbolic');
});

// This is the actual bug the page used to be exposed to: 1/(2/r - v²/GM)
// is numerically unstable right at v = escape speed, and could come out
// as a huge *finite* number instead of the true Infinity, which the old
// `a > 0 && Number.isFinite(a)` test would have misread as "bound".
// classifyOrbit never divides by that quantity, so it isn't exposed to
// the same instability.
test('orbits-gravity.html: the vis-viva semi-major axis itself is the unstable quantity classifyOrbit avoids relying on', () => {
  const GM = OrbitalMechanics.G * EARTH_MASS_KG;
  const escapeSpeed = OrbitalMechanics.escapeSpeed(LAUNCH_RADIUS_M, EARTH_MASS_KG);
  const denom = 2 / LAUNCH_RADIUS_M - (escapeSpeed * escapeSpeed) / GM;
  // Not asserting a specific value here — the point is that this
  // quantity is whatever floating-point noise it happens to be, and
  // classifyOrbit's result above doesn't depend on it.
  assert.ok(Number.isFinite(denom));
  assert.equal(cannonEnergyClassification(escapeSpeed), 'parabolic');
});
