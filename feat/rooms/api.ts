import { http } from "@/lib/http";
import type {
  RoomListResponseDTO,
  RoomSummaryDTO,
  RoomDetailDTO,
  RoomDeviceDTO,
} from "./dto";
import type { RoomFormValues } from "./schema";

export interface RoomListParams {
  page?: number;
  rowsPerPage?: number;
  search?: string;
  roleFilter?: string;
}

/** Server-side data access for Rooms (list, detail, device list, CRUD). */
export const roomsApi = {
  getSummary: () => http<RoomSummaryDTO>("/rooms/summary", { next: { revalidate: 30 } }),

  list: ({ page = 1, rowsPerPage = 10, search, roleFilter }: RoomListParams = {}) => {
    const query = new URLSearchParams({
      page: String(page),
      rowsPerPage: String(rowsPerPage),
      ...(search ? { search } : {}),
      ...(roleFilter ? { roleFilter } : {}),
    });
    return http<RoomListResponseDTO>(`/rooms?${query.toString()}`, { next: { revalidate: 15 } });
  },

  getById: (roomId: string) => http<RoomDetailDTO>(`/rooms/${roomId}`, { next: { revalidate: 15 } }),

  getDevices: (roomId: string) =>
    http<RoomDeviceDTO[]>(`/rooms/${roomId}/devices`, { next: { revalidate: 15 } }),

  create: (payload: RoomFormValues) => http<RoomDetailDTO>("/rooms", { method: "POST", body: payload }),

  update: (roomId: string, payload: RoomFormValues) =>
    http<RoomDetailDTO>(`/rooms/${roomId}`, { method: "PATCH", body: payload }),

  remove: (roomId: string) => http<void>(`/rooms/${roomId}`, { method: "DELETE" }),

  setPower: (roomId: string, isPowerOn: boolean) =>
    http<void>(`/rooms/${roomId}/power`, { method: "POST", body: { isPowerOn } }),
};
