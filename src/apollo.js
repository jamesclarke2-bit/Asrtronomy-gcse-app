/**
 * Content and models for notes/crewed-missions-apollo.html (spec 11.29,
 * 11.30): crewed missions against robotic probes, the Apollo spacecraft
 * and mission profile, four key missions, and the laser ranging the
 * Apollo crews made possible.
 *
 * The laser's round-trip time uses the data sheet's Earth-Moon distance
 * and speed of light (src/specData.js). Every other name, date and figure
 * here is general knowledge, labelled first draft on the page.
 */
(function () {
  const SpecData = typeof require !== 'undefined' ? require('./specData') : window.SpecData;

  // --- 11.29 Crewed missions against probes -----------------------------
  const ADVANTAGES = [
    { key: 'decide', main: 'Decide on the spot', detail: 'choose the best samples' },
    { key: 'repair', main: 'Repair and adapt', detail: 'fix or service equipment' },
    { key: 'return', main: 'Bring samples home', detail: 'for labs on Earth to study' },
    { key: 'inspire', main: 'Inspire people', detail: 'public support for science' },
  ];
  const DISADVANTAGES = [
    { key: 'life-support', main: 'Life support', detail: 'heavy and costly to carry' },
    { key: 'risk', main: 'Risk to life', detail: 'accidents can kill a crew' },
    { key: 'radiation', main: 'Radiation', detail: 'harms people on long trips' },
    { key: 'range', main: 'Limited range', detail: 'only the Moon, so far' },
  ];
  const TASKS = [
    {
      key: 'samples',
      name: 'Collect varied rocks on the Moon',
      verdict: 'crewed',
      highlight: ['decide', 'return'],
      why: 'A crew can pick the most interesting rocks on the spot and carry them home.',
    },
    {
      key: 'repair',
      name: 'Repair a telescope in Earth orbit',
      verdict: 'crewed',
      highlight: ['repair'],
      why: 'Only people can open up and fix equipment that was never designed for robots.',
    },
    {
      key: 'neptune',
      name: "Study Neptune's moons for 10 years",
      verdict: 'probe',
      highlight: ['life-support', 'radiation', 'range'],
      why: 'The trip is far too long and far for a crew: no life support, radiation dose or risk to worry about with a probe.',
    },
    {
      key: 'map',
      name: 'Map the whole of Mars from orbit',
      verdict: 'probe',
      highlight: ['life-support', 'risk'],
      why: 'A probe can orbit for years at a small part of the cost, with no crew to keep alive.',
    },
  ];

  // --- 11.30 The Apollo programme ----------------------------------------
  const MODULES = [
    { key: 'cm', name: 'Command Module', job: 'the crew cabin for the journey; the only part that came home, protected by its heat shield' },
    { key: 'sm', name: 'Service Module', job: 'the engine, electricity, oxygen and water; let go just before re-entry' },
    { key: 'lm', name: 'Lunar Module', job: 'took two astronauts down to the surface; its top half flew back up to dock, its bottom half stayed on the Moon' },
  ];

  const PROFILE = [
    { key: 'launch', name: 'Launch', text: 'The Saturn V lifts off; its first two stages burn out and drop away.' },
    { key: 'earth-orbit', name: 'Earth orbit', text: "The third stage puts the spacecraft into orbit round the Earth, then fires again towards the Moon." },
    { key: 'coast-out', name: 'Coast to the Moon', text: 'About 3 days coasting out; the Command and Service Module turns round to dock with the Lunar Module.' },
    { key: 'lunar-orbit', name: 'Lunar orbit', text: 'The Service Module engine slows the craft into orbit round the Moon.' },
    { key: 'landing', name: 'Landing', text: 'Two astronauts land in the Lunar Module; one stays in orbit in the Command Module.' },
    { key: 'ascent', name: 'Ascent and docking', text: "The Lunar Module's top half takes off and docks with the Command Module; it is then let go." },
    { key: 'coast-home', name: 'Coast home', text: 'The Service Module engine fires to leave lunar orbit: about 3 days back.' },
    { key: 'splashdown', name: 'Splashdown', text: 'The Service Module is let go; the Command Module re-enters behind its heat shield and lands in the sea under parachutes.' },
  ];

  const MISSIONS = [
    { key: 'apollo-8', name: 'Apollo 8', year: 1968, text: 'First crew to orbit the Moon and see its far side.' },
    { key: 'apollo-11', name: 'Apollo 11', year: 1969, text: 'First landing: Neil Armstrong and Buzz Aldrin walked on the Sea of Tranquility while Michael Collins orbited.' },
    { key: 'apollo-13', name: 'Apollo 13', year: 1970, text: 'An oxygen tank exploded on the way out; the landing was called off and the crew used the Lunar Module as a lifeboat to get home safely.' },
    { key: 'apollo-17', name: 'Apollo 17', year: 1972, text: 'The last landing, with the first scientist on the Moon, the geologist Harrison Schmitt; the longest stay.' },
  ];

  const SATURN_V_HEIGHT_M = 110;
  const COST_BILLION_DOLLARS = 25;
  const SAMPLES_KG = 382;

  // --- Laser ranging -------------------------------------------------------
  const EARTH_MOON_KM = SpecData.CONSTANTS.meanEarthMoonDistanceKm;
  const C_M_PER_S = SpecData.CONSTANTS.speedOfLightMPerS;

  /** Seconds for a laser pulse to reach the Moon and come back. */
  function laserRoundTripSeconds(distanceKm = EARTH_MOON_KM) {
    return (2 * distanceKm * 1000) / C_M_PER_S;
  }

  const api = {
    ADVANTAGES,
    DISADVANTAGES,
    TASKS,
    MODULES,
    PROFILE,
    MISSIONS,
    SATURN_V_HEIGHT_M,
    COST_BILLION_DOLLARS,
    SAMPLES_KG,
    EARTH_MOON_KM,
    C_M_PER_S,
    laserRoundTripSeconds,
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.Apollo = api;
  }
})();
