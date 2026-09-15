import { http } from '@/lib/http';
import type { GatewayListResponseDTO } from './dto';

export interface GatewayListParams {
  page?: number;
  rowsPerPage?: number;
  search?: string;
}

export const gatewaysApi = {
  /**
   * GET /gateways dari server (tanpa cache).
   *
   * Dipake di: gateway/page.tsx, device/page.tsx (dropdown gateway).
   */
  list: ({ page = 1, rowsPerPage = 10, search }: GatewayListParams = {}) => {
    const query = new URLSearchParams({
      page: String(page),
      rowsPerPage: String(rowsPerPage),
      ...(search ? { search } : {}),
    });
    return http<GatewayListResponseDTO>(`/gateways?${query.toString()}`, {
      cache: 'no-store',
    });
  },
};
