/**
 * The drawings for notes/crewed-missions-apollo.html, shared with its
 * picture questions (src/apolloQuestions.js): crewed missions' advantages
 * and disadvantages, the Saturn V, the three Apollo modules, the stepped
 * mission profile, four key missions and laser ranging. All drawn here,
 * no photographs; shapes, outlines and labels, never colour alone, carry
 * the information.
 */
(function () {
  const A = window.Apollo;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, CURVE, svgEl, clearDiagram, addLabel, panel } = D;
  const METAL = '#c9ced8';
  const DARK = '#5b6680';

  function arrowHead(svg, x, y, angle, colour) {
    const s = 9;
    svgEl('path', {
      d: `M${(x - s * Math.cos(angle - 0.45)).toFixed(1)},${(y - s * Math.sin(angle - 0.45)).toFixed(1)} L${x.toFixed(1)},${y.toFixed(1)} L${(x - s * Math.cos(angle + 0.45)).toFixed(1)},${(y - s * Math.sin(angle + 0.45)).toFixed(1)}`,
      fill: 'none',
      stroke: colour || CURVE,
      'stroke-width': 2,
    }, svg);
  }

  // ------------------------------------------------------------------
  // 11.29 Advantages and disadvantages of a crew
  // ------------------------------------------------------------------
  function drawProsCons(svg, wrap, highlight) {
    const on = new Set(highlight || []);
    clearDiagram(svg, wrap);
    panel(svg);
    svgEl('line', { x1: 320, x2: 320, y1: 24, y2: 340, stroke: MUTED, 'stroke-width': 1 }, svg);
    [[A.ADVANTAGES, 0, 'Advantages of a crew (+)', 'plus'], [A.DISADVANTAGES, 320, 'Disadvantages (!)', 'warn']].forEach(([items, dx, title, badge]) => {
      addLabel(svg, wrap, title, dx + 160, 34, 'diagram-label--tick diagram-label--strong');
      items.forEach((item, i) => {
        const y = 86 + 72 * i;
        const bx = dx + 24;
        if (on.has(item.key)) {
          svgEl('rect', { class: `am-highlight am-highlight-${item.key}`, x: dx + 6, y: y - 16, width: 306, height: 64, rx: 8, fill: 'none', stroke: CURVE, 'stroke-width': 3 }, svg);
        }
        if (badge === 'plus') {
          svgEl('circle', { class: 'am-advantage', cx: bx, cy: y + 14, r: 12, fill: 'none', stroke: INK, 'stroke-width': 2 }, svg);
          svgEl('path', { d: `M${bx - 6},${y + 14} L${bx + 6},${y + 14} M${bx},${y + 8} L${bx},${y + 20}`, stroke: INK, 'stroke-width': 2.5 }, svg);
        } else {
          svgEl('path', { class: 'am-disadvantage', d: `M${bx},${y} L${bx + 13},${y + 24} L${bx - 13},${y + 24} Z`, fill: 'none', stroke: INK, 'stroke-width': 2 }, svg);
          svgEl('path', { d: `M${bx},${y + 8} L${bx},${y + 16} M${bx},${y + 19} L${bx},${y + 21}`, stroke: INK, 'stroke-width': 2.5 }, svg);
        }
        addLabel(svg, wrap, item.main, bx + 20, y, 'diagram-label--tick diagram-label--strong diagram-label--right');
        addLabel(svg, wrap, item.detail, bx + 20, y + 30, 'diagram-label--tick diagram-label--right');
      });
    });
  }

  // ------------------------------------------------------------------
  // 11.30 The Saturn V
  // ------------------------------------------------------------------
  function drawSaturnV(svg, wrap) {
    clearDiagram(svg, wrap);
    panel(svg);
    const cx = 200;
    const parts = [
      { key: 'tower', top: 26, bottom: 58, label: 'launch escape tower', row: 40 },
      { key: 'cm', top: 58, bottom: 80, label: 'Command Module', row: 76 },
      { key: 'sm', top: 80, bottom: 108, label: 'Service Module', row: 112 },
      { key: 'lm', top: 108, bottom: 150, label: 'Lunar Module (folded inside)', row: 148 },
      { key: 'third', top: 150, bottom: 200, label: 'third stage: orbit, then to the Moon', row: 190 },
      { key: 'second', top: 200, bottom: 268, label: 'second stage', row: 240 },
      { key: 'first', top: 268, bottom: 378, label: 'first stage: lift-off', row: 320 },
    ];
    // Body.
    svgEl('path', { class: 'am-saturn-tower', d: `M${cx},26 L${cx},58 M${cx - 6},44 L${cx + 6},44`, stroke: INK, 'stroke-width': 3 }, svg);
    svgEl('path', { class: 'am-saturn-cm', d: `M${cx},58 L${cx + 14},80 L${cx - 14},80 Z`, fill: METAL, stroke: INK, 'stroke-width': 1.5 }, svg);
    svgEl('rect', { class: 'am-saturn-sm', x: cx - 15, y: 80, width: 30, height: 28, fill: DARK, stroke: INK, 'stroke-width': 1.5 }, svg);
    svgEl('path', { class: 'am-saturn-adapter', d: `M${cx - 15},108 L${cx + 15},108 L${cx + 24},150 L${cx - 24},150 Z`, fill: METAL, stroke: INK, 'stroke-width': 1.5 }, svg);
    svgEl('rect', { x: cx - 8, y: 118, width: 16, height: 22, fill: 'none', stroke: DARK, 'stroke-width': 1.5, 'stroke-dasharray': '3 2' }, svg);
    svgEl('rect', { class: 'am-saturn-stage', x: cx - 24, y: 150, width: 48, height: 50, fill: '#f4f6ff', stroke: INK, 'stroke-width': 1.5 }, svg);
    svgEl('rect', { class: 'am-saturn-stage', x: cx - 24, y: 200, width: 48, height: 68, fill: METAL, stroke: INK, 'stroke-width': 1.5 }, svg);
    svgEl('rect', { class: 'am-saturn-stage', x: cx - 24, y: 268, width: 48, height: 110, fill: '#f4f6ff', stroke: INK, 'stroke-width': 1.5 }, svg);
    [[-24, 200], [-24, 268], [-24, 150]].forEach(([dx, y]) => svgEl('line', { x1: cx + dx, x2: cx - dx, y1: y, y2: y, stroke: INK, 'stroke-width': 3 }, svg));
    [-14, 0, 14].forEach((dx) => svgEl('path', { d: `M${cx + dx - 5},378 L${cx + dx + 5},378 L${cx + dx + 8},396 L${cx + dx - 8},396 Z`, fill: DARK, stroke: INK, 'stroke-width': 1 }, svg));
    // Labels with leader lines.
    parts.forEach((p) => {
      const mid = (p.top + p.bottom) / 2;
      svgEl('path', { d: `M${cx + 28},${mid} L${cx + 60},${p.row} L${cx + 70},${p.row}`, fill: 'none', stroke: MUTED, 'stroke-width': 1 }, svg);
      addLabel(svg, wrap, p.label, cx + 76, p.row, 'diagram-label--tick diagram-label--right');
    });
    // Height bar.
    svgEl('line', { x1: 100, x2: 100, y1: 26, y2: 396, stroke: INK, 'stroke-width': 1.5 }, svg);
    arrowHead(svg, 100, 26, -Math.PI / 2, INK);
    arrowHead(svg, 100, 396, Math.PI / 2, INK);
    addLabel(svg, wrap, 'about', 110, 196, 'diagram-label--tick diagram-label--strong diagram-label--right');
    addLabel(svg, wrap, `${A.SATURN_V_HEIGHT_M} m`, 110, 228, 'diagram-label--tick diagram-label--strong diagram-label--right');
  }

  // ------------------------------------------------------------------
  // 11.30 The three modules
  // ------------------------------------------------------------------
  function drawModules(svg, wrap, chosen) {
    clearDiagram(svg, wrap);
    panel(svg);
    const xs = { cm: 110, sm: 320, lm: 530 };
    // Command Module: a cone with a heat shield base.
    svgEl('path', { class: 'am-module am-module-cm', d: `M${xs.cm},70 L${xs.cm + 55},160 L${xs.cm - 55},160 Z`, fill: METAL, stroke: INK, 'stroke-width': 2 }, svg);
    svgEl('rect', { x: xs.cm - 57, y: 160, width: 114, height: 10, rx: 4, fill: DARK, stroke: INK, 'stroke-width': 1.5 }, svg);
    svgEl('rect', { x: xs.cm - 10, y: 110, width: 20, height: 14, rx: 3, fill: '#1b2438', stroke: INK, 'stroke-width': 1 }, svg);
    // Service Module: a cylinder with an engine bell.
    svgEl('rect', { class: 'am-module am-module-sm', x: xs.sm - 55, y: 70, width: 110, height: 90, fill: DARK, stroke: INK, 'stroke-width': 2 }, svg);
    svgEl('path', { d: `M${xs.sm - 16},160 L${xs.sm + 16},160 L${xs.sm + 30},190 L${xs.sm - 30},190 Z`, fill: METAL, stroke: INK, 'stroke-width': 1.5 }, svg);
    [90, 115, 140].forEach((y) => svgEl('line', { x1: xs.sm - 55, x2: xs.sm + 55, y1: y, y2: y, stroke: '#3c4660', 'stroke-width': 1 }, svg));
    // Lunar Module: ascent stage on a legged descent stage.
    svgEl('path', { class: 'am-module am-module-lm', d: `M${xs.lm - 30},70 L${xs.lm + 30},70 L${xs.lm + 40},100 L${xs.lm - 40},100 Z`, fill: METAL, stroke: INK, 'stroke-width': 2 }, svg);
    svgEl('rect', { x: xs.lm - 45, y: 100, width: 90, height: 45, fill: '#d9b38c', stroke: INK, 'stroke-width': 2 }, svg);
    [[-45, -70], [45, 70]].forEach(([a, b]) => {
      svgEl('line', { x1: xs.lm + a, y1: 140, x2: xs.lm + b, y2: 185, stroke: INK, 'stroke-width': 2.5 }, svg);
      svgEl('ellipse', { cx: xs.lm + b, cy: 188, rx: 9, ry: 3, fill: INK }, svg);
    });
    addLabel(svg, wrap, 'top half: flies back up', xs.lm + 50, 58, 'diagram-label--tick diagram-label--left');
    addLabel(svg, wrap, 'bottom half: stays', xs.lm, 214, 'diagram-label--tick');
    A.MODULES.forEach((m) => {
      if (m.key === chosen) {
        svgEl('rect', { class: 'am-module-chosen', x: xs[m.key] - 96, y: 32, width: 192, height: 270, rx: 10, fill: 'none', stroke: CURVE, 'stroke-width': 3.5 }, svg);
      }
      // Two lines, so the bold chosen name fits inside its box on a phone.
      const cls = `diagram-label--tick${m.key === chosen ? ' diagram-label--strong' : ''}`;
      const [first, second] = m.name.split(' ');
      addLabel(svg, wrap, first, xs[m.key], 246, cls);
      addLabel(svg, wrap, second, xs[m.key], 276, cls);
    });
    addLabel(svg, wrap, 'heat shield', xs.cm, 194, 'diagram-label--tick');
    addLabel(svg, wrap, 'engine', xs.sm, 214, 'diagram-label--tick');
  }

  // ------------------------------------------------------------------
  // 11.30 The mission profile, one step at a time
  // ------------------------------------------------------------------
  const E = { x: 105, y: 175, r: 42 };
  const M = { x: 545, y: 175, r: 20 };

  function cubic(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return {
      x: u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      y: u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    };
  }

  const OUT = [[150, 140], [280, 40], [470, 60], [552, 130]];
  const BACK = [[552, 220], [470, 300], [280, 300], [150, 205]];

  function craft(svg, x, y, cls) {
    svgEl('path', { class: cls, d: `M${x - 8},${y + 6} L${x},${y - 9} L${x + 8},${y + 6} Z`, fill: CURVE, stroke: INK, 'stroke-width': 1.5 }, svg);
  }

  function drawProfile(svg, wrap, step) {
    clearDiagram(svg, wrap);
    panel(svg);
    const segs = {
      parking: step === 2,
      out: step === 3,
      lunar: step >= 4 && step <= 6,
      back: step === 7,
    };
    const lineAttrs = (on) => ({ fill: 'none', stroke: on ? CURVE : MUTED, 'stroke-width': on ? 3.5 : 1.5, 'stroke-dasharray': on ? '' : '5 5' });
    svgEl('circle', { class: `am-path-parking${segs.parking ? ' am-path-on' : ''}`, cx: E.x, cy: E.y, r: E.r + 22, ...lineAttrs(segs.parking) }, svg);
    svgEl('path', { class: `am-path-out${segs.out ? ' am-path-on' : ''}`, d: `M${OUT[0]} C${OUT[1]} ${OUT[2]} ${OUT[3]}`, ...lineAttrs(segs.out) }, svg);
    svgEl('circle', { class: `am-path-lunar${segs.lunar ? ' am-path-on' : ''}`, cx: M.x, cy: M.y, r: M.r + 24, ...lineAttrs(segs.lunar) }, svg);
    svgEl('path', { class: `am-path-back${segs.back ? ' am-path-on' : ''}`, d: `M${BACK[0]} C${BACK[1]} ${BACK[2]} ${BACK[3]}`, ...lineAttrs(segs.back) }, svg);
    svgEl('circle', { cx: E.x, cy: E.y, r: E.r, fill: '#2f6fb3', stroke: INK, 'stroke-width': 2 }, svg);
    svgEl('circle', { cx: M.x, cy: M.y, r: M.r, fill: METAL, stroke: INK, 'stroke-width': 2 }, svg);
    addLabel(svg, wrap, 'Earth', E.x, E.y + E.r + 46, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, 'Moon', M.x, M.y + M.r + 46, 'diagram-label--tick diagram-label--strong');
    const p = A.PROFILE[step - 1];
    addLabel(svg, wrap, `Step ${step} of ${A.PROFILE.length}: ${p.name}`, 320, 26, 'diagram-label--tick diagram-label--strong');
    // Where the spacecraft is at this step.
    const at = {
      1: { x: E.x + E.r * 0.7, y: E.y - E.r * 0.7 - 6 },
      2: { x: E.x + 64 * Math.cos(-1.0), y: E.y + 64 * Math.sin(-1.0) },
      3: cubic(...OUT, 0.5),
      4: { x: M.x - 44, y: M.y },
      7: cubic(...BACK, 0.5),
    }[step];
    if (at) craft(svg, at.x, at.y, 'am-craft');
    if (step === 1) svgEl('path', { class: 'am-launch-arc', d: `M${E.x + E.r * 0.7},${E.y - E.r * 0.7} Q${E.x + 70},${E.y - 80} ${E.x + 64 * Math.cos(-1.0)},${E.y + 64 * Math.sin(-1.0)}`, fill: 'none', stroke: CURVE, 'stroke-width': 3 }, svg);
    if (step === 5 || step === 6) {
      craft(svg, M.x, M.y - M.r - 24, 'am-craft am-csm');
      const lmY = step === 5 ? M.y - M.r - 6 : M.y - M.r - 18;
      svgEl('rect', { class: 'am-lm-marker', x: M.x - 5, y: lmY - 5, width: 10, height: 10, fill: INK, stroke: INK }, svg);
      addLabel(svg, wrap, step === 5 ? 'two land; one stays in orbit' : 'top half flies up to dock', 610, 302, 'diagram-label--tick diagram-label--left');
    }
    if (step === 8) {
      const sx = E.x - E.r * 0.7;
      const sy = E.y + E.r * 0.7;
      svgEl('path', { class: 'am-capsule', d: `M${sx - 7},${sy + 10} L${sx},${sy - 2} L${sx + 7},${sy + 10} Z`, fill: METAL, stroke: INK, 'stroke-width': 1.5 }, svg);
      svgEl('path', { class: 'am-parachute', d: `M${sx - 16},${sy - 14} Q${sx},${sy - 34} ${sx + 16},${sy - 14} Z`, fill: '#f4f6ff', stroke: INK, 'stroke-width': 1.5 }, svg);
      addLabel(svg, wrap, 'only the Command Module returns', E.x - 20, 300, 'diagram-label--tick diagram-label--right');
    }
    if (step === 3 || step === 7) addLabel(svg, wrap, 'about 3 days', 320, step === 3 ? 92 : 266, 'diagram-label--tick');
  }

  // ------------------------------------------------------------------
  // 11.30 Four key missions
  // ------------------------------------------------------------------
  function drawMissions(svg, wrap) {
    clearDiagram(svg, wrap);
    panel(svg);
    const tags = { 'apollo-8': 'first to orbit the Moon', 'apollo-11': 'first landing', 'apollo-13': 'safe return', 'apollo-17': 'last landing' };
    A.MISSIONS.forEach((m, i) => {
      const cx = 80 + 160 * i;
      const cy = 90;
      svgEl('rect', { class: 'am-mission', x: cx - 72, y: 20, width: 144, height: 270, rx: 10, fill: 'none', stroke: MUTED, 'stroke-width': 1.5 }, svg);
      if (m.key === 'apollo-8') {
        svgEl('circle', { cx, cy, r: 26, fill: METAL, stroke: INK, 'stroke-width': 1.5 }, svg);
        svgEl('ellipse', { cx, cy, rx: 46, ry: 16, fill: 'none', stroke: CURVE, 'stroke-width': 2.5, 'stroke-dasharray': '6 4' }, svg);
      } else if (m.key === 'apollo-11' || m.key === 'apollo-17') {
        svgEl('path', { d: `M${cx - 50},${cy + 30} Q${cx},${cy + 18} ${cx + 50},${cy + 30} L${cx + 50},${cy + 40} L${cx - 50},${cy + 40} Z`, fill: METAL, stroke: INK, 'stroke-width': 1.5 }, svg);
        svgEl('path', { d: `M${cx - 12},${cy - 18} L${cx + 12},${cy - 18} L${cx + 16},${cy - 6} L${cx - 16},${cy - 6} Z`, fill: METAL, stroke: INK, 'stroke-width': 1.5 }, svg);
        svgEl('rect', { x: cx - 18, y: cy - 6, width: 36, height: 18, fill: '#d9b38c', stroke: INK, 'stroke-width': 1.5 }, svg);
        svgEl('path', { d: `M${cx - 18},${cy + 10} L${cx - 28},${cy + 24} M${cx + 18},${cy + 10} L${cx + 28},${cy + 24}`, stroke: INK, 'stroke-width': 2 }, svg);
        if (m.key === 'apollo-17') {
          // The rover.
          svgEl('rect', { x: cx + 22, y: cy + 4, width: 22, height: 8, fill: DARK, stroke: INK, 'stroke-width': 1 }, svg);
          [cx + 26, cx + 40].forEach((wx) => svgEl('circle', { cx: wx, cy: cy + 15, r: 4, fill: INK }, svg));
        }
      } else {
        // Apollo 13: the Service Module with a burst, and the way home.
        svgEl('rect', { x: cx - 18, y: cy - 22, width: 36, height: 40, fill: DARK, stroke: INK, 'stroke-width': 1.5 }, svg);
        svgEl('path', { d: `M${cx + 18},${cy - 8} l10,-8 l-2,9 l10,1 l-9,5 l6,8 l-10,-3 l-3,9 l-3,-9`, fill: 'none', stroke: INK, 'stroke-width': 2 }, svg);
        svgEl('path', { d: `M${cx - 40},${cy + 40} Q${cx},${cy + 64} ${cx + 40},${cy + 40}`, fill: 'none', stroke: CURVE, 'stroke-width': 2.5 }, svg);
        arrowHead(svg, cx - 40, cy + 40, Math.PI * 1.15);
      }
      addLabel(svg, wrap, m.name, cx, 180, 'diagram-label--tick diagram-label--strong');
      addLabel(svg, wrap, String(m.year), cx, 212, 'diagram-label--tick');
      const words = tags[m.key].split(' ');
      const half = Math.ceil(words.length / 2);
      addLabel(svg, wrap, words.slice(0, half).join(' '), cx, 244, 'diagram-label--tick');
      if (words.length > half) addLabel(svg, wrap, words.slice(half).join(' '), cx, 272, 'diagram-label--tick');
    });
  }

  // ------------------------------------------------------------------
  // Laser ranging to Apollo's reflectors
  // ------------------------------------------------------------------
  function drawLaser(svg, wrap) {
    clearDiagram(svg, wrap);
    panel(svg);
    svgEl('path', { d: 'M20,240 Q80,120 20,0', fill: '#2f6fb3', stroke: INK, 'stroke-width': 2 }, svg);
    svgEl('rect', { x: 52, y: 104, width: 30, height: 18, rx: 3, fill: METAL, stroke: INK, 'stroke-width': 1.5, transform: 'rotate(-10 67 113)' }, svg);
    addLabel(svg, wrap, 'telescope', 66, 150, 'diagram-label--tick diagram-label--strong');
    svgEl('path', { d: 'M640,30 Q560,120 640,210', fill: METAL, stroke: INK, 'stroke-width': 2 }, svg);
    svgEl('rect', { class: 'am-reflector', x: 572, y: 104, width: 14, height: 16, fill: '#1b2438', stroke: INK, 'stroke-width': 1.5 }, svg);
    addLabel(svg, wrap, 'reflector', 578, 150, 'diagram-label--tick diagram-label--strong');
    svgEl('line', { class: 'am-laser', x1: 88, x2: 566, y1: 106, y2: 106, stroke: CURVE, 'stroke-width': 2.5 }, svg);
    arrowHead(svg, 566, 106, 0);
    svgEl('line', { class: 'am-laser', x1: 566, x2: 88, y1: 120, y2: 120, stroke: CURVE, 'stroke-width': 2.5, 'stroke-dasharray': '8 5' }, svg);
    arrowHead(svg, 88, 120, Math.PI);
    addLabel(svg, wrap, 'pulse out (solid)', 330, 82, 'diagram-label--tick');
    addLabel(svg, wrap, 'reflected straight back (dashed)', 330, 144, 'diagram-label--tick');
    addLabel(svg, wrap, `${A.EARTH_MOON_KM.toLocaleString('en-GB')} km each way (data sheet)`, 330, 186, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, `round trip: about ${A.laserRoundTripSeconds().toFixed(1)} s`, 330, 218, 'diagram-label--tick diagram-label--strong');
  }

  window.ApolloDrawing = { drawProsCons, drawSaturnV, drawModules, drawProfile, drawMissions, drawLaser };
})();
