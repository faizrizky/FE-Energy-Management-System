import { api } from '@/lib/axios';
import type {
  RoomDTO,
  RoomDetailDTO,
  RoomDeviceLogEntryDTO,
  RoomDeviceListResponseDTO,
  RoomPowerResultDTO,
  RoomUsageSummaryDTO,
} from './dto';
import type { RoomFormValues } from './schema';

export interface RoomListParams {
  roomId?: string;
  page?: number;
  rowsPerPage?: number;
  search?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
}

export interface RoomDeviceListParams {
  page?: number;
  rowsPerPage?: number;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
}

export const roomsClientApi = {
  /**
   * Harusnya list room, tapi yang dipanggil malah GET /rooms/:roomId/devices
   * dengan param scheduledFrom/To.
   *
   * Dipake di: Belom dipake (rooms/client.tsx manggil api.get('/rooms')
   *   langsung).
   */
  list: ({
    roomId,
    page = 1,
    rowsPerPage = 10,
    search,
    scheduledFrom,
    scheduledTo,
  }: RoomListParams = {}) =>
    api
      .get<RoomDeviceListResponseDTO>(`/rooms/${roomId}/devices`, {
        params: {
          page,
          rowsPerPage,
          search: search || undefined,
          scheduledFrom,
          scheduledTo,
        },
      })
      .then((res) => res.data),

  /**
   * GET /rooms/:id dari browser.
   *
   * Dipake di: rooms/client.tsx (buka modal edit).
   */
  getById: (
    roomId: string,
    params?: { page?: number; rowsPerPage?: number; search?: string }
  ) =>
    api
      .get<RoomDetailDTO>(`/rooms/${roomId}`, { params })
      .then((res) => res.data),

  /**
   * GET /rooms/:id/devices dari browser dengan paginasi, search, & filter
   * tanggal.
   *
   * Dipake di: rooms/detail/[roomId]/client.tsx.
   */
  listDevices: (
    roomId: string,
    {
      page = 1,
      rowsPerPage = 10,
      search,
      createdFrom,
      createdTo,
    }: RoomDeviceListParams = {}
  ) =>
    api
      .get<RoomDeviceListResponseDTO>(`/rooms/${roomId}/devices`, {
        params: {
          page,
          rowsPerPage,
          search: search || undefined,
          createdFrom,
          createdTo,
        },
      })
      .then((res) => res.data),

  /**
   * POST /rooms.
   *
   * Dipake di: rooms/_partials/modal.tsx.
   */
  create: (payload: RoomFormValues) =>
    api.post<RoomDTO>('/rooms', payload).then((res) => res.data),

  /**
   * PATCH /rooms/:id.
   *
   * Dipake di: rooms/_partials/modal.tsx.
   */
  update: (roomId: string, payload: RoomFormValues) =>
    api.patch<RoomDTO>(`/rooms/${roomId}`, payload).then((res) => res.data),

  /**
   * DELETE /rooms/:id.
   *
   * Dipake di: rooms/client.tsx.
   */
  remove: (roomId: string) =>
    api.delete(`/rooms/${roomId}`).then(() => undefined),

  /**
   * POST /rooms/:id/power buat ON/OFF semua device di room.
   *
   * Dipake di: rooms/client.tsx.
   */
  setPower: (roomId: string, isPowerOn: boolean) =>
    api
      .post<RoomPowerResultDTO>(`/rooms/${roomId}/power`, {
        action: isPowerOn ? 'on' : 'off',
      })
      .then((res) => res.data),

  /**
   * GET /rooms/:id/devices/:deviceId/logs.
   *
   * Dipake di: rooms/detail/[roomId]/client.tsx (modal log).
   */
  getDeviceLog: (roomId: string, deviceId: string) =>
    api
      .get<RoomDeviceLogEntryDTO[]>(`/rooms/${roomId}/devices/${deviceId}/logs`)
      .then((res) => res.data),

  /**
   * GET /rooms/:id/usage-summary.
   *
   * Dipake di: rooms/detail/[roomId]/client.tsx.
   */
  getUsageSummary: (roomId: string) =>
    api
      .get<RoomUsageSummaryDTO>(`/rooms/${roomId}/usage-summary`)
      .then((res) => res.data),
};
