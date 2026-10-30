/**
 * Static diagrams for sims/moon-phases.html covering the terms that page
 * otherwise only uses in words: perigee/apogee distances and the
 * supermoon/micromoon size difference (an orbit + size-comparison
 * picture), the eight named phases in order (with waxing/waning,
 * crescent/gibbous and the terminator labelled), and earthshine.
 *
 * Pure geometry/data here, so it's testable without a DOM — the actual
 * <svg> drawing lives in sims/moon-phases.js, which calls these functions
 * (see src/bodyLayersDiagram.js for the same split, used there for the
 * same reason).
 */
(function () {
  // --- Orbit scale: perigee/apogee distances and the supermoon/micromoon
  // size comparison. Rounded to the nearest 1,000 km, a first draft (the
  // page's own existing prose already gives the more precise 363,300 km /
  // 405,500 km, sourced from src/moonOrbitPanel.js's own orbit model).
  const ORBIT_SCALE_KM = {
    perigeeKm: 363000,
    apogeeKm: 405000,
  };

  // A full Moon at perigee can look up to about 14% wider than one at
  // apogee (the page's own existing prose, from the Moon's most extreme
  // real perigee/apogee distances) — first draft here as a size ratio
  // drawn to scale, rather than just stated.
  const SUPERMOON_WIDTH_RATIO = 1.14;

  function moonRadiusPx(baseRadiusPx, variant) {
    return variant === 'supermoon' ? baseRadiusPx * SUPERMOON_WIDTH_RATIO : baseRadiusPx;
  }

  // --- Orbit ellipse geometry (perigee/apogee marked on a top-down,
  // exaggerated ellipse, Earth at one focus) --------------------------

  // Standard ellipse-from-eccentricity relations. eccentricity here is
  // already the *visual* (exaggerated) one a caller passes in — not
  // itself responsible for deciding how much to exaggerate.
  function ellipseSemiMinorPx(semiMajorPx, eccentricity) {
    return semiMajorPx * Math.sqrt(1 - eccentricity * eccentricity);
  }
  function ellipseFocusOffsetPx(semiMajorPx, eccentricity) {
    return semiMajorPx * eccentricity;
  }

  // --- The eight named phases, in order -------------------------------

  // Evenly spaced every 45 degrees starting at New Moon (0) — exactly the
  // angles MoonPhase.phaseName's own thresholds (+-6 degrees around each
  // multiple of 90, otherwise crescent/gibbous) resolve to the 8 standard
  // names, so this list and the live "Explore the cycle" tool above it on
  // the page can never name a phase differently.
  const EIGHT_PHASE_THETAS = [0, 45, 90, 135, 180, 225, 270, 315];

  function eightPhases(MoonPhase) {
    return EIGHT_PHASE_THETAS.map((theta) => ({
      theta,
      name: MoonPhase.phaseName(theta),
      waxing: theta < 180,
    }));
  }

  // The Moon's disc exactly as it appears from Earth, as a closed polygon
  // of [x, y] points relative to its own centre (0, 0) — same geometry
  // sims/moon-phases.js's drawEarthViewDisc already draws on a <canvas>
  // (the bright limb is one half of the true circular limb, the
  // terminator is an ellipse of horizontal radius r*cos(theta)), just
  // returned as data so it can also become an SVG path for the 8-phase
  // grid and the earthshine picture below. theta follows the same
  // convention throughout this page: 0 = New Moon, 180 = Full Moon.
  function earthViewDiscPolygon(theta, r, steps = 48) {
    const thetaRad = (theta * Math.PI) / 180;
    const e = Math.cos(thetaRad);
    const waxing = theta <= 180;
    const points = [];

    for (let i = 0; i <= steps; i++) {
      const t = -Math.PI / 2 + (Math.PI * i) / steps;
      const y = -r * Math.sin(t);
      const outer = r * Math.cos(t);
      points.push([waxing ? outer : -outer, y]);
    }
    for (let i = steps; i >= 0; i--) {
      const t = -Math.PI / 2 + (Math.PI * i) / steps;
      const y = -r * Math.sin(t);
      const term = e * r * Math.cos(t);
      points.push([waxing ? term : -term, y]);
    }
    return points;
  }

  // Shoelace formula — used by test/moonPhasesDiagrams.test.js to check
  // earthViewDiscPolygon's drawn area against MoonPhase's own illuminated
  // fraction, so the picture can never silently drift from the number.
  function polygonArea(points) {
    let sum = 0;
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      sum += x1 * y2 - x2 * y1;
    }
    return Math.abs(sum) / 2;
  }

  // --- Earthshine: a thin crescent, chosen close to New Moon so most of
  // the disc is the dark part earthshine faintly lights.
  const EARTHSHINE_THETA = 30;

  // --- Browser-only: the actual drawing ------------------------------
  // Same palette as sims/moon-phases.js's own <canvas> drawing
  // (drawEarthViewDisc) and src/moonOrbitPanel.js's (drawMoonIcon,
  // draw) — those colours live as local consts inside each file rather
  // than being exported, so this repeats the same hex values rather
  // than importing them, to keep every Moon picture on this page
  // looking like the same object.
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const EARTH_COLOR = '#2a6bd6';
  const SUN_COLOR = '#f5a623';
  const MOON_LIT_COLOR = '#f5e8c8';
  const MOON_DARK_COLOR = '#3a3f4d';
  const EARTHSHINE_GLOW_COLOR = '#5a6578';

  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (parent) parent.appendChild(el);
    return el;
  }

  function pointsAttr(points) {
    return points.map(([x, y]) => `${x},${y}`).join(' ');
  }

  // A small always-exactly-half-lit Moon icon (the top-down view: the
  // Moon is always half-lit on the side facing the Sun, whatever its
  // orbital position) at (cx, cy), lit on the side facing sunAngleDeg.
  // sunAngleDeg is fixed the same for every icon on this page (0 =
  // facing right), so every one of the 8 phase-grid icons can share the
  // identical lit-right / dark-left path, just translated into place.
  function drawHalfLitMoonIcon(parent, cx, cy, r, sunAngleDeg) {
    const g = svgEl('g', { transform: `translate(${cx},${cy}) rotate(${-sunAngleDeg})` }, parent);
    svgEl('circle', { cx: 0, cy: 0, r, fill: MOON_DARK_COLOR }, g);
    svgEl('path', { d: `M 0,${-r} A ${r},${r} 0 0 1 0,${r} L 0,0 Z`, fill: MOON_LIT_COLOR }, g);
    svgEl('circle', { cx: 0, cy: 0, r, fill: 'none', stroke: '#20242e', 'stroke-width': 1 }, g);
  }

  // One small card's worth of icons: the orbit-position icon (top) and
  // the Earth-view disc (bottom), for a single phase.
  function drawPhaseCardSvg(svg, theta) {
    const orbitCx = 70;
    const orbitCy = 38;
    const orbitR = 26;
    svgEl('circle', {
      cx: orbitCx, cy: orbitCy, r: orbitR, fill: 'none', stroke: '#b7c3d1', 'stroke-width': 1.5, 'stroke-dasharray': '4 3',
    }, svg);
    svgEl('line', {
      x1: orbitCx + orbitR + 10, y1: orbitCy, x2: orbitCx + orbitR + 2, y2: orbitCy, stroke: SUN_COLOR, 'stroke-width': 2,
    }, svg);
    svgEl('circle', { cx: orbitCx, cy: orbitCy, r: 6, fill: EARTH_COLOR }, svg);
    const moonAngleRad = (theta * Math.PI) / 180;
    const moonX = orbitCx + orbitR * Math.cos(moonAngleRad);
    const moonY = orbitCy - orbitR * Math.sin(moonAngleRad);
    drawHalfLitMoonIcon(svg, moonX, moonY, 6, 0);

    const discCx = 70;
    const discCy = 100;
    const discR = 30;
    const g = svgEl('g', { transform: `translate(${discCx},${discCy})` }, svg);
    svgEl('circle', { cx: 0, cy: 0, r: discR, fill: MOON_DARK_COLOR }, g);
    svgEl('polygon', { points: pointsAttr(earthViewDiscPolygon(theta, discR)), fill: MOON_LIT_COLOR }, g);
    svgEl('circle', { cx: 0, cy: 0, r: discR, fill: 'none', stroke: '#555b6e', 'stroke-width': 1.5 }, g);
  }

  // Renders the 8-phase grid into an existing empty container, one
  // .concept-card per phase (name below its own pair of icons).
  function mountEightPhases(containerId, deps) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    eightPhases(deps.MoonPhase).forEach((phase) => {
      const card = document.createElement('div');
      card.className = 'concept-card phase-card';
      const svg = svgEl('svg', { viewBox: '0 0 140 130', role: 'img', 'aria-label': `${phase.name}: orbital position and Earth view` });
      drawPhaseCardSvg(svg, phase.theta);
      card.appendChild(svg);
      const name = document.createElement('h3');
      name.textContent = phase.name;
      card.appendChild(name);
      container.appendChild(card);
    });
  }

  function addDiagramLabel(wrap, text, leftPercent, topPercent, extraClass) {
    const label = document.createElement('span');
    label.className = `diagram-label${extraClass ? ` ${extraClass}` : ''}`;
    label.textContent = text;
    label.style.left = `${leftPercent}%`;
    label.style.top = `${topPercent}%`;
    wrap.appendChild(label);
  }

  // The orbit ellipse (Earth at one focus, perigee/apogee marked with
  // their distances) plus the supermoon/micromoon size comparison, drawn
  // as one overlaid pair of circles so the ~14% difference reads
  // directly rather than needing two separately-placed circles compared
  // by eye across a gap.
  function mountOrbitScale(svgId, wrapId, deps) {
    const svg = document.getElementById(svgId);
    const wrap = document.getElementById(wrapId);
    if (!svg || !wrap) return;
    svg.innerHTML = '';
    wrap.querySelectorAll('.diagram-label').forEach((el) => el.remove());

    // Stacked in two rows rather than side by side: at phone width a
    // fixed-width HTML label (unlike the svg under it, it doesn't shrink
    // with the viewBox) needs real clearance on every side, and two wide
    // rows sharing the full width of the wrap give each one far more of
    // that than squeezing both into one row ever could.
    const VIEW_W = 640;
    const VIEW_H = 560;
    const ellipseCx = VIEW_W / 2;
    const ellipseCy = 150;
    const semiMajorPx = 130;
    const eccentricity = deps.MoonOrbitPanel.ECCENTRICITY * deps.MoonOrbitPanel.VISUAL_EXAGGERATION;
    const semiMinorPx = ellipseSemiMinorPx(semiMajorPx, eccentricity);
    const focusOffsetPx = ellipseFocusOffsetPx(semiMajorPx, eccentricity);

    svgEl('ellipse', {
      cx: ellipseCx, cy: ellipseCy, rx: semiMajorPx, ry: semiMinorPx,
      fill: 'none', stroke: '#b7c3d1', 'stroke-width': 1.5, 'stroke-dasharray': '5 5',
    }, svg);
    svgEl('circle', { cx: ellipseCx - focusOffsetPx, cy: ellipseCy, r: 11, fill: EARTH_COLOR, stroke: '#173d75', 'stroke-width': 1.5 }, svg);

    const perigeeX = ellipseCx - semiMajorPx;
    const apogeeX = ellipseCx + semiMajorPx;
    svgEl('circle', { cx: perigeeX, cy: ellipseCy, r: 4, fill: '#6b7684' }, svg);
    svgEl('circle', { cx: apogeeX, cy: ellipseCy, r: 4, fill: '#6b7684' }, svg);
    addDiagramLabel(wrap, `Perigee — about ${ORBIT_SCALE_KM.perigeeKm.toLocaleString('en-GB')} km`, (perigeeX / VIEW_W) * 100, ((ellipseCy - 34) / VIEW_H) * 100);
    addDiagramLabel(wrap, `Apogee — about ${ORBIT_SCALE_KM.apogeeKm.toLocaleString('en-GB')} km`, (apogeeX / VIEW_W) * 100, ((ellipseCy + 34) / VIEW_H) * 100);

    const compareCx = VIEW_W / 2;
    const compareCy = 420;
    const micromoonR = 60;
    const supermoonR = moonRadiusPx(micromoonR, 'supermoon');
    svgEl('circle', { cx: compareCx, cy: compareCy, r: supermoonR, fill: MOON_LIT_COLOR, stroke: '#9a8a5f', 'stroke-width': 1.5 }, svg);
    svgEl('circle', {
      cx: compareCx, cy: compareCy, r: micromoonR, fill: 'none', stroke: '#3a3f4d', 'stroke-width': 1.5, 'stroke-dasharray': '4 3',
    }, svg);
    addDiagramLabel(wrap, 'Supermoon: full Moon at perigee', (compareCx / VIEW_W) * 100, ((compareCy - supermoonR - 16) / VIEW_H) * 100);
    addDiagramLabel(wrap, 'Micromoon: full Moon at apogee', (compareCx / VIEW_W) * 100, ((compareCy + micromoonR + 16) / VIEW_H) * 100);
  }

  // A thin crescent, its dark side given a faint glow rather than pure
  // black, with both parts labelled.
  function mountEarthshine(svgId, wrapId) {
    const svg = document.getElementById(svgId);
    const wrap = document.getElementById(wrapId);
    if (!svg || !wrap) return;
    svg.innerHTML = '';
    wrap.querySelectorAll('.diagram-label').forEach((el) => el.remove());

    const VIEW_W = 220;
    const VIEW_H = 260;
    const cx = 110;
    const cy = 130;
    const r = 65;
    const g = svgEl('g', { transform: `translate(${cx},${cy})` }, svg);
    svgEl('circle', { cx: 0, cy: 0, r, fill: EARTHSHINE_GLOW_COLOR }, g);
    svgEl('polygon', { points: pointsAttr(earthViewDiscPolygon(EARTHSHINE_THETA, r)), fill: MOON_LIT_COLOR }, g);
    svgEl('circle', { cx: 0, cy: 0, r, fill: 'none', stroke: '#555b6e', 'stroke-width': 1.5 }, g);

    // Leader dots + lines, same look as the orbit-scale picture's
    // perigee/apogee dots, pointing from outside the disc (where the
    // label sits, clear of the picture) to a point on the feature it
    // names.
    const leaders = svgEl('g', { stroke: '#8a97a5', 'stroke-width': 1, 'stroke-dasharray': '3 2' }, svg);
    const crescentDot = { x: cx + r * 0.82, y: cy - r * 0.35 };
    const crescentLabelAnchor = { x: cx + r * 0.75, y: cy - r - 22 };
    svgEl('line', { x1: crescentDot.x, y1: crescentDot.y, x2: crescentLabelAnchor.x, y2: crescentLabelAnchor.y }, leaders);
    svgEl('circle', { cx: crescentDot.x, cy: crescentDot.y, r: 3, fill: '#8a97a5' }, svg);

    const darkDot = { x: cx - r * 0.35, y: cy + r * 0.2 };
    const darkLabelAnchor = { x: cx - r * 0.15, y: cy + r + 30 };
    svgEl('line', { x1: darkDot.x, y1: darkDot.y, x2: darkLabelAnchor.x, y2: darkLabelAnchor.y }, leaders);
    svgEl('circle', { cx: darkDot.x, cy: darkDot.y, r: 3, fill: '#8a97a5' }, svg);

    addDiagramLabel(wrap, 'Sunlit crescent', (crescentLabelAnchor.x / VIEW_W) * 100, (crescentLabelAnchor.y / VIEW_H) * 100);
    addDiagramLabel(wrap, 'Earthshine: the dark side, faintly lit by sunlight reflected off Earth', (darkLabelAnchor.x / VIEW_W) * 100, (darkLabelAnchor.y / VIEW_H) * 100, 'diagram-label--wide');
  }

  const api = {
    ORBIT_SCALE_KM,
    SUPERMOON_WIDTH_RATIO,
    moonRadiusPx,
    ellipseSemiMinorPx,
    ellipseFocusOffsetPx,
    EIGHT_PHASE_THETAS,
    eightPhases,
    earthViewDiscPolygon,
    polygonArea,
    EARTHSHINE_THETA,
    mountEightPhases,
    mountOrbitScale,
    mountEarthshine,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.MoonPhasesDiagrams = api;
  }
})();
