import { http } from '@/lib/http';
import type { GatewayListResponseDTO, GatewayDetailDTO } from './dto';

export interface GatewayListParams {
  page?: number;
  rowsPerPage?: number;
  search?: string;
}

export const gatewaysApi = {
  list: ({ page = 1, rowsPerPage = 10, search }: GatewayListParams = {}) => {
    const query = new URLSearchParams({
      page: String(page),
      rowsPerPage: String(rowsPerPage),
      ...(search ? { search } : {}),
    });
    return http<GatewayListResponseDTO>(`/gateways?${query.toString()}`, {
      next: { revalidate: 15 },
    });
  },

  getById: (id: string) =>
    http<GatewayDetailDTO>(`/gateways/${id}`, { next: { revalidate: 15 } }),
};
