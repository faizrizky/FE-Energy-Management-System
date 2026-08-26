import { http } from '@/lib/http';
import type { DeviceDTO } from './dto';

export interface DeviceListParams {
  roomId?: string;
  gatewayId?: string;
}

export const devicesApi = {
  list: ({ roomId, gatewayId }: DeviceListParams = {}) => {
    const query = new URLSearchParams();
    if (roomId) query.set('roomId', roomId);
    if (gatewayId) query.set('gatewayId', gatewayId);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return http<DeviceDTO[]>(`/devices${suffix}`, { next: { revalidate: 15 } });
  },

  getById: (id: string) =>
    http<DeviceDTO>(`/devices/${id}`, { next: { revalidate: 15 } }),
};
