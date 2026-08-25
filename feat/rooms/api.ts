import { http } from "@/lib/http";
import type {
  RoomListResponseDTO,
  RoomSummaryDTO,
  RoomDetailDTO,
  RoomDeviceDTO,
} from "./dto";

export interface RoomListParams {
  page?: number;
  rowsPerPage?: number;
  search?: string;
  roleFilter?: string;
}

export const roomsApi = {
    getSummary: () => http<RoomSummaryDTO>("/rooms/stats", { next: { revalidate: 30 } }),

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
};