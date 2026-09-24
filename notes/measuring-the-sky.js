(function () {
  const CURRICULUM_UNITS = ['u2.6', 'u2.28', 'u2.29'];
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const RAD = Math.PI / 180;
  const M = MeasuringTheSky;
  const { STARS } = StarPatterns;

  const EARTH_FILL = '#5b7c99';
  const MOON_FILL = '#d8d6cf';
  const SUN_FILL = '#f5a623';
  const RAY_COLOR = '#e0a21a';
  const ANGLE_COLOR = '#c0392b';

  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (parent) parent.appendChild(el);
    return el;
  }

  // Labels are HTML, never SVG text, positioned as a share of the viewBox.
  function addLabel(wrap, x, y, width, height, text, className) {
    const el = document.createElement('span');
    el.className = className || 'labelled-diagram-label';
    el.style.left = `${(x / width) * 100}%`;
    el.style.top = `${(y / height) * 100}%`;
    el.textContent = text;
    wrap.appendChild(el);
    return el;
  }

  function arcPath(cx, cy, r, fromDeg, toDeg) {
    const a = fromDeg * RAD;
    const b = toDeg * RAD;
    const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
    const sweep = toDeg > fromDeg ? 1 : 0;
    return `M${cx + r * Math.cos(a)},${cy + r * Math.sin(a)} A${r},${r} 0 ${large} ${sweep} ${cx + r * Math.cos(b)},${cy + r * Math.sin(b)}`;
  }

  function setText(id, text) {
    document.getElementById(id).textContent = text;
  }

  // --- Eratosthenes -------------------------------------------------------

  const ERATOSTHENES_ANGLE_DEG = 7.2;
  const ERATOSTHENES_EXAGGERATION = 3;

  function drawEratosthenes() {
    const W = 520;
    const H = 360;
    const svg = document.getElementById('eratosthenes-diagram');
    const wrap = document.getElementById('eratosthenes-wrap');
    const cx = 290;
    const cy = 330;
    const R = 230;
    const drawn = ERATOSTHENES_ANGLE_DEG * ERATOSTHENES_EXAGGERATION;
    const stick = 46;

    // Screen angles, measured clockwise from the +x axis: straight up is -90°.
    const syeneAngle = -90;
    const alexAngle = -90 - drawn;
    const at = (deg, r) => ({ x: cx + r * Math.cos(deg * RAD), y: cy + r * Math.sin(deg * RAD) });

    // A lighter blue than elsewhere, so the labels drawn over it stay readable.
    svgEl('circle', { cx, cy, r: R, fill: '#c9dbea', stroke: EARTH_FILL, 'stroke-width': 2 }, svg);

    // Parallel sunlight, coming straight down.
    const rays = svgEl('g', { stroke: RAY_COLOR, 'stroke-width': 1.5, 'stroke-dasharray': '6 4' }, svg);
    [150, 200, 250, 340, 390, 440].forEach((x) => svgEl('line', { x1: x, y1: 8, x2: x, y2: cy - Math.sqrt(Math.max(R * R - (x - cx) ** 2, 0)) - 2 }, rays));

    // Radii from the centre to each city, and the angle between them.
    const syene = at(syeneAngle, R);
    const alex = at(alexAngle, R);
    const radii = svgEl('g', { stroke: '#3f5a70', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, svg);
    svgEl('line', { x1: cx, y1: cy, x2: syene.x, y2: syene.y }, radii);
    svgEl('line', { x1: cx, y1: cy, x2: alex.x, y2: alex.y }, radii);
    svgEl('path', { d: arcPath(cx, cy, 70, alexAngle, syeneAngle), fill: 'none', stroke: ANGLE_COLOR, 'stroke-width': 2.5 }, svg);

    // The two sticks, pointing straight out from Earth's centre.
    const syeneTop = at(syeneAngle, R + stick);
    const alexTop = at(alexAngle, R + stick);
    const sticks = svgEl('g', { stroke: '#1f2d3d', 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);
    svgEl('line', { x1: syene.x, y1: syene.y, x2: syeneTop.x, y2: syeneTop.y }, sticks);
    svgEl('line', { x1: alex.x, y1: alex.y, x2: alexTop.x, y2: alexTop.y }, sticks);

    // Alexandria's stick casts a shadow along the ground, away from the Sun:
    // the ray grazing the stick's top meets the tangent line at the stick's foot.
    const tangent = { x: Math.cos((alexAngle + 90) * RAD), y: Math.sin((alexAngle + 90) * RAD) };
    const shadowLength = stick * Math.tan(drawn * RAD);
    const shadowEnd = { x: alex.x - tangent.x * shadowLength, y: alex.y - tangent.y * shadowLength };
    svgEl('line', { x1: alex.x, y1: alex.y, x2: shadowEnd.x, y2: shadowEnd.y, stroke: '#10141f', 'stroke-width': 5, 'stroke-linecap': 'round' }, svg);
    svgEl('line', { x1: alexTop.x, y1: 8, x2: shadowEnd.x, y2: shadowEnd.y, stroke: RAY_COLOR, 'stroke-width': 2 }, svg);

    // The same angle at the stick's top, between the stick and the incoming ray.
    svgEl('path', { d: arcPath(alexTop.x, alexTop.y, 26, alexAngle + 180, 90), fill: 'none', stroke: ANGLE_COLOR, 'stroke-width': 2.5 }, svg);

    addLabel(wrap, 470, 125, W, H, "Sun's rays (parallel)");
    addLabel(wrap, syeneTop.x + 62, syeneTop.y - 10, W, H, 'Syene: Sun overhead');
    addLabel(wrap, alexTop.x - 72, alexTop.y - 24, W, H, 'Alexandria: shadow angle');
    addLabel(wrap, cx + 58, cy - 44, W, H, 'Same angle at the centre');
    const between = at((syeneAngle + alexAngle) / 2, R - 22);
    addLabel(wrap, between.x + 4, between.y, W, H, '~800 km');
  }

  function setUpCalculator() {
    const angleInput = document.getElementById('angle-input');
    const distanceInput = document.getElementById('distance-input');
    const result = document.getElementById('circumference-result');
    function update() {
      const angle = Number(angleInput.value);
      const distance = Number(distanceInput.value);
      if (!(angle > 0 && angle <= 360) || !(distance > 0)) {
        result.textContent = 'Enter an angle above 0° and a distance above 0 km.';
        return;
      }
      const circumference = M.eratosthenesCircumference(angle, distance);
      result.textContent = `Circumference = 360° ÷ ${angle}° × ${distance.toLocaleString('en-GB')} km ≈ ${Math.round(circumference).toLocaleString('en-GB')} km`;
    }
    angleInput.addEventListener('input', update);
    distanceInput.addEventListener('input', update);
    update();
  }

  // --- Aristarchus: the lunar eclipse shadow -----------------------------

  function drawShadow() {
    const W = 440;
    const H = 200;
    const svg = document.getElementById('shadow-diagram');
    const wrap = document.getElementById('shadow-wrap');
    const shadow = M.earthShadowAtMoon();
    const moonR = 30;
    const shadowR = moonR * shadow.widthInMoons;
    const cx = 200;
    const cy = 100;

    svgEl('circle', { cx, cy, r: shadowR, fill: '#2b2f3a', stroke: '#1a1d24', 'stroke-width': 1.5 }, svg);
    const left = cx - shadowR;
    for (let i = 0; i < Math.ceil(shadow.widthInMoons); i++) {
      svgEl('circle', {
        cx: left + moonR + 2 * moonR * i, cy, r: moonR,
        fill: i < Math.floor(shadow.widthInMoons) ? 'rgba(193, 90, 60, 0.55)' : MOON_FILL,
        stroke: '#e8e2d8', 'stroke-width': 1.5,
      }, svg);
    }
    addLabel(wrap, 380, 36, W, H, "Earth's shadow (umbra)");
    addLabel(wrap, 385, 158, W, H, 'Moon-sized circles');
  }

  // --- Aristarchus: the quarter Moon -------------------------------------

  const QUARTER_DRAWN_DEG = 70;

  function drawQuarter() {
    const W = 520;
    const H = 240;
    const svg = document.getElementById('quarter-diagram');
    const wrap = document.getElementById('quarter-wrap');
    const earth = { x: 50, y: 205 };
    const sun = { x: 480, y: 205 };
    // With the Moon on the circle whose diameter is Earth-Sun, the angle at
    // the Moon is a right angle (Thales), whatever angle is drawn at Earth.
    const es = sun.x - earth.x;
    const em = es * Math.cos(QUARTER_DRAWN_DEG * RAD);
    const moon = { x: earth.x + em * Math.cos(QUARTER_DRAWN_DEG * RAD), y: earth.y - em * Math.sin(QUARTER_DRAWN_DEG * RAD) };

    const sides = svgEl('g', { stroke: '#555', 'stroke-width': 1.5 }, svg);
    svgEl('line', { x1: earth.x, y1: earth.y, x2: moon.x, y2: moon.y }, sides);
    svgEl('line', { x1: moon.x, y1: moon.y, x2: sun.x, y2: sun.y, stroke: RAY_COLOR, 'stroke-dasharray': '6 4' }, sides);
    svgEl('line', { x1: earth.x, y1: earth.y, x2: sun.x, y2: sun.y }, sides);

    // Right-angle mark at the Moon.
    const toEarth = { x: (earth.x - moon.x) / em, y: (earth.y - moon.y) / em };
    const ms = Math.hypot(sun.x - moon.x, sun.y - moon.y);
    const toSun = { x: (sun.x - moon.x) / ms, y: (sun.y - moon.y) / ms };
    const k = 12;
    svgEl('path', {
      d: `M${moon.x + toEarth.x * k},${moon.y + toEarth.y * k} L${moon.x + (toEarth.x + toSun.x) * k},${moon.y + (toEarth.y + toSun.y) * k} L${moon.x + toSun.x * k},${moon.y + toSun.y * k}`,
      fill: 'none', stroke: '#555', 'stroke-width': 1.5,
    }, svg);

    // Angle theta at Earth.
    svgEl('path', { d: arcPath(earth.x, earth.y, 38, -QUARTER_DRAWN_DEG, 0), fill: 'none', stroke: ANGLE_COLOR, 'stroke-width': 2.5 }, svg);

    svgEl('circle', { cx: earth.x, cy: earth.y, r: 11, fill: EARTH_FILL }, svg);
    svgEl('circle', { cx: sun.x, cy: sun.y, r: 24, fill: SUN_FILL }, svg);
    // The Moon, lit on the half facing the Sun.
    const r = 9;
    const litAngle = Math.atan2(toSun.y, toSun.x);
    svgEl('circle', { cx: moon.x, cy: moon.y, r, fill: '#3b3f48' }, svg);
    const p1 = { x: moon.x + r * Math.cos(litAngle - Math.PI / 2), y: moon.y + r * Math.sin(litAngle - Math.PI / 2) };
    const p2 = { x: moon.x + r * Math.cos(litAngle + Math.PI / 2), y: moon.y + r * Math.sin(litAngle + Math.PI / 2) };
    svgEl('path', { d: `M${p1.x},${p1.y} A${r},${r} 0 0 1 ${p2.x},${p2.y} Z`, fill: '#f4f1e8' }, svg);

    addLabel(wrap, earth.x + 8, earth.y + 24, W, H, 'Earth');
    addLabel(wrap, moon.x - 4, moon.y - 24, W, H, 'Moon, half lit');
    addLabel(wrap, sun.x - 8, sun.y - 40, W, H, 'Sun');
    addLabel(wrap, earth.x + 66, earth.y - 26, W, H, 'θ');
    addLabel(wrap, moon.x + 44, moon.y + 6, W, H, '90°');
  }

  function setUpQuarterSlider() {
    const slider = document.getElementById('quarter-slider');
    const label = document.getElementById('quarter-label');
    const result = document.getElementById('quarter-result');
    const trueAngle = M.trueQuarterAngleDeg();
    function update() {
      const angle = Number(slider.value);
      label.textContent = `${angle.toFixed(angle > 89.5 ? 3 : 2)}°`;
      const ratio = M.sunDistanceInMoonDistances(angle);
      result.textContent = `The Sun is ${ratio < 100 ? ratio.toFixed(1) : Math.round(ratio)} times farther away than the Moon`;
    }
    slider.addEventListener('input', update);
    document.querySelectorAll('.preset-button[data-angle]').forEach((button) => {
      button.addEventListener('click', () => {
        slider.value = button.dataset.angle === 'true' ? trueAngle.toFixed(3) : button.dataset.angle;
        update();
      });
    });
    update();
  }

  // --- The scale strip ----------------------------------------------------

  function drawScale() {
    const W = 600;
    const H = 90;
    const svg = document.getElementById('scale-diagram');
    const wrap = document.getElementById('scale-wrap');
    const margin = 20;
    const kmPerUnit = (M.EARTH_RADIUS_KM + M.MOON_DISTANCE_KM + M.MOON_RADIUS_KM) / (W - 2 * margin);
    const earthR = M.EARTH_RADIUS_KM / kmPerUnit;
    const moonR = M.MOON_RADIUS_KM / kmPerUnit;
    const earthX = margin + earthR;
    const moonX = earthX + M.MOON_DISTANCE_KM / kmPerUnit;
    const y = 36;
    svgEl('line', { x1: earthX, y1: y, x2: moonX, y2: y, stroke: '#b0bac5', 'stroke-width': 1, 'stroke-dasharray': '3 3' }, svg);
    svgEl('circle', { cx: earthX, cy: y, r: earthR, fill: EARTH_FILL }, svg);
    svgEl('circle', { cx: moonX, cy: y, r: moonR, fill: '#9c9a91' }, svg);
    addLabel(wrap, earthX + 18, 70, W, H, 'Earth');
    addLabel(wrap, Math.min(moonX, W - 60), 70, W, H, 'Moon');
    addLabel(wrap, W / 2, 70, W, H, '384,400 km');

    // How big and how far the Sun would be on this same scale.
    const sunWidth = M.SUN_DIAMETER_KM / kmPerUnit;
    const sunDistance = M.SUN_DISTANCE_KM / kmPerUnit;
    document.getElementById('sun-scale-note').textContent =
      `On this scale the Sun would be a ball about ${(sunWidth / W).toFixed(1)} times as wide as this whole diagram, ` +
      `about ${Math.round(sunDistance / W)} diagram-widths away.`;
  }

  function fillFigures() {
    const shadow = M.earthShadowAtMoon();
    setText('shadow-width', shadow.widthInMoons.toFixed(1));
    setText('shadow-narrowing', shadow.narrowingInMoons < 1.1 && shadow.narrowingInMoons > 0.9 ? 'one' : shadow.narrowingInMoons.toFixed(1));
    const earthInMoons = shadow.widthInMoons + shadow.narrowingInMoons;
    setText('earth-in-moons', earthInMoons.toFixed(1));
    setText('moon-fraction', `${(1 / earthInMoons).toFixed(2)}, just over a quarter,`);

    const trueAngle = M.trueQuarterAngleDeg();
    setText('true-quarter-angle', `about ${trueAngle.toFixed(2)}°`);
    setText('true-sun-ratio', String(Math.round(M.sunDistanceInMoonDistances(trueAngle) / 10) * 10));

    setText('sun-earth-ratio', String(Math.round(M.SUN_DIAMETER_KM / M.EARTH_DIAMETER_KM)));
    setText('earth-moon-ratio', (M.EARTH_DIAMETER_KM / M.MOON_DIAMETER_KM).toFixed(1));
    setText('moon-distance-earths', String(Math.round(M.MOON_DISTANCE_KM / M.EARTH_DIAMETER_KM)));
    const c = 299792.458;
    setText('light-moon', (M.MOON_DISTANCE_KM / c).toFixed(1));
    setText('light-sun', (M.SUN_DISTANCE_KM / c / 60).toFixed(1));
    setText('sun-moon-size', String(Math.round(M.SUN_DIAMETER_KM / M.MOON_DIAMETER_KM)));
    setText('sun-moon-distance', String(Math.round(M.SUN_DISTANCE_KM / M.MOON_DISTANCE_KM)));
    setText('moon-angle', `${M.angularDiameterDeg(M.MOON_DIAMETER_KM, M.MOON_DISTANCE_KM).toFixed(2)}°`);
    setText('sun-angle', `${M.angularDiameterDeg(M.SUN_DIAMETER_KM, M.SUN_DISTANCE_KM).toFixed(2)}°`);
  }

  // --- Precession ---------------------------------------------------------

  const POLE_STAR_CANDIDATES = ['thuban', 'kochab', 'polaris', 'errai', 'alderamin', 'deneb', 'vega'];
  const POLE_STAR_WITHIN_DEG = 5;
  const PRECESSION = { W: 440, H: 440, cx: 220, cy: 220, degToUnits: 6.2 };

  // Looking up at the northern sky, centred on the ecliptic pole, with
  // distance from it true to scale (so the pole's path is a true circle)
  // and today's celestial pole straight up.
  function precessionView(eq) {
    const { lon, lat } = M.equatorialToEcliptic(eq);
    const r = (90 - lat) * PRECESSION.degToUnits;
    const a = (lon - 90) * RAD;
    return { x: PRECESSION.cx + r * Math.sin(a), y: PRECESSION.cy - r * Math.cos(a) };
  }

  function yearLabel(year) {
    return year > 0 ? `AD ${year}` : `about ${Math.round((1 - year) / 50) * 50} BCE`;
  }

  const precession = {};

  function setUpPrecession() {
    const svg = document.getElementById('precession-diagram');
    const wrap = document.getElementById('precession-wrap');
    const { W, H, cx, cy, degToUnits } = PRECESSION;
    svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: '#10141f', rx: 8 }, svg);

    svgEl('circle', { cx, cy, r: M.OBLIQUITY_DEG * degToUnits, fill: 'none', stroke: '#6f8fb8', 'stroke-width': 1.5, 'stroke-dasharray': '6 5' }, svg);
    svgEl('circle', { cx, cy, r: 3, fill: '#6f8fb8' }, svg);
    addLabel(wrap, cx, cy + 16, W, H, 'Ecliptic pole', 'star-label finder-pattern-label');

    POLE_STAR_CANDIDATES.forEach((key) => {
      const star = STARS[key];
      const p = precessionView(star);
      svgEl('circle', { cx: p.x, cy: p.y, r: Math.max(1.8, 5.2 - 1.05 * star.mag), fill: '#fdfcf5' }, svg);
      // Labels sit on the outside of the circle, away from the pole's path.
      const dx = p.x - cx;
      const dy = p.y - cy;
      const d = Math.hypot(dx, dy);
      const out = d > M.OBLIQUITY_DEG * degToUnits ? 16 : -16;
      addLabel(wrap, p.x + (dx / d) * out, p.y + (dy / d) * out, W, H, star.name, 'star-label');
    });

    precession.marker = svgEl('g', {}, svg);
    precession.poleLabel = addLabel(wrap, 0, 0, W, H, '', 'star-label finder-polaris-label');
  }

  function drawPole(year) {
    const { W, H, cx, cy } = PRECESSION;
    const pole = M.celestialPoleAt(year);
    const p = precessionView(pole);
    const g = precession.marker;
    while (g.firstChild) g.removeChild(g.firstChild);
    svgEl('circle', { cx: p.x, cy: p.y, r: 9, fill: 'none', stroke: '#ffe9a8', 'stroke-width': 2 }, g);
    svgEl('line', { x1: p.x - 14, y1: p.y, x2: p.x + 14, y2: p.y, stroke: '#ffe9a8', 'stroke-width': 1.5 }, g);
    svgEl('line', { x1: p.x, y1: p.y - 14, x2: p.x, y2: p.y + 14, stroke: '#ffe9a8', 'stroke-width': 1.5 }, g);

    // The pole's label goes on the inside of the circle, facing the centre.
    const dx = cx - p.x;
    const dy = cy - p.y;
    const d = Math.hypot(dx, dy);
    precession.poleLabel.style.left = `${((p.x + (dx / d) * 34) / W) * 100}%`;
    precession.poleLabel.style.top = `${((p.y + (dy / d) * 34) / H) * 100}%`;
    precession.poleLabel.textContent = 'Pole';

    const nearest = POLE_STAR_CANDIDATES
      .map((key) => ({ name: STARS[key].name, sep: StarPatterns.angularSeparation(STARS[key], pole) }))
      .sort((a, b) => a.sep - b.sep)[0];
    setText('year-label', yearLabel(year));
    setText('pole-star-result', nearest.sep <= POLE_STAR_WITHIN_DEG
      ? `Pole star: ${nearest.name}, ${nearest.sep.toFixed(1)}° from the pole`
      : `No bright pole star: the nearest shown, ${nearest.name}, is ${nearest.sep.toFixed(0)}° away`);
  }

  function setUpYearSlider() {
    const slider = document.getElementById('year-slider');
    slider.addEventListener('input', () => drawPole(Number(slider.value)));
    drawPole(Number(slider.value));
  }

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  const GLOSSARY = {
    zenith: 'The zenith: the point in the sky directly overhead, at an altitude of 90°.',
    gnomon: "A gnomon: an upright stick or pillar whose shadow shows the Sun's direction, as on a sundial.",
    umbra: "The umbra: the dark central part of a shadow, where the Sun's light is blocked completely.",
    angularDiameter:
      "Angular diameter: how wide something looks, measured as an angle. It depends on both an object's real size and its distance: the Sun and Moon both measure about half a degree.",
    precession:
      "Precession: the slow circling of the direction of Earth's axis, taking about 26,000 years, caused by the Sun's and Moon's pull on Earth's equatorial bulge.",
    eclipticPole:
      "The north ecliptic pole: the point in the sky 90° from the ecliptic, straight 'above' the plane of Earth's orbit. It stays fixed while the celestial pole circles it.",
  };

  drawEratosthenes();
  setUpCalculator();
  drawShadow();
  drawQuarter();
  setUpQuarterSlider();
  drawScale();
  fillFigures();
  setUpPrecession();
  setUpYearSlider();
  renderCoverage();
  Glossary.init(GLOSSARY);
})();
