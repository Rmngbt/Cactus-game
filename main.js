// main.js

import {
  startNewRound,
  startNewGame,
  selectCard,
  drawCard,
  initiateDiscardSwap,
  skipSpecial,
  declareCactus,
  resetGame,
  manualDiscard,
  discardDrawnCard
} from './script.js';

import { syncTurnToFirebase, listenToTurnChanges, listenToGameStateChange } from './firebase-sync.js';
import { login } from './AuthAndLobby.js';
import { setupRoomListeners } from './RoomManager.js';

window.startNewGame = () => {
  startNewRound(); // ou ta logique de nouvelle partie complète
};


window.selectCard = selectCard;
window.drawCard = drawCard;
window.initiateDiscardSwap = initiateDiscardSwap;
window.skipSpecial = skipSpecial;
window.declareCactus = declareCactus;
window.startNewRound = startNewRound;
window.resetGame = resetGame;
window.manualDiscard = manualDiscard;
window.discardDrawnCard = discardDrawnCard;
window.login = login;

// Appel une seule fois après Firebase init (par ex. depuis RoomManager)
listenToTurnChanges(
  (newTurn) => (currentPlayer = newTurn),
  renderCards,
  logAction,
  updateTurnInfo
);

listenToGameStateChange(() => {
  document.getElementById("lobby").style.display = "none";
  document.getElementById("setup").style.display = "block";
}, logAction);

setupRoomListeners();
