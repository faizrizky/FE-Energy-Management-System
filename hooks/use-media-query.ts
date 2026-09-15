'use client';

import { useEffect, useState } from 'react';

/**
 * True kalo media query cocok, ikut update pas ukuran layar berubah.
 *
 * Dipake di: components/shared/date-range-filter.tsx.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);

    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);

  return matches;
}
