/**
 * Practice questions for sims/shadows-and-sundials.html: finding local
 * noon with a shadow stick (4.7, u2.30), sundials (4.8, u2.31), and
 * finding longitude from a shadow stick and the equation of time (4.19,
 * u2.32).
 *
 * Every computed figure comes live from src/shadowGeometry.js and
 * src/solarPosition.js — the same engine the page's own diagrams use —
 * so a question can never quote a number the page itself would
 * disagree with. Tolerances are at least 2% of the expected value.
 */

function makeQuestions(ShadowGeometry, SolarPosition) {
  // A percentage tolerance, floored so a value near zero isn't an
  // impossibly tight target — never tighter than 2% of the expected size.
  function tolerance(expected, minAbsolute) {
    return Math.max(Math.abs(expected) * 0.02, minAbsolute);
  }

  const shadowAltitude = 35; // degrees, a stated given for this question
  const shadowHeight = 1.2; // m, a stated given
  const shadowLength = ShadowGeometry.shadowLengthM(shadowHeight, shadowAltitude);

  const hourAngleLat = 51.5; // degrees, a stated given (matches the page's own diagram default)
  const hourAngleHours = 3; // hours from noon, a stated given
  const hourAngleDeg = ShadowGeometry.sundialHourLineAngleDeg(hourAngleLat, hourAngleHours);

  // Longitude question: the equation of time for a real date, taken live
  // from solarPosition.js (not hand-typed), so the question always
  // matches whatever the engine actually computes for that date.
  const longitudeDate = new Date(Date.UTC(2026, 1, 12, 12, 0)); // 12 February, near the EoT's most negative point
  const longitudeDateLabel = longitudeDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  const longitudeEoT = SolarPosition.getSunPosition(longitudeDate, 51.5, 0).equationOfTime;
  const observedNoonUT = 12 * 60 + 30; // 12:30 UT, a stated given for this question
  const longitudeAnswer = ShadowGeometry.longitudeFromNoonUTDeg(longitudeEoT, observedNoonUT);

  return [
    {
      id: 'shadow-length-calculation',
      units: ['u2.30'],
      type: 'number',
      unitLabel: 'm',
      prompt: `A vertical stick ${shadowHeight} m tall casts a shadow while the Sun's altitude is ${shadowAltitude}°. Calculate the shadow's length (shadow length = height / tan(altitude)).`,
      check(value) {
        const correct = Math.abs(value - shadowLength) <= tolerance(shadowLength, 0.03);
        return {
          correct,
          message: `shadow length = ${shadowHeight} / tan(${shadowAltitude}°) = ${shadowHeight} / ${Math.tan((shadowAltitude * Math.PI) / 180).toFixed(4)} = ${shadowLength.toFixed(2)} m.`,
        };
      },
    },
    {
      id: 'shortest-shadow-direction',
      units: ['u2.30'],
      type: 'choice',
      prompt: "At a latitude north of the Sun's own declination, which way does a shadow stick's shortest shadow of the day point, and when does it happen?",
      options: [
        'Due east, at sunrise',
        'Due south, at local apparent noon',
        'Due north, at local apparent noon',
        "Due north, but only at the Sun's highest point of the year (the summer solstice)",
      ],
      check(value) {
        const correct = value === 'Due north, at local apparent noon';
        return {
          correct,
          message:
            "The shadow is shortest exactly when the Sun is highest — local apparent noon, when the Sun crosses the observer's own meridian. North of the Sun's declination, the Sun is due south at that moment, so the shadow (always opposite the Sun) points due north. This happens every day, not just at a solstice — only the shadow's own length at noon changes through the year, not its direction.",
        };
      },
    },
    {
      id: 'equal-shadow-method',
      units: ['u2.30'],
      type: 'choice',
      prompt:
        "Without timing the exact moment of the shortest shadow, how can a shadow stick alone still find true north-south? (The 'equal shadow lengths' method.)",
      options: [
        'Mark where the shadow tip falls at sunrise and at sunset, and bisect the line between them',
        'Mark two shadow tips of equal length, one before and one after noon, and bisect the line between them',
        'Measure the shadow length once, at any time of day, and point along it',
        "Wait for the shadow to disappear completely, which only happens exactly at noon",
      ],
      check(value) {
        const correct = value === 'Mark two shadow tips of equal length, one before and one after noon, and bisect the line between them';
        return {
          correct,
          message:
            "Shadow length depends only on the Sun's altitude, which is symmetric in time either side of local apparent noon (for a fixed declination) — so a morning tip and an afternoon tip of the same length are mirror images of each other across the north-south line. The line joining them is therefore symmetric about that line too, and its perpendicular bisector — passing through the stick's own base — points exactly north-south, without ever needing to catch the precise minimum.",
        };
      },
    },
    {
      id: 'hour-line-angle-calculation',
      units: ['u2.31'],
      type: 'number',
      unitLabel: '°',
      prompt: `A horizontal sundial is built for latitude ${hourAngleLat}°. Calculate the hour-line angle, measured from the noon line, for ${hourAngleHours} hours from noon (tan(hour-line angle) = sin(latitude) × tan(15° × hours from noon)).`,
      check(value) {
        const correct = Math.abs(value - hourAngleDeg) <= tolerance(hourAngleDeg, 0.3);
        return {
          correct,
          message: `tan(angle) = sin(${hourAngleLat}°) × tan(15° × ${hourAngleHours}) = ${Math.sin((hourAngleLat * Math.PI) / 180).toFixed(4)} × tan(${15 * hourAngleHours}°) = ${(Math.sin((hourAngleLat * Math.PI) / 180) * Math.tan((15 * hourAngleHours * Math.PI) / 180)).toFixed(4)}, so angle = ${hourAngleDeg.toFixed(2)}°.`,
        };
      },
    },
    {
      id: 'unequal-hour-lines',
      units: ['u2.31'],
      type: 'choice',
      prompt: "A horizontal sundial's hour lines are not evenly spaced around the dial plate. At what latitude are they evenly spaced, at exactly 15° per hour?",
      options: ['0° (the equator)', '45°', '90° (a pole)', 'They are never evenly spaced, at any latitude'],
      check(value) {
        const correct = value === '90° (a pole)';
        return {
          correct,
          message:
            'tan(hour-line angle) = sin(latitude) × tan(15° × hours from noon). Only at latitude 90° does sin(latitude) = 1, which leaves the hour-line angle exactly equal to 15° × hours from noon — the Sun\'s own steady rotation rate, undistorted. At every other latitude, sin(latitude) < 1 shrinks the morning and evening hour angles more than the ones near noon, bunching them closer together on the dial plate.',
        };
      },
    },
    {
      id: 'sundial-vs-clock-offset',
      units: ['u2.31'],
      type: 'choice',
      prompt: "A sundial reads apparent solar time directly. Which three things together explain why that differs from the time on your watch?",
      options: [
        'Only the equation of time',
        'Only how far the observer is from the centre of their time zone',
        'The longitude correction (local mean time vs GMT), the equation of time (apparent vs mean solar time), and the time zone\'s own offset from GMT',
        "The sundial's own gnomon angle, the dial plate's material, and the time of year"
      ],
      check(value) {
        const correct =
          value ===
          "The longitude correction (local mean time vs GMT), the equation of time (apparent vs mean solar time), and the time zone's own offset from GMT";
        return {
          correct,
          message:
            "Three separate effects stack together: a longitude correction (4 minutes per degree between the observer's own local mean time and GMT), the equation of time (the sundial's apparent solar time running ahead of or behind mean solar time through the year), and the time zone's own offset from GMT (a whole number of hours, not tied to the observer's exact longitude). See the Equation of Time page for the second of these on its own.",
        };
      },
    },
    {
      id: 'longitude-from-shadow-stick',
      units: ['u2.32'],
      type: 'number',
      unitLabel: '° (negative for west)',
      prompt: `On ${longitudeDateLabel}, the equation of time is ${longitudeEoT.toFixed(1)} minutes. A shadow stick shows local apparent noon at ${String(Math.floor(observedNoonUT / 60)).padStart(2, '0')}:${String(Math.round(observedNoonUT % 60)).padStart(2, '0')} UT. Calculate the observer's longitude (longitude = 15 × (12:00 − equation of time − UT of noon), hours; east positive, so a negative answer is west).`,
      check(value) {
        const correct = Math.abs(value - longitudeAnswer) <= tolerance(longitudeAnswer, 0.3);
        return {
          correct,
          message: `UT of noon, in hours, is ${(observedNoonUT / 60).toFixed(3)}; equation of time is ${(longitudeEoT / 60).toFixed(3)} h. longitude = 15 × (12.000 − ${(longitudeEoT / 60).toFixed(3)} − ${(observedNoonUT / 60).toFixed(3)}) = ${longitudeAnswer.toFixed(2)}° (${longitudeAnswer < 0 ? 'west' : 'east'}).`,
        };
      },
    },
  ];
}

const shadowsAndSundialsQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = shadowsAndSundialsQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.ShadowsAndSundialsQuestions = shadowsAndSundialsQuestionsApi;
}
