export function computeSkippedPlayersVisual(message, gameSession) {
  // Biztonsági alapok
  const players = gameSession.players ?? [];
  const finishedPlayers = gameSession.gameData.finishedPlayers ?? [];
  const lostPlayers = gameSession.gameData.lostPlayers ?? [];
  const currentPlayerId = message.playerId;
  const newPlayedCards = message.newPlayedCards ?? [];

  //  játékosok kiválasztása
  const activePlayers = players.filter(
    p =>
      !finishedPlayers.includes(p.playerId) &&
      !lostPlayers.includes(p.playerId),
  );

  const aceCount = newPlayedCards.filter(card => {
    // card lehet, hogy csak egy string vagy objektum - ha objektum, nézzük a rank mezőt
    if (!card) {
      return false;
    }
    const rank = (typeof card === 'object' && card.rank) ? card.rank : card;
    return typeof rank === 'string' && rank.toUpperCase() === 'ACE';
  }).length;

  // Edge-case kezelések
  if (aceCount === 0) {
    return [];
  }
  if (activePlayers.length === 0) {
    return [];
  }

  //  Körkörös  skipped lista generálása playerId-ként
  const startIndex = activePlayers.findIndex(
    p => p.playerId === currentPlayerId,
  );

  const skippedVisual = [];

  for (let i = 1; i <= aceCount; i++) {
    skippedVisual.push(
      activePlayers[(startIndex + i) % activePlayers.length].playerId,
    );
  }

  return skippedVisual;
}
