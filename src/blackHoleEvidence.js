/**
 * Evidence for black holes, for notes/black-holes.html (spec 14.11).
 *
 * A black hole gives out no light, so the evidence is its effect on things
 * nearby:
 *  - X-ray binaries: a star orbits an unseen companion and loses gas to it;
 *    the gas is heated to millions of degrees in an accretion disc and gives
 *    out X-rays. If the companion's mass, found from the orbit, is above the
 *    most a neutron star can have (MassiveStar.NEUTRON_STAR_MAX_MSUN), it
 *    must be a black hole. Example: Cygnus X-1.
 *  - Stars orbiting an unseen mass at the Milky Way's centre: the star S2's
 *    orbit gives the mass by Kepler's third law in Solar System units,
 *    M = a^3 / T^2 (M in Sun masses, a in AU, T in years): about 4 million
 *    Suns, packed inside S2's closest approach of about 120 AU, yet giving
 *    out no starlight: only a supermassive black hole fits.
 *
 * S2's orbit is modelled as a flat ellipse (a, e, T rounded) and solved
 * with Kepler's equation; its speed comes from the same model. Every name,
 * date, mass and figure is general knowledge, labelled a first draft on
 * the page.
 */
(function () {
  const isNode = typeof require !== 'undefined' && typeof module !== 'undefined';
  const MassiveStar = isNode ? require('./massiveStar') : window.MassiveStar;

  const KM_S_PER_AU_PER_YEAR = 4.74;

  const S2 = { aAU: 1000, e: 0.88, periodYears: 16, closestYear: 2018 };

  // The unseen black hole is about 20 Sun masses; the visible supergiant
  // is heavier, about 40, so it is the one on the smaller orbit.
  const CYGNUS_X1 = {
    companionMsun: 20,
    visibleMsun: 40,
    periodDays: 5.6,
    identified: 'the early 1970s',
  };

  /** Kepler's third law in Solar System units: mass (Sun masses) from a (AU) and T (years). */
  function massFromOrbit(aAU, periodYears) {
    return (aAU ** 3) / (periodYears ** 2);
  }

  /** Whether an unseen companion of this mass (Sun masses) is too heavy to be a neutron star. */
  function mustBeBlackHole(massMsun) {
    return massMsun > MassiveStar.NEUTRON_STAR_MAX_MSUN;
  }

  /**
   * S2's position at a given year: x, y in AU with the black hole at the
   * origin and the closest point along +x; r its distance (AU); speed in
   * km/s from the vis-viva equation.
   */
  function s2At(year) {
    const { aAU: a, e, periodYears: T, closestYear } = S2;
    const M = massFromOrbit(a, T);
    let meanAnomaly = (2 * Math.PI * (year - closestYear)) / T;
    meanAnomaly = ((meanAnomaly % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    let E = meanAnomaly;
    for (let k = 0; k < 50; k += 1) E -= (E - e * Math.sin(E) - meanAnomaly) / (1 - e * Math.cos(E));
    const x = a * (Math.cos(E) - e);
    const y = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const r = Math.hypot(x, y);
    // v^2 = GM (2/r - 1/a), with GM = 4 pi^2 M in AU^3 / year^2.
    const speedAUyr = Math.sqrt(4 * Math.PI ** 2 * M * (2 / r - 1 / a));
    return { x, y, r, speedKms: speedAUyr * KM_S_PER_AU_PER_YEAR };
  }

  function closestApproachAU() {
    return S2.aAU * (1 - S2.e);
  }

  const api = { S2, CYGNUS_X1, KM_S_PER_AU_PER_YEAR, massFromOrbit, mustBeBlackHole, s2At, closestApproachAU };
  if (isNode && module.exports) {
    module.exports = api;
  } else {
    window.BlackHoleEvidence = api;
  }
})();
