/**
 * Practice questions for notes/solar-system-bodies.html: using the data
 * sheet's planet table to compare relative size and mass (11.1, 11.6),
 * comet structure and tail direction (11.2), short- vs long-period
 * comet origins (11.3, 11.4), the ecliptic plane and Solar System
 * debris (11.11), meteoroid/meteor/meteorite terminology (11.10),
 * transits of Venus and measuring the AU (11.12), and the origin of
 * Earth's water (11.13).
 *
 * The two numeric questions compute their expected answer live from
 * SpecData (the exam data sheet), so they can never drift from the
 * page's own sortable table.
 */

function makeQuestions(SpecData) {
  const jupiter = SpecData.PLANETARY_DATA.find((body) => body.name === 'Jupiter');
  const earth = SpecData.PLANETARY_DATA.find((body) => body.name === 'Earth');
  const saturn = SpecData.PLANETARY_DATA.find((body) => body.name === 'Saturn');
  const uranus = SpecData.PLANETARY_DATA.find((body) => body.name === 'Uranus');

  const sizeRatio = jupiter.diameterThousandKm / earth.diameterThousandKm;
  const massRatio = saturn.massEarthMasses / uranus.massEarthMasses;

  return [
    {
      id: 'relative-size-calculation',
      units: ['u3.16'],
      type: 'number',
      unitLabel: '× Earth',
      prompt: `The data sheet gives Jupiter's diameter as ${jupiter.diameterThousandKm} (thousand km) and Earth's as ${earth.diameterThousandKm} (thousand km). Calculate Jupiter's diameter relative to Earth's.`,
      check(value) {
        const correct = Math.abs(value - sizeRatio) <= 0.3;
        return {
          correct,
          message: `relative size = ${jupiter.diameterThousandKm} / ${earth.diameterThousandKm} = ${sizeRatio.toFixed(1)}× Earth's diameter.`,
        };
      },
    },
    {
      id: 'relative-mass-comparison',
      units: ['u3.16'],
      type: 'number',
      unitLabel: '×',
      prompt: `The data sheet gives Saturn's mass as ${saturn.massEarthMasses} Earth masses and Uranus's as ${uranus.massEarthMasses} Earth masses. How many times more massive is Saturn than Uranus?`,
      check(value) {
        const correct = Math.abs(value - massRatio) <= 0.3;
        return {
          correct,
          message: `mass ratio = ${saturn.massEarthMasses} / ${uranus.massEarthMasses} = ${massRatio.toFixed(1)}× — both masses are already given relative to Earth, so this is a straightforward division of the two data-sheet figures.`,
        };
      },
    },
    {
      id: 'comet-tail-direction',
      units: ['u3.18'],
      type: 'choice',
      prompt: "A comet's tail always points in which direction, regardless of which way the comet itself is travelling?",
      options: [
        "Directly behind the comet's direction of travel, like the wake of a boat",
        'Away from the Sun',
        'Towards the Sun',
        "Along the comet's orbit, pointing ahead of it",
      ],
      check(value) {
        const correct = value === 'Away from the Sun';
        return {
          correct,
          message:
            "A comet's tail is gas and dust being pushed off the coma by the solar wind and radiation pressure, both of which blow outward from the Sun — so the tail always streams away from the Sun, not behind the comet's path. That means a comet travelling away from the Sun has its tail out in front of it, leading the way, which surprises people expecting it to trail behind like a wake.",
        };
      },
    },
    {
      id: 'comet-origin',
      units: ['u3.19'],
      type: 'choice',
      prompt: "Halley's Comet returns about every 76 years — a short-period comet. Which reservoir of icy bodies are short-period comets thought to come from?",
      options: ['The asteroid belt, between Mars and Jupiter', 'The Kuiper Belt, beyond Neptune', 'The Oort Cloud, far beyond the Kuiper Belt', 'Interstellar space, from outside the Solar System entirely'],
      check(value) {
        const correct = value === 'The Kuiper Belt, beyond Neptune';
        return {
          correct,
          message:
            "Short-period comets (orbital periods under about 200 years) are thought to originate in the Kuiper Belt, a disc of icy bodies beyond Neptune lying roughly in the same plane as the planets — which is also why most short-period comets, like most planets, keep close to the ecliptic. Long-period comets, by contrast, are thought to come from the far more distant, roughly spherical Oort Cloud.",
        };
      },
    },
    {
      id: 'meteoroid-meteor-meteorite',
      units: ['u3.22'],
      type: 'choice',
      prompt:
        "A small fragment of rock breaks off an asteroid and eventually enters Earth's atmosphere, burns as a streak of light, and a surviving piece lands on the ground. What is it correctly called at each of those three stages, in order?",
      options: [
        'Meteor, then meteoroid, then meteorite',
        'Meteorite, then meteor, then meteoroid',
        'Meteoroid, then meteor, then meteorite',
        'Meteoroid, then meteorite, then meteor',
      ],
      check(value) {
        const correct = value === 'Meteoroid, then meteor, then meteorite';
        return {
          correct,
          message:
            "It's a meteoroid while still travelling through space; a meteor (or 'shooting star') while it's the visible streak of light burning up in the atmosphere; and, only if a fragment survives all the way to the ground, a meteorite. The three terms describe the same object at three different stages, not three different kinds of object.",
        };
      },
    },
    {
      id: 'ecliptic-oort-cloud',
      units: ['u3.23'],
      type: 'choice',
      prompt:
        'Most asteroids and short-period comets stay close to the ecliptic plane, but long-period comets from the Oort Cloud can arrive from any direction in the sky. Why the difference?',
      options: [
        'Long-period comets travel much faster, so they are flung out of the ecliptic plane',
        "The Oort Cloud is roughly spherical, surrounding the whole Solar System, unlike the flattened, disc-shaped Kuiper Belt and asteroid belt that formed in the same plane as the planets",
        'The Sun’s gravity is weaker at the distance of the Oort Cloud, so comets there are not held to any particular plane',
        'Long-period comets actually do stay close to the ecliptic, like short-period comets',
      ],
      check(value) {
        const correct =
          value ===
          'The Oort Cloud is roughly spherical, surrounding the whole Solar System, unlike the flattened, disc-shaped Kuiper Belt and asteroid belt that formed in the same plane as the planets';
        return {
          correct,
          message:
            "The asteroid belt and Kuiper Belt are both flattened discs, left over from the same spinning protoplanetary disc the planets formed from, so objects there (and the short-period comets that come from the Kuiper Belt) mostly orbit close to that same ecliptic plane. The Oort Cloud is thought to be a far larger, roughly spherical shell surrounding the entire Solar System, so a long-period comet disturbed out of it can fall in from any direction at all, not just from near the ecliptic.",
        };
      },
    },
    {
      id: 'transit-of-venus-parallax',
      units: ['u3.24'],
      type: 'choice',
      prompt:
        'Edmond Halley proposed measuring the Sun-Earth distance (the AU) by timing a transit of Venus from two widely separated latitudes on Earth. Why does observing from two different latitudes help?',
      options: [
        'Because Venus moves faster across the Sun as seen from some latitudes than others, directly revealing its orbital speed',
        'Because parallax means the two observers, separated on Earth’s surface, see Venus trace slightly different paths across the Sun’s disc; combining that small measured difference with the known separation between the observers lets the Sun-Earth distance be triangulated',
        'Because the transit only lasts long enough to see from one hemisphere at a time, so two latitudes are needed to observe the whole event',
        'Because the Sun looks a different size from different latitudes, and that size difference gives the distance directly',
      ],
      check(value) {
        const correct =
          value ===
          'Because parallax means the two observers, separated on Earth’s surface, see Venus trace slightly different paths across the Sun’s disc; combining that small measured difference with the known separation between the observers lets the Sun-Earth distance be triangulated';
        return {
          correct,
          message:
            "This is parallax, the same effect that makes a nearby object appear to shift against a distant background when you view it from two different places. Two observers at widely separated latitudes see Venus — much closer to them than the Sun is — cross the Sun's disc along very slightly different paths. That tiny measured difference, combined with the precisely known distance between the two observers on Earth, is enough geometry to triangulate the real Sun-Earth distance — giving 18th- and 19th-century astronomers their first solid measurement of the AU, long before radar or spacecraft.",
        };
      },
    },
    {
      id: 'earths-water-origin',
      units: ['u3.25'],
      type: 'choice',
      prompt: "Current evidence — including hydrogen isotope ratios in Earth's oceans — points to which source as the larger contributor to Earth's water?",
      options: [
        'Water-rich asteroids colliding with the early Earth',
        'Comets delivering icy material',
        'Volcanic outgassing alone, with no delivery from space at all',
        "Earth's water has stayed completely unchanged since the planet formed, with no major contribution from any later source",
      ],
      check(value) {
        const correct = value === 'Water-rich asteroids colliding with the early Earth';
        return {
          correct,
          message:
            "Several theories have been proposed — water-rich asteroids, comets, and volcanic outgassing as Earth cooled — and the current evidence doesn't rule any of them out entirely. But measurements of hydrogen isotope ratios (the proportion of deuterium, 'heavy hydrogen') in Earth's oceans match water-rich asteroids more closely than they match most comets measured so far, which is why asteroid delivery is currently thought to be the larger single contributor. This is an active area of research, covered in more depth on the planetary-formation page.",
        };
      },
    },
  ];
}

const solarSystemBodiesQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = solarSystemBodiesQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.SolarSystemBodiesQuestions = solarSystemBodiesQuestionsApi;
}
