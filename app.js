// ===== STATE =====
let state = {
  decks: [],
  cardsByDeckId: {},
  activeDeckId: null,
  studyIndex: 0,
  studyOrder: [],
};

// ===== LOCALSTORAGE =====
function saveState() {
  localStorage.setItem('flipstack', JSON.stringify(state));
}

function loadState() {
  try {
    const saved = localStorage.getItem('flipstack');
    if (saved) state = JSON.parse(saved);
  } catch (e) {
    console.error('Could not load saved data', e);
  }
}

// ===== HELPERS =====
function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function getActiveCards() {
  if (!state.activeDeckId) return [];
  return state.cardsByDeckId[state.activeDeckId] || [];
}

function getFilteredCards() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  return getActiveCards().filter(c =>
    c.front.toLowerCase().includes(query) ||
    c.back.toLowerCase().includes(query)
  );
}

// ===== RENDER =====
function render() {
  renderSidebar();
  renderMain();
}

function renderSidebar() {
  const list = document.getElementById('deckList');
  list.innerHTML = '';
  if (state.decks.length === 0) {
    list.innerHTML = '<li style="color:#a0a0b0;font-size:0.85rem;">No decks yet</li>';
    return;
  }
  state.decks.forEach(deck => {
    const li = document.createElement('li');
    li.textContent = deck.name;
    li.dataset.id = deck.id;
    if (deck.id === state.activeDeckId) li.classList.add('active');
    li.addEventListener('click', () => selectDeck(deck.id));
    list.appendChild(li);
  });
}

function renderMain() {
  const welcome = document.getElementById('welcomeMsg');
  const deckView = document.getElementById('deckView');

  if (!state.activeDeckId) {
    welcome.style.display = 'block';
    deckView.style.display = 'none';
    return;
  }

  welcome.style.display = 'none';
  deckView.style.display = 'block';

  const deck = state.decks.find(d => d.id === state.activeDeckId);
  document.getElementById('deckTitle').textContent = deck.name;

  renderCards();
}

function renderCards() {
  const cards = getFilteredCards();
  const noCardsMsg = document.getElementById('noCardsMsg');
  const studyArea = document.getElementById('studyArea');

  if (cards.length === 0) {
    noCardsMsg.style.display = 'block';
    studyArea.style.display = 'none';
    return;
  }

  noCardsMsg.style.display = 'none';
  studyArea.style.display = 'block';

  // keep index in bounds
  if (state.studyIndex >= cards.length) state.studyIndex = 0;

  const card = cards[state.studyIndex];
  document.getElementById('cardCounter').textContent =
    `Card ${state.studyIndex + 1} of ${cards.length}`;
  document.getElementById('frontText').textContent = card.front;
  document.getElementById('backText').textContent = card.back;

  // reset flip
  document.getElementById('flashcard').classList.remove('flipped');
}

// ===== DECK ACTIONS =====
function selectDeck(id) {
  state.activeDeckId = id;
  state.studyIndex = 0;
  saveState();
  render();
}

function openNewDeckModal() {
  document.getElementById('deckModalTitle').textContent = 'New Deck';
  document.getElementById('deckNameInput').value = '';
  document.getElementById('deckError').textContent = '';
  document.getElementById('deckModal').dataset.editId = '';
  showModal('deckModal');
}

function openEditDeckModal() {
  const deck = state.decks.find(d => d.id === state.activeDeckId);
  if (!deck) return;
  document.getElementById('deckModalTitle').textContent = 'Edit Deck';
  document.getElementById('deckNameInput').value = deck.name;
  document.getElementById('deckError').textContent = '';
  document.getElementById('deckModal').dataset.editId = deck.id;
  showModal('deckModal');
}

function saveDeck() {
  const name = document.getElementById('deckNameInput').value.trim();
  if (!name) {
    document.getElementById('deckError').textContent = 'Please enter a deck name.';
    return;
  }

  const editId = document.getElementById('deckModal').dataset.editId;
  if (editId) {
    const deck = state.decks.find(d => d.id === editId);
    if (deck) deck.name = name;
  } else {
    const newDeck = { id: generateId(), name, createdAt: Date.now() };
    state.decks.push(newDeck);
    state.cardsByDeckId[newDeck.id] = [];
    state.activeDeckId = newDeck.id;
    state.studyIndex = 0;
  }

  saveState();
  hideModal('deckModal');
  render();
}

function confirmDeleteDeck() {
  const deck = state.decks.find(d => d.id === state.activeDeckId);
  if (!deck) return;
  showConfirm(`Delete deck "${deck.name}" and all its cards?`, () => {
    state.decks = state.decks.filter(d => d.id !== state.activeDeckId);
    delete state.cardsByDeckId[state.activeDeckId];
    state.activeDeckId = state.decks.length ? state.decks[0].id : null;
    state.studyIndex = 0;
    saveState();
    render();
  });
}

// ===== CARD ACTIONS =====
function openNewCardModal() {
  document.getElementById('cardModalTitle').textContent = 'New Card';
  document.getElementById('cardFrontInput').value = '';
  document.getElementById('cardBackInput').value = '';
  document.getElementById('cardError').textContent = '';
  document.getElementById('cardModal').dataset.editId = '';
  showModal('cardModal');
}

function openEditCardModal() {
  const cards = getFilteredCards();
  const card = cards[state.studyIndex];
  if (!card) return;
  document.getElementById('cardModalTitle').textContent = 'Edit Card';
  document.getElementById('cardFrontInput').value = card.front;
  document.getElementById('cardBackInput').value = card.back;
  document.getElementById('cardError').textContent = '';
  document.getElementById('cardModal').dataset.editId = card.id;
  showModal('cardModal');
}

function saveCard() {
  const front = document.getElementById('cardFrontInput').value.trim();
  const back = document.getElementById('cardBackInput').value.trim();
  if (!front || !back) {
    document.getElementById('cardError').textContent = 'Please fill in both sides.';
    return;
  }

  const editId = document.getElementById('cardModal').dataset.editId;
  const deckCards = state.cardsByDeckId[state.activeDeckId];

  if (editId) {
    const card = deckCards.find(c => c.id === editId);
    if (card) { card.front = front; card.back = back; card.updatedAt = Date.now(); }
  } else {
    deckCards.push({ id: generateId(), front, back, updatedAt: Date.now() });
    state.studyIndex = deckCards.length - 1;
  }

  saveState();
  hideModal('cardModal');
  renderCards();
}

function confirmDeleteCard() {
  const cards = getFilteredCards();
  const card = cards[state.studyIndex];
  if (!card) return;
  showConfirm('Delete this card?', () => {
    state.cardsByDeckId[state.activeDeckId] =
      state.cardsByDeckId[state.activeDeckId].filter(c => c.id !== card.id);
    if (state.studyIndex >= getActiveCards().length) state.studyIndex = 0;
    saveState();
    renderCards();
  });
}

// ===== NAVIGATION =====
function flipCard() {
  document.getElementById('flashcard').classList.toggle('flipped');
}

function prevCard() {
  const cards = getFilteredCards();
  if (!cards.length) return;
  state.studyIndex = (state.studyIndex - 1 + cards.length) % cards.length;
  saveState();
  renderCards();
}

function nextCard() {
  const cards = getFilteredCards();
  if (!cards.length) return;
  state.studyIndex = (state.studyIndex + 1) % cards.length;
  saveState();
  renderCards();
}

function shuffleDeck() {
  const cards = state.cardsByDeckId[state.activeDeckId];
  if (!cards) return;
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  state.studyIndex = 0;
  saveState();
  renderCards();
}

// ===== MODALS =====
function showModal(id) {
  const modal = document.getElementById(id);
  modal.style.display = 'flex';
  const first = modal.querySelector('input, textarea, button');
  if (first) first.focus();
}

function hideModal(id) {
  document.getElementById(id).style.display = 'none';
}

let confirmCallback = null;

function showConfirm(msg, callback) {
  document.getElementById('confirmMsg').textContent = msg;
  confirmCallback = callback;
  showModal('confirmModal');
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', e => {
  const anyModalOpen =
    document.getElementById('deckModal').style.display === 'flex' ||
    document.getElementById('cardModal').style.display === 'flex' ||
    document.getElementById('confirmModal').style.display === 'flex';

  if (e.key === 'Escape') {
    hideModal('deckModal');
    hideModal('cardModal');
    hideModal('confirmModal');
    return;
  }

  if (anyModalOpen) return;

  if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    flipCard();
  }
  if (e.key === 'ArrowLeft') prevCard();
  if (e.key === 'ArrowRight') nextCard();
});

// ===== SEARCH =====
let searchTimeout;
document.getElementById('searchInput').addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    state.studyIndex = 0;
    renderCards();
  }, 300);
});

// ===== WIRE UP BUTTONS =====
document.getElementById('newDeckBtn').addEventListener('click', openNewDeckModal);
document.getElementById('editDeckBtn').addEventListener('click', openEditDeckModal);
document.getElementById('deleteDeckBtn').addEventListener('click', confirmDeleteDeck);
document.getElementById('deckSaveBtn').addEventListener('click', saveDeck);
document.getElementById('deckCancelBtn').addEventListener('click', () => hideModal('deckModal'));

document.getElementById('newCardBtn').addEventListener('click', openNewCardModal);
document.getElementById('editCardBtn').addEventListener('click', openEditCardModal);
document.getElementById('deleteCardBtn').addEventListener('click', confirmDeleteCard);
document.getElementById('cardSaveBtn').addEventListener('click', saveCard);
document.getElementById('cardCancelBtn').addEventListener('click', () => hideModal('cardModal'));

document.getElementById('flipBtn').addEventListener('click', flipCard);
document.getElementById('flashcard').addEventListener('click', flipCard);
document.getElementById('prevBtn').addEventListener('click', prevCard);
document.getElementById('nextBtn').addEventListener('click', nextCard);
document.getElementById('shuffleBtn').addEventListener('click', shuffleDeck);

document.getElementById('confirmOkBtn').addEventListener('click', () => {
  if (confirmCallback) confirmCallback();
  hideModal('confirmModal');
});
document.getElementById('confirmCancelBtn').addEventListener('click', () => hideModal('confirmModal'));

// ===== ENTER KEY IN DECK NAME INPUT =====
document.getElementById('deckNameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') saveDeck();
});

// ===== START =====
loadState();
render();