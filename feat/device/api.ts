import { http } from '@/lib/http';
import type { DeviceDTO, DeviceListResponseDTO } from './dto';

export interface DeviceListParams {
  page?: number;
  rowsPerPage?: number;
  search?: string;
}

export const devicesApi = {
  list: ({ page = 1, rowsPerPage = 10, search }: DeviceListParams = {}) => {
    const query = new URLSearchParams({
      page: String(page),
      rowsPerPage: String(rowsPerPage),
      ...(search ? { search } : {}),
    });
    return http<DeviceListResponseDTO>(`/devices?${query.toString()}`, {
      next: { revalidate: 15 },
    });
  },

  getById: (id: string) =>
    http<DeviceDTO>(`/devices/${id}`, { next: { revalidate: 15 } }),
};
