import { act, renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { useTableSort } from '@/lib/use-table-sort';

interface Row {
  name: string;
  usage: number | null;
  code: string;
}

const rows: Row[] = [
  { name: 'Charlie', usage: 5, code: 'R10' },
  { name: 'alpha', usage: null, code: 'R2' },
  { name: 'Bravo', usage: 20, code: 'R1' },
];

const accessors = {
  name: (r: Row) => r.name,
  usage: (r: Row) => r.usage,
  code: (r: Row) => r.code,
};

function setup(data = rows) {
  return renderHook(({ d }) => useTableSort(d, accessors), { initialProps: { d: data } });
}

describe('useTableSort', () => {
  test('[positive] tanpa sort -> urutan asli (referensi array sama)', () => {
    const { result } = setup();
    expect(result.current.sorted).toBe(rows);
    expect(result.current.sortKey).toBeNull();
  });

  test('[positive] klik kolom: asc -> desc -> kembali tanpa sort', () => {
    const { result } = setup();

    act(() => result.current.toggleSort('name'));
    expect(result.current.direction).toBe('asc');
    expect(result.current.sorted.map((r) => r.name)).toEqual(['alpha', 'Bravo', 'Charlie']);

    act(() => result.current.toggleSort('name'));
    expect(result.current.direction).toBe('desc');
    expect(result.current.sorted.map((r) => r.name)).toEqual(['Charlie', 'Bravo', 'alpha']);

    act(() => result.current.toggleSort('name'));
    expect(result.current.sortKey).toBeNull();
    expect(result.current.sorted).toBe(rows);
  });

  test('[positive] pindah kolom -> reset ke asc', () => {
    const { result } = setup();
    act(() => result.current.toggleSort('name'));
    act(() => result.current.toggleSort('name'));
    act(() => result.current.toggleSort('code'));
    expect(result.current).toMatchObject({ sortKey: 'code', direction: 'asc' });
  });

  test('[positive] string berisi angka diurutkan secara natural (R2 sebelum R10)', () => {
    const { result } = setup();
    act(() => result.current.toggleSort('code'));
    expect(result.current.sorted.map((r) => r.code)).toEqual(['R1', 'R2', 'R10']);
  });

  test('[negative] nilai null selalu di akhir, baik asc maupun desc', () => {
    const { result } = setup();
    act(() => result.current.toggleSort('usage'));
    expect(result.current.sorted.map((r) => r.usage)).toEqual([5, 20, null]);
    act(() => result.current.toggleSort('usage'));
    expect(result.current.sorted.map((r) => r.usage)).toEqual([20, 5, null]);
  });

  test('[negative] key tanpa accessor -> data tidak diurutkan', () => {
    const { result } = setup();
    act(() => result.current.toggleSort('tidak-ada'));
    expect(result.current.sorted).toBe(rows);
  });

  test('[negative] data asli tidak dimutasi & data baru ikut terurut', () => {
    const copy = [...rows];
    const { result, rerender } = setup();
    act(() => result.current.toggleSort('name'));
    expect(rows).toEqual(copy);

    rerender({ d: [...rows, { name: 'Aaron', usage: 1, code: 'R3' }] });
    expect(result.current.sorted[0].name).toBe('Aaron');
  });

  test('[negative] data kosong', () => {
    const { result } = setup([]);
    act(() => result.current.toggleSort('name'));
    expect(result.current.sorted).toEqual([]);
  });
});
