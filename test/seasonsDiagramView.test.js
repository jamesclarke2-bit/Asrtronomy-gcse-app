/**
 * src/seasonsDiagramView.js's rendered output, on the pages that share
 * it: the four reference positions' own date and per-hemisphere season
 * labels (real SVG <text>, not just pixels — see src/seasonsDiagram.js's
 * header for why this diagram replaced the old src/orbitPanel.js), and
 * the day-length readout, which must always match src/solarPosition.js's
 * own engine directly, not a second calculation. A real browser check
 * (Playwright, same engine scripts/screenshots.js already uses), since
 * rendered SVG text and live readout values are exactly what a raw-HTML
 * parse can't see (the page's own <svg> starts empty; JS fills it).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const SolarPosition = require('../src/solarPosition');
const SeasonsDiagram = require('../src/seasonsDiagram');
const { launchChromium, trackSkips } = require('./browserLaunch');

const SUN_DECLINATION_URL = 'file://' + path.join(__dirname, '..', 'sims', 'sun-declination.html');
const SUN_PATH_URL = 'file://' + path.join(__dirname, '..', 'sims', 'sun-path.html');
const EARTH_STRUCTURE_URL = 'file://' + path.join(__dirname, '..', 'notes', 'earth-structure.html');
const SIDEREAL_SYNODIC_URL = 'file://' + path.join(__dirname, '..', 'sims', 'sidereal-vs-synodic.html');

const SKIP_MESSAGE = (err) =>
  `Playwright's Chromium browser isn't installed — run "npx playwright install chromium" to enable this test (${err.message})`;

const { skip } = trackSkips('test/seasonsDiagramView.test.js');

let browser;
let launchError;

test.before(async () => {
  try {
    browser = await launchChromium();
  } catch (err) {
    launchError = err;
  }
});

test.after(async () => {
  if (browser) await browser.close();
});

async function withPage(t, run, url = SUN_DECLINATION_URL) {
  if (launchError) {
    skip(t, SKIP_MESSAGE(launchError));
    return;
  }
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  try {
    await page.goto(url);
    await page.waitForTimeout(200);
    await run(page);
  } finally {
    await page.close();
  }
}

// Reads the rendered label text for one reference position's SVG
// group, by its data-position id (set on every per-position text node
// in src/seasonsDiagramView.js's drawReferenceEarth).
async function readPositionLabels(page, positionId) {
  return page.evaluate((id) => {
    const svg = document.getElementById('seasons-diagram-svg');
    const dateEl = svg.querySelector(`.seasons-date-label[data-position="${id}"]`);
    const northEl = svg.querySelector(`.seasons-hemisphere-label[data-position="${id}"][data-hemisphere="north"]`);
    const southEl = svg.querySelector(`.seasons-hemisphere-label[data-position="${id}"][data-hemisphere="south"]`);
    return {
      date: dateEl && dateEl.textContent,
      north: northEl && northEl.textContent,
      south: southEl && southEl.textContent,
    };
  }, positionId);
}

SeasonsDiagram.REFERENCE_POSITIONS.forEach((position) => {
  test(`the ${position.id} reference position shows the correct date label and hemisphere seasons`, async (t) => {
    await withPage(t, async (page) => {
      const labels = await readPositionLabels(page, position.id);
      assert.equal(labels.date, position.dateLabel);
      assert.equal(labels.north, `N: ${position.northernSeason.split(' ')[0]}`);
      assert.equal(labels.south, `S: ${position.southernSeason.split(' ')[0]}`);
    });
  });
});

test('the four positions cover all four compass points with no duplicates, and opposite hemispheres always disagree', async (t) => {
  await withPage(t, async (page) => {
    const allLabels = await page.evaluate(() => {
      const svg = document.getElementById('seasons-diagram-svg');
      return [...svg.querySelectorAll('.seasons-date-label')].map((el) => el.textContent);
    });
    assert.equal(allLabels.length, 4);
    assert.deepEqual(
      new Set(allLabels),
      new Set(['March equinox', 'June solstice', 'September equinox', 'December solstice'])
    );

    for (const position of SeasonsDiagram.REFERENCE_POSITIONS) {
      const labels = await readPositionLabels(page, position.id);
      assert.notEqual(labels.north, labels.south.replace('S:', 'N:'), `${position.id}: the two hemispheres should never show the same season`);
    }
  });
});

test('the "towards Polaris" direction is shown once, not repeated per Earth', async (t) => {
  await withPage(t, async (page) => {
    const count = await page.locator('.seasons-polaris-label').count();
    assert.equal(count, 1);
    assert.equal(await page.locator('.seasons-polaris-label').textContent(), 'towards Polaris');
  });
});

test('the one-line takeaway is present and correct', async (t) => {
  await withPage(t, async (page) => {
    assert.equal(await page.locator('.seasons-takeaway').textContent(), 'The tilt, not the distance, causes the seasons.');
  });
});

// --- Day length readout matches the engine, across the date slider -----

function parseHoursMinutes(text) {
  const m = text.match(/^(\d+)h (\d+)m$/);
  assert.ok(m, `expected "Xh Ym", got "${text}"`);
  return Number(m[1]) * 60 + Number(m[2]);
}

const DAY_INDICES = [0, 79, 171, 264, 354, 200];

DAY_INDICES.forEach((dayIndex) => {
  test(`day length readout at day ${dayIndex} matches SolarPosition.getSunriseSunset directly`, async (t) => {
    await withPage(t, async (page) => {
      await page.locator('#date-slider').evaluate((el, v) => {
        el.value = v;
        el.dispatchEvent(new Event('input'));
      }, dayIndex);
      await page.waitForTimeout(50);

      const lat = Number(await page.locator('#lat-slider').inputValue());
      const readoutText = await page.locator('#seasons-day-length-readout').textContent();
      const readMinutes = parseHoursMinutes(readoutText);

      const date = SeasonsDiagram.dateForDayIndex(dayIndex);
      const expectedMinutes = Math.round(SolarPosition.getSunriseSunset(date, lat, 0).dayLengthMinutes);

      assert.ok(Math.abs(readMinutes - expectedMinutes) <= 1, `readout ${readMinutes}m should match the engine's ${expectedMinutes}m (day ${dayIndex}, lat ${lat})`);
    });
  });
});

test('day length readout updates as the latitude slider moves too, and still matches the engine', async (t) => {
  await withPage(t, async (page) => {
    await page.locator('#date-slider').evaluate((el) => {
      el.value = 171; // June solstice
      el.dispatchEvent(new Event('input'));
    });
    await page.locator('#lat-slider').evaluate((el) => {
      el.value = 70; // polar day territory at the June solstice
      el.dispatchEvent(new Event('input'));
    });
    await page.waitForTimeout(50);

    const readoutText = await page.locator('#seasons-day-length-readout').textContent();
    const readMinutes = parseHoursMinutes(readoutText);

    const date = SeasonsDiagram.dateForDayIndex(171);
    const expectedMinutes = Math.round(SolarPosition.getSunriseSunset(date, 70, 0).dayLengthMinutes);

    assert.ok(Math.abs(readMinutes - expectedMinutes) <= 1);
    assert.ok(readMinutes > 23 * 60, 'latitude 70° at the June solstice should be near-permanent daylight');
  });
});

test('noon altitude readout matches 90 - |lat - declination|', async (t) => {
  await withPage(t, async (page) => {
    await page.locator('#date-slider').evaluate((el) => {
      el.value = 171;
      el.dispatchEvent(new Event('input'));
    });
    await page.waitForTimeout(50);

    const lat = Number(await page.locator('#lat-slider').inputValue());
    const readoutText = await page.locator('#seasons-noon-altitude-readout').textContent();
    const readAltitude = Number(readoutText.match(/^(-?\d+(?:\.\d+)?)°/)[1]);

    const date = SeasonsDiagram.dateForDayIndex(171);
    const declination = SolarPosition.getSunPosition(date, 0, 0).declination;
    const expected = SeasonsDiagram.noonAltitudeDeg(declination, lat);

    assert.ok(Math.abs(readAltitude - expected) < 0.2);
  });
});

// --- Every page sharing this diagram actually renders it, with the
// day-length/noon-altitude readout present only where a latitude makes
// sense ------------------------------------------------------------

[
  { label: 'notes/earth-structure.html', url: EARTH_STRUCTURE_URL, hasLatitude: true },
  { label: 'sims/sun-path.html', url: SUN_PATH_URL, hasLatitude: true },
  { label: 'sims/sidereal-vs-synodic.html', url: SIDEREAL_SYNODIC_URL, hasLatitude: false },
].forEach(({ label, url, hasLatitude }) => {
  test(`${label}: renders the shared seasons diagram, with the latitude-dependent readout ${hasLatitude ? 'present' : 'absent'}`, async (t) => {
    await withPage(
      t,
      async (page) => {
        assert.equal(await page.locator('.seasons-date-label').count(), 4);
        assert.equal(await page.locator('.seasons-takeaway').textContent(), 'The tilt, not the distance, causes the seasons.');
        assert.ok((await page.locator('#seasons-today-readout').textContent()).includes('hemisphere'));
        assert.equal(await page.locator('#seasons-day-length-readout').count(), hasLatitude ? 1 : 0);
        assert.equal(await page.locator('#seasons-noon-altitude-readout').count(), hasLatitude ? 1 : 0);
      },
      url
    );
  });
});

test('sims/sidereal-vs-synodic.html: the travelled-arc overlay is drawn in the same orbit geometry as the reference Earths', async (t) => {
  await withPage(
    t,
    async (page) => {
      const pathCount = await page.locator('#seasons-diagram-svg > path').count();
      assert.equal(pathCount, 1, 'expected exactly one travelled-arc path drawn directly into the shared svg');
    },
    SIDEREAL_SYNODIC_URL
  );
});
