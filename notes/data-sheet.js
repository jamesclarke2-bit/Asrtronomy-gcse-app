/**
 * notes/data-sheet.html: renders the "Constants" and "Planets and dwarf
 * planets" tables straight from src/specData.js, so this page can never
 * drift out of sync with the numbers every other page quotes.
 */
(function () {
  const SUPERSCRIPT_DIGITS = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻' };

  function toSuperscript(value) {
    return String(value)
      .split('')
      .map((ch) => SUPERSCRIPT_DIGITS[ch] || ch)
      .join('');
  }

  // "1.5e+8" -> "1.5 × 10⁸", matching the data sheet's own notation.
  function formatScientific(value, sigFigs) {
    const [mantissa, exponent] = value.toExponential(sigFigs).split('e');
    return `${mantissa} × 10${toSuperscript(Number(exponent))}`;
  }

  function hoursMinutes(value) {
    return `${value.hours} h ${String(value.minutes).padStart(2, '0')} min`;
  }

  function renderConstants() {
    const C = SpecData.CONSTANTS;
    const rows = [
      ['Earth mass', `${formatScientific(C.earthMassKg, 1)} kg`],
      ['Mean diameter of Earth', `${C.meanDiameterKm.earth.toLocaleString()} km`],
      ['Mean diameter of the Moon', `${C.meanDiameterKm.moon.toLocaleString()} km`],
      ['Mean diameter of the Sun', `${formatScientific(C.meanDiameterKm.sun, 1)} km`],
      ['Astronomical unit (1 AU)', `${formatScientific(C.auKm, 1)} km`],
      ['Mean Earth-Moon distance', `${C.meanEarthMoonDistanceKm.toLocaleString()} km`],
      ['Light year', `${formatScientific(C.lightYearKm, 1)} km`],
      ['Parsec', `${formatScientific(C.parsecKm, 1)} km (${C.parsecLightYears} light years)`],
      ['Sidereal day', hoursMinutes(C.siderealDay)],
      ['Synodic (solar) day', hoursMinutes(C.synodicDay)],
      ['Photosphere temperature', `${C.photosphereTemperatureK.toLocaleString()} K`],
      ['Hubble constant', `${C.hubbleConstantKmPerSPerMpc} km/s/Mpc`],
      ['Speed of light', `${formatScientific(C.speedOfLightMPerS, 1)} m/s`],
    ];
    const tbody = document.getElementById('constants-body');
    tbody.innerHTML = '';
    rows.forEach(([name, value]) => {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = name;
      const td = document.createElement('td');
      td.textContent = value;
      tr.append(th, td);
      tbody.appendChild(tr);
    });
  }

  function renderPlanets() {
    const tbody = document.getElementById('planets-body');
    tbody.innerHTML = '';
    SpecData.PLANETARY_DATA.forEach((body) => {
      const tr = document.createElement('tr');
      const nameCell = document.createElement('th');
      nameCell.scope = 'row';
      nameCell.textContent = body.name;
      tr.appendChild(nameCell);
      [
        body.type === 'dwarf planet' ? 'Dwarf planet' : 'Planet',
        body.distanceAU,
        body.periodYears,
        body.meanTemperatureC,
        body.diameterThousandKm,
        body.massEarthMasses,
        body.rings ? 'Yes' : 'No',
        body.moons,
      ].forEach((value) => {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    coverageEl.textContent = 'A reference page: the equations and constants it reproduces are drawn on throughout every unit, not just one.';
  }

  const GLOSSARY = {
    parsec:
      'Parsec: the distance at which 1 AU subtends an angle of 1 arcsecond of parallax — about 3.26 light years, and the unit astronomers prefer for distances to other stars.',
  };

  renderConstants();
  renderPlanets();
  renderCoverage();
  Glossary.init(GLOSSARY);
})();
