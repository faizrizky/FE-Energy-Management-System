import { http } from '@/lib/http';
import type { GatewayDTO, GatewayDetailDTO } from './dto';

/**
 * SERVER-ONLY. Uses next/headers via lib/http.ts — only import from
 * Server Components (page.tsx). For mutations from client components,
 * use `gatewaysClientApi` in ./api.client.ts instead.
 *
 * NOTE: unlike /rooms, the backend's GET /gateways has no pagination,
 * search, or stats query params (see gateway.usecase.js#listGateways —
 * it's a plain findMany with no filter/skip/take). Pagination, search,
 * and the online/offline summary are therefore computed client-side in
 * GatewayClient from the full list returned here.
 */
export const gatewaysApi = {
  list: () => http<GatewayDTO[]>('/gateways', { next: { revalidate: 15 } }),
  getById: (id: string) =>
    http<GatewayDetailDTO>(`/gateways/${id}`, { next: { revalidate: 15 } }),
};
