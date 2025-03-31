// firebase-sync.js
import { db, ref, set, onValue } from "./firebase-init.js";

let currentRoomId = null;
let currentUsername = null;

function setSessionData(roomId, username) {
  currentRoomId = roomId;
  currentUsername = username;
}

function syncTurnToFirebase(turn) {
  if (!currentRoomId) return;
  set(ref(db, `games/${currentRoomId}/currentPlayer`), turn);
}

function watchTurnChanges(callback) {
  if (!currentRoomId) return;
  const turnRef = ref(db, `games/${currentRoomId}/currentPlayer`);
  onValue(turnRef, (snapshot) => {
    const val = snapshot.val();
    if (val !== null) callback(val);
  });
}

function syncGameState(key, value) {
  if (!currentRoomId) return;
  set(ref(db, `games/${currentRoomId}/${key}`), value);
}

function watchGameState(key, callback) {
  if (!currentRoomId) return;
  const stateRef = ref(db, `games/${currentRoomId}/${key}`);
  onValue(stateRef, (snap) => {
    const state = snap.val();
    callback(state);
  });
}

export {
  setSessionData,
  syncTurnToFirebase,
  watchTurnChanges,
  syncGameState,
  watchGameState
};
