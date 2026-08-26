import { api } from '@/lib/axios';
import type { GatewayDTO } from './dto';
import type { GatewayFormValues } from './schema';

/**
 * CLIENT-ONLY. Uses axios instance from lib/axios.ts. Import only from
 * "use client" components (modal.tsx, client.tsx).
 *
 * NOTE: lib/axios.ts response interceptor sudah unwrap `res.data.data` jadi
 * `res.data` secara otomatis untuk setiap response ber-shape { data: ... }.
 * Jangan unwrap dua kali di sini (`res.data.data`) — itu bikin `saved`
 * jadi undefined.
 */
export const gatewaysClientApi = {
  create: (payload: GatewayFormValues) =>
    api.post<GatewayDTO>('/gateways', payload).then((res) => res.data),

  update: (id: string, payload: GatewayFormValues) =>
    api.put<GatewayDTO>(`/gateways/${id}`, payload).then((res) => res.data),

  remove: (id: string) => api.delete(`/gateways/${id}`).then(() => undefined),
};
