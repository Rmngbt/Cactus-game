// Cactus Game - Version Offline complète
let playerCards = [], botCards = [], discardPile = [], drawnCard = null;
let startVisibleCount = 2, cardCount = 4, targetScore = 3;
let currentPlayer = "Toi", playerWins = 0, botWins = 0;
const CARD_POOL = ["R", "A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "V", "D"];
// Indices de cartes temporairement révélées pour le joueur (mémoire)
let revealedIndexes = [];
// (Optionnel) indices de cartes du bot révélées au joueur via pouvoirs
let revealedBotIndexes = [];

const log = (msg) => {
    const logDiv = document.getElementById("log");
    logDiv.innerHTML += `<p>${msg}</p>`;
    logDiv.scrollTop = logDiv.scrollHeight;
    console.log(msg);
};

function login() {
    const username = document.getElementById("username").value.trim();
    if (!username) {
        alert("Entre un pseudo pour continuer.");
        return;
    }
    // Enregistrer nom joueur (utilisé pour affichage)
    document.getElementById("player-name").innerText = username;
    // Passer à l'écran config
    document.getElementById("welcome").style.display = "none";
    document.getElementById("config").style.display = "block";
    log(`👋 Bienvenue, ${username} !`);
}

function safeCreateRoom() {
    log("🧪 Création fictive d'une partie...");
    document.getElementById("config").style.display = "none";
    document.getElementById("lobby").style.display = "block";
    document.getElementById("lobby-room").innerText = "TEST123";
    document.getElementById("lobby-players").innerHTML = "<li>Toi (hôte)</li><li>Bot</li>";
    // Afficher le bouton de configuration de la partie
    document.getElementById("start-game").style.display = "inline-block";
}

function joinRoom() {
    log("🧪 Rejoint fictivement une partie...");
    document.getElementById("config").style.display = "none";
    document.getElementById("lobby").style.display = "block";
    document.getElementById("lobby-room").innerText = "TEST123";
    document.getElementById("lobby-players").innerHTML = "<li>Toi</li><li>Bot (hôte)</li>";
    // Dans cette version offline, rejoindre se comporte comme créer
    document.getElementById("start-game").style.display = "inline-block";
}

function launchSetup() {
    document.getElementById("lobby").style.display = "none";
    document.getElementById("setup").style.display = "block";
}

function saveGameConfig() {
    // Sauvegarder les paramètres de la partie choisis
    cardCount = parseInt(document.getElementById("card-count").value);
    startVisibleCount = parseInt(document.getElementById("visible-count").value);
    targetScore = parseInt(document.getElementById("target-score").value);
    log("💾 Configuration sauvegardée.");
}

function startNewGame() {
    // Initialiser une nouvelle partie (distribution des cartes)
    document.getElementById("setup").style.display = "none";
    document.getElementById("game").style.display = "block";
    // Réinitialiser l'état de jeu
    currentPlayer = "Toi";
    drawnCard = null;
    discardPile = [];
    playerCards = Array.from({ length: cardCount }, () => CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)]);
    botCards = Array.from({ length: cardCount }, () => CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)]);
    revealedIndexes = [];
    revealedBotIndexes = [];
    // Révéler temporairement quelques cartes au début (mécanique mémoire)
    for (let i = 0; i < startVisibleCount && i < playerCards.length; i++) {
        revealedIndexes.push(i);
    }
    renderCards();
    // Cacher à nouveau après 5 secondes
    setTimeout(() => {
        revealedIndexes = [];
        renderCards();
        log("🕑 Mémorisez vos cartes visibles... Elles sont maintenant cachées !");
    }, 5000);
    updateTurnInfo();
}

function renderCards() {
    // Mettre à jour l'affichage des cartes de chaque joueur et de la zone centrale
    // Mettre à jour la défausse visible
    const discardSpan = document.getElementById("discard");
    if (discardSpan) {
        discardSpan.innerText = (discardPile.length > 0 ? discardPile[discardPile.length - 1] : "Vide");
    }
    // Mettre à jour la pioche (fixe) - la pioche reste toujours face cachée ("?")
    // Actualiser la main du joueur
    const playerHandDiv = document.getElementById("player-hand");
    playerHandDiv.innerHTML = "<h3>Moi</h3>";
    playerCards.forEach((card, i) => {
        const wrap = document.createElement("div");
        wrap.className = "card-wrapper";
        // Carte du joueur (valeur si révélée, sinon "?")
        const c = document.createElement("div");
        c.className = "card";
        c.innerText = revealedIndexes.includes(i) ? card : "?";
        c.dataset.index = i;
        if (drawnCard !== null) {
            // Permettre clic pour échanger si une carte a été piochée
            c.onclick = () => attemptCardSwap(i);
        }
        // Bouton pour défausser la carte de la main (avec pénalité d'une nouvelle carte)
        const trashBtn = document.createElement("button");
        trashBtn.innerText = "🗑";
        trashBtn.className = "discard-btn";
        trashBtn.onclick = () => discardCardFromHand(i);
        wrap.appendChild(trashBtn);
        wrap.appendChild(c);
        playerHandDiv.appendChild(wrap);
    });
    // Actualiser la main de l'adversaire (Bot)
    const opponentHandDiv = document.getElementById("opponent-hand");
    opponentHandDiv.innerHTML = "<h3>Adversaire</h3>";
    botCards.forEach((card, i) => {
        const wrap = document.createElement("div");
        wrap.className = "card-wrapper";
        const c = document.createElement("div");
        c.className = "card";
        // N'afficher la valeur que si le joueur y a accès (pouvoir), sinon "?"
        c.innerText = revealedBotIndexes.includes(i) ? card : "?";
        // Permettre au joueur de tenter une correspondance de carte (règle du "matching")
        c.onclick = () => attemptBotCardPlay(i, card);
        // (Pas de besoin de bouton poubelle côté bot, le clic sur la carte sert pour la tentative)
        wrap.appendChild(c);
        opponentHandDiv.appendChild(wrap);
    });
}

function drawCard() {
    if (currentPlayer !== "Toi") {
        return log("⛔ Ce n'est pas ton tour !");
    }
    if (drawnCard !== null) {
        return log("⚠️ Vous avez déjà une carte piochée en cours.");
    }
    // Piocher une carte aléatoire
    drawnCard = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
    log(`🃏 Carte piochée : ${drawnCard}`);
    // Si carte spéciale, proposer son utilisation
    if (drawnCard === 8 || drawnCard === 9 || drawnCard === 10 || drawnCard === "V" || drawnCard === "D") {
        let usePower = confirm(`Vous avez pioché ${drawnCard} ! Voulez-vous utiliser son pouvoir spécial ?`);
        if (usePower) {
            useSpecialPower(drawnCard);
            return endPlayerTurn();
        }
        // Si le joueur ne l'utilise pas, il pourra l'échanger ou la défausser normalement
    }
    showDrawnCard();
}

function showDrawnCard() {
    // Afficher la carte piochée et proposer action (échange ou défausse)
    const drawnDiv = document.getElementById("drawn-card");
    drawnDiv.style.display = "block";
    document.getElementById("new-card").innerText = drawnCard;
    // Ajouter un bouton pour défausser la carte piochée (si pas déjà présent)
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
    // Défausser la carte piochée sans l'utiliser ni l'échanger
    discardPile.push(drawnCard);
    log(`🗑 Carte défaussée : ${drawnCard}`);
    drawnCard = null;
    // Masquer l'affichage de la carte piochée et retirer le bouton de défausse
    document.getElementById("drawn-card").style.display = "none";
    document.getElementById("discard-drawn")?.remove();
    renderCards();
    endPlayerTurn();
}

function attemptCardSwap(index) {
    if (drawnCard === null) return;
    // Échanger la carte piochée avec la carte de la position index du joueur
    const oldCard = playerCards[index];
    playerCards[index] = drawnCard;
    drawnCard = null;
    discardPile.push(oldCard);
    log(`🔄 Échange effectué : votre carte ${oldCard} est défaussée, vous gardez ${playerCards[index]}.`);
    // Masquer l'affichage de la carte piochée
    document.getElementById("drawn-card").style.display = "none";
    document.getElementById("discard-drawn")?.remove();
    renderCards();
    endPlayerTurn();
}

function discardCardFromHand(index) {
    if (currentPlayer !== "Toi") {
        return log("⛔ Ce n'est pas votre tour.");
    }
    // Défausser directement une carte de sa main (en la remplaçant par une nouvelle tirée au hasard)
    const removed = playerCards[index];
    discardPile.push(removed);
    playerCards[index] = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
    log(`🗑 Vous vous êtes défaussé de ${removed} (une nouvelle carte inconnue la remplace).`);
    renderCards();
    endPlayerTurn();
}

function initiateDiscardSwap() {
    if (currentPlayer !== "Toi") {
        return log("⛔ Ce n'est pas ton tour !");
    }
    if (discardPile.length === 0) {
        return log("❌ Aucune carte dans la défausse.");
    }
    if (drawnCard !== null) {
        return log("⚠️ Gérez d'abord la carte piochée en cours.");
    }
    // Récupérer la dernière carte de la défausse comme si on la piochait
    drawnCard = discardPile.pop();
    log(`🔁 Carte récupérée de la défausse : ${drawnCard}`);
    // Ici, on ne considère pas la carte reprise de la défausse comme "carte spéciale" utilisable (on l'utilise directement)
    showDrawnCard();
}

function attemptBotCardPlay(index, botCard) {
    // Tentative du joueur de défausser une carte du bot si elle correspond à la défausse (règle mémoire "matching")
    const topDiscard = discardPile[discardPile.length - 1];
    if (!topDiscard) {
        return log("❌ Il n'y a pas de carte dans la défausse.");
    }
    if (botCard === topDiscard) {
        // Bonne correspondance : retirer la carte du bot
        log(`🎯 Correspondance trouvée ! La carte ${botCard} du bot est défaussée. Vous lui donnez l'une de vos cartes en échange.`);
        discardPile.push(botCards[index]); // la carte du bot part à la défausse
        // Le bot reçoit une carte du joueur (la dernière carte du joueur est transférée)
        if (playerCards.length > 0) {
            botCards[index] = playerCards.pop();
        } else {
            botCards[index] = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
        }
    } else {
        // Mauvaise tentative : pénalité pour le joueur (pioche une carte supplémentaire)
        log("❌ Mauvaise tentative. Vous piochez une carte de pénalité dans votre jeu.");
        playerCards.push(CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)]);
    }
    renderCards();
}

function useSpecialPower(card) {
    // Exécution du pouvoir spécial de la carte
    if (card === 8) {
        // Voir l'une de ses propres cartes
        if (playerCards.length === 0) return;
        let idx = prompt("Indice de votre carte à regarder (0 à " + (playerCards.length - 1) + ") :");
        idx = parseInt(idx);
        if (isNaN(idx) || idx < 0 || idx >= playerCards.length) {
            log("❌ Pouvoir annulé (indice invalide).");
        } else {
            const seenCard = playerCards[idx];
            // Révéler temporairement visuellement la carte choisie
            revealedIndexes.push(idx);
            renderCards();
            setTimeout(() => {
                // Cacher à nouveau après 3s
                revealedIndexes = revealedIndexes.filter(i => i !== idx);
                renderCards();
            }, 3000);
            log(`👀 Vous regardez secrètement votre carte position ${idx} : ${seenCard}.`);
        }
    } else if (card === 10) {
        // Voir une carte de l'adversaire
        if (botCards.length === 0) return;
        let idx = prompt("Indice de la carte de l'adversaire à regarder (0 à " + (botCards.length - 1) + ") :");
        idx = parseInt(idx);
        if (isNaN(idx) || idx < 0 || idx >= botCards.length) {
            log("❌ Pouvoir annulé (indice invalide).");
        } else {
            const seenCard = botCards[idx];
            // Révéler temporairement la carte du bot choisie (au joueur seulement)
            revealedBotIndexes.push(idx);
            renderCards();
            setTimeout(() => {
                revealedBotIndexes = revealedBotIndexes.filter(i => i !== idx);
                renderCards();
            }, 3000);
            log(`🔎 Vous regardez secrètement la carte ${idx} de l'adversaire : ${seenCard}.`);
        }
    } else if (card === "V") {
        // Échanger une carte avec l'adversaire (sans les regarder)
        if (playerCards.length === 0 || botCards.length === 0) return;
        let idxPlayer = prompt("Indice de VOTRE carte à échanger (0 à " + (playerCards.length - 1) + ") :");
        let idxBot = prompt("Indice de la carte ADVERSAIRE à échanger (0 à " + (botCards.length - 1) + ") :");
        idxPlayer = parseInt(idxPlayer);
        idxBot = parseInt(idxBot);
        if (isNaN(idxPlayer) || isNaN(idxBot) || idxPlayer < 0 || idxPlayer >= playerCards.length || idxBot < 0 || idxBot >= botCards.length) {
            log("❌ Pouvoir annulé (indice invalide).");
        } else {
            const temp = playerCards[idxPlayer];
            playerCards[idxPlayer] = botCards[idxBot];
            botCards[idxBot] = temp;
            log("🔀 Vous échangez une carte de votre jeu avec une de celles de l'adversaire.");
        }
    } else if (card === "D") {
        // Dame (Queen) - dans cette version, on peut la traiter comme un Valet (échanger)
        if (playerCards.length === 0 || botCards.length === 0) return;
        const idxPlayer = Math.floor(Math.random() * playerCards.length);
        const idxBot = Math.floor(Math.random() * botCards.length);
        const temp = playerCards[idxPlayer];
        playerCards[idxPlayer] = botCards[idxBot];
        botCards[idxBot] = temp;
        log("👑 Pouvoir de la Dame : échange aléatoire effectué entre vos jeux.");
    }
    // Dans tous les cas, la carte spéciale est défaussée après utilisation
    discardPile.push(card);
    drawnCard = null;
    document.getElementById("drawn-card").style.display = "none";
    document.getElementById("discard-drawn")?.remove();
}

function endPlayerTurn() {
    // Terminer le tour du joueur et lancer le tour du bot si la partie continue
    if (currentPlayer === "Toi") {
        currentPlayer = "Bot";
        updateTurnInfo();
        setTimeout(botTurn, 500);  // légère pause avant le tour du bot
    }
}

function botTurn() {
    // Logique simple du tour du bot (piocher et jouer une carte)
    if (playerCards.length === 0 || botCards.length === 0) return;
    // Bot pioche une carte (toujours du talon)
    let botDraw = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
    let usedPower = false;
    log(`🤖 Le bot pioche : ${botDraw}`);
    // Le bot décide quoi faire de la carte piochée
    if (botDraw === 8 || botDraw === 9 || botDraw === 10 || botDraw === "V" || botDraw === "D") {
        // Cartes spéciales : stratégie du bot pour utilisation
        if (botDraw === 8) {
            // Bot regarde l'une de ses cartes (aléatoirement)
            if (botCards.length > 0) {
                const idx = Math.floor(Math.random() * botCards.length);
                const cardSeen = botCards[idx];
                // Bot "mémorise" sa carte (pas de représentation visible pour le joueur)
                log("🤖 Le bot regarde l'une de ses cartes en secret.");
            }
            usedPower = true;
        } else if (botDraw === 10) {
            // Bot regarde une carte du joueur (aléatoirement)
            if (playerCards.length > 0) {
                const idx = Math.floor(Math.random() * playerCards.length);
                const cardSeen = playerCards[idx];
                log("🤖 Le bot regarde une de vos cartes en secret.");
            }
            usedPower = true;
        } else if (botDraw === "V" || botDraw === "D") {
            // Bot échange une carte avec le joueur (au hasard)
            if (playerCards.length > 0 && botCards.length > 0) {
                const idxPlayer = Math.floor(Math.random() * playerCards.length);
                const idxBot = Math.floor(Math.random() * botCards.length);
                const temp = botCards[idxBot];
                botCards[idxBot] = playerCards[idxPlayer];
                playerCards[idxPlayer] = temp;
                log("🤖 Le bot utilise un pouvoir d'échange de carte.");
            }
            usedPower = true;
        }
    }
    if (usedPower) {
        // Si un pouvoir a été utilisé, la carte spéciale est défaussée et le tour du bot se termine
        discardPile.push(botDraw);
    } else {
        // Si pas de pouvoir utilisé, le bot évalue la carte
        // Convertir les cartes en valeur de points pour décision (Roi=0, As=1, Figures=10, autres = valeur)
        const value = (card) => {
            if (card === "R") return 0;
            if (card === "A") return 1;
            if (card === "V" || card === "D" || card === 10) return 10;
            return card; // pour 2-9 (numériques)
        };
        const newCardValue = value(botDraw);
        // Chercher la carte la plus haute du bot pour potentiellement l'échanger
        let highestValue = -1;
        let highestIndex = -1;
        botCards.forEach((c, idx) => {
            const val = value(c);
            if (val > highestValue) {
                highestValue = val;
                highestIndex = idx;
            }
        });
        // Décision simple : si la carte piochée est meilleure (valeur plus basse) que la pire carte actuelle du bot, on échange
        if (newCardValue < highestValue) {
            // Échanger la nouvelle carte avec la carte de plus haute valeur
            const oldCard = botCards[highestIndex];
            botCards[highestIndex] = botDraw;
            discardPile.push(oldCard);
            log(`🤖 Le bot échange sa carte ${oldCard} contre ${botDraw}.`);
        } else {
            // Sinon, le bot défausse la carte piochée
            discardPile.push(botDraw);
            log(`🤖 Le bot défausse la carte ${botDraw}.`);
        }
    }
    // Mettre à jour l'affichage après le tour du bot
    renderCards();
    // Vérifier si le bot déclare "Cactus" (non implémenté ici)
    // Fin du tour du bot, retour au joueur
    currentPlayer = "Toi";
    updateTurnInfo();
}

function declareCactus() {
    if (currentPlayer !== "Toi") {
        return log("⛔ Ce n'est pas à vous de déclarer 'Cactus'.");
    }
    if (drawnCard !== null) {
        return log("⚠️ Vous ne pouvez pas déclarer 'Cactus' en pleine action (carte piochée non jouée).");
    }
    log("🌵 Vous déclarez 'Cactus' ! Fin de manche imminente.");
    // Le bot joue un dernier tour
    currentPlayer = "Bot";
    updateTurnInfo();
    log("🤖 Le bot joue son dernier tour avant révélation...");
    botTurn();
    // Révéler toutes les cartes et calculer les scores
    let playerScore = 0, botScore = 0;
    const val = (card) => {
        if (card === "R") return 0;
        if (card === "A") return 1;
        if (card === "V" || card === "D" || card === 10) return 10;
        return card;
    };
    playerCards.forEach(c => playerScore += val(c));
    botCards.forEach(c => botScore += val(c));
    log(`📊 Score final - ${document.getElementById("player-name").innerText} : ${playerScore} points, Bot : ${botScore} points.`);
    if (playerScore < botScore) {
        log("🏆 Vous remportez cette manche !");
        playerWins++;
    } else if (botScore < playerScore) {
        log("🤖 Le bot remporte cette manche.");
        botWins++;
    } else {
        log("⚖️ Égalité parfaite sur cette manche !");
    }
    // Mettre à jour le tableau des scores cumulés
    document.getElementById("scores-list").innerText = `Moi : ${playerWins} | Bot : ${botWins}`;
    // Vérifier condition de fin de partie
    if (playerWins >= targetScore || botWins >= targetScore) {
        if (playerWins > botWins) {
            log("🎉 Partie terminée : Vous gagnez la partie Cactus !");
        } else if (botWins > playerWins) {
            log("😔 Partie terminée : Le bot gagne la partie Cactus.");
        } else {
            log("🎲 Partie terminée sur une égalité parfaite !");
        }
        alert("Partie terminée. Rafraîchissez la page pour rejouer.");
    } else {
        // Proposer de lancer la prochaine manche
        if (confirm("Manche terminée. Voulez-vous lancer la manche suivante ?")) {
            // Relancer une nouvelle manche avec la même configuration
            startNewGame();
        } else {
            log("🔚 Partie interrompue. Rafraîchissez la page pour une nouvelle partie.");
        }
    }
}

function updateTurnInfo() {
    const info = document.getElementById("turn-info");
    if (info) {
        info.innerText = (currentPlayer === "Toi" ? "Tour du joueur" : "Tour du bot");
    }
}

// Pas de logique Firebase dans la version offline
