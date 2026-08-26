import { api } from '@/lib/axios';
import type { DeviceDTO } from './dto';
import type { DeviceFormValues } from './schema';

export const devicesClientApi = {
  create: (payload: DeviceFormValues) =>
    api
      .post<DeviceDTO>('/devices', {
        ...payload,
        tbDeviceId: payload.tbDeviceId || null,
      })
      .then((res) => res.data),

  update: (id: string, payload: DeviceFormValues) =>
    api
      .put<DeviceDTO>(`/devices/${id}`, {
        ...payload,
        tbDeviceId: payload.tbDeviceId || null,
      })
      .then((res) => res.data),

  remove: (id: string) => api.delete(`/devices/${id}`).then(() => undefined),

  setPower: (id: string, isPowerOn: boolean) =>
    api
      .post<{
        deviceId: string;
        action: string;
        status: string;
        notes: string | null;
      }>(`/devices/${id}/power`, {
        action: isPowerOn ? 'on' : 'off',
      })
      .then((res) => res.data),
};
