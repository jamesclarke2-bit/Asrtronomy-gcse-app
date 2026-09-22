(function () {
  const CURRICULUM_UNITS = ['u1.5', 'u1.18', 'u1.19', 'u1.20'];

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    darkAdaptation:
      "Dark adaptation: the gradual increase in your eyes' sensitivity in darkness, mostly complete after 20-30 minutes, as rod cells build up light-sensitive rhodopsin. A single bright light undoes most of it in seconds.",
    avertedVision:
      'Averted vision: looking slightly to one side of a faint object instead of straight at it, so its image falls on the rod-rich peripheral retina rather than the less light-sensitive centre.',
    radiant:
      "A meteor shower's radiant point: the point in the sky meteor trails appear to radiate from, a perspective effect of near-parallel debris particles all approaching Earth from the same direction.",
  };

  renderCoverage();
  Glossary.init(GLOSSARY);
})();
