/**
 * The two expanding-Universe models drawn on
 * notes/big-bang-steady-state.html (spec 16.7): a patch of space, the same
 * size at every step, seen at four times.
 *
 * Both models expand: every galaxy's distance from the centre grows with
 * the scale factor a. In the Big Bang model the galaxies were all there
 * from the start, so the patch begins crowded (hot and dense) and thins
 * out. In the Steady State model new galaxies form in the gaps as space
 * expands, so the number in the patch stays the same at every step.
 *
 * Positions are in drawing units from the patch's centre; the patch is a
 * square of half-width PATCH_HALF. Everything is seeded, so every visitor
 * sees the same drawing.
 */
(function () {
  const STEPS = [
    { a: 0.3, label: 'long ago' },
    { a: 0.5, label: 'later' },
    { a: 0.75, label: 'later still' },
    { a: 1, label: 'today' },
  ];
  const PATCH_HALF = 120;
  const TODAY_COUNT = 24;

  function seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function inPatch(p) {
    return Math.abs(p.x) <= PATCH_HALF && Math.abs(p.y) <= PATCH_HALF;
  }

  // Big Bang: one fixed set of galaxies whose "today" positions fill a
  // square big enough that, scaled down to step 1, they all crowd into
  // the patch.
  const BB_GALAXIES = (() => {
    const rand = seeded(17);
    const half = PATCH_HALF / STEPS[0].a;
    const out = [];
    while (out.length < Math.round((TODAY_COUNT * (half * half)) / (PATCH_HALF * PATCH_HALF))) {
      out.push({ x: (rand() * 2 - 1) * half, y: (rand() * 2 - 1) * half });
    }
    return out;
  })();

  function bigBang(stepIndex) {
    const { a } = STEPS[stepIndex];
    return BB_GALAXIES.map((g) => ({ x: g.x * a, y: g.y * a, created: 0 })).filter(inPatch);
  }

  // Steady State: start with TODAY_COUNT galaxies in the patch; at each
  // later step every galaxy moves out with the expansion, and new ones
  // are created at seeded random places until the count is back up.
  const SS_HISTORY = (() => {
    const rand = seeded(29);
    const born = [];
    const steps = [];
    STEPS.forEach((step, k) => {
      const at = () => born.map((g) => ({ x: g.x * (step.a / g.a0), y: g.y * (step.a / g.a0), created: g.created }));
      let now = at().filter(inPatch);
      while (now.length < TODAY_COUNT) {
        born.push({ x: (rand() * 2 - 1) * PATCH_HALF * 0.95, y: (rand() * 2 - 1) * PATCH_HALF * 0.95, a0: step.a, created: k });
        now = at().filter(inPatch);
      }
      steps.push(now);
    });
    return steps;
  })();

  function steadyState(stepIndex) {
    return SS_HISTORY[stepIndex];
  }

  /** The same two galaxies, marked in both panels: their gap grows with a. */
  function markedPair(stepIndex) {
    const s = STEPS[stepIndex].a / STEPS[0].a;
    return [
      { x: -14 * s, y: 8 * s },
      { x: 18 * s, y: -10 * s },
    ];
  }

  function pairGap(stepIndex) {
    const [p, q] = markedPair(stepIndex);
    return Math.hypot(p.x - q.x, p.y - q.y);
  }

  const api = { STEPS, PATCH_HALF, TODAY_COUNT, bigBang, steadyState, markedPair, pairGap, inPatch };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.BigBang = api;
  }
})();
