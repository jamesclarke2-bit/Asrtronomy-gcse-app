/**
 * Exam-style practice questions for notes/dark-universe.html (spec
 * 16.10-16.12), each with `marks` and a full mark scheme in its feedback:
 * at least one per spec point, and one reading the rotation-curve graph.
 */
(function () {
  function makeQuestions(U) {
    const UNITS = ['u6.4'];

    function markScheme(points) {
      return `Mark scheme: ${points.map((p) => `${p} (1)`).join('; ')}.`;
    }

    function single(id, spec, prompt, options, right, point) {
      return {
        id,
        units: UNITS,
        spec,
        marks: 1,
        prompt,
        type: 'choice',
        options,
        check(value) {
          return { correct: value === right, message: markScheme([point]) };
        },
      };
    }

    // Graph reading at 40 thousand light-years, to the nearest 10 km/s.
    const READ_AT = 40;
    const measured = Math.round(U.measuredSpeed(READ_AT) / 10) * 10;
    const visible = Math.round(U.visibleSpeed(READ_AT) / 10) * 10;
    const READ_TOL = 10;

    function renderRotation(container) {
      const D = window.SpectrumDrawing;
      const W = 420;
      const H = 330;
      const panelDiv = document.createElement('div');
      panelDiv.className = 'spectrum-panel hr-question-diagram';
      const wrap = document.createElement('div');
      wrap.className = 'labelled-diagram-wrap';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      [['viewBox', `0 0 ${W} ${H}`], ['width', W], ['height', H], ['class', 'responsive-svg'], ['role', 'img'],
        ['aria-label', 'A rotation curve: orbital speed in km/s against distance from the centre in thousand light-years, gridlines every 10 thousand light-years and every 25 km/s. The measured curve (solid) is flat; the visible-matter curve (dashed) falls away.']].forEach(([k, v]) => svg.setAttribute(k, v));
      wrap.appendChild(svg);
      panelDiv.appendChild(wrap);
      container.appendChild(panelDiv);
      D.panel(svg);
      const x0 = 60;
      const x1 = 400;
      const yTop = 56;
      const yBottom = 250;
      const X = (r) => x0 + (r / U.MAX_KLY) * (x1 - x0);
      const Y = (v) => yBottom - (v / 250) * (yBottom - yTop);
      for (let r = 0; r <= U.MAX_KLY; r += 10) {
        D.svgEl('line', { x1: X(r), x2: X(r), y1: yTop, y2: yBottom, stroke: '#2a3550', 'stroke-width': 1 }, svg);
        D.addLabel(svg, wrap, String(r), X(r), yBottom + 14, 'diagram-label--tick');
      }
      for (let v = 0; v <= 250; v += 25) {
        D.svgEl('line', { x1: x0, x2: x1, y1: Y(v), y2: Y(v), stroke: '#2a3550', 'stroke-width': v % 50 === 0 ? 1.2 : 0.6 }, svg);
        if (v % 50 === 0) D.addLabel(svg, wrap, String(v), x0 - 6, Y(v), 'diagram-label--tick diagram-label--left');
      }
      const path = (fn) => {
        let d = '';
        for (let r = 0.5; r <= U.MAX_KLY; r += 0.5) d += `${d ? 'L' : 'M'}${X(r).toFixed(1)},${Y(fn(r)).toFixed(1)} `;
        return d;
      };
      D.svgEl('path', { d: path(U.visibleSpeed), fill: 'none', stroke: D.INK, 'stroke-width': 2, 'stroke-dasharray': '7 5' }, svg);
      D.svgEl('path', { d: path(U.measuredSpeed), fill: 'none', stroke: D.CURVE, 'stroke-width': 2.5 }, svg);
      D.addLabel(svg, wrap, 'Distance from centre (thousand light-years)', (x0 + x1) / 2, yBottom + 44, 'diagram-label--tick');
      D.addLabel(svg, wrap, 'Orbital speed (km/s)', 8, 18, 'diagram-label--tick diagram-label--right');
    }

    const MORE_MASS = 'There is far more mass than we can see, spread through a halo round the galaxy';
    const NATURE = 'Unknown particles, or dark objects such as black holes and dead stars';
    const FASTER = 'The expansion of the Universe is speeding up';
    const DE_BIGGEST = 'Dark energy';
    const NO_LIGHT = 'They give out and absorb no light, and show themselves only through gravity (or the expansion)';
    const NOTHING = 'Nothing yet: no dark matter particle has been detected directly';
    const COLLAPSE = 'The expansion stops and reverses, and the Universe collapses';
    const SPEEDING = 'It expands for ever, faster and faster';
    const FUTURE_OPTIONS = U.FUTURES.map((f) => f.name);

    return [
      {
        id: 'du-read-curve',
        units: UNITS,
        spec: '16.10',
        marks: 2,
        prompt: `The graph shows the Milky Way's rotation curve. At ${READ_AT} thousand light-years from the centre, read (a) the measured orbital speed and (b) the speed the visible matter alone would give.`,
        fields: [
          { key: 'measured', type: 'number', label: '(a) Measured', unitLabel: 'km/s' },
          { key: 'visible', type: 'number', label: '(b) Visible matter alone', unitLabel: 'km/s' },
        ],
        render: renderRotation,
        check(value) {
          const a = Math.abs(Number(value.measured) - measured) <= READ_TOL;
          const b = Math.abs(Number(value.visible) - visible) <= READ_TOL;
          const got = [a, b].filter(Boolean).length;
          const scheme = markScheme([
            `(a) about ${measured} km/s from the solid line (accept ${measured - READ_TOL} to ${measured + READ_TOL})`,
            `(b) about ${visible} km/s from the dashed line (accept ${visible - READ_TOL} to ${visible + READ_TOL}); the measured speed is much higher, so there is extra, unseen mass`,
          ]);
          return { correct: a && b, message: `${got} out of 2 marks. ${scheme}` };
        },
        answer: { measured, visible },
      },
      single('du-flat-means', '16.10', "Stars far from the Milky Way's centre orbit as fast as stars closer in. What does this suggest?", [MORE_MASS, 'The Milky Way is shrinking', 'Gravity is weaker far from the centre', 'The outer stars are much younger'], MORE_MASS, 'the visible matter cannot hold stars moving that fast, so there must be much more mass than we see: dark matter'),
      single('du-nature', '16.10', 'What might dark matter be?', [NATURE, 'Ordinary gas that is too cold to glow', 'Light from distant galaxies', 'Dust that blocks starlight'], NATURE, 'unknown particles (the favoured idea) or dark objects such as black holes and dead stars'),
      single('du-supernovae', '16.10', 'Very distant supernovae look fainter than expected. What did astronomers conclude?', [FASTER, 'The Universe is shrinking', 'Supernovae were dimmer long ago', 'Light slows down over long distances'], FASTER, 'they are further away than a steady expansion would put them, so the expansion is speeding up; the cause is called dark energy'),
      single('du-biggest-share', '16.10', 'Which makes up the biggest share of the Universe?', [DE_BIGGEST, 'Dark matter', 'Ordinary matter', 'Stars'], DE_BIGGEST, 'dark energy, about two-thirds; then dark matter; ordinary matter is only a few per cent'),
      single('du-hard-to-detect', '16.11', 'Why are dark matter and dark energy so hard to detect?', [NO_LIGHT, 'They are too far away for any telescope', 'They only exist inside black holes', 'They glow only in ultraviolet'], NO_LIGHT, 'they neither give out nor absorb light, so telescopes cannot see them; we only see their effects through gravity (dark matter) or the speeding-up expansion (dark energy)'),
      single('du-searches', '16.11', 'What have experiments built to catch dark matter particles directly found so far?', [NOTHING, 'Millions of dark matter particles a second', 'That dark matter is made of neutrons', 'That dark matter glows faintly'], NOTHING, 'nothing yet: no direct detection has been confirmed'),
      single('du-lots-of-matter', '16.12', 'In a model with lots of matter and no dark energy, what happens to the Universe in the future?', [COLLAPSE, SPEEDING, 'It stays exactly the same size', 'It expands at a steady speed for ever'], COLLAPSE, "gravity from matter wins: the expansion stops and the Universe collapses (a 'Big Crunch')"),
      single('du-favoured', '16.12', 'Which future do current measurements favour?', [SPEEDING, COLLAPSE, 'It stops expanding and stays still', 'It shrinks slowly for ever'], SPEEDING, 'dark energy winning: expanding for ever, faster and faster'),
      {
        id: 'du-match-futures',
        units: UNITS,
        spec: '16.12',
        marks: 2,
        prompt: 'Match each balance of matter and dark energy to the future it predicts.',
        fields: [
          { key: 'lots', type: 'choice', label: '(a) Lots of matter, no dark energy', options: FUTURE_OPTIONS },
          { key: 'dark', type: 'choice', label: '(b) Little matter, lots of dark energy', options: FUTURE_OPTIONS },
        ],
        check(value) {
          const a = value.lots === U.FUTURES.find((f) => f.key === 'crunch').name;
          const b = value.dark === U.FUTURES.find((f) => f.key === 'speeding').name;
          const got = [a, b].filter(Boolean).length;
          const scheme = markScheme(['(a) collapse: a Big Crunch', '(b) speeding up for ever']);
          return { correct: a && b, message: `${got} out of 2 marks. ${scheme}` };
        },
      },
    ];
  }

  const api = { makeQuestions };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.DarkUniverseQuestions = api;
  }
})();
