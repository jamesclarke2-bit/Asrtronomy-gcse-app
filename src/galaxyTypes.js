/**
 * The Hubble classification, for notes/galaxy-types.html (spec 15.6,
 * 15.7). The spec asks students to classify into four classes (spiral,
 * barred spiral, elliptical, irregular); the sub-types (E0-E7, Sa-Sc,
 * SBa-SBc, S0) appear only on the tuning fork (15.7), where Hubble placed
 * them, and in the Milky Way's own type, SBb (15.8).
 */
(function () {
  const CLASSES = [
    { id: 'spiral', name: 'Spiral', clue: 'a round central bulge with spiral arms winding out from it' },
    { id: 'barred', name: 'Barred spiral', clue: 'a straight bar of stars through the centre, with the arms starting from its ends' },
    { id: 'elliptical', name: 'Elliptical', clue: 'a smooth oval or round glow with no arms' },
    { id: 'irregular', name: 'Irregular', clue: 'no regular shape: a ragged scatter of clumps' },
  ];

  /**
   * The drawn galaxies to sort. `draw` is what GalaxyDrawing draws; the
   * answer is the class. Mixed sub-types, tilts and angles so the class,
   * not one look, is what matches.
   */
  const SORT_SET = [
    { id: 'g1', draw: { kind: 'elliptical', e: 1, angle: 0 }, answer: 'elliptical' },
    { id: 'g2', draw: { kind: 'spiral', sub: 'b', tilt: 0.1, angle: 20 }, answer: 'spiral' },
    { id: 'g3', draw: { kind: 'barred', sub: 'b', tilt: 0, angle: -15 }, answer: 'barred' },
    { id: 'g4', draw: { kind: 'irregular', seed: 11 }, answer: 'irregular' },
    { id: 'g5', draw: { kind: 'elliptical', e: 6, angle: 30 }, answer: 'elliptical' },
    { id: 'g6', draw: { kind: 'spiral', sub: 'c', tilt: 0.35, angle: -30 }, answer: 'spiral' },
    { id: 'g7', draw: { kind: 'barred', sub: 'c', tilt: 0.2, angle: 40 }, answer: 'barred' },
    { id: 'g8', draw: { kind: 'irregular', seed: 29 }, answer: 'irregular' },
  ];

  /**
   * Hubble's tuning fork: positions in a 640 x 420 drawing. Ellipticals
   * along the handle (E0 round to E7 flattest), S0 at the fork, spirals
   * on the upper prong and barred spirals on the lower (a to c: bulge
   * smaller, arms looser). Irregulars sit off the fork.
   */
  const FORK = [
    { label: 'E0', draw: { kind: 'elliptical', e: 0 }, x: 56, y: 190 },
    { label: 'E3', draw: { kind: 'elliptical', e: 3 }, x: 134, y: 190 },
    { label: 'E7', draw: { kind: 'elliptical', e: 7 }, x: 212, y: 190 },
    { label: 'S0', draw: { kind: 'lenticular' }, x: 292, y: 190 },
    { label: 'Sa', draw: { kind: 'spiral', sub: 'a' }, x: 392, y: 92 },
    { label: 'Sb', draw: { kind: 'spiral', sub: 'b' }, x: 482, y: 92 },
    { label: 'Sc', draw: { kind: 'spiral', sub: 'c' }, x: 572, y: 92 },
    { label: 'SBa', draw: { kind: 'barred', sub: 'a' }, x: 392, y: 288 },
    { label: 'SBb', draw: { kind: 'barred', sub: 'b' }, x: 482, y: 288 },
    { label: 'SBc', draw: { kind: 'barred', sub: 'c' }, x: 572, y: 288 },
  ];
  const FORK_IRREGULAR = { label: 'Irr', draw: { kind: 'irregular', seed: 5 }, x: 90, y: 340 };
  const MILKY_WAY_TYPE = 'SBb';

  function classById(id) {
    return CLASSES.find((c) => c.id === id);
  }

  function sortItem(id) {
    return SORT_SET.find((s) => s.id === id);
  }

  /** Feedback for one sorting choice: { correct, text }, said in words, not colour. */
  function feedback(item, choiceId) {
    const right = classById(item.answer);
    if (choiceId === item.answer) return { correct: true, text: `✓ Correct: ${right.name.toLowerCase()}, ${right.clue}.` };
    const chosen = classById(choiceId);
    return { correct: false, text: `✗ Not ${chosen.name.toLowerCase()}. Look again: it is ${right.name.toLowerCase()}, ${right.clue}.` };
  }

  /** The tuning-fork position of a label, e.g. 'SBb'. */
  function forkSpot(label) {
    return FORK.find((f) => f.label === label) || (label === 'Irr' ? FORK_IRREGULAR : undefined);
  }

  const api = { CLASSES, SORT_SET, FORK, FORK_IRREGULAR, MILKY_WAY_TYPE, classById, sortItem, feedback, forkSpot };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.GalaxyTypes = api;
  }
})();
