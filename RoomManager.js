// === Gestion des salons multijoueurs ===
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";
import { db } from "./FirebaseSync.js";

export function createRoom(username) {
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  sessionStorage.setItem("roomId", roomId);
  sessionStorage.setItem("username", username);
  sessionStorage.setItem("isHost", "true");

  set(ref(db, `games/${roomId}/players/${username}`), { connected: true });
  set(ref(db, `games/${roomId}/host`), username);
  set(ref(db, `games/${roomId}/currentPlayer`), 1);
  set(ref(db, `games/${roomId}/state`), "lobby");

  document.getElementById("config").style.display = "none";
  document.getElementById("lobby").style.display = "block";
  document.getElementById("lobby-room").innerText = roomId;
  logAction("🔧 Partie créée. Code : " + roomId);
  logAction("👤 Joueur ajouté : " + username);
  watchLobbyPlayers(roomId);
}

export function joinRoom(username, inputRoomId) {
  const roomId = inputRoomId.trim().toUpperCase();
  if (!roomId || !username) return alert("Veuillez entrer un code de partie et un pseudo valides.");

  sessionStorage.setItem("roomId", roomId);
  sessionStorage.setItem("username", username);
  sessionStorage.setItem("isHost", "false");

  set(ref(db, `games/${roomId}/players/${username}`), { connected: true });

  document.getElementById("config").style.display = "none";
  document.getElementById("lobby").style.display = "block";
  document.getElementById("lobby-room").innerText = roomId;
  watchLobbyPlayers(roomId);
  logAction("🔗 Rejoint la partie : " + roomId);
}

function watchLobbyPlayers(roomId) {
  const lobbyDiv = document.getElementById("lobby-players");
  const startBtn = document.getElementById("start-game");
  const playersRef = ref(db, `games/${roomId}/players`);
  const hostRef = ref(db, `games/${roomId}/host`);

  onValue(playersRef, (snapshot) => {
    const players = snapshot.val();
    if (!players) return;
    const list = Object.keys(players).map(name => `<li>${name}</li>`).join("");
    lobbyDiv.innerHTML = `<ul>${list}</ul>`;
  });

  onValue(hostRef, (snap) => {
    const host = snap.val();
    const username = sessionStorage.getItem("username");
    startBtn.style.display = (host === username) ? "inline-block" : "none";
  });
}

export function launchSetup() {
  const roomId = sessionStorage.getItem("roomId");
  set(ref(db, `games/${roomId}/state`), "setup");
  document.getElementById("lobby").style.display = "none";
  document.getElementById("setup").style.display = "block";
  logAction("🟢 Configuration de la partie prête.");
}
