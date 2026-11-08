/**
 * Draws the shared "Earth's orbit and seasons" diagram into a host
 * page's own SVG element, and (when a latitude is given) a readout
 * block of live, engine-derived facts beside it. Pure rendering layer
 * over src/seasonsDiagram.js's data/geometry — see that file's header
 * for why this replaces src/orbitPanel.js (deleted) and what bug it
 * fixes.
 *
 * Browser-only UI component (builds DOM), so — like quiz-ui.js and
 * glossary.js — there's no Node/module.exports path.
 */
(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const WIDTH = 1180;
  const HEIGHT = 620;
  const CX = 590;
  const CY = 310;
  const RX = 260;
  const RY = 150;
  const EARTH_R = 40;
  const TODAY_R = 14;

  // The fixed screen direction every Earth's axis points — "towards
  // Polaris" — measured clockwise from the positive x-axis in screen
  // (y-down) coordinates, the same convention atan2(dy,dx) and SVG's
  // own rotate() both use. Mostly "up", tilted over by the real 23.5°
  // obliquity rather than drawn dead vertical.
  const AXIS_SCREEN_ANGLE_DEG = -90 + SeasonsDiagram.OBLIQUITY_DEG;

  const LIT_COLOR = '#bcd4f0';
  const DARK_COLOR = '#1f3a5f';
  const EARTH_OUTLINE = '#173d75';
  const AXIS_COLOR = '#c0392b';
  const TODAY_COLOR = '#f5a623';

  // The standard textbook layout: solstices on the left/right,
  // equinoxes at the top/bottom — see SeasonsDiagram.screenAngleForTheta
  // for exactly why that's the rotation that makes the diagram's own
  // fixed, rightward-leaning axis read correctly (away from the Sun at
  // December, towards it at June, sideways at both equinoxes). Orbital
  // angle (theta) itself, everywhere else in this file and in
  // SeasonsDiagram, stays the real EarthOrbit.js convention unshifted —
  // only screen placement rotates.
  function screenPoint(thetaDeg) {
    return SeasonsDiagram.orbitPoint(CX, CY, RX, RY, SeasonsDiagram.screenAngleForTheta(thetaDeg));
  }

  function svgNode(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (parent) parent.appendChild(el);
    return el;
  }

  function textNode(parent, attrs, content) {
    const el = svgNode('text', attrs, parent);
    el.textContent = content;
    return el;
  }

  // The broad season word (Spring/Summer/Autumn/Winter) from a
  // REFERENCE_POSITIONS entry's own full label ("Summer solstice") —
  // used for the hemisphere tags, so they read "N: Summer" rather than
  // repeating the "solstice"/"equinox" the position's own date label
  // (e.g. "June solstice") already states once.
  function broadSeason(seasonLabel) {
    return seasonLabel.split(' ')[0];
  }

  function formatHoursMinutes(totalMinutes) {
    const clamped = Math.max(0, Math.min(24 * 60, totalMinutes));
    const h = Math.floor(clamped / 60);
    const m = Math.round(clamped % 60);
    return `${h}h ${m}m`;
  }

  // One Earth: a sphere split into a lit half (always facing the Sun,
  // at CX,CY, whatever this Earth's own orbital position) and a dark
  // half, via a clip-path rectangle rotated to the Sun direction —
  // robust for any angle, unlike hand-picking SVG arc sweep flags.
  function drawEarthSphere(parent, { x, y, r, idSuffix }) {
    const angleToSunDeg = (Math.atan2(CY - y, CX - x) * 180) / Math.PI;
    const clipId = `seasons-lit-clip-${idSuffix}`;
    const clipPath = svgNode('clipPath', { id: clipId }, parent);
    const pad = 4;
    svgNode(
      'rect',
      {
        x,
        y: y - r - pad,
        width: r + pad,
        height: 2 * (r + pad),
        transform: `rotate(${angleToSunDeg} ${x} ${y})`,
      },
      clipPath
    );
    svgNode('circle', { cx: x, cy: y, r, fill: DARK_COLOR }, parent);
    svgNode('circle', { cx: x, cy: y, r, fill: LIT_COLOR, 'clip-path': `url(#${clipId})` }, parent);
    svgNode(
      'circle',
      { cx: x, cy: y, r, fill: 'none', stroke: EARTH_OUTLINE, 'stroke-width': 2.2, class: 'seasons-earth-sphere', 'data-position': idSuffix },
      parent
    );
  }

  // A reference-position Earth: the sphere above, its fixed-direction
  // axis tick (with N/S dots), and its date + per-hemisphere season
  // labels — the explicit labelling that replaces having to read
  // anything from screen position or axis direction.
  function drawReferenceEarth(parent, point, position) {
    const { x, y } = point;
    drawEarthSphere(parent, { x, y, r: EARTH_R, idSuffix: position.id });

    const axisRad = (AXIS_SCREEN_ANGLE_DEG * Math.PI) / 180;
    const ax = Math.cos(axisRad);
    const ay = Math.sin(axisRad);
    const northEnd = { x: x + ax * (EARTH_R + 20), y: y + ay * (EARTH_R + 20) };
    const southEnd = { x: x - ax * (EARTH_R + 20), y: y - ay * (EARTH_R + 20) };
    svgNode('line', { x1: southEnd.x, y1: southEnd.y, x2: northEnd.x, y2: northEnd.y, stroke: AXIS_COLOR, 'stroke-width': 3.5 }, parent);
    svgNode('circle', { cx: northEnd.x, cy: northEnd.y, r: 4.5, fill: AXIS_COLOR }, parent);
    svgNode('circle', { cx: southEnd.x, cy: southEnd.y, r: 4.5, fill: 'none', stroke: AXIS_COLOR, 'stroke-width': 2 }, parent);

    const northAbove = northEnd.y < southEnd.y;
    textNode(
      parent,
      {
        x: northEnd.x,
        y: northEnd.y + (northAbove ? -16 : 28),
        'text-anchor': 'middle',
        class: 'seasons-hemisphere-label',
        'data-hemisphere': 'north',
        'data-position': position.id,
      },
      `N: ${broadSeason(position.northernSeason)}`
    );
    textNode(
      parent,
      {
        x: southEnd.x,
        y: southEnd.y + (northAbove ? 28 : -16),
        'text-anchor': 'middle',
        class: 'seasons-hemisphere-label',
        'data-hemisphere': 'south',
        'data-position': position.id,
      },
      `S: ${broadSeason(position.southernSeason)}`
    );

    // Date label: pushed further out along the same radial direction
    // from the ellipse's centre as this Earth itself, so it clears both
    // the Earth and the orbit path whichever of the four compass
    // points it's at, rather than always sitting directly above/below.
    const dx = x - CX;
    const dy = y - CY;
    const dist = Math.hypot(dx, dy) || 1;
    const labelPoint = { x: x + (dx / dist) * (EARTH_R + 20), y: y + (dy / dist) * (EARTH_R + 84) };
    const anchor = Math.abs(dx) < RX * 0.3 ? 'middle' : dx > 0 ? 'start' : 'end';
    textNode(
      parent,
      {
        x: labelPoint.x,
        y: labelPoint.y,
        'text-anchor': anchor,
        class: 'seasons-date-label',
        'data-position': position.id,
      },
      position.dateLabel
    );

    // The plain-words caption ("tilted away/towards/sideways"), one
    // more line stacked below the date label — further outward (away
    // from the Earth) when the date label itself sits above or below
    // it (the top/bottom positions), or directly underneath when the
    // date label sits level with the Earth (the left/right positions).
    // Always centred on the date label's own x, never inheriting its
    // start/end anchor: a solstice Earth's date label deliberately
    // flows outward from one single edge (clear of the Earth and
    // orbit path whichever side it's on), but the caption is a longer
    // run of text that would then overflow the diagram far past its
    // own viewBox in that one direction — see
    // test/seasonsDiagram.test.js's own length budget on tiltCaption.
    textNode(
      parent,
      {
        x: labelPoint.x,
        y: labelPoint.y + (dy < 0 ? -22 : 22),
        'text-anchor': 'middle',
        class: 'seasons-tilt-caption',
        'data-position': position.id,
      },
      SeasonsDiagram.tiltCaption(position)
    );
  }

  /**
   * Renders into `container` (expected to hold a child <svg> and be
   * free to also hold a readout block and the takeaway line — see
   * notes/earth-structure.html for the expected shape). `lat` is
   * optional: omit it on a page with no latitude of its own (e.g.
   * sims/sidereal-vs-synodic.html), which skips the day-length/noon-
   * altitude readout lines but still shows everything else, including
   * today's hemisphere seasons.
   *
   * Returns the orbit's screen geometry so a host page can layer its
   * own extra drawing (e.g. a travelled-arc highlight) in the same
   * coordinate system.
   */
  function render(container, { dayIndex, lat }) {
    const svg = container.querySelector('svg');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);

    svgNode('ellipse', { cx: CX, cy: CY, rx: RX, ry: RY, fill: 'none', stroke: '#b7c3d1', 'stroke-width': 2, 'stroke-dasharray': '7 6' }, svg);

    SunIcon.appendSunSvg(svg, CX, CY, 26);
    textNode(svg, { x: CX, y: CY + 48, 'text-anchor': 'middle', class: 'seasons-sun-label' }, 'Sun');

    // Shown once, in a clear corner, rather than repeated on all four
    // Earths — the same fixed direction every axis tick below also
    // points, leaning the same way (to the right) at every position.
    // legendX sits far enough right of the diagram's own left edge to
    // keep the full "axis always points towards Polaris" label (longer
    // than the short "towards Polaris" this replaced) from running
    // past x=0, centred as it is on legendX.
    const legendX = 180;
    const legendY = 64;
    const axisRad = (AXIS_SCREEN_ANGLE_DEG * Math.PI) / 180;
    const legendBase = { x: legendX - Math.cos(axisRad) * 18, y: legendY - Math.sin(axisRad) * 18 };
    const legendTip = { x: legendX + Math.cos(axisRad) * 26, y: legendY + Math.sin(axisRad) * 26 };
    svgNode('line', { x1: legendBase.x, y1: legendBase.y, x2: legendTip.x, y2: legendTip.y, stroke: AXIS_COLOR, 'stroke-width': 3.5 }, svg);
    svgNode('circle', { cx: legendTip.x, cy: legendTip.y, r: 4, fill: AXIS_COLOR }, svg);
    textNode(svg, { x: legendX, y: legendY + 40, 'text-anchor': 'middle', class: 'seasons-polaris-label' }, 'axis always points towards Polaris');

    SeasonsDiagram.REFERENCE_POSITIONS.forEach((position) => {
      const point = screenPoint(position.theta);
      drawReferenceEarth(svg, point, position);
    });

    const { theta, northernSeason, southernSeason } = SeasonsDiagram.seasonsAtDayIndex(dayIndex);
    // Today's marker rides a slightly smaller, inset ellipse — visually
    // distinct from the four big reference Earths sitting exactly on
    // the orbit path, and far enough inside it that it doesn't sit
    // flush on top of a reference Earth whenever today happens to fall
    // near one of the four key dates.
    const todayPoint = SeasonsDiagram.orbitPoint(CX, CY, RX * 0.74, RY * 0.74, SeasonsDiagram.screenAngleForTheta(theta));
    drawEarthSphere(svg, { x: todayPoint.x, y: todayPoint.y, r: TODAY_R, idSuffix: 'today' });
    svgNode('circle', { cx: todayPoint.x, cy: todayPoint.y, r: TODAY_R + 6, fill: 'none', stroke: TODAY_COLOR, 'stroke-width': 3.2 }, svg);
    textNode(svg, { x: todayPoint.x, y: todayPoint.y + TODAY_R + 28, 'text-anchor': 'middle', class: 'seasons-today-label' }, 'Today');

    textNode(svg, { x: WIDTH / 2, y: HEIGHT - 16, 'text-anchor': 'middle', class: 'seasons-takeaway' }, 'The tilt, not the distance, causes the seasons.');

    // --- Readout: live, engine-derived facts for the current date (and,
    // when a latitude's given, that latitude) -----------------------
    let readout = container.querySelector('.seasons-readout');
    if (!readout) {
      readout = document.createElement('dl');
      readout.className = 'seasons-readout';
      container.appendChild(readout);
    }
    readout.innerHTML = '';

    function addRow(id, term, value) {
      const dt = document.createElement('dt');
      dt.textContent = term;
      const dd = document.createElement('dd');
      dd.id = id;
      dd.textContent = value;
      readout.append(dt, dd);
    }

    addRow('seasons-today-readout', 'Today', `Northern hemisphere: ${northernSeason}; Southern hemisphere: ${southernSeason}`);

    if (typeof lat === 'number') {
      const date = SeasonsDiagram.dateForDayIndex(dayIndex);
      const declination = SolarPosition.getSunPosition(date, 0, 0).declination;
      const dayLength = SeasonsDiagram.dayLengthMinutes(date, lat);
      const noonAltitude = SeasonsDiagram.noonAltitudeDeg(declination, lat);
      addRow('seasons-day-length-readout', `Day length at ${lat}°`, formatHoursMinutes(dayLength));
      addRow(
        'seasons-noon-altitude-readout',
        `Noon altitude of the Sun at ${lat}°`,
        `${noonAltitude.toFixed(1)}°${noonAltitude < 0 ? ' (below horizon)' : ''}`
      );
    }

    return {
      cx: CX,
      cy: CY,
      rx: RX,
      ry: RY,
      orbitPoint: screenPoint,
      svg,
      theta,
    };
  }

  window.SeasonsDiagramView = { render, WIDTH, HEIGHT };
})();
