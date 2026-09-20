/**
 * Practice question bank for the sun-path simulator.
 *
 * Each question's `check` re-derives the correct answer from
 * getSunPosition at call time, rather than a hardcoded value, so
 * grading always matches the simulator's live output. `units` lists
 * the curriculum subtopic ids (src/curriculum.js) the question covers.
 */

function makeQuestions(getSunPosition) {
  const YEAR = 2026;

  function scanDayPeak(year, month, day, lat, lon) {
    let best = null;
    for (let m = 0; m < 1440; m++) {
      const d = new Date(Date.UTC(year, month, day, 0, m));
      const sun = getSunPosition(d, lat, lon);
      if (!best || sun.altitude > best.altitude) best = { minutes: m, altitude: sun.altitude };
    }
    return best;
  }

  // Solar noon's UTC time depends only on date and longitude, not
  // latitude, so any non-polar latitude locates it.
  function solarNoonMinutes(year, month, day, lon) {
    return scanDayPeak(year, month, day, 45, lon).minutes;
  }

  function minutesToClock(minutes) {
    const h = String(Math.floor(minutes / 60)).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    return `${h}:${m}`;
  }

  function normalizeText(value) {
    return String(value).trim().toLowerCase();
  }

  return [
    {
      id: 'q1',
      type: 'number',
      units: ['u2.9'],
      prompt:
        "Set the date to the winter solstice (21 December) and latitude to 52°N. What is the sun's maximum altitude that day, in degrees?",
      unitLabel: '°',
      check(value) {
        const peak = scanDayPeak(YEAR, 11, 21, 52, 0);
        const correct = Math.abs(value - peak.altitude) <= 1;
        return {
          correct,
          message: `Not quite — the simulator shows a maximum altitude of ${peak.altitude.toFixed(1)}°.`,
        };
      },
    },
    {
      id: 'q2',
      type: 'number',
      units: ['u1.4'],
      prompt:
        'On the summer solstice (21 June), at what latitude does the sun reach exactly 90° altitude (directly overhead) at solar noon?',
      unitLabel: '°N',
      check(value) {
        const noonMinutes = solarNoonMinutes(YEAR, 5, 21, 0);
        const d = new Date(Date.UTC(YEAR, 5, 21, 0, noonMinutes));
        const sun = getSunPosition(d, value, 0);
        const correct = Math.abs(90 - sun.altitude) <= 1;
        return {
          correct,
          message: `At ${value}°N the simulator gives an altitude of ${sun.altitude.toFixed(1)}° at solar noon — aim for as close to 90° as possible.`,
        };
      },
    },
    {
      id: 'q3',
      type: 'number',
      units: ['u2.9', 'u3.2'],
      prompt:
        "Using altitude = 90 − |latitude − declination|, calculate the sun's altitude at solar noon for 52°N on the summer solstice (declination ≈ +23.44°). Then check your answer against the simulator.",
      unitLabel: '°',
      check(value) {
        const noonMinutes = solarNoonMinutes(YEAR, 5, 21, 0);
        const d = new Date(Date.UTC(YEAR, 5, 21, 0, noonMinutes));
        const sun = getSunPosition(d, 52, 0);
        const correct = Math.abs(value - sun.altitude) <= 1;
        return { correct, message: `The simulator gives ${sun.altitude.toFixed(1)}° at solar noon on this day.` };
      },
    },
    {
      id: 'q4',
      type: 'choice',
      units: ['u1.4'],
      prompt: 'On the day of an equinox, from which direction does the sun rise?',
      options: ['North', 'East', 'South', 'West'],
      check(value) {
        const correct = value === 'East';
        return {
          correct,
          message: 'The sun rises due East (and sets due West) on the equinoxes, from any latitude.',
        };
      },
    },
    {
      id: 'q5',
      type: 'time',
      units: ['u2.10'],
      prompt:
        "On the summer solstice (21 June) at longitude 0°, what UTC time is solar noon — the sun's highest point, due south?",
      check(value) {
        const noonMinutes = solarNoonMinutes(YEAR, 5, 21, 0);
        const [h, m] = (value || '').split(':').map(Number);
        const userMinutes = Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
        // +/-1 degree of hour angle = +/-4 minutes (15 degrees of hour angle per hour)
        const correct = userMinutes !== null && Math.abs(userMinutes - noonMinutes) <= 4;
        return { correct, message: `The simulator's solar noon is at ${minutesToClock(noonMinutes)} UTC.` };
      },
    },
    {
      id: 'q6',
      type: 'text',
      units: ['u1.6'],
      prompt:
        "Drag the time slider until the sun reaches its highest point for the day (its peak altitude). What is that moment called?",
      check(value) {
        const correct = normalizeText(value) === 'culmination';
        return {
          correct,
          message: "That moment — when the sun crosses the meridian and reaches its highest point in the sky — is called culmination.",
        };
      },
    },
    {
      id: 'q7',
      type: 'text',
      units: ['u1.6'],
      prompt:
        'What is the name of the imaginary line running from due north, up through the centre of the sky diagram, to due south?',
      check(value) {
        const correct = normalizeText(value) === 'meridian';
        return { correct, message: 'That line is called the meridian.' };
      },
    },
    {
      id: 'q8',
      type: 'choice',
      units: ['u1.6'],
      prompt: 'What is the name of the point at the exact centre of the sky diagram, directly overhead?',
      options: ['Zenith', 'Nadir', 'Meridian', 'Horizon'],
      check(value) {
        const correct = value === 'Zenith';
        return {
          correct,
          message: 'The point directly overhead is called the zenith (its opposite, straight down, is the nadir).',
        };
      },
    },
  ];
}

if (typeof module !== 'undefined' && module.exports) {
  const { getSunPosition } = require('./solarPosition');
  module.exports = { QUESTIONS: makeQuestions(getSunPosition), makeQuestions };
} else if (typeof window !== 'undefined') {
  window.Questions = { QUESTIONS: makeQuestions(window.SolarPosition.getSunPosition), makeQuestions };
}
