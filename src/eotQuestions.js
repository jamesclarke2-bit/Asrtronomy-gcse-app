/**
 * Practice questions for sims/equation-of-time.html.
 * Same getSunPosition-injection pattern as src/questions.js, so grading
 * is testable in Node and runs live in the browser off the same
 * solarPosition.js calculation the graph is drawn from.
 */

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
