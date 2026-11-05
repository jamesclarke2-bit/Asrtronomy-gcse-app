/**
 * Shared quiz rendering: renders a set of questions into a container
 * (#questions-list by default) and a per-subtopic tally into
 * #progress-list, backed by one shared localStorage store
 * (astro-quiz-progress) so progress accumulates across pages, keyed by
 * curriculum subtopic id. Call QuizUI.mount(questions) once per page
 * with that page's own question array.
 *
 * A question may optionally supply render(container): called once per
 * mount with an empty <div>, it draws a picture above the answer choices
 * (e.g. a page's own map or globe, redrawn small with one feature
 * highlighted) — see src/moonStructureQuestions.js and
 * src/earthStructureQuestions.js's "name that feature/line" questions.
 * Checking and tallying the answer works exactly as for a text question;
 * quiz-ui.js never inspects what render() drew.
 *
 * A long, same-shape set of questions (those same "name that
 * feature/line" ones) can instead go in their own collapsed panel via
 * QuizUI.mountGroup({questions, listElementId, summaryElementId, label}):
 * rendered into listElementId exactly like mount() renders into
 * questions-list. summaryElementId names a <summary class="quiz-panel-
 * summary"> button-card (icon and title authored as static markup — see
 * notes/earth-structure.html for the shape) whose .quiz-panel-count
 * child and aria-label this keeps live-updated with "X/N correct",
 * answered from the same shared tally (now also keyed per question id,
 * not just per subtopic, so a group's own correct count never gets
 * mixed up with another question's that happens to share a unit tag).
 * #progress-list always covers every question mounted on the page, by
 * either call.
 *
 * A quiz whose answer isn't typed or chosen from a list at all — e.g.
 * notes/naked-eye-sky.html's "Which is it?" game, where tapping a
 * picture IS the answer, with feedback shown the instant it's tapped —
 * doesn't fit renderQuestions' own render-picture-then-pick-from-a-list
 * shape, so it doesn't go through mount()/mountGroup(). It still needs
 * the SAME shared tally and the SAME live "X/N correct" badge every
 * other quiz gets, so those two pieces are exposed directly:
 * QuizUI.recordResult(question, correct) after the page decides an
 * answer is right or wrong, and QuizUI.registerGroupSummary(...) once,
 * the same shape mountGroup's own internal bookkeeping already uses, to
 * keep a folded panel's own count live without mountGroup's rendering.
 *
 * Unpredictability: renderQuestions() (used by both mount() and
 * mountGroup()) renders a shuffled copy of the questions it's given, a
 * fresh order every time, and buildSingleInput() renders a shuffled copy
 * of a 'choice' question's own options — so a reload or a page revisit
 * never shows the same order twice. The question-order shuffle uses
 * shuffleAvoidingAdjacent (below), which also guarantees no two
 * questions that were adjacent in the source array stay adjacent in the
 * same order — the property a matching game (e.g. naked-eye-sky.html's
 * "Which is it?") needs for its own round order, so that game calls
 * QuizUI.shuffleAvoidingAdjacent directly instead of keeping its own
 * copy of the algorithm. Both shuffles return a new array and never
 * mutate the one they're given, since several of these arrays (e.g. a
 * shared FEATURE_NAMES options list) are reused across many questions.
 */
(function () {
  const STORAGE_KEY = 'astro-quiz-progress';
  let allMountedQuestions = [];
  const groupSummaries = [];

  // Plain Fisher-Yates — a new array, the input is never mutated.
  function shuffle(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // Like shuffle(), but additionally guarantees that no two items which
  // were adjacent in the original array (in that same order) end up
  // adjacent in the result — the "consecutive questions never follow
  // the list order" requirement for matching games. For arrays of 2 or
  // fewer items there's no such arrangement to avoid, so it falls back
  // to a plain shuffle. Retries a plain shuffle a bounded number of
  // times rather than solving this exactly — cheap and reliable for the
  // small (under 30-item) arrays this site's quizzes use.
  function shuffleAvoidingAdjacent(array) {
    if (array.length <= 2) return shuffle(array);
    const MAX_ATTEMPTS = 200;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const candidate = shuffle(array);
      let violatesAdjacency = false;
      for (let i = 1; i < candidate.length; i += 1) {
        const originalIndexOfPrev = array.indexOf(candidate[i - 1]);
        const originalIndexOfCurrent = array.indexOf(candidate[i]);
        if (originalIndexOfCurrent === originalIndexOfPrev + 1) {
          violatesAdjacency = true;
          break;
        }
      }
      if (!violatesAdjacency) return candidate;
    }
    return shuffle(array);
  }

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveProgress(progress) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      // localStorage unavailable (private browsing, quota) — progress just won't persist
    }
  }

  function tagLabel(id) {
    const subtopic = Curriculum.getSubtopic(id);
    return subtopic ? `${id} ${subtopic.title}` : id;
  }

  function renderProgress() {
    const progress = loadProgress();
    const list = document.getElementById('progress-list');
    list.innerHTML = '';
    const allUnits = [...new Set(allMountedQuestions.flatMap((q) => q.units))];
    allUnits.forEach((id) => {
      const entry = progress[id] || { attempts: 0, correct: 0 };
      const li = document.createElement('li');
      li.textContent = `${tagLabel(id)} — ${entry.correct}/${entry.attempts} correct`;
      list.appendChild(li);
    });
  }

  // The <summary> itself is a button-card (see styles.css's
  // .quiz-panel-summary): an icon and the title are static markup, so
  // this only ever touches the live part — the "X/N correct" pill — via
  // its .quiz-panel-count child, plus a matching aria-label on the
  // <summary> so the live count is announced too, not just the title.
  function renderGroupSummaries() {
    const progress = loadProgress();
    const results = progress.questionResults || {};
    groupSummaries.forEach(({ questions, summaryEl, label }) => {
      const correctCount = questions.filter((q) => results[q.id]).length;
      const noun = questions.length === 1 ? 'question' : 'questions';
      const countText = `${correctCount}/${questions.length} correct`;
      const countEl = summaryEl.querySelector('.quiz-panel-count');
      if (countEl) countEl.textContent = countText;
      summaryEl.setAttribute('aria-label', `${label} (${questions.length} ${noun}) — ${countText}`);
    });
  }

  function recordResult(question, correct) {
    const progress = loadProgress();
    question.units.forEach((id) => {
      const entry = progress[id] || { attempts: 0, correct: 0 };
      entry.attempts += 1;
      if (correct) entry.correct += 1;
      progress[id] = entry;
    });
    progress.questionResults = progress.questionResults || {};
    progress.questionResults[question.id] = correct;
    saveProgress(progress);
    renderProgress();
    renderGroupSummaries();
  }

  // Renders one input for a field-like spec ({type, unitLabel, options}),
  // grouping radios under `groupName`. Used both for a whole single-field
  // question and for each sub-field of a multi-field one.
  function buildSingleInput(fieldSpec, groupName, form) {
    if (fieldSpec.type === 'number') {
      const input = document.createElement('input');
      input.type = 'number';
      input.step = '0.1';
      form.appendChild(input);
      if (fieldSpec.unitLabel) {
        const unit = document.createElement('span');
        unit.textContent = fieldSpec.unitLabel;
        form.appendChild(unit);
      }
      return () => parseFloat(input.value);
    }

    if (fieldSpec.type === 'time') {
      const input = document.createElement('input');
      input.type = 'time';
      form.appendChild(input);
      return () => input.value;
    }

    if (fieldSpec.type === 'text') {
      const input = document.createElement('input');
      input.type = 'text';
      form.appendChild(input);
      return () => input.value;
    }

    // 'choice' — a shuffled copy, so the correct answer isn't always in
    // the same position and the source options array (often shared
    // across several questions, e.g. FEATURE_NAMES) is never mutated.
    shuffle(fieldSpec.options).forEach((option) => {
      const label = document.createElement('label');
      label.className = 'choice-option';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = groupName;
      radio.value = option;
      label.appendChild(radio);
      label.appendChild(document.createTextNode(option));
      form.appendChild(label);
    });
    return () => {
      const checked = form.querySelector(`input[name="${groupName}"]:checked`);
      return checked ? checked.value : null;
    };
  }

  function isUnanswered(value) {
    return value === null || value === '' || (typeof value === 'number' && Number.isNaN(value));
  }

  // Multi-field question support: question.fields is an array of
  // {key, type, label, unitLabel?, options?}. Each renders as its own
  // labelled sub-group; getValue() returns {[key]: value, ...}.
  function buildFieldsInput(question, form) {
    const getters = {};
    question.fields.forEach((field) => {
      const group = document.createElement('div');
      group.className = 'question-field';
      const label = document.createElement('span');
      label.className = 'question-field-label';
      label.textContent = field.label;
      group.appendChild(label);
      getters[field.key] = buildSingleInput(field, `${question.id}-${field.key}`, group);
      form.appendChild(group);
    });
    return () => {
      const values = {};
      question.fields.forEach((field) => {
        values[field.key] = getters[field.key]();
      });
      return values;
    };
  }

  function buildInput(question, form) {
    if (question.fields) return buildFieldsInput(question, form);
    return buildSingleInput(question, question.id, form);
  }

  function renderQuestions(questions, container) {
    shuffleAvoidingAdjacent(questions).forEach((question) => {
      const card = document.createElement('div');
      card.className = 'question-card';

      const tags = document.createElement('div');
      tags.className = 'question-tags';
      tags.textContent = question.units.map(tagLabel).join(' · ');
      card.appendChild(tags);

      const prompt = document.createElement('p');
      prompt.className = 'question-prompt';
      prompt.textContent = question.prompt;
      card.appendChild(prompt);

      // Optional picture-based question: question.render(container) draws
      // a diagram above the answer choices, using the page's own drawing
      // code (never built from typed text here) — e.g. a map or globe with
      // one feature highlighted for a "name that feature" question. Purely
      // additive: a question with no render function renders exactly as
      // before, and the answer is still checked and tallied the usual way.
      if (typeof question.render === 'function') {
        const diagram = document.createElement('div');
        diagram.className = 'question-diagram';
        question.render(diagram);
        card.appendChild(diagram);
      }

      const form = document.createElement('div');
      form.className = 'question-form';
      const getValue = buildInput(question, form);
      card.appendChild(form);

      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Check answer';
      card.appendChild(button);

      const feedback = document.createElement('p');
      feedback.className = 'question-feedback';
      card.appendChild(feedback);

      button.addEventListener('click', () => {
        const value = getValue();
        const unanswered = question.fields
          ? Object.values(value).some(isUnanswered)
          : isUnanswered(value);
        if (unanswered) {
          feedback.className = 'question-feedback';
          feedback.textContent = 'Enter an answer first.';
          return;
        }
        const result = question.check(value);
        recordResult(question, result.correct);
        feedback.className = 'question-feedback ' + (result.correct ? 'correct' : 'incorrect');
        // Always reveal the explanation, not just right/wrong — every
        // question's message is written to read sensibly either way (a
        // plain statement of the correct answer and reasoning), so this
        // one prefix is all that needs to vary with the outcome.
        feedback.textContent = (result.correct ? 'Correct! ' : 'Not quite. ') + (result.message || '');
        // Optional per-question hook so a page can highlight or reference
        // the answer on its own existing diagram (sky dome, meridian
        // cross-section, diurnal graph, ...) instead of quiz-ui.js having
        // to know anything about page-specific rendering.
        if (typeof question.onAnswered === 'function') {
          question.onAnswered(result, value);
        }
      });

      container.appendChild(card);
    });
  }

  function mount(questions) {
    allMountedQuestions = allMountedQuestions.concat(questions);
    renderQuestions(questions, document.getElementById('questions-list'));
    renderProgress();
  }

  // A second, separately-collapsed set of questions on the same page —
  // e.g. a "name that feature/line" picture-quiz panel — sharing the
  // same #progress-list tally as mount()'s own questions, plus its own
  // live "X/N correct" count in summaryEl.
  function mountGroup({ questions, listElementId, summaryElementId, label }) {
    allMountedQuestions = allMountedQuestions.concat(questions);
    renderQuestions(questions, document.getElementById(listElementId));
    groupSummaries.push({ questions, summaryEl: document.getElementById(summaryElementId), label });
    renderProgress();
    renderGroupSummaries();
  }

  // Registers a question set's live "X/N correct" badge without also
  // rendering them with renderQuestions — for a quiz whose own page
  // script draws the questions itself (see the header comment). Also
  // folds them into allMountedQuestions so #progress-list's per-unit
  // tally covers them, exactly as mount()/mountGroup() already do for
  // their own questions.
  function registerGroupSummary({ questions, summaryEl, label }) {
    allMountedQuestions = allMountedQuestions.concat(questions);
    groupSummaries.push({ questions, summaryEl, label });
    renderProgress();
    renderGroupSummaries();
  }

  window.QuizUI = { mount, mountGroup, recordResult, registerGroupSummary, shuffle, shuffleAvoidingAdjacent };
})();
