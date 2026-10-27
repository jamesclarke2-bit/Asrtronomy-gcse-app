/**
 * Practice questions for notes/measuring-the-sky.html: the relative
 * sizes and distances of the Earth, Moon and Sun (1.2/3.1/3.2/3.4,
 * u2.28) — diameter ratios, the distance-vs-size coincidence behind
 * total solar eclipses, angular size, and light travel time.
 *
 * Every figure comes from src/specData.js (the exam's own data sheet),
 * not this page's own measuringTheSky.js engine, which models the
 * Earth-Moon-Sun system with precise modern values for its own worked
 * examples (slightly different from the data sheet's rounded ones, as
 * notes/data-sheet.html itself flags) — these questions use the same
 * rounded, student-facing tier the exam itself gives.
 */
function makeQuestions(SpecData) {
  const C = SpecData.CONSTANTS;
  const sunKm = C.meanDiameterKm.sun;
  const earthKm = C.meanDiameterKm.earth;
  const moonKm = C.meanDiameterKm.moon;
  const earthMoonKm = C.meanEarthMoonDistanceKm;
  const auKm = C.auKm;
  const cMPerS = C.speedOfLightMPerS;

  const sunEarthRatio = sunKm / earthKm;
  const earthMoonRatio = earthKm / moonKm;
  const sunMoonDistanceRatio = auKm / earthMoonKm;
  const sunMoonSizeRatio = sunKm / moonKm;
  const sunAngularDeg = (sunKm / auKm) * 57.3;
  const moonAngularDeg = (moonKm / earthMoonKm) * 57.3;
  const moonLightSeconds = (earthMoonKm * 1000) / cMPerS;
  const sunLightSeconds = (auKm * 1000) / cMPerS;
  const sunLightMinutes = sunLightSeconds / 60;

  const ECLIPSE_EXPLANATION_CORRECT =
    `Because the Sun is about ${Math.round(sunMoonSizeRatio)} times wider than the Moon but also about ${Math.round(sunMoonDistanceRatio)} times farther away, the two ratios almost cancel, so from Earth they cover almost exactly the same angle in the sky — which is why the Moon can just barely cover the Sun in a total solar eclipse`;

  return [
    {
      id: 'sun-earth-diameter-ratio',
      units: ['u2.28'],
      type: 'number',
      prompt:
        `The data sheet gives the Sun's mean diameter as ${sunKm.toLocaleString()} km and Earth's as ${earthKm.toLocaleString()} km. About how many times wider is the Sun than Earth?`,
      check(value) {
        const correct = Math.abs(value - sunEarthRatio) <= 0.02 * sunEarthRatio;
        return {
          correct,
          message: `${sunKm.toLocaleString()} ÷ ${earthKm.toLocaleString()} ≈ ${sunEarthRatio.toFixed(1)} — about 108 times wider.`,
        };
      },
    },
    {
      id: 'earth-moon-diameter-ratio',
      units: ['u2.28'],
      type: 'number',
      prompt:
        `The data sheet gives Earth's mean diameter as ${earthKm.toLocaleString()} km and the Moon's as ${moonKm.toLocaleString()} km. About how many times wider is Earth than the Moon?`,
      check(value) {
        const correct = Math.abs(value - earthMoonRatio) <= 0.02 * earthMoonRatio;
        return {
          correct,
          message: `${earthKm.toLocaleString()} ÷ ${moonKm.toLocaleString()} ≈ ${earthMoonRatio.toFixed(1)} — about 3.7 times wider.`,
        };
      },
    },
    {
      id: 'sun-moon-distance-ratio',
      units: ['u2.28'],
      type: 'number',
      prompt:
        `The data sheet gives the Earth-Moon distance as ${earthMoonKm.toLocaleString()} km and 1 AU (the Earth-Sun distance) as ${auKm.toLocaleString()} km. About how many times farther away is the Sun than the Moon?`,
      check(value) {
        const correct = Math.abs(value - sunMoonDistanceRatio) <= 0.02 * sunMoonDistanceRatio;
        return {
          correct,
          message: `${auKm.toLocaleString()} ÷ ${earthMoonKm.toLocaleString()} ≈ ${sunMoonDistanceRatio.toFixed(0)} — about 395 times farther.`,
        };
      },
    },
    {
      id: 'eclipse-coincidence-explanation',
      units: ['u2.28'],
      type: 'choice',
      prompt:
        `The Sun is about ${Math.round(sunMoonSizeRatio)} times wider than the Moon (${sunKm.toLocaleString()} km vs ${moonKm.toLocaleString()} km), and about ${Math.round(sunMoonDistanceRatio)} times farther away (${auKm.toLocaleString()} km vs ${earthMoonKm.toLocaleString()} km). Why do the Sun and Moon look almost exactly the same size in the sky?`,
      options: [
        ECLIPSE_EXPLANATION_CORRECT,
        'Because the Sun and Moon are actually the same real size, just at very different distances',
        "Because the Moon's atmosphere makes it look bigger than it really is",
        'Because the two ratios (400 and 395) are exactly equal, not just approximately — this is not a coincidence at all',
      ],
      check(value) {
        const correct = value === ECLIPSE_EXPLANATION_CORRECT;
        return {
          correct,
          message:
            `The size ratio (${Math.round(sunMoonSizeRatio)}) and the distance ratio (${Math.round(sunMoonDistanceRatio)}) are close, but not exactly equal — that's why some total solar eclipses are "just" total while others are annular (the Moon's own distance varies slightly). Because a far, wide object and a near, narrow one cover almost the same angle, both the Sun and Moon come out to about half a degree across — the coincidence that makes total solar eclipses possible at all.`,
        };
      },
    },
    {
      id: 'sun-angular-size',
      units: ['u2.28'],
      type: 'number',
      unitLabel: '°',
      prompt:
        `Angular size (°) = diameter ÷ distance × 57.3. Using the data sheet's Sun diameter (${sunKm.toLocaleString()} km) and 1 AU (${auKm.toLocaleString()} km) for its distance, calculate the Sun's angular size.`,
      check(value) {
        const correct = Math.abs(value - sunAngularDeg) <= 0.02 * sunAngularDeg;
        return {
          correct,
          message: `${sunKm.toLocaleString()} ÷ ${auKm.toLocaleString()} × 57.3 ≈ ${sunAngularDeg.toFixed(2)}° — about 0.53°.`,
        };
      },
    },
    {
      id: 'moon-angular-size',
      units: ['u2.28'],
      type: 'number',
      unitLabel: '°',
      prompt:
        `Angular size (°) = diameter ÷ distance × 57.3. Using the data sheet's Moon diameter (${moonKm.toLocaleString()} km) and Earth-Moon distance (${earthMoonKm.toLocaleString()} km), calculate the Moon's angular size.`,
      check(value) {
        const correct = Math.abs(value - moonAngularDeg) <= 0.02 * moonAngularDeg;
        return {
          correct,
          message: `${moonKm.toLocaleString()} ÷ ${earthMoonKm.toLocaleString()} × 57.3 ≈ ${moonAngularDeg.toFixed(2)}° — about 0.53°, almost the same as the Sun's, despite the Moon being so much smaller and so much closer.`,
        };
      },
    },
    {
      id: 'light-travel-time-moon-and-sun',
      units: ['u2.28'],
      fields: [
        { key: 'moonSeconds', type: 'number', label: 'Light travel time from the Moon (s)', unitLabel: 's' },
        { key: 'sunSeconds', type: 'number', label: 'Light travel time from the Sun (s)', unitLabel: 's' },
      ],
      prompt:
        `Using the data sheet's speed of light (${cMPerS.toExponential(1)} m/s), the Earth-Moon distance (${earthMoonKm.toLocaleString()} km) and 1 AU (${auKm.toLocaleString()} km), calculate how long light takes to reach us from the Moon, and from the Sun, in seconds.`,
      check(value) {
        const moonCorrect = Math.abs(value.moonSeconds - moonLightSeconds) <= 0.02 * moonLightSeconds;
        const sunCorrect = Math.abs(value.sunSeconds - sunLightSeconds) <= 0.02 * sunLightSeconds;
        return {
          correct: moonCorrect && sunCorrect,
          message:
            `time = distance ÷ speed. Moon: (${earthMoonKm.toLocaleString()} × 1000) ÷ ${cMPerS.toExponential(1)} ≈ ${moonLightSeconds.toFixed(1)} s. ` +
            `Sun: (${auKm.toLocaleString()} × 1000) ÷ ${cMPerS.toExponential(1)} = ${sunLightSeconds.toFixed(0)} s, about ${sunLightMinutes.toFixed(1)} minutes — nearly 400 times longer than the light from the Moon, the same ${Math.round(sunMoonDistanceRatio)}× distance ratio as before.`,
        };
      },
    },
    {
      id: 'earths-across-sun',
      units: ['u2.28'],
      type: 'number',
      prompt:
        `The data sheet gives the Sun's mean diameter as ${sunKm.toLocaleString()} km and Earth's as ${earthKm.toLocaleString()} km. About how many Earths would fit side by side across the Sun?`,
      check(value) {
        const correct = Math.abs(value - sunEarthRatio) <= 0.02 * sunEarthRatio;
        return {
          correct,
          message: `${sunKm.toLocaleString()} ÷ ${earthKm.toLocaleString()} ≈ ${sunEarthRatio.toFixed(0)} — about 108 Earths side by side, the same ratio as the Sun's diameter compared with Earth's.`,
        };
      },
    },
  ];
}

const measuringTheSkyQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = measuringTheSkyQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.MeasuringTheSkyQuestions = measuringTheSkyQuestionsApi;
}
