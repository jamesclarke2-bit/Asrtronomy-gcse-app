/**
 * Question bank for sims/coordinates.html, built around four confirmed
 * misconceptions plus a parametrised, chained multi-part template.
 *
 * Same dependency-injection pattern as src/questions.js: makeQuestions
 * takes the Coordinates module (and, for the one question that reads
 * the live diagram rather than computing from fixed numbers, a
 * getLiveState() callback) so grading is testable in Node and runs
 * live in the browser off the same calculations the page itself uses.
 *
 * highlightDiurnalPoint (optional, third argument) lets quiz-ui.js's
 * generic "explain the answer" step highlight the diagram-reading
 * question's answer on the page's own diurnal-motion graph — a page
 * function passed in rather than called directly, so this file stays
 * plain and Node-testable with no DOM/canvas involved.
 */

function normalizeText(value) {
  return String(value).trim().toLowerCase();
}

// Presentation only — the hour-angle *value* always comes from
// Coordinates.raToHourAngleDegrees; this just renders it the way a GCSE
// exam mark scheme would ("2h 12m"), matching the h/m input fields below.
function formatHoursMinutes(hoursDecimal) {
  const totalMinutes = Math.round(Math.abs(hoursDecimal) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

// Minutes-of-day helpers for the rise/set time questions below, whose
// answers come from an <input type="time"> field (an "HH:MM" string).
function parseClockTime(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}

function formatClockTime(totalMinutes) {
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = Math.round(wrapped % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// --- Finding latitude via Polaris (u1.13) -------------------------------
// Polaris sits so close to the north celestial pole that its altitude
// above the northern horizon approximates the observer's latitude, to
// the nearest degree. The reverse question is graded via
// Coordinates.getLatitudeFromAltitudeAndDeclination with declination 90°
// (Polaris treated as exactly at the pole), rather than a hard-coded
// equality, so it stays tied to the engine's own formula.
function makePolarisLatitudeQuestions(Coordinates) {
  const CITIES = [
    { id: 'polaris-edinburgh', city: 'Edinburgh', latitude: 56 },
    { id: 'polaris-beijing', city: 'Beijing', latitude: 40 },
    { id: 'polaris-bombay', city: 'Bombay (Mumbai)', latitude: 19 },
  ];

  const questions = CITIES.map(({ id, city, latitude }) => ({
    id,
    units: ['u1.13'],
    prompt: `An observer in ${city}, at latitude ${latitude}°N, looks for Polaris above the northern horizon. To the nearest degree, Polaris's altitude approximates the observer's latitude — what altitude will they measure?`,
    type: 'number',
    unitLabel: '°',
    check(value) {
      const correct = Math.abs(value - latitude) <= 1;
      return { correct, message: `Polaris's altitude ≈ the observer's latitude, so about ${latitude}°.` };
    },
  }));

  questions.push({
    id: 'polaris-wellington',
    units: ['u1.13'],
    prompt:
      "An observer in Wellington, New Zealand, at latitude 41°S, looks for Polaris above the northern horizon. What will they find?",
    type: 'choice',
    options: [
      'Polaris at 41° altitude',
      'Polaris at 49° altitude',
      "Polaris is below the horizon — it can't be seen from the southern hemisphere",
    ],
    check(value) {
      const correctAnswer = "Polaris is below the horizon — it can't be seen from the southern hemisphere";
      return {
        correct: value === correctAnswer,
        message:
          "Polaris only approximates the latitude of observers in the northern hemisphere, where it stays above the horizon. South of the equator the north celestial pole — and Polaris with it — is below the northern horizon altogether, so it can't be used to find latitude there.",
      };
    },
  });

  questions.push({
    id: 'polaris-reverse',
    units: ['u1.13'],
    prompt: "An observer sees Polaris 52° above the northern horizon. What is the observer's latitude?",
    type: 'number',
    unitLabel: '°N',
    check(value) {
      const latitude = Coordinates.getLatitudeFromAltitudeAndDeclination(52, 90).lower;
      const correct = Math.abs(value - latitude) <= 1;
      return { correct, message: `The observer's latitude ≈ Polaris's altitude, so about ${latitude.toFixed(0)}°N.` };
    },
  });

  return questions;
}

// --- Predicting rising, transit and setting times (u1.23) ---------------
// The ~4-minute daily gain comes from the data sheet's own sidereal day
// (23h 56m) against the solar day (24h 00m) a clock keeps — computed
// from SpecData, never hard-coded, so it tracks the data sheet.
function makeRiseSetQuestions(SpecData) {
  const { siderealDayHours, synodicDayHours } = SpecData.CONSTANTS;
  const dailyGainMinutes = (synodicDayHours - siderealDayHours) * 60;
  const minutesPerDegreeLongitude = (synodicDayHours * 60) / 360;

  return [
    {
      id: 'riseset-betelgeuse',
      units: ['u1.23'],
      prompt: `Betelgeuse rises at 20:03 on 20 November. The data sheet gives a sidereal day of 23h 56m against a solar day of 24h 00m, so a star rises about ${dailyGainMinutes.toFixed(0)} minutes earlier each night. What time does Betelgeuse rise on 30 November, 10 nights later?`,
      type: 'time',
      check(value) {
        const trueMinutes = parseClockTime('20:03') - 10 * dailyGainMinutes;
        const correct = Math.abs(parseClockTime(value) - trueMinutes) <= 2;
        return {
          correct,
          message: `10 nights × ${dailyGainMinutes.toFixed(0)} minutes = ${(10 * dailyGainMinutes).toFixed(0)} minutes earlier: 20:03 − ${(10 * dailyGainMinutes).toFixed(0)} min = ${formatClockTime(trueMinutes)}.`,
        };
      },
    },
    {
      id: 'riseset-aldebaran',
      units: ['u1.23'],
      prompt: `Aldebaran culminates at 22:00 on 1 December. Using the same roughly ${dailyGainMinutes.toFixed(0)}-minute daily gain, what time does it culminate on 15 December, 14 nights later?`,
      type: 'time',
      check(value) {
        const trueMinutes = parseClockTime('22:00') - 14 * dailyGainMinutes;
        const correct = Math.abs(parseClockTime(value) - trueMinutes) <= 2;
        return {
          correct,
          message: `14 nights × ${dailyGainMinutes.toFixed(0)} minutes = ${(14 * dailyGainMinutes).toFixed(0)} minutes earlier: 22:00 − ${(14 * dailyGainMinutes).toFixed(0)} min = ${formatClockTime(trueMinutes)}.`,
        };
      },
    },
    {
      id: 'riseset-longitude',
      units: ['u1.23'],
      prompt: `A star culminates at the same instant for every observer on the same meridian, but a solar day of 24h 00m spread over 360° of longitude means each degree shifts the local clock time of culmination by about ${minutesPerDegreeLongitude.toFixed(0)} minutes. An observer 3° east of another sees the same star culminate how much earlier (in minutes)?`,
      type: 'number',
      unitLabel: 'min',
      check(value) {
        const trueMinutes = 3 * minutesPerDegreeLongitude;
        const correct = Math.abs(Math.abs(value) - trueMinutes) <= 2;
        return { correct, message: `3° × ${minutesPerDegreeLongitude.toFixed(0)} minutes/degree = ${trueMinutes.toFixed(0)} minutes earlier.` };
      },
    },
  ];
}

// --- Best time and object to observe (u1.24) -----------------------------
function makeBestTimeQuestions(Coordinates) {
  return [
    {
      id: 'besttime-compare',
      units: ['u1.24'],
      prompt:
        'An observer at latitude 52°N is choosing between two stars: Star A has declination +20°, Star B has declination −30°. Which is better placed for observing — i.e. which reaches the greater altitude at upper transit?',
      type: 'choice',
      options: ['Star A (dec +20°)', 'Star B (dec −30°)'],
      check(value) {
        const altA = Coordinates.getMaxAltitudeUpperTransit(52, 20);
        const altB = Coordinates.getMaxAltitudeUpperTransit(52, -30);
        const correctAnswer = altA >= altB ? 'Star A (dec +20°)' : 'Star B (dec −30°)';
        return {
          correct: value === correctAnswer,
          message: `Maximum altitude = 90° − |latitude − declination|. Star A: 90° − |52° − 20°| = ${altA.toFixed(0)}°. Star B: 90° − |52° − (−30°)| = ${altB.toFixed(0)}°. Star A sits higher, so it's better placed — less of its light is lost through the atmosphere.`,
        };
      },
    },
    {
      id: 'besttime-lst',
      units: ['u1.24'],
      prompt:
        'A star has right ascension 5h 55m. At what local sidereal time is it best placed for observing — at its highest, on the meridian (hour angle zero)?',
      fields: [
        { key: 'lstHours', type: 'number', label: 'Local sidereal time — hours', unitLabel: 'h' },
        { key: 'lstMinutes', type: 'number', label: 'Local sidereal time — minutes', unitLabel: 'm' },
      ],
      check(value) {
        const givenMinutes = value.lstHours * 60 + value.lstMinutes;
        const trueMinutes = 5 * 60 + 55;
        const correct = Math.abs(givenMinutes - trueMinutes) <= 2;
        return { correct, message: 'A star is best placed (at upper transit) when the local sidereal time equals its right ascension — so LST = 5h 55m.' };
      },
    },
  ];
}

function makeQuestions(Coordinates, getLiveState, highlightDiurnalPoint, SpecData) {
  const questions = [];

  // --- Misconception 1: hour angle sign --------------------------------
  // Real exam papers ask for hour angle in hours/minutes (e.g. "2h 12m"),
  // not degrees, with direction given as a separate east/west or
  // transited/not-transited statement rather than a +/- sign on the
  // number — so the magnitude field takes an unsigned h/m pair, and
  // "sign" is entirely what the transited choice is graded against.
  // (A student who types a negative value out of habit still has it
  // read as a magnitude via Math.abs, since the direction is already
  // covered by the transited field — no double jeopardy for one slip.)
  function makeHourAngleSignQuestion(id, starLabel, raHours, lstHours) {
    const trueHA = Coordinates.raToHourAngleDegrees(raHours, lstHours);
    const trueHAHours = trueHA / 15;
    const correctTransited = trueHA >= 0 ? 'Yes, already transited' : 'No, not yet transited';
    return {
      id,
      units: ['u1.8'],
      prompt: `${starLabel} has RA ${raHours}h. At a moment when the local sidereal time is ${lstHours}h, has it transited yet? Give its hour angle too, in hours and minutes.`,
      fields: [
        { key: 'transited', type: 'choice', label: 'Transited?', options: ['Yes, already transited', 'No, not yet transited'] },
        { key: 'haHours', type: 'number', label: 'Hour angle — hours', unitLabel: 'h' },
        { key: 'haMinutes', type: 'number', label: 'Hour angle — minutes', unitLabel: 'm' },
      ],
      check(answers) {
        const transitedCorrect = answers.transited === correctTransited;
        const givenMagnitudeHours = Math.abs(answers.haHours) + Math.abs(answers.haMinutes) / 60;
        const magnitudeCorrect = Math.abs(givenMagnitudeHours - Math.abs(trueHAHours)) <= 4 / 60;
        const correct = transitedCorrect && magnitudeCorrect;
        const trueHAFormatted = formatHoursMinutes(trueHAHours);
        let message;
        if (!magnitudeCorrect) {
          message = `The size is off — the hour angle is ${trueHAFormatted} (${trueHA.toFixed(1)}°).`;
        } else if (!transitedCorrect) {
          message = `Your hour angle is right, but check the transited/not-transited call: ${trueHAFormatted} means "${correctTransited}".`;
        } else {
          message = `The hour angle is ${trueHAFormatted} (${trueHA.toFixed(1)}°).`;
        }
        message +=
          ' You can see the same idea on the diurnal motion graph below: its centre is transit (hour angle 0) — everything to the left of centre (negative HA) hasn\'t transited yet, everything to the right (positive HA) already has.';
        return { correct, message };
      },
    };
  }

  questions.push(
    makeHourAngleSignQuestion('ha-sign-1', 'A star', 10, 8.5),
    makeHourAngleSignQuestion('ha-sign-2', 'A star', 14, 17.25)
  );

  // --- Misconception 2: equinox + southern hemisphere -------------------
  // Distractors specifically target (a) assuming equinox means directly
  // overhead everywhere, and (b) assuming the sun is always roughly south.
  questions.push({
    id: 'sydney-equinox',
    units: ['u1.4', 'u1.12'],
    prompt:
      'An observer in Sydney (34°S) looks at the Sun at local solar noon on the equinox (declination 0°, hour angle 0°). What are its altitude and azimuth?',
    fields: [
      { key: 'altitude', type: 'choice', label: 'Altitude', options: ['34°', '56°', '90°', '124°'] },
      {
        key: 'azimuth',
        type: 'choice',
        label: 'Azimuth',
        options: ['Due north (0°)', 'Due east (90°)', 'Due south (180°)', 'Due west (270°)'],
      },
    ],
    check(answers) {
      const { altitude, azimuth } = Coordinates.getAltAz(0, 0, -34);
      const correctAltitude = '56°';
      const correctAzimuth = 'Due north (0°)';
      const correct = answers.altitude === correctAltitude && answers.azimuth === correctAzimuth;
      return {
        correct,
        message: `Altitude = 90 − |latitude − declination| = 90 − |−34 − 0| = ${altitude.toFixed(0)}°. The equinox doesn't put the Sun overhead everywhere — only at the equator. And south of the tropics, the midday Sun is toward the equator, which from Sydney is north, not south: azimuth = ${azimuth.toFixed(0)}°. You can see this exact point on the meridian cross-section diagram above: set declination to 0° and latitude to −34°, and the star marker sits on the north side, at ${altitude.toFixed(0)}° altitude.`,
      };
    },
  });

  // --- Misconception 3: circumpolarity at/near the equator --------------
  // A dec-threshold rule that only works at mid-latitudes should fail
  // here — every one of these should be "rises and sets normally",
  // however high the declination.
  [
    { id: 'circumpolar-equator-1', dec: 0 },
    { id: 'circumpolar-equator-2', dec: 60 },
    { id: 'circumpolar-equator-3', dec: 85 },
  ].forEach(({ id, dec }) => {
    questions.push({
      id,
      units: ['u1.10'],
      prompt: `An observer stands exactly on the equator (latitude 0°). A star has declination +${dec}°. Is it circumpolar, does it never rise, or does it rise and set normally?`,
      type: 'choice',
      options: ['Circumpolar (never sets)', 'Never rises', 'Rises and sets normally'],
      check(value) {
        const circumpolar = Coordinates.isCircumpolar(dec, 0);
        const correctAnswer = circumpolar ? 'Circumpolar (never sets)' : 'Rises and sets normally';
        return {
          correct: value === correctAnswer,
          message:
            `At latitude 0°, every star rises and sets normally, whatever its declination — the celestial equator runs from due east through the zenith to due west, and every diurnal circle crosses the horizon there. A "high declination = circumpolar" rule only starts working once you’re away from the equator. Try it on the sky dome above: set latitude to 0° and declination to ${dec}°, and the star's path still dips below the horizon on both sides, just like every other latitude-0° star.`,
        };
      },
    });
  });

  // --- Misconception 4: reading the diurnal-motion diagram ---------------
  // Graded against whatever the live diagram is actually showing right
  // now (current star, latitude and hour angle), not a fixed scenario —
  // the student has to read it, not calculate it.
  if (getLiveState) {
    questions.push({
      id: 'diagram-reading',
      units: ['u1.14'],
      prompt:
        'Look at the diurnal motion graph above (drag it if you like). Read off the current altitude at the marker’s position — don’t calculate it.',
      type: 'number',
      unitLabel: '°',
      check(value) {
        const { dec, lat, haDegrees } = getLiveState();
        const { altitude } = Coordinates.getAltAz(dec, haDegrees, lat);
        const correct = Math.abs(value - altitude) <= 1.5;
        return { correct, message: `The diagram currently shows an altitude of ${altitude.toFixed(1)}° at this hour angle.` };
      },
      onAnswered() {
        if (typeof highlightDiurnalPoint === 'function') {
          highlightDiurnalPoint();
        }
      },
    });
  }

  questions.push(...makePolarisLatitudeQuestions(Coordinates));
  questions.push(...makeBestTimeQuestions(Coordinates));
  if (SpecData) {
    questions.push(...makeRiseSetQuestions(SpecData));
  }

  return questions;
}

// --- Chained, parametrised multi-part question -----------------------

const CHAINED_PARAM_PRESETS = [
  { starLabel: 'Aldebaran', dec: 16.5, lat: 51.75, haDegrees: 91.5 },
  { starLabel: 'Vega', dec: 38.8, lat: 56, haDegrees: 15 },
  { starLabel: 'a circumpolar star', dec: 70, lat: 68, haDegrees: -30 },
  { starLabel: 'Sirius', dec: -16.7, lat: 20, haDegrees: 45 },
];

function pickRandomChainedParams() {
  return CHAINED_PARAM_PRESETS[Math.floor(Math.random() * CHAINED_PARAM_PRESETS.length)];
}

/**
 * Builds a 5-part chained question from explicit parameters (pure and
 * deterministic, so it's testable) rather than hard-coding one example.
 * Parts 3 and 5 grade their method against the student's OWN part-2
 * answer (error-carried-forward) rather than only the fixed correct
 * value, matching how the real mark scheme awards follow-through marks
 * (e.g. Q1/Q9 in the reference exam set) — get part 2 wrong but apply
 * the right method to your own figure in part 3 or 5, and you still get
 * those parts right.
 */
function generateChainedQuestion(Coordinates, params) {
  const { starLabel, dec, lat, haDegrees } = params;
  const truePolarDistance = Coordinates.getPolarDistance(dec);
  const trueMaxAltitude = Coordinates.getMaxAltitudeUpperTransit(lat, dec);
  const trueAltAz = Coordinates.getAltAz(dec, haDegrees, lat);
  const trueCircumpolar = Coordinates.isCircumpolar(dec, lat);
  const trueNeverRises = Coordinates.isCircumpolar(-dec, lat); // opposite pole, same test

  function classifyFromPolarDistance(polarDistance) {
    if (polarDistance <= lat) return 'Circumpolar (never sets)';
    if (polarDistance >= 180 - lat) return 'Never rises';
    return 'Rises and sets normally';
  }

  const trueClassification = trueCircumpolar
    ? 'Circumpolar (never sets)'
    : trueNeverRises
    ? 'Never rises'
    : 'Rises and sets normally';

  return {
    starLabel,
    dec,
    lat,
    haDegrees,
    parts: [
      {
        id: 'p1',
        prompt: 'The equatorial coordinate system locates a star using two components. Name them.',
        type: 'text',
        check(value) {
          const text = normalizeText(value);
          const hasRA = text.includes('right ascension') || /\bra\b/.test(text);
          const hasDec = text.includes('declination') || /\bdec\b/.test(text);
          return {
            correct: hasRA && hasDec,
            message: 'The two components are right ascension (RA) and declination (dec).',
          };
        },
      },
      {
        id: 'p2',
        prompt: `${starLabel} has declination ${dec}°. Calculate its polar distance.`,
        type: 'number',
        unitLabel: '°',
        check(value) {
          const correct = Math.abs(value - truePolarDistance) <= 1;
          return {
            correct,
            message: `Polar distance = 90° − declination = 90° − ${dec}° = ${truePolarDistance.toFixed(1)}°.`,
          };
        },
      },
      {
        id: 'p3',
        prompt: `Using your answer to part 2, is ${starLabel} circumpolar as seen from latitude ${lat}°? (A star is circumpolar if its polar distance is at most the observer's latitude; it never rises if its polar distance is at least 180° minus the latitude.)`,
        type: 'choice',
        options: ['Circumpolar (never sets)', 'Never rises', 'Rises and sets normally'],
        check(value, priorAnswers) {
          const studentPolarDistance = Number(priorAnswers.p2);
          if (!Number.isFinite(studentPolarDistance)) {
            return { correct: false, message: 'Answer part 2 first, so this part can build on it.' };
          }
          const expectedFromOwnWorking = classifyFromPolarDistance(studentPolarDistance);
          const correct = value === expectedFromOwnWorking;
          return {
            correct,
            message:
              expectedFromOwnWorking === trueClassification
                ? `With a polar distance of ${studentPolarDistance}° and latitude ${lat}°, this is "${expectedFromOwnWorking}".`
                : `Using your own part-2 answer (${studentPolarDistance}°) with latitude ${lat}°, the method gives "${expectedFromOwnWorking}" — that's what's marked here, even though the true classification (from the correct polar distance of ${truePolarDistance.toFixed(1)}°) is "${trueClassification}".`,
          };
        },
      },
      {
        id: 'p4',
        prompt: `Calculate ${starLabel}'s altitude and azimuth when its hour angle is ${haDegrees}°.`,
        fields: [
          { key: 'altitude', label: 'Altitude', unitLabel: '°' },
          { key: 'azimuth', label: 'Azimuth', unitLabel: '°' },
        ],
        check(value) {
          const altOk = Math.abs(value.altitude - trueAltAz.altitude) <= 2;
          const rawAzDiff = Math.abs(value.azimuth - trueAltAz.azimuth);
          const azOk = Math.min(rawAzDiff, 360 - rawAzDiff) <= 3;
          return {
            correct: altOk && azOk,
            message: `Altitude ≈ ${trueAltAz.altitude.toFixed(1)}°, azimuth ≈ ${trueAltAz.azimuth.toFixed(1)}°, from the standard altitude/azimuth formulas with declination ${dec}°, hour angle ${haDegrees}° and latitude ${lat}°.`,
          };
        },
      },
      {
        id: 'p5',
        prompt: `Using your answer to part 2 and the observer's colatitude (90° − latitude = ${90 - lat}°), calculate ${starLabel}'s maximum altitude at upper transit.`,
        type: 'number',
        unitLabel: '°',
        check(value, priorAnswers) {
          const studentPolarDistance = Number(priorAnswers.p2);
          if (!Number.isFinite(studentPolarDistance)) {
            return { correct: false, message: 'Answer part 2 first, so this part can build on it.' };
          }
          const colatitude = 90 - lat;
          const expectedFromOwnWorking = 90 - Math.abs(studentPolarDistance - colatitude);
          const correct = Math.abs(value - expectedFromOwnWorking) <= 1;
          return {
            correct,
            message:
              Math.abs(expectedFromOwnWorking - trueMaxAltitude) <= 1
                ? `Maximum altitude = 90° − |polar distance − colatitude| = 90° − |${studentPolarDistance}° − ${colatitude}°| = ${expectedFromOwnWorking.toFixed(1)}°.`
                : `Using your own part-2 answer (${studentPolarDistance}°), the method gives ${expectedFromOwnWorking.toFixed(1)}° — that's what's marked here. (With the correct polar distance of ${truePolarDistance.toFixed(1)}°, the true maximum altitude is ${trueMaxAltitude.toFixed(1)}°.)`,
          };
        },
      },
    ],
  };
}

const coordinatesQuestionsApi = { makeQuestions, generateChainedQuestion, CHAINED_PARAM_PRESETS, pickRandomChainedParams };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = coordinatesQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.CoordinatesQuestions = coordinatesQuestionsApi;
}
