import React, { useEffect, useLayoutEffect } from 'react';
import useCalculatePlayAnimation from './useCalculatePlayAnimation.js';
import { useMediaQuery } from '@mui/material';

function UseHandleOpponentsCardPlay(animationLockRef, setGameSession, gameSession, playerSelf, playedCardRef, setAnimatingCards, queueRef, animatingQueueItemIdRef, isMobile) {
  const { calculateAnimation } = useCalculatePlayAnimation();

  const attemptStartNextWithQueue = (queue) => {
    if (!queue?.length) {
      return;
    }
    if (animationLockRef.current) {
      return;
    }

    const next = queue[0];

    // ha mi tettük le, azonnal feldolgozzuk
    if (next.playerId === playerSelf.playerId) {
      return;
    }
    if (!next?.cards?.length) {

      setGameSession(prev => ({
        ...prev,
        playedCardsQueue: (prev.playedCardsQueue || []).slice(1),
      }));

      return;
    }
    // LOCK + előkészítés
    animationLockRef.current = true;
    animatingQueueItemIdRef.current = next.id;

    const dummyCards = next.cards.map((card, i) => ({
      refKey: `${next.playerId}-${card.cardId ?? 'nocard'}-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      suit: card.suit,
      rank: card.rank,
      cardId: card.cardId,
    }));

    const lastPlayer = gameSession.players.find(p => p.playerId === next.playerId);
    if (!lastPlayer) {
      console.error('Last player not found for anim', next.playerId);
      animationLockRef.current = false;
      animatingQueueItemIdRef.current = null;
      return;
    }

    const playerHandCount = gameSession.playerHand?.otherPlayersCardCount?.[String(lastPlayer.playerId)] ?? 0;
    const playedCardElement = playedCardRef.current;
    if (!playedCardElement) {
      console.error('Played card element not found');
      animationLockRef.current = false;
      setIsAnimating(false);
      animatingQueueItemIdRef.current = null;
      return;
    }

    const animations = calculateAnimation(
      playerHandCount,
      dummyCards,
      playedCardElement.style,
      '0deg',
      lastPlayer,
      gameSession.players.length,
      playerSelf.seat,
      null,
      isMobile,
    );

    // hozzáfűzzük az új animációs batch-et
    setAnimatingCards(prev => [...prev, ...animations]);
  };
  // Opponensek kártyaváltozásának figyelése — animáció indítása
  useLayoutEffect(() => {
    const q = gameSession?.playedCardsQueue ?? [];
    queueRef.current = q;

    // próbáljuk elindítani rögtön
    if (!animationLockRef.current) {
      attemptStartNextWithQueue(q);
    }
  }, [gameSession?.playedCardsQueue]);

  return { attemptStartNextWithQueue };

}

export default UseHandleOpponentsCardPlay;


