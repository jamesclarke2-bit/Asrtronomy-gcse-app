/**
 * The life of a much more massive star, for notes/massive-stars.html (spec
 * 13.8, 14.6, 14.7, 14.8 and 14.10).
 *
 * STAGES mirror SunLikeStar.STAGES (src/sunLikeStar.js), so the two pages
 * read as a pair: each stage's time, what happens to the core, and the
 * outward push against gravity (`balance`) that the page draws as force
 * arrows. The neutron star and the black hole are the two possible ends.
 *
 * coreEnd(mass) is the Chandrasekhar-limit picture: a dead core below about
 * 1.4 times the Sun's mass is held up by electron pressure (a white dwarf);
 * above it electron pressure fails and the core collapses to a neutron star,
 * held up by neutron pressure, up to about 3 times the Sun's mass; heavier
 * still, nothing can stop the collapse: a black hole.
 *
 * Every value, time and mass is general knowledge, labelled a first draft
 * on the page; the Sun-like main-sequence time is SunLikeStar's.
 */
(function () {
  const isNode = typeof require !== 'undefined' && typeof module !== 'undefined';
  const SunLikeStar = isNode ? require('./sunLikeStar') : window.SunLikeStar;

  const MASSIVE_MIN_MSUN = 8;
  const EXAMPLE_MSUN = 20;
  const CHANDRASEKHAR_MSUN = 1.4;
  const NEUTRON_STAR_MAX_MSUN = 3;

  const STAGES = [
    {
      id: 'nebula',
      name: 'Nebula',
      time: 'millions of years, as for a Sun-like star',
      years: 1e6,
      core: 'An emission or absorption nebula, as for a Sun-like star; a bigger clump collapses, through a protostar, into a much more massive star.',
      balance: { out: 0.6, in: 0.6, outName: 'gas pressure', inName: 'gravity', verdict: 'As for a Sun-like star: gas pressure holds the cloud up until part of it is squeezed and gravity starts to win.' },
    },
    {
      id: 'main-sequence',
      name: 'Main sequence',
      time: 'about 10 million years (for a star about 20 times the Sun’s mass)',
      years: 1e7,
      core: 'Hydrogen fuses into helium, far hotter and faster than in the Sun.',
      balance: { out: 1, in: 1, outName: 'radiation pressure', inName: 'gravity', verdict: 'Balanced, as in the Sun, but both are far stronger: the huge pull of gravity is matched by a huge outward radiation pressure from very fast fusion.' },
    },
    {
      id: 'red-supergiant',
      name: 'Red supergiant',
      time: 'about 1 million years',
      years: 1e6,
      core: 'Each time a fuel runs out the core shrinks and heats up, and fuses heavier elements in turn: helium to carbon, then oxygen, and on up to iron.',
      balance: { out: 1.35, in: 0.75, outName: 'radiation pressure', inName: 'gravity', verdict: 'Out of balance: the core shrinks under gravity each time a fuel runs out, while radiation pressure from fusion in shells around it pushes the outer layers out, hundreds of times wider than the Sun.' },
    },
    {
      id: 'supernova',
      name: 'Supernova',
      time: 'the core collapses in under a second; the explosion fades over months',
      years: null,
      core: 'Fusing iron releases no energy, so fusion stops and the core collapses; the outer layers are blasted out in an explosion that can outshine a whole galaxy.',
      balance: { out: 0.15, in: 1.4, outName: 'radiation pressure', inName: 'gravity', verdict: 'Gravity wins at once: with no energy from fusing iron, radiation pressure fails and the core collapses in under a second; the rebound blasts the rest of the star outward.' },
    },
    {
      id: 'neutron-star',
      name: 'Neutron star',
      time: 'billions of years, slowly cooling',
      years: 1e10,
      core: 'A collapsed core of neutrons, only about 20 km across but with more mass than the Sun.',
      balance: { out: 1, in: 1, outName: 'neutron pressure', inName: 'gravity', verdict: 'Balanced by neutron pressure: the neutrons are squeezed so close that they resist being squeezed any closer, holding the core up against gravity.' },
    },
    {
      id: 'black-hole',
      name: 'Black hole',
      time: 'for ever, as far as we know',
      years: null,
      core: 'A core too heavy for even neutron pressure collapses for good; its gravity is so strong that not even light can escape.',
      balance: { out: 0, in: 1.4, outName: 'no pressure', inName: 'gravity', verdict: 'Gravity wins completely: no pressure can hold up a core this heavy, so it collapses for good.' },
    },
  ];

  function stage(id) {
    const s = STAGES.find((x) => x.id === id);
    if (!s) throw new Error(`No stage ${id}`);
    return s;
  }

  /** 'steady', 'swelling', 'shrinking' or 'collapsing'. */
  function trend(id) {
    const b = stage(id).balance;
    if (Math.abs(b.out - b.in) < 1e-9) return 'steady';
    if (b.out > b.in) return 'swelling';
    return b.in - b.out > 0.6 ? 'collapsing' : 'shrinking';
  }

  /** What a dead core of this mass (in Sun masses) ends as, and what holds it up. */
  function coreEnd(massMsun) {
    if (massMsun < CHANDRASEKHAR_MSUN) return { id: 'white-dwarf', name: 'white dwarf', heldBy: 'electron pressure', page: 'sun-like-star.html' };
    if (massMsun < NEUTRON_STAR_MAX_MSUN) return { id: 'neutron-star', name: 'neutron star', heldBy: 'neutron pressure', page: null };
    return { id: 'black-hole', name: 'black hole', heldBy: 'nothing: it collapses for good', page: null };
  }

  /** How many times shorter the massive star's main sequence is than a Sun-like star's. */
  function mainSequenceRatio() {
    return SunLikeStar.stage('main-sequence').years / stage('main-sequence').years;
  }

  const api = { MASSIVE_MIN_MSUN, EXAMPLE_MSUN, CHANDRASEKHAR_MSUN, NEUTRON_STAR_MAX_MSUN, STAGES, stage, trend, coreEnd, mainSequenceRatio };
  if (isNode && module.exports) {
    module.exports = api;
  } else {
    window.MassiveStar = api;
  }
})();
