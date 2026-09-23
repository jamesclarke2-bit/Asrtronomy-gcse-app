(function () {
  const YEAR = 2026;
  const CURRICULUM_UNITS = ['u2.1', 'u2.9', 'u2.15', 'u2.16'];

  const dateSlider = document.getElementById('date-slider');
  const dateLabel = document.getElementById('date-label');
  const orbitCanvas = document.getElementById('orbit');

  function dayOfYearToUTCDate(year, dayIndex) {
    const d = new Date(Date.UTC(year, 0, 1));
    d.setUTCDate(d.getUTCDate() + dayIndex);
    return d;
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  }

  function render() {
    const dayIndex = Number(dateSlider.value);
    dateLabel.textContent = formatDate(dayOfYearToUTCDate(YEAR, dayIndex));
    OrbitPanel.draw(orbitCanvas, dayIndex);
  }

  dateSlider.addEventListener('input', render);

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    oblateSpheroid:
      "Oblate spheroid: a sphere very slightly flattened at the poles and bulging at the equator, caused by a planet's own rotation. Earth's equatorial diameter is only about 43 km more than its polar diameter.",
    greenhouseEffect:
      "The greenhouse effect: infrared radiation from the ground is absorbed by certain atmospheric gases (via molecular resonance) and re-emitted in all directions, warming the surface more than sunlight alone would.",
    scintillation:
      "Scintillation: the visible 'twinkling' of stars, caused by constantly shifting pockets of different density and temperature in the atmosphere bending starlight unpredictably as it arrives.",
    transmissionWindow:
      'An atmospheric transmission window: a range of wavelengths that passes through the atmosphere with little absorption and reaches the ground, unlike most of the electromagnetic spectrum.',
  };

  render();
  renderCoverage();
  Glossary.init(GLOSSARY);
})();
