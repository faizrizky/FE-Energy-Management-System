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
  getSummary: () =>
    http<RoomSummaryDTO>('/rooms/stats', { next: { revalidate: 30 } }),

  listSummary: async (): Promise<RoomListItemDTO[]> => {
    const result = await http<RoomListResponseDTO>(
      '/rooms?page=1&rowsPerPage=1000',
      { next: { revalidate: 30 } }
    );
    return result.data;
  },

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
      next: { revalidate: 15 },
    });
  },

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
      next: { revalidate: 15 },
    });
  },

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
      { next: { revalidate: 15 } }
    );
  },
  getDevices: (roomId: string) =>
    http<RoomDeviceDTO[]>(`/rooms/${roomId}/devices`, {
      next: { revalidate: 15 },
    }),
};
