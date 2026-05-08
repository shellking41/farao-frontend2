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



    const reshuffleAnimations = calculateReshuffleAnimation(
      playedCardPosition,
      deckPosition,
      cardsToReshuffle,
    );


    setAnimatingReshuffle((prev) => [...prev, ...reshuffleAnimations]);

    setDeckRotations(reshuffleAnimations.map((a) => (a.waypoints[a.waypoints.length - 1].rotate)));

    setGameSession((prev) => ({
      ...prev,
      newDeckSize: newDeckSize,
    }));
  }, 500);
}