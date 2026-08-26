import { api } from '@/lib/axios';
import type { GatewayDTO } from './dto';
import type { GatewayFormValues } from './schema';

/**
 * CLIENT-ONLY. Uses axios instance from lib/axios.ts. Import only from
 * "use client" components (modal.tsx, client.tsx).
 */
export const gatewaysClientApi = {
  create: (payload: GatewayFormValues) =>
    api
      .post<{ data: GatewayDTO }>('/gateways', payload)
      .then((res) => res.data.data),

  update: (id: string, payload: GatewayFormValues) =>
    api
      .put<{ data: GatewayDTO }>(`/gateways/${id}`, payload)
      .then((res) => res.data.data),

  remove: (id: string) => api.delete(`/gateways/${id}`).then(() => undefined),
};
