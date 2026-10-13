const test = require('node:test');
const assert = require('node:assert/strict');
const AnimationTiming = require('../src/animationTiming.js');

test('the first frame of an animation (lastTime null) advances by zero', () => {
  assert.equal(AnimationTiming.cappedElapsedSeconds(1000, null), 0);
});

test('a normal frame gap converts ms to seconds', () => {
  assert.equal(AnimationTiming.cappedElapsedSeconds(1016, 1000), 0.016);
  assert.equal(AnimationTiming.cappedElapsedSeconds(1008, 1000), 0.008);
});

test('a gap longer than the cap is clamped to the cap, not passed through raw', () => {
  // e.g. a backgrounded tab: rAF pauses, then fires once with a huge gap.
  assert.equal(AnimationTiming.cappedElapsedSeconds(60000, 1000, 100), 0.1);
  assert.equal(AnimationTiming.cappedElapsedSeconds(60000, 1000), AnimationTiming.DEFAULT_MAX_STEP_MS / 1000);
});

test('a non-positive gap (a timestamp that doesn\'t advance, or goes backwards) never produces a negative step', () => {
  assert.equal(AnimationTiming.cappedElapsedSeconds(1000, 1000), 0);
  assert.equal(AnimationTiming.cappedElapsedSeconds(990, 1000), 0);
});

test('the same elapsed real time gives the same total advance at 60Hz and at 120Hz', () => {
  // Simulate one second of animation at two different frame rates, each
  // frame comfortably under the default cap, and sum the per-frame value
  // changes at a fixed rate-per-second — the two totals should agree
  // (within floating-point rounding), proving the rate is frame-rate
  // independent rather than a per-frame constant that runs faster at a
  // higher refresh rate.
  const ratePerSecond = 180; // e.g. days per second, arbitrary for this check
  const totalMs = 1000;

  // Frame timestamps computed by dividing the total (not by repeatedly
  // adding a per-frame increment), so both frame rates cover exactly the
  // same 1000ms of real time with no floating-point drift at the edges.
  function totalAdvanceAtFrameRate(hz) {
    let value = 0;
    let lastTime = null;
    for (let frame = 0; frame <= hz; frame += 1) {
      const now = (frame / hz) * totalMs;
      const dt = AnimationTiming.cappedElapsedSeconds(now, lastTime);
      value += dt * ratePerSecond;
      lastTime = now;
    }
    return value;
  }

  const advance60Hz = totalAdvanceAtFrameRate(60);
  const advance120Hz = totalAdvanceAtFrameRate(120);

  assert.ok(
    Math.abs(advance60Hz - advance120Hz) < 0.01,
    `60Hz advanced ${advance60Hz}, 120Hz advanced ${advance120Hz} — these should match for the same elapsed real time`
  );
  assert.ok(Math.abs(advance60Hz - ratePerSecond) < 0.5, `expected ~${ratePerSecond} over one second, got ${advance60Hz}`);
});

test('a per-frame constant (the bug this replaces) would NOT match across frame rates, for contrast', () => {
  const perFrameConstant = 3; // what a bare "advance by N each requestAnimationFrame tick" looks like
  const framesIn1sAt60Hz = 60;
  const framesIn1sAt120Hz = 120;
  const advance60Hz = perFrameConstant * framesIn1sAt60Hz;
  const advance120Hz = perFrameConstant * framesIn1sAt120Hz;
  assert.notEqual(advance60Hz, advance120Hz, 'a per-frame constant runs at a different apparent speed per refresh rate — this is the bug the capped elapsed-time step avoids');
});
