/**
 * Label text for notes/telescopes.html's diagrams — kept separate from
 * the drawing code (telescopes.js) and built from the same
 * src/rayOptics.js functions that place and size everything on screen,
 * so a label can never say something the picture doesn't show.
 *
 * Every function here is pure (state in, label array out) so it can be
 * unit-tested without a DOM — see test/telescopeLabels.test.js. Each
 * label is { id, key, text }: `key` marks it as one of the essential
 * labels shown in "key only" mode (notes/telescopes.js maps `id` to an
 * actual on-screen anchor point and renders it as a
 * .labelled-diagram-label, the same convention notes/moon-structure.js
 * uses).
 *
 * A fixed reference "angle in" of 1.0° (ANGLE_IN_REF_DEG below) is used
 * throughout for the "angle in" / "angle out" labels — not a measured
 * quantity, just a convenient, honest stand-in so the ratio between
 * them reads as the real angular magnification.
 */
function makeTelescopeLabels(RayOptics) {
  const ANGLE_IN_REF_DEG = 1.0;

  function round(value) {
    return Math.round(value * 10) / 10;
  }

  // --- "How a lens and a mirror focus light" ----------------------------

  function focusDiagramLabels(apertureMm, focalLengthMm, isMirror) {
    return [
      {
        id: 'element-type',
        key: true,
        text: isMirror ? 'concave (converging) mirror' : 'convex (converging) lens',
      },
      { id: 'principal-axis', key: false, text: 'principal axis' },
      { id: 'focal-point', key: true, text: 'focal point' },
      { id: 'focal-length', key: true, text: `focal length f = ${focalLengthMm} mm` },
      { id: 'parallel-rays', key: false, text: 'parallel rays from a distant object' },
      { id: 'aperture', key: false, text: `aperture (diameter) = ${apertureMm} mm` },
    ];
  }

  // --- The telescope bench, any of the four designs ----------------------

  function benchLabels(design, objectiveDiameterMm, objectiveFocalLengthMm, eyepieceFocalLengthMm) {
    const isReflector = design === 'newtonian' || design === 'cassegrain';
    const labels = [
      {
        id: 'objective-type',
        key: true,
        text: isReflector ? 'concave primary mirror' : 'convex lens',
      },
      { id: 'objective-f', key: true, text: `f = ${objectiveFocalLengthMm} mm` },
      { id: 'objective-diameter', key: false, text: `diameter = ${objectiveDiameterMm} mm` },
    ];

    let secondaryDescription;
    let realImage;
    let magnification;

    if (design === 'galilean' || design === 'keplerian') {
      const fEyepieceSignedMm = design === 'galilean' ? -eyepieceFocalLengthMm : eyepieceFocalLengthMm;
      secondaryDescription = RayOptics.eyepieceLensDescription(fEyepieceSignedMm);
      const image = RayOptics.refractorImageDescription(objectiveFocalLengthMm, fEyepieceSignedMm);
      realImage = image.realImage;
      magnification = image.magnification;
      labels.push({ id: 'secondary-type', key: true, text: secondaryDescription.label });
      labels.push({ id: 'secondary-f', key: true, text: `f = ${eyepieceFocalLengthMm} mm` });
    } else if (design === 'newtonian') {
      realImage = true; // same as Keplerian: the diagonal only folds the path, it doesn't change this
      magnification = RayOptics.angularMagnification(objectiveFocalLengthMm, eyepieceFocalLengthMm);
      labels.push({ id: 'secondary-type', key: true, text: 'flat diagonal mirror' });
      labels.push({ id: 'secondary-note', key: false, text: 'eyepiece at the side' });
      labels.push({ id: 'eyepiece-f', key: true, text: `f = ${eyepieceFocalLengthMm} mm` });
    } else {
      const secondaryFocalLengthMm = -objectiveFocalLengthMm / 4;
      const separationMm = objectiveFocalLengthMm * 0.8;
      const system = RayOptics.cassegrainSystem(objectiveFocalLengthMm, secondaryFocalLengthMm, separationMm);
      realImage = true;
      magnification = RayOptics.angularMagnification(system.effectiveFocalLengthMm, eyepieceFocalLengthMm);
      labels.push({ id: 'secondary-type', key: true, text: 'convex secondary mirror' });
      labels.push({ id: 'hole-note', key: false, text: 'primary has a hole' });
      labels.push({ id: 'path-note', key: false, text: 'light passes through the hole to the eyepiece' });
      labels.push({ id: 'eyepiece-f', key: true, text: `f = ${eyepieceFocalLengthMm} mm` });
    }

    labels.push({ id: 'ray-entry', key: false, text: 'parallel rays from a distant star' });
    labels.push({ id: 'ray-converge', key: false, text: 'converging rays' });
    labels.push({ id: 'ray-exit', key: false, text: 'parallel rays leave the eyepiece' });

    labels.push({ id: 'image-type', key: true, text: realImage ? 'real image' : 'no real image' });
    labels.push({ id: 'image-orientation', key: true, text: magnification < 0 ? 'inverted' : 'upright' });
    labels.push({ id: 'virtual-image', key: false, text: 'virtual image seen by the eye' });

    const angleOutDeg = magnification * ANGLE_IN_REF_DEG;
    labels.push({ id: 'angle-in', key: false, text: `angle in ≈ ${ANGLE_IN_REF_DEG.toFixed(1)}°` });
    labels.push({ id: 'angle-out', key: false, text: `angle out ≈ ${Math.abs(round(angleOutDeg)).toFixed(1)}°` });

    return labels;
  }

  // --- The Galilean-or-Keplerian comparison panel -------------------------

  function compareLabels(mode, objectiveFocalLengthMm, eyepieceFocalLengthMagnitudeMm) {
    const fEyepieceSignedMm = mode === 'galilean' ? -eyepieceFocalLengthMagnitudeMm : eyepieceFocalLengthMagnitudeMm;
    const image = RayOptics.refractorImageDescription(objectiveFocalLengthMm, fEyepieceSignedMm);
    const eyepieceDescription = RayOptics.eyepieceLensDescription(fEyepieceSignedMm);
    const angleOutDeg = image.magnification * ANGLE_IN_REF_DEG;

    const labels = [
      { id: 'objective-type', key: true, text: 'convex lens' },
      { id: 'objective-f', key: true, text: `f = ${objectiveFocalLengthMm} mm` },
      { id: 'focal-point', key: true, text: "the objective's focal point, F" },
      { id: 'secondary-type', key: true, text: eyepieceDescription.label },
      { id: 'secondary-f', key: true, text: `f = ${eyepieceFocalLengthMagnitudeMm} mm` },
      { id: 'image-type', key: true, text: image.realImage ? 'a real image forms here' : 'the rays would have focused here' },
      { id: 'image-orientation', key: true, text: image.orientation },
      { id: 'ray-exit', key: false, text: 'parallel rays leave the eyepiece' },
      { id: 'angle-in', key: false, text: `angle in ≈ ${ANGLE_IN_REF_DEG.toFixed(1)}°` },
      { id: 'angle-out', key: false, text: `angle out ≈ ${Math.abs(round(angleOutDeg)).toFixed(1)}°` },
      { id: 'tube-length', key: true, text: `tube length = ${image.eyepiecePositionMm.toFixed(0)} mm` },
      { id: 'field-of-view', key: false, text: mode === 'galilean' ? 'field of view: narrower' : 'field of view: wider' },
      { id: 'magnification', key: true, text: `magnification = ${image.magnification > 0 ? '+' : ''}${image.magnification.toFixed(0)}x` },
    ];

    return { ...image, eyepieceDescription, labels };
  }

  // --- Shared: filtering for the "Labels: all / key only / off" control ---

  function filterLabelsByMode(labels, mode) {
    if (mode === 'off') return [];
    if (mode === 'key') return labels.filter((label) => label.key);
    return labels;
  }

  return { ANGLE_IN_REF_DEG, focusDiagramLabels, benchLabels, compareLabels, filterLabelsByMode };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { makeTelescopeLabels, ...makeTelescopeLabels(require('../src/rayOptics')) };
} else if (typeof window !== 'undefined') {
  window.TelescopeLabels = makeTelescopeLabels(window.RayOptics);
}
