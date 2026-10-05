/**
 * notes/telescopes.html.
 *
 * The three formulas (magnification, light grasp, resolution) come from
 * src/telescopeModel.js, the same engine src/telescopeQuestions.js's
 * practice questions use — nothing here is a second, independently
 * typed copy of them. The double-star and star-cluster views are purely
 * illustrative (fixed, made-up star layouts, not real objects), but the
 * blur radius and which stars are visible are both driven by exactly
 * the same resolution and light-grasp numbers the readouts above them
 * show.
 */
(function () {
  const CURRICULUM_UNITS = ['u5.1', 'u5.2'];

  const state = {
    objectiveDiameterMm: 100,
    objectiveFocalLengthMm: 1000,
    eyepieceFocalLengthMm: 25,
    wavelengthNm: 550,
  };

  const diameterSlider = document.getElementById('objective-diameter-slider');
  const diameterLabel = document.getElementById('objective-diameter-label');
  const objectiveFocalLengthSlider = document.getElementById('objective-focal-length-slider');
  const objectiveFocalLengthLabel = document.getElementById('objective-focal-length-label');
  const eyepieceFocalLengthSlider = document.getElementById('eyepiece-focal-length-slider');
  const eyepieceFocalLengthLabel = document.getElementById('eyepiece-focal-length-label');
  const wavelengthSlider = document.getElementById('wavelength-slider');
  const wavelengthLabel = document.getElementById('wavelength-label');

  const magnificationReadout = document.getElementById('magnification-readout');
  const lightGraspReadout = document.getElementById('light-grasp-readout');
  const resolutionReadout = document.getElementById('resolution-readout');

  const doubleStarCanvas = document.getElementById('double-star-view');
  const doubleStarStatus = document.getElementById('double-star-status');
  const clusterCanvas = document.getElementById('star-cluster-view');
  const clusterStatus = document.getElementById('cluster-status');

  // Roughly where a wavelength sits in the visible spectrum, for the
  // slider's own label — not a precise colorimetric conversion.
  const SPECTRUM_BANDS = [
    { max: 450, name: 'violet', color: '#7b2ff7' },
    { max: 485, name: 'blue', color: '#2a6bd6' },
    { max: 500, name: 'cyan', color: '#1fb6c9' },
    { max: 565, name: 'green', color: '#2fae4e' },
    { max: 590, name: 'yellow', color: '#d8c22a' },
    { max: 625, name: 'orange', color: '#e07b1f' },
    { max: Infinity, name: 'red', color: '#c0392b' },
  ];

  function spectrumBand(nm) {
    return SPECTRUM_BANDS.find((band) => nm <= band.max);
  }

  // A fixed double star, separated by 2.0 arcseconds — close enough
  // that only a moderate aperture resolves it (see test/telescopeModel.test.js
  // for the 100 mm / 550 nm "about 1.4 arcseconds" figure this plays off).
  const DOUBLE_STAR_SEPARATION_ARCSEC = 2.0;
  const DOUBLE_STAR_FIELD_ARCSEC = 6;
  const DOUBLE_STAR_STARS = [
    { xArcsec: -DOUBLE_STAR_SEPARATION_ARCSEC / 2, yArcsec: 0, revealDiameterMm: 0 },
    { xArcsec: DOUBLE_STAR_SEPARATION_ARCSEC / 2, yArcsec: 0, revealDiameterMm: 0 },
  ];

  // A fixed, made-up star cluster: most members are bright enough to
  // show at any aperture in the slider's range, a close pair only
  // resolves at a decent aperture, and a handful of faint members only
  // appear once light grasp is high enough — some never appear at all
  // within this slider's 20-300 mm range, same as a real telescope.
  const CLUSTER_FIELD_ARCSEC = 16;
  const CLUSTER_STARS = [
    { xArcsec: -0.6, yArcsec: -2.0, revealDiameterMm: 0 }, // close pair (~1.3" apart)...
    { xArcsec: 0.6, yArcsec: -1.4, revealDiameterMm: 0 }, // ...only resolves at a decent aperture
    { xArcsec: -5.5, yArcsec: 3.5, revealDiameterMm: 0 },
    { xArcsec: 4.8, yArcsec: -4.2, revealDiameterMm: 0 },
    { xArcsec: -2.5, yArcsec: 5.0, revealDiameterMm: 40 },
    { xArcsec: 3.0, yArcsec: 4.0, revealDiameterMm: 60 },
    { xArcsec: -6.0, yArcsec: -3.0, revealDiameterMm: 85 },
    { xArcsec: 5.5, yArcsec: 1.5, revealDiameterMm: 110 },
    { xArcsec: 1.5, yArcsec: -5.5, revealDiameterMm: 140 },
    { xArcsec: -3.8, yArcsec: -5.0, revealDiameterMm: 170 },
    { xArcsec: 6.2, yArcsec: 4.5, revealDiameterMm: 200 },
    { xArcsec: -1.0, yArcsec: 1.5, revealDiameterMm: 230 },
    { xArcsec: 2.5, yArcsec: 6.0, revealDiameterMm: 260 },
    { xArcsec: -4.5, yArcsec: 0.5, revealDiameterMm: 300 },
    { xArcsec: 0, yArcsec: -0.5, revealDiameterMm: 340 }, // never appears in this slider's range
  ];

  function drawStarView(canvas, stars, fieldArcsec, diameterMm, wavelengthNm) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#060a16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pxPerArcsec = canvas.width / fieldArcsec;
    const resolutionArcsec = TelescopeModel.resolutionArcsec(wavelengthNm, diameterMm);
    // Capped in arcseconds (not pixels) before converting, so an
    // extreme, unresolved blur reads as one soft merged blob rather
    // than flooding the whole canvas white.
    const cappedArcsec = Math.min(resolutionArcsec, fieldArcsec * 0.22);
    const blurRadiusPx = Math.max(cappedArcsec * pxPerArcsec, 2.5);

    let visibleCount = 0;
    stars.forEach((star) => {
      if (diameterMm < star.revealDiameterMm) return;
      visibleCount += 1;
      const x = canvas.width / 2 + star.xArcsec * pxPerArcsec;
      const y = canvas.height / 2 + star.yArcsec * pxPerArcsec;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, blurRadiusPx);
      gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
      gradient.addColorStop(0.3, 'rgba(255,255,255,0.45)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, blurRadiusPx, 0, Math.PI * 2);
      ctx.fill();
    });

    return visibleCount;
  }

  function updateStarViews() {
    const { objectiveDiameterMm, wavelengthNm } = state;

    drawStarView(doubleStarCanvas, DOUBLE_STAR_STARS, DOUBLE_STAR_FIELD_ARCSEC, objectiveDiameterMm, wavelengthNm);
    const resolved = TelescopeModel.resolutionArcsec(wavelengthNm, objectiveDiameterMm) < DOUBLE_STAR_SEPARATION_ARCSEC;
    doubleStarStatus.textContent = resolved
      ? 'Resolved — two separate stars are visible'
      : 'Not resolved — the two stars blur into one';
    doubleStarStatus.classList.toggle('retrograde-active', !resolved);

    const visibleCount = drawStarView(clusterCanvas, CLUSTER_STARS, CLUSTER_FIELD_ARCSEC, objectiveDiameterMm, wavelengthNm);
    clusterStatus.textContent = `${visibleCount} of ${CLUSTER_STARS.length} stars visible`;
  }

  function updateReadouts() {
    const { objectiveDiameterMm, objectiveFocalLengthMm, eyepieceFocalLengthMm, wavelengthNm } = state;

    const magnification = TelescopeModel.magnification(objectiveFocalLengthMm, eyepieceFocalLengthMm);
    magnificationReadout.textContent = `Magnification: ${magnification.toFixed(0)}×`;

    const lightGrasp = TelescopeModel.lightGraspRatio(objectiveDiameterMm, TelescopeModel.DARK_ADAPTED_EYE_PUPIL_MM);
    lightGraspReadout.textContent = `Light grasp: ${lightGrasp.toFixed(0)}× a fully dark-adapted human eye`;

    const resolution = TelescopeModel.resolutionArcsec(wavelengthNm, objectiveDiameterMm);
    resolutionReadout.textContent = `Resolution: ${resolution < 1 ? resolution.toFixed(2) : resolution.toFixed(1)} arcseconds`;
  }

  function update() {
    updateReadouts();
    updateStarViews();
  }

  diameterSlider.addEventListener('input', () => {
    state.objectiveDiameterMm = Number(diameterSlider.value);
    diameterLabel.textContent = `${state.objectiveDiameterMm} mm`;
    update();
  });

  objectiveFocalLengthSlider.addEventListener('input', () => {
    state.objectiveFocalLengthMm = Number(objectiveFocalLengthSlider.value);
    objectiveFocalLengthLabel.textContent = `${state.objectiveFocalLengthMm} mm`;
    updateReadouts();
  });

  eyepieceFocalLengthSlider.addEventListener('input', () => {
    state.eyepieceFocalLengthMm = Number(eyepieceFocalLengthSlider.value);
    eyepieceFocalLengthLabel.textContent = `${state.eyepieceFocalLengthMm} mm`;
    updateReadouts();
  });

  wavelengthSlider.addEventListener('input', () => {
    state.wavelengthNm = Number(wavelengthSlider.value);
    const band = spectrumBand(state.wavelengthNm);
    wavelengthLabel.textContent = `${state.wavelengthNm} nm (${band.name})`;
    wavelengthLabel.style.color = band.color;
    update();
  });

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    aperture: 'Aperture: the diameter of a telescope’s (or eye’s) main light-collecting opening — its objective lens or mirror, or the pupil.',
    'focal-length': 'Focal length: the distance from a lens or mirror to the point where it brings light to a focus.',
    'light-grasp': 'Light grasp: how much light a telescope collects, proportional to the square of its objective diameter.',
    resolution: 'Angular resolution: the smallest angular separation a telescope can distinguish as two separate points, rather than one blur — a smaller angle means better resolution.',
    'chromatic-aberration': 'Chromatic aberration: coloured fringing around bright objects, caused by a lens refracting different wavelengths of light by slightly different amounts.',
    'galilean-refractor': 'Galilean refractor: a diverging (concave) lens as the eyepiece, giving an upright image but a narrow field of view — what Galileo himself used in 1609.',
    'keplerian-refractor': 'Keplerian refractor: a converging (convex) lens as the eyepiece, giving a wider field of view than a Galilean design, but an inverted image — the layout almost all modern refractors use.',
    'newtonian-reflector': 'Newtonian reflector: a parabolic primary mirror at the bottom of the tube reflects light back up to a small flat secondary mirror, which redirects it out through an eyepiece on the side of the tube.',
    'cassegrain-reflector': 'Cassegrain reflector: a parabolic primary mirror reflects light up to a convex secondary mirror, which reflects it back down through a hole in the primary to an eyepiece behind it — folding a long focal length into a short tube.',
  };

  diameterLabel.textContent = `${state.objectiveDiameterMm} mm`;
  objectiveFocalLengthLabel.textContent = `${state.objectiveFocalLengthMm} mm`;
  eyepieceFocalLengthLabel.textContent = `${state.eyepieceFocalLengthMm} mm`;
  const initialBand = spectrumBand(state.wavelengthNm);
  wavelengthLabel.textContent = `${state.wavelengthNm} nm (${initialBand.name})`;
  wavelengthLabel.style.color = initialBand.color;

  update();
  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(TelescopeQuestions.makeQuestions(TelescopeModel));
})();
