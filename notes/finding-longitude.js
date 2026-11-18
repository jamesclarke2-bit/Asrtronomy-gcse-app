(function () {
  const L = window.Longitude;
  const LD = window.LongitudeDrawing;

  const CURRICULUM_UNITS = ['u2.35'];
  const $ = (id) => document.getElementById(id);

  // The problem: local noon against a Greenwich clock.
  function drawGlobe() {
    const m = Number($('noon-time').value);
    LD.drawGlobe($('globe-diagram'), $('globe-wrap'), m);
    const r = L.longitudeFromNoon(m);
    $('globe-diagram').dataset.longitude = `${+r.degrees.toFixed(2)}${r.direction}`;
    $('noon-time-label').textContent = L.formatClock(m);
    const diff = Math.abs(r.diffMinutes);
    const hm = `${Math.floor(diff / 60)} h ${diff % 60} min`;
    $('noon-readout').textContent = r.direction
      ? `Greenwich reads ${L.formatClock(m)} at local noon: ${hm} ${r.direction === 'W' ? 'after' : 'before'} 12:00. ` +
        `${diff} minutes ÷ 4 minutes per degree = ${+r.degrees.toFixed(2)}°. Greenwich is ${r.direction === 'W' ? 'later' : 'earlier'}, so the ship is ${+r.degrees.toFixed(2)}° ${r.direction === 'W' ? 'west' : 'east'}.`
      : 'Greenwich reads 12:00 at local noon: the ship is on the Greenwich meridian, 0°.';
  }
  $('noon-time').addEventListener('input', drawGlobe);
  drawGlobe();

  // 4.20 Lunar distance.
  const body = $('lunar-table-body');
  L.lunarTable().forEach((row) => {
    const tr = document.createElement('tr');
    [L.formatClock(row.hours * 60), String(row.distanceDeg)].forEach((text) => {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    });
    body.appendChild(tr);
  });
  function drawLunar() {
    const h = Number($('lunar-time').value);
    LD.drawLunar($('lunar-diagram'), $('lunar-wrap'), h);
    $('lunar-diagram').dataset.distance = String(L.lunarDistance(h));
    $('lunar-time-label').textContent = L.formatClock(h * 60);
    $('lunar-readout').textContent =
      `Measured lunar distance: ${L.lunarDistance(h)}°. The table goes down by ${L.MOON_DEG_PER_HOUR * 3}° every 3 hours, ` +
      `so ${L.LUNAR_START_DEG}° − ${L.lunarDistance(h)}° = ${L.LUNAR_START_DEG - L.lunarDistance(h)}° gone, at ${L.MOON_DEG_PER_HOUR}° an hour: ` +
      `Greenwich time ${L.formatClock(L.greenwichFromLunarDistance(L.lunarDistance(h)) * 60)}.`;
  }
  $('lunar-time').addEventListener('input', drawLunar);
  drawLunar();

  // 4.21 Two clocks over a voyage.
  function drawClocks() {
    const days = Number($('voyage-days').value);
    LD.drawClocks($('clocks-diagram'), $('clocks-wrap'), days);
    $('clocks-diagram').dataset.days = String(days);
    $('voyage-days-label').textContent = String(days);
    const ord = L.clockErrorMinutes('ordinary', days);
    const h4 = L.clockErrorMinutes('h4', days);
    const km = (deg) => Math.round(deg * L.KM_PER_DEG_EQUATOR).toLocaleString('en-GB');
    $('clocks-readout').textContent =
      `After ${days} days: the ordinary clock is ${+ord.toFixed(1)} minutes out, so ${+L.longitudeErrorDeg(ord).toFixed(2)}° wrong, about ${km(L.longitudeErrorDeg(ord))} km at the equator. ` +
      `H4 is ${+(h4 * 60).toFixed(1)} seconds out, so ${+L.longitudeErrorDeg(h4).toFixed(3)}° wrong, about ${km(L.longitudeErrorDeg(h4))} km.`;
  }
  $('voyage-days').addEventListener('input', drawClocks);
  drawClocks();

  LD.drawTimeline($('timeline-diagram'), $('timeline-wrap'));

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    $('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }
  renderCoverage();
  QuizUI.mount(LongitudeQuestions.makeQuestions(L));
})();
