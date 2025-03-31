// FirebaseSync.js

// Ce fichier gère la synchronisation des tours et de l'état entre les joueurs via Firebase
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";

export function initializeFirebaseSync(db, onTurnChange, onStateChange) {
  const roomId = sessionStorage.getItem("roomId");
  if (!roomId) return;

  const turnRef = ref(db, `games/${roomId}/currentPlayer`);
  onValue(turnRef, (snapshot) => {
    const val = snapshot.val();
    if (val !== null) {
      onTurnChange(val);
    }
  });

  const stateRef = ref(db, `games/${roomId}/state`);
  onValue(stateRef, (snapshot) => {
    const state = snapshot.val();
    if (state !== null) {
      onStateChange(state);
    }
  });
}

export function syncTurnToFirebase(db, turn) {
  const roomId = sessionStorage.getItem("roomId");
  if (!roomId) return;
  set(ref(db, `games/${roomId}/currentPlayer`), turn);
}

export function setGameState(db, state) {
  const roomId = sessionStorage.getItem("roomId");
  if (!roomId) return;
  set(ref(db, `games/${roomId}/state`), state);
}