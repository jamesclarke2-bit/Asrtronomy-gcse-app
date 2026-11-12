/**
 * The variable-star engine (src/variableStars.js) behind
 * notes/variable-stars.html: light-curve shapes, the period-luminosity
 * relation, period timing and Cepheid distances.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const V = require('../src/variableStars');
const Magnitude = require('../src/magnitude');

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

function sample(star, span = star.spanDays, n = 4000) {
  const out = [];
  for (let i = 0; i <= n; i += 1) {
    const t = (span * i) / n;
    out.push({ t, m: V.magnitudeAt(star, t) });
  }
  return out;
}

test('the six light curves span exactly their stated brightness ranges', () => {
  ['rr-lyrae', 'mira', 'algol', 'delta-cephei'].forEach((id) => {
    const s = V.galleryById(id);
    const ms = sample(s).map((x) => x.m);
    close(Math.min(...ms), s.brightest, 0.01, `${id} brightest`);
    close(Math.max(...ms), s.faintest, 0.01, `${id} faintest`);
  });
  const nova = V.galleryById('nova');
  close(Math.min(...sample(nova).map((x) => x.m)), nova.outburst.peak, 1e-9, 'nova peak');
  close(nova.outburst.quiet - nova.outburst.peak, 10, 1e-9, 'nova rises about 10 magnitudes');
  const sn = V.galleryById('supernova');
  assert.ok(sn.outburst.peak < sn.outburst.galaxy, 'the supernova outshines its galaxy at peak');
});

test('the stated periods and ranges are the ones given', () => {
  const by = (id) => V.galleryById(id);
  close(by('rr-lyrae').periodDays, 0.57, 0.01, 'RR Lyrae about half a day');
  close(by('mira').periodDays, 330, 5, 'Mira about 330 days');
  assert.ok(by('mira').faintest - by('mira').brightest >= 5, 'Mira changes by several magnitudes');
  close(by('algol').periodDays, 2.9, 0.05, 'Algol about 2.9 days');
  close(by('delta-cephei').periodDays, 5.4, 0.05, 'Delta Cephei about 5.4 days');
  assert.equal(by('nova').periodDays, undefined, 'a nova has no period');
  assert.equal(by('supernova').periodDays, undefined, 'a supernova has no period');
});

test('periodic curves repeat exactly once per period; outbursts never come back to their peak', () => {
  ['rr-lyrae', 'mira', 'algol', 'delta-cephei'].forEach((id) => {
    const s = V.galleryById(id);
    [0.1, 0.37, 0.8].forEach((f) => close(V.magnitudeAt(s, f * s.periodDays), V.magnitudeAt(s, (f + 3) * s.periodDays), 1e-9, `${id} repeats`));
  });
  ['nova', 'supernova'].forEach((id) => {
    const s = V.galleryById(id);
    const pts = sample(s);
    const peakT = pts.reduce((a, b) => (b.m < a.m ? b : a)).t;
    const after = pts.filter((x) => x.t > peakT + 5);
    for (let i = 1; i < after.length; i += 1) assert.ok(after[i].m >= after[i - 1].m - 1e-9, `${id} only fades after its peak`);
  });
});

test('a Cepheid rises quickly and falls slowly; an eclipsing binary is flat between sharp dips', () => {
  const c = V.galleryById('delta-cephei');
  assert.ok(c.riseFraction < 0.5);
  const a = V.galleryById('algol');
  const pts = sample(a, a.periodDays);
  const flat = pts.filter((x) => Math.abs(x.m - a.brightest) < 0.01).length / pts.length;
  assert.ok(flat > 0.6, `Algol is at full brightness most of the time (${flat})`);
});

test('period-luminosity: M = -2.43 log P - 1.62, longer period more luminous, read to the nearest 0.1', () => {
  close(V.absoluteMagnitudeFromPeriod(10), -4.05, 1e-9, 'P = 10');
  close(V.absoluteMagnitudeFromPeriod(1), -1.62, 1e-12, 'P = 1');
  assert.ok(V.absoluteMagnitudeFromPeriod(30) < V.absoluteMagnitudeFromPeriod(3));
  assert.equal(V.readAbsoluteMagnitude(10), -4.0);
  assert.equal(V.readAbsoluteMagnitude(20), -4.8);
  assert.equal(V.readAbsoluteMagnitude(3), -2.8);
});

test('timing several cycles: the same reading uncertainty over a longer time gives a smaller percentage uncertainty', () => {
  const one = V.periodFromTiming(1.8, 11.8, 1);
  const six = V.periodFromTiming(1.8, 61.8, 6);
  close(one.period, 10, 1e-9, 'one cycle');
  close(six.period, 10, 1e-9, 'six cycles');
  close(one.percent / six.percent, 6, 1e-9, 'six times smaller');
  close(six.uncertaintyDays * 6, 2 * V.TIME_READING_DAYS, 1e-12, 'same reading uncertainty spread over six');
});

test('worked example: LMC Cepheid, P = 10 days, m = +14.5 gives M = -4.0, m - M = 18.5, about 50,000 pc, range 45,700 to 55,000, about +/-4,600 pc', () => {
  const r = V.cepheidDistance(10, V.averageMagnitude(14.0, 15.0));
  assert.equal(r.M, -4.0);
  close(r.modulus, 18.5, 1e-9, 'm - M');
  close(r.distancePc, 50119, 1, 'distance');
  close(r.nearPc, 45709, 1, 'near');
  close(r.farPc, 54954, 1, 'far');
  close(r.uncertaintyPc, 4623, 1, 'half the range');
  close(Magnitude.absoluteFromApparent(14.5, r.distancePc), -4.0, 1e-9, 'data sheet formula agrees');
});

test('every Cepheid in the distance tool has peaks inside its own span, and Delta Cephei comes out near its parallax distance', () => {
  V.CEPHEIDS.forEach((c) => {
    const peaks = V.maximaBetween(c, 0, c.spanDays);
    assert.ok(peaks.length >= 4, c.id);
    peaks.forEach((t) => close(V.magnitudeAt(c, t), c.brightest, 1e-9, `${c.id} peak at ${t}`));
  });
  const d = V.cepheidDistance(5.37, V.averageMagnitude(3.5, 4.4));
  assert.ok(d.distancePc > 250 && d.distancePc < 330, `${d.distancePc}`);
});

test('signed magnitudes always show their sign, with a true minus', () => {
  assert.equal(V.signed(14.5), '+14.5');
  assert.equal(V.signed(-4), '−4.0');
});
