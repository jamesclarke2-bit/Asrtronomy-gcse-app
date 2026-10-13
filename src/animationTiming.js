/**
 * Shared stepping helper for every requestAnimationFrame-driven animation
 * on the site. Turns a raw rAF timestamp into a capped, real-seconds time
 * step, so a page's own rate (days per second, radians per second, ...)
 * produces the same apparent speed at 60Hz and 120Hz alike — a per-frame
 * constant instead runs twice as fast on a 120Hz screen, since rAF fires
 * once per display refresh. Capping the step also stops a tab that was
 * backgrounded (rAF pauses while hidden) from replaying the whole missed
 * gap as one huge jump the instant it's foregrounded again.
 */

const ANIMATION_TIMING_DEFAULT_MAX_STEP_MS = 100;

/**
 * now/lastTime are rAF timestamp args (DOMHighResTimeStamp, ms). Pass
 * lastTime as null on the very first frame of an animation (returns 0,
 * so nothing advances before there's a prior frame to measure from).
 */
function cappedElapsedSeconds(now, lastTime, maxStepMs) {
  if (lastTime === null || lastTime === undefined) return 0;
  const cap = maxStepMs === undefined ? ANIMATION_TIMING_DEFAULT_MAX_STEP_MS : maxStepMs;
  return Math.min(Math.max(now - lastTime, 0), cap) / 1000;
}

const animationTimingApi = {
  cappedElapsedSeconds,
  DEFAULT_MAX_STEP_MS: ANIMATION_TIMING_DEFAULT_MAX_STEP_MS,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = animationTimingApi;
} else if (typeof window !== 'undefined') {
  window.AnimationTiming = animationTimingApi;
}
