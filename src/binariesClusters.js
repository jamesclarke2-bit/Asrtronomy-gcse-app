/**
 * Binary stars, star clusters and the view through a telescope, for
 * notes/binaries-and-clusters.html.
 *
 * Reused rather than rewritten:
 *   - TelescopeModel (src/telescopeModel.js): resolution (Rayleigh
 *     criterion) and the dark-adapted eye's 7 mm pupil, exactly as
 *     notes/telescopes.html uses them;
 *   - StarPatterns (src/starPatterns.js): Mizar's, the Pleiades' and the
 *     Andromeda Galaxy's magnitudes, as notes/naked-eye-sky.html uses them;
 *   - Spectra (src/spectra.js): the Doppler shift of a spectral line, as
 *     notes/reading-a-spectrum.html uses it;
 *   - the simulated close pair's 2.0 arcsecond separation matches the
 *     simulated double star on notes/telescopes.html.
 *
 * Everything an eyepiece "shows" here is a teaching model, not a rendering
 * of real photometry: limiting magnitude 2 + 5 log10(D in mm) is a common
 * rule of thumb, and an extended object's surface brightness is taken to
 * scale with the exit pupil (aperture / magnification) squared, capped at
 * the eye's own pupil. Facts about the real objects are general knowledge,
 * checked by the teacher.
 */
(function () {
  const isNode = typeof require !== 'undefined' && typeof module !== 'undefined';
  const TelescopeModel = isNode ? require('./telescopeModel') : window.TelescopeModel;
  const StarPatterns = isNode ? require('./starPatterns') : window.StarPatterns;
  const Spectra = isNode ? require('./spectra') : window.Spectra;

  // ---- Binary orbits about the centre of mass -------------------------

  /**
   * Two stars on circular orbits about their common centre of mass (the
   * origin), separation a, heavier star mass ratio q = m1/m2 >= 1, at
   * orbital phase phaseDeg. The heavier star (1) is always closer to the
   * centre of mass: r1 / r2 = m2 / m1.
   */
  function binaryPositions(q, a, phaseDeg) {
    const r1 = a / (1 + q);
    const r2 = (a * q) / (1 + q);
    const t = (phaseDeg * Math.PI) / 180;
    return {
      r1,
      r2,
      star1: { x: r1 * Math.cos(t), y: r1 * Math.sin(t) },
      star2: { x: -r2 * Math.cos(t), y: -r2 * Math.sin(t) },
    };
  }

  /**
   * Line-of-sight velocities (positive = moving away) for an observer far
   * off in the +y direction, with the stars moving anticlockwise, the
   * lighter star at speed v2 and the heavier at v2 / q.
   */
  function radialVelocities(q, phaseDeg, v2KmPerS) {
    const t = (phaseDeg * Math.PI) / 180;
    // Star 1 at angle t moves along (-sin t, cos t); star 2 opposite.
    const v1 = v2KmPerS / q;
    return { star1: -v1 * Math.cos(t), star2: v2KmPerS * Math.cos(t) };
  }

  /** Where a line of rest wavelength restNm appears for a star receding at vKmPerS. */
  function shiftedLineNm(restNm, vKmPerS) {
    return Spectra.dopplerShift(restNm, vKmPerS * 1000);
  }

  // ---- The view through an eyepiece ----------------------------------

  const EYE_PUPIL_MM = TelescopeModel.DARK_ADAPTED_EYE_PUPIL_MM;
  // The eye can just separate two points about 1 arcminute apart.
  const EYE_RESOLUTION_ARCSEC = 60;
  const WAVELENGTH_NM = 550;
  // A typical eyepiece's own apparent field of view.
  const APPARENT_FIELD_DEG = 50;
  // Sky glow in a town hides the faintest stars, about two magnitudes' worth.
  const TOWN_SKY_PENALTY_MAG = 2;

  /** Faintest star magnitude visible: 2 + 5 log10(D in mm), less in a town sky. */
  function limitingMagnitude(apertureMm, darkSky = true) {
    return 2 + 5 * Math.log10(apertureMm) - (darkSky ? 0 : TOWN_SKY_PENALTY_MAG);
  }

  /** How much sky the view covers, in arcminutes across. */
  function trueFieldArcmin(magnification) {
    return (APPARENT_FIELD_DEG * 60) / magnification;
  }

  /** Exit pupil: the width of the beam leaving the eyepiece, in mm. */
  function exitPupilMm(apertureMm, magnification) {
    return apertureMm / magnification;
  }

  /**
   * Surface brightness of an extended object (a nebula, a galaxy, a
   * cluster's glow) compared with the best possible, 1: the exit pupil
   * squared, capped at the eye's own pupil. Higher magnification spreads
   * the same light over a bigger image, so it looks dimmer.
   */
  function surfaceBrightness(apertureMm, magnification) {
    const pupil = Math.min(exitPupilMm(apertureMm, magnification), EYE_PUPIL_MM);
    return (pupil * pupil) / (EYE_PUPIL_MM * EYE_PUPIL_MM);
  }

  function resolutionArcsec(apertureMm) {
    return TelescopeModel.resolutionArcsec(WAVELENGTH_NM, apertureMm);
  }

  /**
   * Does a pair of stars sepArcsec apart split? Only if the telescope can
   * resolve them AND the magnification makes them far enough apart for
   * the eye to see the gap.
   */
  function pairSplits(sepArcsec, apertureMm, magnification) {
    return resolutionArcsec(apertureMm) < sepArcsec && sepArcsec * magnification >= EYE_RESOLUTION_ARCSEC;
  }

  /** Why a pair does or doesn't split, for the readout. */
  function pairStatus(sepArcsec, apertureMm, magnification) {
    if (resolutionArcsec(apertureMm) >= sepArcsec) return 'aperture';
    if (sepArcsec * magnification < EYE_RESOLUTION_ARCSEC) return 'magnification';
    return 'split';
  }

  // ---- The real (and one simulated) objects ---------------------------

  const mag = (key) => StarPatterns.STARS[key].mag;

  const OBJECTS = [
    {
      id: 'star',
      name: 'a single star',
      kind: 'star',
      spec: '13.34a',
      facts: [],
    },
    {
      id: 'mizar',
      name: 'Mizar, a double star',
      kind: 'double',
      spec: '13.34b',
      separationArcsec: 14,
      magnitudes: [mag('mizar'), 3.9],
      facts: [
        'Mizar is the second star from the end of the handle of the Plough.',
        'Mizar A and Mizar B are about 14 arcseconds apart, so a small telescope splits them.',
        'The fainter naked-eye star Alcor sits about 12 arcminutes away.',
        'Mizar A was the first spectroscopic binary to be discovered, in 1889.',
      ],
    },
    {
      id: 'binary',
      name: 'a close binary (simulated)',
      kind: 'double',
      spec: '13.34c',
      separationArcsec: 2.0,
      magnitudes: [5.0, 5.5],
      facts: [],
    },
    {
      id: 'pleiades',
      name: 'the Pleiades, an open cluster',
      kind: 'open',
      spec: '13.34d',
      sizeArcmin: 110,
      brightestMag: mag('alcyone'),
      facts: [
        'The Pleiades (M45) is in Taurus, about 440 light years away.',
        'It is about 100 million years old: young for a star cluster.',
        'It has over 1,000 member stars; 6 or 7 can be seen with the naked eye.',
        'It spans about 2 degrees of sky, about three and a half times the full Moon\u2019s width.',
      ],
    },
    {
      id: 'm13',
      name: 'M13, a globular cluster',
      kind: 'globular',
      spec: '13.34e',
      sizeArcmin: 20,
      totalMag: 5.8,
      brightestMag: 11.9,
      facts: [
        'M13 is in Hercules, about 25,000 light years away.',
        'It holds several hundred thousand stars and is about 12 billion years old.',
        'It is about 20 arcminutes across; at magnitude 5.8 it is just visible to the naked eye on a dark night.',
      ],
    },
    {
      id: 'm42',
      name: 'the Orion Nebula (M42)',
      kind: 'nebula',
      spec: '13.34f',
      sizeArcmin: 65,
      totalMag: 4.0,
      facts: [
        "The Orion Nebula is in Orion's Sword, about 1,300 light years away.",
        'It is a cloud of gas and dust in which new stars are forming.',
        'It is about 1 degree across; to the eye it is a faint grey-green glow.',
        'Its red and pink colours appear only in long-exposure photographs.',
      ],
    },
    {
      id: 'm31',
      name: 'the Andromeda Galaxy (M31)',
      kind: 'galaxy',
      spec: '13.34g',
      sizeArcmin: 190,
      totalMag: mag('andromedaGalaxy'),
      facts: [
        'The Andromeda Galaxy is a spiral galaxy about 2.5 million light years away.',
        'It is the most distant object most people can see with the naked eye.',
        'Its disc spans about 3 degrees in photographs, but the eye sees mainly its bright core.',
      ],
    },
  ];

  function objectById(id) {
    return OBJECTS.find((o) => o.id === id);
  }

  // ---- What an eyepiece shows of each kind of object ------------------

  // A long exposure reaches about three magnitudes fainter than the eye.
  const PHOTO_GAIN_MAG = 3;

  // Galaxy and nebula detail thresholds, in mm of aperture.
  const GALAXY_DISC_MM = 100;
  const GALAXY_DUST_LANE_MM = 200;

  /**
   * The headline of what the view shows, for every kind of object, as
   * plain flags the page draws from and the readout describes.
   */
  function viewOf(objectId, { apertureMm, magnification, darkSky = true, photograph = false }) {
    const obj = objectById(objectId);
    const lim = limitingMagnitude(apertureMm, darkSky) + (photograph ? PHOTO_GAIN_MAG : 0);
    const sb = surfaceBrightness(apertureMm, magnification);
    const view = { kind: obj.kind, limitingMagnitude: lim, surfaceBrightness: sb, sizeArcmin: 0 };
    if (obj.kind === 'double') {
      view.status = pairStatus(obj.separationArcsec, apertureMm, magnification);
      view.split = view.status === 'split';
    }
    if (obj.sizeArcmin) view.sizeArcmin = obj.sizeArcmin;
    if (obj.kind === 'globular') {
      // Edge stars resolve once the faintest visible stars reach its brightest members.
      view.edgeStarsResolved = lim >= obj.brightestMag && resolutionArcsec(apertureMm) < 3;
      view.coreResolved = false;
    }
    if (obj.kind === 'nebula') {
      view.colours = photograph;
    }
    if (obj.kind === 'galaxy') {
      view.disc = photograph || (apertureMm >= GALAXY_DISC_MM && darkSky);
      view.dustLanes = photograph || (apertureMm >= GALAXY_DUST_LANE_MM && darkSky);
      view.spiralArms = photograph;
    }
    return view;
  }

  // ---- Open against globular clusters ---------------------------------

  const CLUSTER_TABLE = [
    { feature: 'Number of stars', open: 'tens to a few thousand', globular: 'hundreds of thousands' },
    { feature: 'Shape', open: 'loose and irregular', globular: 'dense and spherical, crowded towards the centre' },
    { feature: 'Typical age (years)', open: 'young: up to a few hundred million', globular: 'very old: about 10 to 13 billion' },
    { feature: 'Where in the Galaxy', open: 'in the disc', globular: 'in the halo around the Galaxy' },
    { feature: 'Example', open: 'the Pleiades', globular: 'M13 in Hercules' },
  ];

  const api = {
    binaryPositions,
    radialVelocities,
    shiftedLineNm,
    EYE_PUPIL_MM,
    EYE_RESOLUTION_ARCSEC,
    WAVELENGTH_NM,
    APPARENT_FIELD_DEG,
    TOWN_SKY_PENALTY_MAG,
    GALAXY_DISC_MM,
    PHOTO_GAIN_MAG,
    GALAXY_DUST_LANE_MM,
    limitingMagnitude,
    trueFieldArcmin,
    exitPupilMm,
    surfaceBrightness,
    resolutionArcsec,
    pairSplits,
    pairStatus,
    OBJECTS,
    objectById,
    viewOf,
    CLUSTER_TABLE,
  };

  if (isNode && module.exports) {
    module.exports = api;
  } else {
    window.BinariesClusters = api;
  }
})();
