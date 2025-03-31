// firebase-sync.js
import { db, ref, set, onValue } from './firebase-init.js';

// Synchronise le tour actuel vers Firebase
export function syncTurnToFirebase(turn) {
  const roomId = sessionStorage.getItem("roomId");
  if (!roomId) return;
  set(ref(db, `games/${roomId}/currentPlayer`), turn);
}

// Écoute le changement de joueur
export function listenToTurnChanges(currentPlayerCallback, renderCallback, logCallback, updateTurnCallback) {
  const roomId = sessionStorage.getItem("roomId");
  if (!roomId) return;
  const turnRef = ref(db, `games/${roomId}/currentPlayer`);

  onValue(turnRef, (snapshot) => {
    const val = snapshot.val();
    if (val !== null) {
      currentPlayerCallback(val);
      updateTurnCallback();
      renderCallback();
      logCallback("🔄 Tour mis à jour : Joueur " + val);
    }
  });
}

// Écoute le lancement de la configuration de la partie
export function listenToGameStateChange(setupCallback, logCallback) {
  const roomId = sessionStorage.getItem("roomId");
  if (!roomId) return;
  const stateRef = ref(db, `games/${roomId}/state`);

  onValue(stateRef, (snap) => {
    const state = snap.val();
    if (state === "setup") {
      setupCallback();
      logCallback("🟢 Le créateur a lancé la configuration de la partie.");
    }
  });
}

// Envoie une action pour changer l'état du jeu vers 'setup'
export function triggerSetupState() {
  const roomId = sessionStorage.getItem("roomId");
  if (!roomId) return;
  set(ref(db, `games/${roomId}/state`), "setup");
}
