import { http } from '@/lib/http';
import type { GatewayListResponseDTO, GatewayDetailDTO } from './dto';

/**
 * SERVER-ONLY. Uses next/headers via lib/http.ts — only import from
 * Server Components (page.tsx). For mutations from client components,
 * use `gatewaysClientApi` in ./api.client.ts instead.
 */
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
