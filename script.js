// script.js

let cardCount = 4, targetScore = 3, startVisibleCount = 2;
let playerCards = [], opponentCards = [], discardPile = [], drawnCard = null;
let currentPlayer = 1, specialAction = false, pendingSpecial = null, selectedForSwap = null;
let cactusPlayer = null, cactusDeclared = false, cactusCountdown = 0;
let score1 = 0, score2 = 0;
let mancheCount = 1;
const cardValues = ["R", "A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "V", "D"];

function drawRandomCard() {
  return cardValues[Math.floor(Math.random() * cardValues.length)];
}

function updateScoreboard() {
  document.getElementById("score-j1").innerText = score1;
  document.getElementById("score-j2").innerText = score2;
  document.getElementById("manche-count").innerText = mancheCount;
}

function logAction(msg) {
  document.getElementById("log").innerHTML += `<p>${msg}</p>`;
}

function updateTurnInfo() {
  document.getElementById("turn-info").innerText = "Tour du joueur " + currentPlayer;
}

function clearHighlights() {
  document.querySelectorAll('.card').forEach(el => el.classList.remove('highlight'));
}

function renderCards() {
  renderPlayerCards("player-cards", playerCards, 1);
  renderPlayerCards("opponent-cards", opponentCards, 2);
}

function renderPlayerCards(containerId, cards, playerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  cards.forEach((_, index) => {
    container.innerHTML += `
      <div class="card-wrapper">
        <button class="discard-btn" onclick="manualDiscard(${playerId}, ${index})">🖑</button>
        <div class="card" data-player="${playerId}" data-index="${index}" onclick="selectCard(this)">?</div>
      </div>`;
  });
}

function selectCard(cardEl) {
  clearHighlights();
  cardEl.classList.add('highlight');
  const index = parseInt(cardEl.dataset.index);
  const player = parseInt(cardEl.dataset.player);
  const set = player === 1 ? playerCards : opponentCards;
  if (specialAction && pendingSpecial === 8 && player === currentPlayer) {
    if (selectedForSwap !== null) return;
    selectedForSwap = true;
    cardEl.innerText = set[index];
    logAction("👁 Carte révélée : " + set[index]);
    setTimeout(() => {
      cardEl.innerText = "?";
      selectedForSwap = null;
      skipSpecial();
    }, 5000);
    return;
  }
  if (specialAction && pendingSpecial === 10 && player !== currentPlayer) {
    if (selectedForSwap !== null) return;
    selectedForSwap = true;
    cardEl.innerText = set[index];
    logAction("🔍 Carte adverse : " + set[index]);
    setTimeout(() => {
      cardEl.innerText = "?";
      selectedForSwap = null;
      skipSpecial();
    }, 5000);
    return;
  }
  if (specialAction && pendingSpecial === "V") {
    if (!selectedForSwap && player === currentPlayer) {
      selectedForSwap = { player, index };
      logAction("👉 Choisissez une carte adverse à échanger.");
      return;
    }
    if (selectedForSwap && player !== currentPlayer) {
      const setA = selectedForSwap.player === 1 ? playerCards : opponentCards;
      const setB = player === 1 ? playerCards : opponentCards;
      const temp = setA[selectedForSwap.index];
      setA[selectedForSwap.index] = setB[index];
      setB[index] = temp;
      selectedForSwap = null;
      logAction("🔄 Cartes échangées.");
      renderCards();
      skipSpecial();
      return;
    }
  }
  if (player !== currentPlayer || drawnCard === null) return;
  const replaced = set[index];
  set[index] = drawnCard;
  discardPile.push(replaced);
  document.getElementById("discard").innerText = replaced;
  drawnCard = null;
  document.getElementById("drawn-card").style.display = "none";
  logAction("🔄 Carte échangée : " + replaced + " ↔ " + set[index]);
  const isSpecial = handleSpecialCard(replaced);
  renderCards();
  if (!isSpecial) endTurn();
}

function drawCard() {
  if (drawnCard !== null) return;
  drawnCard = drawRandomCard();
  document.getElementById("new-card").innerText = drawnCard;
  document.getElementById("drawn-card").style.display = "block";
  logAction("🃏 Carte piochée : " + drawnCard);
}

function initiateDiscardSwap() {
  if (discardPile.length === 0 || drawnCard !== null) return;
  drawnCard = discardPile.pop();
  document.getElementById("new-card").innerText = drawnCard;
  document.getElementById("drawn-card").style.display = "block";
  logAction("🔁 Carte prise de la défausse : " + drawnCard);
}

function skipSpecial() {
  specialAction = false;
  pendingSpecial = null;
  selectedForSwap = null;
  document.getElementById("skip-special").style.display = "none";
  logAction("⏭ Action spéciale ignorée");
  endTurn();
}

function declareCactus() {
  if (cactusDeclared) return;
  cactusDeclared = true;
  cactusPlayer = currentPlayer;
  logAction("🌵 Joueur " + currentPlayer + " dit Cactus !");
  endTurn();
}

function startNewRound() {
  logAction("🎮 Nouvelle manche démarrée.");
}

function resetGame() {
  logAction("🔁 Jeu réinitialisé.");
}

function manualDiscard(player, index) {
  logAction("🗑 Défausse manuelle de la carte index " + index + " du joueur " + player);
}

function discardDrawnCard() {
  if (!drawnCard) return;
  discardPile.push(drawnCard);
  document.getElementById("discard").innerText = drawnCard;
  document.getElementById("drawn-card").style.display = "none";
  const isSpecial = handleSpecialCard(drawnCard);
  drawnCard = null;
  renderCards();
  if (!isSpecial) endTurn();
}

// Rendre accessibles depuis le HTML
window.selectCard = selectCard;
window.drawCard = drawCard;
window.initiateDiscardSwap = initiateDiscardSwap;
window.skipSpecial = skipSpecial;
window.declareCactus = declareCactus;
window.startNewRound = startNewRound;
window.resetGame = resetGame;
window.manualDiscard = manualDiscard;
window.discardDrawnCard = discardDrawnCard;
