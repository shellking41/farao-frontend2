import { useState, useEffect } from 'react';

export const useMediaQuery = (query) => {
  // Azonnal ellenőrizzük a query-t az inicializáláskor
  const [matches, setMatches] = useState(() => {

    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(query);


    // Frissítjük, ha szükséges
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};