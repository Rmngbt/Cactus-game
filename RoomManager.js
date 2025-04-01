// RoomManager.js
import { db, ref, set, onValue } from './firebase-init.js';
import { triggerSetupState } from './firebase-sync.js';
import { logAction } from './logUtils.js';

// Crée une nouvelle partie et enregistre le joueur comme hôte
export function createRoom(username) {
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  sessionStorage.setItem("roomId", roomId);
  sessionStorage.setItem("username", username);
  sessionStorage.setItem("isHost", "true");

  set(ref(db, `games/${roomId}/players/${username}`), { connected: true });
  set(ref(db, `games/${roomId}/host`), username);
  set(ref(db, `games/${roomId}/currentPlayer`), 1);

  document.getElementById("config").style.display = "none";
  document.getElementById("lobby").style.display = "block";
  document.getElementById("lobby-room").innerText = roomId;
  watchLobbyPlayers(roomId);
  logAction(`🔧 Partie créée. Code : ${roomId}`);
  logAction(`👤 Joueur ajouté : ${username}`);
}

// Rejoint une partie existante
export function joinRoom() {
  const roomId = document.getElementById("room-code").value.trim().toUpperCase();
  const username = sessionStorage.getItem("username");
  if (!roomId || !username) return alert("Veuillez entrer un code de partie et un pseudo valides.");

  sessionStorage.setItem("roomId", roomId);
  sessionStorage.setItem("username", username);
  sessionStorage.setItem("isHost", "false");

  set(ref(db, `games/${roomId}/players/${username}`), { connected: true });

  document.getElementById("config").style.display = "none";
  document.getElementById("lobby").style.display = "block";
  document.getElementById("lobby-room").innerText = roomId;
  watchLobbyPlayers(roomId);
  logAction(`🔗 Rejoint la partie : ${roomId}`);
  logAction(`👤 Joueur ajouté : ${username}`);
}

// Surveille les joueurs dans le salon
export function watchLobbyPlayers(roomId) {
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

// Lance la configuration de la partie
export function launchSetup() {
  triggerSetupState();
  document.getElementById("lobby").style.display = "none";
  document.getElementById("setup").style.display = "block";
  logAction("🟢 Configuration de la partie prête.");
}

// Ajoute une fonction sûre pour la création de partie
function safeCreateRoom() {
  const username = sessionStorage.getItem("username");
  if (!username) {
    alert("Pseudo manquant. Veuillez vous reconnecter.");
    return;
  }
  createRoom(username);
}

export { safeCreateRoom };
