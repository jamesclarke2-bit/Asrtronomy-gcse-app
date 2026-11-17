/**
 * Drawing data for notes/big-bang-evidence.html (spec 16.8, 16.9).
 *
 * None of this is on the exam data sheet. The CMB temperature (2.7 K),
 * the map levels and the quasar shape are general knowledge, and the page
 * labels each one "first draft, to be checked by the teacher". The CMB
 * spectrum is drawn from Planck's law at that temperature (relative units
 * only) and its peak from Wien's law: internal drawing maths, never shown
 * to students as a given value.
 *
 * QUASAR_BINS is a schematic shape, not a real survey: none nearby,
 * rising to a peak billions of light-years away, then falling.
 *
 * The deep-field drawing and the fluctuation map are seeded, so every
 * visitor sees the same picture.
 */
(function () {
  const CMB_TEMPERATURE_K = 2.7;
  const WIEN_M_K = 2.898e-3;

  /** Planck's law for wavelength in mm, relative units. */
  function planckMm(mm, temperatureK = CMB_TEMPERATURE_K) {
    const m = mm / 1000;
    const c2 = 1.4388e-2; // hc/k, m K
    return 1 / (m ** 5 * (Math.exp(c2 / (m * temperatureK)) - 1));
  }

  function peakWavelengthMm(temperatureK = CMB_TEMPERATURE_K) {
    return (WIEN_M_K / temperatureK) * 1000;
  }

  /** Curve from minMm to maxMm, scaled so its peak is 1. */
  function cmbCurve(minMm = 0.2, maxMm = 5, steps = 120, temperatureK = CMB_TEMPERATURE_K) {
    const peak = planckMm(peakWavelengthMm(temperatureK), temperatureK);
    const pts = [];
    for (let i = 0; i <= steps; i += 1) {
      const mm = minMm + ((maxMm - minMm) * i) / steps;
      pts.push({ mm, value: planckMm(mm, temperatureK) / peak });
    }
    return pts;
  }

  // Schematic quasar counts by distance (billion light-years).
  const QUASAR_BINS = [
    { from: 0, to: 2, count: 0 },
    { from: 2, to: 4, count: 2 },
    { from: 4, to: 6, count: 6 },
    { from: 6, to: 8, count: 10 },
    { from: 8, to: 10, count: 12 },
    { from: 10, to: 12, count: 8 },
  ];

  function seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  // The deep field: a few nearer, bigger galaxies (spirals and
  // ellipticals) and many tiny, faint, distant ones, mostly irregular.
  const DEEP_FIELD = (() => {
    const rand = seeded(41);
    const near = [
      { x: 120, y: 90, r: 26, kind: 'spiral', angle: 30 },
      { x: 420, y: 230, r: 22, kind: 'elliptical', angle: -20 },
      { x: 300, y: 70, r: 16, kind: 'spiral', angle: 70 },
      { x: 520, y: 80, r: 14, kind: 'elliptical', angle: 10 },
    ].map((g) => ({ ...g, distant: false }));
    const far = [];
    while (far.length < 46) {
      const g = { x: 20 + rand() * 560, y: 20 + rand() * 280, r: 3 + rand() * 4, kind: rand() < 0.75 ? 'irregular' : 'elliptical', angle: rand() * 180, distant: true, seed: 3 + far.length };
      const clear = [...near, ...far].every((o) => Math.hypot(o.x - g.x, o.y - g.y) > o.r + g.r + 6);
      if (clear) far.push(g);
    }
    return { near, far, star: { x: 230, y: 200 } };
  })();

  // Map detail levels, coarse to fine. cells = cells across the drawn map.
  const MAP_LEVELS = [
    { id: 'early', name: 'An early, blurry map (COBE)', cells: 10 },
    { id: 'wmap', name: 'WMAP', cells: 28 },
    { id: 'planck', name: 'Planck', cells: 64 },
  ];

  // A smooth, seeded pattern of warmer and cooler patches at several
  // sizes. Finer maps average over smaller cells, so the big patches stay
  // where they were and smaller ones appear inside them.
  const WAVES = (() => {
    const rand = seeded(57);
    const out = [];
    [2, 3, 5, 8, 13, 21, 30].forEach((freq, k) => {
      for (let j = 0; j < 3; j += 1) {
        const a = rand() * Math.PI * 2;
        out.push({ fx: freq * Math.cos(a), fy: freq * Math.sin(a), phase: rand() * Math.PI * 2, amp: 1 / (1 + k * 0.6) });
      }
    });
    return out;
  })();
  const WAVE_NORM = WAVES.reduce((s, w) => s + w.amp, 0) / 2.2;

  /** Temperature pattern at (u, v) in [0, 1]², roughly -1 (cooler) to +1 (warmer). */
  function field(u, v) {
    const raw = WAVES.reduce((s, w) => s + w.amp * Math.sin(2 * Math.PI * (w.fx * u + w.fy * v) + w.phase), 0);
    return Math.max(-1, Math.min(1, raw / WAVE_NORM));
  }

  /** Cell averages for a level: rows of { u, v, value }. */
  function mapCells(levelIndex, aspect = 2) {
    const nx = MAP_LEVELS[levelIndex].cells;
    const ny = Math.round(nx / aspect);
    const sub = 3;
    const cells = [];
    for (let j = 0; j < ny; j += 1) {
      for (let i = 0; i < nx; i += 1) {
        let sum = 0;
        for (let a = 0; a < sub; a += 1) {
          for (let b = 0; b < sub; b += 1) sum += field((i + (a + 0.5) / sub) / nx, (j + (b + 0.5) / sub) / ny);
        }
        cells.push({ i, j, u: (i + 0.5) / nx, v: (j + 0.5) / ny, value: sum / (sub * sub) });
      }
    }
    return { nx, ny, cells };
  }

  const api = {
    CMB_TEMPERATURE_K,
    planckMm,
    peakWavelengthMm,
    cmbCurve,
    QUASAR_BINS,
    DEEP_FIELD,
    MAP_LEVELS,
    field,
    mapCells,
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.BigBangEvidence = api;
  }
})();
