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

function setupListeners() {
  document.getElementById("btn-login")?.addEventListener("click", login);
  document.querySelector("button[onclick='drawCard()']")?.addEventListener("click", drawCard);
  document.querySelector("button[onclick='initiateDiscardSwap()']")?.addEventListener("click", initiateDiscardSwap);
  document.querySelector("button[onclick='declareCactus()']")?.addEventListener("click", declareCactus);
  document.querySelector("button[onclick='skipSpecial()']")?.addEventListener("click", skipSpecial);
}

window.addEventListener("DOMContentLoaded", setupListeners);

function login() {
  const username = document.getElementById("username").value.trim();
  if (!username) return alert("Entre un pseudo pour continuer.");
  sessionStorage.setItem("username", username);
  document.getElementById("welcome").style.display = "none";
  document.getElementById("config").style.display = "block";
  document.getElementById("player-name").innerText = username;
  log(`👋 Bienvenue, ${username} !`);
}

function drawCard() {
  if (drawnCard !== null) return;
  drawnCard = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
  document.getElementById("new-card").innerText = drawnCard;
  document.getElementById("drawn-card").style.display = "block";

  if (!document.getElementById("discard-drawn")) {
    const discardBtn = document.createElement("button");
    discardBtn.innerText = "Défausser la carte";
    discardBtn.id = "discard-drawn";
    discardBtn.style.marginTop = "10px";
    discardBtn.onclick = discardDrawnCard;
    document.getElementById("drawn-card").after(discardBtn);
  }
  log(`🃏 Carte piochée : ${drawnCard}`);
}

function discardDrawnCard() {
  if (!drawnCard) return;
  discardPile.push(drawnCard);
  document.getElementById("discard").innerText = drawnCard;
  drawnCard = null;
  document.getElementById("drawn-card").style.display = "none";
  document.getElementById("discard-drawn")?.remove();
  renderCards();
  log("🗑 Carte piochée défaussée.");
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
    cardDiv.onclick = () => attemptCardSwap(i);

    const discardBtn = document.createElement("button");
    discardBtn.innerText = "🗑";
    discardBtn.classList.add("discard-btn");
    discardBtn.onclick = (e) => {
      e.stopPropagation();
      discardCardFromHand(i);
    };

    cardWrapper.appendChild(discardBtn);
    cardWrapper.appendChild(cardDiv);
    div.appendChild(cardWrapper);
  });
  container.appendChild(div);
}

function attemptCardSwap(index) {
  if (drawnCard === null) return;
  const replaced = playerCards[index];
  playerCards[index] = drawnCard;
  discardPile.push(replaced);
  drawnCard = null;
  document.getElementById("drawn-card").style.display = "none";
  document.getElementById("discard").innerText = replaced;
  document.getElementById("discard-drawn")?.remove();
  renderCards();
  log(`🔄 Carte échangée avec la main : ${replaced}`);
}

function discardCardFromHand(index) {
  const card = playerCards[index];
  discardPile.push(card);
  document.getElementById("discard").innerText = card;
  playerCards[index] = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
  log(`🗑 Carte manuelle défaussée : ${card}. Pénalité reçue.`);
  renderCards();
}

function initiateDiscardSwap() {
  if (drawnCard !== null || discardPile.length === 0) return;
  drawnCard = discardPile.pop();
  document.getElementById("new-card").innerText = drawnCard;
  document.getElementById("drawn-card").style.display = "block";
  if (!document.getElementById("discard-drawn")) {
    const discardBtn = document.createElement("button");
    discardBtn.innerText = "Défausser la carte";
    discardBtn.id = "discard-drawn";
    discardBtn.style.marginTop = "10px";
    discardBtn.onclick = discardDrawnCard;
    document.getElementById("drawn-card").after(discardBtn);
  }
  log(`🔁 Carte prise dans la défausse : ${drawnCard}`);
}

function declareCactus() {
  log("🌵 Cactus déclaré !");
}

function skipSpecial() {
  log("⏭ Action spéciale ignorée.");
}

// Simulation de main pour démo locale (à retirer quand connecté à Firebase)
window.addEventListener("DOMContentLoaded", () => {
  playerCards = Array.from({ length: 4 }, () => CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)]);
  renderCards();
});
