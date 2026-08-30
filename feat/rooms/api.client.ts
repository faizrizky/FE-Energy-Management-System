import { api } from '@/lib/axios';
import type { RoomDTO, RoomDetailDTO, RoomDeviceLogEntryDTO } from './dto';
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
  getById: (roomId: string) =>
    api.get<RoomDetailDTO>(`/rooms/${roomId}`).then((res) => res.data),

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
};
