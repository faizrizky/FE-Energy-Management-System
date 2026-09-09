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
}

export const gatewaysClientApi = {
  list: ({ page = 1, rowsPerPage = 10, search }: GatewayListParams = {}) =>
    api
      .get<GatewayListResponseDTO>('/gateways', {
        params: { page, rowsPerPage, search: search || undefined },
      })
      .then((res) => res.data),

  getById: (id: string) =>
    api.get<GatewayDetailDTO>(`/gateways/${id}`).then((res) => res.data),

  create: (payload: GatewayFormValues) =>
    api.post<GatewayDTO>('/gateways', payload).then((res) => res.data),

  update: (id: string, payload: GatewayFormValues) =>
    api.put<GatewayDTO>(`/gateways/${id}`, payload).then((res) => res.data),

  remove: (id: string) => api.delete(`/gateways/${id}`).then(() => undefined),
};
