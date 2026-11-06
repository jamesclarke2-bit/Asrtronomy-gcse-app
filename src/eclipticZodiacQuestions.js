/**
 * Practice questions for notes/ecliptic-zodiac.html (u1.16, u2.29,
 * u3.23): why the Sun, Moon and planets stay near the ecliptic; why
 * astronomy's real (IAU) constellations and astrology's equal-30°
 * signs now disagree; and reading the page's own engines
 * (src/eclipticZodiac.js, src/planetaryMotion.js) rather than
 * hard-coded answers.
 */

function makeQuestions(EclipticZodiac, SolarPosition, PlanetaryMotion) {
  const DEPS = { SolarPosition };

  const OPHIUCHUS_START = { month: 10, day: 29 }; // 29 November
  const OPHIUCHUS_END = { month: 11, day: 17 }; // 17 December (exclusive — Sagittarius begins here)
  const dayCount = Math.round(
    (Date.UTC(2025, OPHIUCHUS_END.month, OPHIUCHUS_END.day) - Date.UTC(2025, OPHIUCHUS_START.month, OPHIUCHUS_START.day)) / 86400000
  );

  const PRECESSION_PERIOD_YEARS = 26000;
  const YEARS_SINCE_SIGNS_FIXED = 2000;
  const degreesShifted = (YEARS_SINCE_SIGNS_FIXED / PRECESSION_PERIOD_YEARS) * 360;

  return [
    {
      id: 'why-near-ecliptic',
      units: ['u3.23'],
      type: 'choice',
      prompt:
        "The Sun, Moon and every planet all stay close to one narrow band across the sky, the ecliptic, rather than being scattered randomly. Why?",
      options: [
        'Earth\'s gravity pulls everything in the Solar System into one flat plane around itself.',
        'The Solar System formed from one flattened, spinning disc of gas and dust, so the planets (and the Moon, tilted only about 5°) still orbit close to that same plane.',
        'It is a coincidence — there is no physical reason they should share a plane.',
        'The Sun\'s magnetic field lines everything up along its equator.',
      ],
      check(value) {
        const correct = value === 'The Solar System formed from one flattened, spinning disc of gas and dust, so the planets (and the Moon, tilted only about 5°) still orbit close to that same plane.';
        return {
          correct,
          message:
            "The Solar System formed from one flattened, spinning disc of gas and dust around the young Sun. The planets condensed within that disc and still orbit close to its plane today; seen from Earth (itself part of the same disc), that plane traces out the ecliptic across the sky. The Moon's own orbit is tilted a little more (about 5°) than the planets', which is why it wanders within a slightly wider band around the ecliptic rather than sitting exactly on it, but still stays close to the same zodiac constellations.",
        };
      },
    },
    {
      id: 'astronomy-vs-astrology-cause',
      units: ['u2.29'],
      type: 'choice',
      prompt:
        "Astrology's twelve star signs use fixed calendar dates set over 2,000 years ago. Astronomy's real constellations, measured today, often disagree with those dates. What actually causes this drift?",
      options: [
        "The Moon's gravity has slowly dragged the constellations across the sky.",
        'Precession: the ~26,000-year wobble in the direction Earth\'s axis points, which slowly shifts where the equinoxes fall against the background stars — the signs themselves were never updated to follow.',
        'The constellations are genuinely moving through space fast enough to notice within 2,000 years.',
        'Astronomers redrew the constellation boundaries in 1930 for no astronomical reason.',
      ],
      check(value) {
        const correct = value === 'Precession: the ~26,000-year wobble in the direction Earth\'s axis points, which slowly shifts where the equinoxes fall against the background stars — the signs themselves were never updated to follow.';
        return {
          correct,
          message:
            "Precession — the same ~26,000-year wobble in Earth's axis that slowly changes the pole star — gradually shifts where the equinoxes fall against the background stars. Astrology's equal 30° signs were fixed to the stars over 2,000 years ago and have simply kept their original calendar dates ever since; the real sky behind those dates has since drifted on. The 1930 IAU boundaries are a real, separate event, but they only formalised the constellations' true (unequal) shapes — they didn't cause the drift, precession did.",
        };
      },
    },
    {
      id: 'ophiuchus-duration',
      units: ['u1.16'],
      type: 'choice',
      prompt:
        `This page's own IAU boundary dates (first draft) have the Sun entering Ophiuchus on 29 November and entering Sagittarius on 17 December. About how many days does the Sun spend in Ophiuchus?`,
      options: ['About 6 days', 'About 18 days', 'About 30 days', 'About 48 days'],
      check(value) {
        const correctLabel = `About ${dayCount} days`;
        const correct = value === correctLabel;
        return {
          correct,
          message:
            `From 29 November to 17 December is ${dayCount} days (17 December is when the Sun leaves Ophiuchus and enters Sagittarius) — about ${dayCount} days, roughly as long as it spends in Scorpius, Aries or Aquarius, even though Ophiuchus has no "sign" of its own in astrology.`,
        };
      },
    },
    {
      id: 'opposite-at-midnight',
      units: ['u1.16'],
      type: 'choice',
      prompt:
        "On a date when the Sun's real (IAU) constellation is Virgo, which constellation is overhead at midnight — directly opposite the Sun?",
      options: ['Virgo itself', 'Pisces', 'Sagittarius', 'Gemini'],
      check(value) {
        // Find a real date this year when the Sun is actually in Virgo,
        // then ask the engine what's opposite it — never hard-coded.
        let virgoDate = null;
        for (let day = 0; day < 365 && !virgoDate; day += 1) {
          const date = new Date(Date.UTC(2025, 0, 1, 12) + day * 86400000);
          if (EclipticZodiac.sunConstellation(date, DEPS) === 'Virgo') virgoDate = date;
        }
        const opposite = EclipticZodiac.midnightConstellation(virgoDate, DEPS);
        const correct = value === opposite;
        return {
          correct,
          message:
            `At midnight you face directly away from the Sun, so the constellation overhead is whichever one sits opposite the Sun's own, roughly 180° around the ecliptic. When the Sun is in Virgo, that opposite point falls in ${opposite} — the classic case is the equinoxes themselves: when the Sun is in Pisces (around the March equinox), the midnight sky shows Virgo, and vice versa around the September equinox.`,
        };
      },
    },
    {
      id: 'precession-shift-since-signs-fixed',
      units: ['u2.29'],
      type: 'choice',
      prompt:
        `Precession turns the sky's reference points full circle (360°) roughly every ${PRECESSION_PERIOD_YEARS.toLocaleString('en-GB')} years. Astrology's signs were fixed against the stars about ${YEARS_SINCE_SIGNS_FIXED.toLocaleString('en-GB')} years ago. About how many degrees has the sky shifted against those fixed signs since then?`,
      options: ['About 3°', 'About 28°', 'About 90°', 'About 180°'],
      check(value) {
        const rounded = Math.round(degreesShifted);
        const correctLabel = `About ${rounded}°`;
        const correct = value === correctLabel;
        return {
          correct,
          message:
            `${YEARS_SINCE_SIGNS_FIXED.toLocaleString('en-GB')} years is ${((YEARS_SINCE_SIGNS_FIXED / PRECESSION_PERIOD_YEARS) * 100).toFixed(1)}% of the full ${PRECESSION_PERIOD_YEARS.toLocaleString('en-GB')}-year precession cycle, so the shift is about ${(YEARS_SINCE_SIGNS_FIXED / PRECESSION_PERIOD_YEARS).toFixed(3)} × 360° ≈ ${rounded}° — close to a whole 30°-wide sign, which is roughly why a star sign and its namesake constellation are now about one sign out of step.`,
        };
      },
    },
  ];
}

const eclipticZodiacQuestionsApi = { makeQuestions };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = eclipticZodiacQuestionsApi;
} else if (typeof window !== 'undefined') {
  window.EclipticZodiacQuestions = eclipticZodiacQuestionsApi;
}
