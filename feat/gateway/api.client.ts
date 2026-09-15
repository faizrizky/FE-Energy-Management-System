import { api } from '@/lib/axios';
import type {
  GatewayDTO,
  GatewayDetailDTO,
  GatewayListResponseDTO,
} from './dto';
import type { GatewayFormValues } from './schema';

export interface GatewayListParams {
  page?: number;
  rowsPerPage?: number;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
}

export const gatewaysClientApi = {
  /**
   * GET /gateways dari browser dengan paginasi, search, & filter tanggal.
   *
   * Dipake di: gateway/client.tsx.
   */
  list: ({
    page = 1,
    rowsPerPage = 10,
    search,
    createdFrom,
    createdTo,
  }: GatewayListParams = {}) =>
    api
      .get<GatewayListResponseDTO>('/gateways', {
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
   * GET /gateways/:id dari browser.
   *
   * Dipake di: gateway/client.tsx (modal detail).
   */
  getById: (id: string) =>
    api.get<GatewayDetailDTO>(`/gateways/${id}`).then((res) => res.data),

  /**
   * POST /gateways.
   *
   * Dipake di: gateway/_partials/modal.tsx.
   */
  create: (payload: GatewayFormValues) =>
    api.post<GatewayDTO>('/gateways', payload).then((res) => res.data),

  /**
   * PUT /gateways/:id.
   *
   * Dipake di: gateway/_partials/modal.tsx.
   */
  update: (id: string, payload: GatewayFormValues) =>
    api.put<GatewayDTO>(`/gateways/${id}`, payload).then((res) => res.data),

  /**
   * DELETE /gateways/:id.
   *
   * Dipake di: gateway/client.tsx.
   */
  remove: (id: string) => api.delete(`/gateways/${id}`).then(() => undefined),
};
