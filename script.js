// script.js (fusionné complet avec logique de jeu + contrôle host + synchro + mécaniques de jeu)
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

function logAction(msg) {
  const log = document.getElementById("log");
  if (log) log.innerHTML += `<p>${msg}</p>`;
  console.log(msg);
}

function login() {
  const usernameInput = document.getElementById("username");
  const username = usernameInput.value.trim();
  if (!username) return alert("Entre un pseudo pour continuer.");
  sessionStorage.setItem("username", username);
  document.getElementById("welcome").style.display = "none";
  document.getElementById("config").style.display = "block";
  document.getElementById("player-name").innerText = username;
  logAction("👋 Bienvenue, " + username + " !");
}
window.login = login;

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
  });

  const stateRef = ref(db, `games/${roomId}/state`);
  onValue(stateRef, (snap) => {
    const state = snap.val();
    const isHost = sessionStorage.getItem("isHost") === "true";

    if (state === "setup") {
      document.getElementById("lobby").style.display = "none";
      if (isHost) {
        document.getElementById("setup").style.display = "block";
        logAction("🟢 Vous configurez la partie.");
      } else {
        document.getElementById("setup").innerHTML = "<p>⏳ L’hôte configure la partie…</p>";
        document.getElementById("setup").style.display = "block";
      }
    }

    if (state === "started") {
      document.getElementById("setup").style.display = "none";
      document.getElementById("game").style.display = "block";
      startGameForAll();
    }
  });
}

function launchSetup() {
  const isHost = sessionStorage.getItem("isHost") === "true";
  const roomId = sessionStorage.getItem("roomId");
  if (!isHost) return alert("Seul l'hôte peut lancer la partie.");
  if (!roomId) return;
  set(ref(db, `games/${roomId}/state`), "setup");
}
window.launchSetup = launchSetup;

function startNewGame() {
  const isHost = sessionStorage.getItem("isHost") === "true";
  if (!isHost) return alert("Seul l'hôte peut démarrer la partie.");
  const roomId = sessionStorage.getItem("roomId");
  set(ref(db, `games/${roomId}/state`), "started");
}
window.startNewGame = startNewGame;

function saveGameConfig() {
  const roomId = sessionStorage.getItem("roomId");
  const configData = {
    cardCount: parseInt(document.getElementById("card-count").value),
    targetScore: parseInt(document.getElementById("target-score").value),
    startVisibleCount: parseInt(document.getElementById("visible-count").value)
  };
  set(ref(db, `games/${roomId}/config`), configData);
  logAction("💾 Configuration enregistrée !");
}
window.saveGameConfig = saveGameConfig;

// === MÉCANIQUES DE JEU SIMPLIFIÉES POUR TEST ===
let playerCards = [];

function drawCard() {
  const card = Math.floor(Math.random() * 10) + 1;
  playerCards.push(card);
  renderCards();
  logAction("🃏 Carte piochée : " + card);
}
window.drawCard = drawCard;

function renderCards() {
  const container = document.getElementById("player-cards");
  container.innerHTML = "";
  playerCards.forEach((val, index) => {
    const card = document.createElement("div");
    card.className = "card highlight";
    card.innerText = val;
    card.onclick = () => selectCard(index);
    container.appendChild(card);
  });
}

function selectCard(index) {
  logAction("🟩 Carte sélectionnée: " + playerCards[index]);
}
window.selectCard = selectCard;

function startGameForAll() {
  logAction("🎮 Début de la partie");
  document.getElementById("game").style.display = "block";
  playerCards = [];
  drawCard();
  drawCard();
  renderCards();
}
