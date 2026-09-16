import { api } from '@/lib/axios';
import type {
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
  /**
   * GET /devices dari browser dengan paginasi, search (kosong dibuang), &
   * filter tanggal.
   *
   * Dipake di: device/client.tsx.
   */
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

  /**
   * GET /devices/:id dari browser.
   *
   * Dipake di: device/client.tsx (modal detail).
   */
  getById: (id: string) =>
    api.get<DeviceDetailDTO>(`/devices/${id}`).then((res) => res.data),

  /**
   * POST /devices; devEUI kosong dikirim null.
   *
   * Dipake di: device/_partials/modal.tsx.
   */
  create: (payload: DeviceFormValues) =>
    api.post<DeviceDTO>('/devices', payload).then((res) => res.data),

  /**
   * PUT /devices/:id.
   *
   * Dipake di: device/_partials/modal.tsx.
   */
  update: (id: string, payload: DeviceFormValues) =>
    api.put<DeviceDTO>(`/devices/${id}`, payload).then((res) => res.data),

  /**
   * DELETE /devices/:id.
   *
   * Dipake di: device/client.tsx, rooms/detail/[roomId]/client.tsx.
   */
  remove: (id: string) => api.delete(`/devices/${id}`).then(() => undefined),

  /**
   * POST /devices/:id/power buat ON/OFF. Balikannya status pending; hasil
   * akhirnya nyusul lewat socket device:command.
   *
   * Dipake di: device/client.tsx, rooms/detail/[roomId]/client.tsx.
   */
  setPower: (id: string, isPowerOn: boolean) =>
    api
      .post<DeviceCommandEventDTO>(`/devices/${id}/power`, {
        action: isPowerOn ? 'on' : 'off',
      })
      .then((res) => res.data),

};
