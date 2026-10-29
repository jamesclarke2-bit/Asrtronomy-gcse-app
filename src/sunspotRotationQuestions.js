/**
 * Practice questions for sims/sunspot-rotation.html (spec 10.7: use
 * sunspot data to find the mean solar rotation period). Same
 * dependency-injection pattern as src/coordinatesQuestions.js — every
 * check() re-derives its answer from src/sunRotation.js's own
 * formulas rather than a second, independently-typed copy of them.
 */

function makeQuestions(SunRotation) {
  const questions = [];

  // --- Method 1: double the limb-to-limb time -----------------------------
  questions.push({
    id: 'limb-to-limb-double',
    units: ['u2.5'],
    prompt:
      'A sunspot takes about 13.6 days to cross the visible disc, from the east limb to the west limb. Since that crossing is exactly half a rotation, doubling it estimates the full (synodic) rotation period. What period does this give, in days?',
    type: 'number',
    unitLabel: 'days',
    check(value) {
      const correct = SunRotation.synodicPeriodFromLimbToLimbDays(13.6);
      return {
        correct: Math.abs(value - correct) <= correct * 0.03,
        message: `Doubling the limb-to-limb time: 13.6 days × 2 = ${correct.toFixed(1)} days.`,
      };
    },
  });

  // --- Method 2: sidereal -> synodic conversion ---------------------------
  function makeSiderealToSynodicQuestion(id, label, siderealDays) {
    return {
      id,
      units: ['u2.5'],
      prompt: `${label}'s mean sidereal rotation period (relative to the fixed stars) is ${siderealDays} days. Using 1/synodic = 1/sidereal − 1/365.25 (365.25 days in a year), calculate the synodic period — the period actually observed from Earth.`,
      type: 'number',
      unitLabel: 'days',
      check(value) {
        const correct = SunRotation.synodicPeriodDays(siderealDays);
        return {
          correct: Math.abs(value - correct) <= correct * 0.02,
          message: `1/synodic = 1/${siderealDays} − 1/365.25, so the synodic period ≈ ${correct.toFixed(2)} days.`,
        };
      },
    };
  }
  questions.push(
    makeSiderealToSynodicQuestion('mean-sidereal-to-synodic', 'The Sun', 25.38),
    makeSiderealToSynodicQuestion('equatorial-sidereal-to-synodic', 'An equatorial sunspot', 24.5)
  );

  // --- Method 3: the two-reading "stretch" method --------------------------
  questions.push({
    id: 'two-reading-stretch',
    units: ['u2.5'],
    prompt:
      "A sunspot at the Sun's equator is measured at longitude 20° east of the central meridian on day 1, and 40° west of it on day 7. The angle moved is 20° + 40° = 60°, over 6 days. Using period = 360° × days ÷ angle moved, estimate the rotation period.",
    type: 'number',
    unitLabel: 'days',
    check(value) {
      const correct = SunRotation.periodFromTwoReadings(
        0,
        1,
        SunRotation.spotXPosition(0, -20, 100),
        7,
        SunRotation.spotXPosition(0, 40, 100),
        100
      );
      return {
        correct: Math.abs(value - correct) <= correct * 0.02,
        message: `360° × 6 days ÷ 60° = ${correct.toFixed(1)} days.`,
      };
    },
  });

  // --- Differential rotation law -------------------------------------------
  function makeDifferentialRotationQuestion(id, latDeg) {
    return {
      id,
      units: ['u2.5'],
      prompt: `The Sun's differential rotation law gives its sidereal angular velocity as ω = 14.71 − 2.40 sin²(φ) − 1.79 sin⁴(φ) degrees per day, at latitude φ. Using this, calculate the sidereal rotation period at latitude ${latDeg}° (this is a first draft, to be checked by the teacher against the notes' simpler figures of about 25 days at the equator and about 35 days near the poles).`,
      type: 'number',
      unitLabel: 'days',
      check(value) {
        const correct = SunRotation.siderealPeriodDays(latDeg);
        return {
          correct: Math.abs(value - correct) <= correct * 0.02,
          message: `ω(${latDeg}°) ≈ ${SunRotation.siderealAngularVelocityDegPerDay(latDeg).toFixed(2)}°/day, so the period = 360° ÷ ω ≈ ${correct.toFixed(1)} days.`,
        };
      },
    };
  }
  questions.push(
    makeDifferentialRotationQuestion('differential-rotation-equator', 0),
    makeDifferentialRotationQuestion('differential-rotation-30', 30),
    makeDifferentialRotationQuestion('differential-rotation-60', 60)
  );

  // --- Conceptual: why isn't it one fixed number? --------------------------
  questions.push({
    id: 'why-not-fixed-number',
    units: ['u2.5'],
    prompt: "Why isn't the Sun's rotation period a single fixed number, the way a solid planet's is?",
    type: 'choice',
    options: [
      "The Sun is a ball of plasma, not a solid body, and rotates faster at its equator than near its poles (differential rotation)",
      "The Sun's distance from Earth changes throughout the year",
      'Sunspots only exist during the active part of the 11-year solar cycle',
      "The Sun's rotation is slowing down noticeably from one year to the next",
    ],
    check(value) {
      const correctAnswer =
        'The Sun is a ball of plasma, not a solid body, and rotates faster at its equator than near its poles (differential rotation)';
      return {
        correct: value === correctAnswer,
        message:
          "The Sun has no solid surface to fix a single rotation rate: different latitudes of plasma rotate at different speeds, fastest at the equator (~25 days, sidereal) and slower towards the poles (~35 days) — differential rotation.",
      };
    },
  });

  questions.push({
    id: 'why-synodic-longer-than-sidereal',
    units: ['u2.5'],
    prompt:
      "Why is the Sun's observed (synodic) rotation period longer than its true (sidereal) period, measured against the fixed stars?",
    type: 'choice',
    options: [
      "Earth orbits the Sun in the same direction the Sun spins, so a sunspot needs a little extra rotation each time to line up with Earth's new position again",
      "The Sun's own rotation genuinely speeds up and slows down from day to day",
      'Sunspots drift in latitude as the solar cycle progresses',
      'Light from the Sun takes extra time to reach Earth',
    ],
    check(value) {
      const correctAnswer =
        "Earth orbits the Sun in the same direction the Sun spins, so a sunspot needs a little extra rotation each time to line up with Earth's new position again";
      return {
        correct: value === correctAnswer,
        message:
          "Exactly the same relationship as the Moon's synodic vs sidereal month: Earth's own orbital motion means the Sun has to turn a little further than one full sidereal rotation before the same sunspot lines up with Earth again, stretching the observed (synodic) period beyond the true (sidereal) one.",
      };
    },
  });

  return questions;
}

const sunspotRotationQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = sunspotRotationQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.SunspotRotationQuestions = sunspotRotationQuestionsApi;
}
