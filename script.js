// script.js (version clean et fonctionnelle)
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

// === UI & État ===
let playerCards = [], discardPile = [], drawnCard = null;
let startVisibleCount = 2, cardCount = 4, currentPlayer = 1;

// === Utils ===
const CARD_POOL = ["R", "A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "V", "D"];
const log = (msg) => {
  document.getElementById("log").innerHTML += `<p>${msg}</p>`;
  console.log(msg);
};

// === Auth ===
window.login = function () {
  const username = document.getElementById("username").value.trim();
  if (!username) return alert("Entre un pseudo pour continuer.");
  sessionStorage.setItem("username", username);
  document.getElementById("welcome").style.display = "none";
  document.getElementById("config").style.display = "block";
  document.getElementById("player-name").innerText = username;
  log(`👋 Bienvenue, ${username} !`);
};

// === Création / Rejoindre ===
window.safeCreateRoom = function () {
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

  watchLobby(roomId);
};

window.joinRoom = function () {
  const roomId = document.getElementById("room-code").value.trim().toUpperCase();
  const username = sessionStorage.getItem("username");
  if (!roomId || !username) return alert("Code ou pseudo manquant.");

  sessionStorage.setItem("roomId", roomId);
  sessionStorage.setItem("isHost", "false");
  set(ref(db, `games/${roomId}/players/${username}`), { connected: true });

  document.getElementById("config").style.display = "none";
  document.getElementById("lobby").style.display = "block";
  document.getElementById("lobby-room").innerText = roomId;

  watchLobby(roomId);
};

function watchLobby(roomId) {
  const playersRef = ref(db, `games/${roomId}/players`);
  const hostRef = ref(db, `games/${roomId}/host`);
  const stateRef = ref(db, `games/${roomId}/state`);

  onValue(playersRef, snap => {
    const players = Object.keys(snap.val() || {});
    document.getElementById("lobby-players").innerHTML = players.map(p => `<li>${p}</li>`).join("");
    if (players.length >= 2) document.getElementById("start-game").style.display = "inline-block";
  });

  onValue(hostRef, snap => {
    const host = snap.val();
    const isHost = sessionStorage.getItem("username") === host;
    document.getElementById("start-game").style.display = isHost ? "inline-block" : "none";
  });

  onValue(stateRef, snap => {
    const state = snap.val();
    if (state === "setup") {
      document.getElementById("lobby").style.display = "none";
      document.getElementById("setup").style.display = "block";
    }
    if (state === "started") {
      document.getElementById("setup").style.display = "none";
      document.getElementById("game").style.display = "block";
      startGame();
    }
  });
}

window.launchSetup = function () {
  const roomId = sessionStorage.getItem("roomId");
  set(ref(db, `games/${roomId}/state`), "setup");
};

window.saveGameConfig = function () {
  const roomId = sessionStorage.getItem("roomId");
  const config = {
    cardCount: parseInt(document.getElementById("card-count").value),
    targetScore: parseInt(document.getElementById("target-score").value),
    startVisibleCount: parseInt(document.getElementById("visible-count").value)
  };
  set(ref(db, `games/${roomId}/config`), config);
  log("💾 Configuration enregistrée");
};

window.startNewGame = function () {
  const roomId = sessionStorage.getItem("roomId");
  const cardCount = parseInt(document.getElementById("card-count").value);
  const playersRef = ref(db, `games/${roomId}/players`);

  onValue(playersRef, snap => {
    const players = Object.keys(snap.val());
    players.forEach(p => {
      const hand = Array.from({ length: cardCount }, () => CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)]);
      set(ref(db, `games/${roomId}/hands/${p}`), hand);
    });
    set(ref(db, `games/${roomId}/state`), "started");
    off(playersRef);
  });
};

function startGame() {
  const roomId = sessionStorage.getItem("roomId");
  const username = sessionStorage.getItem("username");
  const handsRef = ref(db, `games/${roomId}/hands/${username}`);

  onValue(handsRef, snap => {
    playerCards = snap.val() || [];
    renderCards();
    revealInitialCards();
    updateTurnInfo();
  });
}

function renderCards() {
  const container = document.getElementById("all-players");
  container.innerHTML = "";

  const div = document.createElement("div");
  div.className = "player-hand";
  playerCards.forEach((_, i) => {
    const cardWrapper = document.createElement("div");
    cardWrapper.classList.add("card-wrapper");

    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");
    cardDiv.dataset.index = i;
    cardDiv.innerText = "?";

    cardWrapper.appendChild(cardDiv);
    div.appendChild(cardWrapper);
  });
  container.appendChild(div);
}

function revealInitialCards() {
  const start = parseInt(document.getElementById("visible-count").value) || 2;
  const cards = document.querySelectorAll(".card");
  let revealed = 0;

  cards.forEach(card => {
    card.classList.add("selectable-start");
    card.onclick = () => {
      if (revealed >= start) return;
      const i = parseInt(card.dataset.index);
      card.innerText = playerCards[i];
      revealed++;
      if (revealed === start) {
        log("👀 Cartes de départ vues.");
        setTimeout(() => renderCards(), 4000);
      }
    };
  });
}

function updateTurnInfo() {
  document.getElementById("turn-info").innerText = `Tour du joueur ${currentPlayer}`;
}

// === Game Actions (simplifiées) ===
window.drawCard = function () {
  if (drawnCard !== null) return;
  drawnCard = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
  document.getElementById("new-card").innerText = drawnCard;
  document.getElementById("drawn-card").style.display = "block";
  log(`🃏 Carte piochée : ${drawnCard}`);
};

window.initiateDiscardSwap = function () {
  if (drawnCard !== null || discardPile.length === 0) return;
  drawnCard = discardPile.pop();
  document.getElementById("new-card").innerText = drawnCard;
  document.getElementById("drawn-card").style.display = "block";
  log(`🔁 Carte prise dans la défausse : ${drawnCard}`);
};

window.discardDrawnCard = function () {
  if (!drawnCard) return;
  discardPile.push(drawnCard);
  document.getElementById("discard").innerText = drawnCard;
  drawnCard = null;
  document.getElementById("drawn-card").style.display = "none";
  renderCards();
};

window.declareCactus = function () {
  log("🌵 Cactus ! Fin imminente de la manche.");
};

window.skipSpecial = function () {
  log("⏭ Action spéciale ignorée");
};
