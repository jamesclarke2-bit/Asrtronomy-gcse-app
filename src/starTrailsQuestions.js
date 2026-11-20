/**
 * Exam-style practice questions for notes/star-trails.html (spec 13.19),
 * each with `marks` and a full mark scheme. Answers come from StarTrails
 * (src/starTrails.js): sidereal day = (360 ÷ θ) × t. Numeric answers
 * accept 2% either side; the uncertainty is half the range.
 */
(function () {
  function makeQuestions(S) {
    const UNITS = ['u2.34'];
    const SPEC = '13.19';

    function markScheme(points) {
      return `Mark scheme: ${points.map((p) => `${p} (1)`).join('; ')}.`;
    }

    function scored(results, points) {
      const got = results.filter(Boolean).length;
      const total = results.length;
      const scheme = markScheme(points);
      return { correct: got === total, message: `${got} out of ${total} mark${total === 1 ? '' : 's'}. ${scheme}` };
    }

    function single(id, prompt, options, right, point) {
      return {
        id,
        units: UNITS,
        spec: SPEC,
        marks: 1,
        prompt,
        type: 'choice',
        options,
        check(value) {
          const scheme = markScheme([point]);
          return { correct: value === right, message: scheme };
        },
      };
    }

    function multi(id, prompt, fields, rights, points) {
      return {
        id,
        units: UNITS,
        spec: SPEC,
        marks: fields.length,
        prompt,
        fields,
        check(value) {
          return scored(fields.map((f, k) => value[f.key] === rights[k]), points);
        },
      };
    }

    /** A 2-mark calculation, accepting 2% either side (inclusive). */
    function calc({ id, prompt, unitLabel, answer, dp, working }) {
      return {
        id,
        units: UNITS,
        spec: SPEC,
        marks: 2,
        prompt,
        type: 'number',
        unitLabel,
        check(value) {
          const v = Number(value);
          const tol = 0.02 * answer * (1 + 1e-9);
          const correct = Number.isFinite(v) && Math.abs(v - answer) <= tol;
          const accept = `accept ${(0.98 * answer).toFixed(dp)} to ${(1.02 * answer).toFixed(dp)}`;
          const scheme = markScheme([working[0], `${working[1]} (${accept})`]);
          return { correct, message: `${correct ? 'Correct.' : 'Not quite.'} ${scheme}` };
        },
        answer: { value: answer },
      };
    }

    const minutesAnswer = S.siderealDayFrom(30.1, 120);
    const hoursAnswer = S.siderealDayFrom(60.2, 4);

    const RELATION = 'sidereal day = (360 ÷ θ) × t';
    const BIGGER = 'The arc covers a bigger angle';
    const SMALLER_PCT = 'The same reading uncertainty is a smaller fraction of a bigger angle, so the percentage uncertainty is smaller';
    const SPREAD = 'They show the spread, show up anomalies and give a mean';
    const ORBIT = 'The Earth moves along its orbit as it turns';
    const EXTRA = 'So after one turn against the stars it must turn a little further to face the Sun again';
    const POLE = 'The celestial pole';
    const TURNING = 'The Earth turning during a long exposure';

    // A table of five readings of the same arc, one of them anomalous.
    const table = [30.0, 30.5, 29.5, 34.0, 30.0];
    const tableText = table.map((v, k) => `student ${k + 1}: ${v.toFixed(1)}°`).join(', ');
    const tableStats = S.stats(table);

    // The long-exposure readings the page's own table opens with (59.9° ± 0.5° in 240 min).
    const LONG = S.result([60, 60.5, 59.5, 59.5, 60], 240);
    const CANT_DAY = LONG.shownDayMin;
    const CANT_UNC = LONG.shownUncertaintyMin;
    const WHOLE = S.dayRange(720, 0.5);
    const n = (x) => Math.round(x).toLocaleString('en-GB');
    const CANT = { day: n(CANT_DAY), lo: n(LONG.shownShortestMin), hi: n(LONG.shownLongestMin), sid: n(S.SIDEREAL_DAY_MIN), sol: n(S.SOLAR_DAY_MIN) };
    const NIGHT = { lo: n(WHOLE.shortestMin), hi: n(WHOLE.longestMin) };
    const MER = S.meridianMethod(30, 1);
    const BOTH_IN = 'Its range of possible values includes both days';
    const MERIDIAN = 'Time when a star crosses the meridian for 30 nights: it crosses about 4 minutes earlier each night, about 2 hours in all';
    const WHOLE_NIGHT = 'A whole-night star trail: the range is narrower, so it clearly separates them';
    return [
      single('st-what-trail', 'What makes the stars draw arcs in a star trail image?', [TURNING, 'The stars moving through space during the exposure', 'The camera being moved during the exposure', 'The atmosphere bending the starlight'], TURNING, 'the Earth turns during the long exposure, so each star appears to move round the sky, drawing an arc'),
      single('st-centre', 'What point do all the arcs in a star trail image curve around?', [POLE, 'The Moon', 'The horizon', 'The brightest star in the picture'], POLE, 'the celestial pole: the point in the sky directly above the Earth’s pole, which the whole sky seems to turn about'),
      single('st-relation', 'A star trail covers an angle θ (in degrees) in an exposure time t. Which relation gives the length of the sidereal day?', [RELATION, 'sidereal day = θ × t ÷ 360', 'sidereal day = 360 × θ ÷ t', 'sidereal day = t ÷ (360 × θ)'], RELATION, 'in t the Earth turns through θ, so one full turn of 360° takes (360 ÷ θ) × t'),
      calc({
        id: 'st-calc-minutes',
        prompt: 'In a star trail image taken with an exposure time of 120 minutes, each arc covers an angle of 30.1°. Use sidereal day = (360 ÷ θ) × t to find the length of the sidereal day in minutes.',
        unitLabel: 'min',
        answer: minutesAnswer,
        dp: 0,
        working: ['sidereal day = (360 ÷ θ) × t = (360 ÷ 30.1) × 120', `= 11.96 × 120 = ${Math.round(minutesAnswer).toLocaleString('en-GB')} min (about ${S.hoursAndMinutes(minutesAnswer)})`],
      }),
      calc({
        id: 'st-calc-hours',
        prompt: 'A 4.0-hour exposure gives star trail arcs of 60.2°. Use sidereal day = (360 ÷ θ) × t to find the length of the sidereal day in hours.',
        unitLabel: 'h',
        answer: hoursAnswer,
        dp: 2,
        working: ['sidereal day = (360 ÷ θ) × t = (360 ÷ 60.2) × 4.0', `= 5.98 × 4.0 = ${hoursAnswer.toFixed(2)} h`],
      }),
      multi(
        'st-longer-exposure',
        'Why is a longer exposure better for finding the sidereal day from star trails? (a) What happens to the arcs? (b) Why does that help?',
        [
          { key: 'arcs', type: 'choice', label: '(a) With a longer exposure', options: [BIGGER, 'The arcs become straight lines', 'The arcs get brighter but no longer'] },
          { key: 'why', type: 'choice', label: '(b) This helps because', options: [SMALLER_PCT, 'Repeating the measurement more times makes it more accurate', 'The Earth turns faster during a long exposure'] },
        ],
        [BIGGER, SMALLER_PCT],
        ['(a) the arcs cover a bigger angle', '(b) the reading uncertainty (for example ±0.5°) stays the same, so it is a smaller percentage of the bigger angle: the percentage uncertainty is smaller'],
      ),
      single('st-anomaly', `Five students measure the same star trail arc: ${tableText}. Which reading is anomalous?`, table.map((v, k) => `Student ${k + 1} (${v.toFixed(1)}°)`).filter((v, k, all) => all.indexOf(v) === k), `Student 4 (34.0°)`, 'student 4’s 34.0° is far from the others (29.5° to 30.5°), so it is anomalous and is left out of the mean'),
      {
        id: 'st-half-range',
        units: UNITS,
        spec: SPEC,
        marks: 2,
        prompt: `The same five readings: ${tableText}. Leaving out the anomaly, find the uncertainty in the angle, in degrees, taking it as half the range.`,
        type: 'number',
        unitLabel: '°',
        check(value) {
          const v = Number(value);
          // Accept the half-range to one extra place or rounded to the readings' 1 decimal place.
          const near = (target) => Math.abs(v - target) <= 0.02 * target * (1 + 1e-9);
          const correct = Number.isFinite(v) && (near(tableStats.uncertainty) || near(tableStats.uncertaintyRounded));
          const scheme = markScheme([
            `leave out the anomaly (34.0°): the rest run from ${tableStats.min.toFixed(1)}° to ${tableStats.max.toFixed(1)}°, a range of ${tableStats.range.toFixed(1)}°`,
            `uncertainty = half the range = ${tableStats.range.toFixed(1)} ÷ 2 = ±${tableStats.uncertainty}°${tableStats.uncertainty !== tableStats.uncertaintyRounded ? `, accept ±${tableStats.uncertaintyRounded}°` : ''} (mean ${tableStats.mean.toFixed(1)}°)`,
          ]);
          return { correct, message: `${correct ? 'Correct.' : 'Not quite.'} ${scheme}` };
        },
        answer: { value: tableStats.uncertainty },
      },
      single('st-repeats', 'Several students each read the same arc. What do the repeated readings do?', [SPREAD, 'They make the method more accurate', 'They remove all uncertainty', 'They make the arc longer'], SPREAD, 'repeats show the spread of the readings (and so the uncertainty), show up anomalies and give a mean; they do not make the method itself more accurate'),
      multi(
        'st-not-24',
        `Star trails give a sidereal day of about ${S.hoursAndMinutes(S.SIDEREAL_DAY_MIN)}, not 24 hours. Why? (a) What else is the Earth doing as it turns? (b) What does that mean for a solar day?`,
        [
          { key: 'doing', type: 'choice', label: '(a) As it turns, the Earth', options: [ORBIT, 'Slows down a little each day', 'Moves closer to the stars'] },
          { key: 'means', type: 'choice', label: '(b) So', options: [EXTRA, 'The stars move faster than the Sun', 'Star trail cameras run slow'] },
        ],
        [ORBIT, EXTRA],
        ['(a) the Earth moves along its orbit (about 1° a day)', `(b) after one turn against the stars (the sidereal day, ${S.hoursAndMinutes(S.SIDEREAL_DAY_MIN)}) it must turn a little further to face the Sun again, so the solar day (${S.hoursAndMinutes(S.SOLAR_DAY_MIN)}) is about ${S.SOLAR_DAY_MIN - S.SIDEREAL_DAY_MIN} minutes longer`],
      ),
      multi(
        'st-cant-separate',
        `A 240-minute exposure, with the arc read to ±0.5°, gives a sidereal day of ${CANT.day} ± ${CANT_UNC} min (${CANT.lo} to ${CANT.hi} min). The sidereal day is ${CANT.sid} min and the solar day is ${CANT.sol} min. (a) Why can this result not tell the two apart? (b) Which longer measurement would let a student tell them apart reliably?`,
        [
          { key: 'why', type: 'choice', label: '(a) Because', options: [BOTH_IN, 'The result is bigger than both of them', 'The uncertainty is too small'] },
          { key: 'fix', type: 'choice', label: '(b) What would', options: [MERIDIAN, WHOLE_NIGHT, 'Repeating the 240-minute reading many more times'] },
        ],
        [BOTH_IN, MERIDIAN],
        [`(a) the range, ${CANT.lo} to ${CANT.hi} min, holds both ${CANT.sid} and ${CANT.sol} min (half the range: (${CANT.hi} − ${CANT.lo}) ÷ 2 = ${LONG.shownHalfRangeMin} min; accept ±${LONG.shownHalfRangeMin} or ±${LONG.shownUncertaintyMin} min)`, `(b) time a star crossing the meridian over 30 nights: it crosses about ${MER.perNightMin} min earlier each night, so about ${MER.shiftMin} min (${MER.shiftMin / 60} hours) earlier in all; timed to ±1 min each, that shift is ${MER.shiftMin} ± ${MER.shiftUncertaintyMin} min, far bigger than its uncertainty, giving a sidereal day of ${CANT.sid} min to within about ±0.1 min. Not a whole-night star trail: its range, ${NIGHT.lo} to ${NIGHT.hi} min, only just reaches the gap. Not repeats, which do not make the method more accurate`],
      ),
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.StarTrailsQuestions = api;
  }
})();
