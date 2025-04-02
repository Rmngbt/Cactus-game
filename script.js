// script.js (fusionné complet avec logique de jeu)
console.log("✅ script.js bien chargé");

// === Firebase Init ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

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
const auth = getAuth(app);

// === Utilitaires ===
function logAction(msg) {
  const log = document.getElementById("log");
  if (log) log.innerHTML += `<p>${msg}</p>`;
  console.log(msg);
}

// === Auth et connexion ===
function login() {
  const usernameInput = document.getElementById("username");
  const username = usernameInput.value.trim();
  if (!username) return alert("Entre un pseudo pour continuer.");
  sessionStorage.setItem("username", username);
  document.getElementById("welcome").style.display = "none";
  document.getElementById("config").style.display = "block";
  logAction("👋 Bienvenue, " + username + " !");
}
window.login = login;

// === Gestion de salle ===
function safeCreateRoom() {
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const username = sessionStorage.getItem("username");
  sessionStorage.setItem("roomId", roomId);
  sessionStorage.setItem("isHost", "true");
  set(ref(db, `games/${roomId}/players/${username}`), { connected: true });
  set(ref(db, `games/${roomId}/host`), username);
  set(ref(db, `games/${roomId}/currentPlayer`), 1);
  document.getElementById("config").style.display = "none";
  document.getElementById("lobby").style.display = "block";
  document.getElementById("lobby-room").innerText = roomId;
  watchLobbyPlayers(roomId);
  logAction("🔧 Partie créée. Code : " + roomId);
}
window.safeCreateRoom = safeCreateRoom;

function joinRoom() {
  const roomId = document.getElementById("room-code").value.trim().toUpperCase();
  const username = sessionStorage.getItem("username");
  if (!roomId || !username) return alert("Veuillez entrer un code de partie et un pseudo valides.");
  sessionStorage.setItem("roomId", roomId);
  sessionStorage.setItem("isHost", "false");
  set(ref(db, `games/${roomId}/players/${username}`), { connected: true });
  document.getElementById("config").style.display = "none";
  document.getElementById("lobby").style.display = "block";
  document.getElementById("lobby-room").innerText = roomId;
  watchLobbyPlayers(roomId);
  logAction("🔗 Rejoint la partie : " + roomId);
}
window.joinRoom = joinRoom;

function watchLobbyPlayers(roomId) {
  const lobbyDiv = document.getElementById("lobby-players");
  const startBtn = document.getElementById("start-game");
  const playersRef = ref(db, `games/${roomId}/players`);
  const hostRef = ref(db, `games/${roomId}/host`);

  onValue(hostRef, (snap) => {
    const host = snap.val();
    const username = sessionStorage.getItem("username");
    startBtn.style.display = host === username ? "inline-block" : "none";
  });

  onValue(playersRef, (snapshot) => {
    const players = snapshot.val();
    if (!players) return;
    const list = Object.keys(players).map(name => `<li>${name}</li>`).join("");
    lobbyDiv.innerHTML = `<ul>${list}</ul>`;
    if (Object.keys(players).length >= 2) startBtn.style.display = "inline-block";
  });
}

function launchSetup() {
  const isHost = sessionStorage.getItem("isHost");
  if (isHost !== "true") {
    alert("Seul le créateur de la partie peut lancer le jeu.");
    return;
  }
  const roomId = sessionStorage.getItem("roomId");
  if (!roomId) return;
  set(ref(db, `games/${roomId}/state`), "setup");
  document.getElementById("lobby").style.display = "none";
  document.getElementById("setup").style.display = "block";
  logAction("🟢 Configuration de la partie prête.");
}
window.launchSetup = launchSetup;

function triggerSetupState() {
  const roomId = sessionStorage.getItem("roomId");
  if (!roomId) return;
  set(ref(db, `games/${roomId}/state`), "setup");
  document.getElementById("lobby").style.display = "none";
  document.getElementById("setup").style.display = "block";
  logAction("🟢 Configuration de la partie prête.");
}
window.triggerSetupState = triggerSetupState;

// === Synchronisation ===
function syncTurnToFirebase(turn) {
  const roomId = sessionStorage.getItem("roomId");
  if (!roomId) return;
  set(ref(db, `games/${roomId}/currentPlayer`), turn);
}

function listenToGameStateChange(setupCallback) {
  const roomId = sessionStorage.getItem("roomId");
  if (!roomId) return;
  const stateRef = ref(db, `games/${roomId}/state`);

  onValue(stateRef, (snap) => {
    const state = snap.val();
    if (state === "setup") setupCallback();
  });
}

function listenToTurnChanges(callback) {
  const roomId = sessionStorage.getItem("roomId");
  if (!roomId) return;
  const turnRef = ref(db, `games/${roomId}/currentPlayer`);

  onValue(turnRef, (snapshot) => {
    const val = snapshot.val();
    if (val !== null) callback(val);
  });
}

// === Logique de Jeu ===
let playerCards = [], opponentCards = [], discardPile = [];
let currentPlayer = 1;

function startNewGame() {
  const cardCount = parseInt(document.getElementById("card-count").value);
  const targetScore = parseInt(document.getElementById("target-score").value);
  const startVisibleCount = parseInt(document.getElementById("visible-count").value);

  sessionStorage.setItem("cardCount", cardCount);
  sessionStorage.setItem("targetScore", targetScore);
  sessionStorage.setItem("startVisibleCount", startVisibleCount);

  document.getElementById("setup").style.display = "none";
  document.getElementById("game").style.display = "block";
  logAction("🎲 Nouvelle partie lancée !");
  logAction("🃏 Cartes par joueur : " + cardCount + ", Score cible : " + targetScore);

  const cardPool = ["R", "A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "V", "D"];
  playerCards = Array.from({ length: cardCount }, () => cardPool[Math.floor(Math.random() * cardPool.length)]);
  opponentCards = Array.from({ length: cardCount }, () => cardPool[Math.floor(Math.random() * cardPool.length)]);

  renderCards();
  updateTurnInfo();
}
window.startNewGame = startNewGame;

function updateTurnInfo() {
  const info = document.getElementById("turn-info");
  if (info) info.innerText = "Tour du joueur " + currentPlayer;
}

function renderCards() {
  const container1 = document.getElementById("player-cards");
  const container2 = document.getElementById("opponent-cards");
  if (!container1 || !container2) return;

  container1.innerHTML = playerCards.map((c, i) => `
    <div class="card-wrapper">
      <button class="discard-btn" onclick="manualDiscard(1, ${i})">🗑</button>
      <div class="card" data-index="${i}" data-player="1" onclick="selectCard(this)">?</div>
    </div>`).join("");

  container2.innerHTML = opponentCards.map((c, i) => `
    <div class="card-wrapper">
      <button class="discard-btn" onclick="manualDiscard(2, ${i})">🗑</button>
      <div class="card" data-index="${i}" data-player="2" onclick="selectCard(this)">?</div>
    </div>`).join("");
}

// Activation écoute synchronisation setup depuis Firebase
document.addEventListener("DOMContentLoaded", () => {
  listenToGameStateChange(() => {
    document.getElementById("lobby").style.display = "none";
    document.getElementById("setup").style.display = "block";
    logAction("⚙️ Un autre joueur a lancé la configuration.");
  });
});
