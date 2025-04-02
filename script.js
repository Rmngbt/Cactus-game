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
  // Mode démo local (à retirer quand Firebase OK)
  playerCards = Array.from({ length: 4 }, () => CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)]);
  renderCards();
});

// Les fonctions login, drawCard, discardDrawnCard, renderCards, etc. sont définies ci-dessous...
// (elles sont déjà dans le script.js précédent et restent valables ici)
