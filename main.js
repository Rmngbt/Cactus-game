// main.js

import {
  selectCard,
  drawCard,
  initiateDiscardSwap,
  skipSpecial,
  declareCactus,
  startNewRound,
  resetGame,
  manualDiscard,
  discardDrawnCard,
  logAction,
  updateTurnInfo,
  renderCards,
  cardCount,
  targetScore,
  startVisibleCount,
  score1,
  score2,
  mancheCount
} from './script.js';

import { syncTurnToFirebase, listenToTurnChanges, listenToGameStateChange } from './firebase-sync.js';
import { login } from './AuthAndLobby.js';
import { setupRoomListeners } from './RoomManager.js';

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
