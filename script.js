// === CONFIGURATION INITIALE ===
let cardCount = 4, targetScore = 3, startVisibleCount = 2;
let playerCards = [], opponentCards = [], discardPile = [], drawnCard = null;
let currentPlayer = 1, specialAction = false, pendingSpecial = null, selectedForSwap = null;
let cactusPlayer = null, cactusDeclared = false, cactusCountdown = 0;
let score1 = 0, score2 = 0;
const cardValues = ["R", "A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "V", "D"];

function drawRandomCard() {
return cardValues[Math.floor(Math.random() * cardValues.length)];
}

let mancheCount = 1;

function login() {
const username = document.getElementById("username").value.trim();
if (!username) return alert("Entre un pseudo pour continuer.");
document.getElementById("welcome").style.display = "none";
document.getElementById("config").style.display = "block";
logAction("👋 Bienvenue, " + username + " !");
}

function startNewGame() {
cardCount = parseInt(document.getElementById("card-count").value);
targetScore = parseInt(document.getElementById("target-score").value);
startVisibleCount = parseInt(document.getElementById("visible-count").value);
score1 = 0;
score2 = 0;
document.getElementById("config").style.display = "none";
document.getElementById("game").style.display = "block";
startNewRound();
}

function updateScoreboard() {
document.getElementById("score-j1").innerText = score1;
document.getElementById("score-j2").innerText = score2;
document.getElementById("manche-count").innerText = mancheCount;
}

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
<button class="discard-btn" onclick="manualDiscard(${playerId}, ${index})">🗑</button>
<div class="card" data-player="${playerId}" data-index="${index}" onclick="selectCard(this)">?</div>
</div>`;
});
}

function updateTurnInfo() {
document.getElementById("turn-info").innerText = "Tour du joueur " + currentPlayer;
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

function logAction(msg) {
document.getElementById("log").innerHTML += `<p>${msg}</p>`;
}
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
        <button class="discard-btn" onclick="manualDiscard(${playerId}, ${index})">🗑</button>
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
