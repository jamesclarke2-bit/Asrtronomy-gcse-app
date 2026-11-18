/**
 * Exam-style practice questions for notes/crewed-missions-apollo.html
 * (spec 11.29, 11.30), each with `marks` and a mark scheme in its
 * feedback: weighing a crew against a probe for a stated task, the three
 * modules' jobs, ordering the mission profile, and the Apollo programme's
 * main features.
 */
(function () {
  function makeQuestions(A) {
    const UNITS = ['u5.8'];

    function markScheme(points) {
      return `Mark scheme: ${points.map((p) => `${p} (1)`).join('; ')}.`;
    }

    function single(id, spec, prompt, options, right, point) {
      return { id, units: UNITS, spec, marks: 1, prompt, type: 'choice', options, check(value) { return { correct: value === right, message: markScheme([point]) }; } };
    }

    const MODULE_NAMES = A.MODULES.map((m) => m.name);
    const ORDER = ['Earth orbit', 'Lunar orbit', 'Landing', 'Splashdown'];

    const PROBE_NEPTUNE = 'A probe: the trip is too long and far for a crew to be kept alive and safe from radiation';
    const CREW_REPAIR = 'A crew: people can open up and fix equipment that was not designed for robots';
    const ROUND_TRIP = +A.laserRoundTripSeconds().toFixed(2);

    return [
      // --- 11.29 Crewed missions against probes --------------------------
      {
        id: 'am-weigh-task',
        units: UNITS,
        spec: '11.29',
        marks: 2,
        prompt: "A space agency wants to study Neptune's moons, about 30 AU away, for 10 years. Should it send a crewed mission or a probe? Choose the answer with the right reason.",
        type: 'choice',
        options: [
          PROBE_NEPTUNE,
          'A crew: people can choose the best samples on the spot',
          'A probe: probes always find more than people',
          'A crew: a crewed mission is always cheaper',
        ],
        check(value) {
          return {
            correct: value === PROBE_NEPTUNE,
            message: markScheme([
              'a probe',
              'a 10-year trip that far would need life support (air, water, food) for years, expose the crew to radiation and risk their lives; a probe needs none of this and costs far less',
            ]),
          };
        },
      },
      single(
        'am-weigh-repair',
        '11.29',
        'A telescope in orbit round the Earth has a faulty part that was never designed to be replaced by a robot. Which should fix it, and why?',
        [CREW_REPAIR, 'A probe: it is cheaper and nobody is put at risk', 'Neither: nothing in orbit can be repaired', 'A probe: robots can reach further'],
        CREW_REPAIR,
        'a crew: people can adapt, open up and repair equipment on the spot, which robots cannot do for parts not designed for them',
      ),
      single(
        'am-disadvantage',
        '11.29',
        'Which of these is a disadvantage of a crewed mission compared with a probe?',
        ['It must carry life support: air, water and food', 'People can decide what to do on the spot', 'People can repair equipment', 'Samples can be brought home'],
        'It must carry life support: air, water and food',
        'life support (air, water, food) adds mass and cost; the others are advantages of a crew',
      ),

      // --- 11.30 The Apollo programme -------------------------------------
      {
        id: 'am-modules',
        units: UNITS,
        spec: '11.30',
        marks: 3,
        prompt: 'Match each Apollo spacecraft job to the module that did it.',
        fields: [
          { key: 'land', type: 'choice', label: '(a) Took two astronauts down to the Moon and back up to orbit', options: MODULE_NAMES },
          { key: 'home', type: 'choice', label: '(b) The crew cabin, and the only part that returned to Earth', options: MODULE_NAMES },
          { key: 'engine', type: 'choice', label: '(c) Carried the main engine, electricity and oxygen; let go before re-entry', options: MODULE_NAMES },
        ],
        check(value) {
          const ok = [value.land === 'Lunar Module', value.home === 'Command Module', value.engine === 'Service Module'];
          const got = ok.filter(Boolean).length;
          return { correct: ok.every(Boolean), message: `${got} out of 3 marks. ${markScheme(['(a) the Lunar Module', '(b) the Command Module', '(c) the Service Module'])}` };
        },
      },
      {
        id: 'am-order',
        units: UNITS,
        spec: '11.30',
        marks: 2,
        prompt: 'Put these stages of an Apollo landing mission in order.',
        fields: [
          { key: 'first', type: 'choice', label: 'First', options: ORDER },
          { key: 'second', type: 'choice', label: 'Second', options: ORDER },
          { key: 'third', type: 'choice', label: 'Third', options: ORDER },
          { key: 'fourth', type: 'choice', label: 'Fourth', options: ORDER },
        ],
        check(value) {
          const given = [value.first, value.second, value.third, value.fourth];
          const right = given.every((v, i) => v === ORDER[i]);
          const firstTwo = given[0] === ORDER[0] && given[1] === ORDER[1];
          const marks = right ? 2 : firstTwo ? 1 : 0;
          return {
            correct: right,
            message: `${marks} out of 2 marks. ${markScheme(['Earth orbit, then (about 3 days out) lunar orbit', 'then landing, and (after ascent, docking and about 3 days home) splashdown'])}`,
          };
        },
      },
      single(
        'am-why-apollo',
        '11.30',
        'What prompted the USA to set the goal of landing people on the Moon?',
        [
          'The Soviet Union putting the first person in space, Yuri Gagarin, in 1961',
          'The discovery of water on the Moon',
          'A probe finding life on the Moon',
          'The Moon moving closer to the Earth',
        ],
        'The Soviet Union putting the first person in space, Yuri Gagarin, in 1961',
        "the space race: Gagarin's flight in 1961 prompted President Kennedy's goal of a Moon landing before the end of the decade",
      ),
      single(
        'am-apollo-13',
        '11.30',
        'What happened on Apollo 13?',
        [
          'An oxygen tank exploded on the way out; the landing was called off and the crew came home safely',
          'It was the first mission to land on the Moon',
          'It was the last mission to land on the Moon',
          'It was the first crew to orbit the Moon',
        ],
        'An oxygen tank exploded on the way out; the landing was called off and the crew came home safely',
        'an explosion on the way out ended the landing; the crew used the Lunar Module as a lifeboat and returned safely',
      ),
      single(
        'am-saturn-v',
        '11.30',
        'Why did the Saturn V drop each of its stages once it was empty?',
        [
          'Getting rid of empty tanks and engines left less mass for the next stage to push',
          'To leave pieces on the Moon',
          'To slow the rocket down',
          'Because the stages were too hot to keep',
        ],
        'Getting rid of empty tanks and engines left less mass for the next stage to push',
        'dropping empty stages means the remaining engines only have to accelerate the mass that is left',
      ),
      {
        id: 'am-laser',
        units: UNITS,
        spec: '11.30',
        marks: 2,
        prompt: `Apollo astronauts left reflectors on the Moon. A laser pulse is fired at one and reflected straight back. The data sheet gives the Earth-Moon distance as ${A.EARTH_MOON_KM.toLocaleString('en-GB')} km and the speed of light as ${(A.C_M_PER_S / 1e8).toFixed(1)} × 10⁸ m/s. How long does the pulse take to get there and back?`,
        type: 'number',
        unitLabel: 's',
        check(value) {
          const correct = Math.abs(Number(value) - ROUND_TRIP) <= 0.02 * ROUND_TRIP;
          return {
            correct,
            message: markScheme([
              `distance there and back = 2 × ${A.EARTH_MOON_KM.toLocaleString('en-GB')} km = ${((2 * A.EARTH_MOON_KM * 1000) / 1e8).toFixed(1)} × 10⁸ m`,
              `time = distance ÷ speed = ${((2 * A.EARTH_MOON_KM * 1000) / 1e8).toFixed(1)} × 10⁸ ÷ ${(A.C_M_PER_S / 1e8).toFixed(1)} × 10⁸ ≈ ${ROUND_TRIP} s`,
            ]),
          };
        },
        answer: ROUND_TRIP,
      },
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.ApolloQuestions = api;
  }
})();
