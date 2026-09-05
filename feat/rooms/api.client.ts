import { api } from '@/lib/axios';
import type {
  RoomDTO,
  RoomDetailDTO,
  RoomDeviceLogEntryDTO,
  RoomDeviceListResponseDTO,
  RoomUsageSummaryDTO,
} from './dto';
import type { RoomFormValues } from './schema';

/**
 * CLIENT-ONLY. Pakai axios instance dari lib/axios.ts (baca token dari
 * document.cookie), jadi aman dipanggil dari "use client" component:
 * modal.tsx, client.tsx, device-log-modal.tsx, dst.
 *
 * Untuk fetch awal data di Server Component (page.tsx), pakai `roomsApi`
 * di ./api.ts — JANGAN import file ini dari sana (gak akan error, tapi
 * kehilangan manfaat SSR/cache lib/http.ts).
 */
export const roomsClientApi = {
  listDevices: (
    roomId: string,
    {
      page = 1,
      rowsPerPage = 10,
      search,
    }: { page?: number; rowsPerPage?: number; search?: string } = {}
  ) =>
    api
      .get<RoomDeviceListResponseDTO>(`/rooms/${roomId}/devices`, {
        params: { page, rowsPerPage, search: search || undefined },
      })
      .then((res) => res.data),

  getById: (
    roomId: string,
    params?: { page?: number; rowsPerPage?: number; search?: string }
  ) =>
    api
      .get<RoomDetailDTO>(`/rooms/${roomId}`, { params })
      .then((res) => res.data),

  create: (payload: RoomFormValues) =>
    api.post<RoomDTO>('/rooms', payload).then((res) => res.data),

  update: (roomId: string, payload: RoomFormValues) =>
    api.patch<RoomDTO>(`/rooms/${roomId}`, payload).then((res) => res.data),

  remove: (roomId: string) =>
    api.delete(`/rooms/${roomId}`).then(() => undefined),

  setPower: (roomId: string, isPowerOn: boolean) =>
    api
      .post<{
        results: {
          deviceId: string;
          status: string;
          notes: string | null;
        }[];
      }>(`/rooms/${roomId}/power`, {
        action: isPowerOn ? 'on' : 'off',
      })
      .then((res) => res.data),

  getDeviceLog: (roomId: string, deviceId: string) =>
    api
      .get<RoomDeviceLogEntryDTO[]>(`/rooms/${roomId}/devices/${deviceId}/logs`)
      .then((res) => res.data),

  getUsageSummary: (roomId: string) =>
    api
      .get<RoomUsageSummaryDTO>(`/rooms/${roomId}/usage-summary`)
      .then((res) => res.data),
};
