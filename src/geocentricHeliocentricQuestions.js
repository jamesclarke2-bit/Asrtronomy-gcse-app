/**
 * Practice questions for notes/geocentric-to-heliocentric.html: why
 * epicycles were added to the geocentric model (7.4), what Tycho Brahe
 * actually contributed and why it mattered (8.1), what Kepler did with
 * Brahe's data (8.2), and Galileo's two telescopic observations that
 * supported the heliocentric model (11.24).
 */

function makeQuestions() {
  return [
    {
      id: 'why-epicycles',
      units: ['u3.2'],
      type: 'choice',
      prompt: "Why did Ptolemy add epicycles to his Earth-centred model of the Solar System?",
      options: [
        'To make the model simpler and easier to calculate with',
        "To explain the planets' observed retrograde motion and changing brightness, which a single circle around Earth couldn't produce",
        'Because he had observed small moons orbiting the other planets',
        "To account for the Moon's own phases",
      ],
      check(value) {
        const correct =
          value === "To explain the planets' observed retrograde motion and changing brightness, which a single circle around Earth couldn't produce";
        return {
          correct,
          message:
            "A planet moving on a single circle around Earth would always drift the same way across the sky, at a steady brightness. Real planets don't: they periodically loop backwards (retrograde motion) and visibly brighten and dim. Epicycles — small circles riding on the main deferent — gave Ptolemy's model enough extra freedom to reproduce both effects, even though the real cause (Earth and the planets orbiting the Sun at different speeds, changing their distance from Earth) wasn't part of his Earth-centred picture at all.",
        };
      },
    },
    {
      id: 'brahe-contribution',
      units: ['u3.6'],
      type: 'choice',
      prompt: "What was Tycho Brahe's key contribution to the shift from a geocentric to a heliocentric model, and why did it matter?",
      options: [
        'He invented the telescope, letting astronomers see the planets in detail for the first time',
        'He proposed that the Sun, not Earth, was at the centre of the Solar System',
        'He made extremely accurate naked-eye observations of planetary positions, especially Mars, which gave Kepler the precise data needed to find that orbits are ellipses',
        "He discovered Jupiter's four largest moons, showing not everything orbits Earth",
      ],
      check(value) {
        const correct =
          value ===
          'He made extremely accurate naked-eye observations of planetary positions, especially Mars, which gave Kepler the precise data needed to find that orbits are ellipses';
        return {
          correct,
          message:
            "Brahe didn't propose a new model himself (his own compromise model kept Earth at the centre) and worked entirely before the telescope existed — his contribution was observational precision: years of naked-eye measurements of planetary positions, especially Mars, far more accurate than anything before. That data mattered because it was good enough to show up small discrepancies between where Mars actually was and where a circular orbit predicted it should be. Kepler, working with Brahe's data after Brahe's death, used exactly those discrepancies to show Mars's orbit is an ellipse, not a circle.",
        };
      },
    },
    {
      id: 'kepler-ellipses',
      units: ['u3.7'],
      type: 'choice',
      prompt: "What did Kepler discover by working with Tycho Brahe's observational data on Mars?",
      options: [
        'That Mars has two small moons',
        "That Mars's orbit (and by extension, planetary orbits generally) is an ellipse, not a circle",
        'That Mars is closer to the Sun than Earth is',
        'That Mars shows a full set of phases like the Moon',
      ],
      check(value) {
        const correct = value === "That Mars's orbit (and by extension, planetary orbits generally) is an ellipse, not a circle";
        return {
          correct,
          message:
            "Kepler spent years trying to fit Brahe's precise Mars data to circular orbits, as every model before his had assumed, including Copernicus's Sun-centred one. The data wouldn't fit — the discrepancies were small, but Brahe's observations were accurate enough that Kepler could tell they were real. Allowing the orbit to be an ellipse instead removed the discrepancy entirely, and that one change became the first of Kepler's three laws.",
        };
      },
    },
    {
      id: 'venus-phases',
      units: ['u3.15'],
      type: 'choice',
      prompt:
        "Galileo observed that Venus shows a full set of phases, from a thin crescent through to nearly full, just like the Moon. Why did this count as evidence against the Earth-centred model?",
      options: [
        "It didn't — Venus's phases are consistent with either model",
        'It showed Venus has its own moon',
        "In a strict Earth-centred model, with Venus always between Earth and the Sun, Venus could only ever show crescent phases — never gibbous or full. Seeing the full range meant Venus must orbit the Sun, not Earth",
        'It proved Venus was closer to Earth than previously thought',
      ],
      check(value) {
        const correct =
          value ===
          'In a strict Earth-centred model, with Venus always between Earth and the Sun, Venus could only ever show crescent phases — never gibbous or full. Seeing the full range meant Venus must orbit the Sun, not Earth';
        return {
          correct,
          message:
            "In the Earth-centred model, Venus orbits on an epicycle that keeps it roughly between Earth and the Sun at all times, so the Sun can only ever light the side facing away from Earth — at most a crescent. Galileo's telescope showed Venus going through gibbous and nearly full phases too, exactly as it would if Venus orbits the Sun and sometimes sits on the far side of it from Earth, fully lit. That range of phases is geometrically impossible in a strict Earth-centred model, which made it strong direct evidence for the Sun-centred one.",
        };
      },
    },
    {
      id: 'jupiter-moons',
      units: ['u3.15'],
      type: 'choice',
      prompt: "What did Galileo's telescopic observation of four moons orbiting Jupiter show?",
      options: [
        'That Jupiter must be the true centre of the Solar System',
        'That not everything in the universe orbits Earth — undermining a key assumption of the geocentric model',
        'That Jupiter is a star, not a planet',
        "That Jupiter's moons are closer to Earth than Jupiter itself",
      ],
      check(value) {
        const correct = value === 'That not everything in the universe orbits Earth — undermining a key assumption of the geocentric model';
        return {
          correct,
          message:
            "The geocentric model assumed every body in the sky circled Earth. Galileo's telescope showed four moons visibly circling Jupiter instead — a miniature system with its own centre that plainly wasn't Earth. That didn't by itself prove the Sun-centred model, but it directly disproved the assumption that Earth had to be the centre of all orbital motion, removing one of the geocentric model's foundations.",
        };
      },
    },
  ];
}

const geocentricHeliocentricQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = geocentricHeliocentricQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.GeocentricHeliocentricQuestions = geocentricHeliocentricQuestionsApi;
}
