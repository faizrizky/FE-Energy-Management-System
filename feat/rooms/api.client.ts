import { api } from "@/lib/axios";
import type { RoomDetailDTO, RoomDeviceLogEntryDTO } from "./dto";
import type { RoomFormValues } from "./schema";

/**
 * CLIENT-ONLY. Pakai axios instance dari lib/axios.ts (baca token dari
 * document.cookie), jadi aman dipanggil dari "use client" component:
 * modal.tsx, client.tsx, device-log-drawer.tsx, dst.
 *
 * Untuk fetch awal data di Server Component (page.tsx), pakai `roomsApi`
 * di ./api.ts — JANGAN import file ini dari sana (gak akan error, tapi
 * kehilangan manfaat SSR/cache lib/http.ts).
 */
export const roomsClientApi = {
  create: (payload: RoomFormValues) =>
    api.post<{ data: RoomDetailDTO }>("/rooms", payload).then((res) => res.data.data),

  update: (roomId: string, payload: RoomFormValues) =>
    api.patch<{ data: RoomDetailDTO }>(`/rooms/${roomId}`, payload).then((res) => res.data.data),

  remove: (roomId: string) => api.delete(`/rooms/${roomId}`).then(() => undefined),

  setPower: (roomId: string, isPowerOn: boolean) =>
    api
      .post<{ data: { results: { deviceId: string; status: string; notes: string | null }[] } }>(
        `/rooms/${roomId}/power`,
        { action: isPowerOn ? "on" : "off" }
      )
      .then((res) => res.data.data),

  getDeviceLog: (roomId: string, deviceId: string) =>
    api
      .get<{ data: RoomDeviceLogEntryDTO[] }>(`/rooms/${roomId}/devices/${deviceId}/logs`)
      .then((res) => res.data.data),
};