/**
 * Practice questions for sims/equation-of-time.html.
 * Same getSunPosition-injection pattern as src/questions.js, so grading
 * is testable in Node and runs live in the browser off the same
 * solarPosition.js calculation the graph is drawn from.
 */

// Minutes-of-day helpers for the time-zone questions' time-type fields.
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

// --- Time-zone data (u2.10) -----------------------------------------------
// Every zone and every degree of longitude is worth the same conversion
// rate: a 24h 00m solar day spread over 360°, i.e. 15° per hour (4
// minutes per degree) — stated in each prompt rather than assumed.
function makeTimeZoneQuestions() {
  return [
    {
      id: 'eot-zone-time',
      type: 'time',
      units: ['u2.10'],
      prompt: 'It is 12:00 UT. A time zone 5 hours east of UT is simply 5 hours ahead on the clock. What time is it in that zone?',
      check(value) {
        const trueMinutes = parseClockTime('12:00') + 5 * 60;
        const correct = Math.abs(parseClockTime(value) - trueMinutes) <= 2;
        return { correct, message: `A zone 5 hours east reads 5 hours ahead of UT: 12:00 + 5h = ${formatClockTime(trueMinutes)}.` };
      },
    },
    {
      id: 'eot-lmt-west',
      type: 'time',
      units: ['u2.10'],
      prompt:
        'It is 12:00 UT. Local Mean Time = UT − longitude/15h for a place west of Greenwich (15° of longitude is worth 1 hour, 4 minutes per degree). What is the local mean time at longitude 75°W?',
      check(value) {
        const trueMinutes = parseClockTime('12:00') - (75 / 15) * 60;
        const correct = Math.abs(parseClockTime(value) - trueMinutes) <= 2;
        return { correct, message: `75° ÷ 15°/h = 5h behind: 12:00 − 5h = ${formatClockTime(trueMinutes)}.` };
      },
    },
    {
      id: 'eot-lmt-east',
      type: 'time',
      units: ['u2.10'],
      prompt:
        'It is 15:00 UT. Local Mean Time = UT + longitude/15h for a place east of Greenwich. What is the local mean time at longitude 30°E?',
      check(value) {
        const trueMinutes = parseClockTime('15:00') + (30 / 15) * 60;
        const correct = Math.abs(parseClockTime(value) - trueMinutes) <= 2;
        return { correct, message: `30° ÷ 15°/h = 2h ahead: 15:00 + 2h = ${formatClockTime(trueMinutes)}.` };
      },
    },
    {
      id: 'eot-longitude-for-noon',
      units: ['u2.10'],
      prompt:
        'It is 14:00 UT. Local Mean Time = UT ± longitude/15h, with west behind and east ahead. At what longitude is it local noon (12:00 local mean time) right now?',
      fields: [
        { key: 'degrees', type: 'number', label: 'Longitude — degrees', unitLabel: '°' },
        { key: 'direction', type: 'choice', label: 'Direction', options: ['East', 'West'] },
      ],
      check(value) {
        const correctDegrees = 30;
        const correctDirection = 'West';
        const degreesOk = Math.abs(Math.abs(value.degrees) - correctDegrees) <= 1;
        const directionOk = value.direction === correctDirection;
        return {
          correct: degreesOk && directionOk,
          message: `Noon there is 2 hours behind 14:00 UT, so the place is west of Greenwich by 2h × 15°/h = ${correctDegrees}°: longitude ${correctDegrees}°${correctDirection === 'West' ? 'W' : 'E'}.`,
        };
      },
    },
  ];
}

function makeEotQuestions(getSunPosition, obliquityComponent, eccentricityComponent) {
  const YEAR = 2026;

  function equationOfTimeOn(month, day) {
    return getSunPosition(new Date(Date.UTC(YEAR, month, day, 12, 0)), 0, 0).equationOfTime;
  }

  function normalizeText(value) {
    return String(value).trim().toLowerCase();
  }

  return [
    {
      id: 'eot1',
      type: 'choice',
      units: ['u2.10'],
      prompt: 'On 12 February, is a sundial ahead of or behind clock time?',
      options: ['Ahead', 'Behind'],
      check(value) {
        const eot = equationOfTimeOn(1, 12);
        const correctAnswer = eot >= 0 ? 'Ahead' : 'Behind';
        const relativePhrase = eot >= 0 ? 'ahead of' : 'behind';
        return {
          correct: value === correctAnswer,
          message: `On 12 February the equation of time is about ${eot.toFixed(1)} min, so the sundial is ${relativePhrase} the clock.`,
        };
      },
    },
    {
      id: 'eot2',
      type: 'number',
      units: ['u2.10'],
      prompt: 'Roughly how many minutes ahead or behind is the sundial on 12 February? (enter a positive number of minutes)',
      unitLabel: 'min',
      check(value) {
        const eot = equationOfTimeOn(1, 12);
        const correct = Math.abs(Math.abs(value) - Math.abs(eot)) <= 2;
        return { correct, message: `The simulator gives ${Math.abs(eot).toFixed(1)} minutes on 12 February.` };
      },
    },
    {
      id: 'eot3',
      type: 'choice',
      units: ['u2.10'],
      prompt: 'Which of these months is the equation of time closest to zero (sundial and clock roughly agree)?',
      options: ['February', 'April', 'July', 'November'],
      check(value) {
        return {
          correct: value === 'April',
          message: 'Mid-April (and again around early September) is when the equation of time crosses zero.',
        };
      },
    },
    {
      id: 'eot4',
      type: 'text',
      units: ['u2.10'],
      prompt:
        'The equation of time crosses zero four times during the year. Name one of the four months in which this happens.',
      check(value) {
        const ZERO_CROSSING_MONTHS = ['april', 'june', 'september', 'december'];
        const correct = ZERO_CROSSING_MONTHS.includes(normalizeText(value));
        return {
          correct,
          message: 'The four crossings fall in mid-April, mid-June, early September and late December.',
        };
      },
    },
    {
      id: 'eot5',
      type: 'choice',
      units: ['u2.10'],
      prompt: 'In March, which of these two effects dominates the equation of time?',
      options: ['Orbital eccentricity', 'Axial tilt (obliquity)'],
      check(value) {
        const day = 75; // ~17 March
        const ecc = eccentricityComponent(day);
        const obl = obliquityComponent(day);
        const correctAnswer = Math.abs(ecc) >= Math.abs(obl) ? 'Orbital eccentricity' : 'Axial tilt (obliquity)';
        return {
          correct: value === correctAnswer,
          message: `In mid-March the eccentricity component is about ${ecc.toFixed(1)} min and the obliquity component about ${obl.toFixed(1)} min — obliquity is near zero this close to the equinox.`,
        };
      },
    },
    ...makeTimeZoneQuestions(),
  ];
}

if (typeof module !== 'undefined' && module.exports) {
  const { getSunPosition } = require('./solarPosition');
  const { obliquityComponent, eccentricityComponent } = require('./eotComponents');
  module.exports = {
    QUESTIONS: makeEotQuestions(getSunPosition, obliquityComponent, eccentricityComponent),
    makeEotQuestions,
  };
} else if (typeof window !== 'undefined') {
  window.EotQuestions = {
    QUESTIONS: makeEotQuestions(
      window.SolarPosition.getSunPosition,
      window.EotComponents.obliquityComponent,
      window.EotComponents.eccentricityComponent
    ),
    makeEotQuestions,
  };
}
