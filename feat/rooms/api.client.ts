import { api } from '@/lib/axios';
import type {
  RoomDTO,
  RoomDetailDTO,
  RoomDeviceLogEntryDTO,
  RoomDeviceListResponseDTO,
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

  getById: (
    roomId: string,
    params?: { page?: number; rowsPerPage?: number; search?: string }
  ) =>
    api
      .get<RoomDetailDTO>(`/rooms/${roomId}`, { params })
      .then((res) => res.data),

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
