import { http } from '@/lib/http';
import type {
  RoomListResponseDTO,
  RoomSummaryDTO,
  RoomDetailDTO,
  RoomDeviceDTO,
  RoomListItemDTO,
  RoomDeviceListResponseDTO,
} from './dto';

export interface RoomListParams {
  page?: number;
  rowsPerPage?: number;
  search?: string;
  roleFilter?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface RoomDetailParams {
  page?: number;
  rowsPerPage?: number;
  search?: string;
}

export const roomsApi = {
  /**
   * GET /rooms/stats dari server (tanpa cache).
   *
   * Dipake di: rooms/page.tsx.
   */
  getSummary: () => http<RoomSummaryDTO>('/rooms/stats', { cache: 'no-store' }),

  /**
   * Ngambil sampe 1000 room sekaligus dari server buat dropdown, langsung
   * balikin array-nya.
   *
   * Dipake di: schedule/page.tsx.
   */
  listSummary: async (): Promise<RoomListItemDTO[]> => {
    const result = await http<RoomListResponseDTO>(
      '/rooms?page=1&rowsPerPage=1000',
      { cache: 'no-store' }
    );
    return result.data;
  },

  /**
   * GET /rooms dari server (tanpa cache) dengan paginasi, search, & filter
   * tanggal.
   *
   * Dipake di: rooms/page.tsx, device/page.tsx.
   */
  list: ({
    page = 1,
    rowsPerPage = 10,
    search,
    createdFrom,
    createdTo,
    roleFilter,
  }: RoomListParams = {}) => {
    const query = new URLSearchParams({
      page: String(page),
      rowsPerPage: String(rowsPerPage),
      ...(search ? { search } : {}),
      ...(createdFrom ? { createdFrom } : {}),
      ...(createdTo ? { createdTo } : {}),
      ...(roleFilter ? { roleFilter } : {}),
    });
    return http<RoomListResponseDTO>(`/rooms?${query.toString()}`, {
      cache: 'no-store',
    });
  },

  /**
   * GET /rooms/:id dari server (tanpa cache).
   *
   * Dipake di: rooms/detail/[roomId]/page.tsx.
   */
  getById: (
    roomId: string,
    { page = 1, rowsPerPage = 10, search }: RoomDetailParams = {}
  ) => {
    const query = new URLSearchParams({
      page: String(page),
      rowsPerPage: String(rowsPerPage),
      ...(search ? { search } : {}),
    });
    return http<RoomDetailDTO>(`/rooms/${roomId}?${query.toString()}`, {
      cache: 'no-store',
    });
  },

  /**
   * GET /rooms/:id/devices dari server (tanpa cache).
   *
   * Dipake di: rooms/detail/[roomId]/page.tsx.
   */
  listDevices: (roomId: string, params: RoomListParams = {}) => {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      rowsPerPage: String(params.rowsPerPage ?? 10),
      ...(params.search ? { search: params.search } : {}),
      ...(params.createdFrom ? { createdFrom: params.createdFrom } : {}),
      ...(params.createdTo ? { createdTo: params.createdTo } : {}),
    });
    return http<RoomDeviceListResponseDTO>(
      `/rooms/${roomId}/devices?${query.toString()}`,
      { cache: 'no-store' }
    );
  },

  /**
   * GET /rooms/:id/devices tanpa paginasi dari server.
   *
   * Dipake di: Belom dipake.
   */
  getDevices: (roomId: string) =>
    http<RoomDeviceDTO[]>(`/rooms/${roomId}/devices`, {
      cache: 'no-store',
    }),
};
