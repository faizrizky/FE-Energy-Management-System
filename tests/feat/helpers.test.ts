import { describe, expect, test } from 'vitest';
import {
  dayName,
  formatScheduleDate,
  formatScheduleDateTime,
  formatTimeRange,
  toDateInputValue,
} from '@/feat/schedule/time';
import { moduleLabel, permissionLabel } from '@/feat/role/permissionLabels';

describe('feat/schedule/time', () => {
  test('[positive] toDateInputValue mengambil YYYY-MM-DD dari ISO', () => {
    expect(toDateInputValue('2026-09-20T00:00:00.000Z')).toBe('2026-09-20');
  });

  test('[negative] toDateInputValue string pendek dikembalikan apa adanya', () => {
    expect(toDateInputValue('2026')).toBe('2026');
  });

  test('[positive] formatScheduleDate memakai UTC (tidak bergeser hari)', () => {
    expect(formatScheduleDate('2026-09-20T00:00:00.000Z')).toBe('Sep 20, 2026');
  });

  test('[negative] formatScheduleDate tanggal tidak valid -> "-"', () => {
    expect(formatScheduleDate('bukan tanggal')).toBe('-');
  });

  test('[positive] formatScheduleDateTime', () => {
    expect(formatScheduleDateTime('2026-09-20T13:05:00.000Z')).toBe('Sep 20, 2026, 01:05 PM');
  });

  test.fails('[BUG] formatScheduleDateTime tanggal tidak valid seharusnya "-" (sekarang melempar RangeError)', () => {
    expect(formatScheduleDateTime('bukan tanggal')).toBe('-');
  });

  test('[positive] dayName 0..6', () => {
    expect(dayName(0)).toBe('Sunday');
    expect(dayName(6)).toBe('Saturday');
  });

  test('[negative] dayName di luar 0..6 -> "-"', () => {
    expect(dayName(7)).toBe('-');
    expect(dayName(-1)).toBe('-');
  });

  test('[positive/negative] formatTimeRange dengan & tanpa endTime', () => {
    expect(formatTimeRange('08:00', '17:00')).toBe('08:00 - 17:00');
    expect(formatTimeRange('08:00', null)).toBe('08:00');
    expect(formatTimeRange('08:00', '')).toBe('08:00');
  });
});

describe('feat/role/permissionLabels', () => {
  test('[positive] module & action yang dikenal', () => {
    expect(moduleLabel('device')).toBe('Device');
    expect(permissionLabel('device', 'power_control')).toBe('Power on/off device');
    expect(permissionLabel('report', 'export')).toBe('Export report');
  });

  test('[positive] action "list" tidak ditambah nama module', () => {
    expect(permissionLabel('report', 'list')).toBe('List report');
  });

  test('[negative] module/action tidak dikenal -> fallback kapitalisasi & underscore jadi spasi', () => {
    expect(moduleLabel('energy')).toBe('Energy');
    expect(permissionLabel('energy', 'bulk_import')).toBe('bulk import energy');
  });
});
