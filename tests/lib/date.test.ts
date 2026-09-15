import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { parseApiDate, toApiDate } from '@/lib/date';

const originalTz = process.env.TZ;

beforeAll(() => {
  process.env.TZ = 'Asia/Jakarta';
});

afterAll(() => {
  process.env.TZ = originalTz;
});

describe('toApiDate', () => {
  test('[positive] tanggal lokal jadi YYYY-MM-DD', () => {
    expect(toApiDate(new Date(2026, 8, 15, 14, 30))).toBe('2026-09-15');
  });

  test('[positive] jam 00:00 WIB tetap tanggal yang dipilih (bukan mundur sehari kayak toISOString)', () => {
    const midnight = new Date(2026, 8, 15);
    expect(midnight.toISOString().slice(0, 10)).toBe('2026-09-14');
    expect(toApiDate(midnight)).toBe('2026-09-15');
  });

  test('[positive] bulan & tanggal satu digit dikasih nol di depan', () => {
    expect(toApiDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  test('[negative] undefined -> undefined', () => {
    expect(toApiDate(undefined)).toBeUndefined();
  });
});

describe('parseApiDate', () => {
  test('[positive] YYYY-MM-DD jadi Date jam 00:00 lokal', () => {
    const date = parseApiDate('2026-09-15');
    expect(date).toEqual(new Date(2026, 8, 15));
    expect(date?.getHours()).toBe(0);
  });

  test('[positive] bolak-balik sama toApiDate hasilnya sama', () => {
    expect(toApiDate(parseApiDate('2026-12-31'))).toBe('2026-12-31');
  });

  test('[negative] kosong/null/undefined -> undefined', () => {
    expect(parseApiDate('')).toBeUndefined();
    expect(parseApiDate(null)).toBeUndefined();
    expect(parseApiDate(undefined)).toBeUndefined();
  });

  test('[negative] format salah -> undefined', () => {
    expect(parseApiDate('15-09-2026')).toBeUndefined();
    expect(parseApiDate('2026-09-15T00:00:00Z')).toBeUndefined();
    expect(parseApiDate('bukan-tanggal')).toBeUndefined();
  });

  test('[negative] tanggal yang nggak ada -> undefined', () => {
    expect(parseApiDate('2026-02-31')).toBeUndefined();
    expect(parseApiDate('2026-13-01')).toBeUndefined();
  });
});
