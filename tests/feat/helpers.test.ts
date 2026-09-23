import { describe, expect, test } from 'vitest';
import {
  formatLongDate,
  formatScheduleDate,
  formatTimeRange,
} from '@/feat/schedule/time';
import { moduleLabel, permissionLabel } from '@/feat/role/permissionLabels';

describe('feat/schedule/time', () => {
  test('[positive] formatScheduleDate memakai UTC (tidak bergeser hari)', () => {
    expect(formatScheduleDate('2026-09-20T00:00:00.000Z')).toBe('Sep 20, 2026');
  });

  test('[negative] formatScheduleDate tanggal tidak valid -> "-"', () => {
    expect(formatScheduleDate('bukan tanggal')).toBe('-');
  });

  test('[positive] formatLongDate: bulan ditulis lengkap', () => {
    // siang UTC biar nggak geser hari di zona waktu mana pun
    expect(formatLongDate('2026-04-12T12:00:00.000Z')).toBe('April 12, 2026');
  });

  test('[negative] formatLongDate tanggal tidak valid -> "-", bukan throw', () => {
    expect(formatLongDate('bukan tanggal')).toBe('-');
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
