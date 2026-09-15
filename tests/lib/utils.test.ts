import { describe, expect, test } from 'vitest';
import { cn, formatDate, formatKwh, formatNumber } from '@/lib/utils';

describe('cn', () => {
  test('[positive] menggabungkan class & menyelesaikan konflik tailwind', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  test('[negative] nilai falsy diabaikan', () => {
    expect(cn('a', false, null, undefined, '', { b: true, c: false })).toBe('a b');
  });
});

describe('formatKwh', () => {
  test('[positive] default 1 desimal dengan pemisah ribuan', () => {
    expect(formatKwh(12345.678)).toBe('12,345.7 kWh');
  });

  test('[positive] jumlah desimal custom (0)', () => {
    expect(formatKwh(205.912, 0)).toBe('206 kWh');
  });

  test('[negative] nol & negatif tetap terformat', () => {
    expect(formatKwh(0)).toBe('0.0 kWh');
    expect(formatKwh(-1.25, 2)).toBe('-1.25 kWh');
  });
});

describe('formatNumber', () => {
  test('[positive] pemisah ribuan en-US', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  test('[negative] nol', () => {
    expect(formatNumber(0)).toBe('0');
  });
});

describe('formatDate', () => {
  test('[positive] string ISO & Date object', () => {
    expect(formatDate('2026-09-14T12:00:00Z')).toBe('September 14, 2026');
    expect(formatDate(new Date(2026, 0, 2, 12))).toBe('January 2, 2026');
  });

  test('[negative] tanggal tidak valid -> "Invalid Date" (tidak crash)', () => {
    expect(formatDate('bukan-tanggal')).toBe('Invalid Date');
  });
});
