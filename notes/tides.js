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

  function placeLabel(el, x, y, width, height) {
    el.style.left = `${(x / (width || W)) * 100}%`;
    el.style.top = `${(y / (height || H)) * 100}%`;
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

  // --- Spring/neap mini diagrams: the same water-bulge model, drawn once
  // each at a fixed elongation (0° = spring, 90° = neap) rather than
  // driven by a slider. Self-contained geometry, not sharing the main
  // diagram's CX/CY/EARTH_R, since these are drawn much smaller.

  function buildMiniTideDiagram(containerId, elongationDeg) {
    const wrap = document.getElementById(containerId.wrap);
    const svg = document.getElementById(containerId.svg);
    const cx = 70;
    const cy = 95;
    const earthR = 24;
    const waterBase = 7;
    const waterScale = 8;
    const moonOrbitR = 78;
    const miniAt = (angleDeg, r) => ({ x: cx + r * Math.cos(angleDeg * RAD), y: cy - r * Math.sin(angleDeg * RAD) });
    const radiusAt = (angleDeg) => earthR + waterBase + waterScale * T.waterHeight(angleDeg, elongationDeg);

    // Sunlight, arriving from the right.
    const rays = svgEl('g', { stroke: '#e0a21a', 'stroke-width': 1.5, 'stroke-linecap': 'round' }, svg);
    [60, 95, 130].forEach((y) => {
      svgEl('line', { x1: 214, y1: y, x2: 188, y2: y }, rays);
      svgEl('path', { d: `M188,${y} l6,-4 M188,${y} l6,4`, fill: 'none' }, rays);
    });

    svgEl('circle', { cx, cy, r: moonOrbitR, fill: 'none', stroke: '#b0bac5', 'stroke-width': 1, 'stroke-dasharray': '3 4' }, svg);

    const points = [];
    for (let a = 0; a < 360; a += 4) {
      const p = miniAt(a, radiusAt(a));
      points.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    svgEl('path', { d: `M${points.join('L')}Z`, fill: '#8fc1e8', stroke: '#3a7fb8', 'stroke-width': 1.2 }, svg);
    svgEl('circle', { cx, cy, r: earthR, fill: '#7a9a5c', stroke: '#4f6b3a', 'stroke-width': 1.2 }, svg);

    // The Moon, lit on the side facing the Sun (to the right).
    const moon = miniAt(elongationDeg, moonOrbitR);
    const mr = 8;
    svgEl('circle', { cx: moon.x, cy: moon.y, r: mr, fill: '#3b3f48' }, svg);
    svgEl('path', { d: `M${moon.x},${moon.y - mr} A${mr},${mr} 0 0 1 ${moon.x},${moon.y + mr} Z`, fill: '#f4f1e8' }, svg);

    // High/low markers, one labelled pair — the other high and low are the
    // same distance round, by symmetry.
    const heights = [];
    for (let a = 0; a < 360; a++) heights.push(T.waterHeight(a, elongationDeg));
    let highAngle = 0;
    let lowAngle = 0;
    for (let a = 0; a < 360; a++) {
      if (heights[a] > heights[highAngle]) highAngle = a;
      if (heights[a] < heights[lowAngle]) lowAngle = a;
    }
    [[highAngle, 'High'], [lowAngle, 'Low']].forEach(([angle, text]) => {
      const p = miniAt(angle, radiusAt(angle));
      svgEl('circle', { cx: p.x, cy: p.y, r: 2.5, fill: '#c0392b' }, svg);
      const labelPoint = miniAt(angle, radiusAt(angle) + 14);
      placeLabel(makeLabel(wrap, text), labelPoint.x, labelPoint.y, 220, 190);
    });
  }

  // --- Lunar-month strip: four phases, each with its tide type ------------

  function buildMonthStrip() {
    const strip = document.getElementById('month-strip');
    const PHASES = [
      { elongation: 0, label: 'New Moon', tide: 'Spring' },
      { elongation: 90, label: 'First quarter', tide: 'Neap' },
      { elongation: 180, label: 'Full Moon', tide: 'Spring' },
      { elongation: 270, label: 'Last quarter', tide: 'Neap' },
    ];
    PHASES.forEach(({ elongation, label, tide }) => {
      const card = document.createElement('div');
      card.className = 'diagram month-strip-card';
      const svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('viewBox', '0 0 60 60');
      svg.setAttribute('width', '60');
      svg.setAttribute('height', '60');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', `${label}: ${tide} tides`);
      const cx = 30;
      const cy = 30;
      const r = 24;
      svgEl('circle', { cx, cy, r, fill: '#3b3f48', stroke: '#20242e', 'stroke-width': 1 }, svg);
      // The lit fraction: none at new Moon, half at the quarters, all at
      // full — the same simplified half-and-half convention the main
      // diagram's own Moon icon uses, not a true crescent shape.
      if (elongation === 90) {
        svgEl('path', { d: `M${cx},${cy - r} A${r},${r} 0 0 1 ${cx},${cy + r} Z`, fill: '#f4f1e8' }, svg);
      } else if (elongation === 270) {
        svgEl('path', { d: `M${cx},${cy - r} A${r},${r} 0 0 0 ${cx},${cy + r} Z`, fill: '#f4f1e8' }, svg);
      } else if (elongation === 180) {
        svgEl('circle', { cx, cy, r, fill: '#f4f1e8', stroke: '#c9c2a5', 'stroke-width': 1 }, svg);
      }
      card.appendChild(svg);
      const caption = document.createElement('p');
      caption.className = 'diagram-caption';
      caption.appendChild(document.createTextNode(label));
      caption.appendChild(document.createElement('br'));
      const tideStrong = document.createElement('strong');
      tideStrong.textContent = tide;
      caption.appendChild(tideStrong);
      card.appendChild(caption);
      strip.appendChild(card);
    });
  }

  // --- Beach scene: two illustrative, not data-driven, panels of the same
  // beach — one with the sea risen to the high tide mark, one with it
  // retreated to the low tide mark. Both posts and both marks are drawn
  // in both panels (they're fixed features of the beach); only the sea's
  // own edge, and which mark it currently reaches, changes between them.

  const BEACH_W = 220;
  const BEACH_H = 170;
  const BEACH_HIGH_POST = { x: 70, topY: 58, bottomY: 96 };
  const BEACH_LOW_POST = { x: 150, topY: 116, bottomY: 150 };
  const BEACH_DUNE_PATH = 'M0,52 Q55,42 110,50 T220,46 L220,170 L0,170 Z';

  function buildBeachPanel(containerId, seaLevel) {
    const wrap = document.getElementById(containerId.wrap);
    const svg = document.getElementById(containerId.svg);
    const seaTop = seaLevel === 'high' ? BEACH_HIGH_POST.topY : BEACH_LOW_POST.topY;

    svgEl('rect', { x: 0, y: 0, width: BEACH_W, height: 52, fill: '#cfe6f5' }, svg);
    svgEl('circle', { cx: 195, cy: 20, r: 12, fill: '#f5c542' }, svg);
    svgEl('path', { d: BEACH_DUNE_PATH, fill: '#e8d9a8' }, svg);
    svgEl('rect', { x: 0, y: seaTop, width: BEACH_W, height: BEACH_H - seaTop, fill: '#6fa8dc' }, svg);

    [BEACH_HIGH_POST, BEACH_LOW_POST].forEach((post) => {
      svgEl('line', { x1: post.x, y1: post.topY, x2: post.x, y2: post.bottomY, stroke: '#7a5230', 'stroke-width': 3 }, svg);
      svgEl('line', { x1: post.x - 6, y1: post.topY, x2: post.x + 6, y2: post.topY, stroke: '#7a5230', 'stroke-width': 3 }, svg);
    });

    svgEl('line', { x1: 8, y1: seaTop, x2: 212, y2: seaTop, stroke: '#b3261e', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, svg);

    placeLabel(makeLabel(wrap, 'High tide mark'), BEACH_HIGH_POST.x, 30, BEACH_W, BEACH_H);
    placeLabel(makeLabel(wrap, 'Low tide mark'), BEACH_LOW_POST.x, 104, BEACH_W, BEACH_H);
    placeLabel(makeLabel(wrap, 'Sea level'), 178, seaTop + 18, BEACH_W, BEACH_H);
    placeLabel(makeLabel(wrap, 'Sand'), 20, seaLevel === 'high' ? 47 : 88, BEACH_W, BEACH_H);
  }

  // --- Pull vs stretch diagram: two rows (Sun, Moon), each an Earth with
  // three pull arrows (near side, centre, far side). The Sun's arrows are
  // drawn very large and almost equal, the Moon's smaller but clearly
  // graded — illustrating the stretch, not the true relative sizes (the
  // page says so in its own caption).

  function buildPullStretchDiagram() {
    const wrap = document.getElementById('pull-stretch-diagram-wrap');
    const svg = document.getElementById('pull-stretch-diagram');
    const PW = 640;
    const PH = 260;
    const earthCx = 140;
    const earthR = 20;
    const arrowStartX = earthCx + earthR + 10;
    const bodyCx = 580;

    function drawArrow(y, length, color) {
      const x2 = arrowStartX + length;
      svgEl('line', { x1: arrowStartX, y1: y, x2, y2: y, stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
      svgEl('path', { d: `M${x2},${y} l-9,-5 M${x2},${y} l-9,5`, stroke: color, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, svg);
    }

    function drawRow(cy, lengths, bodyRadius, isMoon) {
      svgEl('circle', { cx: earthCx, cy, r: earthR, fill: '#7a9a5c', stroke: '#4f6b3a', 'stroke-width': 1.5 }, svg);
      if (isMoon) {
        svgEl('circle', { cx: bodyCx, cy, r: bodyRadius, fill: '#3b3f48' }, svg);
        svgEl('path', { d: `M${bodyCx},${cy - bodyRadius} A${bodyRadius},${bodyRadius} 0 0 1 ${bodyCx},${cy + bodyRadius} Z`, fill: '#f4f1e8' }, svg);
      } else {
        svgEl('circle', { cx: bodyCx, cy, r: bodyRadius, fill: '#f5c542' }, svg);
      }
      drawArrow(cy - 28, lengths.near, '#c0392b');
      drawArrow(cy, lengths.centre, '#555');
      drawArrow(cy + 28, lengths.far, '#2f6b9a');
    }

    const sunCy = 70;
    const moonCy = 190;
    drawRow(sunCy, { near: 330, centre: 320, far: 310 }, 26, false);
    drawRow(moonCy, { near: 200, centre: 120, far: 40 }, 16, true);

    placeLabel(makeLabel(wrap, 'The Sun'), 40, sunCy, PW, PH);
    placeLabel(makeLabel(wrap, 'The Moon'), 40, moonCy, PW, PH);

    [sunCy, moonCy].forEach((cy) => {
      placeLabel(makeLabel(wrap, 'Near side'), 185, cy - 38, PW, PH);
      placeLabel(makeLabel(wrap, 'Centre'), 185, cy - 10, PW, PH);
      placeLabel(makeLabel(wrap, 'Far side'), 185, cy + 18, PW, PH);
    });
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

  // Formats a number of hours as "H hours M minutes", used for every
  // lunar-day-derived figure on the page so none of them get hand-typed.
  function formatHoursMinutes(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h} hours ${m} minutes`;
  }

  function fillFigures() {
    document.getElementById('lunar-day').textContent = formatHoursMinutes(T.LUNAR_DAY_HOURS);
    document.getElementById('half-lunar-day').textContent = formatHoursMinutes(T.LUNAR_DAY_HOURS / 2);
    document.getElementById('daily-lag').textContent = `${Math.round((T.LUNAR_DAY_HOURS - 24) * 60)} minutes`;

    const pullRatio = String(Math.round(T.sunToMoonPullRatio() / 10) * 10);
    document.getElementById('pull-ratio-heading').textContent = pullRatio;
    document.getElementById('pull-ratio-caption').textContent = pullRatio;

    const tideRatio = T.TIDE_RATIO.toFixed(2);
    document.getElementById('tide-ratio-step').textContent = tideRatio;
    document.getElementById('tide-ratio-caption').textContent = tideRatio;

    document.getElementById('distance-ratio').textContent = String(Math.round(T.SUN_DISTANCE_KM / T.MOON_DISTANCE_KM / 10) * 10);
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
    realTides:
      "Real tides follow this pattern, but coastlines and the sea floor change the details — high tide doesn't come exactly when the Moon is overhead, and the biggest spring tides usually arrive a day or two late. The extra-large spring tides at a supermoon are covered on Moon Phases.",
    whyTwoADay:
      'The Moon moves on along its orbit while Earth turns, so it takes a little longer than one full spin for a place to come back under the Moon — the same reason moonrise itself comes about 50 minutes later each day.',
    whyMoonWins:
      "Gravity's pull falls with the square of the distance (pull ∝ 1/d²), but the tidal stretch — the difference in pull from one side of Earth to the other — falls faster still, with the cube of the distance (stretch ∝ 1/d³), because it depends on how fast the pull itself is changing from place to place. The Moon's much shorter distance more than makes up for its much smaller mass once you're comparing stretch rather than pull, which is why the Moon's tides win even though the Sun's overall pull on Earth is far stronger.",
  };

  setUpDiagram();
  buildMiniTideDiagram({ wrap: 'spring-wrap', svg: 'spring-diagram' }, 0);
  buildMiniTideDiagram({ wrap: 'neap-wrap', svg: 'neap-diagram' }, 90);
  buildMonthStrip();
  buildBeachPanel({ wrap: 'beach-high-wrap', svg: 'beach-high' }, 'high');
  buildBeachPanel({ wrap: 'beach-low-wrap', svg: 'beach-low' }, 'low');
  buildPullStretchDiagram();
  fillFigures();
  const today = new Date();
  dateInput.value = today.toISOString().slice(0, 10);
  render();
  checkDate();
  renderCoverage();
  Glossary.init(GLOSSARY);
  QuizUI.mount(TidesQuestions.makeQuestions(T));
})();
