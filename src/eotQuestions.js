/**
 * Practice questions for sims/equation-of-time.html.
 * Same getSunPosition-injection pattern as src/questions.js, so grading
 * is testable in Node and runs live in the browser off the same
 * solarPosition.js calculation the graph is drawn from.
 */

function makeEotQuestions(getSunPosition) {
  const YEAR = 2026;

  function equationOfTimeOn(month, day) {
    return getSunPosition(new Date(Date.UTC(YEAR, month, day, 12, 0)), 0, 0).equationOfTime;
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
        return {
          correct: value === correctAnswer,
          message: `On 12 February the equation of time is about ${eot.toFixed(1)} min, so the sundial is ${correctAnswer.toLowerCase()} of the clock.`,
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
  ];
}

if (typeof module !== 'undefined' && module.exports) {
  const { getSunPosition } = require('./solarPosition');
  module.exports = { QUESTIONS: makeEotQuestions(getSunPosition), makeEotQuestions };
} else if (typeof window !== 'undefined') {
  window.EotQuestions = { QUESTIONS: makeEotQuestions(window.SolarPosition.getSunPosition), makeEotQuestions };
}
