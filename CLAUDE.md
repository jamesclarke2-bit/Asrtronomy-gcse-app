# GCSE Astronomy app

Static HTML/CSS/JS with no build step. Pages live in `sims/` (interactive) and `notes/`
(reference). Shared logic lives in `src/` (UMD modules), and `npm test` runs the
`node:test` suite in `test/`.

- **Notes pages:** follow `notes/TEMPLATE.md`, which covers section order, the generated
  contents list, tap-to-reveal definitions, exam tips and the related-pages footer.
  `test/notesTemplate.test.js` enforces it for the pages listed there.
- **Curriculum:** subtopic ids live in `src/curriculum.js`. Every page is registered in
  `src/pages.js`, and each page's `CURRICULUM_UNITS` matches its registry `units`.
- **Cache-busting:** bump `?v=YYYYMMDDHHmm` on every page that loads a changed file.

## House rules

- **Diagram-first:** a page opens with its central diagram or simulation — no more than ~150
  words before it. Detail goes in tap-to-reveal panels, not in a run-up of prose. Show the
  picture before the paragraph, every time.
- **Toggles must visibly change the diagram:** every mode switch or toggle changes what's drawn,
  not just a readout's numbers. Check this with screenshots of each mode before calling a page
  done.
- **Show signs explicitly:** an inward-pointing force or field is negative; potential and
  potential energy are negative (bound/attractive by convention); every signed readout shows its
  own minus sign rather than hiding it behind a word like "inward".
- **Student-facing pages never mention tests, code files, functions, or how the page was built.**
  Say what a number means, not how it was checked — that belongs in commit messages and reports
  back to the person building the page, not in page copy.
- **Define a term where it's first used** — a short visible definition or a tap-to-reveal — and
  link to the page that covers it in full, rather than assuming prior knowledge.
- **"Given" values come from `src/specData.js`:** anything shown to students as a given constant
  or data-sheet figure is read from there, not hand-typed. Where a page's own engine needs more
  precision than the rounded exam figure, say so explicitly (e.g. "the exam gives 13,000 km; this
  page's orbit uses the precise value").
- **Practice questions:** state every constant the question needs in its own text (don't assume
  the student has it memorised), set numeric tolerances to at least 2%, and show the full worked
  answer, not just the final number.
- **New `src/curriculum.js` entries:** add the `spec` field, check the current highest id in that
  unit first, and never reuse an id that's been deleted — ids are permanent once published.
- **Registering a page:** add it to `src/pages.js` (and `RECOMMENDED_PATH`, and
  `CONFORMING_PAGES`/`DIAGRAM_FIRST_PAGES` in `test/notesTemplate.test.js` where applicable), then
  report the test count split into two numbers: the page's own dedicated tests (e.g.
  `test/<page>.test.js`, a new engine module's tests) and the auto-generated per-page template
  checks (`test/notesTemplate.test.js`'s `CONFORMING_PAGES`/`DIAGRAM_FIRST_PAGES` loops).
- **Mark general knowledge as a draft:** anything on a page sourced from general knowledge rather
  than the spec or `notes/`'s own worked content is labelled "first draft, to be checked by the
  teacher" — the same convention already used for `notes/solar-system-bodies.html` and
  `notes/telescopes.html`'s eyepiece target sizes.
