export const handleDrawAnimationComplete = (
    cardId,
    setAnimatingDrawCards
) => {

    setAnimatingDrawCards(prev => {
        // Megszámoljuk, hány animáció maradna
        const remainingCount = prev.filter(anim => {
            const animId = anim.card.cardId || anim.card.refKey;
            return animId !== cardId;
        }).length;

        const totalCards = prev.length;




        if (remainingCount === 0) {
            return [];
        }



        return prev;
    });
};
