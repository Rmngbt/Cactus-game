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

let playerCards = [], opponentCards = [], discardPile = [], drawnCard = null;
let currentPlayer = 1, specialAction = false, pendingSpecial = null, selectedForSwap = null;
let cactusDeclared = false, cactusPlayer = null;

function startGameForAll() {
  const roomId = sessionStorage.getItem("roomId");
  const configRef = ref(db, `games/${roomId}/config`);
  onValue(configRef, (snap) => {
    const config = snap.val();
    const cardCount = config?.cardCount || 4;
    const cardPool = ["R", "A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "V", "D"];
    playerCards = Array.from({ length: cardCount }, () => cardPool[Math.floor(Math.random() * cardPool.length)]);
    opponentCards = Array.from({ length: cardCount }, () => cardPool[Math.floor(Math.random() * cardPool.length)]);
    document.getElementById("game").style.display = "block";
    renderCards();
    updateTurnInfo();
    renderScoreboard();
  });
}

function updateTurnInfo() {
  const info = document.getElementById("turn-info");
  if (info) info.innerText = "Tour du joueur " + currentPlayer;
}

function renderScoreboard() {
  const name = sessionStorage.getItem("username") || "Joueur";
  document.getElementById("player-name").innerText = name;
  document.getElementById("scoreboard").style.display = "block";
}

function renderCards() {
  const username = sessionStorage.getItem("username");
  const container = document.getElementById("all-players");
  container.innerHTML = "";

  const roomId = sessionStorage.getItem("roomId");
  if (!roomId) return;

  const playersRef = ref(db, `games/${roomId}/players`);
  onValue(playersRef, (snapshot) => {
    const allPlayers = snapshot.val();
    if (!allPlayers) return;

    Object.keys(allPlayers).forEach((name, index) => {
      const cards = name === username ? playerCards : opponentCards; // temporaire : à adapter
      const playerDiv = document.createElement("div");
      playerDiv.innerHTML = `
        <h3>${name === username ? "Moi : " + name : name}</h3>
        <div class="player-hand" id="cards-${index}">
          ${cards.map((c, i) => `
            <div class="card-wrapper">
              <button class="discard-btn" onclick="manualDiscard(${index + 1}, ${i})">🗑</button>
              <div class="card" data-index="${i}" data-player="${index + 1}" onclick="selectCard(this)">
                ${name === username ? c : "?"}
              </div>
            </div>
          `).join("")}
        </div>
      `;
      container.appendChild(playerDiv);
    });
  });
}

function selectCard(el) {
  const index = parseInt(el.dataset.index);
  const player = parseInt(el.dataset.player);
  const set = player === 1 ? playerCards : opponentCards;
  if (specialAction && pendingSpecial === 8 && player === 1) {
    el.innerText = set[index];
    setTimeout(() => {
      el.innerText = "?";
      specialAction = false;
    }, 3000);
    return;
  }
  if (specialAction && pendingSpecial === 10 && player !== 1) {
    el.innerText = set[index];
    setTimeout(() => {
      el.innerText = "?";
      specialAction = false;
    }, 3000);
    return;
  }
  if (specialAction && pendingSpecial === "V") {
    // Logique échange simplifiée à implémenter
  }
}
window.selectCard = selectCard;

function manualDiscard(player, index) {
  const set = player === 1 ? playerCards : opponentCards;
  const card = set[index];
  const top = discardPile[discardPile.length - 1];
  if (card === top) {
    discardPile.push(card);
    set.splice(index, 1);
    logAction("✅ Carte défaussée : " + card);
  } else {
    discardPile.push(card);
    set[index] = drawRandomCard();
    logAction("❌ Mauvaise défausse. Pénalité !");
  }
  renderCards();
}
window.manualDiscard = manualDiscard;

function drawRandomCard() {
  const pool = ["R", "A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "V", "D"];
  return pool[Math.floor(Math.random() * pool.length)];
}

function declareCactus() {
  if (cactusDeclared) return;
  cactusDeclared = true;
  cactusPlayer = currentPlayer;
  logAction("🌵 Cactus déclaré par le joueur " + currentPlayer);
}
window.declareCactus = declareCactus;

function skipSpecial() {
  specialAction = false;
  pendingSpecial = null;
  selectedForSwap = null;
  logAction("⏭ Action spéciale ignorée");
}
window.skipSpecial = skipSpecial;

function drawCard() {
  if (drawnCard !== null) return;
  drawnCard = drawRandomCard();
  logAction("🃏 Carte piochée : " + drawnCard);
}
window.drawCard = drawCard;

function initiateDiscardSwap() {
  if (drawnCard === null || discardPile.length === 0) return;
  const top = discardPile.pop();
  drawnCard = top;
  logAction("🔁 Carte prise de la défausse : " + top);
}
window.initiateDiscardSwap = initiateDiscardSwap;
