// main.js

import { syncTurnToFirebase, listenToTurnChanges, listenToGameStateChange, triggerSetupState } from './firebase-sync.js';
import { startNewRound } from './script.js';

let cardCount = 4, targetScore = 3, startVisibleCount = 2;
let playerCards = [], opponentCards = [], discardPile = [], drawnCard = null;
let currentPlayer = 1, specialAction = false, pendingSpecial = null, selectedForSwap = null;
let cactusPlayer = null, cactusDeclared = false, cactusCountdown = 0;
let score1 = 0, score2 = 0, mancheCount = 1;
const cardValues = ["R", "A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "V", "D"];

function drawRandomCard() {
  return cardValues[Math.floor(Math.random() * cardValues.length)];
}

window.login = function () {
  const username = document.getElementById("username").value.trim();
  if (!username) return alert("Entre un pseudo pour continuer.");
  sessionStorage.setItem("username", username);
  document.getElementById("welcome").style.display = "none";
  document.getElementById("config").style.display = "block";
  logAction("👋 Bienvenue, " + username + " !");
}

window.safeCreateRoom = function () {
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const username = sessionStorage.getItem("username");
  sessionStorage.setItem("roomId", roomId);
  sessionStorage.setItem("isHost", "true");
  firebaseSet(`games/${roomId}/players/${username}`, { connected: true });
  firebaseSet(`games/${roomId}/host`, username);
  firebaseSet(`games/${roomId}/currentPlayer`, 1);
  document.getElementById("config").style.display = "none";
  document.getElementById("lobby").style.display = "block";
  document.getElementById("lobby-room").innerText = roomId;
  watchLobbyPlayers(roomId);
  logAction("🔧 Partie créée. Code : " + roomId);
  logAction("👤 Joueur ajouté : " + username);
}

window.joinRoom = function () {
  const roomId = document.getElementById("room-code").value.trim().toUpperCase();
  const username = sessionStorage.getItem("username");
  if (!roomId || !username) return alert("Veuillez entrer un code et un pseudo valides.");
  sessionStorage.setItem("roomId", roomId);
  sessionStorage.setItem("isHost", "false");
  firebaseSet(`games/${roomId}/players/${username}`, { connected: true });
  document.getElementById("config").style.display = "none";
  document.getElementById("lobby").style.display = "block";
  document.getElementById("lobby-room").innerText = roomId;
  watchLobbyPlayers(roomId);
  logAction("🔗 Rejoint la partie : " + roomId);
  logAction("👤 Joueur ajouté : " + username);
}

function firebaseSet(path, value) {
  import('./firebase-init.js').then(({ db, ref, set }) => {
    set(ref(db, path), value);
  });
}

function watchLobbyPlayers(roomId) {
  import('./firebase-init.js').then(({ db, ref, onValue }) => {
    const lobbyDiv = document.getElementById("lobby-players");
    const startBtn = document.getElementById("start-game");
    const playersRef = ref(db, `games/${roomId}/players`);
    const hostRef = ref(db, `games/${roomId}/host`);
    onValue(hostRef, (snap) => {
      const host = snap.val();
      const username = sessionStorage.getItem("username");
      startBtn.style.display = (host === username) ? "inline-block" : "none";
    });
    onValue(playersRef, (snapshot) => {
      const players = snapshot.val();
      if (!players) return;
      const list = Object.keys(players).map(name => `<li>${name}</li>`).join("");
      lobbyDiv.innerHTML = `<ul>${list}</ul>`;
    });
  });
}

window.launchSetup = function () {
  triggerSetupState();
  document.getElementById("lobby").style.display = "none";
  document.getElementById("setup").style.display = "block";
  logAction("🟢 Configuration de la partie prête.");
}

window.startNewGame = function () {
  cardCount = parseInt(document.getElementById("card-count").value);
  targetScore = parseInt(document.getElementById("target-score").value);
  startVisibleCount = parseInt(document.getElementById("visible-count").value);
  score1 = 0;
  score2 = 0;
  document.getElementById("setup").style.display = "none";
  document.getElementById("game").style.display = "block";
  import('./firebase-init.js').then(({ db, ref, set }) => {
    const roomId = sessionStorage.getItem("roomId");
    set(ref(db, `games/${roomId}/state`), "start");
  });
  startNewRound();
}

listenToGameStateChange((state) => {
  logAction("🧭 Changement d’état détecté : " + state);
  if (state === "setup") {
    document.getElementById("lobby").style.display = "none";
    document.getElementById("setup").style.display = "block";
    logAction("🟢 Le créateur a lancé la configuration de la partie.");
  } else if (state === "start") {
    const isHost = sessionStorage.getItem("isHost") === "true";
    if (!isHost) {
      document.getElementById("setup").style.display = "none";
      document.getElementById("game").style.display = "block";
      startNewRound();
      logAction("🚀 Partie lancée automatiquement !");
    } else {
      logAction("👑 Host a lancé la partie.");
    }
  }
}, logAction);

listenToTurnChanges((val) => {
  currentPlayer = val;
}, renderCards, logAction, updateTurnInfo);

function logAction(msg) {
  const logDiv = document.getElementById("log");
  if (!logDiv) return;
  logDiv.innerHTML += `<p>${msg}</p>`;
}

function updateTurnInfo() {
  const turnInfo = document.getElementById("turn-info");
  if (turnInfo) turnInfo.innerText = "Tour du joueur " + currentPlayer;
}

function renderCards() {
  // Tu peux ici appeler des fonctions depuis script.js si besoin
}
