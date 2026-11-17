/**
 * Models for notes/dark-universe.html (spec 16.10-16.12).
 *
 * Rotation curve: the measured orbital speed of the Milky Way's stars and
 * gas, rising near the centre and then flat at Our Galaxy's 220 km/s
 * (src/milkyWay.js, the same figure), against what the visible matter
 * alone would give: a Plummer-sphere model whose speed peaks and then
 * falls away. Both are schematic shapes for teaching, labelled first
 * draft on the page.
 *
 * Make-up: about 5% ordinary matter, 27% dark matter and 68% dark energy,
 * general knowledge, labelled first draft on the page.
 *
 * Futures: the size of the Universe (scale factor a, today = 1) against
 * time, from the Friedmann equation with matter (Om) and dark energy
 * (OL), integrated in units of the Hubble time 1/H0, with H0 from the data
 * sheet (via src/hubbleLaw.js). Four models, from collapse to speeding up.
 */
(function () {
  const MilkyWay = typeof require !== 'undefined' ? require('./milkyWay') : window.MilkyWay;
  const HubbleLaw = typeof require !== 'undefined' ? require('./hubbleLaw') : window.HubbleLaw;

  const FLAT_KMS = MilkyWay.ROTATION_KMS;
  const SUN_KLY = MilkyWay.SUN_FROM_CENTRE_KLY;
  const MAX_KLY = 60;

  /** Measured orbital speed (km/s) at r thousand light-years: rises, then flat. */
  function measuredSpeed(rKly) {
    return FLAT_KMS * (1 - Math.exp(-rKly / 3));
  }

  // Visible matter only: a Plummer sphere, v ∝ r / (r² + a²)^(3/4), scaled
  // so its peak is a little below the flat speed.
  const PLUMMER_A_KLY = 8;
  const VISIBLE_PEAK_KMS = 210;
  const plummer = (r) => r / (r * r + PLUMMER_A_KLY * PLUMMER_A_KLY) ** 0.75;
  const PLUMMER_PEAK = plummer(PLUMMER_A_KLY * Math.SQRT2);

  function visibleSpeed(rKly) {
    return (VISIBLE_PEAK_KMS * plummer(rKly)) / PLUMMER_PEAK;
  }

  const MAKE_UP = [
    { key: 'ordinary', name: 'Ordinary matter', percent: 5 },
    { key: 'dark-matter', name: 'Dark matter', percent: 27 },
    { key: 'dark-energy', name: 'Dark energy', percent: 68 },
  ];

  const HUBBLE_TIME_GYR = HubbleLaw.ageSteps().billionYears;

  const FUTURES = [
    { key: 'crunch', name: 'Collapse: a Big Crunch', balance: 'lots of matter, no dark energy', om: 3, ol: 0 },
    { key: 'stop', name: 'Slowing almost to a stop', balance: 'just enough matter, no dark energy', om: 1, ol: 0 },
    { key: 'forever', name: 'Expanding for ever', balance: 'little matter, no dark energy', om: 0.3, ol: 0 },
    { key: 'speeding', name: 'Speeding up for ever', balance: 'little matter, lots of dark energy', om: 0.3, ol: 0.7 },
  ];
  const FAVOURED = 'speeding';

  // d²a/dt² = −Om/(2a²) + OL·a, with a = 1 and da/dt = 1 today (t in Hubble times).
  function accel(a, om, ol) {
    return -om / (2 * a * a) + ol * a;
  }

  function integrate(om, ol, dir, tMax, dt = 0.002) {
    let a = 1;
    let v = 1;
    let t = 0;
    const pts = [{ t: 0, a: 1 }];
    while (Math.abs(t) < tMax) {
      const h = dir * dt;
      const k1a = v;
      const k1v = accel(a, om, ol);
      const k2a = v + (h / 2) * k1v;
      const k2v = accel(a + (h / 2) * k1a, om, ol);
      const k3a = v + (h / 2) * k2v;
      const k3v = accel(a + (h / 2) * k2a, om, ol);
      const k4a = v + h * k3v;
      const k4v = accel(a + h * k3a, om, ol);
      a += (h / 6) * (k1a + 2 * k2a + 2 * k3a + k4a);
      v += (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
      t += h;
      if (a <= 0.02) {
        pts.push({ t, a: 0 });
        break;
      }
      pts.push({ t, a });
    }
    return pts;
  }

  /**
   * The model's size against time, in billions of years from now, from
   * its Big Bang (a = 0) to tMaxGyr in the future (or its collapse).
   */
  function futureCurve(key, tMaxGyr = 45) {
    const f = FUTURES.find((x) => x.key === key);
    const back = integrate(f.om, f.ol, -1, 3).reverse();
    const fwd = integrate(f.om, f.ol, 1, tMaxGyr / HUBBLE_TIME_GYR).slice(1);
    return [...back, ...fwd].map((p) => ({ tGyr: p.t * HUBBLE_TIME_GYR, a: p.a }));
  }

  /** How the expansion is changing today: 'slowing' or 'speeding up'. */
  function todayTrend(key) {
    const f = FUTURES.find((x) => x.key === key);
    return accel(1, f.om, f.ol) > 0 ? 'speeding up' : 'slowing';
  }

  const api = {
    FLAT_KMS,
    SUN_KLY,
    MAX_KLY,
    measuredSpeed,
    visibleSpeed,
    MAKE_UP,
    HUBBLE_TIME_GYR,
    FUTURES,
    FAVOURED,
    futureCurve,
    todayTrend,
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.DarkUniverse = api;
  }
})();
