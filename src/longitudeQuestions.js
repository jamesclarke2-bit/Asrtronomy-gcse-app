/**
 * Exam-style practice questions for notes/finding-longitude.html (spec
 * 4.20, 4.21), each with `marks` and a full worked mark scheme in its
 * feedback: longitude from a time difference (east and west), reading a
 * lunar-distance table, why the method needs tables, and why an accurate
 * clock solved the problem.
 */
(function () {
  function makeQuestions(L) {
    const UNITS = ['u2.35'];

    function markScheme(points) {
      return `Mark scheme: ${points.map((p) => `${p} (1)`).join('; ')}.`;
    }

    function single(id, spec, prompt, options, right, point, render) {
      const q = { id, units: UNITS, spec, marks: 1, prompt, type: 'choice', options, check(value) { return { correct: value === right, message: markScheme([point]) }; } };
      if (render) q.render = render;
      return q;
    }

    function picture(label, width, height, draw) {
      return (container) => {
        const panelDiv = document.createElement('div');
        panelDiv.className = 'spectrum-panel hr-question-diagram';
        const wrap = document.createElement('div');
        wrap.className = 'labelled-diagram-wrap';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        [['viewBox', `0 0 ${width} ${height}`], ['width', width], ['height', height], ['class', 'responsive-svg'], ['role', 'img'], ['aria-label', label]].forEach(([k, v]) => svg.setAttribute(k, v));
        wrap.appendChild(svg);
        panelDiv.appendChild(wrap);
        container.appendChild(panelDiv);
        draw(svg, wrap);
      };
    }

    // A longitude calculation from a stated Greenwich time of local noon.
    function calc(id, greenwich) {
      const [h, m] = greenwich.split(':').map(Number);
      const r = L.longitudeFromNoon(h * 60 + m);
      const diff = Math.abs(r.diffMinutes);
      const tol = Math.max(0.02 * r.degrees, 0.1);
      const dirWord = r.direction === 'W' ? 'west' : 'east';
      return {
        id,
        units: UNITS,
        spec: '4.21',
        marks: 3,
        prompt: `A navigator finds local noon, when the Sun is highest, at the moment the ship's chronometer, which keeps Greenwich time, reads ${greenwich}. The Earth turns 15° every hour (1° every 4 minutes). Calculate the ship's longitude, and say whether it is east or west of Greenwich.`,
        fields: [
          { key: 'degrees', type: 'number', label: 'Longitude', unitLabel: '°' },
          { key: 'direction', type: 'choice', label: 'East or west?', options: ['East', 'West'] },
        ],
        check(value) {
          const a = Math.abs(Number(value.degrees) - r.degrees) <= tol;
          const b = value.direction === (r.direction === 'W' ? 'West' : 'East');
          const marks = (a ? 2 : 0) + (b ? 1 : 0);
          const scheme = markScheme([
            `time difference: ${greenwich} − 12:00 is ${Math.floor(diff / 60)} h ${diff % 60} min = ${diff} minutes`,
            `${diff} ÷ 4 = ${r.degrees}° (or ${(diff / 60).toFixed(2)} h × 15° per hour)`,
            `Greenwich is ${r.direction === 'W' ? 'later' : 'earlier'} than local noon, so ${dirWord}: ${r.degrees}° ${r.direction}`,
          ]);
          return { correct: a && b, message: `${marks} out of 3 marks. ${scheme}` };
        },
        answer: { degrees: r.degrees, direction: r.direction === 'W' ? 'West' : 'East' },
      };
    }

    const MEASURED = 37.5;
    const READ_ANSWER = L.greenwichFromLunarDistance(MEASURED);
    const tableText = L.lunarTable().slice(0, 4).map((row) => `${L.formatClock(row.hours * 60)}: ${row.distanceDeg}°`).join(', ');

    const DRIFT_S = 6;
    const DRIFT_DAYS = 40;
    const DRIFT_MIN = (DRIFT_S * DRIFT_DAYS) / 60;
    const DRIFT_DEG = L.longitudeErrorDeg(DRIFT_MIN);

    const TABLES = 'The Moon\'s motion is complicated, so its position against the stars at each Greenwich time has to be worked out in advance';
    const CLOCK = 'It carries Greenwich time with the ship, so comparing it with local noon gives the longitude directly';

    return [
      calc('lg-calc-west', '15:20'),
      calc('lg-calc-east', '08:36'),
      single(
        'lg-why-greenwich',
        '4.21',
        'Why does a navigator need to know the time at Greenwich to find longitude?',
        [
          'Longitude is the difference between local time and Greenwich time: 15° for every hour',
          'Greenwich is on the equator',
          'The Sun is always highest at Greenwich',
          'Latitude cannot be found without it',
        ],
        'Longitude is the difference between local time and Greenwich time: 15° for every hour',
        'longitude is found from the time difference between local noon and Greenwich, at 15° an hour',
      ),
      single(
        'lg-why-tables',
        '4.20',
        'In the lunar distance method, why does the navigator need printed tables?',
        [TABLES, 'To convert degrees into kilometres', 'To find the latitude of the ship', 'Because sextants cannot measure angles'],
        TABLES,
        "the tables give the Moon's predicted angle from bright stars at each Greenwich time, worked out in advance by astronomers, so a measured angle can be turned into a Greenwich time",
      ),
      {
        id: 'lg-lunar-read',
        units: UNITS,
        spec: '4.20',
        marks: 2,
        prompt: `The drawing shows a measured lunar distance of ${MEASURED}°. A table for this star gives ${tableText}, and the Moon moves at a steady ${L.MOON_DEG_PER_HOUR}° an hour. What is the Greenwich time, in hours after midnight?`,
        type: 'number',
        unitLabel: 'hours',
        render: picture(`A bright star and the Moon on a strip of night sky, with the angle between them marked: ${MEASURED}°.`, 640, 300, (svg, wrap) => window.LongitudeDrawing.drawLunar(svg, wrap, READ_ANSWER, { hideTable: true })),
        check(value) {
          const correct = Math.abs(Number(value) - READ_ANSWER) <= Math.max(0.02 * READ_ANSWER, 0.1);
          return {
            correct,
            message: markScheme([
              `${MEASURED}° lies between the 03:00 value (38.5°) and the 06:00 value (37°): ${38.5 - MEASURED}° on from 38.5°`,
              `at ${L.MOON_DEG_PER_HOUR}° an hour that is ${(38.5 - MEASURED) / L.MOON_DEG_PER_HOUR} hours after 03:00, so ${READ_ANSWER} hours (${L.formatClock(READ_ANSWER * 60)} Greenwich time)`,
            ]),
          };
        },
        answer: READ_ANSWER,
      },
      single(
        'lg-angle-error',
        '4.20',
        'The Moon moves about half a degree (30 arcminutes) an hour against the stars. A navigator measures the lunar distance 1 arcminute too large. About how big is the error in longitude?',
        ['Half a degree', '1 degree', '15 degrees', 'Less than a hundredth of a degree'],
        'Half a degree',
        '1 arcminute is 1/30 of an hour = 2 minutes of time, and every 4 minutes is 1°, so 2 minutes is half a degree',
      ),
      single(
        'lg-why-clock',
        '4.21',
        "Why did Harrison's marine chronometer solve the longitude problem?",
        [CLOCK, 'It measured the angle between the Moon and a star', 'It showed the ship\'s latitude', 'It pointed towards Greenwich'],
        CLOCK,
        'a clock that keeps accurate Greenwich time at sea, despite the ship rolling and changes of temperature, gives the Greenwich time at local noon directly',
      ),
      {
        id: 'lg-drift',
        units: UNITS,
        spec: '4.21',
        marks: 2,
        prompt: `A ship's clock loses ${DRIFT_S} seconds every day. Every 4 minutes a clock is wrong puts the longitude 1° out. After ${DRIFT_DAYS} days at sea, how far out is the longitude found with it?`,
        type: 'number',
        unitLabel: '°',
        check(value) {
          const correct = Math.abs(Number(value) - DRIFT_DEG) <= Math.max(0.02 * DRIFT_DEG, 0.02);
          return {
            correct,
            message: markScheme([
              `${DRIFT_S} s × ${DRIFT_DAYS} days = ${DRIFT_S * DRIFT_DAYS} s = ${DRIFT_MIN} minutes`,
              `${DRIFT_MIN} ÷ 4 = ${DRIFT_DEG}° out`,
            ]),
          };
        },
        answer: DRIFT_DEG,
      },
      {
        id: 'lg-match-methods',
        units: UNITS,
        spec: '4.20',
        marks: 2,
        prompt: 'Name the method each description belongs to.',
        fields: [
          { key: 'a', type: 'choice', label: '(a) Measure the angle between the Moon and a star, then look it up in tables', options: ['Lunar distance', 'Marine chronometer'] },
          { key: 'b', type: 'choice', label: '(b) Carry a clock that keeps Greenwich time throughout the voyage', options: ['Lunar distance', 'Marine chronometer'] },
        ],
        check(value) {
          const a = value.a === 'Lunar distance';
          const b = value.b === 'Marine chronometer';
          return { correct: a && b, message: `${[a, b].filter(Boolean).length} out of 2 marks. ${markScheme(['(a) lunar distance, the astronomical method', '(b) the marine chronometer, the horological method'])}` };
        },
      },
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.LongitudeQuestions = api;
  }
})();
