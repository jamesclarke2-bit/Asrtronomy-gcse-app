/**
 * sims/moon-phases.html's "Names of the full Moons" section: the twelve
 * traditional monthly names on a year wheel, and a computed list of
 * this year's own Full Moons (date + traditional name + an automatic
 * Blue Moon marker), built from src/moonPhase.js's fullMoonsInRange —
 * the page's own moon-phase engine, not a separate calculation.
 *
 * The names themselves are folk tradition (Native American, colonial
 * American and farmers' almanacs), not a spec or data-sheet figure —
 * first draft, to be checked by the teacher (see sims/moon-phases.html's
 * own note). September's name is given as "Harvest or Corn" throughout:
 * traditionally the farmers'-almanac name for that calendar slot is
 * Corn Moon, but Harvest Moon — strictly the Full Moon nearest the
 * September equinox, not always September's own — is popularly used for
 * it instead; the special-names panel (built in the page script, not
 * here, since it needs real links) explains the distinction.
 */
(function () {
  const MONTH_MOON_NAMES = [
    'Wolf', 'Snow', 'Worm', 'Pink', 'Flower', 'Strawberry',
    'Buck', 'Sturgeon', 'Harvest or Corn', "Hunter's", 'Beaver', 'Cold',
  ];

  // Every Full Moon in the given calendar year (UTC), each with its
  // calendar month's traditional name and an isBlueMoon flag — true for
  // the second Full Moon of any calendar month that has two, the
  // standard "monthly" Blue Moon definition (see the page's own note on
  // the other, seasonal definition). Built purely from
  // MoonPhase.fullMoonsInRange, so the list can never name a date the
  // engine itself wouldn't call Full.
  function buildFullMoonList(year, deps) {
    const moons = deps.MoonPhase.fullMoonsInRange(new Date(Date.UTC(year, 0, 1)), new Date(Date.UTC(year + 1, 0, 1)));
    const countSoFarByMonth = {};
    return moons.map((date) => {
      const monthIndex = date.getUTCMonth();
      countSoFarByMonth[monthIndex] = (countSoFarByMonth[monthIndex] || 0) + 1;
      return {
        date,
        monthIndex,
        name: MONTH_MOON_NAMES[monthIndex],
        isBlueMoon: countSoFarByMonth[monthIndex] === 2,
      };
    });
  }

  // --- Browser-only: the actual drawing ------------------------------

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (parent) parent.appendChild(el);
    return el;
  }

  // Four season tints behind the wheel's 12 wedges — Dec/Jan/Feb winter,
  // through to Sep/Oct/Nov autumn — purely decorative grouping, not a
  // claim the diagram makes about anything.
  const SEASON_FILL = ['#e3edf8', '#e3edf8', '#e6f3df', '#e6f3df', '#e6f3df', '#fdf3d4', '#fdf3d4', '#fdf3d4', '#fbe6d6', '#fbe6d6', '#fbe6d6', '#e3edf8'];

  const WHEEL = { W: 440, H: 440, cx: 220, cy: 220, wedgeR: 150, iconR: 100, labelR: 164 };

  function wedgePath(cx, cy, r, startDeg, endDeg) {
    const a0 = (startDeg * Math.PI) / 180;
    const a1 = (endDeg * Math.PI) / 180;
    const p0 = { x: cx + r * Math.cos(a0), y: cy + r * Math.sin(a0) };
    const p1 = { x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1) };
    return `M${cx},${cy} L${p0.x},${p0.y} A${r},${r} 0 0 1 ${p1.x},${p1.y} Z`;
  }

  function pointAt(cx, cy, r, deg) {
    const a = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  // Each icon is drawn inside its own small, centred 40x40 local box
  // (icon functions draw around (0,0), radius ~16), then translated
  // into place — one function per name, each just a handful of simple
  // shapes, not a detailed illustration.
  const MONTH_ICONS = [
    // Wolf (Jan): a simple howling silhouette — snout, raised head, ear.
    (g) => {
      svgEl('path', { d: 'M -14,8 L 4,8 L 14,-10 L 8,-6 L 2,-14 L -2,-4 L -8,-2 L -14,8 Z', fill: '#5c6470' }, g);
      svgEl('path', { d: 'M 2,-14 L 8,-18 L 7,-10 Z', fill: '#5c6470' }, g);
    },
    // Snow (Feb): a six-point snowflake.
    (g) => {
      for (let i = 0; i < 6; i += 1) {
        const a = (i * 60 * Math.PI) / 180;
        const x2 = 15 * Math.cos(a);
        const y2 = 15 * Math.sin(a);
        svgEl('line', { x1: 0, y1: 0, x2, y2, stroke: '#5a8fc2', 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
        const bx = 9 * Math.cos(a);
        const by = 9 * Math.sin(a);
        const perp = a + Math.PI / 2;
        svgEl('line', { x1: bx - 3 * Math.cos(perp), y1: by - 3 * Math.sin(perp), x2: bx + 3 * Math.cos(perp), y2: by + 3 * Math.sin(perp), stroke: '#5a8fc2', 'stroke-width': 1.5, 'stroke-linecap': 'round' }, g);
      }
    },
    // Worm (Mar): a simple wavy line emerging from the ground.
    (g) => {
      svgEl('line', { x1: -16, y1: 10, x2: 16, y2: 10, stroke: '#7a9b6e', 'stroke-width': 2 }, g);
      svgEl('path', { d: 'M -10,10 Q -10,0 0,0 Q 10,0 10,-8', fill: 'none', stroke: '#b06a4a', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    },
    // Pink (Apr): a simple 5-petal wildflower.
    (g) => {
      for (let i = 0; i < 5; i += 1) {
        const a = (i * 72 * Math.PI) / 180;
        svgEl('circle', { cx: 9 * Math.cos(a), cy: 9 * Math.sin(a), r: 6, fill: '#e38fb0' }, g);
      }
      svgEl('circle', { cx: 0, cy: 0, r: 4, fill: '#f5d94e' }, g);
    },
    // Flower (May): a simple tulip on a stem.
    (g) => {
      svgEl('line', { x1: 0, y1: 2, x2: 0, y2: 16, stroke: '#6b9c5e', 'stroke-width': 2 }, g);
      svgEl('path', { d: 'M -8,2 Q -8,-14 0,-14 Q 8,-14 8,2 Q 4,-4 0,2 Q -4,-4 -8,2 Z', fill: '#d85a7a' }, g);
    },
    // Strawberry (Jun): a berry with seeds and a leafy top.
    (g) => {
      svgEl('path', { d: 'M -10,-2 Q -12,14 0,16 Q 12,14 10,-2 Q 0,-8 -10,-2 Z', fill: '#d6473f' }, g);
      [[-4, 4], [4, 2], [0, 10], [-5, 10], [5, 8]].forEach(([x, y]) => svgEl('circle', { cx: x, cy: y, r: 0.9, fill: '#f6e7b0' }, g));
      svgEl('path', { d: 'M -8,-3 L -3,-10 L 0,-4 L 3,-10 L 8,-3 Z', fill: '#5d9a52' }, g);
    },
    // Buck (Jul): a pair of branching antlers.
    (g) => {
      [-1, 1].forEach((side) => {
        svgEl('path', {
          d: `M ${side * 2},10 L ${side * 3},-6 M ${side * 3},-6 L ${side * 9},-12 M ${side * 3},-6 L ${side * 8},-2 M ${side * 3},0 L ${side * 7},4`,
          fill: 'none', stroke: '#8a6a44', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        }, g);
      });
    },
    // Sturgeon (Aug): a simple fish silhouette.
    (g) => {
      svgEl('path', { d: 'M -14,0 Q -6,-10 8,0 Q -6,10 -14,0 Z', fill: '#5a8aa6' }, g);
      svgEl('path', { d: 'M 8,0 L 16,-7 L 16,7 Z', fill: '#5a8aa6' }, g);
      svgEl('circle', { cx: -9, cy: -1, r: 1.3, fill: '#1a2430' }, g);
    },
    // Harvest/Corn (Sep): a corn cob with kernels and a husk leaf.
    (g) => {
      svgEl('path', { d: 'M -5,-15 Q 5,-15 5,0 Q 5,15 -5,15 Q -5,0 -5,-15 Z', fill: '#e8c84a' }, g);
      for (let row = -10; row <= 10; row += 5) {
        for (let col = -2; col <= 2; col += 4) svgEl('circle', { cx: col, cy: row, r: 1.1, fill: '#c9a428' }, g);
      }
      svgEl('path', { d: 'M -5,14 Q -16,10 -14,-2 Q -6,4 -5,14 Z', fill: '#7a9b4e' }, g);
    },
    // Hunter's (Oct): a bow and arrow.
    (g) => {
      svgEl('path', { d: 'M -8,-15 Q 4,0 -8,15', fill: 'none', stroke: '#8a6a44', 'stroke-width': 2 }, g);
      svgEl('line', { x1: -8, y1: -15, x2: -8, y2: 15, stroke: '#c9b48a', 'stroke-width': 1 }, g);
      svgEl('line', { x1: -8, y1: 0, x2: 15, y2: 0, stroke: '#5c4428', 'stroke-width': 1.6 }, g);
      svgEl('path', { d: 'M 15,0 L 10,-3 L 10,3 Z', fill: '#5c4428' }, g);
    },
    // Beaver (Nov): a body with a flat paddle tail.
    (g) => {
      svgEl('ellipse', { cx: -3, cy: 0, rx: 11, ry: 8, fill: '#8a6a44' }, g);
      svgEl('circle', { cx: -12, cy: -2, r: 5, fill: '#8a6a44' }, g);
      svgEl('path', { d: 'M 6,4 Q 18,2 18,10 Q 18,14 10,10 Z', fill: '#5c4428' }, g);
    },
    // Cold (Dec): a row of icicles hanging from a line.
    (g) => {
      svgEl('line', { x1: -15, y1: -8, x2: 15, y2: -8, stroke: '#6b9ac4', 'stroke-width': 1.5 }, g);
      [-10, -2, 6, 13].forEach((x, i) => {
        const len = 10 + (i % 2) * 6;
        svgEl('path', { d: `M ${x - 2},-8 L ${x + 2},-8 L ${x},${-8 + len} Z`, fill: '#a9cdea' }, g);
      });
    },
  ];

  function mountWheel(svgId, wrapId) {
    const svg = document.getElementById(svgId);
    const wrap = document.getElementById(wrapId);
    if (!svg || !wrap) return;
    svg.innerHTML = '';
    wrap.querySelectorAll('.diagram-label').forEach((el) => el.remove());
    const { W, H, cx, cy, wedgeR, iconR, labelR } = WHEEL;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    MONTH_MOON_NAMES.forEach((name, i) => {
      // -90 so January's wedge is centred at the top, like a clock face.
      const startDeg = -90 + i * 30 - 15;
      const endDeg = startDeg + 30;
      const midDeg = startDeg + 15;

      svgEl('path', { d: wedgePath(cx, cy, wedgeR, startDeg, endDeg), fill: SEASON_FILL[i], stroke: '#ffffff', 'stroke-width': 1.5 }, svg);

      const iconPos = pointAt(cx, cy, iconR, midDeg);
      const iconGroup = svgEl('g', { transform: `translate(${iconPos.x},${iconPos.y})` }, svg);
      MONTH_ICONS[i](iconGroup);

      const labelPos = pointAt(cx, cy, labelR, midDeg);
      const dx = Math.cos((midDeg * Math.PI) / 180);
      const label = document.createElement('span');
      label.className = 'diagram-label full-moon-wheel-label';
      if (dx > 0.15) label.classList.add('diagram-label--right');
      else if (dx < -0.15) label.classList.add('diagram-label--left');
      label.textContent = name;
      label.style.left = `${(labelPos.x / W) * 100}%`;
      label.style.top = `${(labelPos.y / H) * 100}%`;
      wrap.appendChild(label);
    });

    svgEl('circle', { cx, cy, r: wedgeR, fill: 'none', stroke: '#cdd7e1', 'stroke-width': 1.5 }, svg);
  }

  function formatMoonDate(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  }

  // Populates an existing empty <tbody> with one row per Full Moon this
  // year (date, traditional name, Blue Moon marker) — deps injects
  // MoonPhase (a window global on the real page) so this stays testable.
  function mountFullMoonList(tbodyId, year, deps) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = '';
    buildFullMoonList(year, deps).forEach((moon) => {
      const row = document.createElement('tr');
      const dateCell = document.createElement('td');
      dateCell.textContent = formatMoonDate(moon.date);
      const nameCell = document.createElement('td');
      nameCell.textContent = `${moon.name} Moon`;
      const flagCell = document.createElement('td');
      if (moon.isBlueMoon) {
        const flag = document.createElement('span');
        flag.className = 'blue-moon-flag';
        flag.textContent = 'Blue Moon';
        flagCell.appendChild(flag);
      }
      row.append(dateCell, nameCell, flagCell);
      tbody.appendChild(row);
    });
  }

  const api = {
    MONTH_MOON_NAMES,
    buildFullMoonList,
    mountWheel,
    mountFullMoonList,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.FullMoonNames = api;
  }
})();
