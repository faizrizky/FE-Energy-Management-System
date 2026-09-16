import { describe, expect, test } from 'vitest';
import { loginFormSchema } from '@/feat/auth/schema';
import { deviceFormSchema } from '@/feat/device/schema';
import { gatewayFormSchema } from '@/feat/gateway/schema';
import { roleFormSchema } from '@/feat/role/schema';
import { roomFormSchema } from '@/feat/rooms/schema';
import { scheduleFormSchema } from '@/feat/schedule/schema';
import { userFormSchema } from '@/feat/user/schema';

type Schema = { safeParse: (v: unknown) => { success: boolean; data?: unknown; error?: { issues: { message: string; path: PropertyKey[] }[] } } };

const issues = (schema: Schema, value: unknown) => schema.safeParse(value).error?.issues.map((i) => i.message) ?? [];
const ok = (schema: Schema, value: unknown) => {
  const r = schema.safeParse(value);
  expect(r.success, JSON.stringify(r.error?.issues)).toBe(true);
  return r.data as Record<string, unknown>;
};

describe('loginFormSchema', () => {
  test('[positive] username/email & password terisi', () => ok(loginFormSchema, { username: 'admin', password: 'x' }));
  test('[negative] kosong', () => {
    expect(issues(loginFormSchema, { username: '', password: '' })).toEqual(['Username or email is required', 'Password is required']);
  });
});

describe('deviceFormSchema', () => {
  const valid = { name: 'AC', eui: '08000000410000e4', deviceType: 'AC', roomId: 'r1', gatewayId: 'g1', intervalMinutes: '60' };

  test('[positive] interval string di-coerce', () => {
    expect(ok(deviceFormSchema, valid).intervalMinutes).toBe(60);
  });

  test('[negative] field wajib kosong & interval < 60', () => {
    expect(issues(deviceFormSchema, { ...valid, name: '', eui: '', deviceType: '', roomId: '', gatewayId: '' })).toEqual([
      'Device name is required',
      'Device EUI must be a 16-character hex devEUI',
      'Component type is required',
      'Room is required',
      'Gateway is required',
    ]);
    expect(issues(deviceFormSchema, { ...valid, intervalMinutes: 30 })).toEqual(['Minimum interval is 60 minutes']);
  });

  // Dulu form nerima devEUI asal-asalan; sekarang eui wajib 16 hex.
  test('[negative] eui bukan devEUI 16 hex ditolak', () => {
    expect(deviceFormSchema.safeParse({ ...valid, eui: 'abc' }).success).toBe(false);
    expect(deviceFormSchema.safeParse({ ...valid, eui: 'DEV-001' }).success).toBe(false);
  });
});

describe('gatewayFormSchema', () => {
  const valid = { name: 'G', eui: 'E', simcard: '0812', installationDate: '2026-09-01', powerSource: 'PLN', modelUnit: 'M', installedById: 'u1', description: '' };
  test('[positive] lengkap', () => ok(gatewayFormSchema, valid));
  test('[negative] semua field wajib', () => {
    expect(issues(gatewayFormSchema, {})).toHaveLength(7);
    expect(issues(gatewayFormSchema, { ...valid, description: 'a'.repeat(501) })).toHaveLength(1);
  });
});

describe('roleFormSchema', () => {
  test('[positive] permissionIds default []', () => {
    expect(ok(roleFormSchema, { name: 'Op' }).permissionIds).toEqual([]);
  });
  test('[negative] nama kosong / terlalu panjang', () => {
    expect(issues(roleFormSchema, { name: '' })).toEqual(['Role name is required']);
    expect(issues(roleFormSchema, { name: 'a'.repeat(81) })).toHaveLength(1);
  });
});

describe('roomFormSchema', () => {
  const valid = { name: 'Server', picName: 'Budi', picPhone: '0812', location: 'Lt 1' };
  test('[positive] isCritical default false', () => {
    expect(ok(roomFormSchema, valid).isCritical).toBe(false);
  });
  test('[negative] PIC & lokasi wajib', () => {
    expect(issues(roomFormSchema, { name: 'x' })).toEqual(expect.arrayContaining([expect.any(String)]));
    expect(issues(roomFormSchema, { ...valid, picName: '' })).toEqual(['Building PIC is required']);
  });
});

describe('scheduleFormSchema', () => {
  const valid = { roomId: 'r1', deviceId: '', action: 'on', scheduledDate: '2026-09-20', startTime: '08:00', endTime: '17:00', repeatType: 'none' };

  test('[positive] one-time & weekly dengan hari', () => {
    expect(ok(scheduleFormSchema, valid).repeatDays).toEqual([]);
    ok(scheduleFormSchema, { ...valid, repeatType: 'weekly', repeatDays: [1, 5] });
    ok(scheduleFormSchema, { ...valid, endTime: '' });
  });

  test('[negative] weekly tanpa hari -> error di repeatDays', () => {
    const r = scheduleFormSchema.safeParse({ ...valid, repeatType: 'weekly', repeatDays: [] });
    expect(r.error?.issues).toEqual([expect.objectContaining({ path: ['repeatDays'], message: 'Select at least one day' })]);
  });

  test('[negative] endTime sama dengan startTime', () => {
    expect(issues(scheduleFormSchema, { ...valid, endTime: '08:00' })).toEqual(['End time cannot be the same as start time']);
  });

  test('[negative] format jam, action, repeatType tidak valid', () => {
    expect(issues(scheduleFormSchema, { ...valid, startTime: '8:00' })).toEqual(['Invalid start time']);
    expect(issues(scheduleFormSchema, { ...valid, endTime: '24:00' })).toEqual(['Invalid end time']);
    expect(issues(scheduleFormSchema, { ...valid, action: 'toggle' })).toEqual(['Action is required']);
    expect(scheduleFormSchema.safeParse({ ...valid, repeatType: 'monthly' }).success).toBe(false);
    expect(scheduleFormSchema.safeParse({ ...valid, repeatDays: [7] }).success).toBe(false);
  });
});

describe('userFormSchema', () => {
  const valid = { fullName: 'Budi', username: 'budi', email: 'b@test.com', roleId: 'r1' };
  test('[positive] password opsional (kosong atau ≥ 6)', () => {
    ok(userFormSchema, valid);
    ok(userFormSchema, { ...valid, password: '' });
    ok(userFormSchema, { ...valid, password: 'rahasia' });
  });
  test('[negative] username pendek, email salah, password < 6', () => {
    expect(issues(userFormSchema, { ...valid, username: 'bu' })).toEqual(['Username must be at least 3 characters']);
    expect(issues(userFormSchema, { ...valid, email: 'budi' })).toEqual(['Invalid email address']);
    expect(issues(userFormSchema, { ...valid, password: '123' })).toEqual(['Password must be at least 6 characters']);
  });

  // Backend hanya menerima [a-zA-Z0-9._-]; form menerima spasi -> gagal setelah submit.
  test.fails('[BUG] username dengan spasi seharusnya ditolak di form (selaras backend)', () => {
    expect(userFormSchema.safeParse({ ...valid, username: 'budi santoso' }).success).toBe(false);
  });
});
