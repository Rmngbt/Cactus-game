// === Partie 1 : Initialisation et configuration ===
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

// === Partie 2 : Début de partie et tours ===
function startNewRound() {
  drawnCard = null;
  discardPile = [];
  specialAction = false;
  pendingSpecial = null;
  selectedForSwap = null;
  cactusPlayer = null;
  cactusDeclared = false;
  cactusCountdown = 0;
  currentPlayer = 1;
  playerCards = Array.from({ length: cardCount }, drawRandomCard);
  opponentCards = Array.from({ length: cardCount }, drawRandomCard);
  document.getElementById("discard").innerText = "Vide";
  document.getElementById("drawn-card").style.display = "none";
  document.getElementById("skip-special").style.display = "none";
  document.getElementById("log").innerHTML = "";
  renderCards();
  updateTurnInfo();
  setTimeout(() => revealInitialCards(1), 500);
}

function revealInitialCards(player) {
  const set = player === 1 ? playerCards : opponentCards;
  const containerId = player === 1 ? "player-cards" : "opponent-cards";
  const container = document.getElementById(containerId).children;
  let toReveal = Math.min(startVisibleCount, set.length);
  let revealed = 0;
  logAction("👆 Joueur " + player + ", choisissez " + toReveal + " carte(s) à regarder.");
  for (let i = 0; i < container.length; i++) {
    const cardDiv = container[i].querySelector(".card");
    cardDiv.classList.add("selectable-start");
    cardDiv.addEventListener("click", function handleClick() {
      if (revealed >= toReveal || parseInt(cardDiv.getAttribute("data-player")) !== player) return;
      const index = parseInt(cardDiv.getAttribute("data-index"));
      cardDiv.innerText = set[index];
      revealed++;
      if (revealed === toReveal) {
        logAction("👀 Joueur " + player + " a regardé ses " + toReveal + " cartes de départ.");
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
  score1 = 0;
  score2 = 0;
  mancheCount = 1;
  document.getElementById("reset-game").style.display = "none";
  updateScoreboard();
  startNewRound();
}

// === Partie 3 : Actions pendant le jeu ===
function drawCard() {
  if (drawnCard !== null) return;
  drawnCard = drawRandomCard();
  document.getElementById("new-card").innerText = drawnCard;
  document.getElementById("drawn-card").style.display = "block";
  logAction("🃏 Carte piochée : " + drawnCard);
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

function initiateDiscardSwap() {
  if (discardPile.length === 0 || drawnCard !== null) return;
  drawnCard = discardPile.pop();
  document.getElementById("new-card").innerText = drawnCard;
  document.getElementById("drawn-card").style.display = "block";
  logAction("🔁 Carte prise de la défausse : " + drawnCard);
}

// === Partie 4 : Cartes spéciales et fin de tour ===
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

// === Partie 5 : Sélection de carte, tours, cactus ===
function endTurn() {
  if (specialAction) return;
  if (cactusDeclared && currentPlayer !== cactusPlayer) {
    revealFinalScores();
    return;
  }
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  updateTurnInfo();
  renderCards();
  logAction("🔁 Tour du joueur " + currentPlayer);
}

function selectCard(cardEl) {
  clearHighlights();
  cardEl.classList.add("highlight");
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
      specialAction = false;
      document.getElementById("skip-special").style.display = "none";
      endTurn();
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
      specialAction = false;
      document.getElementById("skip-special").style.display = "none";
      endTurn();
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
      specialAction = false;
      document.getElementById("skip-special").style.display = "none";
      renderCards();
      logAction("🔄 Cartes échangées.");
      endTurn();
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

function declareCactus() {
  if (cactusDeclared) return;
  cactusDeclared = true;
  cactusPlayer = currentPlayer;
  logAction("🌵 Joueur " + currentPlayer + " dit Cactus !");
  endTurn();
}

function revealFinalScores() {
  mancheCount++;
  updateScoreboard();
  const sum = cards => cards.reduce((t, c) => t + getCardValue(c), 0);
  const total1 = sum(playerCards);
  const total2 = sum(opponentCards);
  renderCards();
  logAction("🧮 Joueur 1 : " + total1);
  logAction("🧮 Joueur 2 : " + total2);
  if (playerCards.every(c => c === "R")) logAction("👑 Joueur 1 a un Cactus Royal !");
  if (opponentCards.every(c => c === "R")) logAction("👑 Joueur 2 a un Cactus Royal !");
  if (total1 <= 5 || total2 <= 5) {
    const winner = total1 < total2 ? 1 : total2 < total1 ? 2 : "égalité";
    if (winner === "égalité") logAction("🤝 Égalité sous les 5 points !");
    else {
      logAction("🏆 Joueur " + winner + " remporte la manche !");
      if (winner === 1) score1++;
      if (winner === 2) score2++;
      logAction("📊 Scores : J1=" + score1 + " | J2=" + score2);
      if (score1 >= targetScore || score2 >= targetScore) {
        logAction("🎉 Joueur " + (score1 >= targetScore ? 1 : 2) + " remporte la partie !");
        document.getElementById("reset-game").style.display = "inline-block";
      }
    }
  } else logAction("❌ Aucun joueur n’a réussi le Cactus.");
}

function getCardValue(card) {
  if (card === "R") return 0;
  if (card === "A") return 1;
  if (card === 2) return -2;
  if (["V", "D"].includes(card)) return 10;
  return typeof card === "number" ? card : 10;
}
// === Partie 6 : Intégration Firebase ===

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBd2O4MWVNlY5MOVffdcvMrkj2lLxJcdv0",
  authDomain: "cactus-game-12ae9.firebaseapp.com",
  projectId: "cactus-game-12ae9",
  storageBucket: "cactus-game-12ae9.appspot.com",
  messagingSenderId: "852427558969",
  appId: "1:852427558969:web:0b292c74c6305dc348fde8",
  databaseURL: "https://cactus-game-12ae9-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.syncTurnToFirebase = function (turn) {
  const roomId = sessionStorage.getItem("roomId");
  if (!roomId) return;
  set(ref(db, `games/${roomId}/currentPlayer`), turn);
};

const roomId = sessionStorage.getItem("roomId");
if (roomId) {
  const turnRef = ref(db, `games/${roomId}/currentPlayer`);
  onValue(turnRef, (snapshot) => {
    const val = snapshot.val();
    if (val !== null && val !== currentPlayer) {
      currentPlayer = val;
      updateTurnInfo();
      renderCards();
      logAction("🔄 Tour mis à jour : Joueur " + currentPlayer);
    }
  });

  const stateRef = ref(db, `games/${roomId}/state`);
  onValue(stateRef, (snap) => {
    const state = snap.val();
    if (state === "setup") {
      document.getElementById("lobby").style.display = "none";
      document.getElementById("setup").style.display = "block";
      logAction("🟢 Le créateur a lancé la configuration de la partie.");
    }
  });
}

export { db, ref, set, onValue };
