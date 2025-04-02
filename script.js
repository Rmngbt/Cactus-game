// ✅ script.js corrigé : interactions visibles + boutons fonctionnels
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

let playerCards = [], discardPile = [], drawnCard = null;
let startVisibleCount = 2, cardCount = 4, currentPlayer = 1;

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

  document.getElementById("lobby-players").innerHTML = `
    <li>Toi (hôte)</li>
    <li>Bot</li>
  `;

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
  log("💾 Config sauvegardée (mock).");
}

function startNewGame() {
  document.getElementById("setup").style.display = "none";
  document.getElementById("game").style.display = "block";
  playerCards = Array.from({ length: 4 }, () => CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)]);
  renderCards();
}

function drawCard() {
  drawnCard = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
  log(`🃏 Carte piochée : ${drawnCard}`);
}

function initiateDiscardSwap() {
  if (discardPile.length === 0) return log("❌ Aucune carte dans la défausse");
  drawnCard = discardPile.pop();
  log(`🔁 Carte récupérée de la défausse : ${drawnCard}`);
}

function declareCactus() {
  log("🌵 Cactus annoncé !");
}

function skipSpecial() {
  log("⏭ Action spéciale ignorée.");
}

function renderCards() {
  const container = document.getElementById("all-players");
  container.innerHTML = "";
  const div = document.createElement("div");
  div.className = "player-hand";
  playerCards.forEach((card, i) => {
    const cardDiv = document.createElement("div");
    cardDiv.className = "card";
    cardDiv.innerText = card;
    div.appendChild(cardDiv);
  });
  container.appendChild(div);
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
  document.getElementById("btn-declare-cactus")?.addEventListener("click", declareCactus);
  document.getElementById("skip-special")?.addEventListener("click", skipSpecial);
}

window.addEventListener("DOMContentLoaded", () => {
  setupListeners();
});