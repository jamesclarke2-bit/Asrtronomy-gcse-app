const test = require('node:test');
const assert = require('node:assert/strict');
const { getMoonPhase, fromAgeDays, phaseName, SYNODIC_MONTH_DAYS } = require('../src/moonPhase');

test('illuminated fraction is 0 at theta=0 (new) and 1 at theta=180 (full)', () => {
  // Sanity-check the theta -> illuminated fraction formula directly,
  // independent of any real calendar date.
  const new_ = getMoonPhase(new Date(Date.UTC(2000, 0, 6, 18, 14, 0)));
  assert.ok(new_.illuminatedFraction < 0.01, `expected ~0, got ${new_.illuminatedFraction}`);

  const halfCycleMs = (SYNODIC_MONTH_DAYS / 2) * 86400000;
  const full = getMoonPhase(new Date(Date.UTC(2000, 0, 6, 18, 14, 0) + halfCycleMs));
  assert.ok(full.illuminatedFraction > 0.99, `expected ~1, got ${full.illuminatedFraction}`);
});

// Real, independently-checkable events (e.g. against timeanddate.com or any
// almanac): the 31 August 2023 "Super Blue Moon" was a real, widely-reported
// Full Moon, and 11 January 2024 was a real, widely-reported New Moon. This
// mean-synodic model is evaluated at midday UTC on each date — since
// illuminated fraction changes slowest right at new/full, being off by a
// few hours from the exact moment barely moves the result.
test('matches the real Full Moon of 31 August 2023', () => {
  const { illuminatedFraction } = getMoonPhase(new Date(Date.UTC(2023, 7, 31, 12, 0, 0)));
  assert.ok(illuminatedFraction > 0.93, `expected near-full illumination, got ${illuminatedFraction}`);
});

test('matches the real New Moon of 11 January 2024', () => {
  const { illuminatedFraction } = getMoonPhase(new Date(Date.UTC(2024, 0, 11, 12, 0, 0)));
  assert.ok(illuminatedFraction < 0.07, `expected near-zero illumination, got ${illuminatedFraction}`);
});

test('waxing is true for theta in (0, 180) and false for theta in (180, 360)', () => {
  const quarterCycleMs = (SYNODIC_MONTH_DAYS / 4) * 86400000;
  const waxingQuarter = getMoonPhase(new Date(REFERENCE_NEW_MOON() + quarterCycleMs));
  assert.equal(waxingQuarter.waxing, true);

  const waningQuarter = getMoonPhase(new Date(REFERENCE_NEW_MOON() + 3 * quarterCycleMs));
  assert.equal(waningQuarter.waxing, false);
});

test('phaseName labels the four cardinal phases and the four in-between phases', () => {
  assert.equal(phaseName(0), 'New Moon');
  assert.equal(phaseName(45), 'Waxing Crescent');
  assert.equal(phaseName(90), 'First Quarter');
  assert.equal(phaseName(135), 'Waxing Gibbous');
  assert.equal(phaseName(180), 'Full Moon');
  assert.equal(phaseName(225), 'Waning Gibbous');
  assert.equal(phaseName(270), 'Last Quarter');
  assert.equal(phaseName(315), 'Waning Crescent');
});

function REFERENCE_NEW_MOON() {
  return Date.UTC(2000, 0, 6, 18, 14, 0);
}

test('fromAgeDays agrees with getMoonPhase at the same point in the cycle', () => {
  for (const ageDays of [0, 7.4, 14.77, 22.1, 29.5]) {
    const viaAge = fromAgeDays(ageDays);
    const viaDate = getMoonPhase(new Date(REFERENCE_NEW_MOON() + ageDays * 86400000));
    assert.ok(Math.abs(viaAge.theta - viaDate.theta) < 1e-9, `theta mismatch at age ${ageDays}`);
    assert.ok(
      Math.abs(viaAge.illuminatedFraction - viaDate.illuminatedFraction) < 1e-9,
      `illuminatedFraction mismatch at age ${ageDays}`
    );
    assert.equal(viaAge.waxing, viaDate.waxing);
  }
});

test('fromAgeDays wraps ages outside [0, SYNODIC_MONTH_DAYS)', () => {
  const negative = fromAgeDays(-1);
  const wrapped = fromAgeDays(SYNODIC_MONTH_DAYS - 1);
  assert.ok(Math.abs(negative.ageDays - wrapped.ageDays) < 1e-9);

  const overLong = fromAgeDays(SYNODIC_MONTH_DAYS + 5);
  const short = fromAgeDays(5);
  assert.ok(Math.abs(overLong.ageDays - short.ageDays) < 1e-9);
});
