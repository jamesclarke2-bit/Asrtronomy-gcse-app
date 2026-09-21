/**
 * Shared quiz rendering: renders a set of questions into #questions-list
 * and a per-subtopic tally into #progress-list, backed by one shared
 * localStorage store (astro-quiz-progress) so progress accumulates
 * across pages, keyed by curriculum subtopic id. Call QuizUI.mount(questions)
 * once per page with that page's own question array.
 */
(function () {
  const STORAGE_KEY = 'astro-quiz-progress';

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

  function renderProgress(questions) {
    const progress = loadProgress();
    const list = document.getElementById('progress-list');
    list.innerHTML = '';
    const allUnits = [...new Set(questions.flatMap((q) => q.units))];
    allUnits.forEach((id) => {
      const entry = progress[id] || { attempts: 0, correct: 0 };
      const li = document.createElement('li');
      li.textContent = `${tagLabel(id)} — ${entry.correct}/${entry.attempts} correct`;
      list.appendChild(li);
    });
  }

  function recordResult(units, correct, questions) {
    const progress = loadProgress();
    units.forEach((id) => {
      const entry = progress[id] || { attempts: 0, correct: 0 };
      entry.attempts += 1;
      if (correct) entry.correct += 1;
      progress[id] = entry;
    });
    saveProgress(progress);
    renderProgress(questions);
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

    // 'choice'
    fieldSpec.options.forEach((option) => {
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

  function renderQuestions(questions) {
    const container = document.getElementById('questions-list');

    questions.forEach((question) => {
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
        recordResult(question.units, result.correct, questions);
        feedback.className = 'question-feedback ' + (result.correct ? 'correct' : 'incorrect');
        feedback.textContent = result.correct ? 'Correct!' : result.message;
      });

      container.appendChild(card);
    });
  }

  function mount(questions) {
    renderQuestions(questions);
    renderProgress(questions);
  }

  window.QuizUI = { mount };
})();
