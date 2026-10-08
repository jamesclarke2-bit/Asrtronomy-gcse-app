/**
 * Practice questions for sims/gravitational-potential.html — beyond the
 * GCSE spec (A-level extension), so every question here is tagged with
 * one of this page's own `level: 'extension'` curriculum ids (u3.26,
 * u3.27 — see src/curriculum.js), never a real GCSE spec point.
 *
 * Every number is computed live from src/gravityField.js, the same
 * engine the page's own widgets use, so a question can never quote a
 * figure the page itself would disagree with.
 */

function makeQuestions(GravityField, OrbitalMechanics) {
  const M = OrbitalMechanics.EARTH_MASS_KG;
  const R = OrbitalMechanics.EARTH_RADIUS_M;

  // 1000 km, not a "nearby" height like 50 km — close in, mgh and the
  // exact formula agree too well for a loose tolerance to tell them
  // apart (see test/gravityField.test.js's own 1 km/100 km case for
  // just how close). At 1000 km the exact answer is only about 86% of
  // mgh, a gap no reasonable rounding of G, M or R can close.
  const height = 1000000;
  const exactDeltaU = GravityField.potentialEnergyDifferenceNumerical(M, 1, R, R + height);
  const g0 = GravityField.fieldMagnitude(M, R);
  const mghApprox = g0 * height;

  const r1 = R;
  const r2 = R * 4;
  const areaUnderGR = GravityField.potentialDifferenceNumerical(M, r1, r2);

  const lowOrbit = R + 400000;
  const highOrbit = R + 4000000;
  const lowEnergetics = GravityField.circularOrbitEnergetics(M, lowOrbit);
  const highEnergetics = GravityField.circularOrbitEnergetics(M, highOrbit);

  return [
    {
      id: 'why-is-v-negative',
      units: ['u3.26'],
      type: 'choice',
      prompt: 'Gravitational potential, V(r) = -GM/r, is negative everywhere and zero only at infinity. Why?',
      options: [
        'Because gravity is a made-up "negative" force, unlike the other fundamental forces',
        'Because V is defined as the work an external agent does bringing a unit mass in from infinity at constant speed — and since gravity itself pulls that mass inward the whole way, the external agent has to hold it back (push outward, against the motion) the whole way, doing negative work',
        "Because distance r is being measured in the wrong direction",
        'It is a convention with no physical meaning — V could equally well be defined as positive',
      ],
      check(value) {
        const correct =
          value ===
          'Because V is defined as the work an external agent does bringing a unit mass in from infinity at constant speed — and since gravity itself pulls that mass inward the whole way, the external agent has to hold it back (push outward, against the motion) the whole way, doing negative work';
        return {
          correct,
          message:
            "V(r) is defined as the work an external agent — the hand, in this page's 'Lower it slowly' mode — does moving a unit mass in from the release point at constant speed (so kinetic energy never changes, only potential energy does; that's exactly why the 'Work done by the hand' and 'Potential energy change' counters show the same number in that mode). Gravity already pulls the mass inward on its own, so to keep the speed constant the hand has to resist that pull — a force pointing outward, opposite the inward motion — which is negative work by definition (force opposite to displacement). Taken from a release point far enough to stand in for infinity, that negative number is V(r) itself: V(r) = GM/r × (-1) = -GM/r. It isn't an arbitrary sign choice; it falls directly out of what lowering a mass in at constant speed actually requires the hand to do.",
        };
      },
    },
    {
      id: 'field-work-opposite-sign',
      units: ['u3.26'],
      type: 'choice',
      prompt: "Why does the work gravity itself does (workByField) come out with the opposite sign to gravitational potential energy, for the same move?",
      options: [
        "It doesn't really — they're the same number, just rounded differently",
        'Because work done by the field always equals minus the change in potential energy (W = -ΔU) for any conservative force, and potential energy is defined as the external agent\'s work — so the field\'s work is, by that same definition, the external agent\'s work reversed',
        'Because the field is measured in different units from potential energy',
        'Only because Earth happens to attract rather than repel — a repulsive force would make them agree',
      ],
      check(value) {
        const correct =
          value ===
          "Because work done by the field always equals minus the change in potential energy (W = -ΔU) for any conservative force, and potential energy is defined as the external agent's work — so the field's work is, by that same definition, the external agent's work reversed";
        return {
          correct,
          message:
            "For any conservative force, the work the field itself does equals minus the change in potential energy: W(field) = -ΔU. Here ΔU is itself defined as the external agent's (the hand's) own work, so this isn't a coincidence to remember — it's the same relationship stated twice. In 'Let it fall' mode the field's work on the falling mass is positive, and it all becomes kinetic energy, while potential energy drops by exactly that much (ΔU negative). In 'Lower it slowly' mode, moving the same mass over the same radii, the field still does that identical positive work — but kinetic energy never builds up, because the hand does the matching negative work instead. Either way, field work and ΔU always have opposite signs, which is exactly workByField = -workByExternalAgent in the engine.",
        };
      },
    },
    {
      id: 'mgh-vs-exact',
      units: ['u3.26'],
      type: 'number',
      unitLabel: 'J/kg',
      prompt: `Using ΔU = GMm(1/R - 1/(R+h)) with m = 1 kg, calculate the exact gravitational potential energy gained climbing h = ${height / 1000} km above Earth's surface. Use G = 6.6743×10⁻¹¹ N·m²/kg², Earth's mass M = 5.97×10²⁴ kg, Earth's radius R = 6,371 km, and (for comparison only — it is not the formula to use here) surface gravity g = 9.8 m/s².`,
      check(value) {
        // 2%, not the tight tolerance a nearby-height version of this
        // question could get away with: loose enough to accept any
        // reasonable textbook rounding of G, M and R (5.97×10²⁴ kg or
        // 5.98×10²⁴ kg both land well inside it — see
        // test/gravitationalPotentialQuestions.test.js), but nowhere
        // near loose enough to also accept mgh, which misses by ~16%
        // at this height.
        const correct = Math.abs(value - exactDeltaU) / exactDeltaU < 0.02;
        const pctDiff = (100 * Math.abs(exactDeltaU - mghApprox)) / exactDeltaU;
        return {
          correct,
          message: `ΔU = GM(1/R - 1/(R+h)) ≈ ${(exactDeltaU / 1e6).toFixed(2)} MJ/kg. The near-surface approximation mgh gives g₀h ≈ ${(mghApprox / 1e6).toFixed(2)} MJ/kg instead — about ${pctDiff.toFixed(0)}% too high at this height, since g has already dropped noticeably over a 1000 km climb. (A 2% tolerance here allows for rounding G, M or R differently, not for using mgh.)`,
        };
      },
    },
    {
      id: 'when-is-mgh-valid',
      units: ['u3.26'],
      type: 'choice',
      prompt: 'mgh is often used as "the" formula for gravitational potential energy. Under what condition does it actually match the exact ΔU = GMm(1/R - 1/(R+h)) closely?',
      options: [
        'Always — mgh is exact everywhere, not just near a surface',
        'When the height h climbed is small compared with the radius R, so g barely changes over that climb',
        'Only on the Moon, never on Earth',
        'When the mass m is very large',
      ],
      check(value) {
        const correct = value === 'When the height h climbed is small compared with the radius R, so g barely changes over that climb';
        return {
          correct,
          message:
            'mgh assumes g stays constant over the climb, which is only true when h is small compared with R — climb from 6,371 km to 6,372 km and g has barely changed, but climb to 12,742 km (R itself) and g has dropped to a quarter of its surface value, so mgh badly overestimates the energy needed. The ratio ΔU(exact)/mgh starts at 1 for h → 0 and drifts further from 1 as h grows relative to R.',
        };
      },
    },
    {
      id: 'g-r-area-meaning',
      units: ['u3.26'],
      type: 'number',
      unitLabel: 'J/kg',
      prompt: `On the g-r graph in "3. Four graphs, all below zero", the signed field g = -GM/r² is plotted against r (negative everywhere, since it points inward). What is V(4R) - V(R), given that it equals minus the shaded (signed, negative) area under that curve between r = R (Earth's surface) and r = 4R?`,
      check(value) {
        // 2%: this is a "read it off the graph and estimate the area"
        // question, not a plug-into-a-formula one, so the tolerance
        // needs room for a student's own numerical-integration error
        // (e.g. approximating with a handful of trapezoids by eye), on
        // top of the usual G/M/R rounding — not just one or the other.
        const correct = Math.abs(value - areaUnderGR) / areaUnderGR < 0.02;
        return {
          correct,
          message: `The shaded area is ∫g dr over that range ≈ ${(-areaUnderGR / 1e6).toFixed(1)} MJ/kg (negative, since g is negative) — and V(4R) - V(R) is minus that area, ≈ ${(areaUnderGR / 1e6).toFixed(1)} MJ/kg (positive: moving out to a less negative potential). "Area under the signed g-r graph" and "minus the potential difference" are the same number, not just related ones.`,
        };
      },
    },
    {
      id: 'satellite-ke-higher-orbit',
      units: ['u3.27'],
      type: 'choice',
      prompt: "A satellite is moved from a low circular orbit to a higher one. What happens to its kinetic energy, and to its total energy?",
      options: [
        'Both increase — a higher orbit needs more energy, so everything about it goes up',
        'Kinetic energy falls (it moves slower, further out); total energy rises — becomes less negative, since it is now closer to escaping',
        'Kinetic energy rises (it needs more speed to stay up); total energy falls',
        'Neither changes — orbital energy only depends on the planet, not the orbit',
      ],
      check(value) {
        const correct =
          value === 'Kinetic energy falls (it moves slower, further out); total energy rises — becomes less negative, since it is now closer to escaping';
        return {
          correct,
          message:
            `A circular orbit's speed is √(GM/r), so a higher r means a slower orbit and less kinetic energy — at 400 km altitude KE ≈ ${(lowEnergetics.kinetic / 1e6).toFixed(1)} MJ/kg, but at 4,000 km altitude it's only ≈ ${(highEnergetics.kinetic / 1e6).toFixed(1)} MJ/kg. Potential energy rises faster than kinetic energy falls though (PE = -GM/r, twice the size of KE and growing twice as fast), so the total, KE + PE, still rises overall: from ≈ ${(lowEnergetics.total / 1e6).toFixed(1)} MJ/kg to ≈ ${(highEnergetics.total / 1e6).toFixed(1)} MJ/kg — less negative, i.e. closer to the zero that marks escape, even though the satellite is moving slower, not faster.`,
        };
      },
    },
    {
      id: 'escape-is-zero-total-energy',
      units: ['u3.27'],
      type: 'choice',
      prompt: 'In terms of total specific energy (KE + PE per unit mass), what marks the boundary between an object that eventually falls back and one that escapes forever?',
      options: [
        'Total energy equal to the kinetic energy of a circular orbit at that radius',
        'Total energy exactly zero — negative is bound (falls back or stays in orbit), zero is the marginal "just escaping" case, positive is unbound with speed left over',
        'Total energy equal to the potential energy at that radius',
        'There is no such boundary — escaping only depends on direction, not speed',
      ],
      check(value) {
        const correct =
          value ===
          'Total energy exactly zero — negative is bound (falls back or stays in orbit), zero is the marginal "just escaping" case, positive is unbound with speed left over';
        return {
          correct,
          message:
            "Total specific energy (KE + PE) is conserved as an object moves, so its sign at any one point tells you its fate everywhere: negative means it can never reach infinity (not enough energy to pay the full climb out of the potential well) — bound, whether that's a stable orbit or a path that falls back. Exactly zero is the marginal case: just enough energy to reach infinity, arriving there with zero speed left — this is exactly what escape speed is derived from, and classifyOrbit's 'parabolic' case. Positive means it reaches infinity with speed to spare — hyperbolic, truly unbound.",
        };
      },
    },
  ];
}

const gravitationalPotentialQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = gravitationalPotentialQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.GravitationalPotentialQuestions = gravitationalPotentialQuestionsApi;
}
