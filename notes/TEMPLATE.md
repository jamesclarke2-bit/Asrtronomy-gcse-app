# Notes page template

The standard for every static reference page in `notes/`. Build new notes pages to it from
the start. `test/notesTemplate.test.js` checks the rules it can check automatically, for
every page listed as conforming below.

## Status

| Page | Built to this template? |
|---|---|
| `notes/naked-eye-sky.html` | Yes (retrofitted when the template was written) |
| `notes/measuring-the-sky.html` | Yes (built to it from the start) |
| `notes/earth-structure.html` | Not yet. Retrofit later |
| `notes/moon-structure.html` | Not yet. Retrofit later |
| `notes/observing-techniques.html` | Not yet. Retrofit later |

The three older pages stay as they are until the template has been proven on a couple of
pages built to it from the start. When a page is retrofitted, add it to `CONFORMING_PAGES`
in `test/notesTemplate.test.js` and update this table.

## Why: what the first four pages shared, and where they drifted

**Already consistent** (keep it that way):

- **Page shell:** `p.back-link`, then `h1`, then `p.subtitle`, then a run of
  `section.notes-section`, each opening with an `h2`, then `p.coverage#coverage`.
- **Shared CSS:** `.notes-section`, `.concept-grid`/`.concept-card` for groups of short
  items (with `h3` subheads), `.tip-list`, `.shower-table` for tables, `.note` for caveats,
  `.exam-tip`, and `.diagram` with `.labelled-diagram-wrap`/`.labelled-diagram-label` for
  diagrams (labels are HTML, never SVG `<text>`).
- **Tap-to-reveal:** `glossary.js` pairs every `.glossary-toggle[data-term]` with the
  `.glossary-definition[data-term]` sharing its term. Definition text lives in the page
  script's `GLOSSARY` object and is loaded by `Glossary.init(GLOSSARY)`.
- **Page script:** a plain IIFE declaring `CURRICULUM_UNITS`, with a `renderCoverage()` that
  fills the "Covers:" line.

**Varied from page to page** (what this template fixes):

- **Section ids:** Earth and Moon had none; Observing Techniques had ids only on the two
  sections other pages happened to link to.
- **Exam tips:** Earth had two at the ends of sections, the Moon one mid-page, Observing
  Techniques none, and the Naked-Eye Sky one mid-page.
- **Contents list:** none on any page, although all four run to 1,300–1,600 words.
- **Cross-links:** added wherever a build happened to mention another page. They were
  inline in prose, inside `.note`s and exam tips, or in a "companion" line under the
  subtitle (reusing `.eot-link`, a class named for the Equation of Time page). No page had a
  consistent list of related pages.
- **Heading levels:** mostly `h2` for sections and `h3` in cards, but `earth-structure.html`
  puts an `h2` ("Earth's orbit") inside a panel within another `h2` section.
- **`<title>` vs `h1`:** `moon-structure.html`'s `<title>` ("The Moon: Structure and
  Origin") no longer matches its `h1` ("The Moon: Structure, Surface and Origin").

## 1. Section order

Every notes page has these parts, in this order:

| Part | Markup | Rules |
|---|---|---|
| **Overview** | `h1` + one `p.subtitle` | The `h1` matches the page's `<title>` and its `title` in `src/pages.js`. The subtitle is one to three sentences on what the page covers (and, if useful, what it leaves to a companion page, named in plain text). **No links** in the overview; links belong in Related pages. |
| **Contents** | *(generated)* | Never written by hand. See section 2. |
| **Core content** | one or more `section.notes-section` | Every section has an `id` (short, kebab-case, e.g. `id="milky-way"`) and opens with an `h2`. Subheads inside a section are `h3`, never another `h2`. |
| **Exam tips** | `section.notes-section#exam-tips`, `h2` "Exam tips" | Every `.exam-tip` on the page, and nothing else. See section 3. |
| **Related pages** | `section.notes-section#related`, `h2` "Related pages" | The footer component. See section 4. |
| **Coverage** | `p.coverage#coverage` | Last thing in `<main>`, filled by the page script. |

## 2. Table of contents

Load `notesPage.js` as the **last** script on the page:

```html
<script src="../notesPage.js?v=YYYYMMDDHHmm"></script>
```

If `<main>` holds at least **800 words** (`NotesPage.TOC_WORD_THRESHOLD`), it inserts an
"On this page" list straight after the subtitle. The list links the `h2` of every
`section.notes-section[id]`, including Exam tips and Related pages. A shorter page gets no
list. A section without an `id` is left out, which is one reason every section needs one.

Nothing about the contents list is maintained by hand: add, remove or rename a section and
the list follows. The only CSS it adds is `.notes-toc`, a box around a standard `.tip-list`.

## 3. Tap-to-reveal definitions and exam tips

Use only the existing shared classes. Don't create page-specific variants.

**Definitions in prose**

```html
<p>
  ... a
  <button type="button" class="glossary-toggle glossary-term-button" data-term="asterism"
    aria-label="What is an asterism?" aria-expanded="false">asterism</button> is ...
</p>
<span class="glossary-definition" data-term="asterism" hidden></span>
```

- The toggle is a real `<button>` wrapping the term where it first matters on the page.
  Its `aria-label` is phrased as the student's question ("What is …?", "Why do …?").
- The definition `span` goes **immediately after the block that contains the toggle**
  (the `p`, `ul`, table or card), inside the same container: never inside the `p` itself,
  and never gathered at the bottom of the page. Two toggles in one paragraph get their two
  spans one after the other.
- Each `data-term` is unique on the page and has exactly one definition.
- The definition text is one or two sentences, starting with the term itself ("An asterism:
  …"), and lives in the page script's `GLOSSARY` object, not in the HTML.

**Clickable diagram regions**

SVG shapes act as toggles with `class="glossary-toggle diagram-region"`, `tabindex="0"`,
`role="button"`, `aria-expanded="false"` and an `aria-label` naming the feature. These are
usually generated by the page script, as on `moon-structure.js` and `earth-structure.js`.
Their definition spans all go together in the HTML, directly after the diagram.

**Exam tips**

```html
<p class="exam-tip">
  <strong>Common exam confusion:</strong> ... one misconception, stated and corrected ...
  <a href="#patterns">Constellations and asterisms &uarr;</a>
</p>
```

- Exam tips appear **only** in `#exam-tips`, one `p.exam-tip` per point.
- Each opens with a bold lead-in: **Common exam confusion:** for a misconception, or
  **Common exam link:** for a connection to another part of the course.
- Each ends with an in-page link back up to the section it draws on. The link text is the
  section's heading, or a short form of it ("Using pointer stars"), followed by `&uarr;`.
- Keep each to a single idea in two to four sentences. A tip that needs a diagram belongs in
  the core content.

**Other callouts** stay beside the content they qualify:

- `p.note` for caveats and "how to read this diagram".
- `.diagram-caption` for diagram captions.

## 4. Related pages footer

The footer is where cross-links live. It reuses the landing page's card classes, so related
pages look the same as they do on `index.html`:

```html
<section class="notes-section" id="related">
  <h2>Related pages</h2>
  <div class="page-card-list">
    <a class="page-card" href="observing-techniques.html">
      <h3>Observing Techniques</h3>
      <p class="page-card-description">Why to go there from this page, in one sentence.</p>
    </a>
    <!-- ... -->
  </div>
</section>
```

- **Choose deliberately.** List the pages a student on this page would genuinely go to
  next. A companion page, if there is one, comes first.
- **Titles match the registry.** Each card's `h3` is exactly that page's `title` in
  `src/pages.js`, and every linked page is registered there.
- **Say why.** The description says what the student will get *from this page's point of
  view* (for example, "Use Polaris's altitude to find your latitude"). Don't paste the
  registry description.
- **No duplicates,** and no link to the page itself.

**Inline links in the body** are the exception, not the norm. Link inline only when the
sentence sends the reader somewhere to do something specific. For example:

- a safety instruction ("see Observing the Sun for safe methods");
- an action ("use its altitude to work out your latitude");
- a topic deliberately covered elsewhere rather than repeated ("see Light pollution and
  skyglow"), which may target a section `id` on the other page.

Passing "see also" mentions go in the footer instead. **Every page linked inline must also
appear in Related pages.** The test enforces this, so the footer is always the complete set
of places the page sends people.

## Page skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Page Title</title>
  <link rel="stylesheet" href="../styles.css?v=YYYYMMDDHHmm" />
</head>
<body>
  <main>
    <p class="back-link"><a href="../index.html">&larr; Back to all tools</a></p>

    <h1>Page Title</h1>
    <p class="subtitle">What this page covers, in one to three sentences. No links.</p>

    <section class="notes-section" id="first-topic">
      <h2>First topic</h2>
      <!-- core content: p, .tip-list, .concept-grid, .shower-table, .diagram, .note -->
    </section>

    <!-- more core sections -->

    <section class="notes-section" id="exam-tips">
      <h2>Exam tips</h2>
      <p class="exam-tip"><strong>Common exam confusion:</strong> ... <a href="#first-topic">First topic &uarr;</a></p>
    </section>

    <section class="notes-section" id="related">
      <h2>Related pages</h2>
      <div class="page-card-list">
        <a class="page-card" href="other-page.html">
          <h3>Other Page Title</h3>
          <p class="page-card-description">Why to go there.</p>
        </a>
      </div>
    </section>

    <p class="coverage" id="coverage"></p>
  </main>

  <script src="../src/curriculum.js?v=YYYYMMDDHHmm"></script>
  <!-- any src/ modules the page needs -->
  <script src="../glossary.js?v=YYYYMMDDHHmm"></script>
  <script src="page-name.js?v=YYYYMMDDHHmm"></script>
  <script src="../notesPage.js?v=YYYYMMDDHHmm"></script>
</body>
</html>
```

The page script (`page-name.js`) is an IIFE that declares `CURRICULUM_UNITS`, renders the
coverage line, builds any diagrams, and ends with `Glossary.init(GLOSSARY)`. See
`naked-eye-sky.js`.

## Site conventions that apply here too

- **Registry:** register the page in `src/pages.js` with the same `units` as its
  `CURRICULUM_UNITS`. Every unit id must exist in `src/curriculum.js`.
- **Cache-busting:** every local `script` and stylesheet carries `?v=YYYYMMDDHHmm`. Bump it
  on every page that loads a file you changed. `styles.css`, `src/curriculum.js` and
  `src/pages.js` are loaded site-wide.
- **Scripts:** page scripts are IIFEs. `src/` modules are UMD, exporting via
  `module.exports` or `window.X`. Never declare top-level names that could collide across
  the plain `<script>` tags a page shares.
- **Diagrams:** draw from real data where there is any (star positions, coordinates), and
  put the claims the text makes about that data under test.

## Checklist for a new notes page

1. Overview: the `h1` matches `<title>` and the `pages.js` title, and the subtitle has no
   links.
2. Every `section.notes-section` has an `id` and an `h2`, in the order core, then
   `#exam-tips`, then `#related`.
3. Every `.exam-tip` sits in `#exam-tips`, with a lead-in and a back-link.
4. Every glossary toggle has exactly one definition, placed straight after its block.
5. Every inline link target is also in Related pages, and every Related pages card matches
   a `pages.js` title.
6. `notesPage.js` is the last script.
7. The page is in `src/pages.js` and in `CONFORMING_PAGES` in
   `test/notesTemplate.test.js`, and `npm test` passes.
