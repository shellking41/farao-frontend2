export const handleAnimationComplete = (
  cardId,
  setAnimatingCards,
  animatingCards,
  setGameSession,
  animatingQueueItemIdRef,
  animationLockRef,
  queueRef,
  attemptStartNextWithQueue,
  ownCards,
  setAnimationOwnCards,
  animationOwnCards,
  gameSession,
) => {
  if (!ownCards) {
    // Opponent card animation
    setAnimatingCards(prev => {
      const filtered = prev.filter(c => (c.card.cardId || c.card.refKey) !== cardId);

      if (filtered.length === 0) {
        setGameSession(prev => {
          const queue = prev.playedCardsQueue ?? [];
          const currentQueueId = animatingQueueItemIdRef.current;

          const idx = queue.findIndex(q => q.id === currentQueueId);
          let removed = null;
          let newQueue = queue;
          if (idx !== -1) {
            removed = queue[idx];
            newQueue = [...queue.slice(0, idx), ...queue.slice(idx + 1)];
          } else {
            if (queue.length > 0) {
              removed = queue[0];
              newQueue = queue.slice(1);
            }
          }

          const addedPlayedCards = removed?.cards ?? [];
          const completedCardIds = new Set(
            addedPlayedCards.map(c => c.cardId),
          );
          animatingQueueItemIdRef.current = null;

          animationLockRef.current = false;

          setTimeout(() => {
            queueRef.current = newQueue;
            attemptStartNextWithQueue(newQueue);
          }, 0);

          setTimeout(() => {
            setAnimatingCards(prev =>
              prev.filter(c => !completedCardIds.has(c.card.cardId)),
            );
          }, 200);

          return {
            ...prev,
            playedCardsSize: (prev.playedCardsSize ?? 0) + (addedPlayedCards.length),
            playedCards: [...(prev.playedCards ?? []), ...addedPlayedCards],
            playedCardsQueue: newQueue,
          };
        });
        return prev;
      }

      return filtered;
    });
  } else {
    // Own card animation
    setAnimationOwnCards(prev => {
      const filtered = prev.filter(c => (c.card.cardId || c.card.refKey) !== cardId);



      if (filtered.length === 0) {

        // *** ELŐSZÖR frissítjük a gameSession-t (playedCards) ***
        setGameSession(prev => {
          const [first, ...rest] = prev.playedCardsQueue || [];

          queueRef.current = rest;

          // Reset animation state
          animationLockRef.current = false;
          animatingQueueItemIdRef.current = null;

          // Próbáljuk meg feldolgozni a következő queue elemet
          attemptStartNextWithQueue(rest);

          return {
            ...prev,
            playedCards: [...(prev.playedCards || []), ...(first?.cards || [])],
            playedCardsSize: (prev.playedCardsSize ?? 0) + (first?.cards?.length ?? 0),
            playedCardsQueue: rest,
          };
        });

        setTimeout(() => {
          setAnimationOwnCards([]);
        }, 200);

        return prev;
      }

      return filtered;
    });
  }
};