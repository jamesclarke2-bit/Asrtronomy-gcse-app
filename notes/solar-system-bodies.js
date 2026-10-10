/**
 * notes/solar-system-bodies.html.
 *
 * Every table/chart figure except "Atmosphere" comes straight from
 * SpecData.PLANETARY_DATA (the exam data sheet). Atmospheric
 * composition isn't on the data sheet at all, so ATMOSPHERE_DRAFT and
 * BODY_SUMMARIES below are this page's own first-draft content —
 * separately sourced, not yet checked against a second source, and
 * clearly labelled as a draft everywhere they appear (see the page's
 * own intro note). The comet-orbit and Kuiper Belt/Oort Cloud diagrams
 * are schematic illustrations of a real idea, not real measured orbits.
 *
 * MOON_GROUPS' diameters are first-draft too, except the Moon's own
 * (SpecData.CONSTANTS.meanDiameterKm.moon, the data sheet's own
 * figure) — see MOON_GROUPS' own comment. The tidal-heating diagram is
 * src/tidalHeatingDiagram.js, a reusable module (not page-specific
 * code), and the Io/Europa/Ganymede resonance strip reuses
 * src/galileanMoons.js's real orbital periods, already used by
 * notes/geocentric-to-heliocentric.html.
 */
(function () {
  const CURRICULUM_UNITS = ['u3.16', 'u3.17', 'u3.18', 'u3.19', 'u3.20', 'u3.21', 'u3.22', 'u3.23', 'u3.24', 'u3.25', 'u3.30'];

  const SUPERSCRIPT_DIGITS = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻', '+': '' };

  function toSuperscript(value) {
    return String(value)
      .split('')
      .map((ch) => SUPERSCRIPT_DIGITS[ch] ?? ch)
      .join('');
  }

  // "1.5e-4" -> "1.5 × 10⁻⁴", matching the data sheet's own notation.
  function formatScientific(value, sigFigs) {
    const [mantissa, exponent] = value.toExponential(sigFigs).split('e');
    return `${mantissa} × 10${toSuperscript(Number(exponent))}`;
  }

  const EARTH = SpecData.PLANETARY_DATA.find((body) => body.name === 'Earth');

  // --- First-draft content: not on the exam data sheet (see header) ---

  const ATMOSPHERE_DRAFT = {
    Mercury: 'None (trace exosphere)',
    Venus: '~96% CO₂, ~3% N₂ (thick, crushing)',
    Earth: '~78% N₂, ~21% O₂',
    Mars: '~95% CO₂, ~3% N₂ (thin)',
    Ceres: 'None',
    Jupiter: '~90% H₂, ~10% He',
    Saturn: '~96% H₂, ~3% He',
    Uranus: '~83% H₂, ~15% He, ~2% CH₄',
    Neptune: '~80% H₂, ~19% He, ~1% CH₄',
    Pluto: 'Thin, seasonal N₂ (freezes out at aphelion)',
    Haumea: 'None known',
    Eris: 'None known (seasonal frost suspected)',
  };

  const BODY_SUMMARIES = {
    mercury: 'The smallest planet and closest to the Sun, with almost no atmosphere and the most extreme day-night temperature swings of any planet.',
    venus: "Similar in size to Earth, but a crushing, scorching CO₂ atmosphere makes it the hottest planet — hotter even than Mercury.",
    earth: 'The only known planet with liquid water on its surface, and the only one known to host life.',
    mars: "The 'Red Planet', coloured by iron oxide dust, home to the largest volcano (Olympus Mons) and canyon (Valles Marineris) in the Solar System.",
    ceres: 'The largest object in the asteroid belt, and the only dwarf planet in the inner Solar System.',
    jupiter: 'The largest planet by far — a gas giant with a centuries-old storm, the Great Red Spot, and dozens of known moons.',
    saturn: 'Famous for its spectacular ring system, made of countless particles of ice and rock.',
    uranus: 'An ice giant tipped almost onto its side, rotating at roughly 98° to its orbital plane.',
    neptune: 'The windiest planet known, with the fastest recorded winds in the Solar System.',
    pluto: "Reclassified from planet to dwarf planet in 2006; its largest moon, Charon, is over half Pluto's own size.",
    haumea: 'An unusually elongated, fast-spinning dwarf planet, stretched into a rugby-ball shape by its own rapid rotation.',
    eris: "Similar in size to Pluto — its discovery directly triggered the 2006 redefinition of 'planet' that demoted Pluto.",
  };

  // The larger moons named on the exam data sheet's own "Moons" column
  // (src/specData.js), grouped by planet. Every diameter is first draft
  // except the Moon's own (SpecData.CONSTANTS.meanDiameterKm.moon, the
  // data sheet's own figure) — the rest are separately sourced (real,
  // well-known values, not yet checked against a second source) and
  // labelled as such wherever they appear, same convention as
  // ATMOSPHERE_DRAFT above.
  const MOON_GROUPS = [
    {
      planet: 'Earth',
      moons: [{ name: 'the Moon', slug: 'moon-the-moon', diameterKm: SpecData.CONSTANTS.meanDiameterKm.moon, onDataSheet: true, note: 'Earth’s only natural satellite, large enough relative to Earth that the two are sometimes called a double planet.' }],
    },
    {
      planet: 'Mars',
      moons: [
        { name: 'Phobos', slug: 'moon-phobos', diameterKm: 22.2, note: 'The larger and closer of Mars’s two small moons, likely a captured asteroid — it orbits so close and fast that it rises in the west and sets in the east.' },
        { name: 'Deimos', slug: 'moon-deimos', diameterKm: 12.4, note: 'Mars’s smaller, more distant moon, also a likely captured asteroid.' },
      ],
    },
    {
      planet: 'Jupiter',
      moons: [
        { name: 'Io', slug: 'moon-io', diameterKm: 3643, note: 'The most volcanically active body in the Solar System — see Tidal heating below.' },
        { name: 'Europa', slug: 'moon-europa', diameterKm: 3122, note: 'An icy shell over a liquid-water ocean, kept liquid by the same tidal heating as Io — a leading place to look for life.' },
        { name: 'Ganymede', slug: 'moon-ganymede', diameterKm: 5268, note: 'The largest moon in the Solar System — bigger than the planet Mercury, though less massive.' },
        { name: 'Callisto', slug: 'moon-callisto', diameterKm: 4821, note: 'The most heavily cratered body known, essentially unchanged since the early Solar System.' },
      ],
    },
    {
      planet: 'Saturn',
      moons: [
        { name: 'Titan', slug: 'moon-titan', diameterKm: 5150, note: 'The only moon with a substantial atmosphere, and the only body besides Earth known to have stable liquid (methane and ethane lakes) on its surface.' },
        { name: 'Iapetus', slug: 'moon-iapetus', diameterKm: 1469, note: 'Strikingly two-toned — one hemisphere far darker than the other.' },
      ],
    },
    {
      planet: 'Uranus',
      moons: [
        { name: 'Titania', slug: 'moon-titania', diameterKm: 1578, note: 'Uranus’s largest moon, with canyons several kilometres deep.' },
        { name: 'Oberon', slug: 'moon-oberon', diameterKm: 1523, note: 'Uranus’s outermost large moon, heavily cratered.' },
      ],
    },
    {
      planet: 'Neptune',
      moons: [{ name: 'Triton', slug: 'moon-triton', diameterKm: 2707, note: 'Orbits Neptune backwards (retrograde) relative to Neptune’s own spin, strong evidence it’s a captured world rather than one that formed there.' }],
    },
    {
      planet: 'Pluto',
      moons: [{ name: 'Charon', slug: 'moon-charon', diameterKm: 1212, note: 'Over half Pluto’s own diameter — the largest moon relative to its planet in the Solar System, which is why some call Pluto-Charon a double dwarf planet.' }],
    },
  ];

  const BODIES = SpecData.PLANETARY_DATA.map((body) => ({
    name: body.name,
    slug: body.name.toLowerCase(),
    type: body.type === 'dwarf planet' ? 'Dwarf planet' : 'Planet',
    relativeSize: body.diameterThousandKm / EARTH.diameterThousandKm,
    relativeMass: body.massEarthMasses,
    meanTemperatureC: body.meanTemperatureC,
    moons: body.moons,
    rings: body.rings,
    atmosphere: ATMOSPHERE_DRAFT[body.name] || '—',
  }));

  // --- Sortable table -----------------------------------------------

  const COLUMNS = [
    { key: 'name', label: 'Body', numeric: false },
    { key: 'type', label: 'Type', numeric: false },
    { key: 'relativeSize', label: 'Relative size (× Earth)', numeric: true },
    { key: 'relativeMass', label: 'Relative mass (× Earth)', numeric: true },
    { key: 'meanTemperatureC', label: 'Mean temp (°C)', numeric: true },
    { key: 'moons', label: 'Moons', numeric: false },
    { key: 'rings', label: 'Rings', numeric: false },
    { key: 'atmosphere', label: 'Atmosphere (draft)', numeric: false },
  ];

  const sortState = { key: null, direction: 1 };

  function sortedBodies() {
    if (!sortState.key) return BODIES;
    const column = COLUMNS.find((c) => c.key === sortState.key);
    const list = [...BODIES];
    list.sort((a, b) => {
      let va = a[sortState.key];
      let vb = b[sortState.key];
      if (sortState.key === 'rings') {
        va = va ? 1 : 0;
        vb = vb ? 1 : 0;
      }
      if (!column.numeric && sortState.key !== 'rings') {
        va = String(va).toLowerCase();
        vb = String(vb).toLowerCase();
      }
      if (va < vb) return -1 * sortState.direction;
      if (va > vb) return 1 * sortState.direction;
      return 0;
    });
    return list;
  }

  function renderTableHead() {
    const tr = document.getElementById('planet-table-head');
    tr.innerHTML = '';
    COLUMNS.forEach((column) => {
      const th = document.createElement('th');
      th.scope = 'col';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sort-header-button';
      const arrow = sortState.key === column.key ? (sortState.direction === 1 ? ' ▲' : ' ▼') : '';
      button.textContent = column.label + arrow;
      button.setAttribute('aria-label', `Sort by ${column.label}`);
      button.addEventListener('click', () => {
        if (sortState.key === column.key) {
          sortState.direction *= -1;
        } else {
          sortState.key = column.key;
          sortState.direction = 1;
        }
        renderTableHead();
        renderTableBody();
      });
      th.appendChild(button);
      tr.appendChild(th);
    });
  }

  function renderTableBody() {
    const tbody = document.getElementById('planet-table-body');
    tbody.innerHTML = '';
    sortedBodies().forEach((body) => {
      const tr = document.createElement('tr');

      const nameCell = document.createElement('th');
      nameCell.scope = 'row';
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'glossary-toggle glossary-term-button';
      toggle.dataset.term = body.slug;
      toggle.setAttribute('aria-label', `What is ${body.name}?`);
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = body.name;
      // Wired up directly, not via Glossary.init: these buttons are
      // recreated every time the table is re-sorted, and re-running
      // Glossary.init on every sort would pile up a fresh click
      // listener on every *other* toggle on the page each time too.
      const definition = document.querySelector(`.glossary-definition[data-term="${body.slug}"]`);
      toggle.addEventListener('click', () => {
        const isOpen = !definition.hidden;
        definition.hidden = isOpen;
        toggle.setAttribute('aria-expanded', String(!isOpen));
      });
      nameCell.appendChild(toggle);
      tr.appendChild(nameCell);

      [
        body.type,
        body.relativeSize.toFixed(2),
        body.relativeMass < 0.01 ? formatScientific(body.relativeMass, 1) : body.relativeMass,
        body.meanTemperatureC,
        body.moons,
        body.rings ? 'Yes' : 'No',
        body.atmosphere,
      ].forEach((value) => {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  }

  // Definitions go together after the table, once, the same convention
  // as a generated set of diagram regions (see notes/TEMPLATE.md) — one
  // toggle per table row isn't a single static block to follow. Created
  // once (not on every re-sort): renderTableBody's toggle buttons find
  // these by data-term and wire their own click handling directly.
  function createBodySummaryDefinitions() {
    const defsHost = document.getElementById('planet-table-definitions');
    BODIES.forEach((body) => {
      const span = document.createElement('span');
      span.className = 'glossary-definition';
      span.dataset.term = body.slug;
      span.hidden = true;
      span.textContent = `${body.name}: ${BODY_SUMMARIES[body.slug]}`;
      defsHost.appendChild(span);
    });
  }

  // --- Bar chart: relative size, largest first -----------------------

  function drawSizeBarChart() {
    const canvas = document.getElementById('size-bar-chart');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const sorted = [...BODIES].sort((a, b) => b.relativeSize - a.relativeSize);
    const margin = { left: 90, right: 60, top: 10, bottom: 10 };
    const rowHeight = (canvas.height - margin.top - margin.bottom) / sorted.length;
    const maxSize = Math.max(...sorted.map((b) => b.relativeSize));
    const plotWidth = canvas.width - margin.left - margin.right;

    ctx.font = '12px sans-serif';
    sorted.forEach((body, i) => {
      const y = margin.top + i * rowHeight;
      const barWidth = Math.max((body.relativeSize / maxSize) * plotWidth, 2);

      ctx.fillStyle = '#8a97a5';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(body.name, margin.left - 8, y + rowHeight / 2);

      ctx.fillStyle = body.type === 'Planet' ? '#2a6bd6' : '#c0392b';
      ctx.fillRect(margin.left, y + rowHeight * 0.18, barWidth, rowHeight * 0.64);

      ctx.fillStyle = '#1b3a63';
      ctx.textAlign = 'left';
      ctx.fillText(`${body.relativeSize.toFixed(2)}×`, margin.left + barWidth + 6, y + rowHeight / 2);
    });
  }

  // --- Size line-up: every body drawn to true (linear) scale ----------
  // Unlike the bar chart above (bar length = value, for easy reading),
  // this draws each body's actual relative diameter as a circle's own
  // diameter — so Jupiter genuinely dwarfs Ceres on screen the way it
  // does in reality, at the cost of the smallest bodies barely showing
  // up at all. A small minimum radius keeps every body at least visible
  // as a dot; the caption says so.
  const SIZE_SCALE_MIN_RADIUS_PX = 2;

  function drawSizeScaleDiagram() {
    const canvas = document.getElementById('size-scale-diagram');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const sorted = [...BODIES].sort((a, b) => b.relativeSize - a.relativeSize);
    const maxRadius = canvas.height / 2 - 30; // the largest body (Jupiter) at this screen radius
    const pxPerEarthRadius = maxRadius / (sorted[0].relativeSize / 2);

    const baselineY = canvas.height - 24;
    let x = 20;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    sorted.forEach((body) => {
      const r = Math.max((body.relativeSize / 2) * pxPerEarthRadius, SIZE_SCALE_MIN_RADIUS_PX);
      const cx = x + r;
      ctx.beginPath();
      ctx.arc(cx, baselineY - r, r, 0, Math.PI * 2);
      ctx.fillStyle = body.type === 'Planet' ? '#2a6bd6' : '#c0392b';
      ctx.fill();
      ctx.fillStyle = '#555';
      ctx.fillText(body.name, cx, baselineY + 12);
      x = cx + r + 14;
    });

    ctx.strokeStyle = '#cdd7e1';
    ctx.beginPath();
    ctx.moveTo(10, baselineY);
    ctx.lineTo(Math.max(x, canvas.width - 10), baselineY);
    ctx.stroke();
  }

  // --- Moons: the larger named moons, grouped by planet, to scale -----

  function drawMoonsDiagram() {
    const canvas = document.getElementById('moons-diagram');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allMoons = MOON_GROUPS.flatMap((g) => g.moons);
    const maxDiameter = Math.max(...allMoons.map((m) => m.diameterKm));
    const maxRadiusPx = 32; // the largest moon (Ganymede) at this screen radius — stays
    // comfortably inside its own row (rowHeight below), including its label underneath,
    // rather than bleeding into the row above or below it.
    const pxPerKm = maxRadiusPx / (maxDiameter / 2);
    const rowHeight = canvas.height / MOON_GROUPS.length;
    const labelWidth = 70;
    // A tiny moon (Phobos, Deimos: a couple of px radius) still needs
    // roughly this much horizontal room for its own name underneath, or
    // two tiny moons side by side get spacing far narrower than their
    // labels — so spacing never shrinks below this regardless of r.
    const MIN_SPACING_RADIUS_PX = 20;

    ctx.font = '12px sans-serif';
    MOON_GROUPS.forEach((group, i) => {
      const rowCy = rowHeight * i + rowHeight / 2;

      ctx.fillStyle = '#1b3a63';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(group.planet, 10, rowCy);

      let x = labelWidth;
      group.moons.forEach((moon) => {
        const r = Math.max((moon.diameterKm / 2) * pxPerKm, 2);
        const spacingR = Math.max(r, MIN_SPACING_RADIUS_PX);
        const cx = x + spacingR;
        ctx.beginPath();
        ctx.arc(cx, rowCy, r, 0, Math.PI * 2);
        ctx.fillStyle = moon.onDataSheet ? '#2a6bd6' : '#8a97a5';
        ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#555';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(moon.name, cx, rowCy + r + 11);
        ctx.font = '12px sans-serif';

        x = cx + spacingR + 16;
      });
    });
  }

  // --- Tidal heating: Io's flexing orbit (reusable module) ------------
  // Drawing itself lives in src/tidalHeatingDiagram.js, reusable by any
  // future page — this just owns the slider/animation state and wires
  // it to that module's draw() and heatingFraction().

  const tidalCanvas = document.getElementById('tidal-heating-diagram');
  const tidalEccentricitySlider = document.getElementById('tidal-eccentricity-slider');
  const tidalEccentricityLabel = document.getElementById('tidal-eccentricity-label');
  const tidalHeatingReadout = document.getElementById('tidal-heating-readout');
  const tidalPlayButton = document.getElementById('tidal-play-button');

  const tidalState = { eccentricity: 0.25, trueAnomalyRad: 0 };

  function renderHeatingBar(fraction) {
    const filled = Math.round(fraction * 5);
    return '●'.repeat(filled) + '○'.repeat(5 - filled);
  }

  function updateTidal() {
    if (!tidalCanvas) return;
    TidalHeatingDiagram.draw(tidalCanvas, tidalState);
    const heat = TidalHeatingDiagram.heatingFraction(tidalState.trueAnomalyRad, tidalState.eccentricity);
    if (tidalHeatingReadout) tidalHeatingReadout.textContent = `Tidal heating: ${renderHeatingBar(heat)}`;
  }

  if (tidalEccentricitySlider) {
    tidalEccentricitySlider.addEventListener('input', () => {
      tidalState.eccentricity = Number(tidalEccentricitySlider.value);
      tidalEccentricityLabel.textContent = tidalState.eccentricity.toFixed(2);
      updateTidal();
    });
  }

  let tidalAnimationId = null;

  function stopTidalAnimation() {
    if (tidalAnimationId !== null) {
      cancelAnimationFrame(tidalAnimationId);
      tidalAnimationId = null;
    }
    if (tidalPlayButton) {
      tidalPlayButton.textContent = '▶ Animate';
      tidalPlayButton.setAttribute('aria-pressed', 'false');
    }
  }

  function startTidalAnimation() {
    if (!tidalPlayButton) return;
    tidalPlayButton.textContent = '❚❚ Pause';
    tidalPlayButton.setAttribute('aria-pressed', 'true');
    const ORBIT_SECONDS = 8;
    let lastTime = null;
    function step(now) {
      if (lastTime === null) lastTime = now;
      const elapsedSeconds = (now - lastTime) / 1000;
      lastTime = now;
      tidalState.trueAnomalyRad = (tidalState.trueAnomalyRad + (elapsedSeconds / ORBIT_SECONDS) * 2 * Math.PI) % (2 * Math.PI);
      updateTidal();
      tidalAnimationId = requestAnimationFrame(step);
    }
    tidalAnimationId = requestAnimationFrame(step);
  }

  if (tidalPlayButton) {
    tidalPlayButton.addEventListener('click', () => {
      if (tidalAnimationId !== null) stopTidalAnimation();
      else startTidalAnimation();
    });
  }

  // --- Resonance strip: Io, Europa and Ganymede's real periods --------
  // Reuses src/galileanMoons.js's real orbital periods (already used by
  // notes/geocentric-to-heliocentric.html), not a second copy of them.

  function drawResonanceStrip() {
    const canvas = document.getElementById('moon-resonance-strip');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const names = ['Io', 'Europa', 'Ganymede'];
    const moons = names.map((name) => GalileanMoons.MOONS.find((m) => m.name === name));
    const ioPeriod = moons[0].periodDays;
    const maxBarWidth = canvas.width - 220; // leaves room for the "N.N days (N×)" label past the longest bar
    const rowHeight = canvas.height / moons.length;

    ctx.font = '12px sans-serif';
    moons.forEach((moon, i) => {
      const y = rowHeight * i + rowHeight / 2;
      const ratio = moon.periodDays / ioPeriod;
      const barWidth = (moon.periodDays / moons[moons.length - 1].periodDays) * maxBarWidth;

      ctx.fillStyle = '#1b3a63';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(moon.name, 70, y);

      ctx.fillStyle = '#c0392b';
      ctx.fillRect(80, y - rowHeight * 0.22, barWidth, rowHeight * 0.44);

      ctx.fillStyle = '#555';
      ctx.textAlign = 'left';
      ctx.fillText(`${moon.periodDays.toFixed(1)} days (${ratio.toFixed(0)}×)`, 80 + barWidth + 8, y);
    });
  }

  // --- Temperature against distance ------------------------------------

  function drawTemperatureChart() {
    const canvas = document.getElementById('temperature-distance-chart');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const margin = { left: 55, right: 20, top: 15, bottom: 35 };
    const plotWidth = canvas.width - margin.left - margin.right;
    const plotHeight = canvas.height - margin.top - margin.bottom;

    const distances = SpecData.PLANETARY_DATA.map((b) => b.distanceAU);
    const temps = SpecData.PLANETARY_DATA.map((b) => b.meanTemperatureC);
    const logMin = Math.log10(Math.min(...distances));
    const logMax = Math.log10(Math.max(...distances));
    const tempMin = Math.min(...temps);
    const tempMax = Math.max(...temps);

    const xFor = (au) => margin.left + ((Math.log10(au) - logMin) / (logMax - logMin)) * plotWidth;
    const yFor = (c) => margin.top + plotHeight - ((c - tempMin) / (tempMax - tempMin)) * plotHeight;

    // Axes.
    ctx.strokeStyle = '#cdd7e1';
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotHeight);
    ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight);
    ctx.stroke();

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#8a97a5';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    [tempMin, 0, tempMax].forEach((t) => {
      const y = yFor(t);
      ctx.fillText(`${Math.round(t)}°C`, margin.left - 6, y);
      ctx.strokeStyle = '#eee';
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + plotWidth, y);
      ctx.stroke();
    });

    // The outer dwarf planets (Pluto, Haumea, Eris) sit close enough
    // together on the log-distance axis that their labels would
    // otherwise collide — alternate above/below whenever a point lands
    // within LABEL_COLLISION_PX of the previous one (PLANETARY_DATA is
    // already in increasing-distance, so increasing-x, order).
    const LABEL_COLLISION_PX = 30;
    let lastX = -Infinity;
    let labelBelow = false;
    SpecData.PLANETARY_DATA.forEach((body) => {
      const x = xFor(body.distanceAU);
      const y = yFor(body.meanTemperatureC);
      ctx.beginPath();
      ctx.arc(x, y, body.name === 'Venus' ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = body.name === 'Venus' ? '#c0392b' : body.type === 'planet' ? '#2a6bd6' : '#8a97a5';
      ctx.fill();

      labelBelow = x - lastX < LABEL_COLLISION_PX ? !labelBelow : false;
      lastX = x;

      ctx.fillStyle = '#555';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(body.name, x, labelBelow ? y + 15 : y - 10);
    });

    ctx.fillStyle = '#8a97a5';
    ctx.font = 'italic 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Distance from the Sun (AU, logarithmic) →', margin.left, canvas.height - 6);
  }

  // --- Comet diagram: a schematic orbit, tails always away from the Sun ---

  function drawCometDiagram() {
    const canvas = document.getElementById('comet-diagram');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2 + 40;
    const cy = canvas.height / 2;
    const a = 280; // semi-major axis, px
    const b = 95; // semi-minor axis, px
    const focusOffset = Math.sqrt(a * a - b * b);
    const sunX = cx - focusOffset;
    const sunY = cy;

    // Orbit path (dashed).
    ctx.strokeStyle = '#b7c3d1';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, a, b, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // The Sun.
    ctx.beginPath();
    ctx.arc(sunX, sunY, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#e8a33d';
    ctx.fill();
    ctx.fillStyle = '#1b3a63';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sun', sunX, sunY + 32);

    // Four comet positions around the orbit.
    const angles = [35, 110, 200, 300];
    angles.forEach((deg) => {
      const rad = (deg * Math.PI) / 180;
      const x = cx + a * Math.cos(rad);
      const y = cy + b * Math.sin(rad);

      // Outward direction, from the Sun through the comet.
      const dx = x - sunX;
      const dy = y - sunY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / dist;
      const uy = dy / dist;

      // Velocity direction (tangent to the ellipse), used only to curve
      // the dust tail slightly — the ion tail stays perfectly straight.
      const vx = -a * Math.sin(rad);
      const vy = b * Math.cos(rad);
      const vLen = Math.sqrt(vx * vx + vy * vy);

      const tailLength = 70;

      // Ion tail: straight, directly away from the Sun.
      ctx.strokeStyle = '#6fa8dc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + ux * tailLength, y + uy * tailLength);
      ctx.stroke();

      // Dust tail: curves gently back towards the trailing side of the
      // orbit, but still points generally away from the Sun.
      const dustEndX = x + ux * tailLength * 0.85 - (vx / vLen) * 18;
      const dustEndY = y + uy * tailLength * 0.85 - (vy / vLen) * 18;
      const controlX = x + ux * tailLength * 0.4 - (vx / vLen) * 24;
      const controlY = y + uy * tailLength * 0.4 - (vy / vLen) * 24;
      ctx.strokeStyle = '#d8cfc0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(controlX, controlY, dustEndX, dustEndY);
      ctx.stroke();

      // Coma + nucleus.
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 10);
      glow.addColorStop(0, '#ffffff');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8e8e8';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#6fa8dc';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('— ion tail (straight)', 10, canvas.height - 28);
    ctx.fillStyle = '#b0a593';
    ctx.fillText('— dust tail (curved)', 10, canvas.height - 12);
  }

  // --- Kuiper Belt / Oort Cloud / heliosphere, logarithmic scale ------
  // Figures below aren't on the exam data sheet — see the page's own
  // note under this diagram.

  const AU_KM = SpecData.CONSTANTS.auKm;
  const LY_KM = SpecData.CONSTANTS.lightYearKm;
  const NEAREST_STAR_AU = (4.25 * LY_KM) / AU_KM; // Proxima Centauri, ~4.25 ly

  const KUIPER_OORT_MARKERS = [
    { label: 'Neptune', au: 30 },
    { label: 'Kuiper Belt', au: 44 },
    { label: 'Heliopause', au: 120 },
    { label: 'Inner Oort Cloud', au: 2000 },
    { label: 'Outer Oort Cloud', au: 100000 },
    { label: 'Nearest star', au: NEAREST_STAR_AU },
  ];

  function drawKuiperOortDiagram() {
    const canvas = document.getElementById('kuiper-oort-diagram');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const margin = 70;
    const logMin = Math.log10(KUIPER_OORT_MARKERS[0].au);
    const logMax = Math.log10(KUIPER_OORT_MARKERS[KUIPER_OORT_MARKERS.length - 1].au);
    const xFor = (au) => margin + ((Math.log10(au) - logMin) / (logMax - logMin)) * (canvas.width - 2 * margin);

    const lineY = canvas.height / 2;
    ctx.strokeStyle = '#b7c3d1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xFor(KUIPER_OORT_MARKERS[0].au), lineY);
    ctx.lineTo(xFor(KUIPER_OORT_MARKERS[KUIPER_OORT_MARKERS.length - 1].au), lineY);
    ctx.stroke();

    ctx.font = '11px sans-serif';
    KUIPER_OORT_MARKERS.forEach((marker, i) => {
      const x = xFor(marker.au);
      ctx.strokeStyle = '#2a6bd6';
      ctx.beginPath();
      ctx.moveTo(x, lineY - 8);
      ctx.lineTo(x, lineY + 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, lineY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#2a6bd6';
      ctx.fill();

      ctx.fillStyle = '#1b3a63';
      ctx.textAlign = 'center';
      const tier = i % 2 === 0 ? lineY - 20 : lineY + 32;
      ctx.fillText(marker.label, x, tier);
      ctx.fillStyle = '#8a97a5';
      ctx.fillText(`${Math.round(marker.au).toLocaleString()} AU`, x, tier + (i % 2 === 0 ? -14 : 14));
    });

    ctx.fillStyle = '#8a97a5';
    ctx.font = 'italic 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Not to scale — logarithmic distance axis', 8, canvas.height - 8);
  }

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  // One toggle definition per moon, built from MOON_GROUPS rather than
  // hand-duplicated here — first-draft flagged per moon (see
  // MOON_GROUPS' own comment), except the Moon's own entry.
  const MOON_GLOSSARY = Object.fromEntries(
    MOON_GROUPS.flatMap((group) =>
      group.moons.map((moon) => [
        moon.slug,
        `${moon.name} (${group.planet}): ${moon.note}${moon.onDataSheet ? '' : ' First draft — this diameter is separately sourced, not from the data sheet.'}`,
      ])
    )
  );

  // Only the static prose toggles (nucleus, coma, ...) go through
  // Glossary.init — the table's per-body toggles are wired directly in
  // renderTableBody, see the comment there.
  const GLOSSARY = {
    nucleus: 'Nucleus: a comet’s solid core of ice, dust and rock, often called a ‘dirty snowball’ — typically only a few km across.',
    coma: 'Coma: the glowing cloud of gas and dust released as a comet’s nucleus is heated near the Sun, surrounding it like a fuzzy atmosphere.',
    'comet-tail': 'Tail: gas and dust pushed away from a comet’s coma by the solar wind and radiation pressure — always pointing away from the Sun, whichever way the comet itself is moving.',
    'kuiper-belt': 'Kuiper Belt: a disc of icy bodies beyond Neptune, roughly 30-50 AU out, in the same flattened plane as the planets — the thought source of short-period comets.',
    'oort-cloud': 'Oort Cloud: a far more distant, roughly spherical shell of icy bodies, thought to extend from a few thousand AU out to perhaps 100,000 AU — the thought source of long-period comets.',
    'ecliptic-plane': 'Ecliptic plane: the plane of Earth’s own orbit around the Sun — most Solar System material formed in, and still roughly orbits within, this same flattened plane.',
    parallax: 'Parallax: the apparent shift of a nearer object against a more distant background when viewed from two different places — the principle behind measuring the AU from a transit of Venus.',
    'tidal-resonance': 'Orbital resonance: Io, Europa and Ganymede’s orbital periods sit close to a 1:2:4 ratio (about 1.77, 3.55 and 7.15 days), so the three moons keep returning to the same relative arrangement and reinforcing each other’s gravitational tug, rather than it averaging out over time. That’s what keeps Io’s own orbit measurably non-circular despite Jupiter’s tides constantly trying to circularise it — without the resonance, the flexing (and Io’s volcanoes) would eventually stop.',
    'tidal-life-search': 'Europa (an icy shell over a liquid ocean) and Saturn’s moon Enceladus are heated by the same tidal flexing as Io, keeping their interior oceans liquid despite being far from the Sun’s warmth — which is exactly why both are considered promising places to search for life.',
    ...MOON_GLOSSARY,
  };

  createBodySummaryDefinitions();
  renderTableHead();
  renderTableBody();
  drawSizeBarChart();
  drawSizeScaleDiagram();
  drawMoonsDiagram();
  updateTidal();
  drawResonanceStrip();
  drawTemperatureChart();
  drawCometDiagram();
  drawKuiperOortDiagram();
  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(SolarSystemBodiesQuestions.makeQuestions(SpecData));
})();
