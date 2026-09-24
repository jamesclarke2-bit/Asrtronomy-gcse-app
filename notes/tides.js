(function () {
  const CURRICULUM_UNITS = ['u2.7'];
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const RAD = Math.PI / 180;
  const DAY_MS = 86400000;
  const T = Tides;

  // Diagram geometry, in the SVG's 440x360 viewBox. Angles are measured
  // anticlockwise from the direction of the Sun (to the right), as seen
  // from above the North Pole, which is also the way Earth spins and the
  // Moon orbits.
  const W = 440;
  const H = 360;
  const CX = 190;
  const CY = 180;
  const EARTH_R = 52;
  const WATER_BASE = 16;
  const WATER_SCALE = 17;
  const MOON_ORBIT_R = 154;

  const at = (angleDeg, r) => ({ x: CX + r * Math.cos(angleDeg * RAD), y: CY - r * Math.sin(angleDeg * RAD) });

  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (parent) parent.appendChild(el);
    return el;
  }

  // Labels are HTML, never SVG text, positioned as a share of the viewBox.
  function makeLabel(wrap, text) {
    const el = document.createElement('span');
    el.className = 'labelled-diagram-label';
    el.textContent = text;
    wrap.appendChild(el);
    return el;
  }

  function placeLabel(el, x, y) {
    el.style.left = `${(x / W) * 100}%`;
    el.style.top = `${(y / H) * 100}%`;
  }

  function waterRadius(angleDeg, elongationDeg) {
    return EARTH_R + WATER_BASE + WATER_SCALE * T.waterHeight(angleDeg, elongationDeg);
  }

  // Where the water is highest and lowest round Earth, for the labels.
  function extremes(elongationDeg) {
    const heights = [];
    for (let a = 0; a < 360; a++) heights.push(T.waterHeight(a, elongationDeg));
    const found = { highs: [], lows: [] };
    for (let a = 0; a < 360; a++) {
      const prev = heights[(a + 359) % 360];
      const next = heights[(a + 1) % 360];
      if (heights[a] > prev && heights[a] >= next) found.highs.push(a);
      if (heights[a] < prev && heights[a] <= next) found.lows.push(a);
    }
    return found;
  }

  const diagram = {};

  function setUpDiagram() {
    const svg = document.getElementById('tide-diagram');
    const wrap = document.getElementById('tide-wrap');

    // Sunlight arriving from the right.
    const rays = svgEl('g', { stroke: '#e0a21a', 'stroke-width': 2, 'stroke-linecap': 'round' }, svg);
    [70, 130, 190, 250, 290].forEach((y) => {
      svgEl('line', { x1: 432, y1: y, x2: 396, y2: y }, rays);
      svgEl('path', { d: `M396,${y} l8,-5 M396,${y} l8,5`, fill: 'none' }, rays);
    });
    placeLabel(makeLabel(wrap, 'Sunlight'), 404, 34);

    svgEl('circle', { cx: CX, cy: CY, r: MOON_ORBIT_R, fill: 'none', stroke: '#b0bac5', 'stroke-width': 1, 'stroke-dasharray': '3 4' }, svg);

    diagram.water = svgEl('path', { fill: '#8fc1e8', stroke: '#3a7fb8', 'stroke-width': 1.5 }, svg);
    svgEl('circle', { cx: CX, cy: CY, r: EARTH_R, fill: '#7a9a5c', stroke: '#4f6b3a', 'stroke-width': 1.5 }, svg);
    diagram.moonAxis = svgEl('line', { stroke: '#555', 'stroke-width': 1, 'stroke-dasharray': '4 4' }, svg);
    diagram.moon = svgEl('g', {}, svg);
    diagram.observer = svgEl('circle', { r: 5, fill: '#c0392b', stroke: '#fff', 'stroke-width': 1.5 }, svg);

    diagram.labels = {
      moon: makeLabel(wrap, 'Moon'),
      you: makeLabel(wrap, 'You'),
      high1: makeLabel(wrap, 'High'),
      high2: makeLabel(wrap, 'High'),
      low1: makeLabel(wrap, 'Low'),
      low2: makeLabel(wrap, 'Low'),
    };
  }

  function drawDiagram(elongationDeg, hours) {
    const points = [];
    for (let a = 0; a < 360; a += 3) {
      const p = at(a, waterRadius(a, elongationDeg));
      points.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    diagram.water.setAttribute('d', `M${points.join('L')}Z`);

    const moon = at(elongationDeg, MOON_ORBIT_R);
    const opposite = at(elongationDeg + 180, EARTH_R + WATER_BASE + WATER_SCALE * 1.6);
    diagram.moonAxis.setAttribute('x1', moon.x);
    diagram.moonAxis.setAttribute('y1', moon.y);
    diagram.moonAxis.setAttribute('x2', opposite.x);
    diagram.moonAxis.setAttribute('y2', opposite.y);

    // The Moon, lit on the half facing the Sun (to the right).
    const g = diagram.moon;
    while (g.firstChild) g.removeChild(g.firstChild);
    const r = 11;
    svgEl('circle', { cx: moon.x, cy: moon.y, r, fill: '#3b3f48' }, g);
    svgEl('path', { d: `M${moon.x},${moon.y - r} A${r},${r} 0 0 1 ${moon.x},${moon.y + r} Z`, fill: '#f4f1e8' }, g);
    // Beside the Moon near the top and bottom of its orbit, where a label
    // above or below it would run off the diagram; otherwise above or below.
    const nearTopOrBottom = Math.abs(moon.y - CY) > MOON_ORBIT_R * 0.7;
    if (nearTopOrBottom) placeLabel(diagram.labels.moon, moon.x - 40, moon.y);
    else placeLabel(diagram.labels.moon, moon.x, moon.y + (moon.y > CY ? 22 : -22));

    const { highs, lows } = extremes(elongationDeg);
    [['high1', highs[0]], ['high2', highs[1]], ['low1', lows[0]], ['low2', lows[1]]].forEach(([key, angle]) => {
      const p = at(angle, waterRadius(angle, elongationDeg) + 12);
      placeLabel(diagram.labels[key], p.x, p.y);
    });

    const observerAngle = elongationDeg + (360 * hours) / T.LUNAR_DAY_HOURS;
    const o = at(observerAngle, EARTH_R - 7);
    diagram.observer.setAttribute('cx', o.x);
    diagram.observer.setAttribute('cy', o.y);
    const youAt = at(observerAngle, EARTH_R - 30);
    placeLabel(diagram.labels.you, youAt.x, youAt.y);
  }

  // --- Readouts -----------------------------------------------------------

  const TYPE_TEXT = {
    spring: 'Spring tides: the Sun and Moon are in line',
    neap: 'Neap tides: the Sun and Moon are at right angles',
    'towards-neap': 'Between spring and neap, heading towards neap tides',
    'towards-spring': 'Between neap and spring, heading towards spring tides',
  };

  function describePhase(elongationDeg) {
    const name = MoonPhase.phaseName(elongationDeg);
    const range = Math.round(T.rangeFraction(elongationDeg) * 100);
    return `${name}. ${TYPE_TEXT[T.tideType(elongationDeg)]}. Tidal range: ${range}% of a spring tide's.`;
  }

  // Water at the marked place, and when it's next high.
  function describeWater(elongationDeg, hours) {
    const angleAt = (h) => elongationDeg + (360 * h) / T.LUNAR_DAY_HOURS;
    const height = (h) => T.waterHeight(angleAt(h), elongationDeg);
    const step = 0.05;
    const now = height(hours);
    const rising = height(hours + step) > now;
    const isHigh = now >= height(hours - step) && now >= height(hours + step);
    const isLow = now <= height(hours - step) && now <= height(hours + step);
    let untilHigh = 0;
    for (let h = hours + step; h < hours + T.LUNAR_DAY_HOURS; h += step) {
      if (height(h) >= height(h - step) && height(h) >= height(h + step)) { untilHigh = h - hours; break; }
    }
    const hh = Math.floor(untilHigh);
    const mm = Math.round((untilHigh - hh) * 60);
    const state = isHigh ? 'High tide' : isLow ? 'Low tide' : rising ? 'Tide rising' : 'Tide falling';
    return isHigh ? `${state} at the red marker.` : `${state} at the red marker; next high tide in about ${hh} h ${mm} min.`;
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }

  // --- Controls -----------------------------------------------------------

  const ageSlider = document.getElementById('age-slider');
  const hourSlider = document.getElementById('hour-slider');
  const dateInput = document.getElementById('date-input');

  function render() {
    const age = Number(ageSlider.value);
    const hours = Number(hourSlider.value);
    const elongation = MoonPhase.fromAgeDays(age).theta;
    document.getElementById('age-label').textContent = `${age.toFixed(1)} days`;
    document.getElementById('hour-label').textContent = `${Math.floor(hours)} h ${String(Math.round((hours % 1) * 60)).padStart(2, '0')} min`;
    document.getElementById('tide-result').textContent = describePhase(elongation);
    document.getElementById('water-result').textContent = describeWater(elongation, hours);
    drawDiagram(elongation, hours);
  }

  function checkDate() {
    if (!dateInput.value) return;
    const [y, m, d] = dateInput.value.split('-').map(Number);
    const noon = new Date(Date.UTC(y, m - 1, d, 12));
    const phase = MoonPhase.getMoonPhase(noon);
    ageSlider.value = phase.ageDays.toFixed(2);
    render();
    const next = T.nextSpringAndNeap(phase.ageDays, MoonPhase.SYNODIC_MONTH_DAYS);
    const spring = new Date(noon.getTime() + next.springInDays * DAY_MS);
    const neap = new Date(noon.getTime() + next.neapInDays * DAY_MS);
    document.getElementById('date-result').textContent =
      `${formatDate(noon)}: ${MoonPhase.phaseName(phase.theta)}. ` +
      `Next spring tides around ${formatDate(spring)}, next neap tides around ${formatDate(neap)} (to within about a day).`;
  }

  ageSlider.addEventListener('input', render);
  hourSlider.addEventListener('input', render);
  dateInput.addEventListener('change', checkDate);
  document.querySelectorAll('.preset-button[data-age]').forEach((button) => {
    button.addEventListener('click', () => {
      ageSlider.value = (Number(button.dataset.age) * MoonPhase.SYNODIC_MONTH_DAYS).toFixed(2);
      render();
    });
  });

  function fillFigures() {
    const lunarH = Math.floor(T.LUNAR_DAY_HOURS);
    const lunarM = Math.round((T.LUNAR_DAY_HOURS - lunarH) * 60);
    document.getElementById('lunar-day').textContent = `${lunarH} hours ${lunarM} minutes`;
    document.getElementById('pull-ratio').textContent = String(Math.round(T.sunToMoonPullRatio() / 10) * 10);
    document.getElementById('tide-ratio').textContent = T.TIDE_RATIO.toFixed(2);
    document.getElementById('spring-neap-ratio').textContent = T.springToNeapRatio().toFixed(1);
  }

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    tidalForce:
      "Tidal force: the stretching effect caused by gravity pulling harder on the near side of a body than on its far side. It depends on how quickly the pull changes with distance, so it falls off very fast the farther away the pulling body is.",
    tidalRange:
      'Tidal range: the difference in height between high tide and the next low tide. Largest at spring tides, smallest at neap tides.',
  };

  setUpDiagram();
  fillFigures();
  const today = new Date();
  dateInput.value = today.toISOString().slice(0, 10);
  render();
  checkDate();
  renderCoverage();
  Glossary.init(GLOSSARY);
})();
