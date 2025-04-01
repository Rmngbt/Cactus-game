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
  const log = document.getElementById("log");
  const timestamp = new Date().toLocaleTimeString();
  if (log) log.innerHTML += `<p><strong>[${timestamp}]</strong> ${msg}</p>`;
}

function logDivider(title) {
  const log = document.getElementById("log");
  if (log) log.innerHTML += `<hr><h4>${title}</h4>`;
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
    logAction(`👁 [Joueur ${currentPlayer}] a révélé : ${set[index]}`);
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
    logAction(`🔍 [Joueur ${currentPlayer}] a vu une carte adverse : ${set[index]}`);
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
  logAction(`🔄 [Joueur ${currentPlayer}] échange : ${replaced} ↔ ${set[index]}`);
  const isSpecial = handleSpecialCard(replaced);
  renderCards();
  if (!isSpecial) endTurn();
}

function drawCard() {
  if (drawnCard !== null) return;
  drawnCard = drawRandomCard();
  document.getElementById("new-card").innerText = drawnCard;
  document.getElementById("drawn-card").style.display = "block";
  logAction(`🃏 [Joueur ${currentPlayer}] pioche : ${drawnCard}`);
}

function initiateDiscardSwap() {
  if (discardPile.length === 0 || drawnCard !== null) return;
  drawnCard = discardPile.pop();
  document.getElementById("new-card").innerText = drawnCard;
  document.getElementById("drawn-card").style.display = "block";
  logAction(`🔁 [Joueur ${currentPlayer}] prend dans la défausse : ${drawnCard}`);
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
  logDivider("🌵 Cactus annoncé !");
  logAction(`🌵 Joueur ${currentPlayer} a déclaré Cactus !`);
  endTurn();
}

function startNewRound() {
  logDivider("🎮 Nouvelle manche");
  logAction(`🔁 Manche ${mancheCount} commencée.`);
  playerCards = Array.from({ length: cardCount }, drawRandomCard);
  opponentCards = Array.from({ length: cardCount }, drawRandomCard);
  discardPile = [];
  drawnCard = null;
  specialAction = false;
  pendingSpecial = null;
  selectedForSwap = null;
  cactusDeclared = false;
  cactusPlayer = null;
  currentPlayer = 1;
  renderCards();
  updateTurnInfo();
  document.getElementById("discard").innerText = "Vide";
  document.getElementById("drawn-card").style.display = "none";
  document.getElementById("skip-special").style.display = "none";
  setTimeout(() => revealInitialCards(1), 300);
}

function revealInitialCards(player) {
  const set = player === 1 ? playerCards : opponentCards;
  const containerId = player === 1 ? "player-cards" : "opponent-cards";
  const container = document.getElementById(containerId).children;
  let toReveal = Math.min(startVisibleCount, set.length);
  let revealed = 0;
  logAction(`👆 Joueur ${player}, choisissez ${toReveal} carte(s) à regarder.`);
  for (let i = 0; i < container.length; i++) {
    const cardDiv = container[i].querySelector(".card");
    cardDiv.classList.add("selectable-start");
    cardDiv.addEventListener("click", function handleClick() {
      if (revealed >= toReveal || parseInt(cardDiv.getAttribute("data-player")) !== player) return;
      const index = parseInt(cardDiv.getAttribute("data-index"));
      cardDiv.innerText = set[index];
      revealed++;
      if (revealed === toReveal) {
        logAction(`👀 Joueur ${player} a regardé ses ${toReveal} cartes.`);
        setTimeout(() => {
          for (let j = 0; j < container.length; j++) {
            const c = container[j].querySelector(".card");
            c.classList.remove("selectable-start");
            c.innerText = "?";
          }
          if (player === 1) setTimeout(() => revealInitialCards(2), 500);
        }, 5000);
      }
    });
  }
}

function resetGame() {
  logDivider("🔄 Réinitialisation");
  logAction("🧼 Jeu réinitialisé.");
}

function manualDiscard(player, index) {
  logAction(`🗑 [Joueur ${player}] défausse la carte ${index}`);
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

function handleSpecialCard(card) {
  if (card === 8) {
    specialAction = true;
    pendingSpecial = 8;
    document.getElementById("skip-special").style.display = "inline-block";
    logAction("👁 Effet spécial : regardez une de vos cartes.");
    return true;
  }
  if (card === 10) {
    specialAction = true;
    pendingSpecial = 10;
    document.getElementById("skip-special").style.display = "inline-block";
    logAction("🔍 Effet spécial : regardez une carte adverse.");
    return true;
  }
  if (card === "V") {
    specialAction = true;
    pendingSpecial = "V";
    document.getElementById("skip-special").style.display = "inline-block";
    logAction("🔄 Effet spécial : échangez une carte avec l'adversaire.");
    return true;
  }
  return false;
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
