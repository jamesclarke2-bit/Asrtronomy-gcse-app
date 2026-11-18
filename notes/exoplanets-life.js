(function () {
  const X = window.Exoplanets;
  const XD = window.ExoplanetsDrawing;

  const CURRICULUM_UNITS = ['u3.33'];
  const $ = (id) => document.getElementById(id);

  function setPressed(selector, isOn) {
    document.querySelectorAll(selector).forEach((b) => {
      const on = isOn(b);
      b.classList.toggle('preset-button-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  // ------------------------------------------------------------------
  // 12.4 Transit
  // ------------------------------------------------------------------
  let planet = 'jupiter';
  function drawTransit() {
    const t = Number($('transit-time').value);
    XD.drawTransit($('transit-diagram'), $('transit-wrap'), t, planet);
    const p = X.PLANETS.find((x) => x.key === planet);
    const svg = $('transit-diagram');
    svg.dataset.planet = planet;
    const hours = (t * XD.TRANSIT_HOURS).toFixed(1);
    $('transit-time-label').textContent = `${hours} hours`;
    const b = 100 * X.transitBrightness(t, p.radius);
    const depth = X.transitDepthPercent(p.radius);
    $('transit-readout').textContent =
      `${p.name} planet. Brightness now: ${b < 100 ? b.toPrecision(6) : '100'}% of normal. ` +
      `The deepest dip is ${+depth.toPrecision(2)}% of the star's light${depth < 0.2 ? ', too small to see on this scale' : ''}.`;
    setPressed('.ex-planet-buttons button', (btn) => btn.dataset.planet === planet);
  }
  $('transit-time').addEventListener('input', drawTransit);
  document.querySelectorAll('.ex-planet-buttons button').forEach((b) =>
    b.addEventListener('click', () => {
      planet = b.dataset.planet;
      drawTransit();
    }),
  );
  drawTransit();

  // ------------------------------------------------------------------
  // 12.4 Astrometry and radial velocity
  // ------------------------------------------------------------------
  function drawAstrometry() {
    const t = Number($('astrometry-time').value);
    XD.drawAstrometry($('astrometry-diagram'), $('astrometry-wrap'), t);
    $('astrometry-diagram').dataset.time = String(t);
    $('astrometry-time-label').textContent = `${Math.round(t * 100)}%`;
  }
  $('astrometry-time').addEventListener('input', drawAstrometry);
  drawAstrometry();

  function drawRadialVelocity() {
    const t = Number($('rv-time').value);
    XD.drawRadialVelocity($('rv-diagram'), $('rv-wrap'), t);
    const m = X.starMotion(t, 'jupiter');
    const word = X.lineShiftWord(Math.abs(m.awayMs) < 0.05 ? 0 : m.awayMs);
    $('rv-diagram').dataset.shift = word;
    $('rv-time-label').textContent = `${Math.round(t * 100)}%`;
    const speed = Math.abs(m.awayMs).toFixed(1);
    $('rv-readout').textContent =
      word === 'red'
        ? `The star is moving away from us at ${speed} m/s: its lines shift towards red (longer wavelengths).`
        : word === 'blue'
          ? `The star is moving towards us at ${speed} m/s: its lines shift towards blue (shorter wavelengths).`
          : 'The star is moving across our line of sight: no shift at this moment.';
  }
  $('rv-time').addEventListener('input', drawRadialVelocity);
  drawRadialVelocity();

  const body = $('methods-table-body');
  X.METHODS.forEach((m) => {
    const tr = document.createElement('tr');
    [m.name, m.measures, m.bestAt].forEach((text) => {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    });
    body.appendChild(tr);
  });

  // ------------------------------------------------------------------
  // 12.6 Habitable zone
  // ------------------------------------------------------------------
  function drawZone() {
    const T = Number($('star-temperature').value);
    XD.drawZone($('zone-diagram'), $('zone-wrap'), T);
    const z = X.habitableZone(T);
    $('zone-diagram').dataset.temperature = String(T);
    $('star-temperature-label').textContent = T.toLocaleString('en-GB');
    const fmt = (au) => (au < 0.1 ? au.toFixed(3) : au < 10 ? au.toFixed(2) : au.toFixed(1));
    const inZone = X.PLANET_DISTANCES_AU.filter((d) => X.zoneVerdict(d, T) === 'in the zone');
    $('zone-readout').textContent =
      `A ${T.toLocaleString('en-GB')} K star: the zone runs from about ${fmt(z.innerAU)} to ${fmt(z.outerAU)} AU. ` +
      (inZone.length ? `Planet in the zone (circle): the one at ${inZone.join(', ')} AU.` : 'None of the drawn planets is in the zone.');
  }
  $('star-temperature').addEventListener('input', drawZone);
  drawZone();

  // ------------------------------------------------------------------
  // 12.7 Drake equation
  // ------------------------------------------------------------------
  const controls = $('drake-controls');
  X.DRAKE_FACTORS.forEach((f) => {
    const div = document.createElement('div');
    div.className = 'control';
    const label = document.createElement('label');
    label.setAttribute('for', `drake-${f.key}`);
    const strong = document.createElement('strong');
    strong.textContent = f.symbol;
    const value = document.createElement('span');
    value.id = `drake-${f.key}-label`;
    label.append(strong, `, ${f.meaning}: `, value);
    const input = document.createElement('input');
    Object.entries({ type: 'range', id: `drake-${f.key}`, min: 0, max: f.choices.length - 1, step: 1, 'aria-controls': 'drake-diagram' }).forEach(([k, v]) => input.setAttribute(k, v));
    input.addEventListener('input', () => drawDrake(null));
    div.append(label, input);
    controls.appendChild(div);
  });

  function readIndexes() {
    return Object.fromEntries(X.DRAKE_FACTORS.map((f) => [f.key, Number($(`drake-${f.key}`).value)]));
  }

  function drawDrake(presetKey) {
    if (presetKey) {
      X.DRAKE_FACTORS.forEach((f) => {
        $(`drake-${f.key}`).value = String(X.DRAKE_PRESETS[presetKey][f.key]);
      });
    }
    const idx = readIndexes();
    const values = X.drakeValues(idx);
    XD.drawDrake($('drake-diagram'), $('drake-wrap'), values);
    X.DRAKE_FACTORS.forEach((f) => {
      $(`drake-${f.key}-label`).textContent = XD.formatNumber(values[f.key]);
    });
    const n = X.drakeN(values);
    $('drake-diagram').dataset.n = String(n);
    $('drake-readout').textContent =
      `N = ${X.DRAKE_FACTORS.map((f) => XD.formatNumber(values[f.key])).join(' × ')} = ${XD.formatNumber(n)}. ` +
      (n < 1 ? 'Less than one: we would probably be alone in the Galaxy.' : `About ${XD.formatNumber(n)} civilisations we could detect.`);
    const match = Object.keys(X.DRAKE_PRESETS).find((k) => X.DRAKE_FACTORS.every((f) => X.DRAKE_PRESETS[k][f.key] === idx[f.key]));
    setPressed('.ex-drake-presets button', (b) => b.dataset.preset === match);
  }
  document.querySelectorAll('.ex-drake-presets button').forEach((b) => b.addEventListener('click', () => drawDrake(b.dataset.preset)));
  drawDrake('middle');

  // ------------------------------------------------------------------
  // 12.8 SETI
  // ------------------------------------------------------------------
  XD.drawSeti($('seti-diagram'), $('seti-wrap'));

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    $('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }
  renderCoverage();
  QuizUI.mount(ExoplanetsQuestions.makeQuestions(X));
})();
