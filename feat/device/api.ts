import { http } from '@/lib/http';
import type { DeviceDTO, DeviceListResponseDTO } from './dto';

export interface DeviceListParams {
  page?: number;
  rowsPerPage?: number;
  search?: string;
}

export const devicesApi = {
  /**
   * GET /devices dari server (tanpa cache) buat data awal halaman.
   *
   * Dipake di: device/page.tsx, schedule/page.tsx.
   */
  list: ({ page = 1, rowsPerPage = 10, search }: DeviceListParams = {}) => {
    const query = new URLSearchParams({
      page: String(page),
      rowsPerPage: String(rowsPerPage),
      ...(search ? { search } : {}),
    });
    return http<DeviceListResponseDTO>(`/devices?${query.toString()}`, {
      cache: 'no-store',
    });
  },

  /**
   * GET /devices/:id dari server (tanpa cache).
   *
   * Dipake di: Belom dipake.
   */
  getById: (id: string) =>
    http<DeviceDTO>(`/devices/${id}`, { cache: 'no-store' }),
};
