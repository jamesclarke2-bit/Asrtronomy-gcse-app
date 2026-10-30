const test = require('node:test');
const assert = require('node:assert/strict');
const { MONTH_MOON_NAMES, buildFullMoonList } = require('../src/fullMoonNames');
const MoonPhase = require('../src/moonPhase');

test('MONTH_MOON_NAMES has exactly twelve traditional names, one per calendar month', () => {
  assert.equal(MONTH_MOON_NAMES.length, 12);
  assert.deepEqual(MONTH_MOON_NAMES, [
    'Wolf', 'Snow', 'Worm', 'Pink', 'Flower', 'Strawberry',
    'Buck', 'Sturgeon', 'Harvest or Corn', "Hunter's", 'Beaver', 'Cold',
  ]);
});

test('buildFullMoonList finds exactly the Full Moons the engine gives for that year, one per lunation', () => {
  for (const year of [2020, 2023, 2024, 2026]) {
    const list = buildFullMoonList(year, { MoonPhase });
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

test('buildFullMoonList gives each Full Moon its calendar month\'s traditional name', () => {
  const list = buildFullMoonList(2024, { MoonPhase });
  list.forEach((moon) => {
    assert.equal(moon.name, MONTH_MOON_NAMES[moon.monthIndex]);
    assert.equal(moon.monthIndex, moon.date.getUTCMonth());
  });
});

// August 2023 is a real, widely-reported "Super Blue Moon" month: two Full
// Moons (1 August and 31 August), confirmed against the real calendar.
test('a calendar month with two Full Moons marks the second one Blue Moon, not the first', () => {
  const list = buildFullMoonList(2023, { MoonPhase });
  const augustMoons = list.filter((moon) => moon.monthIndex === 7);
  assert.equal(augustMoons.length, 2, 'August 2023 should have two Full Moons');
  assert.equal(augustMoons[0].isBlueMoon, false);
  assert.equal(augustMoons[1].isBlueMoon, true);
});

// October 2020 is another real, widely-reported Blue Moon month (1 and 31
// October), checked independently of 2023's.
test('a second known Blue Moon month (October 2020) is marked the same way', () => {
  const list = buildFullMoonList(2020, { MoonPhase });
  const octoberMoons = list.filter((moon) => moon.monthIndex === 9);
  assert.equal(octoberMoons.length, 2, 'October 2020 should have two Full Moons');
  assert.equal(octoberMoons[0].isBlueMoon, false);
  assert.equal(octoberMoons[1].isBlueMoon, true);
});

test('no month is ever marked Blue Moon unless it actually has two Full Moons', () => {
  for (const year of [2021, 2022, 2024, 2025, 2026]) {
    const list = buildFullMoonList(year, { MoonPhase });
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
