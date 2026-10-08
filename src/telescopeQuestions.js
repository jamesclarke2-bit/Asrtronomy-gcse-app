/**
 * Practice questions for notes/telescopes.html: the magnification,
 * light-grasp and resolution calculations (11.14-11.18, u5.2), and
 * choosing between telescope designs from their key elements
 * (11.19-11.23, 11.25, u5.1).
 *
 * Every number is computed live from src/telescopeModel.js, the same
 * engine the page's own sliders and live readouts use, so a question
 * can never quote a figure the page itself would disagree with.
 */

function makeQuestions(TelescopeModel, RayOptics) {
  const EYE_MM = TelescopeModel.DARK_ADAPTED_EYE_PUPIL_MM;

  const COMPARE_F_OBJECTIVE_MM = 500;
  const COMPARE_F_EYEPIECE_MM = 50;
  const keplerianCompare = RayOptics.refractorImageDescription(COMPARE_F_OBJECTIVE_MM, COMPARE_F_EYEPIECE_MM);
  const galileanCompare = RayOptics.refractorImageDescription(COMPARE_F_OBJECTIVE_MM, -COMPARE_F_EYEPIECE_MM);

  const magnificationAnswer = TelescopeModel.magnification(1200, 20);
  const lightGraspAnswer = TelescopeModel.lightGraspRatio(150, 50);
  const lightGraspVsEyeAnswer = TelescopeModel.lightGraspRatio(70, EYE_MM);
  const resolutionAnswer = TelescopeModel.resolutionArcsec(500, 60);

  return [
    {
      id: 'magnification-calculation',
      units: ['u5.2'],
      type: 'number',
      unitLabel: '×',
      prompt:
        'A telescope has an objective focal length of 1200 mm, and is used with a 20 mm eyepiece. Using magnification = f(objective) / f(eyepiece), calculate the magnification.',
      check(value) {
        const correct = Math.abs(value - magnificationAnswer) <= 1;
        return {
          correct,
          message: `magnification = f(objective) / f(eyepiece) = 1200 / 20 = ${magnificationAnswer}×.`,
        };
      },
    },
    {
      id: 'light-grasp-ratio',
      units: ['u5.2'],
      type: 'number',
      unitLabel: '×',
      prompt:
        'A 150 mm telescope is compared with a 50 mm telescope. Light grasp is proportional to the square of the objective diameter — how many times more light does the 150 mm telescope collect?',
      check(value) {
        const correct = Math.abs(value - lightGraspAnswer) <= 1;
        return {
          correct,
          message: `light grasp ratio = (D1 / D2)² = (150 / 50)² = 3² = ${lightGraspAnswer}× the light.`,
        };
      },
    },
    {
      id: 'light-grasp-vs-eye',
      units: ['u5.2'],
      type: 'number',
      unitLabel: '×',
      prompt: `A fully dark-adapted human pupil is about ${EYE_MM} mm across. Using the same D² rule, how many times more light does a 70 mm telescope collect than the naked eye?`,
      check(value) {
        const correct = Math.abs(value - lightGraspVsEyeAnswer) <= 5;
        return {
          correct,
          message: `light grasp ratio = (D1 / D2)² = (70 / ${EYE_MM})² = 10² = ${lightGraspVsEyeAnswer}× the light — the same reasoning gives the data sheet's own benchmark, that a 100 mm telescope collects about 200× the light of a dark-adapted eye: (100 / 7)² ≈ 204.`,
        };
      },
    },
    {
      id: 'resolution-calculation',
      units: ['u5.2'],
      type: 'number',
      unitLabel: 'arcseconds',
      prompt:
        'Using the Rayleigh criterion, angle (radians) = 1.22 x wavelength / diameter, calculate the angular resolution of a 60 mm telescope observing at a wavelength of 500 nm. Give your answer in arcseconds (1 radian = 206,265 arcseconds).',
      check(value) {
        const correct = Math.abs(value - resolutionAnswer) <= 0.3;
        return {
          correct,
          message:
            `angle = 1.22 × 500 × 10⁻⁹ / (60 × 10⁻³) = 1.22 × 500 × 10⁻⁹ / 0.06 = 1.02 × 10⁻⁵ radians. ` +
            `In arcseconds: 1.02 × 10⁻⁵ × 206,265 ≈ ${resolutionAnswer.toFixed(1)} arcseconds.`,
        };
      },
    },
    {
      id: 'what-changes-resolution',
      units: ['u5.2'],
      type: 'choice',
      prompt: "Which change actually improves a telescope's angular resolution (lets it distinguish finer detail)?",
      options: [
        'Using a shorter eyepiece focal length, to get more magnification',
        'Using a larger objective diameter, or observing at a shorter wavelength',
        'Using a longer objective focal length',
        "None of these change resolution — it's fixed once a telescope is built",
      ],
      check(value) {
        const correct = value === 'Using a larger objective diameter, or observing at a shorter wavelength';
        return {
          correct,
          message:
            "Resolution depends only on objective diameter and wavelength (angle = 1.22 x wavelength / diameter): a bigger objective or a shorter wavelength gives a smaller — better — resolvable angle. Magnification is a completely separate quantity, set by the two focal lengths (f(objective) / f(eyepiece)): cranking up magnification with a shorter eyepiece just blows up an already-blurry image, it doesn't resolve any more real detail. This mix-up — thinking more magnification means more resolution — is one of the most common mistakes with this topic.",
        };
      },
    },
    {
      id: 'chromatic-aberration',
      units: ['u5.1'],
      type: 'choice',
      prompt:
        "A refracting telescope shows a faint coloured fringe around bright objects (chromatic aberration), because its lens bends different wavelengths of light by slightly different amounts. Which telescope design eliminates this problem entirely, and why?",
      options: [
        'A Keplerian refractor — its inverted image cancels out the colour fringing',
        'A reflecting telescope (Newtonian or Cassegrain) — mirrors reflect every wavelength of light at the same angle, so there is no colour-dependent focusing error',
        'A Galilean refractor — its diverging eyepiece lens corrects the colours',
        'No design eliminates it — every telescope shows some chromatic aberration',
      ],
      check(value) {
        const correct =
          value ===
          'A reflecting telescope (Newtonian or Cassegrain) — mirrors reflect every wavelength of light at the same angle, so there is no colour-dependent focusing error';
        return {
          correct,
          message:
            "Chromatic aberration happens only in refracting telescopes, because a lens refracts (bends) different wavelengths by slightly different amounts, so they don't all focus at exactly the same point. A mirror works by reflection, not refraction — every wavelength bounces off at the same angle, so a Newtonian or Cassegrain reflector has no chromatic aberration at all. That's one of reflectors' real advantages over refractors, alongside being buildable far larger, folding a long focal length into a short tube, and letting multiple mirrors be combined.",
        };
      },
    },
    {
      id: 'choose-design-short-tube',
      units: ['u5.1'],
      type: 'choice',
      prompt:
        "An observer wants a long effective focal length, for high magnification on planets, but needs the telescope to fit in a short, portable tube, and doesn't mind a small obstruction from a secondary mirror. Which design suits them best, and why?",
      options: [
        'A Galilean refractor — its diverging eyepiece lens keeps the tube short',
        'A Keplerian refractor — a long focal length simply needs a long tube, which is fine here',
        'A Newtonian reflector — light travels straight from the primary to a secondary near the top, so the tube is about as long as the focal length',
        'A Cassegrain reflector — light reflects off the primary, then back off a secondary mirror through a hole in the primary, folding a long focal length into a short tube',
      ],
      check(value) {
        const correct =
          value ===
          'A Cassegrain reflector — light reflects off the primary, then back off a secondary mirror through a hole in the primary, folding a long focal length into a short tube';
        return {
          correct,
          message:
            "A Cassegrain folds its light path: the primary mirror reflects light forward to a convex secondary mirror, which reflects it straight back down through a hole in the primary to an eyepiece behind it. That doubles the light's travel distance inside a tube only about as long as the primary mirror's own mount, so a Cassegrain reaches a long effective focal length (and so high magnification) in a tube far shorter than a Newtonian or refractor would need for the same focal length — exactly the \"long focal length in a short tube\" advantage reflectors have.",
        };
      },
    },
    {
      id: 'why-galilean-upright',
      units: ['u5.1'],
      type: 'choice',
      prompt:
        "A Galilean eyepiece sits closer to the objective than its focal point, so the converging rays never actually cross anywhere; a Keplerian eyepiece sits beyond that focal point, so they do cross, forming a real (but upside-down) image there first. Why does that difference leave the Galilean image upright, and why does the Keplerian's inverted image not matter for astronomy?",
      options: [
        "The diverging Galilean eyepiece catches the rays while they're still travelling the same way up as the object and bends them back out parallel before they'd have crossed, so nothing ever flips; the Keplerian's rays do cross, flipping the image once — but a star or planet has no agreed \"right way up\" to compare it against, so an inverted view loses nothing an astronomer needs",
        'The Galilean lens flips the image twice, which cancels out, while the Keplerian only flips it once',
        "Both designs actually produce an inverted image; the Galilean's eyepiece then optically re-inverts it a second time to make it upright again",
        'Neither design truly inverts anything — it only looks upside down in a Keplerian because of how the eye interprets a magnified view',
      ],
      check(value) {
        const correct =
          value ===
          "The diverging Galilean eyepiece catches the rays while they're still travelling the same way up as the object and bends them back out parallel before they'd have crossed, so nothing ever flips; the Keplerian's rays do cross, flipping the image once — but a star or planet has no agreed \"right way up\" to compare it against, so an inverted view loses nothing an astronomer needs";
        return {
          correct,
          message:
            "An image flips exactly when the rays forming it actually cross the axis. A Keplerian's converging eyepiece sits beyond the objective's focal point, so the rays cross there first (a real intermediate image, already upside down) before the eyepiece bends them out parallel again — one crossing, one flip, inverted. A Galilean's diverging eyepiece sits closer in than that focal point, intercepting the still-converging rays before they'd have crossed at all, and bends them straight back out parallel — zero crossings, zero flips, upright. On the ground, upright matters (a bird the right way up is easier to track than one upside down); pointed at the sky, there's no \"up\" built into a star field to get wrong, so Keplerian's wider field and brighter view are worth the inversion, which is exactly why it's the layout almost every astronomical telescope and binocular pair actually uses.",
        };
      },
    },
    {
      id: 'compare-tube-length-magnification',
      units: ['u5.1', 'u5.2'],
      type: 'number',
      unitLabel: 'mm',
      prompt: `Using the exam's own magnification = f(objective) / f(eyepiece), and tube length = f(objective) + f(eyepiece) for an afocal refractor, take an objective focal length of ${COMPARE_F_OBJECTIVE_MM} mm and an eyepiece focal length of ${COMPARE_F_EYEPIECE_MM} mm. Calculate the Keplerian design's tube length.`,
      check(value) {
        const correct = Math.abs(value - keplerianCompare.eyepiecePositionMm) / keplerianCompare.eyepiecePositionMm < 0.02;
        return {
          correct,
          message:
            `Keplerian (converging eyepiece, f = +${COMPARE_F_EYEPIECE_MM} mm): tube length = f(objective) + f(eyepiece) = ${COMPARE_F_OBJECTIVE_MM} + ${COMPARE_F_EYEPIECE_MM} = ${keplerianCompare.eyepiecePositionMm.toFixed(0)} mm; ` +
            `magnification = f(objective) / f(eyepiece) = ${COMPARE_F_OBJECTIVE_MM} / ${COMPARE_F_EYEPIECE_MM} = ${keplerianCompare.magnification.toFixed(0)}x (inverted). ` +
            `Galilean (diverging eyepiece, f = -${COMPARE_F_EYEPIECE_MM} mm): tube length = ${COMPARE_F_OBJECTIVE_MM} + (-${COMPARE_F_EYEPIECE_MM}) = ${galileanCompare.eyepiecePositionMm.toFixed(0)} mm; ` +
            `magnification = ${COMPARE_F_OBJECTIVE_MM} / (-${COMPARE_F_EYEPIECE_MM}) = ${galileanCompare.magnification.toFixed(0)}x (upright). Same formula both times — only the eyepiece focal length's sign changes.`,
        };
      },
    },
  ];
}

const telescopeQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = telescopeQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.TelescopeQuestions = telescopeQuestionsApi;
}
