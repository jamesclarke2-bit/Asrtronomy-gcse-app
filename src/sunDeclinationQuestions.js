/**
 * Practice questions for sims/sun-declination.html: the classic exam
 * style, "what's the Sun's altitude at transit (solar noon) at latitude
 * X on date Y?" — most often asked about the Tropics of Cancer/Capricorn
 * on the solstices and equinoxes.
 *
 * Every check() re-derives the correct answer from
 * SolarPosition.getSunPosition's declination and
 * Coordinates.getMaxAltitudeUpperTransit at call time, rather than a
 * hardcoded value, so grading always matches what those two
 * already-tested modules actually compute — neither is reimplemented
 * here. Same dependency-injection pattern as src/coordinatesQuestions.js.
 */

function makeQuestions(SolarPosition, Coordinates) {
  const YEAR = 2026;
  const TROPIC_OF_CAPRICORN = -23.44;
  const SYDNEY_LATITUDE = -34;

  function declinationOn(month, day) {
    const date = new Date(Date.UTC(YEAR, month, day));
    return SolarPosition.getSunPosition(date, 0, 0).declination;
  }

  function transitAltitude(lat, month, day) {
    return Coordinates.getMaxAltitudeUpperTransit(lat, declinationOn(month, day));
  }

  function makeTransitQuestion(id, dateLabel, month, day, lat, latLabel) {
    return {
      id,
      units: ['u1.11', 'u2.9'],
      type: 'number',
      unitLabel: '°',
      prompt: `What is the Sun's altitude at transit (solar noon) for an observer at ${latLabel} on the ${dateLabel}?`,
      check(value) {
        const correct = transitAltitude(lat, month, day);
        return {
          correct: Math.abs(value - correct) <= 1.5,
          message: `Altitude = 90° − |latitude − declination| = ${correct.toFixed(1)}°.`,
        };
      },
    };
  }

  const CAPRICORN_LABEL = 'the Tropic of Capricorn (23.44°S)';

  return [
    makeTransitQuestion('capricorn-june-solstice', 'June solstice (21 June)', 5, 21, TROPIC_OF_CAPRICORN, CAPRICORN_LABEL),
    makeTransitQuestion('capricorn-dec-solstice', 'December solstice (21 December)', 11, 21, TROPIC_OF_CAPRICORN, CAPRICORN_LABEL),
    makeTransitQuestion('capricorn-march-equinox', 'March equinox (21 March)', 2, 21, TROPIC_OF_CAPRICORN, CAPRICORN_LABEL),
    makeTransitQuestion('capricorn-sept-equinox', 'September equinox (21 September)', 8, 21, TROPIC_OF_CAPRICORN, CAPRICORN_LABEL),
    makeTransitQuestion('sydney-equinox-transit', 'March equinox (21 March)', 2, 21, SYDNEY_LATITUDE, 'Sydney (34°S)'),
  ];
}

const api = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
} else if (typeof window !== 'undefined') {
  window.SunDeclinationQuestions = api;
}
