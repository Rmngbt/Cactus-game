import { db, ref, set, onValue, get } from "./firebase-init.js";

export function syncTurnToFirebase(turn) {
  const roomId = sessionStorage.getItem("roomId");
  if (!roomId) return;
  set(ref(db, `games/${roomId}/currentPlayer`), turn);
}

export function listenForTurnChange(callback) {
  const roomId = sessionStorage.getItem("roomId");
  if (!roomId) return;

  const turnRef = ref(db, `games/${roomId}/currentPlayer`);
  onValue(turnRef, (snapshot) => {
    const val = snapshot.val();
    if (val !== null) {
      callback(val);
    }
  });
}

export function setGameState(state) {
  const roomId = sessionStorage.getItem("roomId");
  if (!roomId) return;
  set(ref(db, `games/${roomId}/state`), state);
}

export function listenForGameStateChange(callback) {
  const roomId = sessionStorage.getItem("roomId");
  if (!roomId) return;

  const stateRef = ref(db, `games/${roomId}/state`);
  onValue(stateRef, (snap) => {
    const state = snap.val();
    if (state !== null) {
      callback(state);
    }
  });
}

export function registerPlayerInRoom(username, isHost) {
  const roomId = sessionStorage.getItem("roomId");
  if (!roomId) return;

  const playersRef = ref(db, `games/${roomId}/players/${username}`);
  set(playersRef, { connected: true });

  if (isHost) {
    set(ref(db, `games/${roomId}/host`), username);
    set(ref(db, `games/${roomId}/currentPlayer`), 1);
  }
}

export function listenForLobbyPlayers(callback) {
  const roomId = sessionStorage.getItem("roomId");
  if (!roomId) return;

  const playersRef = ref(db, `games/${roomId}/players`);
  onValue(playersRef, (snapshot) => {
    const players = snapshot.val();
    if (players) {
      callback(Object.keys(players));
    }
  });
}

export function listenForHostChange(callback) {
  const roomId = sessionStorage.getItem("roomId");
  if (!roomId) return;

  const hostRef = ref(db, `games/${roomId}/host`);
  onValue(hostRef, (snapshot) => {
    const host = snapshot.val();
    callback(host);
  });
}
