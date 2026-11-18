(function () {
  const G = window.GravityBodies;
  const GD = window.GravityBodiesDrawing;

  const CURRICULUM_UNITS = ['u3.32'];
  const $ = (id) => document.getElementById(id);

  // 12.1a and the Lagrange points: drawn once.
  GD.drawRegular($('regular-diagram'), $('regular-wrap'));
  GD.drawLagrange($('lagrange-diagram'), $('lagrange-wrap'));

  // 12.1c A resonance, stepped through by a slider or the Step button.
  const timeInput = $('resonance-time');
  function drawResonance() {
    const t = Number(timeInput.value);
    GD.drawResonance($('resonance-diagram'), $('resonance-wrap'), t);
    $('resonance-diagram').dataset.time = String(t);
    $('resonance-time-label').textContent = String(t);
    const [io, europa, ganymede] = G.resonanceOrbits(t).map((x) => +x.toFixed(3));
    $('resonance-readout').textContent =
      `Io: ${io} orbits, Europa: ${europa}, Ganymede: ${ganymede}. ` +
      (t === 4 ? 'Back where they started: the pattern repeats every 4 Io orbits.' : 'For every 4 orbits of Io, Europa makes 2 and Ganymede 1.');
  }
  timeInput.addEventListener('input', drawResonance);
  $('resonance-step').addEventListener('click', () => {
    const next = Number(timeInput.value) + 0.25;
    timeInput.value = String(next > 4 ? 0 : next);
    drawResonance();
  });
  drawResonance();

  // 12.2a The Roche limit.
  const rocheInput = $('roche-distance');
  function drawRoche() {
    const d = Number(rocheInput.value);
    GD.drawRoche($('roche-diagram'), $('roche-wrap'), d);
    const state = G.rocheState(d);
    $('roche-diagram').dataset.inside = String(state.inside);
    $('roche-distance-label').textContent = d.toFixed(1);
    $('roche-readout').textContent = state.inside
      ? `${d.toFixed(1)} planet radii: inside the Roche limit (about ${G.ROCHE_PLANET_RADII}). The stretch beats the moon's own gravity: it is pulled apart into a ring.`
      : `${d.toFixed(1)} planet radii: outside the Roche limit (about ${G.ROCHE_PLANET_RADII}). The moon is stretched${d < 3.2 ? ' a lot' : ' a little'}, but its own gravity holds it together.`;
  }
  rocheInput.addEventListener('input', drawRoche);
  drawRoche();

  // 12.2b Round or lumpy.
  const sizeInput = $('shape-size');
  function drawShape() {
    const km = Number(sizeInput.value);
    GD.drawShape($('shape-diagram'), $('shape-wrap'), km);
    const verdict = G.shapeVerdict(km);
    $('shape-diagram').dataset.shape = verdict;
    $('shape-size-label').textContent = String(km);
    const text = {
      lumpy: 'gravity is too weak to pull the rock round: lumpy.',
      'in between': 'about the size where gravity starts to pull a body round; it depends on what it is made of.',
      round: "gravity is strong enough to pull the rock into a sphere: round.",
    }[verdict];
    $('shape-readout').textContent = `${km} km across: ${text}`;
    document.querySelectorAll('.gb-shape-buttons button').forEach((b) => {
      const on = Number(b.dataset.km) === km;
      b.classList.toggle('preset-button-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }
  sizeInput.addEventListener('input', drawShape);
  document.querySelectorAll('.gb-shape-buttons button').forEach((b) =>
    b.addEventListener('click', () => {
      sizeInput.value = b.dataset.km;
      drawShape();
    }),
  );
  drawShape();

  // 12.2c Holding an atmosphere.
  let body = 'earth';
  let gas = 'hydrogen';
  function drawAtmosphere() {
    GD.drawAtmosphere($('atmosphere-diagram'), $('atmosphere-wrap'), body, gas);
    const a = G.atmosphere(body, gas);
    const svg = $('atmosphere-diagram');
    svg.dataset.body = body;
    svg.dataset.gas = gas;
    svg.dataset.kept = String(a.kept);
    const name = a.body.name.charAt(0).toUpperCase() + a.body.name.slice(1);
    $('atmosphere-readout').textContent =
      `${name}: ${a.body.where} temperature about ${a.body.temperatureK.toLocaleString('en-GB')} K ` +
      (a.body.where === 'upper atmosphere'
        ? '(where gas escapes, not the ground). '
        : '(it has almost no air, so gas escapes from the ground). ') +
      `Escape speed ${a.body.escapeKms} km/s. ${a.gas.name} particles move at about ${a.speed.toFixed(2)} km/s; ` +
      `${G.KEEP_FACTOR} times that is ${a.needed.toFixed(1)} km/s. ` +
      (a.kept ? `The escape speed is bigger, so ${a.body.name} keeps ${a.gas.name.toLowerCase()}.` : `The escape speed is smaller, so ${a.gas.name.toLowerCase()} escapes from ${a.body.name}.`);
    document.querySelectorAll('.gb-body-buttons button').forEach((b) => {
      b.classList.toggle('preset-button-active', b.dataset.body === body);
      b.setAttribute('aria-pressed', String(b.dataset.body === body));
    });
    document.querySelectorAll('.gb-gas-buttons button').forEach((b) => {
      b.classList.toggle('preset-button-active', b.dataset.gas === gas);
      b.setAttribute('aria-pressed', String(b.dataset.gas === gas));
    });
  }
  document.querySelectorAll('.gb-body-buttons button').forEach((b) =>
    b.addEventListener('click', () => {
      body = b.dataset.body;
      drawAtmosphere();
    }),
  );
  document.querySelectorAll('.gb-gas-buttons button').forEach((b) =>
    b.addEventListener('click', () => {
      gas = b.dataset.gas;
      drawAtmosphere();
    }),
  );
  drawAtmosphere();

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    $('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }
  renderCoverage();
  QuizUI.mount(GravityBodiesQuestions.makeQuestions(G));
})();
