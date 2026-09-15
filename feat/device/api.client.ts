import { api } from '@/lib/axios';
import type {
  DeviceCancelPowerResultDTO,
  DeviceCommandEventDTO,
  DeviceDetailDTO,
  DeviceDTO,
  DeviceListResponseDTO,
} from './dto';
import type { DeviceFormValues } from './schema';

export interface DeviceListParams {
  page?: number;
  rowsPerPage?: number;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
}

export const devicesClientApi = {
  list: ({
    page = 1,
    rowsPerPage = 10,
    search,
    createdFrom,
    createdTo,
  }: DeviceListParams = {}) =>
    api
      .get<DeviceListResponseDTO>('/devices', {
        params: {
          page,
          rowsPerPage,
          search: search || undefined,
          createdFrom,
          createdTo,
        },
      })
      .then((res) => res.data),

  getById: (id: string) =>
    api.get<DeviceDetailDTO>(`/devices/${id}`).then((res) => res.data),

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

  /** Membalas status `pending`; hasil akhir datang lewat socket `device:command`. */
  setPower: (id: string, isPowerOn: boolean) =>
    api
      .post<DeviceCommandEventDTO>(`/devices/${id}/power`, {
        action: isPowerOn ? 'on' : 'off',
      })
      .then((res) => res.data),

  cancelPower: (id: string) =>
    api
      .post<DeviceCancelPowerResultDTO>(`/devices/${id}/power/cancel`)
      .then((res) => res.data),
};
