import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/lib/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('@/lib/http', () => ({ http: vi.fn() }));

import { api } from '@/lib/axios';
import { http } from '@/lib/http';
import { devicesClientApi } from '@/feat/device/api.client';
import { devicesApi } from '@/feat/device/api';
import { roomsClientApi } from '@/feat/rooms/api.client';
import { roomsApi } from '@/feat/rooms/api';
import { usersClientApi } from '@/feat/user/api.client';
import { rolesClientApi } from '@/feat/role/api.client';
import { gatewaysClientApi } from '@/feat/gateway/api.client';
import { scheduleClientApi } from '@/feat/schedule/api.client';
import { reportClientApi } from '@/feat/report/api.client';
import { dashboardApi } from '@/feat/dashboard/api';
import { rolesApi } from '@/feat/role/api';
import { usersApi } from '@/feat/user/api';
import { gatewaysApi } from '@/feat/gateway/api';
import { scheduleApi } from '@/feat/schedule/api';
import { reportApi } from '@/feat/report/api';

type MockFn = ReturnType<typeof vi.fn>;
const mocked = api as unknown as Record<'get' | 'post' | 'put' | 'patch' | 'delete', MockFn>;

beforeEach(() => {
  for (const fn of Object.values(mocked)) {
    (fn as ReturnType<typeof vi.fn>).mockReset().mockResolvedValue({ data: 'RESULT' });
  }
  vi.mocked(http).mockReset().mockResolvedValue('HTTP');
});

describe('devicesClientApi', () => {
  test('[positive] list: search kosong dibuang, data dibuka', async () => {
    await expect(devicesClientApi.list({ page: 2, search: '' })).resolves.toBe('RESULT');
    expect(mocked.get).toHaveBeenCalledWith('/devices', {
      params: { page: 2, rowsPerPage: 10, search: undefined, createdFrom: undefined, createdTo: undefined },
    });
  });

  test('[positive/negative] create & update: tbDeviceId kosong dikirim null', async () => {
    const values = { name: 'AC', eui: 'E1', deviceType: 'AC', roomId: 'r', gatewayId: 'g', tbDeviceId: '', intervalMinutes: 60 };
    await devicesClientApi.create(values);
    expect(mocked.post).toHaveBeenCalledWith('/devices', { ...values, tbDeviceId: null });
    await devicesClientApi.update('d1', { ...values, tbDeviceId: '08000000410000e4' });
    expect(mocked.put).toHaveBeenCalledWith('/devices/d1', { ...values, tbDeviceId: '08000000410000e4' });
  });

  test('[positive] setPower on/off, cancelPower, getById, remove', async () => {
    await devicesClientApi.setPower('d1', true);
    expect(mocked.post).toHaveBeenLastCalledWith('/devices/d1/power', { action: 'on' });
    await devicesClientApi.setPower('d1', false);
    expect(mocked.post).toHaveBeenLastCalledWith('/devices/d1/power', { action: 'off' });
    await devicesClientApi.cancelPower('d1');
    expect(mocked.post).toHaveBeenLastCalledWith('/devices/d1/power/cancel');
    await devicesClientApi.getById('d1');
    expect(mocked.get).toHaveBeenLastCalledWith('/devices/d1');
    await expect(devicesClientApi.remove('d1')).resolves.toBeUndefined();
    expect(mocked.delete).toHaveBeenCalledWith('/devices/d1');
  });

  test('[negative] error dari api diteruskan', async () => {
    mocked.post.mockRejectedValueOnce(new Error('429'));
    await expect(devicesClientApi.setPower('d1', true)).rejects.toThrow('429');
  });
});

describe('roomsClientApi', () => {
  test('[positive] listDevices, getById, create, update (PATCH), remove, power, logs, usage', async () => {
    await roomsClientApi.listDevices('r1', { page: 3, search: 'AC', createdFrom: '2026-09-01' });
    expect(mocked.get).toHaveBeenLastCalledWith('/rooms/r1/devices', {
      params: { page: 3, rowsPerPage: 10, search: 'AC', createdFrom: '2026-09-01', createdTo: undefined },
    });
    await roomsClientApi.getById('r1', { page: 1 });
    expect(mocked.get).toHaveBeenLastCalledWith('/rooms/r1', { params: { page: 1 } });
    const room = { name: 'R', picName: 'P', picPhone: '1', location: 'L', isCritical: false };
    await roomsClientApi.create(room);
    expect(mocked.post).toHaveBeenLastCalledWith('/rooms', room);
    await roomsClientApi.update('r1', room);
    expect(mocked.patch).toHaveBeenLastCalledWith('/rooms/r1', room);
    await roomsClientApi.remove('r1');
    expect(mocked.delete).toHaveBeenLastCalledWith('/rooms/r1');
    await roomsClientApi.setPower('r1', false);
    expect(mocked.post).toHaveBeenLastCalledWith('/rooms/r1/power', { action: 'off' });
    await roomsClientApi.getDeviceLog('r1', 'd1');
    expect(mocked.get).toHaveBeenLastCalledWith('/rooms/r1/devices/d1/logs');
    await roomsClientApi.getUsageSummary('r1');
    expect(mocked.get).toHaveBeenLastCalledWith('/rooms/r1/usage-summary');
  });

  test('[positive] list memanggil /rooms dengan paginasi & filter tanggal', async () => {
    await expect(
      roomsClientApi.list({ page: 2, rowsPerPage: 20, search: 'srv', createdFrom: '2026-09-01', createdTo: '2026-09-30' })
    ).resolves.toBe('RESULT');
    expect(mocked.get).toHaveBeenCalledWith('/rooms', {
      params: { page: 2, rowsPerPage: 20, search: 'srv', createdFrom: '2026-09-01', createdTo: '2026-09-30' },
    });
  });

  test('[negative] list tanpa parameter -> default halaman 1, search kosong dibuang', async () => {
    await roomsClientApi.list({ search: '' });
    expect(mocked.get).toHaveBeenCalledWith('/rooms', {
      params: { page: 1, rowsPerPage: 10, search: undefined, createdFrom: undefined, createdTo: undefined },
    });
  });
});

describe('user/role/gateway client api', () => {
  test('[positive/negative] user: password kosong tidak dikirim, diisi dikirim', async () => {
    const values = { fullName: 'B', username: 'budi', email: 'b@t.com', roleId: 'r', password: '' };
    await usersClientApi.create(values);
    expect(mocked.post).toHaveBeenLastCalledWith('/users', { ...values, password: undefined });
    await usersClientApi.update('u1', { ...values, password: 'rahasia' });
    expect(mocked.put).toHaveBeenLastCalledWith('/users/u1', { ...values, password: 'rahasia' });
    await usersClientApi.list({ roleId: 'r', search: '' });
    expect(mocked.get).toHaveBeenLastCalledWith('/users', expect.objectContaining({ params: expect.objectContaining({ roleId: 'r', search: undefined }) }));
    await usersClientApi.remove('u1');
    expect(mocked.delete).toHaveBeenLastCalledWith('/users/u1');
  });

  test('[positive] role & gateway CRUD', async () => {
    const role = { name: 'Op', description: '', permissionIds: ['p1'] };
    await rolesClientApi.list({ search: 'op' });
    expect(mocked.get).toHaveBeenLastCalledWith('/roles', { params: { page: 1, rowsPerPage: 10, search: 'op' } });
    await rolesClientApi.create(role);
    await rolesClientApi.update('r1', role);
    await rolesClientApi.remove('r1');
    expect(mocked.put).toHaveBeenLastCalledWith('/roles/r1', role);

    const gw = { name: 'G', eui: 'E', simcard: 's', installationDate: '2026-09-01', powerSource: 'PLN', modelUnit: 'M', installedById: 'u', description: '' };
    await gatewaysClientApi.list();
    await gatewaysClientApi.getById('g1');
    await gatewaysClientApi.create(gw);
    await gatewaysClientApi.update('g1', gw);
    await gatewaysClientApi.remove('g1');
    expect(mocked.get).toHaveBeenCalledWith('/gateways/g1');
    expect(mocked.delete).toHaveBeenLastCalledWith('/gateways/g1');
  });
});

describe('scheduleClientApi', () => {
  const base = {
    roomId: 'r1',
    deviceId: '',
    action: 'on' as const,
    scheduledDate: '2026-09-20',
    startTime: '08:00',
    endTime: '',
    repeatType: 'daily' as const,
    repeatDays: [1, 2],
  };

  test('[positive] field kosong jadi null & repeatDays dikosongkan bila bukan weekly', async () => {
    await scheduleClientApi.create(base);
    expect(mocked.post).toHaveBeenCalledWith('/schedules', { ...base, deviceId: null, endTime: null, repeatDays: [] });
  });

  test('[positive] weekly mempertahankan repeatDays; update memakai PUT', async () => {
    await scheduleClientApi.update('s1', { ...base, repeatType: 'weekly', deviceId: 'd1', endTime: '17:00' });
    expect(mocked.put).toHaveBeenCalledWith('/schedules/s1', expect.objectContaining({ deviceId: 'd1', endTime: '17:00', repeatDays: [1, 2] }));
  });

  test('[positive] list status & getById & remove', async () => {
    await scheduleClientApi.list({ status: 'upcoming', search: '' });
    expect(mocked.get).toHaveBeenCalledWith('/schedules', expect.objectContaining({ params: expect.objectContaining({ status: 'upcoming', search: undefined }) }));
    await scheduleClientApi.getById('s1');
    await scheduleClientApi.remove('s1');
    expect(mocked.delete).toHaveBeenCalledWith('/schedules/s1');
  });
});

describe('reportClientApi', () => {
  test.each([
    ['csv', 'text/csv'],
    ['xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ['pdf', 'application/pdf'],
  ] as const)('[positive] export %s -> Blob dengan MIME %s', async (format, mime) => {
    mocked.get.mockResolvedValueOnce({ data: 'binary' });
    const blob = await reportClientApi.export({ from: '2026-09-01', to: '2026-09-02' }, format);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe(mime);
    expect(mocked.get).toHaveBeenCalledWith('/reports/export', {
      params: { from: '2026-09-01', to: '2026-09-02', roomId: undefined, deviceId: undefined, format },
      responseType: 'blob',
    });
  });

  test('[negative] export gagal -> error diteruskan', async () => {
    mocked.get.mockRejectedValueOnce(new Error('400'));
    await expect(reportClientApi.export({ from: 'x', to: 'y' }, 'csv')).rejects.toThrow('400');
  });

  test('[positive] getSummary', async () => {
    await reportClientApi.getSummary({ from: 'a', to: 'b', roomId: 'r' });
    expect(mocked.get).toHaveBeenCalledWith('/reports/summary', { params: { from: 'a', to: 'b', roomId: 'r', deviceId: undefined } });
  });
});

describe('server api (feat/*/api.ts) — kebijakan cache', () => {
  const noStore = { cache: 'no-store' };

  test('[positive] data yang bisa berubah lewat CRUD/power selalu no-store', async () => {
    await devicesApi.list({ page: 2, search: 'AC' });
    expect(http).toHaveBeenLastCalledWith('/devices?page=2&rowsPerPage=10&search=AC', noStore);

    await roomsApi.list({ createdFrom: '2026-09-01' });
    expect(http).toHaveBeenLastCalledWith('/rooms?page=1&rowsPerPage=10&createdFrom=2026-09-01', noStore);
    await roomsApi.getById('r1');
    expect(http).toHaveBeenLastCalledWith('/rooms/r1?page=1&rowsPerPage=10', noStore);
    await roomsApi.listDevices('r1', { page: 1, rowsPerPage: 10 });
    expect(http).toHaveBeenLastCalledWith('/rooms/r1/devices?page=1&rowsPerPage=10', noStore);
    await roomsApi.getSummary();
    expect(http).toHaveBeenLastCalledWith('/rooms/stats', noStore);

    await dashboardApi.getSummary();
    expect(http).toHaveBeenLastCalledWith('/dashboard/summary', noStore);
    await dashboardApi.getTopRiskyRooms('last_week');
    expect(http).toHaveBeenLastCalledWith('/dashboard/top-risky-rooms?range=last_week', noStore);

    const calls = vi.mocked(http).mock.calls;
    expect(calls.every(([, opts]) => (opts as { cache?: string }).cache === 'no-store')).toBe(true);
  });

  test('[positive] modul lain juga tanpa revalidate, kecuali katalog permission', async () => {
    const modules = [rolesApi, usersApi, gatewaysApi, scheduleApi, reportApi] as Record<string, (...args: unknown[]) => unknown>[];
    for (const mod of modules) {
      for (const [name, fn] of Object.entries(mod)) {
        vi.mocked(http).mockClear();
        vi.mocked(http).mockResolvedValue({ data: [] });
        await fn({ page: 1 } as never, {} as never);
        for (const [path, opts] of vi.mocked(http).mock.calls) {
          if (String(path).startsWith('/roles/permissions')) {
            expect(opts).toEqual({ next: { revalidate: 300 } });
          } else {
            expect({ name, path, opts }).toEqual({ name, path, opts: noStore });
          }
        }
      }
    }
  });
});
