import { useEffect, useRef } from 'react';


const SUITS = ['hearts', 'acorns', 'bells', 'leaves'];
const RANKS = ['7', '8', '9', '10', 'jack', 'over', 'king', 'ace'];

export function usePreloadCardImages(cards = null) {
    const loadedRef = useRef(false);

    useEffect(() => {
        if (loadedRef.current) return;
        loadedRef.current = true;

        const imagePaths = cards
            ?
            cards
                .filter(c => c?.suit && c?.rank)
                .map(c => `/${c.suit.toLowerCase()}${c.rank.toLowerCase()}.png`)
            :
            SUITS.flatMap(suit =>
                RANKS.map(rank => `/${suit}${rank}.png`)
            );

        const unique = [...new Set(imagePaths)];

        unique.forEach(path => {
            const img = new Image();
            img.src = path;

        });
    }, []);
}