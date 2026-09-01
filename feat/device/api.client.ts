import { api } from '@/lib/axios';
import type { DeviceDTO, DeviceListResponseDTO } from './dto';
import type { DeviceFormValues } from './schema';

export interface DeviceListParams {
  page?: number;
  rowsPerPage?: number;
  search?: string;
}

export const devicesClientApi = {
  list: ({ page = 1, rowsPerPage = 10, search }: DeviceListParams = {}) =>
    api
      .get<DeviceListResponseDTO>('/devices', {
        params: { page, rowsPerPage, search: search || undefined },
      })
      .then((res) => res.data),
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
