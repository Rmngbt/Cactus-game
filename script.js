// ✅ script.js avec logique corrigée : affichage mémoire, clic limité, interactions actives

let playerCards = [], botCards = [], discardPile = [], drawnCard = null;
let targetScore = 3;
let specialAction = null;
let jackSwapSelectedIndex = null;
let startVisibleCount = 2, cardCount = 4, currentPlayer = "Toi", revealedIndexes = [];

const CARD_POOL = ["R", "A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "V", "D"];
const log = (msg) => {
  document.getElementById("log").innerHTML += `<p>${msg}</p>`;
  console.log(msg);
};

function login() {
  const username = document.getElementById("username").value.trim();
  if (!username) return alert("Entre un pseudo pour continuer.");
  sessionStorage.setItem("username", username);
  document.getElementById("welcome").style.display = "none";
  document.getElementById("config").style.display = "block";
  document.getElementById("player-name").innerText = username;
  log(`👋 Bienvenue, ${username} !`);
}

function safeCreateRoom() {
  log("🧪 Création fictive d'une partie...");
  document.getElementById("config").style.display = "none";
  document.getElementById("lobby").style.display = "block";
  document.getElementById("lobby-room").innerText = "TEST123";
  document.getElementById("lobby-players").innerHTML = `<li>Toi (hôte)</li><li>Bot</li>`;
  document.getElementById("btn-launch-setup").style.display = "inline-block";
}

function joinRoom() {
  log("🧪 Rejoint fictivement une partie...");
  document.getElementById("config").style.display = "none";
  document.getElementById("lobby").style.display = "block";
  document.getElementById("lobby-room").innerText = "TEST123";
  document.getElementById("lobby-players").innerHTML = "<li>Bot (hôte)</li><li>Toi</li>";
  // Démarrage automatique de la configuration
  setTimeout(() => {
    log("🚦 Le bot lance la configuration de la partie...");
    launchSetup();
  }, 2000);
}

function launchSetup() {
  document.getElementById("lobby").style.display = "none";
  document.getElementById("setup").style.display = "block";
}

function saveGameConfig() {
  startVisibleCount = parseInt(document.getElementById("visible-count").value);
  cardCount = parseInt(document.getElementById("card-count").value);
  targetScore = parseInt(document.getElementById("target-score").value);
  log(`💾 Config sauvegardée (Cartes: ${cardCount}, Visibles: ${startVisibleCount}, Cible: ${targetScore})`);
}

function startNewGame() {
  document.getElementById("setup").style.display = "none";
  document.getElementById("game").style.display = "block";
  playerCards = Array.from({ length: cardCount }, () => CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)]);
  botCards = Array.from({ length: cardCount }, () => CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)]);
  revealedIndexes = [];

  // Affichage temporaire des cartes visibles
  for (let i = 0; i < startVisibleCount && i < playerCards.length; i++) {
    revealedIndexes.push(i);
  }

  renderCards();

  setTimeout(() => {
    revealedIndexes = [];
    renderCards();
  }, 5000);
  currentPlayer = "Toi";
  updateTurn();
}

function drawCard() {
  if (currentPlayer !== "Toi") return log("⛔ Ce n'est pas ton tour !");
  drawnCard = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
  log(`🃏 Carte piochée : ${drawnCard}`);
  showDrawnCard();
}

function showDrawnCard() {
  const drawnDiv = document.getElementById("drawn-card");
  drawnDiv.style.display = "block";
  document.getElementById("new-card").innerText = drawnCard;
  if (!document.getElementById("discard-drawn")) {
    const btn = document.createElement("button");
    btn.id = "discard-drawn";
    btn.innerText = "Défausser la carte";
    btn.onclick = discardDrawnCard;
    drawnDiv.after(btn);
  }
}

function discardDrawnCard() {
  if (drawnCard === null) return;
  // Défausser la carte piochée sans l'échanger
  discardPile.push(drawnCard);
  log(`🗑 Carte piochée défaussée : ${drawnCard}`);
  drawnCard = null;
  document.getElementById("drawn-card").style.display = "none";
  document.getElementById("discard-drawn")?.remove();
  renderCards();
  endPlayerTurn();
}

function attemptCardSwap(index) {
  if (drawnCard === null) return;
  const oldCard = playerCards[index];
  playerCards[index] = drawnCard;
  drawnCard = null;
  discardPile.push(oldCard);
  log(`🔄 Carte échangée : ${oldCard} → ${playerCards[index]}`);
  document.getElementById("drawn-card").style.display = "none";
  document.getElementById("discard-drawn")?.remove();
  renderCards();
  endPlayerTurn();
}

function discardCardFromHand(index) {
  const card = playerCards[index];
  if (currentPlayer !== "Toi") {
    // Défausse éclair sur sa propre carte (hors de son tour)
    const topDiscard = discardPile[discardPile.length - 1];
    if (!topDiscard) return log("❌ Aucune carte dans la défausse.");
    if (card === topDiscard) {
      // Tentative réussie - retirer la carte de la main
      playerCards.splice(index, 1);
      log(`⚡ Vous défaussez rapidement votre carte ${card} qui correspond à la défausse !`);
    } else {
      // Mauvaise tentative - piocher une pénalité
      const penaltyCard = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
      playerCards.push(penaltyCard);
      log(`❌ Mauvaise tentative de défausse éclair. Vous piochez une carte de pénalité (${penaltyCard}).`);
    }
    renderCards();
    return;
  }
  // Si c'est le tour du joueur et qu'une carte piochée n'est pas encore placée, on ne peut pas défausser de carte de la main
  if (drawnCard !== null) {
    return log("⏳ Vous devez d'abord jouer ou défausser la carte piochée.");
  }
  // Défausse volontaire d'une carte de la main (tour du joueur)
  discardPile.push(card);
  // Piocher une nouvelle carte pour la remplacer dans la main
  playerCards[index] = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
  log(`🗑 Défausse volontaire de la carte ${card}`);
  // Vérifier si une carte spéciale déclenche son pouvoir
  if (card === 8 || card === "8") {
    log("👁️ Effet 8 activé : choisissez une de vos cartes à révéler.");
    specialAction = "revealSelf";
    document.getElementById("skip-special").style.display = "inline-block";
  } else if (card === 10 || card === "10") {
    log("🔎 Effet 10 activé : choisissez une carte de l'adversaire à regarder.");
    specialAction = "lookOpp";
    document.getElementById("skip-special").style.display = "inline-block";
  } else if (card === "V" || card === "J" || card === 11) {
    // "V" représente Valet (Jack)
    log("🔄 Effet Valet activé : échangez une de vos cartes avec une de celles de l'adversaire (à l'aveugle).");
    specialAction = "swapJack";
    jackSwapSelectedIndex = null;
    document.getElementById("skip-special").style.display = "inline-block";
  } else {
    // Pas de pouvoir spécial, fin de tour immédiate
    renderCards();
    endPlayerTurn();
  }
  renderCards();
}

function initiateDiscardSwap() {
  if (currentPlayer !== "Toi") return log("⛔ Ce n'est pas ton tour !");
  if (discardPile.length === 0) return log("❌ Aucune carte dans la défausse");
  drawnCard = discardPile.pop();
  log(`🔁 Carte récupérée de la défausse : ${drawnCard}`);
  showDrawnCard();
}

function renderCards() {
  // Mettre à jour l'affichage des piles centrales
  const discardElem = document.getElementById("discard");
  if (discardElem) {
    discardElem.innerText = discardPile.length > 0 ? discardPile[discardPile.length - 1] : "Vide";
  }
  // Mettre à jour la main du joueur
  const playerHandDiv = document.getElementById("player-hand");
  if (playerHandDiv) {
    playerHandDiv.innerHTML = `<h3>${sessionStorage.getItem("username") || "Moi"}</h3>`;
    playerCards.forEach((card, i) => {
      const wrap = document.createElement("div");
      wrap.className = "card-wrapper";
      const c = document.createElement("div");
      c.className = "card";
      c.innerText = revealedIndexes.includes(i) ? card : "?";
      // Clic sur une carte du joueur
      c.onclick = () => {
        if (specialAction === "revealSelf") {
          // Révéler cette carte au joueur
          if (!revealedIndexes.includes(i)) {
            revealedIndexes.push(i);
            log(`👀 Vous regardez votre carte en position ${i+1} : ${card}`);
          }
          specialAction = null;
          document.getElementById("skip-special").style.display = "none";
          renderCards();
          endPlayerTurn();
        } else if (specialAction === "swapJack") {
          if (jackSwapSelectedIndex === null) {
            // Sélectionner cette carte pour l'échange
            jackSwapSelectedIndex = i;
            log(`🤝 Vous avez sélectionné votre carte en position ${i+1} pour l'échange.`);
            // (Optionnel : on pourrait mettre en évidence la carte sélectionnée)
          } else {
            // Permettre de re-sélectionner une autre de ses cartes si souhaité
            jackSwapSelectedIndex = i;
            log(`🤔 Nouvelle sélection : carte en position ${i+1}.`);
          }
        } else if (drawnCard !== null) {
          attemptCardSwap(i);
        }
      };
      // Bouton poubelle pour la carte du joueur
      const trashBtn = document.createElement("button");
      trashBtn.innerText = "🗑️";
      trashBtn.className = "discard-btn";
      trashBtn.onclick = () => discardCardFromHand(i);
      wrap.appendChild(trashBtn);
      wrap.appendChild(c);
      playerHandDiv.appendChild(wrap);
    });
  }
  // Mettre à jour la main de l'adversaire (Bot)
  const oppHandDiv = document.getElementById("opponent-hand");
  if (oppHandDiv) {
    oppHandDiv.innerHTML = "<h3>Bot</h3>";
    botCards.forEach((card, i) => {
      const wrap = document.createElement("div");
      wrap.className = "card-wrapper";
      const c = document.createElement("div");
      c.className = "card";
      c.innerText = "?";
      // Clic sur une carte de l'adversaire (utile uniquement pour les actions spéciales)
      c.onclick = () => {
        if (specialAction === "lookOpp") {
          // Révéler brièvement la carte de l'adversaire
          c.innerText = card;
          log(`🔍 Carte de l'adversaire en position ${i+1} : ${card}`);
          setTimeout(() => {
            c.innerText = "?";
          }, 2000);
          specialAction = null;
          document.getElementById("skip-special").style.display = "none";
          renderCards();
          endPlayerTurn();
        } else if (specialAction === "swapJack") {
          if (jackSwapSelectedIndex !== null) {
            // Échanger la carte sélectionnée du joueur avec cette carte de l'adversaire
            const playerIndex = jackSwapSelectedIndex;
            const playerCard = playerCards[playerIndex];
            const oppCard = botCards[i];
            // Échange des valeurs
            playerCards[playerIndex] = oppCard;
            botCards[i] = playerCard;
            // Si la carte du joueur échangée était connue (révélée), l'oublier maintenant
            const revIdx = revealedIndexes.indexOf(playerIndex);
            if (revIdx !== -1) {
              revealedIndexes.splice(revIdx, 1);
            }
            log(`🔄 Échange effectué : votre carte (position ${playerIndex+1}) avec la carte de l'adversaire (position ${i+1}).`);
            specialAction = null;
            jackSwapSelectedIndex = null;
            document.getElementById("skip-special").style.display = "none";
            renderCards();
            endPlayerTurn();
          } else {
            log("❗ Sélectionnez d'abord une de vos cartes à échanger.");
          }
        }
      };
      // Bouton poubelle au-dessus de la carte de l'adversaire (défausse éclair visant l'adversaire)
      const trashBtn = document.createElement("button");
      trashBtn.innerText = "🗑️";
      trashBtn.className = "discard-btn";
      trashBtn.onclick = () => attemptBotCardPlay(i, card);
      wrap.appendChild(trashBtn);
      wrap.appendChild(c);
      oppHandDiv.appendChild(wrap);
    });
  }
}

function attemptBotCardPlay(index, botCard) {
  const topDiscard = discardPile[discardPile.length - 1];
  if (!topDiscard) return log("❌ Il n'y a pas de carte dans la défausse.");
  if (botCard === topDiscard) {
    log(`🎯 Bonne tentative ! Carte ${botCard} retirée du Bot. Vous lui donnez une de vos cartes.`);
    // Retirer la carte du bot
    discardPile.push(botCards[index]);
    // Donner au bot la dernière carte de la main du joueur
    if (playerCards.length > 0) {
      botCards[index] = playerCards.pop();
    } else {
      botCards[index] = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
    }
  } else {
    const penalty = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
    playerCards.push(penalty);
    log(`❌ Mauvaise tentative sur la carte de l'adversaire. Vous piochez une carte de pénalité (${penalty}).`);
  }
  renderCards();
}

function updateTurn() {
  document.getElementById("turn-info").innerText = `Tour de ${currentPlayer}`;
}

function endPlayerTurn() {
  // Ne passer au bot que si aucune action spéciale n'est en attente
  if (specialAction) {
    return;
  }
  currentPlayer = "Bot";
  updateTurn();
  // Petite pause avant que le bot joue
  setTimeout(botPlayTurn, 1000);
}

function botPlayTurn() {
  // Le bot pioche une carte
  const card = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
  let actionLog = `🤖 Bot pioche ${card}. `;
  // Décision : garder ou défausser
  const valueMap = { "A": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "V": 11, "D": 12, "R": 13 };
  const drawnValue = valueMap[card] || card;
  // Trouver la carte de plus forte valeur dans la main du bot
  let highestIndex = 0;
  let highestValue = -1;
  botCards.forEach((c, idx) => {
    const val = valueMap[c] || c;
    if (val > highestValue) {
      highestValue = val;
      highestIndex = idx;
    }
  });
  if (drawnValue < highestValue) {
    // Le bot garde la carte piochée et défausse sa plus haute carte
    const discarded = botCards[highestIndex];
    botCards[highestIndex] = card;
    discardPile.push(discarded);
    actionLog += `Il garde ${card} et défausse ${discarded}.`;
    // Effets spéciaux possibles si la carte défaussée est spéciale
    if (discarded === 8 || discarded === "8") {
      // Bot regarde une de ses cartes
      const peekIndex = Math.floor(Math.random() * botCards.length);
      log(`${actionLog} (Le bot regarde sa carte en position ${peekIndex+1}.)`);
    } else if (discarded === 10 || discarded === "10") {
      // Bot regarde une des cartes du joueur
      const peekIndex = Math.floor(Math.random() * playerCards.length);
      const peekedCard = playerCards[peekIndex];
      log(`${actionLog} (Le bot regarde votre carte en position ${peekIndex+1} : ${peekedCard}.)`);
    } else if (discarded === "V" || discarded === "J" || discarded === 11) {
      // Bot utilise l'effet du Valet : échange une carte au hasard avec le joueur
      const botIndex = Math.floor(Math.random() * botCards.length);
      const playerIndex = Math.floor(Math.random() * playerCards.length);
      const botCard = botCards[botIndex];
      const playerCard = playerCards[playerIndex];
      botCards[botIndex] = playerCard;
      playerCards[playerIndex] = botCard;
      log(`${actionLog} (Le bot a utilisé un Valet et a échangé sa carte en position ${botIndex+1} avec votre carte en position ${playerIndex+1}.)`);
      // Si la carte du joueur échangée était connue, on l'oublie maintenant
      const revIdx = revealedIndexes.indexOf(playerIndex);
      if (revIdx !== -1) {
        revealedIndexes.splice(revIdx, 1);
      }
    } else {
      log(actionLog);
    }
  } else {
    // Le bot défausse directement la carte piochée
    discardPile.push(card);
    actionLog += `Il défausse ${card}.`;
    log(actionLog);
  }
  renderCards();
  currentPlayer = "Toi";
  updateTurn();
}

function skipSpecial() {
  if (!specialAction) return;
  log("⏭ Vous ignorez l'effet spécial en cours.");
  // Annuler l'action spéciale en cours
  specialAction = null;
  jackSwapSelectedIndex = null;
  // Cacher le bouton de passe
  document.getElementById("skip-special").style.display = "none";
  renderCards();
  // Fin de tour après avoir ignoré le pouvoir spécial
  endPlayerTurn();
}

function declareCactus() {
  log("🌵 Cactus ! Fin de manche.");
  // Révéler toutes les cartes pour information
  log(`Votre main : ${playerCards.join(", ")}`);
  log(`Main du Bot : ${botCards.join(", ")}`);
  // (Le jeu s'arrête ici pour cette démonstration hors-ligne.)
}

window.addEventListener("DOMContentLoaded", () => {
  // Attacher les écouteurs d'événements aux boutons
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
});
