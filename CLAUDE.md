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
