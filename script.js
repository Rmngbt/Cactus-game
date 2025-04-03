// ✅ script.js avec gestion des cartes visibles, interactions et défausse
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getDatabase, ref, set, onValue, off } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";

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

let playerCards = [], botCards = [], discardPile = [], drawnCard = null;
let startVisibleCount = 2, cardCount = 4, currentPlayer = "Toi";

const CARD_POOL = ["R", "A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "V", "D"];
const log = (msg) => {
  document.getElementById("log").innerHTML += `<p>${msg}</p>`;
  console.log(msg);
};

function login() {
  const username = document.getElementById("username").value.trim();
  if (!username) return alert("Entre un pseudo pour continuer.");
  sessionStorage.setItem("username", username);
  document.getElementById("welcome").style.display = "none";
  document.getElementById("config").style.display = "block";
  document.getElementById("player-name").innerText = username;
  log(`👋 Bienvenue, ${username} !`);
}

function safeCreateRoom() {
  log("🧪 Création fictive d'une partie...");
  document.getElementById("config").style.display = "none";
  document.getElementById("lobby").style.display = "block";
  document.getElementById("lobby-room").innerText = "TEST123";
  document.getElementById("lobby-players").innerHTML = `<li>Toi (hôte)</li><li>Bot</li>`;
  document.getElementById("btn-launch-setup").style.display = "inline-block";
}

function joinRoom() {
  log("🧪 Rejoint fictivement une partie...");
  document.getElementById("config").style.display = "none";
  document.getElementById("lobby").style.display = "block";
  document.getElementById("lobby-room").innerText = "TEST123";
}

function launchSetup() {
  document.getElementById("lobby").style.display = "none";
  document.getElementById("setup").style.display = "block";
}

function saveGameConfig() {
  startVisibleCount = parseInt(document.getElementById("visible-count").value);
  cardCount = parseInt(document.getElementById("card-count").value);
  log("💾 Config sauvegardée.");
}

function startNewGame() {
  document.getElementById("setup").style.display = "none";
  document.getElementById("game").style.display = "block";
  playerCards = Array.from({ length: cardCount }, () => CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)]);
  botCards = Array.from({ length: cardCount }, () => CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)]);
  renderCards();
  updateTurn();
}

function drawCard() {
  if (currentPlayer !== "Toi") return log("⛔ Ce n'est pas ton tour !");
  drawnCard = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
  log(`🃏 Carte piochée : ${drawnCard}`);
  showDrawnCard();
}

function showDrawnCard() {
  const drawnDiv = document.getElementById("drawn-card");
  drawnDiv.style.display = "block";
  document.getElementById("new-card").innerText = drawnCard;
  if (!document.getElementById("discard-drawn")) {
    const btn = document.createElement("button");
    btn.id = "discard-drawn";
    btn.innerText = "Défausser la carte";
    btn.onclick = discardDrawnCard;
    drawnDiv.after(btn);
  }
}

function discardDrawnCard() {
  if (!drawnCard) return;
  discardPile.push(drawnCard);
  log(`🗑 Carte défaussée : ${drawnCard}`);
  drawnCard = null;
  document.getElementById("drawn-card").style.display = "none";
  document.getElementById("discard-drawn")?.remove();
  renderCards();
}

function attemptCardSwap(index) {
  if (drawnCard === null) return;
  const old = playerCards[index];
  playerCards[index] = drawnCard;
  discardPile.push(old);
  log(`🔄 Carte échangée : ${old} → ${drawnCard}`);
  drawnCard = null;
  document.getElementById("drawn-card").style.display = "none";
  document.getElementById("discard-drawn")?.remove();
  renderCards();
}

function discardCardFromHand(index) {
  const card = playerCards[index];
  discardPile.push(card);
  playerCards[index] = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
  log(`🗑 Défausse volontaire de la carte ${card}`);
  renderCards();
}

function initiateDiscardSwap() {
  if (currentPlayer !== "Toi") return log("⛔ Ce n'est pas ton tour !");
  if (discardPile.length === 0) return log("❌ Aucune carte dans la défausse");
  drawnCard = discardPile.pop();
  log(`🔁 Carte récupérée de la défausse : ${drawnCard}`);
  showDrawnCard();
}

function renderCards() {
  const container = document.getElementById("all-players");
  container.innerHTML = "";

  // Toi
  const div1 = document.createElement("div");
  div1.className = "player-hand";
  div1.innerHTML = "<h3>Toi</h3>";

  playerCards.forEach((card, i) => {
    const wrap = document.createElement("div");
    wrap.className = "card-wrapper";

    const c = document.createElement("div");
    c.className = "card";
    c.innerText = "?";
    c.dataset.index = i;

    c.onclick = () => {
      if (!c.classList.contains("revealed")) {
        c.classList.add("revealed");
        c.innerText = card;
        setTimeout(() => {
          c.innerText = "?";
          c.classList.remove("revealed");
        }, 5000);
      }
    };

    const trash = document.createElement("button");
    trash.innerText = "🗑";
    trash.className = "discard-btn";
    trash.onclick = () => discardCardFromHand(i);

    wrap.appendChild(trash);
    wrap.appendChild(c);
    div1.appendChild(wrap);
  });

  const div2 = document.createElement("div");
  div2.className = "player-hand";
  div2.innerHTML = "<h3>Bot</h3>";

  botCards.forEach((card, i) => {
    const wrap = document.createElement("div");
    wrap.className = "card-wrapper";

    const c = document.createElement("div");
    c.className = "card";
    c.innerText = "?";
    c.onclick = () => attemptBotCardPlay(i, card);

    const trash = document.createElement("button");
    trash.innerText = "🗑";
    trash.className = "discard-btn";
    trash.onclick = () => attemptBotCardPlay(i, card);

    wrap.appendChild(trash);
    wrap.appendChild(c);
    div2.appendChild(wrap);
  });

  container.appendChild(div1);
  container.appendChild(div2);
}

 

function revealCardTemporarily(cardElement, actualValue) {
  cardElement.innerText = actualValue;
  setTimeout(() => {
    cardElement.innerText = "?";
  }, 5000);
}

function attemptBotCardPlay(index, botCard) {
  const topDiscard = discardPile[discardPile.length - 1];
  if (botCard === topDiscard) {
    log(`🎯 Bonne pioche ! Carte ${botCard} défaussée du Bot. Tu lui donnes une de tes cartes.`);
    discardPile.push(botCards[index]);
    botCards[index] = playerCards.pop();
  } else {
    log(`❌ Mauvaise tentative. Tu prends une carte de pénalité.`);
    playerCards.push(CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)]);
  }
  renderCards();
}


function updateTurn() {
  document.getElementById("turn-info").innerText = `Tour de : ${currentPlayer}`;
}

function setupListeners() {
  document.getElementById("btn-login")?.addEventListener("click", login);
  document.getElementById("btn-create-room")?.addEventListener("click", safeCreateRoom);
  document.getElementById("btn-join-room")?.addEventListener("click", joinRoom);
  document.getElementById("btn-launch-setup")?.addEventListener("click", launchSetup);
  document.getElementById("btn-save-config")?.addEventListener("click", saveGameConfig);
  document.getElementById("btn-start-game")?.addEventListener("click", startNewGame);
  document.getElementById("btn-draw-card")?.addEventListener("click", drawCard);
  document.getElementById("btn-discard-swap")?.addEventListener("click", initiateDiscardSwap);
  document.getElementById("btn-declare-cactus")?.addEventListener("click", () => log("🌵 Cactus !"));
  document.getElementById("skip-special")?.addEventListener("click", () => log("⏭ Spéciale ignorée"));
}

window.addEventListener("DOMContentLoaded", () => {
  setupListeners();
});
