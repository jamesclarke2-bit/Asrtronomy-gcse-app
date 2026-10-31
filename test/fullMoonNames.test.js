const test = require('node:test');
const assert = require('node:assert/strict');
const { MONTH_MOON_NAMES, buildFullMoonList } = require('../src/fullMoonNames');
const MoonPhase = require('../src/moonPhase');
const SolarPosition = require('../src/solarPosition');

const DEPS = { MoonPhase, SolarPosition };

// Independent re-implementation (not a call into src/fullMoonNames.js) of
// finding the September equinox by bisecting the Sun's declination down to
// where it crosses zero, so tests that use it aren't just re-running the
// module's own code against itself.
function septemberEquinoxUTC(year) {
  const declinationAt = (date) => SolarPosition.getSunPosition(date, 0, 0).declination;
  let lo = new Date(Date.UTC(year, 8, 10));
  let hi = new Date(Date.UTC(year, 8, 30));
  for (let i = 0; i < 40; i += 1) {
    const mid = new Date((lo.getTime() + hi.getTime()) / 2);
    if (declinationAt(mid) > 0) lo = mid; else hi = mid;
  }
  return new Date((lo.getTime() + hi.getTime()) / 2);
}

test('MONTH_MOON_NAMES has exactly twelve traditional names, one per calendar month', () => {
  assert.equal(MONTH_MOON_NAMES.length, 12);
  assert.deepEqual(MONTH_MOON_NAMES, [
    'Wolf', 'Snow', 'Worm', 'Pink', 'Flower', 'Strawberry',
    'Buck', 'Sturgeon', 'Harvest or Corn', "Hunter's", 'Beaver', 'Cold',
  ]);
});

test('septemberEquinoxUTC lands within the real equinox\'s known date range (20-24 September) in any year', () => {
  for (const year of [2017, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2030]) {
    const equinox = septemberEquinoxUTC(year);
    assert.equal(equinox.getUTCMonth(), 8, `${year}: equinox should fall in September`);
    assert.ok(equinox.getUTCDate() >= 20 && equinox.getUTCDate() <= 24, `${year}: equinox date ${equinox.toISOString()} outside the expected 20-24 September range`);
  }
});

test('buildFullMoonList finds exactly the Full Moons the engine gives for that year, one per lunation', () => {
  for (const year of [2020, 2023, 2024, 2026]) {
    const list = buildFullMoonList(year, DEPS);
    const engineMoons = MoonPhase.fullMoonsInRange(new Date(Date.UTC(year, 0, 1)), new Date(Date.UTC(year + 1, 0, 1)));

    assert.equal(list.length, engineMoons.length, `${year}: list length should match the engine's own Full Moon count`);
    list.forEach((moon, i) => {
      assert.equal(moon.date.getTime(), engineMoons[i].getTime(), `${year}: moon ${i} date should match the engine exactly`);
    });

    for (let i = 1; i < list.length; i += 1) {
      const gapDays = (list[i].date.getTime() - list[i - 1].date.getTime()) / 86400000;
      assert.ok(Math.abs(gapDays - MoonPhase.SYNODIC_MONTH_DAYS) < 1e-5, `${year}: gap between moon ${i - 1} and ${i} should be one lunation`);
    }
  }
});

test('every Full Moon follows its calendar month\'s traditional name, except the ones named Harvest and Hunter\'s', () => {
  for (const year of [2020, 2022, 2024, 2025]) {
    const list = buildFullMoonList(year, DEPS);
    list.forEach((moon) => {
      assert.equal(moon.monthIndex, moon.date.getUTCMonth());
      if (moon.name === 'Harvest' || moon.name === "Hunter's") return;
      assert.equal(moon.name, MONTH_MOON_NAMES[moon.monthIndex], `${year}: ${moon.date.toISOString()} should keep its calendar month's name`);
    });
  }
});

test('exactly one Full Moon a year is named Harvest, and exactly one is named Hunter\'s', () => {
  for (const year of [2017, 2020, 2021, 2022, 2023, 2024, 2025, 2026]) {
    const list = buildFullMoonList(year, DEPS);
    assert.equal(list.filter((m) => m.name === 'Harvest').length, 1, `${year}: should have exactly one Harvest Moon`);
    assert.equal(list.filter((m) => m.name === "Hunter's").length, 1, `${year}: should have exactly one Hunter's Moon`);
  }
});

test('the Harvest Moon is the Full Moon nearest the September equinox, not just September\'s own', () => {
  for (const year of [2017, 2020, 2021, 2022, 2023, 2024, 2025, 2026]) {
    const list = buildFullMoonList(year, DEPS);
    const equinox = septemberEquinoxUTC(year);
    const closest = list.reduce((best, moon) => {
      const diff = Math.abs(moon.date.getTime() - equinox.getTime());
      const bestDiff = Math.abs(best.date.getTime() - equinox.getTime());
      return diff < bestDiff ? moon : best;
    });
    assert.equal(closest.name, 'Harvest', `${year}: the Full Moon closest to the equinox (${closest.date.toISOString()}) should be named Harvest`);
  }
});

test('Hunter\'s Moon is the very next Full Moon after Harvest Moon, confirmed against the engine directly', () => {
  for (const year of [2017, 2020, 2021, 2022, 2023, 2024, 2025, 2026]) {
    const list = buildFullMoonList(year, DEPS);
    const harvestIndex = list.findIndex((m) => m.name === 'Harvest');
    const huntersIndex = list.findIndex((m) => m.name === "Hunter's");
    assert.equal(huntersIndex, harvestIndex + 1, `${year}: Hunter's Moon should be the very next entry after Harvest Moon`);
    // +1ms past the exact Harvest Moon moment, same convention fullMoonsInRange
    // itself uses, so this doesn't land back on the Harvest Moon itself.
    const expectedHunters = MoonPhase.nextFullMoonAfter(new Date(list[harvestIndex].date.getTime() + 1));
    assert.equal(list[huntersIndex].date.getTime(), expectedHunters.getTime());
  }
});

// 2020 and 2025 are real, widely-reported years where the Harvest Moon fell
// in October rather than September — 1 October 2020 (the first October
// Harvest Moon since 2009) and 6 October 2025 — because that year's
// September Full Moon landed further from the equinox than October's did.
// 2020 also had a Blue Moon that October (two Full Moons, 1 and 31
// October — see the Blue Moon test below), so that year's Hunter's Moon is
// October's own second Full Moon rather than November's.
test('a year with an October Harvest Moon (2020, 2025) names it Harvest, not Hunter\'s', () => {
  const expectedHuntersMonthIndex = { 2020: 9, 2025: 10 };
  for (const year of [2020, 2025]) {
    const list = buildFullMoonList(year, DEPS);
    const harvest = list.find((m) => m.name === 'Harvest');
    assert.equal(harvest.monthIndex, 9, `${year}: Harvest Moon should fall in October`);
    const hunters = list.find((m) => m.name === "Hunter's");
    assert.equal(hunters.monthIndex, expectedHuntersMonthIndex[year], `${year}: Hunter's Moon in the wrong calendar month`);
  }
});

// 2022 and 2024 are ordinary years where September's own Full Moon is the
// one nearest the equinox, so Harvest keeps its usual calendar slot.
test('a year with a September Harvest Moon (2022, 2024) names it Harvest in its usual calendar slot', () => {
  for (const year of [2022, 2024]) {
    const list = buildFullMoonList(year, DEPS);
    const harvest = list.find((m) => m.name === 'Harvest');
    assert.equal(harvest.monthIndex, 8, `${year}: Harvest Moon should fall in September`);
    const hunters = list.find((m) => m.name === "Hunter's");
    assert.equal(hunters.monthIndex, 9, `${year}: Hunter's Moon should then fall in October`);
  }
});

// August 2023 is a real, widely-reported "Super Blue Moon" month: two Full
// Moons (1 August and 31 August), confirmed against the real calendar.
test('a calendar month with two Full Moons marks the second one Blue Moon, not the first', () => {
  const list = buildFullMoonList(2023, DEPS);
  const augustMoons = list.filter((moon) => moon.monthIndex === 7);
  assert.equal(augustMoons.length, 2, 'August 2023 should have two Full Moons');
  assert.equal(augustMoons[0].isBlueMoon, false);
  assert.equal(augustMoons[1].isBlueMoon, true);
});

// October 2020 is another real, widely-reported Blue Moon month (1 and 31
// October), checked independently of 2023's. 2020's October Full Moons are
// also the year's Harvest and Hunter's Moons (see above) — isBlueMoon and
// the Harvest/Hunter's naming are independent flags on the same entries.
test('a second known Blue Moon month (October 2020) is marked the same way', () => {
  const list = buildFullMoonList(2020, DEPS);
  const octoberMoons = list.filter((moon) => moon.monthIndex === 9);
  assert.equal(octoberMoons.length, 2, 'October 2020 should have two Full Moons');
  assert.equal(octoberMoons[0].isBlueMoon, false);
  assert.equal(octoberMoons[1].isBlueMoon, true);
});

test('no month is ever marked Blue Moon unless it actually has two Full Moons', () => {
  for (const year of [2021, 2022, 2024, 2025, 2026]) {
    const list = buildFullMoonList(year, DEPS);
    const countByMonth = {};
    list.forEach((moon) => {
      countByMonth[moon.monthIndex] = (countByMonth[moon.monthIndex] || 0) + 1;
    });
    list.forEach((moon) => {
      if (moon.isBlueMoon) {
        assert.ok(countByMonth[moon.monthIndex] === 2, `${year}: month ${moon.monthIndex} marked Blue Moon but doesn't have exactly two Full Moons`);
      }
    });
  }
});
