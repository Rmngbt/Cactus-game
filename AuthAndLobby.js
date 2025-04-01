// === AuthAndLobby.js ===

import { logAction } from './script.js';


function login() {
  const username = document.getElementById("username").value.trim();
  if (!username) return alert("Entre un pseudo pour continuer.");
  sessionStorage.setItem("username", username);
  document.getElementById("welcome").style.display = "none";
  document.getElementById("config").style.display = "block";
    logAction(`👋 Bienvenue, ${username} !`);

}

function createRoom() {
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const username = sessionStorage.getItem("username") || "joueur" + Math.floor(Math.random() * 1000);
  sessionStorage.setItem("roomId", roomId);
  sessionStorage.setItem("isHost", "true");
  set(ref(db, `games/${roomId}/players/${username}`), { connected: true });
  set(ref(db, `games/${roomId}/host`), username);
  set(ref(db, `games/${roomId}/currentPlayer`), 1);
  document.getElementById("config").style.display = "none";
  document.getElementById("lobby").style.display = "block";
  document.getElementById("lobby-room").innerText = roomId;
  watchLobbyPlayers(roomId);
 
}

function joinRoom() {
  const roomId = document.getElementById("room-code").value.trim().toUpperCase();
  const username = sessionStorage.getItem("username") || "joueur" + Math.floor(Math.random() * 1000);
  if (!roomId) return alert("Veuillez entrer un code de partie valide.");
  sessionStorage.setItem("roomId", roomId);
  sessionStorage.setItem("isHost", "false");
  set(ref(db, `games/${roomId}/players/${username}`), { connected: true });
  document.getElementById("config").style.display = "none";
  document.getElementById("lobby").style.display = "block";
  document.getElementById("lobby-room").innerText = roomId;
  watchLobbyPlayers(roomId);

}

function watchLobbyPlayers(roomId) {
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
}

function launchSetup() {
  const roomId = sessionStorage.getItem("roomId");
  set(ref(db, `games/${roomId}/state`), "setup");
  document.getElementById("lobby").style.display = "none";
  document.getElementById("setup").style.display = "block";
  
}
window.login = login;
