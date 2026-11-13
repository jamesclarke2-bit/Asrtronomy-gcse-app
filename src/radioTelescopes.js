/**
 * Radio telescopes, for notes/radio-telescopes.html.
 *
 * Resolution reuses TelescopeModel.resolutionArcsec (src/telescopeModel.js,
 * notes/telescopes.html's own engine): the smallest angle a dish can
 * separate grows with wavelength / diameter. The page states this
 * qualitatively, as the spec does; the numbers only drive the pictures and
 * the comparisons ("an optical telescope sees the same detail with a lens
 * only this wide").
 *
 * Also here: a made-up patch of radio sky that a single dish scans one
 * point at a time, and a made-up array of five dishes whose pairs sweep
 * round as the Earth turns, filling in the giant dish they act like
 * (aperture synthesis).
 */
(function () {
  const isNode = typeof require !== 'undefined' && typeof module !== 'undefined';
  const TelescopeModel = isNode ? require('./telescopeModel') : window.TelescopeModel;

  /** Yellow-green light, the middle of the visible range, in nm. */
  const OPTICAL_NM = 550;
  /** The radio wavelength given out by cold hydrogen gas, in m. */
  const HYDROGEN_LINE_M = 0.21;
  /** The Earth turns 360 degrees in about 24 hours. */
  const DEGREES_PER_HOUR = 15;

  /** Smallest angle (arcseconds) a dish of diameterM can separate at wavelengthM. */
  function resolutionArcsec(wavelengthM, diameterM) {
    return TelescopeModel.resolutionArcsec(wavelengthM * 1e9, diameterM * 1000);
  }

  /** wavelength / diameter: the smaller it is, the finer the detail. */
  function detailRatio(wavelengthM, diameterM) {
    return wavelengthM / diameterM;
  }

  /** The optical lens (diameter, m) that sees the same detail in yellow-green light. */
  function equivalentOpticalDiameterM(wavelengthM, diameterM, opticalNm = OPTICAL_NM) {
    return (diameterM * opticalNm * 1e-9) / wavelengthM;
  }

  /** The radio dish (diameter, m) needed to match an optical telescope's detail. */
  function dishNeededM(wavelengthM, opticalDiameterM, opticalNm = OPTICAL_NM) {
    return (opticalDiameterM * wavelengthM) / (opticalNm * 1e-9);
  }

  /**
   * A slider position 0-100 on a log scale from min to max (each 50
   * steps is a factor of max/min's square root): 0 gives min, 100 max.
   */
  function logSlider(position, min, max) {
    return min * Math.pow(max / min, position / 100);
  }

  /** The inverse of logSlider, rounded to a whole slider step. */
  function logSliderPosition(value, min, max) {
    return Math.round((100 * Math.log(value / min)) / Math.log(max / min));
  }

  const DIAMETER_RANGE_M = { min: 10, max: 1000 };
  const WAVELENGTH_RANGE_M = { min: 0.01, max: 1 };
  /** The two sources in the "two sources" picture, this far apart on the sky. */
  const SOURCE_SEPARATION_ARCSEC = 600;

  /** Do two sources this far apart show as two, or merge into one blob? */
  function separates(wavelengthM, diameterM, separationArcsec = SOURCE_SEPARATION_ARCSEC) {
    return resolutionArcsec(wavelengthM, diameterM) <= separationArcsec;
  }

  // ---- Scanning: a single dish builds a picture one point at a time ----

  /** A made-up patch of radio sky: a bright centre with two fainter lobes either side. */
  const SKY_SOURCES = [
    { x: 0.5, y: 0.5, width: 0.07, strength: 1 },
    { x: 0.2, y: 0.36, width: 0.11, strength: 0.6 },
    { x: 0.8, y: 0.64, width: 0.11, strength: 0.6 },
  ];

  /** Radio signal strength 0-1 at (x, y), both 0-1 across the patch. */
  function skySignal(x, y) {
    let s = 0;
    SKY_SOURCES.forEach((src) => {
      const d2 = (x - src.x) ** 2 + (y - src.y) ** 2;
      s += src.strength * Math.exp(-d2 / (2 * src.width * src.width));
    });
    return Math.min(1, s);
  }

  /**
   * The first `steps` points of a raster scan (left to right along each
   * row, row after row) across a cols x rows grid, each with its signal.
   */
  function scan(cols, rows, steps) {
    const out = [];
    const n = Math.min(steps, cols * rows);
    for (let k = 0; k < n; k += 1) {
      const col = k % cols;
      const row = Math.floor(k / cols);
      out.push({ col, row, signal: skySignal((col + 0.5) / cols, (row + 0.5) / rows) });
    }
    return out;
  }

  // ---- Aperture synthesis --------------------------------------------

  /** A made-up array: five dishes, positions in km. */
  const DEMO_ARRAY_KM = [
    { x: -12, y: 1 },
    { x: -5, y: -3 },
    { x: 0, y: 2 },
    { x: 6, y: -1 },
    { x: 11, y: 3 },
  ];
  const DEMO_DISH_M = 25;

  /** Every pair of dishes, with the separation (baseline) between them. */
  function baselines(dishes) {
    const out = [];
    for (let i = 0; i < dishes.length; i += 1) {
      for (let j = i + 1; j < dishes.length; j += 1) {
        const dx = dishes[j].x - dishes[i].x;
        const dy = dishes[j].y - dishes[i].y;
        out.push({ i, j, dx, dy, length: Math.hypot(dx, dy) });
      }
    }
    return out;
  }

  /** The array acts like one dish as wide as its farthest-apart pair. */
  function longestBaselineKm(dishes) {
    return Math.max(...baselines(dishes).map((b) => b.length));
  }

  /**
   * Where each pair's separation points (seen from the source) as the
   * Earth turns for `hours`: each baseline swings round, and so does its
   * mirror image, tracing arcs that fill in the giant dish. Points are
   * relative to the giant dish's centre, in km. The source is taken to be
   * straight above the Earth's axis, so each arc is part of a circle.
   */
  function tracks(dishes, hours, stepDeg = 3) {
    const sweep = hours * DEGREES_PER_HOUR;
    return baselines(dishes).map((b) => {
      const points = [];
      for (let a = 0; a <= sweep + 1e-9; a += stepDeg) {
        const r = (a * Math.PI) / 180;
        const x = b.dx * Math.cos(r) - b.dy * Math.sin(r);
        const y = b.dx * Math.sin(r) + b.dy * Math.cos(r);
        points.push({ x, y });
      }
      return { pair: [b.i, b.j], length: b.length, points, mirror: points.map((p) => ({ x: -p.x, y: -p.y })) };
    });
  }

  /**
   * How much of the giant dish the tracks have filled in after `hours`:
   * the fraction of a grid of cells inside the giant dish that some track
   * point (or its mirror) has landed in.
   */
  function coverageFraction(dishes, hours, cells = 24) {
    const R = longestBaselineKm(dishes);
    const size = (2 * R) / cells;
    const hit = new Set();
    let inside = 0;
    for (let i = 0; i < cells; i += 1) {
      for (let j = 0; j < cells; j += 1) {
        const cx = -R + (i + 0.5) * size;
        const cy = -R + (j + 0.5) * size;
        if (Math.hypot(cx, cy) <= R) inside += 1;
      }
    }
    tracks(dishes, hours, 1).forEach((t) => {
      [...t.points, ...t.mirror].forEach((p) => {
        const i = Math.min(cells - 1, Math.floor((p.x + R) / size));
        const j = Math.min(cells - 1, Math.floor((p.y + R) / size));
        hit.add(`${i},${j}`);
      });
    });
    return hit.size / inside;
  }

  const api = {
    OPTICAL_NM,
    HYDROGEN_LINE_M,
    DEGREES_PER_HOUR,
    DIAMETER_RANGE_M,
    WAVELENGTH_RANGE_M,
    SOURCE_SEPARATION_ARCSEC,
    SKY_SOURCES,
    DEMO_ARRAY_KM,
    DEMO_DISH_M,
    resolutionArcsec,
    detailRatio,
    equivalentOpticalDiameterM,
    dishNeededM,
    logSlider,
    logSliderPosition,
    separates,
    skySignal,
    scan,
    baselines,
    longestBaselineKm,
    tracks,
    coverageFraction,
  };

  if (isNode && module.exports) {
    module.exports = api;
  } else {
    window.RadioTelescopes = api;
  }
})();
