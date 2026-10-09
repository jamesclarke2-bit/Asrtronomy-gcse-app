/**
 * Galileo's four largest moons of Jupiter (Io, Europa, Ganymede,
 * Callisto), for notes/geocentric-to-heliocentric.html's "Galileo and
 * Jupiter" strip. Real, well-established orbital periods and distances
 * (in Jupiter radii, so the diagram scales with the Jupiter marker it
 * draws rather than needing real kilometres). Ordered by distance from
 * Jupiter, which is also, by Kepler's third law, their period order:
 * closer moons orbit faster.
 *
 * From Earth, Jupiter's equatorial plane (and so these moons' orbits)
 * appears almost exactly edge-on, so each moon doesn't trace a visible
 * ellipse — it swings side to side along a line through Jupiter, which
 * is the classic view in Galileo's own sketches. That's modelled here
 * as the x-component of circular motion seen edge-on: a plain sine
 * wave, offset 0 at t=0 (every moon starts in line with Jupiter).
 */
(function () {
  const MOONS = [
    { name: 'Io', periodDays: 1.769, distanceJupiterRadii: 5.9 },
    { name: 'Europa', periodDays: 3.551, distanceJupiterRadii: 9.4 },
    { name: 'Ganymede', periodDays: 7.155, distanceJupiterRadii: 15.0 },
    { name: 'Callisto', periodDays: 16.689, distanceJupiterRadii: 26.4 },
  ];

  // The moon's position along the line through Jupiter, in Jupiter
  // radii, on either side (sign only means "which side" — it isn't
  // tied to a compass direction).
  function xOffsetJupiterRadii(moon, days) {
    return moon.distanceJupiterRadii * Math.sin((2 * Math.PI * days) / moon.periodDays);
  }

  const api = { MOONS, xOffsetJupiterRadii };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.GalileanMoons = api;
  }
})();
