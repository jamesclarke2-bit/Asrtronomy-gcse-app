/**
 * Practice questions for sims/gravity-field-map.html — beyond the GCSE
 * spec (A-level extension), so every question here is tagged with one
 * of this page's own `level: 'extension'` curriculum ids (u3.28, u3.29
 * — see src/curriculum.js), never a real GCSE spec point.
 *
 * Every number is computed live from src/gravityField.js, the same
 * engine the page's own map and mass-ratio explorer use, so a question
 * can never quote a figure the page itself would disagree with.
 *
 * Tolerances: 2% for the zero-field point (an exact closed-form
 * two-body calculation — GravityField.zeroFieldPointBetween), 5% for
 * anything that's a Lagrange-point *distance* (L1, L2 — found
 * numerically, and genuinely more sensitive to exactly which mass and
 * distance figures are plugged in). test/gravityFieldMapQuestions.test.js
 * checks every numeric question against two independently-reasonable
 * sets of constants (this module's own OrbitalMechanics/Tides figures,
 * and a second, slightly different textbook rounding) to confirm these
 * tolerances are actually wide enough for that, not just wide enough
 * to pass by coincidence.
 */

function makeQuestions(GravityField, OrbitalMechanics, Tides) {
  const M_EARTH = OrbitalMechanics.EARTH_MASS_KG;
  const M_MOON = Tides.MOON_MASS_KG;
  const EARTH_MOON_DISTANCE = Tides.MOON_DISTANCE_KM * 1000;
  const M_SUN = OrbitalMechanics.SOLAR_MASS_KG;
  const SUN_EARTH_DISTANCE = OrbitalMechanics.AU_M;

  const earth = { mass: M_EARTH, x: 0, y: 0 };
  const moon = { mass: M_MOON, x: EARTH_MOON_DISTANCE, y: 0 };
  const zeroFieldPoint = GravityField.zeroFieldPointBetween(earth, moon);

  const lagrangeEM = GravityField.collinearLagrangePoints(M_EARTH, M_MOON, EARTH_MOON_DISTANCE);
  const lagrangeSE = GravityField.collinearLagrangePoints(M_SUN, M_EARTH, SUN_EARTH_DISTANCE);
  const l1FractionSE = (100 * lagrangeSE.L1.distanceFromSmaller) / SUN_EARTH_DISTANCE;

  const earthMoonRatio = M_EARTH / M_MOON;
  const stabilityThreshold = GravityField.lagrangeStabilityMassRatioThreshold();

  const potentialAtZero = GravityField.potentialAt([earth, moon], { x: zeroFieldPoint.x, y: zeroFieldPoint.y });
  const totalAtZero = GravityField.kineticEnergyPerMass(0) + potentialAtZero;
  const zeroPointClassification = GravityField.classifyOrbit(totalAtZero, potentialAtZero);

  return [
    {
      id: 'em-zero-field-distance',
      units: ['u3.28'],
      type: 'number',
      unitLabel: 'km',
      prompt: `Using Newton's law of gravitation (G = 6.6743×10⁻¹¹ N·m²/kg²), find the distance from Earth's centre to the zero-field point on the line to the Moon — where Earth's and the Moon's gravitational pulls exactly cancel. Use Earth's mass M₁ = 5.97×10²⁴ kg, the Moon's mass M₂ = 7.342×10²² kg, and an Earth-Moon distance of 384,400 km.`,
      check(value) {
        const correctKm = zeroFieldPoint.distanceFromA / 1000;
        const correct = Math.abs(value - correctKm) / correctKm < 0.02;
        return {
          correct,
          message: `The two pulls cancel where GM₁/r₁² = GM₂/r₂², with r₁ + r₂ = 384,400 km — giving r₁ ≈ ${correctKm.toFixed(0)} km from Earth (about ${(correctKm / 1000).toFixed(0)},000 km). That's closer to the Moon than the midpoint, because Earth's far larger mass needs a correspondingly larger share of the distance to balance the Moon's much weaker pull.`,
        };
      },
    },
    {
      id: 'zero-field-vs-l1',
      units: ['u3.28', 'u3.29'],
      type: 'choice',
      prompt:
        'The zero-field point (about 346,000 km from Earth) and the Earth-Moon L1 point (about 326,000 km from Earth) are close, but not the same point, and L1 is always the closer one to Earth. Why?',
      options: [
        'They are the same point really — the ~20,000 km gap is just rounding error in the calculation',
        "L1 is defined in the frame rotating with the Moon: there, the Moon's pull only needs to partly cancel Earth's (not fully) for the remaining net pull to supply exactly the centripetal force needed to orbit in step with the Moon once a lunar month — and that balance happens a little nearer Earth than where the two pulls cancel completely",
        'L1 is further from Earth in reality; this page has the distances swapped by mistake',
        'The Moon is slightly off-centre from the Earth-Moon line, which shifts L1 relative to the zero-field point',
      ],
      check(value) {
        const correct =
          value ===
          "L1 is defined in the frame rotating with the Moon: there, the Moon's pull only needs to partly cancel Earth's (not fully) for the remaining net pull to supply exactly the centripetal force needed to orbit in step with the Moon once a lunar month — and that balance happens a little nearer Earth than where the two pulls cancel completely";
        return {
          correct,
          message:
            "At the zero-field point, net force is exactly zero — a mass there, viewed from outside the rotating system, isn't accelerating at all, so it can't stay in step with the Moon's own month-long orbit; it drifts away from the Earth-Moon line instead. L1 asks a different question: how far from Earth does the net inward pull equal exactly what's needed to keep something orbiting with the Moon's own period? Since some inward pull is still wanted (not zero), L1 sits where the Moon has only partly cancelled Earth's pull — nearer Earth than full cancellation.",
        };
      },
    },
    {
      id: 'em-l1-distance',
      units: ['u3.29'],
      type: 'number',
      unitLabel: 'km',
      prompt: `Using the same masses and distance as above (Earth M₁ = 5.97×10²⁴ kg, Moon M₂ = 7.342×10²² kg, Earth-Moon distance 384,400 km, G = 6.6743×10⁻¹¹ N·m²/kg²), what is the distance from Earth's centre to the Earth-Moon L1 point — the point, in the frame rotating with the Moon, where a body orbits Earth in exactly one lunar month, in line with the Moon?`,
      check(value) {
        const correctKm = lagrangeEM.L1.distanceFromLarger / 1000;
        const correct = Math.abs(value - correctKm) / correctKm < 0.05;
        return {
          correct,
          message: `L1 sits about ${correctKm.toFixed(0)} km from Earth — found here by solving for where the net acceleration in the rotating frame (Earth's pull, the Moon's pull, and the centrifugal term) is exactly zero, not by quoting an approximate formula. A 5% tolerance here, wider than the zero-field point's 2%, is because this answer does depend on the mass ratio used, not just on a fixed closed-form ratio of distances.`,
        };
      },
    },
    {
      id: 'se-l1-fraction',
      units: ['u3.29'],
      type: 'number',
      unitLabel: '%',
      prompt: `The Sun-Earth system's L1 and L2 points sit remarkably close to Earth, as a fraction of the full Sun-Earth distance. Using the Sun's mass M = 1.98847×10³⁰ kg, Earth's mass m = 5.97×10²⁴ kg, a Sun-Earth distance of 1 AU = 1.496×10⁸ km and G = 6.6743×10⁻¹¹ N·m²/kg², what percentage of the Sun-Earth distance is the distance from Earth to L1?`,
      check(value) {
        const correct = Math.abs(value - l1FractionSE) / l1FractionSE < 0.05;
        return {
          correct,
          message: `L1 sits only about ${l1FractionSE.toFixed(1)}% of the Sun-Earth distance from Earth — roughly 1.5 million km, against the full 150 million km — which is exactly why the map needs a zoom control centred on Earth: at the full system's scale, L1 and L2 would sit visually right on top of Earth itself.`,
        };
      },
    },
    {
      id: 'lagrange-stability-threshold',
      units: ['u3.29'],
      type: 'choice',
      prompt:
        "Routh's criterion gives a larger-mass/smaller-mass ratio above which the L4 and L5 points become stable. Roughly what is that threshold ratio?",
      options: ['About 2.5', 'About 25', 'About 250', 'About 2,500'],
      check(value) {
        const correct = value === 'About 25';
        return {
          correct,
          message: `The exact threshold works out to about ${stabilityThreshold.toFixed(1)} (from μ < ½(1 - √(23/27)), where μ is the smaller body's share of the total mass) — "about 25" in the usual larger/smaller form. Below that ratio, L4 and L5 are unstable; above it, they're stable. The mass-ratio explorer below lets you watch the "stable"/"unstable" label actually flip right at this value, rather than just stating it.`,
        };
      },
    },
    {
      id: 'em-l4l5-stability',
      units: ['u3.29'],
      type: 'choice',
      prompt:
        "The real Earth-Moon mass ratio is about 81. Given Routh's threshold of about 25, are the Earth-Moon system's L4 and L5 points predicted to be stable?",
      options: [
        'Yes — 81 is comfortably above the ≈25 threshold, so L4 and L5 are stable',
        'No — 81 is below the threshold, so they are unstable',
        'It depends on the Moon\'s orbital eccentricity, which this threshold ignores entirely',
        'The threshold only applies to the Sun-Earth system, not Earth-Moon',
      ],
      check(value) {
        const correct = value === 'Yes — 81 is comfortably above the ≈25 threshold, so L4 and L5 are stable';
        return {
          correct,
          message: `isEquilateralPointStable(Earth's mass, the Moon's mass) returns true: the real ratio, about ${earthMoonRatio.toFixed(0)}, clears the ≈25 threshold with room to spare — consistent with real dust and small trojan objects actually being found near the Earth-Moon L4 and L5 points.`,
        };
      },
    },
    {
      id: 'coriolis-role',
      units: ['u3.29'],
      type: 'choice',
      prompt:
        "A test mass sits near a stable L4 point — a 'hill' (local maximum) of the effective potential, not a valley. What actually keeps it oscillating nearby instead of sliding straight off down the hill?",
      options: [
        'Friction with the thin interplanetary medium slows it down before it can slide far',
        "The Coriolis force — present only because the frame is rotating, it acts on any velocity the mass picks up as it starts to slide, curving its path back around rather than letting it coast straight away down the slope",
        'Nothing really does — L4 and L5 are only "stable" in an idealised sense that ignores any real drift',
        "The equilateral triangle shape itself provides a restoring force, independent of rotation",
      ],
      check(value) {
        const correct =
          value ===
          "The Coriolis force — present only because the frame is rotating, it acts on any velocity the mass picks up as it starts to slide, curving its path back around rather than letting it coast straight away down the slope";
        return {
          correct,
          message:
            "The effective potential alone (gravity plus the centrifugal term) really is a hill at a stable L4 or L5 — gravity and the centrifugal push together would just slide a displaced mass away. What saves it is a force the effective-potential picture leaves out: the Coriolis force, which only acts once the mass has some velocity in the rotating frame, and always curves that motion sideways rather than radially. Below the mass-ratio threshold, Coriolis curving isn't strong enough to turn the slide into a stable loop; above it, it is — which is the whole reason the stable/unstable label depends on mass ratio at all, not on the hill's shape (which is pure geometry, unchanged by mass ratio).",
        };
      },
    },
    {
      id: 'zero-field-bound-or-escaping',
      units: ['u3.28'],
      type: 'choice',
      prompt:
        'A test mass sits momentarily at rest right at the Earth-Moon zero-field point, where the net gravitational force on it is exactly zero. Is it gravitationally bound to the Earth-Moon pair, or could it escape to interstellar space from there?',
      options: [
        'Escaping — zero net force means zero net energy too, so it is exactly on the boundary between bound and unbound',
        "Bound — the net force happens to be zero there, but its total energy (zero kinetic energy, plus negative potential energy from both Earth and the Moon) is still negative, so GravityField's own classifyOrbit calls it bound, even though it won't stay at that unstable balance point for long",
        "There is no way to tell without knowing which direction it is nudged",
        'Bound to the Moon only, since it is on the Moon\'s side of the zero-field point',
      ],
      check(value) {
        const correct =
          value ===
          "Bound — the net force happens to be zero there, but its total energy (zero kinetic energy, plus negative potential energy from both Earth and the Moon) is still negative, so GravityField's own classifyOrbit calls it bound, even though it won't stay at that unstable balance point for long";
        return {
          correct,
          message: `Zero net force and zero (or negative) total energy are different conditions. At the zero-field point here, potential energy from Earth and the Moon together is about ${(potentialAtZero / 1e6).toFixed(2)} MJ/kg — negative — so with zero kinetic energy the total is the same negative number, and classifyOrbit(total, potential) returns '${zeroPointClassification}'. It would take real added energy (a push) to escape from there, even though no force is needed just to stay put for an instant.`,
        };
      },
    },
  ];
}

const gravityFieldMapQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = gravityFieldMapQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.GravityFieldMapQuestions = gravityFieldMapQuestionsApi;
}
