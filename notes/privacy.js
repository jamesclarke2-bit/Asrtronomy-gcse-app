/**
 * notes/privacy.html's own script: the "Clear my saved progress"
 * button, and the reference-page coverage line.
 *
 * STORAGE_KEY must match quiz-ui.js's own STORAGE_KEY exactly — this
 * page explains and clears the same entry that one reads and writes.
 * quiz-ui.js has no Node-side export to import it from directly (it's
 * a browser-only script), so the two are kept in step by
 * test/privacy.test.js, which reads quiz-ui.js's own source and checks
 * the same literal value appears there too.
 *
 * clearSavedProgress takes a storage object as an argument, rather
 * than reaching for window.localStorage itself, so it can be unit-
 * tested with a small fake, no real browser needed.
 */
(function () {
  const STORAGE_KEY = 'astro-quiz-progress';

  function clearSavedProgress(storage) {
    storage.removeItem(STORAGE_KEY);
  }

  function renderCoverage() {
    const coverageEl = document.getElementById('coverage');
    coverageEl.textContent =
      'A reference page: not part of the curriculum, kept here so the site’s own handling of your data is written down somewhere.';
  }

  function init() {
    renderCoverage();

    const button = document.getElementById('clear-progress-button');
    const status = document.getElementById('clear-progress-status');
    if (!button || !status) return;

    button.addEventListener('click', () => {
      clearSavedProgress(window.localStorage);
      status.textContent = 'Done — your saved progress has been removed from this device.';
    });
  }

  const GLOSSARY = {
    localStorage:
      "Local storage: a small storage area inside your own browser, kept separate from cookies and tied to this site's own address. Only this site, and only this device, can read it — nothing in it is sent anywhere over the internet unless a page's own code chooses to send it, which this site's code never does.",
  };

  const api = { STORAGE_KEY, clearSavedProgress };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.PrivacyPage = api;
    init();
    Glossary.init(GLOSSARY);
  }
})();
