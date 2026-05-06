export function handleReshuffle(
  cardsToReshuffle,
  deckPosition,
  calculateReshuffleAnimation,
  setAnimatingReshuffle,
  setGameSession,
  newDeckSize, setDeckRotations,
) {

  setTimeout(() => {
    const playedCardElement = document.querySelector('[data-played-card]');
    const playedCardPosition = playedCardElement
      ? {
        left: '45%',
        top: '50%',
      }
      : { left: '50%', top: '50%' };

    console.log('[RESHUFFLE ANIMATION] Starting animation after delay', {
      playedCardPosition,
      deckPosition,
      cardsToReshuffle,
      newDeckSize,
    });

    const reshuffleAnimations = calculateReshuffleAnimation(
      playedCardPosition,
      deckPosition,
      cardsToReshuffle,
    );

    console.log('[RESHUFFLE ANIMATION] Generated animations:', reshuffleAnimations.length);

    setAnimatingReshuffle((prev) => [...prev, ...reshuffleAnimations]);
    console.log('[RESHUFFLE ANIMATION]', reshuffleAnimations.map((a) => (a.waypoints[a.waypoints.length - 1].rotate)));

    setDeckRotations(reshuffleAnimations.map((a) => (a.waypoints[a.waypoints.length - 1].rotate)));

    setGameSession((prev) => ({
      ...prev,
      newDeckSize: newDeckSize,
    }));
  }, 500);
}