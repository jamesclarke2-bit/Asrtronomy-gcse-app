(function () {
  const A = window.Apollo;
  const AD = window.ApolloDrawing;

  const CURRICULUM_UNITS = ['u5.8'];
  const $ = (id) => document.getElementById(id);

  function setPressed(selector, isOn) {
    document.querySelectorAll(selector).forEach((b) => {
      const on = isOn(b);
      b.classList.toggle('preset-button-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  // 11.29 Crew or probe, for a chosen task.
  let task = 'samples';
  function drawTask() {
    const t = A.TASKS.find((x) => x.key === task);
    AD.drawProsCons($('pros-cons-diagram'), $('pros-cons-wrap'), t.highlight);
    $('pros-cons-diagram').dataset.task = task;
    $('task-readout').textContent = `${t.name}: send ${t.verdict === 'crewed' ? 'a crew' : 'a probe'}. ${t.why}`;
    setPressed('.am-task-buttons button', (b) => b.dataset.task === task);
  }
  document.querySelectorAll('.am-task-buttons button').forEach((b) =>
    b.addEventListener('click', () => {
      task = b.dataset.task;
      drawTask();
    }),
  );
  drawTask();

  // 11.30 The Saturn V and the three modules.
  AD.drawSaturnV($('saturn-diagram'), $('saturn-wrap'));
  let moduleKey = 'cm';
  function drawModules() {
    AD.drawModules($('modules-diagram'), $('modules-wrap'), moduleKey);
    $('modules-diagram').dataset.module = moduleKey;
    const m = A.MODULES.find((x) => x.key === moduleKey);
    $('module-readout').textContent = `${m.name}: ${m.job}.`;
    setPressed('.am-module-buttons button', (b) => b.dataset.module === moduleKey);
  }
  document.querySelectorAll('.am-module-buttons button').forEach((b) =>
    b.addEventListener('click', () => {
      moduleKey = b.dataset.module;
      drawModules();
    }),
  );
  drawModules();

  // 11.30 The mission profile, stepped.
  const stepInput = $('profile-step');
  function drawProfile() {
    const step = Number(stepInput.value);
    AD.drawProfile($('profile-diagram'), $('profile-wrap'), step);
    $('profile-diagram').dataset.step = String(step);
    const p = A.PROFILE[step - 1];
    $('profile-step-label').textContent = `${step} of ${A.PROFILE.length}, ${p.name}`;
    $('profile-readout').textContent = `${step}. ${p.name}: ${p.text}`;
  }
  stepInput.addEventListener('input', drawProfile);
  $('profile-next').addEventListener('click', () => {
    const next = Number(stepInput.value) + 1;
    stepInput.value = String(next > A.PROFILE.length ? 1 : next);
    drawProfile();
  });
  drawProfile();

  // 11.30 Four key missions.
  AD.drawMissions($('missions-diagram'), $('missions-wrap'));
  A.MISSIONS.forEach((m) => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = `${m.name} (${m.year}): `;
    li.append(strong, m.text);
    $('missions-list').appendChild(li);
  });

  // Laser ranging.
  AD.drawLaser($('laser-diagram'), $('laser-wrap'));
  const km = A.EARTH_MOON_KM;
  const metres = `${((2 * km * 1000) / 1e8).toFixed(1)} × 10⁸ m`;
  $('laser-readout').textContent =
    `There and back: 2 × ${km.toLocaleString('en-GB')} km = ${(2 * km).toLocaleString('en-GB')} km = ${metres}. ` +
    `Time = distance ÷ speed = ${metres} ÷ ${(A.C_M_PER_S / 1e8).toFixed(1)} × 10⁸ m/s ≈ ${A.laserRoundTripSeconds().toFixed(2)} s.`;

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    $('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }
  renderCoverage();
  QuizUI.mount(ApolloQuestions.makeQuestions(A));
})();
