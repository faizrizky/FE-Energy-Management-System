'use client';
import { useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';

export function useTableSort<T>(
  data: T[],
  accessors: Record<string, (item: T) => string | number | null | undefined>
) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [direction, setDirection] = useState<SortDirection>('asc');

  const toggleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setDirection('asc');
      return;
    }
    if (direction === 'asc') {
      setDirection('desc');
    } else {
      setSortKey(null);
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const accessor = accessors[sortKey];
    if (!accessor) return data;

    const copy = [...data];
    copy.sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return direction === 'asc' ? av - bv : bv - av;
      }
      const cmp = String(av).localeCompare(String(bv), undefined, {
        numeric: true,
      });
      return direction === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [data, sortKey, direction, accessors]);

  return { sorted, sortKey, direction, toggleSort };
}
