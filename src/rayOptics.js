/**
 * Thin-lens and mirror ray tracing in the paraxial approximation,
 * schematic rather than exact — enough to show *why* a telescope's
 * magnification, image orientation and tube length come out the way
 * they do, not a full optical-design tool.
 *
 * A ray is { height, angle }: height is its distance from the optical
 * axis (mm), angle its slope (radians, small-angle so angle ≈ tan(angle)
 * ≈ sin(angle)), both as they'd be measured at the current position
 * along the axis.
 *
 * A folded (mirror) system is traced "unfolded" onto one straight
 * axis, a standard simplification in optical design: a concave mirror
 * has exactly the same paraxial ray-transfer behaviour as a converging
 * thin lens of the same focal length, and a flat mirror (focal length
 * Infinity) just folds the path without changing height or angle at
 * all. That's also why the same two-thin-lens formulas below describe
 * a Cassegrain's primary+secondary pair.
 */
(function () {
  // Moves a ray forward by distanceMm with nothing in the way: height
  // changes with the ray's existing angle, angle itself doesn't.
  function propagateRay(ray, distanceMm) {
    return { height: ray.height + distanceMm * ray.angle, angle: ray.angle };
  }

  // A thin lens or mirror of focalLengthMm, right where the ray
  // currently is: height is unchanged (the element is infinitely
  // thin), angle bends by -height/focalLength. focalLengthMm can be
  // negative (a diverging lens, or a convex mirror) or Infinity (a
  // flat mirror: no bend at all, a pure fold).
  function refractRay(ray, focalLengthMm) {
    return { height: ray.height, angle: ray.angle - ray.height / focalLengthMm };
  }

  // Distance *from here* to where this ray crosses the optical axis
  // (height 0) — null if it never will (a ray running parallel to the
  // axis, angle 0, exactly the afocal case below).
  function focusDistanceMm(ray) {
    if (ray.angle === 0) return null;
    return -ray.height / ray.angle;
  }

  // The objective-eyepiece separation that makes a two-element system
  // afocal (a true telescope: parallel rays in, parallel rays out) —
  // simply the sum of the two focal lengths, negative eyepiece focal
  // lengths (a diverging, Galilean eyepiece) included.
  function afocalSeparationMm(fObjectiveMm, fEyepieceMm) {
    return fObjectiveMm + fEyepieceMm;
  }

  // The standard formula for a telescope's angular magnification.
  // Negative means inverted (Keplerian, Newtonian, Cassegrain);
  // positive means upright (Galilean, where fEyepieceMm is negative).
  function angularMagnification(fObjectiveMm, fEyepieceMm) {
    return -fObjectiveMm / fEyepieceMm;
  }

  // Traces one ray through an afocal objective+eyepiece system (at
  // their afocal separation) and reports what emerges. Called two
  // ways:
  //  - incomingAngleRad = 0, rayHeightAtObjectiveMm != 0: an on-axis
  //    star's parallel beam, entering off-centre — emergingAngleRad
  //    comes out ~0 too, confirming the system really is afocal.
  //  - rayHeightAtObjectiveMm = 0 (its default — a thin lens never
  //    bends a ray through its own centre), incomingAngleRad != 0: the
  //    chief ray from a star slightly off-axis — the ratio of
  //    emergingAngleRad to incomingAngleRad is the system's *traced*
  //    angular magnification, not just the formula above.
  function traceAfocalSystem(fObjectiveMm, fEyepieceMm, incomingAngleRad, rayHeightAtObjectiveMm = 0) {
    const separationMm = afocalSeparationMm(fObjectiveMm, fEyepieceMm);
    const afterObjective = refractRay({ height: rayHeightAtObjectiveMm, angle: incomingAngleRad }, fObjectiveMm);
    const atEyepiece = propagateRay(afterObjective, separationMm);
    const afterEyepiece = refractRay(atEyepiece, fEyepieceMm);
    return { separationMm, emergingAngleRad: afterEyepiece.angle, emergingHeightMm: afterEyepiece.height };
  }

  // A flat diagonal (Newtonian secondary) folds the beam without
  // changing its convergence at all, so the total optical path length
  // from the primary to the focus is just the primary's own focal
  // length, wherever along the beam the diagonal sits — only the
  // diagonal's own tilt sets how sharply the beam turns.
  function newtonianSystem(fPrimaryMm, diagonalDistanceMm, diagonalAngleDeg = 45) {
    return {
      totalPathMm: fPrimaryMm,
      turnAngleDeg: 2 * diagonalAngleDeg,
      pathPastDiagonalMm: fPrimaryMm - diagonalDistanceMm,
    };
  }

  // Effective focal length of two thin elements (lens or unfolded
  // mirror) of focal lengths f1Mm, f2Mm, separated by separationMm,
  // imaging an object at infinity — the standard compound-lens
  // formula, and (unfolded) exactly what a Cassegrain's primary and
  // secondary do together.
  function compoundEffectiveFocalLengthMm(f1Mm, f2Mm, separationMm) {
    return (f1Mm * f2Mm) / (f1Mm + f2Mm - separationMm);
  }

  // Back focal distance: how far past the second element (the
  // secondary mirror) the final image forms, along the same unfolded
  // axis.
  function compoundBackFocalDistanceMm(f1Mm, f2Mm, separationMm) {
    const effectiveFocalLengthMm = compoundEffectiveFocalLengthMm(f1Mm, f2Mm, separationMm);
    return (effectiveFocalLengthMm * (f1Mm - separationMm)) / f1Mm;
  }

  // A Cassegrain's primary (fPrimaryMm, concave) and secondary
  // (fSecondaryMm, convex — so negative), separationMm apart. The
  // image forms behind the secondary by backFocalDistanceMm, which —
  // since the secondary itself sits separationMm in front of the
  // primary — lands imageDistanceBehindPrimaryMm past the primary
  // itself, out through the hole in it.
  function cassegrainSystem(fPrimaryMm, fSecondaryMm, separationMm) {
    const effectiveFocalLengthMm = compoundEffectiveFocalLengthMm(fPrimaryMm, fSecondaryMm, separationMm);
    const backFocalDistanceMm = compoundBackFocalDistanceMm(fPrimaryMm, fSecondaryMm, separationMm);
    return {
      effectiveFocalLengthMm,
      backFocalDistanceMm,
      imageDistanceBehindPrimaryMm: backFocalDistanceMm - separationMm,
    };
  }

  // True field of view: the patch of real sky visible through the
  // eyepiece, found from the eyepiece's own fixed apparent field
  // (how wide a circle it presents to the eye) divided by magnification.
  function trueFieldOfViewDeg(apparentFieldDeg, magnification) {
    return apparentFieldDeg / magnification;
  }

  // How wide a target of trueAngularSizeDeg looks once magnified —
  // compare against the eyepiece's own apparentFieldDeg to see
  // whether it fits inside the view or is cropped by it.
  function apparentSizeDeg(magnification, trueAngularSizeDeg) {
    return magnification * trueAngularSizeDeg;
  }

  // --- Galilean vs Keplerian: what actually differs between them -------

  // The emerging beam (the "exit pupil") is narrower than the
  // objective by exactly the magnification — the same beam of
  // starlight, concentrated by the system down to a tenth of its
  // entering width at 10x, say, which is also why a low-power eyepiece
  // feels brighter to look through than a high-power one on the same
  // telescope: all the light the objective gathered is packed into a
  // smaller beam for the eye's own small pupil to catch.
  function exitBeamWidthMm(objectiveDiameterMm, magnification) {
    return objectiveDiameterMm / Math.abs(magnification);
  }

  // A thin lens's own shape and behaviour from its signed focal
  // length: positive (converging) is convex, drawn thick in the
  // middle; negative (diverging) is concave, drawn thin in the middle.
  // The exam only ever gives focal lengths as positive numbers (the
  // sign here is this engine's own bookkeeping for which way a lens
  // bends light, not something to show a student as a minus sign).
  function eyepieceLensDescription(focalLengthMm) {
    const converging = focalLengthMm > 0;
    return {
      converging,
      shape: converging ? 'convex' : 'concave',
      behaviour: converging ? 'converging' : 'diverging',
      label: converging ? 'convex (converging) lens' : 'concave (diverging) lens',
    };
  }

  // Whether a real image forms at the objective's own focal point
  // (distance fObjectiveMm from it, along the tube) — only if the
  // eyepiece sits *beyond* that point, giving the converging rays room
  // to actually cross before the eyepiece catches them. A Keplerian
  // eyepiece (further out than the focal point) lets that crossing
  // happen; a Galilean eyepiece (closer in than the focal point)
  // intercepts the rays first, so they never actually cross anywhere —
  // no real image forms at all, just the virtual one the eye sees.
  function formsRealIntermediateImage(fObjectiveMm, eyepiecePositionMm) {
    return eyepiecePositionMm > fObjectiveMm;
  }

  // Full description of a refractor's final image, straight from the
  // same two numbers (fObjectiveMm, fEyepieceSignedMm) that place and
  // size everything else about it — so this can never disagree with
  // what the ray-traced diagram actually shows.
  function refractorImageDescription(fObjectiveMm, fEyepieceSignedMm) {
    const eyepiecePositionMm = afocalSeparationMm(fObjectiveMm, fEyepieceSignedMm);
    const magnification = angularMagnification(fObjectiveMm, fEyepieceSignedMm);
    return {
      eyepiecePositionMm,
      magnification,
      realImage: formsRealIntermediateImage(fObjectiveMm, eyepiecePositionMm),
      orientation: magnification < 0 ? 'inverted' : 'upright',
    };
  }

  const api = {
    propagateRay,
    refractRay,
    focusDistanceMm,
    afocalSeparationMm,
    angularMagnification,
    traceAfocalSystem,
    newtonianSystem,
    compoundEffectiveFocalLengthMm,
    compoundBackFocalDistanceMm,
    cassegrainSystem,
    trueFieldOfViewDeg,
    apparentSizeDeg,
    exitBeamWidthMm,
    eyepieceLensDescription,
    formsRealIntermediateImage,
    refractorImageDescription,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.RayOptics = api;
  }
})();
