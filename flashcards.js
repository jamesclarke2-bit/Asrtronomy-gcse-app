/**
 * Reusable flip-card deck, for any notes/ page that wants one — not
 * specific to any single page's content. A page script builds its own
 * cards (front art is whatever DOM Node the page constructs: an SVG
 * icon, a cloned diagram, even plain text) and calls
 * FlashCards.mount(container, cards, options) once; this renders one
 * card at a time with Flip / Previous / Next / Shuffle controls.
 *
 * Card shape: { id, front: Node, back: { title, body }, category? }.
 * `category` is an optional short label shown on the card (e.g. "Naked-eye
 * phenomena"), useful when one deck mixes topics.
 *
 * The shuffle and navigation math are pure functions, exported for Node
 * so they're unit-testable without a DOM or a real random source; only
 * mount() touches the page. `options.random` (default Math.random) lets
 * a caller inject a seeded generator, mainly for tests.
 */
(function () {
  // Fisher-Yates. Takes a random() so it's deterministic under test.
  function shuffle(items, random) {
    const rand = random || Math.random;
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = result[i];
      result[i] = result[j];
      result[j] = tmp;
    }
    return result;
  }

  // Wraps round both ends, so Previous from card 1 reaches the last
  // card and Next from the last reaches card 1.
  function wrapIndex(index, length) {
    return ((index % length) + length) % length;
  }

  function buildCardElement(card) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'flashcard';
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', `${card.back.title}: tap to reveal`);

    const inner = document.createElement('div');
    inner.className = 'flashcard-inner';
    button.appendChild(inner);

    const front = document.createElement('div');
    front.className = 'flashcard-face flashcard-face--front';
    if (card.category) {
      const tag = document.createElement('span');
      tag.className = 'flashcard-category';
      tag.textContent = card.category;
      front.appendChild(tag);
    }
    const art = document.createElement('div');
    art.className = 'flashcard-art';
    art.appendChild(card.front);
    front.appendChild(art);
    inner.appendChild(front);

    const back = document.createElement('div');
    back.className = 'flashcard-face flashcard-face--back';
    const title = document.createElement('h3');
    title.className = 'flashcard-title';
    title.textContent = card.back.title;
    back.appendChild(title);
    const body = document.createElement('p');
    body.className = 'flashcard-body';
    body.textContent = card.back.body;
    back.appendChild(body);
    inner.appendChild(back);

    button.addEventListener('click', () => {
      const flipped = button.classList.toggle('is-flipped');
      button.setAttribute('aria-pressed', String(flipped));
    });

    return button;
  }

  function mount(container, cards, options) {
    if (!container || !cards || cards.length === 0) return;
    const random = (options && options.random) || Math.random;

    let order = cards.map((_, i) => i);
    let position = 0;

    const deck = document.createElement('div');
    deck.className = 'flashcard-deck';

    const progress = document.createElement('p');
    progress.className = 'flashcard-progress';
    deck.appendChild(progress);

    const stage = document.createElement('div');
    stage.className = 'flashcard-stage';
    deck.appendChild(stage);

    const controls = document.createElement('div');
    controls.className = 'flashcard-controls';

    const prevButton = document.createElement('button');
    prevButton.type = 'button';
    prevButton.className = 'secondary-button';
    prevButton.textContent = '← Previous';

    const shuffleButton = document.createElement('button');
    shuffleButton.type = 'button';
    shuffleButton.className = 'secondary-button';
    shuffleButton.textContent = 'Shuffle';

    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.className = 'secondary-button';
    nextButton.textContent = 'Next →';

    controls.appendChild(prevButton);
    controls.appendChild(shuffleButton);
    controls.appendChild(nextButton);
    deck.appendChild(controls);

    container.appendChild(deck);

    function render() {
      stage.textContent = '';
      const card = cards[order[position]];
      stage.appendChild(buildCardElement(card));
      progress.textContent = `Card ${position + 1} of ${cards.length}`;
    }

    prevButton.addEventListener('click', () => {
      position = wrapIndex(position - 1, cards.length);
      render();
    });
    nextButton.addEventListener('click', () => {
      position = wrapIndex(position + 1, cards.length);
      render();
    });
    shuffleButton.addEventListener('click', () => {
      order = shuffle(order, random);
      position = 0;
      render();
    });

    render();
  }

  const api = { shuffle, wrapIndex };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.FlashCards = Object.assign({ mount }, api);
  }
})();
