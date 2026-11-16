(function () {
  const N = window.StarNames;
  const SP = window.StarPatterns;
  const D = window.SpectrumDrawing;
  const { INK, MUTED, svgEl, clearDiagram, addLabel, panel } = D;

  const CURRICULUM_UNITS = ['u4.13'];
  const STAR = '#fff6d8';

  function seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function starfield(svg, w, h, n, seed) {
    const rand = seeded(seed);
    for (let i = 0; i < n; i += 1) svgEl('circle', { cx: (6 + rand() * (w - 12)).toFixed(1), cy: (6 + rand() * (h - 12)).toFixed(1), r: 0.8, fill: '#fff', opacity: 0.35 }, svg);
  }

  function el(tag, text, attrs = {}) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
  }

  // ------------------------------------------------------------------
  // 1. One star, four names
  // ------------------------------------------------------------------

  const FORMS = [
    { id: 'proper', name: 'Proper name', label: (s) => s.proper },
    { id: 'bayer', name: 'Bayer', label: (s) => s.bayerShort },
    { id: 'flamsteed', name: 'Flamsteed', label: (s) => `${s.flamsteed} Ori` },
    { id: 'hd', name: 'Catalogue (HD)', label: (s) => s.hdName },
  ];
  // Where each star's label sits, as an offset in viewBox units, and which side it runs.
  const LABEL_AT = {
    betelgeuse: [-16, -4, 'left'],
    bellatrix: [16, -4, 'right'],
    meissa: [0, -24, 'centre'],
    mintaka: [14, -16, 'right'],
    alnilam: [0, 26, 'centre'],
    alnitak: [-14, -16, 'left'],
    saiph: [-16, 6, 'left'],
    rigel: [16, 6, 'right'],
  };
  const nameState = { form: 'proper', chosen: 'betelgeuse' };
  const STARS = N.orionStars();

  function layout() {
    const centre = SP.centreOf(STARS);
    const pts = STARS.map((s) => ({ s, p: SP.project(s, centre) }));
    const xs = pts.map(({ p }) => p.x);
    const ys = pts.map(({ p }) => p.y);
    const scale = Math.min(380 / (Math.max(...xs) - Math.min(...xs)), 300 / (Math.max(...ys) - Math.min(...ys)));
    const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
    const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    const out = {};
    pts.forEach(({ s, p }) => {
      out[s.key] = { x: 320 + (p.x - cx) * scale, y: 190 - (p.y - cy) * scale };
    });
    return out;
  }
  const POS = layout();

  function drawOrion() {
    const svg = document.getElementById('orion-diagram');
    const wrap = document.getElementById('orion-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    starfield(svg, 640, 380, 60, 41);
    const form = FORMS.find((f) => f.id === nameState.form);
    const orion = SP.PATTERNS.find((p) => p.id === 'orion');
    orion.lines.forEach(([a, b]) => svgEl('line', { x1: POS[a].x.toFixed(1), y1: POS[a].y.toFixed(1), x2: POS[b].x.toFixed(1), y2: POS[b].y.toFixed(1), stroke: MUTED, 'stroke-width': 1.2, opacity: 0.7 }, svg));
    STARS.forEach((s) => {
      const p = POS[s.key];
      const r = Math.max(2.5, 3 + (3.5 - s.mag) * 2.2);
      svgEl('circle', { class: 'cn-star', cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: r.toFixed(1), fill: STAR, 'data-star': s.key }, svg);
      if (s.key === nameState.chosen) {
        svgEl('circle', { class: 'cn-chosen-ring', cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: (r + 7).toFixed(1), fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-dasharray': '4 3' }, svg);
      }
      const hit = svgEl('circle', { class: 'cn-hit', cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 16, fill: 'transparent', tabindex: 0, role: 'button', 'data-star': s.key, 'aria-label': `${s.proper}: show all its names`, 'aria-pressed': String(s.key === nameState.chosen) }, svg);
      // Tapping a star redraws the diagram, so stop the tap reaching the
      // Enlarge handler, which would no longer find the (replaced) star.
      hit.addEventListener('click', (e) => {
        e.stopPropagation();
        choose(s.key);
      });
      hit.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          choose(s.key);
        }
      });
      const [dx, dy, side] = LABEL_AT[s.key];
      const cls = `diagram-label--tick${s.key === nameState.chosen ? ' diagram-label--strong' : ''}${side === 'left' ? ' diagram-label--left' : side === 'right' ? ' diagram-label--right' : ''}`;
      addLabel(svg, wrap, form.label(s), p.x + dx, p.y + dy, `${cls} cn-star-label`);
    });
    addLabel(svg, wrap, 'N ↑   E ←', 590, 22, 'diagram-label--tick');
    svg.dataset.form = nameState.form;
    svg.dataset.chosen = nameState.chosen;
    document.querySelectorAll('#form-buttons button').forEach((b) => {
      const on = b.dataset.form === nameState.form;
      b.classList.toggle('preset-button-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    renderCard();
  }

  function renderCard() {
    const s = STARS.find((x) => x.key === nameState.chosen);
    const card = document.getElementById('star-card');
    card.replaceChildren();
    [
      ['Proper name', s.proper],
      ['Bayer name', `${s.bayerFull} (${s.bayerShort})`],
      ['Flamsteed name', s.flamsteedName],
      ['Catalogue number', `${s.hdName}, in the Henry Draper Catalogue`],
      ['Apparent magnitude', s.mag.toFixed(2)],
      ['Brightness among these eight', `${N.ordinal(s.brightnessRank)} brightest; its Greek letter is the ${N.ordinal(s.letterOrder)} letter`],
    ].forEach(([k, v]) => card.append(el('dt', k), el('dd', v)));
  }

  function choose(key) {
    nameState.chosen = key;
    drawOrion();
  }

  function wireNames() {
    const holder = document.getElementById('form-buttons');
    FORMS.forEach((f) => {
      const b = el('button', f.name, { type: 'button', class: 'preset-button', 'data-form': f.id });
      b.addEventListener('click', () => {
        nameState.form = f.id;
        drawOrion();
      });
      holder.appendChild(b);
    });
    drawOrion();
  }

  // ------------------------------------------------------------------
  // 2. Reading a Bayer name
  // ------------------------------------------------------------------

  function fillGreekTable() {
    const body = document.querySelector('#greek-table tbody');
    body.replaceChildren();
    N.GREEK.slice(0, 8).forEach((g) => {
      const tr = el('tr');
      tr.append(el('td', g.symbol), el('td', g.name), el('td', g.order === 1 ? 'brightest' : `${N.ordinal(g.order)} brightest`));
      body.appendChild(tr);
    });
  }

  function drawOrder() {
    const svg = document.getElementById('order-diagram');
    const wrap = document.getElementById('order-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    const rows = [...STARS].sort((a, b) => a.letterOrder - b.letterOrder);
    const X0 = 200;
    const len = (mag) => (4 - mag) * 88;
    addLabel(svg, wrap, 'in Greek-letter order', 20, 20, 'diagram-label--tick diagram-label--strong diagram-label--right');
    addLabel(svg, wrap, 'longer bar = brighter', 620, 20, 'diagram-label--tick diagram-label--left');
    rows.forEach((s, k) => {
      const y = 52 + k * 34;
      svgEl('rect', { class: 'cn-bar', 'data-star': s.key, x: X0, y: y - 9, width: len(s.mag).toFixed(1), height: 18, fill: '#ffd36b', stroke: INK, 'stroke-width': 0.8 }, svg);
      addLabel(svg, wrap, `${N.greek(s.bayer).symbol} ${s.proper}`, 20, y, 'diagram-label--tick diagram-label--right');
      addLabel(svg, wrap, `${N.ordinal(s.brightnessRank)}`, X0 + len(s.mag) + 8, y, `diagram-label--tick diagram-label--right${s.brightnessRank !== s.letterOrder ? ' diagram-label--strong' : ''}`);
    });
  }

  // ------------------------------------------------------------------
  // 3. Messier and NGC catalogues
  // ------------------------------------------------------------------

  const objState = { chosen: 'm42' };

  function fillCatalogueTable() {
    const body = document.querySelector('#catalogue-table tbody');
    body.replaceChildren();
    N.DEEP_SKY.forEach((o) => {
      const tr = el('tr', undefined, { 'data-id': o.id });
      tr.append(el('td', o.messier ? `M${o.messier}` : '—'), el('td', o.ngc ? `NGC ${o.ngc}` : '—'), el('td', o.name), el('td', o.type), el('td', o.constellation), el('td', o.mag.toFixed(1)));
      body.appendChild(tr);
    });
  }

  function drawType(svg, type, cx, cy) {
    const rand = seeded(type.length * 7 + 3);
    if (type === 'open cluster') {
      for (let i = 0; i < 26; i += 1) {
        const a = rand() * Math.PI * 2;
        const d = rand() * 90;
        svgEl('circle', { class: 'cn-obj', cx: (cx + d * Math.cos(a)).toFixed(1), cy: (cy + d * 0.8 * Math.sin(a)).toFixed(1), r: (1.5 + rand() * 3.5).toFixed(1), fill: '#dbe8ff' }, svg);
      }
    } else if (type === 'globular cluster') {
      for (let i = 0; i < 420; i += 1) {
        const a = rand() * Math.PI * 2;
        const d = 70 * Math.pow(rand(), 1.8);
        svgEl('circle', { class: 'cn-obj', cx: (cx + d * Math.cos(a)).toFixed(1), cy: (cy + d * Math.sin(a)).toFixed(1), r: 1.3, fill: '#fff1cc', opacity: 0.85 }, svg);
      }
    } else if (type === 'nebula') {
      [[0, 0, 90, 60, 0.35], [-30, 10, 60, 40, 0.3], [34, -12, 50, 34, 0.35], [6, 4, 30, 20, 0.5]].forEach(([dx, dy, rx, ry, op]) => svgEl('ellipse', { class: 'cn-obj', cx: cx + dx, cy: cy + dy, rx, ry, fill: '#cfe3d2', opacity: op }, svg));
      [[-6, 2], [4, -4], [10, 6], [-2, 8]].forEach(([dx, dy]) => svgEl('circle', { cx: cx + dx, cy: cy + dy, r: 2.5, fill: '#fff' }, svg));
    } else if (type === 'planetary nebula') {
      svgEl('ellipse', { class: 'cn-obj', cx, cy, rx: 60, ry: 46, fill: 'none', stroke: '#cfe3d2', 'stroke-width': 18, opacity: 0.75 }, svg);
      svgEl('circle', { cx, cy, r: 3, fill: '#fff' }, svg);
    } else if (type === 'supernova remnant') {
      for (let i = 0; i < 16; i += 1) {
        const a0 = rand() * Math.PI * 2;
        let x = cx;
        let y = cy;
        let d = `M${x},${y}`;
        for (let k = 0; k < 5; k += 1) {
          x += 16 * Math.cos(a0 + (rand() - 0.5));
          y += 12 * Math.sin(a0 + (rand() - 0.5));
          d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
        }
        svgEl('path', { class: 'cn-obj', d, fill: 'none', stroke: '#ffcf9f', 'stroke-width': 2, opacity: 0.8 }, svg);
      }
      svgEl('ellipse', { cx, cy, rx: 70, ry: 52, fill: '#cfe3d2', opacity: 0.18 }, svg);
    } else {
      svgEl('ellipse', { class: 'cn-obj', cx, cy, rx: 120, ry: 50, fill: '#e6e9f5', opacity: 0.12, transform: `rotate(-25 ${cx} ${cy})` }, svg);
      const g = svgEl('g', { transform: `translate(${cx} ${cy}) rotate(-25) scale(1 0.45)` }, svg);
      for (let arm = 0; arm < 2; arm += 1) {
        let d = '';
        for (let t = 0; t <= 1.001; t += 0.05) {
          const th = arm * Math.PI + t * 3.4;
          const r = 14 + t * 100;
          d += `${t === 0 ? 'M' : ' L'}${(r * Math.cos(th)).toFixed(1)},${(r * Math.sin(th)).toFixed(1)}`;
        }
        svgEl('path', { class: 'cn-obj', d, fill: 'none', stroke: '#e6e9f5', 'stroke-width': 10, opacity: 0.5 }, g);
      }
      svgEl('circle', { class: 'cn-obj', cx: 0, cy: 0, r: 22, fill: '#fff4dc' }, g);
    }
  }

  function drawObject() {
    const svg = document.getElementById('object-diagram');
    const wrap = document.getElementById('object-diagram-wrap');
    clearDiagram(svg, wrap);
    panel(svg);
    starfield(svg, 640, 300, 40, 47);
    const o = N.DEEP_SKY.find((x) => x.id === objState.chosen);
    drawType(svg, o.type, 320, 124);
    const ids = [o.messier ? `M${o.messier}` : 'no M number', o.ngc ? `NGC ${o.ngc}` : 'no NGC number'].join(' = ');
    addLabel(svg, wrap, ids, 320, 236, 'diagram-label--tick diagram-label--strong');
    addLabel(svg, wrap, `${o.name}: ${o.type}`, 320, 264, 'diagram-label--tick');
    addLabel(svg, wrap, `in ${o.constellation}, magnitude ${o.mag.toFixed(1)}`, 320, 292, 'diagram-label--tick');
    addLabel(svg, wrap, 'drawn, not a photograph', 16, 20, 'diagram-label--tick diagram-label--right');
    svg.dataset.chosen = o.id;
    svg.dataset.type = o.type;
    document.querySelectorAll('#object-buttons button').forEach((b) => {
      const on = b.dataset.object === o.id;
      b.classList.toggle('preset-button-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    document.querySelectorAll('#catalogue-table tbody tr').forEach((tr) => {
      const on = tr.dataset.id === o.id;
      tr.classList.toggle('cn-row--chosen', on);
      if (on) tr.setAttribute('aria-current', 'true');
      else tr.removeAttribute('aria-current');
    });
  }

  function wireObjects() {
    const holder = document.getElementById('object-buttons');
    N.DEEP_SKY.forEach((o) => {
      const b = el('button', o.label, { type: 'button', class: 'preset-button', 'data-object': o.id });
      b.addEventListener('click', () => {
        objState.chosen = o.id;
        drawObject();
      });
      holder.appendChild(b);
    });
    drawObject();
  }

  // ------------------------------------------------------------------

  function renderCoverage() {
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    document.getElementById('coverage').textContent = 'Covers: ' + subtopics.map((x) => `${x.id} ${x.title}`).join(', ');
  }

  wireNames();
  fillGreekTable();
  drawOrder();
  fillCatalogueTable();
  wireObjects();
  renderCoverage();
  Glossary.init({
    genitive:
      'The genitive: the Latin form of a name that means "of", so Orionis means "of Orion" and Alpha Orionis means "Alpha of Orion". Some change a lot: Canis Major becomes Canis Majoris.',
  });
  QuizUI.mount(StarNamesQuestions.makeQuestions(N));
})();
