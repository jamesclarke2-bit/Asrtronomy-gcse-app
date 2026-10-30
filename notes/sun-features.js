(function () {
  const CURRICULUM_UNITS = ['u2.11', 'u2.4', 'u2.5', 'u2.14', 'u2.12', 'u2.13'];

  const butterflyCanvas = document.getElementById('butterfly-graph');
  const butterflyCtx = butterflyCanvas.getContext('2d');
  const butterflyYearSlider = document.getElementById('butterfly-year-slider');
  const butterflyYearLabel = document.getElementById('butterfly-year-label');
  const butterflyReadout = document.getElementById('butterfly-readout');

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    const subtopics = CURRICULUM_UNITS.map(Curriculum.getSubtopic);
    coverageEl.textContent = 'Covers: ' + subtopics.map((s) => `${s.id} ${s.title}`).join(', ');
  }

  // --- Butterfly diagram --------------------------------------------
  // Three successive cycles (schematic — see src/butterflyDiagram.js for
  // the shared start-latitude/cycle-length model this and the practice
  // questions both use), each with a scatter of sunspots in both
  // hemispheres, randomly jittered around the smooth envelope so the
  // plot reads as an actual scatter rather than a clean curve.
  const BUTTERFLY_CYCLE_COUNT = 3;
  const BUTTERFLY_MAX_YEAR = BUTTERFLY_CYCLE_COUNT * ButterflyDiagram.CYCLE_LENGTH_YEARS;
  const BUTTERFLY_POINTS_PER_CYCLE = 90;

  function seededRandom(seed) {
    // Deterministic (not Math.random()) so the scatter doesn't
    // reshuffle itself on every reload.
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  const BUTTERFLY_POINTS = (function precomputeButterflyPoints() {
    const points = [];
    const rand = seededRandom(42);
    for (let cycle = 0; cycle < BUTTERFLY_CYCLE_COUNT; cycle++) {
      const cycleStartYear = cycle * ButterflyDiagram.CYCLE_LENGTH_YEARS;
      for (let i = 0; i < BUTTERFLY_POINTS_PER_CYCLE; i++) {
        const t = rand() * ButterflyDiagram.CYCLE_LENGTH_YEARS;
        const envelope = ButterflyDiagram.latitudeEnvelopeDeg(t);
        const jitter = (rand() - 0.5) * 6;
        const hemisphere = rand() < 0.5 ? 1 : -1;
        points.push({ year: cycleStartYear + t, latitude: hemisphere * Math.max(1, envelope + jitter) });
      }
    }
    return points;
  })();

  function drawButterfly(selectedYear) {
    const width = butterflyCanvas.width;
    const height = butterflyCanvas.height;
    const marginLeft = 45;
    const marginRight = 15;
    const marginTop = 15;
    const marginBottom = 30;
    const plotWidth = width - marginLeft - marginRight;
    const plotHeight = height - marginTop - marginBottom;
    const minLat = -40;
    const maxLat = 40;

    const xForYear = (year) => marginLeft + (year / BUTTERFLY_MAX_YEAR) * plotWidth;
    const yForLat = (lat) => marginTop + (1 - (lat - minLat) / (maxLat - minLat)) * plotHeight;

    butterflyCtx.clearRect(0, 0, width, height);

    // Gridlines: latitude every 10 degrees, years at each cycle boundary
    butterflyCtx.strokeStyle = '#e5e9ee';
    butterflyCtx.fillStyle = '#8a97a5';
    butterflyCtx.font = '11px sans-serif';
    butterflyCtx.textAlign = 'right';
    butterflyCtx.textBaseline = 'middle';
    for (let lat = minLat; lat <= maxLat; lat += 10) {
      const y = yForLat(lat);
      butterflyCtx.beginPath();
      butterflyCtx.moveTo(marginLeft, y);
      butterflyCtx.lineTo(width - marginRight, y);
      butterflyCtx.stroke();
      butterflyCtx.fillText(`${lat}°`, marginLeft - 8, y);
    }
    butterflyCtx.strokeStyle = '#b8c2cc';
    butterflyCtx.lineWidth = 1.5;
    butterflyCtx.beginPath();
    butterflyCtx.moveTo(marginLeft, yForLat(0));
    butterflyCtx.lineTo(width - marginRight, yForLat(0));
    butterflyCtx.stroke();
    butterflyCtx.lineWidth = 1;

    butterflyCtx.textAlign = 'center';
    butterflyCtx.textBaseline = 'top';
    for (let cycle = 0; cycle <= BUTTERFLY_CYCLE_COUNT; cycle++) {
      const year = cycle * ButterflyDiagram.CYCLE_LENGTH_YEARS;
      butterflyCtx.fillText(String(year), xForYear(year), height - marginBottom + 6);
    }

    // The scatter itself
    BUTTERFLY_POINTS.forEach(({ year, latitude }) => {
      butterflyCtx.beginPath();
      butterflyCtx.arc(xForYear(year), yForLat(latitude), 2.3, 0, Math.PI * 2);
      butterflyCtx.fillStyle = latitude >= 0 ? '#f5a623' : '#c0674a';
      butterflyCtx.fill();
    });

    // Selected-year marker, following the smooth envelope in both
    // hemispheres so it's easy to read a value straight off it.
    const yearsIntoCycle = selectedYear % ButterflyDiagram.CYCLE_LENGTH_YEARS;
    const envelope = ButterflyDiagram.latitudeEnvelopeDeg(yearsIntoCycle);
    const markerX = xForYear(selectedYear);
    butterflyCtx.strokeStyle = '#173d75';
    butterflyCtx.lineWidth = 1.5;
    butterflyCtx.setLineDash([4, 3]);
    butterflyCtx.beginPath();
    butterflyCtx.moveTo(markerX, marginTop);
    butterflyCtx.lineTo(markerX, height - marginBottom);
    butterflyCtx.stroke();
    butterflyCtx.setLineDash([]);
    [envelope, -envelope].forEach((lat) => {
      butterflyCtx.beginPath();
      butterflyCtx.arc(markerX, yForLat(lat), 5, 0, Math.PI * 2);
      butterflyCtx.fillStyle = '#2a6bd6';
      butterflyCtx.fill();
      butterflyCtx.strokeStyle = '#173d75';
      butterflyCtx.lineWidth = 1.5;
      butterflyCtx.stroke();
    });

    butterflyCtx.fillStyle = '#555';
    butterflyCtx.font = '11px sans-serif';
    butterflyCtx.textAlign = 'center';
    butterflyCtx.textBaseline = 'top';
    butterflyCtx.fillText('Year', width / 2, height - marginBottom + 18);
    butterflyCtx.save();
    butterflyCtx.translate(14, height / 2);
    butterflyCtx.rotate(-Math.PI / 2);
    butterflyCtx.textAlign = 'center';
    butterflyCtx.textBaseline = 'middle';
    butterflyCtx.fillText('Latitude', 0, 0);
    butterflyCtx.restore();
  }

  function updateButterfly() {
    const selectedYear = Number(butterflyYearSlider.value);
    butterflyYearLabel.textContent = String(selectedYear);
    const yearsIntoCycle = selectedYear % ButterflyDiagram.CYCLE_LENGTH_YEARS;
    const cycleNumber = Math.floor(selectedYear / ButterflyDiagram.CYCLE_LENGTH_YEARS) + 1;
    const envelope = ButterflyDiagram.latitudeEnvelopeDeg(yearsIntoCycle);
    butterflyReadout.textContent =
      `Cycle ${cycleNumber}, ${yearsIntoCycle} year${yearsIntoCycle === 1 ? '' : 's'} in: sunspots typically near ±${envelope.toFixed(0)}° latitude.`;
    drawButterfly(selectedYear);
  }

  // --- The Sun's structure: label leader lines ----------------------------
  // The six rings themselves are static markup (each is its own
  // .glossary-toggle, unchanged); only the leader-line-and-label
  // placement is drawn here, via the shared RingDiagramLabels geometry
  // every such diagram on the site now uses (see src/ringDiagramLabels.js):
  // the ring sits to the left of its box, every layer's name sits in a
  // single left-aligned column to the right, ordered top to bottom from
  // the outermost layer (corona) down to the centre (core).
  const SUN_STRUCTURE_SVG_NS = 'http://www.w3.org/2000/svg';
  function sunSvgEl(tag, attrs, parent) {
    const el = document.createElementNS(SUN_STRUCTURE_SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (parent) parent.appendChild(el);
    return el;
  }
  const SUN_STRUCTURE_LAYERS = [
    { name: 'Corona', radius: 200 },
    { name: 'Chromosphere', radius: 170 },
    { name: 'Photosphere', radius: 140 },
    { name: 'Convective zone', radius: 105 },
    { name: 'Radiative zone', radius: 65 },
    { name: 'Core', radius: 30 },
  ];
  const SUN_STRUCTURE_GEOMETRY = { cx: 224, cy: 290, outerRadius: 200, width: 648, height: 580, labelX: 448 };
  function drawSunStructureLabels() {
    const svg = document.getElementById('sun-structure');
    const wrap = document.getElementById('sun-structure-wrap');
    const rows = RingDiagramLabels.layoutRingColumn({ ...SUN_STRUCTURE_GEOMETRY, layers: SUN_STRUCTURE_LAYERS });
    const leaders = sunSvgEl('g', { stroke: '#8a97a5', 'stroke-width': 1, 'stroke-dasharray': '3 2', 'pointer-events': 'none' }, svg);
    rows.forEach((row) => {
      sunSvgEl('line', { x1: row.dotX, y1: row.dotY, x2: row.labelX, y2: row.labelY }, leaders);
      sunSvgEl('circle', { cx: row.dotX, cy: row.dotY, r: 3, fill: '#8a97a5' }, leaders);
      const label = document.createElement('span');
      label.className = 'ring-diagram-label';
      label.style.left = `${row.leftPercent}%`;
      label.style.top = `${row.topPercent}%`;
      label.textContent = row.name;
      wrap.appendChild(label);
    });
  }

  // --- The core's panel: the proton-proton chain, step by step -----------
  // First draft, to be checked by the teacher. Each step is drawn fresh
  // into the same <svg> (nuclei as labelled circles, reactants on the
  // left, products on the right of an arrow); a lane per parallel
  // reaction, since steps 1 and 2 each happen twice to supply step 3's
  // two helium-3 nuclei.
  const PARTICLE_STYLE = {
    p: { r: 18, fill: '#f5a623', stroke: 'none', label: 'p' },
    d: { r: 18, fill: '#e8631a', stroke: 'none', label: 'd' },
    'He-3': { r: 18, fill: '#2a6bd6', stroke: 'none', label: 'He-3' },
    'He-4': { r: 18, fill: '#173d75', stroke: 'none', label: 'He-4' },
    'e+': { r: 12, fill: '#c0392b', stroke: 'none', label: 'e⁺' },
    nu: { r: 12, fill: 'none', stroke: '#8a97a5', label: 'ν' },
    gamma: { r: 12, fill: 'none', stroke: '#444', label: 'γ' },
  };

  const FUSION_CHAIN_STEPS = [
    {
      caption: 'Step 1 of 3: two pairs of protons fuse into two deuterium nuclei, each releasing a positron and a neutrino.',
      lanes: [
        { reactants: ['p', 'p'], products: ['d', 'e+', 'nu'] },
        { reactants: ['p', 'p'], products: ['d', 'e+', 'nu'] },
      ],
    },
    {
      caption: 'Step 2 of 3: each deuterium nucleus fuses with a proton to make helium-3 and a gamma ray.',
      lanes: [
        { reactants: ['d', 'p'], products: ['He-3', 'gamma'] },
        { reactants: ['d', 'p'], products: ['He-3', 'gamma'] },
      ],
    },
    {
      caption: 'Step 3 of 3: two helium-3 nuclei fuse into one helium-4 nucleus, releasing two protons.',
      lanes: [{ reactants: ['He-3', 'He-3'], products: ['He-4', 'p', 'p'] }],
    },
  ];

  let fusionChainStep = 0;

  function layoutCluster(keys, centerX, centerY, spacing) {
    const totalWidth = (keys.length - 1) * spacing;
    return keys.map((key, i) => ({ key, x: centerX - totalWidth / 2 + i * spacing, y: centerY }));
  }

  function drawFusionChainStep() {
    const svg = document.getElementById('fusion-chain-diagram');
    const caption = document.getElementById('fusion-chain-step-caption');
    if (!svg || !caption) return;
    svg.innerHTML = '';
    const step = FUSION_CHAIN_STEPS[fusionChainStep];
    caption.textContent = step.caption;

    const laneHeight = 100;
    const totalHeight = step.lanes.length * laneHeight + 20;
    svg.setAttribute('viewBox', `0 0 480 ${totalHeight}`);

    step.lanes.forEach((lane, i) => {
      const laneY = 10 + laneHeight * i + laneHeight / 2;
      sunSvgEl('line', {
        x1: 180, y1: laneY, x2: 290, y2: laneY,
        stroke: '#8a97a5', 'stroke-width': 2, 'marker-end': 'url(#fusion-arrowhead)',
      }, svg);

      const reactantPositions = layoutCluster(lane.reactants, 100, laneY, 55);
      const productPositions = layoutCluster(lane.products, 370, laneY, 65);

      [...reactantPositions, ...productPositions].forEach(({ key, x, y }) => {
        const style = PARTICLE_STYLE[key];
        sunSvgEl('circle', {
          cx: x, cy: y, r: style.r, fill: style.fill,
          stroke: style.stroke === 'none' ? 'none' : style.stroke,
          'stroke-width': style.stroke === 'none' ? 0 : 2,
          'stroke-dasharray': style.fill === 'none' ? '3 2' : 'none',
        }, svg);
        const label = sunSvgEl('text', {
          x, y: y + 4, 'text-anchor': 'middle', 'font-size': style.r >= 18 ? 12 : 10,
          fill: style.fill === 'none' ? style.stroke : (key === 'p' || key === 'd' ? '#1f2d3d' : '#fff'),
        }, svg);
        label.textContent = style.label;
      });
    });

    // Arrowhead marker, defined once per redraw (the svg is cleared above).
    const defs = sunSvgEl('defs', {}, svg);
    const marker = sunSvgEl('marker', {
      id: 'fusion-arrowhead', markerWidth: 8, markerHeight: 8, refX: 6, refY: 4, orient: 'auto',
    }, defs);
    sunSvgEl('path', { d: 'M0,0 L8,4 L0,8 Z', fill: '#8a97a5' }, marker);
  }

  function nextFusionChainStep() {
    fusionChainStep = (fusionChainStep + 1) % FUSION_CHAIN_STEPS.length;
    drawFusionChainStep();
  }

  const fusionChainNextButton = document.getElementById('fusion-chain-next');
  if (fusionChainNextButton) {
    fusionChainNextButton.addEventListener('click', nextFusionChainStep);
  }

  butterflyYearSlider.addEventListener('input', updateButterfly);

  const GLOSSARY = {
    solarWind:
      "Solar wind: a continuous stream of charged particles (electrons, protons and alpha particles) escaping the corona at roughly 300-800 km/s, fast enough to overcome the Sun's gravity, flowing outward through the whole Solar System.",
    vanAllenBelts:
      "Van Allen belts: two doughnut-shaped regions where Earth's magnetic field traps charged particles from the solar wind — an inner belt (mostly protons) and an outer belt (mostly electrons).",
    radiative:
      'Radiative zone: energy moves outward as radiation, bouncing between particles so slowly it can take over 100,000 years to cross.',
    convective:
      'Convective zone: cooler, less dense plasma carries energy the rest of the way outward by convection currents, like water boiling in a pan.',
    photosphere: 'Photosphere: the visible "surface", about 5,800 K (about 5,500°C), where sunspots appear.',
    chromosphere: 'Chromosphere: a thin, hotter, reddish layer above the photosphere.',
    corona:
      'Corona: the Sun\'s outer atmosphere, a faint, wispy halo of gas at over a million °C, visible to the naked eye only during a total solar eclipse.',
    coronaHeating:
      "Beyond the spec — the coronal heating problem: the corona (over a million °C) is far hotter than the photosphere beneath it (about 5,800 K, about 5,500°C), even though it's further from the Sun's fusion-powered core. Two mechanisms are thought to contribute: wave heating, where magnetohydrodynamic (MHD) waves carry energy up along the Sun's magnetic field lines and dump it in the corona; and nanoflares, tiny, constant bursts of energy released when tangled magnetic field lines suddenly reconnect. Which mechanism dominates — or whether both do, in different regions — is still an open question in solar physics, not a single settled answer.",
  };

  updateButterfly();
  drawSunStructureLabels();
  drawFusionChainStep();
  renderCoverage();
  QuizUI.mount(SunFeaturesQuestions.makeQuestions(ButterflyDiagram));
  Glossary.init(GLOSSARY);
})();
