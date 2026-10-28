/**
 * Practice questions for notes/naked-eye-sky.html: telling naked-eye
 * phenomena apart (6.1, u1.1), recognising the seven constellations and
 * asterisms on sight and knowing which is which (6.2, u1.2), and using
 * pointer stars (6.3, u1.3).
 *
 * The seven "name that pattern" questions are picture-based, as the
 * exam itself asks (spec 6.2, "recognise and draw"): each one's
 * render(container) calls back into notes/naked-eye-sky.js's own
 * renderPatternQuizDiagram (passed in as NakedEyeSkyDiagram, the second
 * argument), which redraws the real chart with its star labels left
 * off — never a hand-written text clue. The constellation-or-asterism
 * question and every pointer-star ratio are derived live from
 * src/starPatterns.js's own PATTERNS/STARS data, the same source the
 * page's own charts and fillFigures() use, so none of it can quote a
 * fact the page itself would disagree with.
 *
 * One exception: "the curve of the Plough's handle leads to Arcturus"
 * (spec 6.3's own example) isn't modelled anywhere in starPatterns.js —
 * unlike the page's other pointer routes, it's a curve, not a straight
 * extension through two points, and the page itself doesn't draw it.
 * That question is marked first draft, to be checked by the teacher,
 * per this repo's usual convention for a fact sourced from general
 * knowledge rather than the page's own worked content.
 *
 * makeQuestions still runs perfectly well without its second argument
 * (e.g. from a Node test, or from src/allQuestions.js's sitewide list,
 * neither of which has a DOM to draw into) — render just never gets
 * called there.
 */
const PHENOMENA = [
  { id: 'sun', name: 'The Sun', clue: 'the only star bright enough to give daylight' },
  { id: 'moon', name: 'The Moon', clue: 'changes shape over a month' },
  { id: 'star', name: 'An ordinary star', clue: 'a twinkling point that keeps its place among the others' },
  { id: 'satellite', name: 'A satellite', clue: 'a steady light moving in a straight line without flashing' },
  { id: 'aircraft', name: 'An aircraft', clue: 'flashing red and green lights moving across the sky' },
  { id: 'planet', name: 'A planet', clue: 'a bright steady point that does not twinkle and lies near the ecliptic' },
  { id: 'meteor', name: 'A meteor', clue: 'a brief streak of light' },
  { id: 'starCluster', name: 'A star cluster', clue: 'a faint fuzzy patch of many stars' },
  { id: 'milkyWay', name: 'The Milky Way', clue: 'a faint band across the sky' },
  { id: 'aurora', name: 'An aurora', clue: 'a glowing curtain of light in the polar sky' },
  { id: 'doubleStar', name: 'A double star', clue: 'a pair of stars close together, such as Mizar and Alcor' },
  { id: 'supernova', name: 'A supernova', clue: 'a very rare new bright star that fades over weeks' },
  { id: 'comet', name: 'A comet', clue: 'a tail pointing away from the Sun' },
];
const PHENOMENON_NAMES = PHENOMENA.map((p) => p.name);

const PHENOMENON_EXPLANATIONS = {
  sun: 'The Sun is the only star bright enough to light the daytime sky — every other star, however bright at night, is far too faint to do that.',
  moon: "The Moon is the only naked-eye object that visibly changes shape, cycling through its phases roughly every 29.5 days.",
  star: "Stars twinkle (their light is bent about by moving air) and keep fixed positions relative to each other, night after night — unlike a planet, which shines more steadily and slowly drifts against them.",
  satellite: 'A satellite glides at a steady brightness in a straight line over a few minutes, with no flashing lights — the lack of flashing is what rules out an aircraft.',
  aircraft: "Flashing red, green or white lights moving steadily across the sky are an aircraft, not an astronomical object at all — a satellite's lights, by contrast, never flash.",
  planet: 'A planet shines with a steady light (its tiny disc averages out the atmospheric wobbles that make a point-like star twinkle) and stays within the zodiacal band, the narrow strip of sky around the ecliptic.',
  meteor: 'A meteor ("shooting star") is a brief streak of light lasting under a second, as a tiny grain of dust burns up in the atmosphere.',
  starCluster: 'A star cluster, such as the Pleiades, looks like a tight knot or fuzzy patch of several stars rather than a single point.',
  milkyWay: "The Milky Way appears as a faint, diffuse band arching across a dark sky — the combined glow of billions of stars in our own Galaxy's disc, seen edge-on from inside it.",
  aurora: 'An aurora is a glowing curtain, arc or ray of light (mostly green), seen low in the sky towards the poles, caused by solar-wind particles striking the upper atmosphere.',
  doubleStar: 'A double star is two stars that appear close together in the sky, such as Mizar and Alcor in the Plough — some genuinely orbit each other, others just happen to lie in nearly the same direction.',
  supernova: "A supernova is a dying star's catastrophic explosion — briefly a dazzling new point of light, fading again over weeks. A naked-eye one in our own Galaxy is extremely rare.",
  comet: "A comet shows a fuzzy tail that always points away from the Sun (pushed by the solar wind and radiation), and drifts slowly against the stars from one night to the next.",
};

function phenomenonQuestion(phenomenon) {
  return {
    id: `phenomenon-${phenomenon.id}`,
    units: ['u1.1'],
    type: 'choice',
    prompt: `Which naked-eye phenomenon is this: "${phenomenon.clue}"?`,
    options: PHENOMENON_NAMES,
    check(value) {
      const correct = value === phenomenon.name;
      return {
        correct,
        message: PHENOMENON_EXPLANATIONS[phenomenon.id],
      };
    },
  };
}

// id matches StarPatterns.PATTERNS' own id; name matches its own name,
// so the "constellation or asterism" question below can check against
// PATTERNS' own `kind` field rather than a second, hand-typed copy.
const PATTERN_IDS_AND_NAMES = [
  ['cassiopeia', 'Cassiopeia'],
  ['cygnus', 'Cygnus'],
  ['orion', 'Orion'],
  ['plough', 'The Plough'],
  ['southernCross', 'The Southern Cross'],
  ['summerTriangle', 'The Summer Triangle'],
  ['squareOfPegasus', 'The Square of Pegasus'],
];
const PATTERN_NAMES = PATTERN_IDS_AND_NAMES.map(([, name]) => name);

function namePatternQuestion([id, name], NakedEyeSkyDiagram) {
  return {
    id: `name-that-pattern-${id}`,
    units: ['u1.2'],
    type: 'choice',
    prompt: 'Name that pattern: which of these seven is drawn here, with its star labels hidden?',
    options: PATTERN_NAMES,
    render(container) {
      if (NakedEyeSkyDiagram) NakedEyeSkyDiagram.renderPatternQuizDiagram(container, id);
    },
    check(value) {
      const correct = value === name;
      return {
        correct,
        message: `This chart is ${name}.`,
      };
    },
  };
}

function makeQuestions(StarPatterns, NakedEyeSkyDiagram) {
  const { STARS, PATTERNS, angularSeparation } = StarPatterns;

  const kindOf = (id) => {
    const pattern = PATTERNS.find((p) => p.id === id);
    return pattern.kind === 'asterism' ? 'Asterism' : 'Constellation';
  };

  const pointerRatio = angularSeparation(STARS.dubhe, STARS.polaris) / angularSeparation(STARS.merak, STARS.dubhe);

  const beltGap = angularSeparation(STARS.mintaka, STARS.alnilam);
  const siriusRatio = angularSeparation(STARS.alnilam, STARS.sirius) / beltGap;
  const aldebaranRatio = angularSeparation(STARS.mintaka, STARS.aldebaran) / beltGap;
  const pleiadesRatio = angularSeparation(STARS.mintaka, STARS.alcyone) / beltGap;

  const fomalhautGap = angularSeparation(STARS.scheat, STARS.markab);
  const fomalhautRatio = angularSeparation(STARS.markab, STARS.fomalhaut) / fomalhautGap;
  const andromedaGap = angularSeparation(STARS.markab, STARS.alpheratz);
  const andromedaRatio = angularSeparation(STARS.alpheratz, STARS.andromedaGalaxy) / andromedaGap;

  return [
    ...PHENOMENA.map(phenomenonQuestion),
    ...PATTERN_IDS_AND_NAMES.map((entry) => namePatternQuestion(entry, NakedEyeSkyDiagram)),
    {
      id: 'constellation-or-asterism',
      units: ['u1.2'],
      fields: PATTERN_IDS_AND_NAMES.map(([id, name]) => ({
        key: id,
        type: 'choice',
        label: name,
        options: ['Constellation', 'Asterism'],
      })),
      prompt: 'For each of the seven, is it an official constellation, or an asterism?',
      check(value) {
        const correct = PATTERN_IDS_AND_NAMES.every(([id]) => value[id] === kindOf(id));
        return {
          correct,
          message:
            'Cassiopeia, Cygnus, Orion and the Southern Cross are official constellations. The Plough, the Summer Triangle and the Square of Pegasus are asterisms: the Plough is part of the constellation Ursa Major, the Square is part of Pegasus and Andromeda, and the Summer Triangle spans three separate constellations altogether.',
        };
      },
    },
    {
      id: 'plough-pointers-to-polaris',
      units: ['u1.3'],
      type: 'number',
      prompt:
        "The Plough's two pointer stars are Merak and Dubhe. Following the line from Merak through Dubhe, about how many times the Merak-Dubhe gap do you have to go to reach Polaris?",
      check(value) {
        const correct = Math.abs(value - pointerRatio) <= 0.3 * pointerRatio;
        return {
          correct,
          message: `The real star positions put Polaris about ${pointerRatio.toFixed(1)} times the Merak-Dubhe gap beyond Dubhe — close enough to the usual rule of thumb, "about five times".`,
        };
      },
    },
    {
      id: 'plough-handle-to-arcturus',
      units: ['u1.3'],
      type: 'choice',
      prompt: "Besides its two pointer stars, the Plough has a second pointer route: following the curve of its handle outward leads to which star?",
      options: ['Arcturus', 'Polaris', 'Sirius', 'Spica'],
      check(value) {
        const correct = value === 'Arcturus';
        return {
          correct,
          message:
            'Following the curve of the Plough\'s handle (Alkaid, Mizar, Alioth) round in the same arc leads to orange-tinted Arcturus — the mnemonic is "arc to Arcturus" (continuing past it in the same arc leads on to Spica). First draft, to be checked by the teacher: this route isn\'t drawn on this page\'s own diagrams, unlike the Pointers-to-Polaris route above.',
        };
      },
    },
    {
      id: 'orion-belt-pointers',
      units: ['u1.3'],
      fields: [
        {
          key: 'awayFromMintaka',
          type: 'choice',
          label: "Follow the Belt's line away from Mintaka — which bright star do you reach?",
          options: ['Sirius', 'Aldebaran', 'Polaris', 'Fomalhaut'],
        },
        {
          key: 'awayFromAlnilam',
          type: 'choice',
          label: "Follow the same line the other way, away from Alnilam — which orange star do you reach first?",
          options: ['Aldebaran', 'Sirius', 'Polaris', 'Fomalhaut'],
        },
        {
          key: 'beyondThatStar',
          type: 'choice',
          label: 'Carry on a little further along the same line — which object do you reach?',
          options: ['The Pleiades', 'The Andromeda Galaxy', 'Polaris', 'Sirius'],
        },
      ],
      prompt: "Orion's Belt (Mintaka, Alnilam, Alnitak) is itself a pointer, in both directions.",
      check(value) {
        const correct = value.awayFromMintaka === 'Sirius' && value.awayFromAlnilam === 'Aldebaran' && value.beyondThatStar === 'The Pleiades';
        return {
          correct,
          message:
            `Away from Mintaka, the Belt's line reaches Sirius, the brightest star in the night sky, about ${siriusRatio.toFixed(1)} times the Mintaka-Alnilam gap beyond Alnilam. The other way, away from Alnilam, it reaches orange Aldebaran after about ${aldebaranRatio.toFixed(1)} times that gap, and carrying on a little further (about ${pleiadesRatio.toFixed(1)} times the gap in total) reaches the Pleiades star cluster.`,
        };
      },
    },
    {
      id: 'square-of-pegasus-pointers',
      units: ['u1.3'],
      fields: [
        {
          key: 'westernSide',
          type: 'choice',
          label: "Follow the Square's western side, from Scheat through Markab, on towards the southern horizon — which star do you reach?",
          options: ['Fomalhaut', 'The Andromeda Galaxy', 'Polaris', 'Sirius'],
        },
        {
          key: 'diagonal',
          type: 'choice',
          label: 'Follow the diagonal instead, from Markab through Alpheratz — what do you reach?',
          options: ['The Andromeda Galaxy', 'Fomalhaut', 'Polaris', 'Sirius'],
        },
      ],
      prompt: 'The Square of Pegasus points two different ways, to two very different targets.',
      check(value) {
        const correct = value.westernSide === 'Fomalhaut' && value.diagonal === 'The Andromeda Galaxy';
        return {
          correct,
          message:
            `The western side, Scheat through Markab, continued about ${fomalhautRatio.toFixed(1)} times their own gap, reaches Fomalhaut, "the loneliest star". The diagonal, Markab through Alpheratz, continued about ${andromedaRatio.toFixed(1)} times its length, reaches the Andromeda Galaxy — the most distant object visible to the naked eye.`,
        };
      },
    },
  ];
}

const nakedEyeSkyQuestionsApi = { makeQuestions, PHENOMENA, PATTERN_IDS_AND_NAMES };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = nakedEyeSkyQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.NakedEyeSkyQuestions = nakedEyeSkyQuestionsApi;
}
