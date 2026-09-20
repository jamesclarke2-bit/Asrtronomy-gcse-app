(function () {
  const STORAGE_KEY = 'astro-quiz-progress';
  const QUESTIONS = Questions.QUESTIONS;

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

  function recordResult(units, correct) {
    const progress = loadProgress();
    units.forEach((id) => {
      const entry = progress[id] || { attempts: 0, correct: 0 };
      entry.attempts += 1;
      if (correct) entry.correct += 1;
      progress[id] = entry;
    });
    saveProgress(progress);
    renderProgress();
  }

  function tagLabel(id) {
    const subtopic = Curriculum.getSubtopic(id);
    return subtopic ? `${id} ${subtopic.title}` : id;
  }

  function renderProgress() {
    const progress = loadProgress();
    const list = document.getElementById('progress-list');
    list.innerHTML = '';
    const allUnits = [...new Set(QUESTIONS.flatMap((q) => q.units))];
    allUnits.forEach((id) => {
      const entry = progress[id] || { attempts: 0, correct: 0 };
      const li = document.createElement('li');
      li.textContent = `${tagLabel(id)} — ${entry.correct}/${entry.attempts} correct`;
      list.appendChild(li);
    });
  }

  function buildInput(question, form) {
    if (question.type === 'number') {
      const input = document.createElement('input');
      input.type = 'number';
      input.step = '0.1';
      form.appendChild(input);
      if (question.unitLabel) {
        const unit = document.createElement('span');
        unit.textContent = question.unitLabel;
        form.appendChild(unit);
      }
      return () => parseFloat(input.value);
    }

    if (question.type === 'time') {
      const input = document.createElement('input');
      input.type = 'time';
      form.appendChild(input);
      return () => input.value;
    }

    // 'choice'
    question.options.forEach((option) => {
      const label = document.createElement('label');
      label.className = 'choice-option';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = question.id;
      radio.value = option;
      label.appendChild(radio);
      label.appendChild(document.createTextNode(option));
      form.appendChild(label);
    });
    return () => {
      const checked = form.querySelector(`input[name="${question.id}"]:checked`);
      return checked ? checked.value : null;
    };
  }

  function renderQuestions() {
    const container = document.getElementById('questions-list');

    QUESTIONS.forEach((question) => {
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
        const unanswered = value === null || value === '' || (typeof value === 'number' && Number.isNaN(value));
        if (unanswered) {
          feedback.className = 'question-feedback';
          feedback.textContent = 'Enter an answer first.';
          return;
        }
        const result = question.check(value);
        recordResult(question.units, result.correct);
        feedback.className = 'question-feedback ' + (result.correct ? 'correct' : 'incorrect');
        feedback.textContent = result.correct ? 'Correct!' : result.message;
      });

      container.appendChild(card);
    });
  }

  renderQuestions();
  renderProgress();
})();
